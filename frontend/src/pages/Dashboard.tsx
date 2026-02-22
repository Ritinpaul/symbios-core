import { useEffect, useState } from 'react';
import { useSimulation } from '@/hooks/useWebSocket';
import { fetchSuggestions, fetchBlockchainAddresses, type Suggestion, type ContractAddresses } from '@/lib/api';
import { Wifi, WifiOff, AlertCircle, Loader2, RefreshCw, Zap, Activity, Database, Brain } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import type { WSState } from '@/hooks/useWebSocket';

// --- Connection Status Bar ---
function StatusBar({ state, step, onReconnect }: { state: WSState; step: number; onReconnect: () => void }) {
    const configs = {
        open: { icon: Wifi, label: 'LIVE', cls: 'text-emerald-400', dot: 'bg-emerald-400 animate-pulse' },
        connecting: { icon: Loader2, label: 'CONNECTING', cls: 'text-amber-400 animate-spin', dot: 'bg-amber-400 animate-pulse' },
        closed: { icon: WifiOff, label: 'OFFLINE', cls: 'text-slate-500', dot: 'bg-slate-500' },
        error: { icon: AlertCircle, label: 'ERROR', cls: 'text-red-400', dot: 'bg-red-400' },
    };
    const c = configs[state];
    return (
        <div className="flex items-center justify-between px-4 py-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm mb-4">
            <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                <c.icon className={`w-4 h-4 ${c.cls}`} />
                <span className={`text-xs font-mono font-bold ${c.cls}`}>{c.label}</span>
            </div>
            <span className="text-xs font-mono text-slate-400">Step #{step}</span>
            {(state === 'closed' || state === 'error') && (
                <button onClick={onReconnect} className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                    <RefreshCw className="w-3 h-3" /> Reconnect
                </button>
            )}
        </div>
    );
}

// --- Resource Progress Bar ---
const RESOURCE_COLORS: Record<string, string> = {
    HEAT: '#FF5722',
    WATER: '#00E5FF',
    BYPRODUCT: '#39FF14',
    CO2: '#D946EF',
    ENERGY: '#FFD700',
};

function ResourceBar({ name, value, max = 500 }: { name: string; value: number; max?: number }) {
    const pct = Math.min(100, (value / max) * 100);
    const color = RESOURCE_COLORS[name] ?? '#94A3B8';
    return (
        <div className="mb-2">
            <div className="flex justify-between text-[10px] font-mono mb-1">
                <span style={{ color }} className="uppercase tracking-wider">{name}</span>
                <span className="text-slate-400">{value.toFixed(0)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
            </div>
        </div>
    );
}

// --- Agent Card ---
function AgentCard({ agent }: { agent: { id: string; name: string; type: string; cash: number; reputation: number; inventory: Record<string, number>; } }) {
    const tier = agent.reputation >= 0.9 ? 'S-Tier' : agent.reputation >= 0.7 ? 'A-Tier' : 'B-Tier';
    const tierColor = agent.reputation >= 0.9 ? 'text-amber-400' : agent.reputation >= 0.7 ? 'text-emerald-400' : 'text-slate-400';
    return (
        <div className="p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-white/20 transition-all">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h3 className="text-sm font-bold text-white">{agent.name}</h3>
                    <p className="text-[10px] font-mono text-slate-400 uppercase">{agent.type}</p>
                </div>
                <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border border-current/30 bg-current/10 ${tierColor}`}>{tier}</span>
            </div>
            <p className="text-xl font-mono font-bold text-white mb-3">${agent.cash.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            {Object.entries(agent.inventory ?? {}).map(([res, val]) => (
                <ResourceBar key={res} name={res} value={val as number} />
            ))}
        </div>
    );
}

// --- Network Graph (SVG) ---
function NetworkGraph({ agents, disruptions }: { agents: any[]; disruptions: Record<string, boolean> }) {
    const POSITIONS = [
        { cx: 140, cy: 60 },
        { cx: 60, cy: 175 },
        { cx: 220, cy: 175 },
    ];
    return (
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 h-full">
            <h4 className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Brain className="w-3 h-3" /> Attention Network
            </h4>
            <svg viewBox="0 0 280 240" className="w-full">
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>
                {/* Edges */}
                {POSITIONS.map((a, i) =>
                    POSITIONS.slice(i + 1).map((b, j) => (
                        <line key={`e${i}${j}`} x1={a.cx} y1={a.cy} x2={b.cx} y2={b.cy}
                            stroke="#D946EF" strokeWidth="1.5" strokeOpacity="0.5" filter="url(#glow)" />
                    ))
                )}
                {/* Nodes */}
                {agents.slice(0, 3).map((agent, i) => {
                    const pos = POSITIONS[i];
                    const isDisrupted = disruptions?.[agent.id];
                    const color = isDisrupted ? '#FF5722' : '#00E5FF';
                    return (
                        <g key={agent.id}>
                            <circle cx={pos.cx} cy={pos.cy} r="22" fill="hsl(220,30%,8%)" stroke={color} strokeWidth="1.5" filter="url(#glow)" />
                            <circle cx={pos.cx} cy={pos.cy} r="6" fill={color} className="animate-pulse" />
                            <text x={pos.cx} y={pos.cy + 36} textAnchor="middle" fill="#94A3B8" fontSize="8" fontFamily="monospace">{agent.name}</text>
                            {isDisrupted && <text x={pos.cx} y={pos.cy - 28} textAnchor="middle" fill="#FF5722" fontSize="8">⚠ DISRUPTED</text>}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

// --- Suggestion Card ---
function SuggestionCard({ s }: { s: Suggestion }) {
    const confPct = Math.round(s.confidence * 100);
    const riskColor = s.risk === 'low' ? 'text-emerald-400' : s.risk === 'medium' ? 'text-amber-400' : 'text-red-400';
    const typeColor = s.type === 'Chain Reaction' ? 'text-violet-400' : s.type === 'Novel Process' ? 'text-cyan-400' : 'text-emerald-400';
    return (
        <div className="p-3 rounded-xl border border-white/10 bg-white/5 hover:border-violet-500/30 transition-all">
            <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-semibold text-white leading-tight">{s.title}</p>
                <span className={`ml-2 shrink-0 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300`}>{confPct}%</span>
            </div>
            <p className="text-[10px] text-slate-400 mb-2 line-clamp-2">{s.description}</p>
            <div className="flex items-center gap-3 text-[10px] font-mono">
                <span className={typeColor}>{s.type}</span>
                <span className={riskColor}>Risk: {s.risk}</span>
                <span className="text-slate-400">ROI: {s.expected_roi.toFixed(0)}%</span>
            </div>
        </div>
    );
}

// --- Blockchain Log ---
const ETHERSCAN_BASE = 'https://sepolia.etherscan.io/address/';
const isLiveAddress = (addr: string) => addr && !addr.startsWith('0x5FbDB') && !addr.startsWith('0xe7f1725') && addr.length === 42;

function BlockchainPanel({ addresses }: { addresses: ContractAddresses }) {
    const entries = Object.entries(addresses).filter(([k]) => k !== 'error');
    const hasLive = entries.some(([, addr]) => isLiveAddress(addr as string));
    return (
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 h-full">
            <h4 className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Database className="w-3 h-3" /> Deployed Contracts
                {hasLive && <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">SEPOLIA LIVE</span>}
            </h4>
            <ScrollArea className="h-36">
                {entries.length === 0 ? (
                    <p className="text-xs text-slate-500 font-mono">No contracts found — run deploy.js</p>
                ) : (
                    <div className="space-y-2 font-mono text-[10px]">
                        {entries.map(([name, addr]) => {
                            const live = isLiveAddress(addr as string);
                            return (
                                <div key={name} className="border-l-2 border-violet-500/40 pl-2">
                                    <p className="text-violet-300 font-semibold">{name}</p>
                                    {live ? (
                                        <a
                                            href={`${ETHERSCAN_BASE}${addr}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 truncate block transition-colors"
                                        >
                                            {(addr as string).slice(0, 6)}…{(addr as string).slice(-4)} ↗
                                        </a>
                                    ) : (
                                        <p className="text-slate-400 truncate">{addr as string}</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}

// --- Performance Chart ---
function PerfChart({ data }: { data: { step: number; reward: number }[] }) {
    return (
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
            <h4 className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Activity className="w-3 h-3" /> Agent Reward Stream
            </h4>
            {data.length < 2 ? (
                <p className="text-xs text-slate-500 font-mono">Waiting for data…</p>
            ) : (
                <ResponsiveContainer width="100%" height={120}>
                    <LineChart data={data}>
                        <XAxis dataKey="step" tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: '#64748B' }} axisLine={false} tickLine={false} width={35} />
                        <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }} />
                        <Line type="monotone" dataKey="reward" stroke="#D946EF" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}

// --- Main Dashboard Page ---
export default function Dashboard() {
    const { wsState, liveData, reconnect } = useSimulation();
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [addresses, setAddresses] = useState<ContractAddresses>({});

    useEffect(() => {
        fetchSuggestions().then(setSuggestions).catch(() => { });
        fetchBlockchainAddresses().then(setAddresses).catch(() => { });
    }, []);

    const agents = liveData?.agents ?? [];
    const disruptions = liveData?.disruptions ?? {};
    const perfHistory = liveData?.performanceHistory ?? [];
    const step = liveData?.step ?? 0;

    return (
        <div className="min-h-screen bg-[#080C14] text-white font-sans">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-white/10 bg-[#080C14]/80 backdrop-blur-md px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img src="/symbios-icon.svg" alt="SymbiOS" className="w-7 h-7" />
                    <span className="text-lg font-bold tracking-tight">SymbiOS</span>
                    <span className="text-[10px] font-mono bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full">LIVE DASHBOARD</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" />Guindy Industrial Park</span>
                </div>
            </header>

            <div className="p-4 lg:p-6">
                {/* Connection Status */}
                <StatusBar state={wsState} step={step} onReconnect={reconnect} />

                {/* 3-Column Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-4 h-[calc(100vh-130px)]">

                    {/* LEFT: Agent Status Cards */}
                    <div className="flex flex-col gap-3 overflow-y-auto">
                        <h3 className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-widest">Factory Agents</h3>
                        {agents.length === 0 ? (
                            <div className="flex items-center justify-center h-40 text-slate-500 text-xs font-mono">
                                {wsState === 'connecting' ? 'Connecting to simulation…' : 'No data yet'}
                            </div>
                        ) : (
                            agents.map((agent) => <AgentCard key={agent.id} agent={agent} />)
                        )}
                    </div>

                    {/* CENTER: Network Graph + Performance Chart */}
                    <div className="flex flex-col gap-4">
                        <div className="flex-1">
                            <NetworkGraph agents={agents} disruptions={disruptions} />
                        </div>
                        <PerfChart data={perfHistory} />
                    </div>

                    {/* RIGHT: Suggestions + Blockchain */}
                    <div className="flex flex-col gap-4 overflow-y-auto">
                        <div>
                            <h3 className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-widest mb-3">
                                GenAI Suggestions
                            </h3>
                            {suggestions.length === 0 ? (
                                <p className="text-xs text-slate-500 font-mono">Loading suggestions…</p>
                            ) : (
                                <div className="space-y-2">
                                    {suggestions.map((s, i) => <SuggestionCard key={i} s={s} />)}
                                </div>
                            )}
                        </div>
                        <BlockchainPanel addresses={addresses} />
                    </div>
                </div>
            </div>
        </div>
    );
}
