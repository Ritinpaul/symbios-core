import { ArrowRight } from 'lucide-react';

function SystemHealthPanel() {
  const agents = [
    { name: 'SteelCo', pct: 98, color: 'hsl(160,65%,45%)' },
    { name: 'ChemCorp', pct: 84, color: 'hsl(185,75%,48%)' },
    { name: 'CementWorks', pct: 42, color: 'hsl(38,90%,55%)' },
  ];

  return (
    <div className="glass-card p-5 w-56 animate-float-card" style={{ animationDelay: '0.5s' }}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-mono font-semibold tracking-widest text-muted-foreground uppercase">System Health</span>
        <span className="flex items-center gap-1.5 text-[10px] font-mono text-glow-green">
          <span className="w-1.5 h-1.5 rounded-full bg-glow-green animate-pulse" />
          ONLINE
        </span>
      </div>
      <div className="space-y-3">
        {agents.map((a) => (
          <div key={a.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-mono text-foreground/80">{a.name}</span>
              <span className="text-[10px] font-mono text-muted-foreground">{a.pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${a.pct}%`, background: a.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActiveNodesPanel() {
  return (
    <div className="glass-card p-5 w-48 animate-float-card" style={{ animationDelay: '1.5s' }}>
      <span className="text-[10px] font-mono font-semibold tracking-widest text-muted-foreground uppercase block mb-3">Active Nodes</span>
      <p className="text-3xl font-extrabold text-foreground tracking-tight font-mono">1,420</p>
      <p className="text-[10px] font-mono text-primary mt-1">CONNECTED</p>
      <svg className="w-full h-8 mt-3" viewBox="0 0 120 30">
        <polyline
          points="0,25 15,20 30,22 45,12 55,18 70,8 85,14 100,5 115,10 120,8"
          fill="none"
          stroke="hsl(185,75%,48%)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-sparkline"
          strokeDasharray="200"
        />
      </svg>
    </div>
  );
}

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center grain-overlay overflow-hidden">
      {/* Background glow orbs */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-primary/6 rounded-full blur-[150px]" />
      <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-accent/4 rounded-full blur-[120px]" />

      <div className="section-container relative z-10 py-32 w-full">
        <div className="flex flex-col items-center text-center relative">
          {/* Floating panels — desktop only */}
          <div className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4">
            <SystemHealthPanel />
          </div>
          <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-4">
            <ActiveNodesPanel />
          </div>

          {/* Center content */}
          <div
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-xs font-mono font-medium tracking-wider animate-float-up mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-glow-green animate-pulse" />
            <span className="text-primary">HACKATHON 2026</span>
            <span className="text-border">—</span>
            <span className="text-muted-foreground">LIVE PLATFORM</span>
          </div>

          <h1
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] text-foreground animate-float-up max-w-3xl"
            style={{ animationDelay: '0.1s' }}
          >
            SYMBI<span className="gradient-text">OS</span>{' '}
            <span className="block gradient-text">NETWORK</span>
          </h1>

          <p
            className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg mt-6 animate-float-up"
            style={{ animationDelay: '0.2s' }}
          >
            Decentralized reinforcement learning for autonomous industrial
            resource negotiation, trading, and optimization.
          </p>

          <div
            className="flex flex-wrap justify-center gap-4 mt-8 animate-float-up"
            style={{ animationDelay: '0.3s' }}
          >
            <a href="#demo" className="gradient-btn inline-flex items-center gap-2.5 rounded-xl">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
