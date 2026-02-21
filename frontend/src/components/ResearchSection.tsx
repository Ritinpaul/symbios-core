import { BookOpen, FileText, ExternalLink } from 'lucide-react';

export default function ResearchSection() {
  return (
    <section id="research" className="py-28">
      <div className="section-container">
        <div className="mb-14">
          <p className="section-label">
            <span className="gradient-text-subtle">Proven By</span>
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
            Research & <span className="gradient-text">Validation</span>
          </h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          <div className="glass-card-hover p-7">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-foreground font-semibold mb-2">Prior Work</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Based on Lowe et al.,{' '}
                  <em>"Multi-Agent Actor-Critic for Mixed Cooperative-Competitive Environments"</em>
                  {' '}(NeurIPS 2017). Extended with transformer-based communication channels
                  and smart contract settlement layers.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card-hover p-7">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-foreground font-semibold mb-2">Evaluation Methodology</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Systems are evaluated on episode return convergence, resource allocation
                  efficiency (Pareto optimality gap), and inter-agent coordination stability
                  over 10,000+ training episodes.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-7 border-primary/20">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-glow-green/10 flex items-center justify-center shrink-0">
                <ExternalLink className="w-5 h-5 text-glow-green" />
              </div>
              <div>
                <p className="text-sm text-foreground font-semibold mb-2">Documentation Status</p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  Technical documentation in preparation. Preliminary results available
                  upon request.
                </p>
                <div className="flex gap-3">
                  <a href="#" className="text-xs font-mono text-primary hover:underline">arXiv (coming soon)</a>
                  <a href="#" className="text-xs font-mono text-accent hover:underline">GitHub Repository</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
