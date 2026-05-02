import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, ShoppingBag, Users } from "lucide-react";
import { getTeacherClassesOverview } from "../../lib/api/teachers";
import type { TeacherClassesOverviewDto } from "../../lib/api/schools";
import { TeacherWorkspaceShell } from "../TeacherWorkspace/TeacherWorkspaceShell";
import { TeacherHero, TEACHER_THEME } from "../TeacherWorkspace/teacherWorkspace";

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

    const sortedClasses = useMemo(() => {
        if (!overview) return [];
        return [...overview.classes].sort((a, b) => {
            const aPending = (a.studentCount - a.parentLinkedCount) + (a.studentCount - a.measurementReadyCount) + (a.studentCount - a.orderedStudentCount);
            const bPending = (b.studentCount - b.parentLinkedCount) + (b.studentCount - b.measurementReadyCount) + (b.studentCount - b.orderedStudentCount);
            return bPending - aPending;
        });
    }, [overview]);

    return (
        <TeacherWorkspaceShell breadcrumbs={[{ label: "Teacher workspace", href: "/teacher/dashboard" }, { label: "Lớp chủ nhiệm" }]}>
            <TeacherHero
                eyebrow="LỚP CHỦ NHIỆM"
                title={overview?.teacherName || "Giáo viên chủ nhiệm"}
                description="Danh sách lớp được phân công, mức độ sẵn sàng của học sinh, và độ phủ đơn hàng để thấy ngay lớp nào cần theo sát hơn."
            />

            {overview && overview.classes.length === 0 && (
                <section className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className={`${TEACHER_THEME.panel} p-5`}>
                        <p className="text-sm font-semibold text-[#6b7280]">Tổng lớp</p>
                        <p className="mt-2 text-3xl font-bold text-gray-900">{overview.totalClasses}</p>
                    </div>
                    <div className="rounded-[8px] border border-sky-100 bg-[#E0F2FE] p-5 shadow-soft-sm">
                        <p className="text-sm font-semibold text-[#6b7280]">Tổng học sinh</p>
                        <p className="mt-2 text-3xl font-bold text-gray-900">{overview.totalStudents}</p>
                    </div>
                </section>
            )}

            {loading && (
                <section className={`${TEACHER_THEME.panel} mt-6 p-10 text-center`}>
                    <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#059669]" />
                    <p className="text-sm font-semibold text-[#4c5769]">Đang tải lớp được phân công...</p>
                </section>
            )}

            {!loading && error && (
                <section className="mt-6 rounded-[8px] border border-rose-200 bg-white p-8 text-center shadow-soft-sm">
                    <p className="text-base font-bold text-red-600">{error}</p>
                </section>
            )}

            {!loading && !error && overview && overview.classes.length === 0 && (
                <section className={`${TEACHER_THEME.panel} mt-6 p-10 text-center`}>
                    <GraduationCap className="mx-auto h-10 w-10 text-emerald-600" />
                    <h2 className="mt-4 text-xl font-bold text-gray-900">Chưa có lớp nào được gán</h2>
                    <p className="mt-2 text-sm font-medium text-[#4c5769]">Tài khoản này chưa được hệ thống gán vào lớp chủ nhiệm.</p>
                </section>
            )}

            {!loading && !error && overview && overview.classes.length > 0 && (
                <section className="mt-6 grid gap-4 xl:grid-cols-[1fr_2fr]">
                    <div className="grid gap-4 xl:grid-rows-2">
                        <div className={`${TEACHER_THEME.panel} p-5`}>
                            <p className="text-sm font-semibold text-[#6b7280]">Tổng lớp</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">{overview.totalClasses}</p>
                        </div>
                        <div className="rounded-[8px] border border-sky-100 bg-[#E0F2FE] p-5 shadow-soft-sm">
                            <p className="text-sm font-semibold text-[#6b7280]">Tổng học sinh</p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">{overview.totalStudents}</p>
                        </div>
                    </div>
                    <div className="grid gap-4">
                        {sortedClasses.map((classGroup) => {
                            const pendingParentLink = classGroup.studentCount - classGroup.parentLinkedCount;
                            const pendingMeasurement = classGroup.studentCount - classGroup.measurementReadyCount;
                            const pendingOrders = classGroup.studentCount - classGroup.orderedStudentCount;
                            const pendingTotal = pendingParentLink + pendingMeasurement + pendingOrders;
                            const urgentThreshold = Math.ceil(classGroup.studentCount * 0.9);
                            const isUrgent = pendingTotal >= urgentThreshold;

                            return (
                            <div
                                key={classGroup.id}
                                className="group rounded-[8px] border border-gray-200 bg-white p-5 text-left shadow-soft-sm transition-colors hover:border-emerald-300 hover:bg-[#ECFDF5]/35"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">{classGroup.academicYear}</p>
                                        <h2 className="mt-2 text-2xl font-bold text-gray-900">Lớp {classGroup.className}</h2>
                                    </div>
                                    {isUrgent && (
                                        <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
                                            Cần theo sát
                                        </span>
                                    )}
                                </div>

                                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                    <div className="rounded-[8px] bg-[#ECFDF5] p-4">
                                        <p className="text-sm font-semibold text-[#6b7280]">Học sinh</p>
                                        <p className="mt-1 text-xl font-bold text-gray-900">{classGroup.studentCount}</p>
                                    </div>
                                    <div className="rounded-[8px] bg-[#E0F2FE] p-4">
                                        <p className="text-sm font-semibold text-[#6b7280]">Đo áo</p>
                                        <p className="mt-1 text-xl font-bold text-gray-900">{classGroup.measurementReadyCount}</p>
                                    </div>
                                    <div className="rounded-[8px] bg-[#FEF3C7] p-4">
                                        <p className="text-sm font-semibold text-[#6b7280]">PH liên kết</p>
                                        <p className="mt-1 text-xl font-bold text-gray-900">{classGroup.parentLinkedCount}</p>
                                    </div>
                                    <div className="rounded-[8px] bg-[#E0F2FE] p-4">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-[#4c5769]">
                                            <ShoppingBag className="h-4 w-4 text-sky-700" />
                                            <span>Độ phủ đơn hàng</span>
                                        </div>
                                        <p className="mt-1 text-xl font-bold text-gray-900">
                                            {classGroup.orderedStudentCount}/{classGroup.studentCount}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/teacher/classes/${classGroup.id}`)}
                                        className="rounded-[8px] border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-800 transition-colors hover:border-emerald-200 hover:bg-emerald-50"
                                    >
                                        Xem chi tiết lớp
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/teacher/classes/${classGroup.id}`)}
                                        className="rounded-[8px] border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-100"
                                    >
                                        Học sinh chưa đo size
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/teacher/reminders?classGroupId=${classGroup.id}`)}
                                        className="rounded-[8px] border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-800 transition-colors hover:bg-sky-100"
                                    >
                                        Nhắc phụ huynh lớp này
                                    </button>
                                </div>

                                <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#4c5769]">
                                    <Users className="h-4 w-4 text-emerald-600" />
                                    <span>{classGroup.homeroomTeacherName || overview.teacherName}</span>
                                </div>
                            </div>
                        )})}
                    </div>
                </section>
            )}
        </TeacherWorkspaceShell>
    );
};
