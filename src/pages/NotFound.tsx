import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center px-6 crt-overlay noise-overlay">
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <h1 className="font-display text-6xl md:text-8xl text-primary glitch-text neon-text-green mb-4">404</h1>
      <p className="font-mono text-sm text-muted-foreground mb-8">
        {"// PAGE_NOT_FOUND.exe — The requested resource does not exist"}
      </p>
      <Link to="/" className="btn-neon-green text-sm py-3 px-6 rounded inline-block">
        [_RETURN HOME]
      </Link>
    </motion.div>
  </div>
);

export default NotFound;
