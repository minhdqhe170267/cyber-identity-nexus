import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, Copy, Check, Image, Layers, X, Lock, Unlock, GripVertical } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import JSZip from 'jszip';

type OutputFormat = 'png' | 'jpg' | 'webp' | 'base64';

interface ImageFile {
  file: File;
  url: string;
  width: number;
  height: number;
}

interface ConvertedImage {
  url: string;
  blob: Blob | null;
  base64: string;
  width: number;
  height: number;
  size: number;
  format: string;
}

const ImageConverter = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [converted, setConverted] = useState<ConvertedImage[]>([]);
  const [format, setFormat] = useState<OutputFormat>('png');
  const [quality, setQuality] = useState(85);
  const [resizeEnabled, setResizeEnabled] = useState(false);
  const [lockAspect, setLockAspect] = useState(true);
  const [targetWidth, setTargetWidth] = useState(0);
  const [targetHeight, setTargetHeight] = useState(0);
  const [maxSizeEnabled, setMaxSizeEnabled] = useState(false);
  const [maxSizeKB, setMaxSizeKB] = useState(500);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [copied, setCopied] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [comparePos, setComparePos] = useState(50);
  const compareRef = useRef<HTMLDivElement>(null);

  const aspectRatio = useRef(1);

  const loadImage = (file: File): Promise<ImageFile> => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        resolve({ file, url, width: img.width, height: img.height });
      };
      img.src = url;
    });
  };

  const handleFiles = async (files: FileList | File[]) => {
    const fileArr = Array.from(files).filter(f => /image\/(png|jpeg|jpg|webp|gif|bmp|svg)/.test(f.type) || f.name.endsWith('.svg'));
    const max = batchMode ? 10 : 1;
    const sliced = fileArr.slice(0, max);
    const loaded = await Promise.all(sliced.map(loadImage));
    setImages(loaded);
    setConverted([]);
    if (loaded.length > 0) {
      const first = loaded[0];
      aspectRatio.current = first.width / first.height;
      setTargetWidth(first.width);
      setTargetHeight(first.height);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }, [batchMode]);

  const convertImage = async (img: ImageFile, fmt: OutputFormat, q: number): Promise<ConvertedImage> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const image = new window.Image();
    
    await new Promise<void>((resolve) => {
      image.onload = () => resolve();
      image.src = img.url;
    });

    let w = resizeEnabled && targetWidth > 0 ? targetWidth : img.width;
    let h = resizeEnabled && targetHeight > 0 ? targetHeight : img.height;
    canvas.width = w;
    canvas.height = h;

    if (fmt === 'jpg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
    }

    ctx.drawImage(image, 0, 0, w, h);

    const mimeMap: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', base64: 'image/png' };
    const mime = mimeMap[fmt] || 'image/png';
    let qualityVal = (fmt === 'jpg' || fmt === 'webp') ? q / 100 : undefined;

    if (maxSizeEnabled && (fmt === 'jpg' || fmt === 'webp')) {
      let lo = 0.01, hi = qualityVal || 1, best: Blob | null = null;
      for (let i = 0; i < 10; i++) {
        const mid = (lo + hi) / 2;
        const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, mime, mid));
        if (blob && blob.size / 1024 <= maxSizeKB) {
          best = blob;
          lo = mid;
        } else {
          hi = mid;
        }
      }
      if (best) {
        const base64 = canvas.toDataURL(mime, lo);
        return { url: URL.createObjectURL(best), blob: best, base64, width: w, height: h, size: best.size, format: fmt };
      }
    }

    const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, mime, qualityVal));
    const base64 = canvas.toDataURL(mime, qualityVal);
    return {
      url: blob ? URL.createObjectURL(blob) : base64,
      blob,
      base64,
      width: w,
      height: h,
      size: blob?.size || Math.round(base64.length * 0.75),
      format: fmt
    };
  };

  const handleConvert = async () => {
    if (images.length === 0) return;
    setProcessing(true);
    setProgress({ current: 0, total: images.length });
    const results: ConvertedImage[] = [];
    for (let i = 0; i < images.length; i++) {
      const result = await convertImage(images[i], format, quality);
      results.push(result);
      setProgress({ current: i + 1, total: images.length });
    }
    setConverted(results);
    setProcessing(false);
    toast({ title: '// CONVERSION COMPLETE', description: `${results.length} image(s) converted to ${format.toUpperCase()}` });
  };

  const downloadFile = (conv: ConvertedImage, index: number) => {
    if (format === 'base64') {
      navigator.clipboard.writeText(conv.base64);
      toast({ title: '// BASE64 COPIED' });
      return;
    }
    const a = document.createElement('a');
    a.href = conv.url;
    a.download = `converted-${index + 1}.${format === 'jpg' ? 'jpg' : format}`;
    a.click();
  };

  const downloadAllZip = async () => {
    const zip = new JSZip();
    for (let i = 0; i < converted.length; i++) {
      const c = converted[i];
      if (c.blob) zip.file(`converted-${i + 1}.${format}`, c.blob);
    }
    const content = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = 'converted-images.zip';
    a.click();
  };

  const copyBase64 = (base64: string) => {
    navigator.clipboard.writeText(base64);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWidthChange = (val: string) => {
    const w = parseInt(val) || 0;
    setTargetWidth(w);
    if (lockAspect && aspectRatio.current) {
      setTargetHeight(Math.round(w / aspectRatio.current));
    }
  };

  const handleHeightChange = (val: string) => {
    const h = parseInt(val) || 0;
    setTargetHeight(h);
    if (lockAspect && aspectRatio.current) {
      setTargetWidth(Math.round(h * aspectRatio.current));
    }
  };

  const setPreset = (w: number, h: number) => {
    setTargetWidth(w);
    setTargetHeight(h);
    aspectRatio.current = w / h;
  };

  const presets = [
    [1920, 1080], [1280, 720], [800, 600], [512, 512], [256, 256], [128, 128]
  ] as const;

  const formats: OutputFormat[] = ['png', 'jpg', 'webp', 'base64'];

  const handleCompareMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!compareRef.current) return;
    const rect = compareRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const pos = ((clientX - rect.left) / rect.width) * 100;
    setComparePos(Math.max(0, Math.min(100, pos)));
  };

  return (
    <ToolLayout title="> IMAGE_CONVERTER.exe" subtitle="// Convert, resize and compress images — 100% client-side">
      {/* Batch toggle */}
      <div className="flex items-center gap-3 mb-6">
        <span className={`font-mono text-xs ${!batchMode ? 'text-primary' : 'text-muted-foreground'}`}>SINGLE</span>
        <Switch checked={batchMode} onCheckedChange={(v) => { setBatchMode(v); setImages([]); setConverted([]); }} />
        <span className={`font-mono text-xs ${batchMode ? 'text-primary' : 'text-muted-foreground'}`}>BATCH (up to 10)</span>
      </div>

      {/* Upload area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-300 ${
          dragOver ? 'border-primary bg-primary/10 shadow-[0_0_30px_rgba(0,255,156,0.2)]' : 'border-primary/30 bg-muted/20 hover:border-primary/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={batchMode}
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <Upload size={40} className="mx-auto mb-3 text-primary" />
        <p className="font-display text-sm text-foreground">DRAG & DROP IMAGE{batchMode ? 'S' : ''} HERE</p>
        <p className="font-mono text-xs text-muted-foreground mt-1">or click to browse • PNG, JPG, WebP, GIF, BMP, SVG</p>
      </div>

      {/* Image previews */}
      <AnimatePresence>
        {images.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
            <div className="flex flex-wrap gap-4">
              {images.map((img, i) => (
                <div key={i} className="glass-card rounded-lg p-3 relative group">
                  <img src={img.url} alt="" className="max-h-[200px] max-w-[200px] object-contain rounded" />
                  <p className="font-mono text-[10px] text-muted-foreground mt-2 truncate max-w-[200px]">{img.file.name}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {img.width}×{img.height} • {(img.file.size / 1024).toFixed(1)} KB
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setImages(prev => prev.filter((_, j) => j !== i)); setConverted([]); }}
                    className="absolute top-1 right-1 p-1 rounded bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} className="text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Options */}
      {images.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-6">
          {/* Format */}
          <div>
            <label className="font-mono text-xs text-muted-foreground mb-2 block">OUTPUT FORMAT</label>
            <div className="flex gap-2">
              {formats.map(f => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`font-mono text-xs px-4 py-2 rounded border transition-all ${
                    format === f ? 'border-primary bg-primary/10 text-primary' : 'border-primary/15 text-muted-foreground hover:text-primary'
                  }`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Quality */}
          {(format === 'jpg' || format === 'webp') && (
            <div>
              <label className="font-mono text-xs text-muted-foreground mb-2 block">QUALITY: {quality}%</label>
              <Slider value={[quality]} onValueChange={([v]) => setQuality(v)} min={1} max={100} step={1} className="max-w-md" />
            </div>
          )}

          {/* Resize */}
          <div className="glass-card rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Switch checked={resizeEnabled} onCheckedChange={setResizeEnabled} />
              <span className="font-mono text-xs text-foreground">RESIZE</span>
            </div>
            {resizeEnabled && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div>
                    <label className="font-mono text-[10px] text-muted-foreground">WIDTH (px)</label>
                    <input
                      type="number"
                      value={targetWidth || ''}
                      onChange={e => handleWidthChange(e.target.value)}
                      className="w-24 px-2 py-1.5 bg-muted/50 border border-primary/15 rounded font-mono text-sm text-foreground focus:outline-none focus:border-primary/60"
                    />
                  </div>
                  <button onClick={() => setLockAspect(!lockAspect)} className="mt-4 text-primary">
                    {lockAspect ? <Lock size={16} /> : <Unlock size={16} />}
                  </button>
                  <div>
                    <label className="font-mono text-[10px] text-muted-foreground">HEIGHT (px)</label>
                    <input
                      type="number"
                      value={targetHeight || ''}
                      onChange={e => handleHeightChange(e.target.value)}
                      className="w-24 px-2 py-1.5 bg-muted/50 border border-primary/15 rounded font-mono text-sm text-foreground focus:outline-none focus:border-primary/60"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {presets.map(([w, h]) => (
                    <button
                      key={`${w}x${h}`}
                      onClick={() => setPreset(w, h)}
                      className="font-mono text-[10px] px-2 py-1 rounded border border-primary/20 text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                    >
                      {w}×{h}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Max size */}
          {(format === 'jpg' || format === 'webp') && (
            <div className="glass-card rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Switch checked={maxSizeEnabled} onCheckedChange={setMaxSizeEnabled} />
                <span className="font-mono text-xs text-foreground">MAX FILE SIZE</span>
              </div>
              {maxSizeEnabled && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={maxSizeKB}
                    onChange={e => setMaxSizeKB(parseInt(e.target.value) || 0)}
                    className="w-24 px-2 py-1.5 bg-muted/50 border border-primary/15 rounded font-mono text-sm text-foreground focus:outline-none focus:border-primary/60"
                  />
                  <span className="font-mono text-xs text-muted-foreground">KB</span>
                </div>
              )}
            </div>
          )}

          {/* Convert button */}
          <Button onClick={handleConvert} disabled={processing} className="w-full font-display text-sm h-12 bg-primary text-primary-foreground hover:bg-primary/90">
            {processing ? `PROCESSING ${progress.current}/${progress.total}...` : '[_CONVERT]'}
          </Button>
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence>
        {converted.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-6">
            <h2 className="font-display text-sm text-primary">// OUTPUT</h2>

            {converted.map((conv, i) => {
              const original = images[i];
              const ratio = original ? ((1 - conv.size / original.file.size) * 100) : 0;
              const reduced = ratio > 0;
              return (
                <div key={i} className="glass-card rounded-lg p-4 space-y-3">
                  <div className="flex flex-wrap gap-4 items-start">
                    <img src={conv.url} alt="" className="max-h-[200px] max-w-[200px] object-contain rounded" />
                    <div className="space-y-1">
                      <p className="font-mono text-xs text-foreground">{conv.width}×{conv.height} • {(conv.size / 1024).toFixed(1)} KB • {conv.format.toUpperCase()}</p>
                      {original && (
                        <p className={`font-mono text-xs ${reduced ? 'text-primary' : 'text-destructive'}`}>
                          // SIZE {reduced ? 'REDUCED' : 'INCREASED'} BY {Math.abs(ratio).toFixed(1)}%
                        </p>
                      )}
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" onClick={() => downloadFile(conv, i)} className="font-mono text-xs">
                          <Download size={14} /> [_DOWNLOAD {format.toUpperCase()}]
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => copyBase64(conv.base64)} className="font-mono text-xs">
                          {copied ? <Check size={14} /> : <Copy size={14} />}
                          {copied ? '[✓ COPIED]' : '[_COPY BASE64]'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Compare */}
                  {original && !batchMode && (
                    <div>
                      <button onClick={() => setCompareMode(!compareMode)} className="font-mono text-[10px] text-primary hover:underline">
                        {compareMode ? 'HIDE' : 'SHOW'} COMPARISON
                      </button>
                      {compareMode && (
                        <div
                          ref={compareRef}
                          className="relative w-full h-[250px] mt-3 rounded overflow-hidden cursor-col-resize border border-primary/20"
                          onMouseMove={handleCompareMove}
                          onTouchMove={handleCompareMove}
                        >
                          <img src={original.url} alt="original" className="absolute inset-0 w-full h-full object-contain" />
                          <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - comparePos}% 0 0)` }}>
                            <img src={conv.url} alt="converted" className="absolute inset-0 w-full h-full object-contain" />
                          </div>
                          <div className="absolute top-0 bottom-0 w-0.5 bg-primary" style={{ left: `${comparePos}%` }}>
                            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                              <GripVertical size={12} className="text-primary-foreground" />
                            </div>
                          </div>
                          <span className="absolute top-2 left-2 font-mono text-[10px] bg-background/70 px-1 rounded text-muted-foreground">ORIGINAL</span>
                          <span className="absolute top-2 right-2 font-mono text-[10px] bg-background/70 px-1 rounded text-primary">CONVERTED</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {batchMode && converted.length > 1 && (
              <Button onClick={downloadAllZip} className="w-full font-display text-sm h-12">
                <Layers size={16} /> [_DOWNLOAD ALL AS ZIP]
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </ToolLayout>
  );
};

export default ImageConverter;
