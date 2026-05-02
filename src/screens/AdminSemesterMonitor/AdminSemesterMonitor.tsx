import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BarChart3, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsUpDown, Inbox, Search, X } from "lucide-react";
import {
    Bar as OriginalBar,
    BarChart as OriginalBarChart,
    CartesianGrid as OriginalCartesianGrid,
    Cell as OriginalCell,
    Pie as OriginalPie,
    PieChart as OriginalPieChart,
    ResponsiveContainer as OriginalResponsiveContainer,
    Tooltip as OriginalTooltip,
    XAxis as OriginalXAxis,
    YAxis as OriginalYAxis,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useAdminSidebarConfig } from "../../hooks/useAdminSidebarConfig";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { getAdminSemesterPublications, getSemesterMonitorReport, type AdminSemesterPublicationOptionDto, type SemesterMonitorReportDto } from "../../lib/api/admin";
import { ADMIN_TONE, AdminEmptyState, AdminSummaryCard, AdminTopNavTitle } from "../AdminShared/adminWorkspace";

const Bar = OriginalBar as any;
const BarChart = OriginalBarChart as any;
const CartesianGrid = OriginalCartesianGrid as any;
const Cell = OriginalCell as any;
const Pie = OriginalPie as any;
const PieChart = OriginalPieChart as any;
const ResponsiveContainer = OriginalResponsiveContainer as any;
const Tooltip = OriginalTooltip as any;
const XAxis = OriginalXAxis as any;
const YAxis = OriginalYAxis as any;

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

const chartColors = ["#2477E4", "#0F9D7A", "#C68508", "#BE123C", "#4B39C8", "#64748B"];
const ORDER_PAGE_SIZE = 10;
const MIN_REPORT_FETCH_FEEDBACK_MS = 700;
const MIN_ORDER_FILTER_COMMIT_MS = 350;

function formatCurrency(value: number) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0);
}

function formatCompactCurrency(value: number) {
    if (!value) return "0";
    if (value >= 1_000_000_000) return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(value / 1_000_000_000)} tỷ`;
    if (value >= 1_000_000) return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(value / 1_000_000)} tr`;
    if (value >= 1_000) return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value / 1_000)}k`;
    return new Intl.NumberFormat("vi-VN").format(value);
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

function CompactBadge({
    children,
    bg = "#FFFFFF",
    text = "#374151",
}: {
    children: ReactNode;
    bg?: string;
    text?: string;
}) {
    return (
        <span
            className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-[13px] font-medium leading-none shadow-soft-xs"
            style={{ background: bg, color: text }}
        >
            {children}
        </span>
    );
}

function SortButton({
    children,
    active,
    direction,
    onClick,
}: {
    children: ReactNode;
    active: boolean;
    direction: "asc" | "desc";
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`inline-flex items-center gap-1 text-left text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors hover:text-rose-700 ${
                active ? "text-gray-900" : "text-[#4E4A5B]"
            }`}
        >
            <span>{children}</span>
            {active ? (
                direction === "asc" ? (
                    <ChevronUp className="h-3 w-3 text-rose-700" strokeWidth={2} />
                ) : (
                    <ChevronDown className="h-3 w-3 text-rose-700" strokeWidth={2} />
                )
            ) : (
                <ChevronsUpDown className="h-3 w-3 text-slate-400" strokeWidth={1.8} />
            )}
        </button>
    );
}

function StatusBadge({ status, type }: { status: string; type: "order" | "payment" }) {
    const tone = statusTone[status] || { bg: ADMIN_TONE.soft, text: ADMIN_TONE.pageInk };
    return (
        <CompactBadge bg={tone.bg} text={tone.text}>
            {labelStatus(status, type)}
        </CompactBadge>
    );
}

type StatusChartDatum = {
    status: string;
    label: string;
    count: number;
    rate: number;
    totalAmount: number;
    color: string;
};

type SchoolOption = {
    id: string;
    name: string;
    publicationCount: number;
    activeCount: number;
};

const publicationStatusOptions = [
    { value: "", label: "Tất cả trạng thái" },
    { value: "Active", label: "Đang mở" },
    { value: "Draft", label: "Nháp" },
    { value: "Closed", label: "Đã đóng" },
];

function labelPublicationStatus(status: string) {
    if (status === "Active") return "Đang mở";
    if (status === "Draft") return "Nháp";
    if (status === "Closed") return "Đã đóng";
    return status;
}

function buildSchoolOptions(publications: AdminSemesterPublicationOptionDto[]) {
    const byId = new Map<string, SchoolOption>();
    publications.forEach((publication) => {
        const current = byId.get(publication.schoolId);
        byId.set(publication.schoolId, {
            id: publication.schoolId,
            name: publication.schoolName,
            publicationCount: (current?.publicationCount ?? 0) + 1,
            activeCount: (current?.activeCount ?? 0) + (publication.status === "Active" ? 1 : 0),
        });
    });
    return Array.from(byId.values()).sort((left, right) => {
        if (right.activeCount !== left.activeCount) return right.activeCount - left.activeCount;
        return left.name.localeCompare(right.name, "vi");
    });
}

function ChartLegend({ data }: { data: StatusChartDatum[] }) {
    return (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {data.map((item) => (
                <div key={item.status} className="flex min-w-0 items-center justify-between gap-3 rounded-[8px] px-3 py-2" style={{ background: ADMIN_TONE.soft }}>
                    <div className="flex min-w-0 items-center gap-2">
                        <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: item.color }} />
                        <span className="truncate text-[13px] font-medium" style={{ color: ADMIN_TONE.pageInk }}>
                            {item.label}
                        </span>
                    </div>
                    <span className="flex-shrink-0 text-[13px] font-semibold" style={{ color: ADMIN_TONE.muted }}>
                        {item.count.toLocaleString("vi-VN")} · {formatPercent(item.rate)}
                    </span>
                </div>
            ))}
        </div>
    );
}

function OrderStatusDonutChart({ data }: { data: StatusChartDatum[] }) {
    const total = data.reduce((sum, item) => sum + item.count, 0);
    return (
        <section className="rounded-[8px] border p-5 shadow-soft-sm" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}>
            <div className="flex flex-col gap-1">
                <h2 className="text-[16px] font-bold" style={{ color: ADMIN_TONE.pageInk }}>Trạng thái đơn hàng</h2>
                <p className="text-[13px] font-medium" style={{ color: ADMIN_TONE.muted }}>Tỷ trọng đơn theo từng trạng thái trong học kỳ.</p>
            </div>
            {data.length === 0 ? (
                <p className="mt-6 text-[14px] font-medium" style={{ color: ADMIN_TONE.muted }}>Chưa có dữ liệu.</p>
            ) : (
                <>
                    <div className="relative mt-5 h-[240px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Tooltip
                                    formatter={(value: number, _name: string, item: any) => [
                                        `${Number(value).toLocaleString("vi-VN")} mục`,
                                        item?.payload?.label ?? "Trạng thái",
                                    ]}
                                    contentStyle={{
                                        border: "1px solid #E2E8F0",
                                        borderRadius: "8px",
                                        boxShadow: "0 14px 30px rgba(15, 23, 42, 0.12)",
                                        fontWeight: 600,
                                    }}
                                />
                                <Pie
                                    data={data}
                                    dataKey="count"
                                    nameKey="label"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={68}
                                    outerRadius={96}
                                    paddingAngle={3}
                                    stroke="#FFFFFF"
                                    strokeWidth={3}
                                >
                                    {data.map((item) => (
                                        <Cell key={item.status} fill={item.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-[13px] font-medium" style={{ color: ADMIN_TONE.muted }}>Tổng đơn</span>
                            <span className="text-2xl font-bold leading-tight" style={{ color: ADMIN_TONE.pageInk }}>
                                {total.toLocaleString("vi-VN")}
                            </span>
                        </div>
                    </div>
                    <ChartLegend data={data} />
                </>
            )}
        </section>
    );
}

function PaymentStatusBarChart({ data }: { data: StatusChartDatum[] }) {
    return (
        <section className="rounded-[8px] border p-5 shadow-soft-sm" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}>
            <div className="flex flex-col gap-1">
                <h2 className="text-[16px] font-bold" style={{ color: ADMIN_TONE.pageInk }}>Trạng thái thanh toán</h2>
                <p className="text-[13px] font-medium" style={{ color: ADMIN_TONE.muted }}>So sánh số lượng và giá trị giao dịch theo trạng thái.</p>
            </div>
            {data.length === 0 ? (
                <p className="mt-6 text-[14px] font-medium" style={{ color: ADMIN_TONE.muted }}>Chưa có dữ liệu.</p>
            ) : (
                <>
                    <div className="mt-5 h-[240px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 18, bottom: 4, left: 20 }}>
                                <CartesianGrid stroke="#E5E7EB" strokeDasharray="4 6" horizontal={false} />
                                <XAxis
                                    type="number"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "#64748B", fontSize: 12, fontWeight: 600 }}
                                    allowDecimals={false}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="label"
                                    axisLine={false}
                                    tickLine={false}
                                    width={112}
                                    tick={{ fill: "#4c5769", fontSize: 12, fontWeight: 600 }}
                                />
                                <Tooltip
                                    cursor={{ fill: "rgba(248, 250, 252, 0.85)" }}
                                    formatter={(value: number, _name: string, item: any) => [
                                        `${Number(value).toLocaleString("vi-VN")} mục · ${formatCurrency(item?.payload?.totalAmount ?? 0)}`,
                                        item?.payload?.label ?? "Thanh toán",
                                    ]}
                                    contentStyle={{
                                        border: "1px solid #E2E8F0",
                                        borderRadius: "8px",
                                        boxShadow: "0 14px 30px rgba(15, 23, 42, 0.12)",
                                        fontWeight: 600,
                                    }}
                                />
                                <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={18}>
                                    {data.map((item) => (
                                        <Cell key={item.status} fill={item.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-2">
                        {data.map((item) => (
                            <div key={item.status} className="flex items-center justify-between gap-3 text-[13px] font-medium" style={{ color: ADMIN_TONE.muted }}>
                                <span className="inline-flex min-w-0 items-center gap-2">
                                    <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: item.color }} />
                                    <span className="truncate">{item.label}</span>
                                </span>
                                <span className="flex-shrink-0">{formatCompactCurrency(item.totalAmount)}</span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}

export default function AdminSemesterMonitor() {
    const navigate = useNavigate();
    const sidebarConfig = useAdminSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [publications, setPublications] = useState<AdminSemesterPublicationOptionDto[]>([]);
    const [schoolOptions, setSchoolOptions] = useState<SchoolOption[]>([]);
    const [schoolSearch, setSchoolSearch] = useState("");
    const [schoolMenuOpen, setSchoolMenuOpen] = useState(false);
    const [selectedSchoolId, setSelectedSchoolId] = useState("");
    const [selectedSchoolName, setSelectedSchoolName] = useState("");
    const [selectedPublicationId, setSelectedPublicationId] = useState("");
    const [publicationStatus, setPublicationStatus] = useState("");
    const [publicationYear, setPublicationYear] = useState("");
    const [report, setReport] = useState<SemesterMonitorReportDto | null>(null);
    const [loadingSchools, setLoadingSchools] = useState(true);
    const [loadingOptions, setLoadingOptions] = useState(false);
    const [loadingReport, setLoadingReport] = useState(false);
    const [error, setError] = useState("");
    const [sortKey, setSortKey] = useState<string>("createdAt");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
    const [orderSearchInput, setOrderSearchInput] = useState("");
    const [orderSearch, setOrderSearch] = useState("");
    const [orderStatusFilter, setOrderStatusFilter] = useState("");
    const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
    const [filteringOrders, setFilteringOrders] = useState(false);
    const [orderPage, setOrderPage] = useState(1);
    const reportFetchSequenceRef = useRef(0);
    const reportFetchStartedAtRef = useRef(0);
    const orderFilterTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

    useEffect(() => {
        let cancelled = false;
        const timer = window.setTimeout(async () => {
            setLoadingSchools(true);
            try {
                setError("");
                const response = await getAdminSemesterPublications({
                    page: 1,
                    pageSize: 40,
                    search: schoolSearch.trim() || undefined,
                });
                if (cancelled) return;
                setSchoolOptions(buildSchoolOptions(response.items || []));
            } catch {
                if (!cancelled) setError("Không tải được danh sách trường.");
            } finally {
                if (!cancelled) setLoadingSchools(false);
            }
        }, 300);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [schoolSearch]);

    useEffect(() => {
        let cancelled = false;

        async function loadSchoolPublications() {
            if (!selectedSchoolId) {
                setPublications([]);
                setSelectedPublicationId("");
                setReport(null);
                setLoadingOptions(false);
                return;
            }

            setLoadingOptions(true);
            setError("");
            try {
                const response = await getAdminSemesterPublications({
                    page: 1,
                    pageSize: 100,
                    schoolId: selectedSchoolId,
                });
                if (cancelled) return;
                setPublications(response.items || []);
            } catch {
                if (!cancelled) {
                    setPublications([]);
                    setError("Không tải được danh sách học kỳ.");
                }
            } finally {
                if (!cancelled) setLoadingOptions(false);
            }
        }

        loadSchoolPublications();

        return () => {
            cancelled = true;
        };
    }, [selectedSchoolId]);

    const loadReport = useCallback(async () => {
        const fetchSeq = reportFetchSequenceRef.current + 1;
        reportFetchSequenceRef.current = fetchSeq;
        if (!selectedPublicationId) {
            setReport(null);
            setLoadingReport(false);
            return;
        }

        reportFetchStartedAtRef.current = Date.now();
        setLoadingReport(true);
        setError("");
        setOrderSearchInput("");
        setOrderSearch("");
        setOrderStatusFilter("");
        setPaymentStatusFilter("");
        setOrderPage(1);
        try {
            const nextReport = await getSemesterMonitorReport(selectedPublicationId);
            if (fetchSeq !== reportFetchSequenceRef.current) return;
            setReport(nextReport);
        } catch {
            if (fetchSeq !== reportFetchSequenceRef.current) return;
            setReport(null);
            setError("Không tải được báo cáo học kỳ.");
        } finally {
            const elapsed = Date.now() - reportFetchStartedAtRef.current;
            const finish = () => {
                if (fetchSeq !== reportFetchSequenceRef.current) return;
                setLoadingReport(false);
            };
            if (elapsed < MIN_REPORT_FETCH_FEEDBACK_MS) {
                window.setTimeout(finish, MIN_REPORT_FETCH_FEEDBACK_MS - elapsed);
                return;
            }
            finish();
        }
    }, [selectedPublicationId]);

    useEffect(() => {
        loadReport();
    }, [loadReport]);

    useEffect(() => {
        return () => {
            if (orderFilterTimerRef.current) window.clearTimeout(orderFilterTimerRef.current);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    const clearSelectedSchool = () => {
        setSelectedSchoolId("");
        setSelectedSchoolName("");
        setSchoolSearch("");
        setSelectedPublicationId("");
        setPublicationStatus("");
        setPublicationYear("");
        setOrderSearchInput("");
        setOrderSearch("");
        setOrderStatusFilter("");
        setPaymentStatusFilter("");
        setOrderPage(1);
        setReport(null);
    };

    const selectSchool = (school: SchoolOption) => {
        setSelectedSchoolId(school.id);
        setSelectedSchoolName(school.name);
        setSchoolSearch(school.name);
        setSchoolMenuOpen(false);
        setSelectedPublicationId("");
        setPublicationStatus("");
        setPublicationYear("");
        setOrderSearchInput("");
        setOrderSearch("");
        setOrderStatusFilter("");
        setPaymentStatusFilter("");
        setOrderPage(1);
        setReport(null);
    };

    const selectedPublication = useMemo(
        () => publications.find((item) => item.id === selectedPublicationId),
        [publications, selectedPublicationId],
    );

    const academicYears = useMemo(
        () => Array.from(new Set(publications.map((publication) => publication.academicYear)))
            .sort((left, right) => right.localeCompare(left, "vi")),
        [publications],
    );

    const filteredPublications = useMemo(() => {
        return publications
            .filter((publication) => !publicationStatus || publication.status === publicationStatus)
            .filter((publication) => !publicationYear || publication.academicYear === publicationYear)
            .sort((left, right) => {
                if (left.status === "Active" && right.status !== "Active") return -1;
                if (right.status === "Active" && left.status !== "Active") return 1;
                return new Date(right.startDate).getTime() - new Date(left.startDate).getTime();
            });
    }, [publications, publicationStatus, publicationYear]);

    useEffect(() => {
        if (!selectedPublicationId) return;
        if (filteredPublications.some((publication) => publication.id === selectedPublicationId)) return;
        setSelectedPublicationId("");
        setOrderSearchInput("");
        setOrderSearch("");
        setOrderStatusFilter("");
        setPaymentStatusFilter("");
        setOrderPage(1);
        setReport(null);
    }, [filteredPublications, selectedPublicationId]);

    const scheduleOrderSearchCommit = useCallback((nextSearch: string) => {
        setFilteringOrders(true);
        if (orderFilterTimerRef.current) window.clearTimeout(orderFilterTimerRef.current);
        orderFilterTimerRef.current = window.setTimeout(() => {
            setOrderSearch(nextSearch);
            setOrderPage(1);
            setFilteringOrders(false);
            orderFilterTimerRef.current = null;
        }, MIN_ORDER_FILTER_COMMIT_MS);
    }, []);

    const orderStatusOptions = useMemo(
        () => Array.from(new Set((report?.orders ?? []).map((order) => order.orderStatus)))
            .filter(Boolean)
            .sort((left, right) => labelStatus(left, "order").localeCompare(labelStatus(right, "order"), "vi")),
        [report],
    );

    const paymentStatusOptions = useMemo(
        () => Array.from(new Set((report?.orders ?? []).map((order) => order.paymentStatus)))
            .filter(Boolean)
            .sort((left, right) => labelStatus(left, "payment").localeCompare(labelStatus(right, "payment"), "vi")),
        [report],
    );

    const sortedOrders = useMemo(() => {
        const query = orderSearch.trim().toLowerCase();
        const rows = (report?.orders ?? [])
            .filter((order) => !orderStatusFilter || order.orderStatus === orderStatusFilter)
            .filter((order) => !paymentStatusFilter || order.paymentStatus === paymentStatusFilter)
            .filter((order) => {
                if (!query) return true;
                return [
                    order.orderNumber,
                    order.studentName,
                    order.schoolName,
                    order.providerName ?? "",
                    labelStatus(order.orderStatus, "order"),
                    labelStatus(order.paymentStatus, "payment"),
                ].some((value) => value.toLowerCase().includes(query));
            });
        rows.sort((leftRow, rightRow) => {
            const left = (leftRow as Record<string, unknown>)[sortKey] ?? "";
            const right = (rightRow as Record<string, unknown>)[sortKey] ?? "";
            const compare = sortKey === "totalAmount"
                ? Number(left) - Number(right)
                : String(left).localeCompare(String(right), "vi");
            return sortDir === "asc" ? compare : -compare;
        });
        return rows;
    }, [report, orderSearch, orderStatusFilter, paymentStatusFilter, sortKey, sortDir]);

    const orderTotalPages = Math.max(1, Math.ceil(sortedOrders.length / ORDER_PAGE_SIZE));
    const pagedOrders = useMemo(
        () => sortedOrders.slice((orderPage - 1) * ORDER_PAGE_SIZE, orderPage * ORDER_PAGE_SIZE),
        [sortedOrders, orderPage],
    );

    useEffect(() => {
        if (orderPage > orderTotalPages) setOrderPage(orderTotalPages);
    }, [orderPage, orderTotalPages]);

    const orderChartData = useMemo<StatusChartDatum[]>(() => {
        return (report?.orderStatusBreakdown ?? []).map((metric, index) => ({
            status: metric.status,
            label: labelStatus(metric.status, "order"),
            count: metric.count,
            rate: metric.rate,
            totalAmount: metric.totalAmount,
            color: statusTone[metric.status]?.text ?? chartColors[index % chartColors.length],
        }));
    }, [report]);

    const paymentChartData = useMemo<StatusChartDatum[]>(() => {
        return (report?.paymentStatusBreakdown ?? [])
            .map((metric, index) => ({
                status: metric.status,
                label: labelStatus(metric.status, "payment"),
                count: metric.count,
                rate: metric.rate,
                totalAmount: metric.totalAmount,
                color: statusTone[metric.status]?.text ?? chartColors[index % chartColors.length],
            }))
            .sort((left, right) => right.count - left.count);
    }, [report]);

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDir((current) => (current === "asc" ? "desc" : "asc"));
            setOrderPage(1);
            return;
        }
        setSortKey(key);
        setSortDir("asc");
        setOrderPage(1);
    };

    const orderColumns = [
        { key: "orderNumber", label: "Mã đơn" },
        { key: "studentName", label: "Học sinh" },
        { key: "schoolName", label: "Trường / NCC" },
        { key: "totalAmount", label: "Giá trị" },
        { key: "orderStatus", label: "Đơn hàng" },
        { key: "paymentStatus", label: "Thanh toán" },
        { key: "createdAt", label: "Ngày tạo" },
    ];

    const isLoading = loadingSchools || loadingOptions || loadingReport;
    const gridCols = "0.85fr 1.3fr 1.2fr 1fr 1fr 1fr 1fr";

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                    <TopNavBar>
                        <AdminTopNavTitle title="Báo cáo học kỳ" />
                    </TopNavBar>

                    <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-6 space-y-5 nb-fade-in">
                        <section className="relative z-20 rounded-[8px] border shadow-soft-sm" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}>
                            <div className="flex flex-col gap-3 border-b px-5 py-4 lg:flex-row lg:items-center lg:justify-between" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.soft }}>
                                <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                                    <div className="relative block w-full sm:max-w-[300px]">
                                        <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                        <input
                                            value={schoolSearch}
                                            onFocus={() => setSchoolMenuOpen(true)}
                                            onBlur={() => window.setTimeout(() => setSchoolMenuOpen(false), 120)}
                                            onChange={(event) => {
                                                if (selectedSchoolId) {
                                                    setSelectedSchoolId("");
                                                    setSelectedSchoolName("");
                                                    setSelectedPublicationId("");
                                                    setPublicationStatus("");
                                                    setPublicationYear("");
                                                    setOrderSearchInput("");
                                                    setOrderSearch("");
                                                    setOrderStatusFilter("");
                                                    setPaymentStatusFilter("");
                                                    setOrderPage(1);
                                                    setReport(null);
                                                }
                                                setSchoolSearch(event.target.value);
                                                setSchoolMenuOpen(true);
                                            }}
                                            placeholder="Tìm trường..."
                                            className="h-10 w-full rounded-full border border-slate-200 bg-white pl-11 pr-11 text-sm font-medium text-slate-800 outline-none shadow-soft-xs transition-colors placeholder:text-slate-500 focus:border-rose-200 focus:ring-4 focus:ring-rose-50"
                                        />
                                        {selectedSchoolId && (
                                            <button
                                                type="button"
                                                onMouseDown={(event) => event.preventDefault()}
                                                onClick={clearSelectedSchool}
                                                className="absolute right-3 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-rose-700"
                                                title="Bỏ chọn trường"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                        {schoolMenuOpen && (
                                            <div className="absolute left-0 top-12 z-30 w-[min(420px,calc(100vw-3rem))] overflow-hidden rounded-[8px] border bg-white shadow-soft-sm" style={{ borderColor: ADMIN_TONE.line }}>
                                                {loadingSchools ? (
                                                    <div className="px-4 py-3 text-[13px] font-medium" style={{ color: ADMIN_TONE.muted }}>Đang tìm trường...</div>
                                                ) : schoolOptions.length === 0 ? (
                                                    <div className="px-4 py-3 text-[13px] font-medium" style={{ color: ADMIN_TONE.muted }}>Không có trường phù hợp</div>
                                                ) : (
                                                    <div className="max-h-[260px] overflow-y-auto py-1">
                                                        {schoolOptions.map((school) => (
                                                            <button
                                                                type="button"
                                                                key={school.id}
                                                                onMouseDown={(event) => {
                                                                    event.preventDefault();
                                                                    selectSchool(school);
                                                                }}
                                                                className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-rose-50"
                                                            >
                                                                <span className="min-w-0">
                                                                    <span className="block text-[14px] font-medium leading-5 text-slate-900">{school.name}</span>
                                                                    <span className="mt-0.5 block text-[12px] font-medium" style={{ color: ADMIN_TONE.muted }}>
                                                                        {school.publicationCount.toLocaleString("vi-VN")} đợt công bố
                                                                    </span>
                                                                </span>
                                                                {school.activeCount > 0 && (
                                                                    <CompactBadge bg={ADMIN_TONE.emeraldSoft} text={ADMIN_TONE.emerald}>
                                                                        Đang mở
                                                                    </CompactBadge>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <label className="relative block">
                                        <select
                                            value={publicationYear}
                                            onChange={(event) => setPublicationYear(event.target.value)}
                                            className="h-10 min-w-[150px] appearance-none rounded-full border border-slate-200 bg-white py-0 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none shadow-soft-xs transition-colors focus:border-rose-200 focus:ring-4 focus:ring-rose-50"
                                            disabled={loadingOptions || !selectedSchoolId || academicYears.length === 0}
                                        >
                                            <option value="">Tất cả năm học</option>
                                            {academicYears.map((year) => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-900" />
                                    </label>

                                    <label className="relative block">
                                        <select
                                            value={publicationStatus}
                                            onChange={(event) => setPublicationStatus(event.target.value)}
                                            className="h-10 min-w-[160px] appearance-none rounded-full border border-slate-200 bg-white py-0 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none shadow-soft-xs transition-colors focus:border-rose-200 focus:ring-4 focus:ring-rose-50"
                                            disabled={loadingOptions || !selectedSchoolId}
                                        >
                                            {publicationStatusOptions.map((option) => (
                                                <option key={option.value || "all"} value={option.value}>{option.label}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-900" />
                                    </label>

                                    <label className="relative block">
                                        <select
                                            value={selectedPublicationId}
                                            onChange={(event) => {
                                                setSelectedPublicationId(event.target.value);
                                                setOrderPage(1);
                                            }}
                                            className="h-10 min-w-[260px] appearance-none rounded-full border border-slate-200 bg-white py-0 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none shadow-soft-xs transition-colors focus:border-rose-200 focus:ring-4 focus:ring-rose-50"
                                            disabled={loadingOptions || !selectedSchoolId || filteredPublications.length === 0}
                                        >
                                            <option value="">{selectedSchoolId ? "Chọn học kỳ / đợt công bố" : "Chọn trường trước"}</option>
                                            {filteredPublications.map((publication) => (
                                                <option key={publication.id} value={publication.id}>
                                                    {publication.semester} · {publication.academicYear} · {labelPublicationStatus(publication.status)} · {publication.orderCount.toLocaleString("vi-VN")} đơn
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-900" />
                                    </label>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
                                    {loadingReport && (
                                        <span className="inline-flex h-9 items-center gap-2 rounded-full border border-rose-100 bg-white px-3 text-xs font-bold text-rose-700 shadow-soft-sm">
                                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-rose-100 border-t-rose-700" />
                                            Đang tải
                                        </span>
                                    )}
                                    {loadingOptions && selectedSchoolId && (
                                        <span className="inline-flex h-9 items-center gap-2 rounded-full border border-rose-100 bg-white px-3 text-xs font-bold text-rose-700 shadow-soft-sm">
                                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-rose-100 border-t-rose-700" />
                                            Đang tải học kỳ
                                        </span>
                                    )}
                                    {selectedSchoolId && !selectedPublication && selectedSchoolName && (
                                        <CompactBadge bg={ADMIN_TONE.skySoft} text="#1D63BE">{selectedSchoolName}</CompactBadge>
                                    )}
                                    {selectedPublication && (
                                        <>
                                            <CompactBadge bg={ADMIN_TONE.skySoft} text="#1D63BE">{selectedPublication.schoolName}</CompactBadge>
                                            <CompactBadge bg={selectedPublication.status === "Active" ? ADMIN_TONE.emeraldSoft : ADMIN_TONE.soft} text={selectedPublication.status === "Active" ? ADMIN_TONE.emerald : ADMIN_TONE.pageInk}>
                                                {labelPublicationStatus(selectedPublication.status)}
                                            </CompactBadge>
                                            <CompactBadge bg={ADMIN_TONE.soft} text={ADMIN_TONE.pageInk}>
                                                {formatDate(selectedPublication.startDate)} - {formatDate(selectedPublication.endDate)}
                                            </CompactBadge>
                                        </>
                                    )}
                                </div>
                            </div>
                            {error && <p className="px-5 py-3 text-[14px] font-semibold text-red-600">{error}</p>}
                        </section>

                        {!loadingOptions && !selectedPublicationId && (
                            <section className="rounded-[8px] border shadow-soft-sm" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}>
                                <AdminEmptyState
                                    title="Chọn trường và học kỳ để xem báo cáo"
                                    detail="Báo cáo chỉ hiển thị sau khi Admin chọn đúng đợt công bố học kỳ cần giám sát."
                                    icon={<BarChart3 className="h-8 w-8" />}
                                    bg={ADMIN_TONE.skySoft}
                                />
                            </section>
                        )}

                        {!isLoading && selectedPublicationId && !report && (
                            <section className="rounded-[8px] border shadow-soft-sm" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}>
                                <AdminEmptyState
                                    title="Chưa có báo cáo để hiển thị"
                                    detail="Đợt công bố này chưa có dữ liệu đơn hàng hoặc thanh toán phù hợp."
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
                                        accent={ADMIN_TONE.sky}
                                    />
                                    <AdminSummaryCard
                                        label="Tỷ lệ thanh toán"
                                        value={isLoading ? "..." : formatPercent(report.summary.paymentCompletionRate)}
                                        accent={ADMIN_TONE.emerald}
                                    />
                                    <AdminSummaryCard
                                        label="Doanh thu thanh toán"
                                        value={isLoading ? "..." : formatCurrency(report.summary.totalRevenue)}
                                        accent={ADMIN_TONE.violet}
                                    />
                                    <AdminSummaryCard
                                        label="Hoàn tiền / Hủy"
                                        value={isLoading ? "..." : `${report.summary.refundedOrders}/${report.summary.cancelledOrders}`}
                                        accent={ADMIN_TONE.rose}
                                    />
                                </section>

                                <section className="grid gap-4 xl:grid-cols-2">
                                    <OrderStatusDonutChart data={orderChartData} />
                                    <PaymentStatusBarChart data={paymentChartData} />
                                </section>

                                <section className="overflow-hidden rounded-[8px] border shadow-soft-sm" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}>
                                    {report.orders.length > 0 && (
                                        <div className="flex flex-col gap-3 border-b px-5 py-4 lg:flex-row lg:items-center lg:justify-between" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.soft }}>
                                            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                                                <label className="relative block w-full sm:max-w-[300px]">
                                                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                                    <input
                                                        value={orderSearchInput}
                                                        onChange={(event) => {
                                                            const nextSearch = event.target.value;
                                                            setOrderSearchInput(nextSearch);
                                                            scheduleOrderSearchCommit(nextSearch);
                                                        }}
                                                        placeholder="Tìm mã đơn, học sinh, NCC..."
                                                        className="h-10 w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-800 outline-none shadow-soft-xs transition-colors placeholder:text-slate-500 focus:border-rose-200 focus:ring-4 focus:ring-rose-50"
                                                    />
                                                </label>

                                                <label className="relative block">
                                                    <select
                                                        value={orderStatusFilter}
                                                        onChange={(event) => {
                                                            setOrderStatusFilter(event.target.value);
                                                            setOrderPage(1);
                                                        }}
                                                        className="h-10 min-w-[160px] appearance-none rounded-full border border-slate-200 bg-white py-0 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none shadow-soft-xs transition-colors focus:border-rose-200 focus:ring-4 focus:ring-rose-50"
                                                    >
                                                        <option value="">Tất cả đơn hàng</option>
                                                        {orderStatusOptions.map((status) => (
                                                            <option key={status} value={status}>{labelStatus(status, "order")}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-900" />
                                                </label>

                                                <label className="relative block">
                                                    <select
                                                        value={paymentStatusFilter}
                                                        onChange={(event) => {
                                                            setPaymentStatusFilter(event.target.value);
                                                            setOrderPage(1);
                                                        }}
                                                        className="h-10 min-w-[170px] appearance-none rounded-full border border-slate-200 bg-white py-0 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none shadow-soft-xs transition-colors focus:border-rose-200 focus:ring-4 focus:ring-rose-50"
                                                    >
                                                        <option value="">Tất cả thanh toán</option>
                                                        {paymentStatusOptions.map((status) => (
                                                            <option key={status} value={status}>{labelStatus(status, "payment")}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-900" />
                                                </label>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
                                                {filteringOrders && (
                                                    <span className="inline-flex h-9 items-center gap-2 rounded-full border border-rose-100 bg-white px-3 text-xs font-bold text-rose-700 shadow-soft-sm">
                                                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-rose-100 border-t-rose-700" />
                                                        Đang lọc
                                                    </span>
                                                )}
                                                {(orderSearch || orderStatusFilter || paymentStatusFilter) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (orderFilterTimerRef.current) window.clearTimeout(orderFilterTimerRef.current);
                                                            orderFilterTimerRef.current = null;
                                                            setOrderSearchInput("");
                                                            setOrderSearch("");
                                                            setOrderStatusFilter("");
                                                            setPaymentStatusFilter("");
                                                            setFilteringOrders(false);
                                                            setOrderPage(1);
                                                        }}
                                                        className="inline-flex h-9 items-center rounded-full border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 shadow-soft-xs transition-colors hover:text-rose-700"
                                                    >
                                                        Xóa lọc
                                                    </button>
                                                )}
                                                <span className="inline-flex h-9 items-center rounded-full border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 shadow-soft-xs">
                                                    Đơn: {sortedOrders.length.toLocaleString("vi-VN")}/{report.orders.length.toLocaleString("vi-VN")}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    <div
                                        className="sticky top-0 z-10 hidden lg:grid items-center border-b px-5 py-3"
                                        style={{ gridTemplateColumns: gridCols, borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}
                                    >
                                        {orderColumns.map((column) => (
                                            <SortButton
                                                key={column.key}
                                                active={sortKey === column.key}
                                                direction={sortDir}
                                                onClick={() => handleSort(column.key)}
                                            >
                                                {column.label}
                                            </SortButton>
                                        ))}
                                    </div>

                                    {sortedOrders.length === 0 ? (
                                        <AdminEmptyState
                                            title={report.orders.length > 0 ? "Không tìm thấy đơn phù hợp" : "Học kỳ chưa có đơn hàng"}
                                            detail={report.orders.length > 0 ? "Thử đổi từ khóa, trạng thái đơn hàng hoặc trạng thái thanh toán." : "Khi phụ huynh đặt đồng phục trong học kỳ này, mã đơn và trạng thái sẽ xuất hiện tại đây."}
                                            icon={<Inbox className="h-8 w-8" />}
                                            bg={ADMIN_TONE.soft}
                                        />
                                    ) : (
                                        <div>
                                            {pagedOrders.map((order, index) => (
                                                <div
                                                    key={order.orderId}
                                                    className="border-b px-5 py-3 transition-colors last:border-b-0 hover:bg-rose-50 nb-fade-in"
                                                    style={{ borderColor: ADMIN_TONE.line, animationDelay: `${index * 30}ms` }}
                                                >
                                                    <div className="hidden min-h-[58px] lg:grid items-center gap-4" style={{ gridTemplateColumns: gridCols }}>
                                                        <p className="truncate text-[14px] font-medium" style={{ color: ADMIN_TONE.pageInk }}>{order.orderNumber}</p>
                                                        <p className="truncate text-[14px] font-normal" style={{ color: "#3D384A" }}>{order.studentName}</p>
                                                        <p className="min-w-0 text-[13px] font-normal leading-5" style={{ color: ADMIN_TONE.muted }}>
                                                            {order.schoolName}<br />{order.providerName || "Chưa có NCC"}
                                                        </p>
                                                        <p className="text-[14px] font-medium text-gray-900">{formatCurrency(order.totalAmount)}</p>
                                                        <div><StatusBadge status={order.orderStatus} type="order" /></div>
                                                        <div><StatusBadge status={order.paymentStatus} type="payment" /></div>
                                                        <p className="text-[13px] font-medium" style={{ color: ADMIN_TONE.muted }}>{formatDate(order.createdAt)}</p>
                                                    </div>
                                                    <div className="space-y-3 lg:hidden">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <p className="text-[15px] font-medium" style={{ color: ADMIN_TONE.pageInk }}>Đơn {order.orderNumber}</p>
                                                                <p className="mt-1 text-[13px] font-medium" style={{ color: ADMIN_TONE.muted }}>{order.studentName} · {formatDate(order.createdAt)}</p>
                                                            </div>
                                                            <p className="text-[15px] font-medium" style={{ color: ADMIN_TONE.pageInk }}>{formatCurrency(order.totalAmount)}</p>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            <StatusBadge status={order.orderStatus} type="order" />
                                                            <StatusBadge status={order.paymentStatus} type="payment" />
                                                        </div>
                                                        <p className="text-[13px] font-medium" style={{ color: ADMIN_TONE.muted }}>
                                                            {order.schoolName} · {order.providerName || "Chưa có NCC"}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                            <div
                                                className="flex flex-col gap-3 border-t px-5 py-4 md:flex-row md:items-center md:justify-between"
                                                style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.soft }}
                                            >
                                                <div className="text-[13px] font-semibold" style={{ color: ADMIN_TONE.muted }}>
                                                    Hiển thị {((orderPage - 1) * ORDER_PAGE_SIZE + 1).toLocaleString("vi-VN")}–{Math.min(orderPage * ORDER_PAGE_SIZE, sortedOrders.length).toLocaleString("vi-VN")} / {sortedOrders.length.toLocaleString("vi-VN")} đơn · Trang {orderPage}/{orderTotalPages}
                                                </div>
                                                {orderTotalPages > 1 && (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            disabled={orderPage <= 1}
                                                            onClick={() => setOrderPage((current) => Math.max(1, current - 1))}
                                                            className="flex h-9 w-9 items-center justify-center rounded-full border transition-all disabled:opacity-40 hover:scale-[0.99]"
                                                            style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell, color: ADMIN_TONE.pageInk }}
                                                            title="Trang trước"
                                                        >
                                                            <ChevronLeft className="h-4 w-4" />
                                                        </button>
                                                        <span className="flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-[13px] font-bold" style={{ background: ADMIN_TONE.emeraldSoft, color: ADMIN_TONE.emerald }}>
                                                            {orderPage}
                                                        </span>
                                                        <button
                                                            disabled={orderPage >= orderTotalPages}
                                                            onClick={() => setOrderPage((current) => Math.min(orderTotalPages, current + 1))}
                                                            className="flex h-9 w-9 items-center justify-center rounded-full border transition-all disabled:opacity-40 hover:scale-[0.99]"
                                                            style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell, color: ADMIN_TONE.pageInk }}
                                                            title="Trang sau"
                                                        >
                                                            <ChevronRight className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
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
