import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useProviderSidebarConfig } from "../../hooks/useProviderSidebarConfig";
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

    const totalPages = Math.ceil(total / 10);

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} name={providerName} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                    <TopNavBar>
                        <h1 className="font-extrabold text-[#1A1A2E] text-2xl">📊 Doanh thu</h1>
                        <p className="font-medium text-[#6B7280] text-sm mt-1">Theo dõi thu nhập và thanh toán</p>
                    </TopNavBar>

                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6">
                        {loading ? (
                            <div className="text-center py-20">
                                <div className="inline-block w-8 h-8 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <>
                                {/* Stats Cards — NB stat cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                                    <div className="bg-gradient-to-br from-[#10B981] to-[#059669] rounded-xl p-6 text-white border-2 border-[#1A1A2E] shadow-[4px_4px_0_#1A1A2E]">
                                        <p className="text-white/80 text-sm font-bold">Tổng doanh thu</p>
                                        <p className="font-extrabold text-3xl mt-2">{fmt(revenue?.totalRevenue ?? 0)}</p>
                                    </div>
                                    <div className="nb-stat-card nb-card-purple">
                                        <p className="nb-stat-label">Đơn đã thanh toán</p>
                                        <p className="nb-stat-value mt-2">{revenue?.totalPaidOrders ?? 0}</p>
                                    </div>
                                    <div className="nb-stat-card nb-card-yellow">
                                        <p className="nb-stat-label">Đơn chờ thanh toán</p>
                                        <p className="nb-stat-value text-[#F59E0B] mt-2">{revenue?.totalPendingOrders ?? 0}</p>
                                    </div>
                                    <div className="nb-stat-card nb-card-red">
                                        <p className="nb-stat-label">Số tiền chờ</p>
                                        <p className="nb-stat-value text-[#EF4444] mt-2">{fmt(revenue?.pendingAmount ?? 0)}</p>
                                    </div>
                                </div>

                                {/* Payment History — NB table */}
                                <div className="nb-card-static overflow-hidden">
                                    <div className="px-6 py-4 border-b-2 border-[#1A1A2E]">
                                        <h2 className="font-extrabold text-[#1A1A2E] text-lg">💸 Lịch sử nhận tiền</h2>
                                    </div>
                                    {payments.length === 0 ? (
                                        <p className="text-center py-10 text-[#9CA3AF] font-medium">Chưa nhận thanh toán nào</p>
                                    ) : (
                                        <>
                                            <div className="overflow-x-auto">
                                                <table className="nb-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Thời gian</th>
                                                            <th>Mô tả</th>
                                                            <th className="text-right">Số tiền</th>
                                                            <th className="text-center">Trạng thái</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {payments.map(p => (
                                                            <tr key={p.paymentId}>
                                                                <td className="text-[#4C5769]">{fmtDate(p.timestamp)}</td>
                                                                <td className="font-bold text-[#1A1A2E]">{p.description || `Đơn #${p.orderId?.slice(0, 8)}`}</td>
                                                                <td className="text-right font-extrabold text-[#10B981]">+{fmt(p.amount)}</td>
                                                                <td className="text-center">
                                                                    <span className="nb-badge nb-badge-green">
                                                                        {p.status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            {totalPages > 1 && (
                                                <div className="flex justify-center gap-2 px-6 py-4 border-t-2 border-[#1A1A2E] bg-[#F9FAFB]">
                                                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="nb-btn nb-btn-outline nb-btn-sm text-sm">← Trước</button>
                                                    <span className="flex items-center text-sm text-[#6B7280] px-2 font-bold">{page}/{totalPages}</span>
                                                    <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="nb-btn nb-btn-outline nb-btn-sm text-sm">Sau →</button>
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
