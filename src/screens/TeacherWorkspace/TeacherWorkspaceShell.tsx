import { type ReactNode, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, GraduationCap } from "lucide-react";

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

  return (
    <div className="min-h-screen min-h-[100svh] bg-[#f6f7fb]">
      <div className="relative z-10 mx-auto max-w-[1280px] px-4 py-8 md:py-10 lg:px-8 nb-fade-in">
        {(showBackButton || showIdentityHeader) && (
          <div className="mb-6 flex flex-col gap-4 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                {showBackButton ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 transition-all hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại
                  </button>
                ) : null}

                {showIdentityHeader ? (
                  <>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50">
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
                  </>
                ) : null}
              </div>

              <nav className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold">
                {breadcrumbs.map((item, index) => (
                  <span key={`${item.label}-${index}`}>
                    {item.href ? (
                      <a href={item.href} className="rounded-full bg-[#f4f7fb] px-3 py-1.5 text-[#4c5769] transition-colors hover:bg-[#eaf4ff] hover:text-gray-900">
                        {item.label}
                      </a>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-800">{item.label}</span>
                    )}
                  </span>
                ))}
              </nav>
            </div>
          </div>
        )}

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
