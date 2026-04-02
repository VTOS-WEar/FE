import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useAdminSidebarConfig } from "../../hooks/useAdminSidebarConfig";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import {
    getWithdrawalRequests, approveWithdrawal, rejectWithdrawal,
    type WithdrawalRequestDto,
} from "../../lib/api/admin";

/* ── Design tokens ── */
const T = {
    ink: "#19182B", surface: "#FFFFFF", surfaceSoft: "#FFFDF9",
    primary: "#8B6BFF", primarySoft: "#E9E1FF",
    successSoft: "#D9F8E8", warningSoft: "#FFF1BF", dangerSoft: "#FFE3D8",
    muted: "#6F6A7D",
};

const STATUS_TONE: Record<string, { bg: string; text: string }> = {
    Pending: { bg: T.warningSoft, text: "#9A590E" },
    Approved: { bg: T.successSoft, text: "#187A4C" },
    Rejected: { bg: T.dangerSoft, text: "#B2452D" },
};
const STATUS_LABEL: Record<string, string> = {
    Pending: "Chờ duyệt", Approved: "Đã duyệt", Rejected: "Từ chối",
};

function Badge({ children, tone }: { children: React.ReactNode; tone?: { bg: string; text: string } }) {
    const t = tone || { bg: T.surface, text: T.ink };
    return (
        <span className="inline-flex items-center rounded-full border-[2px] px-3 py-1 text-[12px] font-black uppercase tracking-wide"
            style={{ borderColor: T.ink, background: t.bg, color: t.text, boxShadow: `2px 2px 0 ${T.ink}` }}>
            {children}
        </span>
    );
}

function fmt(n: number) { return n.toLocaleString("vi-VN") + " ₫"; }
function fmtDate(iso: string) {
    return new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function AdminWithdrawals() {
    const navigate = useNavigate();
    const sidebarConfig = useAdminSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();

    const [items, setItems] = useState<WithdrawalRequestDto[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [filter, setFilter] = useState<string>("");
    const [loading, setLoading] = useState(true);

    const [actionItem, setActionItem] = useState<WithdrawalRequestDto | null>(null);
    const [actionType, setActionType] = useState<"approve" | "reject">("approve");
    const [adminNote, setAdminNote] = useState("");
    const [processing, setProcessing] = useState(false);

    const pageSize = 10;

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getWithdrawalRequests({ page, pageSize, status: filter || undefined });
            setItems(res.items || []); setTotal(res.total || 0);
        } catch { /* */ } finally { setLoading(false); }
    }, [page, filter]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAction = async () => {
        if (!actionItem) return;
        setProcessing(true);
        try {
            if (actionType === "approve") await approveWithdrawal(actionItem.id, adminNote || undefined);
            else await rejectWithdrawal(actionItem.id, adminNote || undefined);
            setActionItem(null); setAdminNote(""); await fetchData();
        } catch { /* */ } finally { setProcessing(false); }
    };

    const handleLogout = () => {
        localStorage.removeItem("access_token"); localStorage.removeItem("user"); localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token"); sessionStorage.removeItem("user"); sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const gridCols = "2fr 1.5fr 2fr 1.5fr 1.2fr 1.3fr";

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                    <TopNavBar>
                        <Breadcrumb><BreadcrumbList>
                            <BreadcrumbItem><BreadcrumbLink href="/admin/dashboard" className="font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                            <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                            <BreadcrumbItem><BreadcrumbPage className="font-bold text-[#1A1A2E] text-base">Yêu cầu rút tiền</BreadcrumbPage></BreadcrumbItem>
                        </BreadcrumbList></Breadcrumb>
                    </TopNavBar>
                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6 nb-fade-in">
                        {/* Header */}
                        <div>
                            <h1 className="text-[40px] font-black leading-none md:text-[48px]" style={{ color: T.ink }}>💸 Yêu cầu rút tiền</h1>
                            <p className="mt-3 max-w-3xl text-[17px] font-semibold leading-8" style={{ color: T.muted }}>
                                Duyệt hoặc từ chối yêu cầu rút tiền từ Trường học và Nhà cung cấp.
                            </p>
                        </div>

                        {/* Filter tabs */}
                        <div className="rounded-[18px] border-[3px] p-4" style={{ borderColor: T.ink, background: T.surface, boxShadow: `6px 6px 0 ${T.ink}` }}>
                            <div className="flex flex-wrap items-center gap-3">
                                {[
                                    { value: "", label: "Tất cả" },
                                    { value: "Pending", label: "Chờ duyệt" },
                                    { value: "Approved", label: "Đã duyệt" },
                                    { value: "Rejected", label: "Từ chối" },
                                ].map(tab => (
                                    <button key={tab.value}
                                        onClick={() => { setFilter(tab.value); setPage(1); }}
                                        className="rounded-full border-[2px] px-4 py-1.5 text-[13px] font-extrabold transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#19182B]"
                                        style={{
                                            borderColor: T.ink,
                                            background: filter === tab.value ? T.primary : T.surface,
                                            color: filter === tab.value ? "#fff" : T.ink,
                                            boxShadow: `2px 2px 0 ${T.ink}`,
                                        }}>
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-hidden rounded-[18px] border-[3px]" style={{ borderColor: T.ink, background: T.surface, boxShadow: `6px 6px 0 ${T.ink}` }}>
                            {/* Header */}
                            <div className="sticky top-0 z-10 hidden lg:grid items-center border-b-[3px] px-5 py-4"
                                style={{ gridTemplateColumns: gridCols, borderColor: T.ink, background: T.primarySoft }}>
                                {["Tổ chức", "Số tiền", "Ngân hàng", "Ngày yêu cầu", "Trạng thái", "Hành động"].map((h, i, arr) => (
                                    <div key={h} className={`text-[12px] font-black uppercase tracking-[0.08em]${i === arr.length - 1 ? " text-right" : ""}`} style={{ color: "#4E4A5B" }}>{h}</div>
                                ))}
                            </div>

                            {/* Loading */}
                            {loading && (
                                <div className="space-y-3 px-5 py-5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="hidden lg:grid items-center gap-4 rounded-[14px] border px-4 py-4"
                                            style={{ gridTemplateColumns: gridCols, borderColor: "#D9D4E6", background: T.surfaceSoft }}>
                                            {Array.from({ length: 6 }).map((_, j) => (
                                                <div key={j} className="h-5 rounded animate-pulse" style={{ background: "#EAE3FF" }} />
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Empty */}
                            {!loading && items.length === 0 && (
                                <div className="flex min-h-[240px] flex-col items-center justify-center px-6 py-12 text-center">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-[16px] border-[3px] text-[28px]"
                                        style={{ borderColor: T.ink, background: T.warningSoft, boxShadow: `4px 4px 0 ${T.ink}` }}>📭</div>
                                    <div className="mt-5 text-[28px] font-black">Chưa có yêu cầu rút tiền nào</div>
                                    <p className="mt-3 max-w-lg text-[15px] font-semibold leading-7" style={{ color: T.muted }}>
                                        Không tìm thấy yêu cầu rút tiền phù hợp bộ lọc hiện tại.
                                    </p>
                                </div>
                            )}

                            {/* Rows */}
                            {!loading && items.length > 0 && (
                                <div>
                                    {items.map((item, idx) => (
                                        <div key={item.id} className="hidden lg:grid items-center gap-4 border-b px-5 py-4 transition-colors hover:bg-[#F7F2FF] nb-fade-in"
                                            style={{ gridTemplateColumns: gridCols, borderColor: "#D9D4E6", animationDelay: `${idx * 40}ms` }}>
                                            <div className="text-[15px] font-black" style={{ color: T.ink }}>{item.schoolName || "—"}</div>
                                            <div className="text-[16px] font-black" style={{ color: "#EF4444" }}>{fmt(item.amount)}</div>
                                            <div>
                                                <div className="text-[14px] font-bold" style={{ color: T.ink }}>{item.bankName || "—"}</div>
                                                <div className="text-[12px] font-semibold" style={{ color: T.muted }}>{item.bankAccount || "—"}</div>
                                            </div>
                                            <div className="text-[14px] font-semibold" style={{ color: "#3D384A" }}>{fmtDate(item.requestedAt)}</div>
                                            <div><Badge tone={STATUS_TONE[item.status]}>{STATUS_LABEL[item.status] || item.status}</Badge></div>
                                            <div className="flex justify-end">
                                                {item.status === "Pending" ? (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => { setActionItem(item); setActionType("approve"); }}
                                                            className="rounded-[12px] border-[3px] px-3 py-2 text-[12px] font-extrabold text-white transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                                                            style={{ borderColor: T.ink, background: "#10B981", boxShadow: `3px 3px 0 ${T.ink}` }}>
                                                            ✅ Duyệt
                                                        </button>
                                                        <button onClick={() => { setActionItem(item); setActionType("reject"); }}
                                                            className="rounded-[12px] border-[3px] px-3 py-2 text-[12px] font-extrabold text-white transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                                                            style={{ borderColor: T.ink, background: "#EF4444", boxShadow: `3px 3px 0 ${T.ink}` }}>
                                                            ❌ Từ chối
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[12px] font-semibold" style={{ color: T.muted }}>
                                                        {item.processedAt ? fmtDate(item.processedAt) : "—"}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {/* Mobile cards */}
                                    {items.map((item, idx) => (
                                        <div key={`m-${item.id}`} className="lg:hidden border-b p-4 space-y-3 nb-fade-in"
                                            style={{ borderColor: "#D9D4E6", animationDelay: `${idx * 40}ms` }}>
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="text-[16px] font-black" style={{ color: T.ink }}>{item.schoolName || "—"}</div>
                                                    <div className="text-[18px] font-black mt-1" style={{ color: "#EF4444" }}>{fmt(item.amount)}</div>
                                                </div>
                                                <Badge tone={STATUS_TONE[item.status]}>{STATUS_LABEL[item.status] || item.status}</Badge>
                                            </div>
                                            <div className="text-[13px] font-semibold" style={{ color: T.muted }}>
                                                {item.bankName} — {item.bankAccount} • {fmtDate(item.requestedAt)}
                                            </div>
                                            {item.status === "Pending" && (
                                                <div className="flex gap-2">
                                                    <button onClick={() => { setActionItem(item); setActionType("approve"); }}
                                                        className="flex-1 rounded-[12px] border-[3px] py-2 text-[13px] font-extrabold text-white transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B]"
                                                        style={{ borderColor: T.ink, background: "#10B981", boxShadow: `3px 3px 0 ${T.ink}` }}>✅ Duyệt</button>
                                                    <button onClick={() => { setActionItem(item); setActionType("reject"); }}
                                                        className="flex-1 rounded-[12px] border-[3px] py-2 text-[13px] font-extrabold text-white transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B]"
                                                        style={{ borderColor: T.ink, background: "#EF4444", boxShadow: `3px 3px 0 ${T.ink}` }}>❌ Từ chối</button>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Pagination */}
                                    <div className="flex flex-col gap-3 border-t-[3px] px-5 py-4 md:flex-row md:items-center md:justify-between"
                                        style={{ borderColor: T.ink, background: T.surfaceSoft }}>
                                        <div className="text-[14px] font-bold" style={{ color: T.muted }}>
                                            Trang {page}/{totalPages} · {total} yêu cầu
                                        </div>
                                        {totalPages > 1 && (
                                            <div className="flex gap-3">
                                                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                                                    className="rounded-[12px] border-[3px] px-4 py-2 text-[13px] font-extrabold transition-all disabled:opacity-40 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                                                    style={{ borderColor: T.ink, background: T.surface, color: T.ink, boxShadow: `4px 4px 0 ${T.ink}` }}>← Trước</button>
                                                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                                                    className="rounded-[12px] border-[3px] px-4 py-2 text-[13px] font-extrabold text-white transition-all disabled:opacity-40 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                                                    style={{ borderColor: T.ink, background: T.primary, boxShadow: `4px 4px 0 ${T.ink}` }}>Sau →</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>

            {/* ── Action Modal ── */}
            {actionItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 nb-backdrop-enter"
                    style={{ background: "rgba(25, 24, 43, 0.55)" }}
                    onClick={() => { setActionItem(null); setAdminNote(""); }}>
                    <div className="w-full max-w-md rounded-[18px] border-[3px] p-6 space-y-5 nb-modal-enter"
                        style={{ borderColor: T.ink, background: T.surface, boxShadow: `6px 6px 0 ${T.ink}` }}
                        onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <h3 className="text-[22px] font-black" style={{ color: T.ink }}>
                                {actionType === "approve" ? "✅ Duyệt yêu cầu rút tiền" : "❌ Từ chối yêu cầu rút tiền"}
                            </h3>
                            <button onClick={() => { setActionItem(null); setAdminNote(""); }}
                                className="flex h-10 w-10 items-center justify-center rounded-[10px] border-[2px] text-[16px] font-black transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                                style={{ borderColor: T.ink, background: T.surface, boxShadow: `2px 2px 0 ${T.ink}` }}>✕</button>
                        </div>

                        {/* Info */}
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: "Tổ chức", value: actionItem.schoolName },
                                { label: "Số tiền", value: fmt(actionItem.amount), color: "#EF4444" },
                                { label: "Ngân hàng", value: `${actionItem.bankName} — ${actionItem.bankAccount}`, span: true },
                            ].map((item, i) => (
                                <div key={i} className={item.span ? "col-span-2" : ""}>
                                    <p className="text-[12px] font-black uppercase mb-1 tracking-wide" style={{ color: T.muted }}>{item.label}</p>
                                    <p className="text-[15px] font-bold" style={{ color: item.color || T.ink }}>{item.value}</p>
                                </div>
                            ))}
                        </div>

                        <div>
                            <label className="block text-[12px] font-black uppercase mb-2 tracking-wide" style={{ color: T.muted }}>Ghi chú (tùy chọn)</label>
                            <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Nhập ghi chú..."
                                className="w-full resize-none h-20 rounded-[12px] border-[2px] px-4 py-3 text-[14px] font-semibold outline-none transition-all placeholder:text-[#9A95A8] focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0_#19182B]"
                                style={{ borderColor: T.ink, background: T.surface, boxShadow: `3px 3px 0 ${T.ink}` }} />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => { setActionItem(null); setAdminNote(""); }}
                                className="flex-1 rounded-[12px] border-[3px] py-3 text-[15px] font-extrabold transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                                style={{ borderColor: T.ink, background: T.surface, color: T.ink, boxShadow: `4px 4px 0 ${T.ink}` }}>Hủy</button>
                            <button onClick={handleAction} disabled={processing}
                                className="flex-1 rounded-[12px] border-[3px] py-3 text-[15px] font-extrabold text-white transition-all disabled:opacity-50 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                                style={{ borderColor: T.ink, background: actionType === "approve" ? "#10B981" : "#EF4444", boxShadow: `4px 4px 0 ${T.ink}` }}>
                                {processing ? "Đang xử lý..." : actionType === "approve" ? "Xác nhận duyệt" : "Xác nhận từ chối"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
