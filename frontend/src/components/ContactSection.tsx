import { ArrowRight, Github, BookOpen, Mail, Video } from 'lucide-react';

const links = [
  { icon: Github, label: 'GitHub', href: 'https://github.com/Ritinpaul/symbios-core', target: '_blank', rel: 'noopener noreferrer' },
  { icon: BookOpen, label: 'Docs', href: '#' },
  { icon: Mail, label: 'Email', href: '#' },
  { icon: Video, label: 'Demo', href: 'https://drive.google.com/file/d/1XrNwnP4XEq4PA2zmYEDGA44X6lNbBGW8/view?usp=sharing', target: '_blank', rel: 'noopener noreferrer' },
];

export default function ContactSection() {
  return (
    <section id="contact" className="py-28 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/4 rounded-full blur-[150px]" />

      <div className="section-container relative z-10">
        <div className="rounded-3xl border border-border/30 bg-card/30 backdrop-blur-sm p-10 sm:p-16 text-center">
          <p className="text-[10px] font-mono font-semibold tracking-[0.3em] text-primary uppercase mb-6">Get Started</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground mb-4 leading-tight">
            Build Smarter{' '}
            <span className="gradient-text">Industry</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8 text-sm leading-relaxed">
            Design, optimize, and reshape your industrial resource systems with confidence.
          </p>

          <div className="flex justify-center mb-10">
            <a href="#demo" className="gradient-btn inline-flex items-center gap-2.5 rounded-xl text-sm">
              Get Started Now
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="flex justify-center gap-3">
            {links.map((l, i) => (
              <a
                key={i}
                href={l.href}
                target={l.target}
                rel={l.rel}
                className="w-11 h-11 rounded-xl bg-secondary/40 border border-border/30 flex items-center justify-center group hover:border-primary/25 transition-all duration-200"
                title={l.label}
              >
                <l.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
