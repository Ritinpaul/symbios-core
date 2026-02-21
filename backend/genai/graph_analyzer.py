import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn import GCNConv
from typing import Dict, List, Tuple

class GCNEncoder(nn.Module):
    def __init__(self, in_channels: int, hidden_channels: int, out_channels: int):
        super(GCNEncoder, self).__init__()
        self.conv1 = GCNConv(in_channels, hidden_channels)
        self.conv2 = GCNConv(hidden_channels, out_channels)

    def forward(self, x: torch.Tensor, edge_index: torch.Tensor) -> torch.Tensor:
        x = self.conv1(x, edge_index)
        x = F.relu(x)
        x = F.dropout(x, p=0.2, training=self.training)
        x = self.conv2(x, edge_index)
        return x

class InnerProductDecoder(nn.Module):
    def forward(self, z: torch.Tensor, edge_index: torch.Tensor, sigmoid: bool = True) -> torch.Tensor:
        value = (z[edge_index[0]] * z[edge_index[1]]).sum(dim=1)
        return torch.sigmoid(value) if sigmoid else value

class SymbiosGNN(nn.Module):
    """
    Graph Autoencoder (GAE) for predicting non-obvious industrial symbiotic links.
    Encodes factory features into a latent space and decodes pairwise probabilities.
    """
    def __init__(self, in_channels: int = 13, hidden_channels: int = 32, latent_dim: int = 16):
        super(SymbiosGNN, self).__init__()
        self.encoder = GCNEncoder(in_channels, hidden_channels, latent_dim)
        self.decoder = InnerProductDecoder()
        
    def forward(self, x: torch.Tensor, edge_index: torch.Tensor) -> torch.Tensor:
        z = self.encoder(x, edge_index)
        return z
        
    def predict_links(self, x: torch.Tensor, current_edges: torch.Tensor, candidate_edges: torch.Tensor) -> torch.Tensor:
        """
        Given the current state/graph, predict probabilities for candidate edges.
        """
        # Node embeddings based on current graph topology
        z = self.encode(x, current_edges)
        # Decode probabilities for specific candidate edges
        probs = self.decoder(z, candidate_edges)
        return probs
        
    def encode(self, x: torch.Tensor, edge_index: torch.Tensor) -> torch.Tensor:
        z = self.encoder(x, edge_index)
        return z

class GraphAnalyzer:
    def __init__(self):
        # 5 resources inventory + 5 resources capacity + 3 types = 13 features
        self.model = SymbiosGNN(in_channels=13, hidden_channels=32, latent_dim=16)
        self.model.eval() # Pre-trained or untrained mode for demo
        
        # Resource index mapping (must match simulation.resource_types)
        self.res_map = {"HEAT": 0, "WATER": 1, "CO2": 2, "BYPRODUCT": 3, "ENERGY": 4}
        self.type_map = {"producer": 0, "consumer": 1, "converter": 2}
        
    def extract_features(self, factory_states: Dict) -> Tuple[torch.Tensor, List[str]]:
        """Convert standard dict state to PyTorch tensors for GNN input."""
        nodes = []
        agent_names = []
        
        for agent_id, state in factory_states.items():
            agent_names.append(agent_id)
            inv = [0.0] * 5
            cap = [0.0] * 5
            
            # Fill inventory & capacity
            for res_name, amount in state.get("inventory", {}).items():
                if res_name in self.res_map:
                    inv[self.res_map[res_name]] = min(1.0, float(amount) / 1000.0) # Normalize
                    
            for res_name, amount in state.get("capacity", {}).items():
                if res_name in self.res_map:
                    cap[self.res_map[res_name]] = min(1.0, float(amount) / 1000.0)
                    
            # One-hot type
            ftype = [0.0] * 3
            ftype[self.type_map.get(state.get("type", "producer").lower(), 0)] = 1.0
            
            feature_vector = inv + cap + ftype
            nodes.append(feature_vector)
            
        return torch.tensor(nodes, dtype=torch.float32), agent_names

    def analyze_network(self, factory_states: Dict, existing_links: List[Tuple[str, str]]) -> List[Dict]:
        """
        Predicts the probabilty of all possible missing links in the network.
        """
        x, agent_names = self.extract_features(factory_states)
        num_nodes = len(agent_names)
        
        # Build current edge_index
        src, dst = [], []
        for s, d in existing_links:
            if s in agent_names and d in agent_names:
                src.append(agent_names.index(s))
                dst.append(agent_names.index(d))
                
        # GAT/GCN requires undirected or bidirectional edges for information flow usually
        edge_index = torch.tensor([src, dst], dtype=torch.long)
        if edge_index.numel() == 0:
            edge_index = torch.empty((2, 0), dtype=torch.long)
            
        # Build all possible permutations for candidate links
        cand_src, cand_dst = [], []
        for i in range(num_nodes):
            for j in range(num_nodes):
                if i != j:
                    cand_src.append(i)
                    cand_dst.append(j)
                    
        candidates = torch.tensor([cand_src, cand_dst], dtype=torch.long)
        
        with torch.no_grad():
            probs = self.model.predict_links(x, edge_index, candidates).numpy()
            
        predictions = []
        for k in range(len(cand_src)):
            predictions.append({
                "source": agent_names[cand_src[k]],
                "target": agent_names[cand_dst[k]],
                "probability": float(probs[k]),
                "is_existing": (agent_names[cand_src[k]], agent_names[cand_dst[k]]) in existing_links
            })
            
        # Sort by probability descending
        predictions.sort(key=lambda item: item["probability"], reverse=True)
        return predictions
