import { api } from "./clients";

export type SupportTicketDto = {
    id: string;
    title: string;
    description: string;
    category: string;
    status: string;
    requesterRole: string;
    requesterName: string;
    requesterEmail: string;
    schoolName?: string | null;
    providerName?: string | null;
    orderId?: string | null;
    semesterPublicationId?: string | null;
    semesterLabel?: string | null;
    response?: string | null;
    createdAt: string;
    respondedAt?: string | null;
    resolvedAt?: string | null;
};

export type SupportTicketListResult = {
    items: SupportTicketDto[];
    total: number;
    page: number;
    pageSize: number;
    openCount: number;
    inProgressCount: number;
    resolvedCount: number;
    closedCount: number;
};

export type CreateSupportTicketRequest = {
    title: string;
    description: string;
    category?: string;
    orderId?: string;
    semesterPublicationId?: string;
};

const basePath = "/api/support-tickets";

export async function getMySupportTickets(params: {
    page?: number;
    pageSize?: number;
    status?: string;
} = {}): Promise<SupportTicketListResult> {
    const q = new URLSearchParams();
    if (params.page) q.set("page", String(params.page));
    if (params.pageSize) q.set("pageSize", String(params.pageSize));
    if (params.status) q.set("status", params.status);
    return api<SupportTicketListResult>(`${basePath}?${q}`, { method: "GET", auth: true });
}

export async function getMySupportTicketDetail(id: string): Promise<SupportTicketDto> {
    return api<SupportTicketDto>(`${basePath}/${id}`, { method: "GET", auth: true });
}

export async function createSupportTicket(payload: CreateSupportTicketRequest): Promise<SupportTicketDto> {
    return api<SupportTicketDto>(basePath, {
        method: "POST",
        auth: true,
        body: JSON.stringify(payload),
    });
}
