import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { EyeIcon, EyeOffIcon, ArrowLeftIcon } from "lucide-react";
import { useState } from "react";
import { register } from "../../lib/api/auth";
import { Notify } from "../../components/ui/notify";
import { useNavigate, Link } from "react-router-dom";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { useToast } from "../../contexts/ToastContext";

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

    try {
      setIsLoading(true);

      const data = await register({ email, password, fullName, roleName });

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
          <div className="nb-card-static overflow-hidden rounded-2xl">
            <div className="flex flex-col lg:flex-row">
              {/* Left panel — NB Hero */}
              <div className={`relative lg:w-[42%] ${config.bg} p-8 lg:p-10 flex items-center justify-center overflow-hidden border-r-0 lg:border-r-2 border-b-2 lg:border-b-0 border-gray-200`}>
                {/* Decorative NB shapes */}
                <div className="absolute top-6 right-6 w-14 h-14 bg-emerald-400 border border-gray-200 rounded-lg shadow-soft-sm rotate-12 opacity-60" />
                <div className="absolute bottom-10 left-8 w-10 h-10 bg-pink-200 border border-gray-200 rounded-full shadow-soft-sm opacity-50" />
                <div className="absolute top-[45%] left-6 w-12 h-12 bg-amber-400 border border-gray-200 rounded-lg shadow-sm -rotate-6 opacity-60" />

                <div className="relative z-10 w-full max-w-sm">
                  <img
                    className="w-14 lg:w-16 h-auto mb-4"
                    alt="Vtos logo"
                    src="https://c.animaapp.com/mjxt3t8wNP0otU/img/vtos--1--removebg-preview-2.png"
                  />

                  <p className="font-extrabold text-gray-900 text-lg lg:text-2xl leading-relaxed mb-6">
                    {config.tagline} ✦
                  </p>

                  <img
                    className="w-full h-auto drop-shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
                    alt="Illustration"
                    src="https://c.animaapp.com/mjxt3t8wNP0otU/img/7850dea647994b6db38f4ccd875eaf37-removebg-preview-1.png"
                  />
                </div>
              </div>

              {/* Right panel — Form */}
              <div className="lg:w-[58%] flex items-center justify-center p-6 lg:p-10 bg-white">
                <div className="w-full max-w-[30rem]">
                  {/* Back to role select */}
                  <Link
                    to="/signup"
                    className="nb-btn nb-btn-outline text-sm mb-4 inline-flex"
                  >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Chọn loại tài khoản khác
                  </Link>

                  <div className="mb-6">
                    <h1 className="font-extrabold text-gray-900 text-3xl lg:text-4xl text-center">
                      Tạo tài khoản {config.title} ✦
                    </h1>
                    <p className="text-center mt-2 font-bold text-gray-500 text-sm">
                      {config.emoji} Bạn đang đăng ký với tư cách <span className="text-gray-900">{config.title}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    className="nb-btn nb-btn-outline w-full h-auto py-3 lg:py-4 text-sm lg:text-base"
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
                      <Input
                        type="email"
                        placeholder="Nhập email của bạn"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="nb-input w-full h-11 lg:h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold text-gray-900 text-sm">
                        Họ tên
                      </Label>
                      <Input
                        type="text"
                        placeholder="Nhập họ tên của bạn"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="nb-input w-full h-11 lg:h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold text-gray-900 text-sm">
                        Mật khẩu
                      </Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Tạo mật khẩu của bạn"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="nb-input w-full h-11 lg:h-12 pr-12"
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

                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={handleRegister}
                      className="nb-btn nb-btn-purple w-full h-14 lg:h-16 text-lg lg:text-xl mt-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "Đang tạo..." : "Tạo tài khoản ✦"}
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
    </GuestLayout>
  );
};
