from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import json
import asyncio
import numpy as np

from config import settings
from simulation.scenarios import setup_guindy_industrial_park
from simulation.resource_types import ResourceType
from marl.mappo import TransformerMAPPO
from genai.suggestion_engine import SuggestionEngine

# Global state
app_state = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize all engines on startup."""
    print(f"Starting {settings.PROJECT_NAME} v{settings.API_VERSION}")
    
    # 1. Init Simulation
    env = setup_guindy_industrial_park()
    obs, info = env.reset()
    app_state["env"] = env
    app_state["obs"] = obs
    app_state["step_count"] = 0
    
    # 2. Init MARL
    obs_dim = env.observation_space(env.possible_agents[0]).shape[0]
    action_dim = env.action_space(env.possible_agents[0]).shape[0]
    global_obs_dim = obs_dim * len(env.possible_agents)
    model = TransformerMAPPO(env.possible_agents, obs_dim, global_obs_dim, action_dim)
    app_state["model"] = model
    
    # 3. Init GenAI
    suggestion_engine = SuggestionEngine()
    app_state["suggestion_engine"] = suggestion_engine
    
    print("All engines initialized successfully")
    yield
    print("Shutting down gracefully")

app = FastAPI(title=settings.PROJECT_NAME, version=settings.API_VERSION, lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- REST API ROUTES ---

@app.get("/")
async def root():
    return {"project": settings.PROJECT_NAME, "version": settings.API_VERSION, "status": "running"}

@app.get("/api/agents")
async def get_agents():
    """Return current state of all factory agents."""
    env = app_state["env"]
    agents = []
    for agent_id in env.possible_agents:
        fa = env.factory_agents[agent_id]
        agents.append({
            "id": fa.agent_id,
            "name": fa.name,
            "type": fa.type.value,
            "cash": round(fa.cash, 2),
            "reputation": round(fa.reputation, 3),
            "production_schedule": round(fa.production_schedule, 3),
            "inventory": {r.name: round(fa.inventory[r], 2) for r in ResourceType},
            "attention_memory": list(fa.attention_memory)
        })
    return {"agents": agents}

@app.post("/api/simulation/step")
async def simulation_step():
    """Advance the simulation by one step using MARL policy."""
    env = app_state["env"]
    model = app_state["model"]
    obs = app_state["obs"]
    
    # Check if episode is done
    if not env.agents:
        obs, info = env.reset()
        app_state["obs"] = obs
        app_state["step_count"] = 0
        return {"status": "reset", "message": "Episode done. Environment reset."}
    
    # Get MARL actions
    actions, log_probs, values = model.get_actions(obs)
    
    # Step environment
    next_obs, rewards, dones, truncs, infos = env.step(actions)
    
    app_state["obs"] = next_obs
    app_state["step_count"] += 1
    
    # Build response
    step_data = {
        "step": app_state["step_count"],
        "rewards": {k: round(v, 4) for k, v in rewards.items()},
        "disruptions": {k: v.get("disrupted", False) for k, v in infos.items()},
        "done": any(dones.values()),
        "actions": {k: v.tolist() for k, v in actions.items()}
    }
    
    return step_data

@app.get("/api/simulation/state")
async def get_simulation_state():
    """Get the full current simulation state."""
    env = app_state["env"]
    agents_data = []
    for agent_id in env.possible_agents:
        fa = env.factory_agents[agent_id]
        agents_data.append({
            "id": fa.agent_id,
            "name": fa.name,
            "type": fa.type.value,
            "cash": round(fa.cash, 2),
            "reputation": round(fa.reputation, 3),
            "inventory": {r.name: round(fa.inventory[r], 2) for r in ResourceType}
        })
    
    return {
        "step": app_state.get("step_count", 0),
        "agents": agents_data,
        "episode_active": len(env.agents) > 0
    }

@app.get("/api/marl/attention")
async def get_attention_weights():
    """Get Transformer attention weights for visualization."""
    model = app_state["model"]
    obs = app_state["obs"]
    
    weights = model.get_attention_weights(obs)
    
    # Convert tensors to lists for JSON serialization
    serialized = {}
    for agent_id, weight_list in weights.items():
        serialized[agent_id] = [w.numpy().tolist() for w in weight_list]
    
    return {"attention_weights": serialized}

@app.get("/api/suggestions")
async def get_suggestions():
    """Get GenAI symbiosis suggestions with confidence scores."""
    engine = app_state["suggestion_engine"]
    suggestions = engine.get_demo_suggestions()
    return {"suggestions": suggestions, "count": len(suggestions)}

@app.get("/api/blockchain/addresses")
async def get_blockchain_addresses():
    """Return deployed contract addresses."""
    import os
    addr_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "blockchain", "scripts", "deployed-addresses.json"
    )
    if os.path.exists(addr_path):
        with open(addr_path) as f:
            return json.load(f)
    return {"error": "Contracts not yet deployed"}


# --- WEBSOCKET FOR LIVE STREAMING ---

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
    
    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

@app.websocket("/ws/simulation")
async def websocket_simulation(websocket: WebSocket):
    """WebSocket endpoint for real-time simulation streaming."""
    await manager.connect(websocket)
    try:
        while True:
            # Wait for client message (e.g., "step" or "auto")
            data = await websocket.receive_text()
            command = json.loads(data)
            
            if command.get("action") == "step":
                # Execute one step and broadcast
                step_result = await simulation_step()
                agents_result = await get_agents()
                
                await manager.broadcast({
                    "type": "step_update",
                    "step": step_result,
                    "agents": agents_result["agents"]
                })
            
            elif command.get("action") == "auto":
                # Auto-run N steps
                n_steps = command.get("steps", 5)
                for _ in range(n_steps):
                    step_result = await simulation_step()
                    agents_result = await get_agents()
                    await manager.broadcast({
                        "type": "step_update",
                        "step": step_result,
                        "agents": agents_result["agents"]
                    })
                    await asyncio.sleep(0.5)  # Pace for UI
                    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
