import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import { useCopy } from '@/lib/copy';

const CHARSETS = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};
const AMBIGUOUS = '0OlI1';

type Opts = { upper: boolean; lower: boolean; numbers: boolean; symbols: boolean; excludeAmbiguous: boolean; length: number };

const calcStrength = (pw: string, opts: Opts) => {
  let pool = 0;
  if (opts.upper) pool += 26;
  if (opts.lower) pool += 26;
  if (opts.numbers) pool += 10;
  if (opts.symbols) pool += 26;
  const entropy = pw.length * Math.log2(Math.max(pool, 2));
  if (entropy < 28) return { label: 'Weak', color: 'bg-red-500', pct: 20 };
  if (entropy < 50) return { label: 'Fair', color: 'bg-orange-400', pct: 45 };
  if (entropy < 80) return { label: 'Strong', color: 'bg-secondary', pct: 70 };
  return { label: 'Very Strong', color: 'bg-primary neon-glow-green', pct: 100 };
};

const PasswordGenerator = () => {
  const [opts, setOpts] = useState<Opts>({ upper: true, lower: true, numbers: true, symbols: true, excludeAmbiguous: false, length: 20 });
  const [password, setPassword] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const { copied, copy } = useCopy();

  const generate = useCallback(() => {
    let chars = '';
    if (opts.upper) chars += CHARSETS.upper;
    if (opts.lower) chars += CHARSETS.lower;
    if (opts.numbers) chars += CHARSETS.numbers;
    if (opts.symbols) chars += CHARSETS.symbols;
    if (!chars) chars = CHARSETS.lower;
    if (opts.excludeAmbiguous) chars = chars.split('').filter((c) => !AMBIGUOUS.includes(c)).join('');
    const arr = new Uint32Array(opts.length);
    crypto.getRandomValues(arr);
    const pw = Array.from(arr, (v) => chars[v % chars.length]).join('');
    setPassword(pw);
    setHistory((h) => [pw, ...h.filter((p) => p !== pw)].slice(0, 5));
  }, [opts]);

  useEffect(() => { generate(); }, [generate]);

  const strength = calcStrength(password, opts);

  const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!checked)} className="flex items-center gap-2 font-mono text-sm text-foreground">
      <span className={`${checked ? 'text-primary' : 'text-muted-foreground'}`}>[{checked ? 'x' : ' '}]</span>
      {label}
    </button>
  );

  return (
    <ToolLayout title='> PASSWORD_GEN.exe' subtitle="// Generate cryptographically secure passwords">
      <div className="max-w-[600px] mx-auto space-y-6">
        {/* Password display */}
        <div className="glass-card rounded-lg p-5">
          <div className="flex items-center gap-3">
            <code className="flex-1 font-mono text-lg md:text-xl text-primary break-all leading-relaxed select-all">
              {password}
            </code>
            <button onClick={() => copy(password)} className="btn-neon-green text-xs py-1.5 px-3 rounded shrink-0">
              {copied ? '[✓ COPIED]' : '[_COPY]'}
            </button>
          </div>

          {/* Strength */}
          <div className="mt-4">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${strength.color}`} style={{ width: `${strength.pct}%` }} />
            </div>
            <p className="font-mono text-xs mt-1 text-muted-foreground">// {strength.label}</p>
          </div>
        </div>

        {/* Options */}
        <div className="glass-card rounded-lg p-5 space-y-4">
          <div>
            <label className="font-mono text-xs text-muted-foreground block mb-2">LENGTH: {opts.length}</label>
            <input
              type="range"
              min={8}
              max={128}
              value={opts.length}
              onChange={(e) => setOpts((o) => ({ ...o, length: +e.target.value }))}
              className="w-full accent-primary"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Toggle label="Uppercase (A-Z)" checked={opts.upper} onChange={(v) => setOpts((o) => ({ ...o, upper: v }))} />
            <Toggle label="Lowercase (a-z)" checked={opts.lower} onChange={(v) => setOpts((o) => ({ ...o, lower: v }))} />
            <Toggle label="Numbers (0-9)" checked={opts.numbers} onChange={(v) => setOpts((o) => ({ ...o, numbers: v }))} />
            <Toggle label="Symbols (!@#$...)" checked={opts.symbols} onChange={(v) => setOpts((o) => ({ ...o, symbols: v }))} />
            <Toggle label="Exclude ambiguous (0,O,l,1,I)" checked={opts.excludeAmbiguous} onChange={(v) => setOpts((o) => ({ ...o, excludeAmbiguous: v }))} />
          </div>
        </div>

        {/* Regenerate */}
        <button onClick={generate} className="w-full btn-neon-green py-3 rounded font-display text-sm flex items-center justify-center gap-2">
          <RefreshCw size={16} /> [_REGENERATE]
        </button>

        {/* History */}
        {history.length > 1 && (
          <div className="space-y-2">
            <p className="font-mono text-xs text-muted-foreground">// RECENT</p>
            <div className="flex flex-wrap gap-2">
              {history.slice(1).map((pw, i) => (
                <button
                  key={i}
                  onClick={() => { setPassword(pw); copy(pw); }}
                  className="font-mono text-[10px] px-2 py-1 rounded border border-primary/15 text-muted-foreground hover:text-primary hover:border-primary/40 truncate max-w-[200px] transition-colors"
                >
                  {pw.slice(0, 16)}...
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export default PasswordGenerator;
