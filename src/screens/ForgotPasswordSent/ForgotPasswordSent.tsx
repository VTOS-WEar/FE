import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Notify } from "../../components/ui/notify";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { GuestLayout } from "../../components/layout/GuestLayout";

// ✅ TODO: đổi sang API thật của bạn
async function forgotPasswordApi(payload: { email: string }) {
    await new Promise((r) => setTimeout(r, 600));
    return {
        message: "If an account with that email exists, we have sent a password reset link.",
    };
}

type SentState = {
    email?: string;
    message?: string;
};

export const ForgotPasswordSent = (): JSX.Element => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = (location.state || {}) as SentState;

    const [email, setEmail] = useState(state.email ?? "");
    const [serverMessage, setServerMessage] = useState(
        state.message ?? "Nếu email tồn tại, hệ thống đã gửi link đặt lại mật khẩu."
    );

    const [isLoading, setIsLoading] = useState(false);
    const [notify, setNotify] = useState<{
        title: string;
        message: string;
        variant: "error" | "success" | "info";
    } | null>(null);

    useEffect(() => {
        // Nếu user vào trực tiếp /sent mà không có email, vẫn cho nhập
    }, []);

    const handleResend = async () => {
        setNotify(null);

        if (!email.trim()) {
            setNotify({
                title: "Thiếu email",
                message: "Vui lòng nhập email để gửi lại link.",
                variant: "error",
            });
            return;
        }

        try {
            setIsLoading(true);
            const res = await forgotPasswordApi({ email: email.trim() });

            setServerMessage(res?.message ?? "Nếu email tồn tại, hệ thống đã gửi lại link.");
            setNotify({
                title: "Đã gửi",
                message: "Nếu email tồn tại, hệ thống đã gửi lại link đặt lại mật khẩu.",
                variant: "success",
            });
        } catch (e: any) {
            setNotify({
                title: "Gửi lại thất bại",
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
                                        Kiểm tra email ✦
                                    </h1>

                                    <div className="flex items-center gap-4 lg:gap-6 my-5 lg:my-6">
                                        <div className="flex-1 h-[2px] bg-[#1A1A2E]/10" />
                                        <span className="font-bold text-[#6B7280] text-sm uppercase tracking-wider">
                                            Link đặt lại đã được gửi
                                        </span>
                                        <div className="flex-1 h-[2px] bg-[#1A1A2E]/10" />
                                    </div>

                                    <div className="space-y-4 lg:space-y-5">
                                        <div className="nb-alert nb-alert-success">
                                            <p className="font-medium text-[#1A1A2E] text-sm leading-relaxed">
                                                {serverMessage}
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="font-bold text-[#1A1A2E] text-sm">
                                                Email (để gửi lại nếu cần)
                                            </Label>
                                            <Input
                                                type="email"
                                                placeholder="Nhập email của bạn"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="nb-input w-full h-11 lg:h-12"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleResend();
                                                }}
                                            />
                                            <p className="text-xs lg:text-sm text-[#6B7280] font-medium">
                                                Không thấy email? Hãy kiểm tra mục Spam/Quảng cáo.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleResend}
                                            disabled={isLoading}
                                            className="nb-btn nb-btn-purple w-full h-14 lg:h-16 text-lg lg:text-xl mt-3 lg:mt-5 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? "Đang gửi lại..." : "Gửi lại link ✦"}
                                        </button>

                                        <div className="flex items-center justify-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => navigate("/forgot-password", { replace: true })}
                                                className="nb-btn nb-btn-outline text-sm"
                                            >
                                                Đổi email khác
                                            </button>

                                            <Link
                                                to="/signin"
                                                className="font-bold text-[#1A1A2E] text-sm hover:text-[#B8A9E8] border-b-2 border-[#B8A9E8] transition-colors"
                                            >
                                                Quay lại đăng nhập
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT — Hero with NB */}
                            <div className="lg:w-[48%] relative overflow-hidden bg-[#C8E44D] p-8 lg:p-12 flex items-center justify-center border-l-0 lg:border-l-2 border-t-2 lg:border-t-0 border-[#1A1A2E]">
                                <div className="absolute top-6 right-8 w-14 h-14 bg-[#F5C6C2] border-2 border-[#1A1A2E] rounded-lg shadow-[3px_3px_0_#1A1A2E] rotate-12 opacity-60" />
                                <div className="absolute bottom-14 right-6 w-10 h-10 bg-[#B8A9E8] border-2 border-[#1A1A2E] rounded-full shadow-[3px_3px_0_#1A1A2E] opacity-50" />
                                <div className="absolute top-[30%] left-8 w-12 h-12 bg-[#F5E642] border-2 border-[#1A1A2E] rounded-lg shadow-[2px_2px_0_#1A1A2E] -rotate-6 opacity-60" />

                                <div className="relative z-10 w-full max-w-md text-right">
                                    <img
                                        className="w-14 lg:w-16 h-auto mb-4 ml-auto"
                                        alt="Vtos logo"
                                        src="https://c.animaapp.com/mjxt3t8wNP0otU/img/vtos--1--removebg-preview-2-1.png"
                                    />
                                    <p className="font-extrabold text-[#1A1A2E] text-xl lg:text-3xl leading-relaxed mb-6">
                                        Đừng quên kiểm tra Spam ✦
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
export default ForgotPasswordSent;