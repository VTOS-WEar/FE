import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, BellRing, GraduationCap, Link2, LogOut, MessageSquare, Settings, Users } from "lucide-react";
import { getTeacherDashboard, type TeacherDashboardDto } from "../../lib/api/teachers";
import { TeacherWorkspaceShell } from "./TeacherWorkspaceShell";

export const TeacherDashboard = (): JSX.Element => {
    const navigate = useNavigate();
    const [dashboard, setDashboard] = useState<TeacherDashboardDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    const handleLogout = () => {
        setIsLoggingOut(true);
        setTimeout(() => {
            ["access_token", "user", "expires_in"].forEach((key) => {
                localStorage.removeItem(key);
                sessionStorage.removeItem(key);
            });
            navigate("/signin", { replace: true });
        }, 300);
    };
    const classDisplay = dashboard
        ? dashboard.totalClasses <= 1
            ? (primaryClass?.className || "Chưa gán lớp")
            : `${primaryClass?.className || ""} +${dashboard.totalClasses - 1} lớp`
        : "--";

    return (
        <TeacherWorkspaceShell
            breadcrumbs={[{ label: "Teacher workspace", href: "/teacher/dashboard" }, { label: "Tổng quan" }]}
            showBackButton={false}
            showIdentityHeader={false}
        >
            <section className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                <div className="grid gap-4 xl:grid-cols-3 xl:items-center">
                    <div className="xl:col-span-2">
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                            <GraduationCap className="h-4 w-4" />
                            Homeroom teacher workspace
                        </div>
                        <h1 className="mt-4 text-[30px] font-extrabold leading-tight text-gray-900 lg:text-[38px]">
                            {dashboard?.teacherName || "Giáo viên chủ nhiệm"}
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-[#4c5769] lg:text-base">
                            Theo dõi lớp, nhắc phụ huynh chưa đặt đồng phục, và giữ luồng trao đổi với phụ huynh trong một không gian nhẹ hơn dashboard quản trị.
                        </p>
                    </div>
                    <div className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 xl:col-span-1">
                        <button type="button" onClick={() => navigate("/teacher/classes")} className="inline-flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-center text-sm font-bold text-gray-900 shadow-soft-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200">
                            <Users className="h-4 w-4 text-emerald-700" />
                            <span className="leading-tight">Xem lớp chủ nhiệm</span>
                        </button>
                        <button type="button" onClick={() => navigate("/teacher/reminders")} className="inline-flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-center text-sm font-bold text-gray-900 shadow-soft-sm transition-all hover:-translate-y-0.5 hover:border-amber-200">
                            <BellRing className="h-4 w-4 text-amber-700" />
                            <span className="leading-tight">Nhắc phụ huynh</span>
                        </button>
                        <button type="button" onClick={() => navigate("/teacher/messages")} className="inline-flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-center text-sm font-bold text-gray-900 shadow-soft-sm transition-all hover:-translate-y-0.5 hover:border-sky-200">
                            <MessageSquare className="h-4 w-4 text-sky-700" />
                            <span className="leading-tight">Mở tin nhắn</span>
                        </button>
                        <button type="button" onClick={() => navigate("/teacher/account")} className="inline-flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-center text-sm font-bold text-gray-900 shadow-soft-sm transition-all hover:-translate-y-0.5 hover:border-violet-200">
                            <Settings className="h-4 w-4 text-violet-700" />
                            <span className="leading-tight">Cài đặt tài khoản</span>
                        </button>
                        <button type="button" onClick={handleLogout} className="inline-flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-bold text-red-800 shadow-soft-sm transition-all hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-100 sm:col-span-2">
                            <LogOut className={`h-4 w-4 ${isLoggingOut ? "animate-spin" : ""}`} />
                            <span className="leading-tight">{isLoggingOut ? "Đang xuất..." : "Đăng xuất"}</span>
                        </button>
                    </div>
                </div>
            </section>

            {loading && (
                <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-soft-md">
                    <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-emerald-600" />
                    <p className="text-sm font-semibold text-[#4c5769]">Đang tải tổng quan giáo viên...</p>
                </section>
            )}

            {!loading && error && (
                <section className="mt-6 rounded-2xl border border-red-200 bg-white p-8 text-center shadow-soft-md">
                    <p className="text-base font-bold text-red-600">{error}</p>
                </section>
            )}

            {!loading && !error && dashboard && (
                <>
                    <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-[20px] border border-emerald-200 bg-emerald-50/70 p-5 shadow-soft-sm">
                            <p className="text-sm font-semibold text-emerald-800">Lớp</p>
                            <p className="mt-2 text-3xl font-extrabold text-emerald-950">{classDisplay}</p>
                        </div>
                        <div className="rounded-[20px] border border-violet-200 bg-violet-50/70 p-5 shadow-soft-sm">
                            <p className="text-sm font-semibold text-violet-800">Sĩ số</p>
                            <p className="mt-2 text-3xl font-extrabold text-violet-950">{dashboard.totalStudents}</p>
                        </div>
                        <div className="rounded-[20px] border border-rose-200 bg-rose-50/70 p-5 shadow-soft-sm">
                            <p className="text-sm font-semibold text-rose-800">Đã đo size</p>
                            <p className="mt-2 text-3xl font-extrabold text-rose-950">{measuredStudents}</p>
                        </div>
                        <div className="rounded-[20px] border border-sky-200 bg-sky-50/70 p-5 shadow-soft-sm">
                            <p className="text-sm font-semibold text-sky-800">Đã đặt đồng phục</p>
                            <p className="mt-2 text-3xl font-extrabold text-sky-950">{orderedStudents}</p>
                        </div>
                    </section>

                    <section className="mt-6 grid gap-4 xl:grid-cols-[1.35fr_1fr]">
                        <div className="flex h-full flex-col overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-soft-sm">
                            <div className="border-b border-gray-200 px-5 py-4">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Theo dõi lớp</p>
                                    <h2 className="text-xl font-extrabold text-gray-900">Tình hình lớp chủ nhiệm</h2>
                                </div>
                            </div>
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
                                        <button
                                            key={item.classGroupId}
                                            type="button"
                                            onClick={() => navigate(`/teacher/classes/${item.classGroupId}`)}
                                            className="group flex min-h-[220px] flex-1 items-stretch justify-between gap-3 px-5 py-5 text-left transition-all hover:bg-[#f8fbff]"
                                        >
                                            <div className="flex flex-1 flex-col justify-between">
                                                <div>
                                                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6b7280]">{item.academicYear}</p>
                                                    <p className="mt-4 max-w-xl text-sm font-medium leading-6 text-[#4c5769]">
                                                        Theo dõi 3 mốc chính của lớp: liên kết phụ huynh, đo size, và đặt đồng phục. Mở chi tiết để xem danh sách học sinh cần xử lý ngay.
                                                    </p>
                                                </div>

                                                <div className="mt-5 grid gap-3 md:grid-cols-3">
                                                    <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-3">
                                                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700">Liên kết PH</p>
                                                        <p className="mt-2 text-lg font-extrabold text-gray-900">{item.studentCount - item.missingParentLinkCount}/{item.studentCount}</p>
                                                        <div className="mt-2 h-2 rounded-full bg-white/80">
                                                            <div className="h-2 rounded-full bg-amber-400" style={{ width: `${parentLinkedPercent}%` }} />
                                                        </div>
                                                        <p className="mt-2 text-xs font-semibold text-amber-800">{item.missingParentLinkCount} cần bổ sung</p>
                                                    </div>
                                                    <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-3">
                                                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-rose-700">Đo size</p>
                                                        <p className="mt-2 text-lg font-extrabold text-gray-900">{item.studentCount - item.missingMeasurementCount}/{item.studentCount}</p>
                                                        <div className="mt-2 h-2 rounded-full bg-white/80">
                                                            <div className="h-2 rounded-full bg-rose-400" style={{ width: `${measuredPercent}%` }} />
                                                        </div>
                                                        <p className="mt-2 text-xs font-semibold text-rose-800">{item.missingMeasurementCount} chưa đo</p>
                                                    </div>
                                                    <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-3">
                                                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sky-700">Đặt đồng phục</p>
                                                        <p className="mt-2 text-lg font-extrabold text-gray-900">{item.orderedStudentCount}/{item.studentCount}</p>
                                                        <div className="mt-2 h-2 rounded-full bg-white/80">
                                                            <div className="h-2 rounded-full bg-sky-400" style={{ width: `${orderedPercent}%` }} />
                                                        </div>
                                                        <p className="mt-2 text-xs font-semibold text-sky-800">{studentsWithoutOrders} chưa đặt</p>
                                                    </div>
                                                </div>

                                            </div>

                                            <div className="flex items-end">
                                                <span className="rounded-full bg-[#eef7ff] px-3 py-1.5 text-xs font-bold text-sky-700 transition-colors group-hover:bg-sky-100">
                                                    Mở chi tiết
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-[20px] border border-gray-200 bg-white p-5 shadow-soft-sm">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-2xl bg-[#fef6d8] p-3 text-amber-700"><AlertCircle className="h-5 w-5" /></div>
                                    <div>
                                        <p className="text-sm font-semibold text-[#6b7280]">Báo cáo chưa đọc</p>
                                        <p className="text-2xl font-extrabold text-gray-900">{dashboard.pendingReviewReportCount}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-[20px] border border-gray-200 bg-white p-5 shadow-soft-sm">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-2xl bg-[#eef7ff] p-3 text-sky-700"><Link2 className="h-5 w-5" /></div>
                                    <div>
                                        <p className="text-sm font-semibold text-[#6b7280]">Việc cần làm hôm nay</p>
                                        <p className="text-2xl font-extrabold text-gray-900">
                                            {todayTasksCount}
                                        </p>
                                        <div className="mt-2 space-y-1 text-xs font-semibold text-[#4c5769]">
                                            <p>Phụ huynh chưa liên kết: {dashboard.missingParentLinkCount}</p>
                                            <p>Học sinh chưa đo size: {dashboard.missingMeasurementCount}</p>
                                            <p>Học sinh chưa đặt đồng phục: {missingOrdersCount}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="mt-6 rounded-[20px] border border-gray-200 bg-white shadow-soft-sm">
                        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Báo cáo gần đây</p>
                                <h2 className="text-xl font-extrabold text-gray-900">Những vấn đề đã gửi nhà trường</h2>
                            </div>
                            <button type="button" onClick={() => navigate("/teacher/reports")} className="text-sm font-bold text-emerald-700 hover:text-emerald-900">
                                Mở trang báo cáo
                            </button>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {dashboard.latestReports.length === 0 && (
                                <div className="px-5 py-8 text-sm font-semibold text-[#4c5769]">Chưa có báo cáo nào được gửi.</div>
                            )}
                            {dashboard.latestReports.map((report) => (
                                <div key={report.id} className="px-5 py-4">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-base font-extrabold text-gray-900">{report.title}</p>
                                                <span className={`rounded-full px-3 py-1 text-xs font-bold ${report.status === "Reviewed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                                    {report.status === "Reviewed" ? "Đã xem" : "Đang chờ"}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-sm font-semibold text-[#4c5769]">Lớp {report.className} • {report.reportType}</p>
                                            <p className="mt-2 text-sm text-[#4c5769]">{report.content}</p>
                                            {report.reviewNote && (
                                                <p className="mt-2 rounded-2xl bg-[#f4fffb] px-3 py-2 text-sm font-semibold text-emerald-800">
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
