import { Rocket, Users, Globe, Wrench } from 'lucide-react';

const milestones = [
  {
    icon: Rocket,
    title: 'Core Launch',
    desc: 'Deploy core MARL engine and 3-agent simulation environment with basic smart contracts.',
    status: 'done' as const,
    color: 'hsl(185,75%,48%)',
  },
  {
    icon: Users,
    title: 'Agent Expansion',
    desc: 'Attention visualization, WebSocket streaming, and full dashboard UI for real-time monitoring.',
    status: 'active' as const,
    color: 'hsl(160,65%,50%)',
  },
  {
    icon: Globe,
    title: 'Global Scale',
    desc: 'Scale to cross-regional multi-factory pilot with distributed ledger infrastructure.',
    status: 'upcoming' as const,
    color: 'hsl(200,70%,55%)',
  },
  {
    icon: Wrench,
    title: 'Production Tools',
    desc: 'Physical IoT integration, mainnet evaluation, and enterprise-grade monitoring dashboards.',
    status: 'upcoming' as const,
    color: 'hsl(38,90%,55%)',
  },
];

const statusLabel = {
  done: 'Completed',
  active: 'In Progress',
  upcoming: 'Upcoming',
};

export default function RoadmapSection() {
  return (
    <section id="roadmap" className="py-28 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/10 to-background pointer-events-none" />
      <div className="section-container relative z-10">
        <div className="mb-14">
          <p className="section-label">
            <span className="gradient-text-subtle">Timeline</span>
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
            System <span className="gradient-text">Roadmap</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 items-start">
          {/* Left: milestones with ghost numbers */}
          <div className="lg:col-span-3 space-y-0">
            {milestones.map((m, i) => (
              <div
                key={i}
                className="relative flex items-start gap-5 p-6 border-b border-border/20 last:border-b-0 group"
              >
                {/* Ghost number */}
                <span className="absolute top-4 right-4 text-6xl font-extrabold font-mono text-foreground/[0.03] select-none leading-none">
                  0{i + 1}
                </span>

                {/* Icon circle */}
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: `${m.color}15` }}
                >
                  <m.icon className="w-4.5 h-4.5" style={{ color: m.color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-base font-bold text-foreground">{m.title}</h3>
                    <span
                      className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full"
                      style={{ background: `${m.color}12`, color: m.color }}
                    >
                      {statusLabel[m.status]}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {m.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Right: decorative network SVG + progress */}
          <div className="lg:col-span-2 space-y-6">
            {/* Network illustration */}
            <div className="rounded-2xl border border-border/30 bg-card/30 p-6 flex items-center justify-center">
              <svg viewBox="0 0 200 200" className="w-full max-w-[200px]">
                <defs>
                  <linearGradient id="road-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(185,75%,48%)" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="hsl(160,65%,45%)" stopOpacity="0.4" />
                  </linearGradient>
                </defs>
                {/* Connection lines */}
                <line x1="60" y1="50" x2="140" y2="50" stroke="url(#road-grad)" strokeWidth="1" />
                <line x1="140" y1="50" x2="140" y2="140" stroke="url(#road-grad)" strokeWidth="1" />
                <line x1="60" y1="50" x2="60" y2="140" stroke="url(#road-grad)" strokeWidth="1" />
                <line x1="60" y1="140" x2="140" y2="140" stroke="url(#road-grad)" strokeWidth="1" />
                <line x1="60" y1="50" x2="140" y2="140" stroke="url(#road-grad)" strokeWidth="0.5" strokeDasharray="4 4" />
                <line x1="140" y1="50" x2="60" y2="140" stroke="url(#road-grad)" strokeWidth="0.5" strokeDasharray="4 4" />
                {/* Nodes */}
                {[
                  { cx: 60, cy: 50, c: 'hsl(185,75%,48%)' },
                  { cx: 140, cy: 50, c: 'hsl(160,65%,50%)' },
                  { cx: 60, cy: 140, c: 'hsl(200,70%,55%)' },
                  { cx: 140, cy: 140, c: 'hsl(38,90%,55%)' },
                  { cx: 100, cy: 95, c: 'hsl(185,75%,48%)' },
                ].map((n, i) => (
                  <g key={i}>
                    <circle cx={n.cx} cy={n.cy} r="8" fill="hsl(220,25%,9%)" stroke={n.c} strokeWidth="1" />
                    <circle cx={n.cx} cy={n.cy} r="3" fill={n.c} className="animate-node-pulse" style={{ animationDelay: `${i * 0.6}s` }} />
                  </g>
                ))}
              </svg>
            </div>

            {/* Progress card */}
            <div className="rounded-2xl border border-border/30 bg-card/30 p-6">
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-foreground font-semibold">Overall Progress</span>
                <span className="text-primary font-bold font-mono">55%</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: '55%',
                    background: 'linear-gradient(90deg, hsl(185,75%,48%), hsl(160,65%,45%))',
                  }}
                />
              </div>
              <div className="grid grid-cols-3 gap-4 pt-5 mt-5 border-t border-border/20">
                <div>
                  <p className="text-xl font-extrabold text-primary font-mono">1</p>
                  <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Done</p>
                </div>
                <div>
                  <p className="text-xl font-extrabold text-accent font-mono">1</p>
                  <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Active</p>
                </div>
                <div>
                  <p className="text-xl font-extrabold text-muted-foreground font-mono">2</p>
                  <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Upcoming</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
