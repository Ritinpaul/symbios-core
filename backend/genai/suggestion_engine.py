from typing import List, Dict
from genai.rag_pipeline import HybridRAGPipeline

class SuggestionType:
    DIRECT_MATCH = "Direct Match"
    CHAIN_REACTION = "Chain Reaction"
    NOVEL_PROCESS = "Novel Process"
    TEMPORAL_PATTERN = "Temporal Pattern"

class Suggestion:
    def __init__(self, title: str, description: str, suggestion_type: str,
                 confidence: float, risk: str, expected_roi: float,
                 source_factory: str, target_factory: str, resource: str,
                 citations: List[str]):
        self.title = title
        self.description = description
        self.suggestion_type = suggestion_type
        self.confidence = confidence
        self.risk = risk
        self.expected_roi = expected_roi
        self.source_factory = source_factory
        self.target_factory = target_factory
        self.resource = resource
        self.citations = citations

    def to_dict(self) -> Dict:
        return {
            "title": self.title,
            "description": self.description,
            "type": self.suggestion_type,
            "confidence": round(self.confidence, 2),
            "risk": self.risk,
            "expected_roi": round(self.expected_roi, 2),
            "source_factory": self.source_factory,
            "target_factory": self.target_factory,
            "resource": self.resource,
            "citations": self.citations
        }


class SuggestionEngine:
    """
    Analyzes simulation state, identifies unmatched supply/demand,
    queries the RAG pipeline, and ranks suggestions by confidence.
    
    Confidence = econ_value × feasibility × (1 - risk_penalty)
    """
    
    RISK_PENALTIES = {"low": 0.1, "medium": 0.3, "high": 0.5}
    
    def __init__(self):
        self.rag = HybridRAGPipeline()
    
    def analyze_opportunities(self, factory_states: Dict, resource_flows: List[Dict]) -> List[Suggestion]:
        """
        Given the current simulation state, find and rank symbiosis opportunities.
        factory_states: {agent_id: {inventory: {...}, capacity: {...}, type: str}}
        resource_flows: list of current active flows
        """
        suggestions = []
        
        # 1. Find unmatched supply/demand gaps
        gaps = self._find_gaps(factory_states)
        
        # 2. For each gap, query RAG for relevant knowledge
        for gap in gaps:
            query = f"{gap['resource']} exchange between {gap['supplier_type']} and {gap['consumer_type']} industrial symbiosis"
            retrieved_docs = self.rag.retrieve(query, top_k=3)
            
            if not retrieved_docs:
                continue
            
            # 3. Build suggestion from best match
            best_doc = retrieved_docs[0]
            
            # 4. Calculate confidence score
            econ_value = gap["potential_value"]  # normalized 0-1
            feasibility = best_doc["feasibility_score"]
            risk_penalty = self.RISK_PENALTIES.get(best_doc["risk_level"], 0.3)
            confidence = econ_value * feasibility * (1 - risk_penalty)
            
            # 5. Determine suggestion type
            stype = self._classify_type(gap, retrieved_docs)
            
            suggestion = Suggestion(
                title=f"Match: {gap['supplier']} → {gap['consumer']} ({gap['resource']})",
                description=best_doc["content"][:200] + "...",
                suggestion_type=stype,
                confidence=confidence,
                risk=best_doc["risk_level"],
                expected_roi=confidence * 100,  # simplified ROI estimate
                source_factory=gap["supplier"],
                target_factory=gap["consumer"],
                resource=gap["resource"],
                citations=[best_doc["source"]]
            )
            suggestions.append(suggestion)
        
        # Sort by confidence descending
        suggestions.sort(key=lambda s: s.confidence, reverse=True)
        return suggestions
    
    def _find_gaps(self, factory_states: Dict) -> List[Dict]:
        """Identify supply/demand mismatches across factories."""
        gaps = []
        factories = list(factory_states.items())
        
        for i, (id_a, state_a) in enumerate(factories):
            for j, (id_b, state_b) in enumerate(factories):
                if i == j:
                    continue
                inv_a = state_a.get("inventory", {})
                cap_b = state_b.get("capacity", {})
                
                for resource, amount in inv_a.items():
                    # If factory A has surplus and factory B has capacity
                    if amount > 50 and cap_b.get(resource, 0) > amount:
                        gaps.append({
                            "supplier": id_a,
                            "consumer": id_b,
                            "supplier_type": state_a.get("type", "unknown"),
                            "consumer_type": state_b.get("type", "unknown"),
                            "resource": resource,
                            "surplus": amount,
                            "potential_value": min(1.0, amount / 100.0)
                        })
        return gaps
    
    def _classify_type(self, gap: Dict, docs: List[Dict]) -> str:
        """Simple heuristic to classify the suggestion type."""
        resource = gap["resource"].lower()
        
        if any("cascade" in d["content"].lower() or "chain" in d["content"].lower() for d in docs):
            return SuggestionType.CHAIN_REACTION
        elif any("novel" in d["content"].lower() or "non-obvious" in d["content"].lower() for d in docs):
            return SuggestionType.NOVEL_PROCESS
        elif any("seasonal" in d["content"].lower() or "temporal" in d["content"].lower() for d in docs):
            return SuggestionType.TEMPORAL_PATTERN
        else:
            return SuggestionType.DIRECT_MATCH
    
    def get_demo_suggestions(self) -> List[Dict]:
        """Pre-built demo suggestions for reliable hackathon demo."""
        demo_states = {
            "SteelCo": {"inventory": {"HEAT": 80, "BYPRODUCT": 60}, "capacity": {"HEAT": 500, "WATER": 1000}, "type": "producer"},
            "ChemCorp": {"inventory": {"WATER": 30, "HEAT": 10}, "capacity": {"HEAT": 300, "WATER": 500}, "type": "consumer"},
            "CementWorks": {"inventory": {"CO2": 40, "BYPRODUCT": 20}, "capacity": {"BYPRODUCT": 1000, "HEAT": 200}, "type": "converter"}
        }
        results = self.analyze_opportunities(demo_states, [])
        return [s.to_dict() for s in results]
