import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { DashboardSidebar } from "../../components/layout";
import { useSidebarConfig } from "../../hooks/useSidebarConfig";
import { getSchoolProfile, getCampaigns, type CampaignListItemDto } from "../../lib/api/schools";

/* ── Status config → nb-badge variants ── */
const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
    Draft:     { label: "Bản nháp",    badge: "nb-badge text-[#6B7280] bg-[#F3F4F6]" },
    Active:    { label: "Đang mở",     badge: "nb-badge nb-badge-green" },
    Paused:    { label: "Tạm dừng",    badge: "nb-badge nb-badge-yellow" },
    Completed: { label: "Hoàn thành",  badge: "nb-badge nb-badge-blue" },
    Cancelled: { label: "Đã hủy",     badge: "nb-badge nb-badge-red" },
    Locked:    { label: "Đã khóa",    badge: "nb-badge nb-badge-purple" },
};

const FILTER_TABS = [
    { key: "all", label: "Tất cả" },
    { key: "Active", label: "Đang mở" },
    { key: "Draft", label: "Bản nháp" },
    { key: "Completed", label: "Hoàn thành" },
    { key: "Locked", label: "Đã khóa" },
];

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Draft;
    return <span className={cfg.badge}>{cfg.label}</span>;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/* ── Campaign Card (Neubrutalism) ── */
function CampaignCard({ campaign, onClick }: { campaign: CampaignListItemDto; onClick: () => void }) {
    const isActive = campaign.status === "Active";
    const daysLeft = isActive ? Math.max(0, Math.ceil((new Date(campaign.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

    return (
        <div onClick={onClick} className="nb-card p-5 cursor-pointer group">
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0 mr-3">
                    <h3 className="font-bold text-[#1A1A2E] text-base truncate group-hover:text-[#6938EF] transition-colors">{campaign.campaignName}</h3>
                    <p className="font-medium text-[#97A3B6] text-sm mt-0.5 line-clamp-1">{campaign.description || "Không có mô tả"}</p>
                </div>
                <StatusBadge status={campaign.status} />
            </div>

            <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-[#97A3B6]" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" /></svg>
                    <span className="font-medium text-[#4C5769] text-xs">{formatDate(campaign.startDate)} — {formatDate(campaign.endDate)}</span>
                </div>
                {isActive && daysLeft > 0 && <span className="font-bold text-[#6938EF] text-xs">Còn {daysLeft} ngày</span>}
            </div>

            <div className="flex items-center gap-4 pt-3 border-t-2 border-[#E5E7EB]">
                <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-[#97A3B6]" viewBox="0 0 24 24" fill="currentColor"><path d="M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2z" /></svg>
                    <span className="font-semibold text-[#4C5769] text-sm">{campaign.outfitCount} sản phẩm</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-[#97A3B6]" viewBox="0 0 24 24" fill="currentColor"><path d="M15.55 13c.75 0 1.41-.41 1.75-1.03l3.58-6.49A.996.996 0 0020.01 4H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7l1.1-2h7.45zM6.16 6h12.15l-2.76 5H8.53L6.16 6zM7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" /></svg>
                    <span className="font-semibold text-[#4C5769] text-sm">{campaign.orderCount} đơn hàng</span>
                </div>
            </div>
        </div>
    );
}

/* ── Main Page ── */
export const CampaignList = (): JSX.Element => {
    const navigate = useNavigate();
    const sidebarConfig = useSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [schoolName, setSchoolName] = useState("");

    const [campaigns, setCampaigns] = useState<CampaignListItemDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("all");

    useEffect(() => { getSchoolProfile().then((p) => setSchoolName(p.schoolName || "")).catch(() => {}); }, []);

    const fetchCampaigns = useCallback(() => {
        setLoading(true);
        getCampaigns(1, 50).then((res) => setCampaigns(res.items)).catch(() => setCampaigns([])).finally(() => setLoading(false));
    }, []);

    useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

    const filteredCampaigns = useMemo(() => {
        let items = campaigns;
        if (activeTab !== "all") items = items.filter((c) => c.status === activeTab);
        if (search.trim()) { const q = search.toLowerCase(); items = items.filter((c) => c.campaignName.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q))); }
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
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} name={schoolName} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Breadcrumb */}
                    <div className="nb-breadcrumb-bar">
                        <Breadcrumb><BreadcrumbList>
                            <BreadcrumbItem><BreadcrumbLink href="/school/dashboard" className="font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                            <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                            <BreadcrumbItem><BreadcrumbPage className="font-bold text-[#1A1A2E] text-base">Quản lý chiến dịch</BreadcrumbPage></BreadcrumbItem>
                        </BreadcrumbList></Breadcrumb>
                    </div>

                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div>
                                <h1 className="font-extrabold text-[#1A1A2E] text-[28px] lg:text-[32px] leading-tight">Quản lý chiến dịch 🎯</h1>
                                <p className="mt-1 font-medium text-[#4c5769] text-sm lg:text-base">Xem và quản lý các đợt đặt hàng đồng phục.</p>
                            </div>
                            <button onClick={() => navigate("/school/campaigns/new")} className="nb-btn nb-btn-purple text-sm whitespace-nowrap">
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
                                Tạo đợt mới
                            </button>
                        </div>

                        {/* Search + Filter Tabs */}
                        <div className="nb-card-static p-4 space-y-4">
                            <div className="flex items-center gap-2 nb-input py-2.5">
                                <svg className="w-5 h-5 text-[#97A3B6] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
                                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm chiến dịch..." className="flex-1 bg-transparent outline-none font-medium text-sm text-[#1a1a2e] placeholder:text-[#97A3B6]" />
                            </div>
                            <div className="nb-tabs w-fit">
                                {FILTER_TABS.map((tab) => {
                                    const isAct = activeTab === tab.key;
                                    const badge = tab.key !== "all" ? (statusCounts[tab.key] || 0) : 0;
                                    return (
                                        <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`nb-tab ${isAct ? "nb-tab-active" : ""}`}>
                                            {tab.label}
                                            {badge > 0 && <span className={`ml-1.5 min-w-[20px] h-5 flex items-center justify-center rounded-full text-xs font-bold px-1.5 ${isAct ? "bg-white/20 text-white" : "bg-[#E5E7EB] text-[#4C5769]"}`}>{badge}</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Loading */}
                        {loading && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {[1, 2, 3].map((i) => <div key={i} className="nb-skeleton p-5 h-[160px]" />)}
                            </div>
                        )}

                        {/* Cards */}
                        {!loading && filteredCampaigns.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {filteredCampaigns.map((c) => <CampaignCard key={c.campaignId} campaign={c} onClick={() => navigate(`/school/campaigns/${c.campaignId}`)} />)}
                            </div>
                        )}

                        {/* Empty */}
                        {!loading && filteredCampaigns.length === 0 && (
                            <div className="nb-card-static p-12 text-center">
                                <div className="w-14 h-14 rounded-full bg-[#EDE9FE] flex items-center justify-center mx-auto mb-4 border-2 border-[#1A1A2E] shadow-[3px_3px_0_#1A1A2E]">
                                    <svg className="w-7 h-7 text-[#6938EF]" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
                                </div>
                                <p className="font-bold text-[#4C5769] text-base">Chưa có chiến dịch nào</p>
                                <p className="font-medium text-[#97A3B6] text-sm mt-1 mb-4">Tạo đợt đặt hàng mới để bắt đầu.</p>
                                <button onClick={() => navigate("/school/campaigns/new")} className="nb-btn nb-btn-purple text-sm">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
                                    Tạo đợt mới
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default CampaignList;
