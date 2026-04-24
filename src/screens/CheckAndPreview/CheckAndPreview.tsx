import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useState } from "react";
import {
    AlertCircleIcon,
    ArrowLeftIcon,
    CheckCircle2Icon,
    ChevronLeftIcon,
    ChevronRightIcon,
    DownloadIcon,
    UploadIcon,
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
                active: true,
            },
            {
                icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/mdi-people-group.svg",
                label: "Danh sách học sinh",
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
type ErrorStatus =
    | { type: "error"; message: string }
    | { type: "fixed" };

interface ErrorRow {
    rowNumber: number;
    name: string;
    studentId: string;
    studentIdError?: boolean;
    grade: string;
    gradeError?: boolean;
    gender: string;
    parentPhone: string;
    status: ErrorStatus;
}

const errorRows: ErrorRow[] = [
    { rowNumber: 12, name: "Nguyễn Văn A", studentId: "123", studentIdError: true, grade: "10AI", gender: "Nam", parentPhone: "0123456784", status: { type: "error", message: "Mã HS quá ngắn" } },
    { rowNumber: 13, name: "Trần Thị B", studentId: "HS20235005", grade: "Nhập lớp", gradeError: true, gender: "Nữ", parentPhone: "0123456754", status: { type: "error", message: "Thiếu thông tin lớp" } },
    { rowNumber: 14, name: "Nguyễn Văn A", studentId: "123", studentIdError: true, grade: "10AI", gender: "Nam", parentPhone: "0123456745", status: { type: "error", message: "Mã HS quá ngắn" } },
    { rowNumber: 16, name: "Trần Thị C", studentId: "HS2023006", grade: "Nhập lớp", gradeError: true, gender: "Nữ", parentPhone: "0123456767", status: { type: "error", message: "Thiếu thông tin lớp" } },
    { rowNumber: 20, name: "Nguyễn Văn B", studentId: "HS2023007", grade: "10AI", gender: "Nam", parentPhone: "0123456743", status: { type: "fixed" } },
];

const TOTAL_ROWS = 450;
const ERROR_COUNT = 12;
const FIXED_COUNT = 1;
const SUCCESS_RATE = 97;
const FILE_NAME = "danh_sach_k10_2026.xlsx";

/* ─── Component ──────────────────────────────────── */
export const CheckAndPreview = (): JSX.Element => {
    const [isCollapsed, toggle] = useSidebarCollapsed();

    return (
        <div className="nb-page flex flex-col">
            {/* Sidebar + Content */}
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
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

                    <main className="flex-1 px-4 sm:px-6 lg:px-8 pb-8 space-y-5">
                        {/* Back button */}
                        <Button variant="ghost" className="h-auto p-0 gap-1.5 font-semibold text-[#4c5769] text-sm hover:bg-transparent hover:text-black">
                            <ArrowLeftIcon className="w-4 h-4" />
                            Quay lại danh sách
                        </Button>

                        {/* Title */}
                        <div className="space-y-1.5">
                            <h1 className="font-bold text-black text-2xl">
                                Xem trước lỗi dữ liệu
                            </h1>
                        </div>

                        {/* Stat cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-white rounded-[10px] border border-[#e3e8ef] px-6 py-4">
                                <p className="font-medium text-[#4c5769] text-sm mb-1">
                                    Tổng số dòng tải lên
                                </p>
                                <p className="font-extrabold text-black text-4xl">
                                    {TOTAL_ROWS}
                                </p>
                            </div>

                            <div className="bg-[#fff5f5] rounded-[10px] border border-[#ffd5d5] px-6 py-4">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <AlertCircleIcon className="w-4 h-4 text-[#e53e3e]" />
                                    <p className="font-medium text-[#e53e3e] text-sm">
                                        Dòng bị lỗi
                                    </p>
                                </div>
                                <p className="font-extrabold text-[#e53e3e] text-4xl">
                                    {ERROR_COUNT}
                                </p>
                            </div>

                            <div className="bg-[#f0fff4] rounded-[10px] border border-[#c6f6d5] px-6 py-4">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <CheckCircle2Icon className="w-4 h-4 text-[#38a169]" />
                                    <p className="font-medium text-[#38a169] text-sm">
                                        Tỷ lệ thành công
                                    </p>
                                </div>
                                <p className="font-extrabold text-[#38a169] text-4xl">
                                    {SUCCESS_RATE}%
                                </p>
                            </div>
                        </div>

                        {/* Info bar */}
                        <div className="flex flex-wrap items-center justify-end gap-3 bg-[#ebf3fd] rounded-[10px] border border-[#c8def9] px-4 py-3">
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <Button variant="outline" className="h-9 gap-1.5 border-[#cac9d6] font-semibold text-[#4c5769] text-sm rounded-[8px]">
                                    <DownloadIcon className="w-4 h-4" />
                                    Tải báo cáo lỗi
                                </Button>
                                <Button variant="outline" className="h-9 gap-1.5 border-[#cac9d6] font-semibold text-[#4c5769] text-sm rounded-[8px]">
                                    <UploadIcon className="w-4 h-4" />
                                    Tải lên lại tệp
                                </Button>
                            </div>
                        </div>

                        {/* Error table */}
                        <div className="bg-white rounded-[10px] border border-[#e3e8ef] overflow-hidden">
                            {/* Table header */}
                            <div className="grid grid-cols-[2.5rem_1fr_8.75rem_6.25rem_5.625rem_8.75rem_1fr] gap-2 items-center h-12 bg-slate-50 border-b border-[#e3e8ef] px-4">
                                {["#", "HỌ VÀ TÊN", "MàHỌC SINH", "LỚP", "GIỚI TÍNH", "SĐT PHỤ HUYNH", "TRẠNG THÁI LỖI"].map((col) => (
                                    <span key={col} className="font-bold text-black text-xs">
                                        {col}
                                    </span>
                                ))}
                            </div>

                            {/* Rows */}
                            <div className="divide-y divide-[#e3e8ef]">
                                {errorRows.map((row) => (
                                    <div key={row.rowNumber} className="grid grid-cols-[2.5rem_1fr_8.75rem_6.25rem_5.625rem_8.75rem_1fr] gap-2 items-center px-4 py-3">
                                        <span className="font-semibold text-[#677489] text-sm">
                                            {row.rowNumber}
                                        </span>

                                        <span className="font-semibold text-black text-sm truncate">
                                            {row.name}
                                        </span>

                                        <span className={`font-semibold text-sm px-2 py-1 rounded-[6px] w-fit ${row.studentIdError ? "bg-[#fff5f5] text-[#e53e3e] border border-[#ffd5d5]" : "text-black"}`}>
                                            {row.studentId}
                                        </span>

                                        <span className={`font-semibold text-sm px-2 py-1 rounded-[6px] w-fit ${row.gradeError ? "bg-[#fff5f5] text-[#e53e3e] border border-[#ffd5d5]" : "text-black"}`}>
                                            {row.grade}
                                        </span>

                                        <span className="font-semibold text-black text-sm">
                                            {row.gender}
                                        </span>

                                        <span className="font-semibold text-black text-sm">
                                            {row.parentPhone}
                                        </span>

                                        {row.status.type === "fixed" ? (
                                            <Badge className="w-fit h-auto flex items-center gap-1 bg-[#f0fff4] hover:bg-[#f0fff4] text-[#38a169] border border-[#c6f6d5] rounded-[6px] px-2 py-1">
                                                <CheckCircle2Icon className="w-3 h-3" />
                                                <span className="font-semibold text-xs">Đã sửa</span>
                                            </Badge>
                                        ) : (
                                            <Badge className="w-fit h-auto flex items-center gap-1 bg-[#fff5f5] hover:bg-[#fff5f5] text-[#e53e3e] border border-[#ffd5d5] rounded-[6px] px-2 py-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[#e53e3e] flex-shrink-0" />
                                                <span className="font-semibold text-xs whitespace-nowrap">{row.status.message}</span>
                                            </Badge>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Table footer - pagination */}
                            <div className="flex items-center justify-between h-12 bg-slate-50 border-t border-[#e3e8ef] px-4">
                                <span className="font-medium text-[#677489] text-sm">
                                    Hiện thị <span className="font-bold text-black">5</span> trong số <span className="font-bold text-black">{ERROR_COUNT}</span> lỗi
                                </span>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="w-7 h-7 p-0">
                                        <ChevronLeftIcon className="w-4 h-4" />
                                    </Button>
                                    {[1, 2, 3].map((page) => (
                                        <Button
                                            key={page}
                                            variant={page === 1 ? "default" : "ghost"}
                                            size="sm"
                                            className={`w-7 h-7 p-0 rounded-[6px] font-bold text-sm ${page === 1 ? "bg-[#3c6efd] hover:bg-[#3c6efd]" : ""}`}
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

                        {/* Bottom action bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-[10px] border border-[#e3e8ef] px-5 py-4">
                            <p className="font-medium text-[#4c5769] text-sm">
                                Bạn đã sửa{" "}
                                <span className="font-bold text-[#38a169]">{FIXED_COUNT} lỗi</span>.
                                {" "}Còn lại{" "}
                                <span className="font-bold text-[#e53e3e]">{ERROR_COUNT - FIXED_COUNT} lỗi</span>{" "}
                                cần xử lý.
                            </p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <Button variant="ghost" className="h-9 font-semibold text-[#4c5769] text-sm rounded-[8px]">
                                    Hủy bỏ
                                </Button>
                                <Button variant="outline" className="h-9 border-[#3c6efd] text-[#3c6efd] hover:bg-[#ebf3fd] font-semibold text-sm rounded-[8px]">
                                    Chỉ nhập {TOTAL_ROWS - ERROR_COUNT} dòng hợp lệ
                                </Button>
                                <Button className="h-9 bg-[#3c6efd] hover:bg-[#3c6efd]/90 font-semibold text-white text-sm rounded-[8px] gap-1.5">
                                    <UploadIcon className="w-4 h-4" />
                                    Lưu &amp; Nhập lại
                                </Button>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};
