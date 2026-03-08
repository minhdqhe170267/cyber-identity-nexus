import { useState, useCallback } from 'react';
import ToolLayout from '@/components/ToolLayout';
import { useCopy } from '@/lib/copy';

const Base64Tool = () => {
  const [tab, setTab] = useState<'TEXT' | 'IMAGE'>('TEXT');
  const [plain, setPlain] = useState('');
  const [encoded, setEncoded] = useState('');
  const [error, setError] = useState('');
  const [imgSrc, setImgSrc] = useState('');
  const [imgB64, setImgB64] = useState('');
  const copyPlain = useCopy();
  const copyEnc = useCopy();
  const copyImg = useCopy();

  const encode = useCallback(() => {
    try {
      setEncoded(btoa(unescape(encodeURIComponent(plain))));
      setError('');
    } catch { setError('// ENCODE ERROR'); }
  }, [plain]);

  const decode = useCallback(() => {
    try {
      setPlain(decodeURIComponent(escape(atob(encoded))));
      setError('');
    } catch { setError('// INVALID BASE64 STRING'); }
  }, [encoded]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImgSrc(result);
      setImgB64(result);
    };
    reader.readAsDataURL(file);
  };

  const decodeImgB64 = () => {
    if (imgB64.startsWith('data:')) {
      setImgSrc(imgB64);
    } else {
      setImgSrc(`data:image/png;base64,${imgB64}`);
    }
  };

  return (
    <ToolLayout title='> BASE64.exe' subtitle="// Encode & decode Base64 text and images">
      <div className="flex gap-2 mb-6">
        {(['TEXT', 'IMAGE'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`font-mono text-xs px-3 py-1.5 rounded border transition-all ${tab === t ? 'border-primary bg-primary/10 text-primary' : 'border-primary/15 text-muted-foreground hover:text-primary'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'TEXT' && (
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 glass-card rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-primary/15">
              <span className="font-display text-xs text-primary">PLAIN TEXT</span>
              <div className="flex-1" />
              <button onClick={() => copyPlain.copy(plain)} className="font-mono text-[10px] text-muted-foreground hover:text-primary">{copyPlain.copied ? '[✓ COPIED]' : '[_COPY]'}</button>
              <button onClick={() => { setPlain(''); setEncoded(''); setError(''); }} className="font-mono text-[10px] text-muted-foreground hover:text-foreground">[_CLEAR]</button>
            </div>
            <textarea value={plain} onChange={(e) => setPlain(e.target.value)} placeholder="Enter text..." className="w-full h-64 p-4 bg-transparent font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none" spellCheck={false} />
            <div className="px-4 py-2 border-t border-primary/15">
              <button onClick={encode} className="btn-neon-green text-xs py-1.5 px-4 rounded">[_ENCODE →]</button>
            </div>
          </div>

          <div className="flex-1 glass-card rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-primary/15">
              <span className="font-display text-xs text-secondary">BASE64</span>
              <div className="flex-1" />
              <button onClick={() => copyEnc.copy(encoded)} className="font-mono text-[10px] text-muted-foreground hover:text-primary">{copyEnc.copied ? '[✓ COPIED]' : '[_COPY]'}</button>
            </div>
            <textarea value={encoded} onChange={(e) => setEncoded(e.target.value)} placeholder="Paste Base64..." className="w-full h-64 p-4 bg-transparent font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none" spellCheck={false} />
            <div className="px-4 py-2 border-t border-primary/15 flex items-center gap-3">
              <button onClick={decode} className="btn-neon-blue text-xs py-1.5 px-4 rounded">[← _DECODE]</button>
              {error && <span className="font-mono text-xs text-accent neon-text-pink">{error}</span>}
            </div>
          </div>
        </div>
      )}

      {tab === 'IMAGE' && (
        <div className="max-w-2xl space-y-6">
          <div className="glass-card rounded-lg p-5 space-y-4">
            <label className="font-mono text-xs text-muted-foreground block">UPLOAD IMAGE</label>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="font-mono text-sm text-foreground file:mr-4 file:py-1 file:px-3 file:rounded file:border file:border-primary/30 file:text-primary file:bg-transparent file:font-mono file:text-xs" />
          </div>

          <div className="glass-card rounded-lg p-5 space-y-3">
            <label className="font-mono text-xs text-muted-foreground block">BASE64 STRING</label>
            <textarea value={imgB64} onChange={(e) => setImgB64(e.target.value)} placeholder="Paste base64 data URL..." className="w-full h-32 bg-muted/50 border border-primary/15 rounded p-3 font-mono text-xs text-foreground resize-none focus:outline-none" />
            <div className="flex gap-2">
              <button onClick={decodeImgB64} className="btn-neon-blue text-xs py-1 px-3 rounded">[_PREVIEW]</button>
              <button onClick={() => copyImg.copy(imgB64)} className="btn-neon-green text-xs py-1 px-3 rounded">{copyImg.copied ? '[✓ COPIED]' : '[_COPY DATA URL]'}</button>
            </div>
          </div>

          {imgSrc && (
            <div className="glass-card rounded-lg p-5">
              <p className="font-mono text-xs text-muted-foreground mb-3">// PREVIEW</p>
              <img src={imgSrc} alt="Preview" className="max-w-full max-h-[300px] rounded border border-primary/15" />
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
};

export default Base64Tool;
