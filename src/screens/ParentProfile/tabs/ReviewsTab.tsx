import { Star } from "lucide-react";

export const ReviewsTab = (): JSX.Element => (
  <div className="flex flex-col items-center justify-center py-16 gap-5 nb-fade-in">
    <div className="w-20 h-20 bg-[#FDF8D0] rounded-xl flex items-center justify-center border-2 border-[#1A1A2E] shadow-[4px_4px_0_#1A1A2E]">
      <Star className="w-10 h-10 text-[#1A1A2E]" />
    </div>
    <div className="text-center">
      <span className="inline-block px-4 py-1.5 rounded-lg bg-[#F5E642] border-2 border-[#1A1A2E] font-extrabold text-[#1A1A2E] text-sm shadow-[2px_2px_0_#1A1A2E] mb-3">
        Coming Soon ✦
      </span>
      <p className="font-bold text-[#1A1A2E] text-lg mb-1">Đánh giá sản phẩm</p>
      <p className="font-medium text-[#6B7280] text-sm max-w-xs mx-auto">
        Tính năng đang được phát triển.<br />
        Đánh giá đồng phục sẽ hiển thị ở đây.
      </p>
    </div>
  </div>
);
