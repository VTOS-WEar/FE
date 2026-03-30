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
    lockCampaign,
    getProviders,
    type CampaignDetailDto,
    type ProviderDto,
} from "../../lib/api/schools";
import { generateProductionOrder } from "../../lib/api/productionOrders";



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
        <span className={`inline-flex items-center px-3 py-1.5 rounded-full border text-sm font-semibold ${cfg.color} ${cfg.bg} ${cfg.border}`}>
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
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const sidebarConfig = useSidebarConfig();
    const [schoolName, setSchoolName] = useState("");
    const [campaign, setCampaign] = useState<CampaignDetailDto | null>(null);
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
                            <div className="bg-white rounded-[16px] p-8 border border-[#cbcad7] animate-pulse space-y-4">
                                <div className="h-8 bg-gray-200 rounded w-1/3" />
                                <div className="h-5 bg-gray-200 rounded w-1/2" />
                                <div className="h-20 bg-gray-200 rounded w-full" />
                            </div>
                        ) : !campaign ? (
                            <div className="bg-white rounded-[16px] p-12 border border-[#cbcad7] text-center">
                                <p className="font-semibold text-[#4C5769] text-lg">Không tìm thấy chiến dịch</p>
                                <button onClick={() => navigate("/school/campaigns")} className="mt-4 px-5 py-2.5 rounded-[10px] bg-[#6938EF] text-white font-semibold text-sm">Quay lại</button>
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
                                                <h1 className="font-bold text-black text-[28px] lg:text-[32px] leading-[1.22]">{campaign.campaignName}</h1>
                                                <StatusBadge status={campaign.status} />
                                            </div>
                                            <p className="font-medium text-[#4c5769] text-sm">{campaign.description || "Không có mô tả"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        {isActive && (
                                            <button
                                                onClick={handleLock}
                                                disabled={locking}
                                                className="px-5 py-2.5 rounded-[10px] bg-[#EF4444] hover:bg-[#DC2626] text-white font-semibold text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                                            >
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" /></svg>
                                                Khóa chiến dịch
                                            </button>
                                        )}
                                        {campaign?.status === "Locked" && (
                                            <button
                                                onClick={openGenModal}
                                                disabled={generating}
                                                className="px-5 py-2.5 rounded-[10px] bg-[#6938EF] hover:bg-[#5B2ED4] text-white font-semibold text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                                            >
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" /></svg>
                                                {generating ? "Đang tạo..." : "Tạo đơn sản xuất"}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Stats cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="nb-card-static p-5">
                                        <p className="font-semibold text-[#97A3B6] text-xs uppercase tracking-wider mb-1">Trạng thái</p>
                                        <StatusBadge status={campaign.status} />
                                    </div>
                                    <div className="nb-card-static p-5">
                                        <p className="font-semibold text-[#97A3B6] text-xs uppercase tracking-wider mb-1">Thời gian</p>
                                        <p className="font-bold text-[#1A1A2E] text-base">{formatDate(campaign.startDate)} — {formatDate(campaign.endDate)}</p>
                                        {isActive && daysLeft > 0 && <p className="font-semibold text-[#6938EF] text-xs mt-1">Còn {daysLeft} ngày</p>}
                                    </div>
                                    <div className="nb-card-static p-5">
                                        <p className="font-semibold text-[#97A3B6] text-xs uppercase tracking-wider mb-1">Sản phẩm</p>
                                        <p className="font-bold text-[#1A1A2E] text-2xl">{campaign.outfits.length}</p>
                                    </div>
                                    <div className="nb-card-static p-5">
                                        <p className="font-semibold text-[#97A3B6] text-xs uppercase tracking-wider mb-1">Đơn hàng</p>
                                        <p className="font-bold text-[#1A1A2E] text-2xl">{campaign.totalOrders}</p>
                                    </div>
                                </div>

                                {/* Outfits list */}
                                <div className="nb-card-static p-6">
                                    <div className="flex items-center gap-2 mb-5">
                                        <div className="w-6 h-6 rounded-full bg-[#FEF3C7] flex items-center justify-center">
                                            <svg className="w-3.5 h-3.5 text-[#F59E0B]" viewBox="0 0 24 24" fill="currentColor"><path d="M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2z" /></svg>
                                        </div>
                                        <h2 className="font-bold text-[#1a1a2e] text-lg">Sản phẩm trong chiến dịch</h2>
                                    </div>

                                    {campaign.outfits.length === 0 ? (
                                        <p className="font-medium text-[#97A3B6] text-sm text-center py-6">Không có sản phẩm nào</p>
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
                                                        <p className="font-semibold text-[#1A1A2E] text-sm truncate">{outfit.outfitName}</p>
                                                        <p className="font-bold text-[#6938EF] text-sm mt-0.5">{new Intl.NumberFormat("vi-VN").format(outfit.campaignPrice)} VND</p>
                                                        {outfit.maxQuantity && <p className="font-medium text-[#97A3B6] text-xs mt-0.5">Tối đa: {outfit.maxQuantity}</p>}
                                                        {outfit.providerId && (() => {
                                                            const prov = providers.find(p => p.id === outfit.providerId);
                                                            return prov ? (
                                                                <p className="font-medium text-[#3B82F6] text-xs mt-1 flex items-center gap-1">
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

                                {/* Info */}
                                <div className="nb-card-static p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-6 h-6 rounded-full bg-[#E8F4FD] flex items-center justify-center">
                                            <svg className="w-3.5 h-3.5 text-[#3B82F6]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
                                        </div>
                                        <h2 className="font-bold text-[#1a1a2e] text-lg">Thông tin thêm</h2>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="font-semibold text-[#97A3B6] text-xs uppercase tracking-wider mb-1">Ngày tạo</p>
                                            <p className="font-medium text-[#1A1A2E]">{formatDate(campaign.createdAt)}</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-[#97A3B6] text-xs uppercase tracking-wider mb-1">Mã chiến dịch</p>
                                            <p className="font-medium text-[#1A1A2E] font-mono text-xs">{campaign.campaignId}</p>
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
