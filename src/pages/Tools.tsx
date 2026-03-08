import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Braces, KeyRound, Fingerprint, Binary, QrCode, Globe, ShieldCheck,
  Regex, Link2, FileCode2, Hash, Palette, FileText, Clock, Mail, Search,
} from 'lucide-react';
import Navbar from '@/components/Navbar';

type ToolDef = {
  name: string;
  desc: string;
  path: string;
  icon: React.ElementType;
  category: 'CONVERTERS' | 'GENERATORS' | 'LOOKUP' | 'PRODUCTIVITY';
};

const TOOLS: ToolDef[] = [
  { name: 'JSON Formatter', desc: 'Format, minify & validate JSON data', path: '/tools/json', icon: Braces, category: 'CONVERTERS' },
  { name: 'Password Gen', desc: 'Generate secure random passwords', path: '/tools/password', icon: KeyRound, category: 'GENERATORS' },
  { name: 'UUID Generator', desc: 'Generate UUID v1/v4/v5 & NanoID', path: '/tools/uuid', icon: Fingerprint, category: 'GENERATORS' },
  { name: 'Base64', desc: 'Encode & decode Base64 text and images', path: '/tools/base64', icon: Binary, category: 'CONVERTERS' },
  { name: 'QR Code Gen', desc: 'Generate QR codes for URLs, WiFi & more', path: '/tools/qr', icon: QrCode, category: 'GENERATORS' },
  { name: 'IP Lookup', desc: 'Lookup IP address geolocation data', path: '/tools/ip', icon: Globe, category: 'LOOKUP' },
  { name: 'JWT Decoder', desc: 'Decode & verify JSON Web Tokens', path: '/tools/jwt', icon: ShieldCheck, category: 'CONVERTERS' },
  { name: 'Regex Tester', desc: 'Test regular expressions with live matching', path: '/tools/regex', icon: Regex, category: 'PRODUCTIVITY' },
  { name: 'URL Shortener', desc: 'Shorten long URLs with custom aliases', path: '/tools/url-short', icon: Link2, category: 'GENERATORS' },
  { name: 'Pastebin', desc: 'Share code snippets with syntax highlighting', path: '/tools/paste', icon: FileCode2, category: 'PRODUCTIVITY' },
  { name: 'Hash Generator', desc: 'Compute MD5, SHA-1, SHA-256+ hashes', path: '/tools/hash', icon: Hash, category: 'CONVERTERS' },
  { name: 'Color Tools', desc: 'Convert colors, generate palettes, check contrast', path: '/tools/color', icon: Palette, category: 'CONVERTERS' },
  { name: 'Markdown Editor', desc: 'Write & preview Markdown in real-time', path: '/tools/markdown', icon: FileText, category: 'PRODUCTIVITY' },
  { name: 'Cron Explainer', desc: 'Parse & build cron expressions visually', path: '/tools/cron', icon: Clock, category: 'PRODUCTIVITY' },
  { name: 'Temp Mail', desc: 'Disposable inbox — auto-expires on refresh', path: '/tools/tempmail', icon: Mail, category: 'PRODUCTIVITY' },
];

const CATEGORIES = ['ALL', 'CONVERTERS', 'GENERATORS', 'LOOKUP', 'PRODUCTIVITY'] as const;

const Tools = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('ALL');

  const filtered = useMemo(() => {
    return TOOLS.filter((t) => {
      const matchCat = category === 'ALL' || t.category === category;
      const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.desc.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [search, category]);

  return (
    <div className="min-h-screen crt-overlay noise-overlay">
      <Navbar />
      <div className="relative z-10 pt-20 px-4 md:px-6 max-w-7xl mx-auto pb-24">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="section-title">{"> TOOLS.exe"}</h1>
          <p className="section-subtitle">{"// Developer utilities — free to use, forever"}</p>

          {/* Search */}
          <div className="relative max-w-md mb-6">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tools..."
              className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-primary/15 rounded font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
            />
          </div>

          {/* Category tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`font-mono text-xs px-3 py-1.5 rounded border transition-all ${
                  category === c
                    ? 'border-primary bg-primary/10 text-primary neon-glow-green'
                    : 'border-primary/15 text-muted-foreground hover:text-primary hover:border-primary/40'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tool, i) => (
            <motion.div
              key={tool.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
            >
              <Link
                to={tool.path}
                className="block glass-card glass-card-hover rounded-lg p-5 group transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-3">
                  <tool.icon size={22} className="text-primary" />
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-primary/30 text-primary">FREE</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-secondary/30 text-secondary">
                      {tool.category}
                    </span>
                  </div>
                </div>
                <h3 className="font-display text-sm text-foreground mb-1 group-hover:text-primary transition-colors">
                  {tool.name}
                </h3>
                <p className="font-mono text-xs text-muted-foreground mb-4">{tool.desc}</p>
                <span className="font-mono text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  [_OPEN] →
                </span>
              </Link>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="font-mono text-sm text-muted-foreground">
              {"> No tools found matching query..."}
              <span className="blink text-primary ml-1">█</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tools;
