import { ReactNode, useState } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { Footer } from "./Footer";
import type { DashboardSidebarProps } from "./DashboardSidebar";

interface DashboardLayoutProps {
    children: ReactNode;
    sidebarProps: Omit<DashboardSidebarProps, 'isCollapsed' | 'onToggle'>;
}

/**
 * DashboardLayout - Layout cho các screen có sidebar (ConfirmSave, ConfirmReimport, etc.)
 * Tự động quản lý sidebar collapse state
 */
export const DashboardLayout = ({ children, sidebarProps }: DashboardLayoutProps) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="bg-[#f6f7f8] w-full min-h-screen flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                {/* Sidebar */}
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[20rem] xl:w-[23.75rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar
                        {...sidebarProps}
                        isCollapsed={isCollapsed}
                        onToggle={() => setIsCollapsed(prev => !prev)}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col min-w-0">
                    {children}
                </div>
            </div>

            <Footer />
        </div>
    );
};
