import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { db } from '@/lib/db';
import Navbar from '@/components/Navbar';

type Post = { id: string; title: string; slug: string; content: string; created_at: string };

const BlogPost = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrollPct, setScrollPct] = useState(0);

  useEffect(() => {
    db('posts').select('*').eq('slug', slug).single()
      .then(({ data }) => { setPost(data); setLoading(false); });
  }, [slug]);

  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setScrollPct(total > 0 ? (window.scrollY / total) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <span className="font-mono text-primary blink text-2xl">█</span>
    </div>
  );

  if (!post) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="font-mono text-accent">{"// POST NOT FOUND"}</p>
    </div>
  );

  return (
    <div className="min-h-screen crt-overlay noise-overlay">
      <div className="fixed top-0 left-0 h-[3px] bg-primary neon-glow-green z-[100]" style={{ width: `${scrollPct}%` }} />
      <Navbar />
      <div className="relative z-10 pt-20 px-6 max-w-3xl mx-auto pb-24">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/blog" className="font-mono text-xs text-primary hover:underline mb-6 inline-block">
            {"< [_BACK TO BLOG]"}
          </Link>

          <p className="font-mono text-xs text-muted-foreground mb-2">
            {new Date(post.created_at).toLocaleDateString()}
          </p>
          <h1 className="font-display text-3xl md:text-4xl text-primary neon-text-green mb-8">{post.title}</h1>

          <article className="prose-cyber font-mono text-sm leading-relaxed text-foreground">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => <h1 className="font-display text-2xl text-primary neon-text-green mt-8 mb-4">{children}</h1>,
                h2: ({ children }) => <h2 className="font-display text-xl text-primary neon-text-green mt-6 mb-3">{children}</h2>,
                h3: ({ children }) => <h3 className="font-display text-lg text-primary mt-4 mb-2">{children}</h3>,
                p: ({ children }) => <p className="mb-4 text-foreground">{children}</p>,
                a: ({ href, children }) => <a href={href} className="text-secondary underline hover:text-primary">{children}</a>,
                code: ({ children, className }) => {
                  const isBlock = className?.includes('language-');
                  return isBlock ? (
                    <pre className="bg-muted/50 border border-primary/10 rounded p-4 overflow-x-auto mb-4">
                      <code className="text-primary text-xs">{children}</code>
                    </pre>
                  ) : (
                    <code className="bg-muted/50 text-primary px-1 py-0.5 rounded text-xs">{children}</code>
                  );
                },
                blockquote: ({ children }) => (
                  <blockquote className="border-l-3 border-accent pl-4 my-4 text-muted-foreground italic">{children}</blockquote>
                ),
                ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>,
              }}
            >
              {post.content || ''}
            </ReactMarkdown>
          </article>

          <div className="flex gap-3 mt-8 pt-6 border-t border-primary/15">
            <button onClick={copyLink} className="btn-neon-green text-xs py-1.5 px-3 rounded">[_COPY LINK]</button>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noreferrer"
              className="btn-neon-blue text-xs py-1.5 px-3 rounded"
            >
              [_SHARE ON X]
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BlogPost;
