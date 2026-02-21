export default function Footer() {
  return (
    <footer className="border-t border-border/50 py-8">
      <div className="section-container flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="12" stroke="url(#ft-grad)" strokeWidth="1.5" fill="none" />
            <circle cx="14" cy="14" r="7" stroke="url(#ft-grad)" strokeWidth="1.5" fill="none" opacity="0.6" />
            <circle cx="14" cy="14" r="2.5" fill="url(#ft-grad)" />
            <defs>
              <linearGradient id="ft-grad" x1="0" y1="0" x2="28" y2="28">
                <stop stopColor="hsl(185,75%,48%)" />
                <stop offset="1" stopColor="hsl(160,65%,45%)" />
              </linearGradient>
            </defs>
          </svg>
          <span className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} SymbiOS · MIT License
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">GitHub</a>
          <a href="#" className="hover:text-foreground transition-colors">Docs</a>
          <a href="#contact" className="hover:text-foreground transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  );
}
