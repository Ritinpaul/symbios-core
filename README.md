# SymbiOS

**Autonomous Industrial Symbiosis Operating System**

SymbiOS is an AI-driven platform that transforms isolated factories into an interconnected circular economy. It autonomously discovers, negotiates, prices, and executes resource trades between industrial agents — turning one factory's waste into another's raw material, in real-time, with blockchain-verified settlement.

> *From 1972 manual coordination (Kalundborg, Denmark) to 2026 AI-driven sustainability.*

**Theme:** Sustainable & Green Industrial Systems  
**Repository:** [github.com/Ritinpaul/symbios-core](https://github.com/Ritinpaul/symbios-core)

---

## The Problem

Industrial parks produce millions of tons of recyclable waste annually — heat, slag, chemicals, water — that gets dumped because neighboring factories don't coordinate. The world's best example of industrial symbiosis ([Kalundborg](https://en.wikipedia.org/wiki/Kalundborg_Eco-industrial_Park)) took 50 years of human negotiation. It doesn't scale.

## The Solution

SymbiOS automates industrial symbiosis through a 5-layer AI stack:

1. **Simulation Engine** — Physics-based environment modeling factories as autonomous agents with dynamic inventories, production schedules, and stochastic disruptions.

2. **MARL Training Engine** — Transformer-MAPPO (Multi-Agent Proximal Policy Optimization) with a 2-layer, 4-head attention encoder. Agents learn optimal trading strategies through experience, not hard-coded rules.

3. **Economic Optimization** — Nash bargaining, double auctions with AI market makers, dynamic pricing with carbon-tax adjustment, and on-chain reputation scoring.

4. **Blockchain Settlement** — Solidity smart contracts on Ethereum for escrow-based atomic swaps, IoT-verified delivery, and soulbound reputation NFTs (ERC-721).

5. **GenAI Intelligence** — Hybrid RAG (BM25 + ChromaDB), GNN-based link prediction (PyTorch Geometric), real-time LLM narration, and AI log analysis via Groq.

---

## Live Dashboard

A real-time React dashboard connected via WebSocket:

- Live agent metrics (cash, inventory, reputation)
- Attention network heatmap with weighted SVG links  
- Performance history charts
- AI-generated narration of every trade
- GenAI trade suggestions with confidence scores
- Blockchain contract status
- Log analysis engine (upload CSV → executive summary)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                   │
│        Dashboard · Charts · Heatmap · AI Narrator           │
├──────────────────────┬──────────────────────────────────────┤
│    WebSocket /ws     │         REST /api                     │
├──────────────────────┴──────────────────────────────────────┤
│                  BACKEND (FastAPI + Python)                   │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐ │
│  │Simulation│  │   MARL   │  │Economics │  │   GenAI     │ │
│  │  Engine  │  │ T-MAPPO  │  │  Engine  │  │  Engine     │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────────┤
│              BLOCKCHAIN (Hardhat + Solidity)                  │
│  NegotiationContract · DeliveryContract · ReputationNFT      │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Recharts, Lucide Icons |
| Backend | Python, FastAPI, WebSocket, NumPy |
| AI/ML | PyTorch, PyTorch Geometric, Transformer-MAPPO |
| GenAI | Groq (llama-3.3-70b), ChromaDB, BM25, Reciprocal Rank Fusion |
| Blockchain | Solidity, Hardhat, Ethers.js, ERC-20, ERC-721 |

---

## Getting Started

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --port 8001
```

### Blockchain
```bash
cd blockchain
npm install
npx hardhat compile
npx hardhat node                                    # Terminal 1
npx hardhat run scripts/deploy.js --network localhost  # Terminal 2
```

### Frontend
```bash
cd frontend
npm install
npm run dev -- --port 8080
```

Open `http://localhost:8080` to access the dashboard.

---

## Impact

| Metric | Projected Impact |
|--------|-----------------|
| Resource savings | 20–30% raw material reduction |
| Carbon reduction | Waste-to-resource conversion eliminates landfill emissions |
| Water efficiency | Cross-factory reuse reduces freshwater consumption |
| Settlement trust | 100% blockchain-verified, zero counterparty risk |
| Coordination speed | Real-time autonomous (vs. decades of manual effort) |

---

## Evaluation

```bash
cd backend
python evaluate_progress.py
```

Runs the end-to-end test suite across Simulation, MARL, Economics, Blockchain, and GenAI.

---

## License

MIT
