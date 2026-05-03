import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { EyeIcon, EyeOffIcon, ArrowLeftIcon, Lock, Mail, User, UserPlus } from "lucide-react";
import { useState } from "react";
import { register } from "../../lib/api/auth";
import { Notify } from "../../components/ui/notify";
import { useNavigate, Link } from "react-router-dom";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { useToast } from "../../contexts/ToastContext";
import vtosLogoUrl from "../../../public/imgs/vtoslogo.png";
import { Checkbox } from "../../components/ui/checkbox";
import { TermsOfUseModal, VTOS_TERMS_VERSION } from "../../components/legal/TermsOfUseModal";

interface SignUpProps {
  roleName: "Parent" | "School" | "Provider";
}

const ROLE_CONFIG = {
  Parent: {
    emoji: "👨‍👩‍👧",
    title: "Phụ huynh",
    bg: "bg-purple-400",
    tagline: "AI Try-On đồng phục: xem bạn mặc thế nào chỉ trong vài giây",
  },
  School: {
    emoji: "🏫",
    title: "Quản lý trường",
    bg: "bg-[#A8D4E6]",
    tagline: "Quản lý chiến dịch đồng phục, học sinh và đơn hàng một cách dễ dàng",
  },
  Provider: {
    emoji: "🏭",
    title: "Nhà cung cấp",
    bg: "bg-amber-400",
    tagline: "Tiếp nhận đơn sản xuất, quản lý giao hàng và hợp đồng hiệu quả",
  },
};

export const SignUp = ({ roleName }: SignUpProps): JSX.Element => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [notify, setNotify] = useState<{
    title: string;
    message: string;
    variant: "error" | "success" | "info";
  } | null>(null);

  const config = ROLE_CONFIG[roleName];

  const handleRegister = async () => {
    if (!email.trim() || !fullName.trim() || !password) {
      setNotify({
        title: "Thiếu thông tin",
        message: "Vui lòng nhập Email, Họ tên và Mật khẩu.",
        variant: "info",
      });
      return;
    }

    if (!acceptedTerms) {
      setNotify({
        title: "Chưa đồng ý điều khoản",
        message: "Vui lòng đọc và đồng ý với Điều khoản sử dụng trước khi tạo tài khoản.",
        variant: "info",
      });
      return;
    }

    try {
      setIsLoading(true);

      const data = await register({
        email,
        password,
        fullName,
        roleName,
        acceptedTerms,
        termsVersion: VTOS_TERMS_VERSION,
      });

      showToast({
        title: "Tạo tài khoản thành công",
        message: data?.message || "Vui lòng kiểm tra email để lấy mã OTP.",
        variant: "success",
      });
      navigate("/verify-otp", {
        replace: true,
        state: { email, roleName },
      });
    } catch (e: any) {
      setNotify({
        title: "Tạo tài khoản thất bại",
        message: e?.message || "Có lỗi xảy ra.",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GuestLayout bgColor="#f9fafb">
      <main className="nb-page flex-1 px-4 py-10 lg:py-14 nb-fade-in">
        <div className="mx-auto w-full max-w-6xl">
          <div className="nb-card-static overflow-hidden rounded-2xl ring-2 ring-purple-300/35 shadow-soft-lg nb-reveal-pop">
            <div className="flex flex-col lg:flex-row">
              {/* Left panel — NB Hero */}
              <div className={`relative lg:w-[42%] ${config.bg} p-8 lg:p-10 flex items-center justify-center overflow-hidden border-r-0 lg:border-r-2 border-b-2 lg:border-b-0 border-gray-200`}>
                {/* Decorative NB shapes */}
                <div className="absolute top-6 right-6 w-14 h-14 bg-emerald-400 border border-gray-200 rounded-lg shadow-soft-sm rotate-12 opacity-60 nb-float" />
                <div className="absolute bottom-10 left-8 w-10 h-10 bg-pink-200 border border-gray-200 rounded-full shadow-soft-sm opacity-50 nb-float-delay" />
                <div className="absolute top-[45%] left-6 w-12 h-12 bg-amber-400 border border-gray-200 rounded-lg shadow-sm -rotate-6 opacity-60 nb-float-slow" />

                <div className="relative z-10 w-full max-w-sm">
                  <img
                    className="w-14 lg:w-16 h-auto mb-4 nb-logo-hero"
                    alt="Vtos logo"
                    src="https://c.animaapp.com/mjxt3t8wNP0otU/img/vtos--1--removebg-preview-2.png"
                  />

                  <p className="font-extrabold text-gray-900 text-lg lg:text-2xl leading-relaxed mb-6 drop-shadow-[0_2px_0_rgba(255,255,255,0.35)] nb-reveal-pop">
                    {config.tagline} ✦
                  </p>

                  <img
                    className="w-full h-auto drop-shadow-[0_4px_16px_rgba(0,0,0,0.12)] nb-float-slow"
                    alt="Illustration"
                    src="https://c.animaapp.com/mjxt3t8wNP0otU/img/7850dea647994b6db38f4ccd875eaf37-removebg-preview-1.png"
                  />
                </div>
              </div>

              {/* Right panel — Form */}
              <div className="lg:w-[58%] flex items-center justify-center p-6 lg:p-10 bg-white">
                <div className="w-full max-w-[24rem]">
                  {/* Back to role select */}
                  <Link
                    to="/signup"
                    className="nb-btn nb-btn-outline text-sm mb-4 inline-flex"
                  >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Chọn loại tài khoản khác
                  </Link>

                  <div className="mb-6">
                    <h1 className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap text-center text-2xl font-extrabold tracking-tight text-gray-900 lg:text-[1.7rem]">
                      <span>Tạo tài khoản {config.title}</span>
                      <img
                        className="h-7 w-7 flex-shrink-0 object-contain lg:h-8 lg:w-8"
                        alt=""
                        aria-hidden="true"
                        src={vtosLogoUrl}
                      />
                    </h1>
                    <p className="text-center mt-2 font-bold text-gray-500 text-sm">
                      {config.emoji} Bạn đang đăng ký với tư cách <span className="text-gray-900">{config.title}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    className="group w-full h-12 lg:h-14 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gradient-to-r from-white via-[#FAF9FF] to-[#F1EDFF] px-4 py-0 text-sm lg:text-base font-bold text-gray-900 shadow-soft-md transition-all hover:-translate-y-px hover:border-purple-500 hover:shadow-soft-md hover:bg-violet-50 active:translate-y-px active:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300/55 focus-visible:ring-offset-0"
                  >
                    <img
                      className="w-6 lg:w-7 h-6 lg:h-7"
                      alt="Google"
                      src="https://c.animaapp.com/mjxt3t8wNP0otU/img/flat-color-icons-google.svg"
                    />
                    <span className="font-bold text-gray-900">
                      Tạo tài khoản với Google
                    </span>
                  </button>

                  <div className="flex items-center gap-4 lg:gap-6 my-5">
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
                      <div className="group relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-gray-500 transition-all duration-200 ease-out group-hover:scale-105 group-hover:text-gray-700 group-focus-within:scale-110 group-focus-within:text-[#7C3AED]" aria-hidden="true" />
                        <Input
                          type="email"
                          placeholder="Nhập email của bạn"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="nb-input relative z-0 w-full h-11 lg:h-12 pl-11 border border-gray-200 bg-white shadow-soft-sm transition-all hover:-translate-y-px hover:border-purple-500 hover:shadow-soft-md hover:bg-violet-50 active:translate-y-px active:shadow-sm focus:border-purple-500 focus:bg-violet-50 focus:shadow-sm focus:ring-2 focus:ring-purple-300/55 focus:ring-offset-0"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold text-gray-900 text-sm">
                        Họ tên
                      </Label>
                      <div className="group relative">
                        <User className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-gray-500 transition-all duration-200 ease-out group-hover:scale-105 group-hover:text-gray-700 group-focus-within:scale-110 group-focus-within:text-[#7C3AED]" aria-hidden="true" />
                        <Input
                          type="text"
                          placeholder="Nhập họ tên của bạn"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="nb-input relative z-0 w-full h-11 lg:h-12 pl-11 border border-gray-200 bg-white shadow-soft-sm transition-all hover:-translate-y-px hover:border-purple-500 hover:shadow-soft-md hover:bg-violet-50 active:translate-y-px active:shadow-sm focus:border-purple-500 focus:bg-violet-50 focus:shadow-sm focus:ring-2 focus:ring-purple-300/55 focus:ring-offset-0"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold text-gray-900 text-sm">
                        Mật khẩu
                      </Label>
                      <div className="group relative">
                        <Lock className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-gray-500 transition-all duration-200 ease-out group-hover:scale-105 group-hover:text-gray-700 group-focus-within:scale-110 group-focus-within:text-[#7C3AED]" aria-hidden="true" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Tạo mật khẩu của bạn"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="nb-input relative z-0 w-full h-11 lg:h-12 pl-11 pr-12 border border-gray-200 bg-white shadow-soft-sm transition-all hover:-translate-y-px hover:border-purple-500 hover:shadow-soft-md hover:bg-violet-50 active:translate-y-px active:shadow-sm focus:border-purple-500 focus:bg-violet-50 focus:shadow-sm focus:ring-2 focus:ring-purple-300/55 focus:ring-offset-0"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRegister();
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          {showPassword ? (
                            <EyeIcon className="w-5 h-5" />
                          ) : (
                            <EyeOffIcon className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="rounded-[8px] border border-gray-200 bg-gray-50 px-3 py-3">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="signup-terms"
                          checked={acceptedTerms}
                          onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                          className="mt-0.5 h-5 w-5 rounded-[5px] border-[1.5px] border-gray-300 bg-white data-[state=checked]:border-purple-700 data-[state=checked]:bg-purple-700"
                        />
                        <label htmlFor="signup-terms" className="text-sm font-semibold leading-6 text-gray-700">
                          Tôi đã đọc và đồng ý với{" "}
                          <button
                            type="button"
                            onClick={() => setIsTermsOpen(true)}
                            className="font-extrabold text-purple-700 underline decoration-purple-300 underline-offset-2 transition-colors hover:text-purple-900"
                          >
                            Điều khoản sử dụng
                          </button>
                          , bao gồm việc sử dụng ảnh cá nhân/ảnh học sinh để thử đồ AI trong phạm vi dịch vụ.
                        </label>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={handleRegister}
                      className="group relative w-full h-12 lg:h-14 mt-3 inline-flex items-center justify-center gap-2 overflow-hidden rounded-lg border border-gray-200 bg-gradient-to-r from-[#A78BFA] via-[#C4B5FD] to-[#7C3AED] text-base lg:text-lg font-extrabold text-gray-900 shadow-soft-md transition-all hover:-translate-y-[2px] hover:shadow-soft-md hover:brightness-110 active:translate-y-px active:shadow-soft-sm disabled:opacity-50 disabled:cursor-not-allowed nb-pulse-ring"
                    >
                      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.7),transparent_45%)] opacity-80 transition-opacity duration-200 group-hover:opacity-100" />
                      <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.58)_50%,transparent_70%)] bg-[length:220%_100%] animate-[nb-shimmer_2.6s_linear_infinite]" />
                      <UserPlus className="relative z-[1] h-5 w-5" aria-hidden="true" />
                      <span className="relative z-[1]">{isLoading ? "Đang tạo..." : "Tạo tài khoản"}</span>
                    </button>

                    <p className="text-center font-medium text-sm lg:text-base">
                      <span className="text-gray-600">Bạn đã có tài khoản? </span>
                      <Link
                        to="/signin"
                        className="font-bold text-gray-900 hover:text-purple-500 border-b-2 border-purple-300 transition-colors"
                      >
                        Đăng Nhập
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Notify
        open={!!notify}
        title={notify?.title || ""}
        message={notify?.message}
        variant={notify?.variant}
        durationMs={3500}
        onClose={() => setNotify(null)}
      />
      <TermsOfUseModal open={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </GuestLayout>
  );
};
