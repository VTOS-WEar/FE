import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardSidebar } from "../../components/layout";
import { useAdminSidebarConfig } from "../../hooks/useAdminSidebarConfig";
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { getAdminTransactions, type AdminTransactionDto, type AdminTransactionListResult } from "../../lib/api/admin";

const TYPE_BADGES: Record<string, { label: string; cls: string }> = {
    OrderPayment: { label: "Thanh toán", cls: "nb-badge nb-badge-green" },
    ProviderPayment: { label: "Chi Nhà Cung Cấp", cls: "nb-badge nb-badge-blue" },
    Refund: { label: "Hoàn tiền", cls: "nb-badge nb-badge-yellow" },
};

const STATUS_BADGE: Record<string, string> = {
    Completed: "nb-badge nb-badge-green",
    Pending: "nb-badge nb-badge-yellow",
    Processing: "nb-badge nb-badge-blue",
    Failed: "nb-badge nb-badge-red",
    Cancelled: "nb-badge bg-[#F3F4F6] text-[#6B7280]",
    Refunded: "nb-badge nb-badge-purple",
};

const fmt = (n: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

export default function AdminTransactions() {
    const navigate = useNavigate();
    const sidebarConfig = useAdminSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
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
                            <BreadcrumbItem><BreadcrumbPage className="font-bold text-[#1A1A2E] text-base">Giao dịch</BreadcrumbPage></BreadcrumbItem>
                        </BreadcrumbList></Breadcrumb>
                    </div>
                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6 nb-fade-in">

                        <h1 className="font-extrabold text-[#1A1A2E] text-[28px]">💳 Theo dõi giao dịch</h1>

                        {/* Summary cards — NB stat cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 nb-stagger">
                            <div className="nb-stat-card nb-card-purple">
                                <p className="nb-stat-label">Tổng giao dịch</p>
                                <p className="nb-stat-value mt-1">{data?.totalCount ?? 0}</p>
                            </div>
                            <div className="nb-stat-card nb-card-green">
                                <p className="nb-stat-label">Tổng giá trị</p>
                                <p className="nb-stat-value text-[#10B981] mt-1">{fmt(data?.totalAmountAll ?? 0)}</p>
                            </div>
                            <div className="nb-stat-card nb-card-blue">
                                <p className="nb-stat-label">Hôm nay</p>
                                <p className="nb-stat-value text-[#3B82F6] mt-1">{data?.todayCount ?? 0}</p>
                            </div>
                        </div>

                        {/* Filters — NB selects */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
                                className="nb-select text-sm">
                                <option value="">Tất cả loại</option>
                                <option value="OrderPayment">Thanh toán</option>
                                <option value="ProviderPayment">Chi Nhà Cung Cấp</option>
                                <option value="Refund">Hoàn tiền</option>
                            </select>
                            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                                className="nb-select text-sm">
                                <option value="">Tất cả trạng thái</option>
                                <option value="Completed">Hoàn thành</option>
                                <option value="Pending">Chờ xử lý</option>
                                <option value="Processing">Đang xử lý</option>
                                <option value="Failed">Thất bại</option>
                                <option value="Cancelled">Đã hủy</option>
                            </select>
                        </div>

                        {/* Table — NB table */}
                        <div className="nb-card-static overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className={`nb-table ${!loading && (data?.items.length ?? 0) > 0 ? "nb-table-animate" : ""}`}>
                                    <thead><tr>
                                        <th>Mã GD</th>
                                        <th>Thời gian</th>
                                        <th>Loại</th>
                                        <th className="text-right">Số tiền</th>
                                        <th>Đơn hàng</th>
                                        <th>Ví</th>
                                        <th>Trạng thái</th>
                                    </tr></thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan={7} className="px-5 py-8 text-center text-[#9CA3AF]">Đang tải...</td></tr>
                                        ) : data?.items.length === 0 ? (
                                            <tr><td colSpan={7} className="px-5 py-8 text-center text-[#9CA3AF]">Không có giao dịch nào</td></tr>
                                        ) : data?.items.map((t: AdminTransactionDto) => (
                                            <tr key={t.id}>
                                                <td className="font-mono text-xs text-gray-500">{t.id.substring(0, 8).toUpperCase()}</td>
                                                <td>{new Date(t.createdAt).toLocaleString("vi-VN")}</td>
                                                <td>
                                                    <span className={TYPE_BADGES[t.transactionType]?.cls ?? "nb-badge"}>
                                                        {TYPE_BADGES[t.transactionType]?.label ?? t.transactionType}
                                                    </span>
                                                </td>
                                                <td className="text-right font-extrabold text-[#1A1A2E]">{fmt(t.amount)}</td>
                                                <td className="font-mono text-xs text-[#4338CA]">{t.orderCode ?? "—"}</td>
                                                <td>{t.walletOwner ?? "—"}</td>
                                                <td>
                                                    <span className={STATUS_BADGE[t.status] ?? "nb-badge"}>
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
                                <div className="flex items-center justify-between px-5 py-3 border-t-2 border-[#1A1A2E] bg-[#F9FAFB]">
                                    <span className="text-sm text-[#6B7280] font-semibold">Trang {page}/{totalPages} ({data?.totalCount} giao dịch)</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                                            className="nb-btn nb-btn-outline nb-btn-sm text-sm disabled:opacity-40">Trước</button>
                                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                                            className="nb-btn nb-btn-outline nb-btn-sm text-sm disabled:opacity-40">Sau</button>
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
