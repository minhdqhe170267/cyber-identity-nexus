import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Github, ExternalLink, X } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { db } from '@/lib/db';

type Project = {
  id: string; title: string; description: string; tech_tags: string[];
  status: string; github_url: string; demo_url: string;
};

const FALLBACK_PROJECTS: Project[] = [
  { id: '1', title: 'CyberVault', description: 'Encrypted password manager with zero-knowledge architecture', tech_tags: ['React', 'TypeScript', 'Supabase'], status: 'DEPLOYED', github_url: '#', demo_url: '#' },
  { id: '2', title: 'NeuralFlow', description: 'AI-powered workflow automation platform', tech_tags: ['Next.js', 'Python', 'TensorFlow'], status: 'IN_PROGRESS', github_url: '#', demo_url: '#' },
  { id: '3', title: 'GhostNet', description: 'Decentralized messaging with quantum-safe encryption', tech_tags: ['Rust', 'WebRTC', 'WASM'], status: 'CLASSIFIED', github_url: '#', demo_url: '#' },
  { id: '4', title: 'DataPulse', description: 'Real-time analytics for IoT sensor networks', tech_tags: ['React', 'D3.js', 'Node.js'], status: 'DEPLOYED', github_url: '#', demo_url: '#' },
  { id: '5', title: 'SynthOS', description: 'Custom Linux distro for penetration testing', tech_tags: ['Linux', 'Python', 'C'], status: 'IN_PROGRESS', github_url: '#', demo_url: '#' },
  { id: '6', title: 'PixelForge', description: 'Browser-based 3D model editor with WebGPU', tech_tags: ['TypeScript', 'WebGPU', 'Three.js'], status: 'DEPLOYED', github_url: '#', demo_url: '#' },
];

const statusColor = (s: string) =>
  s === 'DEPLOYED' ? 'text-primary border-primary/40' :
  s === 'IN_PROGRESS' ? 'text-secondary border-secondary/40' :
  'text-accent border-accent/40';

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
const cardVariants = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const TiltCard = ({ project, onClick }: { project: Project; onClick: () => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), { stiffness: 200, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <motion.div ref={ref} variants={cardVariants} onMouseMove={handleMouseMove}
      onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }} onClick={onClick}
      style={{ rotateX, rotateY, transformPerspective: 800 }} whileHover={{ scale: 1.03 }}
      className="glass-card glass-card-hover rounded-lg p-6 cursor-pointer flex flex-col will-change-transform">
      <div className="mb-3">
        <span className={`text-[10px] font-mono border px-2 py-0.5 rounded ${statusColor(project.status)}`}>[{project.status}]</span>
      </div>
      <h3 className="font-display text-lg mb-2">{project.title}</h3>
      <p className="font-mono text-xs text-muted-foreground mb-4 flex-1">{project.description}</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {(project.tech_tags || []).map((t) => (
          <span key={t} className="text-[10px] font-mono border border-primary/20 text-primary/70 px-2 py-0.5 rounded">{t}</span>
        ))}
      </div>
      <div className="flex gap-3">
        <a href={project.github_url || '#'} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
          className="w-8 h-8 rounded border border-primary/20 flex items-center justify-center text-primary/60 hover:text-primary hover:border-primary/40 transition-colors">
          <Github size={14} />
        </a>
        <a href={project.demo_url || '#'} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
          className="w-8 h-8 rounded border border-primary/20 flex items-center justify-center text-primary/60 hover:text-primary hover:border-primary/40 transition-colors">
          <ExternalLink size={14} />
        </a>
      </div>
    </motion.div>
  );
};

const ProjectsSection = () => {
  const [projects, setProjects] = useState<Project[]>(FALLBACK_PROJECTS);
  const [selected, setSelected] = useState<Project | null>(null);

  useEffect(() => {
    db('projects').select('*').order('created_at', { ascending: false })
      .then(({ data }: any) => { if (data?.length) setProjects(data); });
  }, []);

  return (
    <section id="projects" className="relative py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.6 }}>
          <h2 className="section-title">{"> MISSION_BOARD.log"}</h2>
          <p className="section-subtitle">{"// Selected works & deployments"}</p>
        </motion.div>

        <motion.div variants={containerVariants} initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-50px' }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <TiltCard key={project.id} project={project} onClick={() => setSelected(project)} />
          ))}
        </motion.div>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm p-6"
            onClick={() => setSelected(null)}>
            <motion.div
              initial={{ clipPath: 'circle(0% at 50% 50%)', opacity: 0 }}
              animate={{ clipPath: 'circle(75% at 50% 50%)', opacity: 1 }}
              exit={{ clipPath: 'circle(0% at 50% 50%)', opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className="glass-card rounded-lg p-8 max-w-lg w-full relative"
              onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setSelected(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><X size={18} /></button>
              <span className={`text-[10px] font-mono border px-2 py-0.5 rounded ${statusColor(selected.status)}`}>[{selected.status}]</span>
              <h3 className="font-display text-2xl mt-3 mb-4">{selected.title}</h3>
              <p className="font-mono text-sm text-foreground leading-relaxed mb-6">{selected.description}</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {(selected.tech_tags || []).map((t) => (
                  <span key={t} className="text-xs font-mono border border-primary/30 text-primary px-3 py-1 rounded">{t}</span>
                ))}
              </div>
              <div className="flex gap-4">
                <a href={selected.github_url || '#'} target="_blank" rel="noreferrer" className="btn-neon-green text-xs py-2 px-4 rounded">
                  <Github size={14} className="inline mr-2" />Source
                </a>
                <a href={selected.demo_url || '#'} target="_blank" rel="noreferrer" className="btn-neon-blue text-xs py-2 px-4 rounded">
                  <ExternalLink size={14} className="inline mr-2" />Live Demo
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default ProjectsSection;
