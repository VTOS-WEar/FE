import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    CheckCircle2,
    ChevronDown,
    CreditCard,
    Eye,
    Loader2,
    PackageSearch,
    RotateCcw,
    Search,
    ShoppingBag,
    Truck,
    WandSparkles,
    XCircle,
} from "lucide-react";
import {
    CartesianGrid as OriginalCartesianGrid,
    Line as OriginalLine,
    LineChart as OriginalLineChart,
    ResponsiveContainer as OriginalResponsiveContainer,
    Tooltip as OriginalTooltip,
    XAxis as OriginalXAxis,
    YAxis as OriginalYAxis,
} from "recharts";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { PROVIDER_LIST_PAGE_SIZE, ProviderDataTable, type ProviderDataTableColumn } from "../../components/provider/ProviderDataTable";
import { usePreservedResultsHeight } from "../../hooks/usePreservedResultsHeight";
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

const LineChart = OriginalLineChart as any;
const Line = OriginalLine as any;
const XAxis = OriginalXAxis as any;
const YAxis = OriginalYAxis as any;
const CartesianGrid = OriginalCartesianGrid as any;
const Tooltip = OriginalTooltip as any;
const ResponsiveContainer = OriginalResponsiveContainer as any;

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

const PROCESSING_STATUS_FILTER = "Accepted,InProduction,ReadyToShip";

const PAYMENT_STATUS_OPTIONS = [
    { value: "", label: "Trạng thái thanh toán" },
    { value: "Pending", label: "Chờ thanh toán" },
    { value: "Paid", label: "Đã thanh toán" },
    { value: "Refunded", label: "Đã hoàn tiền" },
    { value: "Cancelled", label: "Đã hủy" },
];

const RECEIVED_STATUS_OPTIONS = [
    { value: "", label: "Trạng thái tiếp nhận" },
    { value: PROCESSING_STATUS_FILTER, label: "Đang xử lý" },
    { value: "Accepted", label: "Đã tiếp nhận" },
    { value: "InProduction", label: "Đang sản xuất" },
    { value: "ReadyToShip", label: "Chờ giao" },
    { value: "Shipped", label: "Đang giao" },
    { value: "Delivered", label: "Đã giao" },
];

const DATE_SORT_OPTIONS = [
    { value: "all", label: "All time" },
    { value: "week", label: "This week" },
    { value: "month", label: "This month" },
];

const MIN_PAGE_FETCH_FEEDBACK_MS = 700;
const MIN_FILTER_COMMIT_MS = 450;

function formatCurrency(value: number) {
    return `${value.toLocaleString("vi-VN")} ₫`;
}

function formatCompactCurrency(value: number) {
    if (value >= 1_000_000) return `${Math.round(value / 1_000_000)}tr`;
    if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
    return String(value);
}

function formatDateParam(value: Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function OrderStatusBadge({ status }: { status: string }) {
    const config = ORDER_STATUS_MAP[status] || {
        label: status,
        className: "nb-badge-yellow",
        tone: "bg-slate-100 text-slate-700",
    };

    return <span className={`nb-badge ${config.className}`}>{config.label}</span>;
}

function StatusSummaryCard({
    label,
    value,
    icon,
    surfaceClassName,
    iconClassName,
    active,
    onClick,
}: {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    surfaceClassName: string;
    iconClassName: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={`min-h-[100px] rounded-[8px] border p-5 text-left shadow-soft-sm transition-all hover:-translate-y-0.5 hover:shadow-soft-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-100 ${
                active ? "border-violet-500 ring-2 ring-violet-200" : "border-white/70"
            } ${surfaceClassName}`}
        >
            <div className="flex h-full items-center gap-4">
                <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-white shadow-soft-xs ${iconClassName}`}>{icon}</div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700">{label}</p>
                    <p className="mt-2 text-2xl font-bold leading-none text-slate-950">{value}</p>
                </div>
            </div>
        </button>
    );
}

export function ProviderOrders(): JSX.Element {
    const sidebarConfig = useProviderSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [orders, setOrders] = useState<ProviderIncomingOrderItemDto[]>([]);
    const [stats, setStats] = useState<ProviderOrderStatsDto | null>(null);
    const [status, setStatus] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [dateRange, setDateRange] = useState("all");
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [fetchingOrders, setFetchingOrders] = useState(false);
    const [filtering, setFiltering] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
    const hasLoadedOrdersRef = useRef(false);
    const fetchStartedAtRef = useRef(0);
    const fetchSequenceRef = useRef(0);
    const filterTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
    const { showToast } = useToast();
    const navigate = useNavigate();

    const dateFilters = useMemo(() => {
        const now = new Date();
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);

        if (dateRange === "all") {
            return {
                search: searchTerm,
            };
        }

        if (dateRange === "week") {
            const day = start.getDay();
            const diffToMonday = day === 0 ? -6 : 1 - day;
            start.setDate(start.getDate() + diffToMonday);
        } else {
            start.setDate(1);
        }

        return {
            fromDate: formatDateParam(start),
            toDate: formatDateParam(now),
            search: searchTerm,
        };
    }, [dateRange, searchTerm]);

    const fetchData = useCallback(() => {
        const isInitialLoad = !hasLoadedOrdersRef.current;
        const fetchSequence = fetchSequenceRef.current + 1;
        fetchSequenceRef.current = fetchSequence;
        setLoading(isInitialLoad);
        setFetchingOrders(!isInitialLoad);
        fetchStartedAtRef.current = Date.now();
        Promise.all([getProviderDirectOrders(page, PROVIDER_LIST_PAGE_SIZE, status || undefined, dateFilters), getProviderDirectOrderStats()])
            .then(([orderResponse, statsResponse]) => {
                setOrders(orderResponse.items);
                setTotalCount(orderResponse.totalCount);
                setStats(statsResponse);
            })
            .finally(() => {
                const elapsed = Date.now() - fetchStartedAtRef.current;
                const finish = () => {
                    if (fetchSequence !== fetchSequenceRef.current) return;
                    hasLoadedOrdersRef.current = true;
                    setLoading(false);
                    setFetchingOrders(false);
                };

                if (!isInitialLoad && elapsed < MIN_PAGE_FETCH_FEEDBACK_MS) {
                    window.setTimeout(finish, MIN_PAGE_FETCH_FEEDBACK_MS - elapsed);
                    return;
                }

                finish();
            });
    }, [dateFilters, page, status]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        return () => {
            if (filterTimerRef.current) {
                window.clearTimeout(filterTimerRef.current);
            }
        };
    }, []);

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

    const statusSummaryCards = useMemo(
        () => [
            {
                label: "Tổng đơn",
                value: stats?.totalOrders ?? 0,
                filterValue: "",
                surfaceClassName: "bg-blue-100",
                iconClassName: "text-slate-900",
                icon: <Box className="h-6 w-6" />,
            },
            {
                label: "Chờ thanh toán",
                value: stats?.pendingOrders ?? 0,
                filterValue: "Pending",
                surfaceClassName: "bg-yellow-100",
                iconClassName: "text-slate-900",
                icon: <CreditCard className="h-6 w-6" />,
            },
            {
                label: "Chờ tiếp nhận",
                value: stats?.paidOrders ?? 0,
                filterValue: "Paid",
                surfaceClassName: "bg-teal-100",
                iconClassName: "text-slate-900",
                icon: <PackageSearch className="h-6 w-6" />,
            },
            {
                label: "Đang xử lý",
                value: stats?.inProgressOrders ?? 0,
                filterValue: PROCESSING_STATUS_FILTER,
                surfaceClassName: "bg-orange-100",
                iconClassName: "text-slate-900",
                icon: <WandSparkles className="h-6 w-6" />,
            },
            {
                label: "Đang giao",
                value: stats?.statusCounts?.Shipped ?? 0,
                filterValue: "Shipped",
                surfaceClassName: "bg-pink-100",
                iconClassName: "text-slate-900",
                icon: <Truck className="h-6 w-6" />,
            },
            {
                label: "Đã giao",
                value: stats?.statusCounts?.Delivered ?? 0,
                filterValue: "Delivered",
                surfaceClassName: "bg-lime-200",
                iconClassName: "text-slate-900",
                icon: <CheckCircle2 className="h-6 w-6" />,
            },
            {
                label: "Đã hủy",
                value: stats?.statusCounts?.Cancelled ?? 0,
                filterValue: "Cancelled",
                surfaceClassName: "bg-amber-200",
                iconClassName: "text-slate-900",
                icon: <XCircle className="h-6 w-6" />,
            },
            {
                label: "Hoàn tiền",
                value: stats?.statusCounts?.Refunded ?? 0,
                filterValue: "Refunded",
                surfaceClassName: "bg-cyan-100",
                iconClassName: "text-slate-900",
                icon: <RotateCcw className="h-6 w-6" />,
            },
        ],
        [stats],
    );

    const chartData = useMemo(
        () => (stats?.monthlyMetrics ?? []).map((item) => ({
            month: item.month,
            revenue: item.revenue,
            completedRevenue: item.completedRevenue,
            orders: item.orders,
        })),
        [stats],
    );

    const totalPages = Math.max(1, Math.ceil(totalCount / PROVIDER_LIST_PAGE_SIZE));
    const isFilteredEmptyState = !loading && !!status && orders.length === 0;
    const { preserveResultsHeight, preservedHeightStyle, resultsRegionRef } = usePreservedResultsHeight(isFilteredEmptyState);
    const displayedOrders = orders;
    const paymentStatus = PAYMENT_STATUS_OPTIONS.some((item) => item.value === status) ? status : "";
    const receivedStatus = RECEIVED_STATUS_OPTIONS.some((item) => item.value === status) ? status : "";

    const scheduleSearchCommit = useCallback(
        (nextSearch: string) => {
            preserveResultsHeight();
            setFiltering(true);
            if (filterTimerRef.current) {
                window.clearTimeout(filterTimerRef.current);
            }
            filterTimerRef.current = window.setTimeout(() => {
                setSearchTerm(nextSearch);
                setPage(1);
                setFiltering(false);
                filterTimerRef.current = null;
            }, MIN_FILTER_COMMIT_MS);
        },
        [preserveResultsHeight],
    );

    const handleStatusChange = (nextStatus: string) => {
        preserveResultsHeight();
        setStatus(nextStatus);
        setPage(1);
    };

    const handleSummaryCardClick = (nextStatus: string) => {
        preserveResultsHeight();
        setStatus(nextStatus);
        setDateRange("all");
        setPage(1);
    };

    const orderColumns: ProviderDataTableColumn<ProviderIncomingOrderItemDto>[] = [
        {
            key: "id",
            header: "ID",
            render: (order) => (
                <span className="font-mono text-sm font-bold text-slate-900">
                    #{order.orderId.slice(0, 8).toUpperCase()}
                </span>
            ),
        },
        {
            key: "customer",
            header: "Khách hàng",
            render: (order) => <span className="font-bold text-slate-900">{order.parentName}</span>,
        },
        {
            key: "items",
            header: "Sản phẩm",
            render: (order) => <span className="font-semibold">{order.itemCount} món</span>,
        },
        {
            key: "amount",
            header: "Giá trị",
            render: (order) => <span className="font-bold text-violet-700">{formatCurrency(order.totalAmount)}</span>,
        },
        {
            key: "status",
            header: "Trạng thái",
            render: (order) => <OrderStatusBadge status={order.orderStatus} />,
        },
        {
            key: "tracking",
            header: "Vận chuyển",
            render: (order) => (
                <span className="font-semibold text-slate-700">
                    {order.trackingCode ? order.trackingCode : "Chưa có mã"}
                </span>
            ),
        },
        {
            key: "date",
            header: "Ngày",
            render: (order) => (
                <span className="whitespace-nowrap font-semibold text-slate-600">
                    {new Date(order.orderDate).toLocaleDateString("vi-VN")}
                </span>
            ),
        },
        {
            key: "action",
            header: "Action",
            className: "text-right",
            render: (order) => {
                const action = getNextAction(order);

                return (
                    <div className="flex items-center justify-end gap-2">
                        {action ? (
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    action.onClick();
                                }}
                                className="rounded-[8px] bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 transition-colors hover:bg-violet-100"
                            >
                                {action.label}
                            </button>
                        ) : null}
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                navigate(`/provider/orders/${order.orderId}`);
                            }}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-slate-200 bg-white text-slate-700 transition-colors hover:border-violet-200 hover:text-violet-700"
                            aria-label="Xem chi tiết đơn hàng"
                        >
                            <Eye className="h-4 w-4" />
                        </button>
                    </div>
                );
            },
        },
    ];

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
                                <h1 className="text-xl font-bold leading-none text-gray-900">Điều phối đơn hàng</h1>
                            </div>
                        </div>
                    </TopNavBar>

                    <main className="space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        <section className="space-y-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-950">Tổng quan đơn hàng</h2>
                                    <p className="mt-1 text-sm font-semibold text-slate-500">
                                        Doanh thu ghi nhận: <span className="text-slate-900">{formatCurrency(stats?.totalRevenue ?? 0)}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                {statusSummaryCards.map((card) => (
                                    <StatusSummaryCard
                                        key={card.label}
                                        {...card}
                                        active={status === card.filterValue}
                                        onClick={() => handleSummaryCardClick(card.filterValue)}
                                    />
                                ))}
                            </div>
                        </section>

                        <section className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-soft-sm lg:p-6">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-950">Hiệu suất đơn hàng</h2>
                                    <p className="mt-1 text-sm font-semibold text-slate-500">Theo dõi doanh thu và doanh thu đã giao trong 12 tháng gần nhất.</p>
                                </div>
                                <div className="flex flex-wrap gap-4 text-sm font-semibold text-slate-600">
                                    <span className="inline-flex items-center gap-2">
                                        <span className="h-2.5 w-2.5 rounded-full bg-teal-600" />
                                        Doanh thu
                                    </span>
                                    <span className="inline-flex items-center gap-2">
                                        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                                        Đã giao
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6 h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 10, right: 18, bottom: 0, left: -12 }}>
                                        <CartesianGrid stroke="#E5E7EB" strokeDasharray="4 6" vertical={false} />
                                        <XAxis
                                            dataKey="month"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: "#64748B", fontSize: 12, fontWeight: 600 }}
                                            dy={12}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: "#64748B", fontSize: 12, fontWeight: 600 }}
                                            tickFormatter={formatCompactCurrency}
                                        />
                                        <Tooltip
                                            cursor={{ stroke: "#CBD5E1", strokeWidth: 1 }}
                                            formatter={(value: number, name: string) => [
                                                formatCurrency(Number(value)),
                                                name === "revenue" ? "Doanh thu" : "Đã giao",
                                            ]}
                                            labelFormatter={(label: string) => `Tháng ${String(label).replace("T", "")}`}
                                            contentStyle={{
                                                border: "1px solid #E2E8F0",
                                                borderRadius: "8px",
                                                boxShadow: "0 14px 30px rgba(15, 23, 42, 0.12)",
                                                fontWeight: 700,
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#0F8F85"
                                            strokeWidth={3}
                                            dot={false}
                                            activeDot={{ r: 5, fill: "#0F8F85", stroke: "#FFFFFF", strokeWidth: 2 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="completedRevenue"
                                            stroke="#F7B84B"
                                            strokeWidth={3}
                                            dot={false}
                                            activeDot={{ r: 5, fill: "#F7B84B", stroke: "#FFFFFF", strokeWidth: 2 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </section>

                        <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <label className="relative block w-full lg:max-w-[300px]">
                                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                <input
                                    value={searchInput}
                                    onChange={(event) => {
                                        const nextSearch = event.target.value;
                                        setSearchInput(nextSearch);
                                        scheduleSearchCommit(nextSearch);
                                    }}
                                    placeholder="Search..."
                                    className="h-10 w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-800 outline-none shadow-soft-xs transition-colors placeholder:text-slate-500 focus:border-violet-200 focus:ring-4 focus:ring-violet-50"
                                />
                            </label>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                                <label className="relative block">
                                    <select
                                        value={paymentStatus}
                                        onChange={(event) => handleStatusChange(event.target.value)}
                                        className="h-10 min-w-[148px] appearance-none rounded-full border border-slate-200 bg-white py-0 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none shadow-soft-xs transition-colors focus:border-violet-200 focus:ring-4 focus:ring-violet-50"
                                    >
                                        {PAYMENT_STATUS_OPTIONS.map((option) => (
                                            <option key={option.value || "all-payment"} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-900" />
                                </label>

                                <label className="relative block">
                                    <select
                                        value={receivedStatus}
                                        onChange={(event) => handleStatusChange(event.target.value)}
                                        className="h-10 min-w-[156px] appearance-none rounded-full border border-slate-200 bg-white py-0 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none shadow-soft-xs transition-colors focus:border-violet-200 focus:ring-4 focus:ring-violet-50"
                                    >
                                        {RECEIVED_STATUS_OPTIONS.map((option) => (
                                            <option key={option.value || "all-received"} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-900" />
                                </label>

                                <label className="relative block">
                                    <select
                                        value={dateRange}
                                        onChange={(event) => {
                                            setDateRange(event.target.value);
                                            setPage(1);
                                        }}
                                        className="h-10 min-w-[112px] appearance-none rounded-full border border-slate-200 bg-white py-0 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none shadow-soft-xs transition-colors focus:border-violet-200 focus:ring-4 focus:ring-violet-50"
                                    >
                                        {DATE_SORT_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-900" />
                                </label>

                                {fetchingOrders || filtering ? (
                                    <div className="inline-flex h-10 items-center gap-2 rounded-full border border-violet-100 bg-white px-3 text-xs font-bold text-violet-700 shadow-soft-sm">
                                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-violet-100 border-t-violet-700" />
                                        Đang lọc
                                    </div>
                                ) : null}
                            </div>
                        </section>

                        <section className="hidden">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Bộ lọc điều phối</p>
                                    <h2 className="mt-2 text-2xl font-bold text-gray-900">Chọn hàng đợi cần xử lý</h2>
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
                                            onClick={() => {
                                                preserveResultsHeight();
                                                setStatus(item.value);
                                                setPage(1);
                                            }}
                                            className={`inline-flex min-w-max items-center gap-3 rounded-[18px] border px-4 py-3 text-left transition-all ${
                                                active
                                                    ? "border-violet-200 bg-violet-50 text-violet-700"
                                                    : "border-gray-200 bg-white text-gray-600 hover:border-violet-100 hover:text-gray-900"
                                            }`}
                                        >
                                            <span className="text-sm font-bold">{item.label}</span>
                                            <span
                                                className={`inline-flex h-6 min-w-[24px] items-center justify-center rounded-full px-2 text-[11px] font-bold ${
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

                        <div ref={resultsRegionRef} style={preservedHeightStyle} className="relative">
                        {loading ? (
                            <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-[32px] border border-gray-200 bg-white shadow-soft-sm">
                                <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Đang đồng bộ dữ liệu đơn hàng...</p>
                            </div>
                        ) : displayedOrders.length === 0 ? (
                            <div className="rounded-[32px] border border-dashed border-gray-300 bg-white p-20 text-center shadow-soft-sm">
                                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] border border-gray-100 bg-violet-50">
                                    <ShoppingBag className="h-9 w-9 text-violet-500" />
                                </div>
                                <h2 className="mt-6 text-xl font-bold text-gray-900">Không có đơn trong hàng đợi này</h2>
                            </div>
                        ) : (
                            <ProviderDataTable
                                items={displayedOrders}
                                columns={orderColumns}
                                getKey={(order) => order.orderId}
                                onRowClick={(order) => navigate(`/provider/orders/${order.orderId}`)}
                            />
                        )}

                        {totalPages > 1 ? (
                            <div className="flex items-center justify-center gap-3">
                                <button
                                    disabled={page <= 1 || fetchingOrders}
                                    onClick={() => {
                                        preserveResultsHeight();
                                        setPage((current) => current - 1);
                                    }}
                                    className="nb-btn nb-btn-outline nb-btn-sm text-sm"
                                >
                                    ← Trước
                                </button>
                                <span className="text-sm font-medium text-gray-500">{page}/{totalPages}</span>
                                <button
                                    disabled={page >= totalPages || fetchingOrders}
                                    onClick={() => {
                                        preserveResultsHeight();
                                        setPage((current) => current + 1);
                                    }}
                                    className="nb-btn nb-btn-outline nb-btn-sm text-sm"
                                >
                                    Sau →
                                </button>
                            </div>
                        ) : null}
                        </div>
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
