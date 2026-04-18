import { ArrowRight, CheckCircle2, Image as ImageIcon, Shirt, Sparkles, Clock3, Lightbulb, XCircle, WandSparkles, Upload, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GuestLayout } from "@/components/layout/GuestLayout";

export function HowItWorks() {
  const navigate = useNavigate();
  const stepTones = ["bg-[#FFF6E9]", "bg-[#EEF4FF]", "bg-[#F4EEFF]"] as const;
  const quickTones = ["bg-[#FFF6E9]", "bg-[#EEF4FF]", "bg-[#F4EEFF]", "bg-[#ECFFE8]"] as const;
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
  ] as const;
  const quickFlow = [
    { Icon: ImageIcon, title: "Chuẩn bị ảnh", desc: "Ảnh rõ mặt, toàn thân, ánh sáng tự nhiên." },
    { Icon: Shirt, title: "Chọn đồng phục", desc: "Lọc theo trường, cấp học, loại trang phục." },
    { Icon: Sparkles, title: "AI xử lý", desc: "Ghép đồng phục với tỷ lệ và form dáng." },
    { Icon: CheckCircle2, title: "Lưu & đặt hàng", desc: "So sánh kết quả rồi mới quyết định mua." },
  ];
  const quickIconTones = ["bg-[#FFDFA8]", "bg-[#CFE0FF]", "bg-[#DCD1FF]", "bg-[#D8F7CF]"] as const;
  const photoTips = [
    { title: "Nên làm", icon: Lightbulb, points: ["Đứng thẳng, thấy rõ vai và thân người", "Nền đơn giản, tránh quá nhiều chi tiết", "Ảnh sáng đủ, không ngược sáng"] },
    { title: "Nên tránh", icon: XCircle, points: ["Ảnh quá tối hoặc mờ", "Che khuất cơ thể bởi balo/áo khoác", "Góc chụp quá nghiêng làm sai tỷ lệ"] },
  ];
  const processingInfo = [
    { label: "Thời gian xử lý", value: "5-10 giây", Icon: Clock3 },
    { label: "Độ chính xác trung bình", value: "98%", Icon: WandSparkles },
    { label: "Số mẫu khả dụng", value: "200+", Icon: Shirt },
  ];

  return (
    <GuestLayout bgColor="#FFF4E8">
      <div className="relative mx-auto w-full max-w-[1100px] px-6 py-8 md:py-10">
        <span className="pointer-events-none absolute left-2 top-2 text-2xl md:text-3xl">✦</span>
        <span className="pointer-events-none absolute right-6 top-8 text-2xl rotate-12 md:text-3xl">✸</span>
        <span className="pointer-events-none absolute bottom-8 right-3 text-2xl -rotate-12 md:text-3xl">✧</span>
        {/* HERO */}
        <header className="mx-auto max-w-[820px] text-center nb-reveal-pop">
          <span className="inline-flex rounded-full border border-gray-200 bg-[#FFF1CC] px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.14em] text-gray-900 shadow-sm">
            Hướng dẫn Try-On
          </span>
          <h1 className="mt-3 text-3xl font-extrabold leading-[1.15] text-gray-900 md:text-4xl lg:text-[2.75rem]">
            Cách thử đồng phục online bằng AI
          </h1>
          <p className="mx-auto mt-3 max-w-[680px] text-base font-medium leading-relaxed text-gray-600 md:text-lg">
            Trang này hướng dẫn đúng quy trình để bạn có kết quả Try-On đẹp: chuẩn bị ảnh, chọn đồng phục và xem kết quả trong vài giây.
          </p>

          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate("/schools")}
              className="group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-[12px] border-2 border-gray-200 bg-gradient-to-r from-[#B8A9E8] via-[#C7BBEE] to-[#98BFF0] px-6 text-base font-extrabold text-gray-900 shadow-soft-md transition-all duration-200 hover:-translate-y-[2px] hover:shadow-soft-lg hover:brightness-110 active:translate-y-[1px] active:shadow-soft-sm"
            >
              <span className="pointer-events-none absolute -left-10 top-0 h-full w-16 -skew-x-12 bg-white/25 blur-[1px] transition-all duration-300 group-hover:left-[105%]" />
              <span>Bắt đầu thử ngay</span>
              <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
            <button
              type="button"
              onClick={() => navigate("/products")}
              className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-[12px] border-2 border-gray-200 bg-white px-6 text-sm font-extrabold text-gray-900 shadow-soft-md transition-all duration-200 hover:-translate-y-[2px] hover:shadow-soft-md hover:bg-[#FFF9E8] active:translate-y-[1px] active:shadow-sm"
            >
              Xem kho đồng phục
            </button>
          </div>
        </header>

        {/* STEPS */}
        <div className="mt-6">
          <section>
            <div className="rounded-2xl border-2 border-gray-200 bg-[#FFFDF8] p-4 shadow-soft-lg md:p-5">
              <h2 className="text-xl font-extrabold text-gray-900 md:text-2xl">
                3 bước để Try-On
              </h2>
              <p className="mt-2 text-sm font-medium text-gray-600 md:text-base">
                Làm theo đúng thứ tự để kết quả tự nhiên và đúng form.
              </p>

              <div className="mt-3 space-y-2.5">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <article
                      key={step.number}
                      className={`group nb-reveal-pop relative overflow-hidden rounded-2xl border-2 border-gray-200 p-3.5 shadow-soft-md ${stepTones[index % stepTones.length]}`}
                      style={{ animationDelay: `${index * 140}ms` }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border-3 border-gray-200 bg-purple-400 shadow-soft-sm transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-[-4deg]">
                          <span className="text-lg font-extrabold text-gray-900">{step.number}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl border-3 border-gray-200 bg-violet-50 shadow-soft-sm transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-[-6deg]">
                              <Icon className="nb-icon-wiggle h-5 w-5 text-gray-900" strokeWidth={2.5} />
                            </div>
                            <h3 className="truncate text-lg font-extrabold text-gray-900">
                              {step.title}
                            </h3>
                          </div>
                          <p className="mt-1.5 text-sm font-medium leading-relaxed text-gray-600">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

        {/* TIPS + STATS ROW */}
        <section className="mt-4 grid grid-cols-1 items-stretch gap-3 lg:grid-cols-12">
          <article className="relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-[#FFF6CC] via-[#FFF9EE] to-[#ECE8FF] px-5 py-4 shadow-soft-lg ring-2 ring-[#C8E44D]/55 lg:col-span-8">
            <span className="pointer-events-none absolute right-3 top-2 text-xl">✨</span>
            <h3 className="inline-flex rounded-full border-2 border-gray-200 bg-[#FFDE59] px-3.5 py-1 text-base font-extrabold uppercase tracking-[0.08em] text-gray-900 shadow-soft-sm">
              Mẹo để ảnh đẹp
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-3">
              {photoTips.map((block, idx) => (
                <div
                  key={block.title}
                  className={`relative rounded-xl border-2 border-gray-200 px-4 py-3 shadow-soft-md transition-all duration-200 hover:-translate-y-[2px] hover:shadow-soft-md ${
                    idx === 0
                      ? "bg-gradient-to-r from-[#E8FFE1] to-[#F4FFEE]"
                      : "bg-gradient-to-r from-[#FFECEF] to-[#FFF6F8]"
                  }`}
                >
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 shadow-sm">
                    <block.icon className="h-3.5 w-3.5 text-gray-900" />
                    <span className="text-xs font-extrabold text-gray-900">{block.title}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {block.points.map((point) => (
                      <li key={point} className="text-sm font-medium leading-snug text-gray-600">
                        • {point}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </article>

          <div className="grid grid-cols-1 gap-3 lg:col-span-4 lg:h-full">
            {processingInfo.map((item, idx) => (
              <article
                key={item.label}
                className="nb-reveal-pop rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 text-center shadow-soft-md lg:flex-1"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-violet-50 shadow-sm">
                  <item.Icon className="h-5 w-5 text-gray-900" />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-gray-500">{item.label}</p>
                <p className="mt-0.5 text-xl font-extrabold text-gray-900">{item.value}</p>
              </article>
            ))}
          </div>
        </section>

        {/* QUICK FLOW STRIP */}
        <section className="mt-6 rounded-2xl border-2 border-gray-200 bg-[#FFFDF8] p-4 shadow-soft-lg md:p-5">
          <h2 className="text-lg font-extrabold text-gray-900 md:text-xl">Checklist nhanh</h2>
          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
            {quickFlow.map((item, idx) => (
              <div
                key={item.title}
                className={`group nb-reveal-pop rounded-xl border border-gray-200 px-3.5 py-3 shadow-soft-sm ${quickTones[idx % quickTones.length]}`}
                style={{ animationDelay: `${idx * 110}ms` }}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 shadow-sm transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-[-6deg] ${quickIconTones[idx % quickIconTones.length]}`}>
                    <item.Icon className="h-4.5 w-4.5 text-gray-900" strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-gray-900">{item.title}</p>
                    <p className="mt-0.5 text-sm font-medium text-gray-600">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </GuestLayout>
  );
}

