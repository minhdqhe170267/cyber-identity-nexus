import { Github, Linkedin, Mail, Twitter } from 'lucide-react';
import { CONTACT_EMAIL, GITHUB_PROFILE_URL, GITHUB_USERNAME, LINKEDIN_URL, X_URL } from '@/config/profile';

const YEAR = new Date().getFullYear();

const socialLinks = [
  { Icon: Github, href: GITHUB_PROFILE_URL, label: 'GitHub' },
  CONTACT_EMAIL ? { Icon: Mail, href: `mailto:${CONTACT_EMAIL}`, label: 'Email' } : null,
  LINKEDIN_URL ? { Icon: Linkedin, href: LINKEDIN_URL, label: 'LinkedIn' } : null,
  X_URL ? { Icon: Twitter, href: X_URL, label: 'X' } : null,
].filter(Boolean) as { Icon: typeof Github; href: string; label: string }[];

const FooterSection = () => (
  <footer className="border-t border-primary/20 py-6 px-6">
    <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="font-mono text-xs text-muted-foreground">
        {`// ${GITHUB_USERNAME} (c) ${YEAR} - GitHub-powered portfolio`}
      </p>
      <div className="flex gap-3">
        {socialLinks.map(({ Icon, href, label }) => (
          <a
            key={label}
            href={href}
            aria-label={label}
            target={href.startsWith('mailto:') ? undefined : '_blank'}
            rel={href.startsWith('mailto:') ? undefined : 'noreferrer'}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <Icon size={14} />
          </a>
        ))}
      </div>
    </div>
  </footer>
);

export default FooterSection;
