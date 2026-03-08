import { useState, useEffect, useRef } from 'react';
import ToolLayout from '@/components/ToolLayout';
import { useCopy } from '@/lib/copy';

const b64decode = (str: string) => {
  try {
    const padded = str.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(padded));
  } catch { return null; }
};

const highlight = (json: string) =>
  json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = 'text-accent'; // number
      if (/^"/.test(match)) cls = /:$/.test(match) ? 'text-secondary' : 'text-primary';
      else if (/true|false/.test(match)) cls = 'text-orange-400';
      else if (/null/.test(match)) cls = 'text-red-400';
      return `<span class="${cls}">${match}</span>`;
    },
  );

const JwtDecoder = () => {
  const [token, setToken] = useState('');
  const [header, setHeader] = useState<any>(null);
  const [payload, setPayload] = useState<any>(null);
  const [sig, setSig] = useState('');
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const copyPayload = useCopy();

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (!token.trim()) { setHeader(null); setPayload(null); setSig(''); setError(''); return; }
      const parts = token.split('.');
      if (parts.length !== 3) { setError('// INVALID JWT FORMAT (expected 3 parts)'); setHeader(null); setPayload(null); return; }
      const h = b64decode(parts[0]);
      const p = b64decode(parts[1]);
      if (!h || !p) { setError('// FAILED TO DECODE JWT'); return; }
      setHeader(h);
      setPayload(p);
      setSig(parts[2]);
      setError('');
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [token]);

  const formatDate = (ts: number) => new Date(ts * 1000).toLocaleString();

  const isExpired = payload?.exp ? Date.now() / 1000 > payload.exp : false;

  const Panel = ({ title, data, badge }: { title: string; data: any; badge?: React.ReactNode }) => (
    <div className="glass-card rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-primary/15">
        <span className="font-display text-xs text-primary">{title}</span>
        {badge}
      </div>
      {data ? (
        <pre
          className="p-4 font-mono text-sm leading-6 overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: highlight(JSON.stringify(data, null, 2)) }}
        />
      ) : (
        <div className="p-4 font-mono text-xs text-muted-foreground">// No data</div>
      )}
    </div>
  );

  return (
    <ToolLayout title='> JWT_DECODER.exe' subtitle="// Decode & inspect JSON Web Tokens">
      <div className="space-y-6">
        <div className="glass-card rounded-lg p-4">
          <textarea
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste JWT token here..."
            className="w-full h-28 bg-transparent font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
            spellCheck={false}
          />
        </div>

        {error && <p className="font-mono text-sm text-accent neon-text-pink">{error}</p>}

        {header && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Panel
              title="HEADER"
              data={header}
              badge={header.alg && <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-secondary/20 text-secondary">{header.alg}</span>}
            />
            <div className="lg:col-span-1">
              <Panel
                title="PAYLOAD"
                data={payload}
                badge={
                  payload?.exp && (
                    <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${isExpired ? 'bg-accent/20 text-accent' : 'bg-primary/20 text-primary'}`}>
                      {isExpired ? 'EXPIRED' : 'VALID'}
                    </span>
                  )
                }
              />
              {payload && (
                <div className="mt-2 space-y-1">
                  {payload.exp && <p className="font-mono text-xs text-muted-foreground">exp: {formatDate(payload.exp)}</p>}
                  {payload.iat && <p className="font-mono text-xs text-muted-foreground">iat: {formatDate(payload.iat)}</p>}
                  {payload.nbf && <p className="font-mono text-xs text-muted-foreground">nbf: {formatDate(payload.nbf)}</p>}
                  <button onClick={() => copyPayload.copy(JSON.stringify(payload, null, 2))} className="btn-neon-green text-[10px] py-1 px-2 rounded mt-2">
                    {copyPayload.copied ? '[✓ COPIED]' : '[_COPY PAYLOAD]'}
                  </button>
                </div>
              )}
            </div>
            <div>
              <div className="glass-card rounded-lg overflow-hidden">
                <div className="px-4 py-2.5 border-b border-primary/15">
                  <span className="font-display text-xs text-primary">SIGNATURE</span>
                </div>
                <div className="p-4">
                  <p className="font-mono text-xs text-muted-foreground break-all mb-3">{sig}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">// Cannot verify without secret key</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export default JwtDecoder;
