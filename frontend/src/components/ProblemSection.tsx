import { Brain, BarChart3, Shield, Sparkles, TrendingUp, Leaf } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'MARL Engine',
    description: 'Autonomous agents learn cooperative strategies through multi-agent reinforcement learning with emergent bargaining.',
    accentColor: 'hsl(185,75%,48%)',
    span: 'lg:col-span-2',
  },
  {
    icon: BarChart3,
    title: 'Attention Viz',
    description: 'Transformer-based communication visualized in real-time across agent negotiations.',
    accentColor: 'hsl(200,70%,55%)',
    span: '',
  },
  {
    icon: Leaf,
    title: 'Carbon Track',
    description: 'Soulbound tokens for tracking waste reduction and sustainable resource utilization.',
    accentColor: 'hsl(142,65%,50%)',
    span: '',
  },
  {
    icon: Shield,
    title: 'Smart Contracts',
    description: 'Solidity-based escrow ensures transparent, tamper-proof settlement of resource exchanges on-chain.',
    accentColor: 'hsl(160,65%,50%)',
    span: 'lg:col-span-2',
  },
  {
    icon: Sparkles,
    title: 'GenAI Layer',
    description: 'LLM-powered recommendations via Ollama / RAG for context-aware trade suggestions.',
    accentColor: 'hsl(38,90%,55%)',
    span: '',
  },
  {
    icon: TrendingUp,
    title: 'Dynamic Pricing',
    description: 'Real-time market dynamics driven by supply-demand curves from multi-agent interactions.',
    accentColor: 'hsl(45,80%,55%)',
    span: '',
  },
];

export default function ProblemSection() {
  return (
    <section id="problem" className="py-28">
      <div className="section-container">
        {/* Split header with vertical line */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-0 mb-16">
          <div className="lg:flex-1">
            <p className="section-label">
              <span className="gradient-text-subtle">Core Technology</span>
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
              Six Pillars of{' '}
              <span className="gradient-text">Industrial<br className="hidden sm:block" /> Symbiosis</span>
            </h2>
          </div>
          <div className="hidden lg:block w-px bg-primary/20 mx-10 self-stretch" />
          <p className="lg:flex-1 text-sm text-muted-foreground leading-relaxed lg:pt-12 max-w-md">
            Advanced multi-agent systems built to reshape the future of industrial resource management through cutting-edge AI and blockchain infrastructure.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {features.map((f, i) => {
            const Icon = f.icon;
            const isWide = f.span.includes('col-span-2');
            return (
              <div
                key={i}
                className={`group relative rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-primary/20 ${f.span} ${isWide ? 'p-7' : 'p-5 sm:p-6'}`}
              >
                {/* Top accent line */}
                <div
                  className="absolute top-0 left-0 right-0 h-px opacity-40 group-hover:opacity-80 transition-opacity"
                  style={{ background: `linear-gradient(90deg, ${f.accentColor}, transparent)` }}
                />

                {/* Abstract decorative SVG */}
                <div className="absolute top-4 right-4 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity">
                  <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                    <circle cx="40" cy="40" r="30" stroke={f.accentColor} strokeWidth="0.5" />
                    <circle cx="40" cy="40" r="18" stroke={f.accentColor} strokeWidth="0.5" />
                    <line x1="10" y1="40" x2="70" y2="40" stroke={f.accentColor} strokeWidth="0.3" />
                    <line x1="40" y1="10" x2="40" y2="70" stroke={f.accentColor} strokeWidth="0.3" />
                  </svg>
                </div>

                <div
                  className={`${isWide ? 'w-12 h-12' : 'w-10 h-10'} rounded-xl flex items-center justify-center mb-4`}
                  style={{ background: `${f.accentColor}12` }}
                >
                  <Icon className={`${isWide ? 'w-5 h-5' : 'w-4 h-4'}`} style={{ color: f.accentColor }} />
                </div>
                <h3 className={`${isWide ? 'text-base' : 'text-sm'} font-bold text-foreground mb-2`}>
                  {f.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {f.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
