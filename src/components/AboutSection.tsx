import { motion } from 'framer-motion';
import { CalendarDays, Code2, Github, Linkedin, Mail, MapPin, Twitter } from 'lucide-react';
import {
  CONTACT_EMAIL,
  CONTACT_LOCATION,
  GITHUB_PROFILE_URL,
  GITHUB_USERNAME,
  LINKEDIN_URL,
  PROFILE_FOCUS,
  PROFILE_ROLE,
  PROFILE_SUMMARY,
  X_URL,
} from '@/config/profile';
import { formatDate, getDisplayName } from '@/lib/github';
import { useGitHubRepos, useGitHubUser } from '@/hooks/useGitHubData';

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const AboutSection = () => {
  const { data: user, isLoading, isError } = useGitHubUser();
  const { data: repos = [] } = useGitHubRepos();

  const displayName = getDisplayName(user);
  const initials = displayName
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const activeRepo = repos.find((repo) => !repo.archived) || repos[0];
  const socialLinks = [
    { Icon: Github, href: GITHUB_PROFILE_URL, label: 'GitHub' },
    CONTACT_EMAIL ? { Icon: Mail, href: `mailto:${CONTACT_EMAIL}`, label: 'Email' } : null,
    LINKEDIN_URL ? { Icon: Linkedin, href: LINKEDIN_URL, label: 'LinkedIn' } : null,
    X_URL ? { Icon: Twitter, href: X_URL, label: 'X' } : null,
  ].filter(Boolean) as { Icon: typeof Github; href: string; label: string }[];

  return (
    <section id="about" className="relative py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title">{"> PROFILE.exe"}</h2>
          <p className="section-subtitle">{"// Developer profile & current stack"}</p>
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
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={`${displayName} GitHub avatar`} className="h-full w-full object-cover" />
              ) : (
                <span className="font-display text-4xl text-primary">{isLoading ? '...' : initials}</span>
              )}
            </div>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={fadeUp} className="mb-4">
              <p className="font-display text-2xl text-foreground">{displayName}</p>
              <p className="font-mono text-sm text-secondary neon-text-blue">{PROFILE_ROLE}</p>
              <a
                href={GITHUB_PROFILE_URL}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xs text-primary hover:text-primary/80"
              >
                @{GITHUB_USERNAME}
              </a>
            </motion.div>

            <motion.p variants={fadeUp} className="font-mono text-sm leading-relaxed text-foreground mb-6">
              {isError ? 'GitHub profile could not be loaded right now.' : PROFILE_SUMMARY}
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-2 mb-6">
              {PROFILE_FOCUS.map((item) => (
                <span
                  key={item}
                  className="font-mono text-[10px] border border-primary/25 text-primary/80 px-2.5 py-1 rounded"
                >
                  {item}
                </span>
              ))}
            </motion.div>

            <motion.div variants={fadeUp} className="flex gap-3 mb-6">
              {socialLinks.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target={href.startsWith('mailto:') ? undefined : '_blank'}
                  rel={href.startsWith('mailto:') ? undefined : 'noreferrer'}
                  className="w-10 h-10 rounded border border-primary/30 flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
                >
                  <Icon size={18} />
                </a>
              ))}
            </motion.div>

            <motion.div variants={fadeUp} className="grid gap-2 font-mono text-xs text-muted-foreground mb-6">
              <span className="flex items-center gap-2">
                <MapPin size={13} className="text-primary" /> {user?.location || CONTACT_LOCATION}
              </span>
              {user?.created_at && (
                <span className="flex items-center gap-2">
                  <CalendarDays size={13} className="text-primary" /> Joined GitHub {formatDate(user.created_at)}
                </span>
              )}
              <span className="flex items-center gap-2">
                <Code2 size={13} className="text-primary" /> GitHub repositories synced live
              </span>
            </motion.div>

            <motion.div variants={fadeUp} className="flex items-center gap-2 font-mono text-xs">
              <span className="w-2 h-2 rounded-full bg-primary blink-dot" />
              <span className="text-muted-foreground">Latest active repo:</span>
              <span className="text-secondary">{activeRepo?.name || 'No public repo found'}</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
