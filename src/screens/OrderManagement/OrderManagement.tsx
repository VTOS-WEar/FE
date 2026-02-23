import { ChevronRightIcon } from "lucide-react";
import { Navbar, Footer } from "../../components/layout";
import { OrderFilterSection } from "./sections/OrderFilterSection";
import { OrderListSection } from "./sections/OrderListSection";
import { OrderStatusSummarySection } from "./sections/OrderStatusSummarySection";
import { PaginationSection } from "./sections/PaginationSection";
import { GuestLayout } from "../../components/layout/GuestLayout";

export const OrderManagement = (): JSX.Element => {
  return (
    <GuestLayout bgColor="#f4f2ff">

      <main className="flex-1 bg-[#f4f2ff] py-12 px-4 lg:px-8 relative overflow-hidden">
        <img
          className="absolute top-[-5rem] left-[-15rem] w-[117rem] h-[85rem] pointer-events-none opacity-50"
          alt="Background"
          src="https://c.animaapp.com/mjxt3t8wNP0otU/img/group-239190-4.png"
        />

        <div className="max-w-7xl mx-auto relative z-10 space-y-6">
          <nav className="flex items-center gap-2.5">
            <span className="[font-family:'Montserrat',Helvetica] font-normal text-black text-base opacity-40">
              Trang chủ
            </span>
            <ChevronRightIcon className="w-4 h-4 text-black opacity-40" />
            <span className="[font-family:'Montserrat',Helvetica] font-semibold text-black text-base">
              Đơn hàng
            </span>
          </nav>

          <OrderFilterSection />
          <OrderStatusSummarySection />
          <OrderListSection />
          <PaginationSection />
        </div>
      </main>

    </GuestLayout>
  );
};
