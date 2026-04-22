import { api } from "./clients";
import { endpoints } from "./endpoints";

export type ComplaintDto = {
    complaintId: string;
    campaignId: string;
    campaignName?: string | null;
    batchId?: string | null;
    providerId?: string | null;
    providerName?: string | null;
    title: string;
    description: string;
    response?: string | null;
    status: string;
    createdAt: string;
    respondedAt?: string | null;
    resolvedAt?: string | null;
};

export type ComplaintDetailDto = ComplaintDto & {
    batchName?: string | null;
};

export type ComplaintsResponse = {
    items: ComplaintDto[];
    total: number;
    page: number;
    pageSize: number;
};

export async function getProviderComplaints(page = 1, pageSize = 10, status?: string): Promise<ComplaintsResponse> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status) params.set("status", status);
    return api<ComplaintsResponse>(`${endpoints.providers.me}/complaints?${params}`, { method: "GET", auth: true });
}

export async function getProviderComplaintDetail(id: string): Promise<ComplaintDetailDto> {
    return api<ComplaintDetailDto>(`${endpoints.providers.me}/complaints/${id}`, { method: "GET", auth: true });
}

export async function respondComplaint(id: string, response: string, markResolved = false): Promise<{ message: string }> {
    return api<{ message: string }>(`${endpoints.providers.me}/complaints/${id}/respond`, {
        method: "PUT",
        body: JSON.stringify({ response, markResolved }),
        auth: true,
    });
}
