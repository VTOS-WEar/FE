import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    AlertTriangle,
    BarChart3,
    FolderClock,
    Loader2,
    PackageCheck,
    TrendingUp,
    Users,
    Wallet,
} from "lucide-react";
import {
    Bar as OriginalBar,
    BarChart as OriginalBarChart,
    CartesianGrid as OriginalCartesianGrid,
    Cell as OriginalCell,
    ComposedChart as OriginalComposedChart,
    Line as OriginalLine,
    Pie as OriginalPie,
    PieChart as OriginalPieChart,
    ResponsiveContainer as OriginalResponsiveContainer,
    Tooltip as OriginalTooltip,
    XAxis as OriginalXAxis,
    YAxis as OriginalYAxis,
} from "recharts";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { AdminTopNavTitle } from "../AdminShared/adminWorkspace";
import { useAdminSidebarConfig } from "../../hooks/useAdminSidebarConfig";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import {
    getDashboardAnalytics,
    getAdminCashFlow,
    getWithdrawalRequests,
    getAdminComplaints,
    type DashboardAnalyticsDto,
    type AdminCashFlowDto,
    type AdminComplaintListResult,
    type WithdrawalRequestDto,
} from "../../lib/api/admin";
import {
    getAccountRequests,
    type AccountRequestListItem,
} from "../../lib/api/accountRequests";

const ADMIN_THEME = {
    primaryText: "text-rose-700",
    summary: {
        users: "border-rose-100 bg-rose-50",
        requests: "border-amber-100 bg-amber-100",
        withdrawals: "border-emerald-100 bg-emerald-100",
        tickets: "border-orange-100 bg-orange-100",
    },
} as const;

const Bar = OriginalBar as any;
const BarChart = OriginalBarChart as any;
const CartesianGrid = OriginalCartesianGrid as any;
const Cell = OriginalCell as any;
const ComposedChart = OriginalComposedChart as any;
const Line = OriginalLine as any;
const Pie = OriginalPie as any;
const PieChart = OriginalPieChart as any;
const ResponsiveContainer = OriginalResponsiveContainer as any;
const Tooltip = OriginalTooltip as any;
const XAxis = OriginalXAxis as any;
const YAxis = OriginalYAxis as any;

const chartColors = ["#BE123C", "#0F9D7A", "#2477E4", "#C68508", "#4B39C8", "#64748B"];

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
    Pending: "Chờ thanh toán",
    Processing: "Đang xử lý",
    Completed: "Hoàn tất",
    Failed: "Thất bại",
    Cancelled: "Đã hủy",
    Refunded: "Đã hoàn",
};

function formatCurrency(value: number) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value || 0);
}

function formatCompactNumber(value: number) {
    return new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 }).format(value || 0);
}

function formatMonth(month: string) {
    const [year, monthNumber] = month.split("-");
    return monthNumber && year ? `${monthNumber}/${year.slice(-2)}` : month;
}

function SummaryCard({
    label,
    value,
    icon,
    surfaceClassName,
    onClick,
}: {
    label: string;
    value: string | number;
    icon: ReactNode;
    surfaceClassName: string;
    onClick?: () => void;
}) {
    const Component = onClick ? "button" : "div";

    return (
        <Component
            type={onClick ? "button" : undefined}
            onClick={onClick}
            className={`min-h-[118px] w-full rounded-[8px] border p-5 text-left shadow-soft-sm transition-colors ${surfaceClassName} ${onClick ? "hover:border-rose-300" : ""}`}
        >
            <div className="flex h-full items-center gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-white text-slate-900 shadow-soft-xs">
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700">{label}</p>
                    <p className="mt-2 text-2xl font-bold leading-tight text-slate-950">{value}</p>
                </div>
            </div>
        </Component>
    );
}

function SectionHeader({
    label,
    title,
    action,
}: {
    label: string;
    title: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
            <div>
                <p className={`text-xs font-bold uppercase tracking-[0.14em] ${ADMIN_THEME.primaryText}`}>{label}</p>
                <h2 className="mt-1 text-lg font-bold text-slate-950">{title}</h2>
            </div>
            {action}
        </div>
    );
}

function QuickAction({
    icon,
    label,
    onClick,
}: {
    icon: ReactNode;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] border border-gray-200 bg-white px-4 text-sm font-bold text-slate-900 shadow-soft-xs transition-colors hover:border-rose-200 hover:text-rose-700"
        >
            {icon}
            {label}
        </button>
    );
}

function ChartShell({
    label,
    title,
    icon,
    children,
}: {
    label: string;
    title: string;
    icon: ReactNode;
    children: ReactNode;
}) {
    return (
        <section className="rounded-[8px] border border-gray-200 bg-white shadow-soft-sm">
            <SectionHeader
                label={label}
                title={title}
                action={<div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-rose-50 text-rose-700">{icon}</div>}
            />
            <div className="p-4">{children}</div>
        </section>
    );
}

function EmptyChart({ label }: { label: string }) {
    return (
        <div className="flex h-[260px] items-center justify-center rounded-[8px] border border-dashed border-gray-200 bg-slate-50 text-center">
            <p className="px-6 text-sm font-semibold text-slate-500">{label}</p>
        </div>
    );
}

type GrowthChartDatum = {
    month: string;
    label: string;
    users: number;
    orders: number;
};

function SystemGrowthChart({ data }: { data: GrowthChartDatum[] }) {
    return (
        <ChartShell label="Xu hướng sử dụng" title="Người dùng mới và đơn hàng" icon={<TrendingUp className="h-5 w-5" />}>
            {data.length === 0 ? (
                <EmptyChart label="Chưa có dữ liệu tăng trưởng trong kỳ." />
            ) : (
                <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
                            <CartesianGrid stroke="#E5E7EB" strokeDasharray="4 6" vertical={false} />
                            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12, fontWeight: 600 }} />
                            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12, fontWeight: 600 }} allowDecimals={false} />
                            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12, fontWeight: 600 }} allowDecimals={false} />
                            <Tooltip
                                formatter={(value: number, name: string) => [
                                    Number(value).toLocaleString("vi-VN"),
                                    name === "users" ? "Người dùng mới" : "Đơn hàng",
                                ]}
                                labelFormatter={(label: string) => `Tháng ${label}`}
                                contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontWeight: 600 }}
                            />
                            <Bar yAxisId="left" dataKey="users" fill="#BE123C" radius={[8, 8, 0, 0]} name="users" barSize={24} />
                            <Bar yAxisId="right" dataKey="orders" fill="#2477E4" radius={[8, 8, 0, 0]} name="orders" barSize={24} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </ChartShell>
    );
}

type StatusChartDatum = {
    status: string;
    label: string;
    count: number;
    totalAmount: number;
    color: string;
};

function OrderHealthChart({ data }: { data: StatusChartDatum[] }) {
    const total = data.reduce((sum, item) => sum + item.count, 0);

    return (
        <ChartShell label="Tình trạng đơn hàng" title="Phân bổ trạng thái đơn" icon={<BarChart3 className="h-5 w-5" />}>
            {data.length === 0 ? (
                <EmptyChart label="Chưa có dữ liệu trạng thái đơn hàng." />
            ) : (
                <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
                    <div className="relative h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Tooltip
                                    formatter={(value: number, _name: string, item: any) => [
                                        `${Number(value).toLocaleString("vi-VN")} đơn`,
                                        item?.payload?.label ?? "Trạng thái",
                                    ]}
                                    contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontWeight: 600 }}
                                />
                                <Pie data={data} dataKey="count" nameKey="label" cx="50%" cy="50%" innerRadius={58} outerRadius={86} paddingAngle={3} stroke="#FFFFFF" strokeWidth={3}>
                                    {data.map((item) => (
                                        <Cell key={item.status} fill={item.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Tổng đơn</span>
                            <span className="text-2xl font-bold text-slate-950">{total.toLocaleString("vi-VN")}</span>
                        </div>
                    </div>
                    <div className="grid content-center gap-2">
                        {data.slice(0, 6).map((item) => (
                            <div key={item.status} className="flex items-center justify-between gap-3 rounded-[8px] bg-slate-50 px-3 py-2">
                                <span className="inline-flex min-w-0 items-center gap-2 text-sm font-bold text-slate-900">
                                    <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: item.color }} />
                                    <span className="truncate">{item.label}</span>
                                </span>
                                <span className="text-sm font-bold text-slate-950">{item.count.toLocaleString("vi-VN")}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </ChartShell>
    );
}

function PaymentHealthChart({ data }: { data: StatusChartDatum[] }) {
    return (
        <ChartShell label="Thanh toán" title="Trạng thái giao dịch" icon={<Wallet className="h-5 w-5" />}>
            {data.length === 0 ? (
                <EmptyChart label="Chưa có dữ liệu giao dịch thanh toán." />
            ) : (
                <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 16 }}>
                            <CartesianGrid stroke="#E5E7EB" strokeDasharray="4 6" horizontal={false} />
                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12, fontWeight: 600 }} allowDecimals={false} />
                            <YAxis type="category" dataKey="label" axisLine={false} tickLine={false} width={96} tick={{ fill: "#4c5769", fontSize: 12, fontWeight: 600 }} />
                            <Tooltip
                                formatter={(value: number, _name: string, item: any) => [
                                    `${Number(value).toLocaleString("vi-VN")} giao dịch · ${formatCurrency(item?.payload?.totalAmount ?? 0)}`,
                                    item?.payload?.label ?? "Thanh toán",
                                ]}
                                contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontWeight: 600 }}
                            />
                            <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={18}>
                                {data.map((item) => (
                                    <Cell key={item.status} fill={item.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </ChartShell>
    );
}

function CashFlowChart({ data }: { data: AdminCashFlowDto["revenueChart"] }) {
    return (
        <ChartShell label="Phí nền tảng" title="Phí đơn hàng và phí rút tiền" icon={<Wallet className="h-5 w-5" />}>
            {data.length === 0 ? (
                <EmptyChart label="Chưa có dữ liệu phí nền tảng." />
            ) : (
                <div className="space-y-3">
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold text-slate-600">
                        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#0F9D7A]" />Phí đơn hàng</span>
                        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#C68508]" />Phí rút tiền</span>
                        <span className="inline-flex items-center gap-2"><span className="h-0.5 w-4 rounded-full bg-[#2477E4]" />Tổng phí</span>
                    </div>
                    <div className="h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
                                <CartesianGrid stroke="#E5E7EB" strokeDasharray="4 6" vertical={false} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12, fontWeight: 600 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12, fontWeight: 600 }} tickFormatter={formatCompactNumber} />
                                <Tooltip
                                    formatter={(value: number, name: string) => {
                                        const labels: Record<string, string> = {
                                            orderFees: "Phí đơn hàng (1% giá trị đơn đã tất toán)",
                                            withdrawalFees: "Phí rút tiền (2% yêu cầu rút tiền đã duyệt)",
                                            totalFees: "Tổng phí",
                                        };
                                        return [formatCurrency(Number(value)), labels[name] ?? name];
                                    }}
                                    contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontWeight: 600 }}
                                />
                                <Bar dataKey="orderFees" fill="#0F9D7A" radius={[8, 8, 0, 0]} name="orderFees" barSize={18} />
                                <Bar dataKey="withdrawalFees" fill="#C68508" radius={[8, 8, 0, 0]} name="withdrawalFees" barSize={18} />
                                <Line type="monotone" dataKey="totalFees" stroke="#2477E4" strokeWidth={3} dot={false} name="totalFees" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </ChartShell>
    );
}

function TopUniformsPanel({ data }: { data: NonNullable<DashboardAnalyticsDto["topSellingUniforms"]> }) {
    return (
        <ChartShell label="Sản phẩm" title="Đồng phục bán chạy" icon={<PackageCheck className="h-5 w-5" />}>
            {data.length === 0 ? (
                <EmptyChart label="Chưa có dữ liệu đồng phục bán chạy." />
            ) : (
                <div className="space-y-3">
                    {data.slice(0, 5).map((item, index) => (
                        <div key={item.outfitId} className="grid gap-2 rounded-[8px] border border-gray-100 bg-slate-50 px-3 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-slate-950">
                                    {index + 1}. {item.outfitName}
                                </p>
                                <p className="mt-1 text-xs font-semibold text-slate-500">{item.quantitySold.toLocaleString("vi-VN")} sản phẩm đã bán</p>
                            </div>
                            <p className="text-sm font-bold text-rose-700">{formatCurrency(item.revenue)}</p>
                        </div>
                    ))}
                </div>
            )}
        </ChartShell>
    );
}

type DashboardData = {
    analytics: DashboardAnalyticsDto | null;
    cashFlow: AdminCashFlowDto | null;
    withdrawals: WithdrawalRequestDto[];
    accountRequests: AccountRequestListItem[];
    complaintResult: AdminComplaintListResult | null;
};

export const AdminDashboard = (): JSX.Element => {
    const navigate = useNavigate();
    const sidebarConfig = useAdminSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<DashboardData>({
        analytics: null,
        cashFlow: null,
        withdrawals: [],
        accountRequests: [],
        complaintResult: null,
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [analyticsRes, cashFlowRes, withdrawalsRes, requestsRes, complaintsRes] = await Promise.allSettled([
                getDashboardAnalytics(),
                getAdminCashFlow(365),
                getWithdrawalRequests({ page: 1, pageSize: 4, status: "Pending" }),
                getAccountRequests({ page: 1, pageSize: 4, status: 1 }),
                getAdminComplaints({ page: 1, pageSize: 4 }),
            ]);
            setData({
                analytics: analyticsRes.status === "fulfilled" ? analyticsRes.value : null,
                cashFlow: cashFlowRes.status === "fulfilled" ? cashFlowRes.value : null,
                withdrawals: withdrawalsRes.status === "fulfilled" ? (withdrawalsRes.value.items ?? []) : [],
                accountRequests: requestsRes.status === "fulfilled" ? (requestsRes.value.items ?? []) : [],
                complaintResult: complaintsRes.status === "fulfilled" ? complaintsRes.value : null,
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    const openTicketCount = (data.complaintResult?.openCount ?? 0) + (data.complaintResult?.inProgressCount ?? 0);
    const pendingApprovals = data.analytics?.pendingApprovals ?? data.accountRequests.length;
    const pendingWithdrawals = data.analytics?.pendingWithdrawals ?? data.withdrawals.length;

    const metrics = useMemo(
        () => [
            {
                label: "Người dùng toàn hệ thống",
                value: (data.analytics?.totalUsers ?? 0).toLocaleString("vi-VN"),
                surfaceClassName: ADMIN_THEME.summary.users,
                icon: <Users className="h-6 w-6" />,
                onClick: () => navigate("/admin/users"),
            },
            {
                label: "Yêu cầu tài khoản chờ",
                value: pendingApprovals.toLocaleString("vi-VN"),
                surfaceClassName: ADMIN_THEME.summary.requests,
                icon: <FolderClock className="h-6 w-6" />,
                onClick: () => navigate("/admin/account-requests"),
            },
            {
                label: "Rút tiền chờ duyệt",
                value: pendingWithdrawals.toLocaleString("vi-VN"),
                surfaceClassName: ADMIN_THEME.summary.withdrawals,
                icon: <Wallet className="h-6 w-6" />,
                onClick: () => navigate("/admin/withdrawals"),
            },
            {
                label: "Ticket hỗ trợ mở",
                value: openTicketCount.toLocaleString("vi-VN"),
                surfaceClassName: ADMIN_THEME.summary.tickets,
                icon: <AlertTriangle className="h-6 w-6" />,
                onClick: () => navigate("/admin/complaints"),
            },
        ],
        [data, navigate, pendingApprovals, pendingWithdrawals, openTicketCount],
    );

    const growthChartData = useMemo<GrowthChartDatum[]>(() => {
        const ordersByMonth = new Map((data.analytics?.ordersPerMonth ?? []).map((item) => [item.month, item.orderCount]));
        const usersByMonth = new Map<string, number>();
        (data.analytics?.usersPerMonth ?? []).forEach((item) => {
            usersByMonth.set(item.month, (usersByMonth.get(item.month) ?? 0) + item.userCount);
        });

        const months = Array.from(new Set([...ordersByMonth.keys(), ...usersByMonth.keys()])).sort();
        return months.map((month) => ({
            month,
            label: formatMonth(month),
            users: usersByMonth.get(month) ?? 0,
            orders: ordersByMonth.get(month) ?? 0,
        }));
    }, [data.analytics]);

    const orderStatusData = useMemo<StatusChartDatum[]>(
        () =>
            (data.analytics?.orderStatusBreakdown ?? [])
                .filter((item) => item.count > 0)
                .map((item, index) => ({
                    status: item.status,
                    label: orderStatusLabels[item.status] ?? item.status,
                    count: item.count,
                    totalAmount: item.totalAmount,
                    color: chartColors[index % chartColors.length],
                })),
        [data.analytics],
    );

    const paymentStatusData = useMemo<StatusChartDatum[]>(
        () =>
            (data.analytics?.paymentStatusBreakdown ?? [])
                .filter((item) => item.count > 0)
                .map((item, index) => ({
                    status: item.status,
                    label: paymentStatusLabels[item.status] ?? item.status,
                    count: item.count,
                    totalAmount: item.totalAmount,
                    color: chartColors[(index + 2) % chartColors.length],
                })),
        [data.analytics],
    );

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                    <TopNavBar>
                        <AdminTopNavTitle title="Tổng quan Admin" />
                    </TopNavBar>

                    <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8 nb-fade-in">
                        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-700">Điều hành hệ thống</p>
                                <h1 className="mt-1 text-2xl font-bold leading-tight text-slate-950">
                                    Tổng quan vận hành hôm nay
                                </h1>
                                <p className="mt-1 text-sm font-semibold text-slate-500">
                                    Theo dõi tăng trưởng, đơn hàng, thanh toán và dòng tiền trong một màn hình.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <QuickAction icon={<Users className="h-4 w-4" />} label="Người dùng" onClick={() => navigate("/admin/users")} />
                                <QuickAction icon={<FolderClock className="h-4 w-4" />} label="Yêu cầu tài khoản" onClick={() => navigate("/admin/account-requests")} />
                                <QuickAction icon={<Wallet className="h-4 w-4" />} label="Rút tiền" onClick={() => navigate("/admin/withdrawals")} />
                            </div>
                        </section>

                        {loading ? (
                            <section className="rounded-[8px] border border-gray-200 bg-white p-10 text-center shadow-soft-sm">
                                <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-rose-700" />
                                <p className="text-sm font-semibold text-[#4c5769]">Đang tải tổng quan hệ thống...</p>
                            </section>
                        ) : (
                            <>
                                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                    {metrics.map((metric) => (
                                        <SummaryCard key={metric.label} {...metric} />
                                    ))}
                                </section>

                                <section className="grid items-start gap-4 xl:grid-cols-12">
                                    <div className="xl:col-span-7">
                                        <SystemGrowthChart data={growthChartData} />
                                    </div>
                                    <div className="xl:col-span-5">
                                        <CashFlowChart data={data.cashFlow?.revenueChart ?? []} />
                                    </div>
                                    <div className="xl:col-span-6">
                                        <OrderHealthChart data={orderStatusData} />
                                    </div>
                                    <div className="xl:col-span-6">
                                        <PaymentHealthChart data={paymentStatusData} />
                                    </div>
                                    <div className="xl:col-span-12">
                                        <TopUniformsPanel data={data.analytics?.topSellingUniforms ?? []} />
                                    </div>
                                </section>
                            </>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
