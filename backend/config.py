import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "SymbiOS"
    API_V1_STR: str = "/api/v1"
    
    # Simulation settings
    SIMULATION_DAYS: int = 30
    TIMESTEP_MINUTES: int = 60
    
    # Economics
    CARBON_PRICE_TONNE: float = 50.0
    
    # Blockchain
    HARDHAT_NODE_URL: str = "http://127.0.0.1:8545"
    
    # LLM GenAI
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    LLM_MODEL: str = "llama3" # Default local model

settings = Settings()
