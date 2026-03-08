import { useState } from 'react';
import { motion } from 'framer-motion';
import { Github, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type FormState = 'idle' | 'sending' | 'success' | 'error';

const ContactSection = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [state, setState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setState('sending');
    setErrorMsg('');

    const { error } = await supabase.from('contact_messages').insert({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    });

    if (error) {
      setState('error');
      setErrorMsg('Transmission failed. Please try again.');
    } else {
      setState('success');
      setName('');
      setEmail('');
      setMessage('');
      setTimeout(() => setState('idle'), 4000);
    }
  };

  return (
    <section id="contact" className="relative py-24 px-6">
      <div className="max-w-[600px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title">{"> OPEN_CHANNEL.exe"}</h2>
          <p className="section-subtitle">{"// Establish secure connection"}</p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          onSubmit={handleSubmit}
          className="glass-card rounded-lg p-8 space-y-6"
        >
          {(['name', 'email'] as const).map((field) => (
            <div key={field}>
              <label className="terminal-label block mb-2">{`> ${field}:`}</label>
              <input
                type={field === 'email' ? 'email' : 'text'}
                required
                maxLength={field === 'email' ? 255 : 100}
                value={field === 'name' ? name : email}
                onChange={(e) => field === 'name' ? setName(e.target.value) : setEmail(e.target.value)}
                className="w-full bg-muted/50 border border-primary/15 rounded px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                placeholder={field === 'name' ? 'John Connor' : 'john@resistance.io'}
              />
            </div>
          ))}
          <div>
            <label className="terminal-label block mb-2">{"> message:"}</label>
            <textarea
              required
              maxLength={1000}
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-muted/50 border border-primary/15 rounded px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all resize-none"
              placeholder="Your encrypted message..."
            />
          </div>

          <button
            type="submit"
            disabled={state === 'sending' || state === 'success'}
            className="w-full bg-primary text-primary-foreground font-display text-sm tracking-wider py-3 rounded hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {state === 'sending' ? 'ENCRYPTING...' :
             state === 'success' ? '// TRANSMISSION COMPLETE ✓' :
             '[_SEND_TRANSMISSION]'}
          </button>

          {state === 'error' && (
            <p className="font-mono text-xs text-accent text-center">{errorMsg}</p>
          )}
        </motion.form>

        <div className="mt-6 flex justify-center gap-6 font-mono text-xs text-muted-foreground">
          <a href="mailto:hello@netrunner.dev" className="hover:text-primary transition-colors flex items-center gap-2">
            <Mail size={14} /> {"$ mail hello@netrunner.dev"}
          </a>
          <a href="#" className="hover:text-primary transition-colors flex items-center gap-2">
            <Github size={14} /> {"$ git clone netrunner"}
          </a>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
