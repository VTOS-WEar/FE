import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, ShieldCheck } from "lucide-react";
import { getParentProfile } from "../../lib/api/users";
import { getSchoolProfile } from "../../lib/api/schools";
import { getProviderProfile } from "../../lib/api/providers";
import { disable2FA, requestChangePasswordOtp, changePassword } from "../../lib/api/auth";

export const AccountSecuritySettings = (): JSX.Element => {
  const navigate = useNavigate();
  const getToken = () =>
    localStorage.getItem("access_token") || sessionStorage.getItem("access_token") || "";

  // 2FA state — start with cached value so UI is instant, then revalidate with API
  const [is2FAEnabled, setIs2FAEnabled] = useState<boolean | null>(
    localStorage.getItem("vtos_2fa_enabled") === "true"
  );
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [disable2FACode, setDisable2FACode] = useState("");
  const [disabling2FA, setDisabling2FA] = useState(false);
  const [disable2FAMsg, setDisable2FAMsg] = useState("");

  // Change password state
  const [otpSent, setOtpSent] = useState(false);
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [otpRequestMsg, setOtpRequestMsg] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [changePasswordMsg, setChangePasswordMsg] = useState("");

  useEffect(() => {
    // Load 2FA status from API — endpoint depends on current user's role
    const fetchProfile = async () => {
      try {
        // Read role from stored user JWT payload
        const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
        let twoFAEnabled = false;
        try {
          const user = raw ? JSON.parse(raw) : {};
          if (user.role === "School") {
            const profile = await getSchoolProfile();
            // Handle both camelCase (FE type) and PascalCase (ASP.NET response)
            twoFAEnabled = !!(profile.twoFactorEnabled ?? (profile as any).TwoFactorEnabled);
          } else if (user.role === "Provider") {
            const profile = await getProviderProfile();
            twoFAEnabled = !!(profile.twoFactorEnabled ?? (profile as any).TwoFactorEnabled);
          } else {
            // Parent / other roles
            const profile = await getParentProfile();
            twoFAEnabled = profile.twoFactorEnabled ?? false;
          }
        } catch {
          // Fallback to localStorage if user parse fails
          const twoFA = localStorage.getItem("vtos_2fa_enabled");
          twoFAEnabled = twoFA === "true";
        }
        setIs2FAEnabled(twoFAEnabled);
        localStorage.setItem("vtos_2fa_enabled", twoFAEnabled ? "true" : "false");
      } catch {
        // Fallback to localStorage if API fails
        const twoFA = localStorage.getItem("vtos_2fa_enabled");
        setIs2FAEnabled(twoFA === "true");
      }
    };
    fetchProfile();
  }, []);

  const handleRequestOtp = async () => {
    setRequestingOtp(true);
    setOtpRequestMsg("");
    try {
      const token = getToken();
      await requestChangePasswordOtp(token);
      setOtpSent(true);
      setOtpRequestMsg("✓ Mã OTP đã được gửi đến email của bạn");
    } catch (err: any) {
      setOtpRequestMsg("Lỗi: " + (err?.message || "Không thể gửi OTP"));
    } finally {
      setRequestingOtp(false);
      setTimeout(() => setOtpRequestMsg(""), 5000);
    }
  };

  const handleChangePassword = async () => {
    if (!otp || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      setChangePasswordMsg("Mật khẩu mới không khớp");
      return;
    }
    setChangingPassword(true);
    setChangePasswordMsg("");
    try {
      const token = getToken();
      await changePassword({ otp, newPassword, confirmPassword }, token);
      setChangePasswordMsg("✓ Đổi mật khẩu thành công!");
      setOtp(""); setNewPassword(""); setConfirmPassword(""); setOtpSent(false);
    } catch (err: any) {
      setChangePasswordMsg("Lỗi: " + (err?.message || "Không thể đổi mật khẩu"));
    } finally {
      setChangingPassword(false);
      setTimeout(() => setChangePasswordMsg(""), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <div className="nb-card-static p-6">
        <h3 className="font-extrabold text-[#1A1A2E] text-base mb-4">Đổi mật khẩu</h3>
        <div className="space-y-4 max-w-md">
          {!otpSent ? (
            <>
              <p className="font-medium text-[#6B7280] text-sm">
                Nhấn nút dưới để nhận mã OTP qua email và tiến hành đổi mật khẩu.
              </p>
              <button
                onClick={handleRequestOtp}
                disabled={requestingOtp}
                className="nb-btn nb-btn-purple text-sm disabled:opacity-50"
              >
                {requestingOtp ? "Đang gửi..." : "Yêu cầu mã OTP ✦"}
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="font-bold text-[#1A1A2E] text-sm mb-1.5 block">Mã OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={e => { if (/^\d*$/.test(e.target.value)) setOtp(e.target.value); }}
                  placeholder="Nhập mã OTP 6 chữ số"
                  className="nb-input w-full h-11 text-sm"
                />
              </div>
              <div>
                <label className="font-bold text-[#1A1A2E] text-sm mb-1.5 block">Mật khẩu mới</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  className="nb-input w-full h-11 text-sm"
                />
              </div>
              <div>
                <label className="font-bold text-[#1A1A2E] text-sm mb-1.5 block">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="nb-input w-full h-11 text-sm"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleChangePassword}
                  disabled={changingPassword || !otp || !newPassword || !confirmPassword}
                  className="nb-btn nb-btn-purple text-sm disabled:opacity-50"
                >
                  {changingPassword ? "Đang xử lý..." : "Đổi mật khẩu ✦"}
                </button>
                <button
                  onClick={() => { setOtpSent(false); setOtp(""); setNewPassword(""); setConfirmPassword(""); setChangePasswordMsg(""); }}
                  className="text-[#6B7280] hover:text-[#1A1A2E] font-bold text-sm transition-colors"
                >
                  Hủy
                </button>
              </div>
            </>
          )}
          {otpRequestMsg && (
            <p className={`font-bold text-sm ${otpRequestMsg.startsWith("✓") ? "text-[#065F46]" : "text-[#991B1B]"}`}>
              {otpRequestMsg}
            </p>
          )}
          {changePasswordMsg && (
            <p className={`font-bold text-sm ${changePasswordMsg.startsWith("✓") ? "text-[#065F46]" : "text-[#991B1B]"}`}>
              {changePasswordMsg}
            </p>
          )}
        </div>
      </div>

      {/* 2FA Section */}
      <div className="nb-card-static p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 border-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E] ${
              is2FAEnabled === true ? 'bg-[#C8E44D]' : is2FAEnabled === false ? 'bg-[#EDE9FE]' : 'bg-[#F3F4F6] animate-pulse'
            }`}>
              {is2FAEnabled === true ? <ShieldCheck className="w-5 h-5 text-[#1A1A2E]" /> : <Shield className="w-5 h-5 text-[#6B7280]" />}
            </div>
            <div>
              <h3 className="font-extrabold text-[#1A1A2E] text-base">Xác thực 2 bước (2FA)</h3>
              <p className="font-medium text-[#6B7280] text-sm mt-0.5">
                Bảo vệ tài khoản bằng Google Authenticator
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {is2FAEnabled === null ? (
              <div className="h-7 w-20 bg-[#F3F4F6] rounded-lg animate-pulse" />
            ) : (
              <>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold border-2 ${
                  is2FAEnabled ? 'bg-[#C8E44D] text-[#1A1A2E] border-[#1A1A2E]' : 'bg-[#F3F4F6] text-[#6B7280] border-transparent'
                }`}>
                  {is2FAEnabled ? 'Đang bật' : 'Đang tắt'}
                </span>
                {is2FAEnabled ? (
                  <button
                    onClick={() => setShowDisable2FA(true)}
                    className="nb-btn nb-btn-outline text-sm !text-[#991B1B] !border-[#FCA5A5] hover:!bg-[#FEE2E2]"
                  >
                    Tắt 2FA
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/2fa-setup')}
                    className="nb-btn nb-btn-purple text-sm"
                  >
                    Bật 2FA ✦
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Disable 2FA Dialog */}
        {showDisable2FA && (
          <div className="mt-4 nb-card-static p-4 !border-[#FCA5A5] !bg-[#FFF5F5]">
            <p className="font-medium text-sm text-[#4C5769] mb-3">
              Nhập mã 6 chữ số từ ứng dụng xác thực để tắt 2FA:
            </p>
            <div className="flex items-center gap-3">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={disable2FACode}
                onChange={e => { if (/^\d*$/.test(e.target.value)) setDisable2FACode(e.target.value); }}
                placeholder="000000"
                className="nb-input max-w-[160px] h-11 text-center font-mono text-lg tracking-widest"
                autoFocus
              />
              <button
                onClick={async () => {
                  if (disable2FACode.length !== 6) return;
                  setDisabling2FA(true); setDisable2FAMsg("");
                  try {
                    const token = getToken();
                    await disable2FA(disable2FACode, token);
                    setIs2FAEnabled(false);
                    localStorage.setItem("vtos_2fa_enabled", "false");
                    setShowDisable2FA(false); setDisable2FACode("");
                    setDisable2FAMsg("✓ Đã tắt 2FA");
                  } catch (err: any) {
                    setDisable2FAMsg(err?.message || "Mã không hợp lệ");
                  } finally { setDisabling2FA(false); }
                }}
                disabled={disabling2FA || disable2FACode.length !== 6}
                className="nb-btn text-sm !bg-[#991B1B] !text-white !border-[#1A1A2E] disabled:opacity-50"
              >
                {disabling2FA ? "Đang xử lý..." : "Xác nhận tắt"}
              </button>
              <button
                onClick={() => { setShowDisable2FA(false); setDisable2FACode(""); setDisable2FAMsg(""); }}
                className="text-[#6B7280] hover:text-[#1A1A2E] font-bold text-sm transition-colors"
              >
                Hủy
              </button>
            </div>
            {disable2FAMsg && (
              <p className={`mt-2 font-bold text-sm ${
                disable2FAMsg.startsWith("✓") ? "text-[#065F46]" : "text-[#991B1B]"
              }`}>{disable2FAMsg}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
