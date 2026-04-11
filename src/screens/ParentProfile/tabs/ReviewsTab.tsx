import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Star, AlertCircle, ChevronDown, Package, Calendar, Clock, ShoppingBag, MessageSquare, Edit2, History, XCircle } from "lucide-react";
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
      <div className="nb-card !rounded-[12px] overflow-hidden shadow-[3px_3px_0_#1A1A2E] hover:shadow-[6px_6px_0_#1A1A2E] transition-all duration-300">
        {/* Header */}
        <div className="p-4 border-b-2 border-[#1A1A2E]/10 flex items-center justify-between rounded-t-[12px]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#B8A9E8]" />
            <span className="font-bold text-xs uppercase text-[#1A1A2E]">
              📦 Chiến dịch: <span className="text-[#B8A9E8]">{feedback.campaignName}</span>
            </span>
          </div>
          <button onClick={handleCancel} className="text-[#9CA3AF] hover:text-[#1A1A2E]">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-5 space-y-6">
          <div className="flex gap-4">
            <div className="w-20 h-20 rounded-lg border-2 border-[#1A1A2E] overflow-hidden bg-[#EDE9FE] flex-shrink-0 shadow-[2px_2px_0_#1A1A2E]">
              {feedback.outfitImageUrl ? (
                <img
                  src={feedback.outfitImageUrl}
                  alt={feedback.outfitName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="w-8 h-8 text-[#B8A9E8] m-auto mt-6" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-[#1A1A2E] text-sm leading-tight mb-1">{feedback.outfitName}</h3>
              <p className="text-xs text-[#9CA3AF] mb-3">{feedback.outfitType}</p>

              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-0.5 bg-[#F3F4F6] border border-[#D1D5DB] rounded text-[10px] font-bold text-[#1A1A2E]">Size {feedback.size}</span>
                <span className="px-2 py-0.5 bg-[#F3F4F6] border border-[#D1D5DB] rounded text-[10px] font-bold text-[#1A1A2E]">x{feedback.quantity}</span>
                <span className="px-2 py-0.5 bg-[#C8E44D]/20 border border-[#C8E44D] rounded text-[10px] font-bold text-[#1A1A2E]">{fmt(feedback.outfitPrice)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t-2 border-[#1A1A2E]/5">
            <div>
              <label className="block text-xs font-bold text-[#1A1A2E] uppercase mb-2">Chất lượng sản phẩm</label>
              <RatingStars value={rating} onChange={setRating} readOnly={isSubmitting} />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1A1A2E] uppercase mb-2">Cảm nhận của bạn</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={isSubmitting}
                placeholder="Sản phẩm mặc lên rất đẹp, bé rất thích..."
                maxLength={500}
                className="w-full p-3 border-2 border-[#1A1A2E] rounded-lg text-sm font-medium text-[#1A1A2E] placeholder-[#9CA3AF] focus:outline-none focus:bg-[#F9FAFB] shadow-[2px_2px_0_#1A1A2E] resize-none disabled:opacity-50"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F9FAFB] border-t-2 border-[#1A1A2E]/10 flex gap-3 justify-end">
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
    <div className="nb-card !rounded-[12px] overflow-hidden shadow-[3px_3px_0_#1A1A2E] hover:shadow-[6px_6px_0_#1A1A2E] transition-all duration-300 hover:-translate-y-1">
      <div className="p-5 flex flex-col md:flex-row gap-6">
        {/* Product Section */}
        <div className="flex-1 flex gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-lg border-2 border-[#1A1A2E] overflow-hidden bg-[#EDE9FE] shadow-[2px_2px_0_#1A1A2E]">
              {feedback.outfitImageUrl ? (
                <img
                  src={feedback.outfitImageUrl}
                  alt={feedback.outfitName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="w-8 h-8 text-[#B8A9E8] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              )}
            </div>
            {hasRating && (
              <div className="absolute -top-2 -right-2 bg-[#C8E44D] border-2 border-[#1A1A2E] px-1.5 py-0.5 rounded font-bold text-[9px] shadow-[1px_1px_0_#1A1A2E]">
                {feedback.rating}/5 ⭐
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-[#9CA3AF] mb-1 uppercase truncate">
              📦 {feedback.campaignName}
            </p>
            <h3
              className="font-bold text-[#1A1A2E] text-sm truncate hover:text-[#B8A9E8] transition-colors cursor-pointer mb-2"
              onClick={() => navigate(`/outfits/${feedback.outfitId}`)}
            >
              {feedback.outfitName}
            </h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-medium text-[#6B7280]">
              <span className="flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5" />
                {feedback.outfitType}
              </span>
              <span className="px-1.5 py-0.5 bg-[#F3F4F6] border border-[#D1D5DB] rounded">
                Size {feedback.size}
              </span>
              <span className="font-bold text-[#1A1A2E]">
                {fmt(feedback.outfitPrice)}
              </span>
            </div>
          </div>
        </div>

        {/* Timeline Section */}
        <div className="flex flex-row md:flex-col justify-between md:justify-center gap-4 md:pl-6 md:border-l-2 md:border-dashed md:border-[#1A1A2E]/10 min-w-[160px]">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-[#9CA3AF] mb-0.5">
              <Calendar className="w-3.5 h-3.5" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Thời gian đặt</span>
            </div>
            <p className="text-[11px] font-bold text-[#1A1A2E]">
              {fmtFullDate(feedback.orderDate)}
            </p>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-[#9CA3AF] mb-0.5">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Thời gian phản hồi</span>
            </div>
            <p className="text-[11px] font-bold text-[#1A1A2E]">
              {feedback.feedbackTimestamp
                ? fmtFullDate(feedback.feedbackTimestamp)
                : "---"
              }
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Action/Review Section */}
      <div className="px-5 py-4 bg-[#F9FAFB] border-t-2 border-[#1A1A2E]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full">
          {hasRating ? (
            <div className="flex gap-2.5 items-start">
              <MessageSquare className="w-4 h-4 text-[#B8A9E8] mt-0.5 flex-shrink-0" />
              <p className="text-xs text-[#6B7280] italic leading-relaxed line-clamp-2">
                {feedback.comment ? `"${feedback.comment}"` : "Bạn không để lại bình luận."}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[#9CA3AF]">
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
          <h2 className="font-bold text-[#1A1A2E] text-xl">Đánh giá sản phẩm sáng tạo</h2>
          <p className="text-sm text-[#9CA3AF] mt-1">
            Quản lý và xem các đánh giá của bạn về sản phẩm từ các đơn hàng
          </p>
        </div>

        {/* Campaign Filter */}
        <div className="relative w-full md:w-[320px]">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full bg-white border-2 border-[#1A1A2E] p-3 rounded-lg shadow-[3px_3px_0_#1A1A2E] flex items-center justify-between transition-all hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1A1A2E] active:shadow-none"
            title="Lọc theo chiến dịch"
          >
            <div className="text-left">
              <p className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider">Bộ lọc chiến dịch</p>
              <p className="text-sm font-bold text-[#1A1A2E] mt-0.5 truncate max-w-[220px]">
                {selectedCampaignId
                  ? campaigns.find((c) => c.campaignId === selectedCampaignId)?.campaignName || "Chọn chiến dịch"
                  : "Tất cả chiến dịch"}
              </p>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-[#1A1A2E] transition-transform duration-300 ${showFilters ? "rotate-180" : ""}`}
            />
          </button>

          {showFilters && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-[#1A1A2E] rounded-lg shadow-lg z-10">
              <button
                onClick={() => {
                  setSelectedCampaignId(null);
                  setShowFilters(false);
                }}
                className={`w-full px-4 py-3 text-left text-sm font-bold transition-colors ${selectedCampaignId === null
                  ? "bg-[#B8A9E8] text-white"
                  : "text-[#1A1A2E] hover:bg-[#F3F4F6]"
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
      </div>

      {/* Tab Navigation - Always visible */}
      <div className="flex gap-4 border-b-2 border-[#E5E7EB]">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-3 font-bold text-sm border-b-4 transition-colors ${activeTab === "all"
            ? "text-[#1A1A2E] border-[#B8A9E8]"
            : "text-[#9CA3AF] border-transparent hover:text-[#1A1A2E]"
            }`}
        >
          Tất cả ({ratingCounts.find(rc => rc.label === "all")?.count || 0})
        </button>
        <button
          onClick={() => setActiveTab("not-rated")}
          className={`px-4 py-3 font-bold text-sm border-b-4 transition-colors ${activeTab === "not-rated"
            ? "text-[#1A1A2E] border-[#B8A9E8]"
            : "text-[#9CA3AF] border-transparent hover:text-[#1A1A2E]"
            }`}
        >
          Chưa đánh giá ({ratingCounts.find(rc => rc.label === "not-rated")?.count || 0})
        </button>
        <button
          onClick={() => setActiveTab("rated")}
          className={`px-4 py-3 font-bold text-sm border-b-4 transition-colors ${activeTab === "rated"
            ? "text-[#1A1A2E] border-[#B8A9E8]"
            : "text-[#9CA3AF] border-transparent hover:text-[#1A1A2E]"
            }`}
        >
          Đã đánh giá ({ratingCounts.find(rc => rc.label === "rated")?.count || 0})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#E5E7EB] border-t-[#B8A9E8] rounded-full animate-spin" />
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
              <div className="w-16 h-16 bg-[#EDE9FE] rounded-xl flex items-center justify-center border-2 border-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E]">
                <AlertCircle className="w-8 h-8 text-[#1A1A2E]" />
              </div>
              <p className="font-medium text-[#6B7280] text-sm text-center">
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
        </>
      )}
    </div>
  );
};
