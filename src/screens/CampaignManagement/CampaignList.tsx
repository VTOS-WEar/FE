import { useState, useEffect, useMemo, useCallback } from "react";
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
import { Button } from "../../components/ui/button";
import {
    getSchoolProfile,
    getCampaigns,
    type CampaignListItemDto,
} from "../../lib/api/schools";



/* ── Status config ── */
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
    Draft:     { label: "Bản nháp",    color: "text-[#6B7280]", bg: "bg-[#F3F4F6]", border: "border-[#E5E7EB]" },
    Active:    { label: "Đang mở",     color: "text-[#059669]", bg: "bg-[#D1FAE5]", border: "border-[#A7F3D0]" },
    Paused:    { label: "Tạm dừng",    color: "text-[#D97706]", bg: "bg-[#FEF3C7]", border: "border-[#FDE68A]" },
    Completed: { label: "Hoàn thành",  color: "text-[#2563EB]", bg: "bg-[#DBEAFE]", border: "border-[#BFDBFE]" },
    Cancelled: { label: "Đã hủy",     color: "text-[#DC2626]", bg: "bg-[#FEE2E2]", border: "border-[#FECACA]" },
    Locked:    { label: "Đã khóa",    color: "text-[#7C3AED]", bg: "bg-[#EDE9FE]", border: "border-[#DDD6FE]" },
};

const FILTER_TABS: { key: string; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "Active", label: "Đang mở" },
    { key: "Draft", label: "Bản nháp" },
    { key: "Completed", label: "Hoàn thành" },
    { key: "Locked", label: "Đã khóa" },
];

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Draft;
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs [font-family:'Montserrat',Helvetica] font-semibold ${cfg.color} ${cfg.bg} ${cfg.border}`}>
            {cfg.label}
        </span>
    );
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/* ────────────────────────────────────────────────────────────────────── */
/* Campaign Card                                                          */
/* ────────────────────────────────────────────────────────────────────── */
function CampaignCard({ campaign, onClick }: { campaign: CampaignListItemDto; onClick: () => void }) {
    const isActive = campaign.status === "Active";
    const daysLeft = isActive ? Math.max(0, Math.ceil((new Date(campaign.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

    return (
        <div
            onClick={onClick}
            className="bg-white border border-[#CBCAD7] rounded-[16px] p-5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:border-[#A0A0C0] cursor-pointer transition-all duration-200 group"
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0 mr-3">
                    <h3 className="[font-family:'Montserrat',Helvetica] font-bold text-[#1A1A2E] text-base truncate group-hover:text-[#6938EF] transition-colors">
                        {campaign.campaignName}
                    </h3>
                    <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#97A3B6] text-sm mt-0.5 line-clamp-1">
                        {campaign.description || "Không có mô tả"}
                    </p>
                </div>
                <StatusBadge status={campaign.status} />
            </div>

            {/* Dates */}
            <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-[#97A3B6]" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" /></svg>
                    <span className="[font-family:'Montserrat',Helvetica] font-medium text-[#4C5769] text-xs">{formatDate(campaign.startDate)} — {formatDate(campaign.endDate)}</span>
                </div>
                {isActive && daysLeft > 0 && (
                    <span className="[font-family:'Montserrat',Helvetica] font-semibold text-[#6938EF] text-xs">
                        Còn {daysLeft} ngày
                    </span>
                )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 pt-3 border-t border-[#F0F0F5]">
                <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-[#97A3B6]" viewBox="0 0 24 24" fill="currentColor"><path d="M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2z" /></svg>
                    <span className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4C5769] text-sm">{campaign.outfitCount} sản phẩm</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-[#97A3B6]" viewBox="0 0 24 24" fill="currentColor"><path d="M15.55 13c.75 0 1.41-.41 1.75-1.03l3.58-6.49A.996.996 0 0020.01 4H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7l1.1-2h7.45zM6.16 6h12.15l-2.76 5H8.53L6.16 6zM7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" /></svg>
                    <span className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4C5769] text-sm">{campaign.orderCount} đơn hàng</span>
                </div>
            </div>
        </div>
    );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Main Page                                                              */
/* ────────────────────────────────────────────────────────────────────── */
export const CampaignList = (): JSX.Element => {
    const navigate = useNavigate();
    const sidebarConfig = useSidebarConfig();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [schoolName, setSchoolName] = useState("");

    const [campaigns, setCampaigns] = useState<CampaignListItemDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("all");

    useEffect(() => {
        getSchoolProfile()
            .then((p) => setSchoolName(p.schoolName || ""))
            .catch(() => {});
    }, []);

    const fetchCampaigns = useCallback(() => {
        setLoading(true);
        getCampaigns(1, 50)
            .then((res) => setCampaigns(res.items))
            .catch(() => setCampaigns([]))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

    /* ── Filter ── */
    const filteredCampaigns = useMemo(() => {
        let items = campaigns;
        if (activeTab !== "all") items = items.filter((c) => c.status === activeTab);
        if (search.trim()) {
            const q = search.toLowerCase();
            items = items.filter((c) => c.campaignName.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q)));
        }
        return items;
    }, [campaigns, activeTab, search]);

    const statusCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        campaigns.forEach((c) => { counts[c.status] = (counts[c.status] || 0) + 1; });
        return counts;
    }, [campaigns]);

    const handleLogout = () => {
        localStorage.removeItem("access_token"); localStorage.removeItem("user"); localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token"); sessionStorage.removeItem("user"); sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    return (
        <div className="bg-[#f6f7f8] w-full min-h-screen flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[20rem] xl:w-[23.75rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} name={schoolName} isCollapsed={isCollapsed} onToggle={() => setIsCollapsed((c) => !c)} onLogout={handleLogout} />
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                    {/* Breadcrumb */}
                    <div className="bg-white border-b border-[#cbcad7] px-6 lg:px-10 py-5 flex items-center justify-between">
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem><BreadcrumbLink href="/school/dashboard" className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                                <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                                <BreadcrumbItem><BreadcrumbPage className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4c5769] text-base">Quản lý chiến dịch</BreadcrumbPage></BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                        <div className="flex items-center gap-3">
                            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f0f0f5] transition-colors">
                                <svg className="w-6 h-6 text-[#4c5769]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 002 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.93 6 11v5l-2 2v1h16v-1l-2-2z" /></svg>
                            </button>
                        </div>
                    </div>

                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div>
                                <h1 className="[font-family:'Montserrat',Helvetica] font-bold text-black text-[28px] lg:text-[32px] leading-[1.22]">Quản lý chiến dịch</h1>
                                <p className="mt-1 [font-family:'Montserrat',Helvetica] font-medium text-[#4c5769] text-sm lg:text-base">Xem và quản lý các đợt đặt hàng đồng phục.</p>
                            </div>
                            <Button
                                onClick={() => navigate("/school/campaigns/new")}
                                className="bg-gradient-to-r from-[#6938EF] to-[#5B2FD6] hover:from-[#5B2FD6] hover:to-[#4F22C7] text-white rounded-[10px] [font-family:'Montserrat',Helvetica] font-semibold text-sm gap-2 px-5 py-2.5 h-auto shadow-[0_2px_8px_rgba(105,56,239,0.3)] whitespace-nowrap"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
                                Tạo đợt mới
                            </Button>
                        </div>

                        {/* Search + Filters */}
                        <div className="bg-white border border-[#cbcad7] rounded-[10px] p-4 space-y-4">
                            <div className="flex items-center gap-2 bg-[#F8F9FB] border border-[#cbcad7] rounded-[10px] px-4 py-2.5">
                                <svg className="w-5 h-5 text-[#97A3B6] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
                                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm chiến dịch..." className="flex-1 bg-transparent outline-none [font-family:'Montserrat',Helvetica] font-medium text-sm text-[#1a1a2e] placeholder:text-[#97A3B6]" />
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                {FILTER_TABS.map((tab) => {
                                    const isActive = activeTab === tab.key;
                                    const badge = tab.key !== "all" ? (statusCounts[tab.key] || 0) : 0;
                                    return (
                                        <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-1.5 px-3 py-2 rounded-[10px] border [font-family:'Montserrat',Helvetica] font-semibold text-sm transition-colors ${isActive ? "bg-[#6938EF] border-[#6938EF] text-white" : "bg-white border-[#cbcad7] text-[#4C5769] hover:bg-[#F6F7F8]"}`}>
                                            {tab.label}
                                            {badge > 0 && <span className={`min-w-[20px] h-5 flex items-center justify-center rounded-[5px] text-xs font-bold px-1 ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>{badge}</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Loading */}
                        {loading && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="bg-white rounded-[16px] p-5 animate-pulse border border-[#CBCAD7]">
                                        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                                        <div className="h-3 bg-gray-200 rounded w-full mb-3" />
                                        <div className="h-8 bg-gray-200 rounded w-1/3" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Cards */}
                        {!loading && filteredCampaigns.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {filteredCampaigns.map((c) => (
                                    <CampaignCard key={c.campaignId} campaign={c} onClick={() => navigate(`/school/campaigns/${c.campaignId}`)} />
                                ))}
                            </div>
                        )}

                        {/* Empty state */}
                        {!loading && filteredCampaigns.length === 0 && (
                            <div className="bg-white border border-[#cbcad7] rounded-[16px] p-12 text-center">
                                <div className="w-16 h-16 rounded-full bg-[#EDE9FE] flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-[#6938EF]" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
                                </div>
                                <p className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4C5769] text-base">Chưa có chiến dịch nào</p>
                                <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#97A3B6] text-sm mt-1 mb-4">Tạo đợt đặt hàng mới để bắt đầu bán đồng phục.</p>
                                <Button
                                    onClick={() => navigate("/school/campaigns/new")}
                                    className="bg-gradient-to-r from-[#6938EF] to-[#5B2FD6] hover:from-[#5B2FD6] hover:to-[#4F22C7] text-white rounded-[10px] [font-family:'Montserrat',Helvetica] font-semibold text-sm gap-2 px-5 py-2.5 h-auto shadow-[0_2px_8px_rgba(105,56,239,0.3)]"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
                                    Tạo đợt mới
                                </Button>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default CampaignList;
