import { api } from "./clients";
import { endpoints } from "./endpoints";

export type InAppNotification = {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
    relatedEntityId?: string | null;
    relatedEntityType?: string | null;
    actionUrl?: string | null;
};

export type NotificationListResponse = {
    items: InAppNotification[];
    total: number;
    page: number;
    pageSize: number;
};

export async function getNotifications(page = 1, pageSize = 20, isRead?: boolean) {
    let url = `${endpoints.notifications.list}?page=${page}&pageSize=${pageSize}`;
    if (isRead !== undefined) url += `&isRead=${isRead}`;
    return api<NotificationListResponse>(url, { auth: true });
}

export async function getUnreadCount() {
    return api<{ count: number }>(endpoints.notifications.unreadCount, { auth: true });
}

export async function markAsRead(id: string) {
    return api<{ message: string }>(`${endpoints.notifications.read}/${id}/read`, {
        method: "PUT",
        auth: true,
    });
}

export async function markAllAsRead() {
    return api<{ message: string; count: number }>(endpoints.notifications.readAll, {
        method: "PUT",
        auth: true,
    });
}
