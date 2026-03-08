import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { db } from '@/lib/db';
import Navbar from '@/components/Navbar';

type Post = { id: string; title: string; slug: string; excerpt: string; created_at: string; content: string };

const Blog = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db('posts').select('*').eq('published', true).order('created_at', { ascending: false })
      .then(({ data }) => { setPosts(data || []); setLoading(false); });
  }, []);

  const readTime = (content: string) => Math.max(1, Math.ceil((content || '').split(/\s+/).length / 200));

  return (
    <div className="min-h-screen crt-overlay noise-overlay">
      <Navbar />
      <div className="relative z-10 pt-20 px-6 max-w-5xl mx-auto pb-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="section-title">{"> BLOG.log"}</h1>
          <p className="section-subtitle">{"// Thoughts, tutorials, and system logs"}</p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-card rounded-lg h-48 animate-pulse bg-primary/5" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="glass-card rounded-lg p-12 text-center">
            <p className="font-mono text-sm text-muted-foreground">{"// NO POSTS FOUND — Check back soon"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link to={`/blog/${post.slug}`} className="block glass-card glass-card-hover rounded-lg p-6 h-full">
                  <p className="font-mono text-[10px] text-muted-foreground mb-2">
                    {new Date(post.created_at).toLocaleDateString()} · {readTime(post.content)} min read
                  </p>
                  <h2 className="font-display text-lg mb-2">{post.title}</h2>
                  <p className="font-mono text-xs text-muted-foreground line-clamp-3">{post.excerpt}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;
