import { Button } from "../../../../components/ui/button";

export const FeaturesHighlightSection = (): JSX.Element => {
  return (
    <section className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-[50px] w-full px-4 py-8">
      <img
        className="w-[37px] h-[65px] flex-shrink-0 opacity-0 animate-fade-in [--animation-delay:0ms] hidden lg:block"
        alt="Vector"
        src="https://c.animaapp.com/mjxt3t8wNP0otU/img/vector-6.svg"
      />

      <div className="flex flex-col items-center lg:items-end gap-5 w-full max-w-[603px] opacity-0 animate-fade-in [--animation-delay:200ms]">
        <div className="relative w-full">
          <h1 className="w-full [text-shadow:0px_4px_4px_#00000040] [font-family:'Gochi_Hand',Helvetica] font-normal text-[#a87af0] text-[120px] lg:text-[300px] text-center tracking-[0] leading-[1.2] lg:leading-[346.2px] opacity-0 animate-fade-in [--animation-delay:400ms]">
            VTOS
          </h1>

          <h2 className="mt-[-30px] lg:mt-[-76px] w-full [font-family:'Baloo_2',Helvetica] font-semibold text-[#332623] text-2xl lg:text-4xl text-center tracking-[0] leading-[1.4] lg:leading-[50.4px] opacity-0 animate-fade-in [--animation-delay:600ms]">
            Thử đồng phục trực tuyến bằng AI
          </h2>

          <p className="mt-[10px] px-4 lg:px-[17px] w-full [font-family:'Baloo_2',Helvetica] font-normal text-[#332623] text-base lg:text-xl text-center tracking-[0] leading-[1.6] lg:leading-[26px] opacity-0 animate-fade-in [--animation-delay:800ms]">
            Tải ảnh của bạn lên và xem đồng phục trường hiển thị ngay lập tức.
            Không cần thử trực tiếp, không mất thời gian. Phụ huynh, học sinh và
            nhà trường đều có thể sử dụng dễ dàng.
          </p>
        </div>

        <div className="relative flex w-[298px] h-[56.51px] items-center justify-center opacity-0 animate-fade-in [--animation-delay:1000ms]">
          <img
            className="absolute top-[-70px] left-[-70px] w-[458px] h-[223px] pointer-events-none"
            alt="Frame"
            src="https://c.animaapp.com/mjxt3t8wNP0otU/img/frame-10.svg"
          />

          <Button className="relative w-[272px] h-auto bg-transparent hover:bg-transparent border-0 shadow-none p-0">
            <span className="[font-family:'Baloo-Regular',Helvetica] font-normal text-white-100 text-2xl text-center tracking-[0] leading-6">
              Bắt đầu thử ngay
            </span>
          </Button>
        </div>
      </div>

      <img
        className="w-[250px] lg:w-[431px] h-auto flex-shrink-0 opacity-0 animate-fade-in [--animation-delay:1200ms]"
        alt="Place YOUR SCREEN"
        src="https://c.animaapp.com/mjxt3t8wNP0otU/img/----place-your-screen-here.svg"
      />

      <img
        className="w-[37px] h-[65px] flex-shrink-0 opacity-0 animate-fade-in [--animation-delay:1400ms] hidden lg:block"
        alt="Vector"
        src="https://c.animaapp.com/mjxt3t8wNP0otU/img/vector-15.svg"
      />
    </section>
  );
};
