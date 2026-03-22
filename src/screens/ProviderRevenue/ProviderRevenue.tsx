import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardSidebar } from "../../components/layout";
import { useProviderSidebarConfig } from "../../hooks/useProviderSidebarConfig";
import { Button } from "../../components/ui/button";
import {
    getProviderRevenue,
    getProviderPaymentHistory,
    type ProviderRevenueDto,
    type ProviderPaymentDto,
} from "../../lib/api/payments";
import { getProviderProfile } from "../../lib/api/providers";

/* ── helpers ── */
function fmt(n: number) { return n.toLocaleString("vi-VN") + " ₫"; }
function fmtDate(iso: string) {
    return new Date(iso).toLocaleString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

export default function ProviderRevenue() {
    const navigate = useNavigate();
    const sidebarConfig = useProviderSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [providerName, setProviderName] = useState("");

    const [revenue, setRevenue] = useState<ProviderRevenueDto | null>(null);
    const [payments, setPayments] = useState<ProviderPaymentDto[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [profile, rev, pay] = await Promise.all([
                getProviderProfile(),
                getProviderRevenue(),
                getProviderPaymentHistory(page, 10),
            ]);
            setProviderName(profile.providerName || "Nhà Cung Cấp");
            setRevenue(rev);
            setPayments(pay.items);
            setTotal(pay.total);
        } catch { /* ignore */ } finally { setLoading(false); }
    }, [page]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleLogout = () => {
        localStorage.removeItem("access_token"); localStorage.removeItem("user");
        sessionStorage.removeItem("access_token"); sessionStorage.removeItem("user");
        navigate("/signin", { replace: true });
    };

    // Dynamic sidebar with active state (from shared hook)
    const totalPages = Math.ceil(total / 10);

    return (
        <div className="bg-[#f6f7f8] w-full min-h-screen flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[20rem] xl:w-[23.75rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} name={providerName} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                    <div className="bg-white border-b border-[#cbcad7] px-6 lg:px-10 py-5">
                        <h1 className="[font-family:'Montserrat',Helvetica] font-bold text-[#1A1A2E] text-2xl">📊 Doanh thu</h1>
                        <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#6B7280] text-sm mt-1">Theo dõi thu nhập và thanh toán</p>
                    </div>

                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6">
                        {loading ? (
                            <div className="text-center py-20">
                                <div className="inline-block w-8 h-8 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <>
                                {/* Stats Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                                    <div className="bg-gradient-to-br from-[#10B981] to-[#059669] rounded-[16px] p-6 text-white">
                                        <p className="text-white/80 text-sm font-medium">Tổng doanh thu</p>
                                        <p className="font-bold text-3xl mt-2">{fmt(revenue?.totalRevenue ?? 0)}</p>
                                    </div>
                                    <div className="bg-white border border-[#CBCAD7] rounded-[16px] p-6">
                                        <p className="text-[#6B7280] text-sm font-medium">Đơn đã thanh toán</p>
                                        <p className="font-bold text-[#1A1A2E] text-3xl mt-2">{revenue?.totalPaidOrders ?? 0}</p>
                                    </div>
                                    <div className="bg-white border border-[#CBCAD7] rounded-[16px] p-6">
                                        <p className="text-[#6B7280] text-sm font-medium">Đơn chờ thanh toán</p>
                                        <p className="font-bold text-[#F59E0B] text-3xl mt-2">{revenue?.totalPendingOrders ?? 0}</p>
                                    </div>
                                    <div className="bg-white border border-[#CBCAD7] rounded-[16px] p-6">
                                        <p className="text-[#6B7280] text-sm font-medium">Số tiền chờ</p>
                                        <p className="font-bold text-[#EF4444] text-3xl mt-2">{fmt(revenue?.pendingAmount ?? 0)}</p>
                                    </div>
                                </div>

                                {/* Payment History */}
                                <div className="bg-white rounded-[16px] border border-[#CBCAD7] p-6">
                                    <h2 className="[font-family:'Montserrat',Helvetica] font-bold text-[#1A1A2E] text-lg mb-4">💸 Lịch sử nhận tiền</h2>
                                    {payments.length === 0 ? (
                                        <p className="text-center py-10 text-[#9CA3AF] font-medium">Chưa nhận thanh toán nào</p>
                                    ) : (
                                        <>
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="border-b border-[#F3F4F6]">
                                                        <th className="py-3 text-xs font-bold text-[#6B7280] uppercase">Thời gian</th>
                                                        <th className="py-3 text-xs font-bold text-[#6B7280] uppercase">Mô tả</th>
                                                        <th className="py-3 text-xs font-bold text-[#6B7280] uppercase text-right">Số tiền</th>
                                                        <th className="py-3 text-xs font-bold text-[#6B7280] uppercase text-center">Trạng thái</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {payments.map(p => (
                                                        <tr key={p.paymentId} className="border-b border-[#F3F4F6] last:border-0 hover:bg-[#F9FAFB] transition-colors">
                                                            <td className="py-3 text-sm text-[#4C5769]">{fmtDate(p.timestamp)}</td>
                                                            <td className="py-3 text-sm text-[#1A1A2E] font-medium">{p.description || `Đơn #${p.orderId?.slice(0, 8)}`}</td>
                                                            <td className="py-3 text-sm text-[#10B981] font-bold text-right">+{fmt(p.amount)}</td>
                                                            <td className="py-3 text-center">
                                                                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-[#D1FAE5] text-[#065F46]">
                                                                    {p.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {totalPages > 1 && (
                                                <div className="flex justify-center gap-2 mt-4">
                                                    <Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="text-sm rounded-[8px]">← Trước</Button>
                                                    <span className="flex items-center text-sm text-[#6B7280] px-2">{page}/{totalPages}</span>
                                                    <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="text-sm rounded-[8px]">Sau →</Button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
