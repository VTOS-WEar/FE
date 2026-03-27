import { useState, useEffect, useCallback, useRef } from "react";
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    type InAppNotification,
} from "../lib/api/notifications";

const POLL_INTERVAL = 30_000; // 30 seconds

export function useNotifications() {
    const [notifications, setNotifications] = useState<InAppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const data = await getUnreadCount();
            setUnreadCount(data.count);
        } catch {
            // silently fail
        }
    }, []);

    const fetchNotifications = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const data = await getNotifications(page, 20);
            setNotifications(data.items);
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    }, []);

    const handleMarkAsRead = useCallback(async (id: string) => {
        try {
            await markAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch {
            // silently fail
        }
    }, []);

    const handleMarkAllAsRead = useCallback(async () => {
        try {
            await markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch {
            // silently fail
        }
    }, []);

    // Start polling on mount
    useEffect(() => {
        fetchUnreadCount();
        intervalRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL);

        // Also refresh on window focus
        const onFocus = () => fetchUnreadCount();
        window.addEventListener("focus", onFocus);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            window.removeEventListener("focus", onFocus);
        };
    }, [fetchUnreadCount]);

    return {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead: handleMarkAsRead,
        markAllAsRead: handleMarkAllAsRead,
        refreshCount: fetchUnreadCount,
    };
}
