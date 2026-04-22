import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ChevronRight, Loader2, Package, Search, Truck } from "lucide-react";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { useToast } from "../../contexts/ToastContext";
import { getMyDirectOrders, type MyDirectOrderListItemDto } from "../../lib/api/orders";

const STATUS_OPTIONS = ["Pending", "Paid", "Accepted", "InProduction", "ReadyToShip", "Shipped", "Delivered", "Cancelled"];

function formatCurrency(value: number) {
    return `${value.toLocaleString("vi-VN")} ₫`;
}

function getBadgeClass(status: string) {
    const normalized = status.toLowerCase();
    if (normalized.includes("cancel")) return "nb-badge nb-badge-red";
    if (normalized.includes("deliver")) return "nb-badge nb-badge-green";
    if (normalized.includes("ship")) return "nb-badge nb-badge-blue";
    if (normalized.includes("production") || normalized.includes("ready")) return "nb-badge nb-badge-purple";
    if (normalized.includes("paid") || normalized.includes("accept")) return "nb-badge nb-badge-blue";
    return "nb-badge nb-badge-yellow";
}

export function MyOrders(): JSX.Element {
    const { showToast } = useToast();
    const [orders, setOrders] = useState<MyDirectOrderListItemDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("");

    useEffect(() => {
        let disposed = false;
        setLoading(true);
        getMyDirectOrders(1, 20, status || undefined)
            .then((response) => {
                if (!disposed) setOrders(response.items);
            })
            .catch((error: unknown) => {
                if (!disposed) {
                    showToast({
                        title: "Không tải được đơn hàng",
                        message: error instanceof Error ? error.message : "Đã có lỗi xảy ra.",
                        variant: "error",
                    });
                }
            })
            .finally(() => {
                if (!disposed) setLoading(false);
            });

        return () => {
            disposed = true;
        };
    }, [showToast, status]);

    const deliveredCount = useMemo(() => orders.filter((order) => order.orderStatusName === "Delivered").length, [orders]);

    return (
        <GuestLayout bgColor="#f8fafc">
            <div className="mx-auto max-w-[1080px] px-6 py-10 lg:px-8">
                <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-soft-md">
                    <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
                        <div className="space-y-5 border-b border-gray-200 p-6 lg:border-b-0 lg:border-r lg:p-8">
                            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-violet-500">My Direct Orders</p>
                            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Đơn hàng trực tiếp của tôi</h1>
                            <p className="text-sm font-medium text-gray-500">
                                Theo dõi các đơn được đặt qua semester catalog, xem trạng thái fulfillment của nhà cung cấp và tra mã vận đơn.
                            </p>
                        </div>
                        <div className="grid gap-4 bg-slate-50 p-6 sm:grid-cols-3 lg:p-8">
                            <div className="rounded-[20px] border border-gray-200 bg-white p-4 shadow-soft-sm">
                                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-400">Tổng đơn</p>
                                <p className="mt-2 text-2xl font-extrabold text-gray-900">{orders.length}</p>
                            </div>
                            <div className="rounded-[20px] border border-gray-200 bg-white p-4 shadow-soft-sm">
                                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-400">Đã giao</p>
                                <p className="mt-2 text-2xl font-extrabold text-emerald-600">{deliveredCount}</p>
                            </div>
                            <div className="rounded-[20px] border border-gray-200 bg-white p-4 shadow-soft-sm">
                                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-400">Bộ lọc</p>
                                <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-2 w-full rounded-[12px] border border-gray-200 px-3 py-2 text-sm font-bold text-gray-900 outline-none">
                                    <option value="">Tất cả</option>
                                    {STATUS_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 space-y-4">
                    {loading ? (
                        <div className="flex min-h-[240px] items-center justify-center gap-3 rounded-[24px] border border-gray-200 bg-white shadow-soft-sm">
                            <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
                            <span className="text-sm font-bold text-gray-600">Đang tải đơn hàng...</span>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="rounded-[24px] border border-dashed border-gray-300 bg-white p-10 text-center shadow-soft-sm">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] border border-gray-200 bg-violet-50">
                                <Search className="h-7 w-7 text-violet-500" />
                            </div>
                            <h2 className="mt-5 text-xl font-extrabold text-gray-900">Chưa có đơn hàng phù hợp</h2>
                            <p className="mt-2 text-sm font-medium text-gray-500">Bạn có thể bắt đầu từ trang catalog học kỳ của trường để tạo direct order.</p>
                        </div>
                    ) : (
                        orders.map((order) => (
                            <Link key={order.orderId} to={`/my-orders/${order.orderId}`} className="block overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-soft-sm transition-all hover:-translate-y-1 hover:shadow-soft-md">
                                <div className="grid gap-4 p-5 md:grid-cols-[88px_1fr_auto] md:p-6">
                                    <div className="flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-[20px] border border-gray-200 bg-slate-50">
                                        {order.firstItemImageUrl ? <img src={order.firstItemImageUrl} alt={order.childName} className="h-full w-full object-cover" /> : <Package className="h-8 w-8 text-gray-400" />}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={getBadgeClass(order.orderStatusName)}>{order.orderStatusName}</span>
                                            {order.paymentStatusName && <span className="rounded-full border border-gray-200 bg-slate-50 px-3 py-1 text-[11px] font-bold text-gray-500">{order.paymentStatusName}</span>}
                                        </div>
                                        <h2 className="mt-3 text-lg font-extrabold text-gray-900">{order.providerName}</h2>
                                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-gray-500">
                                            <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-violet-500" />{new Date(order.orderDate).toLocaleString("vi-VN")}</span>
                                            <span className="inline-flex items-center gap-1.5"><Package className="h-4 w-4 text-violet-500" />Học sinh: <span className="font-bold text-gray-900">{order.childName}</span></span>
                                            {order.trackingCode && <span className="inline-flex items-center gap-1.5"><Truck className="h-4 w-4 text-violet-500" />Mã vận đơn: <span className="font-bold text-gray-900">{order.trackingCode}</span></span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 md:flex-col md:items-end md:justify-center">
                                        <p className="text-xl font-extrabold text-violet-600">{formatCurrency(order.totalAmount)}</p>
                                        <span className="inline-flex items-center gap-1 text-sm font-extrabold text-gray-900">
                                            Xem chi tiết
                                            <ChevronRight className="h-4 w-4" />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </GuestLayout>
    );
}
