import { api } from "./clients";
import { endpoints } from "./endpoints";

/* ── Types ── */
export type SubmitFeedbackRequest = {
  orderItemId: string;
  rating: number;
  comment?: string;
};

export type SubmitFeedbackResponse = {
  feedbackId: string;
  orderItemId: string;
  rating: number;
  comment?: string;
  timestamp: string;
};

export type ParentFeedbackDto = {
  feedbackId: string;
  orderItemId: string;
  campaignId: string;
  campaignName: string;
  outfitId: string;
  outfitName: string;
  outfitImageUrl: string;
  rating: number | null;
  comment: string | null;
  feedbackTimestamp: string | null;
  orderDate: string;
  outfitPrice: number;
  outfitType: string;
  size: string;
  quantity: number;
};

export type CampaignFilterDto = {
  campaignId: string;
  campaignName: string;
  count: number;
};

export type ParentFeedbacksResponse = {
  items: ParentFeedbackDto[];
  total: number;
  page: number;
  pageSize: number;
  campaigns: CampaignFilterDto[];
  ratingCounts: RatingCountDto[];
};

export type RatingCountDto = {
  label: string;
  count: number;
};

/* ── API Calls ── */

/** POST /api/feedbacks/order-item — Submit feedback for order item */
export async function submitOutfitFeedback(
  request: SubmitFeedbackRequest
): Promise<SubmitFeedbackResponse> {
  const result = await api<{ isSuccess: boolean; value: SubmitFeedbackResponse; error?: string }>(
    endpoints.feedbacks.submitOrderItem,
    {
      method: "POST",
      body: JSON.stringify(request),
      auth: true,
    }
  );

  // Backend wraps in Result<T> → { isSuccess, value, error }
  if (result && typeof result === "object" && "value" in result) {
    return result.value;
  }
  return result as unknown as SubmitFeedbackResponse;
}

/** GET /api/feedbacks — Get parent's feedbacks with filters */
export async function getParentFeedbacks(params: {
  campaignId?: string;
  hasRating?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<ParentFeedbacksResponse> {
  const query = new URLSearchParams();
  if (params.campaignId) query.append("campaignId", params.campaignId);
  if (params.hasRating !== undefined) query.append("hasRating", String(params.hasRating));
  query.append("page", String(params.page || 1));
  query.append("pageSize", String(params.pageSize || 10));

  const result = await api<ParentFeedbacksResponse>(
    `${endpoints.feedbacks.base}?${query.toString()}`,
    {
      method: "GET",
      auth: true,
    }
  );

  return result as ParentFeedbacksResponse;
}
