from simulation.factory_agent import create_steel_mill, create_chem_corp, create_cement_works
from simulation.environment import IndustrialParkEnv

def setup_guindy_industrial_park() -> IndustrialParkEnv:
    """
    Creates the 'Guindy Industrial Park' preset scenario with 3 factories:
    - SteelCo (Producer)
    - ChemCorp (Consumer/Converter)
    - CementWorks (Converter)
    """
    agents = [
        create_steel_mill("agent_steelco_0"),
        create_chem_corp("agent_chemcorp_1"),
        create_cement_works("agent_cementworks_2")
    ]
    
    # Optional connection rules or resource compatibility matrix can be attached directly here
    # or inside the environment logic
    
    env = IndustrialParkEnv(agents=agents, max_steps=30)
    return env
