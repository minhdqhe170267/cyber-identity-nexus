import { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Download, X, Trash2 } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useCopy } from '@/lib/copy';

type ViewMode = 'split' | 'unified' | 'chars';

interface DiffLine {
  type: 'add' | 'remove' | 'same';
  content: string;
  leftNum?: number;
  rightNum?: number;
}

interface CharDiff {
  type: 'add' | 'remove' | 'same';
  text: string;
}

// Simple LCS-based diff
function computeDiff(original: string, modified: string): DiffLine[] {
  const a = original.split('\n');
  const b = modified.split('\n');
  const lines: DiffLine[] = [];

  const n = a.length, m = b.length;
  // Build LCS table
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);

  // Backtrack
  let i = n, j = m;
  const ops: DiffLine[] = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      ops.push({ type: 'same', content: a[i - 1], leftNum: i, rightNum: j });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.push({ type: 'add', content: b[j - 1], rightNum: j });
      j--;
    } else {
      ops.push({ type: 'remove', content: a[i - 1], leftNum: i });
      i--;
    }
  }
  ops.reverse();
  return ops;
}

function computeCharDiff(a: string, b: string): CharDiff[] {
  // Simple character-level diff using LCS
  const n = a.length, m = b.length;
  if (n * m > 500000) {
    // Too large for char diff, fallback
    return [{ type: 'remove', text: a }, { type: 'add', text: b }];
  }
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);

  const result: CharDiff[] = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      result.push({ type: 'same', text: a[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({ type: 'add', text: b[j - 1] });
      j--;
    } else {
      result.push({ type: 'remove', text: a[i - 1] });
      i--;
    }
  }
  result.reverse();
  // Merge consecutive same-type
  const merged: CharDiff[] = [];
  for (const r of result) {
    if (merged.length > 0 && merged[merged.length - 1].type === r.type) {
      merged[merged.length - 1].text += r.text;
    } else {
      merged.push({ ...r });
    }
  }
  return merged;
}

const DiffChecker = () => {
  const [original, setOriginal] = useState('');
  const [modified, setModified] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [autoCompare, setAutoCompare] = useState(true);
  const [diffResult, setDiffResult] = useState<DiffLine[]>([]);
  const { copied, copy } = useCopy();
  const debounceRef = useRef<NodeJS.Timeout>();

  const runDiff = () => {
    if (!original && !modified) { setDiffResult([]); return; }
    setDiffResult(computeDiff(original, modified));
  };

  useEffect(() => {
    if (!autoCompare) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(runDiff, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [original, modified, autoCompare]);

  const stats = useMemo(() => {
    const additions = diffResult.filter(d => d.type === 'add').length;
    const deletions = diffResult.filter(d => d.type === 'remove').length;
    const changed = additions + deletions;
    return { additions, deletions, changed };
  }, [diffResult]);

  const charDiffs = useMemo(() => {
    if (viewMode !== 'chars') return [];
    return computeCharDiff(original, modified);
  }, [original, modified, viewMode]);

  const unifiedDiff = useMemo(() => {
    return diffResult.map(d => {
      const prefix = d.type === 'add' ? '+ ' : d.type === 'remove' ? '- ' : '  ';
      return prefix + d.content;
    }).join('\n');
  }, [diffResult]);

  const downloadDiff = () => {
    const blob = new Blob([unifiedDiff], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'diff.txt';
    a.click();
  };

  const views: ViewMode[] = ['split', 'unified', 'chars'];

  return (
    <ToolLayout title="> DIFF_CHECKER.exe" subtitle="// Compare two texts and highlight differences">
      {/* Input panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-display text-xs text-primary">ORIGINAL</label>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-muted-foreground">{original.split('\n').length} lines • {original.length} chars</span>
              <button onClick={() => setOriginal('')} className="text-muted-foreground hover:text-destructive"><Trash2 size={12} /></button>
            </div>
          </div>
          <textarea
            value={original}
            onChange={e => setOriginal(e.target.value)}
            placeholder="Paste original text..."
            className="w-full h-64 px-3 py-2 bg-muted/30 border border-primary/15 rounded font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 resize-none"
            spellCheck={false}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-display text-xs text-[hsl(var(--secondary))]">MODIFIED</label>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-muted-foreground">{modified.split('\n').length} lines • {modified.length} chars</span>
              <button onClick={() => setModified('')} className="text-muted-foreground hover:text-destructive"><Trash2 size={12} /></button>
            </div>
          </div>
          <textarea
            value={modified}
            onChange={e => setModified(e.target.value)}
            placeholder="Paste modified text..."
            className="w-full h-64 px-3 py-2 bg-muted/30 border border-secondary/15 rounded font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-secondary/60 resize-none"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Switch checked={autoCompare} onCheckedChange={setAutoCompare} />
          <span className="font-mono text-[10px] text-muted-foreground">AUTO-COMPARE</span>
        </div>
        {!autoCompare && (
          <Button onClick={runDiff} size="sm" className="font-mono text-xs">[_COMPARE]</Button>
        )}
        <div className="flex gap-1 ml-auto">
          {views.map(v => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={`font-mono text-[10px] px-3 py-1.5 rounded border transition-all ${
                viewMode === v ? 'border-primary bg-primary/10 text-primary' : 'border-primary/15 text-muted-foreground hover:text-primary'
              }`}
            >
              {v.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      {diffResult.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <span className="font-mono text-xs text-primary">+{stats.additions} additions</span>
          <span className="font-mono text-xs text-destructive">-{stats.deletions} deletions</span>
          <span className="font-mono text-xs text-muted-foreground">{stats.changed} lines changed</span>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" onClick={() => copy(unifiedDiff)} className="font-mono text-[10px]">
              {copied ? <><Check size={12} /> [✓ COPIED]</> : <><Copy size={12} /> [_COPY DIFF]</>}
            </Button>
            <Button size="sm" variant="outline" onClick={downloadDiff} className="font-mono text-[10px]">
              <Download size={12} /> [_DOWNLOAD .diff]
            </Button>
          </div>
        </div>
      )}

      {/* Diff output */}
      {diffResult.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-lg overflow-hidden">
          {viewMode === 'split' && (
            <div className="grid grid-cols-2 max-h-[500px] overflow-auto">
              <div className="border-r border-primary/10">
                {diffResult.filter(d => d.type !== 'add').map((d, i) => (
                  <div key={i} className={`flex font-mono text-xs px-2 py-0.5 ${
                    d.type === 'remove' ? 'bg-destructive/10 border-l-2 border-destructive' : 'text-muted-foreground'
                  }`}>
                    <span className="w-8 text-right mr-2 text-muted-foreground/50 select-none">{d.leftNum || ''}</span>
                    <span className={d.type === 'remove' ? 'text-destructive' : ''}>{d.type === 'remove' ? '- ' : '  '}{d.content}</span>
                  </div>
                ))}
              </div>
              <div>
                {diffResult.filter(d => d.type !== 'remove').map((d, i) => (
                  <div key={i} className={`flex font-mono text-xs px-2 py-0.5 ${
                    d.type === 'add' ? 'bg-primary/10 border-l-2 border-primary' : 'text-muted-foreground'
                  }`}>
                    <span className="w-8 text-right mr-2 text-muted-foreground/50 select-none">{d.rightNum || ''}</span>
                    <span className={d.type === 'add' ? 'text-primary' : ''}>{d.type === 'add' ? '+ ' : '  '}{d.content}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'unified' && (
            <div className="max-h-[500px] overflow-auto">
              {diffResult.map((d, i) => (
                <div key={i} className={`flex font-mono text-xs px-2 py-0.5 ${
                  d.type === 'add' ? 'bg-primary/10 border-l-2 border-primary' :
                  d.type === 'remove' ? 'bg-destructive/10 border-l-2 border-destructive' :
                  'text-muted-foreground'
                }`}>
                  <span className="w-8 text-right mr-1 text-muted-foreground/50 select-none">{d.leftNum || ''}</span>
                  <span className="w-8 text-right mr-2 text-muted-foreground/50 select-none">{d.rightNum || ''}</span>
                  <span className={d.type === 'add' ? 'text-primary' : d.type === 'remove' ? 'text-destructive' : ''}>
                    {d.type === 'add' ? '+ ' : d.type === 'remove' ? '- ' : '  '}{d.content}
                  </span>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'chars' && (
            <div className="p-4 max-h-[500px] overflow-auto font-mono text-sm leading-relaxed">
              {charDiffs.map((d, i) => (
                <span key={i} className={
                  d.type === 'add' ? 'bg-primary/20 text-primary' :
                  d.type === 'remove' ? 'bg-destructive/20 text-destructive line-through' :
                  'text-foreground'
                }>
                  {d.text}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </ToolLayout>
  );
};

export default DiffChecker;
