import { useEffect, useMemo, useState } from "react";
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
  const [bodygramScans, setBodygramScans] = useState<BodygramHistoryItem[]>([]);
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
    setBodygramScans([]);
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
    if (selectedCampaign?.maxQuantity != null) {
      setOrderQty((current) => Math.min(current, Math.max(1, selectedCampaign.maxQuantity)));
    }
  }, [selectedCampaign?.maxQuantity]);

  useEffect(() => {
    if (!open || !selectedChildId) {
      setBodygramScans([]);
      setSelectedScanRecordId("");
      setSelectedScanDetail(null);
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

    if (selectedScanDetail && outfit.sizeChart?.details?.length) {
      const bodygramRec = recommendSizeFromBodygram(selectedScanDetail, outfit.variants, outfit.sizeChart.details);
      if (bodygramRec.recommendedVariantId) {
        return bodygramRec;
      }

      const fallback = recommendSize(selectedChild.heightCm, selectedChild.weightKg, outfit.variants);
      if (bodygramRec.reason) {
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
  }, [bodygramScans.length, outfit, selectedChild, selectedScanDetail]);

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
        className="bg-white rounded-[8px] border-[3px] border-[#1A1A2E] shadow-[4px_4px_0_#1A1A2E] w-full max-w-[700px] mx-4 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b-[3px] border-[#1A1A2E] bg-[#EDE9FE]">
          <h3 className="font-black text-lg text-[#1A1A2E]">Thêm vào giỏ hàng</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-[4px] border-[2px] border-[#1A1A2E] bg-white shadow-[2px_2px_0_#1A1A2E] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <X className="w-4 h-4 text-[#1A1A2E]" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          {loadingOutfit || !outfit ? (
            <div className="flex items-center gap-2 text-[#97A3B6] text-sm font-semibold">
              <div className="w-4 h-4 border-2 border-[#E5E7EB] border-t-[#B8A9E8] rounded-full animate-spin" />
              Đang tải thông tin đồng phục...
            </div>
          ) : (
            <>
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-[8px] overflow-hidden bg-[#F6F1E8] flex-shrink-0 border-[2px] border-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E]">
                  {outfit.mainImageURL ? (
                    <img src={outfit.mainImageURL} alt={outfit.outfitName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-[#CBCAD7]" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-base text-[#1A1A2E] mb-1">{outfit.outfitName}</h4>
                  <p className="text-sm font-semibold text-[#6B7280]">{outfit.school.schoolName}</p>
                  <p className="font-black text-lg text-[#8B6BFF] mt-1">
                    {(selectedCampaign?.campaignPrice ?? outfit.price).toLocaleString("vi-VN")}₫
                  </p>
                </div>
              </div>

              <div>
                <label className="font-bold text-sm text-[#1A1A2E] mb-2 block">Chọn chiến dịch</label>
                {outfit.campaignOptions.length === 0 ? (
                  <div className="nb-alert nb-alert-warning text-sm">
                    <span>⚠️</span>
                    <span>Hiện chưa có chiến dịch đang mở cho đồng phục này.</span>
                  </div>
                ) : (
                  <div className="relative">
                    <button
                      onClick={() => setCampaignDropOpen((value) => !value)}
                      className="w-full flex items-center justify-between nb-input py-3"
                    >
                      <span className="text-left">
                        <span className="block font-semibold text-sm">
                          {selectedCampaign?.campaignName || "Chọn chiến dịch..."}
                        </span>
                        {selectedCampaign && (
                          <span className="text-xs text-[#97A3B6]">
                            Giá {(selectedCampaign.campaignPrice).toLocaleString("vi-VN")}₫
                          </span>
                        )}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-[#97A3B6] transition-transform ${campaignDropOpen ? "rotate-180" : ""}`} />
                    </button>
                    {campaignDropOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border-[2px] border-[#1A1A2E] rounded-[4px] shadow-[4px_4px_0_#1A1A2E] z-10 max-h-56 overflow-y-auto">
                        {outfit.campaignOptions.map((option) => (
                          <button
                            key={option.campaignOutfitId}
                            onClick={() => {
                              setSelectedCampaignId(option.campaignId);
                              setCampaignDropOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-sm font-semibold hover:bg-[#EDE9FE] transition-colors ${
                              option.campaignId === selectedCampaignId ? "bg-[#EDE9FE] text-[#7C3AED]" : "text-[#1A1A2E]"
                            }`}
                          >
                            <span className="font-bold block">{option.campaignName}</span>
                            <span className="text-xs text-[#97A3B6]">
                              {(option.campaignPrice).toLocaleString("vi-VN")}₫ • đến {new Date(option.endDate).toLocaleDateString("vi-VN")}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-sm text-[#1A1A2E] mb-2 block">Chọn học sinh</label>
                {!isParent || children.length === 0 ? (
                  <div className="nb-alert nb-alert-warning text-sm">
                    <span>⚠️</span>
                    <span>Bạn hiện chưa liên kết với hồ sơ học sinh nào. Hãy liên kết học sinh để tiếp tục đặt đồng phục.</span>
                  </div>
                ) : schoolChildren.length === 0 ? (
                  <div className="nb-alert nb-alert-warning text-sm">
                    <span>⚠️</span>
                    <span>
                      Học sinh của bạn không thuộc trường <strong>{outfit.school.schoolName}</strong>. Chỉ học sinh của trường này mới có thể đặt đồng phục.
                    </span>
                  </div>
                ) : (
                  <div className="relative">
                    <button
                      onClick={() => setChildDropOpen((value) => !value)}
                      className="w-full flex items-center justify-between nb-input py-3"
                    >
                      <span className="flex items-center gap-2">
                        <User className="w-4 h-4 text-[#B8A9E8]" />
                        <span className="font-semibold text-sm">{selectedChild?.fullName || "Chọn học sinh..."}</span>
                        {selectedChild && selectedChild.heightCm > 0 ? (
                          <span className="text-xs text-[#97A3B6]">
                            ({selectedChild.heightCm}cm{selectedChild.weightKg > 0 ? `, ${selectedChild.weightKg}kg` : ""})
                          </span>
                        ) : null}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-[#97A3B6] transition-transform ${childDropOpen ? "rotate-180" : ""}`} />
                    </button>
                    {childDropOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border-[2px] border-[#1A1A2E] rounded-[4px] shadow-[4px_4px_0_#1A1A2E] z-10 max-h-48 overflow-y-auto">
                        {schoolChildren.map((child) => (
                          <button
                            key={child.childId}
                            onClick={() => {
                              setSelectedChildId(child.childId);
                              setChildDropOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-sm font-semibold hover:bg-[#EDE9FE] transition-colors ${
                              selectedChildId === child.childId ? "bg-[#EDE9FE] text-[#7C3AED]" : "text-[#1A1A2E]"
                            }`}
                          >
                            <span className="font-bold">{child.fullName}</span>
                            <span className="text-xs text-[#97A3B6] ml-2">{child.grade} • {child.school.schoolName}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedChild && (
                <div>
                  <label className="font-bold text-sm text-[#1A1A2E] mb-2 block">Lần scan Bodygram</label>
                  {loadingScans ? (
                    <div className="flex items-center gap-2 text-[#97A3B6] text-sm font-semibold">
                      <div className="w-4 h-4 border-2 border-[#E5E7EB] border-t-[#B8A9E8] rounded-full animate-spin" />
                      Đang tải lịch sử scan...
                    </div>
                  ) : bodygramScans.length === 0 ? (
                    <div className="nb-alert nb-alert-warning text-sm">
                      <span>⚠️</span>
                      <span>Chưa có dữ liệu số đo Bodygram, hệ thống sẽ tự động đề xuất dựa trên chiều cao và cân nặng của bé.</span>
                    </div>
                  ) : (
                    <div className="relative">
                      <button
                        onClick={() => setScanDropOpen((value) => !value)}
                        className="w-full flex items-center justify-between nb-input py-3"
                      >
                        <span className="font-semibold text-sm">
                          {(() => {
                            const scan = bodygramScans.find((item) => item.scanRecordId === selectedScanRecordId);
                            if (!scan) return "Chọn lần scan...";
                            return `${new Date(scan.scannedAt).toLocaleDateString("vi-VN")} • ${scan.heightCm}cm • ${scan.weightKg}kg`;
                          })()}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-[#97A3B6] transition-transform ${scanDropOpen ? "rotate-180" : ""}`} />
                      </button>
                      {scanDropOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border-[2px] border-[#1A1A2E] rounded-[4px] shadow-[4px_4px_0_#1A1A2E] z-10 max-h-48 overflow-y-auto">
                          {bodygramScans.map((scan) => (
                            <button
                              key={scan.scanRecordId}
                              onClick={() => {
                                setSelectedScanRecordId(scan.scanRecordId);
                                setScanDropOpen(false);
                              }}
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
                        <p className="mt-2 text-xs font-semibold text-[#97A3B6]">Đang tải chi tiết scan...</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="font-bold text-sm text-[#1A1A2E] mb-2 block">Chọn size</label>
                {outfit.variants.length === 0 ? (
                  <div className="nb-alert nb-alert-error text-sm">
                    <span>❌</span>
                    <span>Chưa có size cho sản phẩm này.</span>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {outfit.variants.map((variant) => {
                        const isRecommended = variant.productVariantId === recommendation.recommendedVariantId;
                        return (
                          <button
                            key={variant.productVariantId}
                            onClick={() => setSelectedVariantId(variant.productVariantId)}
                            className={`relative px-4 py-2.5 rounded-[4px] border-[2px] font-bold text-sm transition-all ${
                              selectedVariantId === variant.productVariantId
                                ? "border-[#1A1A2E] bg-[#B8A9E8] text-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E]"
                                : isRecommended
                                  ? "border-[#B8A9E8] bg-[#EDE9FE] text-[#7C3AED]"
                                  : "border-[#E5E7EB] text-[#6B7280] hover:border-[#B8A9E8]"
                            }`}
                          >
                            {isRecommended && <span className="absolute -top-2 -right-1 text-xs">⭐</span>}
                            {variant.size}
                          </button>
                        );
                      })}
                    </div>
                    {recommendation.reason && (
                      <p
                        className={`mt-2 text-xs font-semibold flex items-center gap-1 ${
                          recommendation.confidence === "low" ? "text-[#D97706]" : "text-[#7C3AED]"
                        }`}
                      >
                        <span>{recommendation.confidence === "low" ? "⚠️" : "⭐"}</span>
                        {recommendation.reason}
                      </p>
                    )}
                  </>
                )}
              </div>

              <div>
                <label className="font-bold text-sm text-[#1A1A2E] mb-2 block">Số lượng</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setOrderQty((value) => Math.max(1, value - 1))}
                    className="w-9 h-9 flex items-center justify-center rounded-[4px] border-[2px] border-[#1A1A2E] bg-white shadow-[2px_2px_0_#1A1A2E] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  >
                    <Minus className="w-4 h-4 text-[#1A1A2E]" />
                  </button>
                  <span className="font-black text-lg w-8 text-center text-[#1A1A2E]">{orderQty}</span>
                  <button
                    onClick={() =>
                      setOrderQty((value) => {
                        const next = value + 1;
                        if (selectedCampaign?.maxQuantity != null) {
                          return Math.min(next, selectedCampaign.maxQuantity);
                        }
                        return next;
                      })
                    }
                    className="w-9 h-9 flex items-center justify-center rounded-[4px] border-[2px] border-[#1A1A2E] bg-white shadow-[2px_2px_0_#1A1A2E] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  >
                    <Plus className="w-4 h-4 text-[#1A1A2E]" />
                  </button>
                  {selectedCampaign?.maxQuantity != null && (
                    <span className="text-xs font-semibold text-[#97A3B6]">Tối đa {selectedCampaign.maxQuantity}</span>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t-[2px] border-[#E5E7EB]">
                <span className="font-semibold text-sm text-[#6B7280]">Tạm tính</span>
                <span className="font-black text-xl text-[#8B6BFF]">
                  {((selectedCampaign?.campaignPrice ?? 0) * orderQty).toLocaleString("vi-VN")}₫
                </span>
              </div>

              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 nb-btn nb-btn-outline text-sm">
                  Huỷ
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={!canOrder}
                  className="flex-1 nb-btn nb-btn-purple text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Thêm vào giỏ
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
