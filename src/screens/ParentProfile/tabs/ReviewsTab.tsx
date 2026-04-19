import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Star, AlertCircle, ChevronDown, Package, Calendar, Clock, ShoppingBag, MessageSquare, Edit2, History, XCircle, ShieldCheck } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { getParentFeedbacks, submitOutfitFeedback, type ParentFeedbackDto, type CampaignFilterDto, type RatingCountDto } from "../../../lib/api/feedback";

function fmt(n: number) { return n.toLocaleString("vi-VN") + " ₫"; }
function fmtFullDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ── Rating Stars Component ── */
function RatingStars({
  value,
  onChange,
  readOnly = false,
}: Readonly<{
  value: number;
  onChange?: (val: number) => void;
  readOnly?: boolean;
}>) {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= (hoverValue || value);
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && onChange?.(star)}
            onMouseEnter={() => !readOnly && setHoverValue(star)}
            onMouseLeave={() => !readOnly && setHoverValue(0)}
            title={`Đánh giá ${star} sao`}
            className={`transition-all duration-200 ${isFilled
              ? "text-emerald-400 drop-shadow-sm"
              : "text-[#D1D5DB]"
              } ${!readOnly && "cursor-pointer hover:scale-125"}`}
          >
            <Star
              className="w-8 h-8 fill-current"
              strokeWidth={1.5}
            />
          </button>
        );
      })}
    </div>
  );
}

/* ── Review Card ── */
type ReviewCardProps = {
  feedback: ParentFeedbackDto;
  onRefresh: () => Promise<void>;
};

function ReviewCard({ feedback, onRefresh }: ReviewCardProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState<number>(feedback.rating ?? 0);
  const [comment, setComment] = useState<string>(feedback.comment ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasRating = feedback.rating !== null && feedback.rating !== undefined;

  const handleSubmit = async () => {
    if (rating <= 0) {
      showToast({
        title: "⚠️ Thông báo",
        message: "Vui lòng chọn số sao",
        variant: "info",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitOutfitFeedback({
        orderItemId: feedback.orderItemId,
        rating,
        comment: comment || undefined,
      });

      await onRefresh();
      setIsEditing(false);
      showToast({
        title: "✅ Thành công",
        message: "Đánh giá đã được lưu thành công!",
        variant: "success",
        durationMs: 3000,
      });
    } catch (err) {
      console.error(err);
      showToast({
        title: "❌ Lỗi",
        message: "Lỗi khi lưu đánh giá. Vui lòng thử lại.",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setRating(feedback.rating ?? 0);
    setComment(feedback.comment ?? "");
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="nb-card !rounded-[12px] overflow-hidden shadow-soft-sm hover:shadow-soft-md transition-all duration-300">
        {/* Header */}
        <div className="p-4 border-b border-gray-200/10 flex items-center justify-between rounded-t-[12px]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span className="font-bold text-xs uppercase text-gray-900">
              📁 {feedback.campaignName}
            </span>
          </div>
          <button onClick={handleCancel} className="text-gray-400 hover:text-gray-800">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-5 space-y-6">
          <div className="flex gap-4">
            <div className="w-20 h-20 rounded-lg border border-gray-200 overflow-hidden bg-violet-50 flex-shrink-0 shadow-sm">
              {feedback.outfitImageUrl ? (
                <img
                  src={feedback.outfitImageUrl}
                  alt={feedback.outfitName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="w-8 h-8 text-purple-400 m-auto mt-6" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1">{feedback.outfitName}</h3>
              <p className="text-xs text-gray-400 mb-3">{feedback.outfitType}</p>

              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-bold text-gray-900">Size {feedback.size}</span>
                <span className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-bold text-gray-900">x{feedback.quantity}</span>
                <span className="px-2 py-0.5 bg-emerald-400/20 border border-emerald-400 rounded text-[10px] font-bold text-gray-900">{fmt(feedback.outfitPrice)}</span>
              </div>

              {feedback.providerName && (
                <div className="mt-3 flex items-center gap-1.5 px-2 py-1 bg-violet-50 border border-violet-100 rounded-md w-fit">
                   <ShieldCheck className="w-3 h-3 text-violet-500" />
                   <span className="text-[10px] font-black text-violet-700 uppercase tracking-wider">Cung cấp bởi: {feedback.providerName}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-200/5">
            <div>
              <label className="block text-xs font-bold text-gray-900 uppercase mb-2">Chất lượng sản phẩm</label>
              <RatingStars value={rating} onChange={setRating} readOnly={isSubmitting} />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-900 uppercase mb-2">Cảm nhận của bạn</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={isSubmitting}
                placeholder="Sản phẩm mặc lên rất đẹp, bé rất thích..."
                maxLength={500}
                className="w-full p-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 placeholder-[#9CA3AF] focus:outline-none focus:bg-gray-50 shadow-sm resize-none disabled:opacity-50"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200/10 flex gap-3 justify-end">
          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className="nb-btn nb-btn-outline text-xs px-4 py-2"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || rating <= 0}
            className="nb-btn nb-btn-purple text-xs px-6 py-2"
          >
            {isSubmitting ? "Đang lưu..." : "Xác nhận"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="nb-card !rounded-[12px] overflow-hidden shadow-soft-sm hover:shadow-soft-md transition-all duration-300 hover:-translate-y-1">
      <div className="p-5 flex flex-col md:flex-row gap-6">
        {/* Product Section */}
        <div className="flex-1 flex gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-lg border border-gray-200 overflow-hidden bg-violet-50 shadow-sm">
              {feedback.outfitImageUrl ? (
                <img
                  src={feedback.outfitImageUrl}
                  alt={feedback.outfitName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="w-8 h-8 text-purple-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              )}
            </div>
            {hasRating && (
              <div className="absolute -top-2 -right-2 bg-emerald-400 border border-gray-200 px-1.5 py-0.5 rounded font-bold text-[9px] shadow-sm">
                {feedback.rating}/5 ⭐
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-gray-400 mb-1 uppercase tracking-wider truncate">
              📁 {feedback.campaignName}
            </p>
            <h3
              className="font-bold text-gray-900 text-sm truncate hover:text-[#8B6BFF] transition-colors cursor-pointer mb-2"
              onClick={() => navigate(`/outfits/${feedback.outfitId}`)}
            >
              {feedback.outfitName}
            </h3>
            {feedback.providerName && (
               <div className="flex items-center gap-1 mb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[11px] font-bold text-emerald-600 italic">Bản phối từ {feedback.providerName}</span>
               </div>
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-medium text-gray-500">
              <span className="flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5" />
                {feedback.outfitType}
              </span>
              <span className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded">
                Size {feedback.size}
              </span>
              <span className="font-bold text-gray-900">
                {fmt(feedback.outfitPrice)}
              </span>
            </div>
          </div>
        </div>

        {/* Timeline Section */}
        <div className="flex flex-row md:flex-col justify-between md:justify-center gap-4 md:pl-6 md:border-l-2 md:border-dashed md:border-gray-200/10 min-w-[160px]">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-gray-400 mb-0.5">
              <Calendar className="w-3.5 h-3.5" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Thời gian đặt</span>
            </div>
            <p className="text-[11px] font-bold text-gray-900">
              {fmtFullDate(feedback.orderDate)}
            </p>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-gray-400 mb-0.5">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Thời gian phản hồi</span>
            </div>
            <p className="text-[11px] font-bold text-gray-900">
              {feedback.feedbackTimestamp
                ? fmtFullDate(feedback.feedbackTimestamp)
                : "---"
              }
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Action/Review Section */}
      <div className="px-5 py-4 bg-gray-50 border-t border-gray-200/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full">
          {hasRating ? (
            <div className="flex gap-2.5 items-start">
              <MessageSquare className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-500 italic leading-relaxed line-clamp-2">
                {feedback.comment ? `"${feedback.comment}"` : "Bạn không để lại bình luận."}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-400">
              <Star className="w-4 h-4" />
              <span className="text-xs italic">Sản phẩm này chưa được đánh giá</span>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsEditing(true)}
          className={`nb-btn text-xs px-4 py-1.5 flex items-center gap-1.5 whitespace-nowrap ${hasRating ? "nb-btn-outline" : "nb-btn-purple transition-transform active:scale-95"
            }`}
        >
          {hasRating ? (
            <>
              <Edit2 className="w-3.5 h-3.5" />
              Sửa đổi
            </>
          ) : (
            <>
              <Star className="w-3.5 h-3.5 fill-current" />
              Đánh giá ngay
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ── Main Component ── */
export const ReviewsTab = (): JSX.Element => {
  const [feedbacks, setFeedbacks] = useState<ParentFeedbackDto[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignFilterDto[]>([]);
  const [ratingCounts, setRatingCounts] = useState<RatingCountDto[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 2;
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "rated" | "not-rated">("all");

  /* ── Fetch feedbacks ── */
  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      // Map activeTab to hasRating parameter
      let hasRatingFilter: boolean | undefined = undefined;
      if (activeTab === "rated") hasRatingFilter = true;
      if (activeTab === "not-rated") hasRatingFilter = false;

      const result = await getParentFeedbacks({
        campaignId: selectedCampaignId || undefined,
        hasRating: hasRatingFilter,
        page,
        pageSize,
      });
      setFeedbacks(result.items);
      setCampaigns(result.campaigns);
      setTotal(result.total);
      setRatingCounts(result.ratingCounts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [selectedCampaignId, activeTab]);

  useEffect(() => {
    fetchFeedbacks();
  }, [selectedCampaignId, page, activeTab]);

  // Get correct total for pagination based on active tab
  // Backend đã trả về đúng data theo hasRating filter, nên total = backend total
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Header & Filter Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-black text-gray-900 text-2xl">Đánh giá sản phẩm sáng tạo</h2>
          <p className="text-sm font-semibold text-gray-400 mt-1">
            Gửi phản hồi về chất lượng trang phục từ các nhà cung cấp học kỳ
          </p>
        </div>

        {/* Campaign Filter */}
        <div className="relative w-full md:w-[320px]">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full bg-white border border-gray-200 p-3 rounded-lg shadow-soft-sm flex items-center justify-between transition-all hover:-translate-y-0.5 hover:shadow-soft-md active:shadow-none"
            title="Lọc theo danh mục"
          >
            <div className="text-left">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Lọc theo học kỳ</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5 truncate max-w-[220px]">
                {selectedCampaignId
                  ? campaigns.find((c) => c.campaignId === selectedCampaignId)?.campaignName || "Chọn học kỳ"
                  : "Tất cả danh mục"}
              </p>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-gray-900 transition-transform duration-300 ${showFilters ? "rotate-180" : ""}`}
            />
          </button>

          {showFilters && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <button
                onClick={() => {
                  setSelectedCampaignId(null);
                  setShowFilters(false);
                }}
                className={`w-full px-4 py-3 text-left text-sm font-bold transition-colors ${selectedCampaignId === null
                  ? "bg-purple-400 text-white"
                  : "text-gray-900 hover:bg-gray-100"
                  }`}
                title="Xem tất cả chiến dịch"
              >
                Tất cả (tổng số)
              </button>
              {campaigns.map((campaign) => (
                <button
                  key={campaign.campaignId}
                  onClick={() => {
                    setSelectedCampaignId(campaign.campaignId);
                    setShowFilters(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm font-bold transition-colors border-t border-[#F3F4F6] ${selectedCampaignId === campaign.campaignId
                    ? "bg-purple-400 text-white"
                    : "text-gray-900 hover:bg-gray-100"
                    }`}
                >
                  {campaign.campaignName} ({campaign.count})
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation - Always visible */}
      <div className="flex gap-4 border-b-2 border-gray-200">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-3 font-bold text-sm border-b-4 transition-colors ${activeTab === "all"
            ? "text-gray-900 border-purple-300"
            : "text-gray-400 border-transparent hover:text-gray-800"
            }`}
        >
          Tất cả ({ratingCounts.find(rc => rc.label === "all")?.count || 0})
        </button>
        <button
          onClick={() => setActiveTab("not-rated")}
          className={`px-4 py-3 font-bold text-sm border-b-4 transition-colors ${activeTab === "not-rated"
            ? "text-gray-900 border-purple-300"
            : "text-gray-400 border-transparent hover:text-gray-800"
            }`}
        >
          Chưa đánh giá ({ratingCounts.find(rc => rc.label === "not-rated")?.count || 0})
        </button>
        <button
          onClick={() => setActiveTab("rated")}
          className={`px-4 py-3 font-bold text-sm border-b-4 transition-colors ${activeTab === "rated"
            ? "text-gray-900 border-purple-300"
            : "text-gray-400 border-transparent hover:text-gray-800"
            }`}
        >
          Đã đánh giá ({ratingCounts.find(rc => rc.label === "rated")?.count || 0})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-[#B8A9E8] rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Tab Content - Server-side filtered data */}
          {feedbacks.length > 0 ? (
            <div className="grid gap-3 mt-6">
              {feedbacks.map((feedback) => (
                <ReviewCard
                  key={feedback.orderItemId}
                  feedback={feedback}
                  onRefresh={fetchFeedbacks}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-16 h-16 bg-violet-50 rounded-xl flex items-center justify-center border border-gray-200 shadow-sm">
                <AlertCircle className="w-8 h-8 text-gray-900" />
              </div>
              <p className="font-medium text-gray-500 text-sm text-center">
                {activeTab === "rated"
                  ? "Bạn chưa có đánh giá nào."
                  : activeTab === "not-rated"
                    ? "Tất cả sản phẩm đã được đánh giá."
                    : "Không tìm thấy sản phẩm nào."}
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="nb-btn nb-btn-outline text-sm disabled:opacity-50"
              >
                ← Trước
              </button>
              <span className="flex items-center text-sm text-gray-500 px-4 font-bold">
                {page}/{totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="nb-btn nb-btn-outline text-sm disabled:opacity-50"
              >
                Sau →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
