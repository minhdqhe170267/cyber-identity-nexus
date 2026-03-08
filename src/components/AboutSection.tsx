import { motion } from 'framer-motion';
import { Github, Linkedin, Twitter } from 'lucide-react';

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

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
            initial={{ opacity: 0, x: -60, scale: 0.9 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="flex justify-center"
          >
            <div className="w-[200px] h-[200px] rounded-full border-2 border-primary neon-glow-green bg-muted flex items-center justify-center overflow-hidden">
              <span className="font-display text-4xl text-primary">NR</span>
            </div>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.p variants={fadeUp} className="font-mono text-sm leading-relaxed text-foreground mb-6">
              Passionate full-stack developer who thrives in the intersection of clean code and creative problem-solving.
              Specializing in modern web technologies, I build scalable applications that push the boundaries of what's
              possible on the web. When I'm not coding, you'll find me exploring new frameworks, contributing to open source,
              or diving deep into system architecture.
            </motion.p>

            <motion.div variants={fadeUp} className="flex gap-3 mb-6">
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
            </motion.div>

            <motion.div variants={fadeUp} className="flex items-center gap-2 font-mono text-xs">
              <span className="w-2 h-2 rounded-full bg-primary blink-dot" />
              <span className="text-muted-foreground">Currently working on:</span>
              <span className="text-secondary">Next-gen cybersecurity dashboard</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
