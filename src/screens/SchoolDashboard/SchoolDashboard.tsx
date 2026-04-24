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
import { ClipboardCheck, ShoppingCart, Users, Wallet } from "lucide-react";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useSidebarConfig } from "../../hooks/useSidebarConfig";
import {
 getSchoolProfile,
 getSemesterPublications,
 type SemesterPublicationDto,
} from "../../lib/api/schools";

function PublicationWindowCard({
 publication,
 onNavigate,
}: {
 publication: SemesterPublicationDto;
 onNavigate: (id: string) => void;
}) {
 const endDate = new Date(publication.endDate);
 const diff = Math.max(0, endDate.getTime() - Date.now());
 const days = Math.floor(diff / (1000 * 60 * 60 * 24));
 const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
 const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
 const isNearEnd = days <= 7 && diff > 0;

 return (
 <div className="nb-card-static p-6">
 <div className="flex items-start justify-between mb-4 gap-4">
 <div>
 <h2 className="font-bold text-gray-900 text-lg truncate">
 {publication.semester} • {publication.academicYear}
 </h2>
 <p className="font-medium text-gray-500 text-sm mt-1">
 Kết thúc vào ngày {formatDate(publication.endDate)}
 </p>
 </div>
 <button
 onClick={() => onNavigate(publication.id)}
 className="nb-btn nb-btn-purple text-sm"
 >
 Quản lý
 </button>
 </div>

 <div className="flex items-start gap-6">
 <div className="flex-shrink-0">
 <p className="font-bold text-gray-500 text-xs tracking-wider uppercase mb-3">
 Thời gian còn lại
 </p>
 <div className="flex items-center gap-2">
 {[
 { value: String(days).padStart(2, "0"), label: "Ngày" },
 { value: String(hours).padStart(2, "0"), label: "Giờ" },
 { value: String(minutes).padStart(2, "0"), label: "Phút" },
 ].map((unit, index) => (
 <div key={unit.label} className="flex items-center gap-2">
 {index > 0 && <span className="font-bold text-gray-900 text-2xl">:</span>}
 <div className="text-center">
 <div className="nb-countdown-box">
 <span className="nb-countdown-value">{unit.value}</span>
 </div>
 <p className="nb-countdown-label">{unit.label}</p>
 </div>
 </div>
 ))}
 </div>
 </div>

 {isNearEnd && (
 <div className="flex-1 nb-alert nb-alert-warning self-center">
 <div className="w-6 h-6 rounded-full bg-[#F59E0B] flex items-center justify-center flex-shrink-0 mt-px border border-gray-200">
 <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" /></svg>
 </div>
 <div>
 <p className="font-bold text-amber-800 text-xs leading-tight">Sắp kết thúc</p>
 </div>
 </div>
 )}
 </div>
 </div>
 );
}

function formatNumber(n: number): string {
 if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} triệu`;
 if (n >= 1_000) return n.toLocaleString("vi-VN");
 return String(n);
}

function formatDate(iso: string) {
 return new Date(iso).toLocaleDateString("vi-VN", {
 timeZone: "Asia/Ho_Chi_Minh",
 day: "2-digit",
 month: "2-digit",
 year: "numeric",
 });
}

function StatsCard({
 icon,
 iconBg,
 cardTone,
 label,
 value,
 indicator,
 onClick,
}: {
 icon: React.ReactNode;
 iconBg: string;
 cardTone?: string;
 label: string;
 value: string;
 indicator?: string;
 onClick?: () => void;
}) {
 return (
 <div
 className={`nb-stat-card border border-gray-200 shadow-soft-sm ${cardTone ?? ""}`}
 style={{ cursor: onClick ? "pointer" : undefined }}
 onClick={onClick}
 >
 <div className="flex items-start justify-between mb-3">
 <p className="nb-stat-label">{label}</p>
 <div className={`nb-stat-icon ${iconBg}`}>
 {icon}
 </div>
 </div>
 <p className="nb-stat-value">{value}</p>
 {indicator && (
 <p className="font-medium text-xs mt-1.5 text-gray-500">
 {indicator}
 </p>
 )}
 </div>
 );
}

export const SchoolDashboard = (): JSX.Element => {
 const navigate = useNavigate();
 const sidebarConfig = useSidebarConfig();
 const [isCollapsed, toggle] = useSidebarCollapsed();
 const [schoolName, setSchoolName] = useState("");
 const [loading, setLoading] = useState(true);
 const [activePublications, setActivePublications] = useState<SemesterPublicationDto[]>([]);
 const [draftCount, setDraftCount] = useState(0);
 const [closedCount, setClosedCount] = useState(0);
 const [providerCount, setProviderCount] = useState(0);
 const [outfitCount, setOutfitCount] = useState(0);

 const fetchData = useCallback(async () => {
 setLoading(true);
 try {
 const [profile, publicationResponse] = await Promise.all([
 getSchoolProfile(),
 getSemesterPublications(1, 50),
 ]);

 setSchoolName(profile.schoolName || "");
 if (profile.schoolName) {
 localStorage.setItem("vtos_org_name", profile.schoolName);
 }

 const publications = publicationResponse.items || [];
 setActivePublications(publications.filter((item) => item.status === "Active"));
 setDraftCount(publications.filter((item) => item.status === "Draft").length);
 setClosedCount(publications.filter((item) => item.status === "Closed").length);
 setProviderCount(publications.reduce((sum, item) => sum + (item.providerCount || 0), 0));
 setOutfitCount(publications.reduce((sum, item) => sum + (item.outfitCount || 0), 0));
 } catch {
 // Leave dashboard in empty state when APIs are unavailable.
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

 return (
 <div className="nb-page flex flex-col">
 <div className="flex flex-1 flex-col lg:flex-row">
 <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
 <DashboardSidebar {...sidebarConfig} name={schoolName} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
 </div>

 <div className="flex-1 flex flex-col min-w-0">
 <TopNavBar>
 <Breadcrumb>
 <BreadcrumbList>
 <BreadcrumbItem><BreadcrumbLink href="/school/dashboard" className="font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
 <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
 <BreadcrumbItem><BreadcrumbPage className="font-bold text-gray-900 text-base">Tổng quan</BreadcrumbPage></BreadcrumbItem>
 </BreadcrumbList>
 </Breadcrumb>
 </TopNavBar>

 <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6 nb-fade-in">
 <div>
 <h1 className="font-extrabold text-gray-900 text-[28px] lg:text-[32px] leading-[1.22]">
 Xin chào, Ban Giám Hiệu
 </h1>
 </div>

 {loading ? (
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
 {[1, 2, 3, 4].map((i) => (
 <div key={i} className="nb-skeleton p-5 h-[120px]" />
 ))}
 </div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 nb-stagger">
 <StatsCard
 label="Công bố đang hoạt động"
 value={formatNumber(activePublications.length)}
 icon={<ShoppingCart className="w-5 h-5 text-[#4F46E5]" strokeWidth={2.2} />}
 iconBg="bg-[#EEF2FF]"
 cardTone="bg-[#F7F7FE]"
 onClick={() => navigate("/school/semester-publications")}
 />
 <StatsCard
 label="Bản nháp cần hoàn thiện"
 value={formatNumber(draftCount)}
 icon={<Users className="w-5 h-5 text-[#7C3AED]" strokeWidth={2.2} />}
 iconBg="bg-[#F3E8FF]"
 cardTone="bg-[#FAF7FE]"
 onClick={() => navigate("/school/semester-publications")}
 />
 <StatsCard
 label="Nhà cung cấp đã duyệt"
 value={formatNumber(providerCount)}
 icon={<Wallet className="w-5 h-5 text-[#059669]" strokeWidth={2.2} />}
 iconBg="bg-[#ECFDF5]"
 cardTone="bg-[#F5FCF8]"
 onClick={() => navigate("/school/semester-publications")}
 />
 <StatsCard
 label="Mẫu đồng phục công bố"
 value={formatNumber(outfitCount)}
 icon={<ClipboardCheck className="w-5 h-5 text-[#EA580C]" strokeWidth={2.2} />}
 iconBg="bg-[#FFF7ED]"
 cardTone="bg-[#FFF9F4]"
 onClick={() => navigate("/school/semester-publications")}
 />
 </div>
 )}

 <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
 <div className="lg:col-span-3 space-y-5">
 {activePublications.length > 0 ? (
 activePublications.map((publication) => (
 <PublicationWindowCard
 key={publication.id}
 publication={publication}
 onNavigate={(id) => navigate(`/school/semester-publications/${id}`)}
 />
 ))
 ) : (
 <div className="nb-card-static p-6">
 <div className="text-center py-8">
 <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 border border-gray-200 shadow-sm">
 <svg className="w-7 h-7 text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" /></svg>
 </div>
 <p className="font-bold text-gray-500 text-base">Chưa có công bố học kỳ đang hoạt động</p>
 <button
 onClick={() => navigate("/school/semester-publications/new")}
 className="mt-4 nb-btn nb-btn-purple"
 >
 Tạo công bố
 </button>
 </div>
 </div>
 )}
 </div>

 <div className="lg:col-span-2 nb-card-static p-6">
 <h2 className="font-bold text-gray-900 text-lg mb-5">
 Tổng quan công bố
 </h2>
 <div className="space-y-4">
 <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3">
 <span className="font-semibold text-gray-600 text-sm">Đang hoạt động</span>
 <span className="font-extrabold text-gray-900 text-sm">{activePublications.length}</span>
 </div>
 <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3">
 <span className="font-semibold text-gray-600 text-sm">Bản nháp</span>
 <span className="font-extrabold text-gray-900 text-sm">{draftCount}</span>
 </div>
 <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3">
 <span className="font-semibold text-gray-600 text-sm">Đã khép lại</span>
 <span className="font-extrabold text-gray-900 text-sm">{closedCount}</span>
 </div>
 <button
 onClick={() => navigate("/school/semester-publications")}
 className="w-full nb-btn nb-btn-outline"
 >
 Xem toàn bộ công bố
 </button>
 </div>
 </div>
 </div>
 </main>
 </div>
 </div>
 </div>
 );
};

export default SchoolDashboard;
