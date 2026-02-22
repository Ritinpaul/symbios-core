import numpy as np
from enum import Enum
from typing import Dict, Optional, Tuple, List
from collections import deque

from simulation.resource_types import ResourceType

class AgentType(Enum):
    PRODUCER = "producer"
    CONSUMER = "consumer"
    CONVERTER = "converter"

class FactoryAgent:
    def __init__(self, agent_id: str, name: str, agent_type: AgentType, initial_cash: float, num_agents_in_park: int = 3):
        self.agent_id = agent_id
        self.name = name
        self.type = agent_type
        
        # State vector
        self.inventory: Dict[ResourceType, float] = {r: 0.0 for r in ResourceType}
        self.capacity: Dict[ResourceType, float] = {r: 100.0 for r in ResourceType} # max storage
        self.cash = initial_cash
        self.reputation = 1.0 # Score from 0 to 1
        self.production_schedule = 1.0 # Factor of normal operation
        
        # Attention Memory: Tracks the index of the last 3 agents interacted with (0 to N-1)
        # We'll use -1.0 to represent "no recent interaction"
        self.attention_memory_size = 3
        self.attention_memory = deque([-1.0] * self.attention_memory_size, maxlen=self.attention_memory_size)
        
        # Simulation configs
        self.alpha_carbon = 50.0
        self.beta_reputation = 10.0
        self.gamma_risk = 5.0
        
        self.current_reward = 0.0
        self.carbon_emissions = 0.0

    def get_state_vector(self) -> np.ndarray:
        # Normalize and vectorize state for neural network
        # 6 resources + cash + reputation + prod scale (9) + attention memory (3) = 12 dims
        inv = [self.inventory[r] / self.capacity[r] if self.capacity[r] > 0 else 0 for r in ResourceType]
        return np.array([
            *inv,
            self.cash / 10000.0, # scaled
            self.reputation,
            self.production_schedule,
            *self.attention_memory
        ], dtype=np.float32)
        
    def record_interaction(self, partner_agent_index: float) -> None:
        """Called by the environment when a successful negotiation occurs."""
        self.attention_memory.append(partner_agent_index)

    def step_production(self, is_disrupted: bool = False) -> None:
        """Called every simulation tick to update inventory based on production profile."""
        if is_disrupted:
            # Simulate a 50% drop in production due to equipment failure or supply shock
            self.production_schedule = max(0.1, self.production_schedule * 0.5)
        else:
            # Slowly recover normal production schedule
            self.production_schedule = min(1.0, self.production_schedule + 0.1)
        
        import random
        # Base generation/consumption
        for r in ResourceType:
            if self.type == AgentType.PRODUCER:
                self.inventory[r] = min(self.capacity.get(r, 100.0), self.inventory[r] + random.uniform(2, 8) * self.production_schedule)
            elif self.type == AgentType.CONSUMER:
                self.inventory[r] = max(0.0, self.inventory[r] - random.uniform(2, 8) * self.production_schedule)
            else:
                 # Converter fluctuates
                 self.inventory[r] = max(0.0, min(self.capacity.get(r, 100.0), self.inventory[r] + random.uniform(-5, 5) * self.production_schedule))

    def apply_action(self, action: np.ndarray) -> None:
        """
        Translates raw ND array action to concrete effects.
        Action vector (dim 6): [bid_price_mod, ask_price_mod, accept_threshold, negotiation_partner_focus, contract_duration, quality_tier]
        """
        import random
        # Fake logic to simulate trading impacts on inventory and cash
        trade_volume = (action[0] + 1.0) * 10 * self.production_schedule # 0 to 20
        profit_loss = (action[1] * 50) - 10 # random profit
        self.cash += profit_loss

        # Randomly adjust inventory to simulate active P2P trades
        for r in ResourceType:
            change = random.uniform(-15, 15) * self.production_schedule
            self.inventory[r] = max(0.0, min(self.capacity.get(r, 100.0), self.inventory[r] + change))
        
    def calculate_reward(self, profit: float, risk_factor: float) -> float:
        """
        Reward function: profit + α·carbon + β·reputation − γ·risk
        Assumes carbon_emissions is negative value if saved
        """
        reward = profit 
        reward -= self.alpha_carbon * self.carbon_emissions 
        reward += self.beta_reputation * self.reputation
        reward -= self.gamma_risk * risk_factor
        self.current_reward = reward
        return reward

# Factory Profiles Generator
def create_steel_mill(agent_id: str) -> FactoryAgent:
    agent = FactoryAgent(agent_id, "SteelCo", AgentType.PRODUCER, initial_cash=5000)
    agent.capacity[ResourceType.HEAT] = 500
    agent.capacity[ResourceType.WATER] = 1000
    return agent

def create_chem_corp(agent_id: str) -> FactoryAgent:
    agent = FactoryAgent(agent_id, "ChemCorp", AgentType.CONSUMER, initial_cash=6000)
    agent.capacity[ResourceType.HEAT] = 300
    agent.capacity[ResourceType.WATER] = 500
    return agent

def create_cement_works(agent_id: str) -> FactoryAgent:
    agent = FactoryAgent(agent_id, "CementWorks", AgentType.CONVERTER, initial_cash=4000)
    agent.capacity[ResourceType.BYPRODUCT] = 1000
    agent.capacity[ResourceType.HEAT] = 200
    return agent
