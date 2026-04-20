import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useSidebarConfig } from "../../hooks/useSidebarConfig";
import {
    closeSemesterPublication,
    getSchoolProfile,
    getSemesterPublicationDetail,
    publishSemesterPublication,
    type SemesterPublicationDetailDto,
} from "../../lib/api/schools";

function formatDate(value: string) {
    return new Date(value).toLocaleDateString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

export const SemesterPublicationDetail = (): JSX.Element => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const sidebarConfig = useSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [schoolName, setSchoolName] = useState("");
    const [publication, setPublication] = useState<SemesterPublicationDetailDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const showToast = useCallback((message: string, type: "success" | "error") => {
        setToast({ message, type });
        window.setTimeout(() => setToast(null), 3000);
    }, []);

    const loadPublication = useCallback(async () => {
        if (!id) {
            return;
        }

        setLoading(true);
        try {
            const detail = await getSemesterPublicationDetail(id);
            setPublication(detail);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Khong the tai chi tiet cong bo hoc ky.";
            showToast(message, "error");
        } finally {
            setLoading(false);
        }
    }, [id, showToast]);

    useEffect(() => {
        getSchoolProfile()
            .then((profile) => setSchoolName(profile.schoolName || ""))
            .catch(() => undefined);
        loadPublication();
    }, [loadPublication]);

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    const handlePublish = async () => {
        if (!publication) {
            return;
        }

        try {
            await publishSemesterPublication(publication.id);
            showToast("Da kich hoat cong bo hoc ky.", "success");
            await loadPublication();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Khong the cong khai dot cong bo.";
            showToast(message, "error");
        }
    };

    const handleClose = async () => {
        if (!publication) {
            return;
        }

        const confirmed = window.confirm("Dong dot cong bo nay?");
        if (!confirmed) {
            return;
        }

        try {
            await closeSemesterPublication(publication.id);
            showToast("Da dong dot cong bo.", "success");
            await loadPublication();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Khong the dong dot cong bo.";
            showToast(message, "error");
        }
    };

    return (
        <div className="nb-page flex flex-col">
            {toast && (
                <div
                    className={`fixed top-6 right-6 z-[99999] flex items-center gap-3 rounded-[12px] border border-gray-200 px-5 py-3 text-sm font-extrabold shadow-soft-md ${
                        toast.type === "success"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-red-50 text-red-700 border-red-200"
                    }`}
                >
                    {toast.message}
                </div>
            )}

            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar
                        {...sidebarConfig}
                        name={schoolName}
                        isCollapsed={isCollapsed}
                        onToggle={toggle}
                        onLogout={handleLogout}
                    />
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                    <TopNavBar>
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/school/dashboard" className="font-semibold text-[#4c5769] text-base">
                                        Trang chu
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/school/semester-publications" className="font-semibold text-[#4c5769] text-base">
                                        Cong bo hoc ky
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="font-bold text-gray-900 text-base">Chi tiet</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </TopNavBar>

                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6">
                        {loading ? (
                            <div className="nb-skeleton h-[260px]" />
                        ) : !publication ? (
                            <div className="nb-card-static p-10 text-center">
                                <p className="text-lg font-black text-gray-900">Khong tim thay cong bo hoc ky</p>
                                <button onClick={() => navigate("/school/semester-publications")} className="nb-btn nb-btn-outline mt-4 text-sm">
                                    Quay lai danh sach
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="nb-card-static p-6">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="max-w-3xl">
                                            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-extrabold text-gray-700 shadow-soft-sm">
                                                {publication.status}
                                            </div>
                                            <h1 className="mt-3 text-[28px] lg:text-[32px] font-extrabold text-gray-900 leading-tight">
                                                {publication.semester} / {publication.academicYear}
                                            </h1>
                                            <p className="mt-2 text-sm lg:text-base font-medium text-[#4c5769]">
                                                {publication.description || "Chua co mo ta cho dot cong bo hoc ky nay."}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            <button onClick={() => navigate(`/school/semester-publications/${publication.id}/edit`)} className="nb-btn nb-btn-outline text-sm">
                                                Mo workspace
                                            </button>
                                            {publication.status === "Draft" && (
                                                <button onClick={handlePublish} className="nb-btn nb-btn-green text-sm">
                                                    Cong khai
                                                </button>
                                            )}
                                            {publication.status === "Active" && (
                                                <button onClick={handleClose} className="nb-btn nb-btn-outline text-sm">
                                                    Dong dot mo ban
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="nb-stat-card nb-stat-primary">
                                        <div className="nb-stat-label">Khoang thoi gian</div>
                                        <div className="text-base font-black text-gray-900 mt-2">
                                            {formatDate(publication.startDate)} - {formatDate(publication.endDate)}
                                        </div>
                                    </div>
                                    <div className="nb-stat-card">
                                        <div className="nb-stat-label">Dong phuc</div>
                                        <div className="nb-stat-value">{publication.outfits.length}</div>
                                    </div>
                                    <div className="nb-stat-card">
                                        <div className="nb-stat-label">Nha cung cap</div>
                                        <div className="nb-stat-value">{publication.providers.length}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-[1.1fr,0.9fr] gap-6">
                                    <section className="nb-card-static p-6">
                                        <h2 className="text-xl font-black text-gray-900">Danh muc dong phuc</h2>
                                        <div className="mt-5 space-y-3">
                                            {publication.outfits.length === 0 ? (
                                                <div className="rounded-[14px] border border-dashed border-gray-200 bg-white p-5 text-sm font-semibold text-gray-500">
                                                    Chua co dong phuc nao duoc gan.
                                                </div>
                                            ) : (
                                                publication.outfits.map((outfit) => (
                                                    <div key={outfit.id} className="rounded-[14px] border border-gray-200 bg-white p-4 shadow-soft-sm">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <h3 className="text-sm font-black text-gray-900">{outfit.outfitName}</h3>
                                                                <p className="mt-1 text-xs font-bold text-violet-700">{outfit.price.toLocaleString("vi-VN")}d</p>
                                                                <p className="mt-2 text-xs font-semibold text-[#6F6A7D]">{outfit.outfitType}</p>
                                                                {outfit.notes && (
                                                                    <p className="mt-2 text-sm font-medium text-[#4c5769]">{outfit.notes}</p>
                                                                )}
                                                            </div>
                                                            <span className="rounded-full border border-gray-200 bg-violet-50 px-2.5 py-1 text-[11px] font-extrabold text-violet-700">
                                                                Them luc {formatDate(outfit.addedAt)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </section>

                                    <section className="nb-card-static p-6">
                                        <h2 className="text-xl font-black text-gray-900">Nha cung cap dang tham gia</h2>
                                        <div className="mt-5 space-y-3">
                                            {publication.providers.length === 0 ? (
                                                <div className="rounded-[14px] border border-dashed border-gray-200 bg-white p-5 text-sm font-semibold text-gray-500">
                                                    Chua co nha cung cap nao duoc kich hoat.
                                                </div>
                                            ) : (
                                                publication.providers.map((provider) => (
                                                    <div key={provider.id} className="rounded-[14px] border border-gray-200 bg-white p-4 shadow-soft-sm">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <h3 className="text-sm font-black text-gray-900">{provider.providerName}</h3>
                                                                    <span className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-extrabold text-gray-700">
                                                                        {provider.status}
                                                                    </span>
                                                                </div>
                                                                <p className="mt-1 text-xs font-semibold text-[#6F6A7D]">
                                                                    {provider.contractName || "Chua co ten hop dong"}
                                                                </p>
                                                                <p className="mt-2 text-xs font-medium text-gray-500">
                                                                    Email: {provider.contactEmail || "Chua co"}
                                                                </p>
                                                                {provider.suspendReason && (
                                                                    <p className="mt-2 text-xs font-medium text-red-600">{provider.suspendReason}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </section>
                                </div>
                            </>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default SemesterPublicationDetail;
