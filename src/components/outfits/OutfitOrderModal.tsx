import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Minus, Package, Plus, ShoppingCart, User, X } from "lucide-react";
import {
  getPublicOutfitDetail,
  type OutfitDetailDto,
} from "../../lib/api/schools";
import { getMyChildren, type ChildProfileDto } from "../../lib/api/users";
import {
  getBodygramScanDetail,
  getChildBodygramScans,
  type BodygramHistoryItem,
  type BodygramScanDetail,
} from "../../lib/api/bodygram";
import { recommendSize, recommendSizeFromBodygram, type SizeRecommendation } from "../../lib/utils/sizeRecommendation";
import { useCart } from "../../contexts/CartContext";
import { useToast } from "../../contexts/ToastContext";

type Props = {
  open: boolean;
  onClose: () => void;
  outfitId: string | null;
  initialCampaignId?: string | null;
  preloadedOutfit?: OutfitDetailDto | null;
};

const emptyRecommendation: SizeRecommendation = {
  recommendedVariantId: null,
  recommendedSize: "",
  confidence: "low",
  reason: "",
};

export function OutfitOrderModal({
  open,
  onClose,
  outfitId,
  initialCampaignId,
  preloadedOutfit,
}: Props): JSX.Element | null {
  const cart = useCart();
  const { showToast } = useToast();
  const [outfit, setOutfit] = useState<OutfitDetailDto | null>(preloadedOutfit ?? null);
  const [loadingOutfit, setLoadingOutfit] = useState(false);
  const [children, setChildren] = useState<ChildProfileDto[]>([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [orderQty, setOrderQty] = useState(1);
  const [childDropOpen, setChildDropOpen] = useState(false);
  const [campaignDropOpen, setCampaignDropOpen] = useState(false);
  const [scanDropOpen, setScanDropOpen] = useState(false);
  const [bodygramScans, setBodygramScans] = useState<BodygramHistoryItem[] | null>(null);
  const [loadingScans, setLoadingScans] = useState(false);
  const [selectedScanRecordId, setSelectedScanRecordId] = useState("");
  const [selectedScanDetail, setSelectedScanDetail] = useState<BodygramScanDetail | null>(null);
  const [loadingScanDetail, setLoadingScanDetail] = useState(false);

  const isParent = useMemo(() => {
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    try {
      return raw ? JSON.parse(raw).role === "Parent" : false;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    if (preloadedOutfit && preloadedOutfit.outfitId === outfitId) {
      setOutfit(preloadedOutfit);
      return;
    }
    if (!outfitId) {
      setOutfit(null);
      return;
    }

    let disposed = false;
    setLoadingOutfit(true);

    getPublicOutfitDetail(outfitId)
      .then((data) => {
        if (!disposed) setOutfit(data);
      })
      .catch(() => {
        if (!disposed) setOutfit(null);
      })
      .finally(() => {
        if (!disposed) setLoadingOutfit(false);
      });

    return () => {
      disposed = true;
    };
  }, [open, outfitId, preloadedOutfit]);

  useEffect(() => {
    if (!open || !isParent) return;
    getMyChildren().then(setChildren).catch(() => setChildren([]));
  }, [open, isParent]);

  useEffect(() => {
    if (!open || !outfit) return;

    const nextCampaignId = initialCampaignId && outfit.campaignOptions.some((option) => option.campaignId === initialCampaignId)
      ? initialCampaignId
      : outfit.campaignOptions[0]?.campaignId ?? "";
    setSelectedCampaignId(nextCampaignId);

    const schoolChildren = children.filter((child) => child.school?.schoolId === outfit.school.schoolId);
    setSelectedChildId((current) => {
      if (current && schoolChildren.some((child) => child.childId === current)) return current;
      return schoolChildren[0]?.childId ?? "";
    });

    setSelectedVariantId("");
    setOrderQty(1);
    setBodygramScans(null);
    setSelectedScanRecordId("");
    setSelectedScanDetail(null);
    setChildDropOpen(false);
    setCampaignDropOpen(false);
    setScanDropOpen(false);
  }, [open, outfit, children, initialCampaignId]);

  const schoolChildren = useMemo(
    () => children.filter((child) => child.school?.schoolId === outfit?.school.schoolId),
    [children, outfit?.school.schoolId]
  );

  const selectedChild = useMemo(
    () => schoolChildren.find((child) => child.childId === selectedChildId) ?? null,
    [schoolChildren, selectedChildId]
  );

  const selectedCampaign = useMemo(
    () => outfit?.campaignOptions.find((option) => option.campaignId === selectedCampaignId) ?? null,
    [outfit?.campaignOptions, selectedCampaignId]
  );

  useEffect(() => {
    const maxQty = selectedCampaign?.maxQuantity;
    if (maxQty != null) {
      setOrderQty((current) => Math.min(current, Math.max(1, maxQty)));
    }
  }, [selectedCampaign?.maxQuantity]);

  useEffect(() => {
    if (!open || !selectedChildId) {
      setBodygramScans(null);
      setSelectedScanRecordId("");
      setSelectedScanDetail(null);
      setLoadingScans(false);
      return;
    }

    let disposed = false;
    setLoadingScans(true);

    getChildBodygramScans(selectedChildId, 1, 10)
      .then((response) => {
        if (disposed) return;
        const scans = [...response.items].sort(
          (a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime()
        );
        setBodygramScans(scans);
        setSelectedScanRecordId(scans[0]?.scanRecordId ?? "");
      })
      .catch(() => {
        if (disposed) {
          return;
        }
        setBodygramScans([]);
        setSelectedScanRecordId("");
      })
      .finally(() => {
        if (!disposed) setLoadingScans(false);
      });

    return () => {
      disposed = true;
    };
  }, [open, selectedChildId]);

  useEffect(() => {
    if (!selectedScanRecordId) {
      setSelectedScanDetail(null);
      return;
    }

    let disposed = false;
    setLoadingScanDetail(true);

    getBodygramScanDetail(selectedScanRecordId)
      .then((detail) => {
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

  const recommendation = useMemo((): SizeRecommendation => {
    if (!outfit || !selectedChild || outfit.variants.length === 0) {
      return emptyRecommendation;
    }

    if (loadingScans || bodygramScans === null) {
      return emptyRecommendation;
    }

    if (selectedScanRecordId && (loadingScanDetail || !selectedScanDetail)) {
      return emptyRecommendation;
    }

    if (selectedScanDetail && outfit.sizeChart?.details?.length) {
      const bodygramRec = recommendSizeFromBodygram(selectedScanDetail, outfit.variants, outfit.sizeChart.details);
      if (bodygramRec?.recommendedVariantId) {
        return bodygramRec;
      }

      const fallback = recommendSize(selectedChild.heightCm, selectedChild.weightKg, outfit.variants);
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
      const fallback = recommendSize(selectedChild.heightCm, selectedChild.weightKg, outfit.variants);
      return {
        ...fallback,
        confidence: fallback.confidence === "high" ? "medium" : fallback.confidence,
        reason: `Sản phẩm này chưa hỗ trợ phân tích sâu qua Bodygram. Đề xuất dựa trên ${fallback.reason.toLowerCase()}`,
      };
    }

    return recommendSize(selectedChild.heightCm, selectedChild.weightKg, outfit.variants);
  }, [bodygramScans, loadingScans, loadingScanDetail, outfit, selectedChild, selectedScanDetail, selectedScanRecordId]);

  useEffect(() => {
    if (!outfit) return;
    if (recommendation.recommendedVariantId) {
      setSelectedVariantId(recommendation.recommendedVariantId);
      return;
    }
    setSelectedVariantId((current) => current || outfit.variants[0]?.productVariantId || "");
  }, [outfit, recommendation.recommendedVariantId]);

  const selectedVariant = useMemo(
    () => outfit?.variants.find((variant) => variant.productVariantId === selectedVariantId) ?? null,
    [outfit?.variants, selectedVariantId]
  );

  const handleAddToCart = () => {
    if (!outfit || !selectedChild || !selectedVariant || !selectedCampaign) return;

    cart.addItem({
      campaignOutfitId: selectedCampaign.campaignOutfitId,
      outfitId: outfit.outfitId,
      outfitName: outfit.outfitName,
      productVariantId: selectedVariant.productVariantId,
      size: selectedVariant.size,
      quantity: orderQty,
      price: selectedCampaign.campaignPrice,
      imageURL: outfit.mainImageURL,
      studentName: selectedChild.fullName,
      studentClass: selectedChild.grade,
      childProfileId: selectedChild.childId,
      campaignId: selectedCampaign.campaignId,
      schoolId: outfit.school.schoolId,
      schoolName: outfit.school.schoolName,
      campaignLabel: selectedCampaign.campaignName,
    });

    showToast({
      title: "Thành công",
      message: `Đã thêm "${outfit.outfitName}" vào giỏ hàng`,
      variant: "success",
    });
    onClose();
  };

  if (!open) return null;

  const canOrder = Boolean(selectedCampaign && selectedChild && selectedVariant);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-[8px] border border-gray-200 shadow-soft-sm w-full max-w-[640px] mx-4 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-slate-100">
          <h3 className="font-black text-base text-gray-900 uppercase tracking-wide">Thêm vào giỏ hàng</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-[4px] border border-gray-200 bg-white shadow-sm hover:shadow-none hover:scale-[0.98] transition-all"
          >
            <X className="w-4 h-4 text-gray-900" />
          </button>
        </div>

        <div className="p-0 flex flex-col overflow-hidden">
          {loadingOutfit || !outfit ? (
            <div className="flex items-center justify-center p-12 gap-3 text-[#97A3B6] text-sm font-bold">
              <div className="w-5 h-5 border-3 border-gray-200 border-t-[#8B6BFF] rounded-full animate-spin" />
              Đang tải dữ liệu...
            </div>
          ) : (
            <>
              <div className="overflow-y-auto overflow-x-hidden p-5 space-y-5 max-h-[calc(90vh-140px)]">
                {/* 1. Product Summary Block */}
                <div className="flex gap-4 p-3 bg-gray-50 rounded-[8px] border border-gray-200 shadow-sm">
                  <div className="w-20 h-20 rounded-[6px] overflow-hidden bg-white border border-gray-200 flex-shrink-0">
                    {outfit.mainImageURL ? (
                      <img src={outfit.mainImageURL} alt={outfit.outfitName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-[#CBCAD7]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="px-1.5 py-0.5 bg-gray-900 text-white text-[8px] font-black rounded uppercase tracking-wider">Xác thực</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter truncate">{outfit.school.schoolName}</span>
                    </div>
                    <h4 className="font-black text-base text-gray-900 line-clamp-1 mb-1 leading-tight uppercase">{outfit.outfitName}</h4>
                    <div className="flex items-baseline gap-2">
                      <span className="font-black text-xl text-[#8B6BFF]">
                        {(selectedCampaign?.campaignPrice ?? outfit.price).toLocaleString("vi-VN")}₫
                      </span>
                      {selectedCampaign && selectedCampaign.campaignPrice !== outfit.price && (
                        <span className="text-[10px] text-gray-400 line-through font-bold">
                          {outfit.price.toLocaleString("vi-VN")}₫
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Core Selection Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Campaign Card */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 font-bold text-[11px] text-gray-500 uppercase tracking-wider ml-1">
                      <Package className="w-3 h-3" />
                      Chiến dịch đặt hàng
                    </label>
                    {outfit.campaignOptions.length === 0 ? (
                      <div className="nb-alert nb-alert-warning p-3 text-xs">
                        Hiện chưa có chiến dịch đang mở.
                      </div>
                    ) : (
                      <div className="relative">
                        <button
                          onClick={() => setCampaignDropOpen((v) => !v)}
                          className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-[6px] px-3.5 py-2.5 shadow-sm hover:scale-[0.99] hover:shadow-sm transition-all"
                        >
                          <div className="text-left truncate">
                            <span className="block font-black text-[12px] text-gray-900">
                              {selectedCampaign?.campaignName || "Chọn chiến dịch..."}
                            </span>
                          </div>
                          <ChevronDown className={`w-3.5 h-3.5 text-gray-900 transition-transform flex-shrink-0 ${campaignDropOpen ? "rotate-180" : ""}`} />
                        </button>
                        {campaignDropOpen && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-[8px] shadow-soft-md z-30 max-h-56 overflow-y-auto py-1">
                            {outfit.campaignOptions.map((option) => (
                              <button
                                key={option.campaignOutfitId}
                                onClick={() => { setSelectedCampaignId(option.campaignId); setCampaignDropOpen(false); }}
                                className={`w-full text-left px-4 py-3 hover:bg-[#F2ECFF] transition-colors border-b last:border-none border-gray-100 ${option.campaignId === selectedCampaignId ? "bg-violet-50" : ""}`}
                              >
                                <span className="font-black text-[13px] block text-gray-900">{option.campaignName}</span>
                                <span className="text-[10px] font-bold text-gray-400 mt-0.5 block italic truncate">
                                  Hạn chót: {new Date(option.endDate).toLocaleDateString("vi-VN")}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Student Card */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 font-bold text-[11px] text-gray-500 uppercase tracking-wider ml-1">
                      <User className="w-3 h-3" />
                      Thông tin học sinh
                    </label>
                    {!isParent || children.length === 0 ? (
                      <div className="nb-alert nb-alert-warning p-3 text-xs leading-snug">
                        Chưa có hồ sơ học sinh liên kết.
                      </div>
                    ) : schoolChildren.length === 0 ? (
                      <div className="nb-alert nb-alert-warning p-3 text-xs leading-snug">
                        Học sinh không thuộc trường này.
                      </div>
                    ) : (
                      <div className="relative">
                        <button
                          onClick={() => setChildDropOpen((v) => !v)}
                          className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-[6px] px-3.5 py-2.5 shadow-sm hover:scale-[0.99] hover:shadow-sm transition-all"
                        >
                          <div className="text-left truncate">
                            <span className="block font-black text-[12px] text-gray-900">
                              {selectedChild?.fullName || "Chọn học sinh..."}
                            </span>
                          </div>
                          <ChevronDown className={`w-3.5 h-3.5 text-gray-900 transition-transform flex-shrink-0 ${childDropOpen ? "rotate-180" : ""}`} />
                        </button>
                        {childDropOpen && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-[8px] shadow-soft-md z-30 max-h-56 overflow-y-auto py-1">
                            {schoolChildren.map((child) => (
                              <button
                                key={child.childId}
                                onClick={() => { setSelectedChildId(child.childId); setChildDropOpen(false); }}
                                className={`w-full text-left px-4 py-3 hover:bg-[#F2ECFF] transition-colors border-b last:border-none border-gray-100 ${selectedChildId === child.childId ? "bg-violet-50" : ""}`}
                              >
                                <span className="font-black text-[13px] block text-gray-900">{child.fullName}</span>
                                <span className="text-[10px] font-bold text-gray-400 mt-0.5 block italic truncate">
                                  {child.grade} • {child.school.schoolName}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Smart Advisor (Bodygram) Section */}
                {selectedChild && (
                  <div className="bg-sky-100 border border-gray-200 rounded-[10px] p-4 shadow-soft-sm relative z-20">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-white border border-gray-200 rounded-md flex items-center justify-center">
                        <span className="text-sm">🤖</span>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-black text-[12px] text-gray-900 leading-tight uppercase">Cố vấn kích cỡ AI</h5>
                        <p className="text-[9px] font-extrabold text-sky-700 uppercase tracking-tighter">Từ Bodygram</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {loadingScans || ((bodygramScans?.length ?? 0) > 0 && !selectedScanRecordId) ? (
                        <div className="flex items-center gap-2 py-3 text-sky-700 text-xs font-bold italic">
                          <div className="w-3 h-3 border-2 border-white/50 border-t-[#0369A1] rounded-full animate-spin" />
                          Đang tìm kiếm dữ liệu đo lường...
                        </div>
                      ) : (bodygramScans?.length ?? 0) === 0 ? (
                        <div className="bg-white/60 border-2 border-dashed border-gray-200/30 rounded-lg p-4 flex flex-col gap-3">
                          <div className="flex gap-2 items-start">
                            <span className="text-amber-500 text-sm mt-0.5">⚠️</span>
                            <p className="text-[11px] font-bold text-gray-900 leading-relaxed italic">
                              Chưa có dữ liệu từ Bodygram. Hệ thống sẽ đề xuất dựa trên chiều cao ({selectedChild.heightCm}cm) và cân nặng ({selectedChild.weightKg}kg) đã đăng ký.
                            </p>
                          </div>
                          <Link
                            to={`/children/${selectedChild.childId}/scan`}
                            className="flex items-center justify-center gap-2 w-full py-2 bg-white border border-gray-200 rounded-md shadow-sm text-[10px] font-black uppercase tracking-wider hover:scale-[0.99] hover:shadow-sm transition-all"
                          >
                            <span className="text-xs">📸</span>
                            Quét ngay với Bodygram
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="relative">
                            <label className="block text-[9px] font-black text-sky-700 uppercase mb-1.5 ml-1 italic tracking-widest">Chọn phiên bản đo lường</label>
                            <button
                              onClick={() => setScanDropOpen((v) => !v)}
                              className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-[6px] px-3 py-2 shadow-sm transition-all"
                            >
                              <span className="font-black text-[11px] text-gray-900">
                                {(() => {
                                  const scan = bodygramScans?.find((item) => item.scanRecordId === selectedScanRecordId);
                                  return scan ? `${new Date(scan.scannedAt).toLocaleDateString("vi-VN")} — ${scan.heightCm}cm / ${scan.weightKg}kg` : "Chọn ngày quét...";
                                })()}
                              </span>
                              <ChevronDown className={`w-3 h-3 text-gray-900 transition-transform ${scanDropOpen ? "rotate-180" : ""}`} />
                            </button>
                            {scanDropOpen && (
                              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-[8px] shadow-soft-md z-50 max-h-40 overflow-y-auto py-1">
                                {(bodygramScans ?? []).map((scan) => (
                                  <button
                                    key={scan.scanRecordId}
                                    onClick={() => { setSelectedScanRecordId(scan.scanRecordId); setScanDropOpen(false); }}
                                    className={`w-full text-left px-3 py-2 text-[12px] font-bold hover:bg-sky-50 transition-colors ${selectedScanRecordId === scan.scanRecordId ? "bg-sky-100 text-sky-700" : "text-gray-900"}`}
                                  >
                                    Ngày {new Date(scan.scannedAt).toLocaleDateString("vi-VN")} • {scan.heightCm}cm
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          {loadingScanDetail && <p className="text-[10px] font-bold text-sky-700 animate-pulse">Đang nạp dữ liệu phân tích...</p>}
                        </div>
                      )}

                      {recommendation.reason && (
                        <div className="bg-sky-200 border border-gray-200 rounded-lg p-3 flex gap-2 items-start shadow-[inset_1px_1px_3px_rgba(0,0,0,0.1)]">
                          <span className="text-sm mt-0.5">💡</span>
                          <p className="text-[11px] font-bold text-gray-900 leading-relaxed">
                            {recommendation.reason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. Size Selection Block */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between ml-1">
                    <label className="font-black text-[12px] text-gray-900 uppercase tracking-widest">Kích cỡ đề xuất</label>
                    <span className="text-[10px] font-bold text-gray-400 italic">
                      {recommendation.source === "bodygram" ? "Dựa trên Bodygram" : "Dựa trên cân nặng & chiều cao"}
                    </span>
                  </div>

                  {outfit.variants.length === 0 ? (
                    <div className="nb-alert nb-alert-error py-3 text-xs">Chưa có thông tin kích cỡ.</div>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                      {outfit.variants.map((variant) => {
                        const isSelected = selectedVariantId === variant.productVariantId;
                        const isRecommended = variant.productVariantId === recommendation.recommendedVariantId;
                        return (
                          <button
                            key={variant.productVariantId}
                            onClick={() => setSelectedVariantId(variant.productVariantId)}
                            className={`h-10 rounded-[6px] border-[2px] font-black text-[12px] transition-all relative flex items-center justify-center ${isSelected
                              ? "border-gray-200 bg-violet-500 text-white shadow-sm"
                              : isRecommended
                                ? "border-[#8B6BFF] bg-white text-[#8B6BFF] shadow-[1.5px_1.5px_0_#8B6BFF]"
                                : "border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-800"
                              }`}
                          >
                            {isRecommended && (
                              <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-amber-400 border border-gray-200 rounded-full flex items-center justify-center">
                                <span className="text-[7px]">⭐</span>
                              </div>
                            )}
                            {variant.size}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 5. Quantity Adjustment */}
                <div className="flex items-center justify-between p-3.5 bg-slate-100 rounded-[8px] border border-gray-200">
                  <div className="space-y-0.5">
                    <span className="block font-black text-[11px] text-gray-900 uppercase">Số lượng</span>
                    {selectedCampaign?.maxQuantity != null && (
                      <span className="text-[9px] font-bold text-amber-600 uppercase italic">Tối đa {selectedCampaign.maxQuantity} bộ</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setOrderQty((v) => Math.max(1, v - 1))}
                      className="w-9 h-9 flex items-center justify-center rounded-[6px] border border-gray-200 bg-white shadow-sm hover:bg-gray-50 active:scale-[0.98] active:shadow-none transition-all"
                    >
                      <Minus className="w-3.5 h-3.5 text-gray-900" />
                    </button>
                    <span className="font-black text-lg min-w-[25px] text-center text-gray-900">{orderQty}</span>
                    <button
                      onClick={() => setOrderQty((v) => {
                        const next = v + 1;
                        const max = selectedCampaign?.maxQuantity;
                        return (max != null) ? Math.min(next, max) : next;
                      })}
                      className="w-9 h-9 flex items-center justify-center rounded-[6px] border border-gray-200 bg-white shadow-sm hover:bg-gray-50 active:scale-[0.98] active:shadow-none transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 text-gray-900" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 6. Pinned Footer Actions */}
              <div className="mt-auto p-5 bg-white border-t border-gray-200 flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1 text-center sm:text-left">
                  <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Tổng cộng</span>
                  <span className="font-black text-2xl text-[#8B6BFF]">
                    {((selectedCampaign?.campaignPrice ?? outfit.price) * orderQty).toLocaleString("vi-VN")}₫
                  </span>
                </div>
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button onClick={onClose} className="px-5 py-2.5 rounded-[6px] border border-gray-200 font-black text-[12px] text-gray-500 uppercase hover:bg-gray-50 transition-all">
                    Đóng
                  </button>
                  <button
                    onClick={handleAddToCart}
                    disabled={!canOrder}
                    className="flex-1 sm:flex-none px-7 py-2.5 rounded-[6px] border border-gray-200 bg-violet-500 text-white font-black text-[12px] uppercase shadow-soft-sm hover:scale-[0.99] hover:shadow-sm active:scale-[0.97] active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    Thêm vào giỏ
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
