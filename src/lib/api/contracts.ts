import { api } from "./clients";
import { endpoints } from "./endpoints";

// ── Types ──

export type ContractItemDto = {
    itemId: string;
    outfitId: string;
    outfitName: string;
    pricePerUnit: number;
    minQuantity: number;
    maxQuantity: number;
};

export type ContractDto = {
    contractId: string;
    schoolId: string;
    providerId: string;
    contractName: string;
    status: string; // Pending | Approved | Rejected | Expired
    createdAt: string;
    approvedAt?: string | null;
    rejectedAt?: string | null;
    rejectionReason?: string | null;
    schoolName?: string | null;
    providerName?: string | null;
    items: ContractItemDto[];
};

export type CreateContractItemRequest = {
    outfitId: string;
    pricePerUnit: number;
    minQuantity: number;
    maxQuantity: number;
};

export type CreateContractRequest = {
    contractName: string;
    providerId: string;
    items: CreateContractItemRequest[];
};

// ── School Contract APIs ──

export async function getSchoolContracts(status?: string): Promise<ContractDto[]> {
    const url = `${endpoints.schools.me}/contracts${status ? `?status=${status}` : ""}`;
    return api<ContractDto[]>(url, { method: "GET", auth: true });
}

export async function getSchoolContractDetail(id: string): Promise<ContractDto> {
    return api<ContractDto>(`${endpoints.schools.me}/contracts/${id}`, { method: "GET", auth: true });
}

export async function createContract(payload: CreateContractRequest): Promise<ContractDto> {
    return api<ContractDto>(`${endpoints.schools.me}/contracts`, {
        method: "POST",
        body: JSON.stringify(payload),
        auth: true,
    });
}

// ── Provider Contract APIs ──

export async function getProviderContracts(status?: string): Promise<ContractDto[]> {
    const url = `${endpoints.providers.contracts}${status ? `?status=${status}` : ""}`;
    return api<ContractDto[]>(url, { method: "GET", auth: true });
}

export async function getProviderContractDetail(id: string): Promise<ContractDto> {
    return api<ContractDto>(`${endpoints.providers.contracts}/${id}`, { method: "GET", auth: true });
}

export async function approveContract(id: string): Promise<ContractDto> {
    return api<ContractDto>(`${endpoints.providers.contracts}/${id}/approve`, {
        method: "PUT",
        auth: true,
    });
}

export async function rejectContract(id: string, reason: string): Promise<ContractDto> {
    return api<ContractDto>(`${endpoints.providers.contracts}/${id}/reject`, {
        method: "PUT",
        body: JSON.stringify({ reason }),
        auth: true,
    });
}
