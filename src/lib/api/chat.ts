import { api } from "./clients";

// ── Types ──

export type ChatMessageDto = {
    messageId: string;
    senderUserId: string;
    senderName: string;
    content: string;
    sentAt: string;
    isMe: boolean;
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
