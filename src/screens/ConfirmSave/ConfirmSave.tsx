import { useState } from "react";
import {
    CheckIcon,
    ArrowLeftIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
} from "lucide-react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { Button } from "../../components/ui/button";
import { DashboardScreen } from "../../components/layout";

export interface StudentRecord {
    stt: number;
    maHS: string;
    hoTen: string;
    lop: string;
    gioiTinh: "Nam" | "Nữ";
    ngaySinh: string;
    sdtPhuHuynh: string;
}

const MOCK_DATA: StudentRecord[] = [
    { stt: 1, maHS: "HS120001", hoTen: "Nguyễn Văn An", lop: "10A1", gioiTinh: "Nam", ngaySinh: "15/06/2008", sdtPhuHuynh: "01284545324" },
    { stt: 2, maHS: "HS120002", hoTen: "Nguyễn Văn B", lop: "10A1", gioiTinh: "Nam", ngaySinh: "15/06/2008", sdtPhuHuynh: "01284545325" },
    { stt: 3, maHS: "HS120003", hoTen: "Nguyễn Văn C", lop: "10A1", gioiTinh: "Nam", ngaySinh: "15/06/2009", sdtPhuHuynh: "01284545326" },
    { stt: 4, maHS: "HS120004", hoTen: "Nguyễn Văn D", lop: "10A1", gioiTinh: "Nam", ngaySinh: "15/06/2008", sdtPhuHuynh: "01284545323" },
    { stt: 5, maHS: "HS120005", hoTen: "Nguyễn Văn E", lop: "10A1", gioiTinh: "Nam", ngaySinh: "15/06/2008", sdtPhuHuynh: "01284545356" },
];

export const ConfirmSave = (): JSX.Element => {
    const [students] = useState<StudentRecord[]>(MOCK_DATA);

    return (
        <DashboardScreen>
            {/* Breadcrumb */}
            <div className="px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
                <Breadcrumb>
                    <BreadcrumbList className="gap-2">
                        <BreadcrumbItem>
                            <BreadcrumbLink className="font-semibold text-[#4c5769] text-sm">
                                Trang chủ
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="text-[#cac9d6]">/</BreadcrumbSeparator>
                        <BreadcrumbItem>
                            <BreadcrumbLink className="font-semibold text-[#4c5769] text-sm">
                                Danh sách học sinh
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="text-[#cac9d6]">/</BreadcrumbSeparator>
                        <BreadcrumbItem>
                            <BreadcrumbPage className="font-semibold text-black text-sm">
                                Nhập dữ liệu học sinh
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            {/* Main content */}
            <main className="flex-1 px-4 sm:px-6 lg:px-8 pb-8 space-y-5">
                {/* Back button */}
                <Button variant="ghost" className="h-auto p-0 gap-1.5 font-semibold text-[#4c5769] text-sm hover:bg-transparent hover:text-black">
                    <ArrowLeftIcon className="w-4 h-4" />
                    Quay lại danh sách
                </Button>

                {/* Title */}
                <div className="space-y-1.5">
                    <h1 className="font-bold text-black text-2xl">
                        Xác nhận nhập dữ liệu
                    </h1>
                </div>

                {/* Info box */}
                <div className="flex flex-wrap items-center gap-2 bg-[#f0fff4] rounded-[0.625rem] border border-[#c6f6d5] px-4 py-3">
                    <CheckIcon className="w-4 h-4 text-[#38a169] flex-shrink-0" />
                    <span className="font-medium text-[#38a169] text-sm">
                        Tìm thấy {students.length} học sinh hợp lệ, sẵn sàng để nhập vào hệ thống.
                    </span>
                </div>

                {/* Student data preview */}
                <div className="bg-white rounded-[0.625rem] border border-[#e3e8ef] overflow-hidden">
                    {/* Table header */}
                    <div className="grid grid-cols-[2rem_1fr_4rem_4rem_4rem_5rem_6rem] gap-2 items-center h-12 bg-slate-50 border-b border-[#e3e8ef] px-4">
                        {["STT", "MàHS", "HỌ VÀ TÊN", "LỚP", "GIỚI TÍNH", "NGÀY SINH", "SĐT PHỤ HUYNH"].map((col) => (
                            <span key={col} className="font-bold text-black text-xs">
                                {col}
                            </span>
                        ))}
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-[#e3e8ef]">
                        {students.map((record) => (
                            <div key={record.stt} className="grid grid-cols-[2rem_1fr_4rem_4rem_4rem_5rem_6rem] gap-2 items-center px-4 py-3">
                                <span className="font-semibold text-[#677489] text-sm">
                                    {record.stt}
                                </span>

                                <span className="font-semibold text-black text-sm truncate">
                                    {record.maHS}
                                </span>

                                <span className="font-semibold text-black text-sm truncate">
                                    {record.hoTen}
                                </span>

                                <span className="font-semibold text-black text-sm">
                                    {record.lop}
                                </span>

                                <span className="font-semibold text-black text-sm">
                                    {record.gioiTinh}
                                </span>

                                <span className="font-semibold text-black text-sm">
                                    {record.ngaySinh}
                                </span>

                                <span className="font-semibold text-black text-sm">
                                    {record.sdtPhuHuynh}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between h-12 bg-slate-50 border-t border-[#e3e8ef] px-4">
                        <span className="font-medium text-[#677489] text-sm">
                            Hiện thị <span className="font-bold text-black">5</span> trong số <span className="font-bold text-black">{students.length}</span>
                        </span>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="w-7 h-7 p-0">
                                <ChevronLeftIcon className="w-4 h-4" />
                            </Button>
                            {[1, 2].map((page) => (
                                <Button
                                    key={page}
                                    variant={page === 1 ? "default" : "ghost"}
                                    size="sm"
                                    className={`w-7 h-7 p-0 rounded-[0.375rem] font-bold text-sm ${page === 1 ? "bg-[#3c6efd] hover:bg-[#3c6efd]" : ""}`}
                                >
                                    {page}
                                </Button>
                            ))}
                            <Button variant="ghost" size="icon" className="w-7 h-7 p-0">
                                <ChevronRightIcon className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Action bar */}
                <div className="flex flex-wrap items-center justify-end gap-2 bg-white rounded-[0.625rem] border border-[#e3e8ef] px-5 py-4">
                    <Button variant="ghost" className="h-9 font-semibold text-[#4c5769] text-sm rounded-[0.5rem]">
                        Hủy bỏ
                    </Button>
                    <Button className="h-9 bg-[#3c6efd] hover:bg-[#3c6efd]/90 font-semibold text-white text-sm rounded-[0.5rem]">
                        Tiến hành nhập
                    </Button>
                </div>
            </main>
        </DashboardScreen>
    );
};
