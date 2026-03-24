import { ArrowRight, User } from "lucide-react";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { HeroSection } from "./sections/HeroSection/HeroSection";
import { FeaturesHighlightSection } from "./sections/FeaturesHighlightSection";
import { ProductShowcaseSection } from "./sections/ProductShowcaseSection";
import { CustomUniformOptionsSection } from "./sections/CustomUniformOptionsSection";
import { CallToActionSection } from "./sections/CallToActionSection";
import { JoinedSchoolsSection } from "./sections/JoinedSchoolsSection";

export const Homepage = (): JSX.Element => {

  return (
    <GuestLayout>

      <HeroSection />

      <FeaturesHighlightSection />
      <ProductShowcaseSection />
      <CustomUniformOptionsSection />
      <CallToActionSection />

      <JoinedSchoolsSection />
    </GuestLayout>
  );
};
