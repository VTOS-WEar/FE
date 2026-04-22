import { ClipboardList, GraduationCap, LayoutDashboard } from "lucide-react";
import type { DashboardSidebarProps } from "../components/layout";

export const TEACHER_DASHBOARD_SIDEBAR_CONFIG: Omit<DashboardSidebarProps, "isCollapsed" | "onToggle"> = {
    iconType: "school" as const,
    greeting: "Xin chào!",
    name: "",
    topNavItems: [
        {
            icon: LayoutDashboard,
            label: "Tổng quan",
            href: "/teacher/dashboard",
        },
    ],
    navSections: [
        {
            title: "GIẢNG DẠY",
            items: [
                {
                    icon: GraduationCap,
                    label: "Lớp chủ nhiệm",
                    href: "/teacher/classes",
                },
                {
                    icon: ClipboardList,
                    label: "Báo cáo",
                    href: "/teacher/reports",
                },
            ],
        },
    ],
};
