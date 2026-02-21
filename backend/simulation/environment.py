import functools
import numpy as np
import random
from typing import Dict, Any, List

from pettingzoo import ParallelEnv
from gymnasium.spaces import Box

from simulation.factory_agent import FactoryAgent
from simulation.resource_types import ResourceType

class IndustrialParkEnv(ParallelEnv):
    metadata = {
        "name": "industrial_park_v1",
        "render_modes": ["ansi"]
    }

    def __init__(self, agents: List[FactoryAgent], max_steps: int = 30, disruption_prob: float = 0.1):
        super().__init__()
        
        self.factory_agents = {agent.agent_id: agent for agent in agents}
        self.possible_agents = [agent.agent_id for agent in agents]
        self.agents = self.possible_agents[:]
        self.disruption_prob = disruption_prob
        
        # Action Space: [bid_price_mod, ask_price_mod, accept_threshold, negotiation_partner_focus, contract_duration, quality_tier]
        # Normalized values mostly from -1 to 1 or 0 to 1
        obs_shape = 12
        action_shape = 6
        
        self._action_spaces = {
            agent: Box(low=-1.0, high=1.0, shape=(action_shape,), dtype=np.float32)
            for agent in self.possible_agents
        }
        
        self._observation_spaces = {
            agent: Box(low=-np.inf, high=np.inf, shape=(obs_shape,), dtype=np.float32) 
            for agent in self.possible_agents
        }
        
        self.max_steps = max_steps
        self.current_step = 0
        self.infos = {a: {} for a in self.possible_agents}

    @functools.lru_cache(maxsize=None)
    def observation_space(self, agent: str):
        return self._observation_spaces[agent]

    @functools.lru_cache(maxsize=None)
    def action_space(self, agent: str):
        return self._action_spaces[agent]

    def reset(self, seed: int = None, options: Dict = None):
        self.agents = self.possible_agents[:]
        self.current_step = 0
        
        if seed is not None:
            np.random.seed(seed)
            random.seed(seed)
            
        observations = {
            agent: self.factory_agents[agent].get_state_vector()
            for agent in self.agents
        }
        self.infos = {a: {"disrupted": False} for a in self.agents}
        
        return observations, self.infos

    def step(self, actions: Dict[str, np.ndarray]):
        self.current_step += 1
        
        rewards = {}
        flags_done = {}
        flags_trunc = {}
        observations = {}
        
        # Check for stochastic disruptions
        disrupted_agents = []
        if random.random() < self.disruption_prob:
            # Pick a random agent to suffer a supply shock / equipment failure
            unlucky_agent = random.choice(self.agents)
            disrupted_agents.append(unlucky_agent)
            
        # Phase 1: Production (Physics)
        for agent_id in self.agents:
            is_disrupted = agent_id in disrupted_agents
            self.factory_agents[agent_id].step_production(is_disrupted=is_disrupted)
            self.infos[agent_id] = {"disrupted": is_disrupted}
            
        # Phase 2: Negotiation (Actions applied conceptually)
        for agent_id, action in actions.items():
            self.factory_agents[agent_id].apply_action(action)
            
            # Dummy logic, but tracking interactions for attention memory
            # Randomly pair them for demo purposes
            if random.random() > 0.5:
                partner_idx = float(self.possible_agents.index(random.choice(self.possible_agents)))
                self.factory_agents[agent_id].record_interaction(partner_idx)
            
            # Calculate mock rewards
            profit_loss = np.random.normal(10, 5) # Placeholder
            rewards[agent_id] = self.factory_agents[agent_id].calculate_reward(profit_loss, risk_factor=0.1)

        # Build observations and termination flags
        is_done = self.current_step >= self.max_steps
        for agent_id in self.agents:
            flags_done[agent_id] = is_done
            flags_trunc[agent_id] = False
            observations[agent_id] = self.factory_agents[agent_id].get_state_vector()
            
        if is_done:
            self.agents = []

        return observations, rewards, flags_done, flags_trunc, self.infos

    def render(self):
        print(f"--- Step {self.current_step} ---")
        for a in self.possible_agents:
            state = self.factory_agents[a].get_state_vector()
            disruption_str = "[DISRUPTED] " if self.infos.get(a, {}).get("disrupted", False) else ""
            print(f"{disruption_str}{a}: Cash={state[6]*10000:.2f} Rep={state[7]:.2f}")
