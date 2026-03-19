import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { ADMIN_SIDEBAR_CONFIG } from "../constants/adminDashboardConfig";

/**
 * Hook that returns Admin sidebar config with the active state
 * set dynamically based on the current route.
 */
export function useAdminSidebarConfig() {
    const { pathname } = useLocation();

    return useMemo(() => ({
        ...ADMIN_SIDEBAR_CONFIG,
        topNavItems: (ADMIN_SIDEBAR_CONFIG.topNavItems || []).map((item) => ({
            ...item,
            active: item.href ? pathname === item.href || pathname.startsWith(item.href + "/") : false,
        })),
        navSections: ADMIN_SIDEBAR_CONFIG.navSections.map((section) => ({
            ...section,
            items: section.items.map((item) => ({
                ...item,
                active: item.href ? pathname === item.href || pathname.startsWith(item.href + "/") : false,
            })),
        })),
    }), [pathname]);
}
