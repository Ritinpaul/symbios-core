import torch
import numpy as np
import os
import time
from typing import Dict, List

from simulation.environment import IndustrialParkEnv
from marl.mappo import TransformerMAPPO
from marl.buffer import PriorityRolloutBuffer

class MARLTrainer:
    def __init__(self, 
                 env: IndustrialParkEnv,
                 model: TransformerMAPPO,
                 buffer_size: int = 2048,
                 batch_size: int = 64,
                 ppo_epochs: int = 10,
                 save_dir: str = "checkpoints"):
                 
        self.env = env
        self.model = model
        self.agents = env.agents
        
        self.buffer_size = buffer_size
        self.batch_size = batch_size
        self.ppo_epochs = ppo_epochs
        
        obs_dim = env.observation_space(self.agents[0]).shape[0]
        action_dim = env.action_space(self.agents[0]).shape[0]
        
        self.buffers = {
            a: PriorityRolloutBuffer(buffer_size, obs_dim, action_dim) for a in self.agents
        }
        
        self.save_dir = save_dir
        os.makedirs(save_dir, exist_ok=True)
        
    def collect_rollouts(self, target_steps: int):
        """Play episodes to fill the rollout buffers"""
        obs, _ = self.env.reset()
        steps = 0
        
        while steps < target_steps:
            actions_dict, log_probs_dict, values_dict = self.model.get_actions(obs)
            
            # Step environment
            next_obs, rewards, dones, truncs, infos = self.env.step(actions_dict)
            
            for agent in self.agents:
                if agent in obs: # skip agents that are done early
                    self.buffers[agent].add(
                        obs[agent], actions_dict[agent], rewards[agent], 
                        dones[agent], log_probs_dict[agent], values_dict[agent]
                    )
            
            obs = next_obs
            steps += 1
            
            # Reset if any terminal condition
            if any(dones.values()) or any(truncs.values()):
                # Calculate final values for GAE before reset
                _, _, final_values = self.model.get_actions(obs)
                for agent in self.agents:
                    self.buffers[agent].compute_gae(
                        last_value=torch.tensor(final_values.get(agent, 0.0), dtype=torch.float32),
                        last_done=True
                    )
                obs, _ = self.env.reset()
                
        # Handle truncation calculation if loop ends mid-episode
        if not any(dones.values()) and not any(truncs.values()):
            _, _, final_values = self.model.get_actions(obs)
            for agent in self.agents:
                self.buffers[agent].compute_gae(
                    last_value=torch.tensor(final_values.get(agent, 0.0), dtype=torch.float32),
                    last_done=False
                )

    def train(self, episodes_per_stage: List[int]):
        """
        Executes Curriculum Learning process
        Stage 1: Base interactions
        Stage 2: Full episodes
        Stage 3: Stochastic Disruptions Enabled
        """
        total_stages = len(episodes_per_stage)
        print(f"Starting Curriculum Training Process ({total_stages} Stages)")
        
        for stage, num_episodes in enumerate(episodes_per_stage):
            print(f"\n--- Stage {stage + 1}/{total_stages} [{num_episodes} Episodes] ---")
            
            # Curriculum logic mappings
            if stage == 0:
                self.env.disruption_prob = 0.0 # Clean learning phase
            elif stage == 1:
                self.env.disruption_prob = 0.05 # Mild complexity 
            else:
                self.env.disruption_prob = 0.15 # Full chaos testing
                
            for ep in range(1, num_episodes + 1):
                self.collect_rollouts(target_steps=self.buffer_size)
                self.model.update(self.buffers, self.batch_size, self.ppo_epochs)
                
                if ep % 50 == 0 or ep == num_episodes:
                    print(f"Stage {stage + 1} | Episode {ep} completed. Saving checkpoint...")
                    self.save_checkpoint(f"stage_{stage+1}_ep_{ep}.pt")

    def save_checkpoint(self, filename: str):
        path = os.path.join(self.save_dir, filename)
        state_dicts = {
            "actors": {a: self.model.actors[a].state_dict() for a in self.agents},
            "critic": self.model.critic.state_dict()
        }
        torch.save(state_dicts, path)
        print(f"Saved: {path}")

    def load_checkpoint(self, filename: str):
        path = os.path.join(self.save_dir, filename)
        if not os.path.exists(path):
            raise FileNotFoundError(f"Checkpoint {path} not found.")
            
        state_dicts = torch.load(path, map_location=self.model.device)
        self.model.critic.load_state_dict(state_dicts["critic"])
        for a in self.agents:
            self.model.actors[a].load_state_dict(state_dicts["actors"][a])
        print(f"Loaded: {path}")
