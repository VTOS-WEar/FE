import { Upload, Search, Sparkles } from "lucide-react";

const steps = [
  {
    number: 1,
    title: "Tải ảnh chân dung",
    description: "Chụp hoặc chọn ảnh từ thư viện. Hệ thống nhận diện dáng người tự động.",
    icon: Upload,
  },
  {
    number: 2,
    title: "Chọn đồng phục",
    description: "Duyệt kho đồng phục theo trường, cấp học và loại trang phục.",
    icon: Search,
  },
  {
    number: 3,
    title: "Nhận kết quả AI",
    description: "AI ghép đồng phục lên ảnh trong vài giây. Xem trước khi mua.",
    icon: Sparkles,
  },
];

export const FeaturesHighlightSection = (): JSX.Element => {
  return (
    <section
      id="how-it-works"
      className="nb-section-loud"
    >
      <div className="mx-auto w-full max-w-[1100px] px-4 md:px-8">
        {/* Header */}
        <header className="mb-14 text-center nb-reveal">
          <h2 className="text-3xl font-extrabold leading-[1.15] text-[#1A1A2E] md:text-4xl lg:text-[2.75rem]">
            Cách hoạt động
          </h2>
          <p className="mx-auto mt-3 max-w-[600px] text-lg font-medium leading-relaxed text-[#4C5769]">
            Ba bước đơn giản để thử đồng phục online
          </p>
        </header>

        {/* 3-step cards */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <article
                key={step.number}
                className="group nb-card-static relative bg-white px-6 pb-6 pt-12 text-center nb-reveal-pop hover:-translate-y-[6px] hover:shadow-[10px_10px_0_#1A1A2E]"
                style={{ animationDelay: `${index * 140}ms` }}
              >
                {/* Step number badge */}
                <div className="absolute left-1/2 top-0 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border-3 border-[#1A1A2E] bg-[#B8A9E8] shadow-[3px_3px_0_#1A1A2E] transition-transform duration-300 group-hover:scale-105">
                  <span className="text-lg font-extrabold text-[#1A1A2E]">{step.number}</span>
                </div>

                {/* Icon */}
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border-3 border-[#1A1A2E] bg-[#EDE9FE] shadow-[3px_3px_0_#1A1A2E] transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-[-6deg]">
                  <Icon className="nb-icon-wiggle h-7 w-7 text-[#1A1A2E] transition-transform duration-300 group-hover:scale-110" strokeWidth={2.5} />
                </div>

                <h3 className="text-xl font-extrabold leading-tight text-[#1A1A2E]">
                  {step.title}
                </h3>

                <p className="mt-2 text-sm font-medium leading-[1.5] text-[#4C5769]">
                  {step.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
