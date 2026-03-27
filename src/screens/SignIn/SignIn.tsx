import { EyeIcon, EyeOffIcon, Shield } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Separator } from "../../components/ui/separator";
import { useEffect, useState, useRef } from "react";
import { login, verify2FA, googleLogin } from "../../lib/api/auth";
import { useGoogleLogin } from "@react-oauth/google";
import { getSchoolProfile } from "../../lib/api/schools";
import { getProviderProfile } from "../../lib/api/providers";
import { Notify } from "../../components/ui/notify";
import { useNavigate, Link } from "react-router-dom";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { useToast } from "../../contexts/ToastContext";
export const SignIn = (): JSX.Element => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
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
    if (token && userRaw) {
      try {
        const u = JSON.parse(userRaw);
        const role = u.role as string;
        if (role === "Admin") navigate("/admin/dashboard", { replace: true });
        else if (role === "School") navigate("/school/dashboard", { replace: true });
        else if (role === "Provider") navigate("/provider/dashboard", { replace: true });
        else navigate("/homepage", { replace: true });
      } catch {
        // Invalid user JSON — let them re-login
      }
    }
  }, [navigate]);

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

      // 2FA required → show TOTP input
      if (data.requiresTwoFactor && data.twoFactorToken) {
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
      setErrorMsg(e?.message || "Có lỗi xảy ra.");
      setNotify({ title: "Đăng nhập thất bại", message: e?.message || "Có lỗi xảy ra.", variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const completeLogin = (data: Awaited<ReturnType<typeof login>>) => {
    localStorage.setItem("access_token", data.accessToken);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("expires_in", String(data.expiresIn));

    let redirectTo = "/homepage";
    if (data.user.role === "Admin") {
      redirectTo = "/admin/dashboard";
    } else if (data.user.role === "School") {
      redirectTo = "/school/dashboard";
      getSchoolProfile().then(p => { if (p.schoolName) localStorage.setItem("vtos_org_name", p.schoolName); }).catch(() => {});
    } else if (data.user.role === "Provider") {
      redirectTo = "/provider/dashboard";
      getProviderProfile().then(p => { if (p.providerName) localStorage.setItem("vtos_org_name", p.providerName); }).catch(() => {});
    } else if (data.user.role === "Parent" && !data.user.phone) {
      redirectTo = "/fillphonenumber";
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
    <GuestLayout bgColor="#f4f2ff" >

      <main className="flex-1 bg-[#F4F6FF] px-4 py-10 lg:py-14">
        <div className="mx-auto w-full max-w-6xl">
          <div className="overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_60px_rgba(16,15,20,0.12)] ring-1 ring-black/5">
            <div className="flex flex-col lg:flex-row">
              {/* LEFT */}
              <div className="lg:w-[52%] flex items-center justify-center p-6 lg:p-12">
                <div className="w-full max-w-[26rem]">
                  <h1 className="[font-family:'Baloo_2',Helvetica] font-extrabold text-[#100f14] text-3xl lg:text-4xl text-center mb-6 lg:mb-8">
                    Đăng nhập
                  </h1>

                  <Button
                    variant="outline"
                    className="w-full h-auto flex items-center justify-center gap-3 px-5 py-3 lg:py-4 rounded-lg border border-[#cac9d6] hover:bg-gray-50"
                    type="button"
                    onClick={() => handleGoogleLogin()}
                    disabled={isGoogleLoading}
                  >
                    <span className="font-medium text-[#19181f] text-sm lg:text-base">
                      {isGoogleLoading ? "Đang xử lý..." : "Đăng nhập với Google"}
                    </span>
                    <img
                      className="w-6 lg:w-7 h-6 lg:h-7"
                      alt="Google"
                      src="https://c.animaapp.com/mjxt3t8wNP0otU/img/flat-color-icons-google.svg"
                    />
                  </Button>

                  <div className="flex items-center gap-4 lg:gap-6 my-5 lg:my-6">
                    <Separator className="flex-1 h-[1px] bg-[#cac9d6]" />
                    <span className="font-medium text-[#676576] text-base">
                      Hoặc
                    </span>
                    <Separator className="flex-1 h-[1px] bg-[#cac9d6]" />
                  </div>

                  <div className="space-y-4 lg:space-y-5">
                    {/* error */}
                    {/* {errorMsg && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <div
                          className="absolute inset-0 bg-black/30"
                          onClick={() => setErrorMsg(null)}
                        />
                        <div className="relative w-full max-w-md">
                          <Alert variant="destructive" className="shadow-lg">
                            <AlertCircle className="h-4 w-4" />
                            <div>
                              <AlertTitle>Đăng nhập thất bại</AlertTitle>
                              <AlertDescription>{errorMsg}</AlertDescription>
                            </div>
                          </Alert>
                        </div>
                      </div>
                    )} */}

                    <div className="space-y-2">
                      <Label className="font-medium text-[#9794aa] text-sm lg:text-base">
                        Email
                      </Label>
                      <Input
                        type="email"
                        placeholder="Nhập email của bạn"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 lg:h-12 px-4 lg:px-5 rounded-md border border-[#cac9d6] font-medium text-sm lg:text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-medium text-[#9794aa] text-sm lg:text-base">
                        Mật khẩu
                      </Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Nhập mật khẩu của bạn"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-11 lg:h-12 px-4 lg:px-5 pr-12 rounded-md border border-[#cac9d6] font-medium text-sm lg:text-base"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSignIn();
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-4 lg:right-5 top-1/2 -translate-y-1/2 text-[#676576] hover:opacity-80"
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? (
                            <EyeIcon className="w-5 lg:w-6 h-5 lg:h-6" />
                          ) : (
                            <EyeOffIcon className="w-5 lg:w-6 h-5 lg:h-6" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          id="remember"
                          checked={rememberMe}
                          onCheckedChange={(v) => setRememberMe(Boolean(v))}
                          className="w-4 lg:w-5 h-4 lg:h-5"
                        />
                        <span className="font-medium italic text-[#676576] text-sm lg:text-base">
                          Ghi nhớ mật khẩu
                        </span>
                      </label>

                      <button
                        type="button"
                        className="font-medium italic text-[#676576] text-sm lg:text-base hover:opacity-70"
                      >
                        <Link to="/forgot-password">
                          Quên mật khẩu?
                        </Link>
                      </button>
                    </div>

                    <Button
                      type="button"
                      onClick={handleSignIn}
                      disabled={isLoading}
                      className="w-full h-14 lg:h-16 bg-[#6838ee] rounded-[2.5rem] hover:bg-[#5527d9] mt-3 lg:mt-5"
                    >
                      <span className="[font-family:'Baloo_2',Helvetica] font-extrabold text-white text-lg lg:text-xl">
                        {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
                      </span>
                    </Button>

                    <p className="text-center [font-family:'Poppins',Helvetica] font-normal text-sm lg:text-base">
                      <span className="text-[#494759]">Bạn chưa có tài khoản? </span>
                      <Link
                        to="/signup"
                        className="font-semibold italic text-[#6938ef] cursor-pointer hover:underline"
                      >
                        Tạo tài khoản
                      </Link>
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div className="lg:w-[48%] relative overflow-hidden bg-gradient-to-br from-[#94bfff] to-[#c68cf4] p-8 lg:p-12 flex items-center justify-center">
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                  <img
                    className="absolute -top-24 -left-24 w-[36rem] h-[36rem]"
                    alt="Vector"
                    src="https://c.animaapp.com/mjxt3t8wNP0otU/img/vector-29.svg"
                  />
                  <img
                    className="absolute top-28 -right-40 w-[42rem] h-[48rem]"
                    alt="Vector"
                    src="https://c.animaapp.com/mjxt3t8wNP0otU/img/vector-28.svg"
                  />
                  <img
                    className="absolute -top-40 right-0 w-[44rem] h-[36rem]"
                    alt="Vector"
                    src="https://c.animaapp.com/mjxt3t8wNP0otU/img/vector-24.svg"
                  />
                </div>

                <div className="relative z-10 w-full max-w-md text-right">
                  <img
                    className="w-14 lg:w-16 h-auto mb-4 ml-auto"
                    alt="Vtos logo"
                    src="https://c.animaapp.com/mjxt3t8wNP0otU/img/vtos--1--removebg-preview-2-1.png"
                  />

                  <p className="font-semibold italic text-white text-xl lg:text-3xl leading-relaxed mb-6">
                    Hỗ trợ hơn 200 mẫu đồng phục
                  </p>

                  <img
                    className="w-full max-w-[22rem] lg:max-w-[26rem] h-auto ml-auto"
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
          <div className="bg-white w-full max-w-md p-8 relative border-2 border-[#1A1A2E] rounded-2xl shadow-[6px_6px_0_#1A1A2E]">
            <button
              onClick={() => { setShow2FA(false); setTotpDigits(["","","","","",""]); setRecoveryCode(""); setUseRecoveryCode(false); }}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg border-2 border-[#1A1A2E] bg-[#F5D5D5] text-[#1A1A2E] font-bold text-sm hover:bg-[#E8A0A0] shadow-[2px_2px_0_#1A1A2E] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >✕</button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#EDE9FE] rounded-xl flex items-center justify-center mx-auto mb-4 border-2 border-[#1A1A2E] shadow-[3px_3px_0_#1A1A2E]">
                <Shield className="w-8 h-8 text-[#1A1A2E]" />
              </div>
              <h2 className="text-2xl font-extrabold text-[#1A1A2E]">Xác thực 2 bước</h2>
              <p className="text-[#6B7280] text-sm mt-2 font-medium">
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
                      className="w-12 h-14 text-center text-2xl font-extrabold border-2 border-[#1A1A2E] rounded-xl bg-white shadow-[3px_3px_0_#1A1A2E] focus:shadow-[3px_3px_0_#1A1A2E,0_0_0_2px_#B8A9E8] outline-none transition-all"
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
                  className="w-full h-14 text-center text-lg font-mono tracking-widest border-2 border-[#1A1A2E] rounded-xl bg-white shadow-[3px_3px_0_#1A1A2E] focus:shadow-[3px_3px_0_#1A1A2E,0_0_0_2px_#B8A9E8] outline-none transition-all mb-4 px-4"
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
              className="w-full text-center text-sm text-[#1A1A2E] hover:text-[#B8A9E8] mt-4 font-bold border-2 border-transparent hover:border-[#E5E7EB] rounded-lg py-2 transition-all"
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
