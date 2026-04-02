import { EyeIcon, FileTextIcon } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { Separator } from "../../../components/ui/separator";

const importHistoryData = [
    {
        filename: "HocSinh_Khoi10_2025.xlsx",
        timestamp: "10:30, 24/08/2025",
        status: "success",
        statusText: "Thành công",
        statusBgColor: "bg-[#0080011c]",
        statusTextColor: "text-[#199b25]",
    },
    {
        filename: "HocSinh_Lop11A2_2025.xlsx",
        timestamp: "10:30, 13/08/2025",
        status: "error",
        statusText: "Lỗi định dạng",
        statusBgColor: "bg-[#ff000026]",
        statusTextColor: "text-[#ff0000]",
    },
];

export const ImportHistorySection = (): JSX.Element => {
    return (
        <div className="w-full bg-white border border-solid border-[#cac9d6] p-4 sm:p-8">
            <div className="flex flex-col gap-6 sm:gap-[30px]">
                {importHistoryData.map((item, index) => (
                    <div key={index}>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2.5 w-full">
                            <div className="flex sm:w-[300px] items-center gap-2.5">
                                <FileTextIcon className="w-5 h-5 sm:w-[25px] sm:h-[25px] flex-shrink-0" />
                                <div className="font-bold text-black text-sm sm:text-[15px] tracking-[0] leading-[normal] break-all sm:whitespace-nowrap">
                                    {item.filename}
                                </div>
                            </div>

                            <div className="flex items-center sm:justify-center sm:w-[200px] font-bold text-[#4c5769] text-sm sm:text-[15px] tracking-[0] leading-[normal]">
                                {item.timestamp}
                            </div>

                            <div className="sm:w-[200px]">
                                <Badge
                                    className={`flex items-center justify-center gap-2.5 px-2.5 py-[3px] ${item.statusBgColor} rounded-[5px] h-auto hover:${item.statusBgColor} w-fit`}
                                >
                                    <img
                                        className="w-3 h-3 sm:w-4 sm:h-4"
                                        alt="Status indicator"
                                        src="https://c.animaapp.com/mlsaxpa0EQIM7j/img/oui-dot.svg"
                                    />
                                    <span
                                        className={`font-bold ${item.statusTextColor} text-sm sm:text-[15px] text-center tracking-[0] leading-[normal] whitespace-nowrap`}
                                    >
                                        {item.statusText}
                                    </span>
                                </Badge>
                            </div>

                            <div className="flex items-center sm:justify-center sm:w-[123px]">
                                <EyeIcon className="w-5 h-5 cursor-pointer text-gray-600 hover:text-gray-900" />
                            </div>
                        </div>

                        {index < importHistoryData.length - 1 && (
                            <Separator className="my-4 sm:my-[30px]" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
