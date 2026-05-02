import { api } from "./clients";
import { endpoints } from "./endpoints";

// ── Types ──

export type ContractItemDto = {
    itemId: string;
    outfitId: string;
    outfitName: string;
    mainImageURL?: string | null;
    pricePerUnit?: number | null;
    minQuantity?: number | null;
    maxQuantity?: number | null;
};

export type ContractDto = {
    contractId: string;
    schoolId: string;
    providerId: string;
    contractName: string;
    contractNumber: string;
    status: string; // Pending | PendingSchoolSign | PendingProviderSign | Active | InUse | Fulfilled | Rejected | Expired | Cancelled
    createdAt: string;
    approvedAt?: string | null;
    rejectedAt?: string | null;
    rejectionReason?: string | null;
    expiresAt: string;

    // Party names
    schoolName?: string | null;
    providerName?: string | null;

    // School extended info (for contract template auto-fill)
    schoolAddress?: string | null;
    schoolTaxCode?: string | null;
    schoolRepName?: string | null;
    schoolRepTitle?: string | null;
    schoolPhone?: string | null;

    // Provider extended info (for contract template auto-fill)
    providerAddress?: string | null;
    providerTaxCode?: string | null;
    providerRepName?: string | null;
    providerRepTitle?: string | null;
    providerPhone?: string | null;
    providerEmail?: string | null;

    // Digital signatures
    schoolSignature?: string | null;
    schoolSignedAt?: string | null;
    providerSignature?: string | null;
    providerSignedAt?: string | null;

    // Generated contract PDF URL (e.g. "/contracts/{id}.pdf")
    contractPdfUrl?: string | null;

    // Masked contact of the CURRENT viewer (for OTP display)
    viewerMaskedContact?: string | null;

    items: ContractItemDto[];
};

export type CreateContractItemRequest = {
    outfitId: string;
};

export type CreateContractRequest = {
    contractName: string;
    providerId: string;
    expiresAt: string;
    items: CreateContractItemRequest[];
};

export type UpdateContractPricingItemRequest = {
    itemId: string;
    pricePerUnit: number;
};

export type UpdateContractPricingRequest = {
    items: UpdateContractPricingItemRequest[];
};

export type SignContractRequest = {
    signatureData: string;
    otpCode: string;
    /** Base64-encoded PDF generated client-side. Optional. */
    pdfBase64?: string;
};

export type ContractListSummary = {
    total: number;
    pending: number;
    waitingSchool: number;
    waitingProvider: number;
    active: number;
    fulfilled: number;
    rejected: number;
    issue: number;
    expiringSoon: number;
};

export type ContractListResponse = {
    items: ContractDto[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    summary: ContractListSummary;
};

export type GetContractsParams = {
    status?: string;
    page?: number;
    pageSize?: number;
    search?: string;
};

function buildContractListUrl(baseUrl: string, params: GetContractsParams | string = {}): string {
    const options: GetContractsParams = typeof params === "string" ? { status: params } : params;
    const searchParams = new URLSearchParams();
    if (options.status) searchParams.set("status", options.status);
    if (options.page) searchParams.set("page", String(options.page));
    if (options.pageSize) searchParams.set("pageSize", String(options.pageSize));
    if (options.search?.trim()) searchParams.set("search", options.search.trim());
    const qs = searchParams.toString();
    return `${baseUrl}${qs ? `?${qs}` : ""}`;
}

// ── School Contract APIs ──

export async function getSchoolContracts(params: GetContractsParams | string = {}): Promise<ContractListResponse> {
    return api<ContractListResponse>(buildContractListUrl(`${endpoints.schools.me}/contracts`, params), {
        method: "GET",
        auth: true,
    });
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

/** School cancels a Pending or PendingSchoolSign contract. */
export async function cancelSchoolContract(id: string): Promise<ContractDto> {
    return api<ContractDto>(`${endpoints.schools.me}/contracts/${id}/cancel`, {
        method: "PUT",
        auth: true,
    });
}

/** Request a 6-digit OTP to be sent to the school's registered email for contract signing. */
export async function requestSchoolSignOTP(id: string): Promise<{ success: boolean }> {
    return api<{ success: boolean }>(`${endpoints.schools.me}/contracts/${id}/request-sign-otp`, {
        method: "POST",
        auth: true,
    });
}

/** School digitally signs a contract with OTP + base64 signature image + optional PDF. */
export async function signSchoolContract(
    id: string,
    signatureData: string,
    otpCode: string,
    pdfBase64?: string
): Promise<ContractDto> {
    const body: SignContractRequest = { signatureData, otpCode, pdfBase64 };
    return api<ContractDto>(`${endpoints.schools.me}/contracts/${id}/sign`, {
        method: "PUT",
        body: JSON.stringify(body),
        auth: true,
    });
}

// ── Provider Contract APIs ──

export async function getProviderContracts(params: GetContractsParams | string = {}): Promise<ContractListResponse> {
    return api<ContractListResponse>(buildContractListUrl(endpoints.providers.contracts, params), {
        method: "GET",
        auth: true,
    });
}

export async function getProviderContractDetail(id: string): Promise<ContractDto> {
    return api<ContractDto>(`${endpoints.providers.contracts}/${id}`, { method: "GET", auth: true });
}

export async function updateContractPricing(id: string, payload: UpdateContractPricingRequest): Promise<ContractDto> {
    return api<ContractDto>(`${endpoints.providers.contracts}/${id}/pricing`, {
        method: "PUT",
        body: JSON.stringify(payload),
        auth: true,
    });
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

/** Request a 6-digit OTP to be sent to the provider's registered email for contract signing. */
export async function requestProviderSignOTP(id: string): Promise<{ success: boolean }> {
    return api<{ success: boolean }>(`${endpoints.providers.contracts}/${id}/request-sign-otp`, {
        method: "POST",
        auth: true,
    });
}

/** Provider digitally signs a contract with OTP + base64 signature image + optional PDF. */
export async function signProviderContract(
    id: string,
    signatureData: string,
    otpCode: string,
    pdfBase64?: string
): Promise<ContractDto> {
    const body: SignContractRequest = { signatureData, otpCode, pdfBase64 };
    return api<ContractDto>(`${endpoints.providers.contracts}/${id}/sign`, {
        method: "PUT",
        body: JSON.stringify(body),
        auth: true,
    });
}

// ── Contracted Providers for Campaign Creation ──

export type ContractedProviderDto = {
    providerId: string;
    providerName: string;
    contractId: string;
    contractName: string;
    pricePerUnit: number;
};

export type ContractedProvidersForOutfitsResponse = {
    outfitProviders: Record<string, ContractedProviderDto[]>;
};

/** Get contracted providers grouped by outfit (for campaign creation) */
export async function getContractedProvidersForOutfits(): Promise<ContractedProvidersForOutfitsResponse> {
    return api<ContractedProvidersForOutfitsResponse>(
        `${endpoints.schools.me}/contracts/providers-for-outfits`,
        { method: "GET", auth: true }
    );
}
