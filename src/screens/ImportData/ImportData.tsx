import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    FileSpreadsheet,
    History,
    UploadCloud,
} from "lucide-react";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { SCHOOL_THEME } from "../../constants/schoolTheme";
import { useSidebarConfig } from "../../hooks/useSidebarConfig";
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

    /* ── modern step data ── */
    const steps = [
        { step: 1, title: "Tải mẫu chuẩn", bg: "#DBEAFE", borderColor: "border-blue-100" },
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
                    <TopNavBar>
                        <div className="flex items-center gap-3 px-2 py-2">
                            <button
                                type="button"
                                onClick={() => navigate("/school/students")}
                                className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-gray-200 bg-white shadow-soft-sm transition-colors hover:bg-slate-50"
                                aria-label="Quay lại danh sách học sinh"
                            >
                                <ArrowLeft className="h-4 w-4 text-gray-900" />
                            </button>
                            <div className={`flex h-9 w-9 items-center justify-center rounded-[8px] border ${SCHOOL_THEME.primarySoftBorder} ${SCHOOL_THEME.primarySoftBg} ${SCHOOL_THEME.primaryText}`}>
                                <FileSpreadsheet className="h-4 w-4" />
                            </div>
                            <h1 className="text-xl font-bold leading-none text-gray-900">Nhập dữ liệu học sinh</h1>
                        </div>
                    </TopNavBar>

                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6">
                        <section className="overflow-hidden rounded-[8px] border border-gray-200 bg-white shadow-soft-sm">
                            <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr]">
                                <aside className="space-y-5 border-b border-gray-200 bg-slate-50/70 p-5 lg:border-b-0 lg:border-r">
                                    <div>
                                        <h2 className="text-lg font-black text-gray-900">Quy trình nhập liệu</h2>
                                        <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                                            Tải file mẫu, điền dữ liệu học sinh rồi tải lên hệ thống.
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        {steps.map(({ step, title, bg, borderColor }) => (
                                            <div key={step} className={`flex items-center gap-3 rounded-[8px] border ${borderColor} bg-white p-3 shadow-soft-sm`}>
                                                <div
                                                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-gray-200 text-sm font-black text-gray-900 shadow-soft-sm"
                                                    style={{ backgroundColor: bg }}
                                                >
                                                    {step}
                                                </div>
                                                <span className="text-sm font-black text-gray-900">{title}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="rounded-[8px] border border-gray-200 bg-white p-4 shadow-soft-sm">
                                        <div className="flex items-center gap-3">
                                            <div className={`flex h-10 w-10 items-center justify-center rounded-[8px] border ${SCHOOL_THEME.primarySoftBorder} ${SCHOOL_THEME.primarySoftBg} shadow-soft-sm`}>
                                                <FileSpreadsheet className={`h-5 w-5 ${SCHOOL_THEME.primaryText}`} />
                                            </div>
                                            <h3 className="font-black text-gray-900 text-base">File mẫu nhập liệu</h3>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleDownloadTemplate}
                                            disabled={downloadingTemplate}
                                            className="mt-4 w-full flex items-center justify-center gap-2 rounded-[8px] border border-gray-200 bg-white px-4 py-3 text-[14px] font-extrabold text-gray-700 shadow-soft-sm transition-colors hover:border-blue-200 hover:text-[#2563EB] disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                                            </svg>
                                            {downloadingTemplate ? "Đang tải..." : "Tải xuống mẫu Excel chuẩn"}
                                        </button>
                                    </div>
                                </aside>

                                <div className="space-y-4 p-5">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-black text-gray-900 text-lg">
                                        Tải lên dữ liệu
                                    </h3>
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
                                    className={`rounded-[8px] border-2 border-dashed px-6 py-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
                                        dragover
                                            ? "border-blue-300 bg-blue-50 shadow-soft-sm"
                                            : "border-gray-200 bg-gray-50 shadow-soft-sm hover:border-blue-200 hover:bg-white"
                                    }`}
                                >
                                    {/* Upload icon */}
                                    <div className={`flex h-[72px] w-[72px] items-center justify-center rounded-[8px] border ${SCHOOL_THEME.primarySoftBorder} ${SCHOOL_THEME.primarySoftBg} shadow-soft-sm`}>
                                        <UploadCloud className={`h-10 w-10 ${SCHOOL_THEME.primaryText}`} />
                                    </div>
                                    <p className="font-black text-gray-900 text-[17px]">
                                        Kéo thả file vào đây
                                    </p>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            fileInputRef.current?.click();
                                        }}
                                        className={SCHOOL_THEME.primaryButton}
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
                        </section>

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
                                className={`rounded-[8px] border border-gray-200 p-5 shadow-soft-sm ${
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
                            <div className="flex items-center gap-3">
                                <div className={`flex h-9 w-9 items-center justify-center rounded-[8px] border ${SCHOOL_THEME.primarySoftBorder} ${SCHOOL_THEME.primarySoftBg} ${SCHOOL_THEME.primaryText}`}>
                                    <History className="h-4 w-4" />
                                </div>
                                <h2 className="font-black text-gray-900 text-xl">
                                    Lịch sử nhập liệu gần đây
                                </h2>
                            </div>

                            {importHistory.length === 0 ? (
                                <div className="rounded-[8px] border border-gray-200 bg-white p-10 shadow-soft-sm flex flex-col items-center gap-3">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-[8px] border border-gray-200 bg-gray-50 shadow-soft-sm">
                                        <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                                        </svg>
                                    </div>
                                    <p className="font-black text-gray-900 text-base">
                                        Chưa có lịch sử nhập liệu
                                    </p>
                                </div>
                            ) : (
                                <div className="rounded-[8px] border border-gray-200 bg-white overflow-hidden shadow-soft-sm">
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
