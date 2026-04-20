import { EyeIcon, EyeOffIcon, Shield } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useEffect, useState, useRef } from "react";
import { login, verify2FA, googleLogin } from "../../lib/api/auth";
import { useGoogleLogin } from "@react-oauth/google";
import { getSchoolProfile } from "../../lib/api/schools";
import { getProviderProfile } from "../../lib/api/providers";
import { Notify } from "../../components/ui/notify";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { useToast } from "../../contexts/ToastContext";
export const SignIn = (): JSX.Element => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");


  const [isLoading, setIsLoading] = useState(false);
  const [notify, setNotify] = useState<{ title: string; message: string; variant: "error" | "success" | "info" } | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // 2FA state
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [totpDigits, setTotpDigits] = useState(["" ,"", "", "", "", ""]);
  const [is2FALoading, setIs2FALoading] = useState(false);
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Auto-redirect if already logged in ──
  useEffect(() => {
    const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
    const userRaw = localStorage.getItem("user") || sessionStorage.getItem("user");
    const redirect = searchParams.get("redirect");
    if (token && userRaw) {
      try {
        const u = JSON.parse(userRaw);
        const role = u.role as string;
        if (redirect && role === "Parent") navigate(redirect, { replace: true });
        else if (role === "Admin") navigate("/admin/dashboard", { replace: true });
        else if (role === "School") navigate("/school/dashboard", { replace: true });
        else if (role === "Provider") navigate("/provider/dashboard", { replace: true });
        else if (role === "HomeroomTeacher") navigate("/teacher/classes", { replace: true });
        else navigate("/homepage", { replace: true });
      } catch {
        // Invalid user JSON — let them re-login
      }
    }
  }, [navigate, searchParams]);

  // Google Login
  const handleGoogleLogin = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (tokenResponse) => {
      try {
        setIsGoogleLoading(true);
        // Send access_token to backend — it will fetch user info from Google
        const data = await googleLogin(tokenResponse.access_token);
        completeLogin(data);
      } catch (e: any) {
        setNotify({ title: "Google Login thất bại", message: e?.message || "Có lỗi xảy ra.", variant: "error" });
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google login error:', error);
      setNotify({ title: "Google Login thất bại", message: "Không thể kết nối Google. Vui lòng thử lại.", variant: "error" });
    },
  });

  const handleSignIn = async () => {
    setNotify(null);

    if (!email.trim() || !password) {
      setNotify({
        title: "Đăng nhập thất bại",
        message: "Vui lòng nhập email và mật khẩu.",
        variant: "error",
      });
      return;
    }

    try {
      setIsLoading(true);
      const data = await login({ email, password });

      // 2FA required → show TOTP input (2FA is already enabled, so clear the setup flag)
      if (data.requiresTwoFactor && data.twoFactorToken) {
        localStorage.removeItem("vtos_should_setup_2fa");
        setTwoFactorToken(data.twoFactorToken);
        setShow2FA(true);
        setIsLoading(false);
        return;
      }

      // 2FA soft hint — store flag for dashboard banner (no longer forced)
      if (data.shouldSetup2FA) {
        localStorage.setItem("vtos_should_setup_2fa", "true");
      }

      // Normal login → store + redirect
      completeLogin(data);
    } catch (e: any) {
      setNotify({ title: "Đăng nhập thất bại", message: e?.message || "Có lỗi xảy ra.", variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const completeLogin = (data: Awaited<ReturnType<typeof login>>) => {
    localStorage.setItem("access_token", data.accessToken);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("expires_in", String(data.expiresIn));
    localStorage.removeItem("vtos_org_name");
    // Cache 2FA status so AccountSecuritySettings shows correct status immediately on page load
    if (data.user.twoFactorEnabled !== undefined) {
        localStorage.setItem("vtos_2fa_enabled", data.user.twoFactorEnabled ? "true" : "false");
    }

    let redirectTo = "/homepage";
    const redirect = searchParams.get("redirect");
    if (data.user.role === "Admin") {
      redirectTo = "/admin/dashboard";
    } else if (data.user.role === "School") {
      redirectTo = "/school/dashboard";
      getSchoolProfile().then(p => { if (p.schoolName) localStorage.setItem("vtos_org_name", p.schoolName); }).catch(() => {});
    } else if (data.user.role === "Provider") {
      redirectTo = "/provider/dashboard";
      getProviderProfile().then(p => { if (p.providerName) localStorage.setItem("vtos_org_name", p.providerName); }).catch(() => {});
    } else if (data.user.role === "HomeroomTeacher") {
      redirectTo = "/teacher/classes";
    } else if (data.user.role === "Parent" && !data.user.phone) {
      redirectTo = "/fillphonenumber";
    } else if (data.user.role === "Parent" && redirect) {
      redirectTo = redirect;
    }

    showToast({ title: "Đăng nhập thành công! 🎉", message: `Xin chào, ${data.user.fullName}`, variant: "success" });
    navigate(redirectTo, { replace: true, state: { from: "/login", fullName: data.user.fullName, email: data.user.email } });
  };

  const handle2FAVerify = async () => {
    const code = useRecoveryCode ? recoveryCode.trim() : totpDigits.join("");
    if (!useRecoveryCode && code.length !== 6) return;
    if (useRecoveryCode && !code) return;
    try {
      setIs2FALoading(true);
      const data = await verify2FA({ twoFactorToken, code });
      // User already has 2FA enabled (they just verified it), so clear the setup flag
      localStorage.removeItem("vtos_should_setup_2fa");
      completeLogin(data);
    } catch (e: any) {
      setNotify({ title: "Xác thực thất bại", message: e?.message || "Mã không hợp lệ hoặc đã hết hạn.", variant: "error" });
    } finally {
      setIs2FALoading(false);
    }
  };

  const handleDigitChange = (idx: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    // Handle multi-char input (e.g. from paste or autofill)
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      const newDigits = [...totpDigits];
      digits.forEach((d, i) => { if (idx + i < 6) newDigits[idx + i] = d; });
      setTotpDigits(newDigits);
      const lastIdx = Math.min(idx + digits.length - 1, 5);
      digitRefs.current[lastIdx]?.focus();
      if (newDigits.every(d => d)) setTimeout(() => handle2FAVerify(), 100);
      return;
    }
    const newDigits = [...totpDigits];
    newDigits[idx] = value.slice(-1);
    setTotpDigits(newDigits);
    if (value && idx < 5) digitRefs.current[idx + 1]?.focus();
    // Auto-submit when all 6 digits entered
    if (value && idx === 5 && newDigits.every(d => d)) {
      setTimeout(() => handle2FAVerify(), 100);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 0) return;
    e.preventDefault();
    const newDigits = pasted.split("").concat(Array(6).fill("")).slice(0, 6);
    setTotpDigits(newDigits);
    const lastIdx = Math.min(pasted.length - 1, 5);
    digitRefs.current[lastIdx]?.focus();
    if (newDigits.every(d => d)) setTimeout(() => handle2FAVerify(), 100);
  };

  const handleDigitKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !totpDigits[idx] && idx > 0) {
      digitRefs.current[idx - 1]?.focus();
    }
  };

  return (
    <GuestLayout bgColor="#f9fafb">

      <main className="nb-page flex-1 px-4 py-10 lg:py-14 nb-fade-in">
        <div className="mx-auto w-full max-w-6xl">
          <div className="nb-card-static overflow-hidden rounded-2xl ring-2 ring-purple-300/35 shadow-soft-lg nb-reveal-pop">
            <div className="flex flex-col lg:flex-row">
              {/* LEFT — Form */}
              <div className="lg:w-[52%] flex items-center justify-center p-6 lg:p-12 bg-white">
                <div className="w-full max-w-[26rem]">
                  <h1 className="font-extrabold text-gray-900 text-3xl lg:text-4xl text-center mb-6 lg:mb-8 tracking-tight">
                    <span>Đăng nhập</span>{" "}
                    <span className="inline-block text-[#7C3AED]">✦</span>
                  </h1>

                  <button
                    type="button"
                    onClick={() => handleGoogleLogin()}
                    disabled={isGoogleLoading}
                    className="group w-full inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gradient-to-r from-white via-[#FAF9FF] to-[#F1EDFF] px-4 py-3 lg:py-4 text-sm lg:text-base font-bold text-gray-900 shadow-soft-md transition-all hover:-translate-y-px hover:border-purple-500 hover:shadow-soft-md hover:bg-violet-50 active:translate-y-px active:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300/55 focus-visible:ring-offset-0 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <img
                      className="w-6 lg:w-7 h-6 lg:h-7 nb-icon-wiggle"
                      alt="Google"
                      src="https://c.animaapp.com/mjxt3t8wNP0otU/img/flat-color-icons-google.svg"
                    />
                    <span className="font-bold text-gray-900">
                      {isGoogleLoading ? "Đang xử lý..." : "Đăng nhập với Google"}
                    </span>
                  </button>

                  <div className="flex items-center gap-4 lg:gap-6 my-5 lg:my-6">
                    <div className="flex-1 h-[2px] bg-gray-900/10" />
                    <span className="font-bold text-gray-500 text-sm uppercase tracking-wider">
                      Hoặc
                    </span>
                    <div className="flex-1 h-[2px] bg-gray-900/10" />
                  </div>

                  <div className="space-y-4 lg:space-y-5">
                    <div className="space-y-2">
                      <Label className="font-bold text-gray-900 text-sm">
                        Email
                      </Label>
                      <Input
                        type="email"
                        placeholder="Nhập email của bạn"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="nb-input w-full h-11 lg:h-12 border border-gray-200 bg-white shadow-soft-sm transition-all hover:-translate-y-px hover:border-purple-500 hover:shadow-soft-md hover:bg-violet-50 active:translate-y-px active:shadow-sm focus:border-purple-500 focus:bg-violet-50 focus:shadow-sm focus:ring-2 focus:ring-purple-300/55 focus:ring-offset-0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold text-gray-900 text-sm">
                        Mật khẩu
                      </Label>
                      <div className="group relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Nhập mật khẩu của bạn"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="nb-input w-full h-11 lg:h-12 pr-12 border border-gray-200 bg-white shadow-soft-sm transition-all hover:-translate-y-px hover:border-purple-500 hover:shadow-soft-md hover:bg-violet-50 active:translate-y-px active:shadow-sm focus:border-purple-500 focus:bg-violet-50 focus:shadow-sm focus:ring-2 focus:ring-purple-300/55 focus:ring-offset-0"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSignIn();
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 transition-colors group-hover:text-gray-800 hover:text-[#7C3AED]"
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? (
                            <EyeIcon className="w-5 h-5" />
                          ) : (
                            <EyeOffIcon className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-end">
                      <Link
                        to="/forgot-password"
                        className="font-bold text-gray-900 text-sm hover:text-purple-500 transition-colors border-b-2 border-transparent hover:border-purple-300"
                      >
                        Quên mật khẩu?
                      </Link>
                    </div>

                  <button
                      type="button"
                      onClick={handleSignIn}
                      disabled={isLoading}
                      className="group relative w-full h-14 lg:h-16 mt-3 lg:mt-5 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-gradient-to-r from-[#A78BFA] via-[#C4B5FD] to-[#7C3AED] text-lg lg:text-xl font-extrabold text-gray-900 shadow-soft-md transition-all hover:-translate-y-[2px] hover:shadow-soft-md hover:brightness-110 active:translate-y-px active:shadow-soft-sm disabled:opacity-50 disabled:cursor-not-allowed nb-pulse-ring"
                    >
                    <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.7),transparent_45%)] opacity-80 transition-opacity duration-200 group-hover:opacity-100" />
                    <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.58)_50%,transparent_70%)] bg-[length:220%_100%] animate-[nb-shimmer_2.6s_linear_infinite]" />
                      <span className="relative z-[1]">{isLoading ? "Đang đăng nhập..." : "Đăng nhập ✦"}</span>
                    </button>

                    <p className="text-center font-medium text-sm lg:text-base">
                      <span className="text-gray-600">Bạn chưa có tài khoản? </span>
                      <Link
                        to="/signup"
                        className="font-bold text-gray-900 hover:text-purple-500 border-b-2 border-purple-300 transition-colors"
                      >
                        Tạo tài khoản
                      </Link>
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT — Hero illustration with NB border */}
              <div className="lg:w-[48%] relative overflow-hidden bg-gradient-to-br from-[#B8A9E8] via-[#B29BE7] to-[#9B86DF] p-8 lg:p-12 flex items-center justify-center border-l-0 lg:border-l-2 border-t-2 lg:border-t-0 border-gray-200 nb-hero-glow">
                {/* Decorative NB shapes */}
                <div className="absolute top-6 left-6 w-16 h-16 bg-emerald-400 border border-gray-200 rounded-lg shadow-soft-md rotate-12 opacity-85 nb-float" />
                <div className="absolute bottom-12 left-10 w-12 h-12 bg-amber-400 border border-gray-200 rounded-full shadow-soft-md opacity-70 nb-float-delay" />
                <div className="absolute top-[40%] right-6 w-10 h-10 bg-pink-200 border border-gray-200 rounded-lg shadow-soft-sm -rotate-6 opacity-80 nb-float-slow" />

                <div className="relative z-10 w-full max-w-md text-right">
                  <img
                    className="w-14 lg:w-16 h-auto mb-4 ml-auto nb-logo-hero"
                    alt="Vtos logo"
                    src="https://c.animaapp.com/mjxt3t8wNP0otU/img/vtos--1--removebg-preview-2-1.png"
                  />

                  <p className="font-extrabold text-gray-900 text-xl lg:text-3xl leading-relaxed mb-6 drop-shadow-[0_2px_0_rgba(255,255,255,0.35)] nb-reveal-pop">
                    Hỗ trợ hơn 200 mẫu đồng phục ✦
                  </p>

                  <img
                    className="w-full max-w-[22rem] lg:max-w-[26rem] h-auto ml-auto drop-shadow-[0_8px_24px_rgba(0,0,0,0.15)] nb-float-slow"
                    alt="Students"
                    src="https://c.animaapp.com/mjxt3t8wNP0otU/img/vtos--3--removebg-preview-1.png"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>


      {/* ── 2FA Modal — Neubrutalism ── */}
      {show2FA && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white w-full max-w-md p-8 relative border border-gray-200 rounded-2xl shadow-soft-lg">
            <button
              onClick={() => { setShow2FA(false); setTotpDigits(["","","","","",""]); setRecoveryCode(""); setUseRecoveryCode(false); }}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-red-100 text-gray-900 font-bold text-sm hover:bg-[#E8A0A0] shadow-sm transition-all active:scale-[0.98] active:shadow-none"
            >✕</button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-violet-50 rounded-xl flex items-center justify-center mx-auto mb-4 border border-gray-200 shadow-soft-sm">
                <Shield className="w-8 h-8 text-gray-900" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900">Xác thực 2 bước</h2>
              <p className="text-gray-500 text-sm mt-2 font-medium">
                {useRecoveryCode
                  ? "Nhập mã khôi phục để đăng nhập"
                  : "Nhập mã 6 chữ số từ Google Authenticator"}
              </p>
            </div>

            {!useRecoveryCode ? (
              <>
                <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
                  {totpDigits.map((d, i) => (
                    <input
                      key={i}
                      ref={el => { digitRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={e => handleDigitChange(i, e.target.value)}
                      onKeyDown={e => handleDigitKeyDown(i, e)}
                      onPaste={handlePaste}
                      onFocus={e => e.target.select()}
                      autoFocus={i === 0}
                      className="w-12 h-14 text-center text-2xl font-extrabold border border-gray-200 rounded-xl bg-white shadow-soft-sm focus:shadow-soft-sm ring-2 ring-purple-300 outline-none transition-all"
                    />
                  ))}
                </div>
                <button
                  onClick={handle2FAVerify}
                  disabled={is2FALoading || totpDigits.some(d => !d)}
                  className="w-full h-12 nb-btn nb-btn-purple text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {is2FALoading ? "Đang xác thực..." : "Xác nhận ✦"}
                </button>
              </>
            ) : (
              <>
                <input
                  value={recoveryCode}
                  onChange={e => setRecoveryCode(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX"
                  className="w-full h-14 text-center text-lg font-mono tracking-widest border border-gray-200 rounded-xl bg-white shadow-soft-sm focus:shadow-soft-sm ring-2 ring-purple-300 outline-none transition-all mb-4 px-4"
                  onKeyDown={e => { if (e.key === "Enter") handle2FAVerify(); }}
                  autoFocus
                />
                <button
                  onClick={handle2FAVerify}
                  disabled={is2FALoading || !recoveryCode.trim()}
                  className="w-full h-12 nb-btn nb-btn-purple text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {is2FALoading ? "Đang xác thực..." : "Xác nhận ✦"}
                </button>
              </>
            )}

            <button
              onClick={() => { setUseRecoveryCode(!useRecoveryCode); setTotpDigits(["","","","","",""]); setRecoveryCode(""); }}
              className="w-full text-center text-sm text-gray-900 hover:text-purple-500 mt-4 font-bold border-2 border-transparent hover:border-gray-200 rounded-lg py-2 transition-all"
            >
              {useRecoveryCode ? "← Dùng mã từ ứng dụng" : "Dùng mã khôi phục →"}
            </button>
          </div>
        </div>
      )}

      <Notify
        open={!!notify}
        title={notify?.title || ""}
        message={notify?.message}
        variant={notify?.variant}
        onClose={() => setNotify(null)}
      />
    </GuestLayout>
  );
};
