import { type ReactNode, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, GraduationCap, LayoutDashboard, UserCircle } from "lucide-react";
import { ClassGroupChatLauncher } from "../../components/ChatWidget/ClassGroupChatLauncher";
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
  showBackButton?: boolean;
  showIdentityHeader?: boolean;
};

type StoredUser = {
  fullName?: string;
  email?: string;
};

export function TeacherWorkspaceShell({
  children,
  breadcrumbs,
  showBackButton = true,
  showIdentityHeader = true,
}: TeacherWorkspaceShellProps): JSX.Element {
  const navigate = useNavigate();
  const sidebarConfig = useSidebarConfig();
  const [isCollapsed, toggle] = useSidebarCollapsed();

  const user = useMemo<StoredUser | null>(() => {
    try {
      const raw = localStorage.getItem("user") ?? sessionStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/teacher/dashboard");
  };

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
            {(showBackButton || showIdentityHeader) && (
              <section className="mb-6 rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-soft-sm sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                {showBackButton ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 shadow-sm transition-all hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại
                  </button>
                ) : null}

                {showIdentityHeader ? (
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50">
                      <GraduationCap className="h-5 w-5 text-emerald-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-700">Homeroom teacher</p>
                      <p className="truncate text-base font-extrabold text-gray-900" title={user?.fullName}>
                        {user?.fullName || "Giáo viên chủ nhiệm"}
                      </p>
                      <p className="truncate text-xs font-semibold text-[#6b7280]" title={user?.email}>
                        {user?.email || "Teacher workspace"}
                      </p>
                    </div>
                  </div>
                ) : null}
                    </div>

                    <nav className="mt-4 inline-flex flex-wrap items-center gap-1 rounded-xl border border-gray-100 bg-[#f7f9fc] p-1 text-xs font-bold">
                      {breadcrumbs.map((item, index) => (
                        <span key={`${item.label}-${index}`}>
                          {item.href ? (
                            <a href={item.href} className="rounded-lg px-3 py-1.5 text-[#4c5769] transition-colors hover:bg-[#f3f6fb] hover:text-gray-900">
                              {item.label}
                            </a>
                          ) : (
                            <span className="rounded-lg bg-white px-3 py-1.5 text-emerald-800 shadow-sm">{item.label}</span>
                          )}
                        </span>
                      ))}
                    </nav>
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-2 lg:pt-1">
                    <ClassGroupChatLauncher />
                    <button
                      type="button"
                      onClick={() => navigate("/teacher/account")}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold text-gray-700 shadow-sm transition-all hover:-translate-y-[1px] hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
                      aria-label="Hồ sơ giáo viên"
                      title="Hồ sơ giáo viên"
                    >
                      <UserCircle className="h-5 w-5" />
                      <span className="hidden sm:inline">Hồ sơ</span>
                    </button>
                  </div>
                </div>
              </section>
            )}

            <div className="min-w-0">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
