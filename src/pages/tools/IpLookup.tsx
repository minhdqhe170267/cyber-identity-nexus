import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, RefreshCw } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import { useCopy } from '@/lib/copy';

type IpData = {
  ip: string; city: string; region: string; country_name: string; country_code: string;
  org: string; latitude: number; longitude: number; timezone: string; asn: string;
};

const IpLookup = () => {
  const [data, setData] = useState<IpData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [customIp, setCustomIp] = useState('');
  const { copied, copy } = useCopy();

  const lookup = useCallback(async (ip?: string) => {
    setLoading(true);
    setError('');
    try {
      // Try ip-api.com first (generous free tier: 45 req/min)
      const query = ip || '';
      const url = `http://ip-api.com/json/${query}?fields=status,message,query,city,regionName,country,countryCode,isp,lat,lon,timezone,as`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Lookup failed');
      const json = await res.json();
      if (json.status === 'fail') throw new Error(json.message || 'Invalid IP');
      setData({
        ip: json.query,
        city: json.city,
        region: json.regionName,
        country_name: json.country,
        country_code: json.countryCode,
        org: json.isp,
        latitude: json.lat,
        longitude: json.lon,
        timezone: json.timezone,
        asn: json.as,
      });
    } catch (e: any) {
      setError(e.message || 'Unknown error');
      setData(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { lookup(); }, [lookup]);

  const flag = (code: string) => {
    if (!code) return '';
    return code.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
  };

  const Row = ({ label, value }: { label: string; value: string }) => (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex justify-between py-2 border-b border-primary/10"
    >
      <span className="font-mono text-xs text-muted-foreground">{label}</span>
      <span className="font-mono text-sm text-foreground">{value}</span>
    </motion.div>
  );

  return (
    <ToolLayout title='> IP_LOOKUP.exe' subtitle="// Lookup IP address geolocation data">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Search */}
        <div className="glass-card rounded-lg p-4 flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={customIp}
              onChange={(e) => setCustomIp(e.target.value)}
              placeholder="Enter IP address..."
              onKeyDown={(e) => e.key === 'Enter' && lookup(customIp)}
              className="w-full pl-9 pr-3 py-2 bg-muted border border-primary/15 rounded font-mono text-sm text-foreground focus:outline-none focus:border-primary/40"
            />
          </div>
          <button onClick={() => lookup(customIp)} className="btn-neon-green text-xs py-2 px-3 rounded">[_LOOKUP]</button>
          <button onClick={() => { setCustomIp(''); lookup(); }} className="btn-neon-blue text-xs py-2 px-3 rounded flex items-center gap-1">
            <RefreshCw size={12} /> [_MY IP]
          </button>
        </div>

        {loading && (
          <div className="glass-card rounded-lg p-8 text-center">
            <p className="font-mono text-sm text-primary">{"// LOOKING UP..."}<span className="blink ml-1">█</span></p>
          </div>
        )}

        {error && !loading && (
          <div className="glass-card rounded-lg p-6 text-center">
            <p className="font-mono text-sm text-accent neon-text-pink">{"// ERROR: "}{error}</p>
          </div>
        )}

        {data && !loading && (
          <div className="glass-card rounded-lg p-6 space-y-1">
            <div className="flex items-center justify-between mb-4">
              <code className="font-mono text-2xl text-primary neon-text-green">{data.ip}</code>
              <button onClick={() => copy(data.ip)} className="font-mono text-[10px] text-muted-foreground hover:text-primary">
                {copied ? '[✓ COPIED]' : '[_COPY]'}
              </button>
            </div>
            <Row label="CITY" value={data.city || 'N/A'} />
            <Row label="REGION" value={data.region || 'N/A'} />
            <Row label="COUNTRY" value={`${flag(data.country_code)} ${data.country_name || 'N/A'}`} />
            <Row label="ISP / ORG" value={data.org || 'N/A'} />
            <Row label="COORDINATES" value={`${data.latitude}, ${data.longitude}`} />
            <Row label="TIMEZONE" value={data.timezone || 'N/A'} />
            <Row label="ASN" value={data.asn || 'N/A'} />
          </div>
        )}
      </div>
    </ToolLayout>
  );
};

export default IpLookup;
