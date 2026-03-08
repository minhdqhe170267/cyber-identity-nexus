import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Undo2, Trophy, Save } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const SIZE = 4;
const CELL_GAP = 8; // gap in px
const CELL_SIZE_PERCENT = (100 - (SIZE + 1) * 2) / SIZE; // approx for CSS

type Direction = 'up' | 'down' | 'left' | 'right';

interface Tile {
  id: number;
  value: number;
  row: number;
  col: number;
  isNew?: boolean;
  isMerged?: boolean;
}

let tileIdCounter = 0;
const nextId = () => ++tileIdCounter;

// Create initial tiles
const createInitialTiles = (): Tile[] => {
  const tiles: Tile[] = [];
  const positions: [number, number][] = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      positions.push([r, c]);
  // Pick 2 random positions
  for (let i = 0; i < 2; i++) {
    const idx = Math.floor(Math.random() * positions.length);
    const [r, c] = positions.splice(idx, 1)[0];
    tiles.push({ id: nextId(), value: Math.random() < 0.9 ? 2 : 4, row: r, col: c, isNew: true });
  }
  return tiles;
};

const tilesToGrid = (tiles: Tile[]): number[][] => {
  const g = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  tiles.forEach(t => { g[t.row][t.col] = t.value; });
  return g;
};

const canMoveGrid = (grid: number[][]): boolean => {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) return true;
      if (c + 1 < SIZE && grid[r][c] === grid[r][c + 1]) return true;
      if (r + 1 < SIZE && grid[r][c] === grid[r + 1][c]) return true;
    }
  return false;
};

// Perform a move and return new tiles with animations
const performMove = (tiles: Tile[], dir: Direction): { newTiles: Tile[]; score: number; moved: boolean } => {
  // Build lookup: grid[r][c] = tile or null
  const grid: (Tile | null)[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  tiles.forEach(t => { grid[t.row][t.col] = t; });

  const newTiles: Tile[] = [];
  let score = 0;
  let moved = false;

  // Determine iteration order based on direction
  const getTraversal = () => {
    const rows = Array.from({ length: SIZE }, (_, i) => i);
    const cols = Array.from({ length: SIZE }, (_, i) => i);
    if (dir === 'down') rows.reverse();
    if (dir === 'right') cols.reverse();
    return { rows, cols };
  };

  const getVector = (): [number, number] => {
    switch (dir) {
      case 'up': return [-1, 0];
      case 'down': return [1, 0];
      case 'left': return [0, -1];
      case 'right': return [0, 1];
    }
  };

  const { rows, cols } = getTraversal();
  const [dr, dc] = getVector();

  // Track which cells have been merged (to prevent double merge)
  const mergedCells = new Set<string>();
  // Result grid for tracking positions
  const resultGrid: (Tile | null)[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));

  for (const r of rows) {
    for (const c of cols) {
      const tile = grid[r][c];
      if (!tile) continue;

      // Find farthest empty position in direction
      let newR = r;
      let newC = c;

      while (true) {
        const nextR = newR + dr;
        const nextC = newC + dc;
        if (nextR < 0 || nextR >= SIZE || nextC < 0 || nextC >= SIZE) break;

        const target = resultGrid[nextR][nextC];
        if (!target) {
          newR = nextR;
          newC = nextC;
        } else if (target.value === tile.value && !mergedCells.has(`${nextR},${nextC}`)) {
          // Merge!
          newR = nextR;
          newC = nextC;
          break;
        } else {
          break;
        }
      }

      if (newR !== r || newC !== c) moved = true;

      const existing = resultGrid[newR][newC];
      if (existing && existing.value === tile.value) {
        // Merge
        const mergedValue = tile.value * 2;
        score += mergedValue;
        const mergedTile: Tile = { id: nextId(), value: mergedValue, row: newR, col: newC, isMerged: true };
        // Replace in result grid
        resultGrid[newR][newC] = mergedTile;
        // We need to animate both tiles to this position, then show merged
        // Add sliding tiles (will be removed after animation)
        newTiles.push({ ...tile, row: newR, col: newC }); // old tile slides
        // The merged tile replaces
        newTiles.push(mergedTile);
        mergedCells.add(`${newR},${newC}`);
        // Remove the old sliding tile from final
      } else {
        const movedTile: Tile = { ...tile, row: newR, col: newC, isNew: false, isMerged: false };
        resultGrid[newR][newC] = movedTile;
        newTiles.push(movedTile);
      }
    }
  }

  // Deduplicate: for merged tiles, keep only the merged version
  const finalTiles: Tile[] = [];
  const seen = new Set<string>();
  // Process in reverse so merged tiles (added later) win
  for (let i = newTiles.length - 1; i >= 0; i--) {
    const t = newTiles[i];
    const key = `${t.row},${t.col}`;
    if (!seen.has(key)) {
      seen.add(key);
      finalTiles.push(t);
    }
  }

  return { newTiles: finalTiles, score, moved };
};

const addRandomTile = (tiles: Tile[]): Tile[] => {
  const occupied = new Set(tiles.map(t => `${t.row},${t.col}`));
  const empty: [number, number][] = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (!occupied.has(`${r},${c}`)) empty.push([r, c]);
  if (empty.length === 0) return tiles;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  return [...tiles.map(t => ({ ...t, isNew: false, isMerged: false })), { id: nextId(), value: Math.random() < 0.9 ? 2 : 4, row: r, col: c, isNew: true }];
};

const maxTile = (tiles: Tile[]): number => Math.max(...tiles.map(t => t.value), 0);

const TILE_COLORS: Record<number, string> = {
  2: 'bg-muted/40 text-muted-foreground border-muted-foreground/10',
  4: 'bg-muted/60 text-foreground border-muted-foreground/20',
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
  const [tiles, setTiles] = useState<Tile[]>(() => createInitialTiles());
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [keepGoing, setKeepGoing] = useState(false);
  const [prevTiles, setPrevTiles] = useState<Tile[] | null>(null);
  const [prevScore, setPrevScore] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [saving, setSaving] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isMoving, setIsMoving] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

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
    tileIdCounter = 0;
    setTiles(createInitialTiles());
    setScore(0);
    setMoves(0);
    setGameOver(false);
    setWon(false);
    setKeepGoing(false);
    setPrevTiles(null);
    setIsMoving(false);
  };

  const handleMove = useCallback((dir: Direction) => {
    if (gameOver || (won && !keepGoing) || isMoving) return;

    const { newTiles, score: addedScore, moved } = performMove(tiles, dir);
    if (!moved) return;

    setIsMoving(true);
    setPrevTiles([...tiles]);
    setPrevScore(score);

    // First set tiles to their new positions (this triggers slide animation)
    setTiles(newTiles);

    // After slide animation, add a new random tile
    setTimeout(() => {
      const withNew = addRandomTile(newTiles);
      const newScore = score + addedScore;
      setTiles(withNew);
      setScore(newScore);
      setMoves(m => m + 1);
      if (newScore > best) setBest(newScore);

      const grid = tilesToGrid(withNew);
      if (maxTile(withNew) >= 2048 && !won && !keepGoing) {
        setWon(true);
      } else if (!canMoveGrid(grid)) {
        setGameOver(true);
      }
      setIsMoving(false);
    }, 120);
  }, [tiles, score, best, gameOver, won, keepGoing, isMoving]);

  const undo = () => {
    if (!prevTiles) return;
    setTiles(prevTiles);
    setScore(prevScore);
    setMoves(m => m - 1);
    setPrevTiles(null);
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
      max_tile: maxTile(tiles),
      moves,
    });
    setSaving(false);
    toast({ title: '// SCORE LOGGED' });
    fetchLeaderboard();
  };

  // Compute cell position as percentage
  const cellPos = (index: number) => `calc(${(100 / SIZE) * index}% + ${4}px)`;
  const cellSize = `calc(${100 / SIZE}% - ${8}px)`;

  return (
    <ToolLayout title="> 2048.exe" subtitle="// Merge tiles to reach 2048 — or beyond">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Game */}
        <div className="flex-1 max-w-md mx-auto lg:mx-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-4">
              <div className="glass-card rounded-lg px-4 py-2 text-center min-w-[80px]">
                <p className="font-mono text-[10px] text-muted-foreground">SCORE</p>
                <motion.p key={score} initial={{ scale: 1.3, color: 'hsl(var(--primary))' }} animate={{ scale: 1 }} transition={{ duration: 0.3 }} className="font-display text-lg text-primary">
                  {score}
                </motion.p>
              </div>
              <div className="glass-card rounded-lg px-4 py-2 text-center min-w-[80px]">
                <p className="font-mono text-[10px] text-muted-foreground">BEST</p>
                <p className="font-display text-lg text-foreground">{best}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="icon" variant="outline" onClick={undo} disabled={!prevTiles} className="border-primary/20">
                <Undo2 size={16} />
              </Button>
              <Button size="icon" variant="outline" onClick={newGame} className="border-primary/20">
                <RotateCcw size={16} />
              </Button>
            </div>
          </div>

          {/* Grid */}
          <div
            ref={boardRef}
            className="relative bg-muted/20 rounded-xl border border-primary/10 aspect-square"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {/* Background cells */}
            <div className="absolute inset-0 grid grid-cols-4 gap-[6px] p-[6px]">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="rounded-lg bg-muted/10 border border-primary/5" />
              ))}
            </div>

            {/* Animated tiles */}
            <AnimatePresence mode="popLayout">
              {tiles.map(tile => (
                <motion.div
                  key={tile.id}
                  layout
                  initial={
                    tile.isNew
                      ? { scale: 0, opacity: 0 }
                      : tile.isMerged
                      ? { scale: 1.2 }
                      : false
                  }
                  animate={{
                    scale: 1,
                    opacity: 1,
                    top: cellPos(tile.row),
                    left: cellPos(tile.col),
                    width: cellSize,
                    height: cellSize,
                  }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{
                    top: { type: 'tween', duration: 0.12, ease: 'easeInOut' },
                    left: { type: 'tween', duration: 0.12, ease: 'easeInOut' },
                    scale: tile.isNew
                      ? { type: 'spring', stiffness: 400, damping: 15, delay: 0.12 }
                      : tile.isMerged
                      ? { type: 'spring', stiffness: 400, damping: 12 }
                      : { duration: 0.05 },
                    opacity: { duration: 0.1 },
                  }}
                  className={`absolute rounded-lg border flex items-center justify-center font-display z-[1] ${
                    TILE_COLORS[tile.value] || 'bg-primary/40 text-primary border-primary/50 shadow-[0_0_20px_rgba(0,255,156,0.3)]'
                  } ${tile.value >= 4096 ? 'ring-2 ring-primary/50' : ''}`}
                >
                  <motion.span
                    key={`${tile.id}-val`}
                    initial={tile.isMerged ? { scale: 1.4 } : false}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    className={`${tile.value >= 1000 ? 'text-sm' : tile.value >= 100 ? 'text-base' : 'text-lg'} select-none`}
                  >
                    {tile.value}
                  </motion.span>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Overlays */}
            <AnimatePresence>
              {(gameOver || (won && !keepGoing)) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-4 z-10"
                >
                  <motion.p
                    initial={{ scale: 0.5, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className={`font-display text-xl ${won ? 'text-[hsl(45,100%,60%)]' : 'text-destructive'}`}
                  >
                    {won ? '// 2048 REACHED' : '// GAME OVER'}
                  </motion.p>
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
            <span>MAX TILE: {maxTile(tiles)}</span>
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
