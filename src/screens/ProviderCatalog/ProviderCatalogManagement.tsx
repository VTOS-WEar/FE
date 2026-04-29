import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ChevronDown, Loader2, PackageCheck, Save, Search, Shirt, SlidersHorizontal } from "lucide-react";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { ProviderDataTable, type ProviderDataTableColumn } from "../../components/provider/ProviderDataTable";
import { usePreservedResultsHeight } from "../../hooks/usePreservedResultsHeight";
import { useProviderSidebarConfig } from "../../hooks/useProviderSidebarConfig";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useToast } from "../../contexts/ToastContext";
import {
    getProviderCatalog,
    getProviderProfile,
    upsertProviderCatalogItem,
    type ProviderCatalogItemDto,
    type ProviderCatalogPublicationDto,
} from "../../lib/api/providers";

type CatalogDraft = {
    displayName: string;
    shortDescription: string;
    materialDetails: string;
    publicationPrice: string;
    postDeadlinePrice: string;
    status: string;
};

const PAGE_SIZE = 5;
const MIN_FILTER_FEEDBACK_MS = 450;

const STATUS_OPTIONS = [
    { value: "Draft", label: "Nháp" },
    { value: "Ready", label: "Sẵn sàng" },
    { value: "Published", label: "Đang bán" },
    { value: "Hidden", label: "Ẩn" },
];

const FILTER_OPTIONS = [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "active", label: "Đang hoạt động" },
    { value: "draft", label: "Nháp" },
    { value: "suspended", label: "Suspended" },
    { value: "needsSetup", label: "Cần thiết lập" },
];

const STATUS_BADGE: Record<string, string> = {
    Active: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Draft: "border-slate-200 bg-slate-50 text-slate-600",
    Ready: "border-sky-200 bg-sky-50 text-sky-700",
    Published: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Hidden: "border-rose-200 bg-rose-50 text-rose-700",
    Suspended: "border-rose-200 bg-rose-50 text-rose-700",
    Closed: "border-slate-200 bg-slate-50 text-slate-600",
};

function formatCurrency(value?: number | null) {
    if (!value) return "Chưa đặt";
    return `${value.toLocaleString("vi-VN")} ₫`;
}

function formatDate(value: string) {
    return new Date(value).toLocaleDateString("vi-VN");
}

function draftKey(publicationProviderId: string, outfitId: string) {
    return `${publicationProviderId}:${outfitId}`;
}

function toDraft(item: ProviderCatalogItemDto): CatalogDraft {
    return {
        displayName: item.displayName || item.outfitName,
        shortDescription: item.shortDescription || "",
        materialDetails: item.materialDetails || item.schoolMaterialType || "",
        publicationPrice: item.publicationPrice ? String(item.publicationPrice) : "",
        postDeadlinePrice: item.postDeadlinePrice ? String(item.postDeadlinePrice) : "",
        status: item.status || "Draft",
    };
}

function StatusBadge({ status }: { status: string }) {
    const label = STATUS_OPTIONS.find((item) => item.value === status)?.label || status;
    return (
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${STATUS_BADGE[status] || STATUS_BADGE.Draft}`}>
            {label}
        </span>
    );
}

function isLowPriorityPublication(publication: ProviderCatalogPublicationDto) {
    return publication.providerStatus === "Suspended" || publication.publicationStatus === "Draft";
}

function matchesFilter(publication: ProviderCatalogPublicationDto, filter: string) {
    if (filter === "all") return true;
    if (filter === "active") return publication.providerStatus === "Active" && publication.publicationStatus !== "Draft";
    if (filter === "draft") return publication.publicationStatus === "Draft";
    if (filter === "suspended") return publication.providerStatus === "Suspended";
    if (filter === "needsSetup") return publication.items.some((item) => !item.catalogItemId || item.status === "Draft");
    return true;
}

export function ProviderCatalogManagement() {
    const navigate = useNavigate();
    const sidebarConfig = useProviderSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const { showToast } = useToast();
    const [providerName, setProviderName] = useState("");
    const [publications, setPublications] = useState<ProviderCatalogPublicationDto[]>([]);
    const [drafts, setDrafts] = useState<Record<string, CatalogDraft>>({});
    const [loading, setLoading] = useState(true);
    const [savingKey, setSavingKey] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState("");
    const [appliedSearch, setAppliedSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [statusInput, setStatusInput] = useState("all");
    const [filtering, setFiltering] = useState(false);
    const [page, setPage] = useState(1);
    const filterTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [profile, catalog] = await Promise.all([getProviderProfile(), getProviderCatalog()]);
            setProviderName(profile.providerName || "");
            setPublications(catalog.publications || []);
            setDrafts(
                Object.fromEntries(
                    (catalog.publications || []).flatMap((publication) =>
                        publication.items.map((item) => [
                            draftKey(publication.semesterPublicationProviderId, item.outfitId),
                            toDraft(item),
                        ]),
                    ),
                ),
            );
        } catch (error) {
            showToast({
                title: "Không thể tải catalog",
                message: error instanceof Error ? error.message : "Vui lòng thử lại.",
                variant: "error",
            });
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        return () => {
            if (filterTimerRef.current) {
                window.clearTimeout(filterTimerRef.current);
            }
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("user");
        navigate("/signin", { replace: true });
    };

    const filteredPublications = useMemo(() => {
        const q = appliedSearch.trim().toLowerCase();

        return publications
            .filter((publication) => matchesFilter(publication, statusFilter))
            .map((publication) => {
                if (!q) return publication;

                return {
                    ...publication,
                    items: publication.items.filter((item) =>
                        [
                            publication.schoolName,
                            publication.semester,
                            publication.academicYear,
                            publication.contractNumber || "",
                            item.outfitName,
                            item.displayName,
                            item.schoolMaterialType || "",
                            item.materialDetails || "",
                        ]
                            .join(" ")
                            .toLowerCase()
                            .includes(q),
                    ),
                };
            })
            .filter((publication) => !q || publication.items.length > 0)
            .sort((a, b) => {
                const priorityA = isLowPriorityPublication(a) ? 1 : 0;
                const priorityB = isLowPriorityPublication(b) ? 1 : 0;
                if (priorityA !== priorityB) return priorityA - priorityB;
                return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
            });
    }, [appliedSearch, publications, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredPublications.length / PAGE_SIZE));
    const pagedPublications = filteredPublications.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const isInitialLoading = loading && publications.length === 0;
    const showListOverlay = loading && publications.length > 0;
    const isFilteredEmptyState = !loading && publications.length > 0 && filteredPublications.length === 0;
    const { preserveResultsHeight, preservedHeightStyle, resultsRegionRef } = usePreservedResultsHeight(isFilteredEmptyState);

    const summary = useMemo(() => {
        const allItems = publications.flatMap((publication) => publication.items);
        return {
            publications: publications.length,
            items: allItems.length,
            published: allItems.filter((item) => item.status === "Published").length,
            needsSetup: allItems.filter((item) => !item.catalogItemId).length,
        };
    }, [publications]);

    const updateDraft = (key: string, patch: Partial<CatalogDraft>) => {
        setDrafts((current) => ({
            ...current,
            [key]: {
                ...current[key],
                ...patch,
            },
        }));
    };

    const scheduleFilterCommit = useCallback(
        (next: { search: string; status: string }) => {
            preserveResultsHeight();
            setFiltering(true);
            if (filterTimerRef.current) {
                window.clearTimeout(filterTimerRef.current);
            }
            filterTimerRef.current = window.setTimeout(() => {
                setAppliedSearch(next.search.trim());
                setStatusFilter(next.status);
                setPage(1);
                setFiltering(false);
                filterTimerRef.current = null;
            }, MIN_FILTER_FEEDBACK_MS);
        },
        [preserveResultsHeight],
    );

    const applySearch = () => {
        scheduleFilterCommit({ search: searchInput, status: statusInput });
    };

    const saveItem = async (publication: ProviderCatalogPublicationDto, item: ProviderCatalogItemDto) => {
        const key = draftKey(publication.semesterPublicationProviderId, item.outfitId);
        const draft = drafts[key] || toDraft(item);
        const publicationPrice = Number(draft.publicationPrice);
        const postDeadlinePrice = Number(draft.postDeadlinePrice);

        if (!publicationPrice || publicationPrice <= 0 || !postDeadlinePrice || postDeadlinePrice <= 0) {
            showToast({
                title: "Giá chưa hợp lệ",
                message: "Giá trong đợt công bố và giá sau hạn phải lớn hơn 0.",
                variant: "error",
            });
            return;
        }

        if (postDeadlinePrice < publicationPrice) {
            showToast({
                title: "Giá sau hạn chưa hợp lệ",
                message: "Giá sau hạn không được thấp hơn giá trong đợt công bố.",
                variant: "error",
            });
            return;
        }

        setSavingKey(key);
        try {
            const saved = await upsertProviderCatalogItem(publication.semesterPublicationProviderId, item.outfitId, {
                displayName: draft.displayName,
                shortDescription: draft.shortDescription || null,
                materialDetails: draft.materialDetails || null,
                publicationPrice,
                postDeadlinePrice,
                status: draft.status,
            });

            setPublications((current) =>
                current.map((currentPublication) =>
                    currentPublication.semesterPublicationProviderId !== publication.semesterPublicationProviderId
                        ? currentPublication
                        : {
                              ...currentPublication,
                              items: currentPublication.items.map((currentItem) =>
                                  currentItem.outfitId === item.outfitId ? saved : currentItem,
                              ),
                          },
                ),
            );
            setDrafts((current) => ({ ...current, [key]: toDraft(saved) }));
            showToast({
                title: "Đã lưu catalog",
                message: `${saved.outfitName} đã cập nhật giá và chất liệu.`,
                variant: "success",
            });
        } catch (error) {
            showToast({
                title: "Không thể lưu catalog",
                message: error instanceof Error ? error.message : "Vui lòng thử lại.",
                variant: "error",
            });
        } finally {
            setSavingKey(null);
        }
    };

    const buildColumns = (publication: ProviderCatalogPublicationDto): ProviderDataTableColumn<ProviderCatalogItemDto>[] => [
        {
            key: "item",
            header: "Mẫu",
            className: "min-w-[260px]",
            render: (item) => (
                <div className="flex min-w-0 items-center gap-3">
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-[8px] border border-gray-200 bg-slate-50">
                        {item.outfitImageUrl ? (
                            <img src={item.outfitImageUrl} alt={item.outfitName} className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-300">
                                <Shirt className="h-5 w-5" />
                            </div>
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-slate-950">{item.outfitName}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">HĐ: {formatCurrency(item.contractPricePerUnit)}</p>
                        <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                            Trường: {item.schoolMaterialType || "Chưa cập nhật"}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            key: "displayName",
            header: "Tên hiển thị",
            className: "min-w-[240px]",
            render: (item) => {
                const key = draftKey(publication.semesterPublicationProviderId, item.outfitId);
                const draft = drafts[key] || toDraft(item);
                return (
                    <input
                        value={draft.displayName}
                        onChange={(event) => updateDraft(key, { displayName: event.target.value })}
                        className="nb-input h-9 w-full text-sm"
                    />
                );
            },
        },
        {
            key: "price",
            header: "Giá trong kỳ",
            className: "min-w-[150px]",
            render: (item) => {
                const key = draftKey(publication.semesterPublicationProviderId, item.outfitId);
                const draft = drafts[key] || toDraft(item);
                return (
                    <input
                        type="number"
                        min="0"
                        step="1000"
                        value={draft.publicationPrice}
                        onChange={(event) => updateDraft(key, { publicationPrice: event.target.value })}
                        className="nb-input h-9 w-full text-sm"
                    />
                );
            },
        },
        {
            key: "postDeadlinePrice",
            header: "Giá sau hạn",
            className: "min-w-[150px]",
            render: (item) => {
                const key = draftKey(publication.semesterPublicationProviderId, item.outfitId);
                const draft = drafts[key] || toDraft(item);
                return (
                    <input
                        type="number"
                        min="0"
                        step="1000"
                        value={draft.postDeadlinePrice}
                        onChange={(event) => updateDraft(key, { postDeadlinePrice: event.target.value })}
                        className="nb-input h-9 w-full text-sm"
                    />
                );
            },
        },
        {
            key: "material",
            header: "Chất liệu",
            className: "min-w-[220px]",
            render: (item) => {
                const key = draftKey(publication.semesterPublicationProviderId, item.outfitId);
                const draft = drafts[key] || toDraft(item);
                return (
                    <textarea
                        value={draft.materialDetails}
                        onChange={(event) => updateDraft(key, { materialDetails: event.target.value })}
                        rows={1}
                        className="nb-input min-h-9 w-full resize-y text-sm"
                    />
                );
            },
        },
        {
            key: "status",
            header: "Trạng thái",
            className: "min-w-[150px]",
            render: (item) => {
                const key = draftKey(publication.semesterPublicationProviderId, item.outfitId);
                const draft = drafts[key] || toDraft(item);
                return (
                    <select
                        value={draft.status}
                        onChange={(event) => updateDraft(key, { status: event.target.value })}
                        className="nb-input h-9 w-full text-sm"
                    >
                        {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                );
            },
        },
        {
            key: "action",
            header: "",
            className: "w-[72px]",
            render: (item) => {
                const key = draftKey(publication.semesterPublicationProviderId, item.outfitId);
                const isSaving = savingKey === key;
                return (
                    <button
                        type="button"
                        onClick={() => saveItem(publication, item)}
                        disabled={isSaving}
                        aria-label="Lưu catalog item"
                        title="Lưu"
                        className="nb-btn nb-btn-primary h-9 w-9 justify-center p-0"
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </button>
                );
            },
        },
    ];

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 transition-all duration-300 lg:sticky lg:top-0 lg:h-screen`}>
                    <DashboardSidebar {...sidebarConfig} name={providerName} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                    <TopNavBar>
                        <div className="px-2 py-2">
                            <h1 className="text-xl font-bold text-gray-900">Catalog nhà cung cấp</h1>
                        </div>
                    </TopNavBar>

                    <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        <section className="space-y-5">
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-950">Giá và chất liệu theo trường</h2>
                                    <p className="mt-1 text-sm font-semibold text-slate-500">
                                        Quản lý giá bán, chất liệu và trạng thái hiển thị cho từng mẫu đồng phục trong các đợt trường đã duyệt.
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                {[
                                    { label: "Đợt được duyệt", value: summary.publications, icon: <PackageCheck className="h-5 w-5" /> },
                                    { label: "Mẫu có thể cấu hình", value: summary.items, icon: <Shirt className="h-5 w-5" /> },
                                    { label: "Đang bán", value: summary.published, icon: <CheckCircle2 className="h-5 w-5" /> },
                                    { label: "Cần thiết lập", value: summary.needsSetup, icon: <SlidersHorizontal className="h-5 w-5" /> },
                                ].map((card) => (
                                    <div key={card.label} className="rounded-[8px] border border-gray-200 bg-white p-5 shadow-soft-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-50 text-violet-700">
                                                {card.icon}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{card.label}</p>
                                                <p className="mt-1 text-2xl font-extrabold text-slate-950">{card.value}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <form
                                className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-[460px]"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    applySearch();
                                }}
                            >
                                <label className="relative block flex-1">
                                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                    <input
                                        value={searchInput}
                                        onChange={(event) => setSearchInput(event.target.value)}
                                        placeholder="Tìm trường, hợp đồng, mẫu..."
                                        className="h-10 w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-800 outline-none shadow-soft-xs transition-colors placeholder:text-slate-500 focus:border-violet-200 focus:ring-4 focus:ring-violet-50"
                                    />
                                </label>
                                <button type="submit" className="nb-btn nb-btn-primary h-10 justify-center px-4">
                                    <Search className="h-4 w-4" />
                                    Tìm
                                </button>
                            </form>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                                {filtering ? (
                                    <div className="inline-flex h-10 items-center gap-2 rounded-full border border-violet-100 bg-white px-3 text-xs font-bold text-violet-700 shadow-soft-xs">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Đang lọc
                                    </div>
                                ) : null}
                                <label className="relative block">
                                    <select
                                        value={statusInput}
                                        onChange={(event) => {
                                            const nextStatus = event.target.value;
                                            setStatusInput(nextStatus);
                                            scheduleFilterCommit({ search: searchInput, status: nextStatus });
                                        }}
                                        className="h-10 min-w-[180px] appearance-none rounded-full border border-slate-200 bg-white py-0 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none shadow-soft-xs transition-colors focus:border-violet-200 focus:ring-4 focus:ring-violet-50"
                                    >
                                        {FILTER_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-900" />
                                </label>
                            </div>
                        </section>

                        {isInitialLoading ? (
                            <div className="flex min-h-[320px] items-center justify-center rounded-[8px] border border-gray-200 bg-white">
                                <Loader2 className="h-6 w-6 animate-spin text-violet-700" />
                            </div>
                        ) : (
                            <div ref={resultsRegionRef} style={preservedHeightStyle}>
                            {filteredPublications.length === 0 ? (
                            <div className="rounded-[8px] border border-gray-200 bg-white p-8 text-center shadow-soft-sm">
                                <PackageCheck className="mx-auto h-10 w-10 text-slate-300" />
                                <h3 className="mt-4 text-lg font-extrabold text-slate-950">Chưa có catalog cần quản lý</h3>
                                <p className="mt-2 text-sm font-semibold text-slate-500">
                                    Khi trường duyệt nhà cung cấp cho một đợt công bố học kỳ, các mẫu sẽ xuất hiện tại đây.
                                </p>
                            </div>
                            ) : (
                            <section className="relative space-y-5">
                                {showListOverlay ? (
                                    <div className="absolute inset-0 z-10 flex items-start justify-center rounded-[8px] bg-white/70 pt-10 backdrop-blur-[1px]">
                                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-soft-sm">
                                            <Loader2 className="h-4 w-4 animate-spin text-violet-700" />
                                            Đang tải
                                        </div>
                                    </div>
                                ) : null}

                                {pagedPublications.map((publication) => (
                                    <div key={publication.semesterPublicationProviderId} className="rounded-[8px] border border-gray-200 bg-white shadow-soft-sm">
                                        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                                            <div>
                                                <h3 className="text-lg font-extrabold text-slate-950">
                                                    {publication.schoolName} · {publication.semester} {publication.academicYear}
                                                </h3>
                                                <p className="mt-1 text-sm font-semibold text-slate-500">
                                                    {formatDate(publication.startDate)} - {formatDate(publication.endDate)}
                                                    {publication.contractNumber ? ` · ${publication.contractNumber}` : ""}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <StatusBadge status={publication.publicationStatus} />
                                                <StatusBadge status={publication.providerStatus} />
                                            </div>
                                        </div>

                                        <div className="px-4 py-4">
                                            <ProviderDataTable
                                                items={publication.items}
                                                columns={buildColumns(publication)}
                                                getKey={(item) => item.outfitId}
                                            />
                                        </div>
                                    </div>
                                ))}

                                {totalPages > 1 ? (
                                    <div className="flex items-center justify-center gap-3 pt-1">
                                        <button
                                            type="button"
                                            disabled={page <= 1 || loading}
                                            onClick={() => setPage((current) => Math.max(1, current - 1))}
                                            className="nb-btn nb-btn-outline text-sm disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Trước
                                        </button>
                                        <span className="text-sm font-medium text-gray-500">{page}/{totalPages}</span>
                                        <button
                                            type="button"
                                            disabled={page >= totalPages || loading}
                                            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                                            className="nb-btn nb-btn-outline text-sm disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Sau
                                        </button>
                                    </div>
                                ) : null}
                            </section>
                            )}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
