import type { DashboardSidebarProps } from "../components/layout";

/**
 * Sidebar config for Admin Dashboard screens.
 * 4 items: Tổng quan, Người dùng, Xác minh, Phân phối tiền
 */
export const ADMIN_SIDEBAR_CONFIG: Omit<DashboardSidebarProps, 'isCollapsed' | 'onToggle'> = {
    avatarSrc: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/frame-239353.png",
    avatarAlt: "Admin avatar",
    greeting: "Xin chào,",
    name: "Quản trị viên",
    topNavItems: [
        {
            icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/material-symbols-dashboard-rounded.svg",
            label: "Tổng quan",
            href: "/admin/dashboard",
        },
    ],
    navSections: [
        {
            title: "QUẢN LÝ",
            items: [
                {
                    icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/mdi-people-group.svg",
                    label: "Người dùng",
                    href: "/admin/users",
                },
                {
                    icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/ri-bill-fill.svg",
                    label: "Xác minh tài khoản",
                    href: "/admin/verification",
                },
                {
                    icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/material-symbols-shopping-bag.svg",
                    label: "Phân phối tiền",
                    href: "/admin/money",
                },
            ],
        },
    ],
};
