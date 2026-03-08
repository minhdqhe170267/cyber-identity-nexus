import { useState, useMemo } from 'react';
import ToolLayout from '@/components/ToolLayout';
import { useCopy } from '@/lib/copy';

const PRESETS = [
  { name: 'Email', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', flags: 'gi' },
  { name: 'URL', pattern: 'https?://[\\w-]+(\\.[\\w-]+)+[\\w.,@?^=%&:/~+#-]*', flags: 'gi' },
  { name: 'Phone', pattern: '\\+?[\\d\\s.-]{7,15}', flags: 'g' },
  { name: 'IP Address', pattern: '\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\b', flags: 'g' },
  { name: 'Date (YYYY-MM-DD)', pattern: '\\d{4}-\\d{2}-\\d{2}', flags: 'g' },
  { name: 'Hex Color', pattern: '#[0-9a-fA-F]{3,8}', flags: 'gi' },
  { name: 'Username', pattern: '^[a-zA-Z0-9_]{3,20}$', flags: 'gm' },
];

type MatchResult = { match: string; index: number; end: number; groups: string[] };

const RegexTester = () => {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState({ g: true, i: false, m: false, s: false, u: false });
  const [testStr, setTestStr] = useState('');
  const [replaceMode, setReplaceMode] = useState(false);
  const [replaceStr, setReplaceStr] = useState('');
  const [showPresets, setShowPresets] = useState(false);
  const copyResult = useCopy();

  const flagStr = Object.entries(flags).filter(([, v]) => v).map(([k]) => k).join('');

  const { matches, error, highlighted, replaced } = useMemo(() => {
    if (!pattern) return { matches: [] as MatchResult[], error: '', highlighted: testStr, replaced: '' };
    try {
      const regex = new RegExp(pattern, flagStr);
      const results: MatchResult[] = [];
      let m: RegExpExecArray | null;
      const r = new RegExp(pattern, flagStr);
      while ((m = r.exec(testStr)) !== null) {
        results.push({ match: m[0], index: m.index, end: m.index + m[0].length, groups: m.slice(1) });
        if (!flagStr.includes('g')) break;
        if (m[0].length === 0) r.lastIndex++;
      }

      // Build highlighted string
      let hl = '';
      let last = 0;
      for (const res of results) {
        hl += testStr.slice(last, res.index);
        hl += `<mark class="bg-primary/30 text-primary rounded px-0.5">${testStr.slice(res.index, res.end)}</mark>`;
        last = res.end;
      }
      hl += testStr.slice(last);

      const rep = replaceMode ? testStr.replace(regex, replaceStr) : '';

      return { matches: results, error: '', highlighted: hl, replaced: rep };
    } catch (e: any) {
      return { matches: [] as MatchResult[], error: e.message, highlighted: testStr, replaced: '' };
    }
  }, [pattern, flagStr, testStr, replaceMode, replaceStr]);

  return (
    <ToolLayout title='> REGEX_TESTER.exe' subtitle="// Test regular expressions with live matching">
      <div className="space-y-4">
        {/* Pattern input */}
        <div className="glass-card rounded-lg p-4">
          <div className="flex items-center gap-1 font-mono text-sm">
            <span className="text-primary">/</span>
            <input
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="pattern"
              className={`flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none ${error ? 'text-accent' : ''}`}
              spellCheck={false}
            />
            <span className="text-primary">/{flagStr}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {(['g', 'i', 'm', 's', 'u'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFlags((p) => ({ ...p, [f]: !p[f] }))}
                className={`font-mono text-xs px-2 py-0.5 rounded border ${flags[f] ? 'border-primary text-primary' : 'border-primary/15 text-muted-foreground'}`}
              >
                {f}
              </button>
            ))}
            <button onClick={() => setReplaceMode(!replaceMode)} className={`font-mono text-xs px-2 py-0.5 rounded border ${replaceMode ? 'border-secondary text-secondary' : 'border-primary/15 text-muted-foreground'}`}>
              REPLACE
            </button>
            <button onClick={() => setShowPresets(!showPresets)} className="font-mono text-xs px-2 py-0.5 rounded border border-primary/15 text-muted-foreground hover:text-primary">
              PRESETS
            </button>
          </div>
          {error && <p className="font-mono text-xs text-accent mt-2">{error}</p>}
        </div>

        {/* Presets */}
        {showPresets && (
          <div className="glass-card rounded-lg p-4 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => { setPattern(p.pattern); setFlags({ g: p.flags.includes('g'), i: p.flags.includes('i'), m: p.flags.includes('m'), s: false, u: false }); setShowPresets(false); }}
                className="font-mono text-xs px-2 py-1 rounded border border-primary/15 text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        {/* Test string */}
        <div className="glass-card rounded-lg p-4">
          <label className="font-display text-xs text-primary block mb-2">TEST STRING</label>
          <textarea
            value={testStr}
            onChange={(e) => setTestStr(e.target.value)}
            placeholder="Enter test string..."
            className="w-full h-40 bg-transparent font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
            spellCheck={false}
          />
        </div>

        {/* Highlighted preview */}
        {pattern && testStr && (
          <div className="glass-card rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-display text-xs text-primary">MATCHES</span>
              <span className="font-mono text-xs text-muted-foreground">// {matches.length} MATCH{matches.length !== 1 ? 'ES' : ''} FOUND</span>
            </div>
            <div className="font-mono text-sm text-foreground whitespace-pre-wrap break-all" dangerouslySetInnerHTML={{ __html: highlighted }} />
          </div>
        )}

        {/* Replace output */}
        {replaceMode && pattern && testStr && (
          <div className="glass-card rounded-lg p-4 space-y-3">
            <label className="font-display text-xs text-secondary block">REPLACEMENT</label>
            <input
              value={replaceStr}
              onChange={(e) => setReplaceStr(e.target.value)}
              placeholder="Replacement string..."
              className="w-full bg-muted border border-primary/15 rounded px-3 py-2 font-mono text-sm text-foreground focus:outline-none"
            />
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-display text-xs text-primary">RESULT</span>
                <button onClick={() => copyResult.copy(replaced)} className="font-mono text-[10px] text-muted-foreground hover:text-primary">{copyResult.copied ? '[✓ COPIED]' : '[_COPY]'}</button>
              </div>
              <pre className="font-mono text-sm text-foreground whitespace-pre-wrap break-all">{replaced}</pre>
            </div>
          </div>
        )}

        {/* Matches table */}
        {matches.length > 0 && (
          <div className="glass-card rounded-lg overflow-hidden">
            <table className="w-full font-mono text-xs">
              <thead>
                <tr className="border-b border-primary/15">
                  <th className="px-4 py-2 text-left text-primary">#</th>
                  <th className="px-4 py-2 text-left text-primary">Match</th>
                  <th className="px-4 py-2 text-left text-primary">Index</th>
                  <th className="px-4 py-2 text-left text-primary">Groups</th>
                </tr>
              </thead>
              <tbody>
                {matches.slice(0, 50).map((m, i) => (
                  <tr key={i} className="border-b border-primary/10 hover:bg-primary/5">
                    <td className="px-4 py-2 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-2 text-foreground">{m.match}</td>
                    <td className="px-4 py-2 text-muted-foreground">{m.index}–{m.end}</td>
                    <td className="px-4 py-2 text-muted-foreground">{m.groups.length ? m.groups.join(', ') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export default RegexTester;
