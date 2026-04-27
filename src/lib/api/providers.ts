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

export type ProviderProfileDto = {
    providerId: string;
    providerName: string;
    contactPersonName?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    status: string;
    twoFactorEnabled?: boolean;
};

export async function getProviderProfile(): Promise<ProviderProfileDto> {
    return api<ProviderProfileDto>(endpoints.providers.me, {
        method: "GET",
        auth: true,
    });
}

export type UpdateProviderProfileRequest = {
    providerName?: string | null;
    contactPersonName?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
};

export async function updateProviderProfile(payload: UpdateProviderProfileRequest): Promise<ProviderProfileDto> {
    return api<ProviderProfileDto>(endpoints.providers.me, {
        method: "PUT",
        auth: true,
        body: JSON.stringify(payload),
    });
}

export type ProviderIncomingOrderItemDto = {
    orderId: string;
    orderDate: string;
    orderStatus: string;
    totalAmount: number;
    parentName: string;
    childName: string;
    itemCount: number;
    trackingCode?: string | null;
};

export type ProviderIncomingOrdersResponse = {
    items: ProviderIncomingOrderItemDto[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
};

export type ProviderDirectOrderDetailItemDto = {
    orderItemId: string;
    outfitName: string;
    imageUrl?: string | null;
    size: string;
    quantity: number;
    unitPrice: number;
};

export type ProviderDirectOrderDetailDto = {
    orderId: string;
    orderDate: string;
    orderStatus: string;
    pricingMode: string;
    totalAmount: number;
    parentName: string;
    parentPhone?: string | null;
    childName: string;
    shippingAddress: string;
    recipientName?: string | null;
    recipientPhone?: string | null;
    deliveryMethod?: string | null;
    trackingCode?: string | null;
    shippingCompany?: string | null;
    items: ProviderDirectOrderDetailItemDto[];
};

export type ProviderOrderStatsDto = {
    totalOrders: number;
    pendingOrders: number;
    paidOrders: number;
    inProgressOrders: number;
    completedShipmentOrders: number;
    totalRevenue: number;
    statusCounts: Record<string, number>;
    monthlyMetrics: ProviderOrderMonthlyMetricDto[];
};

export type ProviderOrderMonthlyMetricDto = {
    month: string;
    orders: number;
    revenue: number;
    completedRevenue: number;
};

export async function getProviderDirectOrders(
    page = 1,
    pageSize = 10,
    status?: string,
    filters: { fromDate?: string; toDate?: string; search?: string } = {},
): Promise<ProviderIncomingOrdersResponse> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status) params.set("status", status);
    if (filters.fromDate) params.set("fromDate", filters.fromDate);
    if (filters.toDate) params.set("toDate", filters.toDate);
    if (filters.search?.trim()) params.set("search", filters.search.trim());

    const result = await api<ResultEnvelope<ProviderIncomingOrdersResponse>>(
        `${endpoints.providers.directOrders}?${params}`,
        {
            method: "GET",
            auth: true,
        },
    );
    return unwrapResult(result);
}

export async function getProviderDirectOrderDetail(orderId: string): Promise<ProviderDirectOrderDetailDto> {
    const result = await api<ResultEnvelope<ProviderDirectOrderDetailDto>>(`${endpoints.providers.directOrders}/${orderId}`, {
        method: "GET",
        auth: true,
    });
    return unwrapResult(result);
}

export async function getProviderDirectOrderStats(): Promise<ProviderOrderStatsDto> {
    const result = await api<ResultEnvelope<ProviderOrderStatsDto>>(endpoints.providers.directOrderStats, {
        method: "GET",
        auth: true,
    });
    return unwrapResult(result);
}

async function putOrderAction<T = void>(path: string, body?: unknown): Promise<T> {
    return api<T>(path, {
        method: "PUT",
        auth: true,
        body: body ? JSON.stringify(body) : undefined,
    });
}

export async function acceptDirectOrder(orderId: string): Promise<void> {
    await putOrderAction(`${endpoints.providers.directOrders}/${orderId}/accept`);
}

export async function markDirectOrderInProduction(orderId: string): Promise<void> {
    await putOrderAction(`${endpoints.providers.directOrders}/${orderId}/in-production`);
}

export async function markDirectOrderReadyToShip(orderId: string): Promise<void> {
    await putOrderAction(`${endpoints.providers.directOrders}/${orderId}/ready-to-ship`);
}

export async function shipDirectOrder(orderId: string, payload: { trackingCode: string; shippingCompany: string }): Promise<void> {
    await putOrderAction(`${endpoints.providers.directOrders}/${orderId}/ship`, payload);
}
