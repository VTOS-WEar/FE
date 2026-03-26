import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { DashboardSidebar } from "../../components/layout";
import { useAdminSidebarConfig } from "../../hooks/useAdminSidebarConfig";
import { getWithdrawalRequests, approveWithdrawal, type WithdrawalRequestDto } from "../../lib/api/admin";

const statusBadge: Record<string, string> = {
    Pending: "nb-badge nb-badge-yellow",
    Approved: "nb-badge nb-badge-green",
    Rejected: "nb-badge nb-badge-red",
};
const statusLabels: Record<string, string> = {
    Pending: "Chờ xử lý",
    Approved: "Đã chuyển",
    Rejected: "Từ chối",
};

export const AdminMoneyDistribution = (): JSX.Element => {
    const navigate = useNavigate();
    const sidebarConfig = useAdminSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<WithdrawalRequestDto[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [filterStatus, setFilterStatus] = useState("");
    const [selectedItem, setSelectedItem] = useState<WithdrawalRequestDto | null>(null);
    const [adminNote, setAdminNote] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const r = await getWithdrawalRequests({ page, pageSize: 10, status: filterStatus || undefined });
            setItems(r.items || []); setTotal(r.total || 0);
        } catch { setItems([]); }
        finally { setLoading(false); }
    }, [page, filterStatus]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleMarkTransferred = async () => {
        if (!selectedItem) return;
        setActionLoading(true);
        try {
            await approveWithdrawal(selectedItem.id, adminNote || "Đã chuyển tiền thủ công qua ngân hàng");
            setSelectedItem(null); setAdminNote("");
            await fetchData();
        } catch { /* */ }
        finally { setActionLoading(false); }
    };

    const handleLogout = () => {
        localStorage.removeItem("access_token"); localStorage.removeItem("user"); localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token"); sessionStorage.removeItem("user"); sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="nb-breadcrumb-bar">
                        <Breadcrumb><BreadcrumbList>
                            <BreadcrumbItem><BreadcrumbLink href="/admin/dashboard" className="font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                            <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                            <BreadcrumbItem><BreadcrumbPage className="font-bold text-[#1A1A2E] text-base">Phân phối tiền</BreadcrumbPage></BreadcrumbItem>
                        </BreadcrumbList></Breadcrumb>
                    </div>
                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6">
                        <div>
                            <h1 className="font-extrabold text-[#1A1A2E] text-[28px]">💰 Phân phối tiền</h1>
                            <p className="text-sm text-[#6B7280] mt-1 font-medium">
                                Xem yêu cầu rút tiền từ Quản lý trường và Nhà cung cấp. Sau khi kiểm tra, admin chuyển tiền thủ công qua ngân hàng.
                            </p>
                        </div>

                        {/* Filter — NB select */}
                        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                            className="nb-select text-sm">
                            <option value="">Tất cả trạng thái</option>
                            <option value="Pending">Chờ xử lý</option>
                            <option value="Approved">Đã chuyển</option>
                            <option value="Rejected">Từ chối</option>
                        </select>

                        {/* Table — NB table */}
                        <div className="nb-card-static overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="nb-table">
                                    <thead><tr>
                                        <th>Trường / Nhà Cung Cấp</th>
                                        <th className="text-right">Số tiền</th>
                                        <th>Ngân hàng</th>
                                        <th>STK</th>
                                        <th>Trạng thái</th>
                                        <th>Ngày yêu cầu</th>
                                        <th className="text-center">Hành động</th>
                                    </tr></thead>
                                    <tbody>
                                        {loading ? Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i}>
                                                {Array.from({ length: 7 }).map((_, j) => <td key={j}><div className="h-4 bg-gray-200 rounded w-20 animate-pulse" /></td>)}
                                            </tr>
                                        )) : items.length === 0 ? (
                                            <tr><td colSpan={7} className="text-center py-12 text-[#9CA3AF]">Không có yêu cầu rút tiền nào</td></tr>
                                        ) : items.map(w => (
                                            <tr key={w.id}>
                                                <td className="font-bold text-[#1A1A2E]">{w.schoolName}</td>
                                                <td className="text-right font-extrabold text-[#1A1A2E]">{w.amount.toLocaleString("vi")} ₫</td>
                                                <td>{w.bankName}</td>
                                                <td className="font-mono text-xs">{w.bankAccount}</td>
                                                <td>
                                                    <span className={statusBadge[w.status] || "nb-badge"}>
                                                        {statusLabels[w.status] || w.status}
                                                    </span>
                                                </td>
                                                <td className="text-[#6B7280]">{new Date(w.requestedAt).toLocaleDateString("vi")}</td>
                                                <td className="text-center">
                                                    {w.status === "Pending" && (
                                                        <button onClick={() => setSelectedItem(w)}
                                                            className="nb-btn nb-btn-purple nb-btn-sm text-xs">
                                                            💸 Đánh dấu đã chuyển
                                                        </button>
                                                    )}
                                                    {w.status === "Approved" && w.processedAt && (
                                                        <span className="text-xs text-[#059669] font-bold">✅ {new Date(w.processedAt).toLocaleDateString("vi")}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="px-6 py-3 bg-[#F9FAFB] border-t-2 border-[#1A1A2E] flex items-center justify-between text-xs text-[#6B7280] font-semibold">
                                <span>Tổng: {total} yêu cầu</span>
                                <div className="flex gap-2">
                                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="nb-btn nb-btn-outline nb-btn-sm text-xs disabled:opacity-40">← Trước</button>
                                    <span className="px-3 py-1 font-bold">Trang {page}</span>
                                    <button onClick={() => setPage(p => p + 1)} disabled={items.length < 10} className="nb-btn nb-btn-outline nb-btn-sm text-xs disabled:opacity-40">Sau →</button>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* Confirm Transfer Modal — NB style */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
                    <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-4 border-2 border-[#1A1A2E] shadow-[6px_6px_0_#1A1A2E]" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <h2 className="font-extrabold text-lg text-[#1A1A2E]">💸 Xác nhận đã chuyển tiền</h2>
                            <button onClick={() => setSelectedItem(null)} className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-[#1A1A2E] hover:bg-[#F3F4F6] font-bold">✕</button>
                        </div>

                        <div className="nb-card-static p-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-[#6B7280] font-medium">Người nhận:</span>
                                <span className="font-bold">{selectedItem.schoolName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[#6B7280] font-medium">Số tiền:</span>
                                <span className="font-extrabold text-[#DC2626]">{selectedItem.amount.toLocaleString("vi")} ₫</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[#6B7280] font-medium">Ngân hàng:</span>
                                <span className="font-bold">{selectedItem.bankName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[#6B7280] font-medium">STK:</span>
                                <span className="font-mono font-bold">{selectedItem.bankAccount}</span>
                            </div>
                        </div>

                        <div className="nb-alert nb-alert-warning text-xs">
                            <span>⚠️</span>
                            <span>Hãy chắc chắn bạn đã chuyển tiền thủ công qua ngân hàng trước khi xác nhận.</span>
                        </div>

                        <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)}
                            placeholder="Ghi chú (mã GD ngân hàng, thời gian chuyển...)"
                            className="nb-input w-full resize-none h-20" />

                        <div className="flex gap-2">
                            <button onClick={handleMarkTransferred} disabled={actionLoading}
                                className="flex-1 nb-btn nb-btn-green text-sm disabled:opacity-50">
                                {actionLoading ? "Đang xử lý..." : "✅ Xác nhận đã chuyển tiền"}
                            </button>
                            <button onClick={() => setSelectedItem(null)}
                                className="flex-1 nb-btn nb-btn-outline text-sm">
                                Huỷ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminMoneyDistribution;
