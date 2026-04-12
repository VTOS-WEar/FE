import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
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
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useSidebarConfig } from "../../hooks/useSidebarConfig";
import {
    getSchoolProfile,
    getCampaignDetail,
    getCampaignProgress,
    lockCampaign,
    getProviders,
    type CampaignDetailDto,
    type CampaignProgressDto,
    type ProviderDto,
} from "../../lib/api/schools";
import { generateProductionOrder } from "../../lib/api/productionOrders";



const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    Draft:     { label: "BẢN NHÁP",    color: "text-[#6B7280]", bg: "bg-[#F3F4F6]" },
    Active:    { label: "ĐANG MỞ",     color: "text-[#059669]", bg: "bg-[#D9F8E8]" },
    Paused:    { label: "TẠM DỪNG",    color: "text-[#D97706]", bg: "bg-[#FFF1BF]" },
    Completed: { label: "HOÀN THÀNH",  color: "text-[#2563EB]", bg: "bg-[#DCEBFF]" },
    Cancelled: { label: "ĐÃ HỦY",     color: "text-[#DC2626]", bg: "bg-[#FFECEA]" },
    Locked:    { label: "ĐÃ KHÓA",    color: "text-[#7C3AED]", bg: "bg-[#E9E1FF]" },
};

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Draft;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] border-[2px] border-[#19182B] text-[12px] font-extrabold tracking-wider shadow-[2px_2px_0_#19182B] ${cfg.color} ${cfg.bg}`}>
            <span className={`w-2 h-2 rounded-full ${status === 'Active' ? 'bg-[#10b981]' : status === 'Locked' ? 'bg-[#7C3AED]' : status === 'Cancelled' ? 'bg-[#DC2626]' : 'bg-current'}`} />
            {cfg.label}
        </span>
    );
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric" });
}

export const CampaignDetail = (): JSX.Element => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const sidebarConfig = useSidebarConfig();
    const [schoolName, setSchoolName] = useState("");
    const [campaign, setCampaign] = useState<CampaignDetailDto | null>(null);
    const [progress, setProgress] = useState<CampaignProgressDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [locking, setLocking] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [showGenModal, setShowGenModal] = useState(false);
    const [genBatchName, setGenBatchName] = useState("");
    const [genDeadline, setGenDeadline] = useState("");
    const [genProviderId, setGenProviderId] = useState("");
    const [providers, setProviders] = useState<ProviderDto[]>([]);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const showToast = useCallback((message: string, type: "success" | "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    }, []);

    useEffect(() => {
        getSchoolProfile().then((p) => setSchoolName(p.schoolName || "")).catch(() => {});
        getProviders().then(setProviders).catch(() => {});
    }, []);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        Promise.all([
            getCampaignDetail(id),
            getCampaignProgress(id).catch(() => null),
        ])
            .then(([detail, prog]) => {
                setCampaign(detail);
                setProgress(prog);
            })
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

    const openGenModal = () => {
        // Auto-fill batch name from campaign
        setGenBatchName(`Đơn SX - ${campaign?.campaignName || ""}`);
        // Default deadline: 30 days from now
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 30);
        setGenDeadline(deadline.toISOString().split("T")[0]);
        // Auto-pick first provider from campaign outfits
        const firstProvId = campaign?.outfits.find(o => o.providerId)?.providerId || "";
        setGenProviderId(firstProvId);
        setShowGenModal(true);
    };

    const handleGenerateProductionOrder = async () => {
        if (!id || !campaign || !genBatchName.trim() || !genProviderId || !genDeadline) return;
        setGenerating(true);
        try {
            await generateProductionOrder(id, {
                providerID: genProviderId,
                batchName: genBatchName.trim(),
                deliveryDeadline: new Date(genDeadline).toISOString(),
            });
            showToast("Đã tạo đơn sản xuất thành công!", "success");
            setShowGenModal(false);
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : "Có lỗi xảy ra khi tạo đơn sản xuất", "error");
        } finally {
            setGenerating(false);
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
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} name={schoolName} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                    {/* Breadcrumb */}
                    <TopNavBar>
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem><BreadcrumbLink href="/school/dashboard" className="font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                                <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                                <BreadcrumbItem><BreadcrumbLink href="/school/campaigns" className="font-semibold text-[#4c5769] text-base">Quản lý chiến dịch</BreadcrumbLink></BreadcrumbItem>
                                <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                                <BreadcrumbItem><BreadcrumbPage className="font-semibold text-[#4c5769] text-base">Chi tiết</BreadcrumbPage></BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </TopNavBar>

                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6">
                        {loading ? (
                            <div className="rounded-[14px] border-[2px] border-[#19182B] bg-white p-8 shadow-[4px_4px_0_#19182B] animate-pulse space-y-4">
                                <div className="h-8 bg-[#F6F1E8] rounded-[8px] w-1/3" />
                                <div className="h-5 bg-[#F6F1E8] rounded-[8px] w-1/2" />
                                <div className="h-20 bg-[#F6F1E8] rounded-[8px] w-full" />
                            </div>
                        ) : !campaign ? (
                            <div className="rounded-[14px] border-[2px] border-[#19182B] bg-white p-12 shadow-[4px_4px_0_#19182B] text-center">
                                <p className="font-black text-[#19182B] text-lg">Không tìm thấy chiến dịch</p>
                                <button onClick={() => navigate("/school/campaigns")} className="mt-4 rounded-[10px] border-[2px] border-[#19182B] bg-[#8B6BFF] px-5 py-2.5 text-white font-extrabold text-sm shadow-[3px_3px_0_#19182B] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B]">Quay lại</button>
                            </div>
                        ) : (
                            <>
                                {/* Header — shadow 6px (main section) */}
                                <div className="rounded-[14px] border-[2px] border-[#19182B] bg-white p-6 shadow-[6px_6px_0_#19182B]">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <button onClick={() => navigate("/school/campaigns")} className="mt-1 w-10 h-10 flex items-center justify-center rounded-[8px] border-[2px] border-[#19182B] bg-[#F6F1E8] shadow-[2px_2px_0_#19182B] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#19182B] flex-shrink-0">
                                                <svg className="w-5 h-5 text-[#19182B]" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
                                            </button>
                                            <div>
                                                <div className="flex flex-wrap items-center gap-3 mb-1.5">
                                                    <h1 className="font-black text-[#19182B] text-[28px] lg:text-[32px] leading-[1.22]">{campaign.campaignName}</h1>
                                                    <StatusBadge status={campaign.status} />
                                                </div>
                                                <p className="font-semibold text-[#6F6A7D] text-sm">{campaign.description || "Không có mô tả"}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            {isActive && (
                                                <button
                                                    onClick={handleLock}
                                                    disabled={locking}
                                                    className="flex items-center gap-2 rounded-[10px] border-[2px] border-[#19182B] bg-[#FFECEA] px-5 py-2.5 text-sm font-extrabold text-[#D32F2F] shadow-[3px_3px_0_#19182B] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B] disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" /></svg>
                                                    {locking ? "Đang khóa..." : "Khóa chiến dịch"}
                                                </button>
                                            )}
                                            {campaign?.status === "Locked" && (
                                                <button
                                                    onClick={openGenModal}
                                                    disabled={generating}
                                                    className="flex items-center gap-2.5 rounded-[10px] border-[3px] border-[#19182B] bg-[#8B6BFF] px-6 py-3 text-[15px] font-extrabold text-white shadow-[5px_5px_0_#19182B] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0_#19182B] disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    🚀
                                                    {generating ? "Đang tạo..." : "Tạo đơn sản xuất"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* KPI cards — shadow 5px */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="rounded-[14px] border-[2px] border-[#19182B] bg-[#E9E1FF] p-5 shadow-[5px_5px_0_#19182B]">
                                        <p className="font-extrabold text-[#19182B] text-xs uppercase tracking-wider mb-2">Trạng thái</p>
                                        <StatusBadge status={campaign.status} />
                                    </div>
                                    <div className="rounded-[14px] border-[2px] border-[#19182B] bg-[#DCEBFF] p-5 shadow-[5px_5px_0_#19182B]">
                                        <p className="font-extrabold text-[#19182B] text-xs uppercase tracking-wider mb-2">Thời gian</p>
                                        <p className="font-black text-[#19182B] text-base">{formatDate(campaign.startDate)} — {formatDate(campaign.endDate)}</p>
                                        {isActive && daysLeft > 0 && (
                                            <span className="inline-block mt-2 rounded-full border-[2px] border-[#19182B] bg-white px-2.5 py-0.5 text-[11px] font-extrabold text-[#7C3AED] shadow-[2px_2px_0_#19182B]">
                                                ⏳ Còn {daysLeft} ngày
                                            </span>
                                        )}
                                    </div>
                                    <div className="rounded-[14px] border-[2px] border-[#19182B] bg-[#D9F8E8] p-5 shadow-[5px_5px_0_#19182B]">
                                        <p className="font-extrabold text-[#19182B] text-xs uppercase tracking-wider mb-2">Sản phẩm</p>
                                        <p className="font-black text-[#19182B] text-3xl">{campaign.outfits.length}</p>
                                    </div>
                                    <div className="rounded-[14px] border-[2px] border-[#19182B] bg-[#FFF1BF] p-5 shadow-[5px_5px_0_#19182B]">
                                        <p className="font-extrabold text-[#19182B] text-xs uppercase tracking-wider mb-2">Đơn hàng</p>
                                        <p className="font-black text-[#19182B] text-3xl">{campaign.totalOrders}</p>
                                    </div>
                                </div>

                                {/* Analytics KPI row — from getCampaignProgress */}
                                {progress && (
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="rounded-[14px] border-[2px] border-[#19182B] bg-[#FFECEA] p-5 shadow-[5px_5px_0_#19182B]">
                                            <p className="font-extrabold text-[#19182B] text-xs uppercase tracking-wider mb-2">💰 Doanh thu</p>
                                            <p className="font-black text-[#19182B] text-xl">{new Intl.NumberFormat("vi-VN").format(progress.totalRevenue)}₫</p>
                                        </div>
                                        <div className="rounded-[14px] border-[2px] border-[#19182B] bg-[#DAF0F7] p-5 shadow-[5px_5px_0_#19182B]">
                                            <p className="font-extrabold text-[#19182B] text-xs uppercase tracking-wider mb-2">👨‍🎓 Học sinh đặt</p>
                                            <p className="font-black text-[#19182B] text-3xl">{progress.totalStudents}</p>
                                            <p className="font-semibold text-[#6F6A7D] text-xs mt-1">/ {progress.totalChildProfiles} hồ sơ</p>
                                        </div>
                                        <div className="rounded-[14px] border-[2px] border-[#19182B] bg-[#FDF8D0] p-5 shadow-[5px_5px_0_#19182B]">
                                            <p className="font-extrabold text-[#19182B] text-xs uppercase tracking-wider mb-2">⏳ Đơn chờ xử lý</p>
                                            <p className="font-black text-[#19182B] text-3xl">{progress.pendingOrders}</p>
                                        </div>
                                        <div className="rounded-[14px] border-[2px] border-[#19182B] bg-[#E8F5CC] p-5 shadow-[5px_5px_0_#19182B]">
                                            <p className="font-extrabold text-[#19182B] text-xs uppercase tracking-wider mb-2">📊 Tỷ lệ đặt</p>
                                            <p className="font-black text-[#19182B] text-3xl">
                                                {progress.totalChildProfiles > 0
                                                    ? Math.round((progress.totalStudents / progress.totalChildProfiles) * 100)
                                                    : 0}%
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Outfit breakdown table */}
                                {progress && progress.outfitBreakdown.length > 0 && (
                                    <div className="rounded-[14px] border-[2px] border-[#19182B] bg-white p-6 shadow-[4px_4px_0_#19182B]">
                                        <div className="flex items-center gap-3 mb-5">
                                            <div className="w-10 h-10 rounded-[10px] border-[3px] border-[#19182B] bg-[#DCEBFF] shadow-[3px_3px_0_#19182B] flex items-center justify-center">
                                                <svg className="w-5 h-5 text-[#478aea]" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" /></svg>
                                            </div>
                                            <h2 className="font-black text-[#19182B] text-xl">Phân tích theo sản phẩm</h2>
                                        </div>
                                        <div className="space-y-3">
                                            {progress.outfitBreakdown.map((item) => {
                                                const fillRate = item.maxQuantity && item.maxQuantity > 0
                                                    ? Math.min(100, Math.round((item.quantityOrdered / item.maxQuantity) * 100))
                                                    : null;
                                                return (
                                                    <div key={item.outfitId} className="p-4 rounded-[10px] border-[2px] border-[#19182B] bg-[#F6F1E8] shadow-[2px_2px_0_#19182B]">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="font-extrabold text-[#19182B] text-sm">{item.outfitName}</p>
                                                            <p className="font-black text-[#8B6BFF] text-sm">{new Intl.NumberFormat("vi-VN").format(item.revenue)}₫</p>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-xs font-semibold text-[#6F6A7D]">
                                                            <span>📦 Đã đặt: <strong className="text-[#19182B]">{item.quantityOrdered}</strong>{item.maxQuantity ? ` / ${item.maxQuantity}` : ""}</span>
                                                            {item.category && <span>🏷️ {item.category}</span>}
                                                        </div>
                                                        {fillRate !== null && (
                                                            <div className="mt-2">
                                                                <div className="nb-progress">
                                                                    <div
                                                                        className="nb-progress-bar"
                                                                        style={{
                                                                            width: `${fillRate}%`,
                                                                            background: fillRate >= 80 ? "#C8E44D" : fillRate >= 50 ? "#F5E642" : "#A8D4E6",
                                                                        }}
                                                                    />
                                                                </div>
                                                                <p className="text-[11px] font-bold text-[#8D879B] mt-1">{fillRate}% đã đặt</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Outfits list — content card shadow 4px */}
                                <div className="rounded-[14px] border-[2px] border-[#19182B] bg-white p-6 shadow-[4px_4px_0_#19182B]">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-[10px] border-[3px] border-[#19182B] bg-[#FFF1BF] shadow-[3px_3px_0_#19182B] flex items-center justify-center">
                                            <svg className="w-5 h-5 text-[#F59E0B]" viewBox="0 0 24 24" fill="currentColor"><path d="M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2z" /></svg>
                                        </div>
                                        <h2 className="font-black text-[#19182B] text-xl">Sản phẩm trong chiến dịch</h2>
                                    </div>

                                    {campaign.outfits.length === 0 ? (
                                        <p className="font-semibold text-[#8D879B] text-sm text-center py-6">Không có sản phẩm nào</p>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {campaign.outfits.map((outfit) => (
                                                <div key={outfit.campaignOutfitId} className="flex items-center gap-3 p-4 rounded-[12px] border-[3px] border-[#19182B] bg-white shadow-[5px_5px_0_#19182B] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0_#19182B]">
                                                    <div className="w-14 h-14 rounded-[8px] border-[2px] border-[#19182B] bg-[#F6F1E8] overflow-hidden flex-shrink-0 shadow-[2px_2px_0_#19182B]">
                                                        {outfit.mainImageUrl ? (
                                                            <img src={outfit.mainImageUrl} alt={outfit.outfitName} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <svg className="w-7 h-7 text-[#CBCAD7]" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16V7.99C21 6.89 20.1 6 19 6H5C3.9 6 3 6.89 3 7.99V16C3 17.1 3.9 18 5 18H19C20.1 18 21 17.1 21 16Z" /></svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-extrabold text-[#19182B] text-sm truncate">{outfit.outfitName}</p>
                                                        <p className="font-black text-[#8B6BFF] text-sm mt-0.5">{new Intl.NumberFormat("vi-VN").format(outfit.campaignPrice)} VND</p>
                                                        {outfit.maxQuantity && <p className="font-semibold text-[#8D879B] text-xs mt-0.5">Tối đa: {outfit.maxQuantity}</p>}
                                                        {outfit.providerId && (() => {
                                                            const prov = providers.find(p => p.id === outfit.providerId);
                                                            return prov ? (
                                                                <p className="font-semibold text-[#478aea] text-xs mt-1 flex items-center gap-1">
                                                                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" /></svg>
                                                                    {prov.providerName}
                                                                </p>
                                                            ) : null;
                                                        })()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Metadata — shadow 3px */}
                                <div className="rounded-[14px] border-[2px] border-[#19182B] bg-white p-6 shadow-[3px_3px_0_#19182B]">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-9 h-9 rounded-[8px] border-[2px] border-[#19182B] bg-[#DCEBFF] shadow-[2px_2px_0_#19182B] flex items-center justify-center">
                                            <svg className="w-4.5 h-4.5 text-[#478aea]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
                                        </div>
                                        <h2 className="font-black text-[#19182B] text-lg">Thông tin thêm</h2>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="font-extrabold text-[#8D879B] text-xs uppercase tracking-wider mb-1">Ngày tạo</p>
                                            <p className="font-bold text-[#19182B]">{formatDate(campaign.createdAt)}</p>
                                        </div>
                                        <div>
                                            <p className="font-extrabold text-[#8D879B] text-xs uppercase tracking-wider mb-1">Mã chiến dịch</p>
                                            <p className="font-bold text-[#19182B] font-mono text-xs">{campaign.campaignId}</p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </main>
                </div>
            </div>

            {/* Generate Production Order Modal */}
            {showGenModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-md border-2 border-[#1A1A2E] shadow-[4px_4px_0_#1A1A2E] p-8 w-[90%] max-w-[500px]">
                        <h2 className="font-extrabold text-[#1a1a2e] text-xl mb-6 flex items-center gap-2">
                            🏭 Tạo đơn sản xuất
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block font-semibold text-[#4C5769] text-sm mb-1.5">Tên lô sản xuất *</label>
                                <input
                                    type="text"
                                    value={genBatchName}
                                    onChange={e => setGenBatchName(e.target.value)}
                                    className="nb-input w-full"
                                    placeholder="VD: Đơn SX - Chiến dịch Hè 2026"
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-[#4C5769] text-sm mb-1.5">Nhà cung cấp *</label>
                                <select
                                    value={genProviderId}
                                    onChange={e => setGenProviderId(e.target.value)}
                                    className="nb-select w-full"
                                >
                                    <option value="">-- Chọn nhà cung cấp --</option>
                                    {providers.map(p => (
                                        <option key={p.id} value={p.id}>{p.providerName}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block font-semibold text-[#4C5769] text-sm mb-1.5">Hạn giao hàng *</label>
                                <input
                                    type="date"
                                    value={genDeadline}
                                    onChange={e => setGenDeadline(e.target.value)}
                                    className="nb-input w-full"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowGenModal(false)}
                                className="flex-1 nb-btn nb-btn-outline text-sm"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleGenerateProductionOrder}
                                disabled={generating || !genBatchName.trim() || !genProviderId || !genDeadline}
                                className="flex-1 nb-btn nb-btn-purple text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {generating ? "Đang tạo..." : "Tạo đơn sản xuất"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-md border-2 border-[#1A1A2E] shadow-[4px_4px_0_#1A1A2E] animate-in slide-in-from-bottom-4 duration-300 ${toast.type === "success" ? "bg-[#10b981] text-white" : "bg-[#ef4444] text-white"}`}>
                    {toast.type === "success" ? (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                    ) : (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
                    )}
                    <span className="font-bold text-sm">{toast.message}</span>
                </div>
            )}
        </div>
    );
};

export default CampaignDetail;
