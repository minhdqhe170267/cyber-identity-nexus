import { motion } from 'framer-motion';
import { Github, Mail, MapPin, Phone } from 'lucide-react';
import {
  CONTACT_EMAIL,
  CONTACT_LOCATION,
  CONTACT_PHONE,
  GITHUB_PROFILE_URL,
  GITHUB_USERNAME,
} from '@/config/profile';

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const phoneHref = `tel:${CONTACT_PHONE.replace(/[^\d+]/g, '')}`;

const contacts = [
  {
    Icon: Mail,
    label: 'Email',
    value: CONTACT_EMAIL,
    href: `mailto:${CONTACT_EMAIL}`,
    command: `$ mail ${CONTACT_EMAIL}`,
  },
  {
    Icon: Phone,
    label: 'Phone',
    value: CONTACT_PHONE,
    href: phoneHref,
    command: `$ call ${CONTACT_PHONE}`,
  },
  {
    Icon: MapPin,
    label: 'Location',
    value: CONTACT_LOCATION,
    href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONTACT_LOCATION)}`,
    command: `$ locate "${CONTACT_LOCATION}"`,
  },
  {
    Icon: Github,
    label: 'GitHub',
    value: `@${GITHUB_USERNAME}`,
    href: GITHUB_PROFILE_URL,
    command: `$ gh profile @${GITHUB_USERNAME}`,
  },
];

const ContactSection = () => {
  return (
    <section id="contact" className="relative py-24 px-6">
      <div className="max-w-[720px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title">{"> CONTACT_INFO.txt"}</h2>
          <p className="section-subtitle">{"// Direct contact channels"}</p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="glass-card rounded-lg p-8"
        >
          <div className="space-y-4">
            {contacts.map(({ Icon, label, value, href, command }) => (
              <motion.a
                key={label}
                variants={fadeUp}
                href={href}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel={href.startsWith('http') ? 'noreferrer' : undefined}
                className="group flex items-center gap-4 rounded border border-primary/15 bg-muted/20 px-4 py-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-primary/30 text-primary group-hover:bg-primary/10">
                  <Icon size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {label}
                  </span>
                  <span className="block truncate font-mono text-sm text-foreground">
                    {value}
                  </span>
                </span>
                <span className="hidden font-mono text-[10px] text-primary/70 md:block">
                  {command}
                </span>
              </motion.a>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ContactSection;
