import { SearchIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";

const statusFilters = [
  { id: "all", label: "Tất cả" },
  { id: "pending", label: "Chờ xác nhận" },
  { id: "delivering", label: "Đang giao" },
  { id: "completed", label: "Hoàn thành" },
];

export const OrderStatusSummarySection = (): JSX.Element => {
  const [activeFilter, setActiveFilter] = useState("all");

  return (
    <section className="w-full bg-white rounded-[10px] shadow-[0px_0px_4px_#0000006b] p-5 translate-y-[-1rem] animate-fade-in opacity-0">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="relative flex-shrink-0 w-full max-w-[336px]">
          <SearchIcon className="absolute left-[15px] top-1/2 -translate-y-1/2 w-6 h-6 text-black pointer-events-none" />
          <Input
            type="text"
            placeholder="Tìm kiếm theo mã đơn hàng..."
            className="w-full h-[50px] pl-[51px] pr-[15px] bg-white rounded-[10px] border border-solid border-[#999999] [font-family:'Montserrat',Helvetica] font-medium text-black text-base placeholder:opacity-50"
          />
        </div>

        <nav className="flex flex-wrap items-center gap-2.5" role="tablist">
          {statusFilters.map((filter) => (
            <Button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`h-auto px-[15px] py-[5px] rounded-[50px] [font-family:'Montserrat',Helvetica] font-medium text-xl whitespace-nowrap transition-colors ${
                activeFilter === filter.id
                  ? "bg-[#008001] text-white hover:bg-[#006d01]"
                  : "bg-gray-200 text-black hover:bg-gray-300"
              }`}
              role="tab"
              aria-selected={activeFilter === filter.id}
            >
              {filter.label}
            </Button>
          ))}
        </nav>
      </div>
    </section>
  );
};
