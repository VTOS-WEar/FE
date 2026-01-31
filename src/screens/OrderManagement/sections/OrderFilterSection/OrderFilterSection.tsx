import { Card, CardContent } from "../../../../components/ui/card";

const orderStats = [
  {
    icon: "https://c.animaapp.com/mjxt3t8wNP0otU/img/bx-box.svg",
    label: "Tổng đơn hàng",
    value: "10",
    alt: "Bx box",
  },
  {
    icon: "https://c.animaapp.com/mjxt3t8wNP0otU/img/mdi-truck.svg",
    label: "Đang giao",
    value: "1",
    alt: "Mdi truck",
  },
  {
    icon: "https://c.animaapp.com/mjxt3t8wNP0otU/img/mdi-tick-circle.svg",
    label: "Hoàn thành",
    value: "8",
    alt: "Mdi tick circle",
  },
  {
    icon: "https://c.animaapp.com/mjxt3t8wNP0otU/img/typcn-delete.svg",
    label: "Đã huỷ",
    value: "1",
    alt: "Typcn delete",
  },
];

export const OrderFilterSection = (): JSX.Element => {
  return (
    <section className="flex items-center gap-5 w-full">
      {orderStats.map((stat, index) => (
        <Card
          key={index}
          className="flex-1 min-w-0 h-[76px] bg-white rounded-[10px] shadow-[0px_0px_4px_#0000006b] translate-y-[-1rem] animate-fade-in opacity-0"
          style={
            { "--animation-delay": `${index * 100}ms` } as React.CSSProperties
          }
        >
          <CardContent className="flex items-center gap-[18px] p-4 h-full">
            <img
              className="w-11 h-11 flex-shrink-0"
              alt={stat.alt}
              src={stat.icon}
            />
            <div className="flex flex-col justify-center min-w-0 flex-1">
              <div className="opacity-50 [font-family:'Montserrat',Helvetica] font-semibold text-black text-base tracking-[0] leading-[normal] truncate">
                {stat.label}
              </div>
              <div className="font-semibold text-black [font-family:'Montserrat',Helvetica] text-2xl tracking-[0] leading-[normal]">
                {stat.value}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
};
