import { useSimulation, type WSState } from '@/hooks/useWebSocket';
import { Wifi, WifiOff, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip,
} from 'recharts';

function StatusIndicator({ state }: { state: WSState }) {
  const config: Record<WSState, { icon: typeof Wifi; label: string; cls: string }> = {
    open: { icon: Wifi, label: 'Connected', cls: 'text-glow-green' },
    connecting: { icon: Loader2, label: 'Connecting…', cls: 'text-glow-orange animate-spin' },
    closed: { icon: WifiOff, label: 'Offline', cls: 'text-muted-foreground' },
    error: { icon: AlertCircle, label: 'Error', cls: 'text-destructive' },
  };
  const c = config[state];
  return (
    <div className="flex items-center gap-2 text-xs font-mono font-medium">
      <c.icon className={`w-4 h-4 ${c.cls}`} />
      <span className={c.cls}>{c.label}</span>
    </div>
  );
}

function OfflineOverlay({ onReconnect }: { onReconnect: () => void }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/85 backdrop-blur-sm rounded-2xl">
      <WifiOff className="w-10 h-10 text-muted-foreground mb-4" />
      <p className="text-foreground font-semibold mb-1">Simulation Offline</p>
      <p className="text-sm text-muted-foreground mb-5">
        Backend at ws://localhost:8000 is unreachable
      </p>
      <button
        onClick={onReconnect}
        className="gradient-btn !px-5 !py-2.5 text-sm inline-flex items-center gap-2 rounded-xl"
      >
        <RefreshCw className="w-4 h-4" />
        Reconnect
      </button>
    </div>
  );
}

function NetworkPanel({ data }: { data: any }) {
  const nodes = [
    { cx: 80, cy: 50, name: 'SteelCo', color: 'hsl(185,75%,48%)' },
    { cx: 200, cy: 50, name: 'ChemCorp', color: 'hsl(160,65%,45%)' },
    { cx: 140, cy: 140, name: 'CementWorks', color: 'hsl(200,70%,55%)' },
  ];
  const weights = data?.attentionWeights || [];

  return (
    <div className="glass-card p-5 h-full">
      <h4 className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-widest mb-4">
        Network View
      </h4>
      <svg viewBox="0 0 280 180" className="w-full">
        <defs>
          <linearGradient id="net-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(185,75%,48%)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="hsl(160,65%,45%)" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        {nodes.map((a, i) =>
          nodes.slice(i + 1).map((b, j) => {
            const w = weights.find(
              (wt: any) => (wt.from === a.name && wt.to === b.name) || (wt.from === b.name && wt.to === a.name)
            );
            return (
              <line
                key={`${i}-${j}`}
                x1={a.cx} y1={a.cy} x2={b.cx} y2={b.cy}
                stroke="url(#net-grad)"
                strokeWidth={w ? w.weight * 3 : 0.5}
                strokeOpacity={w ? 0.7 : 0.15}
              />
            );
          })
        )}
        {nodes.map((n, i) => (
          <g key={i}>
            <circle cx={n.cx} cy={n.cy} r="16" fill="hsl(220,25%,8%)" stroke={n.color} strokeWidth="1" strokeOpacity="0.5" />
            <text x={n.cx} y={n.cy + 30} textAnchor="middle" fill="hsl(210,20%,70%)" fontSize="9" fontFamily="JetBrains Mono, monospace">
              {n.name}
            </text>
            <circle cx={n.cx} cy={n.cy} r="4" fill={n.color} className="animate-node-pulse" style={{ animationDelay: `${i * 0.8}s` }} />
          </g>
        ))}
      </svg>
    </div>
  );
}

function AgentPanel({ data }: { data: any }) {
  const agents = data?.agents || [];
  return (
    <div className="glass-card p-5 h-full">
      <h4 className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-widest mb-4">
        Agent States
      </h4>
      {agents.length === 0 ? (
        <p className="text-sm text-muted-foreground">No agent data</p>
      ) : (
        <div className="space-y-3">
          {agents.map((a: any) => (
            <div key={a.id} className="p-3 rounded-xl bg-secondary/30 border border-border/30">
              <p className="text-sm font-medium text-foreground">{a.name}</p>
              <div className="flex gap-4 mt-1 text-xs font-mono text-muted-foreground">
                <span>Cash: ${a.cash?.toLocaleString()}</span>
                <span>Production: {a.production}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TransactionPanel({ data }: { data: any }) {
  const txns = data?.transactions || [];
  return (
    <div className="glass-card p-5 h-full">
      <h4 className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-widest mb-4">
        Transaction Log
      </h4>
      <ScrollArea className="h-40">
        {txns.length === 0 ? (
          <p className="text-sm text-muted-foreground">No transactions</p>
        ) : (
          <div className="space-y-2 pr-3">
            {txns.map((t: any) => (
              <div key={t.id} className="text-xs font-mono border-l-2 border-primary/30 pl-3 py-1">
                <span className="text-muted-foreground">{t.timestamp}</span>
                <p className="text-foreground">{t.from} → {t.to}: {t.message}</p>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function PerformancePanel({ data }: { data: any }) {
  const points = data?.performance || [];
  return (
    <div className="glass-card p-5 h-full">
      <h4 className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-widest mb-4">
        Performance Metrics
      </h4>
      {points.length === 0 ? (
        <p className="text-sm text-muted-foreground">No performance data</p>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={points}>
            <XAxis dataKey="step" tick={{ fontSize: 10, fill: 'hsl(215,12%,48%)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(215,12%,48%)' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: 'hsl(220,25%,8%)',
                border: '1px solid hsl(220,18%,14%)',
                borderRadius: '12px',
                fontSize: '12px',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            />
            <Line type="monotone" dataKey="reward" stroke="hsl(185,75%,48%)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="efficiency" stroke="hsl(160,65%,45%)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default function DashboardSection() {
  const { wsState: state, liveData, reconnect } = useSimulation();
  const data = liveData; // keep existing panels working
  const isOffline = state === 'closed' || state === 'error';

  return (
    <section id="demo" className="py-28">
      <div className="section-container">
        <div className="mb-10">
          <p className="section-label">
            <span className="gradient-text-subtle">Live System</span>
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
            Real-Time <span className="gradient-text">Command Center</span>
          </h2>
          <div className="mt-4">
            <StatusIndicator state={state} />
          </div>
        </div>

        <div className="relative rounded-2xl border border-border/40 bg-card/20 p-4 sm:p-6">
          {isOffline && <OfflineOverlay onReconnect={reconnect} />}

          <div className="grid md:grid-cols-2 gap-4">
            <NetworkPanel data={data} />
            <AgentPanel data={data} />
            <TransactionPanel data={data} />
            <PerformancePanel data={data} />
          </div>

          {data && (
            <div className="mt-4 flex gap-4 text-xs text-muted-foreground font-mono">
              <span>Episode: 1</span>
              <span>Step: {data.step}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
