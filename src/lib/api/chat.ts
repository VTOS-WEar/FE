import { api } from "./clients";
import { endpoints } from "./endpoints";

// ── Types ──

export type ChatMessageDto = {
    messageId: string;
    senderUserId: string;
    senderName: string;
    content: string;
    sentAt: string;
    isMe: boolean;
    // New fields for uniform proposals (Task 5)
    messageType?: string;    // "Text" | "UniformProposal" | "SystemNotification"
    imageUrl?: string | null;
    proposalStatus?: string | null;       // "Pending" | "Accepted"
    proposalOutfitName?: string | null;
};

export type ChatMessagesResponse = {
    items: ChatMessageDto[];
    total: number;
    page: number;
    pageSize: number;
};

// ── Chat APIs ──

export async function getChatMessages(
    channelType: string,
    channelId: string,
    page = 1,
    pageSize = 50
): Promise<ChatMessagesResponse> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return api<ChatMessagesResponse>(`/api/chat/${channelType}/${channelId}/messages?${params}`, {
        method: "GET",
        auth: true,
    });
}

export async function sendChatMessage(
    channelType: string,
    channelId: string,
    content: string
): Promise<{ messageId: string; senderName: string; sentAt: string }> {
    return api(`/api/chat/${channelType}/${channelId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
        auth: true,
    });
}

// ── Uniform Proposal APIs (Task 5) ──

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

/**
 * Provider sends a uniform proposal with image in contract chat.
 * Uses multipart/form-data.
 */
export async function sendUniformProposal(
    channelId: string,
    outfitName: string,
    imageFile: File
): Promise<{ messageId: string; sentAt: string }> {
    const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");

    const formData = new FormData();
    formData.append("ChannelId", channelId);
    formData.append("OutfitName", outfitName);
    formData.append("Image", imageFile);

    const res = await fetch(`${API_BASE}${endpoints.chat.proposal}`, {
        method: "POST",
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Lỗi gửi đề xuất đồng phục.");
    }

    return res.json();
}

/**
 * School accepts a uniform proposal — creates outfit in school catalog.
 */
export async function acceptUniformProposal(
    messageId: string
): Promise<{ outfitId: string; outfitName: string }> {
    return api<{ outfitId: string; outfitName: string }>(
        `${endpoints.chat.acceptProposal}/${messageId}/accept`,
        { method: "POST", auth: true }
    );
}
