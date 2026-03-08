import { lazy, Suspense } from 'react';
import ParticleGrid from '@/components/ParticleGrid';
import CustomCursor from '@/components/CustomCursor';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';

const AboutSection = lazy(() => import('@/components/AboutSection'));
const ProjectsSection = lazy(() => import('@/components/ProjectsSection'));
const SkillsSection = lazy(() => import('@/components/SkillsSection'));
const ContactSection = lazy(() => import('@/components/ContactSection'));
const FooterSection = lazy(() => import('@/components/FooterSection'));

const Index = () => {
  return (
    <div className="relative min-h-screen crt-overlay noise-overlay">
      <ParticleGrid />
      <CustomCursor />
      <Navbar />
      <div className="relative z-10">
        <HeroSection />
        <Suspense fallback={null}>
          <AboutSection />
          <ProjectsSection />
          <SkillsSection />
          <ContactSection />
          <FooterSection />
        </Suspense>
      </div>
    </div>
  );
};

export default Index;
