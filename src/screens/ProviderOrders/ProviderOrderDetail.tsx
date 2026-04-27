import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    ClipboardCheck,
    CreditCard,
    Hash,
    Loader2,
    MapPin,
    Package,
    Phone,
    Route,
    ShieldCheck,
    ShoppingBag,
    Truck,
    UserRound,
} from "lucide-react";
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
    type ProviderDirectOrderDetailItemDto,
} from "../../lib/api/providers";
import { useToast } from "../../contexts/ToastContext";

const ORDER_STATUS_MAP: Record<string, { label: string; badge: string; tone: string; surfaceClassName: string }> = {
    Pending: { label: "Chờ thanh toán", badge: "nb-badge-yellow", tone: "text-amber-700", surfaceClassName: "bg-yellow-100" },
    Paid: { label: "Đã thanh toán", badge: "nb-badge-blue", tone: "text-blue-700", surfaceClassName: "bg-blue-100" },
    Accepted: { label: "Đã tiếp nhận", badge: "nb-badge-blue", tone: "text-sky-700", surfaceClassName: "bg-cyan-100" },
    InProduction: { label: "Đang sản xuất", badge: "nb-badge-purple", tone: "text-violet-700", surfaceClassName: "bg-violet-100" },
    ReadyToShip: { label: "Chờ giao hàng", badge: "nb-badge-purple", tone: "text-indigo-700", surfaceClassName: "bg-indigo-100" },
    Shipped: { label: "Đang giao", badge: "nb-badge-blue", tone: "text-blue-700", surfaceClassName: "bg-teal-100" },
    Delivered: { label: "Đã giao", badge: "nb-badge-green", tone: "text-emerald-700", surfaceClassName: "bg-lime-200" },
    Cancelled: { label: "Đã hủy", badge: "nb-badge-red", tone: "text-rose-700", surfaceClassName: "bg-rose-100" },
    Refunded: { label: "Đã hoàn tiền", badge: "nb-badge-red", tone: "text-rose-700", surfaceClassName: "bg-rose-100" },
};

const STATUS_FLOW = ["Paid", "Accepted", "InProduction", "ReadyToShip", "Shipped", "Delivered"];

function formatCurrency(value: number) {
    return `${value.toLocaleString("vi-VN")} ₫`;
}

function formatDateTime(value: string) {
    return new Date(value).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getStatusMeta(status: string) {
    return ORDER_STATUS_MAP[status] || {
        label: status,
        badge: "nb-badge-yellow",
        tone: "text-slate-700",
        surfaceClassName: "bg-slate-100",
    };
}

function deliveryMethodLabel(value?: string | null) {
    switch (value) {
        case "HomeDelivery":
            return "Nhận tại nhà";
        default:
            return value || "Giao hàng tiêu chuẩn";
    }
}

function SummaryCard({
    label,
    value,
    note,
    icon,
    surfaceClassName,
}: {
    label: string;
    value: string;
    note?: string;
    icon: React.ReactNode;
    surfaceClassName: string;
}) {
    return (
        <div className={`min-h-[112px] rounded-[8px] border border-white/70 p-5 shadow-soft-sm ${surfaceClassName}`}>
            <div className="flex h-full items-center gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-white text-slate-900 shadow-soft-xs">
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700">{label}</p>
                    <p className="mt-2 truncate text-2xl font-bold leading-tight text-slate-950">{value}</p>
                    {note ? <p className="mt-2 line-clamp-1 text-xs font-semibold text-slate-600">{note}</p> : null}
                </div>
            </div>
        </div>
    );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
    return (
        <div className="rounded-[8px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white text-slate-700 shadow-soft-xs">
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">{label}</p>
                    <p className="mt-2 break-words text-sm font-bold leading-6 text-gray-900">{value}</p>
                </div>
            </div>
        </div>
    );
}

function ProductRow({ item }: { item: ProviderDirectOrderDetailItemDto }) {
    return (
        <div className="grid gap-4 rounded-[8px] border border-gray-200 bg-white p-4 shadow-soft-sm sm:grid-cols-[80px_1fr_auto] sm:items-center">
            <div className="h-20 w-20 overflow-hidden rounded-[8px] border border-slate-100 bg-slate-50">
                {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.outfitName} className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <ShoppingBag className="h-8 w-8" />
                    </div>
                )}
            </div>

            <div className="min-w-0">
                <h3 className="truncate text-base font-bold text-slate-950">{item.outfitName}</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                        Size {item.size}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                        SL {item.quantity}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600">
                        {formatCurrency(item.unitPrice)} / sản phẩm
                    </span>
                </div>
            </div>

            <div className="text-left sm:text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Thành tiền</p>
                <p className="mt-2 text-xl font-bold text-slate-950">{formatCurrency(item.unitPrice * item.quantity)}</p>
            </div>
        </div>
    );
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
        setTrackingCode(response.trackingCode || "");
        setShippingCompany(response.shippingCompany || "");
    };

    const doAction = async (fn: () => Promise<void>) => {
        setSubmitting(true);
        try {
            await fn();
            showToast({
                title: "Thành công",
                message: "Cập nhật trạng thái đơn hàng thành công.",
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

    const summaryCards = useMemo(() => {
        if (!order) return [];
        const statusMeta = getStatusMeta(order.orderStatus);

        return [
            {
                label: "Khách hàng",
                value: order.parentName,
                note: undefined,
                icon: <UserRound className="h-5 w-5" />,
                surfaceClassName: "bg-blue-100",
            },
            {
                label: "Trạng thái",
                value: statusMeta.label,
                note: undefined,
                icon: <ClipboardCheck className="h-5 w-5" />,
                surfaceClassName: statusMeta.surfaceClassName,
            },
            {
                label: "Sản phẩm",
                value: `${order.items.length} mẫu`,
                note: undefined,
                icon: <Package className="h-5 w-5" />,
                surfaceClassName: "bg-emerald-100",
            },
            {
                label: "Logistics",
                value: order.trackingCode || trackingCode || "Chưa có mã",
                note: undefined,
                icon: <Truck className="h-5 w-5" />,
                surfaceClassName: "bg-teal-100",
            },
        ];
    }, [order, shippingCompany, trackingCode]);

    const currentStatusIndex = order ? STATUS_FLOW.indexOf(order.orderStatus) : -1;
    const statusMeta = order ? getStatusMeta(order.orderStatus) : null;

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} />
                </div>

                <div className="flex-1 min-w-0">
                    <TopNavBar>
                        <div className="flex items-center gap-3 px-2 py-2">
                            <button
                                onClick={() => navigate("/provider/orders")}
                                className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-gray-200 bg-white shadow-soft-sm transition-all hover:bg-slate-50"
                                aria-label="Quay lại danh sách đơn hàng"
                            >
                                <ArrowLeft className="h-4 w-4 text-gray-900" />
                            </button>
                            <div>
                                <h1 className="text-xl font-bold leading-none text-gray-900">Chi tiết đơn hàng</h1>
                            </div>
                        </div>
                    </TopNavBar>

                    <main className="space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        {loading ? (
                            <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-[8px] border border-gray-200 bg-white shadow-soft-sm">
                                <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Đang đồng bộ dữ liệu đơn hàng...</p>
                            </div>
                        ) : !order || !statusMeta ? (
                            <div className="rounded-[8px] border border-dashed border-gray-300 bg-white p-16 text-center shadow-soft-sm">
                                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                                    <ShieldCheck className="h-10 w-10" />
                                </div>
                                <h2 className="mt-6 text-2xl font-bold text-gray-900">Không tìm thấy đơn hàng</h2>
                                <button onClick={() => navigate("/provider/orders")} className="nb-btn nb-btn-purple mt-8 px-8 py-3">
                                    Quay lại danh sách
                                </button>
                            </div>
                        ) : (
                            <>
                                <section className="space-y-5">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-950">Tổng quan đơn hàng</h2>
                                            <p className="mt-1 text-sm font-semibold text-slate-500">
                                                Tập trung vào khách hàng, sản phẩm, trạng thái xử lý và logistics.
                                            </p>
                                        </div>
                                        <span className={`nb-badge ${statusMeta.badge} w-fit px-4 py-2 text-sm`}>
                                            {statusMeta.label}
                                        </span>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                        {summaryCards.map((card) => (
                                            <SummaryCard key={card.label} {...card} />
                                        ))}
                                    </div>
                                </section>

                                <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
                                    <div className="space-y-6">
                                        <div className="rounded-[8px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                <div>
                                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Khách hàng</p>
                                                    <h2 className="mt-2 text-2xl font-bold text-gray-900">{order.parentName}</h2>
                                                    <p className="mt-1 text-sm font-semibold text-slate-500">Học sinh: {order.childName}</p>
                                                </div>
                                                <div className="font-mono text-sm font-bold text-slate-600">
                                                    #{order.orderId.slice(0, 8).toUpperCase()}
                                                </div>
                                            </div>

                                            <div className="mt-5 grid gap-4 md:grid-cols-2">
                                                <InfoRow label="Số điện thoại phụ huynh" value={order.parentPhone || "Chưa có dữ liệu"} icon={<Phone className="h-4 w-4" />} />
                                                <InfoRow label="Người nhận" value={order.recipientName || order.parentName} icon={<UserRound className="h-4 w-4" />} />
                                                <InfoRow label="Số điện thoại nhận hàng" value={order.recipientPhone || order.parentPhone || "Chưa có dữ liệu"} icon={<Phone className="h-4 w-4" />} />
                                                <InfoRow label="Ngày đặt" value={formatDateTime(order.orderDate)} icon={<CalendarDays className="h-4 w-4" />} />
                                            </div>
                                        </div>

                                        <div className="rounded-[8px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                <div>
                                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Sản phẩm</p>
                                                    <h2 className="mt-2 text-2xl font-bold text-gray-900">Danh sách cần xử lý</h2>
                                                </div>
                                                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700">
                                                    {order.items.length} mẫu
                                                </div>
                                            </div>

                                            <div className="mt-5 space-y-3">
                                                {order.items.map((item) => (
                                                    <ProductRow key={item.orderItemId} item={item} />
                                                ))}
                                            </div>

                                            <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                                                <span className="text-sm font-semibold text-slate-500">Tổng số lượng: {order.items.reduce((total, item) => total + item.quantity, 0)} sản phẩm</span>
                                                <span className="text-2xl font-bold text-slate-950">{formatCurrency(order.totalAmount)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="rounded-[8px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Trạng thái</p>
                                                    <h2 className="mt-2 text-2xl font-bold text-gray-900">{statusMeta.label}</h2>
                                                </div>
                                                <span className={`nb-badge ${statusMeta.badge}`}>{statusMeta.label}</span>
                                            </div>

                                            <div className="mt-5 grid gap-3">
                                                {STATUS_FLOW.map((status, index) => {
                                                    const meta = getStatusMeta(status);
                                                    const active = order.orderStatus === status;
                                                    const complete = currentStatusIndex >= index;
                                                    return (
                                                        <div key={status} className="flex items-center gap-3">
                                                            <div className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                                                                complete ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-300"
                                                            }`}>
                                                                {complete ? <CheckCircle2 className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className={`text-sm font-bold ${active ? meta.tone : "text-slate-600"}`}>{meta.label}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">
                                                {order.orderStatus === "Paid" ? (
                                                    <button
                                                        onClick={() => confirmStatusChange("Tiếp nhận đơn hàng", "Xác nhận tiếp nhận đơn hàng này để chuẩn bị sản xuất?", () => acceptDirectOrder(order.orderId))}
                                                        disabled={submitting}
                                                        className="nb-btn nb-btn-green w-full"
                                                    >
                                                        Tiếp nhận đơn
                                                    </button>
                                                ) : null}
                                                {order.orderStatus === "Accepted" ? (
                                                    <button
                                                        onClick={() => confirmStatusChange("Bắt đầu sản xuất", "Xác nhận chuyển đơn hàng sang trạng thái đang sản xuất?", () => markDirectOrderInProduction(order.orderId))}
                                                        disabled={submitting}
                                                        className="nb-btn nb-btn-green w-full"
                                                    >
                                                        Bắt đầu sản xuất
                                                    </button>
                                                ) : null}
                                                {order.orderStatus === "InProduction" ? (
                                                    <button
                                                        onClick={() => confirmStatusChange("Sẵn sàng giao hàng", "Xác nhận sản phẩm đã hoàn tất và sẵn sàng giao?", () => markDirectOrderReadyToShip(order.orderId))}
                                                        disabled={submitting}
                                                        className="nb-btn nb-btn-green w-full"
                                                    >
                                                        Sẵn sàng giao
                                                    </button>
                                                ) : null}
                                                {!["Paid", "Accepted", "InProduction", "ReadyToShip"].includes(order.orderStatus) ? (
                                                    <p className="rounded-[8px] border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
                                                        Không có hành động trạng thái cần xử lý ở bước này.
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>

                                        <div className="rounded-[8px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Logistics</p>
                                                    <h2 className="mt-2 text-2xl font-bold text-gray-900">Giao hàng</h2>
                                                </div>
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-slate-900">
                                                    <Truck className="h-5 w-5" />
                                                </div>
                                            </div>

                                            <div className="mt-5 grid gap-4">
                                                <InfoRow label="Địa chỉ giao hàng" value={order.shippingAddress} icon={<MapPin className="h-4 w-4" />} />
                                                <InfoRow label="Phương thức" value={deliveryMethodLabel(order.deliveryMethod)} icon={<Route className="h-4 w-4" />} />
                                            </div>

                                            {order.orderStatus === "ReadyToShip" ? (
                                                <div className="mt-5 space-y-4 border-t border-slate-100 pt-5">
                                                    <div>
                                                        <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">Đơn vị vận chuyển</label>
                                                        <input
                                                            value={shippingCompany}
                                                            onChange={(event) => setShippingCompany(event.target.value)}
                                                            className="nb-input mt-2 w-full"
                                                            placeholder="VD: GHN, GHTK, Viettel Post"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">Mã vận đơn</label>
                                                        <input
                                                            value={trackingCode}
                                                            onChange={(event) => setTrackingCode(event.target.value)}
                                                            className="nb-input mt-2 w-full"
                                                            placeholder="Nhập mã tracking"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => confirmStatusChange("Xác nhận giao hàng", `Xác nhận giao hàng qua ${shippingCompany} với mã ${trackingCode}?`, () => shipDirectOrder(order.orderId, { trackingCode, shippingCompany }))}
                                                        disabled={submitting || !trackingCode.trim() || !shippingCompany.trim()}
                                                        className="nb-btn nb-btn-green w-full"
                                                    >
                                                        Xác nhận khởi hành
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5">
                                                    <InfoRow label="Đơn vị vận chuyển" value={order.shippingCompany || "Chưa cập nhật"} icon={<Truck className="h-4 w-4" />} />
                                                    <InfoRow label="Mã vận đơn" value={order.trackingCode || "Chưa cập nhật"} icon={<Hash className="h-4 w-4" />} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="rounded-[8px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Thanh toán</p>
                                            <div className="mt-4 flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-slate-900">
                                                        <CreditCard className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-950">Giá trị đơn</p>
                                                        <p className="text-xs font-semibold text-slate-500">{order.pricingMode || "Theo cấu hình giá"}</p>
                                                    </div>
                                                </div>
                                                <p className="text-xl font-bold text-slate-950">{formatCurrency(order.totalAmount)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </>
                        )}
                    </main>
                </div>
            </div>

            {confirmAction ? (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmAction(null)} />
                    <div className="relative w-full max-w-[400px] overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-soft-xl animate-in fade-in zoom-in duration-200">
                        <div className="border-b border-violet-100 bg-violet-50 px-6 py-4">
                            <h3 className="text-lg font-bold text-gray-900">{confirmAction.title}</h3>
                        </div>
                        <div className="px-6 py-6">
                            <p className="text-sm font-semibold leading-7 text-gray-600">{confirmAction.message}</p>
                            <div className="mt-6 flex gap-2.5">
                                <button
                                    onClick={() => setConfirmAction(null)}
                                    className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-[13px] font-bold text-gray-900 transition-all hover:bg-slate-50"
                                >
                                    Quay lại
                                </button>
                                <button
                                    onClick={confirmAction.onConfirm}
                                    disabled={submitting}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-[13px] font-bold text-white shadow-soft-sm transition-all hover:bg-violet-700 disabled:opacity-50"
                                >
                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : null}
                                    Xác nhận
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
