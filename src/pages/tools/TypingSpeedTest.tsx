import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { top200english, top1000english, quotes, type Quote } from '@/data/typingWordPools';

// ─── Types ───
type TestMode = 'time' | 'words' | 'quote' | 'zen';
type TestState = 'idle' | 'running' | 'finished';
type QuoteLength = 'short' | 'medium' | 'long' | 'epic';

const TIME_VALUES = [15, 30, 60, 120];
const WORD_VALUES = [10, 25, 50, 100];
const QUOTE_VALUES: QuoteLength[] = ['short', 'medium', 'long', 'epic'];

// ─── Sound effects via Web Audio API ───
let audioCtx: AudioContext | null = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}
function playClick() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  } catch {}
}
function playError() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  } catch {}
}
function playComplete() {
  try {
    const ctx = getAudioCtx();
    [523, 659, 784].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
      gain.gain.setValueAtTime(0.04, ctx.currentTime + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.15);
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.15);
    });
  } catch {}
}

// ─── Helpers ───
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateWords(count: number, pool: string[], punctuation: boolean, numbers: boolean): string[] {
  const words: string[] = [];
  const shuffled = shuffle(pool);
  let idx = 0;
  let afterSentenceEnd = false;

  while (words.length < count) {
    if (numbers && words.length > 0 && words.length % 8 === 0) {
      words.push(String(Math.floor(Math.random() * 1000) + 1));
      continue;
    }

    let word = shuffled[idx % shuffled.length];
    idx++;

    if (afterSentenceEnd) {
      word = word.charAt(0).toUpperCase() + word.slice(1);
      afterSentenceEnd = false;
    }

    if (punctuation && Math.random() < 0.15) {
      const puncts = ['.', ',', ';', ':', '!', '?'];
      const p = puncts[Math.floor(Math.random() * puncts.length)];
      word += p;
      if (['.', '!', '?'].includes(p)) afterSentenceEnd = true;
    }

    words.push(word);
  }
  return words;
}

function getQuote(length: QuoteLength): Quote {
  const filtered = quotes.filter(q => q.length === length);
  return filtered.length > 0
    ? filtered[Math.floor(Math.random() * filtered.length)]
    : quotes[Math.floor(Math.random() * quotes.length)];
}

function getRating(wpm: number) {
  if (wpm >= 130) return { label: 'HACKER TIER', cls: 'animate-pulse bg-gradient-to-r from-primary via-secondary to-destructive bg-clip-text text-transparent font-display text-sm', border: 'border-gradient' };
  if (wpm >= 110) return { label: 'ELITE', cls: 'bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-display text-sm', border: '' };
  if (wpm >= 90) return { label: 'BLAZING', cls: 'text-destructive drop-shadow-[0_0_8px_hsl(var(--destructive)/0.6)] font-display text-sm', border: '' };
  if (wpm >= 70) return { label: 'FAST', cls: 'text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)] font-display text-sm', border: '' };
  if (wpm >= 50) return { label: 'SKILLED', cls: 'text-primary font-display text-sm', border: '' };
  if (wpm >= 30) return { label: 'AVERAGE', cls: 'text-secondary font-display text-sm', border: '' };
  return { label: 'ROOKIE', cls: 'text-muted-foreground font-display text-sm', border: '' };
}

// ─── Main Component ───
const TypingSpeedTest = () => {
  // Config
  const [mode, setMode] = useState<TestMode>('time');
  const [timeValue, setTimeValue] = useState(30);
  const [wordValue, setWordValue] = useState(25);
  const [quoteValue, setQuoteValue] = useState<QuoteLength>('medium');
  const [punctuation, setPunctuation] = useState(false);
  const [numbers, setNumbers] = useState(false);
  const [soundOn, setSoundOn] = useState(false);

  // Test state
  const [testState, setTestState] = useState<TestState>('idle');
  const [words, setWords] = useState<string[]>([]);
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [inputBuffer, setInputBuffer] = useState(''); // current word typed chars
  const [wordResults, setWordResults] = useState<Array<{ typed: string; target: string }>>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [elapsed, setElapsed] = useState(0);
  const [capsLock, setCapsLock] = useState(false);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [shake, setShake] = useState(false);

  // Stats tracking
  const [correctChars, setCorrectChars] = useState(0);
  const [incorrectChars, setIncorrectChars] = useState(0);
  const [wpmHistory, setWpmHistory] = useState<{ time: number; wpm: number; raw: number; errors: number }[]>([]);
  const [errorTimeline, setErrorTimeline] = useState<number[]>([]);
  const [liveWpm, setLiveWpm] = useState(0);
  const [liveRaw, setLiveRaw] = useState(0);
  const [liveAcc, setLiveAcc] = useState(100);

  // Refs
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

  // Save state
  const [playerName, setPlayerName] = useState('');
  const [saving, setSaving] = useState(false);

  // ─── Generate words ───
  const generateTest = useCallback(() => {
    let w: string[];
    if (mode === 'quote') {
      const q = getQuote(quoteValue);
      setCurrentQuote(q);
      w = q.text.split(/\s+/);
    } else if (mode === 'words') {
      w = generateWords(wordValue, top200english, punctuation, numbers);
    } else if (mode === 'zen') {
      w = generateWords(200, top200english, punctuation, numbers);
    } else {
      // time mode: generate plenty
      w = generateWords(300, top200english, punctuation, numbers);
    }
    setWords(w);
    setWordIndex(0);
    setCharIndex(0);
    setInputBuffer('');
    setWordResults([]);
    setTimeLeft(mode === 'time' ? timeValue : 0);
    setElapsed(0);
    setCorrectChars(0);
    setIncorrectChars(0);
    setWpmHistory([]);
    setErrorTimeline([]);
    setLiveWpm(0);
    setLiveRaw(0);
    setLiveAcc(100);
    setConsecutiveErrors(0);
    setTestState('idle');
    setLineOffset(0);
    correctRef.current = 0;
    incorrectRef.current = 0;
    totalKeysRef.current = 0;
    if (timerRef.current) clearInterval(timerRef.current);
    if (statsRef.current) clearInterval(statsRef.current);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [mode, timeValue, wordValue, quoteValue, punctuation, numbers]);

  useEffect(() => { generateTest(); }, [generateTest]);

  // ─── Start test ───
  const startTest = useCallback(() => {
    if (testState !== 'idle') return;
    setTestState('running');
    startTimeRef.current = Date.now();

    // Timer
    if (mode === 'time') {
      setTimeLeft(timeValue);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            clearInterval(statsRef.current);
            if (soundOn) playComplete();
            setTestState('finished');
            return 0;
          }
          return prev - 1;
        });
        setElapsed(prev => prev + 1);
      }, 1000);
    } else {
      timerRef.current = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    }

    // WPM tracking every second
    statsRef.current = setInterval(() => {
      const elapsedMin = (Date.now() - startTimeRef.current) / 60000;
      if (elapsedMin > 0) {
        const wpm = Math.round((correctRef.current / 5) / elapsedMin);
        const raw = Math.round((totalKeysRef.current / 5) / elapsedMin);
        const acc = totalKeysRef.current > 0 ? Math.round((correctRef.current / totalKeysRef.current) * 100) : 100;
        setLiveWpm(wpm);
        setLiveRaw(raw);
        setLiveAcc(acc);
        setWpmHistory(prev => [...prev, {
          time: Math.round((Date.now() - startTimeRef.current) / 1000),
          wpm,
          raw,
          errors: incorrectRef.current,
        }]);
      }
    }, 1000);
  }, [testState, mode, timeValue, soundOn]);

  // ─── End test ───
  const endTest = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (statsRef.current) clearInterval(statsRef.current);
    if (soundOn) playComplete();
    setTestState('finished');
    setElapsed(Math.round((Date.now() - startTimeRef.current) / 1000));
  }, [soundOn]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (statsRef.current) clearInterval(statsRef.current);
    };
  }, []);

  // ─── Line scroll logic ───
  useEffect(() => {
    if (!textContainerRef.current || wordRefs.current.length === 0) return;
    const currentWordEl = wordRefs.current[wordIndex];
    if (!currentWordEl) return;
    const containerRect = textContainerRef.current.getBoundingClientRect();
    const wordRect = currentWordEl.getBoundingClientRect();
    const relativeTop = wordRect.top - containerRect.top + lineOffset;
    // If cursor is past line 2 height (roughly 64px), scroll up
    if (relativeTop > 64) {
      setLineOffset(prev => prev + (relativeTop - 32));
    }
  }, [wordIndex]);

  // ─── Key handler ───
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.getModifierState) setCapsLock(e.getModifierState('CapsLock'));

    // Block paste
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') { e.preventDefault(); return; }

    // Tab = restart
    if (e.key === 'Tab') {
      e.preventDefault();
      generateTest();
      return;
    }

    // Escape = stop
    if (e.key === 'Escape') {
      e.preventDefault();
      if (testState === 'running') {
        if (mode === 'zen') endTest();
        else generateTest();
      }
      return;
    }

    if (testState === 'finished') return;

    const currentWord = words[wordIndex] || '';

    // Backspace
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (e.ctrlKey) {
        // Delete whole word
        setInputBuffer('');
        setCharIndex(0);
      } else if (inputBuffer.length > 0) {
        setInputBuffer(prev => prev.slice(0, -1));
        setCharIndex(prev => Math.max(0, prev - 1));
      }
      return;
    }

    // Space = advance word
    if (e.key === ' ') {
      e.preventDefault();
      if (inputBuffer.length === 0) return;
      if (testState === 'idle') startTest();

      // Record result
      const target = currentWord;
      const typed = inputBuffer;
      setWordResults(prev => [...prev, { typed, target }]);

      // Count correct/incorrect for this word
      for (let i = 0; i < Math.max(typed.length, target.length); i++) {
        if (i < typed.length && i < target.length && typed[i] === target[i]) {
          correctRef.current++;
          setCorrectChars(c => c + 1);
        } else {
          incorrectRef.current++;
          setIncorrectChars(c => c + 1);
        }
        totalKeysRef.current++;
      }

      setWordIndex(prev => prev + 1);
      setCharIndex(0);
      setInputBuffer('');
      setConsecutiveErrors(0);

      // Check if test complete (words/quote mode)
      if (mode === 'words' && wordIndex + 1 >= words.length) {
        endTest();
      } else if (mode === 'quote' && wordIndex + 1 >= words.length) {
        endTest();
      }

      // Zen mode: generate more words
      if (mode === 'zen' && wordIndex + 1 >= words.length - 20) {
        setWords(prev => [...prev, ...generateWords(100, top200english, punctuation, numbers)]);
      }

      return;
    }

    // Regular character
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      if (testState === 'idle') startTest();

      const isCorrect = charIndex < currentWord.length && e.key === currentWord[charIndex];

      if (isCorrect) {
        if (soundOn) playClick();
        setConsecutiveErrors(0);
      } else {
        if (soundOn) playError();
        setConsecutiveErrors(prev => {
          const next = prev + 1;
          if (next >= 5) { setShake(true); setTimeout(() => setShake(false), 300); }
          return next;
        });
        setErrorTimeline(prev => [...prev, Math.round((Date.now() - startTimeRef.current) / 1000)]);
      }

      setInputBuffer(prev => prev + e.key);
      setCharIndex(prev => prev + 1);
    }
  }, [testState, words, wordIndex, charIndex, inputBuffer, mode, punctuation, numbers, soundOn, startTest, endTest, generateTest]);

  // ─── Results calculation ───
  const results = useMemo(() => {
    if (testState !== 'finished') return null;
    const totalCorrect = correctChars;
    const totalIncorrect = incorrectChars;
    const total = totalCorrect + totalIncorrect;
    const elapsedMin = Math.max(elapsed, 1) / 60;
    const wpm = Math.round((totalCorrect / 5) / elapsedMin);
    const rawWpm = Math.round((total / 5) / elapsedMin);
    const accuracy = total > 0 ? Math.round((totalCorrect / total) * 100) : 100;

    // Consistency from WPM history
    const wpmValues = wpmHistory.map(h => h.wpm);
    const mean = wpmValues.length > 0 ? wpmValues.reduce((a, b) => a + b, 0) / wpmValues.length : 0;
    const variance = wpmValues.length > 1
      ? wpmValues.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / wpmValues.length
      : 0;
    const stdDev = Math.sqrt(variance);
    const consistency = mean > 0 ? Math.max(0, Math.min(100, Math.round(100 - (stdDev / mean) * 100))) : 100;

    const missedWords = wordResults.filter(r => r.typed !== r.target).length;

    return { wpm, rawWpm, accuracy, consistency, totalCorrect, totalIncorrect, missedWords, wordCount: wordResults.length };
  }, [testState, correctChars, incorrectChars, elapsed, wpmHistory, wordResults]);

  // ─── Save score ───
  const saveScore = async () => {
    if (!playerName.trim() || !results) return;
    setSaving(true);
    const modeVal = mode === 'time' ? String(timeValue) : mode === 'words' ? String(wordValue) : mode === 'quote' ? quoteValue : 'zen';
    const { error } = await supabase.from('typing_scores' as any).insert({
      player_name: playerName.trim(),
      wpm: results.wpm,
      raw_wpm: results.rawWpm,
      accuracy: results.accuracy,
      consistency: results.consistency,
      mode,
      mode_value: modeVal,
      duration_seconds: elapsed,
      word_count: results.wordCount,
      correct_chars: results.totalCorrect,
      incorrect_chars: results.totalIncorrect,
    } as any);
    setSaving(false);
    if (error) {
      toast({ title: '// ERROR', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '// SCORE SAVED' });
      setPlayerName('');
    }
  };

  // ─── Config change ───
  const changeConfig = useCallback((fn: () => void) => {
    fn();
    // Will regenerate via useEffect
  }, []);

  // ─── Progress ───
  const progressPct = useMemo(() => {
    if (mode === 'time') return (timeLeft / timeValue) * 100;
    if (mode === 'words') return (wordIndex / words.length) * 100;
    if (mode === 'quote') return (wordIndex / words.length) * 100;
    return 0;
  }, [mode, timeLeft, timeValue, wordIndex, words.length]);

  const rating = results ? getRating(results.wpm) : null;

  // ─── Render ───
  return (
    <div className="min-h-screen bg-background crt-overlay noise-overlay flex flex-col">
      {/* Header */}
      <div className="max-w-[900px] w-full mx-auto px-4 pt-6 pb-2 flex items-center justify-between">
        <Link to="/tools" className="font-display text-lg text-primary hover:opacity-80 transition-opacity">
          {'> TYPE.exe'}
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundOn(!soundOn)}
            className={`font-mono text-[10px] px-2 py-1 rounded border transition-all ${soundOn ? 'border-primary text-primary' : 'border-muted text-muted-foreground'}`}
          >
            {soundOn ? '♪ ON' : '♪ OFF'}
          </button>
          <Link to="/tools/typing-speed/leaderboard" className="text-muted-foreground hover:text-primary transition-colors">
            <Trophy size={18} />
          </Link>
        </div>
      </div>

      <div className="max-w-[900px] w-full mx-auto px-4 flex-1 flex flex-col">
        {/* Config bar */}
        <div className="flex flex-wrap items-center justify-center gap-1 py-4">
          {/* Punctuation & numbers */}
          <div className="flex items-center gap-1 mr-2">
            <button
              onClick={() => changeConfig(() => setPunctuation(p => !p))}
              className={`font-mono text-xs px-2.5 py-1 rounded transition-all ${punctuation ? 'text-primary' : 'text-muted-foreground/40 hover:text-muted-foreground/70'}`}
            >
              @ punctuation
            </button>
            <button
              onClick={() => changeConfig(() => setNumbers(n => !n))}
              className={`font-mono text-xs px-2.5 py-1 rounded transition-all ${numbers ? 'text-primary' : 'text-muted-foreground/40 hover:text-muted-foreground/70'}`}
            >
              # numbers
            </button>
          </div>

          <span className="text-muted-foreground/20 mx-1">|</span>

          {/* Mode */}
          <div className="flex items-center gap-1">
            {(['time', 'words', 'quote', 'zen'] as TestMode[]).map(m => (
              <button
                key={m}
                onClick={() => changeConfig(() => setMode(m))}
                className={`font-mono text-xs px-2.5 py-1 rounded transition-all ${mode === m ? 'text-primary' : 'text-muted-foreground/40 hover:text-muted-foreground/70'}`}
              >
                {m}
              </button>
            ))}
          </div>

          <span className="text-muted-foreground/20 mx-1">|</span>

          {/* Mode values */}
          <div className="flex items-center gap-1">
            {mode === 'time' && TIME_VALUES.map(v => (
              <button key={v} onClick={() => changeConfig(() => setTimeValue(v))}
                className={`font-mono text-xs px-2.5 py-1 rounded transition-all ${timeValue === v ? 'text-primary' : 'text-muted-foreground/40 hover:text-muted-foreground/70'}`}>
                {v}
              </button>
            ))}
            {mode === 'words' && WORD_VALUES.map(v => (
              <button key={v} onClick={() => changeConfig(() => setWordValue(v))}
                className={`font-mono text-xs px-2.5 py-1 rounded transition-all ${wordValue === v ? 'text-primary' : 'text-muted-foreground/40 hover:text-muted-foreground/70'}`}>
                {v}
              </button>
            ))}
            {mode === 'quote' && QUOTE_VALUES.map(v => (
              <button key={v} onClick={() => changeConfig(() => setQuoteValue(v))}
                className={`font-mono text-xs px-2.5 py-1 rounded transition-all ${quoteValue === v ? 'text-primary' : 'text-muted-foreground/40 hover:text-muted-foreground/70'}`}>
                {v}
              </button>
            ))}
            {mode === 'zen' && (
              <span className="font-mono text-xs text-muted-foreground/40">∞</span>
            )}
          </div>
        </div>

        {/* Test area */}
        <AnimatePresence mode="wait">
          {testState !== 'finished' ? (
            <motion.div
              key="test"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col justify-center"
            >
              {/* Stats row */}
              <div className={`flex gap-6 mb-4 font-mono text-sm transition-all duration-300 ${testState === 'running' ? 'opacity-100' : 'opacity-30'}`}>
                <span className="text-primary">{liveWpm} <span className="text-muted-foreground/50 text-xs">wpm</span></span>
                <span className="text-secondary">{liveAcc}% <span className="text-muted-foreground/50 text-xs">acc</span></span>
                <span className="text-muted-foreground">{liveRaw} <span className="text-muted-foreground/50 text-xs">raw</span></span>
                {mode === 'time' && (
                  <span className={`${timeLeft <= 10 && testState === 'running' ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`}>
                    {timeLeft}s
                  </span>
                )}
                {mode === 'words' && (
                  <span className="text-muted-foreground">{wordIndex}/{words.length}</span>
                )}
                {mode === 'quote' && (
                  <span className="text-muted-foreground">{wordIndex}/{words.length}</span>
                )}
              </div>

              {/* Text display */}
              <div
                ref={textContainerRef}
                className={`relative overflow-hidden cursor-text ${shake ? 'animate-[shake_0.3s_ease-in-out]' : ''}`}
                style={{ height: '6rem' }}
                onClick={() => inputRef.current?.focus()}
              >
                <div
                  className="transition-transform duration-200 ease-out"
                  style={{ transform: `translateY(-${lineOffset}px)` }}
                >
                  {words.map((word, wi) => {
                    const isActive = wi === wordIndex;
                    const result = wordResults[wi];
                    const typed = result?.typed;
                    const isFuture = wi > wordIndex;
                    const isPast = wi < wordIndex;

                    return (
                      <span
                        key={wi}
                        ref={el => { wordRefs.current[wi] = el; }}
                        className="inline-block mr-[0.5em]"
                      >
                        {word.split('').map((char, ci) => {
                          let color = 'text-[#646669]'; // untyped

                          if (isPast && typed) {
                            if (ci < typed.length) {
                              color = typed[ci] === char ? 'text-primary' : 'text-[#ca4754]';
                            } else {
                              color = 'text-[#ca4754]/60'; // missed chars
                            }
                          } else if (isActive) {
                            if (ci < inputBuffer.length) {
                              color = inputBuffer[ci] === char ? 'text-primary' : 'text-[#ca4754]';
                            }
                          }

                          return (
                            <span key={ci} className={`relative font-mono text-[1.4rem] leading-[2rem] ${color}`}>
                              {isActive && ci === inputBuffer.length && (
                                <span
                                  className={`absolute left-0 top-[2px] bottom-[2px] w-[2px] bg-primary ${testState === 'idle' || (Date.now() - startTimeRef.current) > 500 ? 'animate-pulse' : ''}`}
                                  style={{ transition: 'left 0.08s ease' }}
                                />
                              )}
                              {char}
                            </span>
                          );
                        })}
                        {/* Extra characters typed beyond word length */}
                        {isActive && inputBuffer.length > word.length && (
                          inputBuffer.slice(word.length).split('').map((c, ei) => (
                            <span key={`extra-${ei}`} className="font-mono text-[1.4rem] leading-[2rem] text-[#7e2a33]">{c}</span>
                          ))
                        )}
                        {isPast && typed && typed.length > word.length && (
                          typed.slice(word.length).split('').map((c, ei) => (
                            <span key={`extra-${ei}`} className="font-mono text-[1.4rem] leading-[2rem] text-[#7e2a33]">{c}</span>
                          ))
                        )}
                      </span>
                    );
                  })}
                </div>

                {/* Hidden input */}
                <textarea
                  ref={inputRef}
                  className="absolute inset-0 opacity-0 w-full h-full resize-none cursor-text"
                  onKeyDown={handleKeyDown}
                  onPaste={e => e.preventDefault()}
                  autoFocus
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                />

                {/* Focus overlay */}
                {testState === 'idle' && document.activeElement !== inputRef.current && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[2px] rounded">
                    <p className="font-mono text-sm text-muted-foreground/60">
                      Click here or start typing
                    </p>
                  </div>
                )}
              </div>

              {/* Caps lock warning */}
              {capsLock && (
                <div className="font-mono text-[10px] text-destructive mt-2">
                  CAPS LOCK
                </div>
              )}

              {/* Progress bar */}
              {testState === 'running' && mode !== 'zen' && (
                <div className="mt-4 h-[3px] bg-muted/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      mode === 'time'
                        ? timeLeft <= 10 ? 'bg-destructive' : 'bg-primary'
                        : 'bg-primary'
                    }`}
                    style={{
                      width: `${mode === 'time' ? progressPct : progressPct}%`,
                    }}
                  />
                </div>
              )}

              {/* Quote attribution */}
              {mode === 'quote' && currentQuote && (
                <p className="font-mono text-[10px] text-muted-foreground/30 mt-3">— {currentQuote.source}</p>
              )}
            </motion.div>
          ) : (
            // ─── Results ───
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex-1 flex flex-col justify-center py-8"
            >
              {results && (
                <div className="space-y-8">
                  {/* Main stats */}
                  <div className="flex flex-col sm:flex-row gap-8 items-start">
                    {/* Left: WPM + ACC */}
                    <div className="space-y-4">
                      <div>
                        <p className="font-mono text-xs text-muted-foreground/50 mb-1">wpm</p>
                        <p className="font-display text-6xl text-primary drop-shadow-[0_0_20px_hsl(var(--primary)/0.3)]">
                          {results.wpm}
                        </p>
                      </div>
                      <div>
                        <p className="font-mono text-xs text-muted-foreground/50 mb-1">acc</p>
                        <p className={`font-display text-4xl ${
                          results.accuracy >= 95 ? 'text-primary' :
                          results.accuracy >= 80 ? 'text-secondary' : 'text-destructive'
                        }`}>
                          {results.accuracy}%
                        </p>
                      </div>
                      {rating && (
                        <div className={rating.cls}>{rating.label}</div>
                      )}
                    </div>

                    {/* Right: Secondary stats */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 font-mono text-sm flex-1">
                      <div>
                        <p className="text-muted-foreground/50 text-xs">raw wpm</p>
                        <p className="text-foreground">{results.rawWpm}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground/50 text-xs">consistency</p>
                        <p className="text-foreground">{results.consistency}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground/50 text-xs">correct chars</p>
                        <p className="text-primary">{results.totalCorrect}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground/50 text-xs">incorrect chars</p>
                        <p className="text-destructive">{results.totalIncorrect}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground/50 text-xs">test type</p>
                        <p className="text-foreground">{mode} {mode === 'time' ? timeValue : mode === 'words' ? wordValue : mode === 'quote' ? quoteValue : ''}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground/50 text-xs">time</p>
                        <p className="text-foreground">{elapsed}s</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground/50 text-xs">words</p>
                        <p className="text-foreground">{results.wordCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground/50 text-xs">missed words</p>
                        <p className="text-foreground">{results.missedWords}</p>
                      </div>
                    </div>
                  </div>

                  {/* Chart */}
                  {wpmHistory.length > 1 && (
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={wpmHistory}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted)/0.15)" />
                          <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#646669' }} />
                          <YAxis tick={{ fontSize: 10, fill: '#646669' }} />
                          <Tooltip
                            contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--primary)/0.2)', borderRadius: '4px', fontFamily: 'JetBrains Mono', fontSize: '11px' }}
                            labelFormatter={v => `${v}s`}
                          />
                          <Line type="monotone" dataKey="wpm" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="WPM" />
                          <Line type="monotone" dataKey="raw" stroke="hsl(var(--primary)/0.3)" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Raw" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-3">
                    <button onClick={generateTest} className="font-mono text-xs px-4 py-2 rounded bg-primary/10 border border-primary text-primary hover:bg-primary/20 transition-colors">
                      [_NEXT TEST]
                    </button>
                    <button onClick={() => { setTestState('idle'); setWordIndex(0); setCharIndex(0); setInputBuffer(''); setWordResults([]); setCorrectChars(0); setIncorrectChars(0); setWpmHistory([]); setLineOffset(0); correctRef.current = 0; incorrectRef.current = 0; totalKeysRef.current = 0; setElapsed(0); setTimeLeft(mode === 'time' ? timeValue : 0); setTimeout(() => inputRef.current?.focus(), 50); }}
                      className="font-mono text-xs px-4 py-2 rounded border border-muted text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors">
                      [_RETRY]
                    </button>
                    <span className="font-mono text-[10px] text-muted-foreground/30">[Tab] restart</span>
                  </div>

                  {/* Save score */}
                  <div className="flex items-center gap-2 pt-2">
                    <span className="font-mono text-[10px] text-muted-foreground/50">save score:</span>
                    <input
                      value={playerName}
                      onChange={e => setPlayerName(e.target.value)}
                      placeholder="your name"
                      className="font-mono text-xs px-3 py-1.5 bg-muted/20 border border-primary/15 rounded text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/50 w-40"
                      onKeyDown={e => { if (e.key === 'Enter') saveScore(); e.stopPropagation(); }}
                    />
                    <button
                      onClick={saveScore}
                      disabled={saving || !playerName.trim()}
                      className="font-mono text-[10px] px-3 py-1.5 rounded border border-primary/30 text-primary hover:bg-primary/10 transition-colors disabled:opacity-30"
                    >
                      {saving ? '...' : '[_SAVE]'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom hints */}
        <div className="py-4 text-center font-mono text-[10px] text-muted-foreground/20">
          [Tab] restart &nbsp; [Esc] stop &nbsp; [Ctrl+⌫] delete word
        </div>
      </div>

      {/* Shake keyframe - injected via style tag */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-\\[shake_0\\.3s_ease-in-out\\] {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default TypingSpeedTest;
