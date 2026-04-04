import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Package, Calendar, MapPin, DollarSign } from "lucide-react";
import { getOrderDetail, type OrderDetailDto } from "../../../lib/api/orders";

function fmt(n: number) { return n.toLocaleString("vi-VN") + " ₫"; }
function fmtDate(iso: string) {
    return new Date(iso).toLocaleString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

const ORDER_STEPS = [
    { key: "Paid", label: "Đã thanh toán", icon: "💳" },
    { key: "Confirmed", label: "Đã xác nhận", icon: "✅" },
    { key: "Processed", label: "Đang xử lý", icon: "📦" },
    { key: "Shipped", label: "Đang giao", icon: "🚚" },
    { key: "Delivered", label: "Đã nhận", icon: "🎉" },
];

const STATUS_ORDER: Record<string, number> = {
    Pending: 0, Paid: 1, Confirmed: 2, Processed: 3, Shipped: 4, Delivered: 5,
    Cancelled: -1, Refunded: -2,
};

const STATUS_LABELS: Record<string, string> = {
    Paid: "Đã thanh toán",
    Confirmed: "Đã xác nhận",
    Processed: "Đang xử lý",
    Shipped: "Đang giao",
    Delivered: "Đã nhận",
    Pending: "Chờ thanh toán",
    Cancelled: "Đã hủy",
    Refunded: "Đã hoàn tiền",
};

function OrderStatusStepper({ orderStatus }: { orderStatus: string }) {
    const currentIdx = STATUS_ORDER[orderStatus] ?? 0;
    const isCancelled = orderStatus === "Cancelled" || orderStatus === "Refunded";

    if (isCancelled) {
        return (
            <div className="mt-4 p-3 bg-[#FEE2E2] border-2 border-[#FCA5A5] rounded-lg text-sm text-[#991B1B] font-bold">
                {orderStatus === "Cancelled" ? "❌ Đơn hàng đã bị hủy" : "❌ Đơn hàng đã hoàn tiền"}
            </div>
        );
    }

    return (
        <div className="mt-4 px-2">
            <div className="flex items-center justify-between relative">
                {/* Background line */}
                <div className="absolute top-[18px] h-[3px] bg-[#E5E7EB] rounded-full" style={{ left: `${100 / (ORDER_STEPS.length * 2)}%`, right: `${100 / (ORDER_STEPS.length * 2)}%` }} />
                {/* Progress line */}
                {currentIdx >= 2 && (
                    <div
                        className="absolute top-[18px] h-[3px] bg-[#C8E44D] rounded-full transition-all duration-500"
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
                        <div key={step.key} className="flex flex-col items-center relative z-10" style={{ flex: 1 }}>
                            <div
                                className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-300 border-2 border-[#1A1A2E] ${
                                    isCompleted
                                        ? "bg-[#C8E44D] shadow-[2px_2px_0_#1A1A2E]"
                                        : isCurrent
                                            ? "bg-[#B8A9E8] shadow-[2px_2px_0_#1A1A2E] animate-pulse"
                                            : "bg-[#F3F4F6] border-[#D1D5DB]"
                                }`}
                            >
                                {isCompleted ? (
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                                ) : (
                                    <span className="text-xs">{step.icon}</span>
                                )}
                            </div>
                            <span className={`mt-2 text-[11px] font-bold text-center leading-tight ${
                                isCompleted ? "text-[#065F46]" : isCurrent ? "text-[#1A1A2E]" : "text-[#9CA3AF]"
                            }`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function OrderDetailPage(): JSX.Element {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<OrderDetailDto | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            if (!orderId) return;
            setLoading(true);
            try {
                const data = await getOrderDetail(orderId);
                setOrder(data);
            } catch (err) {
                console.error("Failed to fetch order:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [orderId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-[#E5E7EB] border-t-[#B8A9E8] rounded-full animate-spin" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
                <p className="font-medium text-[#6B7280] text-sm">Không tìm thấy đơn hàng</p>
                <button
                    onClick={() => navigate("/parentprofile/orders")}
                    className="nb-btn nb-btn-outline text-sm"
                >
                    Quay lại
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F9FAFB] p-4 md:p-6">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex items-center gap-3">
                    <button
                        onClick={() => navigate("/parentprofile/orders")}
                        className="p-2 hover:bg-[#EDE9FE] rounded-lg transition-colors"
                        title="Quay lại trang đơn hàng"
                    >
                        <ArrowLeft className="w-5 h-5 text-[#1A1A2E]" />
                    </button>
                    <div>
                        <p className="font-bold text-[#1A1A2E]">Thông tin đơn hàng</p>
                        <p className="text-xs text-[#9CA3AF]">Đơn #{order.orderId.slice(0, 8)}</p>
                    </div>
                </div>

                {/* Order Info Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <div className="nb-card p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-[#6B7280]" />
                            <p className="text-xs text-[#6B7280] font-medium">Ngày đặt</p>
                        </div>
                        <p className="font-bold text-[#1A1A2E] text-sm">{fmtDate(order.orderDate)}</p>
                    </div>
                    <div className="nb-card p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-4 h-4 text-[#6B7280]" />
                            <p className="text-xs text-[#6B7280] font-medium">Tổng tiền</p>
                        </div>
                        <p className="font-bold text-[#1A1A2E] text-sm">{fmt(order.totalAmount)}</p>
                    </div>
                    <div className="nb-card p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Package className="w-4 h-4 text-[#6B7280]" />
                            <p className="text-xs text-[#6B7280] font-medium">Số lượng</p>
                        </div>
                        <p className="font-bold text-[#1A1A2E] text-sm">{order.items.length} sản phẩm</p>
                    </div>
                    <div className="nb-card p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4 text-[#6B7280]" />
                            <p className="text-xs text-[#6B7280] font-medium">Trạng thái</p>
                        </div>
                        <p className="font-bold text-[#1A1A2E] text-sm">{STATUS_LABELS[order.orderStatus] || order.orderStatus}</p>
                    </div>
                </div>

                {/* Order Status */}
                <div className="nb-card p-5 mb-6">
                    <p className="font-bold text-[#1A1A2E] mb-3">Trạng thái đơn hàng</p>
                    <OrderStatusStepper orderStatus={order.orderStatus} />
                </div>

                {/* Order Items */}
                <div className="nb-card overflow-hidden">
                    <div className="p-5 border-b-2 border-[#1A1A2E]/10">
                        <p className="font-bold text-[#1A1A2E]">Sản phẩm đã đặt</p>
                    </div>
                    <div className="divide-y divide-[#1A1A2E]/10">
                        {order.items.map((item) => (
                            <div key={item.orderItemId} className="p-5 flex gap-4 hover:bg-[#F9FAFB] transition-colors">
                                {/* Product Image */}
                                <button 
                                    onClick={() => navigate(`/outfits/${item.outfitId}`)}
                                    className="w-20 h-20 flex-shrink-0 bg-[#EDE9FE] rounded-lg overflow-hidden border-2 border-[#1A1A2E] flex items-center justify-center hover:shadow-lg hover:shadow-[#B8A9E8] transition-all duration-200 cursor-pointer"
                                    title={`Xem chi tiết ${item.outfitName}`}
                                >
                                    {item.outfitImage ? (
                                        <img src={item.outfitImage} alt={item.outfitName} className="w-full h-full object-cover" />
                                    ) : (
                                        <Package className="w-8 h-8 text-[#B8A9E8]" />
                                    )}
                                </button>

                                {/* Product Info */}
                                <button
                                    onClick={() => navigate(`/outfits/${item.outfitId}`)}
                                    className="flex-1 text-left hover:opacity-75 transition-opacity"
                                    title={`Xem chi tiết ${item.outfitName}`}
                                >
                                    <p className="font-bold text-[#1A1A2E] hover:text-[#B8A9E8] transition-colors">{item.outfitName}</p>
                                    <div className="mt-1 space-y-0.5 text-xs text-[#6B7280]">
                                        <p>Kích cỡ: <span className="font-semibold">{item.size}</span></p>
                                        <p>Số lượng: <span className="font-semibold">{item.quantity}</span></p>
                                        <p>Giá: <span className="font-bold text-[#1A1A2E]">{fmt(item.price / item.quantity)}</span></p>
                                    </div>
                                </button>

                                {/* Total */}
                                <div className="text-right">
                                    <p className="font-bold text-[#1A1A2E] text-base">{fmt(item.price)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Shipping Info */}
                <div className="nb-card p-5 mt-6">
                    <p className="font-bold text-[#1A1A2E] mb-3">Địa chỉ giao hàng</p>
                    <div className="flex gap-3">
                        <MapPin className="w-5 h-5 text-[#B8A9E8] flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-[#6B7280]">{order.shippingAddress}</p>
                    </div>
                </div>

                {/* Child Info */}
                {order.childAvatar || order.childName ? (
                    <div className="nb-card p-5 mt-6">
                        <p className="font-bold text-[#1A1A2E] mb-3">Bé nhận hàng</p>
                        <div className="flex items-center gap-3">
                            {order.childAvatar ? (
                                <img src={order.childAvatar} alt={order.childName} className="w-12 h-12 rounded-lg border-2 border-[#1A1A2E]" />
                            ) : (
                                <div className="w-12 h-12 bg-[#EDE9FE] rounded-lg border-2 border-[#1A1A2E] flex items-center justify-center">
                                    👤
                                </div>
                            )}
                            <p className="font-bold text-[#1A1A2E]">{order.childName}</p>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
