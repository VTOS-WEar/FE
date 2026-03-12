import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { DashboardSidebar } from "../../components/layout";
import { useSidebarConfig } from "../../hooks/useSidebarConfig";
import { Button } from "../../components/ui/button";
import {
    downloadImportTemplate,
    importStudents,
    getSchoolProfile,
    getImportHistory,
    type ImportStudentResult,
    type ImportBatchDto,
} from "../../lib/api/schools";
import { ApiError } from "../../lib/api/clients";
import { useEffect } from "react";



/* ── Helper: format ISO date to readable Vietnamese format ── */
function formatDate(isoDate: string): string {
    const d = new Date(isoDate);
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    const dd = d.getDate().toString().padStart(2, "0");
    const mo = (d.getMonth() + 1).toString().padStart(2, "0");
    return `${hh}:${mm}, ${dd}/${mo}/${d.getFullYear()}`;
}

export const ImportData = (): JSX.Element => {
    const navigate = useNavigate();
    const sidebarConfig = useSidebarConfig();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [schoolName, setSchoolName] = useState("");

    /* ── Upload state ── */
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [downloadingTemplate, setDownloadingTemplate] = useState(false);
    const [dragover, setDragover] = useState(false);
    const [result, setResult] = useState<ImportStudentResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    /* ── Import history state ── */
    const [importHistory, setImportHistory] = useState<ImportBatchDto[]>([]);
    const historySectionRef = useRef<HTMLDivElement>(null);

    /* ── Load school name + import history ── */
    const fetchHistory = useCallback(async () => {
        try {
            const data = await getImportHistory(10);
            setImportHistory(data);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        getSchoolProfile()
            .then((p) => setSchoolName(p.schoolName || ""))
            .catch(() => {});
        fetchHistory();
    }, [fetchHistory]);

    /* ── Handlers ── */
    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    const handleDownloadTemplate = async () => {
        setDownloadingTemplate(true);
        try {
            await downloadImportTemplate();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Không thể tải file mẫu.");
        } finally {
            setDownloadingTemplate(false);
        }
    };

    const handleFileSelect = useCallback((file: File) => {
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (ext !== "xlsx" && ext !== "csv") {
            setError("Chỉ hỗ trợ file .xlsx hoặc .csv.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError("File quá lớn. Kích thước tối đa là 5MB.");
            return;
        }
        setSelectedFile(file);
        setError(null);
        setResult(null);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragover(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFileSelect(file);
        },
        [handleFileSelect]
    );

    const handleUpload = async () => {
        if (!selectedFile) return;
        setUploading(true);
        setError(null);
        setResult(null);
        try {
            const res = await importStudents(selectedFile);
            setResult(res);
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            // Refresh import history after successful import
            fetchHistory();
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError("Đã xảy ra lỗi khi tải lên. Vui lòng thử lại.");
            }
        } finally {
            setUploading(false);
        }
    };

    /* ── Render ── */
    return (
        <div className="bg-[#f6f7f8] w-full min-h-screen flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                {/* Sidebar */}
                <div
                    className={`${isCollapsed ? "lg:w-16" : "lg:w-[20rem] xl:w-[23.75rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}
                >
                    <DashboardSidebar
                        {...sidebarConfig}
                        name={schoolName}
                        isCollapsed={isCollapsed}
                        onToggle={() => setIsCollapsed((prev) => !prev)}
                        onLogout={handleLogout}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Breadcrumb header */}
                    <div className="bg-white border-b border-[#cbcad7] px-4 sm:px-6 lg:px-10 py-5">
                        <Breadcrumb>
                            <BreadcrumbList className="gap-2.5">
                                <BreadcrumbItem>
                                    <BreadcrumbLink className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4c5769] text-base">
                                        Trang chủ
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="[font-family:'Montserrat',Helvetica] font-semibold text-[#cbcad7] text-base">
                                    /
                                </BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbLink className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4c5769] text-base">
                                        Danh sách học sinh
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="[font-family:'Montserrat',Helvetica] font-semibold text-[#cbcad7] text-base">
                                    /
                                </BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="[font-family:'Montserrat',Helvetica] font-semibold text-black text-base">
                                        Nhập dữ liệu học sinh
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>

                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6">
                        {/* ── Page header ── */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="[font-family:'Montserrat',Helvetica] font-bold text-black text-[28px] lg:text-[32px] leading-[1.22]">
                                    Nhập dữ liệu học sinh
                                </h1>
                                <p className="mt-1 [font-family:'Montserrat',Helvetica] font-medium text-[#4c5769] text-sm lg:text-base">
                                    Cập nhật danh sách học sinh đầu kỳ để kích hoạt tính năng thử đồ ảo và đặt mua đồng phục.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] border-[#cbcad7] rounded-[10px] [font-family:'Montserrat',Helvetica] font-semibold text-black text-sm gap-2 px-4 py-2.5 h-auto whitespace-nowrap"
                                onClick={() => historySectionRef.current?.scrollIntoView({ behavior: "smooth" })}
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
                                </svg>
                                Lịch sử tải lên
                            </Button>
                        </div>

                        {/* ── Announcement card ── */}
                        <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-[10px] p-5 flex gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-[#FFD54F] rounded-[10px] flex items-center justify-center">
                                <svg className="w-6 h-6 text-[#E65100]" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.07-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1l5 3V6L5 9H4zm5.03-1.71L8 8.15V9h-.17L5.03 7.29zm0 9.42L5.86 15H5v-.85l-1.97-1.15V15l4 2.71zM11.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                    <h3 className="[font-family:'Montserrat',Helvetica] font-bold text-black text-base">
                                        Cần cập nhật: Dữ liệu Học kỳ 1 (2026-2027)
                                    </h3>
                                    <span className="px-2.5 py-0.5 bg-[#FFF3E0] border border-[#FFB74D] rounded-[5px] [font-family:'Montserrat',Helvetica] font-semibold text-[#E65100] text-xs">
                                        Chưa nhập liệu
                                    </span>
                                </div>
                                <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#5D4037] text-sm leading-relaxed mb-2">
                                    Hệ thống chưa ghi nhận danh sách học sinh cho học kỳ mới. Nhà trường vui lòng cập nhật sớm để
                                    đảm bảo học sinh có thể truy cập Phòng thử ảo và đặt mua đồng phục đúng hạn.
                                </p>
                                <div className="flex items-center gap-2 bg-[#FFECB3] rounded-[10px] px-3 py-1.5 w-fit">
                                    <svg className="w-5 h-5 text-[#E65100]" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm4-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
                                    </svg>
                                    <span className="[font-family:'Montserrat',Helvetica] font-semibold text-[#BF360C] text-sm">
                                        Hạn chót đề xuất: 30/08/2026
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* ── 3-Step instructions ── */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                {
                                    step: 1,
                                    title: "Tải mẫu chuẩn",
                                    desc: "Tải file mẫu Excel (.xlsx) chuẩn định dạng của hệ thống.",
                                    color: "#6938ef",
                                },
                                {
                                    step: 2,
                                    title: "Điền thông tin",
                                    desc: "Nhập dữ liệu vào file mẫu. Không thay đổi tiêu đề cột.",
                                    color: "#478aea",
                                },
                                {
                                    step: 3,
                                    title: "Tải lên hệ thống",
                                    desc: "Kéo thả file đã điền đầy đủ thông tin để nhập liệu.",
                                    color: "#10b981",
                                },
                            ].map(({ step, title, desc, color }) => (
                                <div
                                    key={step}
                                    className="bg-white rounded-[10px] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 flex flex-col items-start gap-3"
                                >
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold [font-family:'Montserrat',Helvetica] text-lg"
                                        style={{ backgroundColor: color }}
                                    >
                                        {step}
                                    </div>
                                    <h3 className="[font-family:'Montserrat',Helvetica] font-bold text-black text-base">
                                        {title}
                                    </h3>
                                    <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#4c5769] text-sm leading-relaxed">
                                        {desc}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* ── Two-column: Template + Notes | Upload ── */}
                        <div className="grid grid-cols-1 lg:grid-cols-[minmax(300px,420px)_1fr] gap-6">
                            {/* Left column */}
                            <div className="space-y-6">
                                {/* Template download card */}
                                <div className="bg-white rounded-[10px] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <svg className="w-8 h-8 text-[#478aea]" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
                                        </svg>
                                        <h3 className="[font-family:'Montserrat',Helvetica] font-bold text-black text-base">
                                            File mẫu nhập liệu
                                        </h3>
                                    </div>
                                    <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#4c5769] text-sm leading-relaxed">
                                        Vui lòng sử dụng file mẫu mới nhất để tránh lỗi định dạng khi tải lên.
                                        File mẫu bao gồm các cột: Họ và tên, Ngày sinh, Lớp, Giới tính, Số điện thoại phụ huynh.
                                    </p>
                                    <Button
                                        onClick={handleDownloadTemplate}
                                        disabled={downloadingTemplate}
                                        className="bg-[#6938ef] hover:bg-[#5a2dd6] text-white rounded-[10px] [font-family:'Montserrat',Helvetica] font-semibold text-sm gap-2 px-4 py-2.5 h-auto w-full"
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                                        </svg>
                                        {downloadingTemplate ? "Đang tải..." : "Tải xuống mẫu Excel chuẩn"}
                                    </Button>
                                </div>

                                {/* Important notes card */}
                                <div className="bg-[#F0F4FF] border border-[#B3C6FF] rounded-[10px] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 space-y-3">
                                    <h3 className="[font-family:'Montserrat',Helvetica] font-bold text-black text-base">
                                        Lưu ý quan trọng
                                    </h3>
                                    <ul className="space-y-2.5">
                                        {[
                                            "Mã học sinh phải là duy nhất trong toàn trường.",
                                            "Định dạng ngày sinh phải là dd/mm/yyyy (Ví dụ: 15/05/2008).",
                                            "Tên Lớp phải trùng khớp với danh sách lớp đã tạo trên hệ thống.",
                                        ].map((note, i) => (
                                            <li key={i} className="flex items-start gap-2.5">
                                                <svg
                                                    className="w-5 h-5 text-[#10b981] flex-shrink-0 mt-0.5"
                                                    viewBox="0 0 24 24"
                                                    fill="currentColor"
                                                >
                                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                                </svg>
                                                <span className="[font-family:'Montserrat',Helvetica] font-medium text-[#374151] text-sm leading-relaxed">
                                                    {note}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Right column: Upload zone */}
                            <div className="bg-white rounded-[10px] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="[font-family:'Montserrat',Helvetica] font-bold text-black text-base">
                                        Tải lên dữ liệu
                                    </h3>
                                    <span className="px-2.5 py-1 bg-[#EBF5FF] border border-[#90CAF9] rounded-[5px] [font-family:'Montserrat',Helvetica] font-semibold text-[#1565C0] text-xs">
                                        Kỳ học mới
                                    </span>
                                </div>

                                {/* Drag-drop zone */}
                                <div
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setDragover(true);
                                    }}
                                    onDragLeave={() => setDragover(false)}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-[10px] px-6 py-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
                                        dragover
                                            ? "border-[#6938ef] bg-[#f5f0ff]"
                                            : "border-[#cbcad7] hover:border-[#478aea] hover:bg-[#f8faff]"
                                    }`}
                                >
                                    <svg
                                        className={`w-12 h-12 ${dragover ? "text-[#6938ef]" : "text-[#97a3b6]"}`}
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                    >
                                        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zm-6-3.5l-4-4h2.5V10h3v2.5H16l-4 4z" />
                                    </svg>
                                    <p className="[font-family:'Montserrat',Helvetica] font-bold text-black text-base">
                                        Kéo thả file vào đây
                                    </p>
                                    <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#4c5769] text-xs">
                                        Hoặc nhấn vào để chọn file từ máy tính
                                    </p>
                                    <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#97a3b6] text-xs">
                                        Kích thước tối đa: 5MB
                                    </p>
                                    <Button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            fileInputRef.current?.click();
                                        }}
                                        className="bg-[#4ca2e6] hover:bg-[#3b8fd0] text-white rounded-[10px] [font-family:'Montserrat',Helvetica] font-semibold text-sm px-5 py-2 h-auto shadow-[0_2px_6px_rgba(76,162,230,0.3)]"
                                    >
                                        Chọn file (.xlsx, .csv)
                                    </Button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".xlsx,.csv"
                                        className="hidden"
                                        onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (f) handleFileSelect(f);
                                        }}
                                    />
                                </div>

                                {/* Selected file display */}
                                {selectedFile && (
                                    <div className="flex items-center justify-between bg-[#f8faff] border border-[#cbcad7] rounded-[10px] px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <svg className="w-8 h-8 text-[#478aea]" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
                                            </svg>
                                            <div>
                                                <p className="[font-family:'Montserrat',Helvetica] font-semibold text-black text-sm">
                                                    {selectedFile.name}
                                                </p>
                                                <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#97a3b6] text-xs">
                                                    {(selectedFile.size / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSelectedFile(null);
                                                if (fileInputRef.current) fileInputRef.current.value = "";
                                            }}
                                            className="text-[#97a3b6] hover:text-red-500 transition-colors"
                                        >
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                                            </svg>
                                        </button>
                                    </div>
                                )}

                                {/* Upload button */}
                                {selectedFile && (
                                    <Button
                                        onClick={handleUpload}
                                        disabled={uploading}
                                        className="w-full bg-[#10b981] hover:bg-[#059669] text-white rounded-[10px] [font-family:'Montserrat',Helvetica] font-bold text-base py-3 h-auto shadow-[0_2px_8px_rgba(16,185,129,0.3)]"
                                    >
                                        {uploading ? (
                                            <span className="flex items-center gap-2">
                                                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                                Đang nhập liệu...
                                            </span>
                                        ) : (
                                            "Tải lên và nhập liệu"
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* ── Error message ── */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 rounded-[10px] px-4 py-3 [font-family:'Montserrat',Helvetica] text-sm font-medium flex items-center gap-2">
                                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                                </svg>
                                {error}
                            </div>
                        )}

                        {/* ── Import result ── */}
                        {result && (
                            <div
                                className={`rounded-[10px] px-5 py-4 [font-family:'Montserrat',Helvetica] border ${
                                    result.errorCount > 0
                                        ? "bg-[#FFF8E1] border-[#FFE082]"
                                        : "bg-green-50 border-green-200"
                                }`}
                            >
                                <h3 className="font-bold text-black text-base mb-3">
                                    📊 Kết quả nhập liệu
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                                    <div className="bg-white rounded-lg px-3 py-2 text-center">
                                        <p className="font-bold text-[#478aea] text-xl">{result.totalRows}</p>
                                        <p className="font-medium text-[#4c5769] text-xs">Tổng dòng</p>
                                    </div>
                                    <div className="bg-white rounded-lg px-3 py-2 text-center">
                                        <p className="font-bold text-[#10b981] text-xl">{result.successCount}</p>
                                        <p className="font-medium text-[#4c5769] text-xs">Thành công</p>
                                    </div>
                                    <div className="bg-white rounded-lg px-3 py-2 text-center">
                                        <p className="font-bold text-[#f59e0b] text-xl">{result.skippedCount}</p>
                                        <p className="font-medium text-[#4c5769] text-xs">Bỏ qua</p>
                                    </div>
                                    <div className="bg-white rounded-lg px-3 py-2 text-center">
                                        <p className="font-bold text-red-500 text-xl">{result.errorCount}</p>
                                        <p className="font-medium text-[#4c5769] text-xs">Lỗi</p>
                                    </div>
                                </div>
                                {result.errors.length > 0 && (
                                    <div className="bg-white rounded-lg border border-red-100 overflow-hidden">
                                        <div className="grid grid-cols-[60px_1fr_2fr] px-4 py-2 bg-red-50 text-xs font-bold text-red-700">
                                            <span>Dòng</span>
                                            <span>Tên HS</span>
                                            <span>Lỗi</span>
                                        </div>
                                        {result.errors.slice(0, 10).map((e, i) => (
                                            <div
                                                key={i}
                                                className="grid grid-cols-[60px_1fr_2fr] px-4 py-2 text-sm border-t border-red-50"
                                            >
                                                <span className="font-semibold text-red-600">{e.rowNumber}</span>
                                                <span className="text-[#4c5769]">{e.studentName || "—"}</span>
                                                <span className="text-red-600">{e.errorMessage}</span>
                                            </div>
                                        ))}
                                        {result.errors.length > 10 && (
                                            <p className="text-center text-xs text-[#97a3b6] py-2">
                                                ... và {result.errors.length - 10} lỗi khác
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Import history ── */}
                        <div className="space-y-4" ref={historySectionRef}>
                            <h2 className="[font-family:'Montserrat',Helvetica] font-bold text-black text-xl">
                                Lịch sử nhập liệu gần đây
                            </h2>

                            {importHistory.length === 0 ? (
                                <div className="bg-white border border-[#cbcad7] rounded-[10px] p-8 text-center">
                                    <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#97a3b6] text-sm">
                                        Chưa có lịch sử nhập liệu nào.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Table header */}
                                    <div className="bg-slate-50 rounded-t-[10px] border border-[#cbcad7] overflow-hidden">
                                        <div className="hidden sm:grid grid-cols-[3fr_2fr_2fr_1.5fr] px-6 lg:px-8 py-4">
                                            {["Tên file", "Thời gian", "Trạng thái", "Chi tiết"].map((h) => (
                                                <span
                                                    key={h}
                                                    className="[font-family:'Montserrat',Helvetica] font-bold text-[#4c5769] text-sm"
                                                >
                                                    {h}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Table rows */}
                                    <div className="bg-white border-x border-[#cbcad7] divide-y divide-[#f0f0f5]">
                                        {importHistory.map((row) => (
                                            <div
                                                key={row.id}
                                                className="grid grid-cols-1 sm:grid-cols-[3fr_2fr_2fr_1.5fr] px-6 lg:px-8 py-4 gap-2 sm:gap-0 items-center"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <svg className="w-6 h-6 text-[#478aea] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
                                                    </svg>
                                                    <span className="[font-family:'Montserrat',Helvetica] font-semibold text-black text-sm">
                                                        {row.fileName}
                                                    </span>
                                                </div>
                                                <span className="[font-family:'Montserrat',Helvetica] font-medium text-[#4c5769] text-sm">
                                                    {formatDate(row.createdAt)}
                                                </span>
                                                <div>
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] [font-family:'Montserrat',Helvetica] font-semibold text-xs ${
                                                            row.status === "success"
                                                                ? "bg-green-50 text-green-700"
                                                                : "bg-red-50 text-red-600"
                                                        }`}
                                                    >
                                                        <span
                                                            className={`w-2 h-2 rounded-full ${
                                                                row.status === "success" ? "bg-green-500" : "bg-red-500"
                                                            }`}
                                                        />
                                                        {row.status === "success" ? "Thành công" : "Có lỗi"}
                                                    </span>
                                                </div>
                                                <div className="[font-family:'Montserrat',Helvetica] font-medium text-[#4c5769] text-xs">
                                                    {row.successCount}/{row.totalRows} dòng
                                                    {row.skippedCount > 0 && ` (đã bỏ qua ${row.skippedCount})`}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Table footer */}
                                    <div className="bg-slate-50 rounded-b-[10px] border border-[#cbcad7] flex justify-center py-4">
                                        <span className="[font-family:'Montserrat',Helvetica] font-medium text-[#97a3b6] text-sm">
                                            Hiển thị {importHistory.length} bản ghi gần nhất
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </main>
                </div>
            </div>

        </div>
    );
};
