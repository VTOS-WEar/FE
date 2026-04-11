import { api } from "./clients";
import { endpoints } from "./endpoints";

//#region Types
export type SchoolProfileDto = {
    id: string;
    schoolName: string;
    logoURL: string | null;
    contactInfo: string | null;
    level: string | null;
    catalogID: string | null;
    createdAt: string;
    updatedAt: string | null;
};

export type UpdateSchoolProfileRequest = {
    schoolName?: string;
    logoURL?: string;
    contactInfo?: string;
    level?: string;
};

/** Structured contact info stored as JSON inside `contactInfo` field */
export type ContactInfoData = {
    email?: string;
    phone?: string;
    address?: string;
    academicYear?: string;
    foundedYear?: string;
    website?: string;
    description?: string;
};
//#endregion

//#region Helpers
/** Parse `contactInfo` JSON string → structured object */
export function parseContactInfo(raw: string | null | undefined): ContactInfoData {
    if (!raw) return {};
    try {
        const parsed = JSON.parse(raw);
        return {
            email: parsed.email ?? "",
            phone: parsed.phone ?? "",
            address: parsed.address ?? "",
            academicYear: parsed.academicYear ?? "",
            foundedYear: parsed.foundedYear ?? "",
            website: parsed.website ?? "",
            description: parsed.description ?? "",
        };
    } catch {
        // Legacy: if contactInfo is plain text, treat as address
        return { address: raw };
    }
}

/** Stringify structured contact info → JSON string for API */
export function stringifyContactInfo(data: ContactInfoData): string {
    return JSON.stringify({
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        academicYear: data.academicYear || "",
        foundedYear: data.foundedYear || "",
        website: data.website || "",
        description: data.description || "",
    });
}

/** Derive profile status from profile data */
export type ProfileStatus = "draft" | "submitted";

export function deriveProfileStatus(profile: SchoolProfileDto | null): ProfileStatus {
    if (!profile) return "draft";
    if (!profile.contactInfo) return "draft";
    try {
        const info = JSON.parse(profile.contactInfo);
        const hasData = info.email || info.phone || info.address;
        return hasData ? "submitted" : "draft";
    } catch {
        // Legacy plain string
        return profile.contactInfo.trim() ? "submitted" : "draft";
    }
}
//#endregion

//#region API Calls
/** UC-42: Get current school's profile */
export async function getSchoolProfile() {
    return api<SchoolProfileDto>(endpoints.schools.me, {
        method: "GET",
        auth: true,
    });
}

/** UC-42: Update current school's profile */
export async function updateSchoolProfile(data: UpdateSchoolProfileRequest) {
    return api<SchoolProfileDto>(endpoints.schools.me, {
        method: "PUT",
        body: JSON.stringify(data),
        auth: true,
    });
}

/** UC-42: Upload school logo via BE → MinIO, returns { logoURL } */
export async function uploadSchoolLogo(file: File): Promise<{ logoURL: string }> {
    const formData = new FormData();
    formData.append("file", file);

    return api<{ logoURL: string }>(endpoints.schools.logo, {
        method: "POST",
        body: formData,
        auth: true,
    });
}
//#endregion

//#region UC-43: Student Import

export type ImportError = {
    rowNumber: number;
    studentName: string | null;
    errorMessage: string;
};

export type ImportStudentResult = {
    totalRows: number;
    successCount: number;
    skippedCount: number;
    errorCount: number;
    errors: ImportError[];
};

/** UC-43: Download the .xlsx import template */
export async function downloadImportTemplate(): Promise<void> {
    const token =
        localStorage.getItem("access_token") || sessionStorage.getItem("access_token");

    const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

    const res = await fetch(`${API_BASE}${endpoints.schools.importTemplate}`, {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!res.ok) {
        throw new Error(`Download failed (${res.status})`);
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_import_template.xlsx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/** UC-43: Import student data from .xlsx/.csv file */
export async function importStudents(file: File): Promise<ImportStudentResult> {
    const formData = new FormData();
    formData.append("file", file);

    return api<ImportStudentResult>(endpoints.schools.importStudents, {
        method: "POST",
        body: formData,
        auth: true,
    });
}

/** Get distinct grades for the school's students */
export async function getSchoolGrades(): Promise<string[]> {
    return api<string[]>(endpoints.schools.grades, {
        method: "GET",
        auth: true,
    });
}

export type ImportBatchDto = {
    id: string;
    fileName: string;
    totalRows: number;
    successCount: number;
    skippedCount: number;
    errorCount: number;
    createdAt: string;
    status: "success" | "error";
};

/** Get import history (recent batches) */
export async function getImportHistory(limit = 10): Promise<ImportBatchDto[]> {
    const url = `${endpoints.schools.importHistory}?limit=${limit}`;
    return api<ImportBatchDto[]>(url, {
        method: "GET",
        auth: true,
    });
}

export type ImportStatusDto = {
    needsUpdate: boolean;
    currentSemester: string;
    lastImportDate: string | null;
    suggestedDeadline: string;
    studentCount: number;
};

/** Get import status for current semester (banner visibility) */
export async function getImportStatus(): Promise<ImportStatusDto> {
    return api<ImportStatusDto>(endpoints.schools.importStatus, {
        method: "GET",
        auth: true,
    });
}
//#endregion

export type StudentListItem = {
    id: string;
    fullName: string;
    studentCode: string | null;
    grade: string;
    gender: string;
    dateOfBirth: string | null;
    hasMeasurements: boolean;
    parentName: string | null;
    parentPhone: string | null;
    isParentLinked: boolean;
};

export type StudentListResponse = {
    items: StudentListItem[];
    totalCount: number;
    page: number;
    pageSize: number;
};

export type GetStudentsParams = {
    page?: number;
    pageSize?: number;
    search?: string;
    grade?: string;
    measurementStatus?: string;
    parentLinkStatus?: string;
};

/** Get school students with optional filters */
export async function getSchoolStudents(params: GetStudentsParams = {}): Promise<StudentListResponse> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));
    if (params.search) searchParams.set("search", params.search);
    if (params.grade) searchParams.set("grade", params.grade);
    if (params.measurementStatus) searchParams.set("measurementStatus", params.measurementStatus);
    if (params.parentLinkStatus) searchParams.set("parentLinkStatus", params.parentLinkStatus);

    const qs = searchParams.toString();
    const url = `${endpoints.schools.students}${qs ? `?${qs}` : ""}`;

    return api<StudentListResponse>(url, {
        method: "GET",
        auth: true,
    });
}
//#endregion

//#region Student CRUD

export type StudentDetailDto = {
    id: string;
    fullName: string;
    studentCode: string | null;
    grade: string;
    gender: string;
    dateOfBirth: string | null;
    heightCm: number;
    weightKg: number;
    hasMeasurements: boolean;
    parentName: string | null;
    parentPhone: string | null;
    isParentLinked: boolean;
};

export type CreateOrUpdateStudentRequest = {
    fullName: string;
    dateOfBirth?: string | null;
    grade?: string;
    gender?: string;
    parentPhone?: string;
    heightCm?: number;
    weightKg?: number;
};

/** Create a student */
export async function createStudent(data: CreateOrUpdateStudentRequest): Promise<StudentDetailDto> {
    return api<StudentDetailDto>(endpoints.schools.students, {
        method: "POST",
        body: JSON.stringify(data),
        auth: true,
    });
}

/** Get a single student by ID */
export async function getStudentById(id: string): Promise<StudentDetailDto> {
    return api<StudentDetailDto>(`${endpoints.schools.students}/${id}`, {
        method: "GET",
        auth: true,
    });
}

/** Update a student by ID */
export async function updateStudent(id: string, data: CreateOrUpdateStudentRequest): Promise<StudentDetailDto> {
    return api<StudentDetailDto>(`${endpoints.schools.students}/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        auth: true,
    });
}

/** Delete (soft) a student by ID */
export async function deleteStudent(id: string): Promise<{ message: string }> {
    return api<{ message: string }>(`${endpoints.schools.students}/${id}`, {
        method: "DELETE",
        auth: true,
    });
}
//#endregion

//#region Outfit CRUD

export type OutfitDto = {
    outfitId: string;
    outfitName: string;
    description: string | null;
    price: number;
    outfitType: number; // 1=Uniform, 2=Sportswear, 3=Accessory, 4=Other
    mainImageURL: string | null;
    sizeChartID: string | null;
    isAvailable: boolean;
    isCustomizable: boolean;
    canDelete: boolean;
    createdAt: string;
    updatedAt: string | null;
};

export type OutfitListResponse = {
    items: OutfitDto[];
    total: number;
};

/** Get all outfits for the current school */
export async function getSchoolOutfits(isAvailable?: boolean): Promise<OutfitListResponse> {
    const params = isAvailable !== undefined ? `?isAvailable=${isAvailable}` : "";
    return api<OutfitListResponse>(`${endpoints.schools.outfits}${params}`, {
        method: "GET",
        auth: true,
    });
}

export type CreateOutfitRequest = {
    outfitName: string;
    description?: string | null;
    price: number;
    outfitType: number; // 1=Uniform, 2=Sportswear, 3=Accessory, 4=Other
    mainImageURL?: string | null;
    sizeChartID?: string | null;
    isCustomizable: boolean;
};

/** Upload an outfit image (returns hosted URL) */
export async function uploadOutfitImage(file: File): Promise<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
    const res = await fetch(endpoints.schools.outfitImageUpload, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Upload failed");
    }
    return res.json();
}

/** Create a new outfit */
export async function createOutfit(data: CreateOutfitRequest): Promise<OutfitDto> {
    return api<OutfitDto>(endpoints.schools.outfits, {
        method: "POST",
        body: JSON.stringify(data),
        auth: true,
    });
}

export type UpdateOutfitRequest = {
    outfitName?: string;
    description?: string | null;
    price?: number;
    outfitType?: number;
    mainImageURL?: string | null;
    isAvailable?: boolean;
};

/** Update an outfit by ID (partial update) */
export async function updateOutfit(id: string, data: UpdateOutfitRequest): Promise<OutfitDto> {
    return api<OutfitDto>(`${endpoints.schools.outfits}/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        auth: true,
    });
}

/** Delete an outfit by ID (soft delete) */
export async function deleteOutfit(id: string): Promise<void> {
    await api<void>(`${endpoints.schools.outfits}/${id}`, {
        method: "DELETE",
        auth: true,
    });
}

/** Toggle outfit visibility (hide/show) */
export async function setOutfitAvailability(id: string, isAvailable: boolean): Promise<OutfitDto> {
    return api<OutfitDto>(`${endpoints.schools.outfits}/${id}/availability`, {
        method: "PATCH",
        body: JSON.stringify({ isAvailable }),
        auth: true,
    });
}

//#endregion

//#region Variant (Size) CRUD

export type ProductVariantDto = {
    productVariantId: string;
    outfitId: string;
    size: string;
    price: number;
    colorVariant: string | null;
    materialType: string | null;
    skuCode: string | null;
    variantImageURL: string | null;
};

export type CreateVariantRequest = {
    size: string;
    colorVariant?: string | null;
    materialType?: string | null;
    skuCode?: string | null;
};

export type UpdateVariantRequest = {
    size?: string;
    colorVariant?: string | null;
    materialType?: string | null;
    skuCode?: string | null;
};

/** Get all variants for an outfit */
export async function getOutfitVariants(outfitId: string): Promise<ProductVariantDto[]> {
    return api<ProductVariantDto[]>(`${endpoints.schools.outfitVariants}/${outfitId}/variants`, {
        method: "GET",
        auth: true,
    });
}

/** Create a new variant for an outfit */
export async function createVariant(outfitId: string, data: CreateVariantRequest): Promise<ProductVariantDto> {
    return api<ProductVariantDto>(`${endpoints.schools.outfitVariants}/${outfitId}/variants`, {
        method: "POST",
        body: JSON.stringify(data),
        auth: true,
    });
}

/** Update a variant */
export async function updateVariant(outfitId: string, variantId: string, data: UpdateVariantRequest): Promise<ProductVariantDto> {
    return api<ProductVariantDto>(`${endpoints.schools.outfitVariants}/${outfitId}/variants/${variantId}`, {
        method: "PUT",
        body: JSON.stringify(data),
        auth: true,
    });
}

/** Delete a variant */
export async function deleteVariant(outfitId: string, variantId: string): Promise<void> {
    await api<void>(`${endpoints.schools.outfitVariants}/${outfitId}/variants/${variantId}`, {
        method: "DELETE",
        auth: true,
    });
}

//#endregion

//#region ── Campaigns ──

export type CampaignListItemDto = {
    campaignId: string;
    campaignName: string;
    status: string;
    startDate: string;
    endDate: string;
    description: string | null;
    outfitCount: number;
    orderCount: number;
};

export type CampaignListResponse = {
    items: CampaignListItemDto[];
    total: number;
    page: number;
    pageSize: number;
};

export type CampaignOutfitDetailDto = {
    campaignOutfitId: string;
    outfitId: string;
    outfitName: string;
    mainImageUrl: string | null;
    campaignPrice: number;
    maxQuantity: number | null;
    providerId: string | null;
};

export type CampaignDetailDto = {
    campaignId: string;
    campaignName: string;
    status: string;
    startDate: string;
    endDate: string;
    description: string | null;
    createdAt: string;
    totalOrders: number;
    outfits: CampaignOutfitDetailDto[];
};

export type CampaignOutfitInput = {
    outfitId: string;
    providerId?: string | null;
    campaignPrice: number;
    maxQuantity?: number | null;
};

export type PublishCampaignRequest = {
    campaignName: string;
    description?: string | null;
    startDate: string;
    endDate: string;
    saveAsDraft: boolean;
    outfits: CampaignOutfitInput[];
};

export type PublishCampaignResponse = {
    campaignId: string;
    campaignName: string;
    description: string | null;
    status: string;
    startDate: string;
    endDate: string;
    outfitCount: number;
    createdAt: string;
};

/** Get campaign list */
export async function getCampaigns(page = 1, pageSize = 10, status?: string): Promise<CampaignListResponse> {
    let url = `${endpoints.schools.campaigns}?page=${page}&pageSize=${pageSize}`;
    if (status) url += `&status=${status}`;
    return api<CampaignListResponse>(url, { auth: true });
}

/** Get campaign detail */
export async function getCampaignDetail(id: string): Promise<CampaignDetailDto> {
    return api<CampaignDetailDto>(`${endpoints.schools.campaigns}/${id}`, { auth: true });
}

/** Publish or save-as-draft a campaign */
export async function publishCampaign(data: PublishCampaignRequest): Promise<PublishCampaignResponse> {
    return api<PublishCampaignResponse>(endpoints.schools.campaigns, {
        method: "POST",
        body: JSON.stringify(data),
        auth: true,
    });
}

/** Lock a campaign (no more orders accepted) */
export async function lockCampaign(id: string): Promise<{ message: string }> {
    return api<{ message: string }>(`${endpoints.schools.campaigns}/${id}/lock`, {
        method: "POST",
        auth: true,
    });
}

/** Campaign progress stats (UC-46) */
export type CampaignProgressDto = {
    campaignId: string;
    campaignName: string;
    status: string;
    startDate: string;
    endDate: string;
    totalOrders: number;
    totalStudents: number;
    totalRevenue: number;
    pendingOrders: number;
    totalChildProfiles: number;
    outfitBreakdown: {
        outfitId: string;
        outfitName: string;
        quantityOrdered: number;
        maxQuantity: number | null;
        revenue: number;
        category: string | null;
    }[];
};

/** Get campaign progress / stats */
export async function getCampaignProgress(id: string): Promise<CampaignProgressDto> {
    return api<CampaignProgressDto>(
        endpoints.schools.campaignProgress.replace("{id}", id),
        { auth: true }
    );
}

//#endregion

//#region ── Providers ──

export type ProviderDto = {
    id: string;
    providerName: string;
    contactPersonName: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    status: string | null;
};

/** Get list of available providers */
export async function getProviders(): Promise<ProviderDto[]> {
    return api<ProviderDto[]>(endpoints.schools.providers, { auth: true });
}

//#endregion
//#region ── Public APIs (no auth required) ──

export type PublicSchoolDto = {
    schoolId: string;
    schoolName: string;
    logoURL: string | null;
    level: string | null;
    rating: number | null;
    contactInfo: string | null;
};

// Matches backend SchoolCampaignDto
export type PublicCampaignSummaryDto = {
    campaignId: string;
    campaignName: string;
    status: string;
    startDate: string;
    endDate: string;
    description?: string | null;
    outfitCount?: number;
};

// Matches actual backend SchoolDetailResponse (PascalCase -> camelCase via .NET serializer)
export type PublicSchoolDetailDto = {
    schoolId: string;
    schoolName: string;
    logoURL: string | null;
    level?: string | null;
    rating?: number | null;
    contactInfo: string | null;
    outfitCount: number;
    activeCampaigns: PublicCampaignSummaryDto[];
};

export type PublicCampaignDetailDto = {
    campaignId: string;
    campaignName: string;
    status: string;
    startDate: string;
    endDate: string;
    description: string | null;
    school: { id: string; schoolName: string; logoURL: string | null };
    outfits: CampaignOutfitDetailDto[];
};

/** Guest & Parent: list all public schools (paginated) */
export type PublicSchoolsResponse = {
    schools: PublicSchoolDto[];
    totalCount: number;
};

export async function getPublicSchools(page?: number, pageSize?: number): Promise<PublicSchoolsResponse> {
    const q = new URLSearchParams();
    if (page) q.set("page", String(page));
    if (pageSize) q.set("pageSize", String(pageSize));
    const url = q.toString() ? `${endpoints.public.schools}?${q}` : endpoints.public.schools;
    return api<PublicSchoolsResponse>(url, { method: "GET" });
}

/** Guest & Parent: public school detail with active campaigns */
export async function getPublicSchoolDetail(id: string): Promise<PublicSchoolDetailDto> {
    return api<PublicSchoolDetailDto>(`${endpoints.public.schools}/${id}`, { method: "GET" });
}

/** Parent only: public campaign detail with outfits */
export async function getPublicCampaignDetail(campaignId: string): Promise<PublicCampaignDetailDto> {
    return api<PublicCampaignDetailDto>(
        `/api/public/campaigns/${campaignId}`,
        { method: "GET", auth: true }
    );
}

// ── Outfit Detail (public) ──

export type OutfitVariantDto = {
    productVariantId: string;
    size: string;
    colorVariant: string | null;
    materialType: string | null;
    price: number;
    skuCode: string | null;
    variantImageURL: string | null;
};

export type SizeChartDetailDto = {
    sizeLabel: string;
    chestMin: number | null;
    chestMax: number | null;
    waistMin: number | null;
    waistMax: number | null;
    heightMin: number | null;
    heightMax: number | null;
};

export type SizeChartDto = {
    sizeChartId: string;
    chartName: string;
    unit: string;
    details: SizeChartDetailDto[];
};

export type ReviewDto = {
    feedbackId: string;
    rating: number;
    comment: string | null;
    timestamp: string;
    userName: string;
    userAvatarUrl: string | null;
};

export type OutfitDetailDto = {
    outfitId: string;
    outfitName: string;
    description: string | null;
    price: number;
    outfitType: string;
    mainImageURL: string | null;
    isAvailable: boolean;
    isCustomizable: boolean;
    school: { schoolId: string; schoolName: string; logoURL: string | null };
    variants: OutfitVariantDto[];
    sizeChart: SizeChartDto | null;
    categories: string[];
    averageRating: number;
    feedbackCount: number;
    reviews: ReviewDto[];
};

/** Guest & Parent: outfit detail */
export async function getPublicOutfitDetail(id: string): Promise<OutfitDetailDto> {
    return api<OutfitDetailDto>(`${endpoints.public.outfits}/${id}`, { method: "GET" });
}

/** Guest & Parent: list uniforms for a school (for "related" section) */
export async function getSchoolUniforms(schoolId: string, page = 1, pageSize = 10): Promise<unknown> {
    return api<unknown>(
        `${endpoints.public.schools}/${schoolId}/uniforms?page=${page}&pageSize=${pageSize}`,
        { method: "GET" }
    );
}

//#endregion
