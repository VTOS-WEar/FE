import {
    ClipboardList,
    FileText,
    LayoutDashboard,
    School,
    Settings,
    Shirt,
    Users,
} from "lucide-react";
import type { DashboardSidebarProps } from "../components/layout";

/**
 * Sidebar config for School Dashboard screens.
 *
 * Legacy campaign/production-order/complaint management routes are intentionally
 * omitted from the active school navigation during the marketplace migration.
 */
export const DASHBOARD_SIDEBAR_CONFIG: Omit<DashboardSidebarProps, "isCollapsed" | "onToggle"> = {
    iconType: "school" as const,
    greeting: "Xin chào!",
    name: "",
    topNavItems: [
        {
            icon: LayoutDashboard,
            label: "Tổng quan",
            href: "/school/dashboard",
        },
    ],
    navSections: [
        {
            title: "THEO DÕI",
            items: [
                {
                    icon: Users,
                    label: "Học sinh",
                    href: "/school/students",
                },
                {
                    icon: ClipboardList,
                    label: "Báo cáo GVCN",
                    href: "/school/teacher-reports",
                },
            ],
        },
        {
            title: "KẾ HOẠCH HỌC KỲ",
            items: [
                {
                    icon: Shirt,
                    label: "Đồng phục",
                    href: "/school/uniforms",
                },
                {
                    icon: FileText,
                    label: "Công bố học kỳ",
                    href: "/school/semester-publications",
                },
                {
                    icon: FileText,
                    label: "Hợp đồng",
                    href: "/school/contracts",
                },
            ],
        },
        {
            title: "THIẾT LẬP",
            items: [
                {
                    icon: School,
                    label: "Hồ sơ trường",
                    href: "/school/profile",
                },
                {
                    icon: Settings,
                    label: "Tài khoản",
                    href: "/school/account-settings",
                },
            ],
        },
    ],
};
