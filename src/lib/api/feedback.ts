import { api } from "./clients";
import { endpoints } from "./endpoints";

/* ── Types ── */
export type SubmitFeedbackRequest = {
  productVariantId: string;
  campaignId: string;
  rating: number;
  comment?: string;
};

export type SubmitFeedbackResponse = {
  feedbackId: string;
  productVariantId: string;
  rating: number;
  comment?: string;
  timestamp: string;
};

export type ParentFeedbackDto = {
  feedbackId: string;
  campaignOutfitId: string;
  campaignId: string;
  campaignName: string;
  outfitId: string;
  outfitName: string;
  outfitImageUrl: string;
  rating: number | null;
  comment: string | null;
  feedbackTimestamp: string | null;
  outfitPrice: number;
  outfitType: string;
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
};

/* ── API Calls ── */

/** POST /api/feedbacks/campaign-outfit — Submit feedback for campaign outfit */
export async function submitOutfitFeedback(
  request: SubmitFeedbackRequest
): Promise<SubmitFeedbackResponse> {
  const result = await api<{ isSuccess: boolean; value: SubmitFeedbackResponse; error?: string }>(
    endpoints.feedbacks.submitCampaignOutfit,
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
    `${endpoints.feedbacks.submitCampaignOutfit.split("/campaign-outfit")[0]}?${query.toString()}`,
    {
      method: "GET",
      auth: true,
    }
  );

  return result as ParentFeedbacksResponse;
}
