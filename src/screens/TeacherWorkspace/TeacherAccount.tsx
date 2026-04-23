import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { AccountSecuritySettings } from "../../components/security/AccountSecuritySettings";
import { getTeacherDashboard } from "../../lib/api/teachers";
import { TeacherWorkspaceShell } from "./TeacherWorkspaceShell";

export const TeacherAccount = (): JSX.Element => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    getTeacherDashboard()
      .then(() => undefined)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Không thể tải thông tin tài khoản"));
  }, []);

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      ["access_token", "user", "expires_in"].forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      navigate("/signin", { replace: true });
    }, 300);
  };

  return (
    <TeacherWorkspaceShell breadcrumbs={[{ label: "Teacher workspace", href: "/teacher/dashboard" }, { label: "Tài khoản" }]}>
      {error ? (
        <section className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-soft-md">
          <p className="text-base font-bold text-red-600">{error}</p>
        </section>
      ) : (
        <>
          <section className="flex justify-end">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800 transition-all hover:border-red-300 hover:bg-red-100"
            >
              <LogOut className={`h-[18px] w-[18px] ${isLoggingOut ? "animate-spin" : ""}`} />
              {isLoggingOut ? "Đang xuất..." : "Đăng xuất"}
            </button>
          </section>

          <AccountSecuritySettings />
        </>
      )}
    </TeacherWorkspaceShell>
  );
};
