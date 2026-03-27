import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";

export const DataEntrySection = (): JSX.Element => {
    return (
        <Card className="relative w-full bg-white rounded-[10px] shadow-[0px_0px_4px_#00000040]">
            <CardContent className="p-4 sm:p-[25px]">
                <div className="flex items-center justify-between mb-6 sm:mb-[36px]">
                    <h2 className="font-bold text-black text-lg sm:text-xl tracking-[0] leading-[normal]">
                        Tải lên dữ liệu
                    </h2>
                    <Badge className="bg-[#3c6efd1f] text-[#3c6efd] border-[#3c6efd] hover:bg-[#3c6efd1f] font-semibold text-xs">
                        Kỳ học mới
                    </Badge>
                </div>

                <div className="flex flex-col items-center justify-center rounded-[10px] border-2 border-dashed border-[#cac9d6] py-12 sm:py-[77px] px-4">
                    <img
                        className="w-14 h-14 sm:w-[70px] sm:h-[70px]"
                        alt="Material symbols"
                        src="https://c.animaapp.com/mlsaxpa0EQIM7j/img/material-symbols-upload-file.svg"
                    />

                    <div className="mt-6 sm:mt-[34px] font-bold text-black text-lg sm:text-xl text-center tracking-[0] leading-[normal]">
                        Kéo thả file vào đây
                    </div>

                    <div className="mt-2 sm:mt-[13px] font-semibold text-[#4c5769] text-sm sm:text-base text-center tracking-[0] leading-[normal]">
                        Hoặc nhấn vào để chọn file từ máy tính
                    </div>

                    <Button className="mt-6 sm:mt-[34px] h-auto bg-[#4ca2e6] hover:bg-[#4ca2e6]/90 rounded-[10px] shadow-[0px_0px_4px_#4ca2e6b2] px-6 sm:px-[30px] py-2.5 font-bold text-white text-sm sm:text-base">
                        Chọn file (.xlsx, .csv)
                    </Button>

                    <div className="mt-2 sm:mt-[7px] font-semibold text-[#4c5769] text-xs text-center tracking-[0] leading-[normal]">
                        Kích thước tối đa: 10MB
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
