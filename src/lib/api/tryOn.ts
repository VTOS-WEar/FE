import { endpoints } from "./endpoints";
import { API_BASE, api } from "./clients";

export type GuestTryOnResponse = {
    tryOnId: string;
    resultPhotoUrl: string;
    guestSessionId: string;
    remainingTries: number;
};

function withApiBase(url: string | null): string | null {
    if (!url) return url;
    if (url.startsWith("/api/")) return `${API_BASE}${url}`;
    return url;
}

function normalizeGuestTryOnResponse(response: GuestTryOnResponse): GuestTryOnResponse {
    return {
        ...response,
        resultPhotoUrl: withApiBase(response.resultPhotoUrl) || "",
    };
}

function normalizeHistoryItem(item: TryOnHistoryDto): TryOnHistoryDto {
    return {
        ...item,
        resultPhotoUrl: withApiBase(item.resultPhotoUrl),
        uploadedPhotoUrl: withApiBase(item.uploadedPhotoUrl),
    };
}

/**
 * Call virtual try-on API with a user photo and outfit ID.
 * Uses multipart/form-data (not JSON).
 * Works for both guests and logged-in parents.
 */
export async function guestTryOn(
    outfitId: string,
    photo: File,
    guestSessionId?: string
): Promise<GuestTryOnResponse> {
    const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");

    const formData = new FormData();
    formData.append("OutfitId", outfitId);
    formData.append("Photo", photo);
    if (guestSessionId) {
        formData.append("GuestSessionId", guestSessionId);
    }

    const res = await fetch(`${API_BASE}${endpoints.tryOn.request}`, {
        method: "POST",
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 429) {
            throw new Error(err.error || "Bạn đã hết lượt thử hôm nay. Hãy quay lại ngày mai!");
        }
        throw new Error(err.error || "Có lỗi xảy ra khi thử đồ.");
    }

    return normalizeGuestTryOnResponse(await res.json());
}

// ── Try-On History (Parent only) ──

export type TryOnHistoryDto = {
    id: string;
    outfitId: string;
    outfitName: string;
    outfitImage: string | null;
    resultPhotoUrl: string | null;
    uploadedPhotoUrl: string | null;
    tryOnTimestamp: string;
};

export type TryOnHistoryResponse = {
    items: TryOnHistoryDto[];
    total: number;
    page: number;
    pageSize: number;
};

export async function getTryOnHistory(
    page = 1,
    pageSize = 20
): Promise<TryOnHistoryResponse> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    const response = await api<TryOnHistoryResponse>(`${endpoints.tryOn.history}?${params}`, {
        method: "GET",
        auth: true,
    });
    return {
        ...response,
        items: response.items.map(normalizeHistoryItem),
    };
}

export async function refreshTryOnResultLink(
    tryOnId: string,
    guestSessionId?: string
): Promise<{ resultPhotoUrl: string }> {
    const response = await api<{ resultPhotoUrl: string }>(`${endpoints.tryOn.resultLink}/${tryOnId}/result-link`, {
        method: "POST",
        auth: true,
        body: { guestSessionId: guestSessionId || undefined },
    });
    return {
        resultPhotoUrl: withApiBase(response.resultPhotoUrl) || "",
    };
}
