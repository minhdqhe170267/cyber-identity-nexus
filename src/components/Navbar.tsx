import { useEffect, useState } from 'react';

const NAV_ITEMS = ['HOME', 'ABOUT', 'PROJECTS', 'SKILLS', 'CONTACT'];

const Navbar = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(total > 0 ? (window.scrollY / total) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id.toLowerCase());
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <div
        className="fixed top-0 left-0 h-[3px] bg-primary neon-glow-green z-[100]"
        style={{ width: `${scrollProgress}%` }}
      />
      <nav className="fixed top-[3px] left-0 right-0 z-50 glass-card border-b border-primary/15 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="font-display text-sm text-primary neon-text-green tracking-wider">
            DIOS://
          </span>
          <div className="hidden md:flex gap-6">
            {NAV_ITEMS.map((item) => (
              <button
                key={item}
                onClick={() => scrollTo(item)}
                className="font-mono text-xs tracking-widest text-foreground hover:text-primary transition-colors duration-200"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
