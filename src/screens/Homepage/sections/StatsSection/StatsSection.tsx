import { Shirt, Camera, Clock } from "lucide-react";

const stats = [
  {
    value: "200+",
    label: "Mẫu đồng phục",
    icon: Shirt,
  },
  {
    value: "10 giây",
    label: "Thời gian thử đồ",
    icon: Clock,
  },
  {
    value: "98%",
    label: "Độ chính xác AI",
    icon: Camera,
  },
];

export const StatsSection = (): JSX.Element => {
  return (
    <section className="w-full bg-[#FFF8F0] py-16 lg:py-20">
      <div className="mx-auto w-full max-w-[1100px] px-4 md:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="group nb-stat-card bg-white text-center nb-reveal-pop hover:-translate-y-[5px] hover:shadow-[0_16px_28px_rgba(26,26,46,0.18)]"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border-3 border-[#1A1A2E] bg-[#EDE9FE] shadow-[3px_3px_0_#1A1A2E] transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-[-6deg]">
                  <Icon className="nb-icon-wiggle h-6 w-6 text-[#1A1A2E]" strokeWidth={2.5} />
                </div>

                <div className="nb-stat-value">{stat.value}</div>
                <div className="nb-stat-label mt-1">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
