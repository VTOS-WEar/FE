import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, MapPin, Package, Phone, ShieldCheck, Truck } from "lucide-react";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useProviderSidebarConfig } from "../../hooks/useProviderSidebarConfig";
import {
    acceptDirectOrder,
    getProviderDirectOrderDetail,
    markDirectOrderInProduction,
    markDirectOrderReadyToShip,
    shipDirectOrder,
    type ProviderDirectOrderDetailDto,
} from "../../lib/api/providers";
import { useToast } from "../../contexts/ToastContext";

const ORDER_STATUS_MAP: Record<string, { label: string; class: string }> = {
    "Pending": { label: "Chờ thanh toán", class: "nb-badge-yellow" },
    "Paid": { label: "Đã thanh toán", class: "nb-badge-yellow" },
    "Accepted": { label: "Đã tiếp nhận", class: "nb-badge-blue" },
    "InProduction": { label: "Đang sản xuất", class: "nb-badge-purple" },
    "ReadyToShip": { label: "Chờ giao hàng", class: "nb-badge-purple" },
    "Shipped": { label: "Đang giao", class: "nb-badge-blue" },
    "Delivered": { label: "Đã giao", class: "nb-badge-green" },
    "Cancelled": { label: "Đã hủy", class: "nb-badge-red" },
    "Refunded": { label: "Đã hoàn tiền", class: "nb-badge-red" },
};

function formatCurrency(value: number) {
    return `${value.toLocaleString("vi-VN")} ₫`;
}

export function ProviderOrderDetail(): JSX.Element {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const sidebarConfig = useProviderSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();

    const [order, setOrder] = useState<ProviderDirectOrderDetailDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [trackingCode, setTrackingCode] = useState("");
    const [shippingCompany, setShippingCompany] = useState("");
    const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
    const { showToast } = useToast();

    useEffect(() => {
        if (!id) return;
        let disposed = false;
        setLoading(true);
        getProviderDirectOrderDetail(id)
            .then((response) => {
                if (disposed) return;
                setOrder(response);
                setTrackingCode(response.trackingCode || "");
                setShippingCompany(response.shippingCompany || "");
            })
            .finally(() => {
                if (!disposed) setLoading(false);
            });

        return () => {
            disposed = true;
        };
    }, [id]);

    const reload = async () => {
        if (!id) return;
        const response = await getProviderDirectOrderDetail(id);
        setOrder(response);
    };

    const doAction = async (fn: () => Promise<void>) => {
        setSubmitting(true);
        try {
            await fn();
            showToast({
                title: "Thành công",
                message: "Cập nhật trạng thái đơn hàng thành công!",
                variant: "success",
            });
            await reload();
            setConfirmAction(null);
        } catch (err: any) {
            showToast({
                title: "Lỗi",
                message: err.message || "Có lỗi xảy ra",
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

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} />
                </div>

                <div className="flex-1 min-w-0 bg-[#F9FAFB]">
                    <TopNavBar>
                        <div className="flex items-center gap-3 px-2 py-2">
                            <button onClick={() => navigate("/provider/orders")} className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-soft-sm hover:bg-slate-50 transition-all">
                                <ArrowLeft className="h-4 w-4 text-gray-900" />
                            </button>
                            <div>
                                <h1 className="text-xl font-extrabold text-gray-900 leading-none">Chi tiết đơn hàng</h1>
                                <p className="mt-1 text-[12px] font-semibold text-gray-400">Theo dõi và xử lý đơn sản xuất mã #{id?.slice(0, 8).toUpperCase()}</p>
                            </div>
                        </div>
                    </TopNavBar>

                    <main className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        {loading ? (
                            <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-[32px] border-2 border-dashed border-gray-200 bg-white shadow-soft-sm">
                                <div className="h-12 w-12 rounded-full border-4 border-violet-100 border-t-violet-600 animate-spin" />
                                <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Đang chuẩn bị dữ liệu...</span>
                            </div>
                        ) : !order ? (
                            <div className="rounded-[32px] border border-gray-200 bg-white p-16 text-center shadow-soft-sm">
                                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-500 mb-6">
                                    <ShieldCheck className="h-10 w-10" />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900">Không tìm thấy đơn hàng</h2>
                                <p className="mt-2 text-gray-500 font-medium">Đơn hàng bạn yêu cầu có thể đã bị hủy hoặc không tồn tại.</p>
                                <button onClick={() => navigate("/provider/orders")} className="mt-8 nb-btn nb-btn-purple py-3 px-8">Quay lại danh sách</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                {/* Left Column: Order Content (8 cols) */}
                                <div className="lg:col-span-8 space-y-8">
                                    {/* Order Brief */}
                                    <div className="rounded-[32px] border border-gray-200 bg-white p-8 shadow-soft-sm">
                                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-6 mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 border border-gray-100">
                                                    <Package className="h-7 w-7 text-slate-400" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-lg font-black text-gray-900">#{order.orderId.slice(0, 8).toUpperCase()}</span>
                                                        <span className={`nb-badge ${ORDER_STATUS_MAP[order.orderStatus]?.class || 'nb-badge-yellow'}`}>
                                                            {ORDER_STATUS_MAP[order.orderStatus]?.label || order.orderStatus}
                                                        </span>
                                                    </div>
                                                    <p className="text-[13px] font-bold text-gray-400 mt-0.5">Đặt lúc: {new Date(order.orderDate).toLocaleString("vi-VN")}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[11px] font-black uppercase tracking-widest text-[#97A3B6]">Tổng giá trị</p>
                                                <p className="text-2xl font-black text-violet-600">{formatCurrency(order.totalAmount)}</p>
                                            </div>
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <h3 className="flex items-center gap-2 text-[14px] font-black uppercase tracking-wider text-gray-900">
                                                    <ShieldCheck className="h-4 w-4 text-violet-500" />
                                                    Thông tin định danh
                                                </h3>
                                                <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                                                    <div className="space-y-3">
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase text-gray-400">Phụ huynh</p>
                                                            <p className="text-[14px] font-bold text-gray-900">{order.parentName}</p>
                                                            <p className="text-[11px] font-medium text-gray-500">{order.parentPhone}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase text-gray-400">Học sinh thụ hưởng</p>
                                                            <p className="text-[14px] font-bold text-violet-600">🎒 {order.childName}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <h3 className="flex items-center gap-2 text-[14px] font-black uppercase tracking-wider text-gray-900">
                                                    <MapPin className="h-4 w-4 text-violet-500" />
                                                    Địa chỉ giao hàng
                                                </h3>
                                                <div className="bg-violet-50/30 rounded-2xl p-4 border border-violet-100/50">
                                                    <p className="text-[11px] font-black uppercase text-violet-500 mb-1">Người nhận: {order.recipientName || order.parentName}</p>
                                                    <p className="text-[14px] font-bold text-gray-900 leading-relaxed italic">"{order.shippingAddress}"</p>
                                                    {order.recipientPhone && <p className="mt-2 text-[12px] font-black text-gray-600">📞 {order.recipientPhone}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Order Items */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-2">
                                            <h3 className="text-lg font-black text-gray-900">Danh sách sản phẩm ({order.items.length})</h3>
                                        </div>
                                        <div className="space-y-3">
                                            {order.items.map((item) => (
                                                <div key={item.orderItemId} className="group flex items-center gap-6 rounded-[24px] border border-gray-100 bg-white p-4 shadow-soft-xs transition-all hover:border-violet-200">
                                                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-50 border border-gray-50">
                                                        {item.imageUrl ? (
                                                            <img src={item.imageUrl} alt={item.outfitName} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center text-slate-300">
                                                                <ShoppingBag className="h-8 w-8" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-[16px] font-black text-gray-900 truncate">{item.outfitName}</h4>
                                                        <div className="mt-1.5 flex flex-wrap gap-2">
                                                            <span className="inline-flex items-center rounded-lg bg-violet-50 px-2.5 py-1 text-[11px] font-black text-violet-600 uppercase border border-violet-100">Size {item.size}</span>
                                                            <span className="inline-flex items-center rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-600 uppercase border border-slate-100">SL: {item.quantity}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[13px] font-bold text-gray-400">Đơn giá: {formatCurrency(item.unitPrice)}</p>
                                                        <p className="text-[18px] font-black text-gray-900">{formatCurrency(item.unitPrice * item.quantity)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Actions & Meta (4 cols) */}
                                <div className="lg:col-span-4 space-y-6">
                                    {/* Action Sticky Panel */}
                                    <div className="sticky top-24 space-y-6">
                                        <div className="rounded-[32px] border-2 border-violet-600/10 bg-white p-6 shadow-soft-lg">
                                            <div className="mb-6">
                                                <p className="text-[11px] font-black uppercase tracking-widest text-[#97A3B6]">Trạng thái đơn hàng</p>
                                                <div className="mt-2 flex items-center justify-between">
                                                    <span className={`nb-badge ${ORDER_STATUS_MAP[order.orderStatus]?.class || 'nb-badge-yellow'} text-sm py-1.5 px-4`}>
                                                        {ORDER_STATUS_MAP[order.orderStatus]?.label || order.orderStatus}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <style>{`
                                                    @keyframes gradientShift {
                                                        0% { background-position: 0% 50%; }
                                                        50% { background-position: 100% 50%; }
                                                        100% { background-position: 0% 50%; }
                                                    }
                                                    .animate-purple-flow {
                                                        background: linear-gradient(-45deg, #7C3AED, #9333EA, #A855F7, #6366F1);
                                                        background-size: 300% 300%;
                                                        animation: gradientShift 6s ease infinite;
                                                    }
                                                `}</style>
                                                
                                                {order.orderStatus === "Paid" && (
                                                    <button onClick={() => confirmStatusChange("Tiếp nhận đơn hàng", "Bạn có chắc chắn muốn tiếp nhận đơn hàng này để chuẩn bị sản xuất?", () => acceptDirectOrder(order.orderId))} disabled={submitting} className="w-full h-12 flex items-center justify-center rounded-xl animate-purple-flow text-[14px] font-black text-white shadow-soft-lg transition-all hover:scale-[1.02] active:scale-95">
                                                        Tiếp nhận & Xử lý
                                                    </button>
                                                )}
                                                {order.orderStatus === "Accepted" && (
                                                    <button onClick={() => confirmStatusChange("Bắt đầu sản xuất", "Xác nhận chuyển đơn hàng sang dây chuyền sản xuất?", () => markDirectOrderInProduction(order.orderId))} disabled={submitting} className="w-full h-12 flex items-center justify-center rounded-xl animate-purple-flow text-[14px] font-black text-white shadow-soft-lg transition-all hover:scale-[1.02] active:scale-95 brightness-110">
                                                        Bắt đầu sản xuất
                                                    </button>
                                                )}
                                                {order.orderStatus === "InProduction" && (
                                                    <button onClick={() => confirmStatusChange("Sẵn sàng giao hàng", "Xác nhận sản phẩm đã được may xong và đóng gói?", () => markDirectOrderReadyToShip(order.orderId))} disabled={submitting} className="w-full h-12 flex items-center justify-center rounded-xl animate-purple-flow text-[14px] font-black text-white shadow-soft-lg transition-all hover:scale-[1.02] active:scale-95 contrast-125">
                                                        Sẵn sàng giao hàng
                                                    </button>
                                                )}
                                                
                                                {order.orderStatus === "ReadyToShip" && (
                                                    <div className="space-y-4">
                                                        <div className="space-y-2.5">
                                                            <div className="flex items-center gap-2 px-1">
                                                                <Truck className="h-4 w-4 text-violet-500" />
                                                                <span className="text-[11px] font-black uppercase text-gray-500">Thông tin vận chuyển</span>
                                                            </div>
                                                            <input 
                                                                value={shippingCompany} 
                                                                onChange={(e) => setShippingCompany(e.target.value)} 
                                                                placeholder="Đơn vị vận chuyển (VnPost, GHTK...)" 
                                                                className="w-full rounded-xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200/50" 
                                                            />
                                                            <input 
                                                                value={trackingCode} 
                                                                onChange={(e) => setTrackingCode(e.target.value)} 
                                                                placeholder="Mã vận đơn (Tracking Code)" 
                                                                className="w-full rounded-xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200/50" 
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => confirmStatusChange("Xác nhận giao hàng", `Xác nhận giao hàng đơn vị ${shippingCompany} với mã ${trackingCode}?`, () => shipDirectOrder(order.orderId, { trackingCode, shippingCompany }))}
                                                            disabled={submitting || !trackingCode.trim() || !shippingCompany.trim()}
                                                            className="w-full h-12 flex items-center justify-center rounded-xl animate-purple-flow text-[14px] font-black text-white shadow-soft-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:animate-none disabled:bg-slate-200"
                                                        >
                                                            Xác nhận khởi hành
                                                        </button>
                                                    </div>
                                                )}

                                                <p className="text-center text-[10px] font-medium text-gray-400 mt-4 italic">
                                                    * Hành động thay đổi trạng thái sẽ thông báo tới phụ huynh ngay lập tức.
                                                </p>
                                            </div>
                                        </div>

                                        {(order.trackingCode || trackingCode) && order.orderStatus !== "ReadyToShip" && (
                                            <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-soft-sm">
                                                <h4 className="text-[12px] font-black uppercase tracking-widest text-gray-400 mb-4">Logistics đã lưu</h4>
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[13px] font-medium text-gray-500">Đối tác:</span>
                                                        <span className="text-[13px] font-black text-gray-900">{order.shippingCompany || shippingCompany}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[13px] font-medium text-gray-500">Mã vận đơn:</span>
                                                        <span className="text-[13px] font-black text-violet-600 underline underline-offset-4">{order.trackingCode || trackingCode}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Confirm Modal */}
            {confirmAction && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmAction(null)} />
                    <div className="relative w-full max-w-[480px] overflow-hidden rounded-[32px] border border-gray-200 bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="bg-violet-600 px-8 py-10 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-white shadow-soft-lg border border-white/30 mb-4">
                                <ShieldCheck className="h-8 w-8" />
                            </div>
                            <h3 className="text-2xl font-black text-white">{confirmAction.title}</h3>
                            <p className="mt-2 text-violet-100 font-medium">{confirmAction.message}</p>
                        </div>
                        <div className="bg-white px-8 py-8">
                            <div className="flex gap-4">
                                <button onClick={() => setConfirmAction(null)} className="flex-1 rounded-2xl border border-gray-200 bg-slate-50 py-4 text-[15px] font-black text-gray-600 transition-all hover:bg-slate-100">
                                    Hủy bỏ
                                </button>
                                <button onClick={confirmAction.onConfirm} disabled={submitting} className="flex-1 rounded-2xl bg-violet-600 py-4 text-[15px] font-black text-white shadow-soft-md transition-all hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center gap-2">
                                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Tiến hành cập nhật
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
