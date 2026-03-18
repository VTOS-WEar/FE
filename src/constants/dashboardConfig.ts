import type { DashboardSidebarProps } from "../components/layout";

/**
 * Sidebar config cho tất cả Dashboard screens
 * Thay đổi ở đây sẽ ảnh hưởng tất cả screens
 */
export const DASHBOARD_SIDEBAR_CONFIG: Omit<DashboardSidebarProps, 'isCollapsed' | 'onToggle'> = {
    avatarSrc: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/frame-239353.png",
    avatarAlt: "School logo",
    greeting: "Xin chào!",
    name: "",
    topNavItems: [
        {
            icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/material-symbols-dashboard-rounded.svg",
            label: "Tổng quan",
            href: "/school/dashboard",
        },
    ],
    navSections: [
        {
            title: "QUẢN LÝ",
            items: [
                {
                    icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/material-symbols-school.svg",
                    label: "Hồ sơ trường",
                    href: "/school/profile",
                },
                {
                    icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/mdi-people-group.svg",
                    label: "Danh sách học sinh",
                    href: "/school/students",
                },
                {
                    icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/fluent-clothes-hanger-12-filled.svg",
                    label: "Đồng phục",
                    href: "/school/uniforms",
                },
                {
                    icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/ri-bill-fill.svg",
                    label: "Mở đơn",
                    href: "/school/campaigns",
                },
                {
                    icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/ri-bill-fill.svg",
                    label: "Hợp đồng",
                    href: "/school/contracts",
                },
                {
                    icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/ri-bill-fill.svg",
                    label: "Đơn sản xuất",
                    href: "/school/production-orders",
                },
                {
                    icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/material-symbols-shopping-bag.svg",
                    label: "Khiếu nại",
                    href: "/school/complaints",
                },
                {
                    icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/material-symbols-shopping-bag.svg",
                    label: "💰 Ví trường học",
                    href: "/school/wallet",
                },
                {
                    icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/ri-bill-fill.svg",
                    label: "Phân phối đồng phục",
                },
                {
                    icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/material-symbols-shopping-bag.svg",
                    label: "Đơn hàng",
                    href: "/school/orders",
                },
            ],
        },
        {
            title: "HỆ THỐNG",
            items: [
                {
                    icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/tdesign-setting-1-filled.svg",
                    label: "Cấu hình",
                },
            ],
        },
    ],
};
