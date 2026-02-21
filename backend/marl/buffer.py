import torch
import numpy as np

class PriorityRolloutBuffer:
    def __init__(self, buffer_size: int, obs_dim: int, action_dim: int, gamma: float = 0.99, gae_lambda: float = 0.95):
        self.buffer_size = buffer_size
        self.obs_dim = obs_dim
        self.action_dim = action_dim
        self.gamma = gamma
        self.gae_lambda = gae_lambda
        
        self.observations = torch.zeros((buffer_size, obs_dim), dtype=torch.float32)
        self.actions = torch.zeros((buffer_size, action_dim), dtype=torch.float32)
        self.rewards = torch.zeros((buffer_size, 1), dtype=torch.float32)
        self.dones = torch.zeros((buffer_size, 1), dtype=torch.float32)
        self.log_probs = torch.zeros((buffer_size, 1), dtype=torch.float32)
        self.values = torch.zeros((buffer_size, 1), dtype=torch.float32)
        
        self.advantages = torch.zeros((buffer_size, 1), dtype=torch.float32)
        self.returns = torch.zeros((buffer_size, 1), dtype=torch.float32)
        
        # Priority weights based on TD-Error
        self.priorities = np.zeros((buffer_size,), dtype=np.float32)
        
        self.step = 0
        self.full = False

    def reset(self):
        self.step = 0
        self.full = False
        
    def add(self, obs: np.ndarray, action: np.ndarray, reward: float, done: bool, log_prob: float, value: float):
        if self.step >= self.buffer_size:
            # Drop old transitions if buffer overflows in an episode
            self.step = 0
            self.full = True
            
        self.observations[self.step] = torch.tensor(obs, dtype=torch.float32)
        self.actions[self.step] = torch.tensor(action, dtype=torch.float32)
        self.rewards[self.step] = torch.tensor(reward, dtype=torch.float32)
        self.dones[self.step] = torch.tensor(done, dtype=torch.float32)
        self.log_probs[self.step] = torch.tensor(log_prob, dtype=torch.float32)
        self.values[self.step] = torch.tensor(value, dtype=torch.float32)
        
        # Set initial max priority for new transitions to ensure they are sampled
        max_p = np.max(self.priorities) if self.step > 0 else 1.0
        self.priorities[self.step] = max_p
        
        self.step += 1

    def compute_gae(self, last_value: torch.Tensor, last_done: bool):
        """Generalized Advantage Estimation"""
        last_gae_lam = 0
        for step in reversed(range(self.step)):
            if step == self.step - 1:
                next_non_terminal = 1.0 - last_done
                next_values = last_value
            else:
                next_non_terminal = 1.0 - self.dones[step + 1].item()
                next_values = self.values[step + 1]
                
            delta = self.rewards[step] + self.gamma * next_values * next_non_terminal - self.values[step]
            last_gae_lam = delta + self.gamma * self.gae_lambda * next_non_terminal * last_gae_lam
            
            self.advantages[step] = last_gae_lam
            
        # Returns = Advantages + Values
        self.returns = self.advantages + self.values

    def update_priorities(self, indices: np.ndarray, td_errors: np.ndarray):
        for idx, td_error in zip(indices, td_errors):
            self.priorities[idx] = (np.abs(td_error) + 1e-6) ** 0.6  # proportional priority

    def get_generator(self, batch_size: int, device: torch.device):
        """Yields mini-batches based on priority weighting"""
        size = self.step
        indices = np.arange(size)
        
        # Prioritized Sampling probabilities
        probs = self.priorities[:size] / np.sum(self.priorities[:size])
        
        # We can shuffle if needed
        sampled_indices = np.random.choice(indices, size=size, p=probs, replace=True)
        
        for start in range(0, size, batch_size):
            end = start + batch_size
            batch_indices = sampled_indices[start:end]
            
            yield (
                self.observations[batch_indices].to(device),
                self.actions[batch_indices].to(device),
                self.values[batch_indices].to(device),
                self.log_probs[batch_indices].to(device),
                self.advantages[batch_indices].to(device),
                self.returns[batch_indices].to(device),
                batch_indices
            )
