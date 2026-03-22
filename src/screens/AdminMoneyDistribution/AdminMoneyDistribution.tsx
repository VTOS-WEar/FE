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

    const statusColors: Record<string, string> = {
        Pending: "bg-[#FEF3C7] text-[#92400E]",
        Approved: "bg-[#D1FAE5] text-[#065F46]",
        Rejected: "bg-[#FEE2E2] text-[#991B1B]",
    };

    const statusLabels: Record<string, string> = {
        Pending: "Chờ xử lý",
        Approved: "Đã chuyển",
        Rejected: "Từ chối",
    };

    return (
        <div className="bg-[#f6f7f8] w-full min-h-screen flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[20rem] xl:w-[23.75rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="bg-white border-b border-[#cbcad7] px-6 lg:px-10 py-5">
                        <Breadcrumb><BreadcrumbList>
                            <BreadcrumbItem><BreadcrumbLink href="/admin/dashboard" className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                            <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                            <BreadcrumbItem><BreadcrumbPage className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4c5769] text-base">Phân phối tiền</BreadcrumbPage></BreadcrumbItem>
                        </BreadcrumbList></Breadcrumb>
                    </div>
                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6">
                        <h1 className="[font-family:'Montserrat',Helvetica] font-bold text-black text-[28px]">💰 Phân phối tiền</h1>
                        <p className="text-sm text-[#6B7280] [font-family:'Montserrat',Helvetica]">
                            Xem yêu cầu rút tiền từ Quản lý trường và Nhà cung cấp. Sau khi kiểm tra, admin chuyển tiền thủ công qua ngân hàng.
                        </p>

                        {/* Filter */}
                        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                            className="border border-[#CBCAD7] rounded-xl px-4 py-2.5 text-sm [font-family:'Montserrat',Helvetica] focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30">
                            <option value="">Tất cả trạng thái</option>
                            <option value="Pending">Chờ xử lý</option>
                            <option value="Approved">Đã chuyển</option>
                            <option value="Rejected">Từ chối</option>
                        </select>

                        {/* Table */}
                        <div className="bg-white border border-[#CBCAD7] rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm [font-family:'Montserrat',Helvetica]">
                                    <thead><tr className="bg-[#F9FAFB] border-b border-[#CBCAD7]">
                                        <th className="text-left px-6 py-3 font-semibold text-[#6B7280]">Trường / Nhà Cung Cấp</th>
                                        <th className="text-right px-6 py-3 font-semibold text-[#6B7280]">Số tiền</th>
                                        <th className="text-left px-6 py-3 font-semibold text-[#6B7280]">Ngân hàng</th>
                                        <th className="text-left px-6 py-3 font-semibold text-[#6B7280]">STK</th>
                                        <th className="text-left px-6 py-3 font-semibold text-[#6B7280]">Trạng thái</th>
                                        <th className="text-left px-6 py-3 font-semibold text-[#6B7280]">Ngày yêu cầu</th>
                                        <th className="text-center px-6 py-3 font-semibold text-[#6B7280]">Hành động</th>
                                    </tr></thead>
                                    <tbody>
                                        {loading ? Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i} className="border-b animate-pulse">
                                                {Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20" /></td>)}
                                            </tr>
                                        )) : items.length === 0 ? (
                                            <tr><td colSpan={7} className="text-center py-12 text-[#9CA3AF]">Không có yêu cầu rút tiền nào</td></tr>
                                        ) : items.map(w => (
                                            <tr key={w.id} className="border-b border-gray-100 hover:bg-[#F9FAFB] transition-colors">
                                                <td className="px-6 py-4 font-semibold text-[#1A1A2E]">{w.schoolName}</td>
                                                <td className="px-6 py-4 text-right font-bold text-[#1A1A2E]">{w.amount.toLocaleString("vi")} ₫</td>
                                                <td className="px-6 py-4 text-[#4c5769]">{w.bankName}</td>
                                                <td className="px-6 py-4 font-mono text-xs text-[#4c5769]">{w.bankAccount}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[w.status] || "bg-gray-100"}`}>
                                                        {statusLabels[w.status] || w.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-[#6B7280]">{new Date(w.requestedAt).toLocaleDateString("vi")}</td>
                                                <td className="px-6 py-4 text-center">
                                                    {w.status === "Pending" && (
                                                        <button onClick={() => setSelectedItem(w)}
                                                            className="px-3 py-1.5 text-xs font-semibold bg-[#6366F1] text-white rounded-lg hover:bg-[#4F46E5] transition-colors">
                                                            💸 Đánh dấu đã chuyển
                                                        </button>
                                                    )}
                                                    {w.status === "Approved" && w.processedAt && (
                                                        <span className="text-xs text-[#059669]">✅ {new Date(w.processedAt).toLocaleDateString("vi")}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="px-6 py-3 bg-[#F9FAFB] border-t border-[#CBCAD7] flex items-center justify-between text-xs text-[#6B7280]">
                                <span>Tổng: {total} yêu cầu</span>
                                <div className="flex gap-2">
                                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-100">← Trước</button>
                                    <span className="px-3 py-1">Trang {page}</span>
                                    <button onClick={() => setPage(p => p + 1)} disabled={items.length < 10} className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-100">Sau →</button>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* Confirm Transfer Modal */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl" onClick={e => e.stopPropagation()}>
                        <h2 className="[font-family:'Montserrat',Helvetica] font-bold text-lg">💸 Xác nhận đã chuyển tiền</h2>

                        <div className="bg-[#F9FAFB] rounded-xl p-4 space-y-2 text-sm [font-family:'Montserrat',Helvetica]">
                            <div className="flex justify-between">
                                <span className="text-[#6B7280]">Người nhận:</span>
                                <span className="font-semibold">{selectedItem.schoolName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[#6B7280]">Số tiền:</span>
                                <span className="font-bold text-[#DC2626]">{selectedItem.amount.toLocaleString("vi")} ₫</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[#6B7280]">Ngân hàng:</span>
                                <span className="font-semibold">{selectedItem.bankName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[#6B7280]">STK:</span>
                                <span className="font-mono font-semibold">{selectedItem.bankAccount}</span>
                            </div>
                        </div>

                        <div className="bg-[#FEF3C7] rounded-xl p-3 text-xs text-[#92400E] [font-family:'Montserrat',Helvetica]">
                            ⚠️ Hãy chắc chắn bạn đã chuyển tiền thủ công qua ngân hàng trước khi xác nhận.
                        </div>

                        <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)}
                            placeholder="Ghi chú (mã GD ngân hàng, thời gian chuyển...)"
                            className="w-full border border-[#CBCAD7] rounded-xl px-4 py-3 text-sm resize-none h-20 [font-family:'Montserrat',Helvetica] focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30" />

                        <div className="flex gap-2">
                            <button onClick={handleMarkTransferred} disabled={actionLoading}
                                className="flex-1 bg-[#10B981] text-white py-2.5 rounded-xl font-semibold hover:bg-[#059669] disabled:opacity-50 text-sm [font-family:'Montserrat',Helvetica]">
                                {actionLoading ? "Đang xử lý..." : "✅ Xác nhận đã chuyển tiền"}
                            </button>
                            <button onClick={() => setSelectedItem(null)}
                                className="flex-1 border border-[#CBCAD7] py-2.5 rounded-xl font-semibold hover:bg-gray-50 text-sm [font-family:'Montserrat',Helvetica]">
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
