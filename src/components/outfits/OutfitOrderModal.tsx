import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, ChevronDown, Loader2, Minus, Package, Plus, ShieldCheck, ShoppingCart, Star, Truck, User, X } from "lucide-react";
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
import { getBestCompatibility, recommendSize, recommendSizeFromBodygram, type SizeRecommendation } from "../../lib/utils/sizeRecommendation";
import { useCart } from "../../contexts/CartContext";
import { useToast } from "../../contexts/ToastContext";
import { getAllSchoolSemesterCatalogs, getProviderPublicProfile, getProvidersForPublicationOutfit, type SemesterCatalogProviderDto, type PublicProviderProfileDto, type SchoolSemesterCatalogResponse } from "../../lib/api/public";

type Props = {
  open: boolean;
  onClose: () => void;
  outfitId: string | null;
  semesterPublicationId?: string | null;
  preloadedOutfit?: OutfitDetailDto | null;
};

const emptyRecommendation: SizeRecommendation = {
  recommendedVariantId: null,
  recommendedSize: "",
  confidence: "low",
  reason: "",
  sizeCompatibilities: [],
};

const formatCurrency = (value: number) => `${value.toLocaleString("vi-VN")} ₫`;

function getProviderBadge(index: number) {
  if (index === 0) return "nb-badge nb-badge-green";
  if (index === 1) return "nb-badge nb-badge-blue";
  return "nb-badge";
}

export function OutfitOrderModal({
  open,
  onClose,
  outfitId,
  semesterPublicationId,
  preloadedOutfit,
}: Props): JSX.Element | null {
  const cart = useCart();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [outfit, setOutfit] = useState<OutfitDetailDto | null>(preloadedOutfit ?? null);
  const [loading, setLoading] = useState(false);
  const [children, setChildren] = useState<ChildProfileDto[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [orderQty, setOrderQty] = useState(1);
  const [scanDropOpen, setScanDropOpen] = useState(false);
  const [bodygramScans, setBodygramScans] = useState<BodygramHistoryItem[] | null>(null);
  const [loadingScans, setLoadingScans] = useState(false);
  const [selectedScanRecordId, setSelectedScanRecordId] = useState("");
  const [selectedScanDetail, setSelectedScanDetail] = useState<BodygramScanDetail | null>(null);
  const [loadingScanDetail, setLoadingScanDetail] = useState(false);

  // Marketplace states
  const [providers, setProviders] = useState<SemesterCatalogProviderDto[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [providerProfile, setProviderProfile] = useState<PublicProviderProfileDto | null>(null);
  const [catalogs, setCatalogs] = useState<SchoolSemesterCatalogResponse[]>([]);
  const [activeSemesterId, setActiveSemesterId] = useState(semesterPublicationId ?? "");

  const isParent = useMemo(() => {
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    try {
      return raw ? JSON.parse(raw).role === "Parent" : false;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!open || !outfitId) return;
    let disposed = false;
    setLoading(true);
    setLoadingChildren(isParent);

    Promise.all([
      getPublicOutfitDetail(outfitId),
      isParent ? getMyChildren() : Promise.resolve([]),
    ]).then(async ([detail, childList]) => {
      if (disposed) return;
      setOutfit(detail);
      setChildren(childList);

      // Only fetch all catalogs and show dropdown if we AREN'T already in a specific catalog context
      if (!semesterPublicationId) {
        const schoolCatalogs = await getAllSchoolSemesterCatalogs(detail.school.schoolId);
        if (disposed) return;
        setCatalogs(schoolCatalogs);

        if (!activeSemesterId && schoolCatalogs.length > 0) {
          setActiveSemesterId(schoolCatalogs[0].semesterPublicationId);
        }
      } else {
        setActiveSemesterId(semesterPublicationId);
      }

      const schoolChildren = (childList as ChildProfileDto[]).filter(c => c.school?.schoolId === detail.school.schoolId);
      setSelectedChildId(schoolChildren[0]?.childId ?? (childList as ChildProfileDto[])[0]?.childId ?? "");

      setSelectedVariantId("");
      setOrderQty(1);
    }).catch((err) => {
      if (!disposed) showToast({ title: "Lỗi", message: "Không thể tải thông tin sản phẩm.", variant: "error" });
    }).finally(() => {
      if (!disposed) {
        setLoading(false);
        setLoadingChildren(false);
      }
    });

    return () => { disposed = true; };
  }, [open, outfitId, isParent]);

  // Load providers when semester changes
  useEffect(() => {
    if (!open || !outfitId || !activeSemesterId) {
      setProviders([]);
      setSelectedProviderId("");
      return;
    }
    let disposed = false;
    
    // Reset immediately to avoid stale data flicker
    setProviders([]);
    setSelectedProviderId("");

    getProvidersForPublicationOutfit(activeSemesterId, outfitId).then((providerList) => {
      if (disposed) return;
      setProviders(providerList);
      if (providerList.length > 0) {
        setSelectedProviderId(providerList[0].providerId);
      }
    });
    return () => { disposed = true; };
  }, [open, outfitId, activeSemesterId]);

  useEffect(() => {
    if (!selectedProviderId) { setProviderProfile(null); return; }
    let disposed = false;
    getProviderPublicProfile(selectedProviderId).then((profile) => {
      if (!disposed) setProviderProfile(profile);
    }).catch(() => {
      if (!disposed) setProviderProfile(null);
    });
    return () => { disposed = true; };
  }, [selectedProviderId]);

  const schoolChildren = useMemo(
    () => children.filter((child) => child.school?.schoolId === outfit?.school.schoolId),
    [children, outfit?.school.schoolId]
  );

  const selectedChild = useMemo(
    () => schoolChildren.find((child) => child.childId === selectedChildId) ?? null,
    [schoolChildren, selectedChildId]
  );

  const selectedProvider = useMemo(
    () => providers.find(p => p.providerId === selectedProviderId) || null,
    [providers, selectedProviderId]
  );

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
    getChildBodygramScans(selectedChildId, 1, 10).then((response) => {
      if (disposed) return;
      const scans = [...response.items].sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());
      setBodygramScans(scans);
      setSelectedScanRecordId(scans[0]?.scanRecordId ?? "");
    }).catch(() => {
      if (!disposed) { setBodygramScans([]); setSelectedScanRecordId(""); }
    }).finally(() => {
      if (!disposed) setLoadingScans(false);
    });
    return () => { disposed = true; };
  }, [open, selectedChildId]);

  useEffect(() => {
    if (!selectedScanRecordId) { setSelectedScanDetail(null); return; }
    let disposed = false;
    setLoadingScanDetail(true);
    getBodygramScanDetail(selectedScanRecordId).then((detail) => {
      if (!disposed) setSelectedScanDetail(detail);
    }).catch(() => {
      if (!disposed) setSelectedScanDetail(null);
    }).finally(() => {
      if (!disposed) setLoadingScanDetail(false);
    });
    return () => { disposed = true; };
  }, [selectedScanRecordId]);

  const recommendation = useMemo((): SizeRecommendation => {
    if (!outfit || !selectedChild || outfit.variants.length === 0) return emptyRecommendation;
    if (loadingChildren || loadingScans || bodygramScans === null) return emptyRecommendation;
    if (selectedScanRecordId && (loadingScanDetail || !selectedScanDetail)) return emptyRecommendation;
    if (selectedScanDetail && outfit.sizeChart?.details?.length) {
      const bodygramRec = recommendSizeFromBodygram(selectedScanDetail, outfit.variants, outfit.sizeChart.details);
      if (bodygramRec?.recommendedVariantId) return bodygramRec;
      const fallback = recommendSize(selectedChild.heightCm, selectedChild.weightKg, outfit.variants);
      return bodygramRec?.reason ? { ...fallback, confidence: "medium", reason: `${bodygramRec.reason}. ${fallback.reason}` } : fallback;
    }
    if (bodygramScans && bodygramScans.length > 0) {
      const fallback = recommendSize(selectedChild.heightCm, selectedChild.weightKg, outfit.variants);
      return { ...fallback, confidence: "medium", reason: `Dữ liệu AI Bodygram chưa sẵn sàng. Đề xuất dựa trên ${fallback.reason.toLowerCase()}` };
    }
    return recommendSize(selectedChild.heightCm, selectedChild.weightKg, outfit.variants);
  }, [bodygramScans, loadingChildren, loadingScans, loadingScanDetail, outfit, selectedChild, selectedScanDetail, selectedScanRecordId]);

  useEffect(() => {
    if (!outfit) return;
    if (recommendation.recommendedVariantId) {
      setSelectedVariantId(recommendation.recommendedVariantId);
    } else {
      setSelectedVariantId(v => v || outfit.variants[0]?.productVariantId || "");
    }
  }, [outfit, recommendation.recommendedVariantId]);

  const selectedVariant = useMemo(
    () => outfit?.variants.find((variant) => variant.productVariantId === selectedVariantId) ?? null,
    [outfit?.variants, selectedVariantId]
  );

  const selectedCompatibility = useMemo(
    () => getBestCompatibility(recommendation, selectedVariantId),
    [recommendation, selectedVariantId]
  );

  const handleAddToCart = () => {
    if (!outfit || !selectedChild || !selectedVariant) return;

    if (activeSemesterId) {
      if (!selectedProvider) {
        showToast({ title: "Thiếu thông tin", message: "Vui lòng chọn nhà cung cấp.", variant: "error" });
        return;
      }
      cart.addItem({
        campaignOutfitId: `marketplace-${activeSemesterId}-${selectedProvider.providerId}-${outfit.outfitId}`,
        outfitId: outfit.outfitId,
        outfitName: outfit.outfitName,
        productVariantId: selectedVariant.productVariantId,
        size: selectedVariant.size,
        quantity: orderQty,
        price: selectedProvider.price,
        imageURL: outfit.mainImageURL,
        studentName: selectedChild.fullName,
        studentClass: selectedChild.grade,
        childProfileId: selectedChild.childId,
        campaignId: activeSemesterId,
        schoolId: outfit.school.schoolId,
        schoolName: outfit.school.schoolName,
        campaignLabel: "Semester Catalog",
        providerId: selectedProvider.providerId,
        providerName: selectedProvider.providerName,
        semesterPublicationId: activeSemesterId,
        orderMode: "marketplace",
      });
    } else {
      showToast({ title: "Lỗi", message: "Vui lòng chọn học kỳ khả dụng.", variant: "error" });
      return;
    }

    showToast({ title: "Thành công", message: `Đã thêm "${outfit.outfitName}" vào giỏ hàng`, variant: "success" });
    onClose();
  };

  if (!open) return null;

  const currentPrice = activeSemesterId ? (selectedProvider?.price ?? outfit?.price ?? 0) : (outfit?.price ?? 0);
  const total = currentPrice * orderQty;
  const canOrder = Boolean(selectedChild && selectedVariant && (activeSemesterId ? selectedProvider : true));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[20px] border border-gray-200 bg-white shadow-soft-md" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-slate-50 px-5 py-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-violet-500">Mô-đun đặt hàng</p>
            <h3 className="mt-0.5 text-lg font-extrabold text-gray-900">{outfit?.outfitName || "Đang tải..."}</h3>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-gray-200 bg-white shadow-sm transition-all hover:scale-[0.98]">
            <X className="h-4 w-4 text-gray-900" />
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center gap-3 text-sm font-bold text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
            Đang tải dữ liệu sản phẩm...
          </div>
        ) : !outfit ? (
          <div className="flex min-h-[400px] items-center justify-center p-8 text-center">
            <p className="text-gray-500 font-bold">Không tìm thấy thông tin đồng phục.</p>
          </div>
        ) : (
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Left Column: Configuration */}
            <div className="space-y-6 border-b border-gray-200 p-5 lg:border-b-0 lg:border-r">
              {/* Product Info Summary */}
              <div className="flex gap-4 rounded-[16px] border border-gray-200 bg-gradient-to-br from-violet-50 via-white to-slate-50 p-3 shadow-sm">
                <div className="h-20 w-20 overflow-hidden rounded-[12px] border border-gray-200 bg-white">
                  {outfit.mainImageURL ? <img src={outfit.mainImageURL} alt={outfit.outfitName} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-gray-400"><Package className="h-6 w-6" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-violet-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-violet-600">
                    <ShieldCheck className="h-3 w-3" />
                    Verified Product
                  </div>
                  <h4 className="text-sm font-extrabold text-gray-900 truncate">{outfit.outfitName}</h4>
                  <p className="text-[11px] font-bold text-violet-600 mt-1 uppercase tracking-tighter">{outfit.school.schoolName}</p>
                  <p className="mt-1 text-base font-black text-violet-600">{formatCurrency(currentPrice)}</p>
                </div>
              </div>

              {/* Child Selection */}
              <div className="space-y-4">
                <label className="block space-y-1.5">
                  <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-gray-500">
                    <User className="w-3 h-3" />
                    Hồ sơ học sinh
                  </span>
                  <select
                    value={selectedChildId}
                    onChange={(e) => setSelectedChildId(e.target.value)}
                    className="w-full rounded-[10px] border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-900 shadow-sm outline-none focus:border-violet-400 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20fill%3D%27none%27%20viewBox%3D%270%200%2020%2020%27%3E%3Cpath%20stroke%3D%27%236b7280%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%20stroke-width%3D%271.5%27%20d%3D%27m6%208%204%204%204-4%27%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
                  >
                    <option value="">Chọn học sinh...</option>
                    {schoolChildren.length > 0 ? (
                      schoolChildren.map((child) => <option key={child.childId} value={child.childId}>{child.fullName} · {child.grade}</option>)
                    ) : (
                      <option disabled>Không có học sinh tại trường này</option>
                    )}
                  </select>
                </label>

                {/* AI Size Advisor Integration */}
                {(selectedChild || loadingChildren) && (
                  <div className="bg-sky-100 border border-gray-200 rounded-[16px] p-4 shadow-soft-sm relative z-20">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-sm">
                        <span className="text-sm">🤖</span>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-black text-[11px] text-gray-900 leading-tight uppercase tracking-tight">AI Size Recommendation</h5>
                        <p className="text-[9px] font-extrabold text-sky-700 uppercase tracking-tighter">Powered by Bodygram</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {loadingChildren || loadingScans || ((bodygramScans?.length ?? 0) > 0 && !selectedScanRecordId) ? (
                        <div className="flex items-center gap-2 py-2 text-sky-700 text-[10px] font-bold">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Analyzing scan history...
                        </div>
                      ) : (bodygramScans?.length ?? 0) === 0 ? (
                        <div className="bg-white/60 border border-dashed border-sky-300 rounded-lg p-3">
                          <p className="text-[10px] font-bold text-gray-900 leading-relaxed italic">
                            Chưa có dữ liệu từ Bodygram. Đề xuất dựa trên chiều cao ({selectedChild?.heightCm}cm) và cân nặng ({selectedChild?.weightKg}kg).
                          </p>
                          <Link to={`/children/${selectedChild?.childId}/scan`} className="mt-2 block w-full py-1.5 bg-white border border-gray-200 rounded-md text-center text-[9px] font-black uppercase tracking-wider hover:bg-sky-50">
                            Quét 3D ngay
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
                        </div>
                      )}
                      {recommendation.reason && (
                        <div className="bg-sky-200/50 border border-sky-300 rounded-[10px] p-2.5">
                          <p className="text-[10px] font-bold text-gray-900 leading-relaxed leading-tight flex gap-2">
                            <span className="mt-0.5 flex-shrink-0">💡</span> {recommendation.reason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Size Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between ml-1 text-[10px] font-black uppercase tracking-wider text-gray-500">
                  <span>Kích cỡ đồng phục</span>
                  <span className="text-violet-500 italic">Recommended: {recommendation.recommendedSize || "—"}</span>
                </div>
                {selectedCompatibility && (
                  <div className="rounded-[10px] border border-sky-200 bg-sky-50 px-3 py-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-sky-700">Độ tương thích size đang chọn</p>
                        <p className="mt-1 text-[12px] font-extrabold text-gray-900">
                          Size {selectedCompatibility.size} tương thích {selectedCompatibility.fitPercentage}%
                        </p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${selectedCompatibility.fitLabel === "best"
                          ? "bg-emerald-100 text-emerald-700"
                          : selectedCompatibility.fitLabel === "good"
                            ? "bg-sky-100 text-sky-700"
                            : selectedCompatibility.fitLabel === "consider"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-rose-100 text-rose-700"
                        }`}>
                        {selectedCompatibility.fitLabel === "best"
                          ? "Rất hợp"
                          : selectedCompatibility.fitLabel === "good"
                            ? "Khá hợp"
                            : selectedCompatibility.fitLabel === "consider"
                              ? "Cân nhắc"
                              : "Rủi ro"}
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] font-bold leading-relaxed text-sky-900">
                      {selectedCompatibility.reason}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-5">
                  {outfit.variants.map((v) => {
                    const isRec = v.productVariantId === recommendation.recommendedVariantId;
                    const isSel = v.productVariantId === selectedVariantId;
                    const compatibility = recommendation.sizeCompatibilities?.find((item) => item.variantId === v.productVariantId) ?? null;
                    return (
                      <button
                        key={v.productVariantId}
                        onClick={() => setSelectedVariantId(v.productVariantId)}
                        className={`relative flex min-h-[64px] flex-col items-center justify-center rounded-[10px] border-[2px] px-2 py-2 text-center transition-all ${isSel ? "border-violet-600 bg-violet-600 text-white shadow-sm" :
                            isRec ? "border-violet-200 bg-violet-50 text-violet-700" :
                              "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300"
                          }`}
                      >
                        {isRec && <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-amber-400 border border-white rounded-full flex items-center justify-center text-[6px]">⭐</div>}
                        <span className="text-[12px] font-extrabold">{v.size}</span>
                        {compatibility && (
                          <span className={`mt-1 text-[10px] font-black ${isSel ? "text-white/90" : compatibility.fitPercentage >= 85 ? "text-emerald-600" : compatibility.fitPercentage >= 70 ? "text-sky-600" : compatibility.fitPercentage >= 55 ? "text-amber-600" : "text-rose-500"}`}>
                            {compatibility.fitPercentage}%
                          </span>
                        )}
                        {compatibility?.stretchProfile.isStretchy && (
                          <span className={`mt-0.5 text-[8px] font-black uppercase ${isSel ? "text-white/80" : "text-violet-500"}`}>
                            Co giãn {compatibility.stretchProfile.stretchPercent}%
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Semester Selection - Only show if not pre-selected by parent page */}
              {!semesterPublicationId && (
                <div className="space-y-4">
                  <label className="block space-y-1.5">
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-gray-500">
                      <ShoppingCart className="w-3" />
                      Học kỳ áp dụng
                    </span>
                    <select
                      value={activeSemesterId}
                      onChange={(e) => setActiveSemesterId(e.target.value)}
                      className="w-full rounded-[10px] border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-900 shadow-sm outline-none focus:border-violet-400 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20fill%3D%27none%27%20viewBox%3D%270%200%2020%2020%27%3E%3Cpath%20stroke%3D%27%236b7280%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%20stroke-width%3D%271.5%27%20d%3D%27m6%208%204%204%204-4%27%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
                    >
                      <option value="">Chọn học kỳ...</option>
                      {catalogs.map((c) => (
                        <option key={c.semesterPublicationId} value={c.semesterPublicationId}>
                          {c.semester} · {c.academicYear}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}

              {/* Provider Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">Nhà cung cấp học kỳ</span>
                  <span className="text-[11px] font-bold text-gray-400">Tùy chọn</span>
                </div>
                {providers.length > 0 ? (
                  <div className="space-y-2">
                    {providers.map((provider, index) => (
                      <button
                        key={provider.providerId}
                        type="button"
                        onClick={() => setSelectedProviderId(provider.providerId)}
                        className={`w-full rounded-[12px] border p-3 text-left transition-all ${provider.providerId === selectedProviderId ? "border-violet-400 bg-violet-50 shadow-sm" : "border-gray-200 bg-white shadow-sm hover:-translate-y-[1px]"
                          }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className={`${getProviderBadge(index)} !px-1.5 !py-0.5 !text-[9px]`}>
                                {index === 0 ? "Giá tốt" : index === 1 ? "Đề xuất" : "Nhà cung cấp"}
                              </span>
                              <span className="text-sm font-extrabold text-gray-900">{provider.providerName}</span>
                            </div>
                            <div className="mt-1.5 flex flex-wrap gap-2 text-xs font-medium text-gray-500">
                              <span className="inline-flex items-center gap-1">
                                <Star className="h-3 w-3 text-amber-400" />
                                {provider.averageRating.toFixed(1)}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                                {provider.totalCompletedOrders} đơn
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-gray-400">Đơn giá</p>
                            <p className="mt-0.5 text-base font-extrabold text-violet-600">{formatCurrency(provider.price)}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[16px] border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                    <p className="text-xs font-bold text-gray-400 italic">Không có nhà cung cấp khả dụng cho học kỳ này.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-5 bg-slate-50 p-5 lg:p-6">
              {providerProfile && (
                <div className="rounded-[16px] border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="mb-2 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-gray-200 bg-emerald-50">
                      <Truck className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-gray-400">Thông tin NCC</p>
                      <h4 className="text-sm font-extrabold text-gray-900">{providerProfile.providerName}</h4>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs font-medium text-gray-500">
                    {providerProfile.contactPersonName && <p>Phụ trách: <span className="font-bold text-gray-900">{providerProfile.contactPersonName}</span></p>}
                    {providerProfile.phone && <p>Điện thoại: <span className="font-bold text-gray-900">{providerProfile.phone}</span></p>}
                    {providerProfile.address && <p>Địa chỉ: <span className="font-bold text-gray-900 truncate" title={providerProfile.address}>{providerProfile.address.length > 40 ? providerProfile.address.substring(0, 40) + "..." : providerProfile.address}</span></p>}
                  </div>
                </div>
              )}

              <div className="rounded-[18px] border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[9px] font-black uppercase text-gray-400 mb-1">Cấu hình đơn hàng</p>
                    <h4 className="text-sm font-extrabold text-gray-900 line-clamp-1">{selectedChild?.fullName || "—"}</h4>
                    <p className="text-[10px] font-bold text-gray-400">{selectedVariant?.size ? `Size ${selectedVariant.size}` : "—"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase text-gray-400 mb-1">Thành tiền</p>
                    <p className="text-xl font-black text-violet-600">{formatCurrency(total)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-gray-200 p-3.5">
                  <span className="text-[11px] font-black uppercase text-gray-400 italic">Số lượng</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setOrderQty(q => Math.max(1, q - 1))} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-lg font-black shadow-sm transition-all hover:scale-95 active:scale-90">-</button>
                    <span className="text-sm font-black text-gray-900 w-4 text-center">{orderQty}</span>
                    <button onClick={() => setOrderQty(q => q + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-lg font-black shadow-sm transition-all hover:scale-95 active:scale-90">+</button>
                  </div>
                </div>
              </div>

              <div className="rounded-[18px] border border-dashed border-violet-200 bg-violet-50/50 p-4">
                <p className="text-[10px] font-black uppercase text-violet-600">Lưu ý trước khi đặt</p>
                <div className="mt-2 space-y-2 text-[11px] font-bold text-gray-600 leading-snug">
                  <p className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5" /> Kiểm tra lại hồ sơ học sinh đăng ký tại trường.</p>
                  <p className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5" /> Tham khảo đề xuất AI để tránh chọn nhầm size.</p>
                </div>
              </div>

              <div className="space-y-3">
                {!isParent ? (
                  <button onClick={() => navigate("/signin")} className="w-full h-12 rounded-xl bg-gray-900 text-white font-black text-xs uppercase tracking-widest shadow-lg transition-all hover:brightness-110 active:scale-95">
                    Đăng nhập để đặt hàng
                  </button>
                ) : (
                  <button
                    disabled={!canOrder}
                    onClick={handleAddToCart}
                    className="w-full h-12 flex items-center justify-center gap-2 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Thêm vào giỏ hàng
                  </button>
                )}
                <button onClick={onClose} className="w-full h-10 rounded-xl border border-gray-200 bg-white text-gray-500 font-bold text-xs uppercase hover:bg-gray-50">
                  Bỏ qua
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
