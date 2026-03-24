import { Card, CardContent } from "../../../../components/ui/card";

export const ProductShowcaseSection = (): JSX.Element => {
  const showcaseImages = [
    {
      id: "original-image",
      src: "https://api.builder.io/api/v1/image/assets/TEMP/6150de8fdb5f524f53156fc41728708d3d4ce15e?width=2434s",
      caption: "Ảnh gốc của bạn",
      delayClass: "[--animation-delay:0ms]",
    },
    {
      id: "after-tryon-image",
      src: "https://i.ibb.co/Pvscprsd/Image-w-full.png",
      caption: "Sau khi thử đồng phục ✨",
      delayClass: "[--animation-delay:180ms]",
    },
  ];

  return (
    <section id="how-it-works" className="w-full bg-white py-12 md:py-16">
      <div className="mx-auto w-full max-w-[1300px] px-4 md:px-8">
        <header className="mx-auto max-w-[1100px] text-center">
          <h2 className="[font-family:'Baloo_2',Helvetica] text-3xl font-bold leading-[1.2] text-[#332623] md:text-4xl">
            <span className="text-[#9323a6]">Thử Nhanh - Chuẩn</span>
            <span> - Không Cần Studio</span>
          </h2>

          <p className="mt-2 [font-family:'Baloo_2',Helvetica] text-xl font-medium leading-[1.3] text-[#3f3331] md:text-xl">
            Chỉ với 3 bước: Tải ảnh chân dung - Chọn mẫu đồng phục - Nhận kết quả
          </p>
        </header>

        <div className="mx-auto mt-12 grid w-fit grid-cols-2 gap-10 md:gap-10">
          {showcaseImages.map((image) => (
            <div
              key={image.id}
              className={`group w-[44vw] max-w-[430px] min-w-[150px] translate-y-[-1rem] animate-fade-in opacity-0 ${image.delayClass}`}
            >
              <Card className="overflow-hidden rounded-[24px] border border-[#d8d8e2] bg-white shadow-[0_6px_14px_rgba(0,0,0,0.18)] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.24)]">
                <CardContent className="p-0">
                  <img
                    src={image.src}
                    alt={image.caption}
                    className="h-[420px] w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </CardContent>
              </Card>
             
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
