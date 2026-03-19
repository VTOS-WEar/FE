import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { PROVIDER_SIDEBAR_CONFIG } from "../constants/providerDashboardConfig";

/**
 * Hook that returns Provider sidebar config with the active state
 * set dynamically based on the current route.
 */
export function useProviderSidebarConfig() {
    const { pathname } = useLocation();

    return useMemo(() => ({
        ...PROVIDER_SIDEBAR_CONFIG,
        topNavItems: (PROVIDER_SIDEBAR_CONFIG.topNavItems || []).map((item) => ({
            ...item,
            active: item.href ? pathname === item.href || pathname.startsWith(item.href + "/") : false,
        })),
        navSections: PROVIDER_SIDEBAR_CONFIG.navSections.map((section) => ({
            ...section,
            items: section.items.map((item) => ({
                ...item,
                active: item.href ? pathname === item.href || pathname.startsWith(item.href + "/") : false,
            })),
        })),
    }), [pathname]);
}
