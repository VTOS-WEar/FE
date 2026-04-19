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
            await reload();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} />
                </div>

                <div className="flex-1 min-w-0">
                    <TopNavBar>
                        <div className="flex items-center gap-3">
                            <button onClick={() => navigate("/provider/orders")} className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-gray-200 bg-white shadow-soft-sm">
                                <ArrowLeft className="h-4 w-4 text-gray-900" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-extrabold text-gray-900">Chi tiết direct order</h1>
                                <p className="mt-1 text-sm font-medium text-gray-500">Cập nhật trạng thái sản xuất và giao hàng trực tiếp cho phụ huynh.</p>
                            </div>
                        </div>
                    </TopNavBar>

                    <main className="space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        {loading ? (
                            <div className="flex min-h-[260px] items-center justify-center gap-3 rounded-[24px] border border-gray-200 bg-white shadow-soft-sm">
                                <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
                                <span className="text-sm font-bold text-gray-600">Đang tải chi tiết đơn hàng...</span>
                            </div>
                        ) : !order ? (
                            <div className="rounded-[24px] border border-dashed border-gray-300 bg-white p-10 text-center shadow-soft-sm">
                                <h2 className="text-xl font-extrabold text-gray-900">Không tìm thấy đơn hàng</h2>
                            </div>
                        ) : (
                            <>
                                <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                                    <div className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="nb-badge nb-badge-purple">{order.orderStatus}</span>
                                            <span className="rounded-full border border-gray-200 bg-slate-50 px-3 py-1 text-[11px] font-bold text-gray-500">#{order.orderId.slice(0, 8)}</span>
                                        </div>
                                        <h2 className="mt-4 text-2xl font-extrabold text-gray-900">{order.parentName}</h2>
                                        <div className="mt-4 space-y-3 text-sm font-medium text-gray-600">
                                            <p className="inline-flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-violet-500" />Học sinh: <span className="font-bold text-gray-900">{order.childName}</span></p>
                                            {order.parentPhone && <p className="inline-flex gap-2"><Phone className="mt-0.5 h-4 w-4 text-violet-500" />Phụ huynh: <span className="font-bold text-gray-900">{order.parentPhone}</span></p>}
                                            <p className="inline-flex gap-2"><MapPin className="mt-0.5 h-4 w-4 text-violet-500" />Địa chỉ: <span className="font-bold text-gray-900">{order.shippingAddress}</span></p>
                                            <p>Tổng tiền: <span className="font-bold text-violet-600">{formatCurrency(order.totalAmount)}</span></p>
                                        </div>
                                    </div>

                                    <div className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                                        <h3 className="text-lg font-extrabold text-gray-900">Thông tin giao hàng</h3>
                                        <div className="mt-4 space-y-3">
                                            <label className="block space-y-2">
                                                <span className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-400">Tracking code</span>
                                                <input value={trackingCode} onChange={(event) => setTrackingCode(event.target.value)} className="w-full rounded-[12px] border border-gray-200 px-3 py-2 text-sm font-bold text-gray-900 outline-none" />
                                            </label>
                                            <label className="block space-y-2">
                                                <span className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-400">Đơn vị vận chuyển</span>
                                                <input value={shippingCompany} onChange={(event) => setShippingCompany(event.target.value)} className="w-full rounded-[12px] border border-gray-200 px-3 py-2 text-sm font-bold text-gray-900 outline-none" />
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                                    <div className="mb-5 flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-gray-200 bg-violet-50">
                                            <Package className="h-4.5 w-4.5 text-violet-600" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-400">Items</p>
                                            <h2 className="text-lg font-extrabold text-gray-900">Danh sách sản phẩm</h2>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {order.items.map((item) => (
                                            <div key={item.orderItemId} className="grid gap-4 rounded-[18px] border border-gray-200 bg-slate-50 p-4 md:grid-cols-[1fr_auto]">
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

                                <div className="rounded-[24px] border border-dashed border-violet-300 bg-violet-50 p-6">
                                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-violet-500">Cập nhật trạng thái</p>
                                    <div className="mt-4 flex flex-wrap gap-3">
                                        {order.orderStatus === "Paid" && <button onClick={() => doAction(() => acceptDirectOrder(order.orderId))} disabled={submitting} className="rounded-[16px] border border-gray-200 bg-white px-4 py-3 text-sm font-extrabold text-gray-900 shadow-soft-sm">Chấp nhận đơn</button>}
                                        {order.orderStatus === "Accepted" && <button onClick={() => doAction(() => markDirectOrderInProduction(order.orderId))} disabled={submitting} className="rounded-[16px] border border-gray-200 bg-white px-4 py-3 text-sm font-extrabold text-gray-900 shadow-soft-sm">Chuyển InProduction</button>}
                                        {order.orderStatus === "InProduction" && <button onClick={() => doAction(() => markDirectOrderReadyToShip(order.orderId))} disabled={submitting} className="rounded-[16px] border border-gray-200 bg-white px-4 py-3 text-sm font-extrabold text-gray-900 shadow-soft-sm">Ready to ship</button>}
                                        {order.orderStatus === "ReadyToShip" && (
                                            <button
                                                onClick={() => doAction(() => shipDirectOrder(order.orderId, { trackingCode, shippingCompany }))}
                                                disabled={submitting || !trackingCode.trim() || !shippingCompany.trim()}
                                                className="rounded-[16px] border border-gray-200 bg-violet-500 px-4 py-3 text-sm font-extrabold text-white shadow-soft-sm disabled:opacity-60"
                                            >
                                                Xác nhận ship
                                            </button>
                                        )}
                                    </div>
                                    {(order.trackingCode || trackingCode) && (
                                        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-bold text-gray-700 shadow-soft-sm">
                                            <Truck className="h-4 w-4 text-violet-500" />
                                            {order.trackingCode || trackingCode}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
