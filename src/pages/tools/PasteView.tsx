import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Copy, Check, FileText } from 'lucide-react';
import hljs from 'highlight.js/lib/core';
// Register common languages
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import sql from 'highlight.js/lib/languages/sql';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import java from 'highlight.js/lib/languages/java';
import cpp from 'highlight.js/lib/languages/cpp';

import Navbar from '@/components/Navbar';
import { db } from '@/lib/db';
import { useCopy } from '@/lib/copy';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('css', css);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('go', go);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('java', java);
hljs.registerLanguage('cpp', cpp);

const PasteView = () => {
  const { id } = useParams();
  const [paste, setPaste] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRaw, setShowRaw] = useState(false);
  const { copied, copy } = useCopy();

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error: dbErr } = await db('pastes').select('*').eq('id', id).single();
      if (dbErr || !data) { setError('// PASTE NOT FOUND'); setLoading(false); return; }
      if (data.expires_at && new Date(data.expires_at) < new Date()) { setError('// PASTE EXPIRED'); setLoading(false); return; }
      setPaste(data);
      setLoading(false);
      // Increment views
      db('pastes').update({ views: (data.views || 0) + 1 }).eq('id', id).then(() => {});
    })();
  }, [id]);

  const highlighted = paste ? (() => {
    try {
      if (paste.language && paste.language !== 'plaintext' && hljs.getLanguage(paste.language)) {
        return hljs.highlight(paste.content, { language: paste.language }).value;
      }
      return hljs.highlightAuto(paste.content).value;
    } catch {
      return paste.content;
    }
  })() : '';

  const timeLeft = paste?.expires_at ? (() => {
    const diff = new Date(paste.expires_at).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : `${h}h ${m}m`;
  })() : null;

  return (
    <div className="min-h-screen crt-overlay noise-overlay">
      <Navbar />
      <div className="relative z-10 pt-20 px-4 md:px-6 max-w-5xl mx-auto pb-24">
        {loading && (
          <div className="text-center py-20">
            <p className="font-mono text-sm text-primary">{"// LOADING..."}<span className="blink ml-1">█</span></p>
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <p className="font-mono text-lg text-accent neon-text-pink mb-4">{error}</p>
            <Link to="/tools/paste" className="btn-neon-green text-xs py-2 px-4 rounded">[_NEW PASTE]</Link>
          </div>
        )}

        {paste && (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <div>
                <h1 className="section-title text-xl">{paste.title || 'Untitled'}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-secondary/30 text-secondary">{paste.language}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{paste.views} views</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{new Date(paste.created_at).toLocaleDateString()}</span>
                  {timeLeft && <span className="font-mono text-[10px] text-accent">expires: {timeLeft}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => copy(paste.content)} className="btn-neon-green text-xs py-1.5 px-3 rounded">
                  {copied ? '[✓ COPIED]' : '[_COPY ALL]'}
                </button>
                <button onClick={() => setShowRaw(!showRaw)} className="btn-neon-blue text-xs py-1.5 px-3 rounded">
                  [{showRaw ? '_HIGHLIGHT' : '_RAW'}]
                </button>
                <Link to="/tools/paste" className="font-mono text-xs border border-primary/15 text-muted-foreground px-3 py-1.5 rounded hover:text-primary hover:border-primary/40 transition-colors flex items-center gap-1">
                  <FileText size={12} />[_NEW PASTE]
                </Link>
              </div>
            </div>

            {/* Code */}
            <div className="glass-card rounded-lg overflow-hidden">
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-10 bg-muted/30 flex flex-col items-end pr-2 pt-4 font-mono text-[10px] text-muted-foreground select-none overflow-hidden">
                  {paste.content.split('\n').map((_: string, i: number) => <div key={i} className="leading-5">{i + 1}</div>)}
                </div>
                {showRaw ? (
                  <pre className="p-4 pl-12 font-mono text-sm text-foreground leading-5 overflow-x-auto">{paste.content}</pre>
                ) : (
                  <pre className="p-4 pl-12 font-mono text-sm leading-5 overflow-x-auto">
                    <code dangerouslySetInnerHTML={{ __html: highlighted }} />
                  </pre>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PasteView;
