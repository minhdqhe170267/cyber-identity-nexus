import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';

interface ToolLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

const ToolLayout = ({ title, subtitle, children }: ToolLayoutProps) => (
  <div className="min-h-screen crt-overlay noise-overlay">
    <Navbar />
    <div className="relative z-10 pt-20 px-4 md:px-6 max-w-7xl mx-auto pb-24">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link
            to="/tools"
            className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft size={14} />
            [← _TOOLS]
          </Link>
          <span className="font-mono text-xs text-muted-foreground">/</span>
          <span className="font-mono text-xs text-primary">{title.replace(/[> ."]/g, '').replace('exe', '.exe')}</span>
        </div>

        <h1 className="section-title">{title}</h1>
        <p className="section-subtitle">{subtitle}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        {children}
      </motion.div>
    </div>
  </div>
);

export default ToolLayout;
