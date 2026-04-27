import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    AlertTriangle,
    ArrowRight,
    Building2,
    CheckCircle2,
    ChevronRight,
    ClipboardList,
    FileText,
    Package,
    ShieldCheck,
    Wallet,
} from "lucide-react";
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
import { useProviderSidebarConfig } from "../../hooks/useProviderSidebarConfig";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { getProviderComplaints } from "../../lib/api/complaints";
import { getProviderContracts } from "../../lib/api/contracts";
import {
    getProviderDirectOrderStats,
    getProviderProfile,
    type ProviderOrderStatsDto,
    type ProviderProfileDto,
} from "../../lib/api/providers";

type DashboardData = {
    profile: ProviderProfileDto | null;
    stats: ProviderOrderStatsDto | null;
    contractsWaitingOnProvider: number;
    activeContracts: number;
    openComplaints: number;
    inProgressComplaints: number;
};

function MetricCard({
    label,
    value,
    icon,
    tone,
}: {
    label: string;
    value: string | number;
    note?: string;
    icon: React.ReactNode;
    tone: string;
}) {
    return (
        <div className="rounded-[22px] border border-gray-200 bg-white p-5 shadow-soft-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">{label}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-white/60 ${tone}`}>
                    {icon}
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
    description?: string;
    href: string;
    badge?: string;
    icon: React.ReactNode;
    tone: string;
}) {
    return (
        <Link
            to={href}
            className="group flex h-full flex-col justify-between rounded-[22px] border border-gray-200 bg-white p-5 shadow-soft-sm transition-colors hover:border-gray-300"
        >
            <div>
                <div className="flex items-start justify-between gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}>
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
        contractsWaitingOnProvider: 0,
        activeContracts: 0,
        openComplaints: 0,
        inProgressComplaints: 0,
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [profile, stats, contracts, complaints] = await Promise.all([
                getProviderProfile(),
                getProviderDirectOrderStats(),
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
                label: "Chờ tiếp nhận",
                value: data.stats?.paidOrders ?? 0,
                tone: "bg-amber-50 text-amber-600",
                icon: <ClipboardList className="h-5 w-5" />,
            },
            {
                label: "Đang sản xuất",
                value: data.stats?.inProgressOrders ?? 0,
                tone: "bg-violet-50 text-violet-600",
                icon: <Package className="h-5 w-5" />,
            },
            {
                label: "Hợp đồng cần xử lý",
                value: data.contractsWaitingOnProvider,
                tone: "bg-blue-50 text-blue-600",
                icon: <FileText className="h-5 w-5" />,
            },
            {
                label: "Khiếu nại mở",
                value: data.openComplaints + data.inProgressComplaints,
                tone: "bg-rose-50 text-rose-600",
                icon: <AlertTriangle className="h-5 w-5" />,
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
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/provider/dashboard" className="font-semibold text-[#4c5769] text-base">
                                        Trang chủ
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="font-bold text-gray-900 text-base">Tổng quan</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </TopNavBar>

                    <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        <section className="overflow-hidden rounded-[24px] border border-slate-900/70 bg-slate-950 px-6 py-6 text-white shadow-soft-sm lg:px-8">
                            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                                <div className="max-w-3xl">
                                    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                                        Vận hành nhà cung cấp
                                    </span>
                                    <h1 className="mt-4 text-3xl font-bold leading-tight text-white sm:text-4xl">
                                        {providerName || "Nhà cung cấp"} đang vận hành {data.stats?.totalOrders ?? 0} đơn hàng trong hệ thống.
                                    </h1>
                                </div>
                                <div className="provider-hero-metrics grid gap-3">
                                    <div className="rounded-[22px] border border-white/10 bg-white/8 p-4">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">Doanh thu</p>
                                        <p className="mt-2 text-2xl font-bold text-white">
                                            {(data.stats?.totalRevenue ?? 0).toLocaleString("vi-VN")}
                                        </p>
                                    </div>
                                    <div className="rounded-[22px] border border-white/10 bg-white/8 p-4">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">Hợp đồng hiệu lực</p>
                                        <p className="mt-2 text-2xl font-bold text-white">{data.activeContracts}</p>
                                    </div>
                                    <div className="rounded-[22px] border border-white/10 bg-white/8 p-4">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">Hồ sơ</p>
                                        <p className="mt-2 text-2xl font-bold text-white">{formatStatus(data.profile?.status)}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {loading ? (
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                {[1, 2, 3, 4].map((item) => (
                                    <div key={item} className="nb-skeleton h-[150px] rounded-[26px]" />
                                ))}
                            </div>
                        ) : (
                            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                {metrics.map((metric) => (
                                    <MetricCard key={metric.label} {...metric} />
                                ))}
                            </section>
                        )}

                        <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
                            <div className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Việc ưu tiên</p>
                                        <h2 className="mt-2 text-2xl font-bold text-gray-900">Bảng điều phối hôm nay</h2>
                                    </div>
                                    <Link
                                        to="/provider/orders"
                                        className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 transition-all hover:border-violet-200 hover:text-violet-700"
                                    >
                                        Xem tất cả đơn
                                        <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </div>

                                <div className="mt-6 grid gap-4 md:grid-cols-2">
                                    {actionCards.map((card) => (
                                        <ActionCard key={card.title} {...card} />
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Trạng thái vận hành</p>
                                <h2 className="mt-2 text-2xl font-bold text-gray-900">Sẵn sàng giao dịch</h2>

                                <div className="mt-6 space-y-4">
                                    <div className="rounded-[22px] border border-emerald-100 bg-emerald-50/70 p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-soft-sm">
                                                <CheckCircle2 className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-emerald-900">Luồng đơn hàng đang mở</h3>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-[22px] border border-blue-100 bg-blue-50/70 p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-soft-sm">
                                                <ShieldCheck className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-blue-900">Hồ sơ và hợp đồng</h3>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-[22px] border border-amber-100 bg-amber-50/80 p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-soft-sm">
                                                <AlertTriangle className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-amber-900">Điểm cần theo dõi</h3>
                                            </div>
                                        </div>
                                    </div>
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
