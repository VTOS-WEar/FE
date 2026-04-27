import {
    AlertTriangle,
    BarChart3,
    Building2,
    ClipboardList,
    FileText,
    LayoutDashboard,
    LifeBuoy,
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
                    children: [
                        {
                            icon: ClipboardList,
                            label: "Danh sách đơn",
                            href: "/provider/orders",
                            activeWhen: (pathname) => pathname === "/provider/orders",
                        },
                        {
                            icon: FileText,
                            label: "Chi tiết đơn",
                            activeWhen: (pathname) => pathname.startsWith("/provider/orders/"),
                        },
                        {
                            icon: BarChart3,
                            label: "Theo dõi giao hàng",
                            activeWhen: (pathname) => pathname.startsWith("/provider/orders/"),
                        },
                    ],
                },
                {
                    icon: AlertTriangle,
                    label: "Khiếu nại",
                    href: "/provider/complaints",
                    children: [
                        {
                            icon: AlertTriangle,
                            label: "Danh sách khiếu nại",
                            href: "/provider/complaints",
                        },
                    ],
                },
                {
                    icon: LifeBuoy,
                    label: "Hỗ trợ Admin",
                    href: "/provider/support",
                    children: [
                        {
                            icon: LifeBuoy,
                            label: "Danh sách ticket",
                            href: "/provider/support",
                        },
                    ],
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
                    children: [
                        {
                            icon: FileText,
                            label: "Danh sách hợp đồng",
                            href: "/provider/contracts",
                        },
                    ],
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
                    children: [
                        {
                            icon: Wallet,
                            label: "Giao dịch ví",
                            href: "/provider/wallet",
                        },
                        {
                            icon: BarChart3,
                            label: "Yêu cầu rút tiền",
                            href: "/provider/wallet",
                        },
                    ],
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
