import { useCallback, useMemo, useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsUpDown, Search } from "lucide-react";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useAdminSidebarConfig } from "../../hooks/useAdminSidebarConfig";
import { usePreservedResultsHeight } from "../../hooks/usePreservedResultsHeight";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { approveWithdrawal, getWithdrawalRequests, rejectWithdrawal, type WithdrawalRequestDto } from "../../lib/api/admin";
import { ADMIN_TONE, AdminEmptyState, AdminSummaryCard, AdminTopNavTitle } from "../AdminShared/adminWorkspace";

const MIN_PAGE_FETCH_FEEDBACK_MS = 700;
const MIN_FILTER_COMMIT_MS = 450;
const statusTone: Record<string, { bg: string; text: string; label: string }> = {
    Pending: { bg: ADMIN_TONE.amberSoft, text: "#9A6506", label: "Chờ duyệt" },
    Approved: { bg: ADMIN_TONE.emeraldSoft, text: "#0C7A5D", label: "Đã duyệt" },
    Rejected: { bg: ADMIN_TONE.roseSoft, text: "#B23148", label: "Từ chối" },
};

function formatCurrency(value: number) {
    return `${value.toLocaleString("vi-VN")} ₫`;
}

function formatDate(value: string) {
    return new Date(value).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
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

export function AdminWithdrawals() {
    const navigate = useNavigate();
    const sidebarConfig = useAdminSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [items, setItems] = useState<WithdrawalRequestDto[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [filter, setFilter] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState<string>("requestedAt");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
    const [loading, setLoading] = useState(true);
    const [fetchingOrders, setFetchingOrders] = useState(false);
    const [filtering, setFiltering] = useState(false);
    const [actionItem, setActionItem] = useState<WithdrawalRequestDto | null>(null);
    const [actionType, setActionType] = useState<"approve" | "reject">("approve");
    const [adminNote, setAdminNote] = useState("");
    const [processing, setProcessing] = useState(false);
    const pageSize = 10;
    const hasLoadedRef = useRef(false);
    const fetchSequenceRef = useRef(0);
    const fetchStartedAtRef = useRef(0);
    const filterTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

    const isFilteredEmptyState = !loading && !fetchingOrders && !filtering && items.length === 0 && hasLoadedRef.current;
    const { preserveResultsHeight, preservedHeightStyle, resultsRegionRef } = usePreservedResultsHeight(isFilteredEmptyState);

    const fetchData = useCallback(() => {
        const isInitialLoad = !hasLoadedRef.current;
        const fetchSeq = fetchSequenceRef.current + 1;
        fetchSequenceRef.current = fetchSeq;
        setLoading(isInitialLoad);
        setFetchingOrders(!isInitialLoad);
        fetchStartedAtRef.current = Date.now();
        getWithdrawalRequests({ page, pageSize, status: filter || undefined, search: search || undefined })
            .then((response) => {
                if (fetchSeq !== fetchSequenceRef.current) return;
                setItems(response.items || []);
                setTotal(response.total || response.totalCount || 0);
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
    }, [page, filter, search]);

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

    const handleAction = async () => {
        if (!actionItem) return;
        setProcessing(true);
        try {
            if (actionType === "approve") await approveWithdrawal(actionItem.withdrawalRequestId, adminNote || undefined);
            else await rejectWithdrawal(actionItem.withdrawalRequestId, adminNote || undefined);
            setActionItem(null);
            setAdminNote("");
            await fetchData();
        } finally {
            setProcessing(false);
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

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const pendingCount = items.filter((item) => item.status === "Pending").length;
    const sortedItems = useMemo(() => {
        const rows = [...items];
        rows.sort((leftRow, rightRow) => {
            const left = (leftRow as Record<string, unknown>)[sortKey] ?? "";
            const right = (rightRow as Record<string, unknown>)[sortKey] ?? "";
            const compare = sortKey === "amount"
                ? Number(left) - Number(right)
                : String(left).localeCompare(String(right), "vi");
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
        { key: "schoolName", label: "Tổ chức" },
        { key: "amount", label: "Số tiền" },
        { key: "bankName", label: "Ngân hàng" },
        { key: "requestedAt", label: "Ngày yêu cầu" },
        { key: "status", label: "Trạng thái" },
    ];
    const gridCols = "2fr 1.3fr 2fr 1.4fr 1.15fr 1.35fr";

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                    <TopNavBar>
                        <AdminTopNavTitle title="Yêu cầu rút tiền" />
                    </TopNavBar>

                    <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-6 space-y-5 nb-fade-in">
                        <section className="grid gap-4 md:grid-cols-3">
                            <AdminSummaryCard
                                label="Tổng yêu cầu"
                                value={loading ? "…" : total.toLocaleString("vi-VN")}
                                accent={ADMIN_TONE.sky}
                            />
                            <AdminSummaryCard
                                label="Cần duyệt ngay"
                                value={loading ? "…" : pendingCount.toLocaleString("vi-VN")}
                                accent={ADMIN_TONE.amber}
                            />
                            <AdminSummaryCard
                                label="Đã xử lý"
                                value={loading ? "…" : (items.filter((item) => item.status !== "Pending").length).toLocaleString("vi-VN")}
                                accent={ADMIN_TONE.emerald}
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
                                        placeholder="Tìm theo tên tổ chức, ngân hàng..."
                                        className="h-10 w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-800 outline-none shadow-soft-xs transition-colors placeholder:text-slate-500 focus:border-rose-200 focus:ring-4 focus:ring-rose-50"
                                    />
                                </label>

                                <label className="relative block">
                                    <select
                                        value={filter}
                                        onChange={(event) => {
                                            preserveResultsHeight();
                                            setFilter(event.target.value);
                                            setPage(1);
                                        }}
                                        className="h-10 min-w-[160px] appearance-none rounded-full border border-slate-200 bg-white py-0 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none shadow-soft-xs transition-colors focus:border-rose-200 focus:ring-4 focus:ring-rose-50"
                                    >
                                        <option value="">Tất cả trạng thái</option>
                                        <option value="Pending">Chờ duyệt</option>
                                        <option value="Approved">Đã duyệt</option>
                                        <option value="Rejected">Từ chối</option>
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
                                    Chờ duyệt: {pendingCount.toLocaleString("vi-VN")}
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
                                            {Array.from({ length: 6 }).map((__, cellIndex) => (
                                                <div key={cellIndex} className="h-5 rounded animate-pulse bg-rose-50" />
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!loading && items.length === 0 && (
                                <AdminEmptyState
                                    title="Chưa có yêu cầu rút tiền nào"
                                    detail="Không tìm thấy yêu cầu rút tiền phù hợp bộ lọc hiện tại."
                                    icon="📭"
                                    bg={ADMIN_TONE.amberSoft}
                                />
                            )}

                            {!loading && items.length > 0 && (
                                <div>
                                    {sortedItems.map((item, index) => (
                                        <div
                                            key={item.withdrawalRequestId}
                                            className="hidden min-h-[58px] lg:grid items-center gap-4 border-b px-5 py-3 transition-colors hover:bg-rose-50 nb-fade-in"
                                            style={{ gridTemplateColumns: gridCols, borderColor: ADMIN_TONE.line, animationDelay: `${index * 30}ms` }}
                                        >
                                            <div className="truncate text-[14px] font-medium text-gray-900">{item.schoolName || "—"}</div>
                                            <div className="text-[14px] font-medium" style={{ color: ADMIN_TONE.rose }}>
                                                {formatCurrency(item.amount)}
                                            </div>
                                            <div>
                                                <div className="truncate text-[14px] font-medium text-gray-900">{item.bankName || "—"}</div>
                                                <div className="truncate text-[12px] font-medium" style={{ color: ADMIN_TONE.muted }}>
                                                    {item.bankAccountNumber || "—"}
                                                </div>
                                            </div>
                                            <div className="text-[14px] font-normal" style={{ color: "#3D384A" }}>
                                                {formatDate(item.requestedAt)}
                                            </div>
                                            <div>
                                                <CompactBadge bg={statusTone[item.status]?.bg} text={statusTone[item.status]?.text}>
                                                    {statusTone[item.status]?.label || item.status}
                                                </CompactBadge>
                                            </div>
                                            <div className="flex justify-end">
                                                {item.status === "Pending" ? (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setActionItem(item);
                                                                setActionType("approve");
                                                            }}
                                                            className="h-8 rounded-[8px] border px-3 text-[12px] font-bold text-white transition-all hover:scale-[0.99]"
                                                            style={{ borderColor: ADMIN_TONE.emerald, background: ADMIN_TONE.emerald }}
                                                        >
                                                            Duyệt
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setActionItem(item);
                                                                setActionType("reject");
                                                            }}
                                                            className="h-8 rounded-[8px] border px-3 text-[12px] font-bold text-white transition-all hover:scale-[0.99]"
                                                            style={{ borderColor: ADMIN_TONE.rose, background: ADMIN_TONE.rose }}
                                                        >
                                                            Từ chối
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[12px] font-medium" style={{ color: ADMIN_TONE.muted }}>
                                                        {item.processedAt ? formatDate(item.processedAt) : "—"}
                                                    </span>
                                                )}
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
                                                    <div className="text-[15px] font-medium text-gray-900">{item.schoolName || "—"}</div>
                                                    <div className="mt-1 text-[15px] font-medium" style={{ color: ADMIN_TONE.rose }}>
                                                        {formatCurrency(item.amount)}
                                                    </div>
                                                </div>
                                                <CompactBadge bg={statusTone[item.status]?.bg} text={statusTone[item.status]?.text}>
                                                    {statusTone[item.status]?.label || item.status}
                                                </CompactBadge>
                                            </div>
                                            <div className="text-[13px] font-medium" style={{ color: ADMIN_TONE.muted }}>
                                                {(item.bankName || "—") + " — " + (item.bankAccountNumber || "—") + " · " + formatDate(item.requestedAt)}
                                            </div>
                                            {item.status === "Pending" && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setActionItem(item);
                                                            setActionType("approve");
                                                        }}
                                                        className="h-9 flex-1 rounded-[8px] border px-3 text-[13px] font-bold text-white transition-all hover:scale-[0.99]"
                                                        style={{ borderColor: ADMIN_TONE.emerald, background: ADMIN_TONE.emerald }}
                                                    >
                                                        Duyệt
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setActionItem(item);
                                                            setActionType("reject");
                                                        }}
                                                        className="h-9 flex-1 rounded-[8px] border px-3 text-[13px] font-bold text-white transition-all hover:scale-[0.99]"
                                                        style={{ borderColor: ADMIN_TONE.rose, background: ADMIN_TONE.rose }}
                                                    >
                                                        Từ chối
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    <div
                                        className="flex flex-col gap-3 border-t px-5 py-4 md:flex-row md:items-center md:justify-between"
                                        style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.soft }}
                                    >
                                        <div className="text-[13px] font-bold" style={{ color: ADMIN_TONE.muted }}>
                                            Trang {page}/{totalPages} · {total} yêu cầu
                                        </div>
                                        {totalPages > 1 && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    disabled={page <= 1}
                                                    onClick={() => setPage((current) => current - 1)}
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
                                                    onClick={() => setPage((current) => current + 1)}
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

            {actionItem && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 nb-backdrop-enter"
                    style={{ background: "rgba(25, 24, 43, 0.55)" }}
                    onClick={() => {
                        setActionItem(null);
                        setAdminNote("");
                    }}
                >
                    <div
                        className="w-full max-w-md rounded-2xl border p-6 space-y-5 nb-modal-enter shadow-soft-sm"
                        style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-[22px] font-bold text-gray-900">
                                {actionType === "approve" ? "Duyệt yêu cầu rút tiền" : "Từ chối yêu cầu rút tiền"}
                            </h3>
                            <button
                                onClick={() => {
                                    setActionItem(null);
                                    setAdminNote("");
                                }}
                                className="flex h-10 w-10 items-center justify-center rounded-[8px] border text-[16px] font-semibold transition-all hover:scale-[0.99]"
                                style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}
                            >
                                ×
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: "Tổ chức", value: actionItem.schoolName || "—" },
                                { label: "Số tiền", value: formatCurrency(actionItem.amount), color: ADMIN_TONE.rose },
                                { label: "Ngân hàng", value: `${actionItem.bankName || "—"} — ${actionItem.bankAccountNumber || "—"}`, span: true },
                            ].map((item, index) => (
                                <div key={index} className={item.span ? "col-span-2" : ""}>
                                    <p className="mb-1 text-[12px] font-semibold uppercase tracking-wide" style={{ color: ADMIN_TONE.muted }}>
                                        {item.label}
                                    </p>
                                    <p className="text-[15px] font-medium" style={{ color: item.color || ADMIN_TONE.pageInk }}>
                                        {item.value}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div>
                            <label className="mb-2 block text-[12px] font-semibold uppercase tracking-wide" style={{ color: ADMIN_TONE.muted }}>
                                Ghi chú (tùy chọn)
                            </label>
                            <textarea
                                value={adminNote}
                                onChange={(event) => setAdminNote(event.target.value)}
                                placeholder="Nhập ghi chú..."
                                className="h-20 w-full resize-none rounded-[8px] border px-4 py-3 text-[14px] font-medium outline-none"
                                style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setActionItem(null);
                                    setAdminNote("");
                                }}
                                className="flex-1 rounded-[8px] border py-3 text-[15px] font-semibold transition-all hover:scale-[0.99]"
                                style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell, color: ADMIN_TONE.pageInk }}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleAction}
                                disabled={processing}
                                className="flex-1 rounded-[8px] border py-3 text-[15px] font-semibold text-white transition-all disabled:opacity-50 hover:scale-[0.99]"
                                style={{
                                    borderColor: actionType === "approve" ? ADMIN_TONE.emerald : ADMIN_TONE.rose,
                                    background: actionType === "approve" ? ADMIN_TONE.emerald : ADMIN_TONE.rose,
                                }}
                            >
                                {processing ? "Đang xử lý..." : actionType === "approve" ? "Xác nhận duyệt" : "Xác nhận từ chối"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
