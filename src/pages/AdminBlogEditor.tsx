import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { db } from '@/lib/db';
import AdminLayout from '@/components/AdminLayout';

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const AdminBlogEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [published, setPublished] = useState(false);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew && id) {
      db('posts').select('*').eq('id', id).single().then(({ data }) => {
        if (data) {
          setTitle(data.title);
          setSlug(data.slug);
          setContent(data.content || '');
          setExcerpt(data.excerpt || '');
          setPublished(data.published);
        }
      });
    }
  }, [id, isNew]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (isNew) setSlug(slugify(val));
  };

  const save = async () => {
    if (!title.trim() || !slug.trim()) return;
    setSaving(true);
    const payload = { title, slug, content, excerpt, published };
    if (isNew) {
      await db('posts').insert(payload);
    } else {
      await db('posts').update(payload).eq('id', id);
    }
    setSaving(false);
    navigate('/admin/blog');
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title text-xl">{isNew ? '> NEW POST' : '> EDIT POST'}</h1>
        <div className="flex gap-3">
          <button onClick={() => setPreview(!preview)} className="btn-neon-blue text-xs py-1.5 px-3 rounded">
            [{preview ? '_EDIT' : '_PREVIEW'}]
          </button>
          <button onClick={save} disabled={saving} className="btn-neon-green text-xs py-1.5 px-3 rounded">
            {saving ? 'SAVING...' : '[_SAVE]'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="terminal-label block mb-1">{"> title:"}</label>
          <input value={title} onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full bg-muted/50 border border-primary/15 rounded px-4 py-2.5 font-mono text-sm text-foreground focus:border-primary focus:outline-none" />
        </div>

        <div>
          <label className="terminal-label block mb-1">{"> slug:"}</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)}
            className="w-full bg-muted/50 border border-primary/15 rounded px-4 py-2.5 font-mono text-sm text-foreground focus:border-primary focus:outline-none" />
        </div>

        <div>
          <label className="terminal-label block mb-1">{"> excerpt:"}</label>
          <input value={excerpt} onChange={(e) => setExcerpt(e.target.value)}
            className="w-full bg-muted/50 border border-primary/15 rounded px-4 py-2.5 font-mono text-sm text-foreground focus:border-primary focus:outline-none" />
        </div>

        <div className="flex items-center gap-2 mb-2">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="accent-primary" />
          <label className="font-mono text-xs text-foreground">Published</label>
        </div>

        <div className={preview ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : ''}>
          <div>
            <label className="terminal-label block mb-1">{"> content (markdown):"}</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={20}
              className="w-full bg-muted/50 border border-primary/15 rounded px-4 py-3 font-mono text-xs text-foreground focus:border-primary focus:outline-none resize-none"
            />
          </div>

          {preview && (
            <div className="glass-card rounded-lg p-6 overflow-y-auto max-h-[600px]">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => <h1 className="font-display text-2xl text-primary mt-6 mb-3">{children}</h1>,
                  h2: ({ children }) => <h2 className="font-display text-xl text-primary mt-4 mb-2">{children}</h2>,
                  p: ({ children }) => <p className="font-mono text-sm text-foreground mb-3">{children}</p>,
                  code: ({ children }) => <code className="bg-muted/50 text-primary px-1 py-0.5 rounded text-xs">{children}</code>,
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminBlogEditor;
