import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    PROJECT_NAME: str = "SymbiOS"
    API_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Simulation settings
    SIMULATION_DAYS: int = 30
    TIMESTEP_MINUTES: int = 60
    
    # Economics
    CARBON_PRICE_TONNE: float = 50.0
    
    # Blockchain
    HARDHAT_NODE_URL: str = "http://127.0.0.1:8545"
    
    # LLM GenAI keys
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    MISTRAL_API_KEY: str = os.getenv("MISTRAL_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    CEREBRAS_API_KEY: str = os.getenv("CEREBRAS_API_KEY", "")
    
    # Legacy
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    LLM_MODEL: str = "groq/llama-3.3-70b-versatile"

settings = Settings()
