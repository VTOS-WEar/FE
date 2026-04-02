import { PlusIcon } from "lucide-react";
import { Button } from "../../../components/ui/button";

export const FrameWrapperSubsection = (): JSX.Element => {
    return (
        <header className="w-full flex items-start justify-between gap-8">
            <div className="flex flex-col gap-0.5">
                <h1 className="font-bold text-black text-[2rem] tracking-[0] leading-[normal]">
                    Danh sách học sinh
                </h1>

                <p className="font-medium text-[#4c5769] text-base tracking-[0] leading-[normal]">
                    Quản lý thông tin học sinh, số đo ảo và tài khoản phụ huynh.
                </p>
            </div>

            <Button className="h-11 bg-[#3c6efd] hover:bg-[#3c6efd]/90 rounded-[10px] gap-2.5 px-4 font-bold text-white text-base">
                <PlusIcon className="w-6 h-6" />
                Thêm học sinh mới
            </Button>
        </header>
    );
};
