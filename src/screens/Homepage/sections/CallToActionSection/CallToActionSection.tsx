import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const CallToActionSection = (): JSX.Element => {
  const navigate = useNavigate();

  return (
    <section className="nb-section-loud py-10 lg:py-12">
      <div className="mx-auto w-full max-w-[800px] px-4 text-center nb-reveal">
        <h2 className="text-3xl font-extrabold leading-[1.15] text-gray-900 md:text-4xl lg:text-[2.75rem]">
          Sẵn sàng thử đồng phục?
        </h2>

        <p className="mx-auto mt-3 max-w-[500px] text-lg font-medium leading-relaxed text-gray-600 md:text-xl">
          Miễn phí. Không cần đăng ký. Kết quả trong vài giây.
        </p>

        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => navigate("/schools")}
            className="group relative inline-flex h-14 items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-[10px] border border-gray-200 bg-gradient-to-r from-[#B8A9E8] via-[#C7BBEE] to-[#A996E2] px-6 py-3 text-base font-extrabold text-gray-900 shadow-soft-md transition-all duration-200 hover:-translate-y-[2px] hover:shadow-soft-md hover:brightness-110 active:translate-y-[1px] active:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 focus-visible:ring-offset-2 sm:text-lg"
          >
            <span className="pointer-events-none absolute -left-10 top-0 h-full w-16 -skew-x-12 bg-white/25 blur-[1px] transition-all duration-300 group-hover:left-[105%]" />
            <span>Bắt đầu thử ngay</span>
            <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
          </button>

          <button
            type="button"
            onClick={() => navigate("/contact-partnership")}
            className="group inline-flex h-14 items-center justify-center whitespace-nowrap rounded-[10px] border border-gray-200 bg-gradient-to-r from-white to-[#F7F5FF] px-5 py-3 text-base font-extrabold text-gray-900 shadow-soft-sm transition-all duration-200 hover:-translate-y-[2px] hover:shadow-soft-md hover:brightness-110 active:translate-y-[1px] active:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 focus-visible:ring-offset-2"
          >
            Đăng ký đối tác
          </button>
        </div>
      </div>
    </section>
  );
};
