import {
    LayoutDashboard, Users, UserPlus,
    CreditCard, AlertTriangle, Wallet
} from "lucide-react";
import type { DashboardSidebarProps } from "../components/layout";

/**
 * Sidebar config for Admin Dashboard screens.
 * 3 sections: Tài khoản, Tài chính, Hệ thống
 */
export const ADMIN_SIDEBAR_CONFIG: Omit<DashboardSidebarProps, 'isCollapsed' | 'onToggle'> = {
    avatarSrc: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/frame-239353.png",
    avatarAlt: "Admin avatar",
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
                    label: "Yêu cầu hợp tác",
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
            title: "HỆ THỐNG",
            items: [
                {
                    icon: AlertTriangle,
                    label: "Khiếu nại",
                    href: "/admin/complaints",
                },
            ],
        },
    ],
};
