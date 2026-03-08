import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ToolLayout from '@/components/ToolLayout';
import { supabase } from '@/integrations/supabase/client';

const MODES = ['ALL', 'WORDS', 'SENTENCES', 'CODE', 'NUMBERS'];
const DURATIONS = ['ALL', '15', '30', '60', '120'];

const TypingLeaderboard = () => {
  const [data, setData] = useState<any[]>([]);
  const [modeFilter, setModeFilter] = useState('ALL');
  const [durationFilter, setDurationFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let query = supabase.from('typing_scores' as any).select('*').order('wpm', { ascending: false }).limit(50);
      if (modeFilter !== 'ALL') query = query.eq('mode', modeFilter);
      if (durationFilter !== 'ALL') query = query.eq('duration', parseInt(durationFilter));
      const { data: rows } = await query as any;
      setData(rows || []);
      setLoading(false);
    })();
  }, [modeFilter, durationFilter]);

  const filtered = search
    ? data.filter((r: any) => r.player_name?.toLowerCase().includes(search.toLowerCase()))
    : data;

  return (
    <ToolLayout title='> LEADERBOARD.exe' subtitle="// Top typing scores of all time">
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 glass-card rounded-lg p-3">
          <div className="flex gap-1">
            {MODES.map(m => (
              <button key={m} onClick={() => setModeFilter(m)}
                className={`font-mono text-[10px] px-2 py-1 rounded border transition-all ${modeFilter === m ? 'border-primary bg-primary/10 text-primary' : 'border-muted text-muted-foreground hover:border-primary/40'}`}>
                {m}
              </button>
            ))}
          </div>
          <span className="text-muted-foreground/30">|</span>
          <div className="flex gap-1">
            {DURATIONS.map(d => (
              <button key={d} onClick={() => setDurationFilter(d)}
                className={`font-mono text-[10px] px-2 py-1 rounded border transition-all ${durationFilter === d ? 'border-secondary bg-secondary/10 text-secondary' : 'border-muted text-muted-foreground hover:border-secondary/40'}`}>
                {d === 'ALL' ? 'ALL' : `${d}s`}
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search player..."
            className="ml-auto px-3 py-1 bg-muted/30 border border-primary/15 rounded font-mono text-[10px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 w-40"
          />
        </div>

        {/* Table */}
        <div className="glass-card rounded-lg p-4 overflow-x-auto">
          {loading ? (
            <p className="font-mono text-sm text-muted-foreground text-center py-8">// LOADING...<span className="blink text-primary ml-1">█</span></p>
          ) : (
            <table className="w-full font-mono text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-primary/10">
                  <th className="text-left py-2 px-3">#</th>
                  <th className="text-left py-2 px-3">Player</th>
                  <th className="text-right py-2 px-3">WPM</th>
                  <th className="text-right py-2 px-3">Accuracy</th>
                  <th className="text-left py-2 px-3">Mode</th>
                  <th className="text-right py-2 px-3">Duration</th>
                  <th className="text-right py-2 px-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row: any, i: number) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className={`border-b border-primary/5 ${
                      i === 0 ? 'text-primary bg-primary/5' :
                      i === 1 ? 'text-secondary' :
                      i === 2 ? 'text-destructive' : 'text-foreground'
                    }`}
                  >
                    <td className="py-2 px-3 font-bold">{i + 1}</td>
                    <td className="py-2 px-3">{row.player_name}</td>
                    <td className="py-2 px-3 text-right font-bold">{row.wpm}</td>
                    <td className="py-2 px-3 text-right">{row.accuracy}%</td>
                    <td className="py-2 px-3">
                      <span className="px-1.5 py-0.5 rounded border border-primary/20 text-[9px]">{row.mode}</span>
                    </td>
                    <td className="py-2 px-3 text-right">{row.duration}s</td>
                    <td className="py-2 px-3 text-right">{new Date(row.created_at).toLocaleDateString()}</td>
                  </motion.tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">// No scores found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="text-center">
          <Link to="/tools/typing-speed" className="font-mono text-xs text-primary hover:underline">[← _BACK TO TYPING TEST]</Link>
        </div>
      </div>
    </ToolLayout>
  );
};

export default TypingLeaderboard;
