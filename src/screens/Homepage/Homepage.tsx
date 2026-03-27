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
    <GuestLayout bgColor="#faf9ff">
      {/* ── Ambient Glow Background ───────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          className="absolute top-[-5%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-purple-100/40 to-indigo-50/30 rounded-full blur-[120px]"
          animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[20%] right-[-5%] w-[500px] h-[500px] bg-gradient-to-tr from-sky-50/40 to-fuchsia-50/20 rounded-full blur-[100px]"
          animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10"
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
