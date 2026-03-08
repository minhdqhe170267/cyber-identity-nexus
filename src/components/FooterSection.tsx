import { Github, Linkedin, Twitter } from 'lucide-react';

const FooterSection = () => (
  <footer className="border-t border-primary/20 py-6 px-6">
    <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="font-mono text-xs text-muted-foreground">
        {"// NETRUNNER © 2025 — Built with blood, coffee & TypeScript"}
      </p>
      <div className="flex gap-3">
        {[Github, Linkedin, Twitter].map((Icon, i) => (
          <a key={i} href="#" className="text-muted-foreground hover:text-primary transition-colors">
            <Icon size={14} />
          </a>
        ))}
      </div>
    </div>
  </footer>
);

export default FooterSection;
