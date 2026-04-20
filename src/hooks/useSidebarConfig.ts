import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { DASHBOARD_SIDEBAR_CONFIG } from "../constants/dashboardConfig";
import { TEACHER_DASHBOARD_SIDEBAR_CONFIG } from "../constants/teacherDashboardConfig";

/**
 * Hook that returns sidebar config with the active state
 * set dynamically based on the current route.
 * 
 * Usage: const sidebarConfig = useSidebarConfig();
 */
export function useSidebarConfig() {
    const { pathname } = useLocation();
    const rawUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    let role = "";
    try {
        role = rawUser ? JSON.parse(rawUser)?.role ?? "" : "";
    } catch {
        role = "";
    }
    const baseConfig = role === "HomeroomTeacher" ? TEACHER_DASHBOARD_SIDEBAR_CONFIG : DASHBOARD_SIDEBAR_CONFIG;

    return useMemo(() => ({
        ...baseConfig,
        topNavItems: (baseConfig.topNavItems || []).map((item) => ({
            ...item,
            active: item.href ? pathname === item.href || pathname.startsWith(item.href + "/") : false,
        })),
        navSections: baseConfig.navSections.map((section) => ({
            ...section,
            items: section.items.map((item) => ({
                ...item,
                active: item.href ? pathname === item.href || pathname.startsWith(item.href + "/") : false,
            })),
        })),
    }), [baseConfig, pathname]);
}
