import { LockKeyhole, ShieldCheck, ShieldEllipsis } from "lucide-react";
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
import { AccountSecuritySettings } from "../../components/security/AccountSecuritySettings";
import { useAdminSidebarConfig } from "../../hooks/useAdminSidebarConfig";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";

function getDisplayName(): string {
    try {
        const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
        return raw ? JSON.parse(raw).fullName || "" : "";
    } catch {
        return "";
    }
}

export const AdminAccountSettings = (): JSX.Element => {
    const navigate = useNavigate();
    const sidebarConfig = useAdminSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const displayName = getDisplayName();

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
                    <DashboardSidebar
                        {...sidebarConfig}
                        name={displayName || "Quản trị viên"}
                        orgName="Admin workspace"
                        isCollapsed={isCollapsed}
                        onToggle={toggle}
                        onLogout={handleLogout}
                    />
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                    <TopNavBar>
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/admin/dashboard" className="font-semibold text-[#4c5769] text-base">
                                        Trang chủ
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="font-bold text-gray-900 text-base">
                                        Cài đặt tài khoản
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </TopNavBar>

                    <main className="nb-fade-in flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        <section className="nb-card-static overflow-hidden p-0">
                            <div className="bg-[linear-gradient(135deg,#eef6ff_0%,#f8f4ff_55%,#ffffff_100%)] px-6 py-6 lg:px-8 lg:py-7">
                                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                                    <div className="max-w-3xl">
                                        <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-sky-700 shadow-soft-sm">
                                            <ShieldCheck className="h-4 w-4" />
                                            Admin Security
                                        </div>
                                        <h1 className="mt-4 text-[28px] font-extrabold leading-tight text-gray-900 lg:text-[32px]">
                                            Bảo mật tài khoản quản trị
                                        </h1>
                                        <p className="mt-2 text-sm font-medium leading-6 text-[#4c5769] lg:text-base">
                                            Tập trung toàn bộ thao tác nhạy cảm vào một workspace riêng: đổi mật khẩu, kiểm soát xác thực hai bước và rà soát mức độ bảo vệ hiện tại của tài khoản Admin.
                                        </p>
                                    </div>

                                    <div className="grid w-full max-w-[420px] grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div className="rounded-[20px] border border-gray-200 bg-white p-4 shadow-soft-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-2xl bg-violet-50 p-3 text-violet-700">
                                                    <LockKeyhole className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-gray-500">Mật khẩu</p>
                                                    <p className="mt-1 text-sm font-bold text-gray-900">Thay đổi qua OTP email</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="rounded-[20px] border border-gray-200 bg-white p-4 shadow-soft-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                                                    <ShieldEllipsis className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-gray-500">2FA</p>
                                                    <p className="mt-1 text-sm font-bold text-gray-900">Bật thêm lớp xác thực</p>
                                                </div>
                                            </div>
                                        </div>
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

export default AdminAccountSettings;
