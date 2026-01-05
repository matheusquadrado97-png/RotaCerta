import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { WorkshopCTASection } from "@/components/landing/WorkshopCTASection";
import { PricingSection } from "@/components/landing/PricingSection";
import { Footer } from "@/components/landing/Footer";

import { usePageTitle } from "@/hooks/usePageTitle";

const Index = () => {
  usePageTitle("Home");
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <WorkshopCTASection />
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
