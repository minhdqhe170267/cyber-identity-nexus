import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pencil, Trash2 } from 'lucide-react';
import { db } from '@/lib/db';
import AdminLayout from '@/components/AdminLayout';

type Project = {
  id: string; title: string; description: string; tech_tags: string[];
  status: string; github_url: string; demo_url: string; image_url: string;
  featured: boolean; created_at: string;
};

const EMPTY: Omit<Project, 'id' | 'created_at'> = {
  title: '', description: '', tech_tags: [], status: 'DEPLOYED',
  github_url: '', demo_url: '', image_url: '', featured: false,
};

const AdminProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [panelOpen, setPanelOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await db('projects').select('*').order('created_at', { ascending: false });
    setProjects(data || []);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(EMPTY); setTagInput(''); setPanelOpen(true); };
  const openEdit = (p: Project) => { setEditing(p); setForm({ ...p }); setTagInput(''); setPanelOpen(true); };

  const addTag = () => {
    if (tagInput.trim() && !form.tech_tags.includes(tagInput.trim())) {
      setForm({ ...form, tech_tags: [...form.tech_tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const save = async () => {
    if (!form.title.trim()) return;
    const payload = { ...form };
    if (editing) {
      await db('projects').update(payload).eq('id', editing.id);
    } else {
      await db('projects').insert(payload);
    }
    setPanelOpen(false);
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await db('projects').delete().eq('id', deleteId);
    setDeleteId(null);
    load();
  };

  const toggleFeatured = async (p: Project) => {
    await db('projects').update({ featured: !p.featured }).eq('id', p.id);
    load();
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title text-xl">{"> PROJECTS"}</h1>
        <button onClick={openNew} className="btn-neon-green text-xs py-2 px-4 rounded">[_ADD PROJECT]</button>
      </div>

      <div className="glass-card rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-primary/15 font-mono text-[10px] text-muted-foreground">
              <th className="text-left p-3">TITLE</th>
              <th className="text-left p-3">STATUS</th>
              <th className="text-left p-3">FEATURED</th>
              <th className="text-left p-3">DATE</th>
              <th className="text-right p-3">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} className="border-b border-primary/10 font-mono text-xs">
                <td className="p-3 text-foreground">{p.title}</td>
                <td className="p-3">
                  <span className={`text-[10px] border px-2 py-0.5 rounded ${
                    p.status === 'DEPLOYED' ? 'text-primary border-primary/40' :
                    p.status === 'IN_PROGRESS' ? 'text-secondary border-secondary/40' :
                    'text-accent border-accent/40'
                  }`}>[{p.status}]</span>
                </td>
                <td className="p-3">
                  <button onClick={() => toggleFeatured(p)} className={`w-4 h-4 rounded border ${p.featured ? 'bg-primary border-primary' : 'border-muted-foreground'}`} />
                </td>
                <td className="p-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="p-3 text-right">
                  <button onClick={() => openEdit(p)} className="text-primary hover:text-foreground mr-2"><Pencil size={14} /></button>
                  <button onClick={() => setDeleteId(p.id)} className="text-accent hover:text-foreground"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Slide-in Panel */}
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-96 z-50 glass-card border-l border-primary/15 p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-sm">{editing ? 'Edit Project' : 'New Project'}</h3>
              <button onClick={() => setPanelOpen(false)}><X size={18} className="text-muted-foreground" /></button>
            </div>

            <div className="space-y-4">
              {(['title', 'description', 'github_url', 'demo_url', 'image_url'] as const).map((field) => (
                <div key={field}>
                  <label className="terminal-label block mb-1">{`> ${field}:`}</label>
                  {field === 'description' ? (
                    <textarea value={form[field] || ''} onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                      rows={3} className="w-full bg-muted/50 border border-primary/15 rounded px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-none resize-none" />
                  ) : (
                    <input value={form[field] || ''} onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                      className="w-full bg-muted/50 border border-primary/15 rounded px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-none" />
                  )}
                </div>
              ))}

              <div>
                <label className="terminal-label block mb-1">{"> status:"}</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full bg-muted/50 border border-primary/15 rounded px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="DEPLOYED">DEPLOYED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="CLASSIFIED">CLASSIFIED</option>
                </select>
              </div>

              <div>
                <label className="terminal-label block mb-1">{"> tech_tags:"}</label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {form.tech_tags.map((t) => (
                    <span key={t} className="text-[10px] font-mono border border-primary/20 text-primary px-2 py-0.5 rounded flex items-center gap-1">
                      {t} <button onClick={() => setForm({ ...form, tech_tags: form.tech_tags.filter((x) => x !== t) })}>×</button>
                    </span>
                  ))}
                </div>
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  placeholder="Add tag + Enter"
                  className="w-full bg-muted/50 border border-primary/15 rounded px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="accent-primary" />
                <label className="font-mono text-xs text-foreground">Featured</label>
              </div>

              <button onClick={save} className="w-full bg-primary text-primary-foreground font-display text-sm py-2.5 rounded">
                [_SAVE]
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete dialog */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-center justify-center bg-background/80"
            onClick={() => setDeleteId(null)}
          >
            <div className="glass-card rounded-lg p-6 max-w-sm" onClick={(e) => e.stopPropagation()}>
              <p className="font-mono text-sm text-foreground mb-4">Delete this project?</p>
              <div className="flex gap-3">
                <button onClick={handleDelete} className="flex-1 bg-accent text-accent-foreground font-display text-xs py-2 rounded">[_DELETE]</button>
                <button onClick={() => setDeleteId(null)} className="flex-1 btn-neon-green text-xs py-2 rounded">[_CANCEL]</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default AdminProjects;
