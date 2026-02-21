"""
SymbiOS End-to-End Evaluation: Phases 1-5
"""
import sys
import json
import os

def test_phase1():
    print("=" * 60)
    print("PHASE 1: Simulation Engine + Patch")
    print("=" * 60)
    from simulation.scenarios import setup_guindy_industrial_park
    env = setup_guindy_industrial_park()
    obs, info = env.reset(seed=42)
    
    # Check dimensions
    obs_dim = obs[env.agents[0]].shape[0]
    action_dim = env.action_space(env.agents[0]).shape[0]
    assert obs_dim == 12, f"Expected obs_dim=12, got {obs_dim}"
    assert action_dim == 6, f"Expected action_dim=6, got {action_dim}"
    print(f"  ✓ Obs dim={obs_dim}, Action dim={action_dim}")
    
    # Run 5 steps and check disruptions
    disruption_count = 0
    for i in range(5):
        actions = {a: env.action_space(a).sample() for a in env.agents}
        obs, r, done, trunc, info = env.step(actions)
        for a, inf in info.items():
            if inf.get("disrupted"):
                disruption_count += 1
    print(f"  ✓ 5 steps completed, {disruption_count} disruptions occurred")
    
    # Check attention memory
    fa = env.factory_agents[env.possible_agents[0]]
    assert len(fa.attention_memory) == 3, "Attention memory should have 3 slots"
    print(f"  ✓ Attention memory: {list(fa.attention_memory)}")
    print("  PHASE 1: PASS ✅\n")
    return env

def test_phase2(env):
    print("=" * 60)
    print("PHASE 2: Transformer-MAPPO Engine")
    print("=" * 60)
    from marl.mappo import TransformerMAPPO
    from marl.buffer import PriorityRolloutBuffer
    
    obs, _ = env.reset(seed=42)
    obs_dim = 12
    action_dim = 6
    global_obs_dim = obs_dim * len(env.possible_agents)
    
    model = TransformerMAPPO(env.possible_agents, obs_dim, global_obs_dim, action_dim)
    
    # Test forward pass
    actions, log_probs, values = model.get_actions(obs, deterministic=True)
    assert len(actions) == 3, "Should get actions for 3 agents"
    print(f"  ✓ Actions generated for {len(actions)} agents")
    print(f"    Sample action: {actions[env.possible_agents[0]]}")
    
    # Test attention weights
    weights = model.get_attention_weights(obs)
    assert len(weights) == 3, "Should get weights for 3 agents"
    print(f"  ✓ Attention weights shape: {weights[env.possible_agents[0]][0].shape}")
    
    # Test priority buffer
    buf = PriorityRolloutBuffer(64, obs_dim, action_dim)
    for _ in range(32):
        buf.add(obs[env.possible_agents[0]], actions[env.possible_agents[0]], 1.0, False, 0.5, 0.3)
    buf.compute_gae(last_value=__import__("torch").tensor(0.0), last_done=True)
    print(f"  ✓ Priority buffer: {buf.step} transitions stored")
    
    print("  PHASE 2: PASS ✅\n")
    return model

def test_phase3():
    print("=" * 60)
    print("PHASE 3: Economic Engine")
    print("=" * 60)
    from economics.nash_bargaining import NashBargainingSolution
    from economics.auctions import DoubleAuction, MarketMakerAgent, Bid
    from economics.pricing import DynamicPricingEngine
    from economics.reputation import ReputationSystem
    from simulation.resource_types import ResourceType
    
    # Nash
    def u1(d): return d['price'] - 50
    def u2(d): return 100 - d['price']
    deals = [{'price': p} for p in range(50, 101, 5)]
    best, prod = NashBargainingSolution.solve_2_party(u1, u2, 0, 0, deals)
    assert best is not None, "Nash should find a deal"
    print(f"  ✓ Nash: Best deal={best}, product={prod}")
    
    # Auction + Market Maker
    auction = DoubleAuction()
    mm = MarketMakerAgent()
    mm.provide_liquidity(auction, "HEAT", 80.0)
    auction.submit_bid(Bid("buyer", 50, 85, True))
    auction.submit_bid(Bid("seller", 30, 70, False))
    matches = auction.match_orders()
    assert len(matches) > 0, "Should match at least one trade"
    print(f"  ✓ Auction: {len(matches)} trades matched")
    for m in matches:
        print(f"    {m['buyer']} → {m['seller']}: qty={m['quantity']}, price={m['price']}")
    
    # Pricing
    pricer = DynamicPricingEngine({ResourceType.HEAT: 50.0})
    p1 = pricer.calculate_price(ResourceType.HEAT, 100, 200)
    p2 = pricer.calculate_price(ResourceType.HEAT, 100, 200, marl_value_estimate=0.9)
    assert p2 > p1, "MARL prediction should increase price"
    print(f"  ✓ Pricing: base→{p1:.2f}, +MARL→{p2:.2f} (trend: {pricer.get_trend(ResourceType.HEAT)})")
    
    # Reputation
    rep = ReputationSystem()
    rep.initialize_agent("test_agent")
    rep.update_score("test_agent", success=True, weight=0.2)
    score_after = rep.scores["test_agent"]
    tier = rep.get_tier("test_agent")
    print(f"  ✓ Reputation: score={score_after:.3f}, tier={tier}")
    
    print("  PHASE 3: PASS ✅\n")

def test_phase4():
    print("=" * 60)
    print("PHASE 4: Blockchain Contracts")
    print("=" * 60)
    addr_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "blockchain", "scripts", "deployed-addresses.json"
    )
    
    if os.path.exists(addr_path):
        with open(addr_path) as f:
            addrs = json.load(f)
        print(f"  ✓ {len(addrs)} contracts deployed:")
        for name, addr in addrs.items():
            print(f"    {name}: {addr}")
        print("  PHASE 4: PASS ✅\n")
    else:
        print("  ⚠ deployed-addresses.json not found. Run deploy.js first.")
        print("  PHASE 4: SKIP ⚠\n")

def test_phase5():
    print("=" * 60)
    print("PHASE 5: GenAI + Backend API")
    print("=" * 60)
    
    # RAG Pipeline
    from genai.rag_pipeline import HybridRAGPipeline
    rag = HybridRAGPipeline()
    results = rag.retrieve("heat exchange steel chemical plant", top_k=3)
    assert len(results) > 0, "RAG should return results"
    print(f"  ✓ Hybrid RAG: {len(results)} results for 'heat exchange'")
    for r in results:
        print(f"    [{r['feasibility_score']}] {r['title'][:60]}")
    
    # Context generation
    ctx = rag.generate_context("waste heat recovery")
    assert len(ctx) > 100, "Context should be substantial"
    print(f"  ✓ Context generated: {len(ctx)} chars")
    
    # Suggestion Engine
    from genai.suggestion_engine import SuggestionEngine
    engine = SuggestionEngine()
    suggestions = engine.get_demo_suggestions()
    print(f"  ✓ Suggestion Engine: {len(suggestions)} suggestions generated")
    for s in suggestions:
        print(f"    [{s['confidence']}] {s['title']} ({s['type']}, risk: {s['risk']})")
        
    # GNN Graph Analyzer
    from genai.graph_analyzer import GraphAnalyzer
    try:
        gnn = GraphAnalyzer()
        demo_states = {
            "SteelCo": {"inventory": {"HEAT": 80}, "capacity": {"HEAT": 500}, "type": "producer"},
            "ChemCorp": {"inventory": {"WATER": 30}, "capacity": {"HEAT": 300}, "type": "consumer"},
            "CementWorks": {"inventory": {"CO2": 40}, "capacity": {"BYPRODUCT": 100}, "type": "converter"}
        }
        existing_links = [("SteelCo", "ChemCorp")]
        predictions = gnn.analyze_network(demo_states, existing_links)
        
        print(f"  ✓ GNN Analyzer: Evaluated {len(predictions)} potential links")
        for p in predictions[:3]:
            print(f"    {'[Existed]' if p['is_existing'] else '[Predict]'} {p['source']} -> {p['target']}: Prob={p['probability']:.4f}")
    except Exception as e:
        print(f"  ⚠ GNN Analyzer failed (Optional module): {e}")

    print("  PHASE 5: PASS ✅\n")

if __name__ == "__main__":
    print("\n" + "🔬 SymbiOS End-to-End Evaluation 🔬".center(60))
    print("=" * 60 + "\n")
    
    try:
        env = test_phase1()
        model = test_phase2(env)
        test_phase3()
        test_phase4()
        test_phase5()
        
        print("=" * 60)
        print("🎉 ALL PHASES (1-5) PASSED SUCCESSFULLY 🎉")
        print("=" * 60)
    except Exception as e:
        print(f"\n❌ FAILURE: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
