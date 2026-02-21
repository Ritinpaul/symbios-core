import torch
import torch.nn as nn
import torch.optim as optim
from typing import Dict, List
import numpy as np

from marl.networks import ActorNetwork, CriticNetwork
from marl.buffer import PriorityRolloutBuffer

class TransformerMAPPO:
    def __init__(self, 
                 agents: List[str], 
                 obs_dim: int, 
                 global_obs_dim: int, 
                 action_dim: int,
                 lr_actor: float = 3e-4,
                 lr_critic: float = 1e-3,
                 clip_epsilon: float = 0.2,
                 entropy_coef: float = 0.01,
                 entropy_decay: float = 0.999,
                 max_grad_norm: float = 0.5,
                 device: str = "cpu"):
        
        self.device = torch.device(device)
        self.agents = agents
        
        # MAPPO Framework: Decentralized Actors, Centralized Critic
        # Each agent has its own policy, but shares the global value function estimator
        self.actors = {
            a: ActorNetwork(obs_dim, action_dim).to(self.device) for a in agents
        }
        self.critic = CriticNetwork(global_obs_dim).to(self.device)
        
        self.actor_optimizers = {
            a: optim.Adam(self.actors[a].parameters(), lr=lr_actor) for a in agents
        }
        self.critic_optimizer = optim.Adam(self.critic.parameters(), lr=lr_critic)
        
        self.clip_epsilon = clip_epsilon
        self.entropy_coef = entropy_coef
        self.entropy_decay = entropy_decay
        self.max_grad_norm = max_grad_norm
        
    def get_actions(self, obs_dict: Dict[str, np.ndarray], deterministic: bool = False):
        """Used during interaction with the environment"""
        actions = {}
        log_probs = {}
        values = {}
        
        # Centralized State for Critic (Concatenated local observations)
        # Assuming standard MAPPO where global state is concatenation of local states
        global_obs = np.concatenate([obs_dict[a] for a in self.agents])
        global_obs_tensor = torch.tensor(global_obs, dtype=torch.float32).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            global_value = self.critic(global_obs_tensor).squeeze().item()
            
            for agent in self.agents:
                if agent not in obs_dict:
                    continue # Agent died/finished
                    
                obs_t = torch.tensor(obs_dict[agent], dtype=torch.float32).unsqueeze(0).to(self.device)
                mean, std = self.actors[agent](obs_t)
                
                dist = torch.distributions.Normal(mean, std)
                
                if deterministic:
                    action = mean
                else:
                    action = dist.sample()
                
                # Squeeze to get 1D vectors
                action = action.squeeze(0)
                
                actions[agent] = action.cpu().numpy()
                log_probs[agent] = dist.log_prob(action).sum(dim=-1).item()
                values[agent] = global_value # Store global value per agent for buffer tracking
                
        return actions, log_probs, values

    def update(self, buffers: Dict[str, PriorityRolloutBuffer], batch_size: int = 64, ppo_epochs: int = 10):
        """PPO Update phase using gathered rollout buffers"""
        
        self.entropy_coef = max(0.001, self.entropy_coef * self.entropy_decay)
        
        for agent in self.agents:
            if buffers[agent].step == 0:
                continue
                
            buffer = buffers[agent]
            actor = self.actors[agent]
            optimizer = self.actor_optimizers[agent]
            
            # PPO Epochs
            for _ in range(ppo_epochs):
                for (b_obs, b_actions, b_values, b_old_log_probs, b_advs, b_returns, batch_idx) in buffer.get_generator(batch_size, self.device):
                    
                    # Normalize advantages
                    b_advs = (b_advs - b_advs.mean()) / (b_advs.std() + 1e-8)
                    
                    # Evaluate Actions
                    mean, std = actor(b_obs)
                    dist = torch.distributions.Normal(mean, std)
                    log_probs = dist.log_prob(b_actions).sum(dim=-1, keepdim=True)
                    entropy = dist.entropy().mean()
                    
                    # Ratio
                    ratio = torch.exp(log_probs - b_old_log_probs)
                    
                    # Actor Loss (Clipped Surrogate Objective)
                    surr1 = ratio * b_advs
                    surr2 = torch.clamp(ratio, 1.0 - self.clip_epsilon, 1.0 + self.clip_epsilon) * b_advs
                    actor_loss = -torch.min(surr1, surr2).mean() - self.entropy_coef * entropy
                    
                    # Backprop Actor
                    optimizer.zero_grad()
                    actor_loss.backward()
                    nn.utils.clip_grad_norm_(actor.parameters(), self.max_grad_norm)
                    optimizer.step()
                    
                    # Centralized Critic Loss calculation happens separately since it uses all states
                    # (Simplified here to train per agent's return estimates for demo speed,
                    #  ideally trained jointly on global states).
                    global_obs_train_batch = b_obs.repeat(1, len(self.agents)) # Hack for single agent buffer shape mismatch
                    predicted_values = self.critic(global_obs_train_batch)
                    critic_loss = F.mse_loss(predicted_values, b_returns)
                    
                    self.critic_optimizer.zero_grad()
                    critic_loss.backward()
                    nn.utils.clip_grad_norm_(self.critic.parameters(), self.max_grad_norm)
                    self.critic_optimizer.step()
                    
                    # Priority TD Error Update (Absolute error between returned and predicted)
                    td_errors = torch.abs(b_returns - b_values).detach().cpu().numpy()
                    buffer.update_priorities(batch_idx, td_errors)
                    
            # Clear buffer after usage
            buffer.reset()
            
    def get_attention_weights(self, obs_dict: Dict[str, np.ndarray]):
        """For visualization in Dashboard"""
        weights = {}
        with torch.no_grad():
            for agent in self.agents:
                obs_t = torch.tensor(obs_dict[agent], dtype=torch.float32).unsqueeze(0).to(self.device)
                _ = self.actors[agent](obs_t)
                weights[agent] = self.actors[agent].get_attention()
        return weights
