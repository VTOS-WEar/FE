import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useState } from "react";
import {
    ArrowLeftIcon,
    CheckIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    InfoIcon,
    TrashIcon,
} from "lucide-react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { DashboardSidebar } from "../../components/layout";
import type { DashboardSidebarProps } from "../../components/layout";

/* ─── Sidebar config ─────────────────────────────── */
const AVATAR_SRC = "https://c.animaapp.com/mlsaxpa0EQIM7j/img/frame-239353.png";

const TOP_NAV: DashboardSidebarProps["topNavItems"] = [
    {
        icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/material-symbols-dashboard-rounded.svg",
        label: "Tổng quan",
    },
];

const NAV_SECTIONS: DashboardSidebarProps["navSections"] = [
    {
        title: "QUẢN LÝ",
        items: [
            {
                icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/material-symbols-school.svg",
                label: "Hồ sơ trường",
            },
            {
                icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/mdi-people-group.svg",
                label: "Danh sách học sinh",
                active: true,
            },
            {
                icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/fluent-clothes-hanger-12-filled.svg",
                label: "Đồng phục",
            },
            {
                icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/ri-bill-fill.svg",
                label: "Mở đơn",
            },
            {
                icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/ri-bill-fill.svg",
                label: "Phân phối đồng phục",
            },
            {
                icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/material-symbols-shopping-bag.svg",
                label: "Đơn hàng",
                badge: "1",
            },
        ],
    },
];

/* ─── Data ───────────────────────────────────────── */
interface UploadedFile {
    id: string;
    name: string;
    size: number;
    records: number;
    uploadDate: string;
    status: "completed" | "processing";
}

interface StudentRecord {
    stt: number;
    hoTen: string;
    hoTenKhac: string;
    lop: string;
    gioiTinh: string;
    ngaySinh: string;
    ghepPhuHuynh: string;
}

const uploadedFiles: UploadedFile[] = [
    {
        id: "1",
        name: "DanhSachHocSinh_K10_2026.xlsx",
        size: 45,
        records: 450,
        uploadDate: "2024-01-15",
        status: "completed",
    },
];

const studentRecords: StudentRecord[] = [
    {
        stt: 1,
        hoTen: "Nguyễn Văn An",
        hoTenKhac: "NVA",
        lop: "10AI",
        gioiTinh: "Nam",
        ngaySinh: "15/06/2008",
        ghepPhuHuynh: "Chưa ghép",
    },
    {
        stt: 2,
        hoTen: "Trần Thị B",
        hoTenKhac: "TTB",
        lop: "10AI",
        gioiTinh: "Nữ",
        ngaySinh: "20/08/2008",
        ghepPhuHuynh: "Chưa ghép",
    },
    {
        stt: 3,
        hoTen: "Nguyễn Văn C",
        hoTenKhac: "NVC",
        lop: "10AI",
        gioiTinh: "Nam",
        ngaySinh: "12/03/2008",
        ghepPhuHuynh: "Đã ghép",
    },
    {
        stt: 4,
        hoTen: "Phạm Thị D",
        hoTenKhac: "PTD",
        lop: "10BI",
        gioiTinh: "Nữ",
        ngaySinh: "05/11/2008",
        ghepPhuHuynh: "Chưa ghép",
    },
    {
        stt: 5,
        hoTen: "Đỗ Văn E",
        hoTenKhac: "DVE",
        lop: "10BI",
        gioiTinh: "Nam",
        ngaySinh: "28/07/2008",
        ghepPhuHuynh: "Chưa ghép",
    },
];

/* ─── Component ──────────────────────────────────── */
export const ConfirmReimport = (): JSX.Element => {
    const [isCollapsed, toggle] = useSidebarCollapsed();

    return (
        <div className="bg-[#f6f7f8] w-full min-h-screen flex flex-col">
            {/* Sidebar + Content */}
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[20rem] xl:w-[23.75rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar
                        isCollapsed={isCollapsed}
                        onToggle={toggle}
                        avatarSrc={AVATAR_SRC}
                        avatarAlt="School logo"
                        greeting="Xin chào!"
                        name="Trường Tiểu học FPT"
                        topNavItems={TOP_NAV}
                        navSections={NAV_SECTIONS}
                    />
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                    {/* Breadcrumb + icons */}
                    <div className="px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
                        <Breadcrumb>
                            <BreadcrumbList className="gap-2">
                                <BreadcrumbItem>
                                    <BreadcrumbLink className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4c5769] text-sm">
                                        Trang chủ
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="text-[#cac9d6]">/</BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbLink className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4c5769] text-sm">
                                        Danh sách học sinh
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="text-[#cac9d6]">/</BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="[font-family:'Montserrat',Helvetica] font-semibold text-black text-sm">
                                        Nhập dữ liệu học sinh
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>

                    <main className="flex-1 px-4 sm:px-6 lg:px-8 pb-8 space-y-5">
                        {/* Back button */}
                        <Button variant="ghost" className="h-auto p-0 gap-1.5 [font-family:'Montserrat',Helvetica] font-semibold text-[#4c5769] text-sm hover:bg-transparent hover:text-black">
                            <ArrowLeftIcon className="w-4 h-4" />
                            Quay lại danh sách
                        </Button>

                        {/* Title */}
                        <div className="space-y-1.5">
                            <h1 className="[font-family:'Montserrat',Helvetica] font-bold text-black text-2xl">
                                Xác nhận nhập lại dữ liệu
                            </h1>
                            <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#4c5769] text-sm">
                                Vui lòng xác nhận thông tin các tệp sẽ được nhập vào hệ thống.
                            </p>
                        </div>

                        {/* Info box */}
                        <div className="flex flex-wrap items-center gap-2 bg-[#f0fff4] rounded-[0.625rem] border border-[#c6f6d5] px-4 py-3">
                            <CheckIcon className="w-4 h-4 text-[#38a169] flex-shrink-0" />
                            <span className="[font-family:'Montserrat',Helvetica] font-medium text-[#38a169] text-sm">
                                Tìm thấy 450 học sinh hợp lệ, sẵn sàng để nhập vào hệ thống.
                            </span>
                        </div>

                        {/* File list section */}
                        <div className="bg-white rounded-[0.625rem] border border-[#e3e8ef] overflow-hidden">
                            <div className="bg-slate-50 border-b border-[#e3e8ef] px-4 py-3">
                                <h2 className="[font-family:'Montserrat',Helvetica] font-bold text-black text-sm">
                                    Danh sách tệp tải lên
                                </h2>
                            </div>
                            <div className="divide-y divide-[#e3e8ef]">
                                {uploadedFiles.map((file) => (
                                    <div key={file.id} className="px-4 py-4 flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="[font-family:'Montserrat',Helvetica] font-bold text-black text-sm">
                                                    {file.name}
                                                </span>
                                                <Badge className="h-auto bg-[#f0fff4] hover:bg-[#f0fff4] text-[#38a169] border border-[#c6f6d5] rounded-[0.375rem] px-2 py-1">
                                                    <CheckIcon className="w-3 h-3 mr-1" />
                                                    <span className="[font-family:'Montserrat',Helvetica] font-semibold text-[0.625rem]">
                                                        Đã tải lên hoàn tất
                                                    </span>
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs">
                                                <span className="[font-family:'Montserrat',Helvetica] font-medium text-[#677489]">
                                                    Dung lượng: {file.size} KB
                                                </span>
                                                <span className="[font-family:'Montserrat',Helvetica] font-medium text-[#677489]">
                                                    Số bản ghi: {file.records}
                                                </span>
                                                <span className="[font-family:'Montserrat',Helvetica] font-medium text-[#677489]">
                                                    Ngày tải: {file.uploadDate}
                                                </span>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="w-8 h-8 p-0 text-[#e53e3e] hover:bg-[#fff5f5]">
                                            <TrashIcon className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Student data preview */}
                        <div className="bg-white rounded-[0.625rem] border border-[#e3e8ef] overflow-hidden">
                            {/* Table header */}
                            <div className="grid grid-cols-[2rem_1fr_4rem_4rem_4rem_5rem_6rem] gap-2 items-center h-12 bg-slate-50 border-b border-[#e3e8ef] px-4">
                                {["STT", "HỌ VÀ TÊN", "HỎ VÀ TÊN", "LỚP", "GIỚI TÍNH", "NGÀY SINH", "GHÉP PHỤ HUYNH"].map((col) => (
                                    <span key={col} className="[font-family:'Montserrat',Helvetica] font-bold text-black text-xs">
                                        {col}
                                    </span>
                                ))}
                            </div>

                            {/* Rows */}
                            <div className="divide-y divide-[#e3e8ef]">
                                {studentRecords.map((record) => (
                                    <div key={record.stt} className="grid grid-cols-[2rem_1fr_4rem_4rem_4rem_5rem_6rem] gap-2 items-center px-4 py-3">
                                        <span className="[font-family:'Montserrat',Helvetica] font-semibold text-[#677489] text-sm">
                                            {record.stt}
                                        </span>

                                        <span className="[font-family:'Montserrat',Helvetica] font-semibold text-black text-sm truncate">
                                            {record.hoTen}
                                        </span>

                                        <span className="[font-family:'Montserrat',Helvetica] font-semibold text-black text-sm">
                                            {record.hoTenKhac}
                                        </span>

                                        <span className="[font-family:'Montserrat',Helvetica] font-semibold text-black text-sm">
                                            {record.lop}
                                        </span>

                                        <span className="[font-family:'Montserrat',Helvetica] font-semibold text-black text-sm">
                                            {record.gioiTinh}
                                        </span>

                                        <span className="[font-family:'Montserrat',Helvetica] font-semibold text-black text-sm">
                                            {record.ngaySinh}
                                        </span>

                                        <span className="[font-family:'Montserrat',Helvetica] font-semibold text-black text-sm">
                                            {record.ghepPhuHuynh}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Table footer - pagination */}
                            <div className="flex items-center justify-between h-12 bg-slate-50 border-t border-[#e3e8ef] px-4">
                                <span className="[font-family:'Montserrat',Helvetica] font-medium text-[#677489] text-sm">
                                    Hiện thị <span className="font-bold text-black">5</span> trong số <span className="font-bold text-black">{studentRecords.length}</span>
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
                                            className={`w-7 h-7 p-0 rounded-[0.375rem] [font-family:'Montserrat',Helvetica] font-bold text-sm ${page === 1 ? "bg-[#3c6efd] hover:bg-[#3c6efd]" : ""}`}
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
                            <Button variant="ghost" className="h-9 [font-family:'Montserrat',Helvetica] font-semibold text-[#4c5769] text-sm rounded-[0.5rem]">
                                Hủy bỏ
                            </Button>
                            <Button className="h-9 bg-[#3c6efd] hover:bg-[#3c6efd]/90 [font-family:'Montserrat',Helvetica] font-semibold text-white text-sm rounded-[0.5rem]">
                                Tiếp tục nhập lại
                            </Button>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};
