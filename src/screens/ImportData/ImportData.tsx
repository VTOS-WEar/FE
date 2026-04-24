import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
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
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useSidebarConfig } from "../../hooks/useSidebarConfig";
import {
    downloadImportTemplate,
    importStudents,
    getSchoolProfile,
    getImportHistory,
    getImportStatus,
    type ImportStudentResult,
    type ImportBatchDto,
    type ImportStatusDto,
} from "../../lib/api/schools";
import { ApiError } from "../../lib/api/clients";
import { useEffect } from "react";



/* ── Helper: format ISO date to readable Vietnamese format (UTC+7) ── */
function formatDate(isoDate: string): string {
    const d = new Date(isoDate);
    const opts: Intl.DateTimeFormatOptions = { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", hour12: false };
    const dateOpts: Intl.DateTimeFormatOptions = { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric" };
    const time = d.toLocaleTimeString("vi-VN", opts);
    const date = d.toLocaleDateString("vi-VN", dateOpts);
    return `${time}, ${date}`;
}

export const ImportData = (): JSX.Element => {
    const navigate = useNavigate();
    const sidebarConfig = useSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
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

    /* ── Import status state (dynamic banner) ── */
    const [importStatus, setImportStatus] = useState<ImportStatusDto | null>(null);

    /* ── Load school name + import history + import status ── */
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
        getImportStatus()
            .then(setImportStatus)
            .catch(() => {});
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
        if (ext !== "xlsx") {
            setError("Chỉ hỗ trợ file .xlsx (Excel).");
            return;
        }
        if (file.size > 20 * 1024 * 1024) {
            setError("File quá lớn. Kích thước tối đa là 20MB.");
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
            // Refresh import history + status after successful import
            fetchHistory();
            getImportStatus().then(setImportStatus).catch(() => {});
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

    /* ── modern step data ── */
    const steps = [
        { step: 1, title: "Tải mẫu chuẩn", bg: "#ede9fe", borderColor: "border-gray-200" },
        { step: 2, title: "Điền thông tin", bg: "#dbeafe", borderColor: "border-gray-200" },
        { step: 3, title: "Tải lên hệ thống", bg: "#dcfce7", borderColor: "border-emerald-200" },
    ];

    /* ── Render ── */
    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                {/* Sidebar */}
                <div
                    className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}
                >
                    <DashboardSidebar
                        {...sidebarConfig}
                        name={schoolName}
                        isCollapsed={isCollapsed}
                        onToggle={toggle}
                        onLogout={handleLogout}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Breadcrumb header */}
                    <TopNavBar>
                        <Breadcrumb>
                            <BreadcrumbList className="gap-2.5">
                                <BreadcrumbItem>
                                    <BreadcrumbLink className="font-semibold text-[#4c5769] text-base">
                                        Trang chủ
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="font-semibold text-[#cbcad7] text-base">
                                    /
                                </BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbLink className="font-semibold text-[#4c5769] text-base">
                                        Danh sách học sinh
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="font-semibold text-[#cbcad7] text-base">
                                    /
                                </BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="font-semibold text-black text-base">
                                        Nhập dữ liệu học sinh
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </TopNavBar>

                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6">
                        {/* ── Page header ── */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="font-black text-gray-900 text-[28px] lg:text-[32px] leading-[1.22]">
                                    Nhập dữ liệu học sinh
                                </h1>
                            </div>
                            <button
                                type="button"
                                onClick={() => historySectionRef.current?.scrollIntoView({ behavior: "smooth" })}
                                className="flex items-center gap-2 rounded-[10px] border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-extrabold text-gray-900 shadow-soft-sm transition-all hover:scale-[0.99] whitespace-nowrap"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
                                </svg>
                                Lịch sử tải lên
                            </button>
                        </div>

                        {/* ── Announcement card (dynamic) ── */}
                        {importStatus?.needsUpdate && (
                            <div className="rounded-[14px] border border-gray-200 bg-amber-50 p-5 shadow-soft-md flex gap-4">
                                <div className="flex-shrink-0 w-11 h-11 rounded-[10px] border border-amber-200 bg-amber-100 shadow-soft-sm flex items-center justify-center">
                                    <svg className="w-6 h-6 text-[#E65100]" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.07-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1l5 3V6L5 9H4zm5.03-1.71L8 8.15V9h-.17L5.03 7.29zm0 9.42L5.86 15H5v-.85l-1.97-1.15V15l4 2.71zM11.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                        <h3 className="font-black text-gray-900 text-base">
                                            Cần cập nhật: Dữ liệu {importStatus.currentSemester}
                                        </h3>
                                        <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-extrabold text-red-600 shadow-soft-sm">
                                            Chưa nhập liệu
                                        </span>
                                    </div>
                                    <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 shadow-soft-sm">
                                        <svg className="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm4-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
                                        </svg>
                                        <span className="font-extrabold text-amber-700 text-[12px]">
                                            Hạn chót đề xuất: {importStatus.suggestedDeadline}
                                        </span>
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* ── 3-Step instructions ── */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {steps.map(({ step, title, bg, borderColor }) => (
                                <div
                                    key={step}
                                    className={`rounded-[14px] border ${borderColor} p-5 flex flex-col items-start gap-3 transition-all ${step === 3 ? "bg-emerald-50 border-emerald-200" : "bg-white"}`}
                                >
                                    <div
                                        className={`w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center font-black text-gray-900 text-lg shadow-soft-sm ${step === 3 ? "scale-110" : ""}`}
                                        style={{ backgroundColor: bg }}
                                    >
                                        {step}
                                    </div>
                                    <h3 className="font-black text-gray-900 text-base">
                                        {title}
                                    </h3>
                                </div>
                            ))}
                        </div>

                        {/* ── Two-column: Template + Notes | Upload ── */}
                        <div className="grid grid-cols-1 lg:grid-cols-[minmax(300px,420px)_1fr] gap-6">
                            {/* Left column */}
                            <div className="space-y-6">
                                {/* Template download card */}
                                <div className="rounded-[14px] border border-gray-200 bg-white p-5 shadow-soft-md space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-gray-200 bg-sky-50 shadow-soft-sm">
                                            <svg className="w-5 h-5 text-sky-500" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
                                            </svg>
                                        </div>
                                    <h3 className="font-black text-gray-900 text-base">
                                        File mẫu nhập liệu
                                    </h3>
                                </div>
                                    <button
                                        type="button"
                                        onClick={handleDownloadTemplate}
                                        disabled={downloadingTemplate}
                                        className="w-full flex items-center justify-center gap-2 rounded-[10px] border border-gray-200 bg-white px-4 py-3 text-[14px] font-extrabold text-gray-700 shadow-soft-sm transition-all hover:scale-[0.99] hover:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                                        </svg>
                                        {downloadingTemplate ? "Đang tải..." : "Tải xuống mẫu Excel chuẩn"}
                                    </button>
                                </div>

                            </div>

                            {/* Right column: Upload zone */}
                            <div className="rounded-[14px] border border-gray-200 bg-white p-5 shadow-soft-md space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-black text-gray-900 text-lg">
                                        Tải lên dữ liệu
                                    </h3>
                                    <span className="rounded-full border border-gray-200 bg-sky-50 px-2.5 py-0.5 text-[11px] font-extrabold text-sky-600 shadow-soft-sm">
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
                                    className={`rounded-[14px] border-2 border-dashed px-6 py-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
                                        dragover
                                            ? "border-violet-400 bg-violet-50 shadow-soft-sm"
                                            : "border-gray-200 bg-gray-50 shadow-soft-sm hover:border-violet-300 hover:bg-white"
                                    }`}
                                >
                                    {/* Upload icon */}
                                    <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[14px] border border-gray-200 bg-violet-50 shadow-soft-sm">
                                        <svg
                                            className={`w-10 h-10 ${dragover ? "text-violet-400" : "text-violet-500"}`}
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                        >
                                            <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" />
                                        </svg>
                                    </div>
                                    <p className="font-black text-gray-900 text-[17px]">
                                        Kéo thả file vào đây
                                    </p>
                                    {/* CTA: purple primary */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            fileInputRef.current?.click();
                                        }}
                                        className="rounded-[10px] border border-violet-500 bg-violet-500 px-6 py-3 text-[14px] font-extrabold text-white shadow-soft-sm transition-all hover:scale-[0.99] hover:shadow-sm"
                                    >
                                        Chọn file Excel (.xlsx)
                                    </button>
                                    <span className="rounded-[8px] border border-gray-200 bg-gray-50 px-3 py-1.5 text-[11px] font-bold text-gray-500">
                                        Định dạng Excel (.xlsx) — tối đa 20MB
                                    </span>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".xlsx"
                                        className="hidden"
                                        onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (f) handleFileSelect(f);
                                        }}
                                    />
                                </div>

                                {/* Selected file display */}
                                {selectedFile && (
                                    <div className="flex items-center justify-between rounded-[10px] border border-gray-200 bg-gray-50 px-4 py-3 shadow-soft-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-gray-200 bg-sky-50 shadow-soft-sm">
                                                <svg className="w-5 h-5 text-sky-500" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-extrabold text-gray-900 text-sm">
                                                    {selectedFile.name}
                                                </p>
                                                <p className="font-semibold text-gray-500 text-xs">
                                                    {(selectedFile.size / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSelectedFile(null);
                                                if (fileInputRef.current) fileInputRef.current.value = "";
                                            }}
                                            className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-gray-200 bg-white shadow-soft-sm transition-all hover:scale-[0.99] hover:shadow-sm"
                                        >
                                            <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                                            </svg>
                                        </button>
                                    </div>
                                )}

                                {/* Upload button */}
                                {selectedFile && (
                                    <button
                                        type="button"
                                        onClick={handleUpload}
                                        disabled={uploading}
                                        className="w-full flex items-center justify-center gap-2 rounded-[10px] border border-emerald-500 bg-emerald-500 px-4 py-3 text-[14px] font-extrabold text-white shadow-soft-sm transition-all hover:scale-[0.99] hover:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {uploading ? (
                                            <span className="flex items-center gap-2">
                                                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                                Đang nhập liệu...
                                            </span>
                                        ) : (
                                            "Tải lên và nhập liệu"
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* ── Error message ── */}
                        {error && (
                            <div className="rounded-[10px] border border-red-200 bg-red-50 p-3.5 shadow-soft-sm flex items-center gap-2">
                                <svg className="w-5 h-5 flex-shrink-0 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                                </svg>
                                <p className="font-bold text-[13px] text-red-600">{error}</p>
                            </div>
                        )}

                        {/* ── Import result ── */}
                        {result && (
                            <div
                                className={`rounded-[14px] border border-gray-200 p-5 shadow-soft-md ${
                                    result.errorCount > 0 ? "bg-amber-50" : "bg-emerald-50"
                                }`}
                            >
                                <h3 className="font-black text-gray-900 text-base mb-3">
                                    📊 Kết quả nhập liệu
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                                    {[
                                        { label: "Tổng dòng", value: result.totalRows, color: "#0284c7" },
                                        { label: "Thành công", value: result.successCount, color: "#16a34a" },
                                        { label: "Bỏ qua", value: result.skippedCount, color: "#d97706" },
                                        { label: "Lỗi", value: result.errorCount, color: "#dc2626" },
                                    ].map(({ label, value, color }) => (
                                        <div key={label} className="rounded-[10px] border border-gray-200 bg-white px-3 py-2.5 text-center shadow-soft-sm">
                                            <p className="font-black text-xl" style={{ color }}>{value}</p>
                                            <p className="font-semibold text-gray-500 text-xs">{label}</p>
                                        </div>
                                    ))}
                                </div>
                                {result.errors.length > 0 && (
                                    <div className="rounded-[10px] border border-gray-200 bg-white overflow-hidden shadow-soft-sm">
                                        <div className="grid grid-cols-[60px_1fr_2fr] px-4 py-2 bg-red-50 text-xs font-black text-red-600 border-b border-gray-200">
                                            <span>Dòng</span>
                                            <span>Tên HS</span>
                                            <span>Lỗi</span>
                                        </div>
                                        {result.errors.slice(0, 10).map((e, i) => (
                                            <div
                                                key={i}
                                                className="grid grid-cols-[60px_1fr_2fr] px-4 py-2 text-sm border-b border-gray-100"
                                            >
                                                <span className="font-extrabold text-red-600">{e.rowNumber}</span>
                                                <span className="font-semibold text-gray-900">{e.studentName || "—"}</span>
                                                <span className="font-semibold text-red-600">{e.errorMessage}</span>
                                            </div>
                                        ))}
                                        {result.errors.length > 10 && (
                                            <p className="text-center text-xs font-semibold text-gray-500 py-2">
                                                ... và {result.errors.length - 10} lỗi khác
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Import history ── */}
                        <div className="space-y-4" ref={historySectionRef}>
                            <h2 className="font-black text-gray-900 text-xl">
                                Lịch sử nhập liệu gần đây
                            </h2>

                            {importHistory.length === 0 ? (
                                <div className="rounded-[14px] border border-gray-200 bg-white p-10 shadow-soft-md flex flex-col items-center gap-3">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-[14px] border border-gray-200 bg-gray-50 shadow-soft-sm">
                                        <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                                        </svg>
                                    </div>
                                    <p className="font-black text-gray-900 text-base">
                                        Chưa có lịch sử nhập liệu
                                    </p>
                                </div>
                            ) : (
                                <div className="rounded-[14px] border border-gray-200 bg-white overflow-hidden shadow-soft-md">
                                    {/* Table header */}
                                    <div className="hidden sm:grid grid-cols-[3fr_2fr_2fr_1.5fr] px-6 lg:px-8 py-4 bg-gray-50 border-b border-gray-200">
                                        {["Tên file", "Thời gian", "Trạng thái", "Chi tiết"].map((h) => (
                                            <span key={h} className="font-black text-gray-700 text-sm">
                                                {h}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Table rows */}
                                    <div className="divide-y divide-gray-100">
                                        {importHistory.map((row) => (
                                            <div
                                                key={row.id}
                                                className="grid grid-cols-1 sm:grid-cols-[3fr_2fr_2fr_1.5fr] px-6 lg:px-8 py-4 gap-2 sm:gap-0 items-center"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-gray-200 bg-sky-50 shadow-soft-sm flex-shrink-0">
                                                        <svg className="w-4 h-4 text-sky-500" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
                                                        </svg>
                                                    </div>
                                                    <span className="font-extrabold text-gray-900 text-sm">
                                                        {row.fileName}
                                                    </span>
                                                </div>
                                                <span className="font-semibold text-gray-500 text-sm">
                                                    {formatDate(row.createdAt)}
                                                </span>
                                                <div>
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-2.5 py-0.5 text-[11px] font-extrabold shadow-soft-sm ${
                                                            row.status === "success"
                                                                ? "bg-emerald-50 text-emerald-700"
                                                                : "bg-red-50 text-red-600"
                                                        }`}
                                                    >
                                                        <span
                                                            className={`w-2 h-2 rounded-full ${
                                                                row.status === "success" ? "bg-emerald-500" : "bg-red-500"
                                                            }`}
                                                        />
                                                        {row.status === "success" ? "Thành công" : "Có lỗi"}
                                                    </span>
                                                </div>
                                                <div className="font-semibold text-[#6F6A7D] text-xs">
                                                    {row.successCount}/{row.totalRows} dòng
                                                    {row.skippedCount > 0 && ` (đã bỏ qua ${row.skippedCount})`}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Table footer */}
                                    <div className="border-t border-gray-200 bg-gray-50 flex justify-center py-3">
                                        <span className="font-semibold text-gray-500 text-sm">
                                            Hiển thị {importHistory.length} bản ghi gần nhất
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>

        </div>
    );
};
