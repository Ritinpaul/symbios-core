from enum import Enum
from dataclasses import dataclass
from typing import Optional

class ResourceType(Enum):
    HEAT = "heat"
    WATER = "water"
    BYPRODUCT = "byproduct"
    ENERGY = "energy"
    STORAGE = "storage"
    CO2 = "co2"

@dataclass
class Resource:
    type: ResourceType
    quantity: float  # In appropriate units (MW, Liters, Tons)
    quality_grade: float  # 0.0 to 1.0
    unit_cost: float  # Base cost in SYM tokens/unit

@dataclass
class ResourceFlow:
    source_agent_id: str
    target_agent_id: str
    resource_type: ResourceType
    quantity: float
    price: float
    timestamp: int  # Simulation tick
