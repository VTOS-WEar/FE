import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, ChevronRight, Clock, Loader2, Package, Settings, ShoppingBag, TrendingUp, Truck } from "lucide-react";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useProviderSidebarConfig } from "../../hooks/useProviderSidebarConfig";
import { acceptDirectOrder, getProviderDirectOrderStats, getProviderDirectOrders, markDirectOrderInProduction, markDirectOrderReadyToShip, type ProviderIncomingOrderItemDto, type ProviderOrderStatsDto } from "../../lib/api/providers";
import { useToast } from "../../contexts/ToastContext";

const ORDER_STATUS_MAP: Record<string, { label: string; class: string }> = {
    "Pending": { label: "Chờ xử lý", class: "nb-badge-yellow" },
    "Paid": { label: "Đã thanh toán", class: "nb-badge-blue" },
    "Accepted": { label: "Đã tiếp nhận", class: "nb-badge-blue" },
    "InProduction": { label: "Đang sản xuất", class: "nb-badge-purple" },
    "ReadyToShip": { label: "Chờ giao hàng", class: "nb-badge-purple" },
    "Shipped": { label: "Đang giao", class: "nb-badge-blue" },
    "Delivered": { label: "Đã giao", class: "nb-badge-green" },
    "Cancelled": { label: "Đã hủy", class: "nb-badge-red" },
    "Refunded": { label: "Đã hoàn tiền", class: "nb-badge-red" },
};

const STATUS_FILTER_OPTIONS = [
    { value: "", label: "Tất cả" },
    { value: "Pending", label: "Chờ xử lý" },
    { value: "Paid", label: "Đã thanh toán" },
    { value: "Accepted", label: "Đã tiếp nhận" },
    { value: "InProduction", label: "Đang sản xuất" },
    { value: "ReadyToShip", label: "Chờ giao hàng" },
    { value: "Shipped", label: "Đang giao" },
    { value: "Delivered", label: "Đã giao" },
    { value: "Cancelled", label: "Đã hủy" },
];

function formatCurrency(value: number) {
    return `${value.toLocaleString("vi-VN")} ₫`;
}

function getStatusBadge(status: string) {
    const config = ORDER_STATUS_MAP[status] || { label: status, class: "nb-badge-yellow" };
    return <span className={`nb-badge ${config.class}`}>{config.label}</span>;
}

export function ProviderOrders(): JSX.Element {
    const sidebarConfig = useProviderSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [orders, setOrders] = useState<ProviderIncomingOrderItemDto[]>([]);
    const [stats, setStats] = useState<ProviderOrderStatsDto | null>(null);
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
    const { showToast } = useToast();

    const navigate = useNavigate();
    const fetchData = useCallback(() => {
        setLoading(true);
        Promise.all([getProviderDirectOrders(1, 40, status || undefined), getProviderDirectOrderStats()])
            .then(([orderResponse, statsResponse]) => {
                setOrders(orderResponse.items);
                setStats(statsResponse);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [status]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const doAction = async (fn: () => Promise<void>) => {
        setSubmitting(true);
        try {
            await fn();
            showToast({
                title: "Thành công",
                message: "Cập nhật trạng thái đơn hàng thành công!",
                variant: "success",
            });
            fetchData();
            setConfirmAction(null);
        } catch (err: any) {
            showToast({
                title: "Lỗi",
                message: err.message || "Có lỗi xảy ra khi cập nhật trạng thái",
                variant: "error",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const confirmStatusChange = (title: string, message: string, fn: () => Promise<void>) => {
        setConfirmAction({
            title,
            message,
            onConfirm: () => doAction(fn),
        });
    };

    const getNextAction = (order: ProviderIncomingOrderItemDto) => {
        if (order.orderStatus === "Paid") {
            return {
                label: "Tiếp nhận đơn",
                onClick: () => confirmStatusChange(
                    "Tiếp nhận đơn hàng?",
                    "Bạn xác nhận sẽ xử lý đơn hàng này?",
                    () => acceptDirectOrder(order.orderId)
                ),
            };
        }
        if (order.orderStatus === "Accepted") {
            return {
                label: "Bắt đầu sản xuất",
                onClick: () => confirmStatusChange(
                    "Bắt đầu sản xuất?",
                    "Đơn hàng sẽ được chuyển sang trạng thái đang sản xuất.",
                    () => markDirectOrderInProduction(order.orderId)
                ),
            };
        }
        if (order.orderStatus === "InProduction") {
            return {
                label: "Xác nhận có hàng",
                onClick: () => confirmStatusChange(
                    "Đã sản xuất xong?",
                    "Xác nhận sản phẩm đã sẵn sàng để giao cho đơn vị vận chuyển.",
                    () => markDirectOrderReadyToShip(order.orderId)
                ),
            };
        }
        return null;
    };

    const dashboardMetrics = useMemo(() => [
        { label: "Doanh thu", value: formatCurrency(stats?.totalRevenue ?? 0), icon: TrendingUp, color: "emerald" },
        { label: "Chờ tiếp nhận", value: stats?.paidOrders ?? 0, icon: Clock, color: "amber" },
        { label: "Đang sản xuất", value: stats?.inProgressOrders ?? 0, icon: Settings, color: "violet" },
        { label: "Hoàn tất giao", value: stats?.completedShipmentOrders ?? 0, icon: CheckCircle, color: "blue" },
    ], [stats]);

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} />
                </div>

                <div className="flex-1 flex-col min-w-0">
                    <TopNavBar>
                        <div className="flex items-center gap-3 px-2 py-2">
                            <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-soft-sm">
                                <ShoppingBag className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="text-xl font-extrabold text-gray-900 leading-none">Quản lý đơn hàng</h1>
                                <p className="mt-1 text-[12px] font-semibold text-gray-400">Theo dõi sản xuất & giao nhận trực tiếp</p>
                            </div>
                        </div>
                    </TopNavBar>

                    <main className="space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        {/* Metrics Grid */}
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {dashboardMetrics.map((card) => {
                                const Icon = card.icon;
                                const colorMap: Record<string, string> = {
                                    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
                                    amber: "bg-amber-50 text-amber-600 border-amber-100",
                                    violet: "bg-violet-50 text-violet-600 border-violet-100",
                                    blue: "bg-blue-50 text-blue-600 border-blue-100",
                                };
                                const iconMap: Record<string, string> = {
                                    emerald: "bg-emerald-500",
                                    amber: "bg-amber-500",
                                    violet: "bg-violet-500",
                                    blue: "bg-blue-500",
                                };

                                const colorStyles = colorMap[card.color] || colorMap.violet;
                                const iconStyles = iconMap[card.color] || iconMap.violet;

                                return (
                                    <div key={card.label} className={`group relative overflow-hidden rounded-[20px] border ${colorStyles.split(' ')[2]} ${colorStyles.split(' ')[0]} p-5 transition-all hover:scale-[1.02] active:scale-[0.98]`}>
                                        <div className="relative z-10 flex flex-col gap-3">
                                            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconStyles} text-white shadow-soft-sm group-hover:rotate-6 transition-transform`}>
                                                <Icon className="h-4.5 w-4.5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-[#97A3B6]">{card.label}</p>
                                                <p className={`mt-0.5 text-xl font-black ${colorStyles.split(' ')[1]}`}>{card.value}</p>
                                            </div>
                                        </div>
                                        <div className={`absolute -right-3 -bottom-3 h-20 w-20 rounded-full opacity-10 ${iconStyles}`} />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Work Progress Overview */}
                        <div className="rounded-[32px] border border-gray-200 bg-white p-8 shadow-soft-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <div>
                                    <h3 className="text-lg font-black text-gray-900">Tiến độ công việc</h3>
                                    <p className="text-[13px] font-semibold text-gray-400">Tổng quan trạng thái xử lý đơn hàng</p>
                                </div>
                                <div className="flex -space-x-2 overflow-hidden">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="inline-block h-8 w-8 rounded-full border-2 border-white bg-slate-100" />
                                    ))}
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-violet-600 text-[10px] font-black text-white">+</div>
                                </div>
                            </div>

                            <div className="h-4 w-full flex overflow-hidden rounded-full bg-slate-100 border border-slate-200 shadow-soft-xs">
                                {(() => {
                                    const total = stats?.totalOrders || 1;
                                    const p1 = ((stats?.paidOrders || 0) / total) * 100;
                                    const p2 = ((stats?.inProgressOrders || 0) / total) * 100;
                                    const p3 = ((stats?.completedShipmentOrders || 0) / total) * 100;
                                    const p4 = Math.max(0, 100 - p1 - p2 - p3);

                                    return (
                                        <>
                                            <div style={{ width: `${p1}%` }} className="bg-amber-500 border-r border-white/20" />
                                            <div style={{ width: `${p2}%` }} className="bg-violet-500 border-r border-white/20" />
                                            <div style={{ width: `${p3}%` }} className="bg-blue-500 border-r border-white/20" />
                                            <div style={{ width: `${p4}%` }} className="bg-slate-300" />
                                        </>
                                    );
                                })()}
                            </div>

                            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                                    <span className="text-[11px] font-black text-gray-500 uppercase">Chờ tiếp nhận ({stats?.paidOrders ?? 0})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-violet-500" />
                                    <span className="text-[11px] font-black text-gray-500 uppercase">Đang sản xuất ({stats?.inProgressOrders ?? 0})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                                    <span className="text-[11px] font-black text-gray-500 uppercase">Đã giao ({stats?.completedShipmentOrders ?? 0})</span>
                                </div>
                            </div>
                        </div>

                        {/* Status Filters */}
                        <div className="rounded-[20px] border border-gray-200 bg-white p-2.5 shadow-soft-sm overflow-x-auto">
                            <div className="flex gap-4 min-w-max px-2 py-1.5">
                                {STATUS_FILTER_OPTIONS.map((item) => {
                                    const count = item.value === ""
                                        ? stats?.totalOrders
                                        : stats?.statusCounts?.[item.value] || 0;

                                    return (
                                        <div key={item.value || "all"} className="relative">
                                            <button
                                                onClick={() => setStatus(item.value)}
                                                className={`h-10 rounded-[14px] px-5 py-2 text-[13px] font-black transition-all ${status === item.value
                                                    ? "bg-violet-600 text-white shadow-soft-md scale-[1.02]"
                                                    : "text-[#6F6A7D] border border-gray-50 bg-slate-50/30 hover:bg-slate-50 hover:text-gray-900"
                                                    }`}
                                            >
                                                {item.label}
                                            </button>
                                            {count !== undefined && count > 0 && (
                                                <span className={`absolute -top-2 -right-2 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-white px-1.5 text-[10px] font-black shadow-soft-sm animate-in zoom-in duration-300 ${status === item.value
                                                    ? "bg-emerald-500 text-white"
                                                    : "bg-slate-800 text-white"
                                                    }`}>
                                                    {count}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Order Grid */}
                        {loading ? (
                            <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-[32px] border border-gray-200 bg-white shadow-soft-sm">
                                <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
                                <p className="font-black text-gray-400 uppercase tracking-widest text-xs">Đang đồng bộ dữ liệu...</p>
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="rounded-[32px] border border-dashed border-gray-300 bg-white p-20 text-center shadow-soft-sm">
                                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] border border-gray-100 bg-violet-50">
                                    <ShoppingBag className="h-9 w-9 text-violet-500" />
                                </div>
                                <h2 className="mt-6 text-xl font-black text-gray-900">Không tìm thấy đơn hàng</h2>
                                <p className="mt-2 text-sm font-medium text-gray-500 italic">"Hãy thử thay đổi trạng thái lọc."</p>
                            </div>
                        ) : (
                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {orders.map((order) => {
                                    const action = getNextAction(order);
                                    const isToday = new Date(order.orderDate).toDateString() === new Date().toDateString();

                                    return (
                                        <div
                                            key={order.orderId}
                                            onClick={() => navigate(`/provider/orders/${order.orderId}`)}
                                            className="group relative flex flex-col overflow-hidden rounded-[16px] border border-gray-100 bg-white shadow-soft-xs transition-all hover:border-violet-200 hover:shadow-soft-sm cursor-pointer"
                                        >
                                            {/* compact header */}
                                            <div className="bg-white px-3.5 py-3 flex items-center justify-between border-b border-gray-50">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-[12px] font-black text-gray-900 leading-none">#{order.orderId.slice(0, 8).toUpperCase()}</span>
                                                    {isToday && <div className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100 shadow-sm" />}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[11px] font-bold text-gray-400">{new Date(order.orderDate).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit' })}</span>
                                                    <div className="transform scale-80 origin-right">{getStatusBadge(order.orderStatus)}</div>
                                                </div>
                                            </div>

                                            {/* minimalist body */}
                                            <div className="p-4 flex-1 space-y-3">
                                                <div className="space-y-1">
                                                    <p className="text-[14px] font-bold text-gray-900 truncate" title={order.parentName}>{order.parentName}</p>
                                                    <p className="text-[12px] font-medium text-gray-500 truncate">Sản phẩm cho: {order.childName}</p>
                                                </div>

                                                <div className="flex items-center justify-between text-[12px]">
                                                    <div className="flex items-center gap-1.5 font-bold text-gray-500">
                                                        <Package className="h-3.5 w-3.5 text-violet-400" />
                                                        <span>{order.itemCount} món</span>
                                                    </div>
                                                    <span className="font-black text-violet-600 text-[13px]">{formatCurrency(order.totalAmount)}</span>
                                                </div>
                                            </div>

                                            {/* compact action */}
                                            <div className="px-4 pb-4 pt-1">
                                                {action ? (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            e.preventDefault();
                                                            action.onClick();
                                                        }}
                                                        className="w-full h-9 flex items-center justify-center rounded-xl bg-violet-600 text-[12px] font-black text-white shadow-soft-xs transition-all hover:bg-violet-700 active:scale-95"
                                                    >
                                                        {action.label.replace('Chuyển sang ', '')}
                                                    </button>
                                                ) : (
                                                    <Link
                                                        to={`/provider/orders/${order.orderId}`}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="w-full h-9 flex items-center justify-center rounded-xl bg-slate-50 text-[11px] font-black text-[#6F6A7D] hover:bg-slate-100 transition-all"
                                                    >
                                                        Xem chi tiết
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Confirm Modal */}
            {confirmAction && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmAction(null)} />
                    <div className="relative w-full max-w-[380px] overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-soft-xl animate-in fade-in zoom-in duration-200">
                        <div className="bg-violet-50 px-6 py-4 border-b border-violet-100">
                            <h3 className="text-lg font-black text-gray-900">{confirmAction.title}</h3>
                        </div>
                        <div className="px-6 py-6">
                            <p className="text-[14px] font-semibold text-gray-600 leading-relaxed italic">
                                "{confirmAction.message}"
                            </p>
                            <div className="mt-6 flex gap-2.5">
                                <button onClick={() => setConfirmAction(null)} className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-[13px] font-black text-gray-900 transition-all hover:bg-slate-50">
                                    Quay lại
                                </button>
                                <button onClick={confirmAction.onConfirm} disabled={submitting} className="flex-1 rounded-xl bg-violet-600 py-3 text-[13px] font-black text-white shadow-soft-sm transition-all hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center gap-2">
                                    {submitting && <Loader2 className="h-4 w-4 animate-spin text-white" />}
                                    Xác nhận
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
