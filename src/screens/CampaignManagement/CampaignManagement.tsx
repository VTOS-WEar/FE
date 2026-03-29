import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
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
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useSidebarConfig } from "../../hooks/useSidebarConfig";
import {
    getSchoolProfile,
    getSchoolOutfits,
    publishCampaign,
    getProviders,
    type OutfitDto,
    type CampaignOutfitInput,
    type ProviderDto,
} from "../../lib/api/schools";



/* ── Selected outfit item with campaign price ── */
type SelectedOutfit = {
    outfit: OutfitDto;
    campaignPrice: number;
    providerId?: string | null;
};

/* ────────────────────────────────────────────────────────────────────── */
/* Outfit Selection Card                                                  */
/* ────────────────────────────────────────────────────────────────────── */
function OutfitSelectCard({
    item,
    isSelected,
    onToggle,
}: {
    item: OutfitDto;
    isSelected: boolean;
    onToggle: (item: OutfitDto) => void;
}) {
    const formattedPrice = new Intl.NumberFormat("vi-VN").format(item.price) + " VND";

    return (
        <div
            onClick={() => onToggle(item)}
            className={`relative flex items-center gap-3 p-3 rounded-[10px] cursor-pointer transition-all duration-200 border-2 ${
                isSelected
                    ? "border-[#6938EF] bg-[#F5F3FF] shadow-[3px_3px_0_#6938EF]"
                    : "border-[#1A1A2E] bg-white hover:shadow-[3px_3px_0_#1A1A2E]"
            }`}
        >
            {/* Image */}
            <div className="w-12 h-12 rounded-lg bg-[#E5E7EB] flex-shrink-0 overflow-hidden border-2 border-[#1A1A2E]">
                {item.mainImageURL ? (
                    <img src={item.mainImageURL} alt={item.outfitName} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-[#9CA3AF]" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21 16V7.99C21 6.89 20.1 6 19 6H5C3.9 6 3 6.89 3 7.99V16C3 17.1 3.9 18 5 18H19C20.1 18 21 17.1 21 16Z" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="font-bold text-[#1A1A2E] text-sm truncate">{item.outfitName}</p>
                <p className="font-medium text-xs text-[#97A3B6] truncate">Mã: {item.outfitId.slice(0, 8)}</p>
            </div>

            {/* Price */}
            <span className="font-bold text-[#6938EF] text-sm whitespace-nowrap">{formattedPrice}</span>

            {/* Check indicator */}
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                isSelected ? "border-[#6938EF] bg-[#6938EF]" : "border-[#1A1A2E] bg-white"
            }`}>
                {isSelected && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                )}
            </div>
        </div>
    );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Main Page                                                              */
/* ────────────────────────────────────────────────────────────────────── */
export const CampaignManagement = (): JSX.Element => {
    const navigate = useNavigate();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const sidebarConfig = useSidebarConfig();
    const [schoolName, setSchoolName] = useState("");

    /* ── Form state ── */
    const [campaignName, setCampaignName] = useState("");
    const [description, setDescription] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [deliveryDate, setDeliveryDate] = useState("");
    const [requirePayment, setRequirePayment] = useState(true);
    const [allowSizeExchange, setAllowSizeExchange] = useState(true);

    /* ── Outfits state ── */
    const [outfits, setOutfits] = useState<OutfitDto[]>([]);
    const [outfitsLoading, setOutfitsLoading] = useState(true);
    const [selectedOutfits, setSelectedOutfits] = useState<Map<string, SelectedOutfit>>(new Map());
    const [outfitSearch, setOutfitSearch] = useState("");
    const [showAllOutfits, setShowAllOutfits] = useState(false);

    /* ── Providers state ── */
    const [providers, setProviders] = useState<ProviderDto[]>([]);
    const [providersLoading, setProvidersLoading] = useState(true);

    /* ── Submission ── */
    const [submitting, setSubmitting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const showToast = useCallback((message: string, type: "success" | "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    }, []);

    /* ── Load school profile ── */
    useEffect(() => {
        getSchoolProfile()
            .then((p) => setSchoolName(p.schoolName || ""))
            .catch(() => {});
    }, []);

    /* ── Load outfits ── */
    useEffect(() => {
        setOutfitsLoading(true);
        getSchoolOutfits()
            .then((res) => setOutfits(res.items))
            .catch(() => setOutfits([]))
            .finally(() => setOutfitsLoading(false));

        setProvidersLoading(true);
        getProviders()
            .then(setProviders)
            .catch(() => setProviders([]))
            .finally(() => setProvidersLoading(false));
    }, []);

    /* ── Toggle outfit selection ── */
    const toggleOutfit = (item: OutfitDto) => {
        setSelectedOutfits((prev) => {
            const next = new Map(prev);
            if (next.has(item.outfitId)) {
                next.delete(item.outfitId);
            } else {
                next.set(item.outfitId, { outfit: item, campaignPrice: item.price });
            }
            return next;
        });
    };

    /* ── Filtered outfits ── */
    const filteredOutfits = useMemo(() => {
        let items = outfits;
        if (outfitSearch.trim()) {
            const q = outfitSearch.toLowerCase();
            items = items.filter((o) => o.outfitName.toLowerCase().includes(q));
        }
        return items;
    }, [outfits, outfitSearch]);

    const displayedOutfits = showAllOutfits ? filteredOutfits : filteredOutfits.slice(0, 4);
    const remainingCount = filteredOutfits.length - 4;

    /* ── Submit ── */
    const handleSubmit = async (saveAsDraft: boolean) => {
        if (!campaignName.trim()) {
            showToast("Vui lòng nhập tên đợt đặt hàng", "error");
            return;
        }
        if (!startDate || !endDate) {
            showToast("Vui lòng chọn ngày mở đơn và đóng đơn", "error");
            return;
        }
        if (selectedOutfits.size === 0) {
            showToast("Vui lòng chọn ít nhất 1 sản phẩm", "error");
            return;
        }

        setSubmitting(true);
        try {
            const outfitInputs: CampaignOutfitInput[] = Array.from(selectedOutfits.values()).map((s) => ({
                outfitId: s.outfit.outfitId,
                campaignPrice: s.campaignPrice,
                providerId: s.providerId || null,
            }));

            await publishCampaign({
                campaignName: campaignName.trim(),
                description: description.trim() || null,
                startDate: new Date(startDate).toISOString(),
                endDate: new Date(endDate).toISOString(),
                saveAsDraft,
                outfits: outfitInputs,
            });

            showToast(saveAsDraft ? "Đã lưu bản nháp!" : "Đã xuất bản chiến dịch!", "success");
            setTimeout(() => navigate("/school/campaigns"), 1500);
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : "Có lỗi xảy ra", "error");
        } finally {
            setSubmitting(false);
        }
    };

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
                    <TopNavBar>
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem><BreadcrumbLink href="/school/dashboard" className="font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                                <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                                <BreadcrumbItem><BreadcrumbPage className="font-bold text-[#1A1A2E] text-base">Tạo đơn đặt trước</BreadcrumbPage></BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </TopNavBar>

                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8">
                        {/* Header + Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                            <div>
                                <h1 className="font-extrabold text-[#1A1A2E] text-[28px] lg:text-[32px] leading-[1.22]">Tạo đợt đặt hàng mới</h1>
                                <p className="mt-1 font-medium text-[#4c5769] text-sm lg:text-base">Thiết lập thông tin, thời gian và sản phẩm cho chiến dịch đồng phục.</p>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setShowPreview(true)}
                                    className="nb-btn nb-btn-outline text-sm"
                                >
                                    👁 Xem trước
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSubmit(false)}
                                    disabled={submitting}
                                    className="nb-btn nb-btn-purple text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting && (
                                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M4 12a8 8 0 018-8" strokeLinecap="round" /></svg>
                                    )}
                                    🚀 Xuất bản ngay
                                </button>
                            </div>
                        </div>

                        {/* Two-column layout */}
                        <div className="flex flex-col lg:flex-row gap-6">
                            {/* ── Left column: Main form ── */}
                            <div className="flex-1 space-y-6">
                                {/* Thông tin chung */}
                                <div className="nb-card-static p-6">
                                    <div className="flex items-center gap-2 mb-5">
                                        <div className="nb-stat-icon bg-[#DBEAFE]">
                                            <svg className="w-4 h-4 text-[#3B82F6]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
                                        </div>
                                        <h2 className="font-extrabold text-[#1a1a2e] text-lg">Thông tin chung</h2>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="font-bold text-[#1a1a2e] text-sm mb-1.5 block">Tên đợt đặt hàng <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                value={campaignName}
                                                onChange={(e) => setCampaignName(e.target.value)}
                                                placeholder="Đồng phục Hè 2026"
                                                className="nb-input w-full"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="font-bold text-[#1a1a2e] text-sm mb-1.5 block">Mô tả ngắn</label>
                                            <textarea
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="Thông tin hiển thị cho phụ huynh và học sinh..."
                                                rows={3}
                                                className="nb-input w-full resize-none"
                                            />
                                            <p className="font-medium text-[#97A3B6] text-xs mt-1.5">
                                                Sẽ hiển thị trên trang đặt hàng trực tiếp trong ứng dụng phụ huynh.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Sản phẩm áp dụng */}
                                <div className="nb-card-static p-6">
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="flex items-center gap-2">
                                            <div className="nb-stat-icon bg-[#FEF3C7]">
                                                <svg className="w-4 h-4 text-[#F59E0B]" viewBox="0 0 24 24" fill="currentColor"><path d="M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2zm6 16H6V8h2v2c0 .55.45 1 1 1s1-.45 1-1V8h4v2c0 .55.45 1 1 1s1-.45 1-1V8h2v12z" /></svg>
                                            </div>
                                            <h2 className="font-extrabold text-[#1a1a2e] text-lg">Sản phẩm áp dụng</h2>
                                        </div>
                                        <span className="nb-badge nb-badge-purple">
                                            Đã chọn: {selectedOutfits.size}
                                        </span>
                                    </div>

                                    {/* Search */}
                                    <input
                                        type="text"
                                        value={outfitSearch}
                                        onChange={(e) => setOutfitSearch(e.target.value)}
                                        placeholder="🔍 Tìm kiếm sản phẩm..."
                                        className="nb-input w-full mb-4"
                                    />

                                    {/* Outfits grid */}
                                    {outfitsLoading ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {[1, 2, 3, 4].map((i) => (
                                                <div key={i} className="h-[72px] nb-skeleton rounded-[10px]" />
                                            ))}
                                        </div>
                                    ) : filteredOutfits.length === 0 ? (
                                        <div className="text-center py-8">
                                            <p className="font-medium text-[#97A3B6] text-sm">Chưa có đồng phục nào. Hãy thêm đồng phục trước.</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {displayedOutfits.map((item) => (
                                                    <OutfitSelectCard
                                                        key={item.outfitId}
                                                        item={item}
                                                        isSelected={selectedOutfits.has(item.outfitId)}
                                                        onToggle={toggleOutfit}
                                                    />
                                                ))}
                                            </div>
                                            {!showAllOutfits && remainingCount > 0 && (
                                                <button
                                                    onClick={() => setShowAllOutfits(true)}
                                                    className="mt-4 w-full text-center font-bold text-[#6938EF] text-sm hover:underline"
                                                >
                                                    Xem thêm {remainingCount} sản phẩm khác
                                                </button>
                                            )}
                                            {showAllOutfits && filteredOutfits.length > 4 && (
                                                <button
                                                    onClick={() => setShowAllOutfits(false)}
                                                    className="mt-4 w-full text-center font-bold text-[#6938EF] text-sm hover:underline"
                                                >
                                                    Thu gọn
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* ── Right column: Time + Rules ── */}
                            <div className="lg:w-[320px] xl:w-[340px] flex-shrink-0 space-y-6">
                                {/* Thời gian */}
                                <div className="nb-card-static p-6">
                                    <div className="flex items-center gap-2 mb-5">
                                        <div className="nb-stat-icon bg-[#EDE9FE]">
                                            <svg className="w-4 h-4 text-[#6938EF]" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" /></svg>
                                        </div>
                                        <h2 className="font-extrabold text-[#1a1a2e] text-lg">Thời gian</h2>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="font-bold text-[#6938EF] text-[10px] uppercase tracking-wider mb-1.5 block">Mở đơn</label>
                                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="nb-input w-full text-xs" />
                                            </div>
                                            <div>
                                                <label className="font-bold text-[#EF4444] text-[10px] uppercase tracking-wider mb-1.5 block">Đóng đơn</label>
                                                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="nb-input w-full text-xs" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="font-bold text-[#1a1a2e] text-sm mb-1.5 block">Ngày dự kiến trả hàng</label>
                                            <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="nb-input w-full text-xs" />
                                        </div>
                                    </div>
                                </div>

                                {/* Quy định */}
                                <div className="nb-card-static p-6">
                                    <div className="flex items-center gap-2 mb-5">
                                        <div className="nb-stat-icon bg-[#D1FAE5]">
                                            <svg className="w-4 h-4 text-[#10B981]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" /></svg>
                                        </div>
                                        <h2 className="font-extrabold text-[#1a1a2e] text-lg">Quy định</h2>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Thanh toán ngay */}
                                        <label className="flex items-start gap-3 cursor-pointer group">
                                            <div className={`w-5 h-5 rounded mt-0.5 border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                                requirePayment ? "border-[#6938EF] bg-[#6938EF]" : "border-[#1A1A2E] bg-white group-hover:border-[#6938EF]"
                                            }`}>
                                                {requirePayment && (
                                                    <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                                                )}
                                            </div>
                                            <input type="checkbox" checked={requirePayment} onChange={(e) => setRequirePayment(e.target.checked)} className="hidden" />
                                            <div>
                                                <p className="font-bold text-[#1A1A2E] text-sm">Thanh toán ngay</p>
                                                <p className="font-medium text-[#97A3B6] text-xs mt-0.5">Yêu cầu phụ huynh thanh toán khi đặt đơn.</p>
                                            </div>
                                        </label>

                                        {/* Cho phép đổi size */}
                                        <label className="flex items-start gap-3 cursor-pointer group">
                                            <div className={`w-5 h-5 rounded mt-0.5 border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                                allowSizeExchange ? "border-[#6938EF] bg-[#6938EF]" : "border-[#1A1A2E] bg-white group-hover:border-[#6938EF]"
                                            }`}>
                                                {allowSizeExchange && (
                                                    <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                                                )}
                                            </div>
                                            <input type="checkbox" checked={allowSizeExchange} onChange={(e) => setAllowSizeExchange(e.target.checked)} className="hidden" />
                                            <div>
                                                <p className="font-bold text-[#1A1A2E] text-sm">Cho phép đổi size</p>
                                                <p className="font-medium text-[#97A3B6] text-xs mt-0.5">Được phép đổi size trong vòng 7 ngày sau khi nhận.</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Lưu bản nháp button */}
                                <button
                                    type="button"
                                    onClick={() => handleSubmit(true)}
                                    disabled={submitting}
                                    className="nb-btn nb-btn-outline w-full py-3 text-sm disabled:opacity-50"
                                >
                                    {submitting && (
                                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M4 12a8 8 0 018-8" strokeLinecap="round" /></svg>
                                    )}
                                    💾 Lưu bản nháp
                                </button>

                                {/* Nhà cung cấp */}
                                {selectedOutfits.size > 0 && (
                                    <div className="nb-card-static p-6">
                                        <div className="flex items-center gap-2 mb-5">
                                            <div className="nb-stat-icon bg-[#DBEAFE]">
                                                <svg className="w-4 h-4 text-[#3B82F6]" viewBox="0 0 24 24" fill="currentColor"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" /></svg>
                                            </div>
                                            <h2 className="font-extrabold text-[#1a1a2e] text-lg">Nhà cung cấp</h2>
                                        </div>
                                        <p className="font-medium text-[#97A3B6] text-xs mb-4">Chọn nhà cung cấp cho từng sản phẩm (không bắt buộc, có thể chọn sau).</p>
                                        <div className="space-y-3">
                                            {Array.from(selectedOutfits.values()).map((s) => (
                                                <div key={s.outfit.outfitId} className="space-y-1.5">
                                                    <p className="font-bold text-[#1A1A2E] text-xs truncate">{s.outfit.outfitName}</p>
                                                    <select
                                                        value={s.providerId || ""}
                                                        onChange={(e) => {
                                                            const val = e.target.value || null;
                                                            setSelectedOutfits((prev) => {
                                                                const next = new Map(prev);
                                                                const existing = next.get(s.outfit.outfitId);
                                                                if (existing) {
                                                                    next.set(s.outfit.outfitId, { ...existing, providerId: val });
                                                                }
                                                                return next;
                                                            });
                                                        }}
                                                        className="nb-select w-full text-xs"
                                                    >
                                                        <option value="">-- Chưa chọn --</option>
                                                        {providersLoading ? (
                                                            <option disabled>Đang tải...</option>
                                                        ) : (
                                                            providers.map((p) => (
                                                                <option key={p.id} value={p.id}>{p.providerName}</option>
                                                            ))
                                                        )}
                                                    </select>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* Preview Modal — NB style */}
            {showPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowPreview(false)} />
                    <div className="relative bg-white rounded-md w-full max-w-[600px] mx-4 max-h-[85vh] overflow-y-auto border-2 border-[#1A1A2E] shadow-[4px_4px_0_#1A1A2E]">
                        <div className="flex items-center justify-between px-6 py-5 border-b-2 border-[#1A1A2E]">
                            <h2 className="font-extrabold text-[#1a1a2e] text-xl">Xem trước chiến dịch</h2>
                            <button onClick={() => setShowPreview(false)} className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-[#1A1A2E] hover:bg-[#F3F4F6] font-bold">✕</button>
                        </div>
                        <div className="px-6 py-5 space-y-5">
                            {/* Name */}
                            <div>
                                <p className="font-bold text-[#9CA3AF] text-xs uppercase tracking-wider mb-1">Tên chiến dịch</p>
                                <p className="font-extrabold text-[#1A1A2E] text-lg">{campaignName || "(Chưa nhập)"}</p>
                            </div>
                            {/* Description */}
                            {description && (
                                <div>
                                    <p className="font-bold text-[#9CA3AF] text-xs uppercase tracking-wider mb-1">Mô tả</p>
                                    <p className="font-medium text-[#4C5769] text-sm">{description}</p>
                                </div>
                            )}
                            {/* Dates */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="font-bold text-[#9CA3AF] text-xs uppercase tracking-wider mb-1">Mở đơn</p>
                                    <p className="font-bold text-[#1A1A2E] text-sm">{startDate ? new Date(startDate).toLocaleDateString("vi-VN") : "—"}</p>
                                </div>
                                <div>
                                    <p className="font-bold text-[#9CA3AF] text-xs uppercase tracking-wider mb-1">Đóng đơn</p>
                                    <p className="font-bold text-[#1A1A2E] text-sm">{endDate ? new Date(endDate).toLocaleDateString("vi-VN") : "—"}</p>
                                </div>
                                <div>
                                    <p className="font-bold text-[#9CA3AF] text-xs uppercase tracking-wider mb-1">Trả hàng</p>
                                    <p className="font-bold text-[#1A1A2E] text-sm">{deliveryDate ? new Date(deliveryDate).toLocaleDateString("vi-VN") : "—"}</p>
                                </div>
                            </div>
                            {/* Products */}
                            <div>
                                <p className="font-bold text-[#9CA3AF] text-xs uppercase tracking-wider mb-2">Sản phẩm ({selectedOutfits.size})</p>
                                {selectedOutfits.size === 0 ? (
                                    <p className="font-medium text-[#97A3B6] text-sm italic">Chưa chọn sản phẩm nào</p>
                                ) : (
                                    <div className="space-y-2">
                                        {Array.from(selectedOutfits.values()).map((s) => (
                                            <div key={s.outfit.outfitId} className="flex items-center gap-3 p-2.5 rounded-lg border-2 border-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E]">
                                                <div className="w-10 h-10 rounded-lg bg-[#E5E7EB] overflow-hidden flex-shrink-0 border border-[#1A1A2E]">
                                                    {s.outfit.mainImageURL ? (
                                                        <img src={s.outfit.mainImageURL} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center"><svg className="w-5 h-5 text-[#9CA3AF]" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16V7.99C21 6.89 20.1 6 19 6H5C3.9 6 3 6.89 3 7.99V16C3 17.1 3.9 18 5 18H19C20.1 18 21 17.1 21 16Z" /></svg></div>
                                                    )}
                                                </div>
                                                <span className="font-bold text-[#1A1A2E] text-sm flex-1">{s.outfit.outfitName}</span>
                                                <span className="font-extrabold text-[#6938EF] text-sm">{new Intl.NumberFormat("vi-VN").format(s.campaignPrice)}đ</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {/* Rules */}
                            <div className="flex items-center gap-3">
                                <span className={`nb-badge ${requirePayment ? "nb-badge-green" : "bg-[#F3F4F6] text-[#6B7280]"}`}>
                                    {requirePayment ? "✓" : "✗"} Thanh toán ngay
                                </span>
                                <span className={`nb-badge ${allowSizeExchange ? "nb-badge-green" : "bg-[#F3F4F6] text-[#6B7280]"}`}>
                                    {allowSizeExchange ? "✓" : "✗"} Cho phép đổi size
                                </span>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t-2 border-[#1A1A2E] flex justify-end gap-3">
                            <button onClick={() => setShowPreview(false)} className="nb-btn nb-btn-outline text-sm">Đóng</button>
                            <button onClick={() => { setShowPreview(false); handleSubmit(false); }} disabled={submitting} className="nb-btn nb-btn-purple text-sm disabled:opacity-50">🚀 Xuất bản ngay</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast — NB style */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-md border-2 border-[#1A1A2E] shadow-[4px_4px_0_#1A1A2E] font-bold text-sm animate-in slide-in-from-bottom-4 duration-300 ${toast.type === "success" ? "bg-[#D1FAE5] text-[#065F46]" : "bg-[#FEE2E2] text-[#991B1B]"}`}>
                    {toast.type === "success" ? "✅" : "❌"}
                    <span>{toast.message}</span>
                </div>
            )}
        </div>
    );
};

export default CampaignManagement;
