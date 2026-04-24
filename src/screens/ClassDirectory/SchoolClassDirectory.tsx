import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, FolderTree, GraduationCap, Upload } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../../components/ui/breadcrumb";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useSidebarConfig } from "../../hooks/useSidebarConfig";
import { getSchoolClassesOverview, getSchoolProfile, type SchoolClassesOverviewDto } from "../../lib/api/schools";

function StatCard({ label, value, tone }: { label: string; value: number | string; tone: "violet" | "blue" | "amber" }) {
    const toneMap = {
        violet: "from-violet-50 to-white border-violet-200 text-violet-700",
        blue: "from-sky-50 to-white border-sky-200 text-sky-700",
        amber: "from-amber-50 to-white border-amber-200 text-amber-700",
    };

    return (
        <div className={`rounded-2xl border bg-gradient-to-br p-5 shadow-soft-md ${toneMap[tone]}`}>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] opacity-80">{label}</p>
            <p className="mt-3 text-3xl font-extrabold text-gray-900">{value}</p>
        </div>
    );
}

export const SchoolClassDirectory = (): JSX.Element => {
    const navigate = useNavigate();
    const sidebarConfig = useSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [schoolName, setSchoolName] = useState("");
    const [overview, setOverview] = useState<SchoolClassesOverviewDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedGrade, setSelectedGrade] = useState<string>("all");

    useEffect(() => {
        getSchoolProfile().then((profile) => setSchoolName(profile.schoolName || "")).catch(() => {});
        getSchoolClassesOverview()
            .then((data) => setOverview(data))
            .catch((err: unknown) => setError(err instanceof Error ? err.message : "Không thể tải danh sách lớp"))
            .finally(() => setLoading(false));
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} name={schoolName} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>
                <div className="flex-1 flex min-w-0 flex-col">
                    <TopNavBar>
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem><BreadcrumbLink href="/school/dashboard" className="font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                                <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                                <BreadcrumbItem><BreadcrumbPage className="font-bold text-gray-900 text-base">Học sinh theo lớp</BreadcrumbPage></BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </TopNavBar>

                    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        <section className="rounded-[28px] border border-violet-200 bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.18),_transparent_38%),linear-gradient(135deg,_#ffffff_10%,_#f8f5ff_55%,_#eef7ff_100%)] p-5 shadow-soft-lg lg:p-6">
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                                <div className="max-w-3xl">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-violet-700">
                                        <FolderTree className="h-4 w-4" />
                                        Sơ đồ lớp học
                                    </div>
                                     <h1 className="mt-3 text-[26px] font-extrabold leading-tight text-gray-900 lg:text-[34px]">
                                         Quản lý học sinh theo khối và lớp
                                     </h1>
                                 </div>
                                <div className="flex flex-wrap gap-3">
                                    <button onClick={() => navigate("/school/students/import")} className="nb-btn nb-btn-outline text-sm">
                                        <Upload className="h-4 w-4" />
                                        Nhập từ Excel
                                    </button>
                                </div>
                            </div>

                            {overview && (
                                <div className="mt-5 grid gap-3 md:grid-cols-3">
                                    <StatCard label="Năm học" value={overview.academicYear || "Chưa có"} tone="violet" />
                                    <StatCard label="Tổng lớp" value={overview.totalClasses} tone="blue" />
                                    <StatCard label="Tổng học sinh" value={overview.totalStudents} tone="amber" />
                                </div>
                            )}
                        </section>

                        {overview && overview.grades.length > 0 && (
                            <section className="mt-4 rounded-[20px] border border-gray-200 bg-white p-4 shadow-soft-sm">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-semibold text-[#4c5769]">Khối:</span>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedGrade("all")}
                                        className={`rounded-full border px-3 py-2 text-sm font-semibold transition-colors ${
                                            selectedGrade === "all"
                                                ? "border-violet-200 bg-violet-50 text-violet-700"
                                                : "border-gray-200 bg-white text-[#4c5769] hover:border-violet-200 hover:text-violet-700"
                                        }`}
                                    >
                                        Tất cả
                                    </button>
                                    {overview.grades.map((grade) => (
                                        <button
                                            key={grade.grade}
                                            type="button"
                                            onClick={() => setSelectedGrade(grade.grade)}
                                            className={`rounded-full border px-3 py-2 text-sm font-semibold transition-colors ${
                                                selectedGrade === grade.grade
                                                    ? "border-violet-200 bg-violet-50 text-violet-700"
                                                    : "border-gray-200 bg-white text-[#4c5769] hover:border-violet-200 hover:text-violet-700"
                                            }`}
                                        >
                                            Khối {grade.grade}
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )}

                         {loading && (
                            <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-soft-md">
                                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-violet-600" />
                                <p className="text-sm font-semibold text-[#4c5769]">Đang tải cấu trúc lớp học...</p>
                            </section>
                        )}

                        {!loading && error && (
                            <section className="mt-6 rounded-2xl border border-red-200 bg-white p-8 text-center shadow-soft-md">
                                <p className="text-base font-bold text-red-600">{error}</p>
                            </section>
                        )}

                        {!loading && !error && overview && overview.grades.length === 0 && (
                            <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-soft-md">
                                 <GraduationCap className="mx-auto h-10 w-10 text-violet-600" />
                                 <h2 className="mt-4 text-xl font-extrabold text-gray-900">Chưa có lớp học nào</h2>
                             </section>
                         )}

                        {!loading && !error && overview && overview.grades.length > 0 && (
                            <section className="mt-6 space-y-5">
                                {overview.grades.filter((grade) => selectedGrade === "all" || grade.grade === selectedGrade).map((grade) => (
                                    <div key={grade.grade} className="rounded-[26px] border border-gray-200 bg-white p-5 shadow-soft-md">
                                        <div className="flex flex-col gap-2">
                                            <div>
                                                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-violet-600">Khối {grade.grade}</p>
                                                <h2 className="mt-1 text-2xl font-extrabold text-gray-900">{grade.classCount} lớp, {grade.studentCount} học sinh</h2>
                                            </div>
                                        </div>

                                        <div className="mt-5 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                                            {grade.classes.map((classGroup) => (
                                                <button
                                                    key={classGroup.id}
                                                    type="button"
                                                    onClick={() => navigate(`/school/students/classes/${classGroup.id}`)}
                                                    className="group rounded-2xl border border-gray-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#f9fafb_100%)] p-5 text-left shadow-soft-sm transition-all hover:-translate-y-1 hover:border-violet-300 hover:shadow-soft-md"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7c3aed]">Lớp {classGroup.className}</p>
                                                            <h3 className="mt-2 text-xl font-extrabold text-gray-900">{classGroup.studentCount} học sinh</h3>
                                                        </div>
                                                        <div className="rounded-full bg-violet-50 p-2 text-violet-700">
                                                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                                        </div>
                                                    </div>

                                                    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                                        <div className="rounded-xl bg-[#f8f5ff] p-3">
                                                            <dt className="font-semibold text-[#6b7280]">GVCN</dt>
                                                            <dd className="mt-1 font-bold text-gray-900">{classGroup.homeroomTeacherName || "Chưa gán"}</dd>
                                                        </div>
                                                        <div className="rounded-xl bg-[#eef7ff] p-3">
                                                            <dt className="font-semibold text-[#6b7280]">Đo áo</dt>
                                                            <dd className="mt-1 font-bold text-gray-900">{classGroup.measurementReadyCount}/{classGroup.studentCount}</dd>
                                                        </div>
                                                        <div className="rounded-xl bg-[#f7faf7] p-3">
                                                            <dt className="font-semibold text-[#6b7280]">PH liên kết</dt>
                                                            <dd className="mt-1 font-bold text-gray-900">{classGroup.parentLinkedCount}/{classGroup.studentCount}</dd>
                                                        </div>
                                                        <div className="rounded-xl bg-[#fff8eb] p-3">
                                                            <dt className="font-semibold text-[#6b7280]">Năm học</dt>
                                                            <dd className="mt-1 font-bold text-gray-900">{classGroup.academicYear}</dd>
                                                        </div>
                                                    </dl>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </section>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};
