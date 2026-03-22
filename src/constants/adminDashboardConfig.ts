import {
    LayoutDashboard, Users, ShieldCheck, UserPlus,
    CreditCard, Landmark, AlertTriangle
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
                    icon: ShieldCheck,
                    label: "Xác minh tài khoản",
                    href: "/admin/verification",
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
                    icon: Landmark,
                    label: "Phân phối tiền",
                    href: "/admin/money",
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
