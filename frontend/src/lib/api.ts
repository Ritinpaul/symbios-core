/**
 * SymbiOS API Service Layer
 * Connects to our FastAPI backend at localhost:8000
 * The Vite proxy handles: /api/* → http://localhost:8000 and /ws/* → ws://localhost:8000
 */

// --- Types ---
export interface Agent {
    id: string;
    name: string;
    type: string;
    cash: number;
    reputation: number;
    production_schedule: number;
    inventory: Record<string, number>;
    attention_memory: number[];
}

export interface Suggestion {
    title: string;
    description: string;
    type: 'Direct Match' | 'Chain Reaction' | 'Novel Process' | 'Temporal Pattern';
    confidence: number;
    risk: 'low' | 'medium' | 'high';
    expected_roi: number;
    source_factory: string;
    target_factory: string;
    resource: string;
    citations: string[];
}

export interface SimulationState {
    step: number;
    episode_active: boolean;
    agents: Agent[];
}

export interface ContractAddresses {
    SymbiosisToken?: string;
    NegotiationContract?: string;
    IoTOracle?: string;
    DeliveryContract?: string;
    ReputationContract?: string;
}

// --- Fetchers ---
const BASE = ''; // Vite proxies /api → localhost:8000

export async function fetchAgents(): Promise<Agent[]> {
    const res = await fetch(`${BASE}/api/agents`);
    if (!res.ok) throw new Error('Failed to fetch agents');
    const data = await res.json();
    return data.agents;
}

export async function fetchSimulationState(): Promise<SimulationState> {
    const res = await fetch(`${BASE}/api/simulation/state`);
    if (!res.ok) throw new Error('Failed to fetch simulation state');
    return res.json();
}

export async function stepSimulation(): Promise<Record<string, unknown>> {
    const res = await fetch(`${BASE}/api/simulation/step`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to step simulation');
    return res.json();
}

export async function fetchAttentionWeights(): Promise<Record<string, number[][]>> {
    const res = await fetch(`${BASE}/api/marl/attention`);
    if (!res.ok) throw new Error('Failed to fetch attention weights');
    const data = await res.json();
    return data.attention_weights;
}

export async function fetchSuggestions(): Promise<Suggestion[]> {
    const res = await fetch(`${BASE}/api/suggestions`);
    if (!res.ok) throw new Error('Failed to fetch suggestions');
    const data = await res.json();
    return data.suggestions;
}

export async function fetchBlockchainAddresses(): Promise<ContractAddresses> {
    const res = await fetch(`${BASE}/api/blockchain/addresses`);
    if (!res.ok) return {};
    return res.json();
}
