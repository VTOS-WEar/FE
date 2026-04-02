import { useEffect, useRef } from "react";
import { api } from "../lib/api/clients";
import { endpoints } from "../lib/api/endpoints";

const HEARTBEAT_INTERVAL = 30_000; // 30 seconds

/**
 * Sends a heartbeat POST to the server every 30s so the backend
 * knows the admin is online. Used by AdminNotificationDigestJob
 * to decide whether to send email digests.
 *
 * @param enabled - Only sends heartbeats when true (pass role check)
 */
export function useAdminHeartbeat(enabled: boolean) {
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!enabled) return;

        const sendHeartbeat = async () => {
            try {
                await api(endpoints.notifications.heartbeat, {
                    method: "POST",
                    auth: true,
                });
            } catch {
                // silently fail
            }
        };

        // Send immediately on mount
        sendHeartbeat();

        // Then every 30s
        intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [enabled]);
}
