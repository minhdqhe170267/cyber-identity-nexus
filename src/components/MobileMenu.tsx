import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LINKS = [
  { label: 'HOME', action: 'home' },
  { label: 'ABOUT', action: 'about' },
  { label: 'PROJECTS', action: 'projects' },
  { label: 'SKILLS', action: 'skills' },
  { label: 'STATS', action: 'stats' },
  { label: 'CONTACT', action: 'contact' },
  { label: 'TOOLS', action: '/tools' },
  { label: 'GUESTBOOK', action: '/guestbook' },
];

const MobileMenu = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const navigate = useNavigate();

  const handleClick = (action: string) => {
    onClose();
    if (action.startsWith('/')) {
      navigate(action);
    } else {
      if (window.location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          document.getElementById(action)?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      } else {
        document.getElementById(action)?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-y-0 right-0 w-72 z-[300] glass-card border-l border-primary/20 p-8 flex flex-col"
        >
          <button onClick={onClose} className="self-end mb-8 text-muted-foreground hover:text-primary transition-colors">
            <X size={24} />
          </button>
          <div className="flex flex-col gap-4">
            {LINKS.map((link) => (
              <button
                key={link.label}
                onClick={() => handleClick(link.action)}
                className="font-mono text-sm tracking-widest text-foreground hover:text-primary transition-colors text-left py-2"
              >
                {'> '}{link.label}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
