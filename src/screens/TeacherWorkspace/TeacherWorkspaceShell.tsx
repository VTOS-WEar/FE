import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useSidebarConfig } from "../../hooks/useSidebarConfig";
import { ChatWidget } from "../../components/ChatWidget/ChatWidget";
import { getTeacherClassesOverview } from "../../lib/api/teachers";
import { TeacherTopNavTitle } from "./teacherWorkspace";

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
  const { pathname } = useLocation();
  const sidebarConfig = useSidebarConfig();
  const [isCollapsed, toggle] = useSidebarCollapsed();
  const [chatOpen, setChatOpen] = useState(false);
  const [defaultClassId, setDefaultClassId] = useState<string>("");
  const [defaultClassName, setDefaultClassName] = useState<string>("");

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
  const showFloatingChat = pathname !== "/teacher/messages";
  const chatContextInfo = useMemo(() => ({
    icon: "🏫",
    title: defaultClassName ? `Lớp ${defaultClassName}` : "Nhóm lớp chủ nhiệm",
    status: "Đang hoạt động",
    statusColor: "#059669",
    subtitle: "Trao đổi trực tiếp với phụ huynh trong lớp",
  }), [defaultClassName]);

  useEffect(() => {
    let mounted = true;
    getTeacherClassesOverview()
      .then((overview) => {
        if (!mounted || overview.classes.length === 0) return;
        const firstClass = overview.classes[0];
        setDefaultClassId(firstClass.id);
        setDefaultClassName(firstClass.className);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="teacher-workspace nb-page flex flex-col">
      <div className="flex flex-1 flex-col lg:flex-row">
        <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 transition-all duration-300 lg:sticky lg:top-0 lg:h-screen`}>
          <DashboardSidebar {...sidebarConfig} name="Giáo viên chủ nhiệm" isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <TopNavBar>
            <TeacherTopNavTitle title={currentPageLabel} />
          </TopNavBar>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
            <div className="min-w-0">{children}</div>
          </main>
        </div>
      </div>
      {showFloatingChat && defaultClassId && (
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200 bg-[#059669] text-white shadow-soft-md transition-colors hover:bg-[#047857] lg:bottom-8 lg:right-8"
          aria-label="Mở chat lớp"
          title="Mở chat lớp"
        >
          <MessageCircle className="h-5 w-5" />
        </button>
      )}
      {showFloatingChat && defaultClassId && (
        <ChatWidget
          channelType="classgroup"
          channelId={defaultClassId}
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          contextInfo={chatContextInfo}
        />
      )}
    </div>
  );
}
