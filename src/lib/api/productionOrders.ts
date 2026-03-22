import { api } from "./clients";
import { endpoints } from "./endpoints";

// ── Types ──

export type ProductionBatchItemDto = {
    id: string;
    outfitId: string;
    outfitName: string;
    size: string;
    quantity: number;
    unitPrice: number;
};

export type ProductionOrderListItemDto = {
    batchId: string;
    batchName: string;
    campaignName: string;
    providerName?: string;
    schoolName?: string;
    status: string;
    totalQuantity: number;
    deliveryDeadline?: string | null;
    createdDate: string;
};

export type ProductionOrderListResponse = {
    items: ProductionOrderListItemDto[];
    total: number;
    page: number;
    pageSize: number;
};

export type ProductionOrderDetailDto = {
    batchId: string;
    batchName: string;
    campaignName: string;
    campaignId: string;
    status: string;
    totalQuantity: number;
    deliveryDeadline?: string | null;
    processedAt?: string | null;
    rejectionReason?: string | null;
    createdDate: string;
    items: ProductionBatchItemDto[];
    // Provider-side extras
    schoolName?: string;
    schoolId?: string;
    // School-side extras
    providerName?: string;
    providerId?: string;
};

// ── School Production Order APIs ──

export async function getSchoolProductionOrders(
    page = 1, pageSize = 10, status?: string
): Promise<ProductionOrderListResponse> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status) params.set("status", status);
    return api<ProductionOrderListResponse>(
        `${endpoints.schools.productionOrders}?${params}`,
        { method: "GET", auth: true }
    );
}

export async function getSchoolProductionOrderDetail(id: string): Promise<ProductionOrderDetailDto> {
    return api<ProductionOrderDetailDto>(
        `${endpoints.schools.productionOrders}/${id}`,
        { method: "GET", auth: true }
    );
}

export async function generateProductionOrder(
    campaignId: string,
    data: { providerID: string; batchName: string; deliveryDeadline: string }
): Promise<{ message: string }> {
    return api<{ message: string }>(
        `${endpoints.schools.campaigns}/${campaignId}/production-order`,
        { method: "POST", body: JSON.stringify(data), auth: true }
    );
}

export async function confirmProductionOrder(batchId: string): Promise<{ message: string }> {
    return api<{ message: string }>(
        `${endpoints.schools.campaigns}/${batchId}/confirm`,
        { method: "POST", auth: true }
    );
}

export async function rejectProductionOrder(id: string, reason: string): Promise<{ message: string }> {
    return api<{ message: string }>(
        `${endpoints.schools.productionOrders}/${id}/reject`,
        { method: "POST", body: JSON.stringify({ reason }), auth: true }
    );
}

// ── Provider Production Order APIs ──

export async function getProviderProductionOrders(
    page = 1, pageSize = 10, status?: string
): Promise<ProductionOrderListResponse> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status) params.set("status", status);
    return api<ProductionOrderListResponse>(
        `${endpoints.providers.productionOrders}?${params}`,
        { method: "GET", auth: true }
    );
}

export async function getProviderProductionOrderDetail(id: string): Promise<ProductionOrderDetailDto> {
    return api<ProductionOrderDetailDto>(
        `${endpoints.providers.productionOrders}/${id}`,
        { method: "GET", auth: true }
    );
}

export async function acceptProductionOrder(id: string): Promise<{ message: string }> {
    return api<{ message: string }>(
        `${endpoints.providers.productionOrders}/${id}/accept`,
        { method: "PUT", auth: true }
    );
}

export async function completeProductionOrder(id: string): Promise<{ message: string }> {
    return api<{ message: string }>(
        `${endpoints.providers.productionOrders}/${id}/complete`,
        { method: "PUT", auth: true }
    );
}

export async function providerRejectProductionOrder(id: string, reason: string): Promise<{ message: string }> {
    return api<{ message: string }>(
        `${endpoints.providers.productionOrders}/${id}/reject`,
        { method: "PUT", body: JSON.stringify({ reason }), auth: true }
    );
}

// ── Phase 4: Delivery & Distribution Types ──

export type DeliveryRecordDto = {
    id: string;
    quantity: number;
    note?: string | null;
    deliveredAt: string;
    isConfirmed: boolean;
    confirmedAt?: string | null;
    acceptedQuantity?: number | null;
    defectiveQuantity?: number | null;
    defectNote?: string | null;
};

export type DeliveryStatusResponse = {
    batchId: string;
    batchName: string;
    totalQuantity: number;
    totalDelivered: number;
    isFullyDelivered: boolean;
    deliveryConfirmedAt?: string | null;
    deliveries: DeliveryRecordDto[];
};

export type VerifyQuantityItemDto = {
    outfitId: string;
    outfitName: string;
    size: string;
    expected: number;
    delivered: number;
    accepted: number;
    defective: number;
};

export type VerifyQuantityResponse = {
    batchId: string;
    totalExpected: number;
    totalDelivered: number;
    totalAccepted: number;
    totalDefective: number;
    items: VerifyQuantityItemDto[];
};

export type DistributionOrderDto = {
    orderId: string;
    childName: string;
    parentName: string;
    deliveryMethod: string;
    orderStatus: string;
    isDistributed: boolean;
    distributedAt?: string | null;
    shippingCompany?: string | null;
    trackingCode?: string | null;
    proofImageUrl?: string | null;
};

export type DistributionStatusResponse = {
    batchId: string;
    totalOrders: number;
    distributedCount: number;
    pendingCount: number;
    orders: DistributionOrderDto[];
};

export type DeliverResponse = {
    deliveryRecordId: string;
    deliveredThisTime: number;
    totalDelivered: number;
    totalRequired: number;
    isFullyDelivered: boolean;
    message: string;
};

export type DistributeResponse = {
    distributedCount: number;
    totalOrders: number;
    remainingOrders: number;
    message: string;
};

// ── Phase 4: School Delivery APIs ──

export async function getDeliveryStatus(batchId: string): Promise<DeliveryStatusResponse> {
    return api<DeliveryStatusResponse>(
        `${endpoints.schools.productionOrders}/${batchId}/delivery-status`,
        { method: "GET", auth: true }
    );
}

export async function confirmDelivery(
    batchId: string, deliveryId: string,
    data: { acceptedQuantity: number; defectiveQuantity?: number; defectNote?: string }
): Promise<{ message: string }> {
    return api<{ message: string }>(
        `${endpoints.schools.productionOrders}/${batchId}/confirm-delivery/${deliveryId}`,
        { method: "PUT", body: JSON.stringify(data), auth: true }
    );
}

export async function getVerifyQuantity(batchId: string): Promise<VerifyQuantityResponse> {
    return api<VerifyQuantityResponse>(
        `${endpoints.schools.productionOrders}/${batchId}/verify-quantity`,
        { method: "GET", auth: true }
    );
}

export async function reportDefect(
    batchId: string, data: { title: string; description: string; proofImageUrls?: string[] }
): Promise<{ complaintId: string }> {
    return api<{ complaintId: string }>(
        `${endpoints.schools.productionOrders}/${batchId}/defect-report`,
        { method: "POST", body: JSON.stringify(data), auth: true }
    );
}

export async function distributeOrders(
    batchId: string,
    data: { orderIds: string[]; shippingCompany?: string; trackingCode?: string; proofImageUrl?: string; note?: string }
): Promise<DistributeResponse> {
    return api<DistributeResponse>(
        `${endpoints.schools.productionOrders}/${batchId}/distribute`,
        { method: "POST", body: JSON.stringify(data), auth: true }
    );
}

export async function getDistributionStatus(batchId: string): Promise<DistributionStatusResponse> {
    return api<DistributionStatusResponse>(
        `${endpoints.schools.productionOrders}/${batchId}/distribution`,
        { method: "GET", auth: true }
    );
}

// ── Phase 4: Provider Delivery APIs ──

export async function providerDeliver(
    batchId: string, data: { quantity: number; note?: string }
): Promise<DeliverResponse> {
    return api<DeliverResponse>(
        `${endpoints.providers.productionOrders}/${batchId}/deliver`,
        { method: "PUT", body: JSON.stringify(data), auth: true }
    );
}

export async function getProviderDeliveryStatus(batchId: string): Promise<DeliveryStatusResponse> {
    return api<DeliveryStatusResponse>(
        `${endpoints.providers.productionOrders}/${batchId}/delivery-status`,
        { method: "GET", auth: true }
    );
}

// ── Phase 5: Distribution Scheduling APIs ──

export type DistributionScheduleDto = {
    id: string;
    batchId: string;
    scheduledDate: string;
    method: string;
    timeSlot: string;
    note?: string | null;
    status: string;
    createdAt: string;
    completedAt?: string | null;
};

export type ProviderDistributionOverviewDto = {
    batchId: string;
    totalOrders: number;
    distributedCount: number;
    pendingCount: number;
    atSchoolCount: number;
    atHomeCount: number;
    schedules: DistributionScheduleDto[];
};

export async function createDistributionSchedule(
    batchId: string,
    data: { scheduledDate: string; method: string; timeSlot: string; note?: string }
): Promise<{ scheduleId: string }> {
    return api<{ scheduleId: string }>(
        `${endpoints.schools.productionOrders}/${batchId}/schedules`,
        { method: "POST", body: JSON.stringify(data), auth: true }
    );
}

export async function getDistributionSchedules(
    batchId: string
): Promise<DistributionScheduleDto[]> {
    return api<DistributionScheduleDto[]>(
        `${endpoints.schools.productionOrders}/${batchId}/schedules`,
        { method: "GET", auth: true }
    );
}

export async function updateDistributionSchedule(
    scheduleId: string,
    data: { scheduledDate?: string; method?: string; timeSlot?: string; note?: string; status?: string }
): Promise<{ message: string }> {
    return api<{ message: string }>(
        `${endpoints.schools.productionOrders}/schedules/${scheduleId}`,
        { method: "PUT", body: JSON.stringify(data), auth: true }
    );
}

export async function getProviderDistributionOverview(
    batchId: string
): Promise<ProviderDistributionOverviewDto> {
    return api<ProviderDistributionOverviewDto>(
        `${endpoints.providers.productionOrders}/${batchId}/distribution-overview`,
        { method: "GET", auth: true }
    );
}
