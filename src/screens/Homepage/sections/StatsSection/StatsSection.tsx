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
    <section className="w-full bg-gray-50 pt-6 pb-10 lg:pt-8 lg:pb-12">
      <div className="mx-auto w-full max-w-[1400px] px-4 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="group nb-stat-card bg-white text-center nb-reveal-pop hover:-translate-y-[5px] hover:shadow-[0_16px_28px_rgba(26,26,46,0.18)]"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border-3 border-gray-200 bg-violet-50 shadow-soft-sm transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-[-6deg]">
                  <Icon className="nb-icon-wiggle h-6 w-6 text-gray-900" strokeWidth={2.5} />
                </div>

                <div className="nb-stat-value text-[clamp(2rem,3.2vw,2.4rem)] font-black leading-tight text-gray-900">
                  {stat.value}
                </div>
                <div className="nb-stat-label mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
