import { useState, useEffect } from 'react';
import { ArrowRight, Menu, X, Github } from 'lucide-react';

const navLinks = [
  { label: 'Features', href: '#problem' },
  { label: 'How It Works', href: '#approach' },
  { label: 'Dashboard', href: '#demo' },
  { label: 'Tech Stack', href: '#specs' },
  { label: 'Research', href: '#research' },
  { label: 'Roadmap', href: '#roadmap' },
];


export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
        ? 'bg-background/80 backdrop-blur-xl border-b border-border/40'
        : 'bg-transparent'
        }`}
    >
      <div className="w-full px-6 flex items-center justify-between h-16">
        <a href="#" className="flex items-center gap-3 group hover:opacity-80 transition-opacity">
          <img src="/symbios-icon.svg" alt="SymbiOS Logo" className="w-7 h-7" />
          <span className="font-bold text-lg tracking-tight text-white font-sans">
            SymbiOS
          </span>
        </a>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200 rounded-lg hover:bg-white/5"
            >
              {link.label}
            </a>
          ))}
          <a
            href="https://github.com/Ritinpaul/symbios-core"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-slate-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/5"
          >
            <Github className="w-5 h-5" />
          </a>
          <a
            href="/dashboard"
            className="ml-3 gradient-btn text-xs !px-4 !py-2 rounded-xl inline-flex items-center gap-2"
          >
            Live Dashboard
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-t border-border/40 px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-xl transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#demo"
            onClick={() => setMobileOpen(false)}
            className="block gradient-btn text-center text-sm rounded-xl mt-2"
          >
            Launch Dashboard
          </a>
        </div>
      )}
    </nav>
  );
}
