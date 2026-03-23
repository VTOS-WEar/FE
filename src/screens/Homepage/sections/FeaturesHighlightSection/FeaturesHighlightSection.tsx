import { CheckCircle2, ImageIcon, Shirt } from "lucide-react";

export const FeaturesHighlightSection = (): JSX.Element => {
  const features = [
    {
      title: "Thử nhanh bằng AI",
      description:
        "Tải ảnh chân dung và hệ thống tự tạo hình bạn mặc đồng phục trong vài giây.",
      icon: ImageIcon,
      iconBg: "bg-[#3f6fe8]",
      cardBg: "bg-[#e9f0ff]",
    },
    {
      title: "Hơn 200 mẫu đồng phục",
      description:
        "Hỗ trợ nhiều trường khác nhau, đầy đủ mẫu áo-quần-váy theo từng cấp học.",
      icon: Shirt,
      iconBg: "bg-[#6b3ce5]",
      cardBg: "bg-[#f2ebff]",
    },
    {
      title: "AI nhận diện dáng người chuẩn xác",
      description:
        "Dự đoán form mặc và kích cỡ trực quan trực tiếp trên trình duyệt.",
      icon: CheckCircle2,
      iconBg: "bg-[#27c8c3]",
      cardBg: "bg-[#eafbf5]",
    },
  ];

  return (
    <section className="w-full bg-gradient-to-br from-purple-50 via-white to-blue-50 px-4 py-12 md:px-8 md:py-16">
      <div className="mx-auto grid w-full max-w-[980px] grid-cols-1 justify-items-center gap-5 md:grid-cols-2 md:gap-6 xl:grid-cols-3 xl:gap-7">
        {features.map((feature, index) => {
          const Icon = feature.icon;

          return (
            <article
              key={feature.title}
              className={`relative w-full max-w-[240px] min-h-[180px] rounded-[24px] px-4 pb-4 pt-8 text-center shadow-[0_6px_12px_rgba(0,0,0,0.22)] sm:max-w-[250px] sm:min-h-[195px] sm:px-5 sm:pb-5 sm:pt-9 md:max-w-[280px] md:min-h-[210px] hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${feature.cardBg} ${
                index === 2 ? "md:col-span-2 xl:col-span-1" : ""
              }`}
            >
              <div
                className={`absolute left-1/2 top-0 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-none text-white shadow-[0_2px_8px_rgba(0,0,0,0.16)] sm:h-16 sm:w-16 ${feature.iconBg}`}
              >
                <Icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={3} />
              </div>

              <h3 className="[font-family:'Baloo_2',Helvetica] pt-4 text-lg font-bold leading-[1.25] text-[#332623] sm:text-xl">
                {feature.title}
              </h3>

              <p className="mt-2.5 [font-family:'Baloo_2',Helvetica] text-sm font-medium leading-[1.35] text-[#3f3331] sm:mt-3 sm:text-base">
                {feature.description}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
};
