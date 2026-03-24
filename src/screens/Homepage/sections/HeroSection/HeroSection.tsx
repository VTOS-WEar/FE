
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function HeroSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 15 }
    },
  };

  return (
    <section className="relative w-full overflow-hidden py-16">

      {/* Arrows */}
      <motion.button
        whileHover={{ scale: 1.1, x: -5 }}
        whileTap={{ scale: 0.9 }}
        title="Previous"
        type="button"
        className="absolute left-2 top-1/2 z-20 h-12 w-12 -translate-y-1/2 bg-transparent p-0 text-[#c5acef] shadow-none hover:bg-transparent hover:text-[#b99be9] focus-visible:ring-0 focus-visible:ring-offset-0 sm:left-4 sm:h-16 sm:w-16 md:left-20 md:h-24 md:w-24"
      >
        <ChevronLeft className="h-10 w-10 [stroke-width:3] sm:h-12 sm:w-12 md:h-20 md:w-20" strokeLinecap="round" strokeLinejoin="round" />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1, x: 5 }}
        whileTap={{ scale: 0.9 }}
        title="Next"
        type="button"
        className="absolute right-2 top-1/2 z-20 h-12 w-12 -translate-y-1/2 bg-transparent p-0 text-[#c5acef] shadow-none hover:bg-transparent hover:text-[#b99be9] focus-visible:ring-0 focus-visible:ring-offset-0 sm:right-4 sm:h-16 sm:w-16 md:right-20 md:h-24 md:w-24"
      >
        <ChevronRight className="h-10 w-10 [stroke-width:3] sm:h-12 sm:w-12 md:h-20 md:w-20" strokeLinecap="round" strokeLinejoin="round" />
      </motion.button>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto grid max-w-[1000px] grid-cols-1 items-center px-6 md:grid-cols-2"
      >

        {/* Left */}
        <div className="space-y-4 text-center mt-8">
          <motion.h1 
            variants={itemVariants}
            className="leading-[0.6] my-0 [font-family:'Gochi_Hand',cursive] text-[clamp(8rem,14vw,16rem)] font-normal tracking-[0.02em] text-[#a87af0] [text-shadow:0_8px_16px_rgba(92,71,155,0.3)]"
          >
            VTOS
          </motion.h1>

          <motion.h2 
            variants={itemVariants}
            className="[font-family:'Baloo_2',Helvetica] text-3xl font-semibold leading-[1.2] text-[#342724]"
          >
            Thử đồng phục trực tuyến bằng AI
          </motion.h2>

          <motion.p 
            variants={itemVariants}
            className="mx-auto max-w-[760px] [font-family:'Baloo_2',Helvetica] text-md leading-[1.45] text-[#4a403e] font-medium"
          >
            Tải ảnh của bạn lên và xem đồng phục trường hiển thị ngay lập tức.
            Không cần thử trực tiếp, không mất thời gian. Phụ huynh, học sinh
            và nhà trường đều có thể sử dụng dễ dàng.
          </motion.p>

          <motion.div variants={itemVariants} className="flex justify-end pt-4">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  className="
                    relative inline-flex items-center gap-2
                    px-12 py-6 rounded-lg
                    text-white text-base font-extrabold
                    tracking-[0.2px]
                    bg-[linear-gradient(135deg,#c084fc_0%,#a855f7_35%,#8B5CF6_65%,#7c3aed_100%)]
                    border-0
                    transition-all duration-300
                    shadow-[0_0_0_1px_rgba(168,85,247,0.3),0_8px_24px_rgba(139,92,246,0.5),0_16px_60px_rgba(168,85,247,0.45),0_24px_80px_rgba(192,132,252,0.35)]
                    hover:shadow-[0_0_0_1px_rgba(168,85,247,0.4),0_10px_28px_rgba(139,92,246,0.6),0_20px_70px_rgba(168,85,247,0.55),0_30px_90px_rgba(192,132,252,0.4)]
                  "
                >
                  <span
                    className="
                      absolute -z-10
                      -inset-x-[30px] -inset-y-[20px]
                      rounded-full
                      bg-[radial-gradient(ellipse_at_center,rgba(192,132,252,0.35)_0%,rgba(168,85,247,0.15)_50%,transparent_75%)]
                    "
                  />
                  <span className="relative z-10">Bắt đầu thử ngay</span>
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Right - Phone */}
        <motion.div variants={itemVariants} className="flex justify-center">
          <motion.div
            className="relative"
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div
              className="absolute left-1/2 top-[80%] h-10 w-44 -translate-x-1/2 rounded-full bg-purple-400/40 blur-2xl sm:h-12 sm:w-56 md:h-14 md:w-64"
              animate={{ opacity: [0.35, 0.7, 0.35], scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="relative h-[520px] w-[260px] rounded-[30px] border border-gray-200 bg-black p-2 shadow-2xl sm:h-[620px] sm:w-[310px] sm:rounded-[36px] md:h-[720px] md:w-[360px] md:rounded-[40px]">

              {/* Screen */}
              <div className="relative h-full w-full overflow-hidden rounded-[22px] bg-black sm:rounded-[26px] md:rounded-[30px]">
                {/* Dynamic Island */}
                <div className="absolute left-1/2 top-3 z-10 h-5 w-16 -translate-x-1/2 rounded-full bg-black sm:top-4 sm:h-6 sm:w-20" />

                <motion.img
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  src="https://api.builder.io/api/v1/image/assets/TEMP/eef0ae9593f6a6296eb52342229bd158fe61eb1b?width=1808"
                  alt="students"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>

      </motion.div>
    </section>
  )
}
