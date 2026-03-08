import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/db';
import AdminLayout from '@/components/AdminLayout';

type Post = { id: string; title: string; slug: string; published: boolean; created_at: string };

const AdminBlog = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await db('posts').select('*').order('created_at', { ascending: false });
    setPosts(data || []);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    await db('posts').delete().eq('id', deleteId);
    setDeleteId(null);
    load();
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title text-xl">{"> BLOG"}</h1>
        <Link to="/admin/blog/new" className="btn-neon-green text-xs py-2 px-4 rounded">[_NEW POST]</Link>
      </div>

      <div className="glass-card rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-primary/15 font-mono text-[10px] text-muted-foreground">
              <th className="text-left p-3">TITLE</th>
              <th className="text-left p-3">SLUG</th>
              <th className="text-left p-3">STATUS</th>
              <th className="text-left p-3">DATE</th>
              <th className="text-right p-3">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className="border-b border-primary/10 font-mono text-xs">
                <td className="p-3 text-foreground">{p.title}</td>
                <td className="p-3 text-muted-foreground">{p.slug}</td>
                <td className="p-3">
                  <span className={`text-[10px] border px-2 py-0.5 rounded ${p.published ? 'text-primary border-primary/40' : 'text-muted-foreground border-muted-foreground/40'}`}>
                    [{p.published ? 'PUBLISHED' : 'DRAFT'}]
                  </span>
                </td>
                <td className="p-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="p-3 text-right">
                  <Link to={`/admin/blog/${p.id}`} className="text-primary hover:text-foreground mr-2 inline-block"><Pencil size={14} /></Link>
                  <button onClick={() => setDeleteId(p.id)} className="text-accent hover:text-foreground"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-center justify-center bg-background/80"
            onClick={() => setDeleteId(null)}
          >
            <div className="glass-card rounded-lg p-6 max-w-sm" onClick={(e) => e.stopPropagation()}>
              <p className="font-mono text-sm text-foreground mb-4">Delete this post?</p>
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

export default AdminBlog;
