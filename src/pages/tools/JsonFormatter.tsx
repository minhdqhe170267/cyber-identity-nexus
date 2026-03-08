import { useState, useCallback } from 'react';
import ToolLayout from '@/components/ToolLayout';
import { useCopy } from '@/lib/copy';

const COLORS: Record<string, string> = {
  key: 'text-secondary',       // neon blue
  string: 'text-primary',      // neon green
  number: 'text-accent',       // pink
  boolean: 'text-orange-400',
  null: 'text-red-400',
  brace: 'text-foreground',
};

const highlight = (json: string) => {
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = COLORS.number;
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? COLORS.key : COLORS.string;
      } else if (/true|false/.test(match)) {
        cls = COLORS.boolean;
      } else if (/null/.test(match)) {
        cls = COLORS.null;
      }
      return `<span class="${cls}">${match}</span>`;
    },
  );
};

const JsonFormatter = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState('');
  const copyIn = useCopy();
  const copyOut = useCopy();

  const format = useCallback(() => {
    try {
      const obj = JSON.parse(input);
      const formatted = JSON.stringify(obj, null, 2);
      setOutput(formatted);
      setError('');
      const lines = formatted.split('\n').length;
      setStats(`// ${lines} lines · ${new Blob([input]).size} bytes → ${new Blob([formatted]).size} bytes`);
    } catch (e: any) {
      setError(`> SYNTAX ERROR: ${e.message}`);
      setOutput('');
      setStats('');
    }
  }, [input]);

  const minify = useCallback(() => {
    try {
      const obj = JSON.parse(input);
      const minified = JSON.stringify(obj);
      setOutput(minified);
      setError('');
      setStats(`// 1 line · ${new Blob([input]).size} bytes → ${new Blob([minified]).size} bytes`);
    } catch (e: any) {
      setError(`> SYNTAX ERROR: ${e.message}`);
      setOutput('');
      setStats('');
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      format();
    }
  };

  return (
    <ToolLayout title='> JSON_FORMATTER.exe' subtitle="// Format, minify & validate JSON">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Input */}
        <div className="flex-1">
          <div className="glass-card rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-primary/15">
              <span className="font-display text-xs text-primary">INPUT</span>
              <div className="flex-1" />
              <button onClick={format} className="btn-neon-green text-[10px] py-1 px-2 rounded">[_FORMAT]</button>
              <button onClick={minify} className="btn-neon-blue text-[10px] py-1 px-2 rounded">[_MINIFY]</button>
              <button onClick={() => { setInput(''); setOutput(''); setError(''); setStats(''); }} className="font-mono text-[10px] text-muted-foreground hover:text-foreground">[_CLEAR]</button>
              <button onClick={() => copyIn.copy(input)} className="font-mono text-[10px] text-muted-foreground hover:text-primary">
                {copyIn.copied ? '[✓ COPIED]' : '[_COPY INPUT]'}
              </button>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Paste JSON here...'
              className={`w-full h-[400px] lg:h-[500px] p-4 bg-transparent font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none ${error ? 'border-2 border-accent' : ''}`}
              spellCheck={false}
            />
          </div>
          <p className="font-mono text-[10px] text-muted-foreground mt-1">Ctrl+Enter to format</p>
        </div>

        {/* Output */}
        <div className="flex-1">
          <div className="glass-card rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-primary/15">
              <span className="font-display text-xs text-primary">OUTPUT</span>
              <div className="flex-1" />
              <button onClick={() => copyOut.copy(output)} className="font-mono text-[10px] text-muted-foreground hover:text-primary">
                {copyOut.copied ? '[✓ COPIED]' : '[_COPY OUTPUT]'}
              </button>
            </div>
            {error ? (
              <div className="p-4 font-mono text-sm text-accent neon-text-pink">{error}</div>
            ) : output ? (
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-10 bg-muted/30 flex flex-col items-end pr-2 pt-4 font-mono text-[10px] text-muted-foreground select-none overflow-hidden">
                  {output.split('\n').map((_, i) => (
                    <div key={i} className="leading-5">{i + 1}</div>
                  ))}
                </div>
                <pre
                  className="p-4 pl-12 h-[400px] lg:h-[500px] overflow-auto font-mono text-sm leading-5"
                  dangerouslySetInnerHTML={{ __html: highlight(output) }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-[400px] lg:h-[500px]">
                <p className="font-mono text-sm text-muted-foreground">{"> Awaiting input..."}<span className="blink text-primary ml-1">█</span></p>
              </div>
            )}
          </div>
        </div>
      </div>

      {stats && (
        <div className="mt-3 font-mono text-xs text-muted-foreground">{stats}</div>
      )}
    </ToolLayout>
  );
};

export default JsonFormatter;
