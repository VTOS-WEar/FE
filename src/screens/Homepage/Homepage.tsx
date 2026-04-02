import { useState } from "react";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { HeroSection } from "./sections/HeroSection/HeroSection";
import { StatsSection } from "./sections/StatsSection";
import { FeaturesHighlightSection } from "./sections/FeaturesHighlightSection";
import { ProductShowcaseSection } from "./sections/ProductShowcaseSection";
import { CallToActionSection } from "./sections/CallToActionSection";
import { JoinedSchoolsSection } from "./sections/JoinedSchoolsSection";
import { Notify } from "@/components/ui/notify";
import { useScrollReveal } from "@/hooks/useScrollReveal";

/**
 * Homepage — Disciplined Neubrutalism
 *
 * Section rhythm (loud/quiet):
 *   Hero          (LOUD)  — biggest type, strongest CTA
 *   Stats         (calm)  — proof numbers, white bg
 *   How It Works  (LOUD)  — purple accent band
 *   Product       (calm)  — before/after showcase, white bg
 *   CTA           (LOUD)  — purple accent band, operational CTA
 *   Schools       (calm)  — social proof, white bg
 */
export const Homepage = (): JSX.Element => {
  const [showToast, setShowToast] = useState(false);
  useScrollReveal();

  return (
    <GuestLayout bgColor="#FFF8F0">
      <div className="nb-fade-in">
        {/* LOUD: Hero */}
        <HeroSection />

        {/* calm: Proof stats */}
        <div className="nb-reveal">
          <StatsSection />
        </div>

        {/* LOUD: How it works (purple band) */}
        <div className="nb-reveal">
          <FeaturesHighlightSection />
        </div>

        {/* calm: Before/After showcase */}
        <div className="nb-reveal">
          <ProductShowcaseSection />
        </div>

        {/* LOUD: CTA banner (purple band) */}
        <div className="nb-reveal" onClick={() => setShowToast(true)}>
          <CallToActionSection />
        </div>

        {/* calm: Social proof — schools */}
        <div className="nb-reveal">
          <JoinedSchoolsSection />
        </div>
      </div>

      <Notify
        open={showToast}
        title="Thông báo"
        message="Chào mừng bạn đến với VTOS! Hệ thống AI đang sẵn sàng hỗ trợ bạn thử đồ."
        variant="success"
        onClose={() => setShowToast(false)}
      />
    </GuestLayout>
  );
};
