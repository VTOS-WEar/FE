import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    AlertTriangle,
    ArrowRight,
    Banknote,
    CheckCircle2,
    ClipboardList,
    FileText,
    LayoutDashboard,
    Loader2,
    Package,
    ShieldCheck,
    Wallet,
} from "lucide-react";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useProviderSidebarConfig } from "../../hooks/useProviderSidebarConfig";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { getProviderComplaints } from "../../lib/api/complaints";
import { getProviderContracts } from "../../lib/api/contracts";
import {
    getProviderRevenue,
    type ProviderRevenueDto,
} from "../../lib/api/payments";
import {
    getProviderDirectOrderStats,
    getProviderProfile,
    type ProviderOrderStatsDto,
    type ProviderProfileDto,
} from "../../lib/api/providers";

type DashboardData = {
    profile: ProviderProfileDto | null;
    stats: ProviderOrderStatsDto | null;
    revenue: ProviderRevenueDto | null;
    contractsWaitingOnProvider: number;
    activeContracts: number;
    openComplaints: number;
    inProgressComplaints: number;
};

const PROVIDER_THEME = {
    primaryText: "text-violet-700",
    summary: {
        orders: "border-violet-100 bg-violet-100",
        paid: "border-amber-100 bg-amber-100",
        production: "border-orange-100 bg-orange-100",
        revenue: "border-emerald-100 bg-emerald-100",
    },
} as const;

function SummaryCard({
    label,
    value,
    note,
    icon,
    surfaceClassName,
    onClick,
}: {
    label: string;
    value: string | number;
    note: string;
    icon: ReactNode;
    surfaceClassName: string;
    onClick?: () => void;
}) {
    const Component = onClick ? "button" : "div";

    return (
        <Component
            type={onClick ? "button" : undefined}
            onClick={onClick}
            className={`min-h-[118px] w-full rounded-[8px] border p-5 text-left shadow-soft-sm transition-colors ${surfaceClassName} ${onClick ? "hover:border-violet-300" : ""}`}
        >
            <div className="flex h-full items-center gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-white text-slate-900 shadow-soft-xs">
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700">{label}</p>
                    <p className="mt-2 text-2xl font-bold leading-tight text-slate-950">{value}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-600">{note}</p>
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
                <p className={`text-xs font-bold uppercase tracking-[0.14em] ${PROVIDER_THEME.primaryText}`}>{label}</p>
                <h2 className="mt-1 text-lg font-extrabold text-slate-950">{title}</h2>
            </div>
            {action}
        </div>
    );
}

function WorkItem({
    icon,
    tone,
    title,
    description,
    count,
    onClick,
}: {
    icon: ReactNode;
    tone: "violet" | "amber" | "orange" | "emerald" | "rose" | "slate";
    title: string;
    description: string;
    count: number | string;
    onClick: () => void;
}) {
    const toneClass = {
        violet: "bg-violet-50 text-violet-700",
        amber: "bg-amber-50 text-amber-700",
        orange: "bg-orange-50 text-orange-700",
        emerald: "bg-emerald-50 text-emerald-700",
        rose: "bg-rose-50 text-rose-700",
        slate: "bg-slate-100 text-slate-700",
    }[tone];

    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center gap-3 rounded-[8px] border border-gray-200 bg-white px-3 py-2.5 text-left shadow-soft-xs transition-colors hover:border-violet-200 hover:bg-violet-50/60"
        >
            <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[8px] ${toneClass}`}>
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-slate-950">{title}</p>
                <p className="mt-0.5 line-clamp-1 text-xs font-semibold text-[#4c5769]">{description}</p>
            </div>
            <span className="rounded-full border border-violet-100 bg-white px-3 py-1 text-xs font-bold text-violet-700">
                {count}
            </span>
        </button>
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
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] border border-gray-200 bg-white px-4 text-sm font-bold text-slate-900 shadow-soft-xs transition-colors hover:border-violet-200 hover:text-violet-700"
        >
            {icon}
            {label}
        </button>
    );
}

function formatNumber(value: number) {
    return value.toLocaleString("vi-VN");
}

function formatCurrency(value: number) {
    return `${value.toLocaleString("vi-VN")} ₫`;
}

function formatStatus(status?: string | null) {
    switch (status) {
        case "Approved":
            return "Đã duyệt";
        case "Pending":
            return "Chờ duyệt";
        default:
            return status || "Chưa cập nhật";
    }
}

export const ProviderDashboard = (): JSX.Element => {
    const navigate = useNavigate();
    const sidebarConfig = useProviderSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [loading, setLoading] = useState(true);
    const [providerName, setProviderName] = useState("");
    const [data, setData] = useState<DashboardData>({
        profile: null,
        stats: null,
        revenue: null,
        contractsWaitingOnProvider: 0,
        activeContracts: 0,
        openComplaints: 0,
        inProgressComplaints: 0,
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [profile, stats, revenue, contracts, complaints] = await Promise.all([
                getProviderProfile(),
                getProviderDirectOrderStats(),
                getProviderRevenue(),
                getProviderContracts(),
                getProviderComplaints(1, 50),
            ]);

            const contractsWaitingOnProvider = contracts.filter(
                (contract) => contract.status === "Pending" || contract.status === "PendingProviderSign",
            ).length;

            const activeContracts = contracts.filter(
                (contract) => contract.status === "Active" || contract.status === "InUse",
            ).length;

            const openComplaints = complaints.items.filter((complaint) => complaint.status === "Open").length;
            const inProgressComplaints = complaints.items.filter((complaint) => complaint.status === "InProgress").length;

            setProviderName(profile.providerName || "");
            if (profile.providerName) {
                localStorage.setItem("vtos_org_name", profile.providerName);
            }

            setData({
                profile,
                stats,
                revenue,
                contractsWaitingOnProvider,
                activeContracts,
                openComplaints,
                inProgressComplaints,
            });
        } catch {
            setData((current) => ({ ...current }));
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

    const openIssueCount = data.openComplaints + data.inProgressComplaints;
    const profileApproved = data.profile?.status === "Approved";

    const metrics = useMemo(
        () => [
            {
                label: "Tổng đơn hàng",
                value: formatNumber(data.stats?.totalOrders ?? 0),
                note: `${formatNumber(data.stats?.pendingOrders ?? 0)} đơn mới | ${formatNumber(data.stats?.completedShipmentOrders ?? 0)} đã giao`,
                surfaceClassName: PROVIDER_THEME.summary.orders,
                icon: <ClipboardList className="h-6 w-6" />,
                onClick: () => navigate("/provider/orders"),
            },
            {
                label: "Chờ tiếp nhận",
                value: formatNumber(data.stats?.paidOrders ?? 0),
                note: "Đơn đã thanh toán cần xác nhận",
                surfaceClassName: PROVIDER_THEME.summary.paid,
                icon: <Package className="h-6 w-6" />,
                onClick: () => navigate("/provider/orders"),
            },
            {
                label: "Đang xử lý",
                value: formatNumber(data.stats?.inProgressOrders ?? 0),
                note: "Sản xuất, đóng gói hoặc giao hàng",
                surfaceClassName: PROVIDER_THEME.summary.production,
                icon: <ShieldCheck className="h-6 w-6" />,
                onClick: () => navigate("/provider/orders"),
            },
            {
                label: "Doanh thu đối soát",
                value: formatCurrency(data.revenue?.totalRevenue ?? 0),
                note: `${formatNumber(data.activeContracts)} hợp đồng hiệu lực`,
                surfaceClassName: PROVIDER_THEME.summary.revenue,
                icon: <Banknote className="h-6 w-6" />,
                onClick: () => navigate("/provider/revenue"),
            },
        ],
        [data, navigate],
    );

    const priorityItems = [
        {
            title: "Đơn chờ tiếp nhận",
            description: "Xác nhận đơn đã thanh toán để bắt đầu sản xuất",
            count: data.stats?.paidOrders ?? 0,
            tone: "amber" as const,
            icon: <ClipboardList className="h-5 w-5" />,
            onClick: () => navigate("/provider/orders"),
        },
        {
            title: "Hợp đồng cần xử lý",
            description: "Theo dõi hợp đồng đang chờ nhà cung cấp ký",
            count: data.contractsWaitingOnProvider,
            tone: "violet" as const,
            icon: <FileText className="h-5 w-5" />,
            onClick: () => navigate("/provider/contracts"),
        },
        {
            title: "Khiếu nại đang mở",
            description: "Ticket phụ huynh hoặc trường cần phản hồi",
            count: openIssueCount,
            tone: "rose" as const,
            icon: <AlertTriangle className="h-5 w-5" />,
            onClick: () => navigate("/provider/complaints"),
        },
        {
            title: "Doanh thu đối soát",
            description: "Kiểm tra ví và dòng tiền theo đơn hàng",
            count: formatCurrency(data.revenue?.totalRevenue ?? 0),
            tone: "emerald" as const,
            icon: <Wallet className="h-5 w-5" />,
            onClick: () => navigate("/provider/wallet"),
        },
    ];

    const readinessItems = [
        { label: "Hồ sơ nhà cung cấp", ready: profileApproved, route: "/provider/profile" },
        { label: "Hợp đồng hiệu lực", ready: data.activeContracts > 0, route: "/provider/contracts" },
        { label: "Luồng đơn hàng", ready: (data.stats?.totalOrders ?? 0) > 0, route: "/provider/orders" },
        { label: "Dòng tiền đối soát", ready: (data.revenue?.totalRevenue ?? 0) > 0, route: "/provider/revenue" },
        { label: "Không có khiếu nại mở", ready: openIssueCount === 0, route: "/provider/complaints" },
    ];
    const readyCount = readinessItems.filter((item) => item.ready).length;

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar
                        {...sidebarConfig}
                        name={providerName}
                        isCollapsed={isCollapsed}
                        onToggle={toggle}
                        onLogout={handleLogout}
                    />
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                    <TopNavBar>
                        <div className="flex items-center gap-2 px-2 py-2">
                            <LayoutDashboard className={`h-5 w-5 ${PROVIDER_THEME.primaryText}`} />
                            <h1 className="text-xl font-bold text-gray-900">Tổng quan nhà cung cấp</h1>
                        </div>
                    </TopNavBar>

                    <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                            <div>
                                <p className={`text-xs font-bold uppercase tracking-[0.16em] ${PROVIDER_THEME.primaryText}`}>Vận hành nhà cung cấp</p>
                                <h1 className="mt-1 text-2xl font-bold leading-tight text-slate-950">
                                    {providerName || "Bảng điều phối hôm nay"}
                                </h1>
                                <p className="mt-1 text-sm font-semibold text-slate-500">
                                    Theo dõi đơn hàng, hợp đồng, khiếu nại và dòng tiền đối soát trong một màn hình.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <QuickAction icon={<Package className="h-4 w-4" />} label="Đơn hàng" onClick={() => navigate("/provider/orders")} />
                                <QuickAction icon={<FileText className="h-4 w-4" />} label="Hợp đồng" onClick={() => navigate("/provider/contracts")} />
                                <QuickAction icon={<Wallet className="h-4 w-4" />} label="Ví NCC" onClick={() => navigate("/provider/wallet")} />
                            </div>
                        </section>

                        {loading ? (
                            <section className="rounded-[8px] border border-gray-200 bg-white p-10 text-center shadow-soft-sm">
                                <Loader2 className={`mx-auto mb-3 h-8 w-8 animate-spin ${PROVIDER_THEME.primaryText}`} />
                                <p className="text-sm font-semibold text-[#4c5769]">Đang tải tổng quan nhà cung cấp...</p>
                            </section>
                        ) : (
                            <>
                                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                    {metrics.map((metric) => (
                                        <SummaryCard key={metric.label} {...metric} />
                                    ))}
                                </section>

                                <section className="grid items-start gap-4 lg:grid-cols-12">
                                    <div className="rounded-[8px] border border-gray-200 bg-white shadow-soft-sm lg:col-span-5">
                                        <SectionHeader
                                            label="Điều phối đơn hàng"
                                            title="Việc ưu tiên"
                                            action={
                                                <button type="button" onClick={() => navigate("/provider/orders")} className="nb-btn nb-btn-outline text-sm hover:border-violet-200 hover:text-violet-700">
                                                    Xem tất cả
                                                </button>
                                            }
                                        />
                                        <div className="space-y-2.5 p-4">
                                            {priorityItems.map((item) => (
                                                <WorkItem key={item.title} {...item} />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2 lg:col-span-7">
                                        <div className="rounded-[8px] border border-gray-200 bg-white shadow-soft-sm">
                                            <SectionHeader
                                                label="Tín hiệu vận hành"
                                                title={`${openIssueCount} khiếu nại mở`}
                                                action={
                                                    <button type="button" onClick={() => navigate("/provider/complaints")} className="inline-flex items-center gap-2 text-sm font-bold text-violet-700">
                                                        Mở
                                                        <ArrowRight className="h-4 w-4" />
                                                    </button>
                                                }
                                            />
                                            <div className="space-y-2.5 p-4">
                                                <WorkItem
                                                    icon={<FileText className="h-5 w-5" />}
                                                    title="Hợp đồng cần xử lý"
                                                    description="Đang chờ phản hồi hoặc chữ ký nhà cung cấp"
                                                    count={data.contractsWaitingOnProvider}
                                                    tone="violet"
                                                    onClick={() => navigate("/provider/contracts")}
                                                />
                                                <WorkItem
                                                    icon={<AlertTriangle className="h-5 w-5" />}
                                                    title="Khiếu nại đang mở"
                                                    description="Cần kiểm tra phản hồi với phụ huynh hoặc trường"
                                                    count={openIssueCount}
                                                    tone="rose"
                                                    onClick={() => navigate("/provider/complaints")}
                                                />
                                                <WorkItem
                                                    icon={<Package className="h-5 w-5" />}
                                                    title="Đơn đang xử lý"
                                                    description="Đơn đã nhận, đang sản xuất hoặc chờ giao"
                                                    count={data.stats?.inProgressOrders ?? 0}
                                                    tone="orange"
                                                    onClick={() => navigate("/provider/orders")}
                                                />
                                            </div>
                                        </div>

                                        <div className="rounded-[8px] border border-gray-200 bg-white shadow-soft-sm">
                                            <SectionHeader label="Hoàn thiện thông tin" title={`${readyCount}/${readinessItems.length} mục hoàn tất`} />
                                            <div className="grid gap-2 p-4">
                                                {readinessItems.map((item) => (
                                                    <button
                                                        key={item.label}
                                                        type="button"
                                                        onClick={() => navigate(item.route)}
                                                        className="flex w-full items-center justify-between rounded-[8px] border border-gray-200 bg-white px-3 py-2.5 text-left transition-colors hover:border-violet-200 hover:bg-violet-50/60"
                                                    >
                                                        <span className="text-sm font-bold text-slate-900">{item.label}</span>
                                                        {item.ready ? (
                                                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                                        ) : (
                                                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                                                        )}
                                                    </button>
                                                ))}
                                                <div className="rounded-[8px] border border-slate-100 bg-slate-50 px-3 py-2.5">
                                                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Trạng thái hồ sơ</p>
                                                    <p className="mt-1 text-sm font-extrabold text-slate-950">{formatStatus(data.profile?.status)}</p>
                                                </div>
                                            </div>
                                        </div>
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

export default ProviderDashboard;
