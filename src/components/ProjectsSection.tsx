import { useMemo, useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { ExternalLink, GitFork, Github, RefreshCw, Star, X } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { formatDate, getRepoStatus, getRepoTags, type GitHubRepo } from '@/lib/github';
import { useGitHubRepos } from '@/hooks/useGitHubData';

type Project = {
  id: string; title: string; description: string; tech_tags: string[];
  status: string; github_url: string; demo_url: string;
  stars: number; forks: number; updated_at: string; created_at: string;
  isFork: boolean; isPrivate: boolean;
};

const toProject = (repo: GitHubRepo): Project => ({
  id: String(repo.id),
  title: repo.name,
  description: repo.description || 'No GitHub description yet.',
  tech_tags: getRepoTags(repo),
  status: getRepoStatus(repo),
  github_url: repo.html_url,
  demo_url: repo.homepage?.trim() || '',
  stars: repo.stargazers_count,
  forks: repo.forks_count,
  updated_at: repo.pushed_at || repo.updated_at,
  created_at: repo.created_at,
  isFork: repo.fork,
  isPrivate: Boolean(repo.private),
});

const statusColor = (s: string) =>
  s === 'DEPLOYED' ? 'text-primary border-primary/40' :
  s === 'ACTIVE' ? 'text-secondary border-secondary/40' :
  s === 'PRIVATE' ? 'text-accent border-accent/40' :
  s === 'ARCHIVED' ? 'text-muted-foreground border-muted-foreground/30' :
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
        {project.isFork && (
          <span className="ml-2 text-[10px] font-mono border border-secondary/40 text-secondary px-2 py-0.5 rounded">[FORK]</span>
        )}
      </div>
      <h3 className="font-display text-lg mb-2">{project.title}</h3>
      <p className="font-mono text-xs text-muted-foreground mb-4 flex-1">{project.description}</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {(project.tech_tags || []).map((t) => (
          <span key={t} className="text-[10px] font-mono border border-primary/20 text-primary/70 px-2 py-0.5 rounded">{t}</span>
        ))}
      </div>
      <div className="flex items-center gap-4 font-mono text-[10px] text-muted-foreground mb-4">
        <span className="flex items-center gap-1"><Star size={11} /> {project.stars}</span>
        <span className="flex items-center gap-1"><GitFork size={11} /> {project.forks}</span>
        <span>{project.isPrivate ? 'Private' : 'Public'}</span>
        <span>Updated {formatDate(project.updated_at)}</span>
      </div>
      <div className="flex gap-3">
        <a href={project.github_url || '#'} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
          aria-label={`${project.title} source code`}
          className="w-8 h-8 rounded border border-primary/20 flex items-center justify-center text-primary/60 hover:text-primary hover:border-primary/40 transition-colors">
          <Github size={14} />
        </a>
        {project.demo_url && (
          <a href={project.demo_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
            aria-label={`${project.title} live site`}
            className="w-8 h-8 rounded border border-primary/20 flex items-center justify-center text-primary/60 hover:text-primary hover:border-primary/40 transition-colors">
            <ExternalLink size={14} />
          </a>
        )}
      </div>
    </motion.div>
  );
};

const ProjectsSection = () => {
  const [selected, setSelected] = useState<Project | null>(null);
  const { data: repos = [], isLoading, isError, refetch, isFetching } = useGitHubRepos();

  const projects = useMemo(() => {
    return repos.map(toProject);
  }, [repos]);

  return (
    <section id="projects" className="relative py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.6 }}>
          <h2 className="section-title">{"> MISSION_BOARD.log"}</h2>
          <p className="section-subtitle">{"// Public GitHub repositories synced live, including forks"}</p>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass-card rounded-lg p-6 h-72 animate-pulse bg-primary/5" />
            ))}
          </div>
        ) : isError ? (
          <div className="glass-card rounded-lg p-8 text-center">
            <p className="font-mono text-sm text-accent mb-4">{"// FAILED TO FETCH GitHub repositories"}</p>
            <button onClick={() => refetch()} className="btn-neon-green text-xs py-2 px-4 rounded inline-flex items-center gap-2">
              <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} /> [_RETRY]
            </button>
          </div>
        ) : projects.length ? (
          <motion.div variants={containerVariants} initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: '-50px' }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <TiltCard key={project.id} project={project} onClick={() => setSelected(project)} />
            ))}
          </motion.div>
        ) : (
          <div className="glass-card rounded-lg p-8 text-center">
            <p className="font-mono text-sm text-muted-foreground">{"// No public repositories found on GitHub"}</p>
          </div>
        )}
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
              {selected.isFork && (
                <span className="ml-2 text-[10px] font-mono border border-secondary/40 text-secondary px-2 py-0.5 rounded">[FORK]</span>
              )}
              <h3 className="font-display text-2xl mt-3 mb-4">{selected.title}</h3>
              <p className="font-mono text-sm text-foreground leading-relaxed mb-6">{selected.description}</p>
              <div className="grid grid-cols-2 gap-4 font-mono text-xs text-muted-foreground mb-6">
                <span>Created: {formatDate(selected.created_at)}</span>
                <span>Updated: {formatDate(selected.updated_at)}</span>
                <span className="flex items-center gap-1"><Star size={12} /> {selected.stars} stars</span>
                <span className="flex items-center gap-1"><GitFork size={12} /> {selected.forks} forks</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {(selected.tech_tags || []).map((t) => (
                  <span key={t} className="text-xs font-mono border border-primary/30 text-primary px-3 py-1 rounded">{t}</span>
                ))}
              </div>
              <div className="flex gap-4">
                <a href={selected.github_url || '#'} target="_blank" rel="noreferrer" className="btn-neon-green text-xs py-2 px-4 rounded">
                  <Github size={14} className="inline mr-2" />Source
                </a>
                {selected.demo_url && (
                  <a href={selected.demo_url} target="_blank" rel="noreferrer" className="btn-neon-blue text-xs py-2 px-4 rounded">
                    <ExternalLink size={14} className="inline mr-2" />Live Demo
                  </a>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default ProjectsSection;
