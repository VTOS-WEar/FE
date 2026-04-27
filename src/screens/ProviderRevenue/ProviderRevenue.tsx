import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowDownToLine,
    Banknote,
    CheckCircle2,
    Download,
    ExternalLink,
    FileSpreadsheet,
    Loader2,
    PercentCircle,
    ShoppingBag,
    TableProperties,
    TimerReset,
} from "lucide-react";
import * as XLSX from "xlsx";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { PROVIDER_LIST_PAGE_SIZE, ProviderDataTable, type ProviderDataTableColumn } from "../../components/provider/ProviderDataTable";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useProviderSidebarConfig } from "../../hooks/useProviderSidebarConfig";
import {
    getProviderRevenue,
    type ProviderRevenueDto,
} from "../../lib/api/payments";
import {
    getProviderDirectOrders,
    getProviderProfile,
    type ProviderIncomingOrderItemDto,
} from "../../lib/api/providers";

function fmt(value: number) {
    return `${value.toLocaleString("vi-VN")} ₫`;
}

function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function orderStatusLabel(status: string) {
    switch (status) {
        case "Pending":
            return "Chờ thanh toán";
        case "Paid":
            return "Đã thanh toán";
        case "Accepted":
            return "Đã tiếp nhận";
        case "InProduction":
            return "Đang sản xuất";
        case "ReadyToShip":
            return "Chờ giao hàng";
        case "Shipped":
            return "Đang giao";
        case "Delivered":
            return "Đã giao";
        case "Cancelled":
            return "Đã hủy";
        case "Refunded":
            return "Đã hoàn tiền";
        default:
            return status;
    }
}

function orderStatusClass(status: string) {
    switch (status) {
        case "Pending":
            return "nb-badge nb-badge-yellow";
        case "Paid":
        case "Accepted":
        case "InProduction":
        case "ReadyToShip":
        case "Shipped":
            return "nb-badge nb-badge-blue";
        case "Delivered":
            return "nb-badge nb-badge-green";
        case "Cancelled":
        case "Refunded":
            return "nb-badge nb-badge-red";
        default:
            return "nb-badge bg-slate-100 text-slate-700";
    }
}

function orderPaymentLabel(status: string) {
    switch (status) {
        case "Pending":
            return "Chờ thanh toán";
        case "Cancelled":
            return "Đã hủy";
        case "Refunded":
            return "Đã hoàn tiền";
        default:
            return "Đã thanh toán";
    }
}

function orderPaymentClass(status: string) {
    switch (status) {
        case "Pending":
            return "nb-badge nb-badge-yellow";
        case "Cancelled":
        case "Refunded":
            return "nb-badge nb-badge-red";
        default:
            return "nb-badge nb-badge-green";
    }
}

function applyColumnWidths(worksheet: XLSX.WorkSheet, rows: Record<string, unknown>[]) {
    const headers = Object.keys(rows[0] ?? {});
    if (!headers.length) return;

    worksheet["!cols"] = headers.map((key) => ({
        wch: Math.min(
            48,
            Math.max(key.length, ...rows.map((row) => String(row[key] ?? "").length)) + 2,
        ),
    }));
}

function SummaryCard({
    label,
    value,
    icon,
    surfaceClassName,
    iconClassName,
}: {
    label: string;
    value: string;
    icon: ReactNode;
    surfaceClassName: string;
    iconClassName: string;
}) {
    return (
        <div className={`min-h-[112px] rounded-[8px] border border-white/70 p-5 shadow-soft-sm ${surfaceClassName}`}>
            <div className="flex h-full items-center gap-4">
                <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-white shadow-soft-xs ${iconClassName}`}>
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700">{label}</p>
                    <p className="mt-2 text-2xl font-bold leading-tight text-slate-950">{value}</p>
                </div>
            </div>
        </div>
    );
}

export default function ProviderRevenue() {
    const navigate = useNavigate();
    const sidebarConfig = useProviderSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [providerName, setProviderName] = useState("");
    const [revenue, setRevenue] = useState<ProviderRevenueDto | null>(null);
    const [orders, setOrders] = useState<ProviderIncomingOrderItemDto[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [profile, rev, orderPage] = await Promise.all([
                getProviderProfile(),
                getProviderRevenue(),
                getProviderDirectOrders(page, PROVIDER_LIST_PAGE_SIZE),
            ]);
            setProviderName(profile.providerName || "Nhà cung cấp");
            setRevenue(rev);
            setOrders(orderPage.items);
            setTotal(orderPage.totalCount);
        } catch {
            // keep the current screen stable if the backend is temporarily unavailable
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("user");
        navigate("/signin", { replace: true });
    };

    const handleExportReport = useCallback(async () => {
        setExporting(true);
        try {
            const currentRevenue = revenue ?? {
                totalRevenue: 0,
                totalPaidOrders: 0,
                totalPendingOrders: 0,
                pendingAmount: 0,
            };
            const reportOrders =
                total > orders.length
                    ? await getProviderDirectOrders(1, Math.max(total, PROVIDER_LIST_PAGE_SIZE))
                    : { items: orders, totalCount: total };

            const summaryRows = [
                { "Chỉ số": "Doanh thu đối soát", "Giá trị": currentRevenue.totalRevenue, "Hiển thị": fmt(currentRevenue.totalRevenue) },
                { "Chỉ số": "Đơn đã ghi nhận", "Giá trị": currentRevenue.totalPaidOrders, "Hiển thị": String(currentRevenue.totalPaidOrders) },
                { "Chỉ số": "Đơn chờ đối soát", "Giá trị": currentRevenue.totalPendingOrders, "Hiển thị": String(currentRevenue.totalPendingOrders) },
                { "Chỉ số": "Khoản chờ đối soát", "Giá trị": currentRevenue.pendingAmount, "Hiển thị": fmt(currentRevenue.pendingAmount) },
                { "Chỉ số": "Đơn hàng trong báo cáo", "Giá trị": reportOrders.totalCount, "Hiển thị": String(reportOrders.totalCount) },
            ];

            const orderRows = reportOrders.items.map((order) => ({
                "Ngày đặt": fmtDate(order.orderDate),
                "Mã đơn": order.orderId,
                "Phụ huynh": order.parentName,
                "Học sinh": order.childName,
                "Số món": order.itemCount,
                "Doanh thu": order.totalAmount,
                "Hiển thị doanh thu": fmt(order.totalAmount),
                "Trạng thái đơn": orderStatusLabel(order.orderStatus),
                "Thanh toán": orderPaymentLabel(order.orderStatus),
            }));

            const workbook = XLSX.utils.book_new();
            const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
            applyColumnWidths(summarySheet, summaryRows);
            XLSX.utils.book_append_sheet(workbook, summarySheet, "BaoCao");

            const ordersSheet = XLSX.utils.json_to_sheet(
                orderRows.length
                    ? orderRows
                    : [{ "Ngày đặt": "", "Mã đơn": "", "Phụ huynh": "", "Học sinh": "", "Số món": 0, "Doanh thu": 0, "Hiển thị doanh thu": fmt(0), "Trạng thái đơn": "", "Thanh toán": "" }],
            );
            applyColumnWidths(ordersSheet, orderRows);
            XLSX.utils.book_append_sheet(workbook, ordersSheet, "DonHang");

            XLSX.writeFile(workbook, `bao-cao-doanh-thu-${new Date().toISOString().slice(0, 10)}.xlsx`);
        } finally {
            setExporting(false);
        }
    }, [orders, revenue, total]);

    const totalPages = Math.max(1, Math.ceil(total / PROVIDER_LIST_PAGE_SIZE));
    const paidOrders = revenue?.totalPaidOrders ?? 0;
    const pendingOrders = revenue?.totalPendingOrders ?? 0;
    const pendingAmount = revenue?.pendingAmount ?? 0;
    const totalRevenue = revenue?.totalRevenue ?? 0;
    const averageOrderValue = paidOrders > 0 ? totalRevenue / paidOrders : 0;

    const summaryCards = useMemo(
        () => [
            {
                label: "Đơn đã ghi nhận",
                value: String(paidOrders),
                icon: <CheckCircle2 className="h-6 w-6" />,
                surfaceClassName: "bg-blue-100",
                iconClassName: "text-slate-900",
            },
            {
                label: "Đơn chờ đối soát",
                value: String(pendingOrders),
                icon: <TimerReset className="h-6 w-6" />,
                surfaceClassName: "bg-yellow-100",
                iconClassName: "text-slate-900",
            },
            {
                label: "Giá trị TB / đơn",
                value: fmt(averageOrderValue),
                icon: <PercentCircle className="h-6 w-6" />,
                surfaceClassName: "bg-orange-100",
                iconClassName: "text-slate-900",
            },
            {
                label: "Đơn hàng báo cáo",
                value: String(total),
                icon: <ShoppingBag className="h-6 w-6" />,
                surfaceClassName: "bg-lime-200",
                iconClassName: "text-slate-900",
            },
        ],
        [averageOrderValue, paidOrders, pendingOrders, total],
    );

    const orderColumns = useMemo<ProviderDataTableColumn<ProviderIncomingOrderItemDto>[]>(
        () => [
            {
                key: "order",
                header: "Đơn hàng",
                render: (order) => (
                    <div className="min-w-0">
                        <p className="font-mono text-sm font-bold text-slate-950">#{order.orderId.slice(0, 8).toUpperCase()}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">{fmtDate(order.orderDate)}</p>
                    </div>
                ),
            },
            {
                key: "customer",
                header: "Người đặt",
                render: (order) => (
                    <div className="min-w-0">
                        <p className="font-bold text-slate-950">{order.parentName}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">{order.childName}</p>
                    </div>
                ),
            },
            {
                key: "items",
                header: "Sản phẩm",
                render: (order) => <span className="font-semibold text-slate-700">{order.itemCount} món</span>,
            },
            {
                key: "amount",
                header: "Doanh thu",
                className: "text-right",
                render: (order) => <span className="font-bold text-emerald-600">{fmt(order.totalAmount)}</span>,
            },
            {
                key: "orderStatus",
                header: "Trạng thái đơn",
                className: "text-center",
                render: (order) => <span className={orderStatusClass(order.orderStatus)}>{orderStatusLabel(order.orderStatus)}</span>,
            },
            {
                key: "paymentStatus",
                header: "Thanh toán",
                className: "text-center",
                render: (order) => <span className={orderPaymentClass(order.orderStatus)}>{orderPaymentLabel(order.orderStatus)}</span>,
            },
            {
                key: "action",
                header: "Action",
                className: "text-right",
                render: (order) => (
                    <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-slate-200 bg-white text-slate-700 transition-colors hover:border-violet-200 hover:text-violet-700"
                        onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/provider/orders/${order.orderId}`);
                        }}
                        aria-label="Xem đơn hàng"
                    >
                        <ExternalLink className="h-4 w-4" />
                    </button>
                ),
            },
        ],
        [navigate],
    );

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} name={providerName} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                    <TopNavBar>
                        <div className="flex items-center gap-3 px-2 py-2">
                            <div className="hidden h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-soft-sm sm:flex">
                                <FileSpreadsheet className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold leading-none text-gray-900">Báo cáo doanh thu</h1>
                            </div>
                        </div>
                    </TopNavBar>

                    <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        <section className="space-y-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-950">Revenue Report Center</h2>
                                    <p className="mt-1 text-sm font-semibold text-slate-500">
                                        Theo dõi doanh thu ghi nhận, đơn hàng đối soát và xuất báo cáo theo kỳ.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="nb-btn nb-btn-green inline-flex w-fit items-center gap-2"
                                    disabled={loading || exporting}
                                    onClick={handleExportReport}
                                >
                                    {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                    {exporting ? "Đang xuất..." : "Xuất report"}
                                </button>
                            </div>

                            <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
                                <div className="rounded-[8px] border border-emerald-200 bg-white p-6 shadow-soft-sm">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-emerald-700">Doanh thu đối soát</p>
                                            <p className="mt-3 text-4xl font-bold leading-tight text-slate-950 sm:text-5xl">{fmt(totalRevenue)}</p>
                                            <p className="mt-3 text-sm font-semibold text-slate-500">
                                                {paidOrders} đơn đã ghi nhận, {pendingOrders} đơn đang chờ đưa vào báo cáo cuối kỳ.
                                            </p>
                                        </div>
                                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                                            <Banknote className="h-7 w-7" />
                                        </div>
                                    </div>

                                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                        <div className="rounded-[8px] border border-slate-200 bg-slate-50 p-4">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Chờ đối soát</p>
                                            <p className="mt-2 text-xl font-bold text-slate-950">{fmt(pendingAmount)}</p>
                                        </div>
                                        <div className="rounded-[8px] border border-slate-200 bg-slate-50 p-4">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">TB / đơn</p>
                                            <p className="mt-2 text-xl font-bold text-slate-950">{fmt(averageOrderValue)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-[8px] border border-slate-200 bg-white p-6 shadow-soft-sm">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Report scope</p>
                                            <h3 className="mt-2 text-2xl font-bold text-slate-950">Bộ dữ liệu xuất file</h3>
                                        </div>
                                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                                            <TableProperties className="h-5 w-5" />
                                        </div>
                                    </div>
                                    <p className="mt-4 text-sm font-semibold leading-6 text-slate-500">
                                        File gồm sheet báo cáo tổng quan và danh sách đơn hàng tạo doanh thu. Giao dịch ví và rút tiền nằm ở trang Ví.
                                    </p>
                                    <div className="mt-4 grid gap-2 text-sm font-semibold text-slate-600">
                                        <div className="flex items-center justify-between rounded-[8px] bg-slate-50 px-3 py-2">
                                            <span>Kỳ báo cáo</span>
                                            <span className="text-slate-950">Hiện tại</span>
                                        </div>
                                        <div className="flex items-center justify-between rounded-[8px] bg-slate-50 px-3 py-2">
                                            <span>Đơn hàng báo cáo</span>
                                            <span className="text-slate-950">{total}</span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="nb-btn nb-btn-outline mt-5 inline-flex w-full items-center justify-center gap-2 text-sm"
                                        disabled={loading || exporting}
                                        onClick={handleExportReport}
                                    >
                                        {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDownToLine className="h-4 w-4" />}
                                        Tải file Excel
                                    </button>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                {summaryCards.map((card) => (
                                    <SummaryCard key={card.label} {...card} />
                                ))}
                            </div>
                        </section>

                        {loading ? (
                            <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-[8px] border border-gray-200 bg-white shadow-soft-sm">
                                <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Đang đồng bộ dữ liệu doanh thu...</p>
                            </div>
                        ) : (
                            <section className="rounded-[8px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Bảng đối soát</p>
                                        <h2 className="mt-2 text-2xl font-bold text-gray-900">Đơn hàng ghi nhận doanh thu</h2>
                                    </div>
                                    <span className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
                                        {total} đơn hàng
                                    </span>
                                </div>

                                {orders.length === 0 ? (
                                    <p className="mt-5 rounded-[8px] border border-dashed border-gray-200 bg-slate-50 p-8 text-center text-sm font-medium text-gray-500">
                                        Chưa có đơn hàng nào trong báo cáo.
                                    </p>
                                ) : (
                                    <div className="mt-5">
                                        <ProviderDataTable
                                            items={orders}
                                            columns={orderColumns}
                                            getKey={(order) => order.orderId}
                                            onRowClick={(order) => navigate(`/provider/orders/${order.orderId}`)}
                                        />
                                    </div>
                                )}

                                {totalPages > 1 ? (
                                    <div className="mt-5 flex justify-center gap-2">
                                        <button disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="nb-btn nb-btn-outline nb-btn-sm text-sm">
                                            ← Trước
                                        </button>
                                        <span className="flex items-center px-2 text-sm font-medium text-gray-500">{page}/{totalPages}</span>
                                        <button disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} className="nb-btn nb-btn-outline nb-btn-sm text-sm">
                                            Sau →
                                        </button>
                                    </div>
                                ) : null}
                            </section>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
