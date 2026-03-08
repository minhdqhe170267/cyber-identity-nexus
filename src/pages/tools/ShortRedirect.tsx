import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '@/lib/db';

const ShortRedirect = () => {
  const { code } = useParams();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!code) { setError(true); return; }
    (async () => {
      const { data } = await db('url_shortener').select('original_url, clicks').eq('short_code', code).single();
      if (!data) { setError(true); return; }
      // Increment clicks
      db('url_shortener').update({ clicks: (data.clicks || 0) + 1 }).eq('short_code', code).then(() => {});
      window.location.href = data.original_url;
    })();
  }, [code]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background crt-overlay noise-overlay">
        <div className="text-center">
          <h1 className="section-title text-xl mb-2">{"> LINK_NOT_FOUND.exe"}</h1>
          <p className="font-mono text-sm text-muted-foreground mb-6">// The short URL does not exist</p>
          <Link to="/tools/url-short" className="btn-neon-green text-xs py-2 px-4 rounded">[_CREATE NEW LINK]</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="font-mono text-sm text-primary">{"// REDIRECTING..."}<span className="blink ml-1">█</span></p>
    </div>
  );
};

export default ShortRedirect;
