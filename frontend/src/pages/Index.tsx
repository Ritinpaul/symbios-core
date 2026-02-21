import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import ProblemSection from '@/components/ProblemSection';
import StatsSection from '@/components/StatsSection';
import ApproachSection from '@/components/ApproachSection';
import DashboardSection from '@/components/DashboardSection';
import SpecsSection from '@/components/SpecsSection';
import ResearchSection from '@/components/ResearchSection';
import RoadmapSection from '@/components/RoadmapSection';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <HeroSection />
        <ProblemSection />
        <StatsSection />
        <ApproachSection />
        <DashboardSection />
        <SpecsSection />
        <ResearchSection />
        <RoadmapSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
