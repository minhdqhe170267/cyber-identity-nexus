import { useMemo, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ExternalLink, GitFork, RefreshCw, Star, Users } from 'lucide-react';
import { GITHUB_USERNAME } from '@/config/profile';
import { formatDate, type ContributionDay } from '@/lib/github';
import { useGitHubContributions, useGitHubRepos, useGitHubUser } from '@/hooks/useGitHubData';

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#00D4FF', JavaScript: '#00FF9C', Python: '#FF2D78',
  Rust: '#FF6B35', Go: '#00D4FF', CSS: '#9B59B6', HTML: '#E34C26',
  Java: '#B07219', C: '#555555', 'C++': '#F34B7D', Ruby: '#CC342D',
  Shell: '#89E051', default: '#8B8B8B',
};

const CountUp = ({ end }: { end: number }) => {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const step = Math.max(1, Math.floor(end / 40));
        const interval = setInterval(() => {
          start = Math.min(start + step, end);
          setVal(start);
          if (start >= end) clearInterval(interval);
        }, 30);
        observer.disconnect();
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return <span ref={ref}>{val}</span>;
};

const getContributionWeeks = (contribs: ContributionDay[]) => {
  const last52Weeks = contribs.slice(-364);
  const weeks: ContributionDay[][] = [];

  for (let i = 0; i < last52Weeks.length; i += 7) {
    weeks.push(last52Weeks.slice(i, i + 7));
  }

  return weeks;
};

const cellColor = (count: number) =>
  count === 0 ? 'rgba(255,255,255,0.05)' :
  count <= 3 ? 'rgba(0,255,156,0.3)' :
  count <= 7 ? 'rgba(0,255,156,0.6)' :
  '#00FF9C';

const GitHubStats = () => {
  const userQuery = useGitHubUser();
  const reposQuery = useGitHubRepos();
  const contribQuery = useGitHubContributions();

  const repos = useMemo(() => reposQuery.data || [], [reposQuery.data]);
  const contribs = useMemo(() => contribQuery.data || [], [contribQuery.data]);
  const loading = userQuery.isLoading || reposQuery.isLoading;
  const error = userQuery.isError || reposQuery.isError;
  const fetching = userQuery.isFetching || reposQuery.isFetching || contribQuery.isFetching;

  const recentRepos = repos.slice(0, 3);
  const totalStars = repos.reduce((acc, repo) => acc + repo.stargazers_count, 0);

  const languages = useMemo(() => {
    const langMap: Record<string, number> = {};
    repos.forEach((repo) => {
      if (repo.language) langMap[repo.language] = (langMap[repo.language] || 0) + 1;
    });

    const total = Object.values(langMap).reduce((a, b) => a + b, 0);
    if (!total) return [];

    return Object.entries(langMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({
        name,
        pct: Math.round((count / total) * 100),
        color: LANG_COLORS[name] || LANG_COLORS.default,
      }));
  }, [repos]);

  const weeks = useMemo(() => getContributionWeeks(contribs), [contribs]);

  const refresh = () => {
    void Promise.all([userQuery.refetch(), reposQuery.refetch(), contribQuery.refetch()]);
  };

  return (
    <section id="stats" className="relative py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between gap-4"
        >
          <div>
            <h2 className="section-title">{"> LIVE_STATS.json"}</h2>
            <p className="section-subtitle">{`// GitHub activity for @${GITHUB_USERNAME}`}</p>
          </div>
          <button onClick={refresh} className="btn-neon-green text-xs py-1.5 px-3 rounded flex items-center gap-2">
            <RefreshCw size={12} className={fetching ? 'animate-spin' : ''} /> [_REFRESH]
          </button>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-card rounded-lg p-6 h-48 animate-pulse bg-primary/5" />
            ))}
          </div>
        ) : error ? (
          <div className="glass-card rounded-lg p-8 text-center">
            <p className="font-mono text-sm text-accent mb-4">{"// FAILED TO FETCH GitHub API"}</p>
            <button onClick={refresh} className="btn-neon-green text-xs py-2 px-4 rounded">[_RETRY]</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card rounded-lg p-6"
            >
              <h3 className="font-display text-sm text-primary mb-4">[CONTRIBUTION_MAP]</h3>
              {weeks.length ? (
                <div className="overflow-x-auto">
                  <div className="flex gap-[2px]" style={{ minWidth: weeks.length * 12 }}>
                    {weeks.map((week, wi) => (
                      <div key={wi} className="flex flex-col gap-[2px]">
                        {week.map((day, di) => (
                          <div
                            key={`${day.date}-${di}`}
                            className="w-[10px] h-[10px] rounded-sm"
                            style={{
                              backgroundColor: cellColor(day.count),
                              boxShadow: day.count >= 8 ? '0 0 4px rgba(0,255,156,0.5)' : 'none',
                            }}
                            title={`${day.date}: ${day.count} contributions`}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="font-mono text-xs text-muted-foreground">{"// Contribution feed unavailable"}</p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass-card rounded-lg p-6"
            >
              <h3 className="font-display text-sm text-primary mb-4">[TOP_LANGUAGES]</h3>
              {languages.length ? (
                <>
                  <div className="h-4 rounded-full overflow-hidden flex mb-4">
                    {languages.map((language) => (
                      <div key={language.name} style={{ width: `${language.pct}%`, backgroundColor: language.color }} className="h-full" />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {languages.map((language) => (
                      <div key={language.name} className="flex items-center gap-1.5 font-mono text-xs">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: language.color }} />
                        <span className="text-foreground">{language.name}</span>
                        <span className="text-muted-foreground">{language.pct}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="font-mono text-xs text-muted-foreground">{"// No primary languages found"}</p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass-card rounded-lg p-6"
            >
              <h3 className="font-display text-sm text-primary mb-4">[PROFILE_METRICS]</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: BookOpen, label: 'Shown Repos', val: repos.length },
                  { icon: Users, label: 'Followers', val: userQuery.data?.followers || 0 },
                  { icon: Star, label: 'Total Stars', val: totalStars },
                  { icon: Users, label: 'Following', val: userQuery.data?.following || 0 },
                ].map((metric) => (
                  <div key={metric.label} className="text-center">
                    <metric.icon size={18} className="mx-auto mb-2 text-primary" />
                    <p className="font-display text-2xl text-foreground"><CountUp end={metric.val} /></p>
                    <p className="font-mono text-[10px] text-muted-foreground">{metric.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="glass-card rounded-lg p-6"
            >
              <h3 className="font-display text-sm text-primary mb-4">[RECENT_REPOS]</h3>
              <div className="space-y-3">
                {recentRepos.map((repo) => (
                  <div key={repo.name} className="glass-card glass-card-hover rounded p-3 relative">
                    <a href={repo.html_url} target="_blank" rel="noreferrer" className="absolute top-3 right-3 text-muted-foreground hover:text-primary">
                      <ExternalLink size={12} />
                    </a>
                    <p className="font-display text-xs mb-1 pr-6">{repo.name}</p>
                    <p className="font-mono text-[10px] text-muted-foreground mb-2 line-clamp-1">
                      {repo.description || `Updated ${formatDate(repo.pushed_at || repo.updated_at)}`}
                    </p>
                    <div className="flex items-center gap-3 font-mono text-[10px]">
                      {repo.language && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: LANG_COLORS[repo.language] || LANG_COLORS.default }} />
                          {repo.language}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-muted-foreground"><Star size={10} /> {repo.stargazers_count}</span>
                      <span className="flex items-center gap-1 text-muted-foreground"><GitFork size={10} /> {repo.forks_count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </section>
  );
};

export default GitHubStats;
