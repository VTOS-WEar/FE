import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsUpDown, Search } from "lucide-react";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useAdminSidebarConfig } from "../../hooks/useAdminSidebarConfig";
import { usePreservedResultsHeight } from "../../hooks/usePreservedResultsHeight";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { getAdminTransactions, type AdminTransactionDto, type AdminTransactionListResult } from "../../lib/api/admin";
import { ADMIN_TONE, AdminEmptyState, AdminSummaryCard, AdminTopNavTitle } from "../AdminShared/adminWorkspace";

const MIN_PAGE_FETCH_FEEDBACK_MS = 700;
const MIN_FILTER_COMMIT_MS = 450;
const typeTone: Record<string, { bg: string; text: string; label: string }> = {
    OrderPayment: { bg: ADMIN_TONE.emeraldSoft, text: "#0C7A5D", label: "Thanh toán" },
    ProviderPayment: { bg: ADMIN_TONE.skySoft, text: "#1D63BE", label: "Chi NCC" },
    Refund: { bg: ADMIN_TONE.amberSoft, text: "#9A6506", label: "Hoàn tiền" },
};

const statusTone: Record<string, { bg: string; text: string; label: string }> = {
    Completed: { bg: ADMIN_TONE.emeraldSoft, text: "#0C7A5D", label: "Hoàn thành" },
    Pending: { bg: ADMIN_TONE.amberSoft, text: "#9A6506", label: "Chờ xử lý" },
    Processing: { bg: ADMIN_TONE.skySoft, text: "#1D63BE", label: "Đang xử lý" },
    Failed: { bg: ADMIN_TONE.roseSoft, text: "#B23148", label: "Thất bại" },
    Cancelled: { bg: "#F1F3F8", text: "#667085", label: "Đã hủy" },
    Refunded: { bg: ADMIN_TONE.violetSoft, text: "#4B39C8", label: "Đã hoàn tiền" },
};

function formatCurrency(value: number) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

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

export default function AdminTransactions() {
    const navigate = useNavigate();
    const sidebarConfig = useAdminSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [data, setData] = useState<AdminTransactionListResult | null>(null);
    const [page, setPage] = useState(1);
    const [filterType, setFilterType] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState<string>("createdAt");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
    const [loading, setLoading] = useState(true);
    const [fetchingOrders, setFetchingOrders] = useState(false);
    const [filtering, setFiltering] = useState(false);
    const hasLoadedRef = useRef(false);
    const fetchSequenceRef = useRef(0);
    const fetchStartedAtRef = useRef(0);
    const filterTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

    const isFilteredEmptyState = !loading && !fetchingOrders && !filtering && (!data || data.items.length === 0) && hasLoadedRef.current;
    const { preserveResultsHeight, preservedHeightStyle, resultsRegionRef } = usePreservedResultsHeight(isFilteredEmptyState);

    const fetchData = useCallback(() => {
        const isInitialLoad = !hasLoadedRef.current;
        const fetchSeq = fetchSequenceRef.current + 1;
        fetchSequenceRef.current = fetchSeq;
        setLoading(isInitialLoad);
        setFetchingOrders(!isInitialLoad);
        fetchStartedAtRef.current = Date.now();
        getAdminTransactions({ page, pageSize: 15, type: filterType || undefined, status: filterStatus || undefined, search: search || undefined })
            .then((result) => {
                if (fetchSeq !== fetchSequenceRef.current) return;
                setData(result);
            })
            .catch(() => {
                if (fetchSeq !== fetchSequenceRef.current) return;
                setData(null);
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
    }, [page, filterType, filterStatus, search]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;
    const watchCount = useMemo(
        () => (data?.items ?? []).filter((item) => item.status === "Pending" || item.status === "Processing").length,
        [data],
    );
    const sortedItems = useMemo(() => {
        const rows = [...(data?.items ?? [])];
        rows.sort((leftRow, rightRow) => {
            const left = (leftRow as Record<string, unknown>)[sortKey] ?? "";
            const right = (rightRow as Record<string, unknown>)[sortKey] ?? "";
            const compare = sortKey === "amount"
                ? Number(left) - Number(right)
                : String(left).localeCompare(String(right), "vi");
            return sortDir === "asc" ? compare : -compare;
        });
        return rows;
    }, [data, sortKey, sortDir]);
    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDir((current) => (current === "asc" ? "desc" : "asc"));
            return;
        }
        setSortKey(key);
        setSortDir("asc");
    };
    const columns = [
        { key: "id", label: "Mã GD" },
        { key: "createdAt", label: "Thời gian" },
        { key: "transactionType", label: "Loại" },
        { key: "amount", label: "Số tiền" },
        { key: "orderCode", label: "Đơn hàng" },
        { key: "walletOwner", label: "Ví" },
        { key: "status", label: "Trạng thái" },
    ];
    const gridCols = "1fr 1.5fr 1.15fr 1.2fr 1fr 1fr 1.1fr";

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                    <TopNavBar>
                        <AdminTopNavTitle title="Giao dịch" />
                    </TopNavBar>

                    <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-6 space-y-5 nb-fade-in">
                        <section className="grid gap-4 md:grid-cols-3">
                            <AdminSummaryCard
                                label="Tổng giao dịch"
                                value={loading ? "…" : (data?.totalCount ?? 0).toLocaleString("vi-VN")}
                                accent={ADMIN_TONE.sky}
                            />
                            <AdminSummaryCard
                                label="Tổng giá trị"
                                value={loading ? "…" : formatCurrency(data?.totalAmountAll ?? 0)}
                                accent={ADMIN_TONE.emerald}
                            />
                            <AdminSummaryCard
                                label="Hôm nay"
                                value={loading ? "…" : (data?.todayCount ?? 0).toLocaleString("vi-VN")}
                                accent={ADMIN_TONE.violet}
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
                                        placeholder="Tìm theo mô tả, ví, tổ chức..."
                                        className="h-10 w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-800 outline-none shadow-soft-xs transition-colors placeholder:text-slate-500 focus:border-rose-200 focus:ring-4 focus:ring-rose-50"
                                    />
                                </label>

                                <label className="relative block">
                                    <select
                                        value={filterType}
                                        onChange={(event) => {
                                            preserveResultsHeight();
                                            setFilterType(event.target.value);
                                            setPage(1);
                                        }}
                                        className="h-10 min-w-[148px] appearance-none rounded-full border border-slate-200 bg-white py-0 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none shadow-soft-xs transition-colors focus:border-rose-200 focus:ring-4 focus:ring-rose-50"
                                    >
                                        <option value="">Tất cả loại</option>
                                        <option value="OrderPayment">Thanh toán</option>
                                        <option value="ProviderPayment">Chi nhà cung cấp</option>
                                        <option value="Refund">Hoàn tiền</option>
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-900" />
                                </label>

                                <label className="relative block">
                                    <select
                                        value={filterStatus}
                                        onChange={(event) => {
                                            preserveResultsHeight();
                                            setFilterStatus(event.target.value);
                                            setPage(1);
                                        }}
                                        className="h-10 min-w-[160px] appearance-none rounded-full border border-slate-200 bg-white py-0 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none shadow-soft-xs transition-colors focus:border-rose-200 focus:ring-4 focus:ring-rose-50"
                                    >
                                        <option value="">Tất cả trạng thái</option>
                                        <option value="Completed">Hoàn thành</option>
                                        <option value="Pending">Chờ xử lý</option>
                                        <option value="Processing">Đang xử lý</option>
                                        <option value="Failed">Thất bại</option>
                                        <option value="Cancelled">Đã hủy</option>
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
                                    Theo dõi: {watchCount.toLocaleString("vi-VN")}
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
                                                <div key={cellIndex} className="h-5 rounded animate-pulse bg-rose-50" />
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!loading && (!data || data.items.length === 0) && (
                                <AdminEmptyState
                                    title="Không có giao dịch nào"
                                    detail="Thử thay đổi bộ lọc loại hoặc trạng thái để xem dữ liệu tài chính khác."
                                    icon="📭"
                                    bg={ADMIN_TONE.amberSoft}
                                />
                            )}

                            {!loading && data && data.items.length > 0 && (
                                <div>
                                    {sortedItems.map((item: AdminTransactionDto, index) => (
                                        <div
                                            key={item.id}
                                            className="hidden min-h-[58px] lg:grid items-center gap-4 border-b px-5 py-3 transition-colors hover:bg-rose-50 nb-fade-in"
                                            style={{ gridTemplateColumns: gridCols, borderColor: ADMIN_TONE.line, animationDelay: `${index * 30}ms` }}
                                        >
                                            <div className="font-mono text-[13px] font-medium" style={{ color: ADMIN_TONE.muted }}>
                                                {item.id.substring(0, 8).toUpperCase()}
                                            </div>
                                            <div className="text-[14px] font-normal" style={{ color: "#3D384A" }}>
                                                {new Date(item.createdAt).toLocaleString("vi-VN")}
                                            </div>
                                            <div>
                                                <CompactBadge bg={typeTone[item.transactionType]?.bg} text={typeTone[item.transactionType]?.text}>
                                                    {typeTone[item.transactionType]?.label || item.transactionType}
                                                </CompactBadge>
                                            </div>
                                            <div className="text-[14px] font-medium text-gray-900">{formatCurrency(item.amount)}</div>
                                            <div className="font-mono text-[13px] font-medium" style={{ color: ADMIN_TONE.rose }}>
                                                {item.orderCode ?? "—"}
                                            </div>
                                            <div className="truncate text-[14px] font-normal" style={{ color: "#3D384A" }}>
                                                {item.walletOwner ?? "—"}
                                            </div>
                                            <div>
                                                <CompactBadge bg={statusTone[item.status]?.bg} text={statusTone[item.status]?.text}>
                                                    {statusTone[item.status]?.label || item.status}
                                                </CompactBadge>
                                            </div>
                                        </div>
                                    ))}

                                    {sortedItems.map((item: AdminTransactionDto, index) => (
                                        <div
                                            key={`mobile-${item.id}`}
                                            className="lg:hidden border-b p-4 space-y-2 nb-fade-in"
                                            style={{ borderColor: ADMIN_TONE.line, animationDelay: `${index * 30}ms` }}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="text-[15px] font-medium text-gray-900">{formatCurrency(item.amount)}</div>
                                                <CompactBadge bg={statusTone[item.status]?.bg} text={statusTone[item.status]?.text}>
                                                    {statusTone[item.status]?.label || item.status}
                                                </CompactBadge>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <CompactBadge bg={typeTone[item.transactionType]?.bg} text={typeTone[item.transactionType]?.text}>
                                                    {typeTone[item.transactionType]?.label || item.transactionType}
                                                </CompactBadge>
                                                <span className="font-mono text-[12px] font-medium" style={{ color: ADMIN_TONE.muted }}>
                                                    {item.id.substring(0, 8).toUpperCase()}
                                                </span>
                                                {item.orderCode && (
                                                    <span className="font-mono text-[12px] font-medium" style={{ color: ADMIN_TONE.rose }}>
                                                        #{item.orderCode}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[13px] font-medium" style={{ color: ADMIN_TONE.muted }}>
                                                {(item.walletOwner ?? "—") + " · " + new Date(item.createdAt).toLocaleString("vi-VN")}
                                            </div>
                                        </div>
                                    ))}

                                    <div
                                        className="flex flex-col gap-3 border-t px-5 py-4 md:flex-row md:items-center md:justify-between"
                                        style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.soft }}
                                    >
                                        <div className="text-[13px] font-bold" style={{ color: ADMIN_TONE.muted }}>
                                            Trang {page}/{totalPages} · {data.totalCount} giao dịch
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
        </div>
    );
}
