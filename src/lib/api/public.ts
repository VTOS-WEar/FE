import { api } from "./clients";
import { endpoints } from "./endpoints";

/* ─── Types ─────────────────────────────────────────────────────────────── */
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

/* ─── API ──────────────────────────────────────────────────────────────── */

/** Unified search across schools and uniforms. No auth required. */
export async function searchPublic(q: string, page = 1, pageSize = 10): Promise<PublicSearchResponse> {
    const params = new URLSearchParams({ q, page: String(page), pageSize: String(pageSize) });
    return api<PublicSearchResponse>(`${endpoints.public.search}?${params}`, {
        method: "GET",
    });
}
