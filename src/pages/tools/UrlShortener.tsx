import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import { useCopy } from '@/lib/copy';
import { db } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';

const randCode = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const isValidUrl = (s: string) => {
  try { new URL(s); return true; } catch { return false; }
};

type ShortLink = { code: string; original: string; clicks: number };

const UrlShortener = () => {
  const [url, setUrl] = useState('');
  const [alias, setAlias] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ShortLink | null>(null);
  const [recent, setRecent] = useState<ShortLink[]>([]);
  const [error, setError] = useState('');
  const { copied, copy } = useCopy();
  const { toast } = useToast();

  const shorten = async () => {
    if (!isValidUrl(url)) { setError('// INVALID URL FORMAT'); return; }
    setLoading(true);
    setError('');
    const code = alias.trim() || randCode();
    if (alias && (alias.length < 3 || alias.length > 20 || !/^[a-zA-Z0-9-]+$/.test(alias))) {
      setError('// ALIAS MUST BE 3-20 ALPHANUMERIC CHARS');
      setLoading(false);
      return;
    }

    const { data, error: dbErr } = await db('url_shortener').insert({ original_url: url, short_code: code }).select().single();
    if (dbErr) {
      setError(dbErr.code === '23505' ? '// ALIAS ALREADY TAKEN' : `// ERROR: ${dbErr.message}`);
      setLoading(false);
      return;
    }

    const link: ShortLink = { code: data.short_code, original: data.original_url, clicks: 0 };
    setResult(link);
    setRecent((r) => [link, ...r.filter((l) => l.code !== link.code)].slice(0, 5));
    setLoading(false);
    toast({ title: '// URL SHORTENED' });
  };

  const shortUrl = (code: string) => `${window.location.origin}/s/${code}`;

  return (
    <ToolLayout title='> URL_SHORT.exe' subtitle="// Shorten long URLs with custom aliases">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="glass-card rounded-lg p-5 space-y-3">
          <div>
            <label className="font-mono text-xs text-muted-foreground block mb-1">LONG URL</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/very-long-url..."
              className="w-full bg-muted border border-primary/15 rounded px-3 py-2.5 font-mono text-sm text-foreground focus:outline-none focus:border-primary/40"
            />
          </div>
          <div>
            <label className="font-mono text-xs text-muted-foreground block mb-1">CUSTOM ALIAS (optional)</label>
            <input
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="my-link"
              className="w-full bg-muted border border-primary/15 rounded px-3 py-2.5 font-mono text-sm text-foreground focus:outline-none focus:border-primary/40"
            />
          </div>
          {error && <p className="font-mono text-xs text-accent neon-text-pink">{error}</p>}
          <button onClick={shorten} disabled={loading} className="w-full btn-neon-green py-2.5 rounded font-display text-sm">
            {loading ? '// SHORTENING...' : '[_SHORTEN]'}
          </button>
        </div>

        {result && (
          <div className="glass-card rounded-lg p-5 neon-glow-green">
            <p className="font-mono text-xs text-muted-foreground mb-2">// SHORT URL</p>
            <div className="flex items-center gap-3">
              <code className="flex-1 font-mono text-lg text-primary neon-text-green break-all">{shortUrl(result.code)}</code>
              <button onClick={() => copy(shortUrl(result.code))} className="btn-neon-green text-xs py-1.5 px-3 rounded shrink-0">
                {copied ? '[✓ COPIED]' : '[_COPY]'}
              </button>
              <a href={shortUrl(result.code)} target="_blank" rel="noopener noreferrer" className="btn-neon-blue text-xs py-1.5 px-3 rounded flex items-center gap-1">
                <ExternalLink size={12} />[_OPEN]
              </a>
            </div>
          </div>
        )}

        {recent.length > 0 && (
          <div className="glass-card rounded-lg p-5 space-y-3">
            <h3 className="font-display text-xs text-foreground">RECENT LINKS</h3>
            {recent.map((l) => (
              <div key={l.code} className="flex items-center justify-between py-2 border-b border-primary/10">
                <div className="min-w-0">
                  <code className="font-mono text-xs text-primary">/s/{l.code}</code>
                  <p className="font-mono text-[10px] text-muted-foreground truncate">{l.original}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export default UrlShortener;
