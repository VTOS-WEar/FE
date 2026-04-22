import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    CheckCircle2,
    ChevronRight,
    Clock3,
    Loader2,
    Package,
    ShoppingBag,
    Sparkles,
    Truck,
    WandSparkles,
} from "lucide-react";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useProviderSidebarConfig } from "../../hooks/useProviderSidebarConfig";
import {
    acceptDirectOrder,
    getProviderDirectOrderStats,
    getProviderDirectOrders,
    markDirectOrderInProduction,
    markDirectOrderReadyToShip,
    type ProviderIncomingOrderItemDto,
    type ProviderOrderStatsDto,
} from "../../lib/api/providers";
import { useToast } from "../../contexts/ToastContext";

const ORDER_STATUS_MAP: Record<string, { label: string; className: string; tone: string }> = {
    Pending: { label: "Chờ xử lý", className: "nb-badge-yellow", tone: "bg-slate-100 text-slate-600" },
    Paid: { label: "Đã thanh toán", className: "nb-badge-blue", tone: "bg-amber-50 text-amber-700" },
    Accepted: { label: "Đã tiếp nhận", className: "nb-badge-blue", tone: "bg-sky-50 text-sky-700" },
    InProduction: { label: "Đang sản xuất", className: "nb-badge-purple", tone: "bg-violet-50 text-violet-700" },
    ReadyToShip: { label: "Chờ giao hàng", className: "nb-badge-purple", tone: "bg-indigo-50 text-indigo-700" },
    Shipped: { label: "Đang giao", className: "nb-badge-blue", tone: "bg-blue-50 text-blue-700" },
    Delivered: { label: "Đã giao", className: "nb-badge-green", tone: "bg-emerald-50 text-emerald-700" },
    Cancelled: { label: "Đã hủy", className: "nb-badge-red", tone: "bg-rose-50 text-rose-700" },
    Refunded: { label: "Đã hoàn tiền", className: "nb-badge-red", tone: "bg-rose-50 text-rose-700" },
};

const STATUS_FILTER_OPTIONS = [
    { value: "", label: "Tất cả" },
    { value: "Paid", label: "Chờ tiếp nhận" },
    { value: "Accepted", label: "Đã tiếp nhận" },
    { value: "InProduction", label: "Đang sản xuất" },
    { value: "ReadyToShip", label: "Chờ giao" },
    { value: "Shipped", label: "Đang giao" },
    { value: "Delivered", label: "Đã giao" },
    { value: "Cancelled", label: "Đã hủy" },
];

function formatCurrency(value: number) {
    return `${value.toLocaleString("vi-VN")} ₫`;
}

function OrderStatusBadge({ status }: { status: string }) {
    const config = ORDER_STATUS_MAP[status] || {
        label: status,
        className: "nb-badge-yellow",
        tone: "bg-slate-100 text-slate-700",
    };

    return <span className={`nb-badge ${config.className}`}>{config.label}</span>;
}

function StageSummaryCard({
    label,
    value,
    note,
    icon,
    tone,
}: {
    label: string;
    value: string | number;
    note: string;
    icon: React.ReactNode;
    tone: string;
}) {
    return (
        <div className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-soft-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">{label}</p>
                    <p className="mt-2 text-3xl font-black text-gray-900">{value}</p>
                    <p className="mt-2 text-sm font-semibold text-gray-500">{note}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}>{icon}</div>
            </div>
        </div>
    );
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
                message: "Cập nhật trạng thái đơn hàng thành công.",
                variant: "success",
            });
            fetchData();
            setConfirmAction(null);
        } catch (err: any) {
            showToast({
                title: "Lỗi",
                message: err.message || "Có lỗi xảy ra khi cập nhật trạng thái.",
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
                description: "Đơn đã thanh toán, sẵn sàng đưa vào dây chuyền.",
                onClick: () =>
                    confirmStatusChange(
                        "Tiếp nhận đơn hàng?",
                        "Đơn sẽ chuyển sang trạng thái đã tiếp nhận để bắt đầu điều phối sản xuất.",
                        () => acceptDirectOrder(order.orderId),
                    ),
            };
        }

        if (order.orderStatus === "Accepted") {
            return {
                label: "Bắt đầu sản xuất",
                description: "Chuyển đơn sang giai đoạn đang sản xuất.",
                onClick: () =>
                    confirmStatusChange(
                        "Bắt đầu sản xuất?",
                        "Đơn hàng sẽ được chuyển sang trạng thái đang sản xuất.",
                        () => markDirectOrderInProduction(order.orderId),
                    ),
            };
        }

        if (order.orderStatus === "InProduction") {
            return {
                label: "Xác nhận có hàng",
                description: "Đánh dấu đơn đã hoàn tất sản xuất và chờ giao.",
                onClick: () =>
                    confirmStatusChange(
                        "Xác nhận sẵn sàng giao?",
                        "Đơn sẽ chuyển sang trạng thái chờ giao hàng.",
                        () => markDirectOrderReadyToShip(order.orderId),
                    ),
            };
        }

        return null;
    };

    const stageCards = useMemo(
        () => [
            {
                label: "Chờ tiếp nhận",
                value: stats?.paidOrders ?? 0,
                note: "Ưu tiên xác nhận để tránh đơn bị tồn ở đầu dây chuyền.",
                tone: "bg-amber-50 text-amber-600",
                icon: <Clock3 className="h-5 w-5" />,
            },
            {
                label: "Đang sản xuất",
                value: stats?.inProgressOrders ?? 0,
                note: "Các đơn đang đi qua giai đoạn cắt may hoặc hoàn thiện.",
                tone: "bg-violet-50 text-violet-600",
                icon: <WandSparkles className="h-5 w-5" />,
            },
            {
                label: "Đã giao hoàn tất",
                value: stats?.completedShipmentOrders ?? 0,
                note: "Các đơn đã hoàn thành vòng đời giao nhận.",
                tone: "bg-emerald-50 text-emerald-600",
                icon: <CheckCircle2 className="h-5 w-5" />,
            },
            {
                label: "Doanh thu từ đơn",
                value: formatCurrency(stats?.totalRevenue ?? 0),
                note: "Tổng doanh thu hiện ghi nhận từ kênh đơn trực tiếp.",
                tone: "bg-blue-50 text-blue-600",
                icon: <Truck className="h-5 w-5" />,
            },
        ],
        [stats],
    );

    const actionRequiredCount = (stats?.paidOrders ?? 0) + (stats?.inProgressOrders ?? 0);

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} />
                </div>

                <div className="flex-1 min-w-0">
                    <TopNavBar>
                        <div className="flex items-center gap-3 px-2 py-2">
                            <div className="hidden h-10 w-10 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-soft-sm sm:flex">
                                <ShoppingBag className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="text-xl font-extrabold leading-none text-gray-900">Điều phối đơn hàng</h1>
                                <p className="mt-1 text-[12px] font-semibold text-gray-400">
                                    Theo dõi tiến độ sản xuất, chuẩn bị giao hàng, và xử lý các điểm nghẽn trong ngày.
                                </p>
                            </div>
                        </div>
                    </TopNavBar>

                    <main className="space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        <section className="overflow-hidden rounded-[32px] border border-slate-900/70 bg-slate-950 bg-gradient-to-br from-slate-950 via-slate-800 to-violet-900 px-6 py-7 text-white shadow-soft-lg lg:px-8">
                            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                                <div className="max-w-3xl">
                                    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white">
                                        Production queue
                                    </span>
                                    <h2 className="mt-4 text-3xl font-black leading-tight text-white sm:text-4xl">
                                        {stats?.totalOrders ?? 0} đơn đang thuộc phạm vi vận hành của bạn.
                                    </h2>
                                    <p className="mt-3 text-sm font-medium leading-7 text-slate-100 sm:text-base">
                                        Tập trung trước vào các đơn đã thanh toán, sau đó giữ luồng sản xuất và giao hàng chuyển tiếp mượt để không bị nghẽn cuối ngày.
                                    </p>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-3 lg:w-[430px]">
                                    <div className="rounded-[22px] border border-white/10 bg-white/8 p-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">Ưu tiên hôm nay</p>
                                        <p className="mt-2 text-2xl font-black text-white">{actionRequiredCount}</p>
                                    </div>
                                    <div className="rounded-[22px] border border-white/10 bg-white/8 p-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">Đang giao</p>
                                        <p className="mt-2 text-2xl font-black text-white">{stats?.statusCounts?.Shipped ?? 0}</p>
                                    </div>
                                    <div className="rounded-[22px] border border-white/10 bg-white/8 p-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">Doanh thu</p>
                                        <p className="mt-2 text-2xl font-black text-white">
                                            {(stats?.totalRevenue ?? 0).toLocaleString("vi-VN")} ₫
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {stageCards.map((card) => (
                                <StageSummaryCard key={card.label} {...card} />
                            ))}
                        </section>

                        <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Bộ lọc điều phối</p>
                                    <h2 className="mt-2 text-2xl font-black text-gray-900">Chọn hàng đợi cần xử lý</h2>
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-black text-amber-700">
                                    <Sparkles className="h-4 w-4" />
                                    {stats?.paidOrders ?? 0} đơn đang cần tiếp nhận ngay
                                </div>
                            </div>

                            <div className="mt-6 flex min-w-full gap-3 overflow-x-auto pb-1">
                                {STATUS_FILTER_OPTIONS.map((item) => {
                                    const count =
                                        item.value === ""
                                            ? stats?.totalOrders ?? 0
                                            : stats?.statusCounts?.[item.value] ?? 0;
                                    const active = status === item.value;

                                    return (
                                        <button
                                            key={item.value || "all"}
                                            onClick={() => setStatus(item.value)}
                                            className={`inline-flex min-w-max items-center gap-3 rounded-[18px] border px-4 py-3 text-left transition-all ${
                                                active
                                                    ? "border-violet-200 bg-violet-50 text-violet-700"
                                                    : "border-gray-200 bg-white text-gray-600 hover:border-violet-100 hover:text-gray-900"
                                            }`}
                                        >
                                            <span className="text-sm font-black">{item.label}</span>
                                            <span
                                                className={`inline-flex h-6 min-w-[24px] items-center justify-center rounded-full px-2 text-[11px] font-black ${
                                                    active ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-700"
                                                }`}
                                            >
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        {loading ? (
                            <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-[32px] border border-gray-200 bg-white shadow-soft-sm">
                                <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
                                <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">Đang đồng bộ dữ liệu đơn hàng...</p>
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="rounded-[32px] border border-dashed border-gray-300 bg-white p-20 text-center shadow-soft-sm">
                                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] border border-gray-100 bg-violet-50">
                                    <ShoppingBag className="h-9 w-9 text-violet-500" />
                                </div>
                                <h2 className="mt-6 text-xl font-black text-gray-900">Không có đơn trong hàng đợi này</h2>
                                <p className="mt-2 text-sm font-medium text-gray-500">
                                    Thử đổi bộ lọc để xem các đơn ở giai đoạn khác trong luồng sản xuất.
                                </p>
                            </div>
                        ) : (
                            <section className="space-y-4">
                                {orders.map((order) => {
                                    const action = getNextAction(order);
                                    const statusConfig = ORDER_STATUS_MAP[order.orderStatus] || ORDER_STATUS_MAP.Pending;

                                    return (
                                        <article
                                            key={order.orderId}
                                            className="w-full rounded-[28px] border border-gray-200 bg-white p-5 shadow-soft-sm transition-all hover:border-violet-200"
                                        >
                                            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_240px] xl:items-start">
                                                <div className="min-w-0 w-full break-normal [overflow-wrap:normal]">
                                                    <div className="flex min-w-0 flex-wrap items-center gap-3">
                                                        <span className="shrink-0 font-mono text-sm font-black text-gray-900">
                                                            #{order.orderId.slice(0, 8).toUpperCase()}
                                                        </span>
                                                        <OrderStatusBadge status={order.orderStatus} />
                                                        <span className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-[11px] font-black ${statusConfig.tone}`}>
                                                            {new Date(order.orderDate).toLocaleDateString("vi-VN")}
                                                        </span>
                                                    </div>

                                                    <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Khách hàng</p>
                                                            <p className="mt-1 text-base font-black text-gray-900">{order.parentName}</p>
                                                            <p className="mt-1 text-sm font-medium text-gray-500">Học sinh: {order.childName}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Sản phẩm</p>
                                                            <p className="mt-1 text-base font-black text-gray-900">{order.itemCount} món</p>
                                                            <p className="mt-1 text-sm font-medium text-gray-500">Đơn trực tiếp từ phụ huynh</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Tổng giá trị</p>
                                                            <p className="mt-1 text-base font-black text-violet-700">{formatCurrency(order.totalAmount)}</p>
                                                            <p className="mt-1 text-sm font-medium text-gray-500">Theo đơn hiện tại</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Theo dõi vận chuyển</p>
                                                            <p className="mt-1 text-base font-black text-gray-900">
                                                                {order.trackingCode ? order.trackingCode : "Chưa có mã"}
                                                            </p>
                                                            <p className="mt-1 text-sm font-medium text-gray-500">
                                                                {order.trackingCode ? "Đã có thông tin chuyển phát" : "Sẽ cập nhật ở bước giao hàng"}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {action ? (
                                                        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-black text-amber-700">
                                                            <Clock3 className="h-4 w-4" />
                                                            {action.description}
                                                        </div>
                                                    ) : null}
                                                </div>

                                                <div className="flex w-full flex-col gap-3 xl:w-[240px] xl:shrink-0">
                                                    {action ? (
                                                        <button
                                                            onClick={(event) => {
                                                                event.preventDefault();
                                                                action.onClick();
                                                            }}
                                                            className="inline-flex h-11 items-center justify-center rounded-[16px] bg-violet-600 px-4 text-sm font-black text-white shadow-soft-sm transition-all hover:bg-violet-700"
                                                        >
                                                            {action.label}
                                                        </button>
                                                    ) : null}

                                                    <button
                                                        onClick={() => navigate(`/provider/orders/${order.orderId}`)}
                                                        className="inline-flex h-11 items-center justify-center gap-2 rounded-[16px] border border-gray-200 bg-white px-4 text-sm font-black text-gray-700 transition-all hover:border-violet-200 hover:text-violet-700"
                                                    >
                                                        Xem chi tiết
                                                        <ChevronRight className="h-4 w-4" />
                                                    </button>

                                                    {!action ? (
                                                        <Link
                                                            to={`/provider/orders/${order.orderId}`}
                                                            className="inline-flex h-11 items-center justify-center gap-2 rounded-[16px] bg-slate-50 px-4 text-sm font-black text-slate-700 transition-all hover:bg-slate-100"
                                                        >
                                                            Mở hồ sơ đơn
                                                            <Package className="h-4 w-4" />
                                                        </Link>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </section>
                        )}
                    </main>
                </div>
            </div>

            {confirmAction ? (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmAction(null)} />
                    <div className="relative w-full max-w-[400px] overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-soft-xl animate-in fade-in zoom-in duration-200">
                        <div className="border-b border-violet-100 bg-violet-50 px-6 py-4">
                            <h3 className="text-lg font-black text-gray-900">{confirmAction.title}</h3>
                        </div>
                        <div className="px-6 py-6">
                            <p className="text-sm font-semibold leading-7 text-gray-600">{confirmAction.message}</p>
                            <div className="mt-6 flex gap-2.5">
                                <button
                                    onClick={() => setConfirmAction(null)}
                                    className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-[13px] font-black text-gray-900 transition-all hover:bg-slate-50"
                                >
                                    Quay lại
                                </button>
                                <button
                                    onClick={confirmAction.onConfirm}
                                    disabled={submitting}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-[13px] font-black text-white shadow-soft-sm transition-all hover:bg-violet-700 disabled:opacity-50"
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
