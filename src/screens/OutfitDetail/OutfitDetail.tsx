import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  ChevronRight,
  Heart,
  Star,
  GraduationCap,
  ChevronLeft,
  X,
  Download,
  Sparkles,
  Camera,
  ShoppingBag,
  Box,
  CheckCircle2,
  Info,
  Minus,
  Plus,
  Zap,
  ShieldCheck,
  Truck,
  Home
} from "lucide-react";
import { GuestLayout } from "../../components/layout/GuestLayout";
import {
  getPublicOutfitDetail,
  getSchoolUniforms,
  type OutfitDetailDto,
  type OutfitVariantDto,
} from "../../lib/api/schools";
import { guestTryOn, type GuestTryOnResponse } from "../../lib/api/tryOn";
import { getMyChildren, type ChildProfileDto } from "../../lib/api/users";
import { getChildBodygramScans, getBodygramScanDetail, type BodygramScanDetail } from "../../lib/api/bodygram";
import {
  recommendSize,
  recommendSizeFromBodygram,
  type SizeRecommendation
} from "../../lib/utils/sizeRecommendation";
import { useToast } from "../../contexts/ToastContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { OutfitOrderModal } from "../../components/outfits/OutfitOrderModal";
import { formatRating } from "../../lib/utils/format";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

/* ── helpers ── */
const fmt = (n: number) =>
  n.toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + " VNĐ";

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();

  // Use timezone-aware comparison
  const vnFmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" });
  const dateParts = vnFmt.format(date);
  const nowParts = vnFmt.format(now);
  const dDate = new Date(dateParts + "T00:00:00");
  const dNow = new Date(nowParts + "T00:00:00");
  const diffMs = dNow.getTime() - dDate.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 7) return `${diffDays} ngày trước`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
  return date.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
};

const OUTFIT_TYPE_LABEL: Record<string, string> = {
  Male: "Đồng phục nam",
  Female: "Đồng phục nữ",
  Unisex: "Đồng phục unisex",
};

/* ── Related item type ── */
type RelatedOutfit = {
  outfitId: string;
  outfitName: string;
  price: number;
  mainImageURL: string | null;
  outfitType: string;
};

/* ── TryOn Modal (Neubrutalism) ── */
function TryOnModal({
  isOpen,
  onClose,
  outfitId,
  outfitImage,
  outfitName,
}: {
  isOpen: boolean;
  onClose: () => void;
  outfitId: string;
  outfitImage: string;
  outfitName: string;
}) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<GuestTryOnResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [sessionId, setSessionId] = useState<string>(() => {
    const stored = sessionStorage.getItem("tryon_session_id");
    return stored || "";
  });

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file ảnh (JPG, PNG, WEBP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Ảnh không được vượt quá 10MB.");
      return;
    }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError(null);
    setResult(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleTryOn = async () => {
    if (!photo) return;
    setProcessing(true);
    setError(null);
    try {
      const res = await guestTryOn(outfitId, photo, sessionId || undefined);
      setResult(res);
      if (res.guestSessionId) {
        setSessionId(res.guestSessionId);
        sessionStorage.setItem("tryon_session_id", res.guestSessionId);
      }
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra.");
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setPhoto(null);
    setPhotoPreview(null);
    setResult(null);
    setError(null);
  };

  const handleDownload = async () => {
    if (!result?.resultPhotoUrl) return;
    try {
      const response = await fetch(result.resultPhotoUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tryon-${outfitId.slice(0, 8)}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(result.resultPhotoUrl, "_blank");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop — no blur, NB style */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal — modern panel */}
      <div className="relative bg-white rounded-[18px] border border-gray-200 shadow-soft-lg w-full max-w-[760px] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-gray-200 bg-violet-50 shadow-soft-sm">
              <Sparkles className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <h2 className="font-extrabold text-[20px] text-gray-900 leading-tight">
                Thử đồ ảo (VR)
              </h2>
              <p className="font-bold text-[12px] text-gray-400 mt-0.5 line-clamp-1 max-w-[280px]">
                {outfitName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-gray-200 bg-white shadow-soft-sm transition-all hover:scale-[0.99] hover:shadow-sm"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {!result ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Upload */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-extrabold text-[14px] text-gray-900">
                    Ảnh của bạn
                  </p>
                  {photoPreview && (
                    <span className="rounded-full border border-gray-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-700 shadow-soft-sm">
                      AI READY
                    </span>
                  )}
                </div>
                {!photoPreview ? (
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onClick={() => fileRef.current?.click()}
                    className={`rounded-[14px] border-2 border-dashed p-6 flex flex-col items-center justify-center cursor-pointer transition-all aspect-[3/4] ${dragOver
                      ? "border-violet-400 bg-violet-50"
                      : "border-gray-200 bg-gray-50 hover:border-violet-300 hover:bg-violet-50"
                      }`}
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-[12px] border border-gray-200 bg-white shadow-soft-sm mb-4">
                      <Camera className="w-7 h-7 text-gray-400" />
                    </div>
                    <p className="font-black text-[15px] text-gray-900 text-center">
                      Tải ảnh của bạn lên
                    </p>
                    <p className="font-semibold text-[13px] text-gray-500 mt-1.5 text-center leading-relaxed">
                      Chụp ảnh toàn thân, nền sáng và đứng thẳng để AI thử đồ cho kết quả chính xác hơn.
                    </p>
                    <span className="mt-4 rounded-[8px] border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-extrabold text-gray-600 shadow-soft-sm">
                      JPG, PNG, WEBP · tối đa 10MB
                    </span>
                    <button
                      type="button"
                      className="mt-3 rounded-[10px] border border-gray-200 bg-white px-4 py-2 text-[13px] font-extrabold text-gray-700 shadow-soft-sm transition-all hover:scale-[0.99] hover:shadow-sm"
                    >
                      Chọn ảnh từ máy của bạn
                    </button>
                  </div>
                ) : (
                  <div className="relative rounded-[14px] overflow-hidden border border-gray-200 shadow-soft-sm">
                    <img
                      src={photoPreview}
                      alt="Your photo"
                      className="w-full aspect-[3/4] object-cover"
                    />
                    <button
                      onClick={handleReset}
                      className="absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-[8px] border border-gray-200 bg-white shadow-soft-sm transition-all hover:scale-[0.99] hover:shadow-sm"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(f);
                  }}
                />
              </div>

              {/* Right: Outfit preview */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-extrabold text-[14px] text-gray-900">
                    Đồng phục xem trước
                  </p>
                  <span className="rounded-full border border-gray-200 bg-sky-50 px-2.5 py-0.5 text-[11px] font-extrabold text-sky-600 shadow-soft-sm">
                    PREVIEW
                  </span>
                </div>
                <div className="rounded-[14px] overflow-hidden border border-gray-200 shadow-soft-sm bg-gray-50">
                  <img
                    src={outfitImage}
                    alt={outfitName}
                    className="w-full aspect-[3/4] object-cover"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Result view — modern style */
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-gray-200 bg-emerald-50 shadow-soft-sm">
                  <span className="text-[18px]">✨</span>
                </div>
                <h3 className="font-black text-[22px] text-gray-900">
                  Kết quả thử đồ
                </h3>
              </div>
              <div className="rounded-[14px] overflow-hidden border border-gray-200 shadow-soft-md max-w-[400px] w-full">
                <img
                  src={result.resultPhotoUrl}
                  alt="Try-on result"
                  className="w-full aspect-[3/4] object-cover"
                />
              </div>
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 rounded-[10px] border border-purple-500 bg-violet-500 px-5 py-3 text-[14px] font-extrabold text-white shadow-soft-sm transition-all hover:scale-[0.99] hover:shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Tải ảnh
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 rounded-[10px] border border-gray-200 bg-white px-5 py-3 text-[14px] font-extrabold text-gray-700 shadow-soft-sm transition-all hover:scale-[0.99] hover:shadow-sm"
                >
                  Thử lại
                </button>
              </div>
              {result.remainingTries >= 0 && (
                <span className="mt-4 rounded-full border border-gray-200 bg-amber-50 px-3 py-1 text-[12px] font-extrabold text-amber-700 shadow-soft-sm">
                  Còn {result.remainingTries} lượt thử hôm nay
                </span>
              )}
            </div>
          )}

          {/* Error — modern style */}
          {error && (
            <div className="mt-4 rounded-[10px] border border-red-200 bg-red-50 p-3.5 shadow-soft-sm">
              <p className="font-bold text-[13px] text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!result && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-[15px] flex items-center justify-between">
            <p className="font-bold text-[12px] text-gray-400">
              Tính năng thử đồ sử dụng AI
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="rounded-[10px] border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-extrabold text-gray-700 shadow-soft-sm transition-all hover:scale-[0.99] hover:shadow-sm"
              >
                Chọn mẫu khác
              </button>
              <button
                onClick={handleTryOn}
                disabled={!photo || processing}
                className={`flex items-center gap-2 rounded-[10px] border border-purple-500 px-5 py-2.5 text-[13px] font-extrabold transition-all ${!photo || processing
                  ? "bg-gray-100 text-gray-400 shadow-sm cursor-not-allowed"
                  : "bg-violet-500 text-white shadow-soft-sm hover:scale-[0.99] hover:shadow-sm"
                  }`}
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Thử đồ ngay
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
export const OutfitDetail = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const publicationId = searchParams.get("publicationId");
  const requestedTab = searchParams.get("tab");

  const [outfit, setOutfit] = useState<OutfitDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTryOn, setShowTryOn] = useState(false);

  const isParent = (() => {
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    try { return raw ? JSON.parse(raw).role === "Parent" : false; } catch { return false; }
  })();

  // UI state
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<OutfitVariantDto | null>(null);
  const [liked, setLiked] = useState(false);
  const [activeTab, setActiveTab] = useState<"desc" | "size" | "reviews">(
    requestedTab === "size" || requestedTab === "reviews" ? requestedTab : "desc"
  );
  const [related, setRelated] = useState<RelatedOutfit[]>([]);
  const [relatedScroll, setRelatedScroll] = useState(0);
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | "all">("all");
  const [reviewPage, setReviewPage] = useState(1);
  const REVIEW_PAGE_SIZE = 5;
  const { showToast } = useToast();

  // New states for enhanced UI
  const [quantity, setQuantity] = useState(1);
  const [children, setChildren] = useState<ChildProfileDto[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | "none">("none");
  const [recommendation, setRecommendation] = useState<SizeRecommendation | null>(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  const scrollToTabs = () => {
    if (tabsRef.current) {
      tabsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    if (requestedTab === "size" || requestedTab === "reviews" || requestedTab === "desc") {
      setActiveTab(requestedTab);
      setTimeout(scrollToTabs, 0);
    }
  }, [requestedTab]);

  /* ── Fetch outfit ── */
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getPublicOutfitDetail(id)
      .then((data) => {
        setOutfit(data);
        // Pre-select first variant
        if (data.variants?.length) {
          setSelectedVariant(data.variants[0]);
          setSelectedSize(data.variants[0].size);
        }
      })
      .catch(() => setError("Không tìm thấy đồng phục."))
      .finally(() => setLoading(false));
  }, [id]);

  /* ── Fetch children if Parent ── */
  /* ── Filtered children for this school ── */
  const schoolChildren = children.filter(c => c.school?.schoolId === outfit?.school?.schoolId);

  useEffect(() => {
    if (isParent) {
      getMyChildren()
        .then((data) => {
          setChildren(data);
          // If only 1 child matches this school, auto-select them
          const matching = data.filter(c => c.school?.schoolId === outfit?.school?.schoolId);
          if (matching.length === 1) {
            setSelectedChildId(matching[0].childId);
          }
        })
        .catch(() => { });
    }
  }, [isParent, outfit?.school?.schoolId]);

  /* ── Smart Recommendation Logic ── */
  useEffect(() => {
    if (!outfit) return;

    if (selectedChildId === "none") {
      setRecommendation(null);
      return;
    }

    const child = children.find(c => c.childId === selectedChildId);
    if (!child) return;

    const runRecommendation = async () => {
      setRecommendationLoading(true);
      try {
        // 1. Try Bodygram scan first
        const scansRes = await getChildBodygramScans(child.childId, 1, 1);
        if (scansRes.items.length > 0) {
          const latestScan = await getBodygramScanDetail(scansRes.items[0].scanRecordId);
          const rec = recommendSizeFromBodygram(
            latestScan,
            outfit.variants,
            outfit.sizeChart?.details || []
          );
          if (rec && rec.recommendedVariantId) {
            setRecommendation(rec);
            setRecommendationLoading(false);
            return;
          }
        }

        // 2. Fallback to basic measurements
        const rec = recommendSize(
          child.heightCm,
          child.weightKg,
          outfit.variants.map(v => ({ productVariantId: v.productVariantId, size: v.size }))
        );
        setRecommendation(rec);
      } catch (err) {
        console.error("Recommendation error:", err);
      } finally {
        setRecommendationLoading(false);
      }
    };

    runRecommendation();
  }, [selectedChildId, children, outfit]);

  // Auto-select size when recommendation changes
  useEffect(() => {
    if (recommendation?.recommendedSize) {
      handleSizeSelect(recommendation.recommendedSize);
      showToast({
        title: "Gợi ý kích cỡ",
        message: `Chúng tôi gợi ý size ${recommendation.recommendedSize} cho bé ${children.find(c => c.childId === selectedChildId)?.fullName}`,
        variant: "success"
      });
    }
  }, [recommendation]);

  /* ── Fetch related outfits from same school ── */
  useEffect(() => {
    if (!outfit?.school?.schoolId) return;
    getSchoolUniforms(outfit.school.schoolId, 1, 8)
      .then((res: any) => {
        const items = Array.isArray(res) ? res : res?.items ?? [];
        setRelated(items.filter((o: any) => o.outfitId !== outfit.outfitId));
      })
      .catch(() => { });
  }, [outfit]);

  /* ── Size change ── */
  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    const v = outfit?.variants.find((v) => v.size === size) ?? null;
    setSelectedVariant(v);
  };

  // Unique sizes from variants
  const sizes = outfit ? [...new Set(outfit.variants.map((v) => v.size))] : [];

  /* ── Loading / Error states ── */
  if (loading)
    return (
      <GuestLayout bgColor="#f9fafb">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12 py-10 min-h-screen">
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mb-8" />
          <div className="flex flex-col lg:flex-row gap-10">
            <div className="lg:w-[480px] aspect-[4/5] bg-gray-200 rounded-3xl animate-pulse" />
            <div className="flex-1 space-y-4 pt-4">
              <div className="h-10 w-3/4 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-6 w-1/4 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-12 w-1/3 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-24 w-full bg-gray-200 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </GuestLayout>
    );

  if (error || !outfit)
    return (
      <GuestLayout bgColor="#f9fafb">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="font-montserrat font-medium text-gray-500">{error || "Không tìm thấy đồng phục."}</p>
          <button onClick={() => navigate("/schools")} className="text-purple-600 hover:text-purple-700 font-montserrat font-bold">
            ← Quay lại danh sách
          </button>
        </div>
      </GuestLayout>
    );

  const displayPrice = selectedVariant ? selectedVariant.price : outfit.price;
  const mainImage = outfit.mainImageURL ?? "https://placehold.co/500x600?text=No+Image";

  return (
    <GuestLayout bgColor="#FAFAF9">
      {/* ── Background Decorative Elements ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-100/30 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-purple-100/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[5%] left-[15%] w-[25%] h-[25%] bg-amber-100/20 rounded-full blur-[80px]" />
      </div>
      <div className="max-w-[1050px] mx-auto px-4 py-4 lg:py-6">
        {/* Breadcrumbs - Exact style from Reference */}
        <nav className="flex items-center gap-1.5 text-[13px] font-medium text-gray-500 mb-6 overflow-x-auto scrollbar-hide">
          <Link to="/" className="flex items-center gap-1.5 hover:text-gray-800 transition-colors whitespace-nowrap">
            <Home className="w-3.5 h-3.5 mb-0.5" />
            Trang chủ
          </Link>
          <ChevronRight className="w-3 h-3 flex-shrink-0 text-gray-400" />
          <Link to="/outfits" className="hover:text-gray-800 transition-colors whitespace-nowrap">
            Danh sách đồng phục
          </Link>
          <ChevronRight className="w-3 h-3 flex-shrink-0 text-gray-400" />
          <span className="px-3 py-0.5 bg-indigo-100 text-gray-900 font-extrabold rounded-full whitespace-nowrap truncate max-w-[250px]">
            {outfit.outfitName}
          </span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left Side: Sticky Image Gallery - Better Proportions */}
          <div className="w-full lg:w-[45%] xl:w-[48%] lg:sticky lg:top-24">
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="aspect-[4/5] rounded-xl overflow-hidden bg-white border border-gray-200 shadow-soft-md relative group"
              >
                <img
                  src={mainImage}
                  alt={outfit.outfitName}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(event) => {
                    const target = event.currentTarget;
                    target.src = "https://placehold.co/500x600?text=No+Image";
                  }}
                />

                {/* Float Action: Like */}
                <button
                  onClick={() => setLiked(!liked)}
                  className="absolute top-2 left-2 w-7 h-7 bg-white border border-gray-200 rounded-md flex items-center justify-center shadow-sm hover:-translate-y-px hover:shadow-sm transition-all z-10"
                >
                  <Heart className={`w-3 h-3 ${liked ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
                </button>

                {/* Badge: Type */}
                <div className="absolute top-3 right-3 px-3 py-1 bg-[#FFF1BF] border border-gray-200 rounded-lg text-gray-900 text-[10px] font-black uppercase tracking-widest z-10 shadow-sm">
                  {OUTFIT_TYPE_LABEL[outfit.outfitType] ?? outfit.outfitType}
                </div>
              </motion.div>

              {/* Thumbnail gallery - only show the uploaded uniform image */}
              {outfit.mainImageURL && (
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  <button
                    type="button"
                    className="w-10 h-10 rounded-md overflow-hidden border flex-shrink-0 border-sky-400 shadow-soft-sm"
                  >
                      <img
                        src={outfit.mainImageURL}
                        alt={outfit.outfitName}
                        className="w-full h-full object-cover"
                        onError={(event) => {
                          event.currentTarget.src = "https://placehold.co/80x80?text=No+Image";
                        }}
                      />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Product Details & Purchase Card */}
          <div className="lg:w-[58%] xl:w-[56%] flex flex-col gap-5">
            <motion.div
              custom={1} variants={fadeUp} initial="hidden" animate="visible"
              className="space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-600 text-white border-none px-2.5 py-0.5 font-black text-[9px] uppercase rounded-md shadow-sm">Verified</Badge>
                  <span className="text-[11px] font-bold text-gray-400 tracking-widest uppercase">SKU: {selectedVariant?.skuCode || 'OFF-DEF'}</span>
                </div>
                <h1
                  className="nb-font-vietnam font-black text-2xl lg:text-3xl text-gray-900 leading-[1.2]"
                >
                  {outfit.outfitName}
                </h1>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-[#FFF1BF] px-2 py-1 rounded-md border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-0.5 mr-1.5">
                      {[1, 2, 3, 4, 5].map((s) => {
                        const diff = (outfit.averageRating || 0) - s + 1;
                        return (
                          <div key={s} className="relative w-3 h-3">
                            <Star className="absolute inset-0 w-3 h-3 fill-gray-200 text-gray-200" />
                            <div className="absolute inset-0 overflow-hidden" style={{ width: `${Math.max(0, Math.min(100, diff * 100))}%` }}>
                              <Star className="w-3 h-3 fill-gray-900 text-gray-900" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <span className="font-black text-gray-900 text-[11px]">{formatRating(outfit.averageRating)}</span>
                  </div>
                  <span className="text-gray-400 font-bold text-[10px] uppercase tracking-tighter">({outfit.feedbackCount} Phản hồi)</span>
                </div>
              </div>

              {/* Price & School Duo Block */}
              <div className="grid grid-cols-2 gap-3 xl:gap-4">
                <div className="p-3.5 bg-white rounded-xl border-2 border-gray-200 shadow-soft-md">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Giá bán</p>
                  <p
                    className="nb-font-vietnam font-black text-[22px] text-[#0ea5e9]"
                  >
                    {fmt(displayPrice)}
                  </p>
                </div>
                <Link to={`/schools/${outfit.school.schoolId}`} className="p-3.5 bg-gray-50 rounded-xl border-2 border-gray-200 shadow-soft-md hover:scale-[0.99] hover:shadow-sm transition-all">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Cung cấp bởi</p>
                  <p className="font-extrabold text-[13px] text-gray-900 line-clamp-1 truncate uppercase">{outfit.school.schoolName}</p>
                </Link>
              </div>

              {/* Selection Options (The Card) */}
              <div className="bg-white rounded-[12px] p-3 lg:p-4 border border-gray-200 shadow-sm space-y-3">
                {/* Size Selection */}
                {sizes.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[9px] font-black text-gray-900 uppercase tracking-widest">Kích cỡ</h4>
                      <button
                        onClick={() => {
                          setActiveTab("size");
                          setTimeout(scrollToTabs, 100);
                        }}
                        className="text-[8px] font-black text-[#0ea5e9] uppercase hover:underline"
                      >
                        Hướng dẫn size
                      </button>
                    </div>

                    {/* Smart Recommendation Integration */}
                    {isParent && (
                      <div className="p-2 bg-[#DCEBFF] border-[1px] border-gray-200 shadow-sm rounded-md space-y-1.5">
                        {schoolChildren.length > 0 ? (
                          <>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 bg-white border border-gray-200 rounded flex items-center justify-center text-[10px]">🤖</div>
                                <span className="text-[8px] font-black text-gray-900 uppercase">Cố vấn AI</span>
                              </div>
                              {recommendationLoading && <div className="w-2 h-2 border border-gray-200 border-t-transparent rounded-full animate-spin" />}
                            </div>
                            <select
                              value={selectedChildId}
                              onChange={(e) => setSelectedChildId(e.target.value)}
                              className="w-full h-7 bg-white border-[1px] border-gray-200 rounded-sm px-1.5 text-[9px] font-bold text-gray-900 focus:shadow-sm outline-none transition-all"
                            >
                              {schoolChildren.length > 1 && <option value="none">-- CHỌN BÉ --</option>}
                              {schoolChildren.map(c => <option key={c.childId} value={c.childId}>{c.fullName.toUpperCase()}</option>)}
                            </select>
                            {recommendation && (
                              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-1 bg-white/40 p-1 rounded-sm border border-white/50">
                                <CheckCircle2 className="w-2 h-2 text-emerald-600 mt-0.5 flex-shrink-0" />
                                <p className="text-[7.5px] font-bold text-gray-900 leading-tight">{recommendation.reason}</p>
                              </motion.div>
                            )}
                          </>
                        ) : (
                          <div className="flex gap-1.5">
                            <Info className="w-3 h-3 text-gray-900 flex-shrink-0" />
                            <p className="text-[7.5px] font-bold text-gray-700 leading-snug uppercase">
                              KHÔNG CÓ CON TẠI TRƯỜNG {outfit.school.schoolName.toUpperCase()}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1">
                      {sizes.map((size) => {
                        const isSelected = selectedSize === size;
                        const isRecommended = recommendation?.recommendedSize === size;
                        return (
                          <button
                            key={size}
                            onClick={() => handleSizeSelect(size)}
                            className={`min-w-[36px] h-7 rounded-sm font-black text-[10px] transition-all relative border-[1px] ${isSelected
                              ? "bg-[#0ea5e9] text-white border-gray-200 shadow-sm"
                              : "bg-white text-gray-900 border-gray-200 shadow-sm hover:-translate-y-px hover:shadow-sm"}`}
                          >
                            {size}
                            {isRecommended && <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full border-[0.5px] border-gray-200" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity & Action */}
                <div className="space-y-2">
                  <h4 className="text-[9px] font-black text-gray-900 uppercase tracking-widest">Số lượng</h4>
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center bg-gray-50 rounded-md p-0.5 border-[1px] border-gray-200 shadow-sm">
                      <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-5 h-5 rounded-sm bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all text-gray-900"><Minus className="w-2.5 h-2.5" /></button>
                      <span className="w-7 text-center font-black text-[11px]">{quantity}</span>
                      <button onClick={() => setQuantity(q => q + 1)} className="w-5 h-5 rounded-sm bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all text-gray-900"><Plus className="w-2.5 h-2.5" /></button>
                    </div>
                    {selectedVariant && (
                      <p
                        className={`inline-flex h-6 min-w-[94px] items-center justify-center rounded-md px-2 text-[11px] font-extrabold leading-none ${
                          selectedVariant.stockQuantity < 10
                            ? "bg-amber-50 text-amber-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {selectedVariant.stockQuantity > 0
                          ? `Còn: ${selectedVariant.stockQuantity}`
                          : "Hết hàng"}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    {isParent && (
                      <button
                        onClick={() => {
                          setShowOrderModal(true);
                        }}
                        className={`h-9 rounded-md font-black text-[10px] flex items-center justify-center gap-1.5 transition-all uppercase border border-gray-200 ${schoolChildren.length === 0
                          ? "bg-gray-200 text-gray-400 shadow-sm cursor-not-allowed opacity-60"
                          : "bg-[#0ea5e9] text-white shadow-sm hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-sm"
                          }`}
                      >
                        {schoolChildren.length === 0 ? <ShieldCheck className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
                        GIỎ HÀNG
                      </button>
                    )}

                    <button
                      onClick={() => setShowTryOn(true)}
                      className="h-9 rounded-md border border-gray-200 font-black text-[10px] text-gray-900 flex items-center justify-center gap-1.5 bg-[#F2ECFF] shadow-sm hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-sm transition-all uppercase"
                    >
                      <Sparkles className="w-3 h-3 text-gray-900 fill-amber-400" />
                      THỬ ĐỒ VR
                    </button>
                  </div>
                </div>

                {/* Trust Signals - compact but readable */}
                <div className="pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#D9F8E8] border border-gray-200 flex items-center justify-center shadow-sm"><ShieldCheck className="w-3.5 h-3.5 text-gray-900" /></div>
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-tighter leading-tight">Chính hãng</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#DCEBFF] border border-gray-200 flex items-center justify-center shadow-sm"><Truck className="w-3.5 h-3.5 text-gray-900" /></div>
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-tighter leading-tight">Hỏa tốc</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ───── Detail Content Sections ───── */}
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="mt-8">
          <div
            ref={tabsRef}
            id="outfit-tabs"
            className="flex items-center gap-6 border-b border-gray-200 mb-4 overflow-x-auto scrollbar-hide"
          >
            {(
              [
                { key: "desc", label: "MIÊU TẢ" },
                { key: "size", label: "KÍCH THƯỚC" },
                { key: "reviews", label: `ĐÁNH GIÁ (${outfit.feedbackCount})` },
              ] as const
            ).map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`group relative pb-2 text-[10px] font-black transition-all whitespace-nowrap tracking-wider ${isActive ? "text-[#0ea5e9]" : "text-gray-400 hover:text-gray-600"
                    }`}
                >
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabUnderline"
                      className="absolute bottom-[-2px] left-0 right-0 h-[3px] bg-[#0ea5e9] rounded-t-full z-10"
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="py-6 min-h-[300px]">
            {activeTab === "desc" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <h3 className="nb-font-vietnam tracking-tight font-black text-xl text-gray-900 mb-4 uppercase">
                  Chi tiết sản phẩm
                </h3>
                {outfit.description ? (
                  <div
                    className="prose-detail-content text-[15px] text-gray-600 leading-relaxed max-w-3xl"
                    dangerouslySetInnerHTML={{ __html: outfit.description }}
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-400 uppercase">CHƯA CÓ MÔ TẢ.</p>
                )}
                <style>{`
                  .prose-detail-content h2 { font-size: 1.3rem; font-weight: 800; margin: 1rem 0 0.5rem; color: #111827; }
                  .prose-detail-content h3 { font-size: 1.1rem; font-weight: 700; margin: 0.75rem 0 0.35rem; color: #111827; }
                  .prose-detail-content p { margin: 0.35rem 0; font-weight: 400; color: #4B5563; line-height: 1.7; }
                  .prose-detail-content ul { list-style: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
                  .prose-detail-content ol { list-style: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
                  .prose-detail-content li { margin: 0.2rem 0; }
                  .prose-detail-content li p { margin: 0; }
                  .prose-detail-content li::marker { color: #d1d5db; }
                  .prose-detail-content blockquote { border-left: 3px solid #8B6BFF; padding-left: 1rem; margin: 0.75rem 0; color: #6B7280; font-style: italic; }
                  .prose-detail-content hr { border: none; border-top: 2px solid #E5E7EB; margin: 1rem 0; }
                  .prose-detail-content strong { font-weight: 800; color: #111827; }
                  .prose-detail-content em { font-style: italic; color: #374151; }
                  .prose-detail-content u { text-decoration: underline; text-underline-offset: 3px; text-decoration-color: #8B6BFF; }
                  .prose-detail-content s { text-decoration: line-through; color: #9CA3AF; }
                  .prose-detail-content a { color: #2563EB; text-decoration: underline; }
                  .prose-detail-content a:hover { color: #1D4ED8; }
                  .prose-detail-content mark { border-radius: 3px; padding: 0.1em 0.2em; }
                `}</style>
                {outfit.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-8">
                    {outfit.categories.map((cat) => (
                      <span key={cat} className="bg-sky-50 text-sky-600 font-bold text-[11px] px-3.5 py-1.5 rounded-full uppercase tracking-wider">
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "size" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <h3 className="nb-font-vietnam tracking-tight font-black text-lg text-gray-900 mb-3 uppercase">
                  Bảng kích thước chuẩn
                </h3>
                {(() => {
                  if (!outfit.sizeChart || outfit.sizeChart.details.length === 0) {
                    return <p className="text-[10px] font-medium text-gray-400">CHƯA CÓ DỮ LIỆU.</p>;
                  }
                  const allFields: { fieldKey: string; displayName: string; unit: string }[] = [];
                  const seenKeys = new Set<string>();
                  for (const d of outfit.sizeChart.details) {
                    for (const m of d.measurements) {
                      if (!seenKeys.has(m.fieldKey)) {
                        seenKeys.add(m.fieldKey);
                        allFields.push({ fieldKey: m.fieldKey, displayName: m.displayName, unit: m.unit });
                      }
                    }
                  }
                  if (allFields.length === 0) {
                    return <p className="text-[10px] font-medium text-gray-400">CHƯA CÓ SỐ ĐO.</p>;
                  }
                  return (
                    <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-soft-sm max-w-2xl bg-white">
                      <table className="w-full text-[10px] border-collapse">
                        <thead>
                          <tr className="bg-[#FFF1BF] border-b border-gray-200">
                            <th className="font-black text-left px-3 py-2 text-gray-900 whitespace-nowrap uppercase">SIZE</th>
                            {allFields.map((f) => (
                              <th key={f.fieldKey} className="font-black text-center px-2 py-2 text-gray-900 whitespace-nowrap uppercase">
                                {f.displayName} ({f.unit})
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {outfit.sizeChart.details.map((d) => (
                            <tr key={d.sizeLabel} className="border-b border-gray-200/10 hover:bg-sky-50 transition-colors">
                              <td className="font-black px-3 py-2 text-gray-900 bg-gray-50/50">{d.sizeLabel}</td>
                              {allFields.map((f) => {
                                const m = d.measurements.find((item) => item.fieldKey === f.fieldKey);
                                const display = m
                                  ? [m.minValue, m.maxValue].filter((v) => v != null).join(" - ") || "-"
                                  : "-";
                                return (
                                  <td key={f.fieldKey} className="text-center px-2 py-2 font-bold text-gray-600">
                                    {display}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </motion.div>
            )}

            {activeTab === "reviews" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                {/* Rating Summary Card */}
                <div className="flex items-center gap-4 p-4 bg-white border-2 border-gray-200 rounded-xl shadow-soft-sm max-w-max mb-6">
                  <span className="nb-font-vietnam font-black text-4xl leading-none text-gray-900">
                    {formatRating(outfit.averageRating)}
                  </span>
                  <div>
                    <div className="flex items-center gap-0.5 mb-0.5">
                      {[1, 2, 3, 4, 5].map((s) => {
                        const diff = (outfit.averageRating || 0) - s + 1;
                        return (
                          <div key={s} className="relative w-3.5 h-3.5">
                            <Star className="absolute inset-0 w-3.5 h-3.5 fill-gray-200 text-gray-200" />
                            <div
                              className="absolute inset-0 overflow-hidden"
                              style={{ width: `${Math.max(0, Math.min(100, diff * 100))}%` }}
                            >
                              <Star className="w-3.5 h-3.5 fill-gray-900 text-gray-900" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="font-black text-[9px] text-gray-400 uppercase tracking-wider">
                      {outfit.feedbackCount} phụ huynh đánh giá
                    </p>
                  </div>
                </div>

                {/* Rating Badges Filter */}
                {outfit.feedbackCount > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {/* All badge */}
                    <button
                      onClick={() => {
                        setSelectedRatingFilter("all");
                        setReviewPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-black text-[10px] transition-all border-[1.5px] uppercase tracking-widest ${selectedRatingFilter === "all"
                        ? "border-gray-200 bg-[#0ea5e9] text-white shadow-sm"
                        : "border-gray-200 bg-white text-gray-600 hover:-translate-y-px hover:shadow-sm"
                        }`}
                    >
                      TẤT CẢ ({outfit.feedbackCount})
                    </button>

                    {/* Rating-specific badges */}
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = outfit.reviews?.filter((r) => r.rating === rating).length || 0;
                      return (
                        <button
                          key={rating}
                          onClick={() => {
                            setSelectedRatingFilter(rating);
                            setReviewPage(1);
                          }}
                          className={`px-2 py-1 rounded-lg font-black text-[10px] transition-all border-[1.5px] flex items-center gap-1 uppercase ${selectedRatingFilter === rating
                            ? "border-gray-200 bg-[#0ea5e9] text-white shadow-sm"
                            : "border-gray-200 bg-white text-gray-600 hover:-translate-y-px hover:shadow-sm"
                            } ${count === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                          disabled={count === 0}
                        >
                          <Star className="w-2.5 h-2.5 fill-gray-900 text-gray-900" />
                          <span>{rating} ({count})</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Reviews List with Pagination */}
                {outfit.feedbackCount === 0 ? (
                  <p className="text-sm font-medium text-gray-400 mt-6">Chưa có đánh giá nào.</p>
                ) : (() => {
                  const filteredReviews = selectedRatingFilter === "all"
                    ? outfit.reviews
                    : outfit.reviews?.filter((r) => r.rating === selectedRatingFilter);

                  const totalReviewPages = Math.ceil((filteredReviews?.length || 0) / REVIEW_PAGE_SIZE);
                  const startIdx = (reviewPage - 1) * REVIEW_PAGE_SIZE;
                  const paginatedReviews = filteredReviews?.slice(startIdx, startIdx + REVIEW_PAGE_SIZE);

                  return (
                    <div className="max-w-4xl">
                      {/* Reviews List */}
                      <div className="space-y-4 mb-6">
                        {paginatedReviews?.map((review) => (
                          <motion.div
                            key={review.feedbackId}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-sm transition-all"
                          >
                            {/* Header: Avatar, name, rating */}
                            <div className="flex items-start gap-3 mb-2">
                              <div className="flex-shrink-0">
                                {review.userAvatarUrl ? (
                                  <img
                                    src={review.userAvatarUrl}
                                    alt={review.userName}
                                    className="w-8 h-8 rounded-full object-cover border border-gray-200"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-black text-[10px] border border-gray-200">
                                    {review.userName.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                  <p className="font-black text-[11px] text-gray-900 truncate uppercase">
                                    {review.userName}
                                  </p>
                                  <span className="text-[9px] font-bold text-gray-400 flex-shrink-0">
                                    {formatDate(review.timestamp)}
                                  </span>
                                </div>
                                {/* Rating stars */}
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                      key={s}
                                      className={`w-2.5 h-2.5 ${s <= review.rating
                                        ? "fill-gray-900 text-gray-900"
                                        : "fill-gray-200 text-gray-200"
                                        }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Comment */}
                            {review.comment && (
                              <p className="text-[11px] text-gray-600 leading-normal line-clamp-3 font-medium">
                                {review.comment}
                              </p>
                            )}
                          </motion.div>
                        ))}
                      </div>

                      {/* Pagination Controls */}
                      {totalReviewPages > 1 && (
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-4">
                          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            Trang {reviewPage} / {totalReviewPages}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setReviewPage(Math.max(1, reviewPage - 1))}
                              disabled={reviewPage === 1}
                              className={`px-2.5 py-1 rounded-lg font-black text-[10px] border-[1.5px] uppercase transition-all ${reviewPage === 1
                                ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                                : "border-gray-200 bg-white text-gray-900 shadow-sm hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-sm"
                                }`}
                            >
                              Trước
                            </button>
                            <button
                              onClick={() => setReviewPage(Math.min(totalReviewPages, reviewPage + 1))}
                              disabled={reviewPage === totalReviewPages}
                              className={`px-2.5 py-1 rounded-lg font-black text-[10px] border-[1.5px] uppercase transition-all ${reviewPage === totalReviewPages
                                ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                                : "border-gray-200 bg-white text-gray-900 shadow-sm hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-sm"
                                }`}
                            >
                              Tiếp
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* ───── Related Products ───── */}
        {related.length > 0 && (
          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="mt-10 pt-6 border-t-[2.5px] border-gray-200">
            <div className="flex items-end justify-between mb-6">
              <h2 className="nb-font-vietnam font-black text-xl text-gray-900 tracking-tight uppercase">
                Gợi ý cho bạn
              </h2>
              <Link to={`/schools/${outfit.school.schoolId}`} className="font-black text-[11px] text-[#0ea5e9] hover:underline flex items-center gap-1 uppercase tracking-widest">
                XEM THÊM <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="relative group/carousel">
              {relatedScroll > 0 && (
                <button
                  onClick={() => setRelatedScroll((s) => Math.max(0, s - 1))}
                  className="absolute -left-5 top-1/3 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-center hover:bg-gray-50 hover:scale-105 transition-all text-gray-500 opacity-0 group-hover/carousel:opacity-100"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              <div className="overflow-hidden py-4 -my-4 px-2 -mx-2">
                <div className="flex gap-4 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ transform: `translateX(-${relatedScroll * 206}px)` }}>
                  {related.map((item) => (
                    <div
                      key={item.outfitId}
                      onClick={() => navigate(`/outfits/${item.outfitId}`)}
                      className="w-[190px] flex-shrink-0 bg-white rounded-lg p-2 border border-gray-200 shadow-sm hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-sm transition-all cursor-pointer group flex flex-col"
                    >
                      <div className="w-full aspect-[4/5] bg-gray-50 rounded-md overflow-hidden relative border border-gray-100/50">
                        {item.mainImageURL ? (
                          <img src={item.mainImageURL} alt={item.outfitName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <GraduationCap className="w-7 h-7 text-gray-300" />
                          </div>
                        )}
                      </div>

                      <div className="px-0.5 pt-2 pb-0 flex flex-col gap-0.5">
                        <h4 className="nb-font-vietnam tracking-tight font-black text-[11px] text-gray-900 line-clamp-1 uppercase leading-snug">
                          {item.outfitName}
                        </h4>
                        <div className="flex items-center justify-between">
                          <p className="font-black text-[10px] text-[#0ea5e9]">
                            {fmt(item.price)}
                          </p>
                          <p className="font-bold text-[8px] text-gray-400 uppercase">
                            {item.outfitType === 'Female' ? 'Nữ' : item.outfitType === 'Male' ? 'Nam' : 'Unisex'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {relatedScroll < related.length - 4 && (
                <button
                  onClick={() => setRelatedScroll((s) => Math.min(related.length - 4, s + 1))}
                  className="absolute -right-5 top-1/3 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-center hover:bg-gray-50 hover:scale-105 transition-all text-gray-500 opacity-0 group-hover/carousel:opacity-100"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* VR Try-On Modal */}
      <TryOnModal
        isOpen={showTryOn}
        onClose={() => setShowTryOn(false)}
        outfitId={id || ""}
        outfitImage={mainImage}
        outfitName={outfit.outfitName}
      />
      <OutfitOrderModal
        open={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        outfitId={outfit.outfitId}
        semesterPublicationId={publicationId}
        preloadedOutfit={outfit}
      />
    </GuestLayout>
  );
};
