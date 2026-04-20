import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ClipboardList, Ruler, Upload, UserRound, Users } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../../components/ui/breadcrumb";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useSidebarConfig } from "../../hooks/useSidebarConfig";
import { getSchoolClassDetail, getSchoolProfile, type ClassGroupDetailDto } from "../../lib/api/schools";

function StudentBadge({ ok, yesText, noText }: { ok: boolean; yesText: string; noText: string }) {
    return (
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
            {ok ? yesText : noText}
        </span>
    );
}

export const SchoolClassDetail = (): JSX.Element => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const sidebarConfig = useSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [schoolName, setSchoolName] = useState("");
    const [detail, setDetail] = useState<ClassGroupDetailDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getSchoolProfile().then((profile) => setSchoolName(profile.schoolName || "")).catch(() => {});
        if (!id) return;
        getSchoolClassDetail(id)
            .then((data) => setDetail(data))
            .catch((err: unknown) => setError(err instanceof Error ? err.message : "Khong the tai chi tiet lop"))
            .finally(() => setLoading(false));
    }, [id]);

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} name={schoolName} isCollapsed={isCollapsed} onToggle={toggle} />
                </div>
                <div className="flex-1 flex min-w-0 flex-col">
                    <TopNavBar>
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem><BreadcrumbLink href="/school/dashboard" className="font-semibold text-[#4c5769] text-base">Trang chu</BreadcrumbLink></BreadcrumbItem>
                                <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                                <BreadcrumbItem><BreadcrumbLink href="/school/students" className="font-semibold text-[#4c5769] text-base">Hoc sinh theo lop</BreadcrumbLink></BreadcrumbItem>
                                <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                                <BreadcrumbItem><BreadcrumbPage className="font-bold text-gray-900 text-base">{detail?.className || "Chi tiet lop"}</BreadcrumbPage></BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </TopNavBar>

                    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        <button type="button" onClick={() => navigate("/school/students")} className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-violet-700 hover:text-violet-900">
                            <ArrowLeft className="h-4 w-4" />
                            Quay lai so do lop
                        </button>

                        {loading && (
                            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-soft-md">
                                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-violet-600" />
                                <p className="text-sm font-semibold text-[#4c5769]">Dang tai thong tin lop...</p>
                            </div>
                        )}

                        {!loading && error && (
                            <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-soft-md">
                                <p className="text-base font-bold text-red-600">{error}</p>
                            </div>
                        )}

                        {!loading && !error && detail && (
                            <>
                                <section className="rounded-[28px] border border-sky-200 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.16),_transparent_35%),linear-gradient(135deg,_#ffffff_10%,_#f9fdff_55%,_#f6f2ff_100%)] p-6 shadow-soft-lg">
                                    <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                                        <div>
                                            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-sky-700">{detail.academicYear}</p>
                                            <h1 className="mt-2 text-[30px] font-extrabold leading-tight text-gray-900 lg:text-[38px]">Lop {detail.className}</h1>
                                            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-[#4c5769] lg:text-base">
                                                Theo doi hoc sinh, giao vien chu nhiem, tinh trang do ao va lien ket phu huynh trong cung mot workspace.
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            <button onClick={() => navigate("/school/students/import")} className="nb-btn nb-btn-outline text-sm">
                                                <Upload className="h-4 w-4" />
                                                Nhap them hoc sinh
                                            </button>
                                            <button onClick={() => navigate("/school/students/all")} className="nb-btn nb-btn-purple text-sm">
                                                <ClipboardList className="h-4 w-4" />
                                                Mo danh sach cu
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-6 grid gap-4 md:grid-cols-4">
                                        <div className="rounded-2xl border border-violet-200 bg-white/80 p-4">
                                            <p className="text-sm font-semibold text-[#6b7280]">Hoc sinh</p>
                                            <p className="mt-2 text-3xl font-extrabold text-gray-900">{detail.studentCount}</p>
                                        </div>
                                        <div className="rounded-2xl border border-sky-200 bg-white/80 p-4">
                                            <p className="text-sm font-semibold text-[#6b7280]">Do ao day du</p>
                                            <p className="mt-2 text-3xl font-extrabold text-gray-900">{detail.measurementReadyCount}</p>
                                        </div>
                                        <div className="rounded-2xl border border-emerald-200 bg-white/80 p-4">
                                            <p className="text-sm font-semibold text-[#6b7280]">Phu huynh lien ket</p>
                                            <p className="mt-2 text-3xl font-extrabold text-gray-900">{detail.parentLinkedCount}</p>
                                        </div>
                                        <div className="rounded-2xl border border-amber-200 bg-white/80 p-4">
                                            <p className="text-sm font-semibold text-[#6b7280]">GVCN</p>
                                            <p className="mt-2 text-lg font-extrabold text-gray-900">{detail.homeroomTeacher?.fullName || "Chua gan"}</p>
                                        </div>
                                    </div>
                                </section>

                                <section className="mt-6 grid gap-4 xl:grid-cols-[1.3fr_2.2fr]">
                                    <div className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-soft-md">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-2xl bg-violet-50 p-3 text-violet-700"><UserRound className="h-5 w-5" /></div>
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">Giao vien chu nhiem</p>
                                                <h2 className="text-xl font-extrabold text-gray-900">{detail.homeroomTeacher?.fullName || "Chua cap nhat"}</h2>
                                            </div>
                                        </div>
                                        <div className="mt-5 rounded-2xl bg-[#faf7ff] p-4 text-sm">
                                            <p className="font-semibold text-[#6b7280]">Email</p>
                                            <p className="mt-1 font-bold text-gray-900">{detail.homeroomTeacher?.email || "Chua co email"}</p>
                                        </div>
                                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                            <div className="rounded-2xl bg-[#eef7ff] p-4">
                                                <p className="text-sm font-semibold text-[#6b7280]">Khoi</p>
                                                <p className="mt-1 text-xl font-extrabold text-gray-900">{detail.grade}</p>
                                            </div>
                                            <div className="rounded-2xl bg-[#fff8eb] p-4">
                                                <p className="text-sm font-semibold text-[#6b7280]">Truong</p>
                                                <p className="mt-1 text-base font-extrabold text-gray-900">{detail.schoolName}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-[24px] border border-gray-200 bg-white shadow-soft-md">
                                        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">Danh sach hoc sinh</p>
                                                <h2 className="text-xl font-extrabold text-gray-900">{detail.students.length} hoc sinh trong lop</h2>
                                            </div>
                                            <div className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-[#4c5769]">
                                                {detail.className}
                                            </div>
                                        </div>

                                        <div className="divide-y divide-gray-100">
                                            {detail.students.map((student) => (
                                                <div key={student.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[1.3fr_0.8fr_0.9fr_1fr] lg:items-center">
                                                    <div>
                                                        <p className="text-base font-bold text-gray-900">{student.fullName}</p>
                                                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#6b7280]">{student.studentCode || "Khong co ma hoc sinh"}</p>
                                                    </div>
                                                    <div className="text-sm font-semibold text-[#4c5769]">
                                                        <p>{student.gender === "Male" ? "Nam" : student.gender === "Female" ? "Nu" : student.gender}</p>
                                                        <p className="mt-1 text-xs">{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString("vi-VN") : "Chua co ngay sinh"}</p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        <StudentBadge ok={student.hasMeasurements} yesText="Da do ao" noText="Thieu do ao" />
                                                        <StudentBadge ok={student.isParentLinked} yesText="Da lien ket PH" noText="Chua lien ket" />
                                                    </div>
                                                    <div className="text-sm font-semibold text-[#4c5769]">
                                                        <div className="flex items-center gap-2">
                                                            <Users className="h-4 w-4 text-violet-600" />
                                                            <span>{student.parentName || "Chua co phu huynh"}</span>
                                                        </div>
                                                        <div className="mt-2 flex items-center gap-2">
                                                            <Ruler className="h-4 w-4 text-sky-600" />
                                                            <span>{student.parentPhone || "Chua co so dien thoai"}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </section>
                            </>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};
