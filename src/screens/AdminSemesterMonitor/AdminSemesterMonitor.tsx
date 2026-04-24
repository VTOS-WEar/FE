import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, Inbox } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useAdminSidebarConfig } from "../../hooks/useAdminSidebarConfig";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import {
    getAdminSemesterPublications,
    getSemesterMonitorReport,
    type AdminSemesterPublicationOptionDto,
    type SemesterMonitorReportDto,
    type SemesterMonitorStatusMetricDto,
} from "../../lib/api/admin";
import {
    ADMIN_TONE,
    AdminBadge,
    AdminEmptyState,
    AdminHero,
    AdminSummaryCard,
} from "../AdminShared/adminWorkspace";

const orderStatusLabels: Record<string, string> = {
    Pending: "Chờ đặt",
    Paid: "Đã thanh toán",
    Confirmed: "Đã xác nhận",
    Processed: "Đã xử lý",
    InProduction: "Đang sản xuất",
    ReadyToShip: "Sẵn sàng giao",
    Shipped: "Đang giao",
    Delivered: "Hoàn thành",
    Cancelled: "Đã hủy",
    Refunded: "Đã hoàn tiền",
    Accepted: "Đã nhận",
};

const paymentStatusLabels: Record<string, string> = {
    NoPayment: "Chưa có GD",
    Pending: "Chờ thanh toán",
    Processing: "Đang xử lý",
    Completed: "Hoàn tất",
    Failed: "Thất bại",
    Cancelled: "Đã hủy",
    Refunded: "Đã hoàn",
};

const statusTone: Record<string, { bg: string; text: string }> = {
    Delivered: { bg: ADMIN_TONE.emeraldSoft, text: "#0C7A5D" },
    Completed: { bg: ADMIN_TONE.emeraldSoft, text: "#0C7A5D" },
    Refunded: { bg: ADMIN_TONE.violetSoft, text: "#4B39C8" },
    Cancelled: { bg: "#F1F3F8", text: "#667085" },
    Failed: { bg: ADMIN_TONE.roseSoft, text: "#B23148" },
    Pending: { bg: ADMIN_TONE.amberSoft, text: "#9A6506" },
    Processing: { bg: ADMIN_TONE.skySoft, text: "#1D63BE" },
};

function formatCurrency(value: number) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0);
}

function formatDate(value?: string) {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("vi-VN");
}

function formatPercent(value?: number) {
    return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(value || 0)}%`;
}

function labelStatus(status: string, type: "order" | "payment") {
    return type === "order"
        ? orderStatusLabels[status] || status
        : paymentStatusLabels[status] || status;
}

function StatusBadge({ status, type }: { status: string; type: "order" | "payment" }) {
    const tone = statusTone[status] || { bg: ADMIN_TONE.soft, text: ADMIN_TONE.pageInk };
    return (
        <AdminBadge bg={tone.bg} text={tone.text}>
            {labelStatus(status, type)}
        </AdminBadge>
    );
}

function MetricBreakdown({
    title,
    metrics,
    type,
}: {
    title: string;
    metrics: SemesterMonitorStatusMetricDto[];
    type: "order" | "payment";
}) {
    return (
        <section className="rounded-[24px] border p-5 shadow-soft-lg" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}>
            <h2 className="text-[20px] font-black" style={{ color: ADMIN_TONE.pageInk }}>{title}</h2>
            <div className="mt-5 space-y-4">
                {metrics.length === 0 && (
                    <p className="text-[14px] font-semibold" style={{ color: ADMIN_TONE.muted }}>Chưa có dữ liệu.</p>
                )}
                {metrics.map((metric) => (
                    <div key={metric.status} className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <StatusBadge status={metric.status} type={type} />
                            <div className="text-right text-[13px] font-bold" style={{ color: ADMIN_TONE.muted }}>
                                {metric.count.toLocaleString("vi-VN")} mục · {formatPercent(metric.rate)} · {formatCurrency(metric.totalAmount)}
                            </div>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full" style={{ background: ADMIN_TONE.soft }}>
                            <div className="h-full rounded-full" style={{ width: `${Math.min(metric.rate, 100)}%`, background: ADMIN_TONE.sky }} />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default function AdminSemesterMonitor() {
    const navigate = useNavigate();
    const sidebarConfig = useAdminSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [publications, setPublications] = useState<AdminSemesterPublicationOptionDto[]>([]);
    const [selectedPublicationId, setSelectedPublicationId] = useState("");
    const [report, setReport] = useState<SemesterMonitorReportDto | null>(null);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [loadingReport, setLoadingReport] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadOptions() {
            setLoadingOptions(true);
            try {
                const response = await getAdminSemesterPublications({ page: 1, pageSize: 100 });
                if (cancelled) return;
                setPublications(response.items || []);
                setSelectedPublicationId((current) => current || response.items?.[0]?.id || "");
            } catch {
                if (!cancelled) setError("Không tải được danh sách học kỳ.");
            } finally {
                if (!cancelled) setLoadingOptions(false);
            }
        }

        loadOptions();

        return () => {
            cancelled = true;
        };
    }, []);

    const loadReport = useCallback(async () => {
        if (!selectedPublicationId) {
            setReport(null);
            return;
        }

        setLoadingReport(true);
        setError("");
        try {
            setReport(await getSemesterMonitorReport(selectedPublicationId));
        } catch {
            setReport(null);
            setError("Không tải được báo cáo học kỳ.");
        } finally {
            setLoadingReport(false);
        }
    }, [selectedPublicationId]);

    useEffect(() => {
        loadReport();
    }, [loadReport]);

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    const selectedPublication = useMemo(
        () => publications.find((item) => item.id === selectedPublicationId),
        [publications, selectedPublicationId],
    );

    const isLoading = loadingOptions || loadingReport;
    const gridCols = "0.85fr 1.3fr 1.2fr 1fr 1fr 1fr 1fr";

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                    <TopNavBar>
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/admin/dashboard" className="font-semibold text-[#4c5769] text-base">
                                        Trang chủ
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="font-bold text-gray-900 text-base">Báo cáo học kỳ</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </TopNavBar>

                    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8 space-y-6 nb-fade-in">
                        <AdminHero
                            eyebrow="Giam sat hoc ky"
                            title="Báo cáo chi tiết đơn hàng và thanh toán theo học kỳ."
                            description="Admin chọn một đợt công bố học kỳ để xem tổng số đơn, tỷ lệ hoàn tất thanh toán, đơn hoàn thành, hoàn tiền, hủy và danh sách mã đơn liên quan."
                            stats={[
                                { label: "Học kỳ", value: selectedPublication ? `${selectedPublication.semester} ${selectedPublication.academicYear}` : "..." },
                                { label: "Tổng đơn", value: isLoading ? "..." : String(report?.summary.totalOrders ?? 0) },
                            ]}
                        />

                        <section className="rounded-[24px] border p-4 shadow-soft-lg" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}>
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                                <select
                                    value={selectedPublicationId}
                                    onChange={(event) => setSelectedPublicationId(event.target.value)}
                                    className="min-w-[280px] rounded-xl border px-4 py-3 text-[15px] font-semibold outline-none transition-all"
                                    style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.soft, color: ADMIN_TONE.pageInk }}
                                    disabled={loadingOptions || publications.length === 0}
                                >
                                    {publications.length === 0 && <option value="">Chưa có học kỳ</option>}
                                    {publications.map((publication) => (
                                        <option key={publication.id} value={publication.id}>
                                            {publication.semester} {publication.academicYear} · {publication.schoolName} · {publication.status}
                                        </option>
                                    ))}
                                </select>
                                {report && (
                                    <div className="flex flex-wrap gap-2">
                                        <AdminBadge bg={ADMIN_TONE.skySoft} text="#1D63BE">{report.publication.schoolName}</AdminBadge>
                                        <AdminBadge bg={ADMIN_TONE.soft} text={ADMIN_TONE.pageInk}>
                                            {formatDate(report.publication.startDate)} - {formatDate(report.publication.endDate)}
                                        </AdminBadge>
                                    </div>
                                )}
                            </div>
                            {error && <p className="mt-3 text-[14px] font-bold text-red-600">{error}</p>}
                        </section>

                        {!isLoading && !report && (
                            <section className="rounded-[24px] border shadow-soft-lg" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}>
                                <AdminEmptyState
                                    title="Chưa có báo cáo để hiển thị"
                                    detail="Tạo hoặc chọn một đợt công bố học kỳ đã có đơn hàng để xem báo cáo giám sát."
                                    icon={<BarChart3 className="h-8 w-8" />}
                                    bg={ADMIN_TONE.skySoft}
                                />
                            </section>
                        )}

                        {report && (
                            <>
                                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                    <AdminSummaryCard
                                        label="Tổng đơn"
                                        value={isLoading ? "..." : report.summary.totalOrders.toLocaleString("vi-VN")}
                                        detail={`Hoàn thành ${report.summary.completedOrders}, đang mở ${report.summary.openOrders}.`}
                                        accent={ADMIN_TONE.sky}
                                    />
                                    <AdminSummaryCard
                                        label="Tỷ lệ thanh toán"
                                        value={isLoading ? "..." : formatPercent(report.summary.paymentCompletionRate)}
                                        detail={`${report.summary.completedPayments}/${report.summary.paymentAttempts} giao dịch đã hoàn tất.`}
                                        accent={ADMIN_TONE.emerald}
                                    />
                                    <AdminSummaryCard
                                        label="Doanh thu thanh toán"
                                        value={isLoading ? "..." : formatCurrency(report.summary.totalRevenue)}
                                        detail="Tính trên giao dịch thanh toán đơn hàng đã hoàn tất."
                                        accent={ADMIN_TONE.violet}
                                    />
                                    <AdminSummaryCard
                                        label="Hoàn tiền / Hủy"
                                        value={isLoading ? "..." : `${report.summary.refundedOrders}/${report.summary.cancelledOrders}`}
                                        detail={`Hoàn tiền ${formatCurrency(report.summary.refundedAmount)} · Hủy ${formatPercent(report.summary.cancelledOrderRate)}.`}
                                        accent={ADMIN_TONE.rose}
                                    />
                                </section>

                                <section className="grid gap-4 xl:grid-cols-2">
                                    <MetricBreakdown title="Tỷ lệ trạng thái đơn hàng" metrics={report.orderStatusBreakdown} type="order" />
                                    <MetricBreakdown title="Tỷ lệ trạng thái thanh toán" metrics={report.paymentStatusBreakdown} type="payment" />
                                </section>

                                <section className="overflow-hidden rounded-[24px] border shadow-soft-lg" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}>
                                    <div
                                        className="sticky top-0 z-10 hidden lg:grid items-center border-b px-5 py-4"
                                        style={{ gridTemplateColumns: gridCols, borderColor: ADMIN_TONE.line, background: ADMIN_TONE.violetSoft }}
                                    >
                                        {["Mã đơn", "Học sinh", "Trường / NCC", "Giá trị", "Đơn hàng", "Thanh toán", "Ngày tạo"].map((header) => (
                                            <div key={header} className="text-[12px] font-black uppercase tracking-[0.08em]" style={{ color: ADMIN_TONE.muted }}>
                                                {header}
                                            </div>
                                        ))}
                                    </div>

                                    {report.orders.length === 0 ? (
                                        <AdminEmptyState
                                            title="Học kỳ chưa có đơn hàng"
                                            detail="Khi phụ huynh đặt đồng phục trong học kỳ này, mã đơn và trạng thái sẽ xuất hiện tại đây."
                                            icon={<Inbox className="h-8 w-8" />}
                                            bg={ADMIN_TONE.soft}
                                        />
                                    ) : (
                                        <div>
                                            {report.orders.map((order) => (
                                                <div key={order.orderId} className="border-b px-5 py-4 last:border-b-0" style={{ borderColor: ADMIN_TONE.line }}>
                                                    <div className="hidden lg:grid items-center gap-4" style={{ gridTemplateColumns: gridCols }}>
                                                        <p className="text-[14px] font-black" style={{ color: ADMIN_TONE.pageInk }}>{order.orderNumber}</p>
                                                        <p className="text-[14px] font-semibold" style={{ color: ADMIN_TONE.pageInk }}>{order.studentName}</p>
                                                        <p className="text-[13px] font-semibold leading-6" style={{ color: ADMIN_TONE.muted }}>
                                                            {order.schoolName}<br />{order.providerName || "Chưa có NCC"}
                                                        </p>
                                                        <p className="text-[14px] font-black" style={{ color: ADMIN_TONE.pageInk }}>{formatCurrency(order.totalAmount)}</p>
                                                        <StatusBadge status={order.orderStatus} type="order" />
                                                        <StatusBadge status={order.paymentStatus} type="payment" />
                                                        <p className="text-[13px] font-bold" style={{ color: ADMIN_TONE.muted }}>{formatDate(order.createdAt)}</p>
                                                    </div>
                                                    <div className="space-y-3 lg:hidden">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <p className="text-[16px] font-black" style={{ color: ADMIN_TONE.pageInk }}>Đơn {order.orderNumber}</p>
                                                                <p className="mt-1 text-[13px] font-semibold" style={{ color: ADMIN_TONE.muted }}>{order.studentName} · {formatDate(order.createdAt)}</p>
                                                            </div>
                                                            <p className="text-[15px] font-black" style={{ color: ADMIN_TONE.pageInk }}>{formatCurrency(order.totalAmount)}</p>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            <StatusBadge status={order.orderStatus} type="order" />
                                                            <StatusBadge status={order.paymentStatus} type="payment" />
                                                        </div>
                                                        <p className="text-[13px] font-semibold" style={{ color: ADMIN_TONE.muted }}>
                                                            {order.schoolName} · {order.providerName || "Chưa có NCC"}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            </>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
