import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";

const uniformCategories = [
  {
    image: "https://c.animaapp.com/mjxt3t8wNP0otU/img/hstieuhoc1-1.png",
    label: "Tiểu học",
    labelLeft: "left-[103px]",
  },
  {
    image: "https://c.animaapp.com/mjxt3t8wNP0otU/img/hstieuhoc1-1-1.png",
    label: "THCS",
    labelLeft: "left-[118px]",
  },
  {
    image: "https://c.animaapp.com/mjxt3t8wNP0otU/img/hstieuhoc1-1-2.png",
    label: "THPT",
    labelLeft: "left-[119px]",
  },
  {
    image: "https://c.animaapp.com/mjxt3t8wNP0otU/img/hstieuhoc1-1-3.png",
    label: "Thể dục",
    labelLeft: "left-[106px]",
  },
];

export const CustomUniformOptionsSection = (): JSX.Element => {
  return (
    <section className="flex flex-col w-full items-center gap-[82px] py-12">
      <header className="w-full max-w-[1311px] px-4">
        <h2 className="w-full [font-family:'Baloo-Regular',Helvetica] font-normal text-5xl text-center tracking-[0] leading-[67.2px] mb-4 translate-y-[-1rem] animate-fade-in opacity-0">
          <span className="text-[#332623]">Kho Đồng Phục</span>
          <span className="text-[#8b008be6]"> Đầy Đủ Cấp Học</span>
        </h2>

        <p className="w-full max-w-[1014px] mx-auto [font-family:'Baloo_2',Helvetica] font-normal text-[#332623] text-[32px] text-center tracking-[0] leading-[41.6px] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
          Khám phá cách AI giúp bạn thử đồng phục nhanh chóng
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 w-full max-w-[1332px] px-4 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms]">
        {uniformCategories.map((category, index) => (
            <Card
              key={index}
              className="w-full max-w-[318px] mx-auto h-[318px] bg-gray-200 rounded-[20px] shadow-[0px_4px_4px_#00000040] overflow-hidden border-0 transition-transform hover:scale-105 duration-300"
            >
            <CardContent className="p-0 relative w-full h-full">
              <img
                className="absolute top-2.5 left-2.5 w-[298px] h-[298px] rounded-[20px] object-cover"
                alt={category.label}
                src={category.image}
              />

              <div
                className={`inline-flex px-[15px] py-[5px] top-[273px] ${category.labelLeft} bg-gray-200 rounded-[20px_20px_0px_0px] items-center justify-center gap-2.5 absolute`}
              >
                <span className="[font-family:'Baloo_2',Helvetica] font-semibold text-black text-[22px] text-center tracking-[0] leading-[normal]">
                  {category.label}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button className="h-auto w-full max-w-[382px] px-[45px] py-[7px] rounded-2xl shadow-[0px_10px_60px_#288eaecc,0px_20px_60px_#6276e033,-20px_-20px_50px_#b574de66,inset_0px_0px_10px_#ffffff80] [background:radial-gradient(50%_50%_at_50%_17%,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.04)_100%),radial-gradient(50%_50%_at_105%_-16%,rgba(19,229,213,0.5)_20%,rgba(19,229,213,0.06)_71%),radial-gradient(50%_50%_at_20%_-23%,rgba(29,82,160,1)_0%,rgba(29,82,160,0.18)_100%),radial-gradient(50%_50%_at_34%_109%,rgba(102,129,226,0.81)_0%,rgba(102,129,226,0)_95%),linear-gradient(0deg,rgba(238,249,255,1)_0%,rgba(238,249,255,1)_100%)] hover:opacity-90 transition-opacity duration-300 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:600ms]">
        <span className="[font-family:'Baloo-Regular',Helvetica] font-normal text-white text-[32px] text-center tracking-[0] leading-[normal]">
          Xem tất cả sản phẩm
        </span>
      </Button>
    </section>
  );
};
