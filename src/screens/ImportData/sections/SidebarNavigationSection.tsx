import { DashboardSidebar } from "../../../components/layout";
import type { DashboardSidebarProps } from "../../../components/layout";

const AVATAR_SRC = "https://c.animaapp.com/mlsaxpa0EQIM7j/img/frame-239353.png";

const TOP_NAV: DashboardSidebarProps["topNavItems"] = [
    {
        icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/material-symbols-dashboard-rounded.svg",
        label: "Tổng quan",
    },
];

const NAV_SECTIONS: DashboardSidebarProps["navSections"] = [
    {
        title: "QUẢN LÝ",
        items: [
            {
                icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/material-symbols-school.svg",
                label: "Hồ sơ trường",
                active: true,
            },
            {
                icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/mdi-people-group.svg",
                label: "Danh sách học sinh",
            },
            {
                icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/fluent-clothes-hanger-12-filled.svg",
                label: "Đồng phục",
            },
            {
                icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/ri-bill-fill.svg",
                label: "Mở đơn",
            },
            {
                icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/ri-bill-fill.svg",
                label: "Phân phối đồng phục",
            },
            {
                icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/material-symbols-shopping-bag.svg",
                label: "Đơn hàng",
                badge: "1",
            },
        ],
    },
];

interface SidebarNavigationSectionProps {
    isCollapsed: boolean;
    onToggle: () => void;
}

export const SidebarNavigationSection = ({ isCollapsed, onToggle }: SidebarNavigationSectionProps): JSX.Element => {
    return (
        <DashboardSidebar
            isCollapsed={isCollapsed}
            onToggle={onToggle}
            avatarSrc={AVATAR_SRC}
            avatarAlt="School logo"
            greeting="Xin chào!"
            name="Trường Tiểu học FPT"
            topNavItems={TOP_NAV}
            navSections={NAV_SECTIONS}
        />
    );
};
