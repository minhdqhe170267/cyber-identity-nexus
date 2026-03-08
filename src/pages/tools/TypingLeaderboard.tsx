import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const MODES = ['ALL', 'time', 'words', 'quote'];
const TIMEFRAMES = ['ALL TIME', 'THIS MONTH', 'THIS WEEK', 'TODAY'];

const TypingLeaderboard = () => {
  const [data, setData] = useState<any[]>([]);
  const [modeFilter, setModeFilter] = useState('ALL');
  const [timeframe, setTimeframe] = useState('ALL TIME');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const perPage = 25;

  useEffect(() => {
    (async () => {
      setLoading(true);
      let query = supabase
        .from('typing_scores' as any)
        .select('*')
        .order('wpm', { ascending: false })
        .range(page * perPage, (page + 1) * perPage - 1);

      if (modeFilter !== 'ALL') query = query.eq('mode', modeFilter);

      if (timeframe !== 'ALL TIME') {
        const now = new Date();
        let from: Date;
        if (timeframe === 'TODAY') {
          from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (timeframe === 'THIS WEEK') {
          from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else {
          from = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        query = query.gte('created_at', from.toISOString());
      }

      const { data: rows } = await query as any;
      setData(rows || []);
      setLoading(false);
    })();
  }, [modeFilter, timeframe, page]);

  const filtered = search
    ? data.filter((r: any) => r.player_name?.toLowerCase().includes(search.toLowerCase()))
    : data;

  return (
    <div className="min-h-screen bg-background crt-overlay noise-overlay">
      <div className="max-w-[900px] w-full mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link to="/tools/typing-speed" className="text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <h1 className="font-display text-xl text-primary">{'> LEADERBOARD.exe'}</h1>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {MODES.map(m => (
            <button key={m} onClick={() => { setModeFilter(m); setPage(0); }}
              className={`font-mono text-[10px] px-2.5 py-1 rounded transition-all ${modeFilter === m ? 'text-primary' : 'text-muted-foreground/40 hover:text-muted-foreground/70'}`}>
              {m}
            </button>
          ))}
          <span className="text-muted-foreground/20">|</span>
          {TIMEFRAMES.map(t => (
            <button key={t} onClick={() => { setTimeframe(t); setPage(0); }}
              className={`font-mono text-[10px] px-2.5 py-1 rounded transition-all ${timeframe === t ? 'text-secondary' : 'text-muted-foreground/40 hover:text-muted-foreground/70'}`}>
              {t}
            </button>
          ))}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="search player..."
            className="ml-auto font-mono text-[10px] px-3 py-1.5 bg-muted/20 border border-primary/10 rounded text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/40 w-36"
          />
        </div>

        {/* Table */}
        {loading ? (
          <p className="font-mono text-sm text-muted-foreground text-center py-16">// LOADING...<span className="blink text-primary ml-1">█</span></p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-xs">
              <thead>
                <tr className="text-muted-foreground/50 border-b border-primary/10">
                  <th className="text-left py-2 px-3 w-12">#</th>
                  <th className="text-left py-2 px-3">player</th>
                  <th className="text-right py-2 px-3">wpm</th>
                  <th className="text-right py-2 px-3">raw</th>
                  <th className="text-right py-2 px-3">acc</th>
                  <th className="text-right py-2 px-3">consistency</th>
                  <th className="text-left py-2 px-3">mode</th>
                  <th className="text-right py-2 px-3">date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row: any, i: number) => {
                  const rank = page * perPage + i + 1;
                  return (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.015 }}
                      className={`border-b border-primary/5 hover:border-l-[3px] hover:border-l-primary transition-all ${
                        rank === 1 ? 'text-primary bg-primary/5' :
                        rank === 2 ? 'text-secondary' :
                        rank === 3 ? 'text-destructive' :
                        rank <= 10 ? 'text-foreground/80' : 'text-foreground/60'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold">
                        {rank === 1 ? <Crown size={14} className="inline text-primary" /> : rank}
                      </td>
                      <td className="py-2.5 px-3">{row.player_name}</td>
                      <td className="py-2.5 px-3 text-right font-bold">{row.wpm}</td>
                      <td className="py-2.5 px-3 text-right">{row.raw_wpm}</td>
                      <td className="py-2.5 px-3 text-right">{row.accuracy}%</td>
                      <td className="py-2.5 px-3 text-right">{row.consistency}%</td>
                      <td className="py-2.5 px-3">
                        <span className="text-[9px]">{row.mode} {row.mode_value}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">
                        {new Date(row.created_at).toLocaleDateString()}
                      </td>
                    </motion.tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-12 text-muted-foreground/40">// no scores found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="font-mono text-[10px] px-3 py-1 rounded border border-muted text-muted-foreground hover:text-primary disabled:opacity-20 transition-colors"
          >
            ← prev
          </button>
          <span className="font-mono text-[10px] text-muted-foreground/40">page {page + 1}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={data.length < perPage}
            className="font-mono text-[10px] px-3 py-1 rounded border border-muted text-muted-foreground hover:text-primary disabled:opacity-20 transition-colors"
          >
            next →
          </button>
        </div>
      </div>
    </div>
  );
};

export default TypingLeaderboard;
