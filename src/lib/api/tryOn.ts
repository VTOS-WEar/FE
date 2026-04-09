import { endpoints } from "./endpoints";
import { api } from "./clients";

export type GuestTryOnResponse = {
    tryOnId: string;
    resultPhotoUrl: string;
    guestSessionId: string;
    remainingTries: number;
};

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

    const res = await fetch(`${import.meta.env.VITE_API_BASE || ""}${endpoints.tryOn.request}`, {
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

    return res.json();
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
    return api<TryOnHistoryResponse>(`${endpoints.tryOn.history}?${params}`, {
        method: "GET",
        auth: true,
    });
}
