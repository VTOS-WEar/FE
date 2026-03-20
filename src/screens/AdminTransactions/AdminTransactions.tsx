import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardSidebar } from "../../components/layout";
import { useAdminSidebarConfig } from "../../hooks/useAdminSidebarConfig";
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { getAdminTransactions, type AdminTransactionDto, type AdminTransactionListResult } from "../../lib/api/admin";

const TYPE_BADGES: Record<string, { label: string; color: string }> = {
    OrderPayment: { label: "Thanh toán", color: "bg-emerald-100 text-emerald-700" },
    ProviderPayment: { label: "Chi NCC", color: "bg-blue-100 text-blue-700" },
    Refund: { label: "Hoàn tiền", color: "bg-orange-100 text-orange-700" },
};

const STATUS_COLORS: Record<string, string> = {
    Completed: "bg-green-100 text-green-700",
    Pending: "bg-yellow-100 text-yellow-700",
    Processing: "bg-blue-100 text-blue-700",
    Failed: "bg-red-100 text-red-700",
    Cancelled: "bg-gray-100 text-gray-600",
    Refunded: "bg-purple-100 text-purple-700",
};

const fmt = (n: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

export default function AdminTransactions() {
    const navigate = useNavigate();
    const sidebarConfig = useAdminSidebarConfig();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [data, setData] = useState<AdminTransactionListResult | null>(null);
    const [page, setPage] = useState(1);
    const [filterType, setFilterType] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAdminTransactions({
                page, pageSize: 15, type: filterType || undefined, status: filterStatus || undefined,
            });
            setData(res);
        } catch (e) { console.error(e); }
        setLoading(false);
    }, [page, filterType, filterStatus]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleLogout = () => {
        localStorage.removeItem("access_token"); localStorage.removeItem("user"); localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token"); sessionStorage.removeItem("user"); sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    const totalPages = data ? Math.ceil(data.totalCount / data.pageSize) : 1;

    return (
        <div className="bg-[#f6f7f8] w-full min-h-screen flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[20rem] xl:w-[23.75rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(c => !c)} onLogout={handleLogout} />
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="bg-white border-b border-[#cbcad7] px-6 lg:px-10 py-5">
                        <Breadcrumb><BreadcrumbList>
                            <BreadcrumbItem><BreadcrumbLink href="/admin/dashboard" className="font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                            <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                            <BreadcrumbItem><BreadcrumbPage className="font-semibold text-[#4c5769] text-base">Giao dịch</BreadcrumbPage></BreadcrumbItem>
                        </BreadcrumbList></Breadcrumb>
                    </div>
                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6">

                        <h1 className="font-bold text-black text-[28px]">💳 Theo dõi giao dịch</h1>

                        {/* Summary cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-white border border-[#CBCAD7] rounded-2xl p-5 hover:shadow-md transition-shadow">
                                <p className="text-xs font-semibold text-[#6B7280] uppercase">Tổng giao dịch</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{data?.totalCount ?? 0}</p>
                            </div>
                            <div className="bg-white border border-[#CBCAD7] rounded-2xl p-5 hover:shadow-md transition-shadow">
                                <p className="text-xs font-semibold text-[#6B7280] uppercase">Tổng giá trị</p>
                                <p className="text-2xl font-bold text-emerald-600 mt-1">{fmt(data?.totalAmountAll ?? 0)}</p>
                            </div>
                            <div className="bg-white border border-[#CBCAD7] rounded-2xl p-5 hover:shadow-md transition-shadow">
                                <p className="text-xs font-semibold text-[#6B7280] uppercase">Hôm nay</p>
                                <p className="text-2xl font-bold text-blue-600 mt-1">{data?.todayCount ?? 0}</p>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
                                className="border border-[#CBCAD7] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 bg-white">
                                <option value="">Tất cả loại</option>
                                <option value="OrderPayment">Thanh toán</option>
                                <option value="ProviderPayment">Chi NCC</option>
                                <option value="Refund">Hoàn tiền</option>
                            </select>
                            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                                className="border border-[#CBCAD7] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 bg-white">
                                <option value="">Tất cả trạng thái</option>
                                <option value="Completed">Hoàn thành</option>
                                <option value="Pending">Chờ xử lý</option>
                                <option value="Processing">Đang xử lý</option>
                                <option value="Failed">Thất bại</option>
                                <option value="Cancelled">Đã hủy</option>
                            </select>
                        </div>

                        {/* Table */}
                        <div className="bg-white border border-[#CBCAD7] rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead><tr className="bg-[#F9FAFB] border-b border-[#CBCAD7]">
                                        <th className="text-left px-5 py-3 font-semibold text-[#6B7280] text-xs uppercase">Mã GD</th>
                                        <th className="text-left px-5 py-3 font-semibold text-[#6B7280] text-xs uppercase">Thời gian</th>
                                        <th className="text-left px-5 py-3 font-semibold text-[#6B7280] text-xs uppercase">Loại</th>
                                        <th className="text-right px-5 py-3 font-semibold text-[#6B7280] text-xs uppercase">Số tiền</th>
                                        <th className="text-left px-5 py-3 font-semibold text-[#6B7280] text-xs uppercase">Đơn hàng</th>
                                        <th className="text-left px-5 py-3 font-semibold text-[#6B7280] text-xs uppercase">Ví</th>
                                        <th className="text-left px-5 py-3 font-semibold text-[#6B7280] text-xs uppercase">Trạng thái</th>
                                    </tr></thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan={7} className="px-5 py-8 text-center text-[#9CA3AF]">Đang tải...</td></tr>
                                        ) : data?.items.length === 0 ? (
                                            <tr><td colSpan={7} className="px-5 py-8 text-center text-[#9CA3AF]">Không có giao dịch nào</td></tr>
                                        ) : data?.items.map((t: AdminTransactionDto) => (
                                            <tr key={t.id} className="border-b border-gray-100 hover:bg-[#F9FAFB] transition-colors">
                                                <td className="px-5 py-3 font-mono text-xs text-gray-500">{t.id.substring(0, 8).toUpperCase()}</td>
                                                <td className="px-5 py-3 text-gray-600">{new Date(t.createdAt).toLocaleString("vi-VN")}</td>
                                                <td className="px-5 py-3">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${TYPE_BADGES[t.transactionType]?.color ?? "bg-gray-100 text-gray-600"}`}>
                                                        {TYPE_BADGES[t.transactionType]?.label ?? t.transactionType}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-right font-bold text-[#1A1A2E]">{fmt(t.amount)}</td>
                                                <td className="px-5 py-3 font-mono text-xs text-[#4338CA]">{t.orderCode ?? "—"}</td>
                                                <td className="px-5 py-3 text-gray-600">{t.walletOwner ?? "—"}</td>
                                                <td className="px-5 py-3">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[t.status] ?? "bg-gray-100 text-gray-600"}`}>
                                                        {t.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                                    <span className="text-sm text-[#6B7280]">Trang {page}/{totalPages} ({data?.totalCount} giao dịch)</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                                            className="border border-[#CBCAD7] px-3 py-1.5 rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50">Trước</button>
                                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                                            className="border border-[#CBCAD7] px-3 py-1.5 rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50">Sau</button>
                                    </div>
                                </div>
                            )}
                        </div>

                    </main>
                </div>
            </div>
        </div>
    );
}
