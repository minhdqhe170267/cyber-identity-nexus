import { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Github, ExternalLink, X } from 'lucide-react';

type Project = {
  name: string;
  description: string;
  fullDescription: string;
  status: 'DEPLOYED' | 'IN PROGRESS' | 'CLASSIFIED';
  tech: string[];
};

const PROJECTS: Project[] = [
  {
    name: 'CyberVault',
    description: 'Encrypted password manager with zero-knowledge architecture',
    fullDescription: 'A full-featured password manager built with end-to-end encryption. Features include secure vault storage, auto-fill browser extension, and cross-device sync with zero-knowledge proof architecture.',
    status: 'DEPLOYED',
    tech: ['React', 'TypeScript', 'Supabase', 'Crypto API'],
  },
  {
    name: 'NeuralFlow',
    description: 'AI-powered workflow automation platform',
    fullDescription: 'An intelligent automation platform that uses machine learning to optimize business workflows. Includes visual pipeline builder, real-time monitoring, and predictive analytics dashboard.',
    status: 'IN PROGRESS',
    tech: ['Next.js', 'Python', 'TensorFlow', 'Docker'],
  },
  {
    name: 'GhostNet',
    description: 'Decentralized messaging protocol with quantum-safe encryption',
    fullDescription: 'A peer-to-peer messaging system designed for maximum privacy. Implements post-quantum cryptographic algorithms and onion routing for metadata resistance.',
    status: 'CLASSIFIED',
    tech: ['Rust', 'WebRTC', 'WASM', 'libp2p'],
  },
  {
    name: 'DataPulse',
    description: 'Real-time analytics dashboard for IoT sensor networks',
    fullDescription: 'Comprehensive IoT monitoring solution processing millions of data points. Features real-time visualization, anomaly detection, and predictive maintenance alerts.',
    status: 'DEPLOYED',
    tech: ['React', 'D3.js', 'Node.js', 'InfluxDB'],
  },
  {
    name: 'SynthOS',
    description: 'Custom Linux distribution for penetration testing',
    fullDescription: 'A specialized Linux distro pre-configured with security auditing tools. Includes custom kernel modules, automated scanning scripts, and integrated reporting.',
    status: 'IN PROGRESS',
    tech: ['Linux', 'Bash', 'Python', 'C'],
  },
  {
    name: 'PixelForge',
    description: 'Browser-based 3D model editor with WebGPU rendering',
    fullDescription: 'A powerful 3D modeling tool running entirely in the browser. Leverages WebGPU for near-native rendering performance with PBR materials and real-time ray tracing.',
    status: 'DEPLOYED',
    tech: ['TypeScript', 'WebGPU', 'Three.js', 'WASM'],
  },
];

const statusColor = (s: string) =>
  s === 'DEPLOYED' ? 'text-primary border-primary/40' :
  s === 'IN PROGRESS' ? 'text-secondary border-secondary/40' :
  'text-accent border-accent/40';

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// 3D tilt card component
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

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      variants={cardVariants}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      whileHover={{ scale: 1.03 }}
      className="glass-card glass-card-hover rounded-lg p-6 cursor-pointer flex flex-col will-change-transform"
    >
      <div className="mb-3">
        <span className={`text-[10px] font-mono border px-2 py-0.5 rounded ${statusColor(project.status)}`}>
          [{project.status}]
        </span>
      </div>
      <h3 className="font-display text-lg mb-2">{project.name}</h3>
      <p className="font-mono text-xs text-muted-foreground mb-4 flex-1">
        {project.description}
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {project.tech.map((t) => (
          <span key={t} className="text-[10px] font-mono border border-primary/20 text-primary/70 px-2 py-0.5 rounded">
            {t}
          </span>
        ))}
      </div>
      <div className="flex gap-3">
        <button className="w-8 h-8 rounded border border-primary/20 flex items-center justify-center text-primary/60 hover:text-primary hover:border-primary/40 transition-colors">
          <Github size={14} />
        </button>
        <button className="w-8 h-8 rounded border border-primary/20 flex items-center justify-center text-primary/60 hover:text-primary hover:border-primary/40 transition-colors">
          <ExternalLink size={14} />
        </button>
      </div>
    </motion.div>
  );
};

const ProjectsSection = () => {
  const [selected, setSelected] = useState<Project | null>(null);

  return (
    <section id="projects" className="relative py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title">{"> MISSION_BOARD.log"}</h2>
          <p className="section-subtitle">{"// Selected works & deployments"}</p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {PROJECTS.map((project) => (
            <TiltCard
              key={project.name}
              project={project}
              onClick={() => setSelected(project)}
            />
          ))}
        </motion.div>
      </div>

      {/* Modal with clip-path reveal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm p-6"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ clipPath: 'circle(0% at 50% 50%)', opacity: 0 }}
              animate={{ clipPath: 'circle(75% at 50% 50%)', opacity: 1 }}
              exit={{ clipPath: 'circle(0% at 50% 50%)', opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className="glass-card rounded-lg p-8 max-w-lg w-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelected(null)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.25 } },
                }}
              >
                <motion.span
                  variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                  className={`inline-block text-[10px] font-mono border px-2 py-0.5 rounded ${statusColor(selected.status)}`}
                >
                  [{selected.status}]
                </motion.span>
                <motion.h3
                  variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                  className="font-display text-2xl mt-3 mb-4"
                >
                  {selected.name}
                </motion.h3>
                <motion.p
                  variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                  className="font-mono text-sm text-foreground leading-relaxed mb-6"
                >
                  {selected.fullDescription}
                </motion.p>
                <motion.div
                  variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                  className="flex flex-wrap gap-2 mb-6"
                >
                  {selected.tech.map((t) => (
                    <span key={t} className="text-xs font-mono border border-primary/30 text-primary px-3 py-1 rounded">
                      {t}
                    </span>
                  ))}
                </motion.div>
                <motion.div
                  variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                  className="flex gap-4"
                >
                  <a href="#" className="btn-neon-green text-xs py-2 px-4 rounded">
                    <Github size={14} className="inline mr-2" />Source
                  </a>
                  <a href="#" className="btn-neon-blue text-xs py-2 px-4 rounded">
                    <ExternalLink size={14} className="inline mr-2" />Live Demo
                  </a>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default ProjectsSection;
