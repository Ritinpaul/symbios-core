from typing import List, Dict, Tuple
from collections import defaultdict
import numpy as np

class Bid:
    def __init__(self, agent_id: str, quantity: float, price: float, is_buy: bool):
        self.agent_id = agent_id
        self.quantity = quantity
        self.price = price
        self.is_buy = is_buy

class DoubleAuction:
    def __init__(self):
        self.buy_orders = []
        self.sell_orders = []
        
    def submit_bid(self, bid: Bid):
        if bid.is_buy:
            self.buy_orders.append(bid)
            # Sort highest price first
            self.buy_orders.sort(key=lambda x: x.price, reverse=True)
        else:
            self.sell_orders.append(bid)
            # Sort lowest price first
            self.sell_orders.sort(key=lambda x: x.price)
            
    def match_orders(self) -> List[Dict]:
        matches = []
        
        while self.buy_orders and self.sell_orders:
            highest_buy = self.buy_orders[0]
            lowest_sell = self.sell_orders[0]
            
            if highest_buy.price >= lowest_sell.price:
                # Execution price is mid-point
                exec_price = (highest_buy.price + lowest_sell.price) / 2.0
                exec_quantity = min(highest_buy.quantity, lowest_sell.quantity)
                
                matches.append({
                    "buyer": highest_buy.agent_id,
                    "seller": lowest_sell.agent_id,
                    "quantity": exec_quantity,
                    "price": exec_price
                })
                
                # Update quantities
                highest_buy.quantity -= exec_quantity
                lowest_sell.quantity -= exec_quantity
                
                # Remove filled orders
                if highest_buy.quantity == 0:
                    self.buy_orders.pop(0)
                if lowest_sell.quantity == 0:
                    self.sell_orders.pop(0)
            else:
                # No more matches possible
                break
                
        return matches

class MarketMakerAgent:
    """
    An algorithmic entity that ensures the market always has liquidity.
    Essential for demo reliability so trading never fully stops.
    It bids below fair value and asks above fair value to earn the spread.
    """
    def __init__(self, agent_id: str = "MM_01", inventory_target: float = 1000.0):
        self.agent_id = agent_id
        self.inventory = defaultdict(float)
        self.inventory_target = inventory_target
        self.cash = 100000.0 # Deep pockets
        self.spread_factor = 0.05 # 5% spread
        
    def provide_liquidity(self, auction: DoubleAuction, resource_type: str, fair_value: float):
        # Adjust spread based on inventory skew (inventory risk management)
        inv_skew = (self.inventory[resource_type] - self.inventory_target) / self.inventory_target
        
        # If we have too much stock, lower ask price to sell, lower bid price to stop buying
        skew_adjustment = inv_skew * 0.02
        
        bid_price = fair_value * (1.0 - self.spread_factor - skew_adjustment)
        ask_price = fair_value * (1.0 + self.spread_factor - skew_adjustment)
        
        # Submit standing orders
        auction.submit_bid(Bid(self.agent_id, quantity=100.0, price=bid_price, is_buy=True))
        auction.submit_bid(Bid(self.agent_id, quantity=100.0, price=ask_price, is_buy=False))

class VCGAuction:
    """
    Multi-item truthful auction for complex bundles.
    Implementation is simplified for hackathon structure, primarily used as the theoretical 
    backing for the Nash solution. In practice, Double Auction with Market Maker drives the demo.
    """
    def __init__(self):
        self.bids = {} # {agent_id: {bundle_id: value}}
        
    # Full VCG NP-Hard combinatorial allocation is mock-implemented for demo narrative
    def solve_allocation(self) -> Dict:
        pass 
