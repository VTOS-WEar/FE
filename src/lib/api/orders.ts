import { api } from "./clients";
import { endpoints } from "./endpoints";

/* ── Types ── */
export type CheckoutItemRequest = {
  productVariantId: string;
  quantity: number;
  isCustomOrder?: boolean;
  customMeasurements?: string | null;
};

export type CheckoutRequest = {
  childProfileId: string;
  items: CheckoutItemRequest[];
  shippingAddress: string;
  deliveryMethod?: string | null;
  campaignId?: string | null;
};

export type CheckoutResponse = {
  orderId: string;
  paymentTransactionId: string;
  totalAmount: number;
  paymentLink: string;
  orderCode: number;
};

/* ── API Calls ── */

/** POST /api/orders/checkout — Create order + PayOS payment link */
export async function checkout(request: CheckoutRequest): Promise<CheckoutResponse> {
  const result = await api<{ isSuccess: boolean; value: CheckoutResponse; error?: string }>(
    endpoints.orders.checkout,
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
  return result as unknown as CheckoutResponse;
}
