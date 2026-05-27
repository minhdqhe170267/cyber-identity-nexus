import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { getRepoStatus } from '@/lib/github';
import { useGitHubRepos } from '@/hooks/useGitHubData';

type Metric = { name: string; count: number; pct: number };

const countBy = (values: string[], total: number): Metric[] =>
  Object.entries(
    values.reduce<Record<string, number>>((acc, value) => {
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count, pct: total ? Math.round((count / total) * 100) : 0 }));

const barColor = (level: number) =>
  level >= 60 ? 'bg-primary neon-glow-green' :
  level >= 30 ? 'bg-secondary neon-glow-blue' :
  'bg-accent neon-glow-pink';

const panelContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const panelVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const metricContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
};

const metricVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

const MetricPanel = ({ title, metrics, empty }: { title: string; metrics: Metric[]; empty: string }) => (
  <motion.div variants={panelVariants} className="glass-card rounded-lg p-6">
    <h3 className="font-display text-sm text-primary mb-6 tracking-wider">
      [{title}]
    </h3>
    {metrics.length ? (
      <motion.div
        variants={metricContainerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="space-y-4"
      >
        {metrics.map((metric) => (
          <motion.div key={metric.name} variants={metricVariants}>
            <div className="flex justify-between gap-4 font-mono text-xs mb-1">
              <span className="text-foreground truncate">{metric.name}</span>
              <span className="text-muted-foreground whitespace-nowrap">{metric.count} repo{metric.count > 1 ? 's' : ''}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${metric.pct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full ${barColor(metric.pct)}`}
              />
            </div>
          </motion.div>
        ))}
      </motion.div>
    ) : (
      <p className="font-mono text-xs text-muted-foreground">{empty}</p>
    )}
  </motion.div>
);

const SkillsSection = () => {
  const { data: repos = [], isLoading, isError } = useGitHubRepos();

  const panels = useMemo(() => {
    const total = repos.length;
    const languages = countBy(repos.map((repo) => repo.language).filter(Boolean) as string[], total);
    const statuses = countBy(repos.map(getRepoStatus), total);

    return { languages, statuses };
  }, [repos]);

  return (
    <section id="skills" className="relative py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title">{"> TECH_STACK.cfg"}</h2>
          <p className="section-subtitle">{"// Languages, topics & status detected from GitHub"}</p>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass-card rounded-lg p-6 h-72 animate-pulse bg-primary/5" />
            ))}
          </div>
        ) : isError ? (
          <div className="glass-card rounded-lg p-8 text-center">
            <p className="font-mono text-sm text-accent">{"// FAILED TO FETCH GitHub tech stack"}</p>
          </div>
        ) : (
          <motion.div
            variants={panelContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <MetricPanel title="LANGUAGES" metrics={panels.languages} empty="// No primary languages found" />
            <MetricPanel title="REPO_STATUS" metrics={panels.statuses} empty="// No public repo status found" />
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default SkillsSection;
