import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useNavigate } from "react-router-dom";
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useProviderSidebarConfig } from "../../hooks/useProviderSidebarConfig";
import { AccountSecuritySettings } from "../../components/security/AccountSecuritySettings";

function getDisplayName(): string {
    try {
        const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
        return raw ? JSON.parse(raw).fullName || "" : "";
    } catch { return ""; }
}

function getOrgName(): string {
    try { return localStorage.getItem("vtos_org_name") || ""; } catch { return ""; }
}

export const ProviderAccountSettings = (): JSX.Element => {
    const navigate = useNavigate();
    const sidebarConfig = useProviderSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const displayName = getDisplayName();
    const orgName = getOrgName();

    const handleLogout = () => {
        localStorage.removeItem("access_token"); localStorage.removeItem("user"); localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token"); sessionStorage.removeItem("user"); sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} name={displayName} orgName={orgName} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                    <TopNavBar>
                        <Breadcrumb><BreadcrumbList>
                            <BreadcrumbItem><BreadcrumbLink href="/provider/dashboard" className="font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                            <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                            <BreadcrumbItem><BreadcrumbPage className="font-bold text-gray-900 text-base">Cài đặt tài khoản</BreadcrumbPage></BreadcrumbItem>
                        </BreadcrumbList></Breadcrumb>
                    </TopNavBar>

                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6 nb-fade-in">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="font-extrabold text-gray-900 text-[28px] lg:text-[32px] leading-tight">🔐 Cài đặt tài khoản</h1>
                                <p className="mt-1 font-medium text-[#4c5769] text-sm lg:text-base">Quản lý bảo mật và mật khẩu tài khoản.</p>
                            </div>
                        </div>
                        <AccountSecuritySettings />
                    </main>
                </div>
            </div>
        </div>
    );
};

export default ProviderAccountSettings;
