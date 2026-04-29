import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useSidebarConfig } from "../../hooks/useSidebarConfig";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type TeacherWorkspaceShellProps = {
  children: ReactNode;
  breadcrumbs: BreadcrumbItem[];
};

export function TeacherWorkspaceShell({
  children,
  breadcrumbs,
}: TeacherWorkspaceShellProps): JSX.Element {
  const navigate = useNavigate();
  const sidebarConfig = useSidebarConfig();
  const [isCollapsed, toggle] = useSidebarCollapsed();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    localStorage.removeItem("expires_in");
    localStorage.removeItem("vtos_org_name");
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("expires_in");
    navigate("/signin", { replace: true });
  };

  const currentPageLabel = breadcrumbs[breadcrumbs.length - 1]?.label || "Teacher workspace";

  return (
    <div className="nb-page flex flex-col">
      <div className="flex flex-1 flex-col lg:flex-row">
        <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 transition-all duration-300 lg:sticky lg:top-0 lg:h-screen`}>
          <DashboardSidebar {...sidebarConfig} name="Teacher workspace" isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <TopNavBar>
            <div className="flex items-center gap-2 px-2 py-2">
              <LayoutDashboard className="h-5 w-5 text-[#2563EB]" />
              <h1 className="text-xl font-bold text-gray-900">{currentPageLabel}</h1>
            </div>
          </TopNavBar>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
            <div className="min-w-0">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
