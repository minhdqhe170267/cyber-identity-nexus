import { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import { Download } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import { useCopy } from '@/lib/copy';

const TABS = ['URL', 'TEXT', 'WIFI', 'EMAIL'] as const;
type Tab = typeof TABS[number];

const QrGenerator = () => {
  const [tab, setTab] = useState<Tab>('URL');
  const [url, setUrl] = useState('https://');
  const [text, setText] = useState('');
  const [wifi, setWifi] = useState({ ssid: '', password: '', enc: 'WPA' });
  const [email, setEmail] = useState({ to: '', subject: '', body: '' });
  const [size, setSize] = useState(300);
  const [fg, setFg] = useState('#00FF9C');
  const [bg, setBg] = useState('#000000');
  const [ecl, setEcl] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const { copied, copy } = useCopy();

  const getData = useCallback(() => {
    switch (tab) {
      case 'URL': return url;
      case 'TEXT': return text;
      case 'WIFI': return `WIFI:T:${wifi.enc};S:${wifi.ssid};P:${wifi.password};;`;
      case 'EMAIL': return `mailto:${email.to}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;
    }
  }, [tab, url, text, wifi, email]);

  const renderQr = useCallback(async () => {
    const data = getData();
    if (!data || !canvasRef.current) return;
    try {
      await QRCode.toCanvas(canvasRef.current, data, {
        width: size,
        margin: 2,
        color: { dark: fg, light: bg },
        errorCorrectionLevel: ecl,
      });
    } catch { /* invalid data */ }
  }, [getData, size, fg, bg, ecl]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(renderQr, 300);
    return () => clearTimeout(debounceRef.current);
  }, [renderQr]);

  const downloadPng = () => {
    if (!canvasRef.current) return;
    const a = document.createElement('a');
    a.download = 'qrcode.png';
    a.href = canvasRef.current.toDataURL('image/png');
    a.click();
  };

  const downloadSvg = async () => {
    const data = getData();
    if (!data) return;
    const svg = await QRCode.toString(data, { type: 'svg', color: { dark: fg, light: bg }, errorCorrectionLevel: ecl, margin: 2 });
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.download = 'qrcode.svg';
    a.href = URL.createObjectURL(blob);
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const copyImage = async () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return;
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      copy('copied');
    });
  };

  return (
    <ToolLayout title='> QR_GEN.exe' subtitle="// Generate QR codes for URLs, WiFi & more">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Input */}
        <div className="flex-1 space-y-4">
          <div className="flex gap-2">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`font-mono text-xs px-3 py-1.5 rounded border transition-all ${tab === t ? 'border-primary bg-primary/10 text-primary' : 'border-primary/15 text-muted-foreground hover:text-primary'}`}>{t}</button>
            ))}
          </div>

          <div className="glass-card rounded-lg p-5 space-y-3">
            {tab === 'URL' && <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" className="w-full bg-muted border border-primary/15 rounded px-3 py-2 font-mono text-sm text-foreground focus:outline-none" />}
            {tab === 'TEXT' && <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Enter text..." className="w-full h-32 bg-muted border border-primary/15 rounded p-3 font-mono text-sm text-foreground resize-none focus:outline-none" />}
            {tab === 'WIFI' && (
              <>
                <input value={wifi.ssid} onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })} placeholder="SSID" className="w-full bg-muted border border-primary/15 rounded px-3 py-2 font-mono text-sm text-foreground focus:outline-none" />
                <input value={wifi.password} onChange={(e) => setWifi({ ...wifi, password: e.target.value })} placeholder="Password" className="w-full bg-muted border border-primary/15 rounded px-3 py-2 font-mono text-sm text-foreground focus:outline-none" />
                <select value={wifi.enc} onChange={(e) => setWifi({ ...wifi, enc: e.target.value })} className="bg-muted border border-primary/15 rounded px-3 py-2 font-mono text-sm text-foreground focus:outline-none">
                  <option>WPA</option><option>WEP</option><option>None</option>
                </select>
              </>
            )}
            {tab === 'EMAIL' && (
              <>
                <input value={email.to} onChange={(e) => setEmail({ ...email, to: e.target.value })} placeholder="To" className="w-full bg-muted border border-primary/15 rounded px-3 py-2 font-mono text-sm text-foreground focus:outline-none" />
                <input value={email.subject} onChange={(e) => setEmail({ ...email, subject: e.target.value })} placeholder="Subject" className="w-full bg-muted border border-primary/15 rounded px-3 py-2 font-mono text-sm text-foreground focus:outline-none" />
                <textarea value={email.body} onChange={(e) => setEmail({ ...email, body: e.target.value })} placeholder="Body" className="w-full h-20 bg-muted border border-primary/15 rounded p-3 font-mono text-sm text-foreground resize-none focus:outline-none" />
              </>
            )}
          </div>

          {/* Customization */}
          <div className="glass-card rounded-lg p-5 space-y-4">
            <h3 className="font-display text-xs text-foreground">CUSTOMIZE</h3>
            <div>
              <label className="font-mono text-xs text-muted-foreground block mb-1">SIZE: {size}px</label>
              <input type="range" min={128} max={512} value={size} onChange={(e) => setSize(+e.target.value)} className="w-full accent-primary" />
            </div>
            <div className="flex gap-4">
              <div>
                <label className="font-mono text-xs text-muted-foreground block mb-1">FOREGROUND</label>
                <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="w-10 h-10 rounded border border-primary/15 cursor-pointer" />
              </div>
              <div>
                <label className="font-mono text-xs text-muted-foreground block mb-1">BACKGROUND</label>
                <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="w-10 h-10 rounded border border-primary/15 cursor-pointer" />
              </div>
            </div>
            <div>
              <label className="font-mono text-xs text-muted-foreground block mb-1">ERROR CORRECTION</label>
              <div className="flex gap-2">
                {(['L', 'M', 'Q', 'H'] as const).map((l) => (
                  <button key={l} onClick={() => setEcl(l)} className={`font-mono text-xs px-2 py-1 rounded border ${ecl === l ? 'border-primary text-primary' : 'border-primary/15 text-muted-foreground'}`}>{l}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 flex flex-col items-center">
          <div className="glass-card rounded-lg p-6 inline-block">
            <canvas ref={canvasRef} />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={downloadPng} className="btn-neon-green text-xs py-1.5 px-3 rounded flex items-center gap-1"><Download size={12} />[_PNG]</button>
            <button onClick={downloadSvg} className="btn-neon-blue text-xs py-1.5 px-3 rounded flex items-center gap-1"><Download size={12} />[_SVG]</button>
            <button onClick={copyImage} className="font-mono text-xs border border-primary/30 text-primary px-3 py-1.5 rounded hover:bg-primary/10 transition-colors">
              {copied ? '[✓ COPIED]' : '[_COPY IMAGE]'}
            </button>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};

export default QrGenerator;
