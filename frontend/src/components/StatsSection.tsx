const stats = [
  {
    value: '10K+',
    label: 'Episodes Trained',
    bg: 'bg-primary/10',
    valueCls: 'text-primary',
    span: 'col-span-2',
  },
  {
    value: '3',
    label: 'Active Agents',
    bg: 'bg-glow-orange/10',
    valueCls: 'text-glow-orange',
    span: '',
  },
  {
    value: 'High',
    label: 'Allocation Efficiency',
    bg: 'bg-glow-green/10',
    valueCls: 'text-glow-green',
    span: '',
  },
  {
    value: '55%',
    label: 'Roadmap Complete',
    bg: 'bg-accent/10',
    valueCls: 'text-accent',
    span: 'col-span-2',
  },
];

export default function StatsSection() {
  return (
    <section className="pb-24">
      <div className="section-container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((s, i) => (
            <div
              key={i}
              className={`${s.bg} rounded-2xl p-6 sm:p-8 border border-border/20 ${s.span}`}
            >
              <p className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-mono ${s.valueCls}`}>
                {s.value}
              </p>
              <p className="text-xs text-muted-foreground mt-2 font-mono font-medium uppercase tracking-wider">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
