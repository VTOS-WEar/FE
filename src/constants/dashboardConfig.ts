import {
    FileText,
    LayoutDashboard,
    School,
    Settings,
    Shirt,
    ShoppingBag,
    Users,
    Wallet,
} from "lucide-react";
import type { DashboardSidebarProps } from "../components/layout";

/**
 * Sidebar config for School Dashboard screens.
 *
 * Hidden legacy routes still exist via direct URL:
 * - /school/campaigns
 * - /school/production-orders
 * - /school/complaints
 */
export const DASHBOARD_SIDEBAR_CONFIG: Omit<DashboardSidebarProps, "isCollapsed" | "onToggle"> = {
    iconType: "school" as const,
    greeting: "Xin chao!",
    name: "",
    topNavItems: [
        {
            icon: LayoutDashboard,
            label: "Tong quan",
            href: "/school/dashboard",
        },
    ],
    navSections: [
        {
            title: "QUAN LY",
            items: [
                {
                    icon: Users,
                    label: "Hoc sinh",
                    href: "/school/students",
                },
                {
                    icon: Shirt,
                    label: "Dong phuc",
                    href: "/school/uniforms",
                },
                {
                    icon: School,
                    label: "Ho so truong",
                    href: "/school/profile",
                },
                {
                    icon: Settings,
                    label: "Tai khoan",
                    href: "/school/account-settings",
                },
            ],
        },
        {
            title: "KINH DOANH",
            items: [
                {
                    icon: FileText,
                    label: "Cong bo hoc ky",
                    href: "/school/semester-publications",
                },
                {
                    icon: FileText,
                    label: "Hop dong",
                    href: "/school/contracts",
                },
            ],
        },
        {
            title: "VAN HANH",
            items: [
                {
                    icon: ShoppingBag,
                    label: "Don hang",
                    href: "/school/orders",
                },
            ],
        },
        {
            title: "TAI CHINH",
            items: [
                {
                    icon: Wallet,
                    label: "Vi truong hoc",
                    href: "/school/wallet",
                },
            ],
        },
    ],
};
