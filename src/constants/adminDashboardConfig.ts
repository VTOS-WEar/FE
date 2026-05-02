import {
    AlertTriangle,
    BarChart3,
    CreditCard,
    LayoutDashboard,
    Settings,
    Tags,
    UserPlus,
    Users,
    Wallet,
} from "lucide-react";
import type { DashboardSidebarProps } from "../components/layout";

/**
 * Sidebar config for Admin workspace screens.
 * Keep route targets stable while grouping the IA around Admin responsibilities.
 */
export const ADMIN_SIDEBAR_CONFIG: Omit<DashboardSidebarProps, "isCollapsed" | "onToggle"> = {
    avatarSrc: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/frame-239353.png",
    avatarAlt: "Admin avatar",
    iconType: "admin",
    greeting: "Xin chào,",
    name: "Quản trị viên",
    topNavItems: [
        {
            icon: LayoutDashboard,
            label: "Tổng quan",
            href: "/admin/dashboard",
        },
    ],
    navSections: [
        {
            title: "TÀI KHOẢN",
            items: [
                {
                    icon: Users,
                    label: "Người dùng",
                    href: "/admin/users",
                },
                {
                    icon: UserPlus,
                    label: "Yêu cầu cấp tài khoản",
                    href: "/admin/account-requests",
                },
            ],
        },
        {
            title: "TÀI CHÍNH",
            items: [
                {
                    icon: CreditCard,
                    label: "Giao dịch",
                    href: "/admin/transactions",
                },
                {
                    icon: Wallet,
                    label: "Yêu cầu rút tiền",
                    href: "/admin/withdrawals",
                },
            ],
        },
        {
            title: "VẬN HÀNH",
            items: [
                {
                    icon: AlertTriangle,
                    label: "Hỗ trợ",
                    href: "/admin/complaints",
                },
                {
                    icon: BarChart3,
                    label: "Báo cáo học kỳ",
                    href: "/admin/semester-monitor",
                },
                {
                    icon: Tags,
                    label: "Danh mục đồng phục",
                    href: "/admin/categories",
                },
            ],
        },
        {
            title: "THIẾT LẬP",
            items: [
                {
                    icon: Settings,
                    label: "Tài khoản",
                    href: "/admin/account-settings",
                },
            ],
        },
    ],
};
