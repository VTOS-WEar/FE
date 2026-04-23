import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    CreditCard,
    Download,
    FolderClock,
    TrendingUp,
    Users,
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
import { useAdminSidebarConfig } from "../../hooks/useAdminSidebarConfig";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import {
    exportReport,
    getAdminComplaints,
    getAdminTransactions,
    getDashboardAnalytics,
    getPaymentCompletionRate,
    getTotalOrders,
    getTotalRevenue,
    getWithdrawalRequests,
    type AdminComplaintDto,
    type AdminTransactionDto,
    type DashboardAnalyticsDto,
    type WithdrawalRequestDto,
} from "../../lib/api/admin";
import {
    getAccountRequests,
    type AccountRequestListItem,
} from "../../lib/api/accountRequests";
import { formatPercent } from "../../lib/utils/format";

type TimeRange = "Week" | "Month" | "Quarter" | "Year";

type QueueTone = {
    accent: string;
    surface: string;
    text: string;
};

const tone = {
    pageInk: "#141B34",
    muted: "#5B6478",
    line: "#D8DEEA",
    shell: "#FFFFFF",
    soft: "#F7F8FC",
    hero: "linear-gradient(135deg, #172554 0%, #1D4ED8 52%, #38BDF8 100%)",
    violet: "#6D5EF5",
    emerald: "#0F9D7A",
    amber: "#C68508",
    rose: "#D9485F",
    sky: "#2477E4",
};

const queueTones: Record<string, QueueTone> = {
    approvals: { accent: tone.violet, surface: "#F1EDFF", text: "#4935C5" },
    withdrawals: { accent: tone.emerald, surface: "#E8FFF7", text: "#0B7A5E" },
    support: { accent: tone.rose, surface: "#FFF0F3", text: "#B23148" },
    finance: { accent: tone.sky, surface: "#ECF5FF", text: "#175DB8" },
};

function fmtNumber(value?: number) {
    return value?.toLocaleString("vi-VN") ?? "0";
}

function fmtCurrency(value?: number) {
    return `${fmtNumber(value)} ₫`;
}

function fmtDate(value?: string) {
    if (!value) return "—";
    return new Date(value).toLocaleString("vi-VN");
}

function exportLabel(reportType: string) {
    switch (reportType) {
        case "orders":
            return "Đơn hàng";
        case "revenue":
            return "Doanh thu";
        case "users":
            return "Người dùng";
        case "payments":
            return "Thanh toán";
        default:
            return reportType;
    }
}

function DashboardStatCard({
    icon,
    label,
    value,
    detail,
}: {
    icon: ReactNode;
    label: string;
    value: string;
    detail: string;
}) {
    return (
        <article className="rounded-[24px] border px-5 py-5 shadow-soft-lg" style={{ borderColor: tone.line, background: tone.shell }}>
            <div className="flex items-center justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: "#EEF4FF", color: tone.sky }}>
                    {icon}
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.12em]" style={{ color: tone.muted }}>
                    Trực tiếp
                </span>
            </div>
            <p className="mt-4 text-[12px] font-black uppercase tracking-[0.1em]" style={{ color: tone.muted }}>
                {label}
            </p>
            <p className="mt-2 text-[30px] font-black leading-none" style={{ color: tone.pageInk }}>
                {value}
            </p>
            <p className="mt-3 text-[14px] font-semibold leading-6" style={{ color: tone.muted }}>
                {detail}
            </p>
        </article>
    );
}

function QueueCard({
    title,
    count,
    href,
    detail,
    items,
    toneKey,
}: {
    title: string;
    count: string;
    href: string;
    detail: string;
    items: Array<{ title: string; meta: string }>;
    toneKey: keyof typeof queueTones;
}) {
    const palette = queueTones[toneKey];

    return (
        <article className="rounded-[24px] border p-5 shadow-soft-lg" style={{ borderColor: tone.line, background: tone.shell }}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div
                        className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-black uppercase tracking-[0.08em]"
                        style={{ background: palette.surface, color: palette.text }}
                    >
                        {title}
                    </div>
                    <p className="mt-4 text-[28px] font-black leading-none" style={{ color: tone.pageInk }}>
                        {count}
                    </p>
                    <p className="mt-3 max-w-[36ch] text-[14px] font-semibold leading-6" style={{ color: tone.muted }}>
                        {detail}
                    </p>
                </div>
                <div
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border"
                    style={{ borderColor: palette.accent, color: palette.accent, background: palette.surface }}
                >
                    <ArrowRight className="h-5 w-5" />
                </div>
            </div>

            <div className="mt-5 space-y-3">
                {items.length > 0 ? (
                    items.map((item, index) => (
                        <div
                            key={`${item.title}-${index}`}
                            className="rounded-2xl border px-4 py-3"
                            style={{ borderColor: tone.line, background: tone.soft }}
                        >
                            <p className="text-[14px] font-black leading-6" style={{ color: tone.pageInk }}>
                                {item.title}
                            </p>
                            <p className="mt-1 text-[13px] font-semibold leading-5" style={{ color: tone.muted }}>
                                {item.meta}
                            </p>
                        </div>
                    ))
                ) : (
                    <div className="rounded-2xl border px-4 py-4 text-[14px] font-semibold" style={{ borderColor: tone.line, background: tone.soft, color: tone.muted }}>
                        Chưa có mục ưu tiên nào trong nhóm này.
                    </div>
                )}
            </div>

            <Link
                to={href}
                className="mt-5 inline-flex items-center gap-2 text-[14px] font-black transition-opacity hover:opacity-80"
                style={{ color: palette.accent }}
            >
                Mở khu vực xử lý
                <ArrowRight className="h-4 w-4" />
            </Link>
        </article>
    );
}

function ActivityList({
    title,
    items,
    emptyText,
}: {
    title: string;
    items: Array<{ title: string; meta: string; value?: string }>;
    emptyText: string;
}) {
    return (
        <section className="rounded-[24px] border p-5 shadow-soft-lg" style={{ borderColor: tone.line, background: tone.shell }}>
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-[20px] font-black" style={{ color: tone.pageInk }}>
                    {title}
                </h2>
            </div>
            <div className="mt-5 space-y-3">
                {items.length > 0 ? (
                    items.map((item, index) => (
                        <div
                            key={`${item.title}-${index}`}
                            className="flex items-start justify-between gap-4 rounded-2xl border px-4 py-3"
                            style={{ borderColor: tone.line, background: tone.soft }}
                        >
                            <div className="min-w-0">
                                <p className="text-[14px] font-black leading-6" style={{ color: tone.pageInk }}>
                                    {item.title}
                                </p>
                                <p className="mt-1 text-[13px] font-semibold leading-5" style={{ color: tone.muted }}>
                                    {item.meta}
                                </p>
                            </div>
                            {item.value && (
                                <span className="shrink-0 text-[13px] font-black" style={{ color: tone.sky }}>
                                    {item.value}
                                </span>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="rounded-2xl border px-4 py-4 text-[14px] font-semibold" style={{ borderColor: tone.line, background: tone.soft, color: tone.muted }}>
                        {emptyText}
                    </div>
                )}
            </div>
        </section>
    );
}

export const AdminDashboard = (): JSX.Element => {
    const navigate = useNavigate();
    const sidebarConfig = useAdminSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [timeRange, setTimeRange] = useState<TimeRange>("Month");
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState<string | null>(null);

    const [analytics, setAnalytics] = useState<DashboardAnalyticsDto | null>(null);
    const [ordersCount, setOrdersCount] = useState<number | null>(null);
    const [revenueTotal, setRevenueTotal] = useState<number | null>(null);
    const [paymentRate, setPaymentRate] = useState<number | null>(null);
    const [withdrawals, setWithdrawals] = useState<WithdrawalRequestDto[]>([]);
    const [accountRequests, setAccountRequests] = useState<AccountRequestListItem[]>([]);
    const [transactions, setTransactions] = useState<AdminTransactionDto[]>([]);
    const [complaints, setComplaints] = useState<AdminComplaintDto[]>([]);

    useEffect(() => {
        let cancelled = false;

        async function loadDashboard() {
            setLoading(true);
            const results = await Promise.allSettled([
                getDashboardAnalytics(timeRange),
                getTotalOrders(),
                getTotalRevenue(),
                getPaymentCompletionRate(),
                getWithdrawalRequests({ page: 1, pageSize: 4, status: "Pending" }),
                getAccountRequests({ page: 1, pageSize: 4, status: 1 }),
                getAdminTransactions({ page: 1, pageSize: 4 }),
                getAdminComplaints({ page: 1, pageSize: 4, status: "Open" }),
            ]);

            if (cancelled) return;

            const [analyticsRes, ordersRes, revenueRes, paymentRes, withdrawalsRes, requestsRes, transactionsRes, complaintsRes] = results;

            if (analyticsRes.status === "fulfilled") setAnalytics(analyticsRes.value);
            if (ordersRes.status === "fulfilled") setOrdersCount(Number(ordersRes.value?.totalOrders ?? ordersRes.value?.count ?? 0));
            if (revenueRes.status === "fulfilled") setRevenueTotal(Number(revenueRes.value?.totalRevenue ?? revenueRes.value?.amount ?? 0));
            if (paymentRes.status === "fulfilled") setPaymentRate(Number(paymentRes.value?.completionRate ?? 0));
            if (withdrawalsRes.status === "fulfilled") setWithdrawals(withdrawalsRes.value.items ?? []);
            if (requestsRes.status === "fulfilled") setAccountRequests(requestsRes.value.items ?? []);
            if (transactionsRes.status === "fulfilled") setTransactions(transactionsRes.value.items ?? []);
            if (complaintsRes.status === "fulfilled") setComplaints(complaintsRes.value.items ?? []);

            setLoading(false);
        }

        loadDashboard();

        return () => {
            cancelled = true;
        };
    }, [timeRange]);

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    const handleExport = async (reportType: string, format: "CSV" | "EXCEL" | "PDF") => {
        setExporting(`${reportType}:${format}`);
        try {
            const blob = await exportReport(reportType, format);
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = `admin_${reportType}.${format === "EXCEL" ? "xlsx" : format.toLowerCase()}`;
            anchor.click();
            URL.revokeObjectURL(url);
        } finally {
            setExporting(null);
        }
    };

    const queueSummary = useMemo(() => {
        return {
            approvalCount: analytics?.pendingApprovals ?? accountRequests.length,
            withdrawalCount: analytics?.pendingWithdrawals ?? withdrawals.length,
            supportCount: complaints.length,
            financeWatch: transactions.filter((item) => item.status === "Pending" || item.status === "Processing").length,
        };
    }, [analytics, accountRequests.length, complaints.length, transactions, withdrawals.length]);

    const recentActivity = useMemo(() => {
        return (analytics?.recentActivities ?? []).slice(0, 4).map((item) => ({
            title: item.description,
            meta: fmtDate(item.createdAt),
        }));
    }, [analytics]);

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>
                <div className="flex-1 min-w-0">
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
                                    <BreadcrumbPage className="font-bold text-gray-900 text-base">Tổng quan Admin</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </TopNavBar>

                    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8 space-y-6 nb-fade-in">
                        <section
                            className="overflow-hidden rounded-[32px] border px-6 py-6 text-white shadow-soft-lg lg:px-8 lg:py-8"
                            style={{ borderColor: "#2446A6", background: tone.hero }}
                        >
                            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                                <div className="max-w-3xl">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[12px] font-black uppercase tracking-[0.12em] text-white">
                                        Điều hành hệ thống
                                    </div>
                                    <h1 className="mt-4 text-[34px] font-black leading-tight md:text-[46px]">
                                        Theo dõi việc cần xử lý trong toàn hệ thống.
                                    </h1>
                                    <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-white/85 sm:text-base">
                                        Từ đây, Admin xem nhanh yêu cầu cấp tài khoản, rút tiền, hỗ trợ và giao dịch cần chú ý, rồi mở thẳng từng khu vực để xử lý.
                                    </p>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2 xl:w-[380px]">
                                    <div className="rounded-[24px] border border-white/15 bg-white/10 px-4 py-4 backdrop-blur-sm">
                                        <p className="text-[12px] font-black uppercase tracking-[0.1em] text-white/70">Bộ lọc thời gian</p>
                                        <select
                                            value={timeRange}
                                            onChange={(event) => setTimeRange(event.target.value as TimeRange)}
                                            className="mt-3 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-[15px] font-bold text-white outline-none"
                                        >
                                            <option value="Week" style={{ color: tone.pageInk }}>Tuần này</option>
                                            <option value="Month" style={{ color: tone.pageInk }}>Tháng này</option>
                                            <option value="Quarter" style={{ color: tone.pageInk }}>Quý này</option>
                                            <option value="Year" style={{ color: tone.pageInk }}>Năm nay</option>
                                        </select>
                                    </div>
                                    <div className="rounded-[24px] border border-white/15 bg-white/10 px-4 py-4 backdrop-blur-sm">
                                        <p className="text-[12px] font-black uppercase tracking-[0.1em] text-white/70">Mục đang chờ xử lý</p>
                                        <p className="mt-3 text-[34px] font-black leading-none text-white">
                                            {fmtNumber(
                                                queueSummary.approvalCount +
                                                queueSummary.withdrawalCount +
                                                queueSummary.supportCount +
                                                queueSummary.financeWatch,
                                            )}
                                        </p>
                                        <p className="mt-2 text-[14px] font-semibold leading-6 text-white/80">
                                            Gộp từ các hàng chờ tài khoản, payout, hỗ trợ và giao dịch cần theo dõi.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <DashboardStatCard
                                icon={<Users className="h-5 w-5" />}
                                label="Người dùng toàn hệ thống"
                                value={loading ? "…" : fmtNumber(analytics?.totalUsers)}
                                detail={`PH: ${fmtNumber(analytics?.totalParents)} · Trường: ${fmtNumber(analytics?.totalSchools)} · NCC: ${fmtNumber(analytics?.totalProviders)}`}
                            />
                            <DashboardStatCard
                                icon={<FolderClock className="h-5 w-5" />}
                                label="Đơn hàng cần theo dõi"
                                value={loading ? "…" : fmtNumber(ordersCount ?? analytics?.totalOrders ?? 0)}
                                detail="Theo dõi khối lượng đơn hiện có để cân đối hàng chờ vận hành và thanh toán."
                            />
                            <DashboardStatCard
                                icon={<TrendingUp className="h-5 w-5" />}
                                label="Doanh thu ghi nhận"
                                value={loading ? "…" : fmtCurrency(revenueTotal ?? analytics?.totalRevenue ?? 0)}
                                detail="Tổng doanh thu dùng để đọc nhanh sức khỏe hệ thống và đối chiếu payout."
                            />
                            <DashboardStatCard
                                icon={<CreditCard className="h-5 w-5" />}
                                label="Tỷ lệ hoàn tất thanh toán"
                                value={loading ? "…" : formatPercent(paymentRate, { maximumFractionDigits: 2 })}
                                detail="Chỉ số này hỗ trợ phát hiện sớm rủi ro checkout, giao dịch treo hoặc lỗi cổng thanh toán."
                            />
                        </section>

                        <section>
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-[24px] font-black" style={{ color: tone.pageInk }}>
                                        Hàng chờ ưu tiên
                                    </h2>
                                    <p className="mt-1 text-[15px] font-semibold" style={{ color: tone.muted }}>
                                        Mỗi thẻ là một vùng công việc cần Admin đưa ra quyết định nhanh.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 grid gap-4 xl:grid-cols-2 2xl:grid-cols-4">
                                <QueueCard
                                    title="Cấp tài khoản"
                                    count={fmtNumber(queueSummary.approvalCount)}
                                    href="/admin/account-requests"
                                    detail="Ưu tiên duyệt các yêu cầu chờ xử lý từ trường học và nhà cung cấp."
                                    toneKey="approvals"
                                    items={accountRequests.map((item) => ({
                                        title: item.organizationName,
                                        meta: `${item.contactEmail} · ${fmtDate(item.createdAt)}`,
                                    }))}
                                />
                                <QueueCard
                                    title="Rút tiền"
                                    count={fmtNumber(queueSummary.withdrawalCount)}
                                    href="/admin/withdrawals"
                                    detail="Kiểm tra các payout chờ duyệt để tránh tồn đọng và chậm thanh toán."
                                    toneKey="withdrawals"
                                    items={withdrawals.map((item) => ({
                                        title: item.schoolName || "Yêu cầu rút tiền",
                                        meta: `${fmtCurrency(item.amount)} · ${item.bankName || "Chưa có ngân hàng"}`,
                                    }))}
                                />
                                <QueueCard
                                    title="Hỗ trợ"
                                    count={fmtNumber(queueSummary.supportCount)}
                                    href="/admin/complaints"
                                    detail="Can thiệp các khiếu nại đang mở trước khi chúng trở thành điểm nghẽn vận hành."
                                    toneKey="support"
                                    items={complaints.map((item) => ({
                                        title: item.title,
                                        meta: `${item.schoolName} · ${fmtDate(item.createdAt)}`,
                                    }))}
                                />
                                <QueueCard
                                    title="Tài chính"
                                    count={fmtNumber(queueSummary.financeWatch)}
                                    href="/admin/transactions"
                                    detail="Theo dõi giao dịch đang pending hoặc processing để khoanh vùng bất thường."
                                    toneKey="finance"
                                    items={transactions
                                        .filter((item) => item.status === "Pending" || item.status === "Processing")
                                        .map((item) => ({
                                            title: item.orderCode ? `Đơn ${item.orderCode}` : item.transactionType,
                                            meta: `${item.status} · ${fmtDate(item.createdAt)}`,
                                        }))}
                                />
                            </div>
                        </section>

                        <section className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
                            <ActivityList
                                title="Hoạt động gần đây"
                                emptyText="Chưa có hoạt động gần đây từ analytics."
                                items={recentActivity}
                            />

                            <section className="rounded-[24px] border p-5 shadow-soft-lg" style={{ borderColor: tone.line, background: tone.shell }}>
                                <h2 className="text-[20px] font-black" style={{ color: tone.pageInk }}>
                                    Xuất báo cáo nhanh
                                </h2>
                                <p className="mt-2 text-[14px] font-semibold leading-6" style={{ color: tone.muted }}>
                                    Giữ chức năng export, nhưng đặt sau vùng điều phối để Admin dùng khi cần đối soát hoặc báo cáo.
                                </p>

                                <div className="mt-5 space-y-3">
                                    {["orders", "revenue", "users", "payments"].map((reportType) => (
                                        <div
                                            key={reportType}
                                            className="rounded-2xl border px-4 py-4"
                                            style={{ borderColor: tone.line, background: tone.soft }}
                                        >
                                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                <div>
                                                    <p className="text-[15px] font-black" style={{ color: tone.pageInk }}>
                                                        {exportLabel(reportType)}
                                                    </p>
                                                    <p className="mt-1 text-[13px] font-semibold" style={{ color: tone.muted }}>
                                                        Xuất nhanh bản CSV, Excel hoặc PDF cho vùng dữ liệu này.
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {(["CSV", "EXCEL", "PDF"] as const).map((format) => {
                                                        const key = `${reportType}:${format}`;
                                                        return (
                                                            <button
                                                                key={format}
                                                                onClick={() => handleExport(reportType, format)}
                                                                disabled={exporting === key}
                                                                className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[13px] font-black transition-all disabled:opacity-50"
                                                                style={{ borderColor: tone.line, background: "#fff", color: tone.pageInk }}
                                                            >
                                                                <Download className="h-4 w-4" />
                                                                {exporting === key ? "Đang xuất..." : format}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </section>

                        <section className="grid gap-4 xl:grid-cols-3">
                            <ActivityList
                                title="Giao dịch mới"
                                emptyText="Chưa có giao dịch mới để hiển thị."
                                items={transactions.map((item) => ({
                                    title: item.orderCode ? `Đơn ${item.orderCode}` : item.transactionType,
                                    meta: `${item.status} · ${fmtDate(item.createdAt)}`,
                                    value: fmtCurrency(item.amount),
                                }))}
                            />
                            <ActivityList
                                title="Rút tiền chờ duyệt"
                                emptyText="Không có yêu cầu rút tiền chờ duyệt."
                                items={withdrawals.map((item) => ({
                                    title: item.schoolName || "Yêu cầu rút tiền",
                                    meta: `${item.bankName || "Chưa có ngân hàng"} · ${fmtDate(item.requestedAt)}`,
                                    value: fmtCurrency(item.amount),
                                }))}
                            />
                            <ActivityList
                                title="Vùng rủi ro hỗ trợ"
                                emptyText="Không có khiếu nại mở trong thời điểm này."
                                items={complaints.map((item) => ({
                                    title: item.title,
                                    meta: `${item.schoolName} · ${item.providerName || "Chưa có NCC"} · ${fmtDate(item.createdAt)}`,
                                }))}
                            />
                        </section>

                        <section className="rounded-[24px] border p-5 shadow-soft-lg" style={{ borderColor: tone.line, background: tone.shell }}>
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <h2 className="text-[20px] font-black" style={{ color: tone.pageInk }}>
                                        Lối tắt điều phối
                                    </h2>
                                    <p className="mt-2 text-[14px] font-semibold leading-6" style={{ color: tone.muted }}>
                                        Truy cập thẳng các khu vực Admin cần dùng nhiều nhất trong ca xử lý.
                                    </p>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                    {[
                                        {
                                            href: "/admin/account-requests",
                                            icon: <FolderClock className="h-4 w-4" />,
                                            label: "Xử lý cấp tài khoản",
                                        },
                                        {
                                            href: "/admin/withdrawals",
                                            icon: <Wallet className="h-4 w-4" />,
                                            label: "Duyệt rút tiền",
                                        },
                                        {
                                            href: "/admin/transactions",
                                            icon: <CreditCard className="h-4 w-4" />,
                                            label: "Theo dõi giao dịch",
                                        },
                                        {
                                            href: "/admin/complaints",
                                            icon: <AlertTriangle className="h-4 w-4" />,
                                            label: "Can thiệp hỗ trợ",
                                        },
                                    ].map((item) => (
                                        <Link
                                            key={item.href}
                                            to={item.href}
                                            className="inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-[14px] font-black transition-all hover:-translate-y-px"
                                            style={{ borderColor: tone.line, background: tone.soft, color: tone.pageInk }}
                                        >
                                            {item.icon}
                                            {item.label}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {!loading && analytics && (
                            <section className="rounded-[24px] border p-5 shadow-soft-lg" style={{ borderColor: tone.line, background: tone.shell }}>
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={{ background: "#E8FFF7", color: tone.emerald }}>
                                        <CheckCircle2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-[18px] font-black" style={{ color: tone.pageInk }}>
                                            Tóm tắt điều hành
                                        </h2>
                                        <p className="mt-2 text-[14px] font-semibold leading-7" style={{ color: tone.muted }}>
                                            Hệ thống hiện có {fmtNumber(analytics.totalUsers)} tài khoản, {fmtNumber(ordersCount ?? analytics.totalOrders)} đơn hàng và {fmtCurrency(revenueTotal ?? analytics.totalRevenue)} doanh thu ghi nhận. Trọng tâm xử lý hiện tại là {fmtNumber(queueSummary.approvalCount)} yêu cầu cấp tài khoản, {fmtNumber(queueSummary.withdrawalCount)} payout chờ duyệt và {fmtNumber(queueSummary.supportCount)} yêu cầu hỗ trợ mở.
                                        </p>
                                    </div>
                                </div>
                            </section>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
