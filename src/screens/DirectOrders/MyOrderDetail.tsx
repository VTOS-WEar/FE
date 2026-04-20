import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Loader2, MapPin, Package, Phone, ShieldCheck, Truck } from "lucide-react";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { useToast } from "../../contexts/ToastContext";
import { cancelDirectOrder, getMyDirectOrderDetail, type MyDirectOrderDetailDto } from "../../lib/api/orders";

function formatCurrency(value: number) {
    return `${value.toLocaleString("vi-VN")} ₫`;
}

const BLOCKED_CANCEL_STATUSES = new Set(["Accepted", "InProduction", "ReadyToShip", "Shipped", "Delivered"]);

export function MyOrderDetail(): JSX.Element {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [order, setOrder] = useState<MyDirectOrderDetailDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        if (!id) return;
        let disposed = false;
        setLoading(true);
        getMyDirectOrderDetail(id)
            .then((response) => {
                if (!disposed) setOrder(response);
            })
            .catch((error: unknown) => {
                if (!disposed) {
                    showToast({
                        title: "Không tải được chi tiết đơn",
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
    }, [id, showToast]);

    const handleCancel = async () => {
        if (!order || BLOCKED_CANCEL_STATUSES.has(order.orderStatus) || !window.confirm("Bạn muốn hủy đơn hàng này?")) return;

        setCancelling(true);
        try {
            await cancelDirectOrder(order.orderId);
            showToast({ title: "Đã hủy đơn", message: "Đơn hàng đã được cập nhật trạng thái hủy.", variant: "success" });
            setOrder({ ...order, orderStatus: "Cancelled" });
        } catch (error: unknown) {
            showToast({
                title: "Không thể hủy đơn",
                message: error instanceof Error ? error.message : "Đã có lỗi xảy ra.",
                variant: "error",
            });
        } finally {
            setCancelling(false);
        }
    };

    return (
        <GuestLayout bgColor="#f8fafc">
            <div className="mx-auto max-w-[980px] px-6 py-10 lg:px-8">
                <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-[16px] border border-gray-200 bg-white px-4 py-2.5 text-sm font-extrabold text-gray-900 shadow-soft-sm">
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại
                </button>

                {loading ? (
                    <div className="mt-8 flex min-h-[280px] items-center justify-center gap-3 rounded-[24px] border border-gray-200 bg-white shadow-soft-sm">
                        <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
                        <span className="text-sm font-bold text-gray-600">Đang tải chi tiết đơn hàng...</span>
                    </div>
                ) : !order ? (
                    <div className="mt-8 rounded-[24px] border border-dashed border-gray-300 bg-white p-10 text-center shadow-soft-sm">
                        <h2 className="text-xl font-extrabold text-gray-900">Không tìm thấy đơn hàng</h2>
                    </div>
                ) : (
                    <div className="mt-8 space-y-6">
                        <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-soft-md">
                            <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
                                <div className="space-y-5 border-b border-gray-200 p-6 lg:border-b-0 lg:border-r lg:p-8">
                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-violet-500">Direct Order Detail</p>
                                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Đơn hàng #{order.orderId.slice(0, 8)}</h1>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="nb-badge nb-badge-purple">{order.orderStatus}</span>
                                        {order.paymentStatusName && <span className="rounded-full border border-gray-200 bg-slate-50 px-3 py-1 text-[11px] font-bold text-gray-500">{order.paymentStatusName}</span>}
                                    </div>
                                </div>
                                <div className="grid gap-4 bg-slate-50 p-6 sm:grid-cols-2 lg:p-8">
                                    <div className="rounded-[20px] border border-gray-200 bg-white p-4 shadow-soft-sm">
                                        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-400">Nhà cung cấp</p>
                                        <p className="mt-2 text-lg font-extrabold text-gray-900">{order.providerName}</p>
                                    </div>
                                    <div className="rounded-[20px] border border-gray-200 bg-white p-4 shadow-soft-sm">
                                        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-400">Tổng tiền</p>
                                        <p className="mt-2 text-lg font-extrabold text-violet-600">{formatCurrency(order.totalAmount)}</p>
                                    </div>
                                    <div className="rounded-[20px] border border-gray-200 bg-white p-4 shadow-soft-sm">
                                        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-400">Học kỳ</p>
                                        <p className="mt-2 text-lg font-extrabold text-gray-900">{order.semester} · {order.academicYear}</p>
                                    </div>
                                    <div className="rounded-[20px] border border-gray-200 bg-white p-4 shadow-soft-sm">
                                        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-400">Tracking</p>
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
                                <div className="space-y-4">
                                    {order.items.map((item) => (
                                        <div key={item.orderItemId} className="grid gap-4 rounded-[18px] border border-gray-200 bg-slate-50 p-4 md:grid-cols-[84px_1fr_auto]">
                                            <div className="flex h-[84px] w-[84px] items-center justify-center overflow-hidden rounded-[18px] border border-gray-200 bg-white">
                                                {item.imageUrl ? <img src={item.imageUrl} alt={item.outfitName} className="h-full w-full object-cover" /> : <Package className="h-7 w-7 text-gray-400" />}
                                            </div>
                                            <div>
                                                <h3 className="text-base font-extrabold text-gray-900">{item.outfitName}</h3>
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-bold text-gray-600">Size {item.size}</span>
                                                    <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-bold text-gray-600">SL {item.quantity}</span>
                                                </div>
                                            </div>
                                            <p className="text-right text-base font-extrabold text-violet-600">{formatCurrency(item.unitPrice * item.quantity)}</p>
                                        </div>
                                    ))}
                                </div>
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
                                        <p className="inline-flex gap-2"><CalendarDays className="mt-0.5 h-4 w-4 text-violet-500" />Ngày đặt: <span className="font-bold text-gray-900">{new Date(order.orderDate).toLocaleString("vi-VN")}</span></p>
                                        <p className="inline-flex gap-2"><MapPin className="mt-0.5 h-4 w-4 text-violet-500" />Địa chỉ: <span className="font-bold text-gray-900">{order.shippingAddress}</span></p>
                                        {order.recipientName && <p className="inline-flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-violet-500" />Người nhận: <span className="font-bold text-gray-900">{order.recipientName}</span></p>}
                                        {order.recipientPhone && <p className="inline-flex gap-2"><Phone className="mt-0.5 h-4 w-4 text-violet-500" />Điện thoại: <span className="font-bold text-gray-900">{order.recipientPhone}</span></p>}
                                        {order.shippingCompany && <p>Đơn vị vận chuyển: <span className="font-bold text-gray-900">{order.shippingCompany}</span></p>}
                                        {order.trackingCode && <p>Mã vận đơn: <span className="font-bold text-gray-900">{order.trackingCode}</span></p>}
                                    </div>
                                </div>

                                <div className="rounded-[24px] border border-dashed border-violet-300 bg-violet-50 p-6">
                                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-violet-500">Hành động</p>
                                    <div className="mt-4 space-y-3">
                                        {!BLOCKED_CANCEL_STATUSES.has(order.orderStatus) && order.orderStatus !== "Cancelled" && (
                                            <button onClick={handleCancel} disabled={cancelling} className="w-full rounded-[16px] border border-gray-200 bg-white px-4 py-3 text-sm font-extrabold text-gray-900 shadow-soft-sm disabled:opacity-60">
                                                {cancelling ? "Đang hủy đơn..." : "Hủy đơn hàng"}
                                            </button>
                                        )}
                                        <Link to="/my-orders" className="block w-full rounded-[16px] border border-gray-200 bg-violet-500 px-4 py-3 text-center text-sm font-extrabold text-white shadow-soft-sm">
                                            Về danh sách đơn hàng
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </GuestLayout>
    );
}
