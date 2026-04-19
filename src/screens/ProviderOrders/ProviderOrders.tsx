import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Loader2, Package, ShoppingBag, Truck } from "lucide-react";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useProviderSidebarConfig } from "../../hooks/useProviderSidebarConfig";
import { getProviderDirectOrderStats, getProviderDirectOrders, type ProviderIncomingOrderItemDto, type ProviderOrderStatsDto } from "../../lib/api/providers";

const STATUSES = ["", "Pending", "Paid", "Accepted", "InProduction", "ReadyToShip", "Shipped", "Delivered", "Cancelled"];

function formatCurrency(value: number) {
    return `${value.toLocaleString("vi-VN")} ₫`;
}

function getStatusClass(status: string) {
    const normalized = status.toLowerCase();
    if (normalized.includes("cancel")) return "nb-badge nb-badge-red";
    if (normalized.includes("deliver")) return "nb-badge nb-badge-green";
    if (normalized.includes("ship")) return "nb-badge nb-badge-blue";
    if (normalized.includes("production") || normalized.includes("ready")) return "nb-badge nb-badge-purple";
    if (normalized.includes("paid") || normalized.includes("accept")) return "nb-badge nb-badge-blue";
    return "nb-badge nb-badge-yellow";
}

export function ProviderOrders(): JSX.Element {
    const sidebarConfig = useProviderSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [orders, setOrders] = useState<ProviderIncomingOrderItemDto[]>([]);
    const [stats, setStats] = useState<ProviderOrderStatsDto | null>(null);
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let disposed = false;
        setLoading(true);

        Promise.all([getProviderDirectOrders(1, 20, status || undefined), getProviderDirectOrderStats()])
            .then(([orderResponse, statsResponse]) => {
                if (disposed) return;
                setOrders(orderResponse.items);
                setStats(statsResponse);
            })
            .finally(() => {
                if (!disposed) setLoading(false);
            });

        return () => {
            disposed = true;
        };
    }, [status]);

    const cards = useMemo(() => [
        { label: "Tổng đơn", value: stats?.totalOrders ?? 0 },
        { label: "Chờ xử lý", value: stats?.pendingOrders ?? 0 },
        { label: "Đang thực hiện", value: stats?.inProgressOrders ?? 0 },
        { label: "Doanh thu", value: formatCurrency(stats?.totalRevenue ?? 0) },
    ], [stats]);

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} />
                </div>

                <div className="flex-1 flex-col min-w-0">
                    <TopNavBar>
                        <h1 className="text-2xl font-extrabold text-gray-900">Đơn hàng trực tiếp</h1>
                        <p className="mt-1 text-sm font-medium text-gray-500">Inbox đơn mới từ phụ huynh, theo dõi trạng thái sản xuất và giao hàng.</p>
                    </TopNavBar>

                    <main className="space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {cards.map((card) => (
                                <div key={card.label} className="rounded-[22px] border border-gray-200 bg-white p-5 shadow-soft-sm">
                                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-400">{card.label}</p>
                                    <p className="mt-3 text-2xl font-extrabold text-gray-900">{card.value}</p>
                                </div>
                            ))}
                        </div>

                        <div className="rounded-[22px] border border-gray-200 bg-white p-4 shadow-soft-sm">
                            <div className="flex flex-wrap gap-2">
                                {STATUSES.map((item) => (
                                    <button key={item || "all"} onClick={() => setStatus(item)} className={`rounded-full border px-4 py-2 text-sm font-extrabold transition-all ${status === item ? "border-violet-400 bg-violet-500 text-white" : "border-gray-200 bg-slate-50 text-gray-700"}`}>
                                        {item || "Tất cả"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex min-h-[260px] items-center justify-center gap-3 rounded-[24px] border border-gray-200 bg-white shadow-soft-sm">
                                <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
                                <span className="text-sm font-bold text-gray-600">Đang tải đơn hàng...</span>
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="rounded-[24px] border border-dashed border-gray-300 bg-white p-10 text-center shadow-soft-sm">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] border border-gray-200 bg-violet-50">
                                    <ShoppingBag className="h-7 w-7 text-violet-500" />
                                </div>
                                <h2 className="mt-5 text-xl font-extrabold text-gray-900">Chưa có direct order nào</h2>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {orders.map((order) => (
                                    <Link key={order.orderId} to={`/provider/orders/${order.orderId}`} className="block overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-soft-sm transition-all hover:-translate-y-1 hover:shadow-soft-md">
                                        <div className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:p-6">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className={getStatusClass(order.orderStatus)}>{order.orderStatus}</span>
                                                    <span className="rounded-full border border-gray-200 bg-slate-50 px-3 py-1 text-[11px] font-bold text-gray-500">{order.itemCount} item</span>
                                                </div>
                                                <h2 className="mt-3 text-lg font-extrabold text-gray-900">{order.parentName}</h2>
                                                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-gray-500">
                                                    <span className="inline-flex items-center gap-1.5"><Package className="h-4 w-4 text-violet-500" />Học sinh: <span className="font-bold text-gray-900">{order.childName}</span></span>
                                                    <span className="inline-flex items-center gap-1.5"><ShoppingBag className="h-4 w-4 text-violet-500" />Ngày đặt: <span className="font-bold text-gray-900">{new Date(order.orderDate).toLocaleString("vi-VN")}</span></span>
                                                    {order.trackingCode && <span className="inline-flex items-center gap-1.5"><Truck className="h-4 w-4 text-violet-500" />Tracking: <span className="font-bold text-gray-900">{order.trackingCode}</span></span>}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between gap-4 md:flex-col md:items-end md:justify-center">
                                                <p className="text-xl font-extrabold text-violet-600">{formatCurrency(order.totalAmount)}</p>
                                                <span className="inline-flex items-center gap-1 text-sm font-extrabold text-gray-900">
                                                    Chi tiết
                                                    <ChevronRight className="h-4 w-4" />
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
