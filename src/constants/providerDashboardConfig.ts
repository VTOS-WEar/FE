import {
    AlertTriangle,
    BarChart3,
    Building2,
    ClipboardList,
    FileText,
    LayoutDashboard,
    Settings,
    Wallet,
} from "lucide-react";
import type { DashboardSidebarProps } from "../components/layout";

/**
 * Sidebar config for Provider workspace screens.
 * Grouped by the Provider operator mental model:
 * tracking, contract operations, finance, and settings.
 */
export const PROVIDER_SIDEBAR_CONFIG: Omit<DashboardSidebarProps, "isCollapsed" | "onToggle"> = {
    iconType: "provider" as const,
    greeting: "Xin chào!",
    name: "",
    topNavItems: [
        {
            icon: LayoutDashboard,
            label: "Tổng quan",
            href: "/provider/dashboard",
        },
    ],
    navSections: [
        {
            title: "THEO DÕI",
            items: [
                {
                    icon: ClipboardList,
                    label: "Đơn hàng",
                    href: "/provider/orders",
                },
                {
                    icon: AlertTriangle,
                    label: "Khiếu nại",
                    href: "/provider/complaints",
                },
            ],
        },
        {
            title: "VẬN HÀNH HỢP ĐỒNG",
            items: [
                {
                    icon: FileText,
                    label: "Hợp đồng",
                    href: "/provider/contracts",
                },
            ],
        },
        {
            title: "TÀI CHÍNH",
            items: [
                {
                    icon: Wallet,
                    label: "Ví nhà cung cấp",
                    href: "/provider/wallet",
                },
                {
                    icon: BarChart3,
                    label: "Doanh thu",
                    href: "/provider/revenue",
                },
            ],
        },
        {
            title: "THIẾT LẬP",
            items: [
                {
                    icon: Building2,
                    label: "Hồ sơ nhà cung cấp",
                    href: "/provider/profile",
                },
                {
                    icon: Settings,
                    label: "Tài khoản",
                    href: "/provider/account-settings",
                },
            ],
        },
    ],
};
