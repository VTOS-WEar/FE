import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useState, useEffect, useCallback } from "react";
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
import { useSidebarConfig } from "../../hooks/useSidebarConfig";
import {
 getSchoolProfile,
 getCampaigns,
 getCampaignProgress,
 type CampaignListItemDto,
 type CampaignProgressDto,
} from "../../lib/api/schools";

/* ── Inline countdown for a single campaign ── */
function CampaignCountdownCard({
 campaign,
 onNavigate,
}: {
 campaign: CampaignListItemDto;
 onNavigate: (id: string) => void;
}) {
 const endDate = new Date(campaign.endDate);
 const timeLeft = useCountdown(endDate);
 const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
 const isNearEnd = daysLeft <= 7 && daysLeft > 0;

 return (
 <div className="nb-card-static p-6">
 <div className="flex items-start justify-between mb-4">
 <div>
 <h2 className=" font-bold text-[#1A1A2E] text-lg">
 {campaign.campaignName}
 </h2>
 <p className=" font-medium text-[#6B7280] text-sm mt-0.5">
 Kết thúc vào ngày {formatDate(campaign.endDate)}
 </p>
 </div>
 <button
 onClick={() => onNavigate(campaign.campaignId)}
 className="nb-btn nb-btn-purple text-sm"
 >
 Quản lý
 </button>
 </div>

 {/* Countdown + Warning side-by-side */}
 <div className="flex items-start gap-6">
 {/* Countdown timer */}
 <div className="flex-shrink-0">
 <p className=" font-bold text-[#6B7280] text-xs tracking-wider uppercase mb-3">
 Thời gian còn lại
 </p>
 <div className="flex items-center gap-2">
 {[
 { val: String(timeLeft.days).padStart(2, "0"), label: "Ngày" },
 { val: String(timeLeft.hours).padStart(2, "0"), label: "Giờ" },
 { val: String(timeLeft.minutes).padStart(2, "0"), label: "Phút" },
 { val: String(timeLeft.seconds).padStart(2, "0"), label: "Giây" },
 ].map((unit, i) => (
 <div key={unit.label} className="flex items-center gap-2">
 {i > 0 && <span className=" font-bold text-[#1A1A2E] text-2xl animate-pulse">:</span>}
 <div className="text-center">
 <div className="nb-countdown-box">
 <span className="nb-countdown-value">
 {unit.val}
 </span>
 </div>
 <p className="nb-countdown-label">{unit.label}</p>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Warning Alert — compact, right side */}
 {isNearEnd && (
 <div className="flex-1 nb-alert nb-alert-warning self-center">
 <div className="w-6 h-6 rounded-full bg-[#F59E0B] flex items-center justify-center flex-shrink-0 mt-px border-2 border-[#1A1A2E]">
 <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" /></svg>
 </div>
 <div>
 <p className=" font-bold text-[#92400E] text-xs leading-tight">Sắp kết thúc</p>
 <p className=" font-medium text-[#92400E] text-[10px] mt-0.5 leading-snug">
 Vui lòng nhắc nhở học sinh chưa hoàn tất đăng ký size trước thời hạn đóng cổng.
 </p>
 <button className=" font-bold text-[#EA580C] text-[10px] mt-1 hover:text-[#C2410C] transition-colors">
 Gửi thông báo ngay
 </button>
 </div>
 </div>
 )}
 </div>
 </div>
 );
}

/* ── Countdown hook ── */
function useCountdown(targetDate: Date | null) {
 const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

 useEffect(() => {
 if (!targetDate) return;
 const tick = () => {
 const now = new Date().getTime();
 const diff = Math.max(0, targetDate.getTime() - now);
 setTimeLeft({
 days: Math.floor(diff / (1000 * 60 * 60 * 24)),
 hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
 minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
 seconds: Math.floor((diff % (1000 * 60)) / 1000),
 });
 };
 tick();
 const interval = setInterval(tick, 1000);
 return () => clearInterval(interval);
 }, [targetDate]);

 return timeLeft;
}

/* ── Helpers ── */
function formatNumber(n: number): string {
 if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} triệu`;
 if (n >= 1_000) return n.toLocaleString("vi-VN");
 return String(n);
}

function formatDate(iso: string) {
 return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/* ── Stats Card (Neubrutalism) ── */
function StatsCard({
 icon,
 iconBg,
 label,
 value,
 indicator,
 indicatorType = "neutral",
 progressValue,
 progressMax,
 onClick,
 tint,
}: {
 icon: React.ReactNode;
 iconBg: string;
 label: string;
 value: string;
 indicator?: string;
 indicatorType?: "positive" | "negative" | "neutral";
 progressValue?: number;
 progressMax?: number;
 onClick?: () => void;
 tint?: string;
}) {
 const indicatorColor =
 indicatorType === "positive" ? "text-[#10B981]"
 : indicatorType === "negative" ? "text-[#EF4444]"
 : "text-[#6B7280]";

 return (
 <div
 className={`nb-stat-card ${tint || ""}`}
 style={{ cursor: onClick ? "pointer" : undefined }}
 onClick={onClick}
 >
 <div className="flex items-start justify-between mb-3">
 <p className="nb-stat-label">{label}</p>
 <div className={`nb-stat-icon ${iconBg}`}>
 {icon}
 </div>
 </div>
 <p className="nb-stat-value">
 {value}
 </p>
 {progressValue != null && progressMax != null && (
 <div className="mt-2">
 <div className="nb-progress">
 <div
 className="nb-progress-bar bg-[#3B82F6]"
 style={{ width: `${Math.min(100, (progressValue / progressMax) * 100)}%` }}
 />
 </div>
 </div>
 )}
 {indicator && (
 <p className={` font-medium text-xs mt-1.5 ${indicatorColor}`}>
 {indicatorType === "positive" && (
 <svg className="w-3.5 h-3.5 inline mr-0.5 -mt-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14l5-5 5 5z" /></svg>
 )}
 {indicatorType === "negative" && (
 <svg className="w-3.5 h-3.5 inline mr-0.5 -mt-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z" /></svg>
 )}
 {indicator}
 </p>
 )}
 </div>
 );
}

/* ── Product Category Progress ── */
function CategoryBar({ name, percentage, color }: { name: string; percentage: number; color: string }) {
 return (
 <div className="flex items-center gap-3">
 <div className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 border-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E] ${color}`}>
 <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M18.85 10.39l-6.27-8.39c-.31-.44-.96-.44-1.27 0l-6.27 8.39A1 1 0 005.85 12h4.15v9c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-9h4.15a1 1 0 00.7-1.61z" /></svg>
 </div>
 <div className="flex-1">
 <div className="flex items-center justify-between mb-1">
 <span className=" font-semibold text-[#4C5769] text-sm">{name}</span>
 <span className=" font-bold text-[#1A1A2E] text-sm">{percentage}%</span>
 </div>
 <div className="nb-progress">
 <div
 className={`nb-progress-bar ${color}`}
 style={{ width: `${percentage}%` }}
 />
 </div>
 </div>
 </div>
 );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Main Page */
/* ────────────────────────────────────────────────────────────────────── */
export const SchoolDashboard = (): JSX.Element => {
 const navigate = useNavigate();
 const sidebarConfig = useSidebarConfig();
 const [isCollapsed, toggle] = useSidebarCollapsed();
 const [schoolName, setSchoolName] = useState("");

 // Data
 const [activeCampaigns, setActiveCampaigns] = useState<CampaignListItemDto[]>([]);
 const [loading, setLoading] = useState(true);
 const [totalOrders, setTotalOrders] = useState(0);
 const [totalStudents, setTotalStudents] = useState(0);
 const [expectedRevenue, setExpectedRevenue] = useState(0);
 const [pendingOrders, setPendingOrders] = useState(0);
 const [totalChildProfiles, setTotalChildProfiles] = useState(0);
 const [productCategories, setProductCategories] = useState<{ name: string; percentage: number }[]>([]);

 const primaryCampaign = activeCampaigns.length > 0 ? activeCampaigns[0] : null;

 // Load data
 const fetchData = useCallback(async () => {
 setLoading(true);
 try {
 const [profile, campaignsRes] = await Promise.all([
 getSchoolProfile(),
 getCampaigns(1, 50),
 ]);

 setSchoolName(profile.schoolName || "");
 if (profile.schoolName) localStorage.setItem("vtos_org_name", profile.schoolName);

 const campaigns = campaignsRes.items || [];
 const actives = campaigns.filter((c) => c.status === "Active");
 setActiveCampaigns(actives);

 let orders = 0;
 campaigns.forEach((c) => {
 orders += c.orderCount || 0;
 });
 setTotalOrders(orders);

 if (actives.length > 0) {
 try {
 let aggOrders = 0, aggStudents = 0, aggRevenue = 0, aggPending = 0, aggChildProfiles = 0;
 const allBreakdowns: { outfitName: string; quantityOrdered: number }[] = [];

 const progressResults = await Promise.allSettled(
 actives.map((c) => getCampaignProgress(c.campaignId))
 );

 progressResults.forEach((result) => {
 if (result.status === "fulfilled") {
 const progress = result.value as CampaignProgressDto;
 aggOrders += progress.totalOrders || 0;
 aggStudents += progress.totalStudents || 0;
 aggRevenue += progress.totalRevenue || 0;
 aggPending += progress.pendingOrders || 0;
 aggChildProfiles = Math.max(aggChildProfiles, progress.totalChildProfiles || 0);
 if (progress.outfitBreakdown) {
 progress.outfitBreakdown.forEach((o) => {
 allBreakdowns.push({ outfitName: o.outfitName, quantityOrdered: o.quantityOrdered || 0 });
 });
 }
 }
 });

 setTotalOrders(aggOrders);
 setTotalStudents(aggStudents);
 setExpectedRevenue(aggRevenue);
 setPendingOrders(aggPending);
 setTotalChildProfiles(aggChildProfiles);

 if (allBreakdowns.length > 0) {
 const totalQty = allBreakdowns.reduce((s, o) => s + o.quantityOrdered, 0);
 setProductCategories(
 allBreakdowns.map((o) => ({
 name: o.outfitName || "Khác",
 percentage: totalQty > 0 ? Math.round((o.quantityOrdered / totalQty) * 100) : 0,
 }))
 );
 }
 } catch {
 // Progress API might not be available yet
 }
 }

 } catch {
 // Fallback
 } finally {
 setLoading(false);
 }
 }, []);

 useEffect(() => { fetchData(); }, [fetchData]);

 const handleLogout = () => {
 localStorage.removeItem("access_token"); localStorage.removeItem("user"); localStorage.removeItem("expires_in");
 sessionStorage.removeItem("access_token"); sessionStorage.removeItem("user"); sessionStorage.removeItem("expires_in");
 navigate("/signin", { replace: true });
 };

 const daysUntilEnd = primaryCampaign
 ? Math.ceil((new Date(primaryCampaign.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
 : 0;
 const isNearEnd = daysUntilEnd <= 7 && daysUntilEnd > 0;
 void isNearEnd;

 return (
 <div className="nb-page flex flex-col">
 <div className="flex flex-1 flex-col lg:flex-row">
 {/* Sidebar */}
 <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
 <DashboardSidebar {...sidebarConfig} name={schoolName} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
 </div>

 <div className="flex-1 flex flex-col min-w-0">
 {/* Breadcrumb */}
 <div className="nb-breadcrumb-bar">
 <Breadcrumb>
 <BreadcrumbList>
 <BreadcrumbItem><BreadcrumbLink href="/school/dashboard" className=" font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
 <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
 <BreadcrumbItem><BreadcrumbPage className=" font-bold text-[#1A1A2E] text-base">Tổng quan</BreadcrumbPage></BreadcrumbItem>
 </BreadcrumbList>
 </Breadcrumb>
 <div className="flex items-center gap-3">
 <button className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-[#1A1A2E] bg-white hover:bg-[#FFF5EB] shadow-[2px_2px_0_#1A1A2E] transition-all">
 <svg className="w-5 h-5 text-[#1A1A2E]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 002 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.93 6 11v5l-2 2v1h16v-1l-2-2z" /></svg>
 </button>
 <div className="w-9 h-9 rounded-full bg-[#6938EF] flex items-center justify-center cursor-pointer border-2 border-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E] hover:shadow-[3px_3px_0_#1A1A2E] transition-all">
 <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
 </div>
 </div>
 </div>

 {/* Content */}
 <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6">
 {/* Greeting */}
 <div>
 <h1 className=" font-extrabold text-[#1A1A2E] text-[28px] lg:text-[32px] leading-[1.22]">
 Xin chào, Ban Giám Hiệu 👋
 </h1>
 <p className="mt-1 font-medium text-[#4c5769] text-sm lg:text-base">
 Dưới đây là tình hình đặt đồng phục cho niên khoá <span className="font-bold text-[#6938EF] border-b-2 border-[#6938EF]">2025-2026</span>.
 </p>
 </div>

 {/* Stats Cards */}
 {loading ? (
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
 {[1, 2, 3, 4].map((i) => (
 <div key={i} className="nb-skeleton p-5 h-[120px]" />
 ))}
 </div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
 <StatsCard
 label="Tổng đơn hàng"
 value={formatNumber(totalOrders)}
 tint="nb-card-purple"
 icon={<svg className="w-5 h-5 text-[#6938EF]" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z" /></svg>}
 iconBg="bg-[#EDE9FE]"
 onClick={() => navigate("/school/orders")}
 />
 <StatsCard
 label="Học sinh tham gia"
 value={totalChildProfiles > 0 ? `${totalStudents}/${totalChildProfiles}` : String(totalStudents)}
 tint="nb-card-blue"
 icon={<svg className="w-5 h-5 text-[#3B82F6]" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>}
 iconBg="bg-[#DBEAFE]"
 progressValue={totalStudents}
 progressMax={totalChildProfiles > 0 ? totalChildProfiles : undefined}
 />
 <StatsCard
 label="Doanh thu dự kiến"
 value={expectedRevenue > 0 ? formatNumber(expectedRevenue) : "0 ₫"}
 tint="nb-card-green"
 icon={<svg className="w-5 h-5 text-[#10B981]" viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" /></svg>}
 iconBg="bg-[#D1FAE5]"
 onClick={() => navigate("/school/wallet")}
 />
 <StatsCard
 label="Đơn chờ duyệt"
 value={String(pendingOrders)}
 tint="nb-card-red"
 icon={<svg className="w-5 h-5 text-[#EF4444]" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l4.59-4.58L18 11l-6 6z" /></svg>}
 iconBg="bg-[#FEE2E2]"
 indicator={pendingOrders > 0 ? "Cần xử lý" : undefined}
 indicatorType={pendingOrders > 0 ? "negative" : "neutral"}
 onClick={() => navigate("/school/production-orders")}
 />
 </div>
 )}


 {/* Active Campaigns Countdowns + Product Categories */}
 <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
 {/* Campaign Countdown Cards */}
 <div className="lg:col-span-3 space-y-5">
 {activeCampaigns.length > 0 ? (
 activeCampaigns.map((campaign) => (
 <CampaignCountdownCard
 key={campaign.campaignId}
 campaign={campaign}
 onNavigate={(id) => navigate(`/school/campaigns/${id}`)}
 />
 ))
 ) : (
 <div className="nb-card-static p-6">
 <div className="text-center py-8">
 <div className="w-14 h-14 rounded-full bg-[#F3F4F6] flex items-center justify-center mx-auto mb-3 border-2 border-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E]">
 <svg className="w-7 h-7 text-[#9CA3AF]" viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" /></svg>
 </div>
 <p className=" font-bold text-[#6B7280] text-base">Chưa có chiến dịch đang hoạt động</p>
 <p className=" font-medium text-[#9CA3AF] text-sm mt-1">Tạo một chiến dịch mới để bắt đầu.</p>
 <button
 onClick={() => navigate("/school/campaigns/new")}
 className="mt-4 nb-btn nb-btn-purple"
 >
 Tạo chiến dịch
 </button>
 </div>
 </div>
 )}
 </div>

 {/* Product Category Card */}
 <div className="lg:col-span-2 nb-card-static p-6">
 <h2 className=" font-bold text-[#1A1A2E] text-lg mb-5">
 Phân loại sản phẩm
 </h2>
 {productCategories.length > 0 ? (
 <div className="space-y-4">
 {productCategories.map((cat, i) => (
 <CategoryBar
 key={i}
 name={cat.name}
 percentage={cat.percentage}
 color={[
 "bg-[#3B82F6]",
 "bg-[#6938EF]",
 "bg-[#10B981]",
 "bg-[#F59E0B]",
 "bg-[#EF4444]",
 ][i % 5]}
 />
 ))}
 </div>
 ) : (
 <div className="text-center py-8">
 <p className=" font-medium text-[#9CA3AF] text-sm">Chưa có dữ liệu sản phẩm</p>
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

export default SchoolDashboard;
