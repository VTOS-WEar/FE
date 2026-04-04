import { useState, useEffect } from "react";
import { Star, AlertCircle, ChevronDown } from "lucide-react";
import { getParentFeedbacks, type ParentFeedbackDto, type CampaignFilterDto } from "../../../lib/api/feedback";

function fmt(n: number) { return n.toLocaleString("vi-VN") + " ₫"; }

/* ── Review Card ── */
function ReviewCard({ feedback }: Readonly<{ feedback: ParentFeedbackDto }>) {
  const hasRating = feedback.rating !== null && feedback.rating !== undefined;

  return (
    <div className="nb-card overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-4 flex gap-4">
        {/* Product Image */}
        <div className="flex-shrink-0">
          <img
            src={feedback.outfitImageUrl || "/placeholder.svg"}
            alt={feedback.outfitName}
            className="w-20 h-20 rounded-lg object-cover border-2 border-[#1A1A2E]"
          />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="font-bold text-[#1A1A2E] text-sm">{feedback.outfitName}</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">{feedback.campaignName}</p>
              <p className="text-xs text-[#6B7280] font-medium mt-1">{fmt(feedback.outfitPrice)}</p>
            </div>

            {hasRating && (
              <div className="flex items-center gap-1 bg-[#FEF3C7] px-2 py-1 rounded-lg">
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
                <span className="text-xs font-bold text-[#92400E]">{feedback.rating}</span>
              </div>
            )}
          </div>

          {/* Comment / Placeholder */}
          {hasRating && feedback.comment && (
            <p className="text-xs text-[#6B7280] mt-2 line-clamp-2">
              &ldquo;{feedback.comment}&rdquo;
            </p>
          )}
          {!hasRating && (
            <p className="text-xs text-[#9CA3AF] italic mt-2">Chưa đánh giá sản phẩm này</p>
          )}

          {/* Timestamp */}
          {hasRating && feedback.feedbackTimestamp && (
            <p className="text-xs text-[#9CA3AF] mt-2">
              {new Date(feedback.feedbackTimestamp).toLocaleDateString("vi-VN")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ── */
export const ReviewsTab = (): JSX.Element => {
  const [feedbacks, setFeedbacks] = useState<ParentFeedbackDto[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignFilterDto[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const pageSize = 8;

  /* ── Fetch feedbacks ── */
  useEffect(() => {
    const fetchFeedbacks = async () => {
      setLoading(true);
      try {
        const result = await getParentFeedbacks({
          campaignId: selectedCampaignId || undefined,
          page,
          pageSize,
        });
        setFeedbacks(result.items);
        setCampaigns(result.campaigns);
        setTotal(result.total);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, [selectedCampaignId, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [selectedCampaignId]);

  /* ── Split rated/not rated ── */
  const ratedFeedbacks = feedbacks.filter((f) => f.rating !== null && f.rating !== undefined);
  const notRatedFeedbacks = feedbacks.filter((f) => f.rating === null || f.rating === undefined);
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

      {/* Not Yet Rated Section */}
      {notRatedFeedbacks.length > 0 && (
        <div>
          <h3 className="font-bold text-[#1A1A2E] text-sm mb-3 flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#FEF3C7] border-2 border-[#F5E642]" />
            Chưa đánh giá ({notRatedFeedbacks.length})
          </h3>
          <div className="grid gap-3">
            {notRatedFeedbacks.map((feedback) => (
              <ReviewCard
                key={feedback.campaignOutfitId}
                feedback={feedback}
              />
            ))}
          </div>
        </div>
      )}

      {/* Already Rated Section */}
      {ratedFeedbacks.length > 0 && (
        <div>
          <h3 className="font-bold text-[#1A1A2E] text-sm mb-3 flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#D1FAE5] border-2 border-[#C8E44D]" />
            Đã đánh giá ({ratedFeedbacks.length})
          </h3>
          <div className="grid gap-3">
            {ratedFeedbacks.map((feedback) => (
              <ReviewCard
                key={feedback.campaignOutfitId}
                feedback={feedback}
              />
            ))}
          </div>
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
