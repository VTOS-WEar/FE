import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    AlertTriangle,
    ArrowLeft,
    Calendar,
    CheckCircle2,
    DollarSign,
    Loader2,
    MapPin,
    Package,
    ShieldCheck,
    ShoppingBag,
    Star,
    Truck,
    RotateCcw,
    CreditCard,
    Clock3,
} from "lucide-react";
import { ApiError } from "../../../lib/api/clients";
import {
    confirmDirectOrderDelivery,
    getMyDirectOrderDetail,
    getOrderDetail,
    type MyDirectOrderDetailDto,
    type MyDirectOrderDetailItemDto,
    type OrderDetailDto,
    type OrderItemDto,
} from "../../../lib/api/orders";

function fmt(amount: number) {
    return `${amount.toLocaleString("vi-VN")} ₫`;
}

function fmtDate(iso: string) {
    return new Date(iso).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function deliveryMethodLabel(value?: string | null) {
    switch (value) {
        case "HomeDelivery":
            return "Nhận tại nhà";
        default:
            return value || "";
    }
}

const ORDER_STEPS = [
    { key: "Paid", label: "Đã thanh toán", icon: "💳" },
    { key: "Confirmed", label: "Đã xác nhận", icon: "✅" },
    { key: "Processed", label: "Đang xử lý", icon: "📦" },
    { key: "Shipped", label: "Đang giao", icon: "🚚" },
    { key: "Delivered", label: "Đã nhận", icon: "🎉" },
];

const STATUS_ORDER: Record<string, number> = {
    Pending: 0,
    Paid: 1,
    Confirmed: 2,
    Processed: 3,
    Shipped: 4,
    Delivered: 5,
    Cancelled: -1,
    Refunded: -2,
};

const STATUS_LABELS: Record<string, string> = {
    Pending: "Chờ thanh toán",
    Paid: "Đã thanh toán",
    Confirmed: "Đã xác nhận",
    Processed: "Đang xử lý",
    Shipped: "Đang giao",
    Delivered: "Đã nhận",
    Cancelled: "Đã hủy",
    Refunded: "Đã hoàn tiền",
    Accepted: "Đã tiếp nhận",
    InProduction: "Đang sản xuất",
    ReadyToShip: "Sẵn sàng giao",
};

type OrderPageState =
    | { type: "legacy"; order: OrderDetailDto }
    | { type: "direct"; order: MyDirectOrderDetailDto }
    | { type: "missing" };

function getStatusLabel(status: string | null | undefined) {
    if (!status) return "Không xác định";
    return STATUS_LABELS[status] || status;
}

function getStatusMeta(status: string | null | undefined) {
    const normalized = (status || "").toLowerCase();
    switch (normalized) {
        case "paid":
        case "completed":
            return { label: "Đã thanh toán", chip: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CreditCard className="h-4 w-4" /> };
        case "confirmed":
            return { label: "Đã xác nhận", chip: "bg-blue-50 text-blue-700 border-blue-200", icon: <CheckCircle2 className="h-4 w-4" /> };
        case "processed":
            return { label: "Đang xử lý", chip: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: <Package className="h-4 w-4" /> };
        case "shipped":
            return { label: "Đang giao", chip: "bg-cyan-50 text-cyan-700 border-cyan-200", icon: <Truck className="h-4 w-4" /> };
        case "delivered":
            return { label: "Đã nhận", chip: "bg-green-50 text-green-700 border-green-200", icon: <CheckCircle2 className="h-4 w-4" /> };
        case "pending":
            return { label: "Chờ thanh toán", chip: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock3 className="h-4 w-4" /> };
        case "refunded":
            return { label: "Đã hoàn tiền", chip: "bg-violet-50 text-violet-700 border-violet-200", icon: <RotateCcw className="h-4 w-4" /> };
        case "failed":
            return { label: "Thất bại", chip: "bg-red-50 text-red-700 border-red-200", icon: <AlertTriangle className="h-4 w-4" /> };
        case "cancelled":
            return { label: "Đã hủy", chip: "bg-red-50 text-red-700 border-red-200", icon: <XCircle className="h-4 w-4" /> };
        default:
            return { label: getStatusLabel(status), chip: "bg-gray-50 text-gray-700 border-gray-200", icon: <Package className="h-4 w-4" /> };
    }
}

function OrderStatusStepper({ orderStatus }: { orderStatus: string }) {
    const currentIdx = STATUS_ORDER[orderStatus] ?? 0;
    const isCancelled = orderStatus === "Cancelled" || orderStatus === "Refunded";

    if (isCancelled) {
        const statusMeta = getStatusMeta(orderStatus);
        return (
            <div className={`mt-4 flex items-center gap-2 rounded-lg border-2 p-3 text-sm font-bold ${statusMeta.chip}`}>
                {statusMeta.icon}
                <span>
                    {orderStatus === "Cancelled" ? "Đơn hàng đã bị hủy" : "Đơn hàng đã hoàn tiền"}
                </span>
            </div>
        );
    }

    return (
        <div className="mt-4 px-2">
            <div className="relative flex items-center justify-between">
                <div
                    className="absolute top-[18px] h-[3px] rounded-full bg-[#E5E7EB]"
                    style={{ left: `${100 / (ORDER_STEPS.length * 2)}%`, right: `${100 / (ORDER_STEPS.length * 2)}%` }}
                />
                {currentIdx >= 2 && (
                    <div
                        className="absolute top-[18px] h-[3px] rounded-full bg-emerald-400 transition-all duration-500"
                        style={{
                            left: `${100 / (ORDER_STEPS.length * 2)}%`,
                            width: `${((Math.min(currentIdx, ORDER_STEPS.length) - 1) / (ORDER_STEPS.length - 1)) * (100 - 100 / ORDER_STEPS.length)}%`,
                        }}
                    />
                )}

                {ORDER_STEPS.map((step, idx) => {
                    const stepNum = idx + 1;
                    const isCompleted = currentIdx > stepNum;
                    const isCurrent = currentIdx === stepNum;

                    return (
                        <div key={step.key} className="relative z-10 flex flex-col items-center" style={{ flex: 1 }}>
                            <div
                                className={`flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-sm font-bold transition-all duration-300 ${
                                    isCompleted
                                        ? "bg-emerald-400 shadow-sm"
                                        : isCurrent
                                            ? "animate-pulse bg-purple-400 shadow-sm"
                                            : "bg-gray-100 border-gray-300"
                                }`}
                            >
                                {isCompleted ? (
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                    </svg>
                                ) : (
                                    <span className="text-xs">{step.icon}</span>
                                )}
                            </div>
                            <span
                                className={`mt-2 text-center text-[11px] font-bold leading-tight ${
                                    isCompleted ? "text-emerald-800" : isCurrent ? "text-gray-900" : "text-gray-400"
                                }`}
                            >
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function LegacyOrderItems({
    items,
    navigate,
}: {
    items: OrderItemDto[];
    navigate: ReturnType<typeof useNavigate>;
}) {
    return (
        <div className="divide-y divide-gray-200/10">
            {items.map((item) => (
                <div key={item.orderItemId} className="flex gap-4 p-5 transition-colors hover:bg-gray-50">
                    <button
                        onClick={() => navigate(`/outfits/${item.outfitId}`)}
                        className="flex h-20 w-20 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-violet-50 transition-all duration-200 hover:shadow-lg hover:shadow-[#B8A9E8]"
                        title={`Xem chi tiết ${item.outfitName}`}
                    >
                        {item.outfitImage ? (
                            <img src={item.outfitImage} alt={item.outfitName} className="h-full w-full object-cover" />
                        ) : (
                            <Package className="h-8 w-8 text-purple-400" />
                        )}
                    </button>

                    <button
                        onClick={() => navigate(`/outfits/${item.outfitId}`)}
                        className="flex-1 text-left transition-opacity hover:opacity-75"
                        title={`Xem chi tiết ${item.outfitName}`}
                    >
                        <p className="font-bold text-gray-900 transition-colors hover:text-purple-500">{item.outfitName}</p>
                        <div className="mt-1 space-y-0.5 text-xs text-gray-500">
                            <p>Kích cỡ: <span className="font-semibold">{item.size}</span></p>
                            <p>Số lượng: <span className="font-semibold">{item.quantity}</span></p>
                            <p>Giá: <span className="font-bold text-gray-900">{fmt(item.price / Math.max(item.quantity, 1))}</span></p>
                        </div>
                    </button>

                    <div className="text-right">
                        <p className="text-base font-bold text-gray-900">{fmt(item.price)}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

function DirectOrderItems({
    items,
    navigate,
}: {
    items: MyDirectOrderDetailItemDto[];
    navigate: ReturnType<typeof useNavigate>;
}) {
    return (
        <div className="space-y-4">
            {items.map((item) => (
                <div
                    key={item.orderItemId}
                    className="grid gap-4 rounded-[18px] border border-gray-200 bg-slate-50 p-4 md:grid-cols-[84px_1fr_auto]"
                >
                    <button
                        onClick={() => navigate(`/outfits/${item.outfitId}`)}
                        className="flex h-[84px] w-[84px] items-center justify-center overflow-hidden rounded-[18px] border border-gray-200 bg-white"
                        title={`Xem chi tiết ${item.outfitName}`}
                    >
                        {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.outfitName} className="h-full w-full object-cover" />
                        ) : (
                            <Package className="h-7 w-7 text-gray-400" />
                        )}
                    </button>
                    <div>
                        <button
                            onClick={() => navigate(`/outfits/${item.outfitId}`)}
                            className="text-left text-base font-extrabold text-gray-900 hover:text-violet-600"
                            title={`Xem chi tiết ${item.outfitName}`}
                        >
                            {item.outfitName}
                        </button>
                        <div className="mt-2 flex flex-wrap gap-2">
                            <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-bold text-gray-600">
                                Size {item.size}
                            </span>
                            <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-bold text-gray-600">
                                SL {item.quantity}
                            </span>
                        </div>
                    </div>
                    <p className="text-right text-base font-extrabold text-violet-600">
                        {fmt(item.unitPrice * item.quantity)}
                    </p>
                </div>
            ))}
        </div>
    );
}

export function OrderDetailPage(): JSX.Element {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [state, setState] = useState<OrderPageState>({ type: "missing" });
    const [confirmingDelivery, setConfirmingDelivery] = useState(false);

    useEffect(() => {
        let disposed = false;

        const fetchOrder = async () => {
            if (!orderId) {
                setState({ type: "missing" });
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const legacyOrder = await getOrderDetail(orderId);
                if (!disposed) {
                    setState({ type: "legacy", order: legacyOrder });
                }
            } catch (legacyError) {
                const isNotFound = legacyError instanceof ApiError && legacyError.status === 404;
                const shouldTryDirect = isNotFound || legacyError instanceof ApiError;

                if (!shouldTryDirect) {
                    if (!disposed) setState({ type: "missing" });
                    return;
                }

                try {
                    const directOrder = await getMyDirectOrderDetail(orderId);
                    if (!disposed) {
                        setState({ type: "direct", order: directOrder });
                    }
                } catch (directError) {
                    console.error("Failed to fetch parent order detail:", legacyError, directError);
                    if (!disposed) {
                        setState({ type: "missing" });
                    }
                }
            } finally {
                if (!disposed) {
                    setLoading(false);
                }
            }
        };

        void fetchOrder();

        return () => {
            disposed = true;
        };
    }, [orderId]);

    const handleConfirmDelivery = async (order: MyDirectOrderDetailDto) => {
        if (order.orderStatus !== "Shipped" || !window.confirm("Xác nhận bạn đã nhận được đơn hàng này?")) return;

        setConfirmingDelivery(true);
        try {
            await confirmDirectOrderDelivery(order.orderId);
            setState({
                type: "direct",
                order: {
                    ...order,
                    orderStatus: "Delivered",
                    canRateProvider: order.existingProviderRating ? false : true,
                },
            });
            window.alert("Đã xác nhận nhận hàng. Bạn có thể đánh giá nhà cung cấp.");
        } catch (error) {
            window.alert(error instanceof Error ? error.message : "Không thể xác nhận nhận hàng.");
        } finally {
            setConfirmingDelivery(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#B8A9E8]" />
            </div>
        );
    }

    if (state.type === "missing") {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
                <p className="text-sm font-medium text-gray-500">Không tìm thấy đơn hàng</p>
                <button
                    onClick={() => navigate("/parentprofile/orders")}
                    className="nb-btn nb-btn-outline text-sm"
                >
                    Quay lại
                </button>
            </div>
        );
    }

    if (state.type === "direct") {
        const order = state.order;
        const orderStatusMeta = getStatusMeta(order.orderStatus);

        return (
            <div className="min-h-screen bg-gray-50 p-4 md:p-6">
                <div className="mx-auto max-w-4xl">
                    <div className="mb-6 flex items-center gap-3">
                        <button
                            onClick={() => navigate("/parentprofile/orders")}
                            className="rounded-lg p-2 transition-colors hover:bg-violet-50"
                            title="Quay lại trang đơn hàng"
                        >
                            <ArrowLeft className="h-5 w-5 text-gray-900" />
                        </button>
                        <div>
                            <p className="font-bold text-gray-900">Thông tin đơn hàng</p>
                            <p className="text-xs text-gray-400">Đơn #{order.orderId.slice(0, 8)}</p>
                        </div>
                    </div>

                    <div className="mb-6 overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-soft-md">
                        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
                            <div className="space-y-5 border-b border-gray-200 p-6 lg:border-b-0 lg:border-r lg:p-8">
                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-violet-500">Đơn hàng trực tiếp</p>
                                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Đơn hàng #{order.orderId.slice(0, 8)}</h1>
                                <div className="flex flex-wrap gap-2">
                                    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-bold ${orderStatusMeta.chip}`}>
                                        {orderStatusMeta.icon}
                                        {orderStatusMeta.label}
                                    </span>
                                    {order.paymentStatusName && (
                                        <span className="rounded-full border border-gray-200 bg-slate-50 px-3 py-1 text-[11px] font-bold text-gray-500">
                                            {order.paymentStatusName}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="grid gap-4 bg-slate-50 p-6 sm:grid-cols-2 lg:p-8">
                                <div className="rounded-[20px] border border-gray-200 bg-white p-4 shadow-soft-sm">
                                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-400">Nhà cung cấp</p>
                                    <p className="mt-2 text-lg font-extrabold text-gray-900">{order.providerName}</p>
                                </div>
                                <div className="rounded-[20px] border border-gray-200 bg-white p-4 shadow-soft-sm">
                                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-400">Tổng tiền</p>
                                    <p className="mt-2 text-lg font-extrabold text-violet-600">{fmt(order.totalAmount)}</p>
                                </div>
                                <div className="rounded-[20px] border border-gray-200 bg-white p-4 shadow-soft-sm">
                                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-400">Học kỳ</p>
                                    <p className="mt-2 text-lg font-extrabold text-gray-900">{order.semester} · {order.academicYear}</p>
                                </div>
                                <div className="rounded-[20px] border border-gray-200 bg-white p-4 shadow-soft-sm">
                                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-400">Mã vận đơn</p>
                                    <p className="mt-2 text-lg font-extrabold text-gray-900">{order.trackingCode || "Chưa có"}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                        <div className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                            <div className="mb-5 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-gray-200 bg-violet-50">
                                    <Package className="h-4.5 w-4.5 text-violet-600" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-400">Sản phẩm</p>
                                    <h2 className="text-lg font-extrabold text-gray-900">Danh sách item</h2>
                                </div>
                            </div>
                            <DirectOrderItems items={order.items} navigate={navigate} />
                        </div>

                        <div className="space-y-6">
                            <div className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                                <div className="mb-5 flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-gray-200 bg-emerald-50">
                                        <Truck className="h-4.5 w-4.5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-400">Giao hàng</p>
                                        <h2 className="text-lg font-extrabold text-gray-900">Thông tin giao nhận</h2>
                                    </div>
                                </div>
                                <div className="space-y-3 text-sm font-medium text-gray-600">
                                    <p className="inline-flex gap-2"><Calendar className="mt-0.5 h-4 w-4 text-violet-500" />Ngày đặt: <span className="font-bold text-gray-900">{fmtDate(order.orderDate)}</span></p>
                                    <p className="inline-flex gap-2"><MapPin className="mt-0.5 h-4 w-4 text-violet-500" />Địa chỉ: <span className="font-bold text-gray-900">{order.shippingAddress}</span></p>
                                    {order.recipientName && <p className="inline-flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-violet-500" />Người nhận: <span className="font-bold text-gray-900">{order.recipientName}</span></p>}
                                    {order.recipientPhone && <p className="inline-flex gap-2"><ShoppingBag className="mt-0.5 h-4 w-4 text-violet-500" />Điện thoại: <span className="font-bold text-gray-900">{order.recipientPhone}</span></p>}
                                    {order.deliveryMethod && <p>Hình thức giao: <span className="font-bold text-gray-900">{deliveryMethodLabel(order.deliveryMethod)}</span></p>}
                                    {order.shippingCompany && <p>Đơn vị vận chuyển: <span className="font-bold text-gray-900">{order.shippingCompany}</span></p>}
                                    {order.trackingCode && <p>Mã vận đơn: <span className="font-bold text-gray-900">{order.trackingCode}</span></p>}
                                </div>
                                {order.orderStatus === "Shipped" && (
                                    <button
                                        type="button"
                                        onClick={() => void handleConfirmDelivery(order)}
                                        disabled={confirmingDelivery}
                                        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[16px] border border-emerald-200 bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white shadow-soft-sm transition hover:bg-emerald-700 disabled:opacity-60"
                                    >
                                        {confirmingDelivery ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                        {confirmingDelivery ? "Đang xác nhận..." : "Đã nhận hàng"}
                                    </button>
                                )}
                            </div>

                            <div className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                                <div className="mb-5 flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-gray-200 bg-amber-50">
                                        <Star className="h-4.5 w-4.5 text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-400">Tổng quan</p>
                                        <h2 className="text-lg font-extrabold text-gray-900">Thông tin đơn hàng</h2>
                                    </div>
                                </div>
                                <div className="space-y-3 text-sm font-medium text-gray-600">
                                    <p>Học sinh: <span className="font-bold text-gray-900">{order.childName}</span></p>
                                    <p>Trạng thái: <span className="font-bold text-gray-900">{getStatusLabel(order.orderStatus)}</span></p>
                                    <p>Thanh toán: <span className="font-bold text-gray-900">{order.paymentStatusName || "Không xác định"}</span></p>
                                    <p>Chế độ giá: <span className="font-bold text-gray-900">{order.pricingMode}</span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const order = state.order;
    const orderStatusMeta = getStatusMeta(order.orderStatus);

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            <div className="mx-auto max-w-3xl">
                <div className="mb-6 flex items-center gap-3">
                    <button
                        onClick={() => navigate("/parentprofile/orders")}
                        className="rounded-lg p-2 transition-colors hover:bg-violet-50"
                        title="Quay lại trang đơn hàng"
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-900" />
                    </button>
                    <div>
                        <p className="font-bold text-gray-900">Thông tin đơn hàng</p>
                        <p className="text-xs text-gray-400">Đơn #{order.orderId.slice(0, 8)}</p>
                    </div>
                </div>

                <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div className="nb-card p-4">
                        <div className="mb-2 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <p className="text-xs font-medium text-gray-500">Ngày đặt</p>
                        </div>
                        <p className="text-sm font-bold text-gray-900">{fmtDate(order.orderDate)}</p>
                    </div>
                    <div className="nb-card p-4">
                        <div className="mb-2 flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-gray-500" />
                            <p className="text-xs font-medium text-gray-500">Tổng tiền</p>
                        </div>
                        <p className="text-sm font-bold text-gray-900">{fmt(order.totalAmount)}</p>
                    </div>
                    <div className="nb-card p-4">
                        <div className="mb-2 flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-500" />
                            <p className="text-xs font-medium text-gray-500">Số lượng</p>
                        </div>
                        <p className="text-sm font-bold text-gray-900">{order.items.length} sản phẩm</p>
                    </div>
                    <div className="nb-card p-4">
                        <div className="mb-2 flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <p className="text-xs font-medium text-gray-500">Trạng thái</p>
                        </div>
                        <div className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${orderStatusMeta.chip}`}>
                            {orderStatusMeta.icon}
                            <span>{orderStatusMeta.label}</span>
                        </div>
                    </div>
                </div>

                <div className="nb-card mb-6 p-5">
                    <p className="mb-3 font-bold text-gray-900">Trạng thái đơn hàng</p>
                    <OrderStatusStepper orderStatus={order.orderStatus} />
                </div>

                <div className="nb-card mb-6 p-5">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Đơn hàng được cung cấp bởi</p>
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-violet-50">
                            {order.providerId ? <Package className="h-6 w-6 text-blue-500" /> : <ShoppingBag className="h-6 w-6 text-purple-500" />}
                        </div>
                        <div>
                            <p className="text-base font-black leading-tight text-gray-900">
                                {order.providerName || order.campaignName || "Hệ thống VTOS"}
                            </p>
                            <p className="mt-0.5 text-xs font-bold text-gray-400">
                                {order.providerId ? "Mua trực tiếp từ nhà cung cấp" : "Đơn hàng thuộc danh mục học kỳ của trường"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="nb-card overflow-hidden">
                    <div className="border-b border-gray-200/10 p-5">
                        <p className="font-bold text-gray-900">Sản phẩm đã đặt</p>
                    </div>
                    <LegacyOrderItems items={order.items} navigate={navigate} />
                </div>

                <div className="nb-card mt-6 p-5">
                    <p className="mb-3 font-bold text-gray-900">Địa chỉ giao hàng</p>
                    <div className="flex gap-3">
                        <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-400" />
                        <p className="text-sm text-gray-500">{order.shippingAddress}</p>
                    </div>
                </div>

                {(order.childAvatar || order.childName) && (
                    <div className="nb-card mt-6 p-5">
                        <p className="mb-3 font-bold text-gray-900">Tên người nhận</p>
                        <div className="flex items-center gap-3">
                            {order.childAvatar ? (
                                <img src={order.childAvatar} alt={order.childName} className="h-12 w-12 rounded-lg border border-gray-200" />
                            ) : (
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-gray-200 bg-violet-50">
                                    👤
                                </div>
                            )}
                            <p className="font-bold text-gray-900">{order.childName}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
