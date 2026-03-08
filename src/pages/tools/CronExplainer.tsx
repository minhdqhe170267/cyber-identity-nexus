import { useState, useMemo } from 'react';
import cronstrue from 'cronstrue';
import ToolLayout from '@/components/ToolLayout';
import { useCopy } from '@/lib/copy';

const PRESETS = [
  { label: 'Every minute', cron: '* * * * *' },
  { label: 'Every hour', cron: '0 * * * *' },
  { label: 'Daily midnight', cron: '0 0 * * *' },
  { label: 'Every weekday', cron: '0 9 * * 1-5' },
  { label: 'Every Sunday', cron: '0 0 * * 0' },
  { label: '1st of month', cron: '0 0 1 * *' },
  { label: 'Every 15 min', cron: '*/15 * * * *' },
  { label: 'Every 6 hours', cron: '0 */6 * * *' },
];

const FIELD_LABELS = ['Minute', 'Hour', 'Day', 'Month', 'Weekday'];
const FIELD_COLORS = ['text-primary', 'text-secondary', 'text-accent', 'text-orange-400', 'text-purple-400'];

const getNextRuns = (cron: string, count: number): Date[] => {
  // Simple next run computation for common patterns
  const parts = cron.split(/\s+/);
  if (parts.length < 5) return [];
  const runs: Date[] = [];
  const now = new Date();
  const check = new Date(now);
  check.setSeconds(0);
  check.setMilliseconds(0);

  for (let i = 0; i < 525600 && runs.length < count; i++) {
    check.setMinutes(check.getMinutes() + 1);
    const min = check.getMinutes();
    const hour = check.getHours();
    const dom = check.getDate();
    const month = check.getMonth() + 1;
    const dow = check.getDay();

    if (matchField(parts[0], min, 0, 59) &&
        matchField(parts[1], hour, 0, 23) &&
        matchField(parts[2], dom, 1, 31) &&
        matchField(parts[3], month, 1, 12) &&
        matchField(parts[4], dow, 0, 7)) {
      runs.push(new Date(check));
    }
  }
  return runs;
};

const matchField = (field: string, value: number, min: number, max: number): boolean => {
  if (field === '*') return true;
  return field.split(',').some(part => {
    if (part.includes('/')) {
      const [range, step] = part.split('/');
      const s = parseInt(step);
      const start = range === '*' ? min : parseInt(range);
      if (isNaN(s)) return false;
      return (value - start) % s === 0 && value >= start;
    }
    if (part.includes('-')) {
      const [a, b] = part.split('-').map(Number);
      return value >= a && value <= b;
    }
    return parseInt(part) === value || (field === '7' && value === 0);
  });
};

const CronExplainer = () => {
  const [cron, setCron] = useState('0 9 * * 1-5');
  const [builderMode, setBuilderMode] = useState(false);
  const { copied, copy } = useCopy();

  const parts = cron.trim().split(/\s+/);

  const explanation = useMemo(() => {
    try {
      return cronstrue.toString(cron);
    } catch {
      return null;
    }
  }, [cron]);

  const nextRuns = useMemo(() => {
    try { return getNextRuns(cron, 5); }
    catch { return []; }
  }, [cron]);

  const isValid = explanation !== null && parts.length >= 5;

  return (
    <ToolLayout title='> CRON_EXPLAINER.exe' subtitle="// Parse & build cron expressions visually">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button key={p.label} onClick={() => setCron(p.cron)} className="font-mono text-xs px-2 py-1 rounded border border-primary/15 text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors">
              {p.label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="glass-card rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <input
              value={cron}
              onChange={(e) => setCron(e.target.value)}
              className="flex-1 bg-muted border border-primary/15 rounded px-4 py-3 font-mono text-lg text-foreground focus:outline-none focus:border-primary/40"
              spellCheck={false}
            />
            <button onClick={() => copy(cron)} className="btn-neon-green text-xs py-2 px-3 rounded">
              {copied ? '[✓]' : '[_COPY]'}
            </button>
          </div>

          {/* Color-coded fields */}
          {parts.length >= 5 && (
            <div className="flex gap-4 justify-center">
              {parts.slice(0, 5).map((p, i) => (
                <div key={i} className="text-center">
                  <div className={`font-mono text-lg ${FIELD_COLORS[i]} px-3 py-1 border border-current/20 rounded`}>{p}</div>
                  <span className="font-mono text-[10px] text-muted-foreground">{FIELD_LABELS[i]}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Explanation */}
        <div className="glass-card rounded-lg p-5">
          {isValid ? (
            <p className="font-mono text-sm text-primary">{'> '}{explanation}</p>
          ) : (
            <p className="font-mono text-sm text-accent neon-text-pink">// INVALID CRON EXPRESSION</p>
          )}
        </div>

        {/* Next runs */}
        {nextRuns.length > 0 && (
          <div className="glass-card rounded-lg p-5 space-y-2">
            <h3 className="font-display text-xs text-foreground mb-3">NEXT EXECUTIONS</h3>
            {nextRuns.map((d, i) => (
              <p key={i} className="font-mono text-sm text-muted-foreground">
                <span className="text-primary">{"> "}{i === 0 ? 'Next run' : `+${i + 1}`}:</span>{' '}
                {d.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            ))}
          </div>
        )}

        {/* Builder toggle */}
        <button onClick={() => setBuilderMode(!builderMode)} className="font-mono text-xs text-muted-foreground hover:text-primary">
          [{builderMode ? '- HIDE' : '+ SHOW'} BUILDER]
        </button>

        {builderMode && (
          <div className="glass-card rounded-lg p-5 grid grid-cols-1 sm:grid-cols-5 gap-3">
            {FIELD_LABELS.map((label, i) => (
              <div key={label}>
                <label className={`font-mono text-xs ${FIELD_COLORS[i]} block mb-1`}>{label}</label>
                <input
                  value={parts[i] || '*'}
                  onChange={(e) => {
                    const newParts = [...parts];
                    while (newParts.length < 5) newParts.push('*');
                    newParts[i] = e.target.value;
                    setCron(newParts.join(' '));
                  }}
                  className="w-full bg-muted border border-primary/15 rounded px-2 py-1.5 font-mono text-sm text-foreground focus:outline-none text-center"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export default CronExplainer;
