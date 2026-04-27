import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { PROVIDER_SIDEBAR_CONFIG } from "../constants/providerDashboardConfig";
import type { NavItem } from "../components/layout";

/**
 * Hook that returns Provider sidebar config with the active state
 * set dynamically based on the current route.
 */
export function useProviderSidebarConfig() {
    const { pathname } = useLocation();

    const withActiveState = (item: NavItem): NavItem => {
        const children = item.children?.map(withActiveState);
        const selfActive = item.activeWhen
            ? item.activeWhen(pathname)
            : item.href ? pathname === item.href || pathname.startsWith(item.href + "/") : false;
        const childActive = children?.some((child) => child.active) ?? false;

        return {
            ...item,
            children,
            active: selfActive || childActive,
        };
    };

    return useMemo(() => ({
        ...PROVIDER_SIDEBAR_CONFIG,
        topNavItems: (PROVIDER_SIDEBAR_CONFIG.topNavItems || []).map(withActiveState),
        navSections: PROVIDER_SIDEBAR_CONFIG.navSections.map((section) => ({
            ...section,
            items: section.items.map(withActiveState),
        })),
    }), [pathname]);
}
