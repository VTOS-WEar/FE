import { useEffect, useState } from "react";
import { Eye, EyeOff, KeyRound, Mail, Shield, ShieldAlert, ShieldCheck, ShieldOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getParentProfile } from "../../lib/api/users";
import { getSchoolProfile } from "../../lib/api/schools";
import { getProviderProfile } from "../../lib/api/providers";
import { changePassword, disable2FA, requestChangePasswordOtp } from "../../lib/api/auth";

export const AccountSecuritySettings = ({
  suppressHelperText = false,
}: {
  suppressHelperText?: boolean;
}): JSX.Element => {
  const navigate = useNavigate();
  const getToken = () => localStorage.getItem("access_token") || sessionStorage.getItem("access_token") || "";

  const [is2FAEnabled, setIs2FAEnabled] = useState<boolean | null>(localStorage.getItem("vtos_2fa_enabled") === "true");
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [disable2FACode, setDisable2FACode] = useState("");
  const [disabling2FA, setDisabling2FA] = useState(false);
  const [disable2FAMsg, setDisable2FAMsg] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [otpRequestMsg, setOtpRequestMsg] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [changePasswordMsg, setChangePasswordMsg] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
        let twoFAEnabled = false;

        try {
          const user = raw ? JSON.parse(raw) : {};
          if (user.role === "School") {
            const profile = await getSchoolProfile();
            twoFAEnabled = !!(profile.twoFactorEnabled ?? (profile as any).TwoFactorEnabled);
          } else if (user.role === "Provider") {
            const profile = await getProviderProfile();
            twoFAEnabled = !!(profile.twoFactorEnabled ?? (profile as any).TwoFactorEnabled);
          } else if (user.role === "Admin") {
            const twoFA = localStorage.getItem("vtos_2fa_enabled");
            twoFAEnabled = twoFA === "true";
          } else {
            const profile = await getParentProfile();
            twoFAEnabled = profile.twoFactorEnabled ?? false;
          }
        } catch {
          const twoFA = localStorage.getItem("vtos_2fa_enabled");
          twoFAEnabled = twoFA === "true";
        }

        setIs2FAEnabled(twoFAEnabled);
        localStorage.setItem("vtos_2fa_enabled", twoFAEnabled ? "true" : "false");
      } catch {
        const twoFA = localStorage.getItem("vtos_2fa_enabled");
        setIs2FAEnabled(twoFA === "true");
      }
    };

    void fetchProfile();
  }, []);

  const protectionLabel =
    is2FAEnabled === null ? "Đang kiểm tra bảo mật" : is2FAEnabled ? "Tài khoản đã bật 2FA" : "Tài khoản đang dùng bảo vệ cơ bản";
  const protectionCopy =
    is2FAEnabled === null
      ? "Đang đồng bộ trạng thái bảo mật."
      : is2FAEnabled
        ? "2FA đang hoạt động."
        : "Tài khoản hiện chỉ dùng mật khẩu.";

  const handleRequestOtp = async () => {
    setRequestingOtp(true);
    setOtpRequestMsg("");
    setChangePasswordMsg("");

    try {
      const token = getToken();
      await requestChangePasswordOtp(token);
      setOtpSent(true);
      setOtpRequestMsg("Đã gửi mã OTP đến email của bạn.");
    } catch (err: any) {
      setOtpRequestMsg(err?.message || "Không thể gửi OTP.");
    } finally {
      setRequestingOtp(false);
    }
  };

  const handleChangePassword = async () => {
    if (!otp || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      setChangePasswordMsg("Mật khẩu mới không khớp.");
      return;
    }

    setChangingPassword(true);
    setChangePasswordMsg("");

    try {
      const token = getToken();
      await changePassword({ otp, newPassword, confirmPassword }, token);
      setChangePasswordMsg("Đổi mật khẩu thành công.");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setOtpSent(false);
    } catch (err: any) {
      setChangePasswordMsg(err?.message || "Không thể đổi mật khẩu.");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDisable2FA = async () => {
    if (disable2FACode.length !== 6) return;

    setDisabling2FA(true);
    setDisable2FAMsg("");

    try {
      const token = getToken();
      await disable2FA(disable2FACode, token);
      setIs2FAEnabled(false);
      localStorage.setItem("vtos_2fa_enabled", "false");
      setShowDisable2FA(false);
      setDisable2FACode("");
      setDisable2FAMsg("Đã tắt 2FA.");
    } catch (err: any) {
      setDisable2FAMsg(err?.message || "Mã không hợp lệ.");
    } finally {
      setDisabling2FA(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-soft-sm lg:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div
              className={`rounded-[20px] p-3 ${
                is2FAEnabled === null
                  ? "bg-gray-100 text-gray-500"
                  : is2FAEnabled
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
              }`}
            >
              {is2FAEnabled === null ? (
                <Shield className="h-5 w-5" />
              ) : is2FAEnabled ? (
                <ShieldCheck className="h-5 w-5" />
              ) : (
                <ShieldOff className="h-5 w-5" />
              )}
            </div>

            <div className="max-w-3xl">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">Bảo mật tài khoản</p>
              <h1 className="mt-2 text-2xl font-black text-gray-900">{protectionLabel}</h1>
              {!suppressHelperText && <p className="mt-2 text-sm font-medium leading-7 text-[#4c5769]">{protectionCopy}</p>}
            </div>
          </div>

          <div
            className={`rounded-[20px] border px-4 py-3 text-sm font-extrabold ${
              is2FAEnabled === null
                ? "border-gray-200 bg-gray-50 text-gray-600"
                : is2FAEnabled
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            {is2FAEnabled === null ? "Đang tải trạng thái 2FA" : is2FAEnabled ? "2FA đang bật" : "2FA đang tắt"}
          </div>
        </div>

        <div className="mt-6 space-y-4 border-t border-gray-100 pt-5">
          <div className="flex items-start gap-3">
            <div className={`rounded-2xl p-3 ${is2FAEnabled ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
              {is2FAEnabled ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Xác thực 2 bước</p>
              <h2 className="mt-2 text-2xl font-black text-gray-900">Quản lý 2FA</h2>
            </div>
          </div>

          <div
            className={`rounded-[22px] border p-5 ${
              is2FAEnabled ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"
            }`}
          >
            <p className="text-sm font-extrabold text-gray-900">{is2FAEnabled ? "2FA hiện đang bật" : "2FA hiện chưa bật"}</p>
            {!suppressHelperText && (
              <p className="mt-1 text-sm font-medium leading-6 text-[#5b6475]">{is2FAEnabled ? "Khuyến nghị giữ nguyên." : "Khuyến nghị bật 2FA."}</p>
            )}
          </div>

          {is2FAEnabled === null ? (
            <div className="h-24 animate-pulse rounded-[18px] border border-gray-200 bg-gray-100" />
          ) : is2FAEnabled ? (
            <div className="space-y-4">
              <div className="rounded-[18px] bg-red-50 p-4">
                <p className="text-sm font-extrabold text-red-900">Tắt 2FA là thao tác nhạy cảm</p>
                <button
                  onClick={() => setShowDisable2FA((current) => !current)}
                  className="nb-btn nb-btn-outline mt-4 text-sm !border-red-300 !text-red-800 hover:!bg-red-100"
                >
                  {showDisable2FA ? "Đóng xác nhận tắt 2FA" : "Mở xác nhận tắt 2FA"}
                </button>
              </div>

              {showDisable2FA ? (
                <div className="space-y-4 border-t border-gray-100 pt-4">
                  <FieldGroup label="Mã xác thực 6 chữ số">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={disable2FACode}
                      onChange={(event) => {
                        if (/^\d*$/.test(event.target.value)) setDisable2FACode(event.target.value);
                      }}
                      placeholder="000000"
                      className="nb-input h-11 max-w-[180px] text-center font-mono text-lg tracking-widest"
                    />
                  </FieldGroup>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      onClick={handleDisable2FA}
                      disabled={disabling2FA || disable2FACode.length !== 6}
                      className="nb-btn text-sm !border-gray-200 !bg-red-800 !text-white disabled:opacity-50"
                    >
                      {disabling2FA ? "Đang xử lý..." : "Xác nhận tắt 2FA"}
                    </button>
                    <button
                      onClick={() => {
                        setShowDisable2FA(false);
                        setDisable2FACode("");
                        setDisable2FAMsg("");
                      }}
                      className="nb-btn nb-btn-outline text-sm"
                    >
                      Hủy
                    </button>
                  </div>

                  {disable2FAMsg ? (
                    <InlineMessage
                      className={disable2FAMsg.startsWith("Đã") ? "text-emerald-700" : "text-red-700"}
                      message={disable2FAMsg}
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
              <button onClick={() => navigate("/2fa-setup")} className="nb-btn nb-btn-purple text-sm">
                Bật 2FA
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-soft-sm lg:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-violet-50 p-3 text-violet-700">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Đổi mật khẩu</p>
            <h2 className="mt-2 text-2xl font-black text-gray-900">Cập nhật mật khẩu đăng nhập</h2>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <SimpleStep
            title="1. Gửi mã OTP"
            description="Nhận mã qua email."
            active={!otpSent}
            suppressHelperText={suppressHelperText}
          />
          <SimpleStep
            title="2. Xác nhận mật khẩu mới"
            description="Nhập OTP và mật khẩu mới."
            active={otpSent}
            suppressHelperText={suppressHelperText}
          />
        </div>

        <div className="mt-6 space-y-4 border-t border-gray-100 pt-5">
          {!otpSent ? (
            <div className="rounded-[16px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="inline-flex items-center gap-3">
                  <div className="rounded-2xl bg-white p-2.5 text-sky-700 shadow-soft-sm">
                    <Mail className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-gray-900">Gửi OTP đến email</p>
                    <p className="text-xs font-semibold text-slate-500">Nhấn nút để nhận mã xác thực 6 chữ số.</p>
                  </div>
                </div>
                <button
                  onClick={handleRequestOtp}
                  disabled={requestingOtp}
                  className="group relative inline-flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-[12px] border border-gray-200 bg-gradient-to-r from-[#7C63E6] via-[#8F79EB] to-[#6F56E0] px-5 text-sm font-extrabold text-white shadow-[0_8px_18px_rgba(124,99,230,0.25)] transition-all duration-200 hover:-translate-y-[1px] hover:brightness-110 hover:shadow-[0_12px_24px_rgba(124,99,230,0.32)] active:translate-y-0 active:shadow-[0_7px_14px_rgba(124,99,230,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:w-auto"
                >
                  <span className="pointer-events-none absolute -left-10 top-0 h-full w-14 -skew-x-12 bg-white/25 blur-[1px] transition-all duration-300 group-hover:left-[110%]" />
                  {requestingOtp ? "Đang gửi..." : "Yêu cầu mã OTP"}
                </button>
              </div>
              {otpRequestMsg ? (
                <InlineMessage
                  className={`mt-3 ${otpRequestMsg.startsWith("Đã") ? "text-emerald-700" : "text-red-700"}`}
                  message={otpRequestMsg}
                />
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-[16px] bg-violet-50 px-4 py-3 text-sm font-bold text-violet-700">
                OTP đã được gửi.
              </div>

              <FieldGroup label="Mật khẩu mới">
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="Nhập mật khẩu mới"
                    className="nb-input h-11 w-full pr-11 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((current) => !current)}
                    className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-gray-500 transition hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                    aria-label={showNewPassword ? "Ẩn mật khẩu mới" : "Hiện mật khẩu mới"}
                  >
                    {showNewPassword ? <Eye className="h-4.5 w-4.5" /> : <EyeOff className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </FieldGroup>

              <FieldGroup label="Xác nhận mật khẩu mới">
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="nb-input h-11 w-full pr-11 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-gray-500 transition hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                    aria-label={showConfirmPassword ? "Ẩn xác nhận mật khẩu mới" : "Hiện xác nhận mật khẩu mới"}
                  >
                    {showConfirmPassword ? <Eye className="h-4.5 w-4.5" /> : <EyeOff className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </FieldGroup>

              <FieldGroup label="Mã OTP">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(event) => {
                    if (/^\d*$/.test(event.target.value)) setOtp(event.target.value);
                  }}
                  placeholder="Nhập mã OTP 6 chữ số"
                  className="nb-input h-11 w-full text-sm"
                />
              </FieldGroup>

              <div className="grid w-full gap-3 sm:grid-cols-2">
                <button
                  onClick={handleChangePassword}
                  disabled={changingPassword || !otp || !newPassword || !confirmPassword}
                  className="group relative inline-flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-[12px] border border-gray-200 bg-gradient-to-r from-[#7C63E6] via-[#8F79EB] to-[#6F56E0] px-5 text-sm font-extrabold text-white shadow-[0_8px_18px_rgba(124,99,230,0.25)] transition-all duration-200 hover:-translate-y-[1px] hover:brightness-110 hover:shadow-[0_12px_24px_rgba(124,99,230,0.32)] active:translate-y-0 active:shadow-[0_7px_14px_rgba(124,99,230,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  <span className="pointer-events-none absolute -left-10 top-0 h-full w-14 -skew-x-12 bg-white/25 blur-[1px] transition-all duration-300 group-hover:left-[110%]" />
                  {changingPassword ? "Đang xử lý..." : "Đổi mật khẩu"}
                </button>
                <button
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setOtpRequestMsg("");
                    setChangePasswordMsg("");
                  }}
                  className="nb-btn nb-btn-outline h-11 w-full text-sm"
                >
                  Hủy luồng OTP
                </button>
              </div>

              {changePasswordMsg ? (
                <InlineMessage
                  className={changePasswordMsg.startsWith("Đổi") ? "text-emerald-700" : "text-red-700"}
                  message={changePasswordMsg}
                />
              ) : null}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const FieldGroup = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="mb-1.5 block text-sm font-bold text-gray-900">{label}</label>
    {children}
  </div>
);

const SimpleStep = ({
  title,
  description,
  active,
  suppressHelperText = false,
}: {
  title: string;
  description: string;
  active: boolean;
  suppressHelperText?: boolean;
}) => (
  <div className={`rounded-[16px] border px-4 py-3 ${active ? "border-violet-200 bg-violet-50" : "border-gray-200 bg-slate-50"}`}>
    <p className="text-sm font-extrabold text-gray-900">{title}</p>
    {!suppressHelperText && <p className="mt-1 text-sm font-medium text-[#5b6475]">{description}</p>}
  </div>
);

const InlineMessage = ({ className, message }: { className: string; message: string }) => (
  <p className={`text-sm font-bold ${className}`}>{message}</p>
);
