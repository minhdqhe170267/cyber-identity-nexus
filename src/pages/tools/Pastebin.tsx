import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ToolLayout from '@/components/ToolLayout';
import { db } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';

const LANGUAGES = [
  'plaintext','javascript','typescript','python','rust','go','java','c','cpp','csharp',
  'html','css','scss','json','yaml','toml','xml','sql','bash','shell',
  'ruby','php','swift','kotlin','dart','lua','r','perl','haskell','elixir',
];

const EXPIRY_OPTIONS = [
  { label: 'Never', value: null },
  { label: '1 hour', value: 1 },
  { label: '24 hours', value: 24 },
  { label: '7 days', value: 168 },
  { label: '30 days', value: 720 },
];

const Pastebin = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState('plaintext');
  const [expiryHours, setExpiryHours] = useState<number | null>(null);
  const [visibility, setVisibility] = useState<'public' | 'unlisted'>('public');
  const [loading, setLoading] = useState(false);
  const [recentPastes, setRecentPastes] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    db('pastes')
      .select('id, title, language, views, created_at')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }: any) => { if (data) setRecentPastes(data); });
  }, []);

  const create = async () => {
    if (!content.trim()) { toast({ title: '// CONTENT REQUIRED', variant: 'destructive' }); return; }
    setLoading(true);
    const expires_at = expiryHours ? new Date(Date.now() + expiryHours * 3600000).toISOString() : null;
    const { data, error } = await db('pastes').insert({
      title: title.trim() || 'Untitled paste',
      content,
      language,
      visibility,
      expires_at,
    }).select().single();

    if (error) {
      toast({ title: `// ERROR: ${error.message}`, variant: 'destructive' });
      setLoading(false);
      return;
    }
    navigate(`/paste/${data.id}`);
  };

  return (
    <ToolLayout title='> PASTE.exe' subtitle="// Share code snippets with syntax highlighting">
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Editor */}
          <div className="flex-1 space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled paste"
              className="w-full bg-muted border border-primary/15 rounded px-3 py-2 font-mono text-sm text-foreground focus:outline-none"
            />
            <div className="flex gap-2 flex-wrap">
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="bg-muted border border-primary/15 rounded px-2 py-1.5 font-mono text-xs text-foreground focus:outline-none">
                {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              <select value={expiryHours ?? ''} onChange={(e) => setExpiryHours(e.target.value ? +e.target.value : null)} className="bg-muted border border-primary/15 rounded px-2 py-1.5 font-mono text-xs text-foreground focus:outline-none">
                {EXPIRY_OPTIONS.map((o) => <option key={o.label} value={o.value ?? ''}>{o.label}</option>)}
              </select>
              <div className="flex gap-1">
                {(['public', 'unlisted'] as const).map((v) => (
                  <button key={v} onClick={() => setVisibility(v)} className={`font-mono text-xs px-2 py-1.5 rounded border ${visibility === v ? 'border-primary text-primary' : 'border-primary/15 text-muted-foreground'}`}>
                    {v.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="glass-card rounded-lg overflow-hidden relative">
              <div className="absolute left-0 top-0 bottom-0 w-10 bg-muted/30 flex flex-col items-end pr-2 pt-4 font-mono text-[10px] text-muted-foreground select-none overflow-hidden">
                {(content || ' ').split('\n').map((_, i) => <div key={i} className="leading-5">{i + 1}</div>)}
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your code here..."
                className="w-full h-[400px] p-4 pl-12 bg-transparent font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none leading-5"
                spellCheck={false}
              />
            </div>
            <button onClick={create} disabled={loading} className="w-full btn-neon-green py-2.5 rounded font-display text-sm">
              {loading ? '// CREATING...' : '[_CREATE PASTE]'}
            </button>
          </div>

          {/* Recent pastes */}
          <div className="lg:w-80 glass-card rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 border-b border-primary/15">
              <span className="font-display text-xs text-primary">RECENT PASTES</span>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {recentPastes.length === 0 ? (
                <p className="p-4 font-mono text-xs text-muted-foreground">// No public pastes yet</p>
              ) : (
                recentPastes.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/paste/${p.id}`)}
                    className="w-full text-left p-3 border-b border-primary/10 hover:bg-primary/5 transition-colors"
                  >
                    <p className="font-mono text-xs text-foreground truncate">{p.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-[10px] px-1 rounded border border-secondary/30 text-secondary">{p.language}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{p.views} views</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};

export default Pastebin;
