import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
    deleteSemesterPublication,
    getSchoolProfile,
    getSemesterPublications,
    publishSemesterPublication,
    type SemesterPublicationDto,
} from "../../lib/api/schools";

const FILTER_TABS = [
    { key: "all", label: "Tat ca" },
    { key: "Draft", label: "Ban nhap" },
    { key: "Active", label: "Dang mo" },
    { key: "Closed", label: "Da dong" },
];

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
    Draft: { label: "Ban nhap", badge: "nb-badge text-gray-500 bg-gray-100" },
    Active: { label: "Dang mo", badge: "nb-badge nb-badge-green" },
    Closed: { label: "Da dong", badge: "nb-badge nb-badge-blue" },
};

function formatDate(value: string) {
    return new Date(value).toLocaleDateString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.Draft;
    return <span className={cfg.badge}>{cfg.label}</span>;
}

function PublicationCard({
    publication,
    onOpen,
    onEdit,
    onPublish,
    onDelete,
}: {
    publication: SemesterPublicationDto;
    onOpen: () => void;
    onEdit: () => void;
    onPublish: () => void;
    onDelete: () => void;
}) {
    const isDraft = publication.status === "Draft";
    return (
        <div onClick={onOpen} className="nb-card p-5 cursor-pointer group">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-gray-900 text-base truncate group-hover:text-violet-600 transition-colors">
                            {publication.semester} / {publication.academicYear}
                        </h3>
                        <StatusBadge status={publication.status} />
                    </div>
                    <p className="font-medium text-[#97A3B6] text-sm mt-1 line-clamp-2">
                        {publication.description || "Chua co mo ta cho dot cong bo nay."}
                    </p>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-[12px] border border-gray-200 bg-white px-3 py-3 shadow-soft-sm">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500">Thoi gian</p>
                    <p className="mt-1 text-sm font-bold text-gray-900">
                        {formatDate(publication.startDate)} - {formatDate(publication.endDate)}
                    </p>
                </div>
                <div className="rounded-[12px] border border-gray-200 bg-white px-3 py-3 shadow-soft-sm">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500">Pham vi</p>
                    <p className="mt-1 text-sm font-bold text-gray-900">
                        {publication.outfitCount} dong phuc · {publication.providerCount} nha cung cap
                    </p>
                </div>
            </div>

            {isDraft && (
                <div
                    className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200"
                    onClick={(event) => event.stopPropagation()}
                >
                    <button onClick={onEdit} className="nb-btn nb-btn-outline nb-btn-sm text-xs">
                        Chinh sua
                    </button>
                    <button onClick={onPublish} className="nb-btn nb-btn-green nb-btn-sm text-xs">
                        Cong khai
                    </button>
                    <button onClick={onDelete} className="nb-btn nb-btn-red nb-btn-sm text-xs">
                        Xoa
                    </button>
                </div>
            )}
        </div>
    );
}

export const SemesterPublicationList = (): JSX.Element => {
    const navigate = useNavigate();
    const sidebarConfig = useSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [schoolName, setSchoolName] = useState("");
    const [publications, setPublications] = useState<SemesterPublicationDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const showToast = useCallback((message: string, type: "success" | "error") => {
        setToast({ message, type });
        window.setTimeout(() => setToast(null), 3000);
    }, []);

    const loadPublications = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getSemesterPublications(1, 50, activeTab);
            setPublications(response.items);
        } catch {
            setPublications([]);
            showToast("Khong the tai danh sach cong bo hoc ky.", "error");
        } finally {
            setLoading(false);
        }
    }, [activeTab, showToast]);

    useEffect(() => {
        getSchoolProfile()
            .then((profile) => setSchoolName(profile.schoolName || ""))
            .catch(() => undefined);
    }, []);

    useEffect(() => {
        loadPublications();
    }, [loadPublications]);

    const filteredPublications = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) {
            return publications;
        }

        return publications.filter((publication) =>
            `${publication.semester} ${publication.academicYear} ${publication.description || ""}`
                .toLowerCase()
                .includes(query)
        );
    }, [publications, search]);

    const statusCounts = useMemo(() => {
        return publications.reduce<Record<string, number>>((accumulator, publication) => {
            accumulator[publication.status] = (accumulator[publication.status] ?? 0) + 1;
            return accumulator;
        }, {});
    }, [publications]);

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    const handlePublish = async (publication: SemesterPublicationDto) => {
        try {
            await publishSemesterPublication(publication.id);
            showToast("Dot cong bo da duoc kich hoat.", "success");
            await loadPublications();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Khong the cong khai dot cong bo.";
            showToast(message, "error");
        }
    };

    const handleDelete = async (publication: SemesterPublicationDto) => {
        const confirmed = window.confirm(`Xoa dot cong bo ${publication.semester} / ${publication.academicYear}?`);
        if (!confirmed) {
            return;
        }

        try {
            await deleteSemesterPublication(publication.id);
            showToast("Da xoa ban nhap.", "success");
            await loadPublications();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Khong the xoa dot cong bo.";
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
                                    <BreadcrumbPage className="font-bold text-gray-900 text-base">
                                        Cong bo hoc ky
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </TopNavBar>

                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="max-w-3xl">
                                <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-extrabold text-violet-700 shadow-soft-sm">
                                    Marketplace governance
                                </div>
                                <h1 className="mt-3 text-[28px] lg:text-[32px] font-extrabold text-gray-900 leading-tight">
                                    Cong bo danh muc hoc ky va nha cung cap
                                </h1>
                                <p className="mt-2 text-sm lg:text-base font-medium text-[#4c5769]">
                                    Tao dot mo ban theo hoc ky, chon dong phuc da co hop dong va kich hoat nha cung cap phu hop.
                                </p>
                            </div>

                            <button onClick={() => navigate("/school/semester-publications/new")} className="nb-btn nb-btn-purple text-sm whitespace-nowrap">
                                Tao cong bo moi
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="nb-stat-card nb-stat-primary">
                                <div className="nb-stat-label">Tong dot cong bo</div>
                                <div className="nb-stat-value">{publications.length}</div>
                            </div>
                            <div className="nb-stat-card">
                                <div className="nb-stat-label">Dang mo</div>
                                <div className="nb-stat-value">{statusCounts.Active ?? 0}</div>
                            </div>
                            <div className="nb-stat-card">
                                <div className="nb-stat-label">Ban nhap</div>
                                <div className="nb-stat-value">{statusCounts.Draft ?? 0}</div>
                            </div>
                        </div>

                        <div className="nb-card-static p-4 space-y-4">
                            <div className="flex items-center gap-2 nb-input py-2.5">
                                <svg className="w-5 h-5 text-[#97A3B6] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                                </svg>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Tim theo hoc ky, nam hoc hoac mo ta..."
                                    className="flex-1 bg-transparent outline-none font-medium text-sm text-[#1a1a2e] placeholder:text-[#97A3B6]"
                                />
                            </div>

                            <div className="nb-tabs w-fit">
                                {FILTER_TABS.map((tab) => {
                                    const isActive = activeTab === tab.key;
                                    const badge = tab.key === "all" ? publications.length : statusCounts[tab.key] ?? 0;
                                    return (
                                        <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`nb-tab ${isActive ? "nb-tab-active" : ""}`}>
                                            {tab.label}
                                            <span
                                                className={`ml-1.5 min-w-[20px] h-5 flex items-center justify-center rounded-full text-xs font-bold px-1.5 ${
                                                    isActive ? "bg-white/20 text-white" : "bg-[#E5E7EB] text-gray-600"
                                                }`}
                                            >
                                                {badge}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {loading && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                                {[1, 2, 3].map((item) => (
                                    <div key={item} className="nb-skeleton p-5 h-[200px]" />
                                ))}
                            </div>
                        )}

                        {!loading && filteredPublications.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                                {filteredPublications.map((publication) => (
                                    <PublicationCard
                                        key={publication.id}
                                        publication={publication}
                                        onOpen={() => navigate(`/school/semester-publications/${publication.id}`)}
                                        onEdit={() => navigate(`/school/semester-publications/${publication.id}/edit`)}
                                        onPublish={() => handlePublish(publication)}
                                        onDelete={() => handleDelete(publication)}
                                    />
                                ))}
                            </div>
                        )}

                        {!loading && filteredPublications.length === 0 && (
                            <div className="nb-card-static p-12 text-center">
                                <div className="w-14 h-14 rounded-full bg-violet-50 flex items-center justify-center mx-auto mb-4 border border-gray-200 shadow-soft-sm">
                                    <svg className="w-7 h-7 text-violet-600" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                                    </svg>
                                </div>
                                <p className="font-bold text-gray-600 text-base">Chua co cong bo hoc ky nao</p>
                                <p className="font-medium text-[#97A3B6] text-sm mt-1 mb-4">
                                    Tao ban nhap dau tien de chuan bi dot mo ban moi.
                                </p>
                                <button onClick={() => navigate("/school/semester-publications/new")} className="nb-btn nb-btn-purple text-sm">
                                    Tao cong bo moi
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default SemesterPublicationList;
