import { ReactNode } from "react";
import { NotificationDropdown } from "./NotificationDropdown";
import { useNotifications } from "../../hooks/useNotifications";
import { useAdminHeartbeat } from "../../hooks/useAdminHeartbeat";

interface TopNavBarProps {
    children: ReactNode; // Breadcrumb content
}

/**
 * Unified top navigation bar for School / Provider / Admin dashboard pages.
 * Provides consistent height, breadcrumb slot, and notification bell on every page.
 * For Admin users, also sends heartbeat pings for email digest tracking.
 */
export function TopNavBar({ children }: TopNavBarProps) {
    const {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
    } = useNotifications();

    // Detect admin role and send heartbeat (unconditional hook call, enabled flag inside)
    const storedUser = localStorage.getItem("user");
    const isAdmin = storedUser ? JSON.parse(storedUser)?.role === "Admin" : false;
    useAdminHeartbeat(isAdmin);

    return (
        <div className="nb-breadcrumb-bar" style={{ minHeight: 56, height: 56 }}>
            {children}
            <div className="flex items-center gap-3 flex-shrink-0">
                <NotificationDropdown
                    notifications={notifications}
                    unreadCount={unreadCount}
                    loading={loading}
                    onOpen={fetchNotifications}
                    onMarkAsRead={markAsRead}
                    onMarkAllAsRead={markAllAsRead}
                />
            </div>
        </div>
    );
}
