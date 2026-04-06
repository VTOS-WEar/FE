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
    type OutfitDto,
    type CampaignOutfitInput,
} from "../../lib/api/schools";
import {
    getContractedProvidersForOutfits,
    type ContractedProviderDto,
} from "../../lib/api/contracts";

/* ── OUTFIT_TYPE labels ── */
const OUTFIT_TYPE_LABELS: Record<number, string> = { 1: "Đồng phục", 2: "Đồ thể thao", 3: "Phụ kiện", 4: "Khác" };

/* ── Selected outfit item with campaign price ── */
type SelectedOutfit = {
    outfit: OutfitDto;
    campaignPrice: number;
    providerId?: string | null;
};

/* ────────────────────────────────────────────────────────────────────── */
/* Brutal Design Sub-components                                          */
/* ────────────────────────────────────────────────────────────────────── */
const SECTION_ICONS_TONE: Record<string, string> = {
    info: "bg-[#DCEBFF]",
    warning: "bg-[#FFF1BF]",
    success: "bg-[#D9F8E8]",
    primary: "bg-[#E9E1FF]",
    blue: "bg-[#DBEAFE]",
};

function SectionIcon({ children, tone = "info" }: { children: React.ReactNode; tone?: string }) {
    return (
        <div className={`flex h-11 w-11 items-center justify-center rounded-[10px] border-[3px] border-[#19182B] shadow-[3px_3px_0_#19182B] ${SECTION_ICONS_TONE[tone] || SECTION_ICONS_TONE.info}`}>
            <span className="text-[18px]">{children}</span>
        </div>
    );
}

const brutalInputClass = "w-full rounded-[10px] border-[2px] border-[#19182B] bg-white px-4 py-3 text-[15px] font-semibold text-[#19182B] shadow-[3px_3px_0_#19182B] outline-none transition-all placeholder:text-[#9A95A8] focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0_#19182B]";

/* ────────────────────────────────────────────────────────────────────── */
/* Outfit Selection Card — Brutal Concept                                */
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
    const hasVariants = true; // simplified
    const typeLabel = OUTFIT_TYPE_LABELS[item.outfitType] || "Khác";

    return (
        <button
            onClick={() => onToggle(item)}
            className={`group w-full rounded-[14px] border-[3px] border-[#19182B] p-4 text-left transition-all ${
                isSelected
                    ? "bg-[#F2ECFF] shadow-[5px_5px_0_#19182B]"
                    : "bg-white shadow-[3px_3px_0_#19182B] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B]"
            }`}
        >
            <div className="flex items-start gap-4">
                {/* Outfit image */}
                <div className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[12px] border-[2px] border-[#19182B] shadow-[2px_2px_0_#19182B] ${
                    isSelected ? "ring-2 ring-[#8B6BFF] ring-offset-1" : ""
                } ${item.mainImageURL ? "bg-white" : isSelected ? "bg-[#8B6BFF] text-white" : "bg-[#ECEAF2] text-[#7A7489]"}`}>
                    {item.mainImageURL ? (
                        <img src={item.mainImageURL} alt={item.outfitName} className="h-full w-full object-cover" />
                    ) : (
                        <span className="text-[24px]">👕</span>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h3 className="text-[16px] font-black leading-tight text-[#19182B]">{item.outfitName}</h3>
                            <p className="mt-1 text-[13px] font-bold text-[#6F6A7D]">Mã: {item.outfitId.slice(0, 8)}</p>
                        </div>
                        <div className="shrink-0 rounded-[10px] border-[2px] border-[#19182B] bg-white px-3 py-2 text-[14px] font-black text-[#7C56FF] shadow-[2px_2px_0_#19182B]">
                            {formattedPrice}
                        </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                            <span className="rounded-full border-[2px] border-[#19182B] bg-white px-3 py-1 text-[12px] font-extrabold shadow-[2px_2px_0_#19182B]">
                                {typeLabel}
                            </span>
                            {hasVariants && (
                                <span className="rounded-full border-[2px] border-[#19182B] bg-white px-3 py-1 text-[12px] font-extrabold shadow-[2px_2px_0_#19182B]">
                                    Có sẵn size
                                </span>
                            )}
                        </div>

                        <div className={`flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-[#19182B] shadow-[2px_2px_0_#19182B] ${
                            isSelected ? "bg-[#8B6BFF] text-white" : "bg-white text-transparent"
                        }`}>
                            ✓
                        </div>
                    </div>
                </div>
            </div>
        </button>
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

    /* ── Contracted providers state ── */
    const [contractedProviders, setContractedProviders] = useState<Record<string, ContractedProviderDto[]>>({});

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

        // Load contracted providers per outfit
        getContractedProvidersForOutfits()
            .then((res) => setContractedProviders(res.outfitProviders || {}))
            .catch(() => setContractedProviders({}));
    }, []);

    /* ── Toggle outfit selection ── */
    const toggleOutfit = (item: OutfitDto) => {
        setSelectedOutfits((prev) => {
            const next = new Map(prev);
            if (next.has(item.outfitId)) {
                next.delete(item.outfitId);
            } else {
                // Auto-assign provider if exactly 1 contracted provider exists
                const providers = contractedProviders[item.outfitId] || [];
                const autoProviderId = providers.length === 1 ? providers[0].providerId : null;
                next.set(item.outfitId, { outfit: item, campaignPrice: item.price, providerId: autoProviderId });
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
                                <BreadcrumbItem><BreadcrumbLink href="/school/dashboard" className="font-bold text-[#6F6A7D] text-sm">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                                <BreadcrumbSeparator className="text-[#6F6A7D] font-black">/</BreadcrumbSeparator>
                                <BreadcrumbItem><BreadcrumbPage className="font-black text-[#19182B] text-sm">Tạo đơn đặt trước</BreadcrumbPage></BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </TopNavBar>

                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8">
                        {/* ── Header + Actions ── */}
                        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between mb-8">
                            <div className="max-w-3xl">
                                <h1 className="text-[32px] font-black leading-none text-[#19182B] lg:text-[38px]">Tạo đợt đặt hàng mới</h1>
                            </div>
                            <div className="flex flex-wrap gap-3 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setShowPreview(true)}
                                    className="rounded-[10px] border-[3px] border-[#19182B] bg-white px-5 py-3 text-[14px] font-extrabold text-[#19182B] shadow-[4px_4px_0_#19182B] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                                >
                                    👁 Xem trước
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSubmit(false)}
                                    disabled={submitting}
                                    className="flex items-center gap-2 rounded-[10px] border-[3px] border-[#19182B] bg-[#8B6BFF] px-5 py-3 text-[14px] font-extrabold text-white shadow-[4px_4px_0_#19182B] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting && (
                                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M4 12a8 8 0 018-8" strokeLinecap="round" /></svg>
                                    )}
                                    🚀 Xuất bản ngay
                                </button>
                            </div>
                        </div>

                        {/* ── Two-column layout ── */}
                        <div className="grid gap-6 xl:grid-cols-[1.6fr_0.8fr]">
                            {/* ── Left column: Main panels ── */}
                            <div className="flex flex-col gap-6">

                                {/* ═══ Thông tin chung — MainPanel ═══ */}
                                <section className="rounded-[18px] border-[3px] border-[#19182B] bg-white shadow-[6px_6px_0_#19182B]">
                                    <div className="p-6 md:p-7">
                                        <div className="flex items-center gap-4">
                                            <SectionIcon tone="info">ℹ️</SectionIcon>
                                            <div>
                                                <h2 className="text-[24px] font-black leading-none text-[#19182B]">Thông tin chung</h2>
                                            </div>
                                        </div>

                                        <div className="mt-6 grid gap-5">
                                            <div>
                                                <label className="block">
                                                    <div className="mb-2 text-[14px] font-extrabold text-[#19182B]">
                                                        Tên đợt đặt hàng <span className="ml-1 text-[#FF6B57]">*</span>
                                                    </div>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={campaignName}
                                                    onChange={(e) => setCampaignName(e.target.value)}
                                                    placeholder="Đồng phục Hè 2026"
                                                    className={brutalInputClass}
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block">
                                                    <div className="mb-2 text-[14px] font-extrabold text-[#19182B]">Mô tả ngắn</div>
                                                    <p className="mb-2 text-[12px] font-bold text-[#8D879B]">Sẽ hiển thị trên trang đặt hàng trực tiếp trong ứng dụng phụ huynh.</p>
                                                </label>
                                                <textarea
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    placeholder="Thông tin hiển thị cho phụ huynh và học sinh, nêu rõ thời gian nhận đơn và cách thanh toán."
                                                    rows={4}
                                                    className={`min-h-[112px] resize-none ${brutalInputClass}`}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* ═══ Sản phẩm áp dụng — MainPanel ═══ */}
                                <section className="rounded-[18px] border-[3px] border-[#19182B] bg-white shadow-[6px_6px_0_#19182B]">
                                    <div className="p-6 md:p-7">
                                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                            <div className="flex items-center gap-4">
                                                <SectionIcon tone="warning">🛍️</SectionIcon>
                                                <div>
                                                    <h2 className="text-[24px] font-black leading-none text-[#19182B]">Sản phẩm áp dụng</h2>
                                                    <p className="mt-2 text-[14px] font-semibold text-[#6F6A7D]">
                                                        Chọn những sản phẩm sẽ xuất hiện trong đợt đặt hàng.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="inline-flex w-fit items-center gap-2 rounded-full border-[3px] border-[#19182B] bg-[#E9E1FF] px-4 py-2 text-[13px] font-black text-[#5E3FE0] shadow-[3px_3px_0_#19182B]">
                                                Đã chọn: {selectedOutfits.size}
                                            </div>
                                        </div>

                                        {/* Search + Filters */}
                                        <div className="mt-6 rounded-[14px] border-[2px] border-[#19182B] bg-[#FFFDF9] p-4 shadow-[3px_3px_0_#19182B]">
                                            {/* Search input */}
                                            <div className="relative">
                                                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[16px] text-[#6F6A7D]">🔎</span>
                                                <input
                                                    type="text"
                                                    value={outfitSearch}
                                                    onChange={(e) => setOutfitSearch(e.target.value)}
                                                    placeholder="Tìm kiếm sản phẩm..."
                                                    className="w-full rounded-[10px] border-[2px] border-[#19182B] bg-white py-3 pl-12 pr-4 text-[15px] font-semibold text-[#19182B] shadow-[3px_3px_0_#19182B] outline-none transition-all placeholder:text-[#9A95A8] focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0_#19182B]"
                                                />
                                            </div>

                                            {/* Filter chips */}
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                <button
                                                    onClick={() => setOutfitSearch("")}
                                                    className={`rounded-full border-[2px] border-[#19182B] px-3 py-1 text-[12px] font-extrabold shadow-[2px_2px_0_#19182B] transition-all ${
                                                        !outfitSearch.trim() ? "bg-[#8B6BFF] text-white" : "bg-white text-[#19182B] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#19182B]"
                                                    }`}
                                                >
                                                    Tất cả
                                                </button>
                                                {["Đồng phục", "Đồ thể thao", "Phụ kiện"].map((label) => (
                                                    <button
                                                        key={label}
                                                        onClick={() => setOutfitSearch(label)}
                                                        className={`rounded-full border-[2px] border-[#19182B] px-3 py-1 text-[12px] font-extrabold shadow-[2px_2px_0_#19182B] transition-all ${
                                                            outfitSearch === label ? "bg-[#8B6BFF] text-white" : "bg-white text-[#19182B] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#19182B]"
                                                        }`}
                                                    >
                                                        {label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Outfits grid */}
                                        {outfitsLoading ? (
                                            <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
                                                {[1, 2, 3, 4].map((i) => (
                                                    <div key={i} className="h-[100px] rounded-[14px] border-[3px] border-[#19182B]/10 bg-[#F2ECFF] animate-pulse" />
                                                ))}
                                            </div>
                                        ) : filteredOutfits.length === 0 ? (
                                            <div className="mt-6 rounded-[14px] border-[2px] border-dashed border-[#8B6BFF] bg-[#F2ECFF]/50 py-10 text-center">
                                                <p className="text-[15px] font-extrabold text-[#19182B]">Chưa có đồng phục nào</p>
                                                <p className="mt-1 text-[13px] font-bold text-[#6F6A7D]">Hãy thêm đồng phục trước.</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="mt-4 grid gap-4 xl:grid-cols-2">
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
                                                        className="mt-4 w-full rounded-[10px] border-[2px] border-[#19182B] bg-white py-2.5 text-center text-[14px] font-extrabold text-[#8B6BFF] shadow-[3px_3px_0_#19182B] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B]"
                                                    >
                                                        Xem thêm {remainingCount} sản phẩm khác
                                                    </button>
                                                )}
                                                {showAllOutfits && filteredOutfits.length > 4 && (
                                                    <button
                                                        onClick={() => setShowAllOutfits(false)}
                                                        className="mt-4 w-full rounded-[10px] border-[2px] border-[#19182B] bg-white py-2.5 text-center text-[14px] font-extrabold text-[#8B6BFF] shadow-[3px_3px_0_#19182B] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B]"
                                                    >
                                                        Thu gọn
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </section>
                            </div>

                            {/* ── Right column: Side panels ── */}
                            <div className="flex flex-col gap-6">

                                {/* ═══ Thời gian — SidePanel ═══ */}
                                <section className="rounded-[18px] border-[3px] border-[#19182B] bg-white shadow-[4px_4px_0_#19182B]">
                                    <div className="p-6">
                                        <div className="flex items-center gap-4">
                                            <SectionIcon tone="primary">⏰</SectionIcon>
                                            <div>
                                                <h2 className="text-[22px] font-black leading-none text-[#19182B]">Thời gian</h2>
                                            </div>
                                        </div>

                                        <div className="mt-6 grid gap-4">
                                            <div>
                                                <label className="mb-2 block text-[14px] font-extrabold text-[#19182B]">Mở đơn</label>
                                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={brutalInputClass} />
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-[14px] font-extrabold text-[#19182B]">Đóng đơn</label>
                                                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={brutalInputClass} />
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-[14px] font-extrabold text-[#19182B]">Ngày dự kiến trả hàng</label>
                                                <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className={brutalInputClass} />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* ═══ Quy định — SidePanel ═══ */}
                                <section className="rounded-[18px] border-[3px] border-[#19182B] bg-white shadow-[4px_4px_0_#19182B]">
                                    <div className="p-6">
                                        <div className="flex items-center gap-4">
                                            <SectionIcon tone="success">🛡️</SectionIcon>
                                            <div>
                                                <h2 className="text-[22px] font-black leading-none text-[#19182B]">Quy định</h2>
                                            </div>
                                        </div>

                                        <div className="mt-6 grid gap-3">
                                            {/* Thanh toán ngay */}
                                            <label className="flex items-start gap-3 rounded-[12px] border-[2px] border-[#19182B] bg-white p-3 shadow-[2px_2px_0_#19182B] cursor-pointer">
                                                <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] border-[2px] border-[#19182B] text-[12px] font-black shadow-[2px_2px_0_#19182B] ${
                                                    requirePayment ? "bg-[#8B6BFF] text-white" : "bg-[#F6F1E8] text-transparent"
                                                }`}>
                                                    ✓
                                                </div>
                                                <input type="checkbox" checked={requirePayment} onChange={(e) => setRequirePayment(e.target.checked)} className="hidden" />
                                                <div>
                                                    <div className="text-[15px] font-black text-[#19182B]">Thanh toán ngay</div>
                                                    <p className="mt-1 text-[13px] font-bold leading-5 text-[#8D879B]">Yêu cầu phụ huynh thanh toán khi đặt đơn để giảm đơn ảo.</p>
                                                </div>
                                            </label>

                                            {/* Cho phép đổi size */}
                                            <label className="flex items-start gap-3 rounded-[12px] border-[2px] border-[#19182B] bg-white p-3 shadow-[2px_2px_0_#19182B] cursor-pointer">
                                                <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] border-[2px] border-[#19182B] text-[12px] font-black shadow-[2px_2px_0_#19182B] ${
                                                    allowSizeExchange ? "bg-[#8B6BFF] text-white" : "bg-[#F6F1E8] text-transparent"
                                                }`}>
                                                    ✓
                                                </div>
                                                <input type="checkbox" checked={allowSizeExchange} onChange={(e) => setAllowSizeExchange(e.target.checked)} className="hidden" />
                                                <div>
                                                    <div className="text-[15px] font-black text-[#19182B]">Cho phép đổi size</div>
                                                    <p className="mt-1 text-[13px] font-bold leading-5 text-[#8D879B]">Được phép đổi size trong vòng 7 ngày sau khi nhận hàng.</p>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </section>

                                {/* Nhà cung cấp (Contract-based) */}
                                {selectedOutfits.size > 0 && (
                                    <section className="rounded-[18px] border-[3px] border-[#19182B] bg-white shadow-[4px_4px_0_#19182B]">
                                        <div className="p-6">
                                            <div className="flex items-center gap-4">
                                                <SectionIcon tone="blue">🚚</SectionIcon>
                                                <div>
                                                    <h2 className="text-[22px] font-black leading-none text-[#19182B]">Nhà cung cấp</h2>
                                                    <p className="mt-2 text-[13px] font-bold text-[#6F6A7D]">Tự động gán từ hợp đồng đã duyệt.</p>
                                                </div>
                                            </div>
                                            <div className="mt-6 space-y-5">
                                                {Array.from(selectedOutfits.values()).map((s) => {
                                                    const providers = contractedProviders[s.outfit.outfitId] || [];
                                                    return (
                                                        <div key={s.outfit.outfitId} className="space-y-2">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <p className="text-[14px] font-black text-[#19182B] truncate">{s.outfit.outfitName}</p>
                                                                <span className="flex-shrink-0 rounded-full border-[2px] border-[#19182B] bg-[#D9F8E8] px-2.5 py-0.5 text-[11px] font-extrabold text-[#065F46] shadow-[1px_1px_0_#19182B]">
                                                                    Giá bán: {s.campaignPrice.toLocaleString("vi-VN")}đ (cố định)
                                                                </span>
                                                            </div>
                                                            {providers.length === 0 ? (
                                                                <div className="flex items-center gap-2 rounded-[8px] border-[2px] border-dashed border-[#D1C9E0] bg-[#FAFAFA] px-3 py-2">
                                                                    <span className="text-[13px]">⚠️</span>
                                                                    <span className="text-[13px] font-bold text-[#8D879B]">Chưa có hợp đồng — sẽ gán NCC sau</span>
                                                                </div>
                                                            ) : providers.length === 1 ? (
                                                                <div className="flex items-center gap-2 rounded-[10px] border-[2px] border-[#19182B] bg-[#D9F8E8] px-3 py-2 shadow-[2px_2px_0_#19182B]">
                                                                    <span className="text-[13px]">✅</span>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[13px] font-black text-[#19182B]">{providers[0].providerName}</span>
                                                                        <span className="text-[10px] font-bold text-[#6F6A7D]">HĐ: {providers[0].contractName}</span>
                                                                    </div>
                                                                    <span className="ml-auto text-[12px] font-bold text-[#6F6A7D]">
                                                                        Giá SX: {providers[0].pricePerUnit.toLocaleString("vi-VN")}đ <span className="text-[10px] text-[#9A95A8]">(tham khảo)</span>
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-1.5">
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
                                                                        className={brutalInputClass}
                                                                    >
                                                                        <option value="">-- Chọn nhà cung cấp --</option>
                                                                        {providers.map((p) => (
                                                                            <option key={`${p.providerId}-${p.contractId}`} value={p.providerId}>
                                                                                {p.providerName} (HĐ: {p.contractName}) — Giá SX: {p.pricePerUnit.toLocaleString("vi-VN")}đ (tham khảo)
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    {s.providerId && (() => {
                                                                        const selected = providers.find(p => p.providerId === s.providerId);
                                                                        if (!selected) return null;
                                                                        return (
                                                                            <p className="text-[11px] font-bold text-[#8D879B] px-1">
                                                                                💡 Giá SX: {selected.pricePerUnit.toLocaleString("vi-VN")}đ (tham khảo) — Giá bán cho phụ huynh không đổi
                                                                            </p>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </section>
                                )}

                                {/* Save Draft */}
                                <button
                                    type="button"
                                    onClick={() => handleSubmit(true)}
                                    disabled={submitting}
                                    className="w-full rounded-[10px] border-[3px] border-[#19182B] bg-white px-5 py-3 text-[14px] font-extrabold text-[#19182B] shadow-[4px_4px_0_#19182B] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting && (
                                        <svg className="w-4 h-4 animate-spin inline mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M4 12a8 8 0 018-8" strokeLinecap="round" /></svg>
                                    )}
                                    📝 Lưu bản nháp
                                </button>


                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* ── Preview Modal — NB Concept ── */}
            {showPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowPreview(false)} />
                    <div className="relative w-full max-w-[640px] mx-4 max-h-[85vh] overflow-y-auto rounded-[18px] border-[3px] border-[#19182B] bg-white shadow-[6px_6px_0_#19182B]">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4 border-b-[3px] border-[#19182B] bg-[#F2ECFF] px-6 py-5 sticky top-0 z-10">
                            <div>
                                <div className="mb-2 inline-flex items-center gap-2 rounded-[8px] border-[2px] border-[#19182B] bg-[#FFD978] px-3 py-1 text-[12px] font-black shadow-[2px_2px_0_#19182B]">
                                    👁 XEM TRƯỚC
                                </div>
                                <h2 className="text-[24px] font-black leading-none text-[#19182B]">Xem trước chiến dịch</h2>
                            </div>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[10px] border-[3px] border-[#19182B] bg-white text-[22px] font-black shadow-[4px_4px_0_#19182B] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B]"
                            >
                                ×
                            </button>
                        </div>
                        <div className="px-6 py-6 space-y-5">
                            {/* Name */}
                            <div>
                                <p className="text-[12px] font-black text-[#6F6A7D] uppercase tracking-wider mb-1">Tên chiến dịch</p>
                                <p className="text-[18px] font-black text-[#19182B]">{campaignName || "(Chưa nhập)"}</p>
                            </div>
                            {description && (
                                <div>
                                    <p className="text-[12px] font-black text-[#6F6A7D] uppercase tracking-wider mb-1">Mô tả</p>
                                    <p className="text-[15px] font-semibold text-[#6F6A7D]">{description}</p>
                                </div>
                            )}
                            {/* Dates */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="rounded-[10px] border-[2px] border-[#19182B] bg-[#FFFDF9] p-3 shadow-[2px_2px_0_#19182B]">
                                    <p className="text-[11px] font-black text-[#6F6A7D] uppercase mb-1">Mở đơn</p>
                                    <p className="text-[14px] font-black text-[#19182B]">{startDate ? new Date(startDate).toLocaleDateString("vi-VN") : "—"}</p>
                                </div>
                                <div className="rounded-[10px] border-[2px] border-[#19182B] bg-[#FFFDF9] p-3 shadow-[2px_2px_0_#19182B]">
                                    <p className="text-[11px] font-black text-[#6F6A7D] uppercase mb-1">Đóng đơn</p>
                                    <p className="text-[14px] font-black text-[#19182B]">{endDate ? new Date(endDate).toLocaleDateString("vi-VN") : "—"}</p>
                                </div>
                                <div className="rounded-[10px] border-[2px] border-[#19182B] bg-[#FFFDF9] p-3 shadow-[2px_2px_0_#19182B]">
                                    <p className="text-[11px] font-black text-[#6F6A7D] uppercase mb-1">Trả hàng</p>
                                    <p className="text-[14px] font-black text-[#19182B]">{deliveryDate ? new Date(deliveryDate).toLocaleDateString("vi-VN") : "—"}</p>
                                </div>
                            </div>
                            {/* Products */}
                            <div>
                                <p className="text-[12px] font-black text-[#6F6A7D] uppercase tracking-wider mb-2">Sản phẩm ({selectedOutfits.size})</p>
                                {selectedOutfits.size === 0 ? (
                                    <p className="text-[14px] font-bold text-[#8D879B] italic">Chưa chọn sản phẩm nào</p>
                                ) : (
                                    <div className="space-y-2">
                                        {Array.from(selectedOutfits.values()).map((s) => (
                                            <div key={s.outfit.outfitId} className="flex items-center gap-3 rounded-[10px] border-[2px] border-[#19182B] bg-white p-3 shadow-[2px_2px_0_#19182B]">
                                                <div className="w-10 h-10 rounded-[8px] bg-[#ECEAF2] overflow-hidden flex-shrink-0 border-[2px] border-[#19182B]">
                                                    {s.outfit.mainImageURL ? (
                                                        <img src={s.outfit.mainImageURL} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-sm">👕</div>
                                                    )}
                                                </div>
                                                <span className="flex-1 text-[14px] font-black text-[#19182B]">{s.outfit.outfitName}</span>
                                                <span className="text-[14px] font-black text-[#7C56FF]">{new Intl.NumberFormat("vi-VN").format(s.campaignPrice)}đ</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {/* Rules */}
                            <div className="flex items-center gap-3">
                                <span className={`rounded-full border-[2px] border-[#19182B] px-3 py-1 text-[12px] font-extrabold shadow-[2px_2px_0_#19182B] ${requirePayment ? "bg-[#D9F8E8] text-[#065F46]" : "bg-[#F6F1E8] text-[#6F6A7D]"}`}>
                                    {requirePayment ? "✓" : "✗"} Thanh toán ngay
                                </span>
                                <span className={`rounded-full border-[2px] border-[#19182B] px-3 py-1 text-[12px] font-extrabold shadow-[2px_2px_0_#19182B] ${allowSizeExchange ? "bg-[#D9F8E8] text-[#065F46]" : "bg-[#F6F1E8] text-[#6F6A7D]"}`}>
                                    {allowSizeExchange ? "✓" : "✗"} Cho phép đổi size
                                </span>
                            </div>
                        </div>
                        {/* Footer */}
                        <div className="flex flex-col-reverse gap-3 border-t-[3px] border-[#19182B] bg-[#FFFDF9] px-6 py-5 sm:flex-row sm:justify-end">
                            <button onClick={() => setShowPreview(false)} className="rounded-[8px] border-[3px] border-[#19182B] bg-white px-5 py-3 text-[15px] font-extrabold text-[#19182B] shadow-[4px_4px_0_#19182B] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">Đóng</button>
                            <button onClick={() => { setShowPreview(false); handleSubmit(false); }} disabled={submitting} className="flex items-center justify-center gap-2 rounded-[8px] border-[3px] border-[#19182B] bg-[#8B6BFF] px-5 py-3 text-[15px] font-extrabold text-white shadow-[4px_4px_0_#19182B] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50">🚀 Xuất bản ngay</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Toast — NB Concept ── */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-[10px] border-[3px] border-[#19182B] shadow-[4px_4px_0_#19182B] animate-in slide-in-from-bottom-4 duration-300 ${toast.type === "success" ? "bg-[#10b981] text-white" : "bg-[#FF6B57] text-white"}`}>
                    {toast.type === "success" ? "✅" : "❌"}
                    <span className="font-extrabold text-[15px]">{toast.message}</span>
                </div>
            )}
        </div>
    );
};

export default CampaignManagement;
