import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Notify } from "../../components/ui/notify";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword } from "../../lib/api/auth";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { Mail, Send } from "lucide-react";
import vtosLogoUrl from "../../../public/imgs/vtoslogo.png";

export const ForgotPassword = (): JSX.Element => {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [notify, setNotify] = useState<{
        title: string;
        message: string;
        variant: "error" | "success" | "info";
    } | null>(null);

    const handleSendLink = async () => {
        setNotify(null);

        if (!email.trim()) {
            setNotify({
                title: "Thiếu email",
                message: "Vui lòng nhập email của bạn.",
                variant: "error",
            });
            return;
        }

        try {
            setIsLoading(true);
            const res = await forgotPassword({ email: email.trim() });
            navigate("/forgot-password/sent", {
                replace: true,
                state: {
                    email: email.trim(),
                    message: res?.message,
                },
            });
        } catch (e: any) {
            setNotify({
                title: "Gửi thất bại",
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
                            {/* LEFT — Form */}
                            <div className="lg:w-[52%] flex items-center justify-center p-6 lg:p-12 bg-white">
                                <div className="w-full max-w-[23.5rem]">
                                    <h1 className="mb-6 inline-flex w-full items-center justify-center gap-2 whitespace-nowrap text-center text-3xl font-extrabold tracking-tight text-gray-900 lg:mb-8 lg:text-4xl">
                                        <span>Quên mật khẩu</span>
                                        <img
                                            className="h-8 w-8 flex-shrink-0 object-contain lg:h-9 lg:w-9"
                                            alt=""
                                            aria-hidden="true"
                                            src={vtosLogoUrl}
                                        />
                                    </h1>

                                    <div className="flex items-center gap-4 lg:gap-6 my-5 lg:my-6">
                                        <div className="flex-1 h-[2px] bg-gray-900/10" />
                                        <span className="font-bold text-gray-500 text-sm uppercase tracking-wider">
                                            Nhập email để nhận link
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
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") handleSendLink();
                                                    }}
                                                />
                                            </div>
                                            <p className="text-xs lg:text-sm text-gray-500 font-medium">
                                                Nếu email tồn tại, hệ thống sẽ gửi link đặt lại mật khẩu.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleSendLink}
                                            disabled={isLoading}
                                            className="group relative w-full h-12 lg:h-14 mt-3 lg:mt-5 inline-flex items-center justify-center gap-2 overflow-hidden rounded-lg border border-gray-200 bg-gradient-to-r from-[#A78BFA] via-[#C4B5FD] to-[#7C3AED] text-base lg:text-lg font-extrabold text-gray-900 shadow-soft-md transition-all hover:-translate-y-[2px] hover:shadow-soft-md hover:brightness-110 active:translate-y-px active:shadow-soft-sm disabled:opacity-50 disabled:cursor-not-allowed nb-pulse-ring"
                                        >
                                            <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.7),transparent_45%)] opacity-80 transition-opacity duration-200 group-hover:opacity-100" />
                                            <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.58)_50%,transparent_70%)] bg-[length:220%_100%] animate-[nb-shimmer_2.6s_linear_infinite]" />
                                            <Send className="relative z-[1] h-5 w-5" aria-hidden="true" />
                                            <span className="relative z-[1]">{isLoading ? "Đang gửi..." : "Gửi link đặt lại"}</span>
                                        </button>

                                        <p className="text-center font-medium text-sm lg:text-base">
                                            <span className="text-gray-600">Quay lại </span>
                                            <Link
                                                to="/signin"
                                                className="font-bold text-gray-900 hover:text-purple-500 border-b-2 border-purple-300 transition-colors"
                                            >
                                                Đăng nhập
                                            </Link>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT — Hero with NB */}
                            <div className="lg:w-[48%] relative overflow-hidden bg-gradient-to-br from-[#B8A9E8] via-[#B29BE7] to-[#9B86DF] p-8 lg:p-12 flex items-center justify-center border-l-0 lg:border-l-2 border-t-2 lg:border-t-0 border-gray-200 nb-hero-glow">
                                {/* Decorative NB shapes */}
                                <div className="absolute top-8 left-8 w-14 h-14 bg-amber-400 border border-gray-200 rounded-lg shadow-soft-sm rotate-12 opacity-60 nb-float" />
                                <div className="absolute bottom-16 left-6 w-10 h-10 bg-purple-400 border border-gray-200 rounded-full shadow-soft-sm opacity-50 nb-float-delay" />
                                <div className="absolute top-[35%] right-8 w-12 h-12 bg-emerald-400 border border-gray-200 rounded-lg shadow-sm -rotate-6 opacity-60 nb-float-slow" />

                                <div className="relative z-10 w-full max-w-md text-right">
                                    <img
                                        className="w-14 lg:w-16 h-auto mb-4 ml-auto nb-logo-hero"
                                        alt="Vtos logo"
                                        src="https://c.animaapp.com/mjxt3t8wNP0otU/img/vtos--1--removebg-preview-2-1.png"
                                    />
                                    <p className="font-extrabold text-gray-900 text-xl lg:text-3xl leading-relaxed mb-6 drop-shadow-[0_2px_0_rgba(255,255,255,0.35)] nb-reveal-pop">
                                        Khôi phục mật khẩu dễ dàng ✦
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
export default ForgotPassword;
