import { Card, CardContent } from "../../../../components/ui/card";

export const ProductShowcaseSection = (): JSX.Element => {
  const showcaseImages = [
    {
      src: "https://c.animaapp.com/mjxt3t8wNP0otU/img/image--w-full-.png",
      bgClass: "bg-white",
      borderClass: "border",
      leftOffset: "left-[-312px]",
      topOffset: "top-0",
    },
    {
      src: "https://c.animaapp.com/mjxt3t8wNP0otU/img/image--w-full--1.png",
      bgClass:
        "bg-[linear-gradient(135deg,rgba(239,246,255,1)_0%,rgba(250,245,255,1)_100%)]",
      borderClass: "border-blue-200",
      leftOffset: "left-[-247px]",
      topOffset: "top-[-15px]",
    },
  ];

  return (
    <section className="w-full flex justify-center py-20 translate-y-[-1rem] animate-fade-in opacity-0">
      <div className="flex flex-col items-center gap-20 max-w-[1307px] w-full px-4">
        <header className="relative w-full max-w-[1311px]">
          <h2 className="[font-family:'Baloo-Regular',Helvetica] font-normal text-5xl text-center tracking-[0] leading-[67.2px] mb-4 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
            <span className="text-[#8b008be6]">Thử Nhanh – Chuẩn</span>
            <span className="text-[#332623]"> – Không Cần Studio</span>
          </h2>

          <p className="[font-family:'Baloo_2',Helvetica] font-normal text-[#332623] text-[32px] text-center tracking-[0] leading-[41.6px] max-w-[1014px] mx-auto translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms]">
            Chỉ với 3 bước: Tải ảnh chân dung - Chọn mẫu đồng phục - Nhận kết
            quả
          </p>
        </header>

        <div className="flex flex-wrap items-start gap-12 w-full max-w-[1232px] justify-center translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:600ms]">
          {showcaseImages.map((image, index) => (
            <Card
              key={index}
              className={`w-full max-w-[592px] h-[592px] rounded-3xl overflow-hidden border-solid ${image.borderClass} shadow-[0px_0px_0px_transparent,0px_0px_0px_transparent,0px_10px_15px_-3px_#0000001a,0px_4px_6px_-4px_#0000001a] ${image.bgClass}`}
            >
              <CardContent className="p-0 h-full relative">
                <div
                  className={`relative ${image.topOffset} ${image.leftOffset} w-[1217px] h-[622px] [background:url(${image.src})_50%_50%_/_cover]`}
                  style={{
                    backgroundImage: `url(${image.src})`,
                    backgroundPosition: "50% 50%",
                    backgroundSize: "cover",
                  }}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
