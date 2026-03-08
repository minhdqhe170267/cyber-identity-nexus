import { useState, useMemo, useCallback } from 'react';
import ToolLayout from '@/components/ToolLayout';
import { useCopy } from '@/lib/copy';

// Color conversion utils
const hexToRgb = (hex: string) => {
  const m = hex.replace('#', '').match(/.{2}/g);
  if (!m) return { r: 0, g: 0, b: 0 };
  return { r: parseInt(m[0], 16), g: parseInt(m[1], 16), b: parseInt(m[2], 16) };
};

const rgbToHex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

const rgbToHsl = (r: number, g: number, b: number) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

const hslToRgb = (h: number, s: number, l: number) => {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const hue2rgb = (p: number, q: number, t: number) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1/6) return p + (q - p) * 6 * t; if (t < 1/2) return q; if (t < 2/3) return p + (q - p) * (2/3 - t) * 6; return p; };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1/3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
};

const luminance = (r: number, g: number, b: number) => {
  const [rs, gs, bs] = [r, g, b].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

const contrastRatio = (rgb1: {r:number;g:number;b:number}, rgb2: {r:number;g:number;b:number}) => {
  const l1 = luminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = luminance(rgb2.r, rgb2.g, rgb2.b);
  const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

const TABS = ['CONVERTER', 'PALETTE', 'CONTRAST'] as const;

const ColorTools = () => {
  const [tab, setTab] = useState<typeof TABS[number]>('CONVERTER');
  const [hex, setHex] = useState('#00FF9C');
  const [fg, setFg] = useState('#00FF9C');
  const [bgColor, setBgColor] = useState('#000000');
  const copyHex = useCopy();
  const copyRgb = useCopy();
  const copyHsl = useCopy();

  const rgb = useMemo(() => hexToRgb(hex), [hex]);
  const hsl = useMemo(() => rgbToHsl(rgb.r, rgb.g, rgb.b), [rgb]);

  const palettes = useMemo(() => {
    const { h, s, l } = hsl;
    const hslHex = (hh: number, ss: number, ll: number) => {
      const { r, g, b } = hslToRgb(((hh % 360) + 360) % 360, ss, ll);
      return rgbToHex(r, g, b);
    };
    return {
      Complementary: [hex, hslHex(h + 180, s, l), hslHex(h + 180, s, Math.min(l + 15, 100)), hslHex(h, s, Math.min(l + 15, 100)), hslHex(h, Math.max(s - 20, 0), l)],
      Analogous: [hslHex(h - 30, s, l), hslHex(h - 15, s, l), hex, hslHex(h + 15, s, l), hslHex(h + 30, s, l)],
      Triadic: [hex, hslHex(h + 120, s, l), hslHex(h + 240, s, l), hslHex(h + 120, s, Math.min(l + 15, 100)), hslHex(h + 240, s, Math.min(l + 15, 100))],
      Monochromatic: [hslHex(h, s, 20), hslHex(h, s, 35), hex, hslHex(h, s, 65), hslHex(h, s, 80)],
    };
  }, [hex, hsl]);

  const cr = useMemo(() => contrastRatio(hexToRgb(fg), hexToRgb(bgColor)), [fg, bgColor]);

  const PassBadge = ({ pass, label }: { pass: boolean; label: string }) => (
    <span className={`font-mono text-xs px-2 py-0.5 rounded ${pass ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'}`}>
      {label}: {pass ? 'PASS' : 'FAIL'}
    </span>
  );

  return (
    <ToolLayout title='> COLOR_TOOLS.exe' subtitle="// Convert colors, generate palettes, check contrast">
      <div className="flex gap-2 mb-6">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`font-mono text-xs px-3 py-1.5 rounded border transition-all ${tab === t ? 'border-primary bg-primary/10 text-primary' : 'border-primary/15 text-muted-foreground hover:text-primary'}`}>{t}</button>
        ))}
      </div>

      {tab === 'CONVERTER' && (
        <div className="max-w-xl space-y-6">
          <div className="glass-card rounded-lg p-5 flex items-center gap-4">
            <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} className="w-16 h-16 rounded border border-primary/15 cursor-pointer" />
            <input value={hex} onChange={(e) => setHex(e.target.value)} className="flex-1 bg-muted border border-primary/15 rounded px-3 py-2 font-mono text-sm text-foreground focus:outline-none" />
            <div className="w-16 h-16 rounded border border-primary/15" style={{ backgroundColor: hex }} />
          </div>
          <div className="glass-card rounded-lg overflow-hidden">
            {[
              { label: 'HEX', value: hex, copier: copyHex },
              { label: 'RGB', value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, copier: copyRgb },
              { label: 'HSL', value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, copier: copyHsl },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between px-4 py-3 border-b border-primary/10">
                <span className="font-display text-xs text-primary">{row.label}</span>
                <div className="flex items-center gap-3">
                  <code className="font-mono text-sm text-foreground">{row.value}</code>
                  <button onClick={() => row.copier.copy(row.value)} className="font-mono text-[10px] text-muted-foreground hover:text-primary">
                    {row.copier.copied ? '[✓]' : '[_COPY]'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'PALETTE' && (
        <div className="space-y-6">
          <div className="glass-card rounded-lg p-4 flex items-center gap-3">
            <span className="font-mono text-xs text-muted-foreground">BASE:</span>
            <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} className="w-10 h-10 rounded border border-primary/15 cursor-pointer" />
            <code className="font-mono text-sm text-foreground">{hex}</code>
          </div>
          {Object.entries(palettes).map(([name, colors]) => (
            <div key={name} className="glass-card rounded-lg p-4">
              <h3 className="font-display text-xs text-foreground mb-3">{name.toUpperCase()}</h3>
              <div className="flex gap-2">
                {colors.map((c, i) => (
                  <button key={i} onClick={() => setHex(c)} className="flex-1 group">
                    <div className="h-16 rounded-t border border-primary/15" style={{ backgroundColor: c }} />
                    <div className="text-center font-mono text-[10px] text-muted-foreground py-1 group-hover:text-primary transition-colors">{c}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'CONTRAST' && (
        <div className="max-w-xl space-y-6">
          <div className="glass-card rounded-lg p-5 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="font-mono text-xs text-muted-foreground block mb-1">FOREGROUND</label>
              <div className="flex items-center gap-2">
                <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="w-10 h-10 rounded border border-primary/15 cursor-pointer" />
                <input value={fg} onChange={(e) => setFg(e.target.value)} className="flex-1 bg-muted border border-primary/15 rounded px-3 py-2 font-mono text-xs text-foreground focus:outline-none" />
              </div>
            </div>
            <div className="flex-1">
              <label className="font-mono text-xs text-muted-foreground block mb-1">BACKGROUND</label>
              <div className="flex items-center gap-2">
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-10 h-10 rounded border border-primary/15 cursor-pointer" />
                <input value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="flex-1 bg-muted border border-primary/15 rounded px-3 py-2 font-mono text-xs text-foreground focus:outline-none" />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-lg p-8 border border-primary/15" style={{ backgroundColor: bgColor }}>
            <p className="font-mono text-2xl mb-2" style={{ color: fg }}>Sample Text</p>
            <p className="font-mono text-sm" style={{ color: fg }}>The quick brown fox jumps over the lazy dog.</p>
          </div>

          {/* Ratio */}
          <div className="glass-card rounded-lg p-5 text-center">
            <p className="font-display text-3xl text-foreground">{cr.toFixed(2)}:1</p>
            <p className="font-mono text-xs text-muted-foreground mt-1">CONTRAST RATIO</p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <PassBadge pass={cr >= 4.5} label="AA Normal" />
              <PassBadge pass={cr >= 3} label="AA Large" />
              <PassBadge pass={cr >= 7} label="AAA Normal" />
              <PassBadge pass={cr >= 4.5} label="AAA Large" />
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};

export default ColorTools;
