import { useState, useEffect, useRef } from 'react';
import ToolLayout from '@/components/ToolLayout';
import { useCopy } from '@/lib/copy';

// Simple MD5 implementation
const md5 = (str: string): string => {
  const utf8 = new TextEncoder().encode(str);
  const add32 = (a: number, b: number) => (a + b) & 0xFFFFFFFF;
  const hex = (n: number) => {
    let s = '';
    for (let i = 0; i < 4; i++) s += ('0' + ((n >> (i * 8)) & 0xFF).toString(16)).slice(-2);
    return s;
  };
  const msg = new Uint8Array(((utf8.length + 72) & ~63));
  msg.set(utf8);
  msg[utf8.length] = 0x80;
  const dv = new DataView(msg.buffer);
  dv.setUint32(msg.length - 8, (utf8.length * 8) & 0xFFFFFFFF, true);
  dv.setUint32(msg.length - 4, Math.floor(utf8.length * 8 / 0x100000000), true);
  let a0 = 0x67452301, b0 = 0xEFCDAB89, c0 = 0x98BADCFE, d0 = 0x10325476;
  const S = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
  const K = Array.from({length:64},(_,i)=>Math.floor(2**32*Math.abs(Math.sin(i+1))));
  for (let i = 0; i < msg.length; i += 64) {
    const M = Array.from({length:16},(_,j)=>dv.getUint32(i+j*4,true));
    let [A,B,C,D] = [a0,b0,c0,d0];
    for (let j = 0; j < 64; j++) {
      let F: number, g: number;
      if (j < 16) { F = (B & C) | (~B & D); g = j; }
      else if (j < 32) { F = (D & B) | (~D & C); g = (5*j+1) % 16; }
      else if (j < 48) { F = B ^ C ^ D; g = (3*j+5) % 16; }
      else { F = C ^ (B | ~D); g = (7*j) % 16; }
      F = add32(add32(F, A), add32(K[j], M[g]));
      A = D; D = C; C = B;
      B = add32(B, (F << S[j]) | (F >>> (32 - S[j])));
    }
    a0 = add32(a0, A); b0 = add32(b0, B); c0 = add32(c0, C); d0 = add32(d0, D);
  }
  return hex(a0) + hex(b0) + hex(c0) + hex(d0);
};

// SHA-1 simple implementation
const sha1 = async (str: string): Promise<string> => {
  const data = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest('SHA-1', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
};

const webCryptoHash = async (algo: string, data: Uint8Array): Promise<string> => {
  const buf = await crypto.subtle.digest(algo, data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
};

type HashResult = { algo: string; hash: string };

const ALGOS = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

const HashGenerator = () => {
  const [input, setInput] = useState('');
  const [hashes, setHashes] = useState<HashResult[]>([]);
  const [fileHash, setFileHash] = useState<{ name: string; size: string; hash: string } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const copiers = Object.fromEntries(ALGOS.map(a => [a, useCopy()]));

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!input) { setHashes([]); return; }
      const data = new TextEncoder().encode(input);
      const results: HashResult[] = [
        { algo: 'MD5', hash: md5(input) },
        { algo: 'SHA-1', hash: await sha1(input) },
        { algo: 'SHA-256', hash: await webCryptoHash('SHA-256', data) },
        { algo: 'SHA-384', hash: await webCryptoHash('SHA-384', data) },
        { algo: 'SHA-512', hash: await webCryptoHash('SHA-512', data) },
      ];
      setHashes(results);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [input]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const buf = await file.arrayBuffer();
    const hash = await webCryptoHash('SHA-256', new Uint8Array(buf));
    setFileHash({
      name: file.name,
      size: file.size < 1024 ? `${file.size} B` : file.size < 1048576 ? `${(file.size/1024).toFixed(1)} KB` : `${(file.size/1048576).toFixed(1)} MB`,
      hash,
    });
  };

  return (
    <ToolLayout title='> HASH_GEN.exe' subtitle="// Compute cryptographic hashes">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="glass-card rounded-lg p-4">
          <label className="font-display text-xs text-primary block mb-2">INPUT TEXT</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter text to hash..."
            className="w-full h-32 bg-transparent font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
            spellCheck={false}
          />
        </div>

        {hashes.length > 0 && (
          <div className="glass-card rounded-lg overflow-hidden">
            <table className="w-full">
              <tbody>
                {hashes.map((h) => (
                  <tr key={h.algo} className="border-b border-primary/10">
                    <td className="px-4 py-3 font-display text-xs text-primary whitespace-nowrap">{h.algo}</td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground break-all">{h.hash}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => copiers[h.algo].copy(h.hash)} className="font-mono text-[10px] text-muted-foreground hover:text-primary whitespace-nowrap">
                        {copiers[h.algo].copied ? '[✓]' : '[_COPY]'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* File hash */}
        <div className="glass-card rounded-lg p-5 space-y-3">
          <h3 className="font-display text-sm text-foreground">FILE HASH (SHA-256)</h3>
          <input type="file" onChange={handleFile} className="font-mono text-sm text-foreground file:mr-4 file:py-1 file:px-3 file:rounded file:border file:border-primary/30 file:text-primary file:bg-transparent file:font-mono file:text-xs" />
          {fileHash && (
            <div className="space-y-1">
              <p className="font-mono text-xs text-muted-foreground">{fileHash.name} ({fileHash.size})</p>
              <p className="font-mono text-xs text-primary break-all">{fileHash.hash}</p>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
};

export default HashGenerator;
