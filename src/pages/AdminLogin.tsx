import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Github } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const AdminLogin = () => {
  const { user, loading, signInWithGitHub } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate('/admin/dashboard', { replace: true });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 crt-overlay noise-overlay">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-lg p-10 max-w-sm w-full text-center"
      >
        <h1 className="section-title text-xl mb-2">{"> ADMIN_ACCESS.exe"}</h1>
        <p className="section-subtitle mb-8">{"// Authentication required"}</p>
        <button
          onClick={signInWithGitHub}
          className="w-full bg-primary text-primary-foreground font-display text-sm tracking-wider py-3 rounded hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <Github size={18} /> [_LOGIN WITH GITHUB]
        </button>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
