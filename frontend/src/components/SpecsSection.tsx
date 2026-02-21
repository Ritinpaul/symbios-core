const techs = [
  { name: 'MARL Engine', detail: 'PyTorch + RLlib', status: 'running' as const, color: 'hsl(185,75%,48%)' },
  { name: 'Transformer Attention', detail: 'Custom mechanism', status: 'running' as const, color: 'hsl(200,70%,55%)' },
  { name: 'Solidity Contracts', detail: 'Hardhat testnet', status: 'testnet' as const, color: 'hsl(160,65%,50%)' },
  { name: 'IoT Oracles', detail: 'MQTT (simulated)', status: 'mock' as const, color: 'hsl(142,65%,50%)' },
  { name: 'Ollama / RAG', detail: 'LLM suggestions', status: 'running' as const, color: 'hsl(38,90%,55%)' },
  { name: 'Soulbound Tokens', detail: 'Carbon credits', status: 'testnet' as const, color: 'hsl(45,80%,55%)' },
  { name: 'React + Canvas', detail: 'Dashboard UI', status: 'running' as const, color: 'hsl(200,80%,60%)' },
  { name: 'Recharts', detail: 'Live metrics', status: 'running' as const, color: 'hsl(185,80%,55%)' },
];

const statusConfig = {
  running: { label: 'Active', dotColor: 'bg-glow-green' },
  testnet: { label: 'Testnet', dotColor: 'bg-glow-orange' },
  mock: { label: 'Mock', dotColor: 'bg-muted-foreground' },
};

export default function SpecsSection() {
  return (
    <section id="specs" className="py-28 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/10 to-background pointer-events-none" />
      <div className="section-container relative z-10">
        <div className="mb-14">
          <p className="section-label">
            <span className="gradient-text-subtle">Built With</span>
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
            The <span className="gradient-text">Technology Stack</span>
          </h2>
        </div>

        <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
          {techs.map((t, i) => {
            const st = statusConfig[t.status];
            return (
              <div
                key={i}
                className="glass-card-hover px-5 py-3 flex items-center gap-3 group cursor-default"
              >
                <span className={`w-2 h-2 rounded-full ${st.dotColor} shrink-0`} />
                <div>
                  <span className="text-sm font-medium text-foreground">{t.name}</span>
                  <span className="text-xs font-mono text-muted-foreground ml-2 hidden sm:inline">
                    {t.detail}
                  </span>
                </div>
                <span
                  className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full ml-1"
                  style={{ background: `${t.color}15`, color: t.color }}
                >
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
