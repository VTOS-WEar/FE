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

export type ProviderCatalogItemDto = {
    catalogItemId?: string | null;
    contractItemId: string;
    outfitId: string;
    outfitName: string;
    outfitImageUrl?: string | null;
    schoolMaterialType?: string | null;
    contractPricePerUnit: number;
    displayName: string;
    shortDescription?: string | null;
    materialDetails?: string | null;
    publicationPrice?: number | null;
    postDeadlinePrice?: number | null;
    status: string;
};

export type ProviderCatalogPublicationDto = {
    semesterPublicationProviderId: string;
    semesterPublicationId: string;
    schoolId: string;
    schoolName: string;
    semester: string;
    academicYear: string;
    startDate: string;
    endDate: string;
    publicationStatus: string;
    providerStatus: string;
    contractId?: string | null;
    contractName?: string | null;
    contractNumber?: string | null;
    items: ProviderCatalogItemDto[];
};

export type ProviderCatalogResponse = {
    publications: ProviderCatalogPublicationDto[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    summary: ProviderCatalogSummary;
};

export type ProviderCatalogSummary = {
    publications: number;
    items: number;
    published: number;
    needsSetup: number;
};

export type GetProviderCatalogParams = {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
};

export type UpsertProviderCatalogItemRequest = {
    displayName?: string | null;
    shortDescription?: string | null;
    materialDetails?: string | null;
    publicationPrice: number;
    postDeadlinePrice: number;
    status: string;
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

export async function getProviderCatalog(params: GetProviderCatalogParams = {}): Promise<ProviderCatalogResponse> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));
    if (params.status && params.status !== "all") searchParams.set("status", params.status);
    if (params.search?.trim()) searchParams.set("search", params.search.trim());
    const qs = searchParams.toString();

    return api<ProviderCatalogResponse>(`${endpoints.providers.catalog}${qs ? `?${qs}` : ""}`, {
        method: "GET",
        auth: true,
    });
}

export async function upsertProviderCatalogItem(
    semesterPublicationProviderId: string,
    outfitId: string,
    payload: UpsertProviderCatalogItemRequest,
): Promise<ProviderCatalogItemDto> {
    return api<ProviderCatalogItemDto>(
        `${endpoints.providers.catalog}/${semesterPublicationProviderId}/items/${outfitId}`,
        {
            method: "PUT",
            auth: true,
            body: JSON.stringify(payload),
        },
    );
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
