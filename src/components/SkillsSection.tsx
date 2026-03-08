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

const panelContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const panelVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const skillContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
};

const skillVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

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

        <motion.div
          variants={panelContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {PANELS.map((panel) => (
            <motion.div
              key={panel.title}
              variants={panelVariants}
              className="glass-card rounded-lg p-6"
            >
              <h3 className="font-display text-sm text-primary mb-6 tracking-wider">
                [{panel.title}]
              </h3>
              <motion.div
                variants={skillContainerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="space-y-4"
              >
                {panel.skills.map((skill) => (
                  <motion.div key={skill.name} variants={skillVariants}>
                    <div className="flex justify-between font-mono text-xs mb-1">
                      <span className="text-foreground">{skill.name}</span>
                      <span className="text-muted-foreground">{skill.level}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${skill.level}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full rounded-full ${barColor(skill.level)}`}
                      />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default SkillsSection;
