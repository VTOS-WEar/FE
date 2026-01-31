import { Card, CardContent } from "../../../../components/ui/card";

const features = [
  {
    icon: "https://c.animaapp.com/mjxt3t8wNP0otU/img/frame-7-2.svg",
    bgColor: "bg-[#e9f0ff]",
    title: "Thử nhanh bằng AI",
    description:
      "Tải ảnh chân dung và hệ thống tự tạo hình bạn mặc đồng phục trong vài giây.",
    animationDelay: "0ms",
  },
  {
    icon: "https://c.animaapp.com/mjxt3t8wNP0otU/img/frame-7-1.svg",
    bgColor: "bg-[#f2ebff]",
    title: "Hơn 200 mẫu đồng phục",
    description:
      "Hỗ trợ nhiều trường khác nhau, đầy đủ mẫu áo–quần–váy theo từng cấp học.",
    animationDelay: "200ms",
  },
  {
    icon: "https://c.animaapp.com/mjxt3t8wNP0otU/img/frame-7-3.svg",
    bgColor: "bg-[#eafbf5]",
    title: "AI nhận diện dáng người chuẩn xác",
    description:
      "Dự đoán form mặc và kích cỡ trực quan trực tiếp trên trình duyệt.",
    animationDelay: "400ms",
  },
];

export const QuickSelectionSection = (): JSX.Element => {
  return (
    <section className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-[70px] w-full px-4 py-8">
      {features.map((feature, index) => (
        <article
          key={index}
          className="relative w-full max-w-[305px] h-[263px] translate-y-[-1rem] animate-fade-in opacity-0"
          style={
            {
              "--animation-delay": feature.animationDelay,
            } as React.CSSProperties
          }
        >
          <Card
            className={`${feature.bgColor} rounded-[30px] shadow-[0px_4px_4px_#0000006b] border-0 mt-[30px] h-[233px]`}
          >
            <CardContent className="flex flex-col items-center justify-center gap-2.5 px-[15px] py-2.5 h-full">
              <h3 className="flex items-center justify-center w-[275px] [font-family:'Baloo-Regular',Helvetica] font-normal text-[#332623] text-xl text-center tracking-[0] leading-[26px]">
                {feature.title}
              </h3>
              <p className="flex items-center justify-center w-[275px] [font-family:'Baloo_2',Helvetica] font-normal text-[#332623] text-xl text-center tracking-[0] leading-[26px]">
                {feature.description}
              </p>
            </CardContent>
          </Card>
          <img
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[60px] h-[60px]"
            alt={feature.title}
            src={feature.icon}
          />
        </article>
      ))}
    </section>
  );
};
