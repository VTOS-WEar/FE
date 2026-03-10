import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { DashboardSidebar } from "../../components/layout";
import { DASHBOARD_SIDEBAR_CONFIG } from "../../constants/dashboardConfig";
import {
    getSchoolProfile,
    getCampaignDetail,
    lockCampaign,
    type CampaignDetailDto,
} from "../../lib/api/schools";

const sidebarConfig = {
    ...DASHBOARD_SIDEBAR_CONFIG,
    navSections: DASHBOARD_SIDEBAR_CONFIG.navSections.map((section) => ({
        ...section,
        items: section.items.map((item) => ({
            ...item,
            active: item.label === "Mở đơn",
        })),
    })),
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
    Draft:     { label: "Bản nháp",    color: "text-[#6B7280]", bg: "bg-[#F3F4F6]", border: "border-[#E5E7EB]" },
    Active:    { label: "Đang mở",     color: "text-[#059669]", bg: "bg-[#D1FAE5]", border: "border-[#A7F3D0]" },
    Paused:    { label: "Tạm dừng",    color: "text-[#D97706]", bg: "bg-[#FEF3C7]", border: "border-[#FDE68A]" },
    Completed: { label: "Hoàn thành",  color: "text-[#2563EB]", bg: "bg-[#DBEAFE]", border: "border-[#BFDBFE]" },
    Cancelled: { label: "Đã hủy",     color: "text-[#DC2626]", bg: "bg-[#FEE2E2]", border: "border-[#FECACA]" },
    Locked:    { label: "Đã khóa",    color: "text-[#7C3AED]", bg: "bg-[#EDE9FE]", border: "border-[#DDD6FE]" },
};

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Draft;
    return (
        <span className={`inline-flex items-center px-3 py-1.5 rounded-full border text-sm [font-family:'Montserrat',Helvetica] font-semibold ${cfg.color} ${cfg.bg} ${cfg.border}`}>
            {cfg.label}
        </span>
    );
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export const CampaignDetail = (): JSX.Element => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [schoolName, setSchoolName] = useState(DASHBOARD_SIDEBAR_CONFIG.name);
    const [campaign, setCampaign] = useState<CampaignDetailDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [locking, setLocking] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const showToast = useCallback((message: string, type: "success" | "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    }, []);

    useEffect(() => {
        getSchoolProfile().then((p) => setSchoolName(p.schoolName || DASHBOARD_SIDEBAR_CONFIG.name)).catch(() => {});
    }, []);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        getCampaignDetail(id)
            .then((data) => setCampaign(data))
            .catch(() => showToast("Không tìm thấy chiến dịch", "error"))
            .finally(() => setLoading(false));
    }, [id, showToast]);

    const handleLock = async () => {
        if (!id || !campaign) return;
        if (!window.confirm("Bạn có chắc muốn khóa chiến dịch này? Phụ huynh sẽ không thể đặt hàng thêm.")) return;
        setLocking(true);
        try {
            await lockCampaign(id);
            showToast("Đã khóa chiến dịch!", "success");
            setCampaign({ ...campaign, status: "Locked" });
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : "Có lỗi xảy ra", "error");
        } finally {
            setLocking(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("access_token"); localStorage.removeItem("user"); localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token"); sessionStorage.removeItem("user"); sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    const isActive = campaign?.status === "Active";
    const daysLeft = campaign && isActive ? Math.max(0, Math.ceil((new Date(campaign.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

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
                                <BreadcrumbItem><BreadcrumbLink href="/homepage" className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                                <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                                <BreadcrumbItem><BreadcrumbLink href="/school/campaigns" className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4c5769] text-base">Quản lý chiến dịch</BreadcrumbLink></BreadcrumbItem>
                                <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                                <BreadcrumbItem><BreadcrumbPage className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4c5769] text-base">Chi tiết</BreadcrumbPage></BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>

                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6">
                        {loading ? (
                            <div className="bg-white rounded-[16px] p-8 border border-[#cbcad7] animate-pulse space-y-4">
                                <div className="h-8 bg-gray-200 rounded w-1/3" />
                                <div className="h-5 bg-gray-200 rounded w-1/2" />
                                <div className="h-20 bg-gray-200 rounded w-full" />
                            </div>
                        ) : !campaign ? (
                            <div className="bg-white rounded-[16px] p-12 border border-[#cbcad7] text-center">
                                <p className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4C5769] text-lg">Không tìm thấy chiến dịch</p>
                                <button onClick={() => navigate("/school/campaigns")} className="mt-4 px-5 py-2.5 rounded-[10px] bg-[#6938EF] text-white [font-family:'Montserrat',Helvetica] font-semibold text-sm">Quay lại</button>
                            </div>
                        ) : (
                            <>
                                {/* Header */}
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <button onClick={() => navigate("/school/campaigns")} className="mt-1 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white border border-[#cbcad7] bg-[#F8F9FB] transition-colors flex-shrink-0">
                                            <svg className="w-5 h-5 text-[#4C5769]" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
                                        </button>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h1 className="[font-family:'Montserrat',Helvetica] font-bold text-black text-[28px] lg:text-[32px] leading-[1.22]">{campaign.campaignName}</h1>
                                                <StatusBadge status={campaign.status} />
                                            </div>
                                            <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#4c5769] text-sm">{campaign.description || "Không có mô tả"}</p>
                                        </div>
                                    </div>
                                    {isActive && (
                                        <button
                                            onClick={handleLock}
                                            disabled={locking}
                                            className="px-5 py-2.5 rounded-[10px] bg-[#EF4444] hover:bg-[#DC2626] text-white [font-family:'Montserrat',Helvetica] font-semibold text-sm transition-colors disabled:opacity-50 flex items-center gap-2 flex-shrink-0"
                                        >
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" /></svg>
                                            Khóa chiến dịch
                                        </button>
                                    )}
                                </div>

                                {/* Stats cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-white border border-[#cbcad7] rounded-[16px] p-5">
                                        <p className="[font-family:'Montserrat',Helvetica] font-semibold text-[#97A3B6] text-xs uppercase tracking-wider mb-1">Trạng thái</p>
                                        <StatusBadge status={campaign.status} />
                                    </div>
                                    <div className="bg-white border border-[#cbcad7] rounded-[16px] p-5">
                                        <p className="[font-family:'Montserrat',Helvetica] font-semibold text-[#97A3B6] text-xs uppercase tracking-wider mb-1">Thời gian</p>
                                        <p className="[font-family:'Montserrat',Helvetica] font-bold text-[#1A1A2E] text-base">{formatDate(campaign.startDate)} — {formatDate(campaign.endDate)}</p>
                                        {isActive && daysLeft > 0 && <p className="[font-family:'Montserrat',Helvetica] font-semibold text-[#6938EF] text-xs mt-1">Còn {daysLeft} ngày</p>}
                                    </div>
                                    <div className="bg-white border border-[#cbcad7] rounded-[16px] p-5">
                                        <p className="[font-family:'Montserrat',Helvetica] font-semibold text-[#97A3B6] text-xs uppercase tracking-wider mb-1">Sản phẩm</p>
                                        <p className="[font-family:'Montserrat',Helvetica] font-bold text-[#1A1A2E] text-2xl">{campaign.outfits.length}</p>
                                    </div>
                                    <div className="bg-white border border-[#cbcad7] rounded-[16px] p-5">
                                        <p className="[font-family:'Montserrat',Helvetica] font-semibold text-[#97A3B6] text-xs uppercase tracking-wider mb-1">Đơn hàng</p>
                                        <p className="[font-family:'Montserrat',Helvetica] font-bold text-[#1A1A2E] text-2xl">{campaign.totalOrders}</p>
                                    </div>
                                </div>

                                {/* Outfits list */}
                                <div className="bg-white border border-[#cbcad7] rounded-[16px] p-6">
                                    <div className="flex items-center gap-2 mb-5">
                                        <div className="w-6 h-6 rounded-full bg-[#FEF3C7] flex items-center justify-center">
                                            <svg className="w-3.5 h-3.5 text-[#F59E0B]" viewBox="0 0 24 24" fill="currentColor"><path d="M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2z" /></svg>
                                        </div>
                                        <h2 className="[font-family:'Montserrat',Helvetica] font-bold text-[#1a1a2e] text-lg">Sản phẩm trong chiến dịch</h2>
                                    </div>

                                    {campaign.outfits.length === 0 ? (
                                        <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#97A3B6] text-sm text-center py-6">Không có sản phẩm nào</p>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {campaign.outfits.map((outfit) => (
                                                <div key={outfit.campaignOutfitId} className="flex items-center gap-3 p-4 rounded-[10px] border border-[#CBCAD7] bg-[#FAFBFC]">
                                                    <div className="w-14 h-14 rounded-lg bg-[#E5E7EB] overflow-hidden flex-shrink-0">
                                                        {outfit.mainImageUrl ? (
                                                            <img src={outfit.mainImageUrl} alt={outfit.outfitName} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <svg className="w-7 h-7 text-[#9CA3AF]" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16V7.99C21 6.89 20.1 6 19 6H5C3.9 6 3 6.89 3 7.99V16C3 17.1 3.9 18 5 18H19C20.1 18 21 17.1 21 16Z" /></svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="[font-family:'Montserrat',Helvetica] font-semibold text-[#1A1A2E] text-sm truncate">{outfit.outfitName}</p>
                                                        <p className="[font-family:'Montserrat',Helvetica] font-bold text-[#6938EF] text-sm mt-0.5">{new Intl.NumberFormat("vi-VN").format(outfit.campaignPrice)} VND</p>
                                                        {outfit.maxQuantity && <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#97A3B6] text-xs mt-0.5">Tối đa: {outfit.maxQuantity}</p>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="bg-white border border-[#cbcad7] rounded-[16px] p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-6 h-6 rounded-full bg-[#E8F4FD] flex items-center justify-center">
                                            <svg className="w-3.5 h-3.5 text-[#3B82F6]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
                                        </div>
                                        <h2 className="[font-family:'Montserrat',Helvetica] font-bold text-[#1a1a2e] text-lg">Thông tin thêm</h2>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="[font-family:'Montserrat',Helvetica] font-semibold text-[#97A3B6] text-xs uppercase tracking-wider mb-1">Ngày tạo</p>
                                            <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#1A1A2E]">{formatDate(campaign.createdAt)}</p>
                                        </div>
                                        <div>
                                            <p className="[font-family:'Montserrat',Helvetica] font-semibold text-[#97A3B6] text-xs uppercase tracking-wider mb-1">Mã chiến dịch</p>
                                            <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#1A1A2E] font-mono text-xs">{campaign.campaignId}</p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </main>
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 ${toast.type === "success" ? "bg-[#10b981] text-white" : "bg-[#ef4444] text-white"}`}>
                    {toast.type === "success" ? (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                    ) : (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
                    )}
                    <span className="[font-family:'Montserrat',Helvetica] font-semibold text-sm">{toast.message}</span>
                </div>
            )}
        </div>
    );
};

export default CampaignDetail;
