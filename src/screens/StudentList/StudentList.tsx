import { useState } from "react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { DashboardSidebar, Footer } from "../../components/layout";
import type { DashboardSidebarProps } from "../../components/layout";
import { DivSubsection } from "./sections/DivSubsection";
import { DivWrapperSubsection } from "./sections/DivWrapperSubsection";
import { FrameWrapperSubsection } from "./sections/FrameWrapperSubsection";

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
            },
            {
                icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/mdi-people-group.svg",
                label: "Danh sách học sinh",
                active: true,
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
    {
        title: "HỆ THỐNG",
        items: [
            {
                icon: "https://c.animaapp.com/mlsaxpa0EQIM7j/img/tdesign-setting-1-filled.svg",
                label: "Cấu hình",
            },
        ],
    },
];

export const StudentListV2 = (): JSX.Element => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="bg-[#f6f7f8] w-full min-h-screen flex flex-col">
            {/* Sidebar + Content */}
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[20rem] xl:w-[23.75rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar
                        isCollapsed={isCollapsed}
                        onToggle={() => setIsCollapsed(prev => !prev)}
                        avatarSrc={AVATAR_SRC}
                        avatarAlt="School logo"
                        greeting="Xin chào!"
                        name="Trường Tiểu học FPT"
                        topNavItems={TOP_NAV}
                        navSections={NAV_SECTIONS}
                    />
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                    {/* Breadcrumb header */}
                    <div className="px-4 sm:px-6 lg:px-8 py-6">
                        <Breadcrumb>
                            <BreadcrumbList className="gap-2.5">
                                <BreadcrumbItem>
                                    <BreadcrumbLink className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4c5769] text-base">
                                        Trang chủ
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="[font-family:'Montserrat',Helvetica] font-semibold text-[#cac9d6] text-base">
                                    /
                                </BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="[font-family:'Montserrat',Helvetica] font-semibold text-black text-base">
                                        Danh sách học sinh
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>

                    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-4 lg:py-8 space-y-6">
                        <FrameWrapperSubsection />
                        <DivWrapperSubsection />
                        <DivSubsection />
                    </main>
                </div>
            </div>

            {/* Footer full width */}
            <Footer />
        </div>
    );
};
