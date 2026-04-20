import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, GraduationCap, Mail, Ruler, Users } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../../components/ui/breadcrumb";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useSidebarConfig } from "../../hooks/useSidebarConfig";
import { getTeacherClassDetail } from "../../lib/api/teachers";
import type { ClassGroupDetailDto } from "../../lib/api/schools";

export const TeacherClassDetail = (): JSX.Element => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const sidebarConfig = useSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [detail, setDetail] = useState<ClassGroupDetailDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        getTeacherClassDetail(id)
            .then((data) => setDetail(data))
            .catch((err: unknown) => setError(err instanceof Error ? err.message : "Khong the tai chi tiet lop"))
            .finally(() => setLoading(false));
    }, [id]);

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} name={detail?.homeroomTeacher?.fullName || ""} isCollapsed={isCollapsed} onToggle={toggle} />
                </div>
                <div className="flex-1 flex min-w-0 flex-col">
                    <TopNavBar>
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem><BreadcrumbLink href="/teacher/classes" className="font-semibold text-[#4c5769] text-base">Lop chu nhiem</BreadcrumbLink></BreadcrumbItem>
                                <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                                <BreadcrumbItem><BreadcrumbPage className="font-bold text-gray-900 text-base">{detail?.className || "Chi tiet lop"}</BreadcrumbPage></BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </TopNavBar>

                    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        <button type="button" onClick={() => navigate("/teacher/classes")} className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-900">
                            <ArrowLeft className="h-4 w-4" />
                            Quay lai danh sach lop
                        </button>

                        {loading && (
                            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-soft-md">
                                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-emerald-600" />
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
                                <section className="rounded-[28px] border border-emerald-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_36%),linear-gradient(135deg,_#ffffff_10%,_#f2fff8_55%,_#f7fbff_100%)] p-6 shadow-soft-lg">
                                    <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                                        <div>
                                            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700">{detail.schoolName}</p>
                                            <h1 className="mt-2 text-[30px] font-extrabold leading-tight text-gray-900 lg:text-[38px]">Lop {detail.className}</h1>
                                            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-[#4c5769] lg:text-base">
                                                Day la bang dieu khien nhanh cho giao vien chu nhiem de xem si so, do ao, lien ket phu huynh va danh sach hoc sinh.
                                            </p>
                                        </div>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="rounded-2xl border border-emerald-200 bg-white/90 px-5 py-4">
                                                <p className="text-sm font-semibold text-[#6b7280]">Hoc sinh</p>
                                                <p className="mt-2 text-3xl font-extrabold text-gray-900">{detail.studentCount}</p>
                                            </div>
                                            <div className="rounded-2xl border border-sky-200 bg-white/90 px-5 py-4">
                                                <p className="text-sm font-semibold text-[#6b7280]">Do ao day du</p>
                                                <p className="mt-2 text-3xl font-extrabold text-gray-900">{detail.measurementReadyCount}</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_2.2fr]">
                                    <div className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-soft-md">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><GraduationCap className="h-5 w-5" /></div>
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Giao vien chu nhiem</p>
                                                <h2 className="text-xl font-extrabold text-gray-900">{detail.homeroomTeacher?.fullName || "Chua cap nhat"}</h2>
                                            </div>
                                        </div>
                                        <div className="mt-5 space-y-3 rounded-2xl bg-[#f4fffb] p-4 text-sm font-semibold text-[#4c5769]">
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-emerald-600" />
                                                <span>{detail.homeroomTeacher?.email || "Chua co email"}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-emerald-600" />
                                                <span>{detail.parentLinkedCount}/{detail.studentCount} hoc sinh da lien ket phu huynh</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Ruler className="h-4 w-4 text-sky-600" />
                                                <span>{detail.measurementReadyCount}/{detail.studentCount} hoc sinh da co do ao</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-[24px] border border-gray-200 bg-white shadow-soft-md">
                                        <div className="border-b border-gray-200 px-5 py-4">
                                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Danh sach hoc sinh</p>
                                            <h2 className="text-xl font-extrabold text-gray-900">Theo doi nhanh tinh trang tung em</h2>
                                        </div>
                                        <div className="divide-y divide-gray-100">
                                            {detail.students.map((student) => (
                                                <div key={student.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[1.2fr_0.8fr_1.2fr_1fr] lg:items-center">
                                                    <div>
                                                        <p className="text-base font-bold text-gray-900">{student.fullName}</p>
                                                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#6b7280]">{student.studentCode || "Khong co ma hoc sinh"}</p>
                                                    </div>
                                                    <div className="text-sm font-semibold text-[#4c5769]">
                                                        <p>{student.gender === "Male" ? "Nam" : student.gender === "Female" ? "Nu" : student.gender}</p>
                                                        <p className="mt-1 text-xs">{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString("vi-VN") : "Chua co ngay sinh"}</p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${student.hasMeasurements ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                                            {student.hasMeasurements ? "Da do ao" : "Thieu do ao"}
                                                        </span>
                                                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${student.isParentLinked ? "bg-sky-100 text-sky-700" : "bg-gray-100 text-gray-700"}`}>
                                                            {student.isParentLinked ? "Da lien ket PH" : "Chua lien ket"}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm font-semibold text-[#4c5769]">
                                                        <p>{student.parentName || "Chua co phu huynh"}</p>
                                                        <p className="mt-1 text-xs">{student.parentPhone || "Chua co so dien thoai"}</p>
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
