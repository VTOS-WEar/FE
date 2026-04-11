import {
    LayoutDashboard, Building2, FileText,
    Factory, AlertTriangle, Wallet, BarChart3, Settings
} from "lucide-react";
import type { DashboardSidebarProps } from "../components/layout";

/**
 * Sidebar config for Provider Dashboard screens.
 * 3 sections: Quản lý, Sản xuất, Tài chính
 */
export const PROVIDER_SIDEBAR_CONFIG: Omit<DashboardSidebarProps, 'isCollapsed' | 'onToggle'> = {
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
            title: "QUẢN LÝ",
            items: [
                {
                    icon: Building2,
                    label: "Hồ sơ Nhà Cung Cấp",
                    href: "/provider/profile",
                },
                {
                    icon: FileText,
                    label: "Hợp đồng",
                    href: "/provider/contracts",
                },
                {
                    icon: Settings,
                    label: "Cài đặt tài khoản",
                    href: "/provider/account-settings",
                },
            ],
        },
        {
            title: "SẢN XUẤT",
            items: [
                {
                    icon: Factory,
                    label: "Đơn sản xuất",
                    href: "/provider/production-orders",
                },
                {
                    icon: AlertTriangle,
                    label: "Khiếu nại",
                    href: "/provider/complaints",
                },
            ],
        },
        {
            title: "TÀI CHÍNH",
            items: [
                {
                    icon: Wallet,
                    label: "Ví Nhà Cung Cấp",
                    href: "/provider/wallet",
                },
                {
                    icon: BarChart3,
                    label: "Doanh thu",
                    href: "/provider/revenue",
                },
            ],
        },
    ],
};
