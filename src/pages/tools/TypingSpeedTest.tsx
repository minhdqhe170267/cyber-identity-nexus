import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Area, AreaChart, ScatterChart, Scatter } from 'recharts';
import { Trophy, Volume2, VolumeX, RotateCcw, Flame, Zap, Target, Clock, Hash, Type, BookOpen, Infinity, ArrowLeft, ChevronRight, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { top200english, top1000english, top200vietnamese, top500vietnamese, quotes, type Quote } from '@/data/typingWordPools';

// ─── Types ───
type TestMode = 'time' | 'words' | 'quote' | 'zen';
type TestState = 'idle' | 'running' | 'finished';
type QuoteLength = 'short' | 'medium' | 'long' | 'epic';
type Language = 'english' | 'vietnamese';

const TIME_VALUES = [15, 30, 60, 120];
const WORD_VALUES = [10, 25, 50, 100];
const QUOTE_VALUES: QuoteLength[] = ['short', 'medium', 'long', 'epic'];
const MODE_ICONS: Record<TestMode, React.ElementType> = { time: Clock, words: Hash, quote: BookOpen, zen: Infinity };

// ─── Sound effects ───
let audioCtx: AudioContext | null = null;
function getAudioCtx() { if (!audioCtx) audioCtx = new AudioContext(); return audioCtx; }
function playClick() {
  try { const ctx = getAudioCtx(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.type = 'square'; o.frequency.setValueAtTime(800, ctx.currentTime); g.gain.setValueAtTime(0.03, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05); o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.05); } catch {}
}
function playError() {
  try { const ctx = getAudioCtx(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.type = 'sawtooth'; o.frequency.setValueAtTime(200, ctx.currentTime); g.gain.setValueAtTime(0.04, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08); o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.08); } catch {}
}
function playComplete() {
  try { const ctx = getAudioCtx(); [523, 659, 784].forEach((f, i) => { const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.type = 'square'; o.frequency.setValueAtTime(f, ctx.currentTime + i * 0.1); g.gain.setValueAtTime(0.04, ctx.currentTime + i * 0.1); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.15); o.start(ctx.currentTime + i * 0.1); o.stop(ctx.currentTime + i * 0.1 + 0.15); }); } catch {}
}

// ─── Helpers ───
function shuffle<T>(arr: T[]): T[] { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function generateWords(count: number, pool: string[], punctuation: boolean, numbers: boolean): string[] {
  const words: string[] = []; const shuffled = shuffle(pool); let idx = 0; let afterEnd = false;
  while (words.length < count) {
    if (numbers && words.length > 0 && words.length % 8 === 0) { words.push(String(Math.floor(Math.random() * 1000) + 1)); continue; }
    let word = shuffled[idx % shuffled.length]; idx++;
    if (afterEnd) { word = word.charAt(0).toUpperCase() + word.slice(1); afterEnd = false; }
    if (punctuation && Math.random() < 0.15) { const p = ['.', ',', ';', ':', '!', '?'][Math.floor(Math.random() * 6)]; word += p; if (['.', '!', '?'].includes(p)) afterEnd = true; }
    words.push(word);
  }
  return words;
}

function getQuote(length: QuoteLength): Quote {
  const f = quotes.filter(q => q.length === length);
  return f.length > 0 ? f[Math.floor(Math.random() * f.length)] : quotes[Math.floor(Math.random() * quotes.length)];
}

function getRating(wpm: number) {
  if (wpm >= 130) return { label: 'HACKER TIER', cls: 'animate-pulse bg-gradient-to-r from-primary via-secondary to-destructive bg-clip-text text-transparent', icon: '🔥' };
  if (wpm >= 110) return { label: 'ELITE', cls: 'bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent', icon: '⚡' };
  if (wpm >= 90) return { label: 'BLAZING', cls: 'text-destructive drop-shadow-[0_0_8px_hsl(var(--destructive)/0.6)]', icon: '🚀' };
  if (wpm >= 70) return { label: 'FAST', cls: 'text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]', icon: '💨' };
  if (wpm >= 50) return { label: 'SKILLED', cls: 'text-primary', icon: '✨' };
  if (wpm >= 30) return { label: 'AVERAGE', cls: 'text-secondary', icon: '👍' };
  return { label: 'ROOKIE', cls: 'text-muted-foreground', icon: '🌱' };
}

// ─── Main Component ───
const TypingSpeedTest = () => {
  const [mode, setMode] = useState<TestMode>('time');
  const [timeValue, setTimeValue] = useState(30);
  const [wordValue, setWordValue] = useState(25);
  const [quoteValue, setQuoteValue] = useState<QuoteLength>('medium');
  const [punctuation, setPunctuation] = useState(false);
  const [numbers, setNumbers] = useState(false);
  const [language, setLanguage] = useState<Language>('english');
  const [soundOn, setSoundOn] = useState(false);

  const [testState, setTestState] = useState<TestState>('idle');
  const [words, setWords] = useState<string[]>([]);
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [inputBuffer, setInputBuffer] = useState('');
  const [wordResults, setWordResults] = useState<Array<{ typed: string; target: string }>>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [elapsed, setElapsed] = useState(0);
  const [capsLock, setCapsLock] = useState(false);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [shake, setShake] = useState(false);
  const [lastKeyPressed, setLastKeyPressed] = useState('');

  const [correctChars, setCorrectChars] = useState(0);
  const [incorrectChars, setIncorrectChars] = useState(0);
  const [wpmHistory, setWpmHistory] = useState<{ time: number; wpm: number; raw: number; errors: number }[]>([]);
  const [errorTimeline, setErrorTimeline] = useState<number[]>([]);
  const [liveWpm, setLiveWpm] = useState(0);
  const [liveRaw, setLiveRaw] = useState(0);
  const [liveAcc, setLiveAcc] = useState(100);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [keyFrequency, setKeyFrequency] = useState<Record<string, number>>({});

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const statsRef = useRef<ReturnType<typeof setInterval>>();
  const startTimeRef = useRef(0);
  const correctRef = useRef(0);
  const incorrectRef = useRef(0);
  const totalKeysRef = useRef(0);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [lineOffset, setLineOffset] = useState(0);

  const [playerName, setPlayerName] = useState('');
  const [saving, setSaving] = useState(false);

  // Generate test
  const generateTest = useCallback(() => {
    const pool = language === 'vietnamese' ? top200vietnamese : top200english;
    const poolLarge = language === 'vietnamese' ? top500vietnamese : top1000english;
    let w: string[];
    if (mode === 'quote') { const q = getQuote(quoteValue); setCurrentQuote(q); w = q.text.split(/\s+/); }
    else if (mode === 'words') w = generateWords(wordValue, pool, punctuation, numbers);
    else if (mode === 'zen') w = generateWords(200, pool, punctuation, numbers);
    else w = generateWords(300, pool, punctuation, numbers);
    setWords(w); setWordIndex(0); setCharIndex(0); setInputBuffer(''); setWordResults([]);
    setTimeLeft(mode === 'time' ? timeValue : 0); setElapsed(0); setCorrectChars(0); setIncorrectChars(0);
    setWpmHistory([]); setErrorTimeline([]); setLiveWpm(0); setLiveRaw(0); setLiveAcc(100);
    setConsecutiveErrors(0); setTestState('idle'); setLineOffset(0); setStreak(0); setMaxStreak(0); setKeyFrequency({});
    correctRef.current = 0; incorrectRef.current = 0; totalKeysRef.current = 0;
    if (timerRef.current) clearInterval(timerRef.current);
    if (statsRef.current) clearInterval(statsRef.current);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [mode, timeValue, wordValue, quoteValue, punctuation, numbers, language]);

  useEffect(() => { generateTest(); }, [generateTest]);

  const startTest = useCallback(() => {
    if (testState !== 'idle') return;
    setTestState('running'); startTimeRef.current = Date.now();
    if (mode === 'time') {
      setTimeLeft(timeValue);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => { if (prev <= 1) { clearInterval(timerRef.current); clearInterval(statsRef.current); setTestState('finished'); return 0; } return prev - 1; });
        setElapsed(prev => prev + 1);
      }, 1000);
    } else {
      timerRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000);
    }
    statsRef.current = setInterval(() => {
      const elapsedMin = (Date.now() - startTimeRef.current) / 60000;
      if (elapsedMin > 0) {
        const wpm = Math.round((correctRef.current / 5) / elapsedMin);
        const raw = Math.round((totalKeysRef.current / 5) / elapsedMin);
        const acc = totalKeysRef.current > 0 ? Math.round((correctRef.current / totalKeysRef.current) * 100) : 100;
        setLiveWpm(wpm); setLiveRaw(raw); setLiveAcc(acc);
        setWpmHistory(prev => [...prev, { time: Math.round((Date.now() - startTimeRef.current) / 1000), wpm, raw, errors: incorrectRef.current }]);
      }
    }, 1000);
  }, [testState, mode, timeValue, soundOn]);

  const endTest = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (statsRef.current) clearInterval(statsRef.current);
    if (soundOn) playComplete();
    setTestState('finished'); setElapsed(Math.round((Date.now() - startTimeRef.current) / 1000));
  }, [soundOn]);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); if (statsRef.current) clearInterval(statsRef.current); }, []);

  // Line scroll
  useEffect(() => {
    if (!textContainerRef.current || !wordRefs.current[wordIndex]) return;
    const cR = textContainerRef.current.getBoundingClientRect();
    const wR = wordRefs.current[wordIndex]!.getBoundingClientRect();
    const relTop = wR.top - cR.top + lineOffset;
    if (relTop > 64) setLineOffset(prev => prev + (relTop - 32));
  }, [wordIndex]);

  // Key handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.getModifierState) setCapsLock(e.getModifierState('CapsLock'));
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') { e.preventDefault(); return; }
    if (e.key === 'Tab') { e.preventDefault(); generateTest(); return; }
    if (e.key === 'Escape') { e.preventDefault(); if (testState === 'running') { if (mode === 'zen') endTest(); else generateTest(); } return; }
    if (testState === 'finished') return;

    const currentWord = words[wordIndex] || '';

    if (e.key === 'Backspace') {
      e.preventDefault();
      if (e.ctrlKey) { setInputBuffer(''); setCharIndex(0); }
      else if (inputBuffer.length > 0) { setInputBuffer(prev => prev.slice(0, -1)); setCharIndex(prev => Math.max(0, prev - 1)); }
      return;
    }

    if (e.key === ' ') {
      e.preventDefault();
      if (inputBuffer.length === 0) return;
      if (testState === 'idle') startTest();
      const target = currentWord; const typed = inputBuffer;
      setWordResults(prev => [...prev, { typed, target }]);
      for (let i = 0; i < Math.max(typed.length, target.length); i++) {
        if (i < typed.length && i < target.length && typed[i] === target[i]) { correctRef.current++; setCorrectChars(c => c + 1); }
        else { incorrectRef.current++; setIncorrectChars(c => c + 1); }
        totalKeysRef.current++;
      }
      setWordIndex(prev => prev + 1); setCharIndex(0); setInputBuffer(''); setConsecutiveErrors(0);
      if ((mode === 'words' || mode === 'quote') && wordIndex + 1 >= words.length) endTest();
      if (mode === 'zen' && wordIndex + 1 >= words.length - 20) { const pool = language === 'vietnamese' ? top200vietnamese : top200english; setWords(prev => [...prev, ...generateWords(100, pool, punctuation, numbers)]); }
      return;
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      if (testState === 'idle') startTest();
      setLastKeyPressed(e.key);
      setKeyFrequency(prev => ({ ...prev, [e.key.toLowerCase()]: (prev[e.key.toLowerCase()] || 0) + 1 }));
      const isCorrect = charIndex < currentWord.length && e.key === currentWord[charIndex];
      if (isCorrect) { if (soundOn) playClick(); setConsecutiveErrors(0); setStreak(s => { const n = s + 1; setMaxStreak(m => Math.max(m, n)); return n; }); }
      else { if (soundOn) playError(); setStreak(0); setConsecutiveErrors(prev => { const n = prev + 1; if (n >= 5) { setShake(true); setTimeout(() => setShake(false), 300); } return n; }); setErrorTimeline(prev => [...prev, Math.round((Date.now() - startTimeRef.current) / 1000)]); }
      setInputBuffer(prev => prev + e.key); setCharIndex(prev => prev + 1);
    }
  }, [testState, words, wordIndex, charIndex, inputBuffer, mode, punctuation, numbers, soundOn, startTest, endTest, generateTest]);

  // Results
  const results = useMemo(() => {
    if (testState !== 'finished') return null;
    const tc = correctChars; const ti = incorrectChars; const total = tc + ti;
    const elMin = Math.max(elapsed, 1) / 60;
    const wpm = Math.round((tc / 5) / elMin); const rawWpm = Math.round((total / 5) / elMin);
    const accuracy = total > 0 ? Math.round((tc / total) * 100) : 100;
    const wpmV = wpmHistory.map(h => h.wpm);
    const mean = wpmV.length > 0 ? wpmV.reduce((a, b) => a + b, 0) / wpmV.length : 0;
    const variance = wpmV.length > 1 ? wpmV.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / wpmV.length : 0;
    const consistency = mean > 0 ? Math.max(0, Math.min(100, Math.round(100 - (Math.sqrt(variance) / mean) * 100))) : 100;
    const missedWords = wordResults.filter(r => r.typed !== r.target).length;
    return { wpm, rawWpm, accuracy, consistency, totalCorrect: tc, totalIncorrect: ti, missedWords, wordCount: wordResults.length };
  }, [testState, correctChars, incorrectChars, elapsed, wpmHistory, wordResults]);

  const saveScore = async () => {
    if (!playerName.trim() || !results) return; setSaving(true);
    const modeVal = mode === 'time' ? String(timeValue) : mode === 'words' ? String(wordValue) : mode === 'quote' ? quoteValue : 'zen';
    const { error } = await supabase.from('typing_scores' as any).insert({ player_name: playerName.trim(), wpm: results.wpm, raw_wpm: results.rawWpm, accuracy: results.accuracy, consistency: results.consistency, mode, mode_value: modeVal, duration_seconds: elapsed, word_count: results.wordCount, correct_chars: results.totalCorrect, incorrect_chars: results.totalIncorrect } as any);
    setSaving(false);
    if (error) toast({ title: '// ERROR', description: error.message, variant: 'destructive' });
    else { toast({ title: '// SCORE SAVED' }); setPlayerName(''); }
  };

  const progressPct = useMemo(() => {
    if (mode === 'time') return (timeLeft / timeValue) * 100;
    if (mode === 'words' || mode === 'quote') return (wordIndex / words.length) * 100;
    return 0;
  }, [mode, timeLeft, timeValue, wordIndex, words.length]);

  const rating = results ? getRating(results.wpm) : null;
  const isLowTime = timeLeft <= 10 && testState === 'running';
  const totalCharsTyped = correctChars + incorrectChars;

  // Top 5 most used keys
  const topKeys = useMemo(() =>
    Object.entries(keyFrequency).sort((a, b) => b[1] - a[1]).slice(0, 8),
    [keyFrequency]
  );

  return (
    <div className="min-h-screen bg-background crt-overlay noise-overlay flex flex-col">
      {/* ─── Header ─── */}
      <div className="max-w-[1100px] w-full mx-auto px-4 pt-5 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/tools" className="text-muted-foreground/40 hover:text-primary transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <Link to="/tools/typing-speed" className="font-display text-lg text-primary hover:opacity-80 transition-opacity tracking-wider">
            {'> TYPE.exe'}
          </Link>
          <span className="hidden sm:inline font-mono text-[9px] text-muted-foreground/20 border border-muted/10 px-2 py-0.5 rounded">v2.0</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundOn(!soundOn)}
            className={`p-2 rounded transition-all ${soundOn ? 'text-primary bg-primary/10' : 'text-muted-foreground/30 hover:text-muted-foreground/60'}`}
            title={soundOn ? 'Sound on' : 'Sound off'}
          >
            {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
          <Link to="/tools/typing-speed/leaderboard" className="p-2 rounded text-muted-foreground/30 hover:text-primary transition-colors" title="Leaderboard">
            <Trophy size={15} />
          </Link>
        </div>
      </div>

      <div className="max-w-[1100px] w-full mx-auto px-4 flex-1 flex flex-col">
        {/* ─── Config Bar ─── */}
        <div className="glass-card rounded-xl px-4 py-3 mb-6 flex flex-wrap items-center justify-center gap-1">
          <div className="flex items-center gap-0.5 mr-1">
            <button onClick={() => setPunctuation(p => !p)}
              className={`font-mono text-[11px] px-2.5 py-1.5 rounded-lg transition-all ${punctuation ? 'text-primary bg-primary/10' : 'text-muted-foreground/30 hover:text-muted-foreground/60'}`}>
              @ punctuation
            </button>
            <button onClick={() => setNumbers(n => !n)}
              className={`font-mono text-[11px] px-2.5 py-1.5 rounded-lg transition-all ${numbers ? 'text-primary bg-primary/10' : 'text-muted-foreground/30 hover:text-muted-foreground/60'}`}>
              # numbers
            </button>
          </div>

          <div className="w-px h-5 bg-muted/20 mx-2" />

          <div className="flex items-center gap-0.5">
            {(['time', 'words', 'quote', 'zen'] as TestMode[]).map(m => {
              const Icon = MODE_ICONS[m];
              return (
                <button key={m} onClick={() => setMode(m)}
                  className={`font-mono text-[11px] px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${mode === m ? 'text-primary bg-primary/10' : 'text-muted-foreground/30 hover:text-muted-foreground/60'}`}>
                  <Icon size={12} />
                  {m}
                </button>
              );
            })}
          </div>

          <div className="w-px h-5 bg-muted/20 mx-2" />

          <div className="flex items-center gap-0.5">
            {mode === 'time' && TIME_VALUES.map(v => (
              <button key={v} onClick={() => setTimeValue(v)}
                className={`font-mono text-[11px] px-2.5 py-1.5 rounded-lg transition-all ${timeValue === v && mode === 'time' ? 'text-primary bg-primary/10' : 'text-muted-foreground/30 hover:text-muted-foreground/60'}`}>
                {v}
              </button>
            ))}
            {mode === 'words' && WORD_VALUES.map(v => (
              <button key={v} onClick={() => setWordValue(v)}
                className={`font-mono text-[11px] px-2.5 py-1.5 rounded-lg transition-all ${wordValue === v ? 'text-primary bg-primary/10' : 'text-muted-foreground/30 hover:text-muted-foreground/60'}`}>
                {v}
              </button>
            ))}
            {mode === 'quote' && QUOTE_VALUES.map(v => (
              <button key={v} onClick={() => setQuoteValue(v)}
                className={`font-mono text-[11px] px-2.5 py-1.5 rounded-lg transition-all ${quoteValue === v ? 'text-primary bg-primary/10' : 'text-muted-foreground/30 hover:text-muted-foreground/60'}`}>
                {v}
              </button>
            ))}
            {mode === 'zen' && <span className="font-mono text-[11px] text-muted-foreground/30 px-2">∞ infinite</span>}
          </div>

          <div className="w-px h-5 bg-muted/20 mx-2" />

          <div className="flex items-center gap-0.5">
            <Globe size={12} className="text-muted-foreground/30 mr-1" />
            {(['english', 'vietnamese'] as Language[]).map(l => (
              <button key={l} onClick={() => setLanguage(l)}
                className={`font-mono text-[11px] px-2.5 py-1.5 rounded-lg transition-all ${language === l ? 'text-primary bg-primary/10' : 'text-muted-foreground/30 hover:text-muted-foreground/60'}`}>
                {l === 'english' ? 'EN' : 'VI'}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {testState !== 'finished' ? (
            <motion.div key="test" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }}>
              {/* ─── Live Dashboard ─── */}
              <div className="grid grid-cols-12 gap-3 mb-5">
                {/* Timer / Progress */}
                <div className="col-span-3 sm:col-span-2 flex items-center justify-center">
                  <div className="relative w-20 h-20">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--muted)/0.1)" strokeWidth="4" />
                      <circle cx="40" cy="40" r="34" fill="none"
                        stroke={isLowTime ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
                        strokeWidth="4" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 34}`}
                        strokeDashoffset={`${2 * Math.PI * 34 * (1 - (mode === 'time' ? progressPct : (100 - progressPct)) / 100)}`}
                        className="transition-all duration-500"
                        style={{ filter: isLowTime ? 'drop-shadow(0 0 6px hsl(var(--destructive)/0.5))' : 'drop-shadow(0 0 4px hsl(var(--primary)/0.3))' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`font-mono text-lg font-bold transition-colors ${isLowTime ? 'text-destructive animate-pulse' : testState === 'running' ? 'text-primary' : 'text-muted-foreground/30'}`}>
                        {mode === 'time' ? timeLeft : elapsed}
                      </span>
                      <span className="font-mono text-[8px] text-muted-foreground/30">{mode === 'time' ? 'left' : 'sec'}</span>
                    </div>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="col-span-9 sm:col-span-6 grid grid-cols-4 gap-2">
                  <div className={`rounded-lg border p-2.5 text-center transition-all duration-300 ${testState === 'running' ? 'border-primary/20 bg-primary/5' : 'border-muted/10 bg-muted/5'}`}>
                    <div className={`font-display text-xl transition-all ${testState === 'running' ? 'text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.3)]' : 'text-muted-foreground/20'}`}>{liveWpm}</div>
                    <div className="font-mono text-[8px] text-muted-foreground/40 flex items-center justify-center gap-1"><Zap size={8} />WPM</div>
                  </div>
                  <div className={`rounded-lg border p-2.5 text-center transition-all duration-300 ${testState === 'running' ? 'border-secondary/20 bg-secondary/5' : 'border-muted/10 bg-muted/5'}`}>
                    <div className={`font-display text-xl transition-all ${testState === 'running' ? 'text-secondary' : 'text-muted-foreground/20'}`}>{liveAcc}%</div>
                    <div className="font-mono text-[8px] text-muted-foreground/40 flex items-center justify-center gap-1"><Target size={8} />ACC</div>
                  </div>
                  <div className={`rounded-lg border p-2.5 text-center transition-all duration-300 ${testState === 'running' ? 'border-muted/20 bg-muted/5' : 'border-muted/10 bg-muted/5'}`}>
                    <div className={`font-mono text-xl transition-all ${testState === 'running' ? 'text-foreground/60' : 'text-muted-foreground/20'}`}>{liveRaw}</div>
                    <div className="font-mono text-[8px] text-muted-foreground/40">RAW</div>
                  </div>
                  <div className={`rounded-lg border p-2.5 text-center transition-all duration-300 ${streak >= 10 ? 'border-destructive/30 bg-destructive/5' : testState === 'running' ? 'border-muted/20 bg-muted/5' : 'border-muted/10 bg-muted/5'}`}>
                    <div className={`font-mono text-xl transition-all flex items-center justify-center gap-0.5 ${streak >= 10 ? 'text-destructive' : testState === 'running' ? 'text-foreground/60' : 'text-muted-foreground/20'}`}>
                      {streak >= 10 && <Flame size={14} className="animate-pulse" />}{streak}
                    </div>
                    <div className="font-mono text-[8px] text-muted-foreground/40">STREAK</div>
                  </div>
                </div>

                {/* Mini live WPM chart */}
                <div className="hidden sm:block col-span-4 rounded-lg border border-muted/10 bg-muted/5 overflow-hidden">
                  {wpmHistory.length > 1 ? (
                    <ResponsiveContainer width="100%" height={80}>
                      <AreaChart data={wpmHistory.slice(-20)} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                        <defs>
                          <linearGradient id="wpmGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="wpm" stroke="hsl(var(--primary))" strokeWidth={1.5} fill="url(#wpmGrad)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-20 flex items-center justify-center font-mono text-[9px] text-muted-foreground/20">
                      live wpm graph
                    </div>
                  )}
                </div>
              </div>

              {/* ─── Text Display ─── */}
              <div
                ref={textContainerRef}
                className={`relative overflow-hidden cursor-text rounded-xl glass-card p-5 sm:p-6 ${shake ? 'animate-[shake_0.3s_ease-in-out]' : ''}`}
                style={{ minHeight: '7.5rem' }}
                onClick={() => inputRef.current?.focus()}
              >
                <div className="transition-transform duration-200 ease-out" style={{ transform: `translateY(-${lineOffset}px)` }}>
                  {words.map((word, wi) => {
                    const isActive = wi === wordIndex;
                    const result = wordResults[wi];
                    const typed = result?.typed;
                    const isPast = wi < wordIndex;

                    return (
                      <span key={wi} ref={el => { wordRefs.current[wi] = el; }} className="inline-block mr-[0.5em]">
                        {word.split('').map((char, ci) => {
                          let color = 'text-[#646669]';
                          if (isPast && typed) {
                            color = ci < typed.length ? (typed[ci] === char ? 'text-primary' : 'text-[#ca4754]') : 'text-[#ca4754]/60';
                          } else if (isActive && ci < inputBuffer.length) {
                            color = inputBuffer[ci] === char ? 'text-primary' : 'text-[#ca4754]';
                          }
                          return (
                            <span key={ci} className={`relative font-mono text-[1.35rem] sm:text-[1.5rem] leading-[2.2rem] ${color} transition-colors duration-75`}>
                              {isActive && ci === inputBuffer.length && (
                                <span className={`absolute left-0 top-[4px] bottom-[4px] w-[2px] bg-primary rounded-full ${testState !== 'running' ? 'animate-pulse' : ''}`} />
                              )}
                              {char}
                            </span>
                          );
                        })}
                        {isActive && inputBuffer.length > word.length && inputBuffer.slice(word.length).split('').map((c, ei) => (
                          <span key={`e-${ei}`} className="font-mono text-[1.35rem] sm:text-[1.5rem] leading-[2.2rem] text-[#7e2a33]/80">{c}</span>
                        ))}
                        {isPast && typed && typed.length > word.length && typed.slice(word.length).split('').map((c, ei) => (
                          <span key={`e-${ei}`} className="font-mono text-[1.35rem] sm:text-[1.5rem] leading-[2.2rem] text-[#7e2a33]/60">{c}</span>
                        ))}
                      </span>
                    );
                  })}
                </div>

                <textarea ref={inputRef} className="absolute inset-0 opacity-0 w-full h-full resize-none cursor-text" onKeyDown={handleKeyDown} onPaste={e => e.preventDefault()} autoFocus autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} />

                {testState === 'idle' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[2px] rounded-xl">
                    <p className="font-mono text-sm text-muted-foreground/50">
                      click here or start typing<span className="blink text-primary ml-1">█</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              {testState === 'running' && mode !== 'zen' && (
                <div className="mt-3 h-[2px] bg-muted/10 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${isLowTime ? 'bg-destructive shadow-[0_0_6px_hsl(var(--destructive)/0.4)]' : 'bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.3)]'}`}
                    style={{ width: `${mode === 'time' ? progressPct : progressPct}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}

              {/* Bottom info row */}
              <div className="flex flex-wrap items-center justify-between mt-3 gap-2">
                <div className="flex items-center gap-3">
                  {capsLock && <span className="font-mono text-[10px] text-destructive bg-destructive/10 border border-destructive/20 px-2 py-0.5 rounded">CAPS LOCK</span>}
                  {mode === 'quote' && currentQuote && <span className="font-mono text-[10px] text-muted-foreground/25">— {currentQuote.source}</span>}
                  {testState === 'running' && mode === 'words' && <span className="font-mono text-[10px] text-muted-foreground/30">{wordIndex}/{words.length} words</span>}
                </div>
                {/* Key frequency mini-display */}
                {testState === 'running' && topKeys.length > 0 && (
                  <div className="hidden md:flex items-center gap-1">
                    <span className="font-mono text-[8px] text-muted-foreground/20 mr-1">keys:</span>
                    {topKeys.slice(0, 5).map(([key, count]) => (
                      <span key={key} className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-muted/10 text-muted-foreground/30 border border-muted/10">
                        {key === ' ' ? '⎵' : key} <span className="text-primary/40">{count}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            /* ─── RESULTS ─── */
            <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex-1 py-4">
              {results && (
                <div className="space-y-6">
                  {/* Main stats row */}
                  <div className="grid grid-cols-12 gap-4">
                    {/* WPM Big */}
                    <div className="col-span-4 sm:col-span-3 glass-card rounded-xl p-5 text-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
                      <p className="font-mono text-[10px] text-muted-foreground/40 mb-1 relative">wpm</p>
                      <p className="font-display text-5xl sm:text-6xl text-primary drop-shadow-[0_0_20px_hsl(var(--primary)/0.4)] relative">{results.wpm}</p>
                      <div className={`font-display text-xs mt-2 relative ${rating?.cls}`}>
                        {rating?.icon} {rating?.label}
                      </div>
                    </div>

                    {/* Accuracy */}
                    <div className="col-span-4 sm:col-span-3 glass-card rounded-xl p-5 text-center relative overflow-hidden">
                      <div className={`absolute inset-0 ${results.accuracy >= 95 ? 'bg-gradient-to-b from-primary/5 to-transparent' : results.accuracy >= 80 ? 'bg-gradient-to-b from-secondary/5 to-transparent' : 'bg-gradient-to-b from-destructive/5 to-transparent'}`} />
                      <p className="font-mono text-[10px] text-muted-foreground/40 mb-1 relative">accuracy</p>
                      <p className={`font-display text-5xl sm:text-6xl relative ${results.accuracy >= 95 ? 'text-primary' : results.accuracy >= 80 ? 'text-secondary' : 'text-destructive'}`}>{results.accuracy}<span className="text-2xl">%</span></p>
                      {/* Mini accuracy ring */}
                      <div className="relative w-8 h-8 mx-auto mt-2">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 32 32">
                          <circle cx="16" cy="16" r="12" fill="none" stroke="hsl(var(--muted)/0.1)" strokeWidth="3" />
                          <circle cx="16" cy="16" r="12" fill="none" stroke={results.accuracy >= 95 ? 'hsl(var(--primary))' : results.accuracy >= 80 ? 'hsl(var(--secondary))' : 'hsl(var(--destructive))'} strokeWidth="3" strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 12}`} strokeDashoffset={`${2 * Math.PI * 12 * (1 - results.accuracy / 100)}`} />
                        </svg>
                      </div>
                    </div>

                    {/* Secondary Stats */}
                    <div className="col-span-4 sm:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { label: 'raw wpm', value: results.rawWpm, color: 'text-foreground/60' },
                        { label: 'consistency', value: `${results.consistency}%`, color: results.consistency >= 80 ? 'text-primary' : 'text-secondary' },
                        { label: 'correct', value: results.totalCorrect, color: 'text-primary' },
                        { label: 'incorrect', value: results.totalIncorrect, color: 'text-destructive' },
                        { label: 'words', value: results.wordCount, color: 'text-foreground/60' },
                        { label: 'time', value: `${elapsed}s`, color: 'text-foreground/60' },
                      ].map(s => (
                        <div key={s.label} className="rounded-lg border border-muted/10 bg-muted/5 p-2.5">
                          <p className="font-mono text-[8px] text-muted-foreground/30">{s.label}</p>
                          <p className={`font-mono text-sm ${s.color}`}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Extra stats row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="rounded-lg border border-muted/10 bg-muted/5 p-3 flex items-center gap-3">
                      <Flame size={16} className="text-destructive/60" />
                      <div>
                        <p className="font-mono text-[8px] text-muted-foreground/30">max streak</p>
                        <p className="font-mono text-sm text-foreground/60">{maxStreak} chars</p>
                      </div>
                    </div>
                    <div className="rounded-lg border border-muted/10 bg-muted/5 p-3 flex items-center gap-3">
                      <Type size={16} className="text-secondary/60" />
                      <div>
                        <p className="font-mono text-[8px] text-muted-foreground/30">keystrokes</p>
                        <p className="font-mono text-sm text-foreground/60">{totalCharsTyped}</p>
                      </div>
                    </div>
                    <div className="rounded-lg border border-muted/10 bg-muted/5 p-3 flex items-center gap-3">
                      <Target size={16} className="text-primary/60" />
                      <div>
                        <p className="font-mono text-[8px] text-muted-foreground/30">missed words</p>
                        <p className="font-mono text-sm text-foreground/60">{results.missedWords}</p>
                      </div>
                    </div>
                    <div className="rounded-lg border border-muted/10 bg-muted/5 p-3 flex items-center gap-3">
                      <Zap size={16} className="text-primary/60" />
                      <div>
                        <p className="font-mono text-[8px] text-muted-foreground/30">test</p>
                        <p className="font-mono text-sm text-foreground/60">{mode} {mode === 'time' ? timeValue : mode === 'words' ? wordValue : mode === 'quote' ? quoteValue : '∞'}</p>
                      </div>
                    </div>
                  </div>

                  {/* WPM Chart */}
                  {wpmHistory.length > 1 && (
                    <div className="glass-card rounded-xl p-4">
                      <p className="font-mono text-[9px] text-muted-foreground/30 mb-2">wpm over time</p>
                      <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={wpmHistory}>
                            <defs>
                              <linearGradient id="wpmAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted)/0.08)" />
                            <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#646669' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 9, fill: '#646669' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--primary)/0.15)', borderRadius: '8px', fontFamily: 'JetBrains Mono', fontSize: '10px', padding: '8px' }} labelFormatter={v => `${v}s`} />
                            <Area type="monotone" dataKey="wpm" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#wpmAreaGrad)" dot={false} name="WPM" />
                            <Line type="monotone" dataKey="raw" stroke="hsl(var(--primary)/0.2)" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Raw" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Key frequency */}
                  {topKeys.length > 0 && (
                    <div className="glass-card rounded-xl p-4">
                      <p className="font-mono text-[9px] text-muted-foreground/30 mb-3">most pressed keys</p>
                      <div className="flex flex-wrap gap-2">
                        {topKeys.map(([key, count], i) => (
                          <div key={key} className={`font-mono text-xs px-3 py-2 rounded-lg border transition-all ${i === 0 ? 'border-primary/30 bg-primary/10 text-primary' : 'border-muted/15 bg-muted/5 text-muted-foreground/50'}`}>
                            <span className="text-sm font-bold">{key === ' ' ? '⎵' : key.toUpperCase()}</span>
                            <span className="text-[9px] ml-2 opacity-50">×{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-3">
                    <button onClick={generateTest} className="font-mono text-xs px-5 py-2.5 rounded-lg bg-primary/10 border border-primary text-primary hover:bg-primary/20 transition-all shadow-[0_0_10px_hsl(var(--primary)/0.15)] flex items-center gap-2">
                      <ChevronRight size={14} /> NEXT TEST
                    </button>
                    <button onClick={() => { setTestState('idle'); setWordIndex(0); setCharIndex(0); setInputBuffer(''); setWordResults([]); setCorrectChars(0); setIncorrectChars(0); setWpmHistory([]); setLineOffset(0); setStreak(0); setMaxStreak(0); setKeyFrequency({}); correctRef.current = 0; incorrectRef.current = 0; totalKeysRef.current = 0; setElapsed(0); setTimeLeft(mode === 'time' ? timeValue : 0); setTimeout(() => inputRef.current?.focus(), 50); }}
                      className="font-mono text-xs px-5 py-2.5 rounded-lg border border-muted/20 text-muted-foreground hover:text-primary hover:border-primary/30 transition-all flex items-center gap-2">
                      <RotateCcw size={13} /> RETRY
                    </button>
                  </div>

                  {/* Save */}
                  <div className="glass-card rounded-xl p-4 flex flex-wrap items-center gap-3">
                    <span className="font-mono text-[10px] text-muted-foreground/40">save to leaderboard:</span>
                    <input value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="your name"
                      className="font-mono text-xs px-3 py-2 bg-muted/10 border border-primary/10 rounded-lg text-foreground placeholder:text-muted-foreground/20 focus:outline-none focus:border-primary/40 w-44"
                      onKeyDown={e => { if (e.key === 'Enter') saveScore(); e.stopPropagation(); }} />
                    <button onClick={saveScore} disabled={saving || !playerName.trim()}
                      className="font-mono text-[10px] px-4 py-2 rounded-lg border border-primary/20 text-primary hover:bg-primary/10 transition-colors disabled:opacity-20">
                      {saving ? '...' : '[_SAVE]'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer hints */}
        <div className="py-4 text-center font-mono text-[9px] text-muted-foreground/15 flex items-center justify-center gap-4">
          <span><kbd className="px-1 py-0.5 rounded border border-muted/10 text-[8px]">Tab</kbd> restart</span>
          <span><kbd className="px-1 py-0.5 rounded border border-muted/10 text-[8px]">Esc</kbd> stop</span>
          <span><kbd className="px-1 py-0.5 rounded border border-muted/10 text-[8px]">Ctrl+⌫</kbd> delete word</span>
        </div>
      </div>

      <style>{`
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        .animate-\\[shake_0\\.3s_ease-in-out\\] { animation: shake 0.3s ease-in-out; }
      `}</style>
    </div>
  );
};

export default TypingSpeedTest;
