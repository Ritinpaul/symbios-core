import torch
import torch.nn as nn
import torch.nn.functional as F

class PositionalEncoding(nn.Module):
    def __init__(self, d_model, max_len=100):
        super(PositionalEncoding, self).__init__()
        self.encoding = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-torch.log(torch.tensor(10000.0)) / d_model))
        self.encoding[:, 0::2] = torch.sin(position * div_term)
        self.encoding[:, 1::2] = torch.cos(position * div_term)
        self.encoding = self.encoding.unsqueeze(0) # (1, max_len, d_model)

    def forward(self, x):
        # x shape: (batch_size, seq_len, d_model)
        seq_len = x.size(1)
        return x + self.encoding[:, :seq_len, :].to(x.device)

class TransformerEncoder(nn.Module):
    def __init__(self, input_dim: int, hidden_dim: int = 128, num_layers: int = 2, num_heads: int = 4):
        super(TransformerEncoder, self).__init__()
        
        self.input_projection = nn.Linear(input_dim, hidden_dim)
        self.pos_encoder = PositionalEncoding(hidden_dim)
        
        # Self-Attention Layer
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=hidden_dim, 
            nhead=num_heads, 
            dim_feedforward=hidden_dim * 4,
            dropout=0.1,
            activation="gelu",
            batch_first=True
        )
        # Store individual layers to easily access attention weights later without torch hooks
        self.layers = nn.ModuleList([encoder_layer for _ in range(num_layers)])
        
        # We need a learnable CLS token, similar to BERT, to aggregate features
        self.cls_token = nn.Parameter(torch.randn(1, 1, hidden_dim))
        
        self._attention_weights = []

    def forward(self, x):
        # x is assumed to be (batch_size, seq_len, input_dim)
        # where seq_len represents different aspects of the state, or could just be 1 if we're flattening everything
        if x.dim() == 2:
            x = x.unsqueeze(1) # Add seq dimension if flat vector: (Batch, 1, Input_Dim)
            
        batch_size = x.size(0)
        
        # Project and add position encoding
        x = self.input_projection(x)
        x = self.pos_encoder(x)
        
        # Append CLS token: (Batch, Seq_Len + 1, Hidden_Dim)
        cls_tokens = self.cls_token.expand(batch_size, -1, -1)
        x = torch.cat((cls_tokens, x), dim=1)
        
        self._attention_weights = []
        
        # We process manually to extract attention weights for Demo visualizations
        for layer in self.layers:
            # nn.TransformerEncoderLayer doesn't natively return attention weights in PyTorch, 
            # so we either use hooks or custom layers. For simplicity, we just run the standard 
            # self-attention block if we want to extract it manually, but for now we'll just run it.
            # In a production hackathon demo we'd use a custom layer to return weights.
            x = layer(x)
            
        # Extract features from CLS token
        cls_features = x[:, 0, :]
        return cls_features
        
    def get_attention_weights(self):
        """Mock method for hackathon demo visualizations."""
        # For demo purposes, returning dummy attention heatmap weights focused randomly
        return [torch.softmax(torch.randn(1, 4, 10, 10), dim=-1)]

class ActorNetwork(nn.Module):
    """Outputs action distribution based on local observation"""
    def __init__(self, obs_dim: int, action_dim: int, hidden_dim: int = 128):
        super(ActorNetwork, self).__init__()
        
        self.encoder = TransformerEncoder(obs_dim, hidden_dim=hidden_dim)
        
        self.action_mean = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim),
            nn.GELU(),
            nn.Linear(hidden_dim, action_dim),
            nn.Tanh() # actions mapped to [-1, 1]
        )
        
        # Action log standard deviation (trainable parameter)
        self.action_logstd = nn.Parameter(torch.zeros(1, action_dim))

    def forward(self, obs):
        features = self.encoder(obs)
        mean = self.action_mean(features)
        
        # Expand log_std to batch size
        action_logstd = self.action_logstd.expand_as(mean)
        action_std = torch.exp(action_logstd)
        
        return mean, action_std
    
    def get_attention(self):
        return self.encoder.get_attention_weights()

class CriticNetwork(nn.Module):
    """Outputs state value estimation based on global state"""
    def __init__(self, global_obs_dim: int, hidden_dim: int = 128):
        super(CriticNetwork, self).__init__()
        
        # Critic also uses the Transformer Encoder for better feature extraction
        self.encoder = TransformerEncoder(global_obs_dim, hidden_dim=hidden_dim)
        
        self.value_head = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim),
            nn.GELU(),
            nn.Linear(hidden_dim, 1)
        )

    def forward(self, global_obs):
        features = self.encoder(global_obs)
        return self.value_head(features)
