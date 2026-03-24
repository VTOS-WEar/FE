import { useState } from "react";
import { motion } from "framer-motion";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { HeroSection } from "./sections/HeroSection/HeroSection";
import { FeaturesHighlightSection } from "./sections/FeaturesHighlightSection";
import { ProductShowcaseSection } from "./sections/ProductShowcaseSection";
import { CustomUniformOptionsSection } from "./sections/CustomUniformOptionsSection";
import { CallToActionSection } from "./sections/CallToActionSection";
import { JoinedSchoolsSection } from "./sections/JoinedSchoolsSection";
import { Notify } from "@/components/ui/notify";

export const Homepage = (): JSX.Element => {
  const [showToast, setShowToast] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <GuestLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={sectionVariants}>
          <HeroSection />
        </motion.div>

        <motion.div variants={sectionVariants}>
          <FeaturesHighlightSection />
        </motion.div>

        <motion.div variants={sectionVariants}>
          <ProductShowcaseSection />
        </motion.div>

        <motion.div variants={sectionVariants}>
          <CustomUniformOptionsSection />
        </motion.div>

        <motion.div variants={sectionVariants} onClick={() => setShowToast(true)}>
          <CallToActionSection />
        </motion.div>

        <motion.div variants={sectionVariants}>
          <JoinedSchoolsSection />
        </motion.div>
      </motion.div>

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
