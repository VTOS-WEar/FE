import {
    LayoutDashboard, Users, Shirt, School,
    Megaphone, FileText, Factory,
    AlertTriangle, ShoppingBag, Wallet
} from "lucide-react";
import type { DashboardSidebarProps } from "../components/layout";

/**
 * Sidebar config for School Dashboard screens.
 * 4 sections: Quản lý, Kinh doanh, Vận hành, Tài chính
 */
export const DASHBOARD_SIDEBAR_CONFIG: Omit<DashboardSidebarProps, 'isCollapsed' | 'onToggle'> = {
    avatarSrc: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/frame-239353.png",
    avatarAlt: "School logo",
    greeting: "Xin chào!",
    name: "",
    topNavItems: [
        {
            icon: LayoutDashboard,
            label: "Tổng quan",
            href: "/school/dashboard",
        },
    ],
    navSections: [
        {
            title: "QUẢN LÝ",
            items: [
                {
                    icon: Users,
                    label: "Học sinh",
                    href: "/school/students",
                },
                {
                    icon: Shirt,
                    label: "Đồng phục",
                    href: "/school/uniforms",
                },
                {
                    icon: School,
                    label: "Hồ sơ trường",
                    href: "/school/profile",
                },
            ],
        },
        {
            title: "KINH DOANH",
            items: [
                {
                    icon: Megaphone,
                    label: "Chiến dịch",
                    href: "/school/campaigns",
                },
                {
                    icon: FileText,
                    label: "Hợp đồng",
                    href: "/school/contracts",
                },
                {
                    icon: Factory,
                    label: "Đơn sản xuất",
                    href: "/school/production-orders",
                },
            ],
        },
        {
            title: "VẬN HÀNH",
            items: [
                {
                    icon: AlertTriangle,
                    label: "Khiếu nại",
                    href: "/school/complaints",
                },
                {
                    icon: ShoppingBag,
                    label: "Đơn hàng",
                    href: "/school/orders",
                },
            ],
        },
        {
            title: "TÀI CHÍNH",
            items: [
                {
                    icon: Wallet,
                    label: "Ví trường học",
                    href: "/school/wallet",
                },
            ],
        },
    ],
};
