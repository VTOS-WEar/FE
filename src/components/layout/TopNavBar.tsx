import { ReactNode } from "react";
import { NotificationDropdown } from "./NotificationDropdown";
import { useNotifications } from "../../hooks/useNotifications";

interface TopNavBarProps {
    children: ReactNode; // Breadcrumb content
}

/**
 * Unified top navigation bar for School / Provider dashboard pages.
 * Provides consistent height, breadcrumb slot, and notification bell on every page.
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
