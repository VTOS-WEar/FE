import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative w-full overflow-hidden py-16 lg:py-24">
      <div className="mx-auto grid max-w-[1100px] grid-cols-1 items-center gap-10 px-6 md:grid-cols-2 md:gap-8">

        {/* Left — Branding + Copy */}
        <div className="text-left nb-stagger">
          {/* Big VTOS branding */}
          <h1
            className="leading-[0.75] my-0 text-[clamp(7rem,13vw,14rem)] font-normal tracking-[0.02em] text-[#B8A9E8]"
            style={{
              fontFamily: "'Gochi Hand', cursive",
              textShadow: "0 6px 12px rgba(92,71,155,0.25)",
            }}
          >
            VTOS
          </h1>

          {/* Subtitle */}
          <h2 className="mt-2 text-2xl font-extrabold leading-[1.2] text-[#1A1A2E] sm:text-3xl">
            Thử đồng phục trực tuyến bằng AI
          </h2>

          {/* Description */}
          <p className="mt-4 max-w-[480px] text-base font-medium leading-relaxed text-[#4C5769] md:text-lg">
            Tải ảnh của bạn lên và xem đồng phục trường hiển thị ngay lập tức.
            Không cần thử trực tiếp, không mất thời gian. Phụ huynh, học sinh
            và nhà trường đều có thể sử dụng dễ dàng.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate("/schools")}
              className="nb-btn nb-btn-lg nb-btn-purple"
            >
              Thử đồng phục miễn phí
              <ArrowRight className="h-5 w-5" />
            </button>

            <a
              href="#how-it-works"
              className="nb-btn nb-btn-outline text-sm"
            >
              Xem cách hoạt động
            </a>
          </div>
        </div>

        {/* Right — Phone Mockup */}
        <div className="flex justify-center nb-fade-in" style={{ animationDelay: "0.3s" }}>
          <div className="relative">
            {/* Shadow glow */}
            <div className="absolute left-1/2 top-[85%] h-10 w-44 -translate-x-1/2 rounded-full bg-[#B8A9E8]/30 blur-2xl sm:h-12 sm:w-56 md:h-14 md:w-64 animate-pulse" />

            {/* Phone frame */}
            <div className="relative h-[480px] w-[240px] rounded-[30px] border-3 border-[#1A1A2E] bg-black p-2 shadow-[6px_6px_0_#1A1A2E] sm:h-[560px] sm:w-[280px] sm:rounded-[36px] md:h-[640px] md:w-[320px] md:rounded-[40px]">
              <div className="relative h-full w-full overflow-hidden rounded-[22px] bg-black sm:rounded-[26px] md:rounded-[30px]">
                {/* Dynamic Island */}
                <div className="absolute left-1/2 top-3 z-10 h-5 w-16 -translate-x-1/2 rounded-full bg-black sm:top-4 sm:h-6 sm:w-20" />

                <img
                  src="https://api.builder.io/api/v1/image/assets/TEMP/eef0ae9593f6a6296eb52342229bd158fe61eb1b?width=1808"
                  alt="Học sinh mặc đồng phục qua AI Virtual Try-On"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
