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

/* ── Analytics Card (Neubrutalism) ── */
function StatCard({ icon, label, value, sub, primary }: { icon: string; label: string; value: string; sub?: string; primary?: boolean }) {
 return (
 <div className={`nb-stat-card ${primary ? "nb-stat-primary" : ""}`}>
 <div className="flex items-center gap-2 mb-2">
 <span className="text-2xl">{icon}</span>
 <span className="nb-stat-label">{label}</span>
 </div>
 <p className="nb-stat-value">{value}</p>
 {sub && <p className=" font-medium text-xs text-[#6B7280] mt-1">{sub}</p>}
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
 <div className="nb-page flex flex-col">
 <div className="flex flex-1 flex-col lg:flex-row">
 <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
 <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
 </div>
 <div className="flex-1 flex flex-col min-w-0">
 <div className="nb-breadcrumb-bar">
 <Breadcrumb><BreadcrumbList>
 <BreadcrumbItem><BreadcrumbLink href="/admin/dashboard" className=" font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
 <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
 <BreadcrumbItem><BreadcrumbPage className=" font-bold text-[#1A1A2E] text-base">Tổng quan</BreadcrumbPage></BreadcrumbItem>
 </BreadcrumbList></Breadcrumb>
 </div>
 <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-8 nb-fade-in">

 {/* ── ANALYTICS SECTION ── */}
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <h1 className="nb-section-title">📊 Tổng quan hệ thống</h1>
 <select value={timeRange} onChange={e => setTimeRange(e.target.value)}
 className="nb-select">
 <option value="Week">Tuần này</option>
 <option value="Month">Tháng này</option>
 <option value="Quarter">Quý này</option>
 <option value="Year">Năm nay</option>
 </select>
 </div>

 {analyticsLoading ? (
 <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
 {Array.from({ length: 6 }).map((_, i) => (
 <div key={i} className="nb-skeleton p-5 h-[100px]" />
 ))}
 </div>
 ) : (
 <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 nb-stagger">
 <StatCard icon="👥" label="Người dùng" value={fmt(analytics?.totalUsers)} sub={`${fmt(analytics?.totalParents)} PH · ${fmt(analytics?.totalSchools)} Trường · ${fmt(analytics?.totalProviders)} NCC`} primary />
 <StatCard icon="📦" label="Tổng đơn hàng" value={fmt(ordersCount?.totalOrders ?? analytics?.totalOrders)} />
 <StatCard icon="💰" label="Tổng doanh thu" value={`${fmt(revenueData?.totalRevenue ?? analytics?.totalRevenue)} ₫`} primary />
 <StatCard icon="💳" label="Tỷ lệ thanh toán" value={`${paymentRate?.completionRate ?? "—"}%`} sub="Đã thanh toán / Tổng đơn" />
 <StatCard icon="⏳" label="Chờ duyệt" value={fmt(analytics?.pendingApprovals)} sub="Tài khoản cần xác minh" />
 <StatCard icon="🏦" label="Chờ rút tiền" value={fmt(analytics?.pendingWithdrawals)} sub="Yêu cầu chưa xử lý" />
 </div>
 )}
 </div>

 {/* ── REPORTS SECTION ── */}
 <div className="space-y-4">
 <h2 className="nb-section-title text-xl">📋 Báo cáo chi tiết</h2>

 {/* Tab Switcher */}
 <div className="nb-tabs w-fit">
 {REPORT_TABS.map(t => (
 <button key={t.key} onClick={() => setActiveTab(t.key)}
 className={`nb-tab ${activeTab === t.key ? "nb-tab-active" : ""}`}>
 {t.icon} {t.label}
 </button>
 ))}
 </div>

 {/* Filters + Export */}
 <div className="flex flex-wrap gap-3 items-center">
 <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
 className="nb-input" />
 <span className="text-[#9CA3AF] text-sm font-bold">→</span>
 <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
 className="nb-input" />
 <div className="ml-auto flex gap-2">
 <button onClick={() => handleExport("CSV")} disabled={exporting} className="nb-btn nb-btn-sm nb-btn-outline disabled:opacity-50">📄 CSV</button>
 <button onClick={() => handleExport("EXCEL")} disabled={exporting} className="nb-btn nb-btn-sm nb-btn-outline disabled:opacity-50">📊 Excel</button>
 <button onClick={() => handleExport("PDF")} disabled={exporting} className="nb-btn nb-btn-sm nb-btn-outline disabled:opacity-50">📕 PDF</button>
 </div>
 </div>

 {/* Report Table */}
 <div className="nb-card-static overflow-hidden">
 {reportLoading ? (
 <div className="p-8 text-center text-[#9CA3AF] font-semibold">Đang tải báo cáo...</div>
 ) : !reportData?.data?.length ? (
 <div className="p-12 text-center text-[#9CA3AF] font-semibold">Không có dữ liệu báo cáo</div>
 ) : (
 <div className="overflow-x-auto">
 <table className="nb-table">
 <thead><tr>
 {Object.keys(reportData.data[0]).map((k: string) => (
 <th key={k}>{k}</th>
 ))}
 </tr></thead>
 <tbody>{reportData.data.slice(0, 25).map((row: Record<string, any>, i: number) => (
 <tr key={i}>
 {Object.values(row).map((v, j) => <td key={j}>{String(v)}</td>)}
 </tr>
 ))}</tbody>
 </table>
 </div>
 )}
 {reportData?.summary && (
 <div className="px-5 py-3 bg-[#EDE9FE] border-t-2 border-[#1A1A2E] flex gap-6 text-xs ">
 {Object.entries(reportData.summary).map(([k, v]) => (
 <span key={k} className="text-[#4C5769]"><span className="font-bold">{k}:</span> {String(v)}</span>
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
