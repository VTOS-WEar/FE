import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
  CheckCircle2
} from "lucide-react";
import { GuestLayout } from "../../components/layout/GuestLayout";
import {
  getPublicOutfitDetail,
  getSchoolUniforms,
  type OutfitDetailDto,
  type OutfitVariantDto,
} from "../../lib/api/schools";
import { guestTryOn, type GuestTryOnResponse } from "../../lib/api/tryOn";
import { motion } from "framer-motion";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";

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

/* ── TryOn Modal ── */
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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[720px] max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-montserrat font-bold text-[#1a1a2e] text-lg">
                Thử đồ ảo (VR)
              </h2>
              <p className="font-montserrat text-xs text-gray-400">
                {outfitName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {!result ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Upload */}
              <div>
                <p className="font-montserrat font-semibold text-sm text-gray-700 mb-3">
                  📸 Ảnh của bạn
                </p>
                {!photoPreview ? (
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all min-h-[280px] ${dragOver
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-300 bg-gray-50 hover:border-purple-400 hover:bg-purple-50/50"
                      }`}
                  >
                    <Camera className="w-10 h-10 text-purple-300 mb-3" />
                    <p className="font-montserrat font-semibold text-sm text-gray-600 text-center">
                      Kéo thả ảnh vào đây
                    </p>
                    <p className="font-montserrat text-xs text-gray-400 mt-1">
                      hoặc nhấp để chọn file
                    </p>
                    <p className="font-montserrat text-[10px] text-gray-300 mt-3">
                      JPG, PNG, WEBP • Tối đa 10MB
                    </p>
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200">
                    <img
                      src={photoPreview}
                      alt="Your photo"
                      className="w-full aspect-[3/4] object-cover"
                    />
                    <button
                      onClick={handleReset}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
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
                <p className="font-montserrat font-semibold text-sm text-gray-700 mb-3">
                  👗 Đồng phục
                </p>
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  <img
                    src={outfitImage}
                    alt={outfitName}
                    className="w-full aspect-[3/4] object-cover"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Result view */
            <div className="flex flex-col items-center">
              <p className="font-montserrat font-bold text-lg text-[#1a1a2e] mb-4">
                ✨ Kết quả thử đồ
              </p>
              <div className="rounded-2xl overflow-hidden border-2 border-purple-200 shadow-lg max-w-[400px] w-full">
                <img
                  src={result.resultPhotoUrl}
                  alt="Try-on result"
                  className="w-full aspect-[3/4] object-cover"
                />
              </div>
              <div className="flex items-center gap-3 mt-5">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-montserrat font-semibold text-sm rounded-xl transition-colors shadow-md"
                >
                  <Download className="w-4 h-4" />
                  Tải ảnh
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-200 text-gray-700 font-montserrat font-semibold text-sm rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Thử lại
                </button>
              </div>
              {result.remainingTries >= 0 && (
                <p className="font-montserrat text-xs text-gray-400 mt-3">
                  Còn {result.remainingTries} lượt thử hôm nay
                </p>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="font-montserrat font-medium text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!result && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="font-montserrat text-xs text-gray-400">
              Tính năng thử đồ ảo sử dụng AI
            </p>
            <button
              onClick={handleTryOn}
              disabled={!photo || processing}
              className={`flex items-center gap-2 px-6 py-3 font-montserrat font-bold text-sm rounded-xl transition-all shadow-md ${!photo || processing
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:shadow-lg hover:scale-[1.02]"
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
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
export const OutfitDetail = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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
  const [activeTab, setActiveTab] = useState<"desc" | "care" | "reviews">("desc");
  const [related, setRelated] = useState<RelatedOutfit[]>([]);
  const [relatedScroll, setRelatedScroll] = useState(0);

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
      <GuestLayout bgColor="#FFF8F0">
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
      <GuestLayout bgColor="#FFF8F0">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="font-montserrat font-medium text-gray-500">{error || "Không tìm thấy đồng phục."}</p>
          <button onClick={() => navigate("/schools")} className="text-purple-600 hover:text-purple-700 font-montserrat font-bold">
            ← Quay lại danh sách
          </button>
        </div>
      </GuestLayout>
    );

  const displayPrice = selectedVariant ? selectedVariant.price : outfit.price;
  const mainImage = (selectedVariant?.variantImageURL || outfit.mainImageURL) ?? "https://placehold.co/500x600?text=No+Image";

  return (
    <GuestLayout bgColor="#FFF8F0">
      {/* NB decorative shapes */}

      <div className="relative z-10 max-w-[1200px] mx-auto px-4 lg:px-8 py-8 xl:py-12">
        {/* ───── Breadcrumb ───── */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="mb-8">
          <Breadcrumb>
            <BreadcrumbList className="text-[13px] sm:text-[14px]">
              <BreadcrumbItem>
                <BreadcrumbLink href="/" className="text-gray-500 hover:text-purple-600 font-medium transition-colors">Trang chủ</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/schools/${outfit.school.schoolId}`} className="text-gray-500 hover:text-purple-600 font-medium transition-colors line-clamp-1 max-w-[150px] sm:max-w-none">{outfit.school.schoolName}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <span className="text-gray-500 font-medium">{OUTFIT_TYPE_LABEL[outfit.outfitType] ?? outfit.outfitType}</span>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-gray-900 font-bold line-clamp-1 max-w-[150px] sm:max-w-[300px]">{outfit.outfitName}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </motion.div>

        {/* ───── Hero: Image + Info ───── */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 mb-16">
          {/* Left: Image gallery */}
          <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="lg:w-[400px] flex-shrink-0">
            <div className="relative bg-white rounded-2xl overflow-hidden border-2 border-[#1A1A2E] shadow-[4px_4px_0_#1A1A2E] aspect-square group md:aspect-[4/5]">
              <img src={mainImage} alt={outfit.outfitName} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <button
                onClick={() => setLiked(!liked)}
                className="absolute top-4 left-4 w-10 h-10 bg-white shadow-[3px_3px_0_#1A1A2E] border-2 border-[#1A1A2E] rounded-lg flex items-center justify-center hover:scale-110 transition-transform duration-300 z-10"
              >
                <Heart className={`w-[20px] h-[20px] ${liked ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
              </button>
            </div>

            {/* Thumbnail gallery */}
            {outfit.variants.filter((v) => v.variantImageURL).length > 0 && (
              <div className="flex gap-3 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                <button
                  onClick={() => { setSelectedVariant(null); setSelectedSize(null); }}
                  className={`w-[85px] h-[85px] rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${!selectedVariant ? "border-blue-500 p-0.5" : "border-transparent hover:border-gray-200"
                    }`}
                >
                  <img src={outfit.mainImageURL ?? ""} alt="main" className="w-full h-full object-cover rounded-lg" />
                </button>
                {outfit.variants.filter((v) => v.variantImageURL).map((v) => (
                  <button
                    key={v.productVariantId}
                    onClick={() => { setSelectedVariant(v); setSelectedSize(v.size); }}
                    className={`w-[85px] h-[85px] rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${selectedVariant?.productVariantId === v.productVariantId ? "border-blue-500 p-0.5" : "border-transparent hover:border-gray-200"
                      }`}
                  >
                    <img src={v.variantImageURL!} alt={v.size} className="w-full h-full object-cover rounded-lg" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Right: Info */}
          <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="flex-1 min-w-0 flex flex-col pt-2">
            <h1 className="font-baloo font-extrabold text-2xl lg:text-3xl leading-[1.2] text-gray-900 mb-3 tracking-tight">
              {outfit.outfitName}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`w-[16px] h-[16px] ${s <= Math.round(outfit.averageRating) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`} />
                ))}
              </div>
              <span className="font-bold text-[13px] text-gray-900 mt-0.5">
                {outfit.averageRating > 0 ? (
                  <span className="flex items-center gap-1">
                    {outfit.averageRating} <span className="font-medium text-gray-500">({outfit.feedbackCount} đánh giá)</span>
                  </span>
                ) : (
                  <span className="font-medium text-gray-400">Chưa có đánh giá</span>
                )}
              </span>
            </div>

            {/* Price */}
            <p className="font-baloo font-bold text-[28px] lg:text-[32px] text-[#0ea5e9] mb-4 tracking-tight leading-none drop-shadow-sm">
              {fmt(displayPrice)}
            </p>

            {/* Description */}
            {outfit.description && (
              <p className="text-[14px] font-medium text-gray-500 leading-relaxed mb-6 line-clamp-4">
                {outfit.description}
              </p>
            )}

            {/* School Info Block */}
            <div className="mb-6 space-y-1">
              <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">Trường học</span>
              <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgb(0,0,0,0.02)] transition-all hover:border-blue-100">
                <div className="flex items-center gap-3 min-w-0">
                  {outfit.school.logoURL ? (
                    <img src={outfit.school.logoURL} alt="" className="w-9 h-9 rounded-full object-cover border border-gray-100 shadow-sm" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100"><GraduationCap className="w-5 h-5 text-gray-400" /></div>
                  )}
                  <Link to={`/schools/${outfit.school.schoolId}`} className="font-bold text-[15px] text-gray-900 hover:text-[#0ea5e9] truncate transition-colors">
                    {outfit.school.schoolName}
                  </Link>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full flex-shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="font-bold text-[11px] uppercase tracking-wide">Đã xác thực</span>
                </div>
              </div>
            </div>

            {/* Size Selector */}
            {sizes.length > 0 && (
              <div className="mb-8 space-y-2">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">Chọn kích thước</span>
                <div className="flex flex-wrap gap-2">
                  {/* For mockup purposes, we can simulate a disabled size by rendering a fake one if sizes are small, but we stick to real data */}
                  {sizes.map((size) => {
                    const isSelected = selectedSize === size;
                    return (
                      <button
                        key={size}
                        onClick={() => handleSizeSelect(size)}
                        className={`min-w-[56px] h-10 px-4 rounded-xl font-bold text-[13px] border-2 transition-all flex items-center justify-center ${isSelected
                            ? "border-[#0ea5e9] bg-[#0ea5e9]/10 text-[#0ea5e9]"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-auto pt-4">
              <button
                onClick={() => { }} // Add to cart placeholder
                className="flex-1 min-h-[44px] flex items-center justify-center gap-2 bg-[#0ea5e9] text-white font-bold text-[14px] rounded-xl shadow-[0_4px_12px_rgb(14,165,233,0.2)] hover:bg-[#0284c7] hover:shadow-[0_8px_16px_rgb(14,165,233,0.3)] transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <ShoppingBag className="w-[16px] h-[16px]" />
                Thêm vào giỏ hàng
              </button>

              <button
                onClick={() => setShowTryOn(true)}
                className="flex-1 min-h-[44px] flex items-center justify-center gap-2 bg-white text-[#0ea5e9] font-bold text-[14px] rounded-xl border-2 border-[#0ea5e9] hover:bg-[#f0f9ff] transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <Box className="w-[16px] h-[16px]" />
                Thử Ảo (VR)
              </button>
            </div>
            {!isParent && (
              <p className="text-[13px] font-medium text-gray-400 mt-4 text-center">
                Để đặt hàng, vui lòng đăng nhập vào tài khoản phụ huynh.
              </p>
            )}
          </motion.div>
        </div>

        {/* ───── Tabs Section ───── */}
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="mb-16">
          <div className="flex gap-8 border-b border-gray-200/60 overflow-x-auto scrollbar-hide">
            {(
              [
                { key: "desc", label: "Mô tả chi tiết" },
                { key: "care", label: "Chất liệu & Bảo quản" },
                { key: "reviews", label: `Đánh giá (${outfit.feedbackCount})` },
              ] as const
            ).map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative py-4 font-bold text-[15px] whitespace-nowrap transition-colors ${isActive ? "text-[#0ea5e9]" : "text-gray-400 hover:text-gray-600"
                    }`}
                >
                  {tab.label}
                  {isActive && (
                    <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#0ea5e9] rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="py-8 min-h-[300px]">
            {activeTab === "desc" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <h3 className="font-baloo tracking-tight font-extrabold text-2xl text-gray-900 mb-6">
                  Chi tiết sản phẩm
                </h3>
                {outfit.description ? (
                  <div className="text-[15px] text-gray-600 leading-relaxed whitespace-pre-line max-w-4xl">
                    <ul className="space-y-3 list-disc pl-5 marker:text-gray-300">
                      {/* Note: Mock rendering of bullet points if the description supports newlines, 
                          else it just falls back to plain text. We fake bullet visually for plain text if splitable. */}
                      {outfit.description.split('\n').filter(Boolean).map((line, idx) => (
                        <li key={idx}><span className="font-bold text-gray-800">{line.split(':')[0]}</span>{line.includes(':') ? ':' + line.split(':').slice(1).join(':') : line}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-gray-400">Chưa có mô tả chi tiết.</p>
                )}
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

            {activeTab === "care" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <h3 className="font-baloo tracking-tight font-extrabold text-2xl text-gray-900 mb-6">
                  Bảng kích thước
                </h3>
                {outfit.sizeChart ? (
                  <div className="overflow-hidden border border-gray-100 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] max-w-4xl">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-100">
                          <th className="font-bold text-left px-5 py-4 text-gray-700">Kích thước</th>
                          <th className="font-bold text-center px-4 py-4 text-gray-700">Ngực ({outfit.sizeChart.unit})</th>
                          <th className="font-bold text-center px-4 py-4 text-gray-700">Eo ({outfit.sizeChart.unit})</th>
                          <th className="font-bold text-center px-4 py-4 text-gray-700">Chiều cao ({outfit.sizeChart.unit})</th>
                        </tr>
                      </thead>
                      <tbody>
                        {outfit.sizeChart.details.map((d, i) => (
                          <tr key={d.sizeLabel} className={`border-b border-gray-50/50 hover:bg-sky-50/30 transition-colors bg-white`}>
                            <td className="font-extrabold px-5 py-4 text-gray-900">{d.sizeLabel}</td>
                            <td className="text-center px-4 py-4 font-medium text-gray-600">{d.chestMin && d.chestMax ? `${d.chestMin} - ${d.chestMax}` : "-"}</td>
                            <td className="text-center px-4 py-4 font-medium text-gray-600">{d.waistMin && d.waistMax ? `${d.waistMin} - ${d.waistMax}` : "-"}</td>
                            <td className="text-center px-4 py-4 font-medium text-gray-600">{d.heightMin && d.heightMax ? `${d.heightMin} - ${d.heightMax}` : "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-gray-400">Chưa có bảng kích thước.</p>
                )}
              </motion.div>
            )}

            {activeTab === "reviews" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <div className="flex items-center gap-5 p-6 bg-white border border-gray-100 rounded-3xl max-w-max shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                  <span className="font-baloo font-extrabold text-[56px] leading-none text-gray-900">
                    {outfit.averageRating}
                  </span>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-5 h-5 ${s <= Math.round(outfit.averageRating) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`} />
                      ))}
                    </div>
                    <p className="font-bold text-[13px] text-gray-400">
                      {outfit.feedbackCount} đánh giá
                    </p>
                  </div>
                </div>
                {outfit.feedbackCount === 0 && (
                  <p className="text-sm font-medium text-gray-400 mt-6">Chưa có đánh giá nào.</p>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* ───── Related Products ───── */}
        {related.length > 0 && (
          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="mb-12 pt-8 border-t border-gray-200/50">
            <div className="flex items-end justify-between mb-8">
              <h2 className="font-baloo font-extrabold text-[28px] text-gray-900 tracking-tight">
                Có thể bạn cũng thích
              </h2>
              <Link to={`/schools/${outfit.school.schoolId}`} className="font-bold text-[14px] text-[#0ea5e9] hover:text-[#0284c7] flex items-center gap-1.5 transition-colors">
                Xem tất cả <ChevronRight className="w-4 h-4" />
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
                <div className="flex gap-4 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ transform: `translateX(-${relatedScroll * 280}px)` }}>
                  {related.map((item) => (
                    <div
                      key={item.outfitId}
                      onClick={() => navigate(`/outfits/${item.outfitId}`)}
                      className="w-[264px] flex-shrink-0 bg-white rounded-3xl p-3 shadow-[0_2px_12px_rgb(0,0,0,0.02)] border border-gray-100/60 hover:shadow-[0_8px_24px_rgb(0,0,0,0.06)] hover:border-gray-200 transition-all duration-300 hover:-translate-y-1 cursor-pointer group flex flex-col"
                    >
                      <div className="w-full aspect-square bg-gray-50 rounded-2xl overflow-hidden relative border border-gray-100/50">
                        {item.mainImageURL ? (
                          <img src={item.mainImageURL} alt={item.outfitName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <GraduationCap className="w-10 h-10 text-gray-300" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.03] transition-colors duration-300" />
                      </div>

                      <div className="px-1 pt-4 pb-1 flex flex-col gap-0.5">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="font-baloo tracking-tight font-extrabold text-[17px] text-gray-800 line-clamp-1 group-hover:text-[#0ea5e9] transition-colors leading-snug">
                            {item.outfitName}
                          </h4>
                          <p className="font-extrabold text-[14px] text-gray-900 whitespace-nowrap leading-snug drop-shadow-sm mt-1">
                            {fmt(item.price)}
                          </p>
                        </div>
                        <p className="font-medium text-[13px] text-gray-400">
                          {outfit.school?.schoolName ?? "THPT"} - {item.outfitType === 'Female' ? 'Nữ' : item.outfitType === 'Male' ? 'Nam' : 'Unisex'}
                        </p>
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
        .font-baloo { font-family: 'Baloo 2', cursive; }
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
    </GuestLayout>
  );
};
