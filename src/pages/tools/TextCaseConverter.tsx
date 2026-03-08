import { useState, useMemo } from 'react';
import { Copy, Check, ArrowUpDown } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useCopy } from '@/lib/copy';

type CaseType = 'upper' | 'lower' | 'title' | 'sentence' | 'camel' | 'pascal' | 'snake' | 'screaming_snake' | 'kebab' | 'train' | 'dot' | 'path';

const CASES: { id: CaseType; label: string; example: string }[] = [
  { id: 'upper', label: 'UPPERCASE', example: 'HELLO WORLD' },
  { id: 'lower', label: 'lowercase', example: 'hello world' },
  { id: 'title', label: 'Title Case', example: 'Hello World' },
  { id: 'sentence', label: 'Sentence case', example: 'Hello world' },
  { id: 'camel', label: 'camelCase', example: 'helloWorld' },
  { id: 'pascal', label: 'PascalCase', example: 'HelloWorld' },
  { id: 'snake', label: 'snake_case', example: 'hello_world' },
  { id: 'screaming_snake', label: 'SCREAMING_SNAKE', example: 'HELLO_WORLD' },
  { id: 'kebab', label: 'kebab-case', example: 'hello-world' },
  { id: 'train', label: 'TRAIN-CASE', example: 'HELLO-WORLD' },
  { id: 'dot', label: 'dot.case', example: 'hello.world' },
  { id: 'path', label: 'path/case', example: 'hello/world' },
];

function splitWords(text: string): string[] {
  // Split on spaces, underscores, hyphens, dots, slashes, camelCase boundaries
  return text
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_\-./\\]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function convertCase(text: string, type: CaseType, trimWs: boolean, removeExtra: boolean, removeSpecial: boolean): string {
  let t = text;
  if (trimWs) t = t.trim();
  if (removeExtra) t = t.replace(/\s{2,}/g, ' ');
  if (removeSpecial) t = t.replace(/[^a-zA-Z0-9\s]/g, '');

  // For sentence/title/upper/lower, preserve line breaks
  if (['upper', 'lower'].includes(type)) {
    return type === 'upper' ? t.toUpperCase() : t.toLowerCase();
  }
  if (type === 'title') {
    return t.replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase());
  }
  if (type === 'sentence') {
    return t.replace(/(^\s*\w|[.!?]\s+\w)/gm, c => c.toUpperCase()).replace(/^(.)/, c => c.toUpperCase());
  }

  const words = splitWords(t).map(w => w.toLowerCase());
  if (words.length === 0) return '';

  switch (type) {
    case 'camel': return words[0] + words.slice(1).map(w => w[0].toUpperCase() + w.slice(1)).join('');
    case 'pascal': return words.map(w => w[0].toUpperCase() + w.slice(1)).join('');
    case 'snake': return words.join('_');
    case 'screaming_snake': return words.join('_').toUpperCase();
    case 'kebab': return words.join('-');
    case 'train': return words.join('-').toUpperCase();
    case 'dot': return words.join('.');
    case 'path': return words.join('/');
    default: return t;
  }
}

const TextCaseConverter = () => {
  const [input, setInput] = useState('');
  const [activeCase, setActiveCase] = useState<CaseType>('upper');
  const [trimWs, setTrimWs] = useState(false);
  const [removeExtra, setRemoveExtra] = useState(false);
  const [removeSpecial, setRemoveSpecial] = useState(false);
  const { copied, copy } = useCopy();

  const output = useMemo(() => {
    if (!input) return '';
    return convertCase(input, activeCase, trimWs, removeExtra, removeSpecial);
  }, [input, activeCase, trimWs, removeExtra, removeSpecial]);

  const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0;

  const swap = () => {
    setInput(output);
  };

  return (
    <ToolLayout title="> TEXT_CASE.exe" subtitle="// Convert text between any case format instantly">
      {/* Input */}
      <div className="space-y-2 mb-6">
        <div className="flex items-center justify-between">
          <label className="font-mono text-xs text-muted-foreground">INPUT</label>
          <span className="font-mono text-[10px] text-muted-foreground">{input.length} chars • {wordCount} words</span>
        </div>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Paste your text here..."
          className="w-full h-32 px-3 py-2 bg-muted/30 border border-primary/15 rounded font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 resize-none"
        />
      </div>

      {/* Case buttons grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-6">
        {CASES.map(c => (
          <button
            key={c.id}
            onClick={() => setActiveCase(c.id)}
            className={`text-left p-3 rounded-lg border transition-all ${
              activeCase === c.id
                ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(0,255,156,0.1)]'
                : 'border-primary/10 bg-muted/20 hover:border-primary/30'
            }`}
          >
            <span className={`font-mono text-xs block ${activeCase === c.id ? 'text-primary' : 'text-foreground'}`}>{c.label}</span>
            <span className="font-mono text-[10px] text-muted-foreground">{c.example}</span>
          </button>
        ))}
      </div>

      {/* Options */}
      <div className="flex flex-wrap gap-4 mb-6">
        {[
          { label: 'Trim whitespace', value: trimWs, set: setTrimWs },
          { label: 'Remove extra spaces', value: removeExtra, set: setRemoveExtra },
          { label: 'Remove special chars', value: removeSpecial, set: setRemoveSpecial },
        ].map(opt => (
          <div key={opt.label} className="flex items-center gap-2">
            <Switch checked={opt.value} onCheckedChange={opt.set} />
            <span className="font-mono text-[10px] text-muted-foreground">{opt.label}</span>
          </div>
        ))}
      </div>

      {/* Output */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="font-mono text-xs text-primary">OUTPUT</label>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={swap} className="font-mono text-[10px]">
              <ArrowUpDown size={12} /> [_SWAP ⇅]
            </Button>
            <Button size="sm" variant="ghost" onClick={() => copy(output)} className="font-mono text-[10px]">
              {copied ? <><Check size={12} /> [✓ COPIED]</> : <><Copy size={12} /> [_COPY]</>}
            </Button>
          </div>
        </div>
        <div className="w-full min-h-[128px] px-3 py-2 bg-muted/30 border border-primary/20 rounded font-mono text-sm text-foreground whitespace-pre-wrap break-all">
          {output || <span className="text-muted-foreground">Output will appear here...</span>}
        </div>
      </div>
    </ToolLayout>
  );
};

export default TextCaseConverter;
