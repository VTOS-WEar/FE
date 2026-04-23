import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getTeacherClassesOverview, getTeacherReports, type TeacherReportListItemDto } from "../../lib/api/teachers";
import { TeacherWorkspaceShell } from "./TeacherWorkspaceShell";

export const TeacherReports = (): JSX.Element => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [reports, setReports] = useState<TeacherReportListItemDto[]>([]);
    const [classOptions, setClassOptions] = useState<{ id: string; className: string }[]>([]);
    const [status, setStatus] = useState("");
    const [reportType, setReportType] = useState("");
    const [classGroupId, setClassGroupId] = useState(searchParams.get("classGroupId") || "");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getTeacherClassesOverview()
            .then((overview) => setClassOptions(overview.classes.map((item) => ({ id: item.id, className: item.className }))))
            .catch(() => undefined);
    }, []);

    useEffect(() => {
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
    }, [classGroupId, reportType, status]);

    return (
        <TeacherWorkspaceShell breadcrumbs={[{ label: "Teacher workspace", href: "/teacher/dashboard" }, { label: "Báo cáo" }]}>
            <section className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700">Teacher reports</p>
                        <h1 className="mt-2 text-[30px] font-extrabold leading-tight text-gray-900 lg:text-[38px]">Báo cáo đã gửi</h1>
                        <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-[#4c5769] lg:text-base">
                            Theo dõi các báo cáo đã gửi cho nhà trường, trạng thái xử lý, và ghi chú phản hồi để không bỏ sót việc cần theo.
                        </p>
                    </div>
                    <button type="button" onClick={() => navigate("/teacher/reports/new")} className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-900 shadow-soft-sm hover:border-sky-200">
                        Tạo báo cáo mới
                    </button>
                </div>
            </section>

            <section className="mt-6 rounded-[20px] border border-gray-200 bg-white p-5 shadow-soft-sm">
                <div className="grid gap-3 md:grid-cols-3">
                    <label className="text-sm font-semibold text-[#4c5769]">
                        Lớp
                        <select value={classGroupId} onChange={(e) => setClassGroupId(e.target.value)} className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-900 outline-none focus:border-emerald-300">
                            <option value="">Tất cả lớp</option>
                            {classOptions.map((item) => (
                                <option key={item.id} value={item.id}>Lớp {item.className}</option>
                            ))}
                        </select>
                    </label>
                    <label className="text-sm font-semibold text-[#4c5769]">
                        Trạng thái
                        <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-900 outline-none focus:border-emerald-300">
                            <option value="">Tất cả</option>
                            <option value="Submitted">Đang chờ xem</option>
                            <option value="Reviewed">Đã xem</option>
                        </select>
                    </label>
                    <label className="text-sm font-semibold text-[#4c5769]">
                        Loại báo cáo
                        <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-900 outline-none focus:border-emerald-300">
                            <option value="">Tất cả</option>
                            <option value="General">Tổng hợp</option>
                            <option value="OrderCoverage">Độ phủ đơn hàng</option>
                            <option value="QualityIssue">Vấn đề chất lượng</option>
                        </select>
                    </label>
                </div>
            </section>

            {loading && (
                <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-soft-sm">
                    <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-emerald-600" />
                    <p className="text-sm font-semibold text-[#4c5769]">Đang tải báo cáo...</p>
                </section>
            )}

            {!loading && error && (
                <section className="mt-6 rounded-2xl border border-red-200 bg-white p-8 text-center shadow-soft-sm">
                    <p className="text-base font-bold text-red-600">{error}</p>
                </section>
            )}

            {!loading && !error && (
                <section className="mt-6 rounded-[20px] border border-gray-200 bg-white shadow-soft-sm">
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
                                            <h2 className="text-lg font-extrabold text-gray-900">{report.title}</h2>
                                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${report.status === "Reviewed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                                {report.status === "Reviewed" ? "Đã xem" : "Đang chờ"}
                                            </span>
                                            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">{report.reportType}</span>
                                        </div>
                                        <p className="mt-1 text-sm font-semibold text-[#4c5769]">Lớp {report.className}</p>
                                        <p className="mt-3 text-sm leading-6 text-[#4c5769]">{report.content}</p>
                                        {report.reviewNote && (
                                            <div className="mt-3 rounded-2xl bg-[#f4fffb] px-4 py-3 text-sm font-semibold text-emerald-800">
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
        </TeacherWorkspaceShell>
    );
};
