import { api } from "./clients";
import { endpoints } from "./endpoints";

// ── Types ──

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
    status: string; // Open | InProgress | Resolved | Closed
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

// ── School Complaint APIs ──

export async function getSchoolComplaints(page = 1, pageSize = 10, status?: string): Promise<ComplaintsResponse> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status) params.set("status", status);
    return api<ComplaintsResponse>(`${endpoints.schools.me}/complaints?${params}`, { method: "GET", auth: true });
}

export async function getSchoolComplaintDetail(id: string): Promise<ComplaintDetailDto> {
    return api<ComplaintDetailDto>(`${endpoints.schools.me}/complaints/${id}`, { method: "GET", auth: true });
}

export async function closeComplaint(id: string): Promise<{ message: string }> {
    return api<{ message: string }>(`${endpoints.schools.me}/complaints/${id}/close`, { method: "PUT", auth: true });
}

// ── Provider Complaint APIs ──

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
