import { AlertTriangle, ArrowRight, CalendarRange, CircleDot, ClipboardList, Layers3, Plus, Search } from "lucide-react";
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
import { usePreservedResultsHeight } from "../../hooks/usePreservedResultsHeight";
import { useSidebarConfig } from "../../hooks/useSidebarConfig";
import {
    deleteSemesterPublication,
    getSchoolProfile,
    getSemesterPublications,
    publishSemesterPublication,
    type SemesterPublicationDto,
} from "../../lib/api/schools";

const FILTER_TABS = [
    { key: "all", label: "Tất cả" },
    { key: "Draft", label: "Bản nháp" },
    { key: "Active", label: "Đang mở" },
    { key: "Closed", label: "Đã đóng" },
] as const;

function formatDate(value: string) {
    return new Date(value).toLocaleDateString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function getDaysRemaining(value: string) {
    const now = Date.now();
    const diff = new Date(value).getTime() - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function stripHtml(html: string) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
}

function getPublicationStatusMeta(status: string) {
    switch (status) {
        case "Active":
            return {
                label: "Đang mở",
                badgeClass: "nb-badge nb-badge-green",
                surfaceClass: "border-emerald-200 bg-emerald-50/70",
                actionLabel: "Theo dõi vận hành",
            };
        case "Closed":
            return {
                label: "Đã đóng",
                badgeClass: "nb-badge nb-badge-blue",
                surfaceClass: "border-slate-200 bg-slate-50",
                actionLabel: "Xem tổng kết",
            };
        default:
            return {
                label: "Bản nháp",
                badgeClass: "nb-badge text-amber-700 bg-amber-50 border border-amber-200",
                surfaceClass: "border-amber-200 bg-amber-50/60",
                actionLabel: "Hoàn thiện để phát hành",
            };
    }
}

function SummaryCard({
    label,
    value,
    tone,
}: {
    label: string;
    value: number;
    tone: "violet" | "green" | "amber" | "slate";
}) {
    const toneClass =
        tone === "green"
            ? "border-emerald-200 bg-emerald-50"
            : tone === "amber"
              ? "border-amber-200 bg-amber-50"
              : tone === "slate"
                ? "border-slate-200 bg-slate-50"
                : "border-violet-200 bg-violet-50";

    return (
        <div className={`rounded-[22px] border p-4 shadow-soft-sm ${toneClass}`}>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-gray-500">{label}</p>
            <p className="mt-3 text-3xl font-extrabold text-gray-900">{value}</p>
        </div>
    );
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
    const meta = getPublicationStatusMeta(publication.status);
    const daysRemaining = getDaysRemaining(publication.endDate);
    const isDraft = publication.status === "Draft";
    const isActive = publication.status === "Active";
    const isClosingSoon = isActive && daysRemaining >= 0 && daysRemaining <= 7;
    const progressLabel =
        publication.outfitCount > 0 && publication.providerCount > 0
            ? "Sẵn sàng vận hành"
            : publication.outfitCount > 0 || publication.providerCount > 0
              ? "Cần hoàn thiện thêm"
              : "Chưa có dữ liệu vận hành";

    return (
        <div
            onClick={onOpen}
            className={`group cursor-pointer rounded-[22px] border p-5 shadow-soft-sm transition-colors hover:border-gray-300 ${meta.surfaceClass}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={meta.badgeClass}>{meta.label}</span>
                        {isClosingSoon && (
                            <span className="rounded-full border border-amber-200 bg-white px-2.5 py-1 text-[11px] font-extrabold text-amber-700 shadow-soft-sm">
                                Cần theo dõi đóng kỳ
                            </span>
                        )}
                    </div>
                    <h3 className="mt-4 text-xl font-extrabold leading-tight text-gray-900 transition-colors group-hover:text-violet-700">
                        {publication.semester} / {publication.academicYear}
                    </h3>
                    {publication.description && (
                        <p className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-[#5b6475]">
                            {stripHtml(publication.description)}
                        </p>
                    )}
                </div>

                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onOpen();
                    }}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-soft-sm transition-colors hover:text-violet-700"
                >
                    <ArrowRight className="h-4 w-4" />
                </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-[18px] border border-white/70 bg-white/90 p-4 shadow-soft-sm">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-gray-500">Khung thời gian</p>
                    <p className="mt-2 text-sm font-bold text-gray-900">
                        {formatDate(publication.startDate)} - {formatDate(publication.endDate)}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-[#5b6475]">
                        {isActive
                            ? daysRemaining >= 0
                                ? `Còn khoảng ${daysRemaining} ngày mở bán`
                                : "Đã quá hạn đóng, cần rà soát trạng thái"
                            : publication.status === "Closed"
                              ? "Đợt công bố đã khép lại"
                              : "Bản nháp chưa phát hành"}
                    </p>
                </div>
                <div className="rounded-[18px] border border-white/70 bg-white/90 p-4 shadow-soft-sm">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-gray-500">Phạm vi hiện tại</p>
                    <p className="mt-2 text-sm font-bold text-gray-900">
                        {publication.outfitCount} đồng phục · {publication.providerCount} nhà cung cấp
                    </p>
                    <p className="mt-2 text-xs font-semibold text-[#5b6475]">{progressLabel}</p>
                </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/70 pt-4">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#4c5769]">
                    <CircleDot className="h-4 w-4 text-violet-600" />
                    {meta.actionLabel}
                </div>

                {isDraft ? (
                    <div className="flex flex-wrap gap-2" onClick={(event) => event.stopPropagation()}>
                        <button onClick={onEdit} className="nb-btn nb-btn-outline nb-btn-sm text-xs">
                            Chỉnh sửa
                        </button>
                        <button onClick={onPublish} className="nb-btn nb-btn-green nb-btn-sm text-xs">
                            Công khai
                        </button>
                        <button onClick={onDelete} className="nb-btn nb-btn-red nb-btn-sm text-xs">
                            Xóa
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onOpen();
                        }}
                        className="nb-btn nb-btn-outline nb-btn-sm text-xs"
                    >
                        Mở overview
                    </button>
                )}
            </div>
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
    const [activeTab, setActiveTab] = useState<(typeof FILTER_TABS)[number]["key"]>("all");
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const showToast = useCallback((message: string, type: "success" | "error") => {
        setToast({ message, type });
        window.setTimeout(() => setToast(null), 3000);
    }, []);

    const loadPublications = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getSemesterPublications(1, 50);
            setPublications(response.items);
        } catch {
            setPublications([]);
            showToast("Không thể tải danh sách công bố học kỳ.", "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        getSchoolProfile()
            .then((profile) => setSchoolName(profile.schoolName || ""))
            .catch(() => undefined);
    }, []);

    useEffect(() => {
        loadPublications();
    }, [loadPublications]);

    const statusCounts = useMemo(() => {
        return publications.reduce<Record<string, number>>((accumulator, publication) => {
            accumulator[publication.status] = (accumulator[publication.status] ?? 0) + 1;
            return accumulator;
        }, {});
    }, [publications]);

    const filteredPublications = useMemo(() => {
        const query = search.trim().toLowerCase();

        return publications.filter((publication) => {
            const matchesTab = activeTab === "all" ? true : publication.status === activeTab;
            if (!matchesTab) {
                return false;
            }

            if (!query) {
                return true;
            }

            return `${publication.semester} ${publication.academicYear} ${publication.description ? stripHtml(publication.description) : ""}`
                .toLowerCase()
                .includes(query);
        });
    }, [activeTab, publications, search]);

    const draftCount = statusCounts.Draft ?? 0;
    const activeCount = statusCounts.Active ?? 0;
    const closedCount = statusCounts.Closed ?? 0;
    const isSearchEmptyState = !loading && publications.length > 0 && filteredPublications.length === 0;
    const {
        resultsRegionRef,
        preserveResultsHeight,
        clearPreservedHeight,
        preservedHeightStyle,
    } = usePreservedResultsHeight(isSearchEmptyState);
    const nearEndingActive = useMemo(
        () =>
            publications.filter(
                (publication) =>
                    publication.status === "Active" &&
                    getDaysRemaining(publication.endDate) >= 0 &&
                    getDaysRemaining(publication.endDate) <= 7
            ),
        [publications]
    );

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
            showToast("Đợt công bố đã được kích hoạt.", "success");
            await loadPublications();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Không thể công khai đợt công bố.";
            showToast(message, "error");
        }
    };

    const handleDelete = async (publication: SemesterPublicationDto) => {
        const confirmed = window.confirm(`Xóa đợt công bố ${publication.semester} / ${publication.academicYear}?`);
        if (!confirmed) {
            return;
        }

        try {
            await deleteSemesterPublication(publication.id);
            showToast("Đã xóa bản nháp.", "success");
            await loadPublications();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Không thể xóa đợt công bố.";
            showToast(message, "error");
        }
    };

    return (
        <div className="nb-page flex flex-col">
            {toast && (
                <div
                    className={`fixed right-6 top-6 z-[99999] flex items-center gap-3 rounded-[12px] border px-5 py-3 text-sm font-extrabold shadow-soft-md ${
                        toast.type === "success"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-red-200 bg-red-50 text-red-700"
                    }`}
                >
                    {toast.message}
                </div>
            )}

            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 transition-all duration-300 lg:sticky lg:top-0 lg:h-screen`}>
                    <DashboardSidebar
                        {...sidebarConfig}
                        name={schoolName}
                        isCollapsed={isCollapsed}
                        onToggle={toggle}
                        onLogout={handleLogout}
                    />
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                    <TopNavBar>
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/school/dashboard" className="text-base font-semibold text-[#4c5769]">
                                        Trang chủ
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="text-base font-bold text-gray-900">Công bố học kỳ</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </TopNavBar>

                    <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        <section className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-soft-sm lg:p-7">
                            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                                <div className="max-w-3xl">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-violet-700">
                                        <Layers3 className="h-4 w-4" />
                                        Công bố học kỳ
                                    </div>
                                    <h1 className="mt-4 text-[28px] font-extrabold leading-tight text-gray-900 lg:text-[34px]">
                                        Theo dõi các đợt công bố học kỳ của nhà trường
                                    </h1>
                                </div>

                                <div className="flex w-full max-w-[420px] flex-col gap-3 xl:items-end">
                                    <button
                                        onClick={() => navigate("/school/semester-publications/new")}
                                        className="nb-btn nb-btn-purple min-w-[220px] text-sm"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Tạo công bố mới
                                    </button>
                                    <div className="rounded-[18px] border border-gray-200 bg-slate-50 p-4">
                                        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-gray-500">Trọng tâm hôm nay</p>
                                        <p className="mt-2 text-sm font-bold text-gray-900">
                                            {draftCount > 0
                                                ? `${draftCount} bản nháp cần hoàn thiện trước khi phát hành`
                                                : activeCount > 0
                                                  ? `${activeCount} đợt đang mở cần theo dõi vận hành`
                                                  : "Chưa có đợt công bố nào đang hoạt động"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                <SummaryCard label="Tổng công bố" value={publications.length} tone="violet" />
                                <SummaryCard label="Đang mở" value={activeCount} tone="green" />
                                <SummaryCard label="Bản nháp" value={draftCount} tone="amber" />
                                <SummaryCard label="Đã đóng" value={closedCount} tone="slate" />
                            </div>
                        </section>

                        {(draftCount > 0 || nearEndingActive.length > 0) && (
                            <section className="rounded-[20px] border border-amber-200 bg-amber-50/70 p-5 shadow-soft-sm">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-2xl bg-white p-3 text-amber-700 shadow-soft-sm">
                                            <AlertTriangle className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-extrabold text-gray-900">Hạng mục cần lưu ý</h2>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            preserveResultsHeight();
                                            setActiveTab(draftCount > 0 ? "Draft" : "Active");
                                        }}
                                        className="nb-btn nb-btn-outline text-sm"
                                    >
                                        Xem ngay
                                    </button>
                                </div>
                            </section>
                        )}

                        <section className="nb-card-static sticky top-0 z-20 space-y-4 rounded-[20px] bg-white p-4">
                            <div className="flex items-center gap-2 nb-input py-2.5">
                                <Search className="h-5 w-5 flex-shrink-0 text-[#97A3B6]" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) => {
                                        preserveResultsHeight();
                                        setSearch(event.target.value);
                                    }}
                                    placeholder="Tìm theo học kỳ, năm học hoặc mô tả..."
                                    className="flex-1 bg-transparent text-sm font-medium text-[#1a1a2e] outline-none placeholder:text-[#97A3B6]"
                                />
                            </div>

                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <div className="nb-tabs w-fit">
                                    {FILTER_TABS.map((tab) => {
                                        const isActive = activeTab === tab.key;
                                        const badge =
                                            tab.key === "all"
                                                ? publications.length
                                                : statusCounts[tab.key] ?? 0;

                                        return (
                                            <button key={tab.key} onClick={() => {
                                                preserveResultsHeight();
                                                setActiveTab(tab.key);
                                            }} className={`nb-tab ${isActive ? "nb-tab-active" : ""}`}>
                                                {tab.label}
                                                <span
                                                    className={`ml-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                                                        isActive ? "bg-white/20 text-white" : "bg-[#E5E7EB] text-gray-600"
                                                    }`}
                                                >
                                                    {badge}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-[#5b6475]">
                                    <CalendarRange className="h-4 w-4 text-violet-600" />
                                    {filteredPublications.length} công bố trong chế độ xem hiện tại
                                </div>
                            </div>
                        </section>

                        {loading && (
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                                {[1, 2, 3].map((item) => (
                                    <div key={item} className="nb-skeleton h-[280px] rounded-[26px]" />
                                ))}
                            </div>
                        )}

                        <div ref={resultsRegionRef} style={preservedHeightStyle}>
                        {!loading && filteredPublications.length > 0 && (
                            <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
                            </section>
                        )}

                        {!loading && filteredPublications.length === 0 && (
                            <section className="rounded-[26px] border border-gray-200 bg-white p-12 text-center shadow-soft-md">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-violet-200 bg-violet-50 text-violet-600 shadow-soft-sm">
                                    {publications.length === 0 ? <Plus className="h-8 w-8" /> : <ClipboardList className="h-8 w-8" />}
                                </div>
                                <h2 className="mt-5 text-xl font-extrabold text-gray-900">
                                    {publications.length === 0 ? "Chưa có công bố học kỳ nào" : "Không tìm thấy công bố phù hợp"}
                                </h2>
                                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                                    {publications.length === 0 ? (
                                        <button onClick={() => navigate("/school/semester-publications/new")} className="nb-btn nb-btn-purple text-sm">
                                            Tạo công bố mới
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setSearch("");
                                                setActiveTab("all");
                                                clearPreservedHeight();
                                            }}
                                            className="nb-btn nb-btn-outline text-sm"
                                        >
                                            Xóa bộ lọc
                                        </button>
                                    )}
                                </div>
                            </section>
                        )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default SemesterPublicationList;
