import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { db } from '@/lib/db';

const GRID = 20;
const CELL = 20;
const SIZE = GRID * CELL;

type Pos = { x: number; y: number };
type Dir = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type GameState = 'idle' | 'playing' | 'over';

const SnakeGame = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [leaderboard, setLeaderboard] = useState<{ player_name: string; score: number }[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const snakeRef = useRef<Pos[]>([{ x: 10, y: 10 }]);
  const dirRef = useRef<Dir>('RIGHT');
  const foodRef = useRef<Pos>({ x: 15, y: 10 });
  const scoreRef = useRef(0);
  const speedRef = useRef(150);
  const gameLoopRef = useRef<number>(0);

  const spawnFood = useCallback(() => {
    let pos: Pos;
    do {
      pos = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
    } while (snakeRef.current.some((s) => s.x === pos.x && s.y === pos.y));
    foodRef.current = pos;
  }, []);

  const resetGame = useCallback(() => {
    snakeRef.current = [{ x: 10, y: 10 }];
    dirRef.current = 'RIGHT';
    scoreRef.current = 0;
    speedRef.current = 150;
    setScore(0);
    setSubmitted(false);
    spawnFood();
  }, [spawnFood]);

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    for (let i = 0; i <= GRID; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, SIZE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(SIZE, i * CELL); ctx.stroke();
    }

    // Snake
    snakeRef.current.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? '#00FF9C' : `rgba(0,255,156,${0.8 - i * 0.02})`;
      ctx.shadowColor = '#00FF9C';
      ctx.shadowBlur = i === 0 ? 8 : 3;
      ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
    });

    // Food
    ctx.fillStyle = '#FF2D78';
    ctx.shadowColor = '#FF2D78';
    ctx.shadowBlur = 10 + Math.sin(Date.now() / 200) * 4;
    ctx.beginPath();
    ctx.arc(foodRef.current.x * CELL + CELL / 2, foodRef.current.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }, []);

  const gameLoop = useCallback(() => {
    const snake = snakeRef.current;
    const head = { ...snake[0] };
    const dir = dirRef.current;

    if (dir === 'UP') head.y--;
    if (dir === 'DOWN') head.y++;
    if (dir === 'LEFT') head.x--;
    if (dir === 'RIGHT') head.x++;

    // Collision
    if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID ||
        snake.some((s) => s.x === head.x && s.y === head.y)) {
      setGameState('over');
      setHighScore((h) => Math.max(h, scoreRef.current));
      return;
    }

    snake.unshift(head);

    if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
      scoreRef.current++;
      setScore(scoreRef.current);
      if (scoreRef.current % 5 === 0) speedRef.current = Math.max(50, speedRef.current - 15);
      spawnFood();
    } else {
      snake.pop();
    }

    draw();
    gameLoopRef.current = window.setTimeout(gameLoop, speedRef.current);
  }, [draw, spawnFood]);

  const startGame = useCallback(() => {
    resetGame();
    setGameState('playing');
    draw();
    gameLoopRef.current = window.setTimeout(gameLoop, speedRef.current);
  }, [resetGame, draw, gameLoop]);

  useEffect(() => {
    if (!open) {
      clearTimeout(gameLoopRef.current);
      setGameState('idle');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === ' ' && gameState !== 'playing') { e.preventDefault(); startGame(); return; }
      const map: Record<string, Dir> = {
        ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
        w: 'UP', s: 'DOWN', a: 'LEFT', d: 'RIGHT',
        W: 'UP', S: 'DOWN', A: 'LEFT', D: 'RIGHT',
      };
      const newDir = map[e.key];
      if (!newDir) return;
      const opposite: Record<Dir, Dir> = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
      if (newDir !== opposite[dirRef.current]) dirRef.current = newDir;
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, gameState, startGame, onClose]);

  const submitScore = async () => {
    if (!playerName.trim() || submitted) return;
    await db('leaderboard').insert({ player_name: playerName.trim(), score });
    const { data } = await db('leaderboard').select('player_name, score').order('score', { ascending: false }).limit(10);
    setLeaderboard(data || []);
    setSubmitted(true);
  };

  useEffect(() => {
    if (open) draw();
  }, [open, draw]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[400] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.9)' }}
        >
          <div className="glass-card rounded-lg p-6 relative">
            <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>

            <div className="flex justify-between mb-4 font-mono text-xs">
              <span className="text-muted-foreground">HIGH: <span className="text-secondary">{highScore}</span></span>
              <span className="text-muted-foreground">SCORE: <span className="text-primary">{score}</span></span>
            </div>

            <div className="relative">
              <canvas
                ref={canvasRef}
                width={SIZE}
                height={SIZE}
                className="rounded border border-primary/15"
              />

              {gameState === 'idle' && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                  <p className="font-mono text-primary blink text-sm">PRESS SPACE TO START</p>
                </div>
              )}

              {gameState === 'over' && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                  <div className="text-center">
                    <h3 className="font-display text-xl text-accent glitch-text mb-2">GAME OVER</h3>
                    <p className="font-mono text-sm text-foreground mb-4">Score: {score}</p>

                    {!submitted ? (
                      <div className="space-y-3">
                        <input
                          value={playerName}
                          onChange={(e) => setPlayerName(e.target.value)}
                          maxLength={20}
                          placeholder="Enter name..."
                          className="w-full bg-muted/50 border border-primary/15 rounded px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                        />
                        <button onClick={submitScore} className="btn-neon-green text-xs py-1.5 px-4 rounded w-full">
                          [_SUBMIT SCORE]
                        </button>
                      </div>
                    ) : (
                      <div className="font-mono text-[10px] text-left max-h-[150px] overflow-y-auto">
                        <p className="text-primary mb-2">// TOP 10 LEADERBOARD</p>
                        {leaderboard.map((e, i) => (
                          <div key={i} className="flex justify-between py-0.5">
                            <span className="text-muted-foreground">{i + 1}. {e.player_name}</span>
                            <span className="text-primary">{e.score}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 mt-3">
                      <button onClick={startGame} className="btn-neon-green text-xs py-1.5 px-3 rounded flex-1">[_RETRY]</button>
                      <button onClick={onClose} className="btn-neon-blue text-xs py-1.5 px-3 rounded flex-1">[_EXIT]</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SnakeGame;
