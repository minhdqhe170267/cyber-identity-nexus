import { lazy, Suspense, useState } from 'react';
import ParticleGrid from '@/components/ParticleGrid';
import CustomCursor from '@/components/CustomCursor';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import CommandPalette from '@/components/CommandPalette';
import SnakeGame from '@/components/SnakeGame';

const AboutSection = lazy(() => import('@/components/AboutSection'));
const ProjectsSection = lazy(() => import('@/components/ProjectsSection'));
const SkillsSection = lazy(() => import('@/components/SkillsSection'));
const GitHubStats = lazy(() => import('@/components/GitHubStats'));
const ContactSection = lazy(() => import('@/components/ContactSection'));
const FooterSection = lazy(() => import('@/components/FooterSection'));

const Index = () => {
  const [gameOpen, setGameOpen] = useState(false);

  return (
    <div className="relative min-h-screen crt-overlay noise-overlay">
      <ParticleGrid />
      <CustomCursor />
      <Navbar />
      <CommandPalette onPlayGame={() => setGameOpen(true)} />
      <SnakeGame open={gameOpen} onClose={() => setGameOpen(false)} />
      <div className="relative z-10">
        <HeroSection />
        <Suspense fallback={null}>
          <AboutSection />
          <ProjectsSection />
          <SkillsSection />
          <GitHubStats />
          <ContactSection />
          <FooterSection />
        </Suspense>
      </div>
    </div>
  );
};

export default Index;
