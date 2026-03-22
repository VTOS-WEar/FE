import { Outlet } from "react-router-dom";
import { DashboardSidebar } from "../../components/layout";
import { useSidebarConfig } from "../../hooks/useSidebarConfig";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";

/**
 * Shared layout for /school/production-orders routes.
 * The sidebar is rendered once here and stays mounted
 * while <Outlet> swaps between list ↔ detail pages.
 */
export default function SchoolProductionOrdersLayout() {
    const sidebarConfig = useSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "#f5f5f5" }}>
            <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[20rem] xl:w-[23.75rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} />
            </div>
            <main style={{ flex: 1, padding: "32px 40px", minWidth: 0 }}>
                <Outlet />
            </main>
        </div>
    );
}
