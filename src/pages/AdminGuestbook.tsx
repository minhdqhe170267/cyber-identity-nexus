import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { db } from '@/lib/db';
import AdminLayout from '@/components/AdminLayout';

type Entry = { id: string; name: string; message: string; approved: boolean; created_at: string };

const AdminGuestbook = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = async () => {
    const { data } = await db('guestbook').select('*').order('created_at', { ascending: false });
    setEntries(data || []);
  };

  useEffect(() => { load(); }, []);

  const toggleApprove = async (id: string, approved: boolean) => {
    await db('guestbook').update({ approved }).eq('id', id);
    load();
  };

  const bulkAction = async (approved: boolean) => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    for (const id of ids) {
      await db('guestbook').update({ approved }).eq('id', id);
    }
    setSelected(new Set());
    load();
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title text-xl">{"> GUESTBOOK"}</h1>
        <div className="flex gap-2">
          <button onClick={() => bulkAction(true)} className="btn-neon-green text-xs py-1.5 px-3 rounded">[_APPROVE]</button>
          <button onClick={() => bulkAction(false)} className="btn-neon-blue text-xs py-1.5 px-3 rounded">[_REJECT]</button>
        </div>
      </div>

      <div className="glass-card rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-primary/15 font-mono text-[10px] text-muted-foreground">
              <th className="p-3 w-8">
                <input
                  type="checkbox"
                  onChange={(e) => setSelected(e.target.checked ? new Set(entries.map((e) => e.id)) : new Set())}
                  className="accent-primary"
                />
              </th>
              <th className="text-left p-3">NAME</th>
              <th className="text-left p-3">MESSAGE</th>
              <th className="text-left p-3">DATE</th>
              <th className="text-left p-3">STATUS</th>
              <th className="text-right p-3">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-b border-primary/10 font-mono text-xs">
                <td className="p-3">
                  <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggleSelect(e.id)} className="accent-primary" />
                </td>
                <td className="p-3 text-foreground">{e.name}</td>
                <td className="p-3 text-muted-foreground max-w-[200px] truncate">{e.message}</td>
                <td className="p-3 text-muted-foreground">{new Date(e.created_at).toLocaleDateString()}</td>
                <td className="p-3">
                  <span className={`text-[10px] border px-2 py-0.5 rounded ${e.approved ? 'text-primary border-primary/40' : 'text-accent border-accent/40'}`}>
                    [{e.approved ? 'APPROVED' : 'PENDING'}]
                  </span>
                </td>
                <td className="p-3 text-right">
                  <button onClick={() => toggleApprove(e.id, !e.approved)} className={e.approved ? 'text-accent' : 'text-primary'}>
                    {e.approved ? <X size={14} /> : <Check size={14} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default AdminGuestbook;
