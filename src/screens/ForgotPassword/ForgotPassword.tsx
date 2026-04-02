import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Notify } from "../../components/ui/notify";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword } from "../../lib/api/auth";
import { GuestLayout } from "../../components/layout/GuestLayout";

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
        <GuestLayout bgColor="#FFF8F0">
            <main className="nb-page flex-1 px-4 py-10 lg:py-14 nb-fade-in">
                <div className="mx-auto w-full max-w-6xl">
                    <div className="nb-card-static overflow-hidden rounded-2xl">
                        <div className="flex flex-col lg:flex-row">
                            {/* LEFT — Form */}
                            <div className="lg:w-[52%] flex items-center justify-center p-6 lg:p-12 bg-white">
                                <div className="w-full max-w-[26rem]">
                                    <h1 className="font-extrabold text-[#1A1A2E] text-3xl lg:text-4xl text-center mb-6 lg:mb-8">
                                        Quên mật khẩu ✦
                                    </h1>

                                    <div className="flex items-center gap-4 lg:gap-6 my-5 lg:my-6">
                                        <div className="flex-1 h-[2px] bg-[#1A1A2E]/10" />
                                        <span className="font-bold text-[#6B7280] text-sm uppercase tracking-wider">
                                            Nhập email để nhận link
                                        </span>
                                        <div className="flex-1 h-[2px] bg-[#1A1A2E]/10" />
                                    </div>

                                    <div className="space-y-4 lg:space-y-5">
                                        <div className="space-y-2">
                                            <Label className="font-bold text-[#1A1A2E] text-sm">
                                                Email
                                            </Label>
                                            <Input
                                                type="email"
                                                placeholder="Nhập email của bạn"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="nb-input w-full h-11 lg:h-12"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleSendLink();
                                                }}
                                            />
                                            <p className="text-xs lg:text-sm text-[#6B7280] font-medium">
                                                Nếu email tồn tại, hệ thống sẽ gửi link đặt lại mật khẩu.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleSendLink}
                                            disabled={isLoading}
                                            className="nb-btn nb-btn-purple w-full h-14 lg:h-16 text-lg lg:text-xl mt-3 lg:mt-5 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? "Đang gửi..." : "Gửi link đặt lại ✦"}
                                        </button>

                                        <p className="text-center font-medium text-sm lg:text-base">
                                            <span className="text-[#4C5769]">Quay lại </span>
                                            <Link
                                                to="/signin"
                                                className="font-bold text-[#1A1A2E] hover:text-[#B8A9E8] border-b-2 border-[#B8A9E8] transition-colors"
                                            >
                                                Đăng nhập
                                            </Link>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT — Hero with NB */}
                            <div className="lg:w-[48%] relative overflow-hidden bg-[#A8D4E6] p-8 lg:p-12 flex items-center justify-center border-l-0 lg:border-l-2 border-t-2 lg:border-t-0 border-[#1A1A2E]">
                                {/* Decorative NB shapes */}
                                <div className="absolute top-8 left-8 w-14 h-14 bg-[#F5E642] border-2 border-[#1A1A2E] rounded-lg shadow-[3px_3px_0_#1A1A2E] rotate-12 opacity-60" />
                                <div className="absolute bottom-16 left-6 w-10 h-10 bg-[#B8A9E8] border-2 border-[#1A1A2E] rounded-full shadow-[3px_3px_0_#1A1A2E] opacity-50" />
                                <div className="absolute top-[35%] right-8 w-12 h-12 bg-[#C8E44D] border-2 border-[#1A1A2E] rounded-lg shadow-[2px_2px_0_#1A1A2E] -rotate-6 opacity-60" />

                                <div className="relative z-10 w-full max-w-md text-right">
                                    <img
                                        className="w-14 lg:w-16 h-auto mb-4 ml-auto"
                                        alt="Vtos logo"
                                        src="https://c.animaapp.com/mjxt3t8wNP0otU/img/vtos--1--removebg-preview-2-1.png"
                                    />
                                    <p className="font-extrabold text-[#1A1A2E] text-xl lg:text-3xl leading-relaxed mb-6">
                                        Khôi phục mật khẩu dễ dàng ✦
                                    </p>
                                    <img
                                        className="w-full max-w-[22rem] lg:max-w-[26rem] h-auto ml-auto drop-shadow-[4px_4px_0_rgba(26,26,46,0.3)]"
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