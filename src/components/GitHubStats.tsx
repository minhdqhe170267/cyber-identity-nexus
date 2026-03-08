import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Github, Star, GitFork, Users, BookOpen, RefreshCw, ExternalLink } from 'lucide-react';

const GITHUB_USERNAME = 'yourusername';

type ContribDay = { date: string; count: number; level: number };
type Repo = { name: string; description: string; language: string; stargazers_count: number; forks_count: number; html_url: string };
type UserInfo = { public_repos: number; followers: number; following: number };

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

const GitHubStats = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [contribs, setContribs] = useState<ContribDay[]>([]);
  const [totalStars, setTotalStars] = useState(0);
  const [languages, setLanguages] = useState<{ name: string; pct: number; color: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const [userRes, repoRes, contribRes] = await Promise.all([
        fetch(`https://api.github.com/users/${GITHUB_USERNAME}`),
        fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=stars&per_page=20`),
        fetch(`https://github-contributions-api.jogruber.de/v4/${GITHUB_USERNAME}`),
      ]);

      if (!userRes.ok || !repoRes.ok) throw new Error('API error');

      const userData = await userRes.json();
      const repoData: Repo[] = await repoRes.json();

      setUserInfo({ public_repos: userData.public_repos, followers: userData.followers, following: userData.following });
      setRepos(repoData.slice(0, 3));

      const stars = repoData.reduce((acc: number, r: Repo) => acc + r.stargazers_count, 0);
      setTotalStars(stars);

      // Languages
      const langMap: Record<string, number> = {};
      repoData.forEach((r: Repo) => { if (r.language) langMap[r.language] = (langMap[r.language] || 0) + 1; });
      const total = Object.values(langMap).reduce((a, b) => a + b, 0);
      const sorted = Object.entries(langMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, count]) => ({
          name, pct: Math.round((count / total) * 100),
          color: LANG_COLORS[name] || LANG_COLORS.default,
        }));
      setLanguages(sorted);

      // Contributions
      if (contribRes.ok) {
        const contribData = await contribRes.json();
        setContribs(contribData.contributions || []);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const last52Weeks = contribs.slice(-364);
  const weeks: ContribDay[][] = [];
  for (let i = 0; i < last52Weeks.length; i += 7) {
    weeks.push(last52Weeks.slice(i, i + 7));
  }

  const cellColor = (count: number) =>
    count === 0 ? 'rgba(255,255,255,0.05)' :
    count <= 3 ? 'rgba(0,255,156,0.3)' :
    count <= 7 ? 'rgba(0,255,156,0.6)' :
    '#00FF9C';

  return (
    <section id="stats" className="relative py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between"
        >
          <div>
            <h2 className="section-title">{"> LIVE_STATS.json"}</h2>
            <p className="section-subtitle">{"// Realtime activity feed — updated on load"}</p>
          </div>
          <button onClick={fetchData} className="btn-neon-green text-xs py-1.5 px-3 rounded flex items-center gap-2">
            <RefreshCw size={12} /> [_REFRESH]
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
            <p className="font-mono text-sm text-accent mb-4">{"// FAILED TO FETCH — GitHub API unavailable"}</p>
            <button onClick={fetchData} className="btn-neon-green text-xs py-2 px-4 rounded">[_RETRY]</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contribution Map */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card rounded-lg p-6"
            >
              <h3 className="font-display text-sm text-primary mb-4">[CONTRIBUTION_MAP]</h3>
              <div className="overflow-x-auto">
                <div className="flex gap-[2px]" style={{ minWidth: weeks.length * 12 }}>
                  {weeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-[2px]">
                      {week.map((day, di) => (
                        <div
                          key={di}
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
            </motion.div>

            {/* Top Languages */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass-card rounded-lg p-6"
            >
              <h3 className="font-display text-sm text-primary mb-4">[TOP_LANGUAGES]</h3>
              <div className="h-4 rounded-full overflow-hidden flex mb-4">
                {languages.map((l) => (
                  <div key={l.name} style={{ width: `${l.pct}%`, backgroundColor: l.color }} className="h-full" />
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                {languages.map((l) => (
                  <div key={l.name} className="flex items-center gap-1.5 font-mono text-xs">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                    <span className="text-foreground">{l.name}</span>
                    <span className="text-muted-foreground">{l.pct}%</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* System Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass-card rounded-lg p-6"
            >
              <h3 className="font-display text-sm text-primary mb-4">[SYSTEM_METRICS]</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: BookOpen, label: 'Public Repos', val: userInfo?.public_repos || 0 },
                  { icon: Users, label: 'Followers', val: userInfo?.followers || 0 },
                  { icon: Star, label: 'Total Stars', val: totalStars },
                  { icon: Users, label: 'Following', val: userInfo?.following || 0 },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <s.icon size={18} className="mx-auto mb-2 text-primary" />
                    <p className="font-display text-2xl text-foreground"><CountUp end={s.val} /></p>
                    <p className="font-mono text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Recent Repos */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="glass-card rounded-lg p-6"
            >
              <h3 className="font-display text-sm text-primary mb-4">[RECENT_REPOS]</h3>
              <div className="space-y-3">
                {repos.map((r) => (
                  <div key={r.name} className="glass-card glass-card-hover rounded p-3 relative">
                    <a href={r.html_url} target="_blank" rel="noreferrer" className="absolute top-3 right-3 text-muted-foreground hover:text-primary">
                      <ExternalLink size={12} />
                    </a>
                    <p className="font-display text-xs mb-1">{r.name}</p>
                    <p className="font-mono text-[10px] text-muted-foreground mb-2 line-clamp-1">{r.description}</p>
                    <div className="flex items-center gap-3 font-mono text-[10px]">
                      {r.language && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: LANG_COLORS[r.language] || LANG_COLORS.default }} />
                          {r.language}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-muted-foreground"><Star size={10} /> {r.stargazers_count}</span>
                      <span className="flex items-center gap-1 text-muted-foreground"><GitFork size={10} /> {r.forks_count}</span>
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
