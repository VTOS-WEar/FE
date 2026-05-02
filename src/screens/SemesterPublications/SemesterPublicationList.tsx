import { ArrowRight, CalendarRange, ChevronDown, ClipboardList, Layers3, Pencil, Plus, Search, Send, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { SCHOOL_THEME } from "../../constants/schoolTheme";
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

const MIN_FILTER_FEEDBACK_MS = 700;
const PUBLICATION_TABLE_GRID_CLASS = "lg:grid-cols-[1.5fr_220px_220px_0.8fr_112px]";

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
            };
        case "Closed":
            return {
                label: "Đã đóng",
                badgeClass: "nb-badge nb-badge-blue",
            };
        default:
            return {
                label: "Bản nháp",
                badgeClass: "nb-badge text-amber-700 bg-amber-50 border border-amber-200",
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
    tone: "school" | "green" | "amber" | "slate";
}) {
    const toneClass =
        tone === "green"
            ? SCHOOL_THEME.summary.mint
            : tone === "amber"
              ? SCHOOL_THEME.summary.cyan
              : tone === "slate"
                ? SCHOOL_THEME.summary.slate
                : SCHOOL_THEME.summary.school;

    return (
        <div className={`min-h-[112px] rounded-[8px] border p-5 shadow-soft-sm ${toneClass}`}>
            <p className="text-sm font-semibold text-slate-700">{label}</p>
            <p className="mt-2 text-2xl font-bold leading-tight text-slate-950">{value}</p>
        </div>
    );
}

function PublicationRow({
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
    const timelineLabel = isActive
        ? daysRemaining >= 0
            ? `Còn khoảng ${daysRemaining} ngày mở bán`
            : "Đã quá hạn đóng, cần rà soát trạng thái"
        : publication.status === "Closed"
          ? "Đợt công bố đã khép lại"
          : "Bản nháp chưa phát hành";
    const progressLabel =
        publication.outfitCount > 0 && publication.providerCount > 0
            ? "Sẵn sàng vận hành"
            : publication.outfitCount > 0 || publication.providerCount > 0
              ? "Cần hoàn thiện thêm"
              : "Chưa có dữ liệu vận hành";

    return (
        <div
            onClick={onOpen}
            className={`group grid cursor-pointer gap-4 px-5 py-4 transition-colors hover:bg-blue-50/50 lg:items-center ${PUBLICATION_TABLE_GRID_CLASS}`}
        >
            <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate text-sm font-bold text-slate-950 transition-colors group-hover:text-[#2563EB]">
                        {publication.semester} / {publication.academicYear}
                    </p>
                    {isClosingSoon ? (
                        <span className="hidden flex-shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 xl:inline-flex">
                            Cần theo dõi
                        </span>
                    ) : null}
                </div>
                <p className="mt-1 line-clamp-1 text-xs font-medium text-slate-500">
                    {publication.description ? stripHtml(publication.description) : "Chưa có mô tả"}
                </p>
            </div>

            <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">
                    {formatDate(publication.startDate)} - {formatDate(publication.endDate)}
                </p>
                <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-500">{timelineLabel}</p>
            </div>

            <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">
                    {publication.outfitCount} đồng phục · {publication.providerCount} nhà cung cấp
                </p>
                <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-500">{progressLabel}</p>
            </div>

            <span className={`inline-flex w-fit ${meta.badgeClass}`}>{meta.label}</span>

            <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
                {isDraft ? (
                    <>
                        <button type="button" onClick={onEdit} className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-slate-700 transition-colors hover:bg-blue-50 hover:text-[#2563EB]" aria-label="Sửa">
                            <Pencil className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={onPublish} className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700" aria-label="Công khai">
                            <Send className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={onDelete} className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-slate-700 transition-colors hover:bg-red-50 hover:text-red-600" aria-label="Xóa">
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </>
                ) : (
                    <button
                        type="button"
                        onClick={onOpen}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-slate-700 transition-colors hover:bg-blue-50 hover:text-[#2563EB]"
                        aria-label="Mở"
                    >
                        <ArrowRight className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );
}

function PublicationTableSkeleton() {
    return (
        <div className="overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-soft-sm">
            <div className={`hidden items-center gap-4 border-b border-gray-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-950 lg:grid ${PUBLICATION_TABLE_GRID_CLASS}`}>
                <span>Công bố</span>
                <span>Thời gian</span>
                <span>Phạm vi</span>
                <span>Trạng thái</span>
                <span>Thao tác</span>
            </div>
            {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className={`grid gap-4 border-b border-gray-100 px-5 py-4 last:border-b-0 lg:items-center ${PUBLICATION_TABLE_GRID_CLASS}`}>
                    <div className="space-y-2">
                        <div className="nb-skeleton h-5 w-48 rounded-full" />
                        <div className="nb-skeleton h-4 w-64 max-w-full rounded-full" />
                    </div>
                    <div className="space-y-2">
                        <div className="nb-skeleton h-4 w-40 rounded-full" />
                        <div className="nb-skeleton h-3 w-32 rounded-full" />
                    </div>
                    <div className="space-y-2">
                        <div className="nb-skeleton h-4 w-36 rounded-full" />
                        <div className="nb-skeleton h-3 w-28 rounded-full" />
                    </div>
                    <div className="nb-skeleton h-6 w-24 rounded-full" />
                    <div className="nb-skeleton h-8 w-28 rounded-[8px]" />
                </div>
            ))}
        </div>
    );
}

function PublicationTable({
    items,
    onOpen,
    onEdit,
    onPublish,
    onDelete,
}: {
    items: SemesterPublicationDto[];
    onOpen: (publication: SemesterPublicationDto) => void;
    onEdit: (publication: SemesterPublicationDto) => void;
    onPublish: (publication: SemesterPublicationDto) => void;
    onDelete: (publication: SemesterPublicationDto) => void;
}) {
    return (
        <section className="overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-soft-sm">
            <div className={`hidden items-center gap-4 border-b border-gray-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-950 lg:grid ${PUBLICATION_TABLE_GRID_CLASS}`}>
                <span>Công bố</span>
                <span>Thời gian</span>
                <span>Phạm vi</span>
                <span>Trạng thái</span>
                <span>Thao tác</span>
            </div>
            <div className="divide-y divide-gray-100">
                {items.map((publication) => (
                    <PublicationRow
                        key={publication.id}
                        publication={publication}
                        onOpen={() => onOpen(publication)}
                        onEdit={() => onEdit(publication)}
                        onPublish={() => onPublish(publication)}
                        onDelete={() => onDelete(publication)}
                    />
                ))}
            </div>
        </section>
    );
}

export const SemesterPublicationList = (): JSX.Element => {
    const navigate = useNavigate();
    const sidebarConfig = useSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [schoolName, setSchoolName] = useState("");
    const [publications, setPublications] = useState<SemesterPublicationDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [statusInput, setStatusInput] = useState<(typeof FILTER_TABS)[number]["key"]>("all");
    const [activeTab, setActiveTab] = useState<(typeof FILTER_TABS)[number]["key"]>("all");
    const [filtering, setFiltering] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const filterTimerRef = useRef<number | null>(null);

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

    useEffect(() => () => {
        if (filterTimerRef.current !== null) {
            window.clearTimeout(filterTimerRef.current);
        }
    }, []);

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

    const scheduleFilterCommit = useCallback((next: {
        search: string;
        status: (typeof FILTER_TABS)[number]["key"];
    }) => {
        preserveResultsHeight();
        setFiltering(true);

        if (filterTimerRef.current !== null) {
            window.clearTimeout(filterTimerRef.current);
        }

        filterTimerRef.current = window.setTimeout(() => {
            setSearch(next.search);
            setActiveTab(next.status);
            setFiltering(false);
            filterTimerRef.current = null;
        }, MIN_FILTER_FEEDBACK_MS);
    }, [preserveResultsHeight]);

    const clearFilters = () => {
        if (filterTimerRef.current !== null) {
            window.clearTimeout(filterTimerRef.current);
            filterTimerRef.current = null;
        }

        setSearchInput("");
        setSearch("");
        setStatusInput("all");
        setActiveTab("all");
        setFiltering(false);
        clearPreservedHeight();
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
                    className={`fixed right-6 top-6 z-[99999] flex items-center gap-3 rounded-[12px] border px-5 py-3 text-sm font-bold shadow-soft-md ${
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
                        <div className="flex items-center gap-2 px-2 py-2">
                            <Layers3 className={`h-5 w-5 ${SCHOOL_THEME.primaryText}`} />
                            <h1 className="text-xl font-bold text-gray-900">Công bố học kỳ</h1>
                        </div>
                    </TopNavBar>

                    <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        <section className="space-y-5">
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-950">Theo dõi các đợt công bố học kỳ</h2>
                                    <p className="mt-1 text-sm font-semibold text-slate-500">
                                        Quản lý bản nháp, đợt đang mở và các công bố đã đóng của nhà trường.
                                    </p>
                                </div>

                                <button
                                    onClick={() => navigate("/school/semester-publications/new")}
                                    className={SCHOOL_THEME.primaryButton}
                                >
                                    <Plus className="h-4 w-4" />
                                    Tạo công bố mới
                                </button>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <SummaryCard label="Tổng công bố" value={publications.length} tone="school" />
                                <SummaryCard label="Đang mở" value={activeCount} tone="green" />
                                <SummaryCard label="Bản nháp" value={draftCount} tone="amber" />
                                <SummaryCard label="Đã đóng" value={closedCount} tone="slate" />
                            </div>
                        </section>

                        <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <label className="relative block w-full lg:max-w-[340px]">
                                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    value={searchInput}
                                    onChange={(event) => {
                                        const nextSearch = event.target.value;
                                        setSearchInput(nextSearch);
                                        scheduleFilterCommit({ search: nextSearch, status: statusInput });
                                    }}
                                    placeholder="Tìm công bố..."
                                    className="h-10 w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-800 outline-none shadow-soft-xs transition-colors placeholder:text-slate-500 focus:border-blue-200 focus:ring-4 focus:ring-blue-50"
                                />
                            </label>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                                <label className="relative block">
                                    <select
                                        value={statusInput}
                                        onChange={(event) => {
                                            const nextStatus = event.target.value as (typeof FILTER_TABS)[number]["key"];
                                            setStatusInput(nextStatus);
                                            scheduleFilterCommit({ search: searchInput, status: nextStatus });
                                        }}
                                        className="h-10 min-w-[158px] appearance-none rounded-full border border-slate-200 bg-white py-0 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none shadow-soft-xs transition-colors focus:border-blue-200 focus:ring-4 focus:ring-blue-50"
                                    >
                                        {FILTER_TABS.map((tab) => (
                                            <option key={tab.key} value={tab.key}>{tab.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-900" />
                                </label>

                                <div className="inline-flex h-10 items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 text-xs font-bold text-[#5b6475]">
                                    <CalendarRange className={`h-4 w-4 ${SCHOOL_THEME.primaryText}`} />
                                    {filteredPublications.length} công bố
                                </div>

                                {filtering ? (
                                    <div className="inline-flex h-10 items-center gap-2 rounded-full border border-blue-100 bg-white px-3 text-xs font-bold text-[#2563EB] shadow-soft-sm">
                                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-100 border-t-[#2563EB]" />
                                        Đang tải
                                    </div>
                                ) : null}
                            </div>
                        </section>

                        {loading && <PublicationTableSkeleton />}

                        <div ref={resultsRegionRef} style={preservedHeightStyle} className="relative">
                            {!loading && filteredPublications.length > 0 && (
                                <PublicationTable
                                    items={filteredPublications}
                                    onOpen={(publication) => navigate(`/school/semester-publications/${publication.id}`)}
                                    onEdit={(publication) => navigate(`/school/semester-publications/${publication.id}/edit`)}
                                    onPublish={handlePublish}
                                    onDelete={handleDelete}
                                />
                            )}

                            {!loading && filteredPublications.length === 0 && (
                                <section className="rounded-[8px] border border-gray-200 bg-white p-12 text-center shadow-soft-sm">
                                    <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full border ${SCHOOL_THEME.primarySoftBorder} ${SCHOOL_THEME.primarySoftBg} ${SCHOOL_THEME.primaryText} shadow-soft-sm`}>
                                        {publications.length === 0 ? <Plus className="h-8 w-8" /> : <ClipboardList className="h-8 w-8" />}
                                    </div>
                                    <h2 className="mt-5 text-xl font-bold text-gray-900">
                                        {publications.length === 0 ? "Chưa có công bố học kỳ nào" : "Không tìm thấy công bố phù hợp"}
                                    </h2>
                                    <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                                        {publications.length === 0 ? (
                                            <button onClick={() => navigate("/school/semester-publications/new")} className={SCHOOL_THEME.primaryButton}>
                                                Tạo công bố mới
                                            </button>
                                        ) : (
                                            <button
                                                onClick={clearFilters}
                                                className="nb-btn nb-btn-outline text-sm hover:border-blue-200 hover:text-[#2563EB]"
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
