import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
 Breadcrumb,
 BreadcrumbItem,
 BreadcrumbLink,
 BreadcrumbList,
 BreadcrumbPage,
 BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { ShoppingCart, Users, Wallet, ClipboardCheck } from "lucide-react";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
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
 <h2 className=" font-bold text-[#1A1A2E] text-lg truncate">
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
 cardTone,
 label,
 value,
 indicator,
 indicatorType = "neutral",
 progressValue,
 progressMax,
 progressBarClass = "bg-[#3B82F6]",
 onClick,
}: {
 icon: React.ReactNode;
 iconBg: string;
 cardTone?: string;
 label: string;
 value: string;
 indicator?: string;
 indicatorType?: "positive" | "negative" | "neutral";
 progressValue?: number;
 progressMax?: number;
 progressBarClass?: string;
 onClick?: () => void;
}) {
 const indicatorColor =
 indicatorType === "positive" ? "text-[#10B981]"
 : indicatorType === "negative" ? "text-[#EF4444]"
 : "text-[#6B7280]";

 return (
 <div
className={`nb-stat-card border-[3px] border-[#1A1A2E] shadow-[4px_4px_0_#1A1A2E] hover:-translate-y-px hover:shadow-[5px_5px_0_#1A1A2E] ${cardTone ?? ""}`}
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
className={`nb-progress-bar ${progressBarClass}`}
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
 <TopNavBar>
 <Breadcrumb>
 <BreadcrumbList>
 <BreadcrumbItem><BreadcrumbLink href="/school/dashboard" className=" font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
 <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
 <BreadcrumbItem><BreadcrumbPage className=" font-bold text-[#1A1A2E] text-base">Tổng quan</BreadcrumbPage></BreadcrumbItem>
 </BreadcrumbList>
 </Breadcrumb>
 </TopNavBar>

 {/* Content */}
 <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6 nb-fade-in">
 {/* 2FA Setup Banner */}
 {localStorage.getItem("vtos_should_setup_2fa") === "true" && (
 <div className="nb-card-static border-[#F59E0B] bg-[#FEF3C7] px-5 py-4 flex items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-lg bg-[#F59E0B] flex items-center justify-center border-2 border-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E] flex-shrink-0">
 <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" /></svg>
 </div>
 <div>
 <p className="font-bold text-[#92400E] text-sm">⚠️ Tài khoản chưa bật xác thực 2 bước (2FA)</p>
 <p className="font-medium text-[#92400E] text-xs mt-0.5">Bật 2FA để bảo vệ tài khoản của bạn.</p>
 </div>
 </div>
 <Link to="/2fa-setup" className="nb-btn nb-btn-yellow text-xs px-4 py-2 flex-shrink-0">
 🔐 Bật ngay
 </Link>
 </div>
 )}

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
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 nb-stagger">
 <StatsCard
 label="Tổng đơn hàng"
 value={formatNumber(totalOrders)}
icon={<ShoppingCart className="w-5 h-5 text-[#4F46E5]" strokeWidth={2.2} />}
iconBg="bg-[#EEF2FF]"
cardTone="bg-[#F7F7FE]"
 onClick={() => navigate("/school/orders")}
 />
 <StatsCard
 label="Học sinh tham gia"
 value={totalChildProfiles > 0 ? `${totalStudents}/${totalChildProfiles}` : String(totalStudents)}
icon={<Users className="w-5 h-5 text-[#7C3AED]" strokeWidth={2.2} />}
iconBg="bg-[#F3E8FF]"
cardTone="bg-[#FAF7FE]"
 progressValue={totalStudents}
 progressMax={totalChildProfiles > 0 ? totalChildProfiles : undefined}
progressBarClass="bg-[#7C3AED]"
 />
 <StatsCard
 label="Doanh thu dự kiến"
 value={expectedRevenue > 0 ? formatNumber(expectedRevenue) : "0 ₫"}
icon={<Wallet className="w-5 h-5 text-[#059669]" strokeWidth={2.2} />}
iconBg="bg-[#ECFDF5]"
cardTone="bg-[#F5FCF8]"
 onClick={() => navigate("/school/wallet")}
 />
 <StatsCard
 label="Đơn chờ duyệt"
 value={String(pendingOrders)}
icon={<ClipboardCheck className="w-5 h-5 text-[#EA580C]" strokeWidth={2.2} />}
iconBg="bg-[#FFF7ED]"
cardTone="bg-[#FFF9F4]"
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
