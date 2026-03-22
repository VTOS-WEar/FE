import { api } from "./clients";
import { endpoints } from "./endpoints";

// ── Provider Profile ──

export type ProviderProfileDto = {
    providerId: string;
    providerName: string;
    contactPersonName?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    status: string;
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
