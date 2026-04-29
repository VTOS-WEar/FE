import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BellRing, BookOpenCheck, ClipboardList, GraduationCap, MessageSquare, ShoppingBag, Users } from "lucide-react";
import { getTeacherClassesOverview } from "../../lib/api/teachers";
import type { TeacherClassesOverviewDto } from "../../lib/api/schools";
import { TeacherWorkspaceShell } from "../TeacherWorkspace/TeacherWorkspaceShell";

export const TeacherClasses = (): JSX.Element => {
    const navigate = useNavigate();
    const [overview, setOverview] = useState<TeacherClassesOverviewDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getTeacherClassesOverview()
            .then((data) => setOverview(data))
            .catch((err: unknown) => setError(err instanceof Error ? err.message : "Không thể tải danh sách lớp"))
            .finally(() => setLoading(false));
    }, []);

    return (
        <TeacherWorkspaceShell breadcrumbs={[{ label: "Teacher workspace", href: "/teacher/dashboard" }, { label: "Lớp chủ nhiệm" }]}>
            <section className="rounded-[28px] border border-emerald-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.15),_transparent_36%),linear-gradient(135deg,_#ffffff_10%,_#f4fffb_55%,_#f7f9ff_100%)] p-6 shadow-soft-lg">
                <div className="grid gap-4 xl:grid-cols-3 xl:items-center">
                    <div className="xl:col-span-2">
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                            <BookOpenCheck className="h-4 w-4" />
                            Lớp chủ nhiệm
                        </div>
                        <h1 className="mt-4 text-[30px] font-extrabold leading-tight text-gray-900 lg:text-[38px]">{overview?.teacherName || "Giáo viên chủ nhiệm"}</h1>
                        <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-[#4c5769] lg:text-base">
                            Danh sách lớp được phân công, mức độ sẵn sàng của học sinh, và độ phủ đơn hàng để thấy ngay lớp nào cần theo sát hơn.
                        </p>
                    </div>
                    <div className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 xl:col-span-1">
                        <button type="button" onClick={() => navigate("/teacher/dashboard")} className="inline-flex h-full w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-center text-sm font-bold text-gray-900 shadow-soft-sm transition-all hover:-translate-y-0.5 hover:shadow-soft-md">
                            <GraduationCap className="h-4 w-4 text-emerald-700" />
                            Tổng quan
                        </button>
                        <button type="button" onClick={() => navigate("/teacher/reminders")} className="inline-flex h-full w-full items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-white px-4 py-3 text-center text-sm font-bold text-gray-900 shadow-soft-sm transition-all hover:-translate-y-0.5 hover:shadow-soft-md">
                            <BellRing className="h-4 w-4 text-amber-700" />
                            Nhắc phụ huynh
                        </button>
                        <button type="button" onClick={() => navigate("/teacher/messages")} className="inline-flex h-full w-full items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-white px-4 py-3 text-center text-sm font-bold text-gray-900 shadow-soft-sm transition-all hover:-translate-y-0.5 hover:shadow-soft-md">
                            <MessageSquare className="h-4 w-4 text-sky-700" />
                            Tin nhắn
                        </button>
                        <button type="button" onClick={() => navigate("/teacher/reports")} className="inline-flex h-full w-full items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-white px-4 py-3 text-center text-sm font-bold text-gray-900 shadow-soft-sm transition-all hover:-translate-y-0.5 hover:shadow-soft-md">
                            <ClipboardList className="h-4 w-4 text-sky-700" />
                            Báo cáo
                        </button>
                    </div>
                </div>
            </section>

            {overview && overview.classes.length === 0 && (
                <section className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[24px] border border-emerald-200 bg-white p-5 shadow-soft-md">
                        <p className="text-sm font-semibold text-[#6b7280]">Tổng lớp</p>
                        <p className="mt-2 text-3xl font-extrabold text-gray-900">{overview.totalClasses}</p>
                    </div>
                    <div className="rounded-[24px] border border-sky-200 bg-white p-5 shadow-soft-md">
                        <p className="text-sm font-semibold text-[#6b7280]">Tổng học sinh</p>
                        <p className="mt-2 text-3xl font-extrabold text-gray-900">{overview.totalStudents}</p>
                    </div>
                </section>
            )}

            {loading && (
                <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-soft-md">
                    <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-emerald-600" />
                    <p className="text-sm font-semibold text-[#4c5769]">Đang tải lớp được phân công...</p>
                </section>
            )}

            {!loading && error && (
                <section className="mt-6 rounded-2xl border border-red-200 bg-white p-8 text-center shadow-soft-md">
                    <p className="text-base font-bold text-red-600">{error}</p>
                </section>
            )}

            {!loading && !error && overview && overview.classes.length === 0 && (
                <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-soft-md">
                    <GraduationCap className="mx-auto h-10 w-10 text-emerald-600" />
                    <h2 className="mt-4 text-xl font-extrabold text-gray-900">Chưa có lớp nào được gán</h2>
                    <p className="mt-2 text-sm font-medium text-[#4c5769]">Tài khoản này chưa được hệ thống gán vào lớp chủ nhiệm.</p>
                </section>
            )}

            {!loading && !error && overview && overview.classes.length > 0 && (
                <section className="mt-6 grid gap-4 xl:grid-cols-2">
                    <div className="grid gap-4 xl:grid-rows-2">
                        <div className="rounded-[24px] border border-emerald-200 bg-white p-5 shadow-soft-md">
                            <p className="text-sm font-semibold text-[#6b7280]">Tổng lớp</p>
                            <p className="mt-2 text-3xl font-extrabold text-gray-900">{overview.totalClasses}</p>
                        </div>
                        <div className="rounded-[24px] border border-sky-200 bg-white p-5 shadow-soft-md">
                            <p className="text-sm font-semibold text-[#6b7280]">Tổng học sinh</p>
                            <p className="mt-2 text-3xl font-extrabold text-gray-900">{overview.totalStudents}</p>
                        </div>
                    </div>
                    <div className="grid gap-4">
                        {overview.classes.map((classGroup) => (
                            <button
                                key={classGroup.id}
                                type="button"
                                onClick={() => navigate(`/teacher/classes/${classGroup.id}`)}
                                className="group rounded-[24px] border border-gray-200 bg-white p-5 text-left shadow-soft-md transition-all hover:-translate-y-1 hover:border-emerald-300 hover:shadow-soft-lg"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">{classGroup.academicYear}</p>
                                        <h2 className="mt-2 text-2xl font-extrabold text-gray-900">Lớp {classGroup.className}</h2>
                                    </div>
                                </div>

                                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                                    <div className="rounded-2xl bg-[#f4fffb] p-4">
                                        <p className="text-sm font-semibold text-[#6b7280]">Học sinh</p>
                                        <p className="mt-1 text-xl font-extrabold text-gray-900">{classGroup.studentCount}</p>
                                    </div>
                                    <div className="rounded-2xl bg-[#eef7ff] p-4">
                                        <p className="text-sm font-semibold text-[#6b7280]">Đo áo</p>
                                        <p className="mt-1 text-xl font-extrabold text-gray-900">{classGroup.measurementReadyCount}</p>
                                    </div>
                                    <div className="rounded-2xl bg-[#fff8eb] p-4">
                                        <p className="text-sm font-semibold text-[#6b7280]">PH liên kết</p>
                                        <p className="mt-1 text-xl font-extrabold text-gray-900">{classGroup.parentLinkedCount}</p>
                                    </div>
                                </div>

                                <div className="mt-3 rounded-2xl bg-[#eef6ff] p-4">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-[#4c5769]">
                                        <ShoppingBag className="h-4 w-4 text-sky-700" />
                                        <span>Độ phủ đơn hàng</span>
                                    </div>
                                    <p className="mt-1 text-xl font-extrabold text-gray-900">
                                        {classGroup.orderedStudentCount}/{classGroup.studentCount}
                                    </p>
                                </div>

                                <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#4c5769]">
                                    <Users className="h-4 w-4 text-emerald-600" />
                                    <span>{classGroup.homeroomTeacherName || overview.teacherName}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>
            )}
        </TeacherWorkspaceShell>
    );
};
