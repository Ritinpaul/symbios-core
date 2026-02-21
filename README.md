# SymbiOS 🌍💻

> **Autonomous Industrial Symbiosis Operating System**

SymbiOS is a revolutionary, AI-driven digital infrastructure for industrial parks. It transforms isolated factories into a highly efficient, interconnected ecosystem where waste from one factory becomes the raw material for another. 

By utilizing **Multi-Agent Reinforcement Learning (MARL)**, **Generative AI**, **Graph Neural Networks (GNN)**, and **Blockchain Smart Contracts**, SymbiOS optimizes resource flows, reduces carbon emissions, and ensures trustless, verifiable execution of industrial trades.

---

## 🧠 Core Architecture (5-Layer Tech Stack)

SymbiOS is built on a cutting-edge 5-layer architecture designed for maximum efficiency and academic rigor:

### 1. Simulation Engine (Layer 1)
A high-fidelity physics simulator modeling factories as agents with dynamic inventories, capacities, and production schedules. Features **Attention Memory** and **Stochastic Disruptions** to simulate real-world supply chain shocks.

### 2. MARL Training Engine (Layer 2)
Powered by a custom **Transformer-MAPPO (Multi-Agent Proximal Policy Optimization)** algorithm. Instead of standard MLPs, agents use a 2-layer, 4-head Transformer encoder to weigh the "attention" of other factories in the network before making trade decisions. Includes Priority Experience Replay and Curriculum Learning.

### 3. Economic Optimization Engine (Layer 3)
A suite of game-theory mechanisms to ensure fairness and liquidity:
*   **Nash Bargaining Solution:** Calculates the mathematically optimal midpoint for bilateral negotiations, maximizing the utility product for both parties.
*   **Double Auctions & Market Makers:** An automated order book with an AI liquidity provider to clear trades instantly.
*   **Predictive Dynamic Pricing:** Prices adjust based on supply/demand elasticity, seasonal trends, carbon taxes, and MARL-driven forecasts.

### 4. Blockchain Smart Contracts (Layer 4)
Built with Solidity and deployed via Hardhat to ensure trustless settlement:
*   **Atomic Swaps (`NegotiationContract.sol`):** Funds are locked in escrow and released simultaneously upon delivery.
*   **Mock IoT Oracle (`DeliveryContract.sol`):** Verifies physical delivery of resources completely off-chain before triggering the smart contract execution.
*   **Soulbound Tokens (`ReputationContract.sol`):** Non-transferable ERC-721 NFTs that permanently record a factory's reliability score on-chain.

### 5. GenAI Suggestion Engine (Layer 5)
An intelligence layer that identifies non-obvious resource trades:
*   **Hybrid RAG Pipeline:** Combines BM25 (sparse) and ChromaDB (dense vector) search utilizing Reciprocal Rank Fusion to retrieve industrial ecology case studies. 
*   **GNN Graph Analyzer:** Uses PyTorch Geometric (Graph Autoencoders) to predict unseen symbiotic links across the factory network.
*   **Confidence Scorer:** Outputs actionable JSON suggestions with a mathematically derived confidence score based on feasibility, risk, and expected economic ROI.

---

## 🚀 Getting Started

### 1. Backend (Python/FastAPI Engine)
The core intelligence runs on Python.

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install torch torch-geometric

# Run the unified REST / WebSocket Server
fastapi dev main.py
```

### 2. Blockchain (Hardhat)
The trust layer runs on standard EVM tooling.

```bash
cd blockchain

# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Deploy to local testnet (spins up node and deploys instantaneously)
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

---

## 🧪 Evaluation & Testing
To run the comprehensive end-to-end evaluation suite that sequentially tests the Simulation, MARL, Economics, Blockchain, and GenAI components:

```bash
cd backend
python evaluate_progress.py
```

---

