import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useAdminSidebarConfig } from "../../hooks/useAdminSidebarConfig";
import {
    getWithdrawalRequests,
    approveWithdrawal,
    rejectWithdrawal,
    type WithdrawalRequestDto,
} from "../../lib/api/admin";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";

/* ── helpers ── */
function fmt(n: number) { return n.toLocaleString("vi-VN") + " ₫"; }
function fmtDate(iso: string) {
    return new Date(iso).toLocaleString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

function statusBadge(s: string) {
    switch (s) {
        case "Pending": return "nb-badge nb-badge-yellow";
        case "Approved": return "nb-badge nb-badge-green";
        case "Rejected": return "nb-badge nb-badge-red";
        default: return "nb-badge";
    }
}
function statusLabel(s: string) {
    switch (s) {
        case "Pending": return "Chờ duyệt";
        case "Approved": return "Đã duyệt";
        case "Rejected": return "Từ chối";
        default: return s;
    }
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

    // Action modal
    const [actionItem, setActionItem] = useState<WithdrawalRequestDto | null>(null);
    const [actionType, setActionType] = useState<"approve" | "reject">("approve");
    const [adminNote, setAdminNote] = useState("");
    const [processing, setProcessing] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getWithdrawalRequests({
                page, pageSize: 10,
                status: filter || undefined,
            });
            setItems(res.items || []);
            setTotal(res.total || 0);
        } catch { /* ignore */ } finally { setLoading(false); }
    }, [page, filter]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAction = async () => {
        if (!actionItem) return;
        setProcessing(true);
        try {
            if (actionType === "approve") {
                await approveWithdrawal(actionItem.id, adminNote || undefined);
            } else {
                await rejectWithdrawal(actionItem.id, adminNote || undefined);
            }
            setActionItem(null);
            setAdminNote("");
            await fetchData();
        } catch { /* ignore */ } finally { setProcessing(false); }
    };

    const handleLogout = () => {
        localStorage.removeItem("access_token"); localStorage.removeItem("user");
        sessionStorage.removeItem("access_token"); sessionStorage.removeItem("user");
        navigate("/signin", { replace: true });
    };

    const totalPages = Math.ceil(total / 10);

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                    <TopNavBar>
                        <h1 className="font-extrabold text-[#1A1A2E] text-2xl">💸 Yêu cầu rút tiền</h1>
                        <p className="font-medium text-[#6B7280] text-sm mt-1">Duyệt hoặc từ chối yêu cầu rút tiền từ Trường / Nhà cung cấp</p>
                    </TopNavBar>

                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6 nb-fade-in">
                        {/* Filters */}
                        <div className="flex flex-wrap items-center gap-3">
                            {["", "Pending", "Approved", "Rejected"].map(f => (
                                <button key={f}
                                    className={`nb-btn nb-btn-sm text-sm ${filter === f ? "nb-btn-purple" : "nb-btn-outline"}`}
                                    onClick={() => { setFilter(f); setPage(1); }}>
                                    {f === "" ? "Tất cả" : statusLabel(f)}
                                </button>
                            ))}
                        </div>

                        {loading ? (
                            <div className="text-center py-20">
                                <div className="inline-block w-8 h-8 border-4 border-[#6938EF] border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : items.length === 0 ? (
                            <div className="nb-card-static p-12 text-center">
                                <p className="text-5xl mb-3">📭</p>
                                <p className="font-bold text-[#6B7280]">Chưa có yêu cầu rút tiền nào</p>
                            </div>
                        ) : (
                            <>
                                <div className="nb-card-static overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className={`nb-table ${!loading && items.length > 0 ? "nb-table-animate" : ""}`}>
                                            <thead>
                                                <tr>
                                                    <th>Tổ chức</th>
                                                    <th>Số tiền</th>
                                                    <th>Ngân hàng</th>
                                                    <th>Ngày yêu cầu</th>
                                                    <th>Trạng thái</th>
                                                    <th>Hành động</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.map(item => (
                                                    <tr key={item.id}>
                                                        <td className="font-bold text-[#1A1A2E]">{item.schoolName || "—"}</td>
                                                        <td className="font-extrabold text-[#EF4444]">{fmt(item.amount)}</td>
                                                        <td>
                                                            <p className="font-semibold text-[#1A1A2E]">{item.bankName || "—"}</p>
                                                            <p className="text-[#9CA3AF] text-xs">{item.bankAccount || "—"}</p>
                                                        </td>
                                                        <td className="text-[#6B7280]">{fmtDate(item.requestedAt)}</td>
                                                        <td><span className={statusBadge(item.status)}>{statusLabel(item.status)}</span></td>
                                                        <td>
                                                            {item.status === "Pending" ? (
                                                                <div className="flex gap-2">
                                                                    <button className="nb-btn nb-btn-green nb-btn-sm text-xs"
                                                                        onClick={() => { setActionItem(item); setActionType("approve"); }}>
                                                                        ✅ Duyệt
                                                                    </button>
                                                                    <button className="nb-btn nb-btn-red nb-btn-sm text-xs"
                                                                        onClick={() => { setActionItem(item); setActionType("reject"); }}>
                                                                        ❌ Từ chối
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-[#9CA3AF] font-medium">
                                                                    {item.processedAt ? fmtDate(item.processedAt) : "—"}
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {totalPages > 1 && (
                                    <div className="flex justify-center gap-2">
                                        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="nb-btn nb-btn-outline nb-btn-sm text-sm">← Trước</button>
                                        <span className="flex items-center text-sm text-[#6B7280] px-2 font-bold">{page}/{totalPages}</span>
                                        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="nb-btn nb-btn-outline nb-btn-sm text-sm">Sau →</button>
                                    </div>
                                )}
                            </>
                        )}
                    </main>
                </div>
            </div>

            {/* Action Modal */}
            {actionItem && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 nb-backdrop-enter">
                    <div className="nb-card-static p-6 w-full max-w-md space-y-4 nb-modal-enter">
                        <h3 className="font-extrabold text-[#1A1A2E] text-lg">
                            {actionType === "approve" ? "✅ Duyệt yêu cầu rút tiền" : "❌ Từ chối yêu cầu rút tiền"}
                        </h3>
                        <div className="space-y-2 text-sm">
                            <p><span className="font-bold text-[#6B7280]">Tổ chức:</span> <span className="font-bold text-[#1A1A2E]">{actionItem.schoolName}</span></p>
                            <p><span className="font-bold text-[#6B7280]">Số tiền:</span> <span className="font-extrabold text-[#EF4444]">{fmt(actionItem.amount)}</span></p>
                            <p><span className="font-bold text-[#6B7280]">Ngân hàng:</span> <span className="font-bold text-[#1A1A2E]">{actionItem.bankName} — {actionItem.bankAccount}</span></p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#6B7280] mb-1">Ghi chú (tùy chọn)</label>
                            <textarea className="nb-input w-full h-20 resize-none" value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Nhập ghi chú..." />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button className="nb-btn nb-btn-outline text-sm" onClick={() => { setActionItem(null); setAdminNote(""); }}>Hủy</button>
                            <button
                                className={`nb-btn text-sm ${actionType === "approve" ? "nb-btn-green" : "nb-btn-red"}`}
                                disabled={processing}
                                onClick={handleAction}>
                                {processing ? "Đang xử lý..." : actionType === "approve" ? "Xác nhận duyệt" : "Xác nhận từ chối"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
