import { useNavigate } from "react-router-dom";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useProviderSidebarConfig } from "../../hooks/useProviderSidebarConfig";
import { AccountSecuritySettings } from "../../components/security/AccountSecuritySettings";

function getDisplayName(): string {
    try {
        const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
        return raw ? JSON.parse(raw).fullName || "" : "";
    } catch {
        return "";
    }
}

function getOrgName(): string {
    try {
        return localStorage.getItem("vtos_org_name") || "";
    } catch {
        return "";
    }
}

export const ProviderAccountSettings = (): JSX.Element => {
    const navigate = useNavigate();
    const sidebarConfig = useProviderSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const displayName = getDisplayName();
    const orgName = getOrgName();

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("expires_in");
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
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/provider/dashboard" className="font-semibold text-[#4c5769] text-base">
                                        Trang chủ
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="font-bold text-gray-900 text-base">Tài khoản</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </TopNavBar>

                    <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        <section className="overflow-hidden rounded-[32px] border border-slate-900/70 bg-slate-950 bg-gradient-to-br from-slate-950 via-slate-800 to-fuchsia-900 px-6 py-7 text-white shadow-soft-lg lg:px-8">
                            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                                <div className="max-w-3xl">
                                    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white">
                                        Security workspace
                                    </span>
                                    <h1 className="mt-4 text-3xl font-black leading-tight text-white sm:text-4xl">
                                        Bảo vệ tài khoản vận hành của {orgName || "nhà cung cấp"}.
                                    </h1>
                                    <p className="mt-3 text-sm font-medium leading-7 text-slate-100 sm:text-base">
                                        Đây là nơi xử lý mật khẩu và bảo mật hai lớp. Mục tiêu là giữ cho tài khoản vận hành ổn định, dễ truy cập đúng người, và khó bị gián đoạn khi có sự cố xác thực.
                                    </p>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2 lg:w-[320px]">
                                    <div className="rounded-[22px] border border-white/10 bg-white/8 p-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">Người dùng</p>
                                        <p className="mt-2 text-xl font-black text-white">{displayName || "Chưa có tên"}</p>
                                    </div>
                                    <div className="rounded-[22px] border border-white/10 bg-white/8 p-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">Tổ chức</p>
                                        <p className="mt-2 text-xl font-black text-white">{orgName || "Chưa có tên"}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <AccountSecuritySettings />
                    </main>
                </div>
            </div>
        </div>
    );
};

export default ProviderAccountSettings;
