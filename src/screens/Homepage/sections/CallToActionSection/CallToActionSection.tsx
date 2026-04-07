import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const CallToActionSection = (): JSX.Element => {
  const navigate = useNavigate();

  return (
    <section className="nb-section-loud">
      <div className="mx-auto w-full max-w-[800px] px-4 text-center nb-reveal">
        <h2 className="text-3xl font-extrabold leading-[1.15] text-[#1A1A2E] md:text-4xl lg:text-[2.75rem]">
          Sẵn sàng thử đồng phục?
        </h2>

        <p className="mx-auto mt-4 max-w-[500px] text-lg font-medium leading-relaxed text-[#4C5769] md:text-xl">
          Miễn phí. Không cần đăng ký. Kết quả trong vài giây.
        </p>

        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => navigate("/schools")}
            className="group relative inline-flex h-14 items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-[10px] border-2 border-[#1A1A2E] bg-gradient-to-r from-[#B8A9E8] via-[#C7BBEE] to-[#A996E2] px-6 py-3 text-base font-extrabold text-[#1A1A2E] shadow-[4px_4px_0_#1A1A2E] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[7px_7px_0_#1A1A2E] hover:brightness-110 active:translate-y-[1px] active:shadow-[2px_2px_0_#1A1A2E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A2E] focus-visible:ring-offset-2 sm:text-lg"
          >
            <span className="pointer-events-none absolute -left-10 top-0 h-full w-16 -skew-x-12 bg-white/25 blur-[1px] transition-all duration-300 group-hover:left-[105%]" />
            <span>Bắt đầu thử ngay</span>
            <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
          </button>

          <button
            type="button"
            onClick={() => navigate("/contact-partnership")}
            className="group inline-flex h-14 items-center justify-center whitespace-nowrap rounded-[10px] border-2 border-[#1A1A2E] bg-gradient-to-r from-white to-[#F7F5FF] px-5 py-3 text-base font-extrabold text-[#1A1A2E] shadow-[3px_3px_0_#1A1A2E] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[6px_6px_0_#1A1A2E] hover:brightness-110 active:translate-y-[1px] active:shadow-[2px_2px_0_#1A1A2E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A2E] focus-visible:ring-offset-2"
          >
            Đăng ký đối tác
          </button>
        </div>
      </div>
    </section>
  );
};
