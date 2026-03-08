import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import ToolLayout from '@/components/ToolLayout';

const BUTTON_NAMES = ['LEFT', 'MIDDLE', 'RIGHT', 'SIDE 1', 'SIDE 2'];

const MouseTester = () => {
  const [clicks, setClicks] = useState([0, 0, 0, 0, 0]);
  const [activeButtons, setActiveButtons] = useState<Set<number>>(new Set());
  const [testedButtons, setTestedButtons] = useState<Set<number>>(new Set());
  const [doubleClick, setDoubleClick] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [speed, setSpeed] = useState(0);
  const [scrollTotal, setScrollTotal] = useState(0);
  const [scrollDir, setScrollDir] = useState<'up' | 'down' | null>(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPosRef = useRef({ x: 0, y: 0, time: Date.now() });
  const trailRef = useRef<{ x: number; y: number; time: number }[]>([]);
  const animRef = useRef<number>(0);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const dcTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Click handling
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const btn = e.button; // 0=left, 1=middle, 2=right, 3=side1, 4=side2
    setActiveButtons(prev => new Set(prev).add(btn));
    setTestedButtons(prev => new Set(prev).add(btn));
    setClicks(prev => { const n = [...prev]; n[btn] = (n[btn] || 0) + 1; return n; });
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    setActiveButtons(prev => { const n = new Set(prev); n.delete(e.button); return n; });
  }, []);

  const handleDoubleClick = useCallback(() => {
    setDoubleClick(true);
    if (dcTimeoutRef.current) clearTimeout(dcTimeoutRef.current);
    dcTimeoutRef.current = setTimeout(() => setDoubleClick(false), 1500);
  }, []);

  // Canvas trail
  const handleCanvasMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const now = Date.now();
    const dt = now - lastPosRef.current.time;
    const dx = x - lastPosRef.current.x;
    const dy = y - lastPosRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dt > 0) setSpeed(Math.round((dist / dt) * 1000));
    setTotalDistance(prev => prev + dist);
    setPos({ x: Math.round(x), y: Math.round(y) });
    trailRef.current.push({ x, y, time: now });
    lastPosRef.current = { x, y, time: now };
  }, []);

  // Draw trail
  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const now = Date.now();

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Grid
      ctx.strokeStyle = 'rgba(0,255,156,0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 20) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 20) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
      }

      // Trail
      trailRef.current = trailRef.current.filter(p => now - p.time < 2000);
      for (let i = 1; i < trailRef.current.length; i++) {
        const p = trailRef.current[i];
        const prev = trailRef.current[i - 1];
        const alpha = 1 - (now - p.time) / 2000;
        ctx.strokeStyle = `rgba(0,255,156,${alpha * 0.8})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }

      // Crosshair
      if (trailRef.current.length > 0) {
        const last = trailRef.current[trailRef.current.length - 1];
        ctx.strokeStyle = 'rgba(0,212,255,0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(last.x - 10, last.y); ctx.lineTo(last.x + 10, last.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(last.x, last.y - 10); ctx.lineTo(last.x, last.y + 10); ctx.stroke();
      }

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // Scroll handling
  const handleScroll = useCallback((e: React.WheelEvent) => {
    const dir = e.deltaY < 0 ? 'up' : 'down';
    setScrollDir(dir);
    setScrollTotal(prev => prev + Math.abs(e.deltaY));
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => setScrollDir(null), 300);
  }, []);

  const resetAll = () => {
    setClicks([0, 0, 0, 0, 0]);
    setTestedButtons(new Set());
    setActiveButtons(new Set());
    setDoubleClick(false);
    setScrollTotal(0);
    setTotalDistance(0);
    setSpeed(0);
    trailRef.current = [];
  };

  const totalClicks = clicks.reduce((a, b) => a + b, 0);

  return (
    <ToolLayout title='> MOUSE_TEST.exe' subtitle="// Test every button and movement of your mouse">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Panel 1: Click Tester */}
        <div className="lg:col-span-4 glass-card rounded-lg p-4 space-y-4">
          <h3 className="font-display text-xs text-primary">CLICK TESTER</h3>

          {/* Mouse SVG diagram */}
          <div
            className="relative mx-auto select-none"
            style={{ width: 160, height: 220 }}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onContextMenu={e => e.preventDefault()}
            onDoubleClick={handleDoubleClick}
          >
            <svg viewBox="0 0 160 220" className="w-full h-full">
              {/* Body */}
              <path d="M30 60 Q30 10 80 10 Q130 10 130 60 L130 180 Q130 210 80 210 Q30 210 30 180 Z"
                fill="hsl(var(--muted)/0.3)" stroke="hsl(var(--primary)/0.4)" strokeWidth="2" />
              {/* Left button */}
              <path d="M30 60 Q30 10 80 10 L80 80 L30 80 Z"
                fill={activeButtons.has(0) ? 'hsl(var(--primary)/0.6)' : testedButtons.has(0) ? 'hsl(var(--secondary)/0.2)' : 'hsl(var(--muted)/0.15)'}
                stroke={testedButtons.has(0) ? 'hsl(var(--secondary)/0.6)' : 'hsl(var(--primary)/0.3)'}
                strokeWidth="2" className="cursor-pointer" />
              {/* Right button */}
              <path d="M130 60 Q130 10 80 10 L80 80 L130 80 Z"
                fill={activeButtons.has(2) ? 'hsl(var(--primary)/0.6)' : testedButtons.has(2) ? 'hsl(var(--secondary)/0.2)' : 'hsl(var(--muted)/0.15)'}
                stroke={testedButtons.has(2) ? 'hsl(var(--secondary)/0.6)' : 'hsl(var(--primary)/0.3)'}
                strokeWidth="2" className="cursor-pointer" />
              {/* Scroll wheel */}
              <rect x="70" y="45" width="20" height="35" rx="10"
                fill={activeButtons.has(1) ? 'hsl(var(--primary)/0.6)' : testedButtons.has(1) ? 'hsl(var(--secondary)/0.2)' : 'hsl(var(--muted)/0.3)'}
                stroke={testedButtons.has(1) ? 'hsl(var(--secondary)/0.6)' : 'hsl(var(--primary)/0.4)'}
                strokeWidth="1.5" className="cursor-pointer" />
              {/* Side buttons */}
              <rect x="22" y="95" width="12" height="25" rx="3"
                fill={activeButtons.has(3) ? 'hsl(var(--primary)/0.6)' : testedButtons.has(3) ? 'hsl(var(--secondary)/0.2)' : 'hsl(var(--muted)/0.2)'}
                stroke={testedButtons.has(3) ? 'hsl(var(--secondary)/0.6)' : 'hsl(var(--primary)/0.3)'}
                strokeWidth="1.5" />
              <rect x="22" y="125" width="12" height="25" rx="3"
                fill={activeButtons.has(4) ? 'hsl(var(--primary)/0.6)' : testedButtons.has(4) ? 'hsl(var(--secondary)/0.2)' : 'hsl(var(--muted)/0.2)'}
                stroke={testedButtons.has(4) ? 'hsl(var(--secondary)/0.6)' : 'hsl(var(--primary)/0.3)'}
                strokeWidth="1.5" />
            </svg>
          </div>

          {doubleClick && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-mono text-[10px] text-center text-primary bg-primary/10 border border-primary/30 rounded py-1">
              // DOUBLE CLICK DETECTED
            </motion.div>
          )}

          <div className="space-y-1">
            {BUTTON_NAMES.map((name, i) => (
              <div key={name} className="flex justify-between font-mono text-[10px]">
                <span className={clicks[i] > 0 ? 'text-secondary' : 'text-muted-foreground'}>{name}:</span>
                <span className="text-foreground">{clicks[i]} clicks</span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 2: Movement Tracker */}
        <div className="lg:col-span-5 glass-card rounded-lg p-4 space-y-4">
          <h3 className="font-display text-xs text-primary">MOVEMENT TRACKER</h3>

          <div className="border border-primary/20 rounded overflow-hidden">
            <canvas
              ref={canvasRef}
              width={400}
              height={300}
              onMouseMove={handleCanvasMove}
              className="w-full bg-background/50 cursor-none"
              style={{ aspectRatio: '4/3' }}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <span className="font-mono text-[10px] px-2 py-1 rounded border border-primary/20 text-foreground">
              X: <span className="text-primary">{pos.x}px</span>
            </span>
            <span className="font-mono text-[10px] px-2 py-1 rounded border border-primary/20 text-foreground">
              Y: <span className="text-primary">{pos.y}px</span>
            </span>
            <span className="font-mono text-[10px] px-2 py-1 rounded border border-primary/20 text-foreground">
              Speed: <span className="text-secondary">{speed}px/s</span>
            </span>
          </div>

          <button
            onClick={() => { trailRef.current = []; }}
            className="font-mono text-xs text-muted-foreground border border-muted px-3 py-1 rounded hover:text-primary hover:border-primary/40 transition-colors"
          >
            [_CLEAR TRAIL]
          </button>
        </div>

        {/* Panel 3: Scroll Tester */}
        <div className="lg:col-span-3 glass-card rounded-lg p-4 space-y-4">
          <h3 className="font-display text-xs text-primary">SCROLL TESTER</h3>

          <div
            onWheel={handleScroll}
            className="h-48 overflow-y-auto border border-primary/20 rounded p-3 bg-muted/10 scrollbar-thin"
          >
            {Array.from({ length: 30 }).map((_, i) => (
              <p key={i} className="font-mono text-[10px] text-muted-foreground/40 py-0.5">
                // line {i + 1} — scroll to test
              </p>
            ))}
          </div>

          <div className="flex justify-center gap-4">
            <div className={`text-3xl transition-all duration-200 ${scrollDir === 'up' ? 'text-primary scale-125 drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]' : 'text-muted-foreground/30'}`}>
              ↑
            </div>
            <div className={`text-3xl transition-all duration-200 ${scrollDir === 'down' ? 'text-primary scale-125 drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]' : 'text-muted-foreground/30'}`}>
              ↓
            </div>
          </div>

          <p className="font-mono text-[10px] text-muted-foreground text-center">
            // SCROLLED: <span className="text-primary">{Math.round(scrollTotal)}px</span> total
          </p>
        </div>
      </div>

      {/* Global stats */}
      <div className="glass-card rounded-lg p-4 mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-4 font-mono text-[10px]">
          <span className="text-muted-foreground">
            Total Clicks: <span className="text-primary">{totalClicks}</span>
          </span>
          <span className="text-muted-foreground">
            Scroll: <span className="text-primary">{Math.round(scrollTotal)}px</span>
          </span>
          <span className="text-muted-foreground">
            Distance: <span className="text-primary">{Math.round(totalDistance)}px</span>
          </span>
        </div>
        <button
          onClick={resetAll}
          className="font-mono text-xs text-destructive border border-destructive/30 px-3 py-1 rounded hover:bg-destructive/10 transition-colors"
        >
          [_RESET SESSION]
        </button>
      </div>
    </ToolLayout>
  );
};

export default MouseTester;
