import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    AlertTriangle,
    ArrowRight,
    Banknote,
    Building2,
    CheckCircle2,
    ChevronRight,
    ClipboardList,
    FileText,
    LayoutDashboard,
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

function MetricCard({
    label,
    value,
    icon,
    surfaceClassName,
    iconClassName,
}: {
    label: string;
    value: string | number;
    icon: React.ReactNode;
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

function ActionCard({
    title,
    href,
    badge,
    icon,
    tone,
}: {
    title: string;
    href: string;
    badge?: string;
    icon: React.ReactNode;
    tone: string;
}) {
    return (
        <Link
            to={href}
            className="group flex h-full flex-col justify-between rounded-[8px] border border-gray-200 bg-white p-5 shadow-soft-sm transition-colors hover:border-violet-200"
        >
            <div>
                <div className="flex items-start justify-between gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-full ${tone}`}>
                        {icon}
                    </div>
                    {badge ? (
                        <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-700">
                            {badge}
                        </span>
                    ) : null}
                </div>
                <h3 className="mt-5 text-lg font-bold text-gray-900">{title}</h3>
            </div>
            <div className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-violet-700">
                Mở khu vực này
                <ArrowRight className="h-4 w-4" />
            </div>
        </Link>
    );
}

function StatusRow({
    title,
    value,
    icon,
    tone,
}: {
    title: string;
    value: string;
    icon: React.ReactNode;
    tone: string;
}) {
    return (
        <div className="flex items-center justify-between gap-4 border-t border-slate-100 py-4 first:border-t-0 first:pt-0 last:pb-0">
            <div className="flex min-w-0 items-center gap-3">
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${tone}`}>
                    {icon}
                </div>
                <p className="font-bold text-slate-900">{title}</p>
            </div>
            <span className="text-right text-sm font-bold text-slate-600">{value}</span>
        </div>
    );
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

    const metrics = useMemo(
        () => [
            {
                label: "Tổng đơn hàng",
                value: data.stats?.totalOrders ?? 0,
                surfaceClassName: "bg-blue-100",
                iconClassName: "text-slate-900",
                icon: <ClipboardList className="h-6 w-6" />,
            },
            {
                label: "Chờ tiếp nhận",
                value: data.stats?.paidOrders ?? 0,
                surfaceClassName: "bg-yellow-100",
                iconClassName: "text-slate-900",
                icon: <Package className="h-6 w-6" />,
            },
            {
                label: "Đang xử lý",
                value: data.stats?.inProgressOrders ?? 0,
                surfaceClassName: "bg-orange-100",
                iconClassName: "text-slate-900",
                icon: <ShieldCheck className="h-6 w-6" />,
            },
            {
                label: "Doanh thu đối soát",
                value: formatCurrency(data.revenue?.totalRevenue ?? 0),
                surfaceClassName: "bg-lime-200",
                iconClassName: "text-slate-900",
                icon: <Banknote className="h-6 w-6" />,
            },
        ],
        [data],
    );

    const actionCards = [
        {
            title: "Đi tới hàng chờ sản xuất",
            href: "/provider/orders",
            badge: data.stats?.paidOrders ? `${data.stats.paidOrders} đơn chờ` : undefined,
            tone: "bg-amber-50 text-amber-600 border border-amber-100",
            icon: <ClipboardList className="h-5 w-5" />,
        },
        {
            title: "Kiểm tra hợp đồng với trường",
            href: "/provider/contracts",
            badge: data.contractsWaitingOnProvider ? `${data.contractsWaitingOnProvider} việc cần làm` : undefined,
            tone: "bg-blue-50 text-blue-600 border border-blue-100",
            icon: <FileText className="h-5 w-5" />,
        },
        {
            title: "Theo dõi dòng tiền",
            href: "/provider/wallet",
            tone: "bg-emerald-50 text-emerald-600 border border-emerald-100",
            icon: <Wallet className="h-5 w-5" />,
        },
        {
            title: "Cập nhật hồ sơ vận hành",
            href: "/provider/profile",
            tone: "bg-violet-50 text-violet-600 border border-violet-100",
            icon: <Building2 className="h-5 w-5" />,
        },
    ];

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

                <div className="flex-1 flex flex-col min-w-0">
                    <TopNavBar>
                        <div className="flex items-center gap-3 px-2 py-2">
                            <div className="hidden h-10 w-10 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-soft-sm sm:flex">
                                <LayoutDashboard className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold leading-none text-gray-900">Tổng quan nhà cung cấp</h1>
                            </div>
                        </div>
                    </TopNavBar>

                    <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        <section className="space-y-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-950">Bảng vận hành hôm nay</h2>
                                </div>
                                <Link
                                    to="/provider/orders"
                                    className="nb-btn nb-btn-outline inline-flex w-fit items-center gap-2 text-sm"
                                >
                                    Xem đơn hàng
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            </div>

                            {loading ? (
                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                    {[1, 2, 3, 4].map((item) => (
                                        <div key={item} className="nb-skeleton h-[112px] rounded-[8px]" />
                                    ))}
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                    {metrics.map((metric) => (
                                        <MetricCard key={metric.label} {...metric} />
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="space-y-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Điều phối nhanh</h2>
                                </div>
                                <Link
                                    to="/provider/orders"
                                    className="inline-flex w-fit items-center gap-2 text-sm font-bold text-violet-700"
                                >
                                    Xem tất cả đơn
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {actionCards.map((card) => (
                                    <ActionCard key={card.title} {...card} />
                                ))}
                            </div>
                        </section>

                        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                            <div className="rounded-[8px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">Tín hiệu vận hành</h2>
                                    </div>
                                    <span className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
                                        {data.openComplaints + data.inProgressComplaints} khiếu nại mở
                                    </span>
                                </div>

                                <div className="mt-6">
                                    <StatusRow
                                        title="Hợp đồng cần xử lý"
                                        value={`${data.contractsWaitingOnProvider} việc`}
                                        tone="bg-blue-50 text-blue-700"
                                        icon={<FileText className="h-5 w-5" />}
                                    />
                                    <StatusRow
                                        title="Khiếu nại đang mở"
                                        value={`${data.openComplaints + data.inProgressComplaints} ticket`}
                                        tone="bg-rose-50 text-rose-700"
                                        icon={<AlertTriangle className="h-5 w-5" />}
                                    />
                                    <StatusRow
                                        title="Doanh thu đối soát"
                                        value={formatCurrency(data.revenue?.totalRevenue ?? 0)}
                                        tone="bg-emerald-50 text-emerald-700"
                                        icon={<Banknote className="h-5 w-5" />}
                                    />
                                    <StatusRow
                                        title="Đơn đang xử lý"
                                        value={`${data.stats?.inProgressOrders ?? 0} đơn`}
                                        tone="bg-orange-50 text-orange-700"
                                        icon={<Package className="h-5 w-5" />}
                                    />
                                </div>
                            </div>

                            <div className="rounded-[8px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                                <h2 className="text-2xl font-bold text-gray-900">Sẵn sàng giao dịch</h2>

                                <div className="mt-6">
                                    <StatusRow
                                        title="Luồng đơn hàng"
                                        value={`${data.stats?.totalOrders ?? 0} đơn`}
                                        tone="bg-emerald-50 text-emerald-700"
                                        icon={<CheckCircle2 className="h-5 w-5" />}
                                    />
                                    <StatusRow
                                        title="Hợp đồng hiệu lực"
                                        value={`${data.activeContracts} hợp đồng`}
                                        tone="bg-blue-50 text-blue-700"
                                        icon={<ShieldCheck className="h-5 w-5" />}
                                    />
                                    <StatusRow
                                        title="Hồ sơ nhà cung cấp"
                                        value={formatStatus(data.profile?.status)}
                                        tone="bg-violet-50 text-violet-700"
                                        icon={<Building2 className="h-5 w-5" />}
                                    />
                                    <StatusRow
                                        title="Điểm cần theo dõi"
                                        value={`${data.contractsWaitingOnProvider} hợp đồng, ${data.openComplaints + data.inProgressComplaints} khiếu nại`}
                                        tone="bg-amber-50 text-amber-700"
                                        icon={<AlertTriangle className="h-5 w-5" />}
                                    />
                                </div>
                            </div>
                        </section>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default ProviderDashboard;
