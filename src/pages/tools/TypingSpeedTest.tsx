import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import ToolLayout from '@/components/ToolLayout';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  EASY_WORDS, NORMAL_WORDS, HARD_WORDS, SENTENCES,
  CODE_SNIPPETS, NUMBER_SEQUENCES, VIETNAMESE_WORDS,
} from '@/data/typingWordPools';

type Mode = 'WORDS' | 'SENTENCES' | 'CODE' | 'NUMBERS';
type Difficulty = 'EASY' | 'NORMAL' | 'HARD';
type Language = 'ENGLISH' | 'VIETNAMESE';
type TestState = 'idle' | 'running' | 'finished';

const DURATIONS = [15, 30, 60, 120] as const;
const MODES: Mode[] = ['WORDS', 'SENTENCES', 'CODE', 'NUMBERS'];
const DIFFICULTIES: Difficulty[] = ['EASY', 'NORMAL', 'HARD'];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getWordPool(mode: Mode, difficulty: Difficulty, language: Language): string[] {
  if (language === 'VIETNAMESE') return shuffle(VIETNAMESE_WORDS);
  switch (mode) {
    case 'SENTENCES': return shuffle(SENTENCES);
    case 'CODE': return shuffle(CODE_SNIPPETS);
    case 'NUMBERS': return shuffle(NUMBER_SEQUENCES);
    default:
      if (difficulty === 'EASY') return shuffle(EASY_WORDS);
      if (difficulty === 'HARD') return shuffle(HARD_WORDS);
      return shuffle(NORMAL_WORDS);
  }
}

function generateText(mode: Mode, difficulty: Difficulty, language: Language): string {
  const pool = getWordPool(mode, difficulty, language);
  if (mode === 'SENTENCES' || mode === 'CODE') {
    return pool.slice(0, 20).join(' ');
  }
  // For words/numbers/vietnamese: repeat pool to get enough text
  const words: string[] = [];
  while (words.length < 200) words.push(...shuffle(pool));
  return words.slice(0, 200).join(' ');
}

function getRating(wpm: number) {
  if (wpm >= 110) return { label: 'HACKER TIER', color: 'rainbow', cls: 'animate-pulse bg-gradient-to-r from-primary via-secondary to-destructive bg-clip-text text-transparent' };
  if (wpm >= 90) return { label: 'BLAZING', color: 'pink', cls: 'text-destructive drop-shadow-[0_0_8px_hsl(var(--destructive)/0.6)]' };
  if (wpm >= 70) return { label: 'FAST', color: 'green', cls: 'text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]' };
  if (wpm >= 50) return { label: 'SKILLED', color: 'green', cls: 'text-primary' };
  if (wpm >= 30) return { label: 'AVERAGE', color: 'blue', cls: 'text-secondary' };
  return { label: 'ROOKIE', color: 'grey', cls: 'text-muted-foreground' };
}

const TypingSpeedTest = () => {
  const [mode, setMode] = useState<Mode>('WORDS');
  const [difficulty, setDifficulty] = useState<Difficulty>('NORMAL');
  const [language, setLanguage] = useState<Language>('ENGLISH');
  const [duration, setDuration] = useState(60);
  const [testState, setTestState] = useState<TestState>('idle');
  const [text, setText] = useState('');
  const [typed, setTyped] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [capsLock, setCapsLock] = useState(false);
  const [wpmHistory, setWpmHistory] = useState<{ time: number; wpm: number }[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const wpmIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const startTimeRef = useRef(0);
  const correctCharsAtStartRef = useRef(0);

  // Generate initial text
  useEffect(() => {
    setText(generateText(mode, difficulty, language));
  }, [mode, difficulty, language]);

  const newTest = useCallback(() => {
    setTestState('idle');
    setTyped('');
    setTimeLeft(duration);
    setWpmHistory([]);
    setText(generateText(mode, difficulty, language));
    if (timerRef.current) clearInterval(timerRef.current);
    if (wpmIntervalRef.current) clearInterval(wpmIntervalRef.current);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [mode, difficulty, language, duration]);

  const retrySameText = useCallback(() => {
    setTestState('idle');
    setTyped('');
    setTimeLeft(duration);
    setWpmHistory([]);
    if (timerRef.current) clearInterval(timerRef.current);
    if (wpmIntervalRef.current) clearInterval(wpmIntervalRef.current);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [duration]);

  // Start test on first keystroke
  const startTest = useCallback(() => {
    if (testState !== 'idle') return;
    setTestState('running');
    setTimeLeft(duration);
    startTimeRef.current = Date.now();
    correctCharsAtStartRef.current = 0;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          clearInterval(wpmIntervalRef.current);
          setTestState('finished');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Record WPM every 5 seconds
    wpmIntervalRef.current = setInterval(() => {
      setTyped(currentTyped => {
        setText(currentText => {
          const elapsed = (Date.now() - startTimeRef.current) / 1000 / 60;
          if (elapsed > 0) {
            let correct = 0;
            for (let i = 0; i < currentTyped.length; i++) {
              if (currentTyped[i] === currentText[i]) correct++;
            }
            const wpm = Math.round((correct / 5) / elapsed);
            setWpmHistory(prev => [...prev, { time: Math.round((Date.now() - startTimeRef.current) / 1000), wpm }]);
          }
          return currentText;
        });
        return currentTyped;
      });
    }, 5000);
  }, [testState, duration]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (wpmIntervalRef.current) clearInterval(wpmIntervalRef.current);
    };
  }, []);

  // Stats calculation
  const stats = useMemo(() => {
    let correct = 0, incorrect = 0;
    for (let i = 0; i < typed.length; i++) {
      if (typed[i] === text[i]) correct++;
      else incorrect++;
    }
    const elapsed = testState === 'finished' ? duration : Math.max(1, duration - timeLeft);
    const minutes = elapsed / 60;
    const wpm = minutes > 0 ? Math.round((correct / 5) / minutes) : 0;
    const rawWpm = minutes > 0 ? Math.round((typed.length / 5) / minutes) : 0;
    const accuracy = typed.length > 0 ? Math.round((correct / typed.length) * 100) : 100;
    
    // Count words
    const typedWords = typed.split(' ');
    const textWords = text.split(' ');
    let correctWords = 0, incorrectWords = 0;
    let wordStart = 0;
    for (let w = 0; w < typedWords.length; w++) {
      const tw = typedWords[w];
      const expected = textWords[w] || '';
      if (tw === expected) correctWords++;
      else if (typed.length > wordStart) incorrectWords++;
      wordStart += expected.length + 1;
    }

    // Streak
    let streak = 0, maxStreak = 0;
    for (let i = typed.length - 1; i >= 0; i--) {
      if (typed[i] === text[i]) { streak++; } else break;
    }
    for (let i = 0; i < typed.length; i++) {
      if (typed[i] === text[i]) { maxStreak = Math.max(maxStreak, ++maxStreak); }
      else maxStreak = 0;
    }

    // Consistency
    const consistency = wpmHistory.length > 1
      ? Math.round(100 - (Math.sqrt(wpmHistory.reduce((s, p) => s + Math.pow(p.wpm - wpm, 2), 0) / wpmHistory.length) / Math.max(wpm, 1)) * 100)
      : 100;

    return { wpm, rawWpm, accuracy, correct, incorrect, correctWords, incorrectWords, streak, consistency: Math.max(0, Math.min(100, consistency)), totalKeystrokes: typed.length };
  }, [typed, text, timeLeft, duration, testState, wpmHistory]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // We use a hidden input approach — but since we need character-by-character, we track via keydown
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Detect caps lock
    if (e.getModifierState) setCapsLock(e.getModifierState('CapsLock'));

    // Block paste
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') { e.preventDefault(); return; }

    // Tab+Enter = restart
    if (e.key === 'Tab') { e.preventDefault(); newTest(); return; }

    if (testState === 'finished') return;

    if (e.key === 'Backspace') {
      e.preventDefault();
      setTyped(prev => prev.slice(0, -1));
      if (testState === 'idle') startTest();
      return;
    }

    if (e.key.length === 1) {
      e.preventDefault();
      if (testState === 'idle') startTest();
      setTyped(prev => {
        if (prev.length >= text.length) return prev;
        return prev + e.key;
      });
    }
  }, [testState, text, startTest, newTest]);

  // Auto-focus
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Save score
  const saveScore = async () => {
    if (!playerName.trim()) return;
    const { error } = await supabase.from('typing_scores' as any).insert({
      player_name: playerName.trim(),
      wpm: stats.wpm,
      accuracy: stats.accuracy,
      mode: mode,
      duration: duration,
    } as any);
    if (error) {
      toast({ title: '// ERROR', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '// SCORE LOGGED TO DATABASE' });
      setShowSaveModal(false);
      setPlayerName('');
    }
  };

  // Fetch leaderboard
  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from('typing_scores' as any)
      .select('*')
      .order('wpm', { ascending: false })
      .limit(10) as any;
    setLeaderboard(data || []);
    setShowLeaderboard(true);
  };

  // Render typed text with character coloring
  const renderText = () => {
    const chars = text.split('');
    // Figure out visible window (roughly 3 lines worth, ~180 chars)
    const lineWidth = 60;
    const currentLine = Math.floor(typed.length / lineWidth);
    const startChar = Math.max(0, (currentLine - 1) * lineWidth);
    const endChar = Math.min(chars.length, startChar + lineWidth * 4);

    return (
      <div className="font-mono text-lg sm:text-xl leading-relaxed tracking-wide select-none relative overflow-hidden" style={{ minHeight: '6em' }}>
        {chars.slice(startChar, endChar).map((char, i) => {
          const idx = startChar + i;
          const isTyped = idx < typed.length;
          const isCurrent = idx === typed.length;
          const isCorrect = isTyped && typed[idx] === char;
          const isIncorrect = isTyped && typed[idx] !== char;

          return (
            <span
              key={idx}
              className={`relative inline ${
                isCurrent ? 'bg-primary/20' : ''
              } ${
                isCorrect ? 'text-primary' :
                isIncorrect ? 'text-destructive bg-destructive/15' :
                'text-muted-foreground/40'
              }`}
            >
              {isCurrent && (
                <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary animate-pulse" />
              )}
              {char === ' ' && isIncorrect ? '·' : char}
            </span>
          );
        })}
      </div>
    );
  };

  const rating = getRating(stats.wpm);
  const timerPct = (timeLeft / duration) * 100;
  const isLowTime = timeLeft <= 10 && testState === 'running';

  return (
    <ToolLayout title='> TYPING_SPEED.exe' subtitle="// Measure your WPM, accuracy and reaction time">
      <div className="space-y-4">
        {/* Mode tabs */}
        <div className="flex flex-wrap gap-2">
          {MODES.map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); newTest(); }}
              className={`font-mono text-xs px-3 py-1.5 rounded border transition-all ${
                mode === m
                  ? 'border-primary bg-primary/10 text-primary shadow-[0_0_8px_hsl(var(--primary)/0.3)]'
                  : 'border-primary/15 text-muted-foreground hover:text-primary hover:border-primary/40'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Settings bar */}
        <div className="flex flex-wrap items-center gap-3 glass-card rounded-lg p-3">
          {/* Duration */}
          <div className="flex gap-1">
            {DURATIONS.map(d => (
              <button
                key={d}
                onClick={() => { setDuration(d); setTimeLeft(d); if (testState === 'idle') setTimeLeft(d); }}
                className={`font-mono text-[10px] px-2 py-1 rounded border transition-all ${
                  duration === d
                    ? 'border-secondary bg-secondary/10 text-secondary'
                    : 'border-muted text-muted-foreground hover:border-secondary/40'
                }`}
              >
                {d}s
              </button>
            ))}
          </div>

          <span className="text-muted-foreground/30">|</span>

          {/* Difficulty */}
          <div className="flex gap-1">
            {DIFFICULTIES.map(d => (
              <button
                key={d}
                onClick={() => { setDifficulty(d); }}
                className={`font-mono text-[10px] px-2 py-1 rounded border transition-all ${
                  difficulty === d
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-muted text-muted-foreground hover:border-primary/40'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <span className="text-muted-foreground/30">|</span>

          {/* Language */}
          <div className="flex gap-1">
            {(['ENGLISH', 'VIETNAMESE'] as Language[]).map(l => (
              <button
                key={l}
                onClick={() => { setLanguage(l); }}
                className={`font-mono text-[10px] px-2 py-1 rounded border transition-all ${
                  language === l
                    ? 'border-secondary bg-secondary/10 text-secondary'
                    : 'border-muted text-muted-foreground hover:border-secondary/40'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <span className="text-muted-foreground/30">|</span>

          <button onClick={newTest} className="font-mono text-[10px] px-3 py-1 rounded border border-primary/30 text-primary hover:bg-primary/10 transition-colors">
            [_NEW TEST]
          </button>
        </div>

        {/* Caps lock warning */}
        {capsLock && (
          <div className="font-mono text-[10px] text-destructive bg-destructive/10 border border-destructive/30 rounded px-3 py-1 inline-block">
            // CAPS LOCK ON
          </div>
        )}

        {/* Timer + Live stats */}
        {testState !== 'finished' && (
          <div className="flex flex-wrap items-center gap-3">
            {/* Timer circle */}
            <div className="relative w-16 h-16 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--muted)/0.2)" strokeWidth="4" />
                <circle
                  cx="32" cy="32" r="28" fill="none"
                  stroke={isLowTime ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - timerPct / 100)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <span className={`absolute inset-0 flex items-center justify-center font-mono text-sm font-bold ${isLowTime ? 'text-destructive animate-pulse' : 'text-primary'}`}>
                {timeLeft}
              </span>
            </div>

            {/* Live stat cards */}
            <div className="flex flex-wrap gap-2 flex-1">
              <div className="glass-card rounded px-3 py-2 text-center min-w-[70px]">
                <div className="font-display text-lg text-primary">{stats.wpm}</div>
                <div className="font-mono text-[9px] text-muted-foreground">WPM</div>
              </div>
              <div className="glass-card rounded px-3 py-2 text-center min-w-[70px]">
                <div className="font-display text-lg text-secondary">{stats.accuracy}%</div>
                <div className="font-mono text-[9px] text-muted-foreground">ACC</div>
              </div>
              <div className="glass-card rounded px-3 py-2 text-center min-w-[60px]">
                <div className="font-mono text-sm text-primary">{stats.correct}</div>
                <div className="font-mono text-[9px] text-muted-foreground">CORRECT</div>
              </div>
              <div className="glass-card rounded px-3 py-2 text-center min-w-[60px]">
                <div className="font-mono text-sm text-destructive">{stats.incorrect}</div>
                <div className="font-mono text-[9px] text-muted-foreground">ERRORS</div>
              </div>
              <div className="glass-card rounded px-3 py-2 text-center min-w-[60px]">
                <div className="font-mono text-sm text-foreground">{stats.streak}</div>
                <div className="font-mono text-[9px] text-muted-foreground">STREAK</div>
              </div>
            </div>
          </div>
        )}

        {/* Main test area */}
        {testState !== 'finished' && (
          <div
            className="glass-card rounded-lg p-4 sm:p-6 cursor-text relative"
            onClick={() => inputRef.current?.focus()}
          >
            {renderText()}

            {/* Hidden input */}
            <input
              ref={inputRef}
              className="absolute opacity-0 w-0 h-0"
              onKeyDown={handleKeyDown}
              onChange={handleInput}
              onPaste={e => e.preventDefault()}
              autoFocus
            />

            {/* Focus overlay */}
            {testState === 'idle' && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-lg backdrop-blur-sm">
                <p className="font-mono text-sm text-muted-foreground">
                  Click here or start typing to begin<span className="blink text-primary ml-1">█</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* RESULTS SCREEN */}
        <AnimatePresence>
          {testState === 'finished' && !showLeaderboard && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, clipPath: 'inset(50% 50% 50% 50%)' }}
              animate={{ opacity: 1, scale: 1, clipPath: 'inset(0% 0% 0% 0%)' }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="glass-card rounded-lg p-6 space-y-6"
            >
              {/* Big WPM + Rating */}
              <div className="text-center space-y-2">
                <div className="font-display text-6xl sm:text-7xl text-primary drop-shadow-[0_0_20px_hsl(var(--primary)/0.4)]">
                  {stats.wpm}
                </div>
                <p className="font-mono text-xs text-muted-foreground">WORDS PER MINUTE</p>
                <div className={`font-display text-lg ${rating.cls}`}>
                  {rating.label}
                </div>
              </div>

              {/* Accuracy */}
              <div className="text-center">
                <span className={`font-display text-3xl ${
                  stats.accuracy >= 95 ? 'text-primary' :
                  stats.accuracy >= 80 ? 'text-secondary' : 'text-destructive'
                }`}>
                  {stats.accuracy}%
                </span>
                <p className="font-mono text-xs text-muted-foreground">ACCURACY</p>
              </div>

              {/* Secondary stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Raw WPM', value: stats.rawWpm },
                  { label: 'Correct Words', value: stats.correctWords },
                  { label: 'Incorrect Words', value: stats.incorrectWords },
                  { label: 'Total Keystrokes', value: stats.totalKeystrokes },
                  { label: 'Correct Chars', value: stats.correct },
                  { label: 'Error Chars', value: stats.incorrect },
                  { label: 'Duration', value: `${duration}s` },
                  { label: 'Consistency', value: `${stats.consistency}%` },
                ].map(s => (
                  <div key={s.label} className="bg-muted/20 rounded p-3 text-center border border-primary/10">
                    <div className="font-mono text-sm text-foreground">{s.value}</div>
                    <div className="font-mono text-[9px] text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* WPM Chart */}
              {wpmHistory.length > 1 && (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={wpmHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted)/0.2)" />
                      <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} label={{ value: 'seconds', position: 'insideBottom', offset: -5, fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <Line type="monotone" dataKey="wpm" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))', r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 justify-center">
                <button onClick={retrySameText} className="font-mono text-xs px-4 py-2 rounded border border-primary/30 text-primary hover:bg-primary/10 transition-colors">
                  [_RETRY SAME TEXT]
                </button>
                <button onClick={newTest} className="font-mono text-xs px-4 py-2 rounded border border-secondary/30 text-secondary hover:bg-secondary/10 transition-colors">
                  [_NEW TEST]
                </button>
                <button onClick={() => setShowSaveModal(true)} className="font-mono text-xs px-4 py-2 rounded bg-primary/10 border border-primary text-primary hover:bg-primary/20 transition-colors shadow-[0_0_8px_hsl(var(--primary)/0.3)]">
                  [_SAVE SCORE]
                </button>
                <button onClick={fetchLeaderboard} className="font-mono text-xs px-4 py-2 rounded border border-muted text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors">
                  [_LEADERBOARD]
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save Modal */}
        <AnimatePresence>
          {showSaveModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
              onClick={() => setShowSaveModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="glass-card rounded-lg p-6 w-full max-w-sm space-y-4"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="font-display text-sm text-primary">SAVE SCORE</h3>
                <input
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full px-3 py-2 bg-muted/30 border border-primary/20 rounded font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60"
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') saveScore(); }}
                />
                <div className="flex gap-2">
                  <button onClick={saveScore} className="flex-1 font-mono text-xs py-2 rounded bg-primary/10 border border-primary text-primary hover:bg-primary/20 transition-colors">
                    [_SAVE]
                  </button>
                  <button onClick={() => setShowSaveModal(false)} className="font-mono text-xs py-2 px-4 rounded border border-muted text-muted-foreground hover:text-foreground transition-colors">
                    [_CANCEL]
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inline Leaderboard */}
        <AnimatePresence>
          {showLeaderboard && testState === 'finished' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xs text-primary">TOP 10 LEADERBOARD</h3>
                <button onClick={() => setShowLeaderboard(false)} className="font-mono text-[10px] text-muted-foreground hover:text-primary">
                  [_CLOSE]
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full font-mono text-[10px]">
                  <thead>
                    <tr className="text-muted-foreground border-b border-primary/10">
                      <th className="text-left py-1 px-2">#</th>
                      <th className="text-left py-1 px-2">Player</th>
                      <th className="text-right py-1 px-2">WPM</th>
                      <th className="text-right py-1 px-2">ACC</th>
                      <th className="text-left py-1 px-2">Mode</th>
                      <th className="text-right py-1 px-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((row: any, i: number) => (
                      <tr
                        key={row.id}
                        className={`border-b border-primary/5 ${
                          i === 0 ? 'text-primary shadow-[0_0_8px_hsl(var(--primary)/0.2)]' :
                          i === 1 ? 'text-secondary' :
                          i === 2 ? 'text-destructive' : 'text-foreground'
                        }`}
                      >
                        <td className="py-1.5 px-2">{i + 1}</td>
                        <td className="py-1.5 px-2">{row.player_name}</td>
                        <td className="py-1.5 px-2 text-right">{row.wpm}</td>
                        <td className="py-1.5 px-2 text-right">{row.accuracy}%</td>
                        <td className="py-1.5 px-2">{row.mode}</td>
                        <td className="py-1.5 px-2 text-right">{new Date(row.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {leaderboard.length === 0 && (
                      <tr><td colSpan={6} className="text-center py-4 text-muted-foreground">// No scores yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="font-mono text-[10px] text-muted-foreground/50 text-center">
          // Tab = restart · Backspace = correct · Paste disabled
        </p>
      </div>
    </ToolLayout>
  );
};

export default TypingSpeedTest;
