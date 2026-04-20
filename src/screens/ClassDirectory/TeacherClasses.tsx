import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BookOpenCheck, GraduationCap, Users } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "../../components/ui/breadcrumb";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useSidebarConfig } from "../../hooks/useSidebarConfig";
import { getTeacherClassesOverview } from "../../lib/api/teachers";
import type { TeacherClassesOverviewDto } from "../../lib/api/schools";

export const TeacherClasses = (): JSX.Element => {
    const navigate = useNavigate();
    const sidebarConfig = useSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [overview, setOverview] = useState<TeacherClassesOverviewDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getTeacherClassesOverview()
            .then((data) => setOverview(data))
            .catch((err: unknown) => setError(err instanceof Error ? err.message : "Khong the tai danh sach lop"))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} name={overview?.teacherName || ""} isCollapsed={isCollapsed} onToggle={toggle} />
                </div>
                <div className="flex-1 flex min-w-0 flex-col">
                    <TopNavBar>
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem><BreadcrumbPage className="font-bold text-gray-900 text-base">Lop chu nhiem</BreadcrumbPage></BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </TopNavBar>

                    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        <section className="rounded-[28px] border border-emerald-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.15),_transparent_36%),linear-gradient(135deg,_#ffffff_10%,_#f4fffb_55%,_#f7f9ff_100%)] p-6 shadow-soft-lg">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                                <div>
                                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                                        <BookOpenCheck className="h-4 w-4" />
                                        Workspace giao vien
                                    </div>
                                    <h1 className="mt-4 text-[30px] font-extrabold leading-tight text-gray-900 lg:text-[38px]">{overview?.teacherName || "Giao vien chu nhiem"}</h1>
                                    <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-[#4c5769] lg:text-base">
                                        Theo doi cac lop duoc phan cong, tinh trang hoc sinh va muc do day du do ao trong mot giao dien gon, nhanh va de quan sat.
                                    </p>
                                </div>
                                {overview && (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="rounded-2xl border border-emerald-200 bg-white/90 px-5 py-4">
                                            <p className="text-sm font-semibold text-[#6b7280]">Tong lop</p>
                                            <p className="mt-2 text-3xl font-extrabold text-gray-900">{overview.totalClasses}</p>
                                        </div>
                                        <div className="rounded-2xl border border-sky-200 bg-white/90 px-5 py-4">
                                            <p className="text-sm font-semibold text-[#6b7280]">Tong hoc sinh</p>
                                            <p className="mt-2 text-3xl font-extrabold text-gray-900">{overview.totalStudents}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {loading && (
                            <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-soft-md">
                                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-emerald-600" />
                                <p className="text-sm font-semibold text-[#4c5769]">Dang tai lop duoc phan cong...</p>
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
                                <h2 className="mt-4 text-xl font-extrabold text-gray-900">Chua co lop nao duoc gan</h2>
                                <p className="mt-2 text-sm font-medium text-[#4c5769]">Tai khoan nay chua duoc he thong gan vao lop chu nhiem.</p>
                            </section>
                        )}

                        {!loading && !error && overview && overview.classes.length > 0 && (
                            <section className="mt-6 grid gap-4 xl:grid-cols-2">
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
                                                <h2 className="mt-2 text-2xl font-extrabold text-gray-900">Lop {classGroup.className}</h2>
                                            </div>
                                            <div className="rounded-full bg-emerald-50 p-2 text-emerald-700">
                                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                            </div>
                                        </div>

                                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                                            <div className="rounded-2xl bg-[#f4fffb] p-4">
                                                <p className="text-sm font-semibold text-[#6b7280]">Hoc sinh</p>
                                                <p className="mt-1 text-xl font-extrabold text-gray-900">{classGroup.studentCount}</p>
                                            </div>
                                            <div className="rounded-2xl bg-[#eef7ff] p-4">
                                                <p className="text-sm font-semibold text-[#6b7280]">Do ao</p>
                                                <p className="mt-1 text-xl font-extrabold text-gray-900">{classGroup.measurementReadyCount}</p>
                                            </div>
                                            <div className="rounded-2xl bg-[#fff8eb] p-4">
                                                <p className="text-sm font-semibold text-[#6b7280]">PH lien ket</p>
                                                <p className="mt-1 text-xl font-extrabold text-gray-900">{classGroup.parentLinkedCount}</p>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#4c5769]">
                                            <Users className="h-4 w-4 text-emerald-600" />
                                            <span>{classGroup.homeroomTeacherName || overview.teacherName}</span>
                                        </div>
                                    </button>
                                ))}
                            </section>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};
