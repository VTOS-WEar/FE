import { CheckCircle2Icon } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";

const noticeItems = [
    {
        text: "Mã học sinh sẽ được hệ thống tự động tạo sau khi nhập dữ liệu.",
        className: "font-medium",
    },
    {
        text: (
            <>
                <span className="font-medium">Định dạng ngày sinh phải là </span>
                <span className="font-bold">dd/mm/yyyy</span>
                <span className="font-medium"> (Ví dụ: 15/05/2008).</span>
            </>
        ),
        className: "font-normal",
    },
    {
        text: "Tên Lớp phải trùng khớp với danh sách lớp đã tạo trên hệ thống.",
        className: "font-medium",
    },
];

export const ImportTemplateSection = (): JSX.Element => {
    return (
        <Card className="w-full bg-[#f4f6fb] rounded-[10px] border-[#e6eaf1] shadow-[0px_0px_4px_#00000040]">
            <CardContent className="flex flex-col gap-[11px] p-0">
                <div className="flex items-center justify-center mt-6 sm:mt-[33px] mx-auto font-bold text-black text-sm sm:text-[15px] tracking-[0] leading-[normal]">
                    LƯU Ý QUAN TRỌNG
                </div>

                <div className="flex flex-col items-start gap-2.5 px-4 sm:px-[15px] pb-6 sm:pb-[33px]">
                    {noticeItems.map((item, index) => (
                        <div key={index} className="flex items-start gap-[5px] w-full">
                            <CheckCircle2Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-blue-500 mt-0.5" />
                            <div
                                className={`flex-1 text-[#475772] text-xs tracking-[0] leading-[normal] ${item.className}`}
                            >
                                {item.text}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
