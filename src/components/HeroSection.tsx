import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GITHUB_USERNAME, GITHUB_PROFILE_URL } from '@/config/profile';

const LINES = [
  { text: '> Initializing system...', delay: 800 },
  { text: '> Loading GitHub profile...', delay: 600 },
  { text: `> Connected to github.com/${GITHUB_USERNAME}`, delay: 400 },
  { text: '> Public repositories and activity synced live.', delay: 0 },
];

const HeroSection = () => {
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [typingDone, setTypingDone] = useState(false);

  useEffect(() => {
    if (currentLine >= LINES.length) {
      setTypingDone(true);
      return;
    }

    const line = LINES[currentLine].text;

    if (currentChar < line.length) {
      const timeout = setTimeout(() => {
        setDisplayedLines((prev) => {
          const updated = [...prev];
          updated[currentLine] = line.substring(0, currentChar + 1);
          return updated;
        });
        setCurrentChar((c) => c + 1);
      }, 30);
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => {
        setCurrentLine((l) => l + 1);
        setCurrentChar(0);
      }, LINES[currentLine].delay);
      return () => clearTimeout(timeout);
    }
  }, [currentLine, currentChar]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center px-6">
      <div className="max-w-2xl w-full">
        <div className="glass-card rounded-lg p-6 md:p-10 font-mono text-sm md:text-base">
          <div className="flex items-center gap-2 mb-4 text-xs">
            <span className="w-3 h-3 rounded-full bg-neon-pink" />
            <span className="w-3 h-3 rounded-full bg-neon-blue" />
            <span className="w-3 h-3 rounded-full bg-neon-green" />
            <span className="ml-2 text-muted-foreground">terminal — bash</span>
          </div>
          {displayedLines.map((line, i) => (
            <div key={i} className="mb-1">
              <span className={i === 2 ? '' : 'text-foreground'}>
                {i === 2 ? (
                  <>
                    {'> Connected to '}
                    <span className="text-primary glitch-text neon-text-green font-bold">
                      {GITHUB_PROFILE_URL.replace('https://', '')}
                    </span>
                  </>
                ) : (
                  <span className={i === 3 ? 'text-secondary neon-text-blue' : ''}>
                    {line}
                  </span>
                )}
              </span>
              {i === currentLine && !typingDone && (
                <span className="blink text-primary ml-0.5">█</span>
              )}
            </div>
          ))}
          {typingDone && (
            <span className="blink text-primary">█</span>
          )}
        </div>

        {typingDone && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 mt-8 justify-center"
          >
            <button onClick={() => scrollTo('projects')} className="btn-neon-green font-mono text-sm tracking-wider">
              [_EXPLORE PROJECTS]
            </button>
            <button onClick={() => scrollTo('contact')} className="btn-neon-blue font-mono text-sm tracking-wider">
              [_CONTACT ME]
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default HeroSection;
