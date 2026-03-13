import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ChevronRight,
  Heart,
  Star,
  Eye,
  GraduationCap,
  ChevronLeft,
} from "lucide-react";
import { GuestLayout } from "../../components/layout/GuestLayout";
import {
  getPublicOutfitDetail,
  getSchoolUniforms,
  type OutfitDetailDto,
  type OutfitVariantDto,
} from "../../lib/api/schools";

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
};

/* ================================================================== */
export const OutfitDetail = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [outfit, setOutfit] = useState<OutfitDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      .catch(() => {});
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
      <GuestLayout bgColor="#F4F6FF">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        </div>
      </GuestLayout>
    );

  if (error || !outfit)
    return (
      <GuestLayout bgColor="#F4F6FF">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="font-montserrat text-gray-500">{error || "Không tìm thấy."}</p>
          <button
            onClick={() => navigate("/schools")}
            className="text-purple-600 hover:underline font-montserrat font-semibold"
          >
            ← Quay lại
          </button>
        </div>
      </GuestLayout>
    );

  const displayPrice = selectedVariant ? selectedVariant.price : outfit.price;
  const mainImage =
    (selectedVariant?.variantImageURL || outfit.mainImageURL) ??
    "https://placehold.co/500x600?text=No+Image";

  return (
    <GuestLayout bgColor="#F4F6FF">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-8">
        {/* ───── Breadcrumb ───── */}
        <div className="flex items-center gap-2 text-sm mb-8 flex-wrap">
          <Link
            to="/homepage"
            className="font-montserrat text-black/40 hover:text-black/70"
          >
            Trang chủ
          </Link>
          <ChevronRight className="w-4 h-4 text-black/40" />
          <Link
            to={`/schools/${outfit.school.schoolId}`}
            className="font-montserrat text-black/40 hover:text-black/70"
          >
            {outfit.school.schoolName}
          </Link>
          <ChevronRight className="w-4 h-4 text-black/40" />
          <span className="font-montserrat text-black/40">
            {OUTFIT_TYPE_LABEL[outfit.outfitType] ?? outfit.outfitType}
          </span>
          <ChevronRight className="w-4 h-4 text-black/40" />
          <span className="font-montserrat font-semibold text-black line-clamp-1">
            {outfit.outfitName}
          </span>
        </div>

        {/* ───── Hero: Image + Info ───── */}
        <div className="flex flex-col lg:flex-row gap-8 mb-12">
          {/* Left: Image column */}
          <div className="lg:w-[480px] flex-shrink-0">
            <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm aspect-[4/5]">
              <img
                src={mainImage}
                alt={outfit.outfitName}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setLiked(!liked)}
                className="absolute top-4 left-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
              >
                <Heart
                  className={`w-5 h-5 ${liked ? "fill-red-500 text-red-500" : "text-gray-400"}`}
                />
              </button>
            </div>

            {/* Thumbnail gallery */}
            {outfit.variants.filter((v) => v.variantImageURL).length > 0 && (
              <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                {/* Main image thumb */}
                <button
                  onClick={() => {
                    setSelectedVariant(null);
                    setSelectedSize(null);
                  }}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-colors ${
                    !selectedVariant
                      ? "border-purple-500"
                      : "border-transparent hover:border-purple-200"
                  }`}
                >
                  <img
                    src={outfit.mainImageURL ?? ""}
                    alt="main"
                    className="w-full h-full object-cover"
                  />
                </button>
                {outfit.variants
                  .filter((v) => v.variantImageURL)
                  .map((v) => (
                    <button
                      key={v.productVariantId}
                      onClick={() => {
                        setSelectedVariant(v);
                        setSelectedSize(v.size);
                      }}
                      className={`w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-colors ${
                        selectedVariant?.productVariantId === v.productVariantId
                          ? "border-purple-500"
                          : "border-transparent hover:border-purple-200"
                      }`}
                    >
                      <img
                        src={v.variantImageURL!}
                        alt={v.size}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Right: Product info */}
          <div className="flex-1 min-w-0">
            {/* Name */}
            <h1 className="font-montserrat font-extrabold text-2xl lg:text-3xl text-black mb-3">
              {outfit.outfitName}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= Math.round(outfit.averageRating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-gray-200 text-gray-200"
                    }`}
                  />
                ))}
              </div>
              <span className="font-montserrat text-sm text-gray-500">
                {outfit.averageRating > 0
                  ? `${outfit.averageRating} (${outfit.feedbackCount} đánh giá)`
                  : "Chưa có đánh giá"}
              </span>
            </div>

            {/* Price */}
            <p className="font-montserrat font-bold text-2xl text-blue-600 mb-4">
              {fmt(displayPrice)}
            </p>

            {/* Description */}
            {outfit.description && (
              <p className="font-montserrat text-sm text-gray-600 leading-relaxed mb-6 line-clamp-4">
                {outfit.description}
              </p>
            )}

            {/* School info */}
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 mb-6">
              <span className="font-montserrat font-semibold text-sm text-gray-500 flex-shrink-0">
                Trường học
              </span>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {outfit.school.logoURL ? (
                  <img
                    src={outfit.school.logoURL}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover border"
                  />
                ) : (
                  <GraduationCap className="w-6 h-6 text-purple-400" />
                )}
                <Link
                  to={`/schools/${outfit.school.schoolId}`}
                  className="font-montserrat font-semibold text-sm text-black hover:text-purple-600 truncate"
                >
                  {outfit.school.schoolName}
                </Link>
              </div>
              {outfit.isAvailable && (
                <span className="flex-shrink-0 bg-green-50 text-green-700 font-montserrat font-semibold text-xs px-3 py-1.5 rounded-lg">
                  Sẵn có
                </span>
              )}
            </div>

            {/* Size selector */}
            {sizes.length > 0 && (
              <div className="mb-6">
                <p className="font-montserrat font-semibold text-sm text-gray-700 mb-3">
                  Chọn kích thước
                </p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => {
                    return (
                      <button
                        key={size}
                        onClick={() => handleSizeSelect(size)}
                        className={`min-w-[48px] px-4 py-2.5 rounded-lg font-montserrat font-semibold text-sm border-2 transition-all ${
                          selectedSize === size
                            ? "bg-purple-600 text-white border-purple-600 shadow-md"
                            : "bg-white text-gray-700 border-gray-200 hover:border-purple-400"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-purple-600 font-montserrat font-bold text-sm rounded-xl border-2 border-purple-200 hover:bg-purple-50 hover:border-purple-400 transition-all">
                <Eye className="w-5 h-5" />
                Thử Áo (VR)
              </button>
            </div>
            <p className="font-montserrat text-xs text-gray-400 mt-2 text-center">
              Để đặt hàng, vui lòng vào chương trình đồng phục của trường.
            </p>
          </div>
        </div>

        {/* ───── Tabs Section ───── */}
        <div className="bg-white rounded-2xl shadow-sm mb-12 overflow-hidden">
          <div className="flex border-b border-gray-100">
            {(
              [
                { key: "desc", label: "Mô tả chi tiết" },
                { key: "care", label: "Chất liệu & Bảo quản" },
                {
                  key: "reviews",
                  label: `Đánh giá (${outfit.feedbackCount})`,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-4 font-montserrat font-semibold text-sm text-center transition-colors border-b-2 ${
                  activeTab === tab.key
                    ? "text-purple-600 border-purple-600"
                    : "text-gray-400 border-transparent hover:text-gray-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6 lg:p-8">
            {activeTab === "desc" && (
              <div>
                <h3 className="font-montserrat font-bold text-lg text-black mb-4">
                  Chi tiết sản phẩm
                </h3>
                {outfit.description ? (
                  <div className="font-montserrat text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                    {outfit.description}
                  </div>
                ) : (
                  <p className="font-montserrat text-sm text-gray-400">
                    Chưa có mô tả chi tiết.
                  </p>
                )}
                {outfit.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {outfit.categories.map((cat) => (
                      <span
                        key={cat}
                        className="bg-purple-50 text-purple-600 font-montserrat font-medium text-xs px-3 py-1.5 rounded-full"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "care" && (
              <div>
                <h3 className="font-montserrat font-bold text-lg text-black mb-4">
                  Bảng kích thước
                </h3>
                {outfit.sizeChart ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-purple-50">
                          <th className="font-montserrat font-semibold text-left px-4 py-3 text-gray-700">
                            Kích thước
                          </th>
                          <th className="font-montserrat font-semibold text-center px-4 py-3 text-gray-700">
                            Ngực ({outfit.sizeChart.unit})
                          </th>
                          <th className="font-montserrat font-semibold text-center px-4 py-3 text-gray-700">
                            Eo ({outfit.sizeChart.unit})
                          </th>
                          <th className="font-montserrat font-semibold text-center px-4 py-3 text-gray-700">
                            Chiều cao ({outfit.sizeChart.unit})
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {outfit.sizeChart.details.map((d, i) => (
                          <tr
                            key={d.sizeLabel}
                            className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                          >
                            <td className="font-montserrat font-semibold px-4 py-3 text-black">
                              {d.sizeLabel}
                            </td>
                            <td className="font-montserrat text-center px-4 py-3 text-gray-600">
                              {d.chestMin && d.chestMax
                                ? `${d.chestMin} - ${d.chestMax}`
                                : "-"}
                            </td>
                            <td className="font-montserrat text-center px-4 py-3 text-gray-600">
                              {d.waistMin && d.waistMax
                                ? `${d.waistMin} - ${d.waistMax}`
                                : "-"}
                            </td>
                            <td className="font-montserrat text-center px-4 py-3 text-gray-600">
                              {d.heightMin && d.heightMax
                                ? `${d.heightMin} - ${d.heightMax}`
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="font-montserrat text-sm text-gray-400">
                    Chưa có bảng kích thước.
                  </p>
                )}
              </div>
            )}

            {activeTab === "reviews" && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-montserrat font-extrabold text-4xl text-black">
                    {outfit.averageRating}
                  </span>
                  <div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-5 h-5 ${
                            s <= Math.round(outfit.averageRating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "fill-gray-200 text-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="font-montserrat text-xs text-gray-400 mt-1">
                      {outfit.feedbackCount} đánh giá
                    </p>
                  </div>
                </div>
                {outfit.feedbackCount === 0 && (
                  <p className="font-montserrat text-sm text-gray-400">
                    Chưa có đánh giá nào.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ───── Related Products ───── */}
        {related.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-montserrat font-extrabold text-xl text-black">
                Có thể bạn cũng thích
              </h2>
              <Link
                to={`/schools/${outfit.school.schoolId}`}
                className="font-montserrat font-semibold text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                Xem tất cả <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="relative">
              {relatedScroll > 0 && (
                <button
                  onClick={() => setRelatedScroll((s) => Math.max(0, s - 1))}
                  className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
              )}

              <div className="overflow-hidden">
                <div
                  className="flex gap-5 transition-transform duration-300"
                  style={{
                    transform: `translateX(-${relatedScroll * 220}px)`,
                  }}
                >
                  {related.map((item) => (
                    <div
                      key={item.outfitId}
                      onClick={() => navigate(`/outfits/${item.outfitId}`)}
                      className="w-[200px] flex-shrink-0 bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group"
                    >
                      <div className="w-full aspect-square overflow-hidden bg-purple-50">
                        {item.mainImageURL ? (
                          <img
                            src={item.mainImageURL}
                            alt={item.outfitName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <GraduationCap className="w-10 h-10 text-purple-200" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h4 className="font-montserrat font-bold text-sm text-black line-clamp-2 mb-1">
                          {item.outfitName}
                        </h4>
                        <p className="font-montserrat font-semibold text-sm text-blue-600">
                          {fmt(item.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {relatedScroll < related.length - 4 && (
                <button
                  onClick={() =>
                    setRelatedScroll((s) => Math.min(related.length - 4, s + 1))
                  }
                  className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </GuestLayout>
  );
};
