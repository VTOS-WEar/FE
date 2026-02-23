import { HistoryIcon } from "lucide-react";
import { Button } from "../../../components/ui/button";

export const HeaderBreadcrumbSection = (): JSX.Element => {
    return (
        <header className="w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-8">
            <div className="flex flex-col gap-0.5 flex-1">
                <h1 className="[font-family:'Montserrat',Helvetica] font-bold text-black text-2xl sm:text-[32px] tracking-[0] leading-[normal]">
                    Nhập dữ liệu học sinh
                </h1>

                <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#4c5769] text-sm sm:text-base tracking-[0] leading-[normal]">
                    Cập nhật danh sách học sinh đầu kỳ để kích hoạt tính năng thử đồ ảo và
                    đặt mua đồng phục.
                </p>
            </div>

            <Button
                variant="outline"
                className="h-auto flex items-center gap-2.5 p-2.5 bg-white rounded-[10px] shadow-[0px_0px_4px_#00000040] [font-family:'Montserrat',Helvetica] font-bold text-black text-sm sm:text-base"
            >
                <HistoryIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>Lịch sử tải lên</span>
            </Button>
        </header>
    );
};
