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
            className="nb-btn nb-btn-lg nb-btn-purple"
          >
            Bắt đầu thử ngay
            <ArrowRight className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => navigate("/contact-partnership")}
            className="nb-btn nb-btn-outline text-base"
          >
            Đăng ký đối tác
          </button>
        </div>
      </div>
    </section>
  );
};
