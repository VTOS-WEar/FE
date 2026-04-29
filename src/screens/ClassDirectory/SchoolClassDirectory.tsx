import { type ReactNode, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BookOpenCheck, FolderTree, GraduationCap, Upload, UsersRound } from "lucide-react";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { SCHOOL_THEME } from "../../constants/schoolTheme";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useSidebarConfig } from "../../hooks/useSidebarConfig";
import { getSchoolClassesOverview, getSchoolProfile, type SchoolClassesOverviewDto } from "../../lib/api/schools";

const MIN_FILTER_FEEDBACK_MS = 450;

function StatCard({
    label,
    value,
    tone,
    icon,
}: {
    label: string;
    value: number | string;
    tone: "school" | "cyan" | "mint";
    icon: ReactNode;
}) {
    const toneMap = {
        school: SCHOOL_THEME.summary.school,
        cyan: SCHOOL_THEME.summary.cyan,
        mint: SCHOOL_THEME.summary.mint,
    };

    return (
        <div className={`min-h-[112px] rounded-[8px] border p-5 shadow-soft-sm ${toneMap[tone]}`}>
            <div className="flex h-full items-center gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-white text-slate-900 shadow-soft-xs">
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700">{label}</p>
                    <p className="mt-2 text-2xl font-bold leading-tight text-slate-950">{value}</p>
                </div>
            </div>
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
    const [selectedGradeInput, setSelectedGradeInput] = useState<string>("all");
    const [selectedGrade, setSelectedGrade] = useState<string>("all");
    const [filtering, setFiltering] = useState(false);
    const filterTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

    useEffect(() => {
        getSchoolProfile().then((profile) => setSchoolName(profile.schoolName || "")).catch(() => {});
        getSchoolClassesOverview()
            .then((data) => setOverview(data))
            .catch((err: unknown) => setError(err instanceof Error ? err.message : "Không thể tải danh sách lớp"))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        return () => {
            if (filterTimerRef.current) {
                window.clearTimeout(filterTimerRef.current);
            }
        };
    }, []);

    const scheduleGradeFilter = (nextGrade: string) => {
        setSelectedGradeInput(nextGrade);
        setFiltering(true);
        if (filterTimerRef.current) {
            window.clearTimeout(filterTimerRef.current);
        }
        filterTimerRef.current = window.setTimeout(() => {
            setSelectedGrade(nextGrade);
            setFiltering(false);
            filterTimerRef.current = null;
        }, MIN_FILTER_FEEDBACK_MS);
    };

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
                        <div className="flex items-center gap-2 px-2 py-2">
                            <FolderTree className={`h-5 w-5 ${SCHOOL_THEME.primaryText}`} />
                            <h1 className="text-xl font-bold text-gray-900">Sơ đồ lớp học</h1>
                        </div>
                    </TopNavBar>

                    <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        <section className="space-y-5">
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                                <div className="max-w-3xl">
                                     <h1 className="text-2xl font-bold leading-tight text-slate-950">
                                         Quản lý học sinh theo khối và lớp
                                     </h1>
                                     <p className="mt-1 text-sm font-semibold text-slate-500">
                                         Theo dõi số lớp, số học sinh và mức độ sẵn sàng dữ liệu theo từng khối.
                                     </p>
                                 </div>
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={() => navigate("/school/students/import")}
                                        className={SCHOOL_THEME.primaryButton}
                                    >
                                        <Upload className="h-4 w-4" />
                                        Nhập từ Excel
                                    </button>
                                </div>
                            </div>

                            {overview && (
                                <div className="grid gap-4 md:grid-cols-3">
                                    <StatCard label="Năm học" value={overview.academicYear || "Chưa có"} tone="school" icon={<BookOpenCheck className="h-5 w-5" />} />
                                    <StatCard label="Tổng lớp" value={overview.totalClasses} tone="cyan" icon={<FolderTree className="h-5 w-5" />} />
                                    <StatCard label="Tổng học sinh" value={overview.totalStudents} tone="mint" icon={<UsersRound className="h-5 w-5" />} />
                                </div>
                            )}
                        </section>

                        {overview && overview.grades.length > 0 && (
                            <section className="rounded-[8px] border border-gray-200 bg-white p-4 shadow-soft-sm">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-semibold text-[#4c5769]">Khối:</span>
                                    <button
                                        type="button"
                                        onClick={() => scheduleGradeFilter("all")}
                                        className={`rounded-full border px-3 py-2 text-sm font-semibold transition-colors ${
                                            selectedGradeInput === "all"
                                                ? SCHOOL_THEME.activePill
                                                : SCHOOL_THEME.inactivePill
                                        }`}
                                    >
                                        Tất cả
                                    </button>
                                    {overview.grades.map((grade) => (
                                        <button
                                            key={grade.grade}
                                            type="button"
                                            onClick={() => scheduleGradeFilter(grade.grade)}
                                            className={`rounded-full border px-3 py-2 text-sm font-semibold transition-colors ${
                                                selectedGradeInput === grade.grade
                                                    ? SCHOOL_THEME.activePill
                                                    : SCHOOL_THEME.inactivePill
                                            }`}
                                        >
                                            Khối {grade.grade}
                                        </button>
                                    ))}
                                    {filtering ? (
                                        <div className="inline-flex h-10 items-center gap-2 rounded-full border border-blue-100 bg-white px-3 text-xs font-bold text-[#2563EB] shadow-soft-sm">
                                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-100 border-t-[#2563EB]" />
                                            Đang lọc
                                        </div>
                                    ) : null}
                                </div>
                            </section>
                        )}

                         {loading && (
                            <section className="rounded-[8px] border border-gray-200 bg-white p-10 text-center shadow-soft-sm">
                                <div className={`mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 ${SCHOOL_THEME.spinner}`} />
                                <p className="text-sm font-semibold text-[#4c5769]">Đang tải cấu trúc lớp học...</p>
                            </section>
                        )}

                        {!loading && error && (
                            <section className="rounded-[8px] border border-red-200 bg-white p-8 text-center shadow-soft-sm">
                                <p className="text-base font-bold text-red-600">{error}</p>
                            </section>
                        )}

                        {!loading && !error && overview && overview.grades.length === 0 && (
                            <section className="rounded-[8px] border border-gray-200 bg-white p-10 text-center shadow-soft-sm">
                                 <GraduationCap className={`mx-auto h-10 w-10 ${SCHOOL_THEME.primaryText}`} />
                                 <h2 className="mt-4 text-xl font-extrabold text-gray-900">Chưa có lớp học nào</h2>
                             </section>
                         )}

                        {!loading && !error && overview && overview.grades.length > 0 && (
                            <section className="space-y-5">
                                {overview.grades.filter((grade) => selectedGrade === "all" || grade.grade === selectedGrade).map((grade) => (
                                    <div key={grade.grade} className="rounded-[8px] border border-gray-200 bg-white p-5 shadow-soft-sm">
                                        <div className="flex flex-col gap-2">
                                            <div>
                                                <p className={`text-xs font-extrabold uppercase tracking-[0.18em] ${SCHOOL_THEME.primaryText}`}>Khối {grade.grade}</p>
                                                <h2 className="mt-1 text-2xl font-extrabold text-gray-900">{grade.classCount} lớp, {grade.studentCount} học sinh</h2>
                                            </div>
                                        </div>

                                        <div className="mt-5 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                                            {grade.classes.map((classGroup) => (
                                                <button
                                                    key={classGroup.id}
                                                    type="button"
                                                    onClick={() => navigate(`/school/students/classes/${classGroup.id}`)}
                                                    className={`group rounded-[8px] border border-gray-200 bg-white p-5 text-left shadow-soft-sm transition-all hover:-translate-y-1 ${SCHOOL_THEME.hoverPanel} hover:shadow-soft-md`}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className={`text-xs font-bold uppercase tracking-[0.18em] ${SCHOOL_THEME.primaryText}`}>Lớp {classGroup.className}</p>
                                                            <h3 className="mt-2 text-xl font-extrabold text-gray-900">{classGroup.studentCount} học sinh</h3>
                                                        </div>
                                                        <div className={`rounded-full ${SCHOOL_THEME.primarySoftBg} p-2 ${SCHOOL_THEME.primaryText}`}>
                                                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                                        </div>
                                                    </div>

                                                    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                                        <div className="rounded-[8px] bg-[#EFF6FF] p-3">
                                                            <dt className="font-semibold text-[#6b7280]">GVCN</dt>
                                                            <dd className="mt-1 font-bold text-gray-900">{classGroup.homeroomTeacherName || "Chưa gán"}</dd>
                                                        </div>
                                                        <div className="rounded-[8px] bg-[#ECFEFF] p-3">
                                                            <dt className="font-semibold text-[#6b7280]">Đo áo</dt>
                                                            <dd className="mt-1 font-bold text-gray-900">{classGroup.measurementReadyCount}/{classGroup.studentCount}</dd>
                                                        </div>
                                                        <div className="rounded-[8px] bg-[#F0FDF4] p-3">
                                                            <dt className="font-semibold text-[#6b7280]">PH liên kết</dt>
                                                            <dd className="mt-1 font-bold text-gray-900">{classGroup.parentLinkedCount}/{classGroup.studentCount}</dd>
                                                        </div>
                                                        <div className="rounded-[8px] bg-[#F8FAFC] p-3">
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
