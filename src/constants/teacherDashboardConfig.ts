import { GraduationCap, LayoutDashboard } from "lucide-react";
import type { DashboardSidebarProps } from "../components/layout";

export const TEACHER_DASHBOARD_SIDEBAR_CONFIG: Omit<DashboardSidebarProps, "isCollapsed" | "onToggle"> = {
    iconType: "school" as const,
    greeting: "Xin chao!",
    name: "",
    topNavItems: [
        {
            icon: LayoutDashboard,
            label: "Lop hoc",
            href: "/teacher/classes",
        },
    ],
    navSections: [
        {
            title: "GIANG DAY",
            items: [
                {
                    icon: GraduationCap,
                    label: "Lop chu nhiem",
                    href: "/teacher/classes",
                },
            ],
        },
    ],
};
