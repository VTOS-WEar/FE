import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AccountSecuritySettings } from "../../components/security/AccountSecuritySettings";
import { getTeacherDashboard } from "../../lib/api/teachers";
import { TeacherWorkspaceShell } from "./TeacherWorkspaceShell";

export const TeacherAccount = (): JSX.Element => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTeacherDashboard()
      .then(() => undefined)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Không thể tải thông tin tài khoản"));
  }, []);

  return (
    <TeacherWorkspaceShell breadcrumbs={[{ label: "Teacher workspace", href: "/teacher/dashboard" }, { label: "Tài khoản" }]}>
      {error ? (
        <section className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-soft-md">
          <p className="text-base font-bold text-red-600">{error}</p>
        </section>
      ) : (
        <AccountSecuritySettings />
      )}
    </TeacherWorkspaceShell>
  );
};
