import { useState, useEffect, useCallback, useRef } from "react";
import { HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    type InAppNotification,
} from "../lib/api/notifications";

const POLL_INTERVAL = 30_000; // 30 seconds (fallback)
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

function getAccessToken(): string {
    return localStorage.getItem("access_token") || sessionStorage.getItem("access_token") || "";
}

export function useNotifications() {
    const [notifications, setNotifications] = useState<InAppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const connectionRef = useRef<ReturnType<typeof buildConnection> | null>(null);
    const [realtime, setRealtime] = useState(false);

    function buildConnection() {
        return new HubConnectionBuilder()
            .withUrl(`${API_BASE}/hubs/notifications`, {
                accessTokenFactory: () => getAccessToken(),
            })
            .withAutomaticReconnect([0, 2000, 5000, 10000])
            .configureLogging(LogLevel.Warning)
            .build();
    }

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

    // Connect to SignalR for real-time push
    useEffect(() => {
        const token = getAccessToken();
        if (!token) return;

        const connection = buildConnection();
        connectionRef.current = connection;

        // When server pushes "NewNotification", immediately bump unread count
        connection.on("NewNotification", () => {
            setUnreadCount((prev) => prev + 1);
            // Also refresh notification list if it was loaded
            fetchNotifications();
        });

        connection.onreconnected(() => setRealtime(true));
        connection.onclose(() => setRealtime(false));

        connection
            .start()
            .then(() => setRealtime(true))
            .catch(() => setRealtime(false));

        return () => {
            if (connection.state === HubConnectionState.Connected) {
                connection.stop();
            }
            connectionRef.current = null;
            setRealtime(false);
        };
    }, [fetchNotifications]);

    // Polling fallback — only when SignalR is not connected
    useEffect(() => {
        fetchUnreadCount();

        intervalRef.current = setInterval(() => {
            if (!realtime) fetchUnreadCount();
        }, POLL_INTERVAL);

        // Also refresh on window focus
        const onFocus = () => fetchUnreadCount();
        window.addEventListener("focus", onFocus);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            window.removeEventListener("focus", onFocus);
        };
    }, [fetchUnreadCount, realtime]);

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
