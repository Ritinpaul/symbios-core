import { useState, useEffect } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'Features', href: '#problem' },
  { label: 'How It Works', href: '#approach' },
  { label: 'Dashboard', href: '#demo' },
  { label: 'Tech Stack', href: '#specs' },
  { label: 'Research', href: '#research' },
  { label: 'Roadmap', href: '#roadmap' },
];

function Logo() {
  return (
    <svg width="24" height="24" viewBox="0 0 28 28" fill="none" className="transition-transform duration-500 group-hover:rotate-180">
      <circle cx="14" cy="14" r="12" stroke="url(#logo-grad)" strokeWidth="1.5" fill="none" />
      <circle cx="14" cy="14" r="7" stroke="url(#logo-grad)" strokeWidth="1.5" fill="none" opacity="0.6" />
      <circle cx="14" cy="14" r="2.5" fill="url(#logo-grad)" />
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="28" y2="28">
          <stop stopColor="hsl(185,75%,48%)" />
          <stop offset="1" stopColor="hsl(160,65%,45%)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

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
      <div className="section-container flex items-center justify-between h-16">
        <a href="#" className="flex items-center gap-2.5 group">
          <Logo />
          <span className="font-bold text-base tracking-tight text-foreground font-mono">
            SYMBI<span className="gradient-text-subtle">OS</span>
          </span>
        </a>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 rounded-lg hover:bg-secondary/50"
            >
              {link.label}
            </a>
          ))}
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
