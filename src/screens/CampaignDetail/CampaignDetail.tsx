import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ChevronRight, ArrowLeft, Calendar, Package, ShoppingCart, X, Minus, Plus, User, ChevronDown } from "lucide-react";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { getPublicCampaignDetail, getPublicOutfitDetail, type PublicCampaignDetailDto, type CampaignOutfitDetailDto, type OutfitVariantDto, type SizeChartDto } from "../../lib/api/schools";
import { getMyChildren, type ChildProfileDto } from "../../lib/api/users";
import { getBodygramScanDetail, getChildBodygramScans, type BodygramHistoryItem, type BodygramScanDetail } from "../../lib/api/bodygram";
import { useCart } from "../../contexts/CartContext";
import { useToast } from "../../contexts/ToastContext";
import { recommendSize, recommendSizeFromBodygram, type SizeRecommendation } from "../../lib/utils/sizeRecommendation";

const STATUS_LABEL: Record<string, { label: string; badge: string }> = {
  Active:   { label: "Đang diễn ra", badge: "nb-badge nb-badge-green"  },
  Draft:    { label: "Bản nháp",     badge: "nb-badge text-[#6B7280] bg-[#F3F4F6]" },
  Locked:   { label: "Đã khoá",     badge: "nb-badge nb-badge-red"    },
  Ended:    { label: "Đã kết thúc", badge: "nb-badge nb-badge-yellow" },
};

/* ── Order Modal types ── */
type OrderModalState = {
  open: boolean;
  outfit: CampaignOutfitDetailDto | null;
  variants: OutfitVariantDto[];
  sizeChart: SizeChartDto | null;
  loadingVariants: boolean;
};

export const CampaignDetail = (): JSX.Element => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const cart = useCart();
  const { showToast } = useToast();
  const [campaign, setCampaign] = useState<PublicCampaignDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ── Order modal state ── */
  const [modal, setModal] = useState<OrderModalState>({ open: false, outfit: null, variants: [], sizeChart: null, loadingVariants: false });
  const [children, setChildren] = useState<ChildProfileDto[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [orderQty, setOrderQty] = useState(1);
  const [childDropOpen, setChildDropOpen] = useState(false);
  const [scanDropOpen, setScanDropOpen] = useState(false);
  const [bodygramScans, setBodygramScans] = useState<BodygramHistoryItem[]>([]);
  const [loadingScans, setLoadingScans] = useState(false);
  const [selectedScanRecordId, setSelectedScanRecordId] = useState<string>("");
  const [selectedScanDetail, setSelectedScanDetail] = useState<BodygramScanDetail | null>(null);
  const [loadingScanDetail, setLoadingScanDetail] = useState(false);

  /* Auth is handled by RoleGuard in App.tsx — no need for duplicate check here */

  useEffect(() => {
    if (!campaignId) return;
    getPublicCampaignDetail(campaignId)
      .then(setCampaign)
      .catch(() => setError("Không tìm thấy chương trình này."))
      .finally(() => setLoading(false));
  }, [campaignId]);

  /* Fetch children once for the modal */
  useEffect(() => {
    getMyChildren().then(setChildren).catch(() => {});
  }, []);

  /* ── Open order modal ── */
  const openOrderModal = async (outfit: CampaignOutfitDetailDto) => {
    setModal({ open: true, outfit, variants: [], sizeChart: null, loadingVariants: true });
    const schoolChildren = children.filter(c => c.school?.schoolId === campaign?.school.id);
    setSelectedChild(schoolChildren.length > 0 ? schoolChildren[0].childId : "");
    setSelectedVariant("");
    setOrderQty(1);
    setBodygramScans([]);
    setSelectedScanRecordId("");
    setSelectedScanDetail(null);
    setScanDropOpen(false);
    try {
      const detail = await getPublicOutfitDetail(outfit.outfitId);
      setModal(prev => ({ ...prev, variants: detail.variants, sizeChart: detail.sizeChart, loadingVariants: false }));
    } catch {
      setModal(prev => ({ ...prev, loadingVariants: false }));
    }
  };

  /* ── Size recommendation ── */
  useEffect(() => {
    if (!modal.open || !selectedChild) {
      setBodygramScans([]);
      setSelectedScanRecordId("");
      setSelectedScanDetail(null);
      return;
    }

    let disposed = false;
    setLoadingScans(true);

    getChildBodygramScans(selectedChild, 1, 10)
      .then(response => {
        if (disposed) return;
        const scans = [...response.items].sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());
        setBodygramScans(scans);
        setSelectedScanRecordId(scans[0]?.scanRecordId ?? "");
      })
      .catch(() => {
        if (disposed) return;
        setBodygramScans([]);
        setSelectedScanRecordId("");
      })
      .finally(() => {
        if (!disposed) setLoadingScans(false);
      });

    return () => {
      disposed = true;
    };
  }, [modal.open, selectedChild]);

  useEffect(() => {
    if (!selectedScanRecordId) {
      setSelectedScanDetail(null);
      return;
    }

    let disposed = false;
    setLoadingScanDetail(true);

    getBodygramScanDetail(selectedScanRecordId)
      .then(detail => {
        if (!disposed) setSelectedScanDetail(detail);
      })
      .catch(() => {
        if (!disposed) setSelectedScanDetail(null);
      })
      .finally(() => {
        if (!disposed) setLoadingScanDetail(false);
      });

    return () => {
      disposed = true;
    };
  }, [selectedScanRecordId]);

  const sizeRec: SizeRecommendation = useMemo(() => {
    const child = children.find(c => c.childId === selectedChild);
    if (!child || modal.variants.length === 0) {
      return { recommendedVariantId: null, recommendedSize: "", confidence: "low" as const, reason: "" };
    }

    if (selectedScanDetail && modal.sizeChart?.details?.length) {
      const bodygramRec = recommendSizeFromBodygram(selectedScanDetail, modal.variants, modal.sizeChart.details);
      if (bodygramRec?.recommendedVariantId) {
        return bodygramRec;
      }

      const fallback = recommendSize(child.heightCm, child.weightKg, modal.variants);
      if (bodygramRec?.reason) {
        return {
          ...fallback,
          confidence: fallback.confidence === "high" ? "medium" : fallback.confidence,
          reason: `${bodygramRec.reason}. ${fallback.reason}`,
        };
      }
      return fallback;
    }

    if (bodygramScans.length > 0) {
      const fallback = recommendSize(child.heightCm, child.weightKg, modal.variants);
      return {
        ...fallback,
        confidence: fallback.confidence === "high" ? "medium" : fallback.confidence,
        reason: `Outfit chua co size chart theo Bodygram. ${fallback.reason}`,
      };
    }

    return recommendSize(child.heightCm, child.weightKg, modal.variants);
  }, [selectedChild, children, modal.variants, modal.sizeChart, selectedScanDetail, bodygramScans]);

  /* Auto-select recommended variant when it changes */
  useEffect(() => {
    if (sizeRec.recommendedVariantId) {
      setSelectedVariant(sizeRec.recommendedVariantId);
    } else if (modal.variants.length > 0 && !selectedVariant) {
      setSelectedVariant(modal.variants[0].productVariantId);
    }
  }, [sizeRec.recommendedVariantId, modal.variants]);

  /* ── Confirm add to cart ── */
  const handleAddToCart = () => {
    if (!modal.outfit || !campaign || !selectedChild || !selectedVariant) return;
    const variant = modal.variants.find(v => v.productVariantId === selectedVariant);
    const child = children.find(c => c.childId === selectedChild);
    if (!variant || !child) return;

    cart.addItem({
      campaignOutfitId: modal.outfit.campaignOutfitId,
      outfitId: modal.outfit.outfitId,
      outfitName: modal.outfit.outfitName,
      productVariantId: variant.productVariantId,
      size: variant.size,
      quantity: orderQty,
      price: modal.outfit.campaignPrice,
      imageURL: modal.outfit.mainImageUrl,
      studentName: child.fullName,
      studentClass: child.grade,
      childProfileId: child.childId,
      campaignId: campaign.campaignId,
      schoolId: campaign.school.id,
      schoolName: campaign.school.schoolName,
      campaignLabel: campaign.campaignName,
    });

    showToast({ title: "Thành công", message: `Đã thêm "${modal.outfit.outfitName}" vào giỏ hàng`, variant: "success" });
    setModal({ open: false, outfit: null, variants: [], sizeChart: null, loadingVariants: false });
  };

  if (loading) return (
    <GuestLayout bgColor="#FFF8F0">
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="inline-block w-10 h-10 border-4 border-[#B8A9E8] border-t-transparent rounded-full animate-spin" />
      </div>
    </GuestLayout>
  );

  if (error || !campaign) return (
    <GuestLayout bgColor="#FFF8F0">
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="nb-card-static p-10 text-center max-w-md mx-4">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-bold text-[#1A1A2E]">{error || "Không tìm thấy chương trình."}</p>
          <button onClick={() => navigate("/schools")} className="nb-btn nb-btn-purple text-sm mt-4">← Quay lại danh sách trường</button>
        </div>
      </div>
    </GuestLayout>
  );

  const statusCfg = STATUS_LABEL[campaign.status] ?? { label: campaign.status, badge: "nb-badge text-[#6B7280] bg-[#F3F4F6]" };

  return (
    <GuestLayout bgColor="#FFF8F0">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-6 nb-page">
        {/* Breadcrumb — NB style */}
        <div className="flex items-center gap-2 text-sm mb-6 flex-wrap font-semibold">
          <Link to="/homepage" className="text-[#97A3B6] hover:text-[#1A1A2E] transition-colors">Trang chủ</Link>
          <ChevronRight className="w-4 h-4 text-[#CBCAD7]" />
          <Link to="/schools" className="text-[#97A3B6] hover:text-[#1A1A2E] transition-colors">Danh sách trường</Link>
          <ChevronRight className="w-4 h-4 text-[#CBCAD7]" />
          <Link to={`/schools/${campaign.school.id}`} className="text-[#97A3B6] hover:text-[#1A1A2E] transition-colors truncate max-w-[160px]">
            {campaign.school.schoolName}
          </Link>
          <ChevronRight className="w-4 h-4 text-[#CBCAD7]" />
          <span className="font-bold text-[#1A1A2E] truncate max-w-[160px]">{campaign.campaignName}</span>
        </div>

        {/* Back button — NB */}
        <button onClick={() => navigate(`/schools/${campaign.school.id}`)}
          className="nb-btn nb-btn-outline nb-btn-sm text-sm mb-4">
          <ArrowLeft className="w-4 h-4" />
          Quay lại trường học
        </button>

        {/* Campaign Header — NB Card */}
        <div className="nb-card-static p-4 lg:p-6 mb-6 hover:shadow-[3px_3px_0_#1A1A2E]">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-4">
            {/* School logo */}
            {campaign.school.logoURL && (
              <div className="w-14 h-14 rounded-[8px] overflow-hidden border-[2px] border-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E] flex-shrink-0">
                <img src={campaign.school.logoURL} alt={campaign.school.schoolName}
                  className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1">
              <p className="font-semibold text-sm text-[#97A3B6] mb-1">{campaign.school.schoolName}</p>
              <h1 className="font-black text-[#1A1A2E] text-2xl lg:text-3xl mb-3">{campaign.campaignName}</h1>
              <span className={statusCfg.badge}>{statusCfg.label}</span>
            </div>
          </div>

          {/* Date range — NB inline badge */}
          <div className="flex items-center gap-3 text-sm text-[#4C5769] font-semibold mb-3">
            <Calendar className="w-4 h-4 text-[#B8A9E8]" />
            <span>
              Từ <strong className="text-[#1A1A2E]">{new Date(campaign.startDate).toLocaleDateString("vi-VN")}</strong>
              &nbsp;đến <strong className="text-[#1A1A2E]">{new Date(campaign.endDate).toLocaleDateString("vi-VN")}</strong>
            </span>
          </div>

          {campaign.description && (
            <div className="p-3 rounded-[8px] border-[2px] border-[#E5E7EB] bg-[#F6F1E8]">
              <p className="font-medium text-sm text-[#4C5769] leading-relaxed">
                {campaign.description}
              </p>
            </div>
          )}
        </div>

        {/* Campaign Analytics KPIs — Guest/Parent View */}
        {(() => {
          const now = new Date();
          const end = new Date(campaign.endDate);
          const start = new Date(campaign.startDate);
          const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
          const isActive = campaign.status === "Active";
          const totalProducts = campaign.outfits.length;
          const prices = campaign.outfits.map(o => o.campaignPrice).filter(p => p > 0);
          const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
          const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
          const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
          const elapsedDays = Math.max(0, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
          const progressPct = Math.min(100, Math.round((elapsedDays / totalDays) * 100));

          return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6 nb-stagger">
              {/* Countdown */}
              <div className="nb-card-static p-3 text-center transition-all duration-300 ease-out hover:scale-105 hover:shadow-[3px_3px_0_#1A1A2E] cursor-default">
                <p className="font-extrabold text-xs uppercase tracking-wider text-[#6B7280] mb-1.5">⏳ Còn lại</p>
                {isActive && daysLeft > 0 ? (
                  <>
                    <p className="font-black text-3xl text-[#1A1A2E]">{daysLeft}</p>
                    <p className="font-semibold text-sm text-[#97A3B6]">ngày</p>
                    <div className="nb-progress mt-2">
                      <div className="nb-progress-bar" style={{
                        width: `${progressPct}%`,
                        background: progressPct >= 80 ? "#E8A0A0" : progressPct >= 50 ? "#F5E642" : "#C8E44D",
                      }} />
                    </div>
                  </>
                ) : (
                  <p className="font-black text-lg text-[#DC2626]">{campaign.status === "Active" ? "Hôm nay là ngày cuối!" : "Đã kết thúc"}</p>
                )}
              </div>

              {/* Total Products */}
              <div className="nb-card-static p-3 text-center transition-all duration-300 ease-out hover:scale-105 hover:shadow-[3px_3px_0_#1A1A2E] cursor-default">
                <p className="font-extrabold text-xs uppercase tracking-wider text-[#6B7280] mb-1.5">👕 Sản phẩm</p>
                <p className="font-black text-3xl text-[#1A1A2E]">{totalProducts}</p>
                <p className="font-semibold text-sm text-[#97A3B6]">mẫu đồng phục</p>
              </div>

              {/* Price Range */}
              <div className="nb-card-static p-3 text-center transition-all duration-300 ease-out hover:scale-105 hover:shadow-[3px_3px_0_#1A1A2E] cursor-default">
                <p className="font-extrabold text-xs uppercase tracking-wider text-[#6B7280] mb-1.5">💰 Giá</p>
                {minPrice === maxPrice ? (
                  <p className="font-black text-xl text-[#8B6BFF]">{minPrice.toLocaleString("vi-VN")}₫</p>
                ) : (
                  <>
                    <p className="font-black text-lg text-[#8B6BFF]">{minPrice.toLocaleString("vi-VN")}₫</p>
                    <p className="font-semibold text-xs text-[#97A3B6]">đến {maxPrice.toLocaleString("vi-VN")}₫</p>
                  </>
                )}
              </div>

              {/* Status */}
              <div className="nb-card-static p-3 text-center transition-all duration-300 ease-out hover:scale-105 hover:shadow-[3px_3px_0_#1A1A2E] cursor-default">
                <p className="font-extrabold text-xs uppercase tracking-wider text-[#6B7280] mb-1.5">📋 Trạng thái</p>
                <span className={statusCfg.badge + " text-sm"}>{statusCfg.label}</span>
                <p className="font-semibold text-xs text-[#97A3B6] mt-1.5">
                  {new Date(campaign.startDate).toLocaleDateString("vi-VN")} — {new Date(campaign.endDate).toLocaleDateString("vi-VN")}
                </p>
              </div>
            </div>
          );
        })()}

        {/* Outfits — NB Section */}
        <h2 className="font-black text-xl text-[#1A1A2E] mb-4 flex items-center gap-2">
          <div className="w-9 h-9 rounded-[8px] border-[2px] border-[#1A1A2E] bg-[#EDE9FE] shadow-[2px_2px_0_#1A1A2E] flex items-center justify-center">
            <Package className="w-4.5 h-4.5 text-[#7C3AED]" />
          </div>
          Danh sách đồng phục
          <span className="text-base font-semibold text-[#97A3B6]">({campaign.outfits.length} mẫu)</span>
        </h2>

        {campaign.outfits.length === 0 ? (
          <div className="nb-card-static p-8 text-center border-dashed transition-all duration-300 ease-out hover:scale-105 hover:shadow-[3px_3px_0_#1A1A2E]">
            <Package className="w-10 h-10 text-[#CBCAD7] mx-auto mb-3" />
            <p className="font-bold text-[#97A3B6]">Chưa có đồng phục trong chương trình này.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 nb-stagger">
            {campaign.outfits.map((outfit, idx) => (
              <div key={outfit.campaignOutfitId}
                className="nb-card overflow-hidden flex flex-col group transition-all duration-300 ease-out hover:scale-105 hover:shadow-[4px_4px_0_#1A1A2E] hover:-translate-y-1" style={{ animationDelay: `${idx * 50}ms` }}>
                {/* Image */}
                <div
                  className="relative aspect-[4/3] bg-[#F6F1E8] overflow-hidden cursor-pointer"
                  onClick={() => navigate(`/outfits/${outfit.outfitId}`)}
                >
                  {outfit.mainImageUrl
                    ? <img src={outfit.mainImageUrl} alt={outfit.outfitName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-[#CBCAD7]" />
                      </div>
                    )}
                </div>

                {/* Info */}
                <div className="p-2 flex flex-col flex-1 group/info">
                  <h3 className="font-bold text-[#1A1A2E] text-base mb-1 line-clamp-2 min-h-[2.4rem] transition-colors duration-200 group-hover/card:text-[#8B6BFF]">{outfit.outfitName}</h3>

                  <div className="flex items-center justify-between mt-auto pt-1 border-t-2 border-[#E5E7EB]">
                    <span className="font-black text-lg text-[#8B6BFF] transition-colors duration-200 group-hover/card:text-[#0ea5e9]">
                      {outfit.campaignPrice.toLocaleString("vi-VN")}₫
                    </span>
                    {outfit.maxQuantity !== null && (
                      <span className="text-xs font-semibold text-[#97A3B6]">SL: {outfit.maxQuantity}</span>
                    )}
                  </div>

                  <button
                    onClick={() => navigate(`/outfits/${outfit.outfitId}`)}
                    className="mt-1 text-center font-bold text-sm text-[#8B6BFF] hover:text-[#6938EF] hover:underline hover:underline-offset-2 transition-all duration-200"
                  >
                    Xem chi tiết →
                  </button>
                  {campaign.status === "Active" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); openOrderModal(outfit); }}
                      className="mt-1 w-full nb-btn nb-btn-purple text-sm py-1.5 transition-all duration-200 hover:scale-105 hover:shadow-[3px_3px_0_#1A1A2E]"
                    >
                      <ShoppingCart className="w-3 h-3" />
                      Đặt hàng
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ───── Order Modal — NB Style ───── */}
      {modal.open && modal.outfit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 nb-backdrop-enter" onClick={() => setModal({ open: false, outfit: null, variants: [], sizeChart: null, loadingVariants: false })}>
          <div className="bg-white rounded-[8px] border-[3px] border-[#1A1A2E] shadow-[4px_4px_0_#1A1A2E] w-full max-w-md mx-4 overflow-hidden nb-modal-enter" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b-[3px] border-[#1A1A2E] bg-[#EDE9FE]">
              <h3 className="font-black text-lg text-[#1A1A2E]">Đặt hàng</h3>
              <button onClick={() => setModal({ open: false, outfit: null, variants: [], sizeChart: null, loadingVariants: false })} className="w-8 h-8 flex items-center justify-center rounded-[4px] border-[2px] border-[#1A1A2E] bg-white shadow-[2px_2px_0_#1A1A2E] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                <X className="w-4 h-4 text-[#1A1A2E]" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Outfit preview */}
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-[8px] overflow-hidden bg-[#F6F1E8] flex-shrink-0 border-[2px] border-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E]">
                  {modal.outfit.mainImageUrl
                    ? <img src={modal.outfit.mainImageUrl} alt={modal.outfit.outfitName} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-[#CBCAD7]" /></div>
                  }
                </div>
                <div>
                  <h4 className="font-bold text-base text-[#1A1A2E] mb-1">{modal.outfit.outfitName}</h4>
                  <p className="font-black text-lg text-[#8B6BFF]">
                    {modal.outfit.campaignPrice.toLocaleString("vi-VN")}₫
                  </p>
                </div>
              </div>

              {/* Child selector */}
              <div>
                <label className="font-bold text-sm text-[#1A1A2E] mb-2 block">Chọn học sinh</label>
                {children.length === 0 ? (
                  <div className="nb-alert nb-alert-warning text-sm"><span>⚠️</span><span>Bạn hiện chưa liên kết với hồ sơ học sinh nào. Hãy liên kết <a href="/parentprofile/students" className="underline font-bold">ở đây</a> để tiếp tục nhé!</span></div>
                ) : children.filter(c => c.school?.schoolId === campaign.school.id).length === 0 ? (
                  <div className="nb-alert nb-alert-warning text-sm"><span>⚠️</span><span>Học sinh của bạn không thuộc trường <strong>{campaign.school.schoolName}</strong>. Chỉ học sinh của trường này mới có thể đặt đồng phục.</span></div>
                ) : (
                  <div className="relative">
                    <button
                      onClick={() => setChildDropOpen(!childDropOpen)}
                      className="w-full flex items-center justify-between nb-input py-3"
                    >
                      <span className="flex items-center gap-2">
                        <User className="w-4 h-4 text-[#B8A9E8]" />
                        <span className="font-semibold text-sm">{children.find(c => c.childId === selectedChild)?.fullName || "Chọn học sinh..."}</span>
                        {(() => {
                          const child = children.find(c => c.childId === selectedChild);
                          if (child && child.heightCm > 0) {
                            return <span className="text-xs text-[#97A3B6] ml-1">({child.heightCm}cm{child.weightKg > 0 ? `, ${child.weightKg}kg` : ""})</span>;
                          }
                          return null;
                        })()}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-[#97A3B6] transition-transform ${childDropOpen ? "rotate-180" : ""}`} />
                    </button>
                    {childDropOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border-[2px] border-[#1A1A2E] rounded-[4px] shadow-[4px_4px_0_#1A1A2E] z-10 max-h-48 overflow-y-auto">
                        {children.filter(c => c.school?.schoolId === campaign.school.id).map(child => (
                          <button
                            key={child.childId}
                            onClick={() => { setSelectedChild(child.childId); setChildDropOpen(false); }}
                            className={`w-full text-left px-4 py-3 text-sm font-semibold hover:bg-[#EDE9FE] transition-colors ${
                              selectedChild === child.childId ? "bg-[#EDE9FE] text-[#7C3AED]" : "text-[#1A1A2E]"
                            }`}
                          >
                            <span className="font-bold">{child.fullName}</span>
                            <span className="text-xs text-[#97A3B6] ml-2">{child.grade} • {child.school.schoolName}</span>
                            {child.heightCm > 0 && (
                              <span className="text-xs text-[#B8A9E8] ml-1">({child.heightCm}cm)</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedChild && (
                <div>
                  <label className="font-bold text-sm text-[#1A1A2E] mb-2 block">Lan scan Bodygram</label>
                  {loadingScans ? (
                    <div className="flex items-center gap-2 text-[#97A3B6] text-sm font-semibold">
                      <div className="w-4 h-4 border-2 border-[#E5E7EB] border-t-[#B8A9E8] rounded-full animate-spin" />
                      Dang tai lich su scan...
                    </div>
                  ) : bodygramScans.length === 0 ? (
                    <div className="nb-alert nb-alert-warning text-sm"><span>⚠️</span><span>Chua co lich su Bodygram, he thong se fallback theo chieu cao va can nang.</span></div>
                  ) : (
                    <div className="relative">
                      <button
                        onClick={() => setScanDropOpen(!scanDropOpen)}
                        className="w-full flex items-center justify-between nb-input py-3"
                      >
                        <span className="font-semibold text-sm">
                          {(() => {
                            const selectedScan = bodygramScans.find(scan => scan.scanRecordId === selectedScanRecordId);
                            if (!selectedScan) return "Chon lan scan...";
                            return `${new Date(selectedScan.scannedAt).toLocaleDateString("vi-VN")} • ${selectedScan.heightCm}cm • ${selectedScan.weightKg}kg`;
                          })()}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-[#97A3B6] transition-transform ${scanDropOpen ? "rotate-180" : ""}`} />
                      </button>
                      {scanDropOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border-[2px] border-[#1A1A2E] rounded-[4px] shadow-[4px_4px_0_#1A1A2E] z-10 max-h-48 overflow-y-auto">
                          {bodygramScans.map(scan => (
                            <button
                              key={scan.scanRecordId}
                              onClick={() => { setSelectedScanRecordId(scan.scanRecordId); setScanDropOpen(false); }}
                              className={`w-full text-left px-4 py-3 text-sm font-semibold hover:bg-[#EDE9FE] transition-colors ${
                                selectedScanRecordId === scan.scanRecordId ? "bg-[#EDE9FE] text-[#7C3AED]" : "text-[#1A1A2E]"
                              }`}
                            >
                              <span className="font-bold">{new Date(scan.scannedAt).toLocaleDateString("vi-VN")}</span>
                              <span className="text-xs text-[#97A3B6] ml-2">{scan.heightCm}cm • {scan.weightKg}kg</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {loadingScanDetail && (
                        <p className="mt-2 text-xs font-semibold text-[#97A3B6]">Dang tai chi tiet scan...</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Size selector — NB pill buttons */}
              <div>
                <label className="font-bold text-sm text-[#1A1A2E] mb-2 block">Chọn size</label>
                {modal.loadingVariants ? (
                  <div className="flex items-center gap-2 text-[#97A3B6] text-sm font-semibold"><div className="w-4 h-4 border-2 border-[#E5E7EB] border-t-[#B8A9E8] rounded-full animate-spin" /> Đang tải...</div>
                ) : modal.variants.length === 0 ? (
                  <div className="nb-alert nb-alert-error text-sm"><span>❌</span><span>Chưa có size cho sản phẩm này.</span></div>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {modal.variants.map(v => {
                        const isRecommended = v.productVariantId === sizeRec.recommendedVariantId;
                        return (
                          <button
                            key={v.productVariantId}
                            onClick={() => setSelectedVariant(v.productVariantId)}
                            className={`relative px-4 py-2.5 rounded-[4px] border-[2px] font-bold text-sm transition-all ${
                              selectedVariant === v.productVariantId
                                ? "border-[#1A1A2E] bg-[#B8A9E8] text-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E]"
                                : isRecommended
                                ? "border-[#B8A9E8] bg-[#EDE9FE] text-[#7C3AED]"
                                : "border-[#E5E7EB] text-[#6B7280] hover:border-[#B8A9E8]"
                            }`}
                          >
                            {isRecommended && (
                              <span className="absolute -top-2 -right-1 text-xs">⭐</span>
                            )}
                            {v.size}
                          </button>
                        );
                      })}
                    </div>
                    {/* Recommendation info */}
                    {sizeRec.confidence !== "low" && sizeRec.reason && (
                      <p className="mt-2 text-xs font-semibold text-[#7C3AED] flex items-center gap-1">
                        <span>⭐</span> {sizeRec.reason}
                      </p>
                    )}
                    {sizeRec.confidence === "low" && sizeRec.reason && (
                      <p className="mt-2 text-xs font-semibold text-[#D97706] flex items-center gap-1">
                        <span>⚠️</span> {sizeRec.reason}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Quantity — NB counter */}
              <div>
                <label className="font-bold text-sm text-[#1A1A2E] mb-2 block">Số lượng</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setOrderQty(q => Math.max(1, q - 1))}
                    className="w-9 h-9 flex items-center justify-center rounded-[4px] border-[2px] border-[#1A1A2E] bg-white shadow-[2px_2px_0_#1A1A2E] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  >
                    <Minus className="w-4 h-4 text-[#1A1A2E]" />
                  </button>
                  <span className="font-black text-lg w-8 text-center text-[#1A1A2E]">{orderQty}</span>
                  <button
                    onClick={() => setOrderQty(q => q + 1)}
                    className="w-9 h-9 flex items-center justify-center rounded-[4px] border-[2px] border-[#1A1A2E] bg-white shadow-[2px_2px_0_#1A1A2E] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  >
                    <Plus className="w-4 h-4 text-[#1A1A2E]" />
                  </button>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center pt-3 border-t-[2px] border-[#E5E7EB]">
                <span className="font-semibold text-sm text-[#6B7280]">Tạm tính</span>
                <span className="font-black text-xl text-[#8B6BFF]">
                  {(modal.outfit.campaignPrice * orderQty).toLocaleString("vi-VN")}₫
                </span>
              </div>

              {/* Action buttons — NB */}
              <div className="flex gap-3">
                <button
                  onClick={() => setModal({ open: false, outfit: null, variants: [], sizeChart: null, loadingVariants: false })}
                  className="flex-1 nb-btn nb-btn-outline text-sm"
                >
                  Huỷ
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedChild || !selectedVariant || children.length === 0}
                  className="flex-1 nb-btn nb-btn-purple text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Thêm vào giỏ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </GuestLayout>
  );
};
