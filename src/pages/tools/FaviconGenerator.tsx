import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, Copy, Check, Type, Smile } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import JSZip from 'jszip';

type InputMode = 'upload' | 'text' | 'emoji';
type BgShape = 'square' | 'rounded' | 'circle';

const SIZES = [16, 32, 48, 64, 128, 180, 512];

const FaviconGenerator = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<InputMode>('text');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [text, setText] = useState('A');
  const [font, setFont] = useState('Orbitron');
  const [textColor, setTextColor] = useState('#00FF9C');
  const [bgColor, setBgColor] = useState('#0a0a0a');
  const [fontSize, setFontSize] = useState(70);
  const [bold, setBold] = useState(true);
  const [emoji, setEmoji] = useState('🚀');
  const [emojiPadding, setEmojiPadding] = useState(10);
  const [bgShape, setBgShape] = useState<BgShape>('rounded');
  const [borderRadius, setBorderRadius] = useState(20);
  const [padding, setPadding] = useState(10);
  const [previews, setPreviews] = useState<Record<number, string>>({});
  const [copied, setCopied] = useState(false);

  const renderFavicon = useCallback((size: number): string => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Background
    const r = bgShape === 'circle' ? size / 2 : bgShape === 'rounded' ? (borderRadius / 100) * (size / 2) : 0;
    ctx.beginPath();
    if (bgShape === 'circle') {
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    } else {
      ctx.roundRect(0, 0, size, size, r);
    }
    ctx.fillStyle = bgColor;
    ctx.fill();
    ctx.clip();

    const pad = (padding / 100) * size;

    if (mode === 'upload' && uploadedImage) {
      const img = new window.Image();
      img.src = uploadedImage;
      ctx.drawImage(img, pad, pad, size - pad * 2, size - pad * 2);
    } else if (mode === 'text') {
      const fs = (fontSize / 100) * (size - pad * 2);
      ctx.fillStyle = textColor;
      ctx.font = `${bold ? 'bold ' : ''}${fs}px ${font}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text.slice(0, 2), size / 2, size / 2 + fs * 0.05);
    } else if (mode === 'emoji') {
      const ep = (emojiPadding / 100) * size;
      const fs = size - ep * 2;
      ctx.font = `${fs}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, size / 2, size / 2 + fs * 0.05);
    }

    return canvas.toDataURL('image/png');
  }, [mode, uploadedImage, text, font, textColor, bgColor, fontSize, bold, emoji, emojiPadding, bgShape, borderRadius, padding]);

  useEffect(() => {
    const p: Record<number, string> = {};
    SIZES.forEach(s => { p[s] = renderFavicon(s); });
    setPreviews(p);
  }, [renderFavicon]);

  const handleUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
      setMode('upload');
    };
    reader.readAsDataURL(file);
  };

  const generatePackage = async () => {
    const zip = new JSZip();

    // Generate PNGs
    const sizes: Record<string, number> = {
      'favicon-16x16.png': 16,
      'favicon-32x32.png': 32,
      'apple-touch-icon.png': 180,
      'android-chrome-192x192.png': 192,
      'android-chrome-512x512.png': 512,
    };

    for (const [name, size] of Object.entries(sizes)) {
      const dataUrl = renderFavicon(size);
      const data = dataUrl.split(',')[1];
      zip.file(name, data, { base64: true });
    }

    // ICO (just use 32x32 PNG as ICO wrapper - simplified)
    const ico32 = renderFavicon(32).split(',')[1];
    zip.file('favicon.ico', ico32, { base64: true });

    // Webmanifest
    const manifest = JSON.stringify({
      name: '',
      short_name: '',
      icons: [
        { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }
      ],
      theme_color: bgColor,
      background_color: bgColor,
      display: 'standalone'
    }, null, 2);
    zip.file('site.webmanifest', manifest);

    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'favicon-package.zip';
    a.click();
    toast({ title: '// PACKAGE DOWNLOADED' });
  };

  const htmlSnippet = `<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">`;

  const copyHtml = () => {
    navigator.clipboard.writeText(htmlSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fonts = ['Orbitron', 'JetBrains Mono', 'Arial', 'Georgia'];
  const shapes: BgShape[] = ['square', 'rounded', 'circle'];

  return (
    <ToolLayout title="> FAVICON_GEN.exe" subtitle="// Generate favicon package for your website">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Input */}
        <div className="space-y-6">
          <Tabs value={mode} onValueChange={(v) => setMode(v as InputMode)}>
            <TabsList className="bg-muted/30 border border-primary/15">
              <TabsTrigger value="upload" className="font-mono text-xs data-[state=active]:text-primary"><Upload size={14} className="mr-1" />UPLOAD</TabsTrigger>
              <TabsTrigger value="text" className="font-mono text-xs data-[state=active]:text-primary"><Type size={14} className="mr-1" />TEXT</TabsTrigger>
              <TabsTrigger value="emoji" className="font-mono text-xs data-[state=active]:text-primary"><Smile size={14} className="mr-1" />EMOJI</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4 mt-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center cursor-pointer hover:border-primary/60 transition-colors"
              >
                <Upload size={32} className="mx-auto mb-2 text-primary" />
                <p className="font-mono text-xs text-muted-foreground">Click or drop PNG, JPG, SVG</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
            </TabsContent>

            <TabsContent value="text" className="space-y-4 mt-4">
              <div>
                <label className="font-mono text-[10px] text-muted-foreground">TEXT (1-2 chars)</label>
                <input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  maxLength={2}
                  className="w-full px-3 py-2 bg-muted/50 border border-primary/15 rounded font-display text-lg text-foreground focus:outline-none focus:border-primary/60"
                />
                {text.length > 2 && <p className="font-mono text-[10px] text-destructive mt-1">⚠ 1-2 characters recommended</p>}
              </div>
              <div>
                <label className="font-mono text-[10px] text-muted-foreground">FONT</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {fonts.map(f => (
                    <button key={f} onClick={() => setFont(f)} className={`font-mono text-[10px] px-3 py-1.5 rounded border transition-all ${font === f ? 'border-primary bg-primary/10 text-primary' : 'border-primary/15 text-muted-foreground hover:text-primary'}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-4">
                <div>
                  <label className="font-mono text-[10px] text-muted-foreground">TEXT COLOR</label>
                  <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="block w-10 h-10 rounded cursor-pointer bg-transparent" />
                </div>
                <div>
                  <label className="font-mono text-[10px] text-muted-foreground flex items-center gap-2">
                    BOLD
                    <input type="checkbox" checked={bold} onChange={e => setBold(e.target.checked)} className="accent-primary" />
                  </label>
                </div>
              </div>
              <div>
                <label className="font-mono text-[10px] text-muted-foreground">FONT SIZE: {fontSize}%</label>
                <Slider value={[fontSize]} onValueChange={([v]) => setFontSize(v)} min={20} max={100} step={1} />
              </div>
            </TabsContent>

            <TabsContent value="emoji" className="space-y-4 mt-4">
              <div>
                <label className="font-mono text-[10px] text-muted-foreground">EMOJI</label>
                <input value={emoji} onChange={e => setEmoji(e.target.value)} className="w-full px-3 py-2 bg-muted/50 border border-primary/15 rounded text-2xl focus:outline-none focus:border-primary/60" />
              </div>
              <div>
                <label className="font-mono text-[10px] text-muted-foreground">PADDING: {emojiPadding}%</label>
                <Slider value={[emojiPadding]} onValueChange={([v]) => setEmojiPadding(v)} min={0} max={40} step={1} />
              </div>
            </TabsContent>
          </Tabs>

          {/* Common customization */}
          <div className="glass-card rounded-lg p-4 space-y-4">
            <h3 className="font-mono text-xs text-primary">// CUSTOMIZATION</h3>
            <div>
              <label className="font-mono text-[10px] text-muted-foreground">BG COLOR</label>
              <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="block w-10 h-10 rounded cursor-pointer bg-transparent mt-1" />
            </div>
            <div>
              <label className="font-mono text-[10px] text-muted-foreground">SHAPE</label>
              <div className="flex gap-2 mt-1">
                {shapes.map(s => (
                  <button key={s} onClick={() => setBgShape(s)} className={`font-mono text-[10px] px-3 py-1.5 rounded border transition-all ${bgShape === s ? 'border-primary bg-primary/10 text-primary' : 'border-primary/15 text-muted-foreground hover:text-primary'}`}>
                    {s.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            {bgShape === 'rounded' && (
              <div>
                <label className="font-mono text-[10px] text-muted-foreground">BORDER RADIUS: {borderRadius}%</label>
                <Slider value={[borderRadius]} onValueChange={([v]) => setBorderRadius(v)} min={0} max={50} step={1} />
              </div>
            )}
            <div>
              <label className="font-mono text-[10px] text-muted-foreground">PADDING: {padding}%</label>
              <Slider value={[padding]} onValueChange={([v]) => setPadding(v)} min={0} max={30} step={1} />
            </div>
          </div>
        </div>

        {/* Right: Previews */}
        <div className="space-y-6">
          <div className="glass-card rounded-lg p-4">
            <h3 className="font-mono text-xs text-primary mb-4">// PREVIEW</h3>
            <div className="flex flex-wrap gap-4 items-end">
              {[16, 32, 48, 64, 128, 180].map(size => (
                <div key={size} className="text-center">
                  <div className="inline-block border border-primary/10 rounded p-1 bg-muted/30" style={{ imageRendering: size <= 32 ? 'pixelated' : 'auto' }}>
                    {previews[size] && <img src={previews[size]} alt="" width={Math.min(size, 80)} height={Math.min(size, 80)} className="block" />}
                  </div>
                  <p className="font-mono text-[10px] text-muted-foreground mt-1">{size}px</p>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={generatePackage} className="w-full font-display text-sm h-12 bg-primary text-primary-foreground hover:bg-primary/90">
            <Download size={16} /> [_GENERATE PACKAGE]
          </Button>

          {/* HTML snippet */}
          <div className="glass-card rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-mono text-xs text-primary">// HTML CODE</h3>
              <Button size="sm" variant="ghost" onClick={copyHtml} className="font-mono text-[10px]">
                {copied ? <><Check size={12} /> [✓ COPIED]</> : <><Copy size={12} /> [_COPY HTML]</>}
              </Button>
            </div>
            <pre className="font-mono text-[10px] text-muted-foreground bg-muted/30 rounded p-3 overflow-x-auto whitespace-pre">{htmlSnippet}</pre>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};

export default FaviconGenerator;
