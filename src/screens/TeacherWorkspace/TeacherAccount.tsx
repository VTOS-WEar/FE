import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, LogOut, Mail, Shield } from "lucide-react";
import { AccountSecuritySettings } from "../../components/security/AccountSecuritySettings";
import { getTeacherDashboard } from "../../lib/api/teachers";
import type { TeacherDashboardDto } from "../../lib/api/teachers";
import { TeacherWorkspaceShell } from "./TeacherWorkspaceShell";

export const TeacherAccount = (): JSX.Element => {
    const navigate = useNavigate();
    const [dashboard, setDashboard] = useState<TeacherDashboardDto | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    useEffect(() => {
        getTeacherDashboard()
            .then(setDashboard)
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
        <TeacherWorkspaceShell
            breadcrumbs={[{ label: "Teacher workspace", href: "/teacher/dashboard" }, { label: "Tài khoản" }]}
        >
            {error && (
                <section className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-soft-md">
                    <p className="text-base font-bold text-red-600">{error}</p>
                </section>
            )}

            {!error && (
                <>
                    <section className="grid gap-4 xl:grid-cols-[0.92fr_1.48fr]">
                        <div className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-soft-md">
                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                                    <GraduationCap className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Hồ sơ</p>
                                    <h2 className="text-xl font-extrabold text-gray-900">{dashboard?.teacherName || "Giáo viên chủ nhiệm"}</h2>
                                </div>
                            </div>
                            <div className="mt-5 space-y-3 rounded-2xl bg-[#f4fffb] p-4 text-sm font-semibold text-[#4c5769]">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-emerald-600" />
                                    <span>{dashboard?.teacherEmail || "Chưa có email"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4 text-emerald-600" />
                                    <span>{dashboard?.totalClasses || 0} lớp đang phụ trách</span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-soft-md">
                            <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 md:flex-row md:items-start md:justify-between">
                                <div>
                                    <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-sky-700">
                                        <Shield className="h-4 w-4" />
                                        Tài khoản và bảo mật
                                    </div>
                                    <h2 className="mt-4 text-[24px] font-extrabold leading-tight text-gray-900">Cài đặt tài khoản giáo viên</h2>
                                    <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[#4c5769]">
                                        Gộp đăng xuất, đổi mật khẩu, và xác thực 2 bước vào cùng một khu vực để tránh trùng lặp với phần thông tin hồ sơ.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="inline-flex items-center justify-center gap-2 self-start rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800 transition-all hover:border-red-300 hover:bg-red-100"
                                >
                                    <LogOut className={`h-[18px] w-[18px] ${isLoggingOut ? "animate-spin" : ""}`} />
                                    {isLoggingOut ? "Đang xuất..." : "Đăng xuất"}
                                </button>
                            </div>

                            <div className="mt-5">
                                <AccountSecuritySettings />
                            </div>
                        </div>
                    </section>

                </>
            )}
        </TeacherWorkspaceShell>
    );
};
