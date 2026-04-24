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
        <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 transition-all duration-300 lg:sticky lg:top-0 lg:h-screen`}>
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
                  <BreadcrumbLink href="/admin/dashboard" className="text-base font-semibold text-[#4c5769]">
                    Trang chủ
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-base font-bold text-gray-900">Cài đặt tài khoản</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </TopNavBar>

          <main className="nb-fade-in flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
            <AccountSecuritySettings suppressHelperText />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminAccountSettings;
