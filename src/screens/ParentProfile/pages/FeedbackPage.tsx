import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Loader, AlertCircle, ChevronDown } from "lucide-react";
import { getOrderDetail, type OrderDetailDto, type OrderItemDto } from "../../../lib/api/orders";
import { submitOutfitFeedback, getParentFeedbacks, type ParentFeedbackDto, type CampaignFilterDto } from "../../../lib/api/feedback";
import { useToast } from "../../../contexts/ToastContext";

/* ── Types ── */
type FeedbackFormState = {
  orderItemId: string;
  outfitName: string;
  outfitImage: string | null;
  rating: number;
  comment: string;
  isSubmitted: boolean;
};

type FeedbackFormMap = {
  [key: string]: FeedbackFormState;
};

/* ── Utility ── */
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

/* ── Feedback List Card ── */
function FeedbackListCard({ feedback }: Readonly<{ feedback: ParentFeedbackDto }>) {
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

/* ── Outfit Feedback Card (Form Mode) ── */
function OutfitFeedbackCard({
  item,
  formState,
  onRatingChange,
  onCommentChange,
  onSubmit,
  isSubmitting,
  onComplete,
}: Readonly<{
  item: OrderItemDto;
  formState: FeedbackFormState;
  onRatingChange: (val: number) => void;
  onCommentChange: (val: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  onComplete?: () => void;
}>) {
  return (
    <div className="nb-card overflow-hidden">
      {/* Outfit Info */}
      <div className="p-5 flex gap-4 border-b-2 border-[#1A1A2E]/10">
        {formState.outfitImage ? (
          <img
            src={formState.outfitImage}
            alt={formState.outfitName}
            className="w-20 h-20 rounded-lg object-cover border-2 border-[#1A1A2E]"
          />
        ) : (
          <div className="w-20 h-20 rounded-lg bg-[#EDE9FE] border-2 border-[#1A1A2E] flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">👔</span>
          </div>
        )}
        <div className="flex-1">
          <p className="font-bold text-[#1A1A2E] text-sm">{formState.outfitName}</p>
          <p className="font-medium text-[#9CA3AF] text-xs mt-1">Số lượng: {item.quantity}</p>
          <p className="font-medium text-[#9CA3AF] text-xs">Kích cỡ: {item.size}</p>
          <p className="font-bold text-[#1A1A2E] text-sm mt-2">{item.price.toLocaleString("vi-VN")} ₫</p>
        </div>
      </div>

      {/* Feedback Form */}
      <div className="p-5 space-y-4">
        {/* Rating */}
        <div>
          <p className="font-bold text-[#1A1A2E] text-sm mb-3">Đánh giá của bạn</p>
          <RatingStars value={formState.rating} onChange={onRatingChange} readOnly={formState.isSubmitted} />
          {formState.rating > 0 && (
            <p className="text-xs text-[#6B7280] mt-2">
              {["", "Rất không tốt", "Không tốt", "Bình thường", "Tốt", "Rất tốt"][
                formState.rating
              ]}
            </p>
          )}
        </div>

        {/* Comment */}
        <div>
          <p className="font-bold text-[#1A1A2E] text-sm mb-2">Bình luận (tuỳ chọn)</p>
          <textarea
            value={formState.comment}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
            maxLength={500}
            disabled={formState.isSubmitted}
            className="w-full p-3 border-2 border-[#1A1A2E] rounded-lg text-sm font-medium text-[#1A1A2E] placeholder-[#9CA3AF] focus:outline-none focus:bg-[#F3F4F6] resize-none disabled:opacity-50"
            rows={4}
          />
          <p className="text-xs text-[#9CA3AF] mt-1">
            {formState.comment.length}/500
          </p>
        </div>

        {/* Buttons */}
        {!formState.isSubmitted && (
          <button
            onClick={onSubmit}
            disabled={formState.rating === 0 || isSubmitting}
            className="w-full nb-btn nb-btn-purple disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader className="w-4 h-4 animate-spin" />}
            Gửi đánh giá
          </button>
        )}
        {formState.isSubmitted && (
          <div className="space-y-2">
            <div className="w-full p-3 bg-[#D1FAE5] border-2 border-[#C8E44D] rounded-lg flex items-center gap-2">
              <span className="text-lg">✓</span>
              <span className="text-sm font-bold text-[#065F46]">Cảm ơn bạn đã đánh giá!</span>
            </div>
            <button
              onClick={onComplete}
              className="w-full nb-btn nb-btn-outline text-sm"
            >
              Xem các đánh giá của bạn
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Component ── */
export function FeedbackPage(): JSX.Element {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const orderId = searchParams.get("orderId");

  // ── Form Mode State (when orderId is present) ──
  const [order, setOrder] = useState<OrderDetailDto | null>(null);
  const [forms, setForms] = useState<FeedbackFormMap>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // ── List Mode State (when orderId is not present) ──
  const [feedbacks, setFeedbacks] = useState<ParentFeedbackDto[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignFilterDto[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const pageSize = 8;

  /* ── Fetch order (form mode) ── */
  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      setLoading(true);
      try {
        const data = await getOrderDetail(orderId);
        setOrder(data);

        const initialForms: FeedbackFormMap = {};
        data.items.forEach((item) => {
          initialForms[item.orderItemId] = {
            orderItemId: item.orderItemId,
            outfitName: item.outfitName,
            outfitImage: item.outfitImage,
            rating: 0,
            comment: "",
            isSubmitted: false,
          };
        });
        setForms(initialForms);
      } catch (err: any) {
        showToast({
          title: "Lỗi",
          message: err?.message || "Không thể tải thông tin đơn hàng",
          variant: "error",
        });
        navigate("/parentprofile/orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  /* ── Fetch feedbacks (list mode) ── */
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
      showToast({ title: "Lỗi", message: "Không thể tải đánh giá", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!orderId) {
      setPage(1);
    }
  }, [selectedCampaignId, orderId]);

  useEffect(() => {
    if (!orderId) {
      fetchFeedbacks();
    }
  }, [orderId, selectedCampaignId, page, pageSize, showToast]);

  /* ── Form Mode Handlers ── */
  const handleRatingChange = (productVariantId: string, rating: number) => {
    setForms((prev) => ({
      ...prev,
      [productVariantId]: {
        ...prev[productVariantId],
        rating,
      },
    }));
  };

  const handleCommentChange = (productVariantId: string, comment: string) => {
    setForms((prev) => ({
      ...prev,
      [productVariantId]: {
        ...prev[productVariantId],
        comment,
      },
    }));
  };

  const handleSubmitFeedback = async (orderItemId: string) => {
    const form = forms[orderItemId];
    if (!form || form.rating === 0) return;

    setSubmittingId(orderItemId);
    try {
      await submitOutfitFeedback({
        orderItemId: form.orderItemId,
        rating: form.rating,
        comment: form.comment || undefined,
      });

      setForms((prev) => ({
        ...prev,
        [orderItemId]: {
          ...prev[productVariantId],
          isSubmitted: true,
        },
      }));

      showToast({
        title: "Thành công",
        message: "Cảm ơn bạn đã đánh giá!",
        variant: "success",
      });

      // Auto-redirect after a short delay to let user see the success toast
      setTimeout(() => {
        navigate("/parentprofile/reviews");
      }, 1500);
    } catch (err: any) {
      showToast({
        title: "Lỗi",
        message: err?.message || "Không thể gửi đánh giá",
        variant: "error",
      });
    } finally {
      setSubmittingId(null);
    }
  };

  /* ── Render: Form Mode (With orderId) ── */
  if (orderId) {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-8 h-8 border-4 border-[#E5E7EB] border-t-[#B8A9E8] rounded-full animate-spin" />
          <p className="text-sm text-[#6B7280] font-medium">Đang tải...</p>
        </div>
      );
    }

    if (!order) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <p className="text-sm text-[#6B7280] font-medium">Không tìm thấy đơn hàng</p>
          <button
            onClick={() => navigate("/parentprofile/orders")}
            className="nb-btn nb-btn-outline text-sm"
          >
            Quay lại
          </button>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#F9FAFB] p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <button
              onClick={() => navigate("/parentprofile/orders")}
              className="p-2 hover:bg-[#EDE9FE] rounded-lg transition-colors"
              title="Quay lại trang đơn hàng"
            >
              <ArrowLeft className="w-5 h-5 text-[#1A1A2E]" />
            </button>
            <div>
              <p className="font-bold text-[#1A1A2E]">Đánh giá sản phẩm</p>
              <p className="text-xs text-[#9CA3AF]">
                Đơn #{order.orderId.slice(0, 8)} • {order.items.length} sản phẩm
              </p>
            </div>
          </div>

          {/* Order Summary Card */}
          <div className="nb-card p-4 mb-6">
            <div className="flex items-center gap-3">
              {order.childAvatar ? (
                <img
                  src={order.childAvatar}
                  alt={order.childName}
                  className="w-12 h-12 rounded-lg object-cover border-2 border-[#1A1A2E]"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-[#EDE9FE] border-2 border-[#1A1A2E] flex items-center justify-center">
                  <span className="text-lg">👤</span>
                </div>
              )}
              <div className="flex-1">
                <p className="font-bold text-[#1A1A2E] text-sm">{order.childName}</p>
                <p className="text-xs text-[#9CA3AF]">
                  Đặt hàng: {new Date(order.orderDate).toLocaleDateString("vi-VN")}
                </p>
              </div>
              <p className="font-bold text-[#1A1A2E]">
                {order.totalAmount.toLocaleString("vi-VN")} ₫
              </p>
            </div>
          </div>

          {/* Feedback Cards */}
          <div className="space-y-4">
            {order.items.map((item) => (
              <OutfitFeedbackCard
                key={item.orderItemId}
                item={item}
                formState={forms[item.orderItemId] || {
                  orderItemId: item.orderItemId,
                  outfitName: item.outfitName,
                  outfitImage: item.outfitImage,
                  rating: 0,
                  comment: "",
                  isSubmitted: false,
                }}
                onRatingChange={(val) =>
                  handleRatingChange(item.orderItemId, val)
                }
                onCommentChange={(val) =>
                  handleCommentChange(item.orderItemId, val)
                }
                onSubmit={() => handleSubmitFeedback(item.orderItemId)}
                isSubmitting={submittingId === item.orderItemId}
                onComplete={() => navigate("/parentprofile/feedback")}
              />
            ))}
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-[#EDE9FE] border-2 border-[#1A1A2E] rounded-lg">
            <p className="font-bold text-[#1A1A2E] text-xs">
              💡 Mẹo: Đánh giá của bạn sẽ giúp các phụ huynh khác chọn sản phẩm phù hợp!
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Render: List Mode (Without orderId) ── */
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
              <FeedbackListCard
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
              <FeedbackListCard
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
}
