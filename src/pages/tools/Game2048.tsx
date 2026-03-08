import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Undo2, Trophy, Save } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type Grid = number[][];
type Direction = 'up' | 'down' | 'left' | 'right';

const SIZE = 4;

const emptyGrid = (): Grid => Array.from({ length: SIZE }, () => Array(SIZE).fill(0));

const clone = (g: Grid): Grid => g.map(r => [...r]);

const addRandom = (grid: Grid): Grid => {
  const g = clone(grid);
  const empty: [number, number][] = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (g[r][c] === 0) empty.push([r, c]);
  if (empty.length === 0) return g;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  g[r][c] = Math.random() < 0.9 ? 2 : 4;
  return g;
};

const rotateRight = (g: Grid): Grid => {
  const n: Grid = emptyGrid();
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      n[c][SIZE - 1 - r] = g[r][c];
  return n;
};

const slideLeft = (grid: Grid): { grid: Grid; score: number; moved: boolean } => {
  let score = 0;
  let moved = false;
  const g = clone(grid);
  for (let r = 0; r < SIZE; r++) {
    let row = g[r].filter(v => v !== 0);
    const merged: number[] = [];
    let i = 0;
    while (i < row.length) {
      if (i + 1 < row.length && row[i] === row[i + 1]) {
        merged.push(row[i] * 2);
        score += row[i] * 2;
        i += 2;
      } else {
        merged.push(row[i]);
        i++;
      }
    }
    while (merged.length < SIZE) merged.push(0);
    if (merged.some((v, j) => v !== g[r][j])) moved = true;
    g[r] = merged;
  }
  return { grid: g, score, moved };
};

const move = (grid: Grid, dir: Direction): { grid: Grid; score: number; moved: boolean } => {
  let g = clone(grid);
  const rotations: Record<Direction, number> = { left: 0, down: 1, right: 2, up: 3 };
  for (let i = 0; i < rotations[dir]; i++) g = rotateRight(g);
  const result = slideLeft(g);
  g = result.grid;
  for (let i = 0; i < (4 - rotations[dir]) % 4; i++) g = rotateRight(g);
  return { grid: g, score: result.score, moved: result.moved };
};

const canMove = (grid: Grid): boolean => {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) return true;
      if (c + 1 < SIZE && grid[r][c] === grid[r][c + 1]) return true;
      if (r + 1 < SIZE && grid[r][c] === grid[r + 1][c]) return true;
    }
  return false;
};

const maxTile = (grid: Grid): number => Math.max(...grid.flat());

const TILE_COLORS: Record<number, string> = {
  2: 'bg-muted/40 text-muted-foreground',
  4: 'bg-muted/60 text-foreground',
  8: 'bg-secondary/20 text-secondary border-secondary/30',
  16: 'bg-secondary/30 text-secondary border-secondary/40',
  32: 'bg-primary/15 text-primary border-primary/30',
  64: 'bg-primary/25 text-primary border-primary/40',
  128: 'bg-primary/35 text-primary border-primary/50 shadow-[0_0_15px_rgba(0,255,156,0.2)]',
  256: 'bg-secondary/40 text-secondary border-secondary/50 shadow-[0_0_15px_rgba(0,212,255,0.2)]',
  512: 'bg-destructive/20 text-destructive border-destructive/30',
  1024: 'bg-destructive/30 text-destructive border-destructive/40 shadow-[0_0_15px_rgba(255,45,120,0.2)]',
  2048: 'bg-[hsl(45,100%,50%)]/30 text-[hsl(45,100%,60%)] border-[hsl(45,100%,50%)]/50 shadow-[0_0_25px_rgba(255,200,0,0.3)]',
};

const Game2048 = () => {
  const { toast } = useToast();
  const [grid, setGrid] = useState<Grid>(() => addRandom(addRandom(emptyGrid())));
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [keepGoing, setKeepGoing] = useState(false);
  const [prevGrid, setPrevGrid] = useState<Grid | null>(null);
  const [prevScore, setPrevScore] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [saving, setSaving] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [startTime] = useState(Date.now());
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from('game_scores_2048')
      .select('*')
      .order('score', { ascending: false })
      .limit(10);
    if (data) setLeaderboard(data);
  };

  useEffect(() => { fetchLeaderboard(); }, []);

  const newGame = () => {
    setGrid(addRandom(addRandom(emptyGrid())));
    setScore(0);
    setMoves(0);
    setGameOver(false);
    setWon(false);
    setKeepGoing(false);
    setPrevGrid(null);
  };

  const handleMove = useCallback((dir: Direction) => {
    if (gameOver || (won && !keepGoing)) return;
    const result = move(grid, dir);
    if (!result.moved) return;

    setPrevGrid(clone(grid));
    setPrevScore(score);
    
    const newGrid = addRandom(result.grid);
    const newScore = score + result.score;
    setGrid(newGrid);
    setScore(newScore);
    setMoves(m => m + 1);
    if (newScore > best) setBest(newScore);

    if (maxTile(newGrid) >= 2048 && !won && !keepGoing) {
      setWon(true);
    } else if (!canMove(newGrid)) {
      setGameOver(true);
    }
  }, [grid, score, best, gameOver, won, keepGoing]);

  const undo = () => {
    if (!prevGrid) return;
    setGrid(prevGrid);
    setScore(prevScore);
    setMoves(m => m - 1);
    setPrevGrid(null);
    setGameOver(false);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        w: 'up', s: 'down', a: 'left', d: 'right',
      };
      if (map[e.key]) { e.preventDefault(); handleMove(map[e.key]); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleMove]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    const absDx = Math.abs(dx), absDy = Math.abs(dy);
    if (Math.max(absDx, absDy) < 30) return;
    if (absDx > absDy) handleMove(dx > 0 ? 'right' : 'left');
    else handleMove(dy > 0 ? 'down' : 'up');
    touchStart.current = null;
  };

  const saveScore = async () => {
    if (!playerName.trim()) return;
    setSaving(true);
    await supabase.from('game_scores_2048').insert({
      player_name: playerName.trim(),
      score,
      max_tile: maxTile(grid),
      moves,
    });
    setSaving(false);
    toast({ title: '// SCORE LOGGED' });
    fetchLeaderboard();
  };

  return (
    <ToolLayout title="> 2048.exe" subtitle="// Merge tiles to reach 2048 — or beyond">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Game */}
        <div className="flex-1 max-w-md mx-auto lg:mx-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-4">
              <div className="glass-card rounded-lg px-4 py-2 text-center">
                <p className="font-mono text-[10px] text-muted-foreground">SCORE</p>
                <motion.p key={score} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="font-display text-lg text-primary">
                  {score}
                </motion.p>
              </div>
              <div className="glass-card rounded-lg px-4 py-2 text-center">
                <p className="font-mono text-[10px] text-muted-foreground">BEST</p>
                <p className="font-display text-lg text-foreground">{best}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="icon" variant="outline" onClick={undo} disabled={!prevGrid} className="border-primary/20">
                <Undo2 size={16} />
              </Button>
              <Button size="icon" variant="outline" onClick={newGame} className="border-primary/20">
                <RotateCcw size={16} />
              </Button>
            </div>
          </div>

          {/* Grid */}
          <div
            className="relative grid grid-cols-4 gap-2 p-2 bg-muted/20 rounded-xl border border-primary/10"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {grid.flat().map((val, i) => (
              <motion.div
                key={`${i}-${val}`}
                initial={val ? { scale: 0.5 } : false}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={`aspect-square rounded-lg border flex items-center justify-center font-display transition-colors ${
                  val === 0
                    ? 'bg-muted/10 border-primary/5'
                    : TILE_COLORS[val] || 'bg-primary/40 text-primary border-primary/50 shadow-[0_0_20px_rgba(0,255,156,0.3)] animate-pulse'
                } ${val >= 4096 ? 'ring-2 ring-primary/50 animate-pulse' : ''}`}
              >
                {val > 0 && (
                  <span className={`${val >= 1000 ? 'text-sm' : val >= 100 ? 'text-base' : 'text-lg'}`}>
                    {val}
                  </span>
                )}
              </motion.div>
            ))}

            {/* Overlays */}
            <AnimatePresence>
              {(gameOver || (won && !keepGoing)) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-4 z-10"
                >
                  <p className={`font-display text-xl ${won ? 'text-[hsl(45,100%,60%)]' : 'text-destructive'}`}>
                    {won ? '// 2048 REACHED' : '// GAME OVER'}
                  </p>
                  <p className="font-mono text-sm text-muted-foreground">Score: {score} • Moves: {moves}</p>
                  <div className="flex gap-2">
                    {won && (
                      <Button onClick={() => { setKeepGoing(true); setWon(false); }} variant="outline" className="font-mono text-xs">
                        [_KEEP GOING]
                      </Button>
                    )}
                    <Button onClick={newGame} className="font-mono text-xs">[_NEW GAME]</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Stats */}
          <div className="flex justify-between mt-3 font-mono text-[10px] text-muted-foreground">
            <span>MOVES: {moves}</span>
            <span>MAX TILE: {maxTile(grid)}</span>
          </div>

          {/* Mobile controls */}
          <div className="grid grid-cols-3 gap-2 mt-4 max-w-[180px] mx-auto lg:hidden">
            <div />
            <Button size="sm" variant="outline" onClick={() => handleMove('up')} className="font-mono text-xs border-primary/20">↑</Button>
            <div />
            <Button size="sm" variant="outline" onClick={() => handleMove('left')} className="font-mono text-xs border-primary/20">←</Button>
            <Button size="sm" variant="outline" onClick={() => handleMove('down')} className="font-mono text-xs border-primary/20">↓</Button>
            <Button size="sm" variant="outline" onClick={() => handleMove('right')} className="font-mono text-xs border-primary/20">→</Button>
          </div>

          {/* Save score */}
          {(gameOver || won) && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 glass-card rounded-lg p-4">
              <p className="font-mono text-xs text-muted-foreground mb-2">Enter name to save score:</p>
              <div className="flex gap-2">
                <input
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  placeholder="Player name"
                  className="flex-1 px-3 py-2 bg-muted/30 border border-primary/15 rounded font-mono text-sm text-foreground focus:outline-none focus:border-primary/60"
                />
                <Button onClick={saveScore} disabled={saving || !playerName.trim()} className="font-mono text-xs">
                  <Save size={14} /> {saving ? '...' : '[_SAVE]'}
                </Button>
              </div>
            </motion.div>
          )}

          <p className="font-mono text-[10px] text-muted-foreground/50 text-center mt-3">
            [↑↓←→] or [WASD] to move • swipe on mobile
          </p>
        </div>

        {/* Leaderboard */}
        <div className="lg:w-80">
          <div className="glass-card rounded-lg p-4">
            <h3 className="font-display text-xs text-primary flex items-center gap-2 mb-4">
              <Trophy size={14} /> TOP 10
            </h3>
            {leaderboard.length === 0 && (
              <p className="font-mono text-[10px] text-muted-foreground">No scores yet</p>
            )}
            <div className="space-y-1">
              {leaderboard.map((entry, i) => (
                <div
                  key={entry.id}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded font-mono text-xs transition-colors ${
                    i === 0 ? 'bg-primary/10 text-primary border-l-2 border-primary' :
                    i === 1 ? 'bg-secondary/10 text-secondary border-l-2 border-secondary' :
                    i === 2 ? 'bg-destructive/10 text-destructive border-l-2 border-destructive' :
                    'text-muted-foreground hover:bg-muted/20'
                  }`}
                >
                  <span className="w-6 text-right">{i === 0 ? '👑' : `#${i + 1}`}</span>
                  <span className="flex-1 truncate">{entry.player_name}</span>
                  <span className="font-bold">{entry.score}</span>
                  <span className={`text-[10px] px-1 rounded ${
                    entry.max_tile >= 2048 ? 'bg-[hsl(45,100%,50%)]/20 text-[hsl(45,100%,60%)]' :
                    entry.max_tile >= 512 ? 'bg-primary/10 text-primary' :
                    'bg-muted/30 text-muted-foreground'
                  }`}>
                    {entry.max_tile}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};

export default Game2048;
