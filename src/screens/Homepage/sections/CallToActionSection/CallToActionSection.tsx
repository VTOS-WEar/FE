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
      title: "Chọn đồng phục",
      content: (
        <div className="flex flex-col items-center justify-center gap-2.5">
          <img
            className="w-40 h-12"
            alt="Uniform selection"
            src="https://c.animaapp.com/mjxt3t8wNP0otU/img/div--space-y-2-.svg"
          />
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm font-medium text-gray-900 text-center leading-5 whitespace-nowrap">
              Chọn đồng phục của trường bạn
            </p>
            <p className="text-xs font-normal text-gray-500 leading-4 whitespace-nowrap [font-family:'Baloo_2',Helvetica]">
              Nhấp vào hoặc thả tệp
            </p>
          </div>
        </div>
      ),
      height: "h-[154px]",
      gradient:
        "bg-[linear-gradient(135deg,rgba(168,85,247,1)_0%,rgba(147,51,234,1)_100%)]",
      hasButton: true,
    },
  ];

  return (
    <section className="relative w-full rounded-3xl shadow-[inset_0px_1px_0px_#ffffff66,inset_0px_-1px_0px_#0f172a0d,0px_20px_40px_#0f172a0a] bg-[linear-gradient(135deg,rgba(248,250,252,1)_0%,rgba(241,245,249,1)_50%,rgba(226,232,240,1)_100%)] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
      <div className="absolute top-10 left-[308px] w-96 h-96 rounded-full blur-[32px] bg-[linear-gradient(135deg,rgba(226,232,240,0.05)_0%,rgba(219,234,254,0.05)_100%)]" />
      <div className="absolute top-[749px] left-[668px] w-64 h-64 bg-[#ffffff01] rounded-full blur-[20px]" />

      <div className="relative flex flex-col items-start gap-8 px-4 pt-16 pb-16">
        <header className="flex flex-col items-start gap-2 w-full">
          <h2 className="text-5xl font-normal [font-family:'Baloo-Regular',Helvetica] tracking-[-0.96px] leading-[48px] text-center w-full">
            <span className="text-[#8b008be6] tracking-[-0.46px]">Thử đồ</span>
            <span className="text-[#332623] tracking-[-0.46px]">
              {" "}
              với nhiều loại đồng phục khác nhau
            </span>
          </h2>
          <p className="text-[32px] font-normal [font-family:'Baloo_2',Helvetica] text-gray-600 leading-7 text-center w-full">
            Chọn ngay đồng phục phù hợp với bạn → Tạo nên diện mạo hoàn chỉnh
            của bạn
          </p>
        </header>

        <Card className="w-full bg-white rounded-[20px] shadow-[0px_10px_15px_-3px_#0000001a,0px_4px_6px_-2px_#0000000d] border border-solid border-neutral-200 overflow-hidden translate-y-[-1rem] animate-fade-up opacity-0 [--animation-delay:400ms]">
          <CardContent className="p-[49px]">
            <div className="flex items-start gap-8">
              <div className="relative w-[440.8px] rounded-3xl shadow-[0px_8px_32px_#0f172a0f,inset_0px_1px_0px_#ffffff66] bg-[linear-gradient(135deg,rgba(255,255,255,1)_0%,rgba(248,250,252,1)_25%,rgba(241,245,249,1)_75%,rgba(226,232,240,1)_100%)] overflow-hidden border border-solid border-neutral-200">
                <div className="absolute top-px left-px w-[439px] h-[701px] bg-[linear-gradient(135deg,rgba(248,250,252,0.2)_0%,rgba(255,255,255,0.1)_50%,rgba(239,246,255,0.2)_100%)]" />

                <div className="relative flex flex-col items-start gap-6 p-6">
                  {steps.map((step, index) => (
                    <div key={step.number} className="w-full">
                      <div className="relative w-full">
                        <div
                          className={`absolute top-[46px] left-0 w-full ${step.height} bg-white rounded-[20px] border-[3px] border-dashed border-[#8b008b99] flex items-center justify-center`}
                        >
                          {step.content}
                        </div>

                        <div className="relative flex items-center gap-2 px-2 py-2.5 w-fit">
                          <div
                            className={`flex items-center justify-center w-6 h-6 rounded-full ${step.gradient}`}
                          >
                            <span className="text-sm font-bold text-white [font-family:'Manrope',Helvetica] tracking-[-0.40px] leading-5">
                              {step.number}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 [font-family:'Baloo_2',Helvetica] tracking-[-0.40px] leading-7 whitespace-nowrap">
                            {step.title}
                          </h3>
                        </div>

                        {step.hasButton && (
                          <div className="absolute bottom-0 left-0 w-full h-10 rounded-[20px] overflow-hidden shadow-[0px_0px_0px_transparent,0px_0px_0px_transparent,0px_25px_50px_-12px_#00000040] bg-[linear-gradient(135deg,rgba(139,0,139,1)_0%,rgba(116,48,137,1)_100%)] opacity-50 flex items-center justify-center">
                            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0)_0%,rgba(255,255,255,0.2)_50%,rgba(0,0,0,0)_100%)]" />
                            <span className="relative text-lg font-semibold text-white [font-family:'Baloo_2',Helvetica] leading-7">
                              Tạo giao diện hoàn chỉnh
                            </span>
                          </div>
                        )}
                      </div>

                      {index < steps.length - 1 && (
                        <div className="w-full h-px my-6 bg-[linear-gradient(90deg,rgba(0,0,0,0)_0%,rgba(229,229,229,1)_50%,rgba(0,0,0,0)_100%)]" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative flex-1 h-[703px] rounded-3xl overflow-hidden border border-solid border-[#ffffff33] shadow-[0px_16px_64px_#0f172a14,inset_0px_1px_0px_#ffffff66,inset_0px_-1px_0px_#0f172a0d] bg-[linear-gradient(135deg,rgba(255,255,255,1)_0%,rgba(248,250,252,1)_25%,rgba(241,245,249,1)_75%,rgba(226,232,240,1)_100%)]">
                <div className="absolute top-px left-px w-full h-[701px] rounded-3xl bg-[linear-gradient(135deg,rgba(0,0,0,0)_0%,rgba(0,169,255,0.02)_50%,rgba(0,0,0,0)_100%)] opacity-50" />

                <div className="absolute top-[276px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-6">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full border border-solid border-slate-300 shadow-[0px_0px_0px_transparent,0px_0px_0px_transparent,0px_4px_6px_-1px_#0000001a,0px_2px_4px_-2px_#0000001a] bg-[linear-gradient(135deg,rgba(241,245,249,1)_0%,rgba(226,232,240,1)_100%)]">
                    <div className="flex items-center justify-center w-8 h-8 bg-[#8b008b33] rounded-full">
                      <div className="w-4 h-4 bg-[#8b008b] rounded-full" />
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-0">
                    <h3 className="text-[25px] font-medium text-gray-900 [font-family:'Baloo_2',Helvetica] tracking-[-0.48px] leading-8 whitespace-nowrap">
                      Kết quả của bạn
                    </h3>
                    <p className="text-base font-normal text-gray-600 [font-family:'Baloo_2',Helvetica] leading-6 whitespace-nowrap">
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
