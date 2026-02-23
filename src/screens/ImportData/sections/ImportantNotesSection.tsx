import { DownloadIcon, FileTextIcon } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";

export const ImportantNotesSection = (): JSX.Element => {
    return (
        <Card className="relative w-full bg-white rounded-[10px] shadow-[0px_0px_4px_#00000040]">
            <CardContent className="flex flex-col p-0">
                <div className="flex items-center gap-2.5 ml-4 sm:ml-[25px] mt-6 sm:mt-[33px]">
                    <FileTextIcon className="w-5 h-5 sm:w-[25px] sm:h-[25px] text-black" />
                    <h2 className="[font-family:'Montserrat',Helvetica] font-bold text-black text-lg sm:text-xl tracking-[0] leading-normal">
                        File mẫu nhập liệu
                    </h2>
                </div>

                <p className="mx-4 sm:mx-[25px] mt-3 [font-family:'Montserrat',Helvetica] font-medium text-[#677489] text-sm sm:text-base tracking-[0] leading-normal">
                    Vui lòng sử dụng file mẫu mới nhất để tránh lỗi định dạng khi tải lên.
                    File mẫu bao gồm các cột: Mã học sinh (nếu có), Họ và tên, Lớp, Giới
                    tính, Ngày sinh, Số điện thoại của phụ huynh.
                </p>

                <Button className="flex items-center justify-center gap-2.5 mx-4 sm:mx-[25px] mt-6 sm:mt-[27px] mb-6 sm:mb-[33px] h-10 sm:h-11 bg-[#dce2e8] hover:bg-[#ccd6dd] rounded-[10px] text-black [font-family:'Montserrat',Helvetica] font-bold text-sm sm:text-base">
                    <DownloadIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    Tải xuống mẫu Excel chuẩn
                </Button>
            </CardContent>
        </Card>
    );
};
