import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import MobileMenu from './MobileMenu';

const NAV_ITEMS = [
  { label: 'HOME', action: 'home' },
  { label: 'ABOUT', action: 'about' },
  { label: 'PROJECTS', action: 'projects' },
  { label: 'SKILLS', action: 'skills' },
  { label: 'BLOG', action: '/blog' },
  { label: 'GUESTBOOK', action: '/guestbook' },
  { label: 'CONTACT', action: 'contact' },
];

const Navbar = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(total > 0 ? (window.scrollY / total) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleClick = (action: string) => {
    if (action.startsWith('/')) {
      navigate(action);
    } else {
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => document.getElementById(action)?.scrollIntoView({ behavior: 'smooth' }), 300);
      } else {
        document.getElementById(action)?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      <div
        className="fixed top-0 left-0 h-[3px] bg-primary neon-glow-green z-[100]"
        style={{ width: `${scrollProgress}%` }}
      />
      <nav className="fixed top-[3px] left-0 right-0 z-50 glass-card border-b border-primary/15 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="font-display text-sm text-primary neon-text-green tracking-wider">
            DIOS://
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.label}
                onClick={() => handleClick(item.action)}
                className="font-mono text-xs tracking-widest text-foreground hover:text-primary transition-colors duration-200"
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden text-foreground hover:text-primary transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>
      </nav>
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
};

export default Navbar;
