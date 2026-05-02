import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsUpDown, Headset, Search } from "lucide-react";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useAdminSidebarConfig } from "../../hooks/useAdminSidebarConfig";
import { usePreservedResultsHeight } from "../../hooks/usePreservedResultsHeight";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { adminInterveneComplaint, getAdminComplaints, type AdminComplaintDto, type AdminComplaintListResult } from "../../lib/api/admin";
import { ADMIN_TONE, AdminEmptyState, AdminSummaryCard, AdminTopNavTitle } from "../AdminShared/adminWorkspace";

const MIN_PAGE_FETCH_FEEDBACK_MS = 700;
const MIN_FILTER_COMMIT_MS = 450;

const statusTone: Record<string, { bg: string; text: string; label: string }> = {
    Open: { bg: ADMIN_TONE.roseSoft, text: "#B23148", label: "Đang mở" },
    InProgress: { bg: ADMIN_TONE.amberSoft, text: "#9A6506", label: "Đang xử lý" },
    Resolved: { bg: ADMIN_TONE.emeraldSoft, text: "#0C7A5D", label: "Đã giải quyết" },
    Closed: { bg: "#F1F3F8", text: "#667085", label: "Đã đóng" },
};

const roleLabels: Record<string, string> = {
    Parent: "Phụ huynh",
    Provider: "Nhà cung cấp",
    School: "Trường",
    HomeroomTeacher: "Giáo viên chủ nhiệm",
    Admin: "Admin",
};

const categoryLabels: Record<string, string> = {
    General: "Chung",
    Account: "Tài khoản",
    Order: "Đơn hàng",
    Payment: "Thanh toán / ví",
    Contract: "Hợp đồng",
    Data: "Dữ liệu",
    Technical: "Kỹ thuật",
};

function roleLabel(value?: string | null) {
    if (!value) return "Chưa rõ";
    return roleLabels[value] ?? value;
}

function categoryLabel(value?: string | null) {
    if (!value) return "Chung";
    return categoryLabels[value] ?? value;
}

function statusLabel(value?: string | null) {
    if (!value) return "Chưa rõ";
    return statusTone[value]?.label ?? value;
}

function senderName(item: AdminComplaintDto) {
    return item.requesterName || "Chưa rõ người gửi";
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

function DetailPill({
    label,
    value,
    accent,
}: {
    label: string;
    value: string;
    accent: string;
}) {
    return (
        <div className="rounded-[8px] border px-4 py-3" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.soft }}>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: ADMIN_TONE.muted }}>
                {label}
            </p>
            <p className="mt-2 break-words text-[16px] font-bold leading-snug" style={{ color: accent }}>
                {value}
            </p>
        </div>
    );
}

export default function AdminComplaints() {
    const navigate = useNavigate();
    const sidebarConfig = useAdminSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [data, setData] = useState<AdminComplaintListResult | null>(null);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState<string>("createdAt");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
    const [loading, setLoading] = useState(true);
    const [fetchingOrders, setFetchingOrders] = useState(false);
    const [filtering, setFiltering] = useState(false);
    const [selected, setSelected] = useState<AdminComplaintDto | null>(null);
    const [note, setNote] = useState("");
    const [action, setAction] = useState("");
    const [submitting, setSubmitting] = useState(false);
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
        getAdminComplaints({ page, pageSize: 15, status: statusFilter || undefined, search: search || undefined })
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
    }, [page, statusFilter, search]);

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

    const handleIntervene = async () => {
        if (!selected || !note.trim()) return;
        setSubmitting(true);
        try {
            await adminInterveneComplaint(selected.id, note, action || undefined);
            setSelected(null);
            setNote("");
            setAction("");
            await fetchData();
        } finally {
            setSubmitting(false);
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

    const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;
    const sortedItems = useMemo(() => {
        const rows = [...(data?.items ?? [])];
        rows.sort((leftRow, rightRow) => {
            const left = (leftRow as Record<string, unknown>)[sortKey] ?? "";
            const right = (rightRow as Record<string, unknown>)[sortKey] ?? "";
            const compare = String(left).localeCompare(String(right), "vi");
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
        { key: "title", label: "Tiêu đề" },
        { key: "requesterName", label: "Người gửi" },
        { key: "requesterRole", label: "Vai trò" },
        { key: "category", label: "Danh mục" },
        { key: "status", label: "Trạng thái" },
        { key: "createdAt", label: "Ngày tạo" },
    ];
    const gridCols = "2fr 1.35fr 1.35fr 1.35fr 1.15fr 1.15fr 1fr";

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                    <TopNavBar>
                        <AdminTopNavTitle title="Hỗ trợ" />
                    </TopNavBar>

                    <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-6 space-y-5 nb-fade-in">
                        <section className="grid gap-4 md:grid-cols-3">
                            <AdminSummaryCard
                                label="Đang mở"
                                value={loading ? "…" : (data?.openCount ?? 0).toLocaleString("vi-VN")}
                                accent={ADMIN_TONE.rose}
                            />
                            <AdminSummaryCard
                                label="Đang xử lý"
                                value={loading ? "…" : (data?.inProgressCount ?? 0).toLocaleString("vi-VN")}
                                accent={ADMIN_TONE.amber}
                            />
                            <AdminSummaryCard
                                label="Đã giải quyết"
                                value={loading ? "…" : (data?.resolvedCount ?? 0).toLocaleString("vi-VN")}
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
                                    placeholder="Tìm tiêu đề, người gửi..."
                                    className="h-10 w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-800 outline-none shadow-soft-xs transition-colors placeholder:text-slate-500 focus:border-rose-200 focus:ring-4 focus:ring-rose-50"
                                />
                            </label>

                            <label className="relative block">
                                <select
                                    value={statusFilter}
                                    onChange={(event) => {
                                        preserveResultsHeight();
                                        setStatusFilter(event.target.value);
                                        setPage(1);
                                    }}
                                    className="h-10 min-w-[160px] appearance-none rounded-full border border-slate-200 bg-white py-0 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none shadow-soft-xs transition-colors focus:border-rose-200 focus:ring-4 focus:ring-rose-50"
                                >
                                    <option value="">Tất cả trạng thái</option>
                                    <option value="Open">Đang mở</option>
                                    <option value="InProgress">Đang xử lý</option>
                                    <option value="Resolved">Đã giải quyết</option>
                                    <option value="Closed">Đã đóng</option>
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-900" />
                            </label>

                            {(fetchingOrders || filtering) && (
                                <div className="inline-flex h-9 items-center gap-2 rounded-full border border-rose-100 bg-white px-3 text-xs font-bold text-rose-700 shadow-soft-sm">
                                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-rose-100 border-t-rose-700" />
                                    Đang tải
                                </div>
                            )}
                            </div>

                            <span className="inline-flex h-9 items-center self-start rounded-full border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 shadow-soft-xs lg:self-auto">
                                Tổng: {(data?.totalCount ?? 0).toLocaleString("vi-VN")}
                            </span>
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
                                                <div key={cellIndex} className="h-5 rounded animate-pulse bg-rose-50" />
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!loading && (!data || data.items.length === 0) && (
                                <AdminEmptyState
                                    title="Không có yêu cầu hỗ trợ nào"
                                    detail="Hệ thống chưa ghi nhận yêu cầu hỗ trợ nào phù hợp bộ lọc hiện tại."
                                    icon={<Headset className="h-6 w-6" />}
                                    bg={ADMIN_TONE.emeraldSoft}
                                />
                            )}

                            {!loading && data && data.items.length > 0 && (
                                <div>
                                    {sortedItems.map((item, index) => (
                                        <div
                                            key={item.id}
                                            className="hidden min-h-[58px] lg:grid items-center gap-4 border-b px-5 py-3 transition-colors hover:bg-rose-50 nb-fade-in"
                                            style={{ gridTemplateColumns: gridCols, borderColor: ADMIN_TONE.line, animationDelay: `${index * 30}ms` }}
                                        >
                                            <div className="truncate text-[14px] font-medium text-gray-900">{item.title}</div>
                                            <div className="truncate text-[14px] font-normal" style={{ color: "#3D384A" }}>
                                                {senderName(item)}
                                            </div>
                                            <div className="truncate text-[14px] font-normal" style={{ color: "#3D384A" }}>
                                                {roleLabel(item.requesterRole)}
                                            </div>
                                            <div className="truncate text-[14px] font-normal" style={{ color: "#3D384A" }}>
                                                {categoryLabel(item.category)}
                                            </div>
                                            <div>
                                                <CompactBadge bg={statusTone[item.status]?.bg} text={statusTone[item.status]?.text}>
                                                    {statusLabel(item.status)}
                                                </CompactBadge>
                                            </div>
                                            <div className="text-[14px] font-medium" style={{ color: ADMIN_TONE.muted }}>
                                                {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                                            </div>
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={() => setSelected(item)}
                                                    className="h-8 rounded-[8px] border px-3 text-[12px] font-bold transition-all hover:scale-[0.99]"
                                                    style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell, color: ADMIN_TONE.pageInk }}
                                                >
                                                    Chi tiết
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
                                                <div className="min-w-0">
                                                    <div className="truncate text-[15px] font-medium text-gray-900">{item.title}</div>
                                                    <div className="mt-1 text-[13px] font-normal" style={{ color: "#3D384A" }}>
                                                        {senderName(item)} · {roleLabel(item.requesterRole)}
                                                    </div>
                                                </div>
                                                <CompactBadge bg={statusTone[item.status]?.bg} text={statusTone[item.status]?.text}>
                                                    {statusLabel(item.status)}
                                                </CompactBadge>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[12px] font-medium" style={{ color: ADMIN_TONE.muted }}>
                                                    {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                                                </span>
                                                <button
                                                    onClick={() => setSelected(item)}
                                                    className="h-9 rounded-[8px] border px-3 text-[13px] font-bold transition-all hover:scale-[0.99]"
                                                    style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell, color: ADMIN_TONE.pageInk }}
                                                >
                                                    Chi tiết
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <div
                                        className="flex flex-col gap-3 border-t px-5 py-4 md:flex-row md:items-center md:justify-between"
                                        style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.soft }}
                                    >
                                        <div className="text-[13px] font-bold" style={{ color: ADMIN_TONE.muted }}>
                                            Trang {page}/{totalPages} · {data.totalCount} yêu cầu hỗ trợ
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

            {selected && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 nb-backdrop-enter"
                    style={{ background: "rgba(25, 24, 43, 0.55)" }}
                    onClick={() => setSelected(null)}
                >
                    <div
                        className="w-full max-w-2xl rounded-2xl border p-6 space-y-5 nb-modal-enter max-h-[90vh] overflow-y-auto shadow-soft-sm"
                        style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-[24px] font-bold text-gray-900">{selected.title}</h2>
                                <p className="mt-2 text-[14px] font-semibold" style={{ color: ADMIN_TONE.muted }}>
                                    {senderName(selected)} · {roleLabel(selected.requesterRole)} · {new Date(selected.createdAt).toLocaleDateString("vi-VN")}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelected(null)}
                                className="flex h-10 w-10 items-center justify-center rounded-[8px] border text-[16px] font-bold transition-all hover:scale-[0.99]"
                                style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}
                            >
                                ×
                            </button>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                            <DetailPill
                                label="Trạng thái"
                                value={statusLabel(selected.status)}
                                accent={statusTone[selected.status]?.text || ADMIN_TONE.rose}
                            />
                            <DetailPill
                                label="Người gửi"
                                value={senderName(selected)}
                                accent={ADMIN_TONE.sky}
                            />
                        </div>

                        <div className="rounded-[8px] border p-4 text-[14px] font-semibold max-h-40 overflow-y-auto" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.soft, color: "#3D384A" }}>
                            {selected.description}
                        </div>

                        {selected.response && (
                            <div className="rounded-[8px] border p-4 text-[14px] max-h-32 overflow-y-auto" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.skySoft }}>
                                <p className="mb-1 text-[12px] font-bold uppercase" style={{ color: "#1D63BE" }}>
                                    Phản hồi hiện có
                                </p>
                                <p className="font-semibold whitespace-pre-wrap" style={{ color: "#1A3A6B" }}>
                                    {selected.response}
                                </p>
                            </div>
                        )}

                        <div className="space-y-3">
                            <textarea
                                value={note}
                                onChange={(event) => setNote(event.target.value)}
                                placeholder="Ghi chú của Admin..."
                                className="h-24 w-full resize-none rounded-[8px] border px-4 py-3 text-[14px] font-semibold outline-none"
                                style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}
                            />
                            <select
                                value={action}
                                onChange={(event) => setAction(event.target.value)}
                                className="w-full rounded-[8px] border px-4 py-3 text-[14px] font-semibold outline-none"
                                style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}
                            >
                                <option value="">Chỉ thêm ghi chú</option>
                                <option value="escalate">Chuyển sang đang xử lý</option>
                                <option value="resolve">Đánh dấu đã giải quyết</option>
                                <option value="close">Đóng hồ sơ</option>
                            </select>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleIntervene}
                                    disabled={submitting || !note.trim()}
                                    className="flex-1 rounded-[8px] border py-3 text-[15px] font-bold text-white transition-all disabled:opacity-50 hover:scale-[0.99]"
                                    style={{ borderColor: ADMIN_TONE.rose, background: ADMIN_TONE.rose }}
                                >
                                    {submitting ? "Đang xử lý..." : "Gửi can thiệp"}
                                </button>
                                <button
                                    onClick={() => setSelected(null)}
                                    className="flex-1 rounded-[8px] border py-3 text-[15px] font-bold transition-all hover:scale-[0.99]"
                                    style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell, color: ADMIN_TONE.pageInk }}
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
