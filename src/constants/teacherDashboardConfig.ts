import { BellRing, ClipboardList, GraduationCap, LayoutDashboard, LifeBuoy, MessageSquare, UserCircle } from "lucide-react";
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
                {
                    icon: BellRing,
                    label: "Nhắc phụ huynh",
                    href: "/teacher/reminders",
                },
                {
                    icon: MessageSquare,
                    label: "Tin nhắn",
                    href: "/teacher/messages",
                },
                {
                    icon: LifeBuoy,
                    label: "Hỗ trợ Admin",
                    href: "/teacher/support",
                },
                {
                    icon: UserCircle,
                    label: "Tài khoản",
                    href: "/teacher/account",
                },
            ],
        },
    ],
};
