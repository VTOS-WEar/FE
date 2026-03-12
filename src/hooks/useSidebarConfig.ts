import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { DASHBOARD_SIDEBAR_CONFIG } from "../constants/dashboardConfig";

/**
 * Hook that returns sidebar config with the active state
 * set dynamically based on the current route.
 * 
 * Usage: const sidebarConfig = useSidebarConfig();
 */
export function useSidebarConfig() {
    const { pathname } = useLocation();

    return useMemo(() => ({
        ...DASHBOARD_SIDEBAR_CONFIG,
        topNavItems: (DASHBOARD_SIDEBAR_CONFIG.topNavItems || []).map((item) => ({
            ...item,
            active: item.href ? pathname === item.href || pathname.startsWith(item.href + "/") : false,
        })),
        navSections: DASHBOARD_SIDEBAR_CONFIG.navSections.map((section) => ({
            ...section,
            items: section.items.map((item) => ({
                ...item,
                active: item.href ? pathname === item.href || pathname.startsWith(item.href + "/") : false,
            })),
        })),
    }), [pathname]);
}
