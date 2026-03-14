import type { DashboardSidebarProps } from "../components/layout";

/**
 * Sidebar config for Provider Dashboard screens.
 * Items match the Provider use cases from the plan.
 */
export const PROVIDER_SIDEBAR_CONFIG: Omit<DashboardSidebarProps, 'isCollapsed' | 'onToggle'> = {
    avatarSrc: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/frame-239353.png",
    avatarAlt: "Provider logo",
    greeting: "Xin chào!",
    name: "",
    topNavItems: [
        {
            icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/material-symbols-dashboard-rounded.svg",
            label: "Tổng quan",
            href: "/provider/dashboard",
        },
    ],
    navSections: [
        {
            title: "QUẢN LÝ",
            items: [
                {
                    icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/material-symbols-school.svg",
                    label: "Hồ sơ nhà cung cấp",
                    href: "/provider/profile",
                },
                {
                    icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/ri-bill-fill.svg",
                    label: "Hợp đồng",
                    href: "/provider/contracts",
                },
                {
                    icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/fluent-clothes-hanger-12-filled.svg",
                    label: "Đơn sản xuất",
                    href: "/provider/production-orders",
                },
                {
                    icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/material-symbols-shopping-bag.svg",
                    label: "Khiếu nại",
                    href: "/provider/complaints",
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
