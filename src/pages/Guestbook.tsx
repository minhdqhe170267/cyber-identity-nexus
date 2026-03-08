import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '@/lib/db';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';

type Entry = { id: string; name: string; message: string; created_at: string };

const Guestbook = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  useEffect(() => {
    db('guestbook').select('*').eq('approved', true).order('created_at', { ascending: false })
      .then(({ data }) => setEntries(data || []));

    // Realtime subscription
    const channel = supabase.channel('guestbook-public')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'guestbook',
        filter: 'approved=eq.true',
      }, (payload) => {
        setEntries((prev) => [payload.new as Entry, ...prev]);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'guestbook',
        filter: 'approved=eq.true',
      }, (payload) => {
        const updated = payload.new as Entry;
        setEntries((prev) => {
          if (prev.find((e) => e.id === updated.id)) return prev;
          return [updated, ...prev];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    setState('sending');
    const { error } = await db('guestbook').insert({ name: name.trim(), message: message.trim() });
    if (error) {
      setState('error');
    } else {
      setState('success');
      setName('');
      setMessage('');
      setTimeout(() => setState('idle'), 4000);
    }
  };

  return (
    <div className="min-h-screen crt-overlay noise-overlay">
      <Navbar />
      <div className="relative z-10 pt-20 px-6 max-w-4xl mx-auto pb-24">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="section-title">{"> GUESTBOOK.db"}</h1>
          <p className="section-subtitle">{"// Leave a message in the system"}</p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="glass-card rounded-lg p-6 mb-8 space-y-4"
        >
          <div>
            <label className="terminal-label block mb-1">{"> name:"}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              required
              className="w-full bg-muted/50 border border-primary/15 rounded px-4 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              placeholder="Anonymous_User"
            />
          </div>
          <div>
            <label className="terminal-label block mb-1">{"> message:"}</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              required
              rows={3}
              className="w-full bg-muted/50 border border-primary/15 rounded px-4 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none"
              placeholder="Leave your mark..."
            />
          </div>
          <button
            type="submit"
            disabled={state === 'sending' || state === 'success'}
            className="w-full bg-primary text-primary-foreground font-display text-sm tracking-wider py-2.5 rounded hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {state === 'sending' ? 'LOGGING...' :
             state === 'success' ? '// MESSAGE QUEUED FOR APPROVAL' :
             '[_LOG MESSAGE]'}
          </button>
          {state === 'error' && <p className="font-mono text-xs text-accent text-center">Failed to submit. Try again.</p>}
        </motion.form>

        <p className="font-mono text-xs text-muted-foreground mb-6">
          {"// "}{entries.length} MESSAGES LOGGED
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entries.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-lg p-5"
            >
              <p className="font-display text-sm mb-2">{entry.name}</p>
              <p className="font-mono text-xs text-muted-foreground mb-2">{entry.message}</p>
              <p className="font-mono text-[10px] text-muted-foreground/50">
                {new Date(entry.created_at).toLocaleDateString()}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Guestbook;
