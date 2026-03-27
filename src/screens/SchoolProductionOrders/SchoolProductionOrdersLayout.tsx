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
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} />
                </div>
                <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 min-w-0">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
