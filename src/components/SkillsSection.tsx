import { motion } from 'framer-motion';

type Skill = { name: string; level: number };

const PANELS: { title: string; skills: Skill[] }[] = [
  {
    title: 'LANGUAGES',
    skills: [
      { name: 'JavaScript', level: 95 },
      { name: 'TypeScript', level: 92 },
      { name: 'Python', level: 85 },
      { name: 'SQL', level: 80 },
      { name: 'HTML/CSS', level: 95 },
    ],
  },
  {
    title: 'FRAMEWORKS',
    skills: [
      { name: 'React', level: 95 },
      { name: 'Next.js', level: 88 },
      { name: 'Node.js', level: 90 },
      { name: 'Express', level: 85 },
      { name: 'Tailwind CSS', level: 93 },
    ],
  },
  {
    title: 'TOOLS',
    skills: [
      { name: 'Git', level: 92 },
      { name: 'Docker', level: 78 },
      { name: 'Supabase', level: 85 },
      { name: 'Vercel', level: 88 },
      { name: 'Figma', level: 72 },
    ],
  },
];

const barColor = (level: number) =>
  level >= 90 ? 'bg-primary neon-glow-green' :
  level >= 70 ? 'bg-secondary neon-glow-blue' :
  'bg-accent neon-glow-pink';

const SkillsSection = () => {
  return (
    <section id="skills" className="relative py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title">{"> SYSTEM_SPECS.cfg"}</h2>
          <p className="section-subtitle">{"// Installed packages & proficiency"}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PANELS.map((panel, pi) => (
            <motion.div
              key={panel.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: pi * 0.15 }}
              className="glass-card rounded-lg p-6"
            >
              <h3 className="font-display text-sm text-primary mb-6 tracking-wider">
                [{panel.title}]
              </h3>
              <div className="space-y-4">
                {panel.skills.map((skill, si) => (
                  <div key={skill.name}>
                    <div className="flex justify-between font-mono text-xs mb-1">
                      <span className="text-foreground">{skill.name}</span>
                      <span className="text-muted-foreground">{skill.level}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${skill.level}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: pi * 0.15 + si * 0.08, ease: 'easeOut' }}
                        className={`h-full rounded-full ${barColor(skill.level)}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;
