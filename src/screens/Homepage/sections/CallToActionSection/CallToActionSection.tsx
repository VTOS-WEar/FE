import { Card, CardContent } from "../../../../components/ui/card";

export const CallToActionSection = (): JSX.Element => {
  const steps = [
    {
      number: 1,
      title: "Tải ảnh của bạn",
      content: (
        <div className="flex flex-col items-center gap-3">
          <img
            className="w-16 h-16"
            alt="Upload icon"
            src="https://c.animaapp.com/mjxt3t8wNP0otU/img/div--w-12-.svg"
          />
          <p className="text-center text-sm font-medium text-gray-900 leading-5">
            Đặt ảnh của bạn vào khung hình
          </p>
        </div>
      ),
      height: "h-[214px]",
      gradient:
        "bg-[linear-gradient(135deg,rgba(59,130,246,1)_0%,rgba(37,99,235,1)_100%)]",
    },
    {
      number: 2,
      title: "Chọn học sinh cần thử",
      content: (
        <div className="flex flex-col items-center justify-center gap-2.5">
          <img
            className="w-40 h-12"
            alt="Uniform selection"
            src="https://c.animaapp.com/mjxt3t8wNP0otU/img/div--space-y-2-.svg"
          />
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm font-medium text-gray-900 text-center leading-5 whitespace-nowrap">
              Chọn học sinh để thử đồ
            </p>
            <p className="text-xs font-normal text-gray-500 leading-4 whitespace-nowrap [font-family:'Baloo_2',Helvetica]">
              Nhấn vào chọn những học sinh hợp lệ
            </p>
          </div>
        </div>
      ),
      height: "h-[136px]",
      gradient:
        "bg-[linear-gradient(135deg,rgba(168,85,247,1)_0%,rgba(147,51,234,1)_100%)]",
      hasButton: true,
    },
  ];

  return (
    <section className="w-full rounded-[22px] bg-white px-4 py-8 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms] md:px-6 md:py-10 lg:px-8 lg:py-12">
      <div className="mx-auto w-full max-w-[1050px] bg-[linear-gradient(135deg,#fff_0%,#f1f5f9_100%)] rounded-[22px] px-4 py-10">
        <header className="mx-auto mb-8 w-full max-w-[1100px] text-center md:mb-10">
          <h2 className="[font-family:'Baloo_2',Helvetica] text-3xl font-bold leading-[1.2] text-[#332623] md:text-4xl">
            <span className="text-[#8b008b]">Thử đồ</span>
            <span> với nhiều loại đồng phục khác nhau</span>
          </h2>
          <p className="mt-2 [font-family:'Baloo_2',Helvetica] text-xl font-medium leading-[1.3] text-[#3f3331] md:text-xl">
            Chọn ngay đồng phục phù hợp với bạn → Tạo nên diện mạo hoàn chỉnh
            của bạn
          </p>
        </header>

        <Card className="w-full overflow-hidden rounded-[12px] border border-[#d8dde6] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.08)] translate-y-[-1rem] animate-fade-up opacity-0 [--animation-delay:400ms]">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:gap-5">
              <div className="w-full rounded-[14px] border border-[#d8dde6]  bg-[linear-gradient(135deg,#fff_0%,#f1f5f9_100%)] p-4 sm:p-5 lg:max-w-[390px]">
                <div className="flex flex-col items-start gap-5">
                  {steps.map((step, index) => (
                    <div key={step.number} className="w-full py-4">
                      <div className="relative w-full pt-10">
                        <div
                          className={`w-full ${step.height} rounded-[14px] border-2 border-dashed border-[#d96ede] bg-white flex items-center justify-center`}
                        >
                          {step.content}
                        </div>

                        <div className="absolute left-1/2 top-0 -translate-x-1/2 flex w-fit items-center gap-2 bg-[linear-gradient(135deg,#fff_0%,#f1f5f9_100%)] px-4">
                          <div
                            className={`flex items-center justify-center w-6 h-6 rounded-full ${step.gradient}`}
                          >
                            <span className="text-sm font-bold text-white [font-family:'Manrope',Helvetica] tracking-[-0.40px] leading-5">
                              {step.number}
                            </span>
                          </div>
                          <h3 className="[font-family:'Baloo_2',Helvetica] text-xl text-center font-bold leading-7 text-gray-900 whitespace-nowrap">
                            {step.title}
                          </h3>
                        </div>

                        {step.hasButton && (
                          <div className="mt-4 flex h-10 w-full items-center justify-center rounded-full bg-[#b178c5]">
                            <span className="[font-family:'Baloo_2',Helvetica] text-lg font-semibold leading-7 text-white/95">
                              Tạo giao diện hoàn chỉnh
                            </span>
                          </div>
                        )}
                      </div>

                      {index < steps.length - 1 && (
                        <div className="my-5 h-px w-full bg-[linear-gradient(90deg,rgba(0,0,0,0)_0%,rgba(193,201,214,0.8)_50%,rgba(0,0,0,0)_100%)]" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative flex min-h-[414px] flex-1 items-center justify-center rounded-[14px] border border-[#d8dde6]  bg-[linear-gradient(135deg,#fff_0%,#f1f5f9_100%)] lg:min-h-[430px]">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#cfd6e2] bg-[#eff3f9] shadow-[0_2px_4px_rgba(15,23,42,0.08)]">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#8b008b26]">
                      <div className="h-3.5 w-3.5 rounded-full bg-[#8b008b]" />
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-0.5">
                    <h3 className="[font-family:'Baloo_2',Helvetica] text-[31px] font-medium leading-9 text-gray-900 whitespace-nowrap">
                      Kết quả của bạn
                    </h3>
                    <p className="[font-family:'Baloo_2',Helvetica] text-base font-normal leading-6 text-[#6b7280] whitespace-nowrap">
                      Kết quả của bạn sẽ xuất hiện ở đây
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
