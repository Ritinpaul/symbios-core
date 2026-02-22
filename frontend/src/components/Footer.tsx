export default function Footer() {
  return (
    <footer className="border-t border-border/50 py-8 bg-[#080C14]">
      <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <img src="/symbios-icon.svg" alt="SymbiOS Logo" className="w-5 h-5 opacity-80 mix-blend-screen" />
          <span className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} SymbiOS · MIT License
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <a href="https://github.com/Ritinpaul/symbios-core" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
          <a href="#" className="hover:text-foreground transition-colors">Docs</a>
          <a href="#contact" className="hover:text-foreground transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  );
}
