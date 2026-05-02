import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, X } from "lucide-react";
import { getTeacherClassesOverview, getTeacherReports, submitTeacherReport, type TeacherReportListItemDto } from "../../lib/api/teachers";
import { TeacherWorkspaceShell } from "./TeacherWorkspaceShell";
import { TeacherHero, TEACHER_THEME } from "./teacherWorkspace";

export const TeacherReports = (): JSX.Element => {
    const [searchParams] = useSearchParams();
    const [reports, setReports] = useState<TeacherReportListItemDto[]>([]);
    const [classOptions, setClassOptions] = useState<{ id: string; className: string }[]>([]);
    const [status, setStatus] = useState("");
    const [reportType, setReportType] = useState("");
    const [classGroupId, setClassGroupId] = useState(searchParams.get("classGroupId") || "");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newClassGroupId, setNewClassGroupId] = useState(searchParams.get("classGroupId") || "");
    const [newReportType, setNewReportType] = useState("General");
    const [newTitle, setNewTitle] = useState("");
    const [newContent, setNewContent] = useState("");
    const [newError, setNewError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getTeacherClassesOverview()
            .then((overview) => setClassOptions(overview.classes.map((item) => ({ id: item.id, className: item.className }))))
            .then(() => {
                if (!newClassGroupId && classOptions.length > 0) {
                    setNewClassGroupId(classOptions[0].id);
                }
            })
            .catch(() => undefined);
    }, []);

    useEffect(() => {
        if (!newClassGroupId && classOptions.length > 0) {
            setNewClassGroupId(classOptions[0].id);
        }
    }, [classOptions, newClassGroupId]);

    const loadReports = () => {
        setLoading(true);
        setError(null);
        getTeacherReports({
            classGroupId: classGroupId || undefined,
            status: status || undefined,
            reportType: reportType || undefined,
        })
            .then((response) => setReports(response.items))
            .catch((err: unknown) => setError(err instanceof Error ? err.message : "Không thể tải báo cáo"))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadReports();
    }, [classGroupId, reportType, status]);

    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        setNewError(null);
        setNewTitle("");
        setNewContent("");
        setNewReportType("General");
    };

    const handleCreateReport = async () => {
        setNewError(null);
        if (!newClassGroupId) {
            setNewError("Vui lòng chọn lớp cần báo cáo.");
            return;
        }
        if (newTitle.trim().length < 5) {
            setNewError("Tiêu đề báo cáo phải dài ít nhất 5 ký tự.");
            return;
        }
        if (newContent.trim().length < 10) {
            setNewError("Nội dung báo cáo phải dài ít nhất 10 ký tự.");
            return;
        }

        try {
            setSaving(true);
            await submitTeacherReport({
                classGroupId: newClassGroupId,
                reportType: newReportType,
                title: newTitle.trim(),
                content: newContent.trim(),
            });
            closeCreateModal();
            loadReports();
        } catch (err: unknown) {
            setNewError(err instanceof Error ? err.message : "Không thể gửi báo cáo");
        } finally {
            setSaving(false);
        }
    };

    return (
        <TeacherWorkspaceShell breadcrumbs={[{ label: "Teacher workspace", href: "/teacher/dashboard" }, { label: "Báo cáo" }]}>
            <TeacherHero
                eyebrow="BÁO CÁO"
                title="Báo cáo đã gửi"
                description="Theo dõi các báo cáo đã gửi cho nhà trường, trạng thái xử lý, và ghi chú phản hồi để không bỏ sót việc cần theo."
                action={
                    <button type="button" onClick={() => setIsCreateModalOpen(true)} className={TEACHER_THEME.primaryButton}>
                        Tạo báo cáo mới
                    </button>
                }
            />

            <section className={`${TEACHER_THEME.panel} mt-6 p-5`}>
                <div className="grid gap-3 md:grid-cols-3">
                    <label className="text-sm font-semibold text-[#4c5769]">
                        Lớp
                        <div className="relative mt-2">
                            <select value={classGroupId} onChange={(e) => setClassGroupId(e.target.value)} className={`${TEACHER_THEME.input} appearance-none pr-11`}>
                                <option value="">Tất cả lớp</option>
                                {classOptions.map((item) => (
                                    <option key={item.id} value={item.id}>Lớp {item.className}</option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        </div>
                    </label>
                    <label className="text-sm font-semibold text-[#4c5769]">
                        Trạng thái
                        <div className="relative mt-2">
                            <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${TEACHER_THEME.input} appearance-none pr-11`}>
                                <option value="">Tất cả</option>
                                <option value="Submitted">Đang chờ xem</option>
                                <option value="Reviewed">Đã xem</option>
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        </div>
                    </label>
                    <label className="text-sm font-semibold text-[#4c5769]">
                        Loại báo cáo
                        <div className="relative mt-2">
                            <select value={reportType} onChange={(e) => setReportType(e.target.value)} className={`${TEACHER_THEME.input} appearance-none pr-11`}>
                                <option value="">Tất cả</option>
                                <option value="General">Tổng hợp</option>
                                <option value="OrderCoverage">Độ phủ đơn hàng</option>
                                <option value="QualityIssue">Vấn đề chất lượng</option>
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        </div>
                    </label>
                </div>
            </section>

            {loading && (
                <section className={`${TEACHER_THEME.panel} mt-6 p-10 text-center`}>
                    <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#059669]" />
                    <p className="text-sm font-semibold text-[#4c5769]">Đang tải báo cáo...</p>
                </section>
            )}

            {!loading && error && (
                <section className="mt-6 rounded-[8px] border border-rose-200 bg-white p-8 text-center shadow-soft-sm">
                    <p className="text-base font-bold text-red-600">{error}</p>
                </section>
            )}

            {!loading && !error && (
                <section className={`${TEACHER_THEME.panel} mt-6`}>
                    <div className="divide-y divide-gray-100">
                        {reports.length === 0 && (
                            <div className="px-5 py-10 text-center text-sm font-semibold text-[#4c5769]">
                                Chưa có báo cáo phù hợp với bộ lọc hiện tại.
                            </div>
                        )}
                        {reports.map((report) => (
                            <div key={report.id} className="px-5 py-5">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-lg font-bold text-gray-900">{report.title}</h2>
                                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${report.status === "Reviewed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                                {report.status === "Reviewed" ? "Đã xem" : "Đang chờ"}
                                            </span>
                                            <span className="rounded-full bg-[#E0F2FE] px-3 py-1 text-xs font-bold text-sky-700">{report.reportType}</span>
                                        </div>
                                        <p className="mt-1 text-sm font-semibold text-[#4c5769]">Lớp {report.className}</p>
                                        <p className="mt-3 text-sm leading-6 text-[#4c5769]">{report.content}</p>
                                        {report.reviewNote && (
                                            <div className="mt-3 rounded-[8px] bg-[#ECFDF5] px-4 py-3 text-sm font-semibold text-emerald-800">
                                                Phản hồi từ nhà trường: {report.reviewNote}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-sm font-semibold text-[#6b7280] lg:text-right">
                                        <p>Gửi: {new Date(report.submittedAt).toLocaleDateString("vi-VN")}</p>
                                        <p className="mt-1">{report.reviewedAt ? `Xem: ${new Date(report.reviewedAt).toLocaleDateString("vi-VN")}` : "Chưa được xem"}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4">
                    <div className="w-full max-w-2xl rounded-[8px] border border-gray-200 bg-white shadow-soft-lg">
                        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Teacher reports</p>
                                <h2 className="text-xl font-bold text-gray-900">Tạo báo cáo mới</h2>
                            </div>
                            <button type="button" onClick={closeCreateModal} className="rounded-lg border border-gray-200 p-2 text-gray-600 transition-colors hover:bg-gray-50" aria-label="Đóng">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="space-y-4 px-5 py-5">
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="text-sm font-semibold text-[#4c5769]">
                                    Lớp
                                    <div className="relative mt-2">
                                        <select value={newClassGroupId} onChange={(e) => setNewClassGroupId(e.target.value)} className={`${TEACHER_THEME.input} appearance-none pr-11`}>
                                            <option value="">Chọn lớp</option>
                                            {classOptions.map((item) => (
                                                <option key={item.id} value={item.id}>Lớp {item.className}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                                    </div>
                                </label>
                                <label className="text-sm font-semibold text-[#4c5769]">
                                    Loại báo cáo
                                    <div className="relative mt-2">
                                        <select value={newReportType} onChange={(e) => setNewReportType(e.target.value)} className={`${TEACHER_THEME.input} appearance-none pr-11`}>
                                            <option value="General">Tổng hợp</option>
                                            <option value="OrderCoverage">Độ phủ đơn hàng</option>
                                            <option value="QualityIssue">Vấn đề chất lượng</option>
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                                    </div>
                                </label>
                            </div>
                            <label className="block text-sm font-semibold text-[#4c5769]">
                                Tiêu đề
                                <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className={`${TEACHER_THEME.input} mt-2`} placeholder="Ví dụ: Lớp 10A6 còn nhiều học sinh chưa đặt đồng phục" />
                            </label>
                            <label className="block text-sm font-semibold text-[#4c5769]">
                                Nội dung
                                <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} rows={6} className={`${TEACHER_THEME.input} mt-2`} placeholder="Mô tả rõ tình hình, số học sinh ảnh hưởng và hỗ trợ cần từ nhà trường." />
                            </label>
                            {newError && (
                                <div className="rounded-[8px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                                    {newError}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-end">
                            <button type="button" onClick={closeCreateModal} className="rounded-[8px] border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-900 shadow-soft-xs transition-colors hover:bg-gray-50">
                                Hủy
                            </button>
                            <button type="button" onClick={handleCreateReport} disabled={saving} className={TEACHER_THEME.primaryButton}>
                                {saving ? "Đang gửi..." : "Gửi báo cáo"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </TeacherWorkspaceShell>
    );
};
