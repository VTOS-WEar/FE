import { ReactNode } from "react";
import { DashboardLayout } from "./DashboardLayout";
import { DASHBOARD_SIDEBAR_CONFIG } from "../../constants/dashboardConfig";

interface DashboardScreenProps {
    children: ReactNode;
}

/**
 * DashboardScreen - Wrapper cho tất cả Dashboard screens
 * Tự động áp dụng sidebar config mà không cần truyền lại
 *
 * Cách dùng: Bọc content của dashboard screen bên trong DashboardScreen
 */
export const DashboardScreen = ({ children }: DashboardScreenProps) => {
    return (
        <DashboardLayout sidebarProps={DASHBOARD_SIDEBAR_CONFIG}>
            {children}
        </DashboardLayout>
    );
};
