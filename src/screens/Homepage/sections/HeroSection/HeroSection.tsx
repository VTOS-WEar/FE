import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative w-full overflow-hidden py-16 lg:py-24">
      <div className="mx-auto grid max-w-[1100px] grid-cols-1 items-center gap-10 px-6 md:grid-cols-2 md:gap-8">

        {/* Left — Branding + Copy */}
        <div className="flex flex-col items-center text-center nb-stagger">
          {/* Big VTOS branding */}
          <div className="relative inline-block">
            <h1
              className="my-0 leading-[0.75] text-[clamp(9rem,18vw,20rem)] font-normal tracking-[0.005em] nb-logo-hero"
              style={{
                fontFamily: "'Gochi Hand', cursive",
                letterSpacing: "0.01em",
              }}
            >
              VTOS
            </h1>
            <span className="pointer-events-none absolute -left-1 top-3 text-xl font-black text-[#A996E2] animate-pulse sm:text-2xl">✦</span>
            <span className="pointer-events-none absolute right-4 -top-3 text-base font-black text-[#9ec0e8] nb-float-delay sm:text-xl">✧</span>
            <span className="pointer-events-none absolute -right-5 bottom-2 text-lg font-black text-[#A8D4E6] animate-pulse sm:text-xl">✦</span>
          </div>

          {/* Subtitle */}
          <h2 className="mt-2 text-2xl font-extrabold leading-[1.2] text-[#1A1A2E] sm:text-3xl">
            Thử đồng phục trực tuyến bằng AI
          </h2>

          {/* Description */}
          <p className="mt-4 max-w-[520px] text-base font-medium leading-relaxed text-[#4C5769] md:text-lg">
            Tải ảnh của bạn lên và xem đồng phục trường hiển thị ngay lập tức.
            Không cần thử trực tiếp, không mất thời gian. Phụ huynh, học sinh
            và nhà trường đều có thể sử dụng dễ dàng.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => navigate("/schools")}
              className="group relative inline-flex h-14 items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-[10px] border-2 border-[#1A1A2E] bg-gradient-to-r from-[#B8A9E8] via-[#C7BBEE] to-[#A996E2] px-6 py-3 text-base font-extrabold text-[#1A1A2E] shadow-[4px_4px_0_#1A1A2E] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[7px_7px_0_#1A1A2E] hover:brightness-110 active:translate-y-[1px] active:shadow-[2px_2px_0_#1A1A2E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A2E] focus-visible:ring-offset-2 sm:text-lg"
            >
              <span className="pointer-events-none absolute -left-10 top-0 h-full w-16 -skew-x-12 bg-white/25 blur-[1px] transition-all duration-300 group-hover:left-[105%]" />
              <span>Thử đồng phục miễn phí</span>
              <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
            </button>

            <a
              href="#how-it-works"
              className="group inline-flex h-14 items-center justify-center whitespace-nowrap rounded-[10px] border-2 border-[#1A1A2E] bg-gradient-to-r from-white to-[#F7F5FF] px-5 py-3 text-sm font-extrabold text-[#1A1A2E] shadow-[3px_3px_0_#1A1A2E] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[6px_6px_0_#1A1A2E] hover:brightness-110 active:translate-y-[1px] active:shadow-[2px_2px_0_#1A1A2E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A2E] focus-visible:ring-offset-2"
            >
              <span className="transition-colors duration-200 group-hover:text-[#312E81]">Xem cách hoạt động</span>
            </a>
          </div>
        </div>

        {/* Right — Phone Mockup */}
        <div className="flex justify-center nb-fade-in" style={{ animationDelay: "0.3s" }}>
          <div className="relative nb-phone-breathe">
            {/* Phone frame */}
            <div className="relative h-[480px] w-[240px] rounded-[30px] bg-black p-2 sm:h-[560px] sm:w-[280px] sm:rounded-[36px] md:h-[640px] md:w-[320px] md:rounded-[40px]">
              <div className="relative h-full w-full overflow-hidden rounded-[22px] bg-black sm:rounded-[26px] md:rounded-[30px]">
                {/* Dynamic Island */}
                <div className="absolute left-1/2 top-3 z-10 h-5 w-16 -translate-x-1/2 rounded-full bg-black sm:top-4 sm:h-6 sm:w-20" />

                <img
                  src="https://api.builder.io/api/v1/image/assets/TEMP/eef0ae9593f6a6296eb52342229bd158fe61eb1b?width=1808"
                  alt="Học sinh mặc đồng phục qua AI Virtual Try-On"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.04]"
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
