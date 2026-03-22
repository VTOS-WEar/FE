import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { DashboardSidebar } from "../../components/layout";
import { useAdminSidebarConfig } from "../../hooks/useAdminSidebarConfig";
import {
    getDashboardAnalytics, getTotalOrders, getTotalRevenue,
    getPaymentCompletionRate, viewReport, exportReport,
    type DashboardAnalyticsDto,
} from "../../lib/api/admin";

/* ── Analytics Card ── */
function StatCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub?: string; color: string }) {
    return (
        <div className="bg-white border border-[#CBCAD7] rounded-2xl p-5 flex flex-col gap-2 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2">
                <span className="text-2xl">{icon}</span>
                <span className="text-xs font-semibold text-[#6B7280] uppercase [font-family:'Montserrat',Helvetica]">{label}</span>
            </div>
            <p className={`text-2xl font-bold [font-family:'Montserrat',Helvetica] ${color}`}>{value}</p>
            {sub && <p className="text-xs text-[#9CA3AF] [font-family:'Montserrat',Helvetica]">{sub}</p>}
        </div>
    );
}

/* ── Report Tab ── */
const REPORT_TABS = [
    { key: "orders", label: "Đơn hàng", icon: "📦" },
    { key: "revenue", label: "Doanh thu", icon: "💰" },
    { key: "users", label: "Người dùng", icon: "👤" },
    { key: "payments", label: "Thanh toán", icon: "💳" },
] as const;

export const AdminDashboard = (): JSX.Element => {
    const navigate = useNavigate();
    const sidebarConfig = useAdminSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();

    // Analytics
    const [analytics, setAnalytics] = useState<DashboardAnalyticsDto | null>(null);
    const [ordersCount, setOrdersCount] = useState<any>(null);
    const [revenueData, setRevenueData] = useState<any>(null);
    const [paymentRate, setPaymentRate] = useState<any>(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState("Month");

    // Reports
    const [activeTab, setActiveTab] = useState<string>("orders");
    const [reportData, setReportData] = useState<any>(null);
    const [reportLoading, setReportLoading] = useState(false);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [exporting, setExporting] = useState(false);

    const fetchAnalytics = useCallback(async () => {
        setAnalyticsLoading(true);
        try {
            const [a, o, r, p] = await Promise.allSettled([
                getDashboardAnalytics(timeRange),
                getTotalOrders(), getTotalRevenue(), getPaymentCompletionRate(),
            ]);
            if (a.status === "fulfilled") setAnalytics(a.value);
            if (o.status === "fulfilled") setOrdersCount(o.value);
            if (r.status === "fulfilled") setRevenueData(r.value);
            if (p.status === "fulfilled") setPaymentRate(p.value);
        } catch { /* */ }
        finally { setAnalyticsLoading(false); }
    }, [timeRange]);

    useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

    const fetchReport = useCallback(async () => {
        setReportLoading(true);
        try { setReportData(await viewReport(activeTab, dateFrom || undefined, dateTo || undefined)); } catch { setReportData(null); }
        finally { setReportLoading(false); }
    }, [activeTab, dateFrom, dateTo]);

    useEffect(() => { fetchReport(); }, [fetchReport]);

    const handleExport = async (format: string) => {
        setExporting(true);
        try {
            const blob = await exportReport(activeTab, format, dateFrom || undefined, dateTo || undefined);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url; a.download = `report_${activeTab}.${format === "EXCEL" ? "xlsx" : format.toLowerCase()}`; a.click();
            URL.revokeObjectURL(url);
        } catch { /* */ }
        finally { setExporting(false); }
    };

    const handleLogout = () => {
        localStorage.removeItem("access_token"); localStorage.removeItem("user"); localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token"); sessionStorage.removeItem("user"); sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    const fmt = (n?: number) => n?.toLocaleString("vi") ?? "—";

    return (
        <div className="bg-[#f6f7f8] w-full min-h-screen flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[20rem] xl:w-[23.75rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="bg-white border-b border-[#cbcad7] px-6 lg:px-10 py-5">
                        <Breadcrumb><BreadcrumbList>
                            <BreadcrumbItem><BreadcrumbLink href="/admin/dashboard" className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                            <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                            <BreadcrumbItem><BreadcrumbPage className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4c5769] text-base">Tổng quan</BreadcrumbPage></BreadcrumbItem>
                        </BreadcrumbList></Breadcrumb>
                    </div>
                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-8">

                        {/* ── ANALYTICS SECTION ── */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h1 className="[font-family:'Montserrat',Helvetica] font-bold text-black text-[28px]">📊 Tổng quan hệ thống</h1>
                                <select value={timeRange} onChange={e => setTimeRange(e.target.value)}
                                    className="border border-[#CBCAD7] rounded-xl px-4 py-2 text-sm [font-family:'Montserrat',Helvetica] focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30">
                                    <option value="Week">Tuần này</option>
                                    <option value="Month">Tháng này</option>
                                    <option value="Quarter">Quý này</option>
                                    <option value="Year">Năm nay</option>
                                </select>
                            </div>

                            {analyticsLoading ? (
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div key={i} className="bg-white border border-[#CBCAD7] rounded-2xl p-5 animate-pulse">
                                            <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
                                            <div className="h-8 bg-gray-200 rounded w-20" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                    <StatCard icon="👥" label="Người dùng" value={fmt(analytics?.totalUsers)} sub={`${fmt(analytics?.totalParents)} PH · ${fmt(analytics?.totalSchools)} Trường · ${fmt(analytics?.totalProviders)} Nhà Cung Cấp`} color="text-[#1A1A2E]" />
                                    <StatCard icon="📦" label="Tổng đơn hàng" value={fmt(ordersCount?.totalOrders ?? analytics?.totalOrders)} color="text-[#4338CA]" />
                                    <StatCard icon="💰" label="Tổng doanh thu" value={`${fmt(revenueData?.totalRevenue ?? analytics?.totalRevenue)} ₫`} color="text-[#059669]" />
                                    <StatCard icon="💳" label="Tỷ lệ thanh toán" value={`${paymentRate?.completionRate ?? "—"}%`} sub="Đã thanh toán / Tổng đơn" color="text-[#6366F1]" />
                                    <StatCard icon="⏳" label="Chờ duyệt" value={fmt(analytics?.pendingApprovals)} sub="Tài khoản cần xác minh" color="text-[#D97706]" />
                                    <StatCard icon="🏦" label="Chờ rút tiền" value={fmt(analytics?.pendingWithdrawals)} sub="Yêu cầu chưa xử lý" color="text-[#DC2626]" />
                                </div>
                            )}
                        </div>

                        {/* ── REPORTS SECTION ── */}
                        <div className="space-y-4">
                            <h2 className="[font-family:'Montserrat',Helvetica] font-bold text-black text-xl">📋 Báo cáo chi tiết</h2>

                            {/* Tab Switcher */}
                            <div className="flex gap-1 bg-white border border-[#CBCAD7] rounded-xl p-1 w-fit">
                                {REPORT_TABS.map(t => (
                                    <button key={t.key} onClick={() => setActiveTab(t.key)}
                                        className={`px-4 py-2 rounded-lg text-sm font-semibold [font-family:'Montserrat',Helvetica] transition-colors ${
                                            activeTab === t.key ? "bg-[#6366F1] text-white" : "text-[#6B7280] hover:bg-gray-100"
                                        }`}>
                                        {t.icon} {t.label}
                                    </button>
                                ))}
                            </div>

                            {/* Filters + Export */}
                            <div className="flex flex-wrap gap-3 items-center">
                                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                                    className="border border-[#CBCAD7] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30" />
                                <span className="text-[#9CA3AF] text-sm">→</span>
                                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                                    className="border border-[#CBCAD7] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30" />
                                <div className="ml-auto flex gap-2">
                                    <button onClick={() => handleExport("CSV")} disabled={exporting} className="border border-[#CBCAD7] px-3 py-2 rounded-xl text-xs font-semibold hover:bg-gray-50 disabled:opacity-50">📄 CSV</button>
                                    <button onClick={() => handleExport("EXCEL")} disabled={exporting} className="border border-[#CBCAD7] px-3 py-2 rounded-xl text-xs font-semibold hover:bg-gray-50 disabled:opacity-50">📊 Excel</button>
                                    <button onClick={() => handleExport("PDF")} disabled={exporting} className="border border-[#CBCAD7] px-3 py-2 rounded-xl text-xs font-semibold hover:bg-gray-50 disabled:opacity-50">📕 PDF</button>
                                </div>
                            </div>

                            {/* Report Table */}
                            <div className="bg-white border border-[#CBCAD7] rounded-2xl overflow-hidden">
                                {reportLoading ? (
                                    <div className="p-8 text-center text-[#9CA3AF] [font-family:'Montserrat',Helvetica]">Đang tải báo cáo...</div>
                                ) : !reportData?.data?.length ? (
                                    <div className="p-12 text-center text-[#9CA3AF] [font-family:'Montserrat',Helvetica]">Không có dữ liệu báo cáo</div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm [font-family:'Montserrat',Helvetica]">
                                            <thead><tr className="bg-[#F9FAFB] border-b border-[#CBCAD7]">
                                                {Object.keys(reportData.data[0]).map((k: string) => (
                                                    <th key={k} className="text-left px-5 py-3 font-semibold text-[#6B7280] text-xs uppercase">{k}</th>
                                                ))}
                                            </tr></thead>
                                            <tbody>{reportData.data.slice(0, 25).map((row: Record<string, any>, i: number) => (
                                                <tr key={i} className="border-b border-gray-100 hover:bg-[#F9FAFB]">
                                                    {Object.values(row).map((v, j) => <td key={j} className="px-5 py-3 text-[#1A1A2E]">{String(v)}</td>)}
                                                </tr>
                                            ))}</tbody>
                                        </table>
                                    </div>
                                )}
                                {reportData?.summary && (
                                    <div className="px-5 py-3 bg-[#F9FAFB] border-t border-[#CBCAD7] flex gap-6 text-xs [font-family:'Montserrat',Helvetica]">
                                        {Object.entries(reportData.summary).map(([k, v]) => (
                                            <span key={k} className="text-[#6B7280]"><span className="font-semibold">{k}:</span> {String(v)}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                    </main>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
