import { api } from "./clients";
import { endpoints } from "./endpoints";

export type SchoolSearchResult = {
    id: string;
    schoolName: string;
    logoUrl: string | null;
    address: string | null;
    uniformCount: number;
};

export type UniformSearchResult = {
    id: string;
    outfitName: string;
    mainImageUrl: string | null;
    price: number;
    schoolName: string;
    schoolId: string;
};

export type PublicSearchResponse = {
    schools: SchoolSearchResult[];
    uniforms: UniformSearchResult[];
    totalSchools: number;
    totalUniforms: number;
};

export type SemesterCatalogProviderDto = {
    providerId: string;
    providerName: string;
    contactEmail?: string | null;
    price: number;
    averageRating: number;
    totalRatings: number;
    totalCompletedOrders: number;
};

export type SemesterCatalogOutfitDto = {
    outfitId: string;
    outfitName: string;
    description?: string | null;
    mainImageUrl?: string | null;
    price: number;
    outfitType: string;
    sizes: string[];
    providers: SemesterCatalogProviderDto[];
};

export type SchoolSemesterCatalogResponse = {
    semesterPublicationId: string;
    schoolId: string;
    semester: string;
    academicYear: string;
    startDate: string;
    endDate: string;
    status: string;
    outfits: SemesterCatalogOutfitDto[];
};

export type PublicProviderProfileDto = {
    providerId: string;
    providerName: string;
    contactPersonName?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    averageRating: number;
    totalRatings: number;
    totalCompletedOrders: number;
};

export type ProviderRatingItemDto = {
    providerRatingId: string;
    orderId: string;
    rating: number;
    comment?: string | null;
    createdAt: string;
    parentName: string;
};

export type ProviderRatingsResponse = {
    providerId: string;
    providerName: string;
    averageRating: number;
    totalRatings: number;
    totalCompletedOrders: number;
    items: ProviderRatingItemDto[];
};

export type ProviderRankingItemDto = {
    providerId: string;
    providerName: string;
    averageRating: number;
    totalRatings: number;
    totalCompletedOrders: number;
};

export type ProviderRankingResponse = {
    schoolId: string;
    items: ProviderRankingItemDto[];
};

export async function searchPublic(q: string, page = 1, pageSize = 10): Promise<PublicSearchResponse> {
    const params = new URLSearchParams({ q, page: String(page), pageSize: String(pageSize) });
    return api<PublicSearchResponse>(`${endpoints.public.search}?${params}`, {
        method: "GET",
    });
}

export async function getSchoolSemesterCatalog(schoolId: string): Promise<SchoolSemesterCatalogResponse> {
    return api<SchoolSemesterCatalogResponse>(`${endpoints.public.semesterCatalog}/${schoolId}/semester-catalog`, {
        method: "GET",
    });
}

export async function getAllSchoolSemesterCatalogs(schoolId: string): Promise<SchoolSemesterCatalogResponse[]> {
    return api<SchoolSemesterCatalogResponse[]>(`${endpoints.public.semesterCatalog}/${schoolId}/semester-catalogs`, {
        method: "GET",
    });
}

export async function getProvidersForPublicationOutfit(
    publicationId: string,
    outfitId: string,
): Promise<SemesterCatalogProviderDto[]> {
    return api<SemesterCatalogProviderDto[]>(
        `${endpoints.public.publicationOutfitProviders}/${publicationId}/outfits/${outfitId}/providers`,
        { method: "GET" },
    );
}

export async function getProviderPublicProfile(providerId: string): Promise<PublicProviderProfileDto> {
    return api<PublicProviderProfileDto>(`${endpoints.public.providerProfile}/${providerId}/profile`, {
        method: "GET",
    });
}

export async function getProviderRatings(providerId: string): Promise<ProviderRatingsResponse> {
    return api<ProviderRatingsResponse>(`${endpoints.public.providerRatings}/${providerId}/ratings`, {
        method: "GET",
    });
}

export async function getProviderRanking(schoolId: string): Promise<ProviderRankingResponse> {
    return api<ProviderRankingResponse>(`${endpoints.public.providerRanking}/${schoolId}/provider-ranking`, {
        method: "GET",
    });
}
