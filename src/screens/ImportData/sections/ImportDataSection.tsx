import { Alert, AlertDescription, AlertTitle } from "../../../components/ui/alert";
import { Badge } from "../../../components/ui/badge";

export const ImportDataSection = (): JSX.Element => {
    return (
        <Alert className="relative w-full bg-[#fefbec] border-[#f9e89b] rounded-[10px] p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                <img
                    className="w-12 h-12 sm:w-[60px] sm:h-[59px] flex-shrink-0"
                    alt="Tdesign loudspeaker"
                    src="https://c.animaapp.com/mlsaxpa0EQIM7j/img/tdesign-loudspeaker-filled.svg"
                />

                <div className="flex-1 space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-wrap">
                        <AlertTitle className="font-bold text-black text-lg sm:text-2xl m-0">
                            Cần cập nhật: Dữ liệu Học kỳ 1 (2026-2027)
                        </AlertTitle>
                        <Badge className="bg-[#f9e3e2] border-[#f6cccb] text-[#ac3129] font-extrabold text-xs sm:text-sm hover:bg-[#f9e3e2] h-auto px-2.5 py-[5px] w-fit">
                            CHƯA NHẬP LIỆU
                        </Badge>
                    </div>

                    <AlertDescription className="font-normal text-sm sm:text-base text-[#364153] leading-normal">
                        <span className="font-medium">
                            Hệ thống chưa ghi nhận danh sách học sinh cho học kỳ mới. Nhà
                            trường vui lòng cập nhập sớm để đảm bảo học sinh có thể truy cập{" "}
                        </span>
                        <span className="font-extrabold">Phòng thử ảo</span>
                        <span className="font-medium">
                            {" "}
                            và đặt mua đồng phục đúng hạn. Việc chậm trễ có thể ảnh hướng đến
                            tiến độ giao đồng phục đầu năm.
                        </span>
                    </AlertDescription>

                    <div className="inline-flex items-center gap-2.5 p-2.5 bg-[#fcf3cc] rounded-[10px]">
                        <img
                            className="w-5 h-5 sm:w-6 sm:h-6"
                            alt="Mingcute calendar x"
                            src="https://c.animaapp.com/mlsaxpa0EQIM7j/img/mingcute-calendar-x-fill.svg"
                        />
                        <span className="font-semibold text-[#88451d] text-sm sm:text-base">
                            Hạn chót đề xuất: 30/08/2026
                        </span>
                    </div>
                </div>
            </div>
        </Alert>
    );
};
