import { Radio, Brain, Shield, Zap } from 'lucide-react';

const steps = [
  {
    icon: Radio,
    title: 'Assess Needs',
    desc: 'IoT sensors monitor resource levels, waste streams, and production capacity across factory nodes.',
    color: 'hsl(185,75%,48%)',
  },
  {
    icon: Brain,
    title: 'AI Negotiation',
    desc: 'PPO-trained agents with transformer attention discover optimal resource exchanges autonomously.',
    color: 'hsl(200,70%,55%)',
  },
  {
    icon: Shield,
    title: 'Secure & Verify',
    desc: 'Smart contracts on blockchain execute trades, ensuring verifiable and immutable settlement.',
    color: 'hsl(160,65%,50%)',
  },
  {
    icon: Zap,
    title: 'Optimize Flow',
    desc: 'Optimized resources flow between factories, reducing waste and creating measurable value.',
    color: 'hsl(38,90%,55%)',
  },
];

export default function ApproachSection() {
  return (
    <section id="approach" className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/10 to-background pointer-events-none" />

      <div className="section-container relative z-10">
        <div className="mb-14">
          <p className="section-label">
            <span className="gradient-text-subtle">How It Works</span>
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
            The <span className="gradient-text">Process</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {steps.map((s, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm p-6 sm:p-7 group hover:border-primary/20 transition-all duration-300"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: `${s.color}12` }}
              >
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">
                0{i + 1}
              </p>
              <h3 className="text-sm font-bold text-foreground mb-2">{s.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
