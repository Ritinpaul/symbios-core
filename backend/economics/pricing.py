import numpy as np
from typing import Dict, List

from simulation.resource_types import ResourceType

class DynamicPricingEngine:
    def __init__(self, base_prices: Dict[ResourceType, float]):
        self.base_prices = base_prices
        
        # History tracking across steps 
        self.price_history: Dict[ResourceType, List[float]] = {r: [price] for r, price in base_prices.items()}
        self.demand_history: Dict[ResourceType, List[float]] = {r: [0] for r in base_prices}
        self.supply_history: Dict[ResourceType, List[float]] = {r: [0] for r in base_prices}
        
    def calculate_price(self, resource: ResourceType, current_supply: float, current_demand: float, 
                        marl_value_estimate: float = 0.0, 
                        carbon_tax_rate: float = 0.0, 
                        urgency_multiplier: float = 1.0) -> float:
        """
        Calculates the dynamic price of a resource taking into account:
        1. Classic Supply & Demand curves
        2. Policy (Carbon tax)
        3. Local constraints (Urgency)
        4. INNOVATION: Predictive/Speculative adjustments via MARL Value Estimate
        """
        base = self.base_prices[resource]
        
        # Classic Market Forces (Elasticity curve mock)
        if current_supply == 0:
            market_factor = 2.0 # Scarcity premium
        else:
            market_factor = min(2.0, max(0.5, current_demand / current_supply))
            
        # The base price under current conditions
        current_fair_value = base * market_factor * urgency_multiplier + carbon_tax_rate
        
        # Predictive Pricing via MARL (Speculative adjustment)
        # If the MARL critic predicts high future value for the global state, 
        # the market anticipates future supply shocks and increases current prices.
        # marl_value_estimate is assumed to be normalized
        predictive_adjustment_factor = 1.0 + (marl_value_estimate * 0.1) # Max 10% speculative swing
        
        final_price = current_fair_value * predictive_adjustment_factor
        
        self.price_history[resource].append(final_price)
        self.demand_history[resource].append(current_demand)
        self.supply_history[resource].append(current_supply)
        
        return max(0.01, final_price) # Prevent negative prices
        
    def get_trend(self, resource: ResourceType, window: int = 5) -> str:
        """Returns string for UI dashboard display"""
        if len(self.price_history[resource]) < window:
            return "Neutral"
            
        recent = self.price_history[resource][-window:]
        start = recent[0]
        end = recent[-1]
        
        pct_change = (end - start) / start
        
        if pct_change > 0.05:
            return "Bullish"
        elif pct_change < -0.05:
            return "Bearish"
        return "Stable"
