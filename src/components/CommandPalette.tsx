import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Home, User, FolderGit2, Cpu, BarChart3, BookOpen, MessageSquare, Mail, Gamepad2, Terminal, Zap, Heart } from 'lucide-react';

type Command = {
  id: string;
  label: string;
  icon: React.ElementType;
  shortcut?: string;
  action: () => void;
};

const CommandPalette = ({ onPlayGame }: { onPlayGame: () => void }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const scrollTo = useCallback((id: string) => {
    setOpen(false);
    if (window.location.pathname !== '/') {
      navigate('/');
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 300);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [navigate]);

  const triggerGlitch = useCallback(() => {
    setOpen(false);
    document.body.classList.add('page-glitch');
    setTimeout(() => document.body.classList.remove('page-glitch'), 3000);
  }, []);

  const triggerConfetti = useCallback(() => {
    setOpen(false);
    const emojis = ['🎉', '🎊', '✨', '🚀', '💚', '⚡'];
    for (let i = 0; i < 30; i++) {
      const el = document.createElement('div');
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      el.style.cssText = `position:fixed;top:-20px;left:${Math.random()*100}vw;font-size:24px;z-index:99999;pointer-events:none;animation:confetti-fall 3s ease-in forwards;`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 3100);
    }
  }, []);

  const [funnyMsg, setFunnyMsg] = useState('');

  const commands: Command[] = [
    { id: 'home', label: 'Home', icon: Home, action: () => scrollTo('home') },
    { id: 'about', label: 'About', icon: User, action: () => scrollTo('about') },
    { id: 'projects', label: 'Projects', icon: FolderGit2, action: () => scrollTo('projects') },
    { id: 'skills', label: 'Skills', icon: Cpu, action: () => scrollTo('skills') },
    { id: 'stats', label: 'GitHub Stats', icon: BarChart3, action: () => scrollTo('stats') },
    { id: 'blog', label: 'Blog', icon: BookOpen, action: () => { setOpen(false); navigate('/blog'); } },
    { id: 'guestbook', label: 'Guestbook', icon: MessageSquare, action: () => { setOpen(false); navigate('/guestbook'); } },
    { id: 'contact', label: 'Contact', icon: Mail, action: () => scrollTo('contact') },
    { id: 'tools', label: 'Tools Hub', icon: Terminal, action: () => { setOpen(false); navigate('/tools'); } },
    { id: 'tempmail', label: 'Temp Mail', icon: Mail, action: () => { setOpen(false); navigate('/tools/tempmail'); } },
    { id: 'play game', label: 'Play Snake Game', icon: Gamepad2, action: () => { setOpen(false); onPlayGame(); } },
    { id: 'sudo rm -rf /', label: 'sudo rm -rf /', icon: Terminal, action: () => setFunnyMsg('Permission denied. Nice try, hacker.') },
    { id: 'hack the planet', label: 'Hack the Planet', icon: Zap, action: triggerGlitch },
    { id: 'konami', label: 'Konami Code', icon: Heart, action: triggerConfetti },
  ];

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.id.includes(query.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery('');
        setSelectedIndex(0);
        setFunnyMsg('');
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
    setFunnyMsg('');
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      filtered[selectedIndex].action();
    }
  };

  // Hidden "PLAY" trigger
  useEffect(() => {
    let buffer = '';
    const handler = (e: KeyboardEvent) => {
      if (open) return;
      buffer += e.key.toUpperCase();
      if (buffer.length > 10) buffer = buffer.slice(-10);
      if (buffer.includes('PLAY')) {
        buffer = '';
        onPlayGame();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onPlayGame]);

  return (
    <>
      {/* ⌘K hint button */}
      <button
        onClick={() => { setOpen(true); setQuery(''); setFunnyMsg(''); }}
        className="fixed bottom-6 right-6 z-50 glass-card px-3 py-1.5 font-mono text-xs text-primary hover:border-primary/40 transition-colors"
      >
        ⌘K
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-start justify-center pt-[20vh]"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-[600px] mx-4 glass-card rounded-lg neon-glow-green overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center px-4 py-3 border-b border-primary/15">
                <span className="text-primary font-mono mr-2">{'>'}</span>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a command..."
                  className="flex-1 bg-transparent font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <kbd className="text-[10px] font-mono text-muted-foreground border border-primary/15 px-1.5 py-0.5 rounded">ESC</kbd>
              </div>

              {funnyMsg ? (
                <div className="p-6 font-mono text-sm text-accent neon-text-pink text-center">
                  {funnyMsg}
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto py-2">
                  {filtered.map((cmd, i) => (
                    <button
                      key={cmd.id}
                      onClick={() => cmd.action()}
                      onMouseEnter={() => setSelectedIndex(i)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 font-mono text-sm transition-colors ${
                        i === selectedIndex
                          ? 'bg-primary/10 border-l-[3px] border-primary text-primary'
                          : 'text-foreground hover:bg-primary/5 border-l-[3px] border-transparent'
                      }`}
                    >
                      <cmd.icon size={16} />
                      <span>{cmd.label}</span>
                    </button>
                  ))}
                  {filtered.length === 0 && (
                    <p className="px-4 py-6 text-center font-mono text-xs text-muted-foreground">
                      // NO COMMANDS FOUND
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CommandPalette;
