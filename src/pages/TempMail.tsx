import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, RefreshCw, Trash2, ClipboardCopy, Mail } from 'lucide-react';
import DOMPurify from 'dompurify';
import Navbar from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';

const API = 'https://api.mail.tm';
const SESSION_DURATION = 10 * 60; // 10 minutes in seconds

type MailMessage = {
  id: string;
  from: { address: string; name: string };
  to: { address: string; name: string }[];
  subject: string;
  intro: string;
  text?: string;
  html?: string[];
  createdAt: string;
  seen: boolean;
};

const randStr = (len: number, chars: string) =>
  Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

const timeAgo = (date: string) => {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const INIT_LINES = [
  '> Connecting to mail server...',
  '> Allocating inbox...',
  '> Encryption keys generated...',
  '> Address ready.',
];

const TempMail = () => {
  const { toast } = useToast();

  // Auth state
  const [address, setAddress] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [initLine, setInitLine] = useState(0);

  // Inbox state
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fullMessage, setFullMessage] = useState<MailMessage | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  // UI state
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(SESSION_DURATION);
  const [pollErrors, setPollErrors] = useState(0);
  const [prevMsgCount, setPrevMsgCount] = useState(0);

  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const tokenRef = useRef('');
  const viewerRef = useRef<HTMLDivElement>(null);

  // Keep tokenRef in sync
  useEffect(() => { tokenRef.current = token; }, [token]);

  const cleanup = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const initAccount = useCallback(async () => {
    cleanup();
    setLoading(true);
    setError('');
    setMessages([]);
    setSelectedId(null);
    setFullMessage(null);
    setSeenIds(new Set());
    setInitLine(0);
    setPollErrors(0);
    setPrevMsgCount(0);

    // Animate init lines
    for (let i = 0; i < INIT_LINES.length; i++) {
      await new Promise((r) => setTimeout(r, 400 + Math.random() * 300));
      setInitLine(i + 1);
    }

    try {
      // 1. Get domains
      const domRes = await fetch(`${API}/domains`);
      if (!domRes.ok) throw new Error('Failed to fetch domains');
      const domains = await domRes.json();
      const domain = domains['hydra:member']?.[0]?.domain;
      if (!domain) throw new Error('No domains available');

      // 2. Create account
      const addr = `${randStr(10, 'abcdefghijklmnopqrstuvwxyz0123456789')}@${domain}`;
      const pass = randStr(16, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%');

      const accRes = await fetch(`${API}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addr, password: pass }),
      });
      if (!accRes.ok) throw new Error('Failed to create account');

      // 3. Get token
      const tokRes = await fetch(`${API}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addr, password: pass }),
      });
      if (!tokRes.ok) throw new Error('Failed to authenticate');
      const tokData = await tokRes.json();

      setAddress(addr);
      setToken(tokData.token);
      tokenRef.current = tokData.token;
      setCountdown(SESSION_DURATION);
      setLoading(false);

      // 4. Start polling
      const poll = async () => {
        try {
          const res = await fetch(`${API}/messages`, {
            headers: { Authorization: `Bearer ${tokenRef.current}` },
          });
          if (!res.ok) throw new Error('Poll failed');
          const data = await res.json();
          const msgs = (data['hydra:member'] || []) as MailMessage[];
          setMessages(msgs);
          setPollErrors(0);
        } catch {
          setPollErrors((p) => p + 1);
        }
      };

      poll();
      pollRef.current = setInterval(poll, 5000);

      // 5. Start countdown
      timerRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) return 0;
          return c - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      setLoading(false);
    }
  }, [cleanup]);

  // Init on mount
  useEffect(() => {
    initAccount();
    return cleanup;
  }, [initAccount, cleanup]);

  // Auto-regenerate on countdown expire
  useEffect(() => {
    if (countdown === 0 && !loading) {
      initAccount();
    }
  }, [countdown, loading, initAccount]);

  // Toast on new message
  useEffect(() => {
    if (messages.length > prevMsgCount && prevMsgCount > 0) {
      toast({ title: '// NEW MESSAGE RECEIVED', description: messages[0]?.subject || 'New email' });
    }
    setPrevMsgCount(messages.length);
  }, [messages.length, prevMsgCount, toast]);

  // Fetch full message
  const openMessage = async (msg: MailMessage) => {
    setSelectedId(msg.id);
    setSeenIds((prev) => new Set(prev).add(msg.id));
    setLoadingMsg(true);

    // Scroll to viewer on mobile
    setTimeout(() => viewerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);

    try {
      const res = await fetch(`${API}/messages/${msg.id}`, {
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      });
      if (!res.ok) throw new Error('Failed to fetch message');
      const data = await res.json();
      setFullMessage(data);
    } catch {
      setFullMessage(null);
    }
    setLoadingMsg(false);
  };

  const deleteMessage = async () => {
    if (!selectedId) return;
    try {
      await fetch(`${API}/messages/${selectedId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      });
      setMessages((prev) => prev.filter((m) => m.id !== selectedId));
      setSelectedId(null);
      setFullMessage(null);
    } catch {
      toast({ title: '// DELETE FAILED', variant: 'destructive' });
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyContent = () => {
    if (fullMessage) {
      navigator.clipboard.writeText(fullMessage.text || '');
      toast({ title: '// CONTENT COPIED' });
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const isUnread = (msg: MailMessage) => !msg.seen && !seenIds.has(msg.id);

  return (
    <div className="min-h-screen crt-overlay noise-overlay">
      <Navbar />
      <div className="relative z-10 pt-20 px-4 md:px-6 max-w-7xl mx-auto pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="section-title">{"> TEMP_MAIL.exe"}</h1>
          <p className="section-subtitle">{"// Disposable inbox — auto-expires on refresh"}</p>

          {!loading && !error && (
            <div className="glass-card rounded-lg p-5 mt-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1 flex items-center gap-3 min-w-0">
                  <Mail size={18} className="text-primary shrink-0" />
                  <span className="font-mono text-lg md:text-xl text-primary neon-text-green truncate">
                    {address}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={copyAddress} className="btn-neon-green text-xs py-1.5 px-3 rounded flex items-center gap-1.5">
                    {copied ? <><Check size={12} /> [✓ COPIED]</> : <><Copy size={12} /> [_COPY]</>}
                  </button>
                  <button onClick={initAccount} className="btn-neon-blue text-xs py-1.5 px-3 rounded flex items-center gap-1.5">
                    <RefreshCw size={12} /> [_NEW ADDRESS]
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between font-mono text-xs">
                <span className={`${countdown < 60 ? 'text-accent neon-text-pink' : 'text-muted-foreground'}`}>
                  {"// SESSION EXPIRES IN: "}{formatTime(countdown)}
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  {pollErrors >= 3 ? (
                    <span className="text-accent">{"// CONNECTION UNSTABLE"}</span>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-primary blink-dot" />
                      {"// LIVE"}
                    </>
                  )}
                </span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Loading state */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card rounded-lg p-10 text-center"
          >
            <div className="font-mono text-sm text-left max-w-md mx-auto space-y-2">
              {INIT_LINES.slice(0, initLine).map((line, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={i === initLine - 1 ? 'text-primary' : 'text-muted-foreground'}
                >
                  {line}
                  {i === initLine - 1 && <span className="blink text-primary ml-1">█</span>}
                </motion.p>
              ))}
              {initLine === 0 && (
                <p className="text-primary">
                  {"// GENERATING SECURE ADDRESS..."}
                  <span className="blink ml-1">█</span>
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="glass-card rounded-lg p-10 text-center">
            <p className="font-mono text-sm text-accent neon-text-pink mb-4">{"// ERROR: "}{error}</p>
            <button onClick={initAccount} className="btn-neon-green text-xs py-2 px-4 rounded">[_RETRY]</button>
          </div>
        )}

        {/* Main panels */}
        {!loading && !error && (
          <div className="flex flex-col md:flex-row gap-4">
            {/* Inbox panel */}
            <div className="w-full md:w-[40%]">
              <div className="glass-card rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-primary/15 flex items-center gap-2">
                  <h3 className="font-display text-sm text-primary tracking-wider">
                    INBOX ({messages.length})
                  </h3>
                  {messages.some((m) => isUnread(m)) && (
                    <span className="w-2 h-2 rounded-full bg-primary blink-dot" />
                  )}
                </div>

                <div className="max-h-[500px] md:max-h-[600px] overflow-y-auto">
                  {messages.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="font-mono text-sm text-muted-foreground">
                        {"> Waiting for incoming transmissions..."}
                        <span className="blink text-primary ml-1">█</span>
                      </p>
                    </div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {messages.map((msg) => (
                        <motion.button
                          key={msg.id}
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -50 }}
                          onClick={() => openMessage(msg)}
                          className={`w-full text-left p-4 border-b border-primary/10 transition-colors ${
                            selectedId === msg.id
                              ? 'bg-primary/10'
                              : isUnread(msg)
                              ? 'bg-primary/5 border-l-[3px] border-l-primary'
                              : 'hover:bg-primary/5 opacity-70'
                          }`}
                        >
                          <p className="font-mono text-xs text-muted-foreground truncate mb-1">
                            {msg.from?.address || 'unknown'}
                          </p>
                          <p className="font-mono text-sm text-foreground truncate mb-1">
                            {msg.subject || '(no subject)'}
                          </p>
                          <p className="font-mono text-[10px] text-muted-foreground">
                            {timeAgo(msg.createdAt)}
                          </p>
                        </motion.button>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </div>
            </div>

            {/* Viewer panel */}
            <div ref={viewerRef} className="w-full md:w-[60%]">
              <div className="glass-card rounded-lg min-h-[400px] md:min-h-[600px]">
                {!selectedId ? (
                  <div className="flex items-center justify-center h-[400px] md:h-[600px]">
                    <p className="font-mono text-sm text-muted-foreground">
                      {"> SELECT A MESSAGE TO DECRYPT"}
                    </p>
                  </div>
                ) : loadingMsg ? (
                  <div className="flex items-center justify-center h-[400px] md:h-[600px]">
                    <p className="font-mono text-sm text-primary">
                      {"// DECRYPTING..."}
                      <span className="blink ml-1">█</span>
                    </p>
                  </div>
                ) : fullMessage ? (
                  <div className="p-5 md:p-6">
                    {/* Email header */}
                    <div className="space-y-2 mb-4">
                      <div className="font-mono text-xs">
                        <span className="text-muted-foreground">FROM: </span>
                        <span className="text-foreground">{fullMessage.from?.address}</span>
                      </div>
                      <div className="font-mono text-xs">
                        <span className="text-muted-foreground">TO: </span>
                        <span className="text-foreground">{address}</span>
                      </div>
                      <div className="font-mono text-xs">
                        <span className="text-muted-foreground">DATE: </span>
                        <span className="text-foreground">
                          {new Date(fullMessage.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <h2 className="font-display text-lg md:text-xl text-foreground mb-4">
                      {fullMessage.subject || '(no subject)'}
                    </h2>

                    <div className="h-px bg-primary/30 mb-4" />

                    {/* Email body */}
                    <div className="font-mono text-sm text-foreground leading-relaxed overflow-x-auto">
                      {fullMessage.html && fullMessage.html.length > 0 ? (
                        <div
                          className="email-content"
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(fullMessage.html.join(''), {
                              ALLOWED_TAGS: [
                                'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a', 'ul', 'ol', 'li',
                                'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
                                'table', 'thead', 'tbody', 'tr', 'td', 'th', 'img', 'span', 'div', 'hr',
                              ],
                              ALLOWED_ATTR: ['href', 'src', 'alt', 'style', 'class', 'target', 'rel'],
                            }),
                          }}
                        />
                      ) : (
                        <pre className="whitespace-pre-wrap break-words">{fullMessage.text || 'No content'}</pre>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 mt-6 pt-4 border-t border-primary/15">
                      <button onClick={deleteMessage} className="flex items-center gap-1.5 text-accent hover:text-accent/80 font-mono text-xs border border-accent/30 px-3 py-1.5 rounded transition-colors hover:bg-accent/10">
                        <Trash2 size={12} /> [_DELETE]
                      </button>
                      <button onClick={copyContent} className="flex items-center gap-1.5 text-secondary hover:text-secondary/80 font-mono text-xs border border-secondary/30 px-3 py-1.5 rounded transition-colors hover:bg-secondary/10">
                        <ClipboardCopy size={12} /> [_COPY CONTENT]
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TempMail;
