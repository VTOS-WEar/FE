import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Star, AlertCircle, ChevronDown, Package } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { getParentFeedbacks, submitOutfitFeedback, type ParentFeedbackDto, type CampaignFilterDto, type RatingCountDto } from "../../../lib/api/feedback";

function fmt(n: number) { return n.toLocaleString("vi-VN") + " ₫"; }

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
            className={`transition-all duration-200 ${
              isFilled
                ? "text-[#C8E44D] drop-shadow-[2px_2px_0_#1A1A2E]"
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
      <div className="nb-card overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b-2 border-[#1A1A2E]/10">
          <p className="font-bold text-[#1A1A2E] text-sm">
            📦 Chiến dịch: <span className="text-[#B8A9E8]">{feedback.campaignName}</span>
          </p>
        </div>

        {/* Form Content */}
        <div className="p-5 space-y-4">
          {/* Product Info */}
          <div className="flex gap-3 pb-4 border-b-2 border-[#1A1A2E]/10">
            <div className="w-16 h-16 rounded-lg border-2 border-[#1A1A2E] flex items-center justify-center overflow-hidden bg-[#EDE9FE] flex-shrink-0">
              {feedback.outfitImageUrl && feedback.outfitImageUrl.trim() !== "" ? (
                <img 
                  src={feedback.outfitImageUrl} 
                  alt={feedback.outfitName} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : null}
              {!feedback.outfitImageUrl || feedback.outfitImageUrl.trim() === "" ? (
                <Package className="w-8 h-8 text-[#B8A9E8]" />
              ) : null}
            </div>
            <div className="flex-1">
              <button
                onClick={() => navigate(`/outfits/${feedback.outfitId}`)}
                className="font-bold text-[#1A1A2E] text-sm hover:text-[#B8A9E8] transition-colors text-left"
                title="Xem chi tiết sản phẩm"
              >
                {feedback.outfitName}
              </button>
              <p className="text-xs text-[#9CA3AF] mt-1">{feedback.outfitType}</p>
              <div className="mt-2 space-y-1 text-xs text-[#6B7280]">
                <p>Kích cỡ: <span className="font-semibold text-[#1A1A2E]">{feedback.size}</span></p>
                <p>Số lượng: <span className="font-semibold text-[#1A1A2E]">{feedback.quantity}</span></p>
                <p>Giá: <span className="font-bold text-[#1A1A2E]">{fmt(feedback.outfitPrice)}</span></p>
              </div>
            </div>
          </div>

          {/* Rating Section */}
          <div>
            <label className="block text-sm font-bold text-[#1A1A2E] mb-3">Đánh giá</label>
            <RatingStars value={rating} onChange={setRating} readOnly={isSubmitting} />
          </div>

          {/* Comment Section */}
          <div>
            <label className="block text-sm font-bold text-[#1A1A2E] mb-2">Bình luận (tùy chọn)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isSubmitting}
              placeholder="Chia sẻ cảm nhận của bạn về sản phẩm này..."
              maxLength={500}
              className="w-full p-3 border-2 border-[#1A1A2E] rounded-lg text-sm font-medium text-[#1A1A2E] placeholder-[#9CA3AF] focus:outline-none focus:bg-[#F3F4F6] resize-none disabled:opacity-50"
              rows={4}
            />
            <div className="mt-1 text-xs text-[#9CA3AF]">
              {comment.length}/500
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t-2 border-[#1A1A2E]/10 flex gap-2 justify-end">
          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className="nb-btn nb-btn-outline text-sm disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || rating <= 0}
            className="nb-btn nb-btn-purple text-sm disabled:opacity-50"
          >
            {isSubmitting ? "Đang lưu..." : "Lưu đánh giá"}
          </button>
        </div>
        </div>
    );
  }

  return (
    <div className="nb-card overflow-hidden">
      {/* Header: Campaign name */}
      <div className="p-5 border-b-2 border-[#1A1A2E]/10">
        <p className="font-bold text-[#1A1A2E] text-sm">
          📦 Chiến dịch: <span className="text-[#B8A9E8]">{feedback.campaignName}</span>
        </p>
      </div>

      {/* Main content: Product image + details + Rating */}
      <div className="p-5 flex gap-4">
        {/* Product Image */}
        <div className="w-20 h-20 flex-shrink-0 bg-[#EDE9FE] rounded-lg border-2 border-[#1A1A2E] flex items-center justify-center overflow-hidden">
          {feedback.outfitImageUrl && feedback.outfitImageUrl.trim() !== "" ? (
            <img
              src={feedback.outfitImageUrl}
              alt={feedback.outfitName}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : null}
          {!feedback.outfitImageUrl || feedback.outfitImageUrl.trim() === "" ? (
            <Package className="w-8 h-8 text-[#B8A9E8]" />
          ) : null}
        </div>

        {/* Product Details */}
        <div className="flex-1">
          <button
            onClick={() => navigate(`/outfits/${feedback.outfitId}`)}
            className="font-bold text-[#1A1A2E] text-sm hover:text-[#B8A9E8] transition-colors text-left"
            title="Xem chi tiết sản phẩm"
          >
            {feedback.outfitName}
          </button>
          <div className="mt-2 space-y-1 text-xs text-[#6B7280]">
            <p>Loại: <span className="font-semibold text-[#1A1A2E]">{feedback.outfitType}</span></p>
            <p>Kích cỡ: <span className="font-semibold text-[#1A1A2E]">{feedback.size}</span></p>
            <p>Số lượng: <span className="font-semibold text-[#1A1A2E]">{feedback.quantity}</span></p>
            <p>Giá: <span className="font-bold text-[#1A1A2E]">{fmt(feedback.outfitPrice)}</span></p>
          </div>
        </div>

        {/* Rating Section + Button */}
        <div className="text-right flex flex-col justify-between items-end">
          {hasRating ? (
            <div className="flex items-center gap-1 bg-[#FEF3C7] px-3 py-2 rounded-lg">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i <= (feedback.rating ?? 0)
                        ? "fill-[#F5E642] text-[#F5E642]"
                        : "text-[#D1D5DB]"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-[#92400E]">{feedback.rating}/5</span>
            </div>
          ) : (
            <div className="px-3 py-2 rounded-lg border-2 border-dashed border-[#D1D5DB]">
              <span className="text-xs font-bold text-[#9CA3AF]">Chưa đánh giá</span>
            </div>
          )}
          
          <button
            onClick={() => setIsEditing(true)}
            className="nb-btn nb-btn-purple text-xs px-3 py-1 flex items-center gap-1"
          >
            <Star className="w-3 h-3" />
            {hasRating ? "Chỉnh sửa" : "Đánh giá"}
          </button>

          {hasRating && feedback.feedbackTimestamp && (
            <p className="text-[11px] text-[#9CA3AF] mt-2">
              {new Date(feedback.feedbackTimestamp).toLocaleDateString("vi-VN")}
            </p>
          )}
        </div>
      </div>

      {/* Comment Section */}
      {hasRating && feedback.comment && (
        <div className="px-5 pb-5 border-t-2 border-[#1A1A2E]/10">
          <p className="text-xs text-[#9CA3AF] font-bold mb-2">💬 Bình luận</p>
          <p className="text-xs text-[#6B7280] italic">"{feedback.comment}"</p>
        </div>
      )}
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
    fetchFeedbacks();
  }, [selectedCampaignId, page, activeTab]);

  // Get correct total for pagination based on active tab
  // Backend đã trả về đúng data theo hasRating filter, nên total = backend total
  const totalPages = Math.ceil(total / pageSize);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-[#E5E7EB] border-t-[#B8A9E8] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-bold text-[#1A1A2E] text-lg">Đánh giá sản phẩm</h2>
        <p className="text-sm text-[#9CA3AF] mt-1">
          Quản lý và xem các đánh giá của bạn về sản phẩm từ các đơn hàng
        </p>
      </div>

      {/* Campaign Filter */}
      <div className="relative">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full nb-card p-4 flex items-center justify-between"
          title="Lọc theo chiến dịch"
        >
          <div className="text-left">
            <p className="text-xs text-[#9CA3AF] font-bold">BỘ LỌC CHIẾN DỊCH</p>
            <p className="text-sm font-bold text-[#1A1A2E] mt-1">
              {selectedCampaignId
                ? campaigns.find((c) => c.campaignId === selectedCampaignId)?.campaignName || "Chọn chiến dịch"
                : "Tất cả chiến dịch"}
            </p>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-[#6B7280] transition-transform ${showFilters ? "rotate-180" : ""}`}
          />
        </button>

        {showFilters && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-[#1A1A2E] rounded-lg shadow-lg z-10">
            <button
              onClick={() => {
                setSelectedCampaignId(null);
                setShowFilters(false);
              }}
              className={`w-full px-4 py-3 text-left text-sm font-bold transition-colors ${
                selectedCampaignId === null
                  ? "bg-[#B8A9E8] text-white"
                  : "text-[#1A1A2E] hover:bg-[#F3F4F6]"
              }`}
              title="Xem tất cả chiến dịch"
            >
              Tất cả ({total})
            </button>
            {campaigns.map((campaign) => (
              <button
                key={campaign.campaignId}
                onClick={() => {
                  setSelectedCampaignId(campaign.campaignId);
                  setShowFilters(false);
                }}
                className={`w-full px-4 py-3 text-left text-sm font-bold transition-colors border-t border-[#F3F4F6] ${
                  selectedCampaignId === campaign.campaignId
                    ? "bg-[#B8A9E8] text-white"
                    : "text-[#1A1A2E] hover:bg-[#F3F4F6]"
                }`}
              >
                {campaign.campaignName} ({campaign.count})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* No data state */}
      {feedbacks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 bg-[#EDE9FE] rounded-xl flex items-center justify-center border-2 border-[#1A1A2E] shadow-[3px_3px_0_#1A1A2E]">
            <AlertCircle className="w-8 h-8 text-[#1A1A2E]" />
          </div>
          <p className="font-medium text-[#6B7280] text-sm text-center">
            Bạn chưa có sản phẩm nào để đánh giá từ các chiến dịch này.
          </p>
        </div>
      )}

      {/* Tab Navigation */}
      {feedbacks.length > 0 && (
        <div className="flex gap-4 border-b-2 border-[#E5E7EB]">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-3 font-bold text-sm border-b-4 transition-colors ${
              activeTab === "all"
                ? "text-[#1A1A2E] border-[#B8A9E8]"
                : "text-[#9CA3AF] border-transparent hover:text-[#1A1A2E]"
            }`}
          >
            Tất cả ({ratingCounts.reduce((sum, rc) => sum + rc.count, 0)})
          </button>
          <button
            onClick={() => setActiveTab("not-rated")}
            className={`px-4 py-3 font-bold text-sm border-b-4 transition-colors ${
              activeTab === "not-rated"
                ? "text-[#1A1A2E] border-[#B8A9E8]"
                : "text-[#9CA3AF] border-transparent hover:text-[#1A1A2E]"
            }`}
          >
            Chưa đánh giá ({ratingCounts.find(rc => rc.label === "not-rated")?.count || 0})
          </button>
          <button
            onClick={() => setActiveTab("rated")}
            className={`px-4 py-3 font-bold text-sm border-b-4 transition-colors ${
              activeTab === "rated"
                ? "text-[#1A1A2E] border-[#B8A9E8]"
                : "text-[#9CA3AF] border-transparent hover:text-[#1A1A2E]"
            }`}
          >
            Đã đánh giá ({ratingCounts.find(rc => rc.label === "rated")?.count || 0})
          </button>
        </div>
      )}

      {/* Tab Content - Server-side filtered data */}
      {feedbacks.length > 0 && (
        <div className="grid gap-3 mt-6">
          {feedbacks.map((feedback) => (
            <ReviewCard
              key={feedback.orderItemId}
              feedback={feedback}
              onRefresh={fetchFeedbacks}
            />
          ))}
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
          <span className="flex items-center text-sm text-[#6B7280] px-4 font-bold">
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
    </div>
  );
};
