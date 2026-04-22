import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Loader } from "lucide-react";
import { getOrderDetail, type OrderDetailDto, type OrderItemDto } from "../../../lib/api/orders";
import { submitOutfitFeedback, getParentFeedbacks, type ParentFeedbackDto } from "../../../lib/api/feedback";
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

/* ── Editable Feedback Card ── */
function EditableFeedbackCard({
  feedback,
  isEditing,
  onToggleEdit,
  formState,
  onRatingChange,
  onCommentChange,
  onSubmit,
  onCancel,
  isSubmitting,
  onRefresh,
}: Readonly<{
  feedback: ParentFeedbackDto;
  isEditing: boolean;
  onToggleEdit: () => void;
  formState: FeedbackFormState;
  onRatingChange: (val: number) => void;
  onCommentChange: (val: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  onRefresh: () => void;
}>) {
  const hasRating = feedback.rating !== null && feedback.rating !== undefined;

  // Display Mode
  if (!isEditing) {
    return (
      <div className="nb-card overflow-hidden hover:shadow-lg transition-shadow">
        <div className="p-4 flex gap-4">
          {/* Product Image */}
          <div className="flex-shrink-0">
            <img
              src={feedback.outfitImageUrl || "/placeholder.svg"}
              alt={feedback.outfitName}
              className="w-20 h-20 rounded-lg object-cover border border-gray-200"
            />
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-sm">{feedback.outfitName}</p>
                <p className="text-xs text-gray-400 mt-0.5">Danh mục: {feedback.campaignName}</p>
                <p className="text-xs text-gray-500 font-medium mt-1">{fmt(feedback.outfitPrice)}</p>
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
                  <span className="text-xs font-bold text-amber-800">{feedback.rating}</span>
                </div>
              )}
            </div>

            {/* Comment / Placeholder */}
            {hasRating && feedback.comment && (
              <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                &ldquo;{feedback.comment}&rdquo;
              </p>
            )}
            {!hasRating && (
              <p className="text-xs text-gray-400 italic mt-2">Chưa đánh giá sản phẩm này</p>
            )}

            {/* Timestamp */}
            {hasRating && feedback.feedbackTimestamp && (
              <p className="text-xs text-gray-400 mt-2">
                {new Date(feedback.feedbackTimestamp).toLocaleDateString("vi-VN")}
              </p>
            )}

            {/* Edit Button */}
            <button
              onClick={onToggleEdit}
              className="mt-3 text-xs font-bold text-purple-400 hover:text-[#9680c5] transition-colors"
            >
              Chỉnh sửa
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Edit Mode
  return (
    <div className="nb-card overflow-hidden">
      {/* Outfit Info */}
      <div className="p-5 flex gap-4 border-b border-gray-200/10">
        <img
          src={feedback.outfitImageUrl || "/placeholder.svg"}
          alt={feedback.outfitName}
          className="w-20 h-20 rounded-lg object-cover border border-gray-200"
        />
        <div className="flex-1">
          <p className="font-bold text-gray-900 text-sm">{feedback.outfitName}</p>
          <p className="font-medium text-gray-400 text-xs mt-1">Danh mục: {feedback.campaignName}</p>
          <p className="font-bold text-gray-900 text-sm mt-2">{fmt(feedback.outfitPrice)}</p>
        </div>
      </div>

      {/* Feedback Form */}
      <div className="p-5 space-y-4">
        {/* Rating */}
        <div>
          <p className="font-bold text-gray-900 text-sm mb-3">Đánh giá của bạn</p>
          <RatingStars value={formState.rating} onChange={onRatingChange} />
          {formState.rating > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              {["", "Rất không tốt", "Không tốt", "Bình thường", "Tốt", "Rất tốt"][
                formState.rating
              ]}
            </p>
          )}
        </div>

        {/* Comment */}
        <div>
          <p className="font-bold text-gray-900 text-sm mb-2">Bình luận (tuỳ chọn)</p>
          <textarea
            value={formState.comment}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
            maxLength={500}
            className="w-full p-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 placeholder-[#9CA3AF] focus:outline-none focus:bg-gray-100 resize-none"
            rows={4}
          />
          <p className="text-xs text-gray-400 mt-1">
            {formState.comment.length}/500
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onSubmit}
            disabled={formState.rating === 0 || isSubmitting}
            className="flex-1 nb-btn nb-btn-purple disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader className="w-4 h-4 animate-spin" />}
            Lưu đánh giá
          </button>
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 nb-btn nb-btn-outline text-sm"
          >
            Huỷ
          </button>
        </div>
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

  // State
  const [order, setOrder] = useState<OrderDetailDto | null>(null);
  const [forms, setForms] = useState<FeedbackFormMap>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /* ── Fetch order + its feedbacks ── */
  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const fetchOrderAndFeedbacks = async () => {
      setLoading(true);
      try {
        const orderData = await getOrderDetail(orderId);
        setOrder(orderData);

        // Fetch feedbacks for all items in this order
        const allFeedbacksResult = await getParentFeedbacks({
          page: 1,
          pageSize: 100,
        });

        // Map feedbacks by orderItemId, ch\u1ec9 l\u1ea5y feedback c\u1ee7a order n\u00e0y
        const feedbackMap = new Map<string, ParentFeedbackDto>();
        const orderItemIds = new Set(orderData.items.map(item => item.orderItemId));
        allFeedbacksResult.items.forEach((feedback) => {
          // Ch\u1ec9 l\u1ea5y feedback n\u1ebfu orderItemId c\u00f3 trong order n\u00e0y
          if (orderItemIds.has(feedback.orderItemId)) {
            feedbackMap.set(feedback.orderItemId, feedback);
          }
        });

        // Initialize forms with order items
        const initialForms: FeedbackFormMap = {};
        orderData.items.forEach((item) => {
          const existingFeedback = feedbackMap.get(item.orderItemId);
          // Nếu có feedback thật → lấy dữ liệu từ feedback
          // Nếu không có → form trống
          if (existingFeedback && existingFeedback.rating !== null) {
            initialForms[item.orderItemId] = {
              orderItemId: item.orderItemId,
              outfitName: item.outfitName,
              outfitImage: item.outfitImage,
              rating: existingFeedback.rating,
              comment: existingFeedback.comment || "",
              isSubmitted: true, // Đã có feedback thật
            };
          } else {
            // Không có feedback - form trống
            initialForms[item.orderItemId] = {
              orderItemId: item.orderItemId,
              outfitName: item.outfitName,
              outfitImage: item.outfitImage,
              rating: 0,
              comment: "",
              isSubmitted: false,
            };
          }
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

    fetchOrderAndFeedbacks();
  }, [orderId]);



  /* ── Form Mode Handlers ── */
  const handleRatingChange = (itemId: string, rating: number) => {
    setForms((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        rating,
      },
    }));
  };

  const handleCommentChange = (itemId: string, comment: string) => {
    setForms((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        comment,
      },
    }));
  };

  const handleSubmitFeedback = async (itemId: string) => {
    const form = forms[itemId];
    if (!form || form.rating === 0) return;

    setSubmittingId(itemId);
    try {
      await submitOutfitFeedback({
        orderItemId: form.orderItemId,
        rating: form.rating,
        comment: form.comment || undefined,
      });

      setForms((prev) => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          isSubmitted: true,
        },
      }));

      showToast({
        title: "Thành công",
        message: "Cảm ơn bạn đã đánh giá!",
        variant: "success",
      });

      // Auto-redirect after success
      setTimeout(() => {
        navigate("/parentprofile/feedback");
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



  /* ── Render ── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#B8A9E8] rounded-full animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Đang tải...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <p className="text-sm text-gray-500 font-medium">Không tìm thấy đơn hàng</p>
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate("/parentprofile/orders")}
            className="p-2 hover:bg-violet-50 rounded-lg transition-colors"
            title="Quay lại trang đơn hàng"
          >
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>
          <div>
            <p className="font-bold text-gray-900">Đánh giá sản phẩm</p>
            <p className="text-xs text-gray-400">
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
                className="w-12 h-12 rounded-lg object-cover border border-gray-200"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-violet-50 border border-gray-200 flex items-center justify-center">
                <span className="text-lg">👤</span>
              </div>
            )}
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-sm">{order.childName}</p>
              <p className="text-xs text-gray-400">
                Đặt hàng: {new Date(order.orderDate).toLocaleDateString("vi-VN")}
              </p>
            </div>
            <p className="font-bold text-gray-900">
              {order.totalAmount.toLocaleString("vi-VN")} ₫
            </p>
          </div>
        </div>

        {/* Feedback Cards */}
        <div className="space-y-4">
          {order.items.map((item) => {
            const formState = forms[item.orderItemId];
            const isSubmitted = formState?.isSubmitted ?? false;
            return (
              <div key={item.orderItemId} className="nb-card overflow-hidden">
                {/* Outfit Info */}
                <div className="p-5 flex gap-4 border-b border-gray-200/10">
                  {item.outfitImage ? (
                    <img
                      src={item.outfitImage}
                      alt={item.outfitName}
                      className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-violet-50 border border-gray-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">👔</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-sm">{item.outfitName}</p>
                    <p className="font-medium text-gray-400 text-xs mt-1">Số lượng: {item.quantity}</p>
                    <p className="font-medium text-gray-400 text-xs">Kích cỡ: {item.size}</p>
                    <p className="font-bold text-gray-900 text-sm mt-2">{item.price.toLocaleString("vi-VN")} ₫</p>
                  </div>
                </div>

                {/* Feedback Form */}
                <div className="p-5 space-y-4">
                  {/* Rating */}
                  <div>
                    <p className="font-bold text-gray-900 text-sm mb-3">Đánh giá của bạn</p>
                    <RatingStars value={formState?.rating ?? 0} onChange={(val) => handleRatingChange(item.orderItemId, val)} />
                    {(formState?.rating ?? 0) > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        {["", "Rất không tốt", "Không tốt", "Bình thường", "Tốt", "Rất tốt"][
                          formState?.rating ?? 0
                        ]}
                      </p>
                    )}
                  </div>

                  {/* Comment */}
                  <div>
                    <p className="font-bold text-gray-900 text-sm mb-2">Bình luận (tuỳ chọn)</p>
                    <textarea
                      value={formState?.comment ?? ""}
                      onChange={(e) => handleCommentChange(item.orderItemId, e.target.value)}
                      placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                      maxLength={500}
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 placeholder-[#9CA3AF] focus:outline-none focus:bg-gray-100 resize-none"
                      rows={4}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {(formState?.comment ?? "").length}/500
                    </p>
                  </div>

                  {/* Submit/Update Button */}
                  <button
                    onClick={() => handleSubmitFeedback(item.orderItemId)}
                    disabled={(formState?.rating ?? 0) === 0 || submittingId === item.orderItemId}
                    className="w-full nb-btn nb-btn-purple disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submittingId === item.orderItemId && <Loader className="w-4 h-4 animate-spin" />}
                    {isSubmitted ? "Cập nhật đánh giá" : "Gửi đánh giá"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-violet-50 border border-gray-200 rounded-lg">
          <p className="font-bold text-gray-900 text-xs">
            💡 Mẹo: Đánh giá của bạn sẽ giúp các phụ huynh khác chọn sản phẩm phù hợp!
          </p>
        </div>
      </div>
    </div>
  );
}
