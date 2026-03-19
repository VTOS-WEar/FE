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

/** PUT /api/orders/{orderId}/cancel — Cancel a pending/paid order */
export async function cancelOrder(orderId: string, reason?: string): Promise<void> {
  await api(
    `${endpoints.orders.cancel}/${orderId}/cancel`,
    {
      method: "PUT",
      body: JSON.stringify({ reason: reason || "Người dùng huỷ trên trang thanh toán" }),
      auth: true,
    }
  );
}

/* ── School Order Management (UC-45) ── */

export type SchoolOrderDto = {
  orderId: string;
  parentName: string;
  childName: string;
  totalAmount: number;
  orderDate: string;
  orderStatus: string;
  campaignName: string | null;
  itemCount: number;
};

export type SchoolOrderListResponse = {
  items: SchoolOrderDto[];
  totalCount: number;
  page: number;
  pageSize: number;
};

/** GET /api/schools/me/orders — School views parent orders */
export async function getSchoolOrders(
  page = 1,
  pageSize = 10,
  status?: string,
): Promise<SchoolOrderListResponse> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (status) params.set("status", status);

  const result = await api<{ isSuccess: boolean; value: SchoolOrderListResponse }>(
    `${endpoints.schools.schoolOrders}?${params}`,
    { method: "GET", auth: true },
  );

  if (result && typeof result === "object" && "value" in result) {
    return result.value;
  }
  return result as unknown as SchoolOrderListResponse;
}
