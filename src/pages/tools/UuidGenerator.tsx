import { useState, useCallback, useEffect } from 'react';
import { v1 as uuidv1, v4 as uuidv4, v5 as uuidv5 } from 'uuid';
import { nanoid, customAlphabet } from 'nanoid';
import { RefreshCw, Download } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import { useCopy } from '@/lib/copy';

const V5_NAMESPACES: Record<string, string> = {
  DNS: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  URL: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
  OID: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
  X500: '6ba7b814-9dad-11d1-80b4-00c04fd430c8',
};

const TABS = ['V1', 'V4', 'V5', 'NanoID'] as const;
type Tab = typeof TABS[number];

const UuidGenerator = () => {
  const [tab, setTab] = useState<Tab>('V4');
  const [result, setResult] = useState('');
  const [bulk, setBulk] = useState('');
  const [bulkCount, setBulkCount] = useState(10);
  const [v5Name, setV5Name] = useState('example.com');
  const [v5Ns, setV5Ns] = useState('DNS');
  const [nanoAlphabet, setNanoAlphabet] = useState('0123456789abcdefghijklmnopqrstuvwxyz');
  const [nanoSize, setNanoSize] = useState(21);
  const { copied, copy } = useCopy();
  const copyAll = useCopy();

  const generate = useCallback(() => {
    switch (tab) {
      case 'V1': return uuidv1();
      case 'V4': return uuidv4();
      case 'V5': return uuidv5(v5Name, V5_NAMESPACES[v5Ns] || V5_NAMESPACES.DNS);
      case 'NanoID': {
        if (nanoAlphabet.length >= 2) {
          const gen = customAlphabet(nanoAlphabet, nanoSize);
          return gen();
        }
        return nanoid(nanoSize);
      }
    }
  }, [tab, v5Name, v5Ns, nanoAlphabet, nanoSize]);

  const regen = useCallback(() => setResult(generate()), [generate]);
  useEffect(() => { regen(); }, [regen]);

  const genBulk = () => {
    const count = Math.min(Math.max(bulkCount, 1), 100);
    const lines = Array.from({ length: count }, () => generate()).join('\n');
    setBulk(lines);
  };

  const downloadTxt = () => {
    const blob = new Blob([bulk], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `uuids-${tab.toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <ToolLayout title='> UUID_GEN.exe' subtitle="// Generate unique identifiers">
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`font-mono text-xs px-3 py-1.5 rounded border transition-all ${
              tab === t ? 'border-primary bg-primary/10 text-primary' : 'border-primary/15 text-muted-foreground hover:text-primary'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="max-w-2xl space-y-6">
        {/* V5 options */}
        {tab === 'V5' && (
          <div className="glass-card rounded-lg p-4 flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="font-mono text-xs text-muted-foreground block mb-1">NAMESPACE</label>
              <select value={v5Ns} onChange={(e) => setV5Ns(e.target.value)} className="w-full bg-muted border border-primary/15 rounded px-3 py-2 font-mono text-sm text-foreground focus:outline-none">
                {Object.keys(V5_NAMESPACES).map((ns) => <option key={ns}>{ns}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="font-mono text-xs text-muted-foreground block mb-1">NAME</label>
              <input value={v5Name} onChange={(e) => setV5Name(e.target.value)} className="w-full bg-muted border border-primary/15 rounded px-3 py-2 font-mono text-sm text-foreground focus:outline-none" />
            </div>
          </div>
        )}

        {/* NanoID options */}
        {tab === 'NanoID' && (
          <div className="glass-card rounded-lg p-4 space-y-3">
            <div>
              <label className="font-mono text-xs text-muted-foreground block mb-1">ALPHABET</label>
              <input value={nanoAlphabet} onChange={(e) => setNanoAlphabet(e.target.value)} className="w-full bg-muted border border-primary/15 rounded px-3 py-2 font-mono text-sm text-foreground focus:outline-none" />
            </div>
            <div>
              <label className="font-mono text-xs text-muted-foreground block mb-1">SIZE: {nanoSize}</label>
              <input type="range" min={4} max={64} value={nanoSize} onChange={(e) => setNanoSize(+e.target.value)} className="w-full accent-primary" />
            </div>
          </div>
        )}

        {/* Result */}
        <div className="glass-card rounded-lg p-5 flex items-center gap-3">
          <code className="flex-1 font-mono text-lg text-primary neon-text-green break-all select-all">{result}</code>
          <button onClick={() => copy(result)} className="btn-neon-green text-xs py-1.5 px-3 rounded shrink-0">
            {copied ? '[✓ COPIED]' : '[_COPY]'}
          </button>
          <button onClick={regen} className="btn-neon-blue text-xs py-1.5 px-3 rounded shrink-0 flex items-center gap-1">
            <RefreshCw size={12} /> [_REGENERATE]
          </button>
        </div>

        {/* Bulk */}
        <div className="glass-card rounded-lg p-5 space-y-3">
          <h3 className="font-display text-sm text-foreground">BULK GENERATE</h3>
          <div className="flex gap-3 items-end">
            <div>
              <label className="font-mono text-xs text-muted-foreground block mb-1">COUNT (1-100)</label>
              <input type="number" min={1} max={100} value={bulkCount} onChange={(e) => setBulkCount(+e.target.value)} className="w-24 bg-muted border border-primary/15 rounded px-3 py-2 font-mono text-sm text-foreground focus:outline-none" />
            </div>
            <button onClick={genBulk} className="btn-neon-green text-xs py-2 px-4 rounded">[_GENERATE BULK]</button>
          </div>
          {bulk && (
            <>
              <textarea readOnly value={bulk} className="w-full h-48 bg-muted/50 border border-primary/15 rounded p-3 font-mono text-xs text-foreground resize-none focus:outline-none" />
              <div className="flex gap-2">
                <button onClick={() => copyAll.copy(bulk)} className="btn-neon-green text-[10px] py-1 px-3 rounded">
                  {copyAll.copied ? '[✓ COPIED]' : '[_COPY ALL]'}
                </button>
                <button onClick={downloadTxt} className="btn-neon-blue text-[10px] py-1 px-3 rounded flex items-center gap-1">
                  <Download size={10} /> [_DOWNLOAD .txt]
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </ToolLayout>
  );
};

export default UuidGenerator;
