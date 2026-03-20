import { api } from "./clients";

// ── Types ──

export type AccountRequestListItem = {
    id: string;
    organizationName: string;
    contactEmail: string;
    contactPhone: string;
    type: string;
    status: string;
    createdAt: string;
    processedAt?: string;
};

export type AccountRequestDetail = AccountRequestListItem & {
    description?: string;
    address?: string;
    rejectionReason?: string;
    processedByUserId?: string;
    processedByName?: string;
    createdUserId?: string;
};

export type AccountRequestListResponse = {
    items: AccountRequestListItem[];
    totalCount: number;
    page: number;
    pageSize: number;
};

// ── Public API (no auth) ──

export async function submitAccountRequest(data: {
    organizationName: string;
    contactEmail: string;
    contactPhone: string;
    type: number; // 1=School, 2=Provider
    description?: string;
    address?: string;
}): Promise<AccountRequestDetail> {
    return api<AccountRequestDetail>("/api/public/account-requests", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

// ── Admin API ──

export async function getAccountRequests(params?: {
    page?: number;
    pageSize?: number;
    status?: number;
    type?: number;
}): Promise<AccountRequestListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.pageSize) query.set("pageSize", String(params.pageSize));
    if (params?.status) query.set("status", String(params.status));
    if (params?.type) query.set("type", String(params.type));
    return api<AccountRequestListResponse>(`/api/admin/account-requests?${query}`, {
        method: "GET",
        auth: true,
    });
}

export async function getAccountRequestDetail(id: string): Promise<AccountRequestDetail> {
    return api<AccountRequestDetail>(`/api/admin/account-requests/${id}`, {
        method: "GET",
        auth: true,
    });
}

export async function createAccountForRequest(
    id: string,
    data: { email: string; fullName: string; phone?: string }
): Promise<AccountRequestDetail> {
    return api<AccountRequestDetail>(`/api/admin/account-requests/${id}/create-account`, {
        method: "POST",
        auth: true,
        body: JSON.stringify(data),
    });
}

export async function rejectAccountRequest(
    id: string,
    reason: string
): Promise<AccountRequestDetail> {
    return api<AccountRequestDetail>(`/api/admin/account-requests/${id}/reject`, {
        method: "POST",
        auth: true,
        body: JSON.stringify({ reason }),
    });
}
