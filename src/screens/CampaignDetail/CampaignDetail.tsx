import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ChevronRight, ArrowLeft, Calendar, Package, ShoppingCart, X, Minus, Plus, User, ChevronDown } from "lucide-react";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { getPublicCampaignDetail, getPublicOutfitDetail, type PublicCampaignDetailDto, type CampaignOutfitDetailDto, type OutfitVariantDto } from "../../lib/api/schools";
import { getMyChildren, type ChildProfileDto } from "../../lib/api/users";
import { useCart } from "../../contexts/CartContext";
import { useToast } from "../../contexts/ToastContext";
import { recommendSize, type SizeRecommendation } from "../../lib/utils/sizeRecommendation";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  Active:   { label: "Đang diễn ra", color: "bg-green-100 text-green-700" },
  Draft:    { label: "Bản nháp",     color: "bg-gray-100 text-gray-600"   },
  Locked:   { label: "Đã khoá",      color: "bg-red-100 text-red-600"     },
  Ended:    { label: "Đã kết thúc",  color: "bg-amber-100 text-amber-700" },
};

/* ── Order Modal types ── */
type OrderModalState = {
  open: boolean;
  outfit: CampaignOutfitDetailDto | null;
  variants: OutfitVariantDto[];
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
  const [modal, setModal] = useState<OrderModalState>({ open: false, outfit: null, variants: [], loadingVariants: false });
  const [children, setChildren] = useState<ChildProfileDto[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [orderQty, setOrderQty] = useState(1);
  const [childDropOpen, setChildDropOpen] = useState(false);

  /* Auth guard — must be Parent */
  useEffect(() => {
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!raw) { navigate("/signin", { replace: true }); return; }
    try {
      const u = JSON.parse(raw);
      if (u.role !== "Parent") { navigate("/homepage", { replace: true }); return; }
    } catch { navigate("/signin", { replace: true }); }
  }, [navigate]);

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
    setModal({ open: true, outfit, variants: [], loadingVariants: true });
    const schoolChildren = children.filter(c => c.school?.schoolId === campaign?.school.id);
    setSelectedChild(schoolChildren.length > 0 ? schoolChildren[0].childId : "");
    setSelectedVariant("");
    setOrderQty(1);
    try {
      const detail = await getPublicOutfitDetail(outfit.outfitId);
      setModal(prev => ({ ...prev, variants: detail.variants, loadingVariants: false }));
      // Don't auto-select first variant — let recommendation handle it
    } catch {
      setModal(prev => ({ ...prev, loadingVariants: false }));
    }
  };

  /* ── Size recommendation ── */
  const sizeRec: SizeRecommendation = useMemo(() => {
    const child = children.find(c => c.childId === selectedChild);
    if (!child || modal.variants.length === 0) {
      return { recommendedVariantId: null, recommendedSize: "", confidence: "low" as const, reason: "" };
    }
    return recommendSize(child.heightCm, child.weightKg, modal.variants);
  }, [selectedChild, children, modal.variants]);

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
    setModal({ open: false, outfit: null, variants: [], loadingVariants: false });
  };

  if (loading) return (
    <GuestLayout bgColor="#FFF8F0">
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    </GuestLayout>
  );

  if (error || !campaign) return (
    <GuestLayout bgColor="#FFF8F0">
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="font-montserrat text-gray-500">{error || "Không tìm thấy chương trình."}</p>
        <button onClick={() => navigate("/schools")} className="text-purple-600 hover:underline font-montserrat font-semibold">← Quay lại danh sách trường</button>
      </div>
    </GuestLayout>
  );

  const status = STATUS_LABEL[campaign.status] ?? { label: campaign.status, color: "bg-gray-100 text-gray-600" };

  return (
    <GuestLayout bgColor="#FFF8F0">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-8 flex-wrap">
          <Link to="/homepage" className="font-montserrat text-black/40 hover:text-black/70">Trang chủ</Link>
          <ChevronRight className="w-4 h-4 text-black/40" />
          <Link to="/schools" className="font-montserrat text-black/40 hover:text-black/70">Danh sách trường</Link>
          <ChevronRight className="w-4 h-4 text-black/40" />
          <Link to={`/schools/${campaign.school.id}`} className="font-montserrat text-black/40 hover:text-black/70 truncate max-w-[160px]">
            {campaign.school.schoolName}
          </Link>
          <ChevronRight className="w-4 h-4 text-black/40" />
          <span className="font-montserrat font-semibold text-black truncate max-w-[160px]">{campaign.campaignName}</span>
        </div>

        {/* Back button */}
        <button onClick={() => navigate(`/schools/${campaign.school.id}`)}
          className="flex items-center gap-2 text-sky-600 hover:text-sky-800 font-montserrat font-semibold text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Quay lại trường học
        </button>

        {/* Campaign Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
            {/* School logo */}
            {campaign.school.logoURL && (
              <img src={campaign.school.logoURL} alt={campaign.school.schoolName}
                className="w-16 h-16 rounded-xl object-cover border border-gray-100 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className="font-montserrat font-medium text-sm text-gray-400 mb-1">{campaign.school.schoolName}</p>
              <h1 className="font-montserrat font-extrabold text-2xl lg:text-3xl text-black mb-3">{campaign.campaignName}</h1>
              <span className={`inline-flex text-sm font-montserrat font-semibold px-3 py-1 rounded-full ${status.color}`}>{status.label}</span>
            </div>
          </div>

          {/* Date range */}
          <div className="flex items-center gap-3 text-sm text-gray-500 font-montserrat mb-4">
            <Calendar className="w-4 h-4 text-sky-400" />
            <span>
              Từ <strong className="text-black">{new Date(campaign.startDate).toLocaleDateString("vi-VN")}</strong>
              &nbsp;đến <strong className="text-black">{new Date(campaign.endDate).toLocaleDateString("vi-VN")}</strong>
            </span>
          </div>

          {campaign.description && (
            <p className="font-montserrat text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-4">
              {campaign.description}
            </p>
          )}
        </div>

        {/* Outfits */}
        <h2 className="font-montserrat font-extrabold text-xl text-black mb-5 flex items-center gap-2">
          <Package className="w-5 h-5 text-sky-500" />
          Danh sách đồng phục
          <span className="text-base font-medium text-gray-400">({campaign.outfits.length} mẫu)</span>
        </h2>

        {campaign.outfits.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-montserrat font-medium text-gray-400">Chưa có đồng phục trong chương trình này.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaign.outfits.map(outfit => (
              <div key={outfit.campaignOutfitId}
                onClick={() => navigate(`/outfits/${outfit.outfitId}`)}
                className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer group flex flex-col h-full">
                {/* Image */}
                <div className="relative aspect-square bg-gray-50 overflow-hidden">
                  {outfit.mainImageUrl
                    ? <img src={outfit.mainImageUrl} alt={outfit.outfitName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-gray-200" />
                      </div>
                    )}
                </div>

                {/* Info */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-montserrat font-bold text-lg text-black mb-1 line-clamp-2 min-h-[3.5rem]">{outfit.outfitName}</h3>

                  <div className="flex items-center justify-between mt-auto pt-3">
                    <span className="font-montserrat font-extrabold text-xl text-sky-600">
                      {outfit.campaignPrice.toLocaleString("vi-VN")}₫
                    </span>
                    {outfit.maxQuantity !== null && (
                      <span className="text-xs font-montserrat text-gray-400">SL: {outfit.maxQuantity}</span>
                    )}
                  </div>

                  <p className="mt-3 text-center font-montserrat font-semibold text-sm text-sky-600 group-hover:text-sky-800 transition-colors">
                    Xem chi tiết →
                  </p>
                  {campaign.status === "Active" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); openOrderModal(outfit); }}
                      className="mt-2 w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl py-3 font-montserrat font-semibold text-sm transition-colors"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Đặt hàng
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ───── Order Modal ───── */}
      {modal.open && modal.outfit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setModal({ open: false, outfit: null, variants: [], loadingVariants: false })}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-montserrat font-bold text-lg text-black">Đặt hàng</h3>
              <button onClick={() => setModal({ open: false, outfit: null, variants: [], loadingVariants: false })} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Outfit preview */}
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                  {modal.outfit.mainImageUrl
                    ? <img src={modal.outfit.mainImageUrl} alt={modal.outfit.outfitName} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-gray-200" /></div>
                  }
                </div>
                <div>
                  <h4 className="font-montserrat font-bold text-base text-black mb-1">{modal.outfit.outfitName}</h4>
                  <p className="font-montserrat font-extrabold text-lg text-sky-600">
                    {modal.outfit.campaignPrice.toLocaleString("vi-VN")}₫
                  </p>
                </div>
              </div>

              {/* Child selector */}
              <div>
                <label className="font-montserrat font-semibold text-sm text-gray-700 mb-2 block">Chọn học sinh</label>
                {children.length === 0 ? (
                  <p className="font-montserrat text-sm text-red-500">Bạn hiện chưa liên kết với hồ sơ học sinh nào. Hãy liên kết <a href="/parentprofile/students" className="underline font-bold hover:text-red-700 transition-colors">ở đây</a> để tiếp tục nhé!</p>
                ) : children.filter(c => c.school?.schoolId === campaign.school.id).length === 0 ? (
                  <p className="font-montserrat text-sm text-amber-600">Học sinh của bạn không thuộc trường <strong>{campaign.school.schoolName}</strong>. Chỉ học sinh của trường này mới có thể đặt đồng phục trong chiến dịch này.</p>
                ) : (
                  <div className="relative">
                    <button
                      onClick={() => setChildDropOpen(!childDropOpen)}
                      className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-xl font-montserrat text-sm hover:border-sky-300 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <User className="w-4 h-4 text-sky-400" />
                        <span>{children.find(c => c.childId === selectedChild)?.fullName || "Chọn học sinh..."}</span>
                        {(() => {
                          const child = children.find(c => c.childId === selectedChild);
                          if (child && child.heightCm > 0) {
                            return <span className="text-xs text-gray-400 ml-1">({child.heightCm}cm{child.weightKg > 0 ? `, ${child.weightKg}kg` : ""})</span>;
                          }
                          return null;
                        })()}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${childDropOpen ? "rotate-180" : ""}`} />
                    </button>
                    {childDropOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                        {children.filter(c => c.school?.schoolId === campaign.school.id).map(child => (
                          <button
                            key={child.childId}
                            onClick={() => { setSelectedChild(child.childId); setChildDropOpen(false); }}
                            className={`w-full text-left px-4 py-3 font-montserrat text-sm hover:bg-sky-50 transition-colors ${
                              selectedChild === child.childId ? "bg-sky-50 text-sky-700 font-semibold" : "text-gray-700"
                            }`}
                          >
                            <span className="font-medium">{child.fullName}</span>
                            <span className="text-xs text-gray-400 ml-2">{child.grade} • {child.school.schoolName}</span>
                            {child.heightCm > 0 && (
                              <span className="text-xs text-sky-400 ml-1">({child.heightCm}cm)</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Size selector */}
              <div>
                <label className="font-montserrat font-semibold text-sm text-gray-700 mb-2 block">Chọn size</label>
                {modal.loadingVariants ? (
                  <div className="flex items-center gap-2 text-gray-400"><div className="w-4 h-4 border-2 border-gray-200 border-t-sky-500 rounded-full animate-spin" /> Đang tải...</div>
                ) : modal.variants.length === 0 ? (
                  <p className="font-montserrat text-sm text-red-500">Chưa có size cho sản phẩm này.</p>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {modal.variants.map(v => {
                        const isRecommended = v.productVariantId === sizeRec.recommendedVariantId;
                        return (
                          <button
                            key={v.productVariantId}
                            onClick={() => setSelectedVariant(v.productVariantId)}
                            className={`relative px-4 py-2.5 rounded-xl border-2 font-montserrat font-semibold text-sm transition-all ${
                              selectedVariant === v.productVariantId
                                ? "border-sky-500 bg-sky-50 text-sky-700"
                                : isRecommended
                                ? "border-sky-300 bg-sky-50/50 text-sky-600"
                                : "border-gray-200 text-gray-600 hover:border-sky-200"
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
                      <p className="mt-2 font-montserrat text-xs text-sky-500 flex items-center gap-1">
                        <span>⭐</span> {sizeRec.reason}
                      </p>
                    )}
                    {sizeRec.confidence === "low" && sizeRec.reason && (
                      <p className="mt-2 font-montserrat text-xs text-amber-500 flex items-center gap-1">
                        <span>⚠️</span> {sizeRec.reason}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Quantity */}
              <div>
                <label className="font-montserrat font-semibold text-sm text-gray-700 mb-2 block">Số lượng</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setOrderQty(q => Math.max(1, q - 1))}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 hover:border-sky-300 transition-colors"
                  >
                    <Minus className="w-4 h-4 text-gray-500" />
                  </button>
                  <span className="font-montserrat font-bold text-lg w-8 text-center">{orderQty}</span>
                  <button
                    onClick={() => setOrderQty(q => q + 1)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 hover:border-sky-300 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <span className="font-montserrat font-medium text-sm text-gray-500">Tạm tính</span>
                <span className="font-montserrat font-extrabold text-xl text-sky-600">
                  {(modal.outfit.campaignPrice * orderQty).toLocaleString("vi-VN")}₫
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setModal({ open: false, outfit: null, variants: [], loadingVariants: false })}
                  className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-montserrat font-semibold text-sm text-gray-600 hover:border-gray-300 transition-colors"
                >
                  Huỷ
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedChild || !selectedVariant || children.length === 0}
                  className="flex-1 py-3 bg-sky-500 hover:bg-sky-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-montserrat font-semibold text-sm transition-colors flex items-center justify-center gap-2"
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
