import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsUpDown, Eye, Search, X } from "lucide-react";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useAdminSidebarConfig } from "../../hooks/useAdminSidebarConfig";
import { usePreservedResultsHeight } from "../../hooks/usePreservedResultsHeight";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { createAccountForRequest, getAccountRequestDetail, getAccountRequests, rejectAccountRequest, type AccountRequestDetail, type AccountRequestListItem } from "../../lib/api/accountRequests";
import { ADMIN_TONE, AdminEmptyState, AdminSummaryCard, AdminTopNavTitle } from "../AdminShared/adminWorkspace";

const MIN_PAGE_FETCH_FEEDBACK_MS = 700;
const MIN_FILTER_COMMIT_MS = 450;
const statusTone: Record<string, { bg: string; text: string; label: string }> = {
    Pending: { bg: ADMIN_TONE.amberSoft, text: "#9A6506", label: "Chờ xử lý" },
    Approved: { bg: ADMIN_TONE.emeraldSoft, text: "#0C7A5D", label: "Đã duyệt" },
    Rejected: { bg: ADMIN_TONE.roseSoft, text: "#B23148", label: "Đã từ chối" },
};

const typeTone: Record<string, { bg: string; text: string; label: string }> = {
    School: { bg: ADMIN_TONE.skySoft, text: "#1D63BE", label: "Trường học" },
    Provider: { bg: ADMIN_TONE.amberSoft, text: "#9A6506", label: "Nhà cung cấp" },
};

function CompactBadge({
    children,
    bg = "#FFFFFF",
    text = "#374151",
}: {
    children: ReactNode;
    bg?: string;
    text?: string;
}) {
    return (
        <span
            className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-[13px] font-medium leading-none shadow-soft-xs"
            style={{ background: bg, color: text }}
        >
            {children}
        </span>
    );
}

function SortButton({
    children,
    active,
    direction,
    onClick,
}: {
    children: ReactNode;
    active: boolean;
    direction: "asc" | "desc";
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`inline-flex items-center gap-1 text-left text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors hover:text-rose-700 ${
                active ? "text-gray-900" : "text-[#4E4A5B]"
            }`}
        >
            <span>{children}</span>
            {active ? (
                direction === "asc" ? (
                    <ChevronUp className="h-3 w-3 text-rose-700" strokeWidth={2} />
                ) : (
                    <ChevronDown className="h-3 w-3 text-rose-700" strokeWidth={2} />
                )
            ) : (
                <ChevronsUpDown className="h-3 w-3 text-slate-400" strokeWidth={1.8} />
            )}
        </button>
    );
}

export const AdminAccountRequests = (): JSX.Element => {
    const navigate = useNavigate();
    const sidebarConfig = useAdminSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [loading, setLoading] = useState(true);
    const [fetchingOrders, setFetchingOrders] = useState(false);
    const [filtering, setFiltering] = useState(false);
    const [items, setItems] = useState<AccountRequestListItem[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [filterStatus, setFilterStatus] = useState<number | undefined>(undefined);
    const [filterType, setFilterType] = useState<number | undefined>(undefined);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState<string>("createdAt");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
    const [selected, setSelected] = useState<AccountRequestDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [actionMode, setActionMode] = useState<"" | "approve" | "reject">("");
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState("");
    const [createEmail, setCreateEmail] = useState("");
    const [createName, setCreateName] = useState("");
    const [createPhone, setCreatePhone] = useState("");
    const [rejectReason, setRejectReason] = useState("");
    const pageSize = 15;
    const hasLoadedRef = useRef(false);
    const fetchSequenceRef = useRef(0);
    const fetchStartedAtRef = useRef(0);
    const filterTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

    const isFilteredEmptyState = !loading && !fetchingOrders && !filtering && items.length === 0 && hasLoadedRef.current;
    const { preserveResultsHeight, preservedHeightStyle, resultsRegionRef } = usePreservedResultsHeight(isFilteredEmptyState);

    const fetchList = useCallback(() => {
        const isInitialLoad = !hasLoadedRef.current;
        const fetchSeq = fetchSequenceRef.current + 1;
        fetchSequenceRef.current = fetchSeq;
        setLoading(isInitialLoad);
        setFetchingOrders(!isInitialLoad);
        fetchStartedAtRef.current = Date.now();
        getAccountRequests({ page, pageSize, status: filterStatus, type: filterType, search: search || undefined })
            .then((response) => {
                if (fetchSeq !== fetchSequenceRef.current) return;
                setItems(response.items);
                setTotalCount(response.totalCount);
            })
            .catch(() => {
                if (fetchSeq !== fetchSequenceRef.current) return;
                setItems([]);
                setTotalCount(0);
            })
            .finally(() => {
                const elapsed = Date.now() - fetchStartedAtRef.current;
                const finish = () => {
                    if (fetchSeq !== fetchSequenceRef.current) return;
                    hasLoadedRef.current = true;
                    setLoading(false);
                    setFetchingOrders(false);
                };
                if (!isInitialLoad && elapsed < MIN_PAGE_FETCH_FEEDBACK_MS) {
                    window.setTimeout(finish, MIN_PAGE_FETCH_FEEDBACK_MS - elapsed);
                    return;
                }
                finish();
            });
    }, [page, filterStatus, filterType, search]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    useEffect(() => {
        return () => { if (filterTimerRef.current) window.clearTimeout(filterTimerRef.current); };
    }, []);

    const scheduleSearchCommit = useCallback(
        (nextSearch: string) => {
            preserveResultsHeight();
            setFiltering(true);
            if (filterTimerRef.current) window.clearTimeout(filterTimerRef.current);
            filterTimerRef.current = window.setTimeout(() => {
                setSearch(nextSearch);
                setPage(1);
                setFiltering(false);
                filterTimerRef.current = null;
            }, MIN_FILTER_COMMIT_MS);
        },
        [preserveResultsHeight],
    );

    const closeModal = () => {
        setSelected(null);
        setActionMode("");
        setActionError("");
        setCreateEmail("");
        setCreateName("");
        setCreatePhone("");
        setRejectReason("");
    };

    const handleViewDetail = async (id: string) => {
        setDetailLoading(true);
        setActionMode("");
        setActionError("");
        try {
            setSelected(await getAccountRequestDetail(id));
        } finally {
            setDetailLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!selected) return;
        if (!createEmail.trim() || !createName.trim()) {
            setActionError("Vui lòng nhập email và họ tên.");
            return;
        }

        setActionLoading(true);
        setActionError("");
        try {
            await createAccountForRequest(selected.id, {
                email: createEmail.trim(),
                fullName: createName.trim(),
                phone: createPhone.trim() || undefined,
            });
            closeModal();
            await fetchList();
        } catch (error: any) {
            setActionError(error?.message || "Tạo tài khoản thất bại.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!selected) return;
        if (!rejectReason.trim()) {
            setActionError("Vui lòng nhập lý do từ chối.");
            return;
        }

        setActionLoading(true);
        setActionError("");
        try {
            await rejectAccountRequest(selected.id, rejectReason.trim());
            closeModal();
            await fetchList();
        } catch (error: any) {
            setActionError(error?.message || "Từ chối thất bại.");
        } finally {
            setActionLoading(false);
        }
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

    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const pendingCount = useMemo(() => items.filter((item) => item.status === "Pending").length, [items]);
    const schoolCount = useMemo(() => items.filter((item) => item.type === "School").length, [items]);
    const providerCount = useMemo(() => items.filter((item) => item.type === "Provider").length, [items]);
    const sortedItems = useMemo(() => {
        const rows = [...items];
        rows.sort((leftRow, rightRow) => {
            const left = (leftRow as Record<string, unknown>)[sortKey] ?? "";
            const right = (rightRow as Record<string, unknown>)[sortKey] ?? "";
            const compare = String(left).localeCompare(String(right), "vi");
            return sortDir === "asc" ? compare : -compare;
        });
        return rows;
    }, [items, sortKey, sortDir]);
    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDir((current) => (current === "asc" ? "desc" : "asc"));
            return;
        }
        setSortKey(key);
        setSortDir("asc");
    };
    const columns = [
        { key: "organizationName", label: "Tổ chức" },
        { key: "contactEmail", label: "Email" },
        { key: "contactPhone", label: "SĐT" },
        { key: "type", label: "Loại" },
        { key: "status", label: "Trạng thái" },
        { key: "createdAt", label: "Ngày gửi" },
    ];
    const gridCols = "1.75fr 2fr 1fr 1fr 1fr 1fr 0.8fr";

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                    <TopNavBar>
                        <AdminTopNavTitle title="Yêu cầu cấp tài khoản" />
                    </TopNavBar>

                    <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-6 space-y-5 nb-fade-in">
                        <section className="grid gap-4 md:grid-cols-3">
                            <AdminSummaryCard
                                label="Tổng yêu cầu"
                                value={loading ? "…" : totalCount.toLocaleString("vi-VN")}
                                accent={ADMIN_TONE.sky}
                            />
                            <AdminSummaryCard
                                label="Từ trường học"
                                value={loading ? "…" : schoolCount.toLocaleString("vi-VN")}
                                accent={ADMIN_TONE.violet}
                            />
                            <AdminSummaryCard
                                label="Từ nhà cung cấp"
                                value={loading ? "…" : providerCount.toLocaleString("vi-VN")}
                                accent={ADMIN_TONE.amber}
                            />
                        </section>

                        <section className="overflow-hidden rounded-[8px] border shadow-soft-sm" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}>
                            <div className="flex flex-col gap-3 border-b px-5 py-4 lg:flex-row lg:items-center lg:justify-between" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.soft }}>
                            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                                <label className="relative block w-full sm:max-w-[280px]">
                                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                    <input
                                        value={searchInput}
                                        onChange={(event) => {
                                            const val = event.target.value;
                                            setSearchInput(val);
                                            scheduleSearchCommit(val);
                                        }}
                                        placeholder="Tìm theo tên tổ chức, email..."
                                        className="h-10 w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-800 outline-none shadow-soft-xs transition-colors placeholder:text-slate-500 focus:border-rose-200 focus:ring-4 focus:ring-rose-50"
                                    />
                                </label>

                                <label className="relative block">
                                    <select
                                        value={filterStatus ?? ""}
                                        onChange={(event) => {
                                            preserveResultsHeight();
                                            setFilterStatus(event.target.value ? Number(event.target.value) : undefined);
                                            setPage(1);
                                        }}
                                        className="h-10 min-w-[160px] appearance-none rounded-full border border-slate-200 bg-white py-0 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none shadow-soft-xs transition-colors focus:border-rose-200 focus:ring-4 focus:ring-rose-50"
                                    >
                                        <option value="">Tất cả trạng thái</option>
                                        <option value="1">Chờ xử lý</option>
                                        <option value="2">Đã duyệt</option>
                                        <option value="3">Đã từ chối</option>
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-900" />
                                </label>

                                <label className="relative block">
                                    <select
                                        value={filterType ?? ""}
                                        onChange={(event) => {
                                            preserveResultsHeight();
                                            setFilterType(event.target.value ? Number(event.target.value) : undefined);
                                            setPage(1);
                                        }}
                                        className="h-10 min-w-[148px] appearance-none rounded-full border border-slate-200 bg-white py-0 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none shadow-soft-xs transition-colors focus:border-rose-200 focus:ring-4 focus:ring-rose-50"
                                    >
                                        <option value="">Tất cả loại</option>
                                        <option value="1">Trường học</option>
                                        <option value="2">Nhà cung cấp</option>
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-900" />
                                </label>

                            </div>

                            <div className="flex items-center gap-3 self-start lg:self-auto">
                                {(fetchingOrders || filtering) && (
                                    <div className="inline-flex h-9 items-center gap-2 rounded-full border border-rose-100 bg-white px-3 text-xs font-bold text-rose-700 shadow-soft-sm">
                                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-rose-100 border-t-rose-700" />
                                        Đang tải
                                    </div>
                                )}
                                <span className="inline-flex h-9 items-center rounded-full border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 shadow-soft-xs">
                                    Tổng: {totalCount.toLocaleString("vi-VN")}
                                </span>
                            </div>
                        </div>

                        <div>
                            <div
                                className="sticky top-0 z-10 hidden lg:grid items-center border-b px-5 py-3"
                                style={{ gridTemplateColumns: gridCols, borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}
                            >
                                {columns.map((column) => (
                                    <SortButton
                                        key={column.key}
                                        active={sortKey === column.key}
                                        direction={sortDir}
                                        onClick={() => handleSort(column.key)}
                                    >
                                        {column.label}
                                    </SortButton>
                                ))}
                                <div className="text-right text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: ADMIN_TONE.muted }}>
                                    Hành động
                                </div>
                            </div>

                            <div ref={resultsRegionRef} style={preservedHeightStyle}>
                            {loading && (
                                <div className="space-y-3 px-5 py-5">
                                    {Array.from({ length: 5 }).map((_, index) => (
                                        <div
                                            key={index}
                                            className="hidden lg:grid items-center gap-4 rounded-[8px] border px-4 py-3"
                                            style={{ gridTemplateColumns: gridCols, borderColor: ADMIN_TONE.line, background: ADMIN_TONE.soft }}
                                        >
                                            {Array.from({ length: 7 }).map((__, cellIndex) => (
                                                <div
                                                    key={cellIndex}
                                                    className="h-5 rounded animate-pulse bg-rose-50"
                                                />
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!loading && items.length === 0 && (
                                <AdminEmptyState
                                    title="Chưa có yêu cầu nào"
                                    detail="Không tìm thấy yêu cầu cấp tài khoản phù hợp bộ lọc hiện tại."
                                    icon="📭"
                                    bg={ADMIN_TONE.amberSoft}
                                />
                            )}

                            {!loading && items.length > 0 && (
                                <div>
                                    {sortedItems.map((item, index) => (
                                        <div
                                            key={item.id}
                                            className="hidden min-h-[58px] lg:grid items-center gap-4 border-b px-5 py-3 transition-colors hover:bg-rose-50 nb-fade-in"
                                            style={{ gridTemplateColumns: gridCols, borderColor: ADMIN_TONE.line, animationDelay: `${index * 30}ms` }}
                                        >
                                            <div className="truncate text-[14px] font-medium text-gray-900">{item.organizationName}</div>
                                            <div className="truncate text-[14px] font-normal" style={{ color: "#3D384A" }}>
                                                {item.contactEmail}
                                            </div>
                                            <div className="truncate text-[14px] font-normal" style={{ color: "#3D384A" }}>
                                                {item.contactPhone}
                                            </div>
                                            <div>
                                                <CompactBadge bg={typeTone[item.type]?.bg} text={typeTone[item.type]?.text}>
                                                    {typeTone[item.type]?.label || item.type}
                                                </CompactBadge>
                                            </div>
                                            <div>
                                                <CompactBadge bg={statusTone[item.status]?.bg} text={statusTone[item.status]?.text}>
                                                    {statusTone[item.status]?.label || item.status}
                                                </CompactBadge>
                                            </div>
                                            <div className="text-[14px] font-medium" style={{ color: ADMIN_TONE.muted }}>
                                                {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                                            </div>
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={() => handleViewDetail(item.id)}
                                                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-white hover:text-rose-700"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {sortedItems.map((item, index) => (
                                        <div
                                            key={`mobile-${item.id}`}
                                            className="lg:hidden border-b p-4 space-y-3 nb-fade-in"
                                            style={{ borderColor: ADMIN_TONE.line, animationDelay: `${index * 30}ms` }}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="text-[15px] font-medium text-gray-900">{item.organizationName}</div>
                                                    <div className="mt-1 text-[13px] font-normal" style={{ color: "#3D384A" }}>
                                                        {item.contactEmail}
                                                    </div>
                                                    <div className="mt-0.5 text-[13px] font-normal" style={{ color: "#3D384A" }}>
                                                        {item.contactPhone}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1.5 items-end">
                                                    <CompactBadge bg={typeTone[item.type]?.bg} text={typeTone[item.type]?.text}>
                                                        {typeTone[item.type]?.label || item.type}
                                                    </CompactBadge>
                                                    <CompactBadge bg={statusTone[item.status]?.bg} text={statusTone[item.status]?.text}>
                                                        {statusTone[item.status]?.label || item.status}
                                                    </CompactBadge>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[12px] font-medium" style={{ color: ADMIN_TONE.muted }}>
                                                    {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                                                </span>
                                                <button
                                                    onClick={() => handleViewDetail(item.id)}
                                                    className="flex h-9 w-9 items-center justify-center rounded-full border text-slate-700 transition-colors hover:text-rose-700"
                                                    style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell, color: ADMIN_TONE.pageInk }}
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <div
                                        className="flex flex-col gap-3 border-t px-5 py-4 md:flex-row md:items-center md:justify-between"
                                        style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.soft }}
                                    >
                                        <div className="text-[13px] font-bold" style={{ color: ADMIN_TONE.muted }}>
                                            Hiển thị {items.length} / {totalCount} yêu cầu · Trang {page}/{totalPages}
                                        </div>
                                        {totalPages > 1 && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    disabled={page <= 1}
                                                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                                                    className="flex h-9 w-9 items-center justify-center rounded-full border transition-all disabled:opacity-40 hover:scale-[0.99]"
                                                    style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell, color: ADMIN_TONE.pageInk }}
                                                    title="Trang trước"
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </button>
                                                <span className="flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-[13px] font-bold" style={{ background: ADMIN_TONE.emeraldSoft, color: ADMIN_TONE.emerald }}>
                                                    {page}
                                                </span>
                                                <button
                                                    disabled={page >= totalPages}
                                                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                                                    className="flex h-9 w-9 items-center justify-center rounded-full border transition-all disabled:opacity-40 hover:scale-[0.99]"
                                                    style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell, color: ADMIN_TONE.pageInk }}
                                                    title="Trang sau"
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            </div>
                        </div>
                        </section>
                    </main>
                </div>
            </div>

            {(selected || detailLoading) && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 nb-backdrop-enter"
                    style={{ background: "rgba(25, 24, 43, 0.55)" }}
                    onClick={() => !detailLoading && !actionLoading && closeModal()}
                >
                    <div
                        className="w-full max-w-2xl rounded-2xl border p-6 space-y-5 nb-modal-enter max-h-[90vh] overflow-y-auto shadow-soft-sm"
                        style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}
                        onClick={(event) => event.stopPropagation()}
                    >
                        {detailLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div
                                    className="h-10 w-10 animate-spin rounded-full border-2"
                                    style={{ borderColor: ADMIN_TONE.roseSoft, borderTopColor: ADMIN_TONE.rose }}
                                />
                            </div>
                        ) : (
                            selected && (
                                <>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <h2 className="text-[22px] font-bold leading-tight" style={{ color: ADMIN_TONE.pageInk }}>
                                                Chi tiết yêu cầu
                                            </h2>
                                            <p className="mt-1 truncate text-[14px] font-medium text-slate-500">
                                                {selected.organizationName} · {selected.contactEmail}
                                            </p>
                                        </div>
                                        <button
                                            onClick={closeModal}
                                            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[8px] border text-slate-700 transition-all hover:scale-[0.99] hover:text-rose-700"
                                            style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}
                                            title="Đóng"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 rounded-[8px] border px-4 py-3" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.soft }}>
                                        <CompactBadge bg={typeTone[selected.type]?.bg} text={typeTone[selected.type]?.text}>
                                            {typeTone[selected.type]?.label || selected.type}
                                        </CompactBadge>
                                        <CompactBadge bg={statusTone[selected.status]?.bg} text={statusTone[selected.status]?.text}>
                                            {statusTone[selected.status]?.label || selected.status}
                                        </CompactBadge>
                                        <span className="text-[13px] font-medium text-slate-600">
                                            Ngày gửi: {new Date(selected.createdAt).toLocaleDateString("vi-VN")}
                                        </span>
                                        {selected.processedAt && (
                                            <span className="text-[13px] font-medium text-slate-600">
                                                Ngày xử lý: {new Date(selected.processedAt).toLocaleString("vi-VN")}
                                            </span>
                                        )}
                                    </div>

                                    <section className="rounded-[8px] border" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}>
                                        <div className="border-b px-4 py-3" style={{ borderColor: ADMIN_TONE.line }}>
                                            <h3 className="text-[13px] font-bold uppercase tracking-[0.08em]" style={{ color: ADMIN_TONE.muted }}>
                                                Thông tin yêu cầu
                                            </h3>
                                        </div>
                                        <div className="divide-y divide-slate-200">
                                            {[
                                                { label: "Tổ chức", value: selected.organizationName },
                                                { label: "Loại", badge: true, bg: typeTone[selected.type]?.bg, text: typeTone[selected.type]?.text, badgeValue: typeTone[selected.type]?.label || selected.type },
                                                { label: "Người liên hệ", value: selected.contactPersonName || "—" },
                                                { label: "Email", value: selected.contactEmail },
                                                { label: "SĐT", value: selected.contactPhone || "—" },
                                                { label: "Trạng thái", badge: true, bg: statusTone[selected.status]?.bg, text: statusTone[selected.status]?.text, badgeValue: statusTone[selected.status]?.label || selected.status },
                                                ...(selected.address ? [{ label: "Địa chỉ", value: selected.address }] : []),
                                                ...(selected.description ? [{ label: "Mô tả", value: selected.description }] : []),
                                                ...(selected.rejectionReason ? [{ label: "Lý do từ chối", value: selected.rejectionReason }] : []),
                                                ...(selected.processedByName ? [{ label: "Xử lý bởi", value: selected.processedByName }] : []),
                                            ].map((item, index) => (
                                                <div key={index} className="grid gap-2 px-4 py-3 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-center">
                                                    <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: ADMIN_TONE.muted }}>
                                                        {item.label}
                                                    </p>
                                                    {item.badge ? (
                                                        <div className="flex items-center">
                                                            <CompactBadge bg={item.bg} text={item.text}>
                                                                {item.badgeValue}
                                                            </CompactBadge>
                                                        </div>
                                                    ) : (
                                                        <p className="text-[15px] font-medium leading-relaxed" style={{ color: ADMIN_TONE.pageInk }}>
                                                            {item.value}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    {selected.status === "Pending" && !actionMode && (
                                        <div className="flex flex-wrap justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setActionMode("approve");
                                                    setCreateEmail(selected.contactEmail);
                                                    setCreateName(selected.organizationName);
                                                    setCreatePhone(selected.contactPhone || "");
                                                }}
                                                className="h-9 rounded-[8px] border px-4 text-[13px] font-bold text-white transition-all hover:scale-[0.99]"
                                                style={{ borderColor: ADMIN_TONE.emerald, background: ADMIN_TONE.emerald }}
                                            >
                                                Tạo tài khoản
                                            </button>
                                            <button
                                                onClick={() => setActionMode("reject")}
                                                className="h-9 rounded-[8px] border px-4 text-[13px] font-bold text-white transition-all hover:scale-[0.99]"
                                                style={{ borderColor: ADMIN_TONE.rose, background: ADMIN_TONE.rose }}
                                            >
                                                Từ chối yêu cầu
                                            </button>
                                        </div>
                                    )}

                                    {actionMode === "approve" && (
                                        <div className="rounded-[8px] border p-5 space-y-3" style={{ borderColor: ADMIN_TONE.emerald, background: ADMIN_TONE.emeraldSoft }}>
                                            <h3 className="text-[15px] font-bold" style={{ color: "#065F46" }}>
                                                Tạo tài khoản từ hồ sơ này
                                            </h3>
                                            <div className="grid gap-3 md:grid-cols-2">
                                                <input
                                                    value={createEmail}
                                                    onChange={(event) => setCreateEmail(event.target.value)}
                                                    placeholder="Email đăng nhập *"
                                                    className="rounded-[8px] border px-4 py-3 text-[14px] font-semibold outline-none"
                                                    style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}
                                                />
                                                <input
                                                    value={createName}
                                                    onChange={(event) => setCreateName(event.target.value)}
                                                    placeholder="Họ tên đầy đủ *"
                                                    className="rounded-[8px] border px-4 py-3 text-[14px] font-semibold outline-none"
                                                    style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}
                                                />
                                            </div>
                                            <input
                                                value={createPhone}
                                                onChange={(event) => setCreatePhone(event.target.value)}
                                                placeholder="Số điện thoại (tùy chọn)"
                                                className="w-full rounded-[8px] border px-4 py-3 text-[14px] font-semibold outline-none"
                                                style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}
                                            />
                                            {actionError && (
                                                <p className="text-[13px] font-bold" style={{ color: "#B23148" }}>
                                                    {actionError}
                                                </p>
                                            )}
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={handleApprove}
                                                    disabled={actionLoading}
                                                    className="flex-1 rounded-[8px] border py-3 text-[14px] font-bold text-white transition-all disabled:opacity-50 hover:scale-[0.99]"
                                                    style={{ borderColor: ADMIN_TONE.emerald, background: ADMIN_TONE.emerald }}
                                                >
                                                    {actionLoading ? "Đang tạo..." : "Xác nhận tạo"}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setActionMode("");
                                                        setActionError("");
                                                    }}
                                                    className="rounded-[8px] border px-5 py-3 text-[14px] font-bold transition-all hover:scale-[0.99]"
                                                    style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell, color: ADMIN_TONE.pageInk }}
                                                >
                                                    Hủy
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {actionMode === "reject" && (
                                        <div className="rounded-[8px] border p-5 space-y-3" style={{ borderColor: ADMIN_TONE.rose, background: ADMIN_TONE.roseSoft }}>
                                            <h3 className="text-[15px] font-bold" style={{ color: "#9F1D34" }}>
                                                Từ chối hồ sơ này
                                            </h3>
                                            <textarea
                                                value={rejectReason}
                                                onChange={(event) => setRejectReason(event.target.value)}
                                                placeholder="Lý do từ chối *"
                                                rows={3}
                                                className="w-full resize-none rounded-[8px] border px-4 py-3 text-[14px] font-semibold outline-none"
                                                style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}
                                            />
                                            {actionError && (
                                                <p className="text-[13px] font-bold" style={{ color: "#B23148" }}>
                                                    {actionError}
                                                </p>
                                            )}
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={handleReject}
                                                    disabled={actionLoading}
                                                    className="flex-1 rounded-[8px] border py-3 text-[14px] font-bold text-white transition-all disabled:opacity-50 hover:scale-[0.99]"
                                                    style={{ borderColor: ADMIN_TONE.rose, background: ADMIN_TONE.rose }}
                                                >
                                                    {actionLoading ? "Đang xử lý..." : "Xác nhận từ chối"}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setActionMode("");
                                                        setActionError("");
                                                    }}
                                                    className="rounded-[8px] border px-5 py-3 text-[14px] font-bold transition-all hover:scale-[0.99]"
                                                    style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell, color: ADMIN_TONE.pageInk }}
                                                >
                                                    Hủy
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                </>
                            )
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAccountRequests;
