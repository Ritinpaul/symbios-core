class ReputationSystem:
    """
    Manages the reputation scores of Factory Agents.
    In Phase 4, this local state syncs with the Soulbound Token (SBT) smart contract.
    """
    def __init__(self, decay_rate: float = 0.95):
        self.decay_rate = decay_rate # Scores decay slowly over time to encourage continuous good behavior
        self.scores = {} # agent_id -> score (0.0 to 1.0)
        
    def initialize_agent(self, agent_id: str, initial_score: float = 1.0):
        self.scores[agent_id] = initial_score
        
    def update_score(self, agent_id: str, success: bool, weight: float = 0.1):
        """
        Updates score based on negotiation/delivery outcome.
        weight: how much this specific transaction matters (e.g., volume/value based)
        """
        if agent_id not in self.scores:
            self.initialize_agent(agent_id)
            
        current = self.scores[agent_id]
        
        if success:
            # Move towards 1.0
            new_score = current + (1.0 - current) * weight
        else:
            # Move towards 0.0, penalties are usually harsher
            penalty_weight = weight * 1.5 
            new_score = current - current * penalty_weight
            
        self.scores[agent_id] = max(0.0, min(1.0, new_score))
        return self.scores[agent_id]
        
    def apply_time_decay(self):
        """Called periodically (e.g., end of simulation week) to degrade inactive reputations"""
        for agent_id in self.scores:
            # Decay towards 0.5 (neutral) rather than 0 (bad)
            current = self.scores[agent_id]
            if current > 0.5:
                self.scores[agent_id] = 0.5 + (current - 0.5) * self.decay_rate
            elif current < 0.5:
                self.scores[agent_id] = 0.5 - (0.5 - current) * self.decay_rate
                
    def get_tier(self, agent_id: str) -> str:
        score = self.scores.get(agent_id, 1.0)
        if score >= 0.9: return "S-Tier"
        if score >= 0.7: return "A-Tier"
        if score >= 0.4: return "B-Tier"
        return "Risk-Warning"
