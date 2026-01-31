import { TruckIcon } from "lucide-react";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { Separator } from "../../../../components/ui/separator";

const ordersData = [
  {
    id: "#123-2025-0987",
    status: "in-transit",
    statusLabel: "Đang giao",
    statusBadgeClass: "bg-[#f3ce4878] text-[#997200]",
    image: "https://c.animaapp.com/mjxt3t8wNP0otU/img/hsthpt1-4.png",
    orderDate: "15/12/2025",
    totalAmount: "200.000 VNĐ",
    deliveryInfo: "Dự kiến giao: 17-18/12/2025",
    showDeliveryIcon: true,
    showTransitBadge: true,
    isStrikethrough: false,
    isGreyedOut: false,
    buttons: [
      { label: "Chi tiết", variant: "outline" as const },
      {
        label: "Theo dõi giao hàng",
        variant: "default" as const,
        className: "bg-[#008001] hover:bg-[#006601] text-white",
      },
    ],
  },
  {
    id: "#123-2025-1234",
    status: "delivered",
    statusLabel: "Đã giao hàng",
    statusBadgeClass: "bg-[#00800136] text-[#008001]",
    image: "https://c.animaapp.com/mjxt3t8wNP0otU/img/hsthpt1-4-1.png",
    orderDate: "15/12/2025",
    totalAmount: "200.000 VNĐ",
    deliveryInfo: "Đã giao thành công vào 17/12/2025",
    showDeliveryIcon: false,
    showTransitBadge: false,
    isStrikethrough: false,
    isGreyedOut: false,
    buttons: [
      { label: "Hoá đơn", variant: "outline" as const },
      {
        label: "Mua lại",
        variant: "outline" as const,
        className: "border-[#008001] text-[#008001] hover:bg-[#00800110]",
      },
    ],
  },
  {
    id: "#123-2025-1234",
    status: "cancelled",
    statusLabel: "Đã huỷ",
    statusBadgeClass: "bg-[#ff000036] text-[#ff0000]",
    image: "https://c.animaapp.com/mjxt3t8wNP0otU/img/hsthpt1-4-2.png",
    orderDate: "15/12/2025",
    totalAmount: "200.000 VNĐ",
    deliveryInfo: "Đã giao thành công vào 17/12/2025",
    showDeliveryIcon: false,
    showTransitBadge: false,
    isStrikethrough: true,
    isGreyedOut: true,
    buttons: [
      {
        label: "Xem chi tiết",
        variant: "outline" as const,
        className: "border-[#cac9d6] text-[#000000ab]",
      },
    ],
  },
  {
    id: "#123-2025-1234",
    status: "cancelled",
    statusLabel: "Đã huỷ",
    statusBadgeClass: "bg-[#ff000036] text-[#ff0000]",
    image: "https://c.animaapp.com/mjxt3t8wNP0otU/img/hsthpt1-4-3.png",
    orderDate: "15/12/2025",
    totalAmount: "200.000 VNĐ",
    deliveryInfo: "Đã giao thành công vào 17/12/2025",
    showDeliveryIcon: false,
    showTransitBadge: false,
    isStrikethrough: true,
    isGreyedOut: true,
    buttons: [
      {
        label: "Xem chi tiết",
        variant: "outline" as const,
        className: "border-[#cac9d6] text-[#000000ab]",
      },
    ],
  },
];

export const OrderListSection = (): JSX.Element => {
  return (
    <Card className="w-full bg-white rounded-[10px] shadow-[0px_0px_4px_#0000006b] border-0">
      <CardContent className="p-6 space-y-0">
        {ordersData.map((order, index) => (
          <div key={`order-${index}`}>
            <div className="flex items-start justify-between gap-4 py-6">
              <div className="flex gap-[17px]">
                <img
                  className="w-[70px] h-[70px] flex-shrink-0"
                  alt="Product"
                  src={order.image}
                />

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-4">
                    <h3
                      className={`[font-family:'Montserrat',Helvetica] font-semibold text-black text-xl tracking-[0] leading-normal whitespace-nowrap ${order.isStrikethrough ? "opacity-50 line-through" : ""}`}
                    >
                      Đơn hàng {order.id}
                    </h3>

                    <Badge
                      className={`h-4 px-2.5 py-0.5 rounded-[50px] font-medium text-[10px] ${order.statusBadgeClass} hover:${order.statusBadgeClass}`}
                    >
                      {order.statusLabel}
                    </Badge>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`[font-family:'Montserrat',Helvetica] font-medium text-black text-[15px] tracking-[0] leading-normal whitespace-nowrap ${order.isGreyedOut ? "opacity-50" : "opacity-50"}`}
                      >
                        Ngày đặt: {order.orderDate} | Tổng tiền:
                      </span>
                      <span
                        className={`[font-family:'Montserrat',Helvetica] font-bold text-black text-[15px] text-right tracking-[0] leading-normal ${order.isGreyedOut ? "opacity-50" : ""}`}
                      >
                        {order.totalAmount}
                      </span>
                    </div>

                    <div className="flex items-center gap-[7px]">
                      {order.showDeliveryIcon && (
                        <TruckIcon className="w-5 h-5" />
                      )}
                      <span className="[font-family:'Montserrat',Helvetica] font-semibold text-black text-xs tracking-[0] leading-normal opacity-50">
                        {order.deliveryInfo}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-[15px] flex-shrink-0">
                {order.buttons.map((button, btnIndex) => (
                  <Button
                    key={`btn-${index}-${btnIndex}`}
                    variant={button.variant}
                    className={`h-[50px] px-[15px] py-2.5 rounded-[10px] [font-family:'Montserrat',Helvetica] font-semibold text-base ${button.className || ""}`}
                  >
                    {button.label}
                  </Button>
                ))}
              </div>
            </div>

            {order.showTransitBadge && (
              <>
                <Badge className="mb-4 px-2.5 py-[5px] bg-[#00800124] text-[#008001] hover:bg-[#00800124] rounded-[50px] [font-family:'Montserrat',Helvetica] font-semibold text-[11px]">
                  ĐANG VẬN CHUYỂN
                </Badge>
                <div className="relative h-px mb-4">
                  <Separator className="absolute top-0 left-0 w-full" />
                  <Separator className="absolute top-0 left-0 w-[86%]" />
                </div>
              </>
            )}

            {index < ordersData.length - 1 && !order.showTransitBadge && (
              <Separator />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
