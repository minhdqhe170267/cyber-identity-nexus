import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '@/lib/db';
import AdminLayout from '@/components/AdminLayout';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ projects: 0, posts: 0, messages: 0, scores: 0 });
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [recentScores, setRecentScores] = useState<any[]>([]);
  const [pageViews, setPageViews] = useState<{ page: string; count: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      const [p, b, g, l, rm, rs, pv] = await Promise.all([
        db('projects').select('id', { count: 'exact', head: true }),
        db('posts').select('id', { count: 'exact', head: true }).eq('published', true),
        db('guestbook').select('id', { count: 'exact', head: true }).eq('approved', false),
        db('leaderboard').select('id', { count: 'exact', head: true }),
        db('guestbook').select('*').order('created_at', { ascending: false }).limit(5),
        db('leaderboard').select('*').order('created_at', { ascending: false }).limit(5),
        db('page_views').select('page'),
      ]);
      setStats({
        projects: p.count || 0,
        posts: b.count || 0,
        messages: g.count || 0,
        scores: l.count || 0,
      });
      setRecentMessages(rm.data || []);
      setRecentScores(rs.data || []);

      // Aggregate page views
      const viewMap: Record<string, number> = {};
      (pv.data || []).forEach((v: any) => {
        viewMap[v.page] = (viewMap[v.page] || 0) + 1;
      });
      setPageViews(Object.entries(viewMap).map(([page, count]) => ({ page, count })).sort((a, b) => b.count - a.count));
    };
    load();
  }, []);

  const statCards = [
    { label: 'Total Projects', val: stats.projects },
    { label: 'Published Posts', val: stats.posts },
    { label: 'Pending Messages', val: stats.messages },
    { label: 'Leaderboard Entries', val: stats.scores },
  ];

  const maxViews = Math.max(...pageViews.map((v) => v.count), 1);

  return (
    <AdminLayout>
      <h1 className="section-title text-xl mb-6">{"> DASHBOARD"}</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card rounded-lg p-5 text-center"
          >
            <p className="font-display text-3xl text-primary">{s.val}</p>
            <p className="font-mono text-[10px] text-muted-foreground mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-lg p-5">
          <h3 className="font-display text-sm text-primary mb-4">[RECENT MESSAGES]</h3>
          <div className="space-y-3">
            {recentMessages.map((m: any) => (
              <div key={m.id} className="font-mono text-xs">
                <span className="text-foreground">{m.name}:</span>{' '}
                <span className="text-muted-foreground">{m.message?.slice(0, 60)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-lg p-5">
          <h3 className="font-display text-sm text-primary mb-4">[RECENT SCORES]</h3>
          <div className="space-y-3">
            {recentScores.map((s: any) => (
              <div key={s.id} className="flex justify-between font-mono text-xs">
                <span className="text-foreground">{s.player_name}</span>
                <span className="text-secondary">{s.score}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-lg p-5">
          <h3 className="font-display text-sm text-primary mb-4">[PAGE VIEWS]</h3>
          <div className="space-y-2">
            {pageViews.slice(0, 8).map((v) => (
              <div key={v.page} className="font-mono text-xs">
                <div className="flex justify-between mb-1">
                  <span className="text-foreground">{v.page}</span>
                  <span className="text-muted-foreground">{v.count}</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(v.count / maxViews) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
