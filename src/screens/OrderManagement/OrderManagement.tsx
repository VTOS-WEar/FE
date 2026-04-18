import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useState, useEffect, useCallback, useRef } from "react";
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useSidebarConfig } from "../../hooks/useSidebarConfig";
import { getSchoolOrders, type SchoolOrderDto } from "../../lib/api/orders";

/* ── Status config ── */
const STATUS_BADGE: Record<string, string> = {
    Pending: "nb-badge nb-badge-yellow",
    Paid: "nb-badge nb-badge-blue",
    Confirmed: "nb-badge nb-badge-purple",
    Processed: "nb-badge nb-badge-purple",
    Shipped: "nb-badge bg-[#FFEDD5] text-[#C2410C]",
    Delivered: "nb-badge nb-badge-green",
    Cancelled: "nb-badge nb-badge-red",
    Refunded: "nb-badge bg-gray-100 text-gray-500",
};
const STATUS_LABELS: Record<string, string> = {
    Pending: "Chờ thanh toán", Paid: "Đã thanh toán", Confirmed: "Đã xác nhận",
    Processed: "Đang xử lý", Shipped: "Đang giao", Delivered: "Đã giao",
    Cancelled: "Đã huỷ", Refunded: "Đã hoàn tiền",
};
const STATUS_OPTIONS = [
    { value: "", label: "Tất cả trạng thái" },
    { value: "Pending", label: "Chờ thanh toán" }, { value: "Paid", label: "Đã thanh toán" },
    { value: "Confirmed", label: "Đã xác nhận" }, { value: "Processed", label: "Đang xử lý" },
    { value: "Shipped", label: "Đang giao" }, { value: "Delivered", label: "Đã giao" },
    { value: "Cancelled", label: "Đã huỷ" }, { value: "Refunded", label: "Đã hoàn tiền" },
];

function formatVND(amount: number): string {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}
function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric" });
}

export const OrderManagement = (): JSX.Element => {
    const sidebarConfig = useSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();

    const [orders, setOrders] = useState<SchoolOrderDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 10;

    const [globalStats, setGlobalStats] = useState({ total: 0, processing: 0, completed: 0, cancelled: 0 });
    const [detail, setDetail] = useState<SchoolOrderDto | null>(null);

    const handleSearchChange = (value: string) => {
        setSearchInput(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => { setSearchTerm(value); setPage(1); }, 300);
    };

    const fetchGlobalStats = useCallback(async () => {
        try {
            const res = await getSchoolOrders(1, 200);
            const all = res.items || [];
            setGlobalStats({
                total: res.totalCount,
                processing: all.filter(o => ["Paid", "Confirmed", "Processed"].includes(o.orderStatus)).length,
                completed: all.filter(o => ["Shipped", "Delivered"].includes(o.orderStatus)).length,
                cancelled: all.filter(o => ["Cancelled", "Refunded"].includes(o.orderStatus)).length,
            });
        } catch { /* */ }
    }, []);

    useEffect(() => { fetchGlobalStats(); }, [fetchGlobalStats]);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getSchoolOrders(page, pageSize, statusFilter || undefined, searchTerm || undefined);
            setOrders(res.items); setTotal(res.totalCount);
        } catch (e: any) { console.error(e); }
        finally { setLoading(false); }
    }, [page, statusFilter, searchTerm]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} />
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                    <TopNavBar>
                        <Breadcrumb><BreadcrumbList>
                            <BreadcrumbItem><BreadcrumbLink href="/school/dashboard" className="font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                            <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                            <BreadcrumbItem><BreadcrumbPage className="font-bold text-gray-900 text-base">Đơn hàng</BreadcrumbPage></BreadcrumbItem>
                        </BreadcrumbList></Breadcrumb>
                    </TopNavBar>
                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6">

                        <h1 className="font-extrabold text-gray-900 text-[28px]">📦 Quản lý Đơn hàng</h1>

                        {/* Stats — NB stat cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                            <div className="nb-stat-card nb-stat-primary">
                                <div className="flex items-center gap-3">
                                    <div className="nb-stat-icon bg-violet-50"><span className="text-lg">📦</span></div>
                                    <div><p className="nb-stat-label">Tổng đơn hàng</p><p className="nb-stat-value mt-1">{globalStats.total}</p></div>
                                </div>
                            </div>
                            <div className="nb-stat-card">
                                <div className="flex items-center gap-3">
                                    <div className="nb-stat-icon bg-[#DBEAFE]"><span className="text-lg">⏳</span></div>
                                    <div><p className="nb-stat-label">Đang xử lý</p><p className="nb-stat-value text-[#3B82F6] mt-1">{globalStats.processing}</p></div>
                                </div>
                            </div>
                            <div className="nb-stat-card">
                                <div className="flex items-center gap-3">
                                    <div className="nb-stat-icon bg-[#D1FAE5]"><span className="text-lg">✅</span></div>
                                    <div><p className="nb-stat-label">Hoàn thành</p><p className="nb-stat-value text-[#10B981] mt-1">{globalStats.completed}</p></div>
                                </div>
                            </div>
                            <div className="nb-stat-card">
                                <div className="flex items-center gap-3">
                                    <div className="nb-stat-icon bg-[#FEE2E2]"><span className="text-lg">❌</span></div>
                                    <div><p className="nb-stat-label">Đã huỷ</p><p className="nb-stat-value text-red-500 mt-1">{globalStats.cancelled}</p></div>
                                </div>
                            </div>
                        </div>

                        {/* Search + Filter — NB */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex-1 min-w-[200px] relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none">🔍</span>
                                <input
                                    type="text"
                                    placeholder="Tìm theo tên phụ huynh hoặc học sinh..."
                                    value={searchInput}
                                    onChange={e => handleSearchChange(e.target.value)}
                                    className="nb-input w-full pl-10"
                                />
                            </div>
                            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                                className="nb-select text-sm min-w-[180px]">
                                {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>

                        {/* Order list — NB cards */}
                        {loading ? (
                            <div className="text-center py-16">
                                <div className="inline-block w-8 h-8 border-4 border-[#6938EF] border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="nb-card-static p-12 text-center">
                                <p className="text-4xl mb-3">📦</p>
                                <p className="font-medium text-gray-400">Chưa có đơn hàng nào.</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {orders.map(o => (
                                    <div key={o.orderId} onClick={() => setDetail(o)}
                                        className="nb-card p-5 cursor-pointer">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="font-bold text-gray-900 text-base">Đơn #{o.orderId.slice(0, 8).toUpperCase()}</h3>
                                                    <span className={STATUS_BADGE[o.orderStatus] || "nb-badge"}>{STATUS_LABELS[o.orderStatus] || o.orderStatus}</span>
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    👤 {o.parentName} · 👦 {o.childName}
                                                    {o.campaignName && <> · 🏷️ {o.campaignName}</>}
                                                </p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="font-extrabold text-lg text-gray-900">{formatVND(o.totalAmount)}</p>
                                                <p className="text-xs text-gray-400">{formatDate(o.orderDate)} · {o.itemCount} SP</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center gap-2">
                                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="nb-btn nb-btn-outline nb-btn-sm text-sm">← Trước</button>
                                <span className="flex items-center text-sm text-gray-500 px-2 font-bold">{page}/{totalPages}</span>
                                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="nb-btn nb-btn-outline nb-btn-sm text-sm">Sau →</button>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Detail Modal — NB style */}
            {detail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDetail(null)}>
                    <div className="bg-white rounded-md w-full max-w-md mx-4 p-6 border border-gray-200 shadow-soft-md" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="font-extrabold text-xl text-gray-900">📦 Chi tiết đơn hàng</h2>
                            <span className={STATUS_BADGE[detail.orderStatus] || "nb-badge"}>{STATUS_LABELS[detail.orderStatus] || detail.orderStatus}</span>
                        </div>
                        <div className="space-y-3 text-sm">
                            <InfoRow label="Mã đơn" value={detail.orderId} />
                            <InfoRow label="Phụ huynh" value={detail.parentName} />
                            <InfoRow label="Học sinh" value={detail.childName} />
                            <InfoRow label="Chiến dịch" value={detail.campaignName || "—"} />
                            <InfoRow label="Số sản phẩm" value={String(detail.itemCount)} />
                            <InfoRow label="Tổng tiền" value={formatVND(detail.totalAmount)} />
                            <InfoRow label="Ngày đặt" value={formatDate(detail.orderDate)} />
                        </div>
                        <div className="flex gap-3 mt-5">
                            <button onClick={() => setDetail(null)} className="flex-1 nb-btn nb-btn-outline text-sm">Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex gap-3">
            <span className="min-w-[100px] font-bold text-gray-500 text-sm">{label}:</span>
            <span className="text-gray-900 text-sm font-medium break-all">{value}</span>
        </div>
    );
}
