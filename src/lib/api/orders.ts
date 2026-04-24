import { api } from "./clients";
import { endpoints } from "./endpoints";

type ResultEnvelope<T> = {
  isSuccess?: boolean;
  value: T;
  error?: string;
  errorCode?: string;
};

function unwrapResult<T>(payload: ResultEnvelope<T> | T): T {
  if (payload && typeof payload === "object" && "value" in (payload as Record<string, unknown>)) {
    return (payload as ResultEnvelope<T>).value;
  }
  return payload as T;
}

/* Types */
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

export type OrderItemDto = {
  orderItemId: string;
  campaignOutfitId?: string | null;
  productVariantId: string;
  campaignId?: string | null;
  outfitId: string;
  outfitName: string;
  outfitImage: string | null;
  quantity: number;
  size: string;
  price: number;
};

export type OrderDetailDto = {
  orderId: string;
  childProfileId: string;
  childName: string;
  childAvatar: string | null;
  totalAmount: number;
  orderStatus: string;
  orderDate: string;
  shippingAddress: string;
  campaignId?: string | null;
  campaignName?: string | null;
  providerId?: string | null;
  providerName?: string | null;
  items: OrderItemDto[];
};

export type DirectOrderItemRequest = {
  productVariantId: string;
  quantity: number;
  isCustomOrder?: boolean;
  customMeasurements?: string | null;
};

export type CreateDirectOrderRequest = {
  childProfileId: string;
  semesterPublicationId: string;
  providerId: string;
  items: DirectOrderItemRequest[];
  shippingAddress: string;
  deliveryMethod?: string | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
};

export type CreateDirectOrderResponse = {
  orderId: string;
  paymentTransactionId: string;
  totalAmount: number;
  paymentLink: string;
  orderCode: number;
};

export type MyDirectOrderListItemDto = {
  orderId: string;
  orderDate: string;
  orderStatus: number;
  orderStatusName: string;
  totalAmount: number;
  childName: string;
  providerName: string;
  pricingMode: string;
  firstItemImageUrl?: string | null;
  paymentStatusName?: string | null;
  trackingCode?: string | null;
};

export type MyDirectOrdersResponse = {
  items: MyDirectOrderListItemDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type MyDirectOrderDetailItemDto = {
  orderItemId: string;
  productVariantId: string;
  outfitId: string;
  outfitName: string;
  imageUrl?: string | null;
  size: string;
  quantity: number;
  unitPrice: number;
};

export type ExistingProviderRatingDto = {
  providerRatingId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
};

export type MyDirectOrderDetailDto = {
  orderId: string;
  childProfileId: string;
  childName: string;
  providerId: string;
  providerName: string;
  semesterPublicationId: string;
  semester: string;
  academicYear: string;
  pricingMode: string;
  orderDate: string;
  orderStatus: string;
  totalAmount: number;
  shippingAddress: string;
  deliveryMethod?: string | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
  trackingCode?: string | null;
  shippingCompany?: string | null;
  paymentStatusName?: string | null;
  canRateProvider: boolean;
  existingProviderRating?: ExistingProviderRatingDto | null;
  items: MyDirectOrderDetailItemDto[];
};

export type SubmitProviderRatingRequest = {
  rating: number;
  comment?: string | null;
};

export type SubmitProviderRatingResponse = {
  providerRatingId: string;
  orderId: string;
  providerId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
};

/* API Calls */

/** POST /api/orders/checkout - Create order + PayOS payment link */
export async function checkout(request: CheckoutRequest): Promise<CheckoutResponse> {
  const result = await api<ResultEnvelope<CheckoutResponse>>(
    endpoints.orders.checkout,
    {
      method: "POST",
      body: JSON.stringify(request),
      auth: true,
    }
  );
  return unwrapResult(result);
}

/** PUT /api/orders/{orderId}/cancel - Cancel a pending/paid order */
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

/** PUT /api/orders/{orderId}/cancel-transaction - Cancel only the payment transaction, leave order Pending */
export async function cancelPaymentTransaction(orderId: string): Promise<void> {
  await api(
    `${endpoints.orders.cancelTransaction}/${orderId}/cancel-transaction`,
    {
      method: "PUT",
      auth: true,
    }
  );
}

export type RetryPaymentResponse = {
  orderId: string;
  paymentTransactionId: string;
  totalAmount: number;
  paymentLink: string;
  orderCode: number;
};

/** POST /api/orders/{orderId}/retry-payment - Create new payment link for a cancelled/pending order */
export async function retryPayment(orderId: string): Promise<RetryPaymentResponse> {
  const result = await api<ResultEnvelope<RetryPaymentResponse>>(
    `${endpoints.orders.retryPayment}/${orderId}/retry-payment`,
    {
      method: "POST",
      auth: true,
    }
  );
  return unwrapResult(result);
}

/** GET /api/orders/{orderId}/detail - Get parent's order details with items and campaign outfits */
export async function getOrderDetail(orderId: string): Promise<OrderDetailDto> {
  const result = await api<ResultEnvelope<OrderDetailDto>>(
    `${endpoints.orders.cancel}/${orderId}/detail`,
    { method: "GET", auth: true },
  );
  return unwrapResult(result);
}

export async function createDirectOrder(request: CreateDirectOrderRequest): Promise<CreateDirectOrderResponse> {
  const result = await api<ResultEnvelope<CreateDirectOrderResponse>>(endpoints.orders.direct, {
    method: "POST",
    body: JSON.stringify(request),
    auth: true,
  });
  return unwrapResult(result);
}

export async function getMyDirectOrders(page = 1, pageSize = 10, status?: string): Promise<MyDirectOrdersResponse> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (status) params.set("status", status);

  const result = await api<ResultEnvelope<MyDirectOrdersResponse>>(`${endpoints.orders.myDirectOrders}?${params}`, {
    method: "GET",
    auth: true,
  });
  return unwrapResult(result);
}

export async function getMyDirectOrderDetail(orderId: string): Promise<MyDirectOrderDetailDto> {
  const result = await api<ResultEnvelope<MyDirectOrderDetailDto>>(`${endpoints.orders.myDirectOrders}/${orderId}`, {
    method: "GET",
    auth: true,
  });
  return unwrapResult(result);
}

export async function cancelDirectOrder(orderId: string, reason?: string): Promise<void> {
  await api(`${endpoints.orders.cancel}/${orderId}/cancel-direct`, {
    method: "PUT",
    body: JSON.stringify({ reason: reason ?? "Người dùng hủy đơn hàng trực tiếp" }),
    auth: true,
  });
}

export async function confirmDirectOrderDelivery(orderId: string): Promise<void> {
  await api(`${endpoints.orders.cancel}/${orderId}/confirm-delivery`, {
    method: "PUT",
    auth: true,
  });
}

export async function submitProviderRating(
  orderId: string,
  payload: SubmitProviderRatingRequest,
): Promise<SubmitProviderRatingResponse> {
  const result = await api<ResultEnvelope<SubmitProviderRatingResponse>>(
    `${endpoints.orders.cancel}/${orderId}/rate-provider`,
    {
      method: "POST",
      body: JSON.stringify(payload),
      auth: true,
    },
  );
  return unwrapResult(result);
}
