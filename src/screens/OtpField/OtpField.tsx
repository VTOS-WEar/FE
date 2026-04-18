import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Label } from "../../components/ui/label";
import { Notify } from "../../components/ui/notify";
import { verifyEmail, resendOtpEmail } from "../../lib/api/auth";
import { ApiError } from "../../lib/api/clients";
import { GuestLayout } from "../../components/layout/GuestLayout";

type VerifyEmailErrorDetails = {
    code?: "INVALID_OTP" | "OTP_EXPIRED" | "EMAIL_NOT_FOUND";
    error?: string;
    message?: string;
};

function maskEmail(email: string) {
    const [name, domain] = email.split("@");
    if (!domain) return email;
    const visible = name.slice(0, 2);
    return `${visible}${"*".repeat(Math.max(0, name.length - 2))}@${domain}`;
}

export const VerifyOtp = (): JSX.Element => {
    const navigate = useNavigate();
    const location = useLocation();

    const OTP_LEN = 6;

    const email = useMemo(() => {
        const st = location.state as any;
        const fromState = (st?.email as string) || "";
        const fromStorage = localStorage.getItem("verify_email") || "";
        const value = fromState || fromStorage;

        if (fromState) localStorage.setItem("verify_email", fromState);
        return value;
    }, [location.state]);

    const roleName = useMemo(() => {
        const st = location.state as any;
        const fromState = (st?.roleName as string) || "";
        const fromStorage = localStorage.getItem("verify_roleName") || "";
        const value = fromState || fromStorage || "Parent";

        if (fromState) localStorage.setItem("verify_roleName", fromState);
        return value;
    }, [location.state]);

    const [otp, setOtp] = useState<string>("");
    const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [notify, setNotify] = useState<{
        title: string;
        message: string;
        variant: "error" | "success" | "info";
        durationMs?: 3500;
    } | null>(null);

    const [cooldown, setCooldown] = useState(60);

    useEffect(() => {
        inputsRef.current[0]?.focus();
    }, []);

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setInterval(() => setCooldown((s) => s - 1), 1000);
        return () => clearInterval(t);
    }, [cooldown]);

    const otpValue = otp;

    const focusIndex = (i: number) => {
        inputsRef.current[i]?.focus();
        inputsRef.current[i]?.select?.();
    };

    const setCharAt = (s: string, i: number, ch: string) => {
        const arr = s.padEnd(OTP_LEN, " ").split("");
        arr[i] = ch;
        return arr.join("").replace(/\s/g, "");
    };

    const handleChange = (i: number, val: string) => {
        const v = val.replace(/\D/g, "");
        if (!v) {
            setOtp((prev) => setCharAt(prev, i, ""));
            return;
        }

        const chars = v.split("");
        setOtp((prev) => {
            let next = prev;
            let idx = i;
            for (const c of chars) {
                if (idx >= OTP_LEN) break;
                next = setCharAt(next, idx, c);
                idx++;
            }
            return next;
        });

        const nextIndex = Math.min(i + chars.length, OTP_LEN - 1);
        focusIndex(nextIndex);
    };

    const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace") {
            if (otp[i]) {
                setOtp((prev) => setCharAt(prev, i, ""));
                return;
            }
            if (i > 0) {
                focusIndex(i - 1);
                setOtp((prev) => setCharAt(prev, i - 1, ""));
            }
        }

        if (e.key === "ArrowLeft" && i > 0) focusIndex(i - 1);
        if (e.key === "ArrowRight" && i < OTP_LEN - 1) focusIndex(i + 1);

        if (e.key === "Enter") {
            void handleVerify();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LEN);
        if (!text) return;

        setOtp(text);
        focusIndex(Math.min(text.length, OTP_LEN - 1));
    };

    const handleVerify = async () => {
        setNotify(null);

        if (!email) {
            setNotify({
                title: "Thiếu thông tin",
                message: "Không tìm thấy email. Vui lòng quay lại bước trước.",
                variant: "error",
            });
            return;
        }

        if (otpValue.length !== OTP_LEN) {
            setNotify({
                title: "OTP chưa đủ",
                message: `Vui lòng nhập đủ ${OTP_LEN} chữ số.`,
                variant: "error",
            });
            return;
        }

        try {
            setIsLoading(true);
            await verifyEmail({ email, otp: otpValue });

            setNotify({
                title: "Xác thực thành công! 🎉",
                message: "Email của bạn đã được xác nhận. Chuyển đến trang đăng nhập sau 3 giây...",
                variant: "success",
            });

            setTimeout(() => {
                navigate("/signin", { replace: true, state: { email, roleName } });
            }, 3000);
        } catch (e: any) {
            if (e instanceof ApiError) {
                const details = e.details as VerifyEmailErrorDetails | undefined;

                if (e.status === 400 && details?.code === "INVALID_OTP") {
                    setNotify({
                        title: "Sai OTP",
                        message: "Mã OTP không đúng. Vui lòng thử lại.",
                        variant: "error",
                    });
                    return;
                }

                if (e.status === 400 && details?.code === "OTP_EXPIRED") {
                    setNotify({
                        title: "OTP hết hạn",
                        message: "Mã OTP đã hết hạn. Vui lòng gửi lại OTP.",
                        variant: "error",
                    });
                    return;
                }

                setNotify({
                    title: "Xác thực thất bại",
                    message: e.message || "Có lỗi xảy ra.",
                    variant: "error",
                });
                return;
            }

            setNotify({
                title: "Xác thực thất bại",
                message: e?.message || "Không thể kết nối server.",
                variant: "error",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setNotify(null);

        if (!email) {
            setNotify({
                title: "Thiếu thông tin",
                message: "Không tìm thấy email để gửi lại OTP.",
                variant: "error",
            });
            return;
        }

        try {
            setIsLoading(true);
            await resendOtpEmail(email);
            setCooldown(60);

            setNotify({
                title: "Đã gửi lại OTP",
                message: "Vui lòng kiểm tra email của bạn.",
                variant: "success",
            });

            setOtp("");
            setTimeout(() => focusIndex(0), 0);
        } catch (err: any) {
            setNotify({
                title: "Gửi lại thất bại",
                message: err?.message || "Có lỗi xảy ra.",
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
                            {/* LEFT — Form */}
                            <div className="lg:w-[52%] flex items-center justify-center p-6 lg:p-12 bg-white">
                                <div className="w-full max-w-[26rem]">
                                    <h1 className="font-extrabold text-gray-900 text-3xl lg:text-4xl text-center mb-3">
                                        Nhập mã OTP ✦
                                    </h1>

                                    <p className="text-center font-medium text-gray-500 text-sm lg:text-base mb-6">
                                        Mã đã được gửi tới{" "}
                                        <span className="font-bold text-gray-900">
                                            {email ? maskEmail(email) : "email của bạn"}
                                        </span>
                                    </p>

                                    <div className="flex items-center gap-4 lg:gap-6 my-5 lg:my-6">
                                        <div className="flex-1 h-[2px] bg-gray-900/10" />
                                        <span className="font-bold text-gray-500 text-sm uppercase tracking-wider">
                                            Xác thực
                                        </span>
                                        <div className="flex-1 h-[2px] bg-gray-900/10" />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="font-bold text-gray-900 text-sm">
                                                OTP (6 chữ số)
                                            </Label>

                                            <div className="flex items-center justify-between gap-2">
                                                {Array.from({ length: OTP_LEN }).map((_, i) => {
                                                    const d = otp[i] ?? "";
                                                    return (
                                                        <input
                                                            key={i}
                                                            ref={(el) => {
                                                                inputsRef.current[i] = el;
                                                            }}
                                                            inputMode="numeric"
                                                            pattern="[0-9]*"
                                                            maxLength={1}
                                                            value={d}
                                                            onChange={(e) => handleChange(i, e.target.value)}
                                                            onKeyDown={(e) => handleKeyDown(i, e)}
                                                            onPaste={handlePaste}
                                                            className="w-12 h-14 text-center text-2xl font-extrabold border border-gray-200 rounded-xl bg-white shadow-soft-sm focus:shadow-soft-sm ring-2 ring-purple-300 outline-none transition-all"
                                                        />
                                                    );
                                                })}
                                            </div>

                                            <div className="flex items-center justify-between text-sm mt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(-1)}
                                                    className="font-bold text-gray-600 hover:text-gray-800 transition-colors"
                                                >
                                                    ← Quay lại
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={cooldown > 0 || isLoading}
                                                    onClick={() => void handleResend()}
                                                    className="font-bold text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed hover:text-purple-500 transition-colors border-b-2 border-transparent hover:border-purple-300"
                                                >
                                                    {cooldown > 0 ? `Gửi lại OTP (${cooldown}s)` : "Gửi lại OTP"}
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => void handleVerify()}
                                            disabled={isLoading}
                                            className="nb-btn nb-btn-purple w-full h-14 lg:h-16 text-lg lg:text-xl mt-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? "Đang xác thực..." : "Xác thực ✦"}
                                        </button>

                                        <p className="text-center font-medium text-sm lg:text-base">
                                            <span className="text-gray-600">Sai email? </span>
                                            <span
                                                onClick={() => navigate("/register", { replace: true })}
                                                className="font-bold text-gray-900 hover:text-purple-500 border-b-2 border-purple-300 transition-colors cursor-pointer"
                                            >
                                                Đăng ký lại
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT — Hero with NB */}
                            <div className="lg:w-[48%] relative overflow-hidden bg-violet-50 p-8 lg:p-12 flex items-center justify-center border-l-0 lg:border-l-2 border-t-2 lg:border-t-0 border-gray-200">
                                <div className="absolute top-8 left-6 w-14 h-14 bg-emerald-400 border border-gray-200 rounded-lg shadow-soft-sm rotate-12 opacity-60" />
                                <div className="absolute bottom-14 right-8 w-10 h-10 bg-pink-200 border border-gray-200 rounded-full shadow-soft-sm opacity-50" />
                                <div className="absolute top-[40%] right-6 w-12 h-12 bg-amber-400 border border-gray-200 rounded-lg shadow-sm -rotate-6 opacity-60" />

                                <div className="relative z-10 w-full max-w-md text-right">
                                    <img
                                        className="w-14 lg:w-16 h-auto mb-4 ml-auto"
                                        alt="Vtos logo"
                                        src="https://c.animaapp.com/mjxt3t8wNP0otU/img/vtos--1--removebg-preview-2-1.png"
                                    />
                                    <p className="font-extrabold text-gray-900 text-xl lg:text-3xl leading-relaxed mb-6">
                                        AI Try-On đồng phục trong vài giây ✦
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
                durationMs={3500}
            />
        </GuestLayout>
    );
};

export default VerifyOtp;
