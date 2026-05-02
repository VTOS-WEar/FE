import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Link2 } from "lucide-react";
import { getTeacherDashboard, type TeacherDashboardDto } from "../../lib/api/teachers";
import { TeacherWorkspaceShell } from "./TeacherWorkspaceShell";
import { TeacherHero, TEACHER_THEME, TeacherSectionHeader } from "./teacherWorkspace";

export const TeacherDashboard = (): JSX.Element => {
    const navigate = useNavigate();
    const [dashboard, setDashboard] = useState<TeacherDashboardDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getTeacherDashboard()
            .then(setDashboard)
            .catch((err: unknown) => setError(err instanceof Error ? err.message : "Không thể tải tổng quan giáo viên"))
            .finally(() => setLoading(false));
    }, []);

    const primaryClass = dashboard?.classesNeedingAttention[0];
    const measuredStudents = Math.max((dashboard?.totalStudents || 0) - (dashboard?.missingMeasurementCount || 0), 0);
    const orderedStudents = dashboard?.classesNeedingAttention.reduce((sum, item) => sum + item.orderedStudentCount, 0) || 0;
    const missingOrdersCount = Math.max((dashboard?.totalStudents || 0) - orderedStudents, 0);
    const todayTasksCount = (dashboard?.missingParentLinkCount || 0) + (dashboard?.missingMeasurementCount || 0) + missingOrdersCount;
    const classDisplay = dashboard
        ? dashboard.totalClasses <= 1
            ? (primaryClass?.className || "Chưa gán lớp")
            : `${primaryClass?.className || ""} +${dashboard.totalClasses - 1} lớp`
        : "--";

    return (
        <TeacherWorkspaceShell
            breadcrumbs={[{ label: "Teacher workspace", href: "/teacher/dashboard" }, { label: "Tổng quan" }]}
        >
            <TeacherHero
                eyebrow="GIẢNG DẠY"
                title={dashboard?.teacherName || "Giáo viên chủ nhiệm"}
                description="Theo dõi lớp, nhắc phụ huynh chưa đặt đồng phục, và tạo báo cáo gửi nhà trường."
            />

            {loading && (
                <section className={`${TEACHER_THEME.panel} mt-6 p-10 text-center`}>
                    <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#059669]" />
                    <p className="text-sm font-semibold text-[#4c5769]">Đang tải tổng quan giáo viên...</p>
                </section>
            )}

            {!loading && error && (
                <section className="mt-6 rounded-[8px] border border-rose-200 bg-white p-8 text-center shadow-soft-sm">
                    <p className="text-base font-bold text-red-600">{error}</p>
                </section>
            )}

            {!loading && !error && dashboard && (
                <>
                    <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-[8px] border border-emerald-100 bg-[#ECFDF5] p-5 shadow-soft-sm">
                            <p className="text-sm font-semibold text-emerald-800">Lớp</p>
                            <p className="mt-2 text-3xl font-bold text-emerald-950">{classDisplay}</p>
                        </div>
                        <div className="rounded-[8px] border border-slate-200 bg-slate-50 p-5 shadow-soft-sm">
                            <p className="text-sm font-semibold text-slate-700">Sĩ số</p>
                            <p className="mt-2 text-3xl font-bold text-slate-950">{dashboard.totalStudents}</p>
                        </div>
                        <div className="rounded-[8px] border border-amber-100 bg-[#FEF3C7] p-5 shadow-soft-sm">
                            <p className="text-sm font-semibold text-amber-800">Đã đo size</p>
                            <p className="mt-2 text-3xl font-bold text-amber-950">{measuredStudents}</p>
                        </div>
                        <div className="rounded-[8px] border border-sky-100 bg-[#E0F2FE] p-5 shadow-soft-sm">
                            <p className="text-sm font-semibold text-sky-800">Đã đặt đồng phục</p>
                            <p className="mt-2 text-3xl font-bold text-sky-950">{orderedStudents}</p>
                        </div>
                    </section>

                    <section className="mt-6 grid gap-4 xl:grid-cols-[2fr_1fr]">
                        <div className={`${TEACHER_THEME.panel} flex h-full flex-col overflow-hidden`}>
                            <TeacherSectionHeader label="Theo dõi hôm nay" title="Lớp cần ưu tiên" />
                            <div className="flex flex-1 flex-col divide-y divide-gray-100">
                                {dashboard.classesNeedingAttention.length === 0 && (
                                    <div className="px-5 py-8 text-sm font-semibold text-[#4c5769]">Chưa có lớp nào được gán cho tài khoản này.</div>
                                )}
                                {dashboard.classesNeedingAttention.map((item) => {
                                    const studentsWithoutOrders = item.studentCount - item.orderedStudentCount;
                                    const parentLinkedPercent = item.studentCount > 0
                                        ? Math.round(((item.studentCount - item.missingParentLinkCount) / item.studentCount) * 100)
                                        : 0;
                                    const measuredPercent = item.studentCount > 0
                                        ? Math.round(((item.studentCount - item.missingMeasurementCount) / item.studentCount) * 100)
                                        : 0;
                                    const orderedPercent = item.studentCount > 0
                                        ? Math.round((item.orderedStudentCount / item.studentCount) * 100)
                                        : 0;
                                    return (
                                        <div
                                            key={item.classGroupId}
                                            className="min-h-[220px] px-5 py-5 transition-colors hover:bg-[#ECFDF5]/45"
                                        >
                                            <div className="flex flex-col gap-4">
                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6b7280]">{item.academicYear}</p>
                                                        <p className="mt-1 text-lg font-bold text-gray-900">{item.className}</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/teacher/classes/${item.classGroupId}`)}
                                                        className="rounded-[8px] bg-[#E0F2FE] px-3 py-1.5 text-xs font-bold text-sky-700 transition-colors hover:bg-sky-100"
                                                    >
                                                        Mở chi tiết
                                                    </button>
                                                </div>

                                                <p className="max-w-3xl text-sm font-medium leading-6 text-[#4c5769]">
                                                    Theo dõi 3 mốc chính để biết học sinh nào còn thiếu liên kết phụ huynh, thiếu đo size, hoặc chưa đặt đồng phục.
                                                </p>

                                                <div className="grid gap-3 md:grid-cols-3">
                                                    <div className="rounded-[8px] border border-emerald-100 bg-[#ECFDF5] p-3">
                                                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">Liên kết PH</p>
                                                        <p className="mt-2 text-lg font-bold text-gray-900">{item.studentCount - item.missingParentLinkCount}/{item.studentCount}</p>
                                                        <div className="mt-2 h-2 rounded-full bg-white/80">
                                                            <div className="h-2 rounded-full bg-[#059669]" style={{ width: `${parentLinkedPercent}%` }} />
                                                        </div>
                                                        <p className="mt-2 text-xs font-semibold text-emerald-800">{item.missingParentLinkCount} cần bổ sung</p>
                                                    </div>
                                                    <div className="rounded-[8px] border border-amber-100 bg-[#FEF3C7] p-3">
                                                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700">Đo size</p>
                                                        <p className="mt-2 text-lg font-bold text-gray-900">{item.studentCount - item.missingMeasurementCount}/{item.studentCount}</p>
                                                        <div className="mt-2 h-2 rounded-full bg-white/80">
                                                            <div className="h-2 rounded-full bg-amber-400" style={{ width: `${measuredPercent}%` }} />
                                                        </div>
                                                        <p className="mt-2 text-xs font-semibold text-amber-800">{item.missingMeasurementCount} chưa đo</p>
                                                    </div>
                                                    <div className="rounded-[8px] border border-sky-100 bg-[#E0F2FE] p-3">
                                                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sky-700">Đặt đồng phục</p>
                                                        <p className="mt-2 text-lg font-bold text-gray-900">{item.orderedStudentCount}/{item.studentCount}</p>
                                                        <div className="mt-2 h-2 rounded-full bg-white/80">
                                                            <div className="h-2 rounded-full bg-sky-400" style={{ width: `${orderedPercent}%` }} />
                                                        </div>
                                                        <p className="mt-2 text-xs font-semibold text-sky-800">{studentsWithoutOrders} chưa đặt</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className={`${TEACHER_THEME.panel} p-5`}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-[8px] bg-[#FEF3C7] p-3 text-amber-700"><AlertCircle className="h-5 w-5" /></div>
                                        <div>
                                            <p className="text-sm font-semibold text-[#6b7280]">Báo cáo chưa đọc</p>
                                            <p className="text-2xl font-bold text-gray-900">{dashboard.pendingReviewReportCount}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => navigate("/teacher/reports")}
                                        className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-100"
                                    >
                                        Xem báo cáo
                                    </button>
                                </div>
                            </div>
                            <div className={`${TEACHER_THEME.panel} p-5`}>
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-[8px] bg-[#E0F2FE] p-3 text-sky-700"><Link2 className="h-5 w-5" /></div>
                                        <div>
                                            <p className="text-sm font-semibold text-[#6b7280]">Việc cần làm hôm nay</p>
                                            <p className="text-2xl font-bold text-gray-900">
                                                {todayTasksCount}
                                            </p>
                                            <div className="mt-2 space-y-1 text-xs font-semibold text-[#4c5769]">
                                                <p>Phụ huynh chưa liên kết: {dashboard.missingParentLinkCount}</p>
                                                <p>Học sinh chưa đo size: {dashboard.missingMeasurementCount}</p>
                                                <p>Học sinh chưa đặt đồng phục: {missingOrdersCount}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => navigate("/teacher/classes")}
                                        className="mt-4 w-full rounded-[8px] border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-50 sm:ml-auto sm:w-auto"
                                    >
                                        Mở danh sách lớp
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className={`${TEACHER_THEME.panel} mt-6`}>
                        <TeacherSectionHeader
                            label="Báo cáo gần đây"
                            title="Những vấn đề đã gửi nhà trường"
                            action={
                                <button type="button" onClick={() => navigate("/teacher/reports")} className={TEACHER_THEME.secondaryButton}>
                                    Mở trang báo cáo
                                </button>
                            }
                        />
                        <div className="divide-y divide-gray-100">
                            {dashboard.latestReports.length === 0 && (
                                <div className="px-5 py-8 text-sm font-semibold text-[#4c5769]">Chưa có báo cáo nào được gửi.</div>
                            )}
                            {dashboard.latestReports.map((report) => (
                                <div key={report.id} className="px-5 py-4">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-base font-bold text-gray-900">{report.title}</p>
                                                <span className={`rounded-full px-3 py-1 text-xs font-bold ${report.status === "Reviewed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                                    {report.status === "Reviewed" ? "Đã xem" : "Đang chờ"}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-sm font-semibold text-[#4c5769]">Lớp {report.className} • {report.reportType}</p>
                                            <p className="mt-2 text-sm text-[#4c5769]">{report.content}</p>
                                            {report.reviewNote && (
                                                <p className="mt-2 rounded-[8px] bg-[#ECFDF5] px-3 py-2 text-sm font-semibold text-emerald-800">
                                                    Phản hồi: {report.reviewNote}
                                                </p>
                                            )}
                                        </div>
                                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6b7280]">
                                            {new Date(report.submittedAt).toLocaleDateString("vi-VN")}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </>
            )}
        </TeacherWorkspaceShell>
    );
};
