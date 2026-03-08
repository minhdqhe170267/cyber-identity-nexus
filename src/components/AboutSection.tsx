import { motion } from 'framer-motion';
import { Github, Linkedin, Twitter } from 'lucide-react';

const AboutSection = () => {
  return (
    <section id="about" className="relative py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title">{"> ABOUT_ME.txt"}</h2>
          <p className="section-subtitle">{"// Personal data & configuration"}</p>
        </motion.div>

        <div className="glass-card rounded-lg p-8 grid md:grid-cols-[200px_1fr] gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center"
          >
            <div className="w-[200px] h-[200px] rounded-full border-2 border-primary neon-glow-green bg-muted flex items-center justify-center overflow-hidden">
              <span className="font-display text-4xl text-primary">NR</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <p className="font-mono text-sm leading-relaxed text-foreground mb-6">
              Passionate full-stack developer who thrives in the intersection of clean code and creative problem-solving.
              Specializing in modern web technologies, I build scalable applications that push the boundaries of what's
              possible on the web. When I'm not coding, you'll find me exploring new frameworks, contributing to open source,
              or diving deep into system architecture.
            </p>

            <div className="flex gap-3 mb-6">
              {[
                { Icon: Github, href: '#' },
                { Icon: Linkedin, href: '#' },
                { Icon: Twitter, href: '#' },
              ].map(({ Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="w-10 h-10 rounded border border-primary/30 flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="w-2 h-2 rounded-full bg-primary blink-dot" />
              <span className="text-muted-foreground">Currently working on:</span>
              <span className="text-secondary">Next-gen cybersecurity dashboard</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
