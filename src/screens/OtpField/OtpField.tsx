import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { NavbarGuest, Footer } from "../../components/layout";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Notify } from "../../components/ui/notify";
import { Separator } from "../../components/ui/separator";
import { Input } from "../../components/ui/input";
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

    // ✅ email nhận từ state; fallback localStorage để tránh mất khi refresh
    const email = useMemo(() => {
        const st = location.state as any;
        const fromState = (st?.email as string) || "";
        const fromStorage = localStorage.getItem("verify_email") || "";
        const value = fromState || fromStorage;

        if (fromState) localStorage.setItem("verify_email", fromState);
        return value;
    }, [location.state]);

    // roleName from navigation state (fallback localStorage)
    const roleName = useMemo(() => {
        const st = location.state as any;
        const fromState = (st?.roleName as string) || "";
        const fromStorage = localStorage.getItem("verify_roleName") || "";
        const value = fromState || fromStorage || "Parent";

        if (fromState) localStorage.setItem("verify_roleName", fromState);
        return value;
    }, [location.state]);

    // ✅ otp là string
    const [otp, setOtp] = useState<string>("");
    const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [notify, setNotify] = useState<{
        title: string;
        message: string;
        variant: "error" | "success" | "info";
        durationMs?: 3500;
    } | null>(null);

    // countdown gửi lại    
    const [cooldown, setCooldown] = useState(60);

    useEffect(() => {
        inputsRef.current[0]?.focus();
    }, []);

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setInterval(() => setCooldown((s) => s - 1), 1000);
        return () => clearInterval(t);
    }, [cooldown]);

    const otpValue = otp; // ✅ luôn là string

    const focusIndex = (i: number) => {
        inputsRef.current[i]?.focus();
        inputsRef.current[i]?.select?.();
    };

    // helper: set 1 ký tự tại vị trí i trong otp string
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

        // gõ/dán nhiều số vào 1 ô
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

            // reset OTP + focus lại
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
        <GuestLayout bgColor="#f4f2ff">

            <main className="flex-1 bg-[#F4F6FF] px-4 py-10 lg:py-14">
                <div className="mx-auto w-full max-w-6xl">
                    <div className="overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_60px_rgba(16,15,20,0.12)] ring-1 ring-black/5">
                        <div className="flex flex-col lg:flex-row">
                            {/* LEFT */}
                            <div className="lg:w-[52%] flex items-center justify-center p-6 lg:p-12">
                                <div className="w-full max-w-[26rem]">
                                    <h1 className="[font-family:'Baloo_2',Helvetica] font-extrabold text-[#100f14] text-3xl lg:text-4xl text-center mb-3">
                                        Nhập mã OTP
                                    </h1>

                                    <p className="text-center [font-family:'Montserrat',Helvetica] font-medium text-[#676576] text-sm lg:text-base mb-6">
                                        Mã đã được gửi tới{" "}
                                        <span className="font-semibold text-[#19181f]">
                                            {email ? maskEmail(email) : "email của bạn"}
                                        </span>
                                    </p>

                                    <div className="flex items-center gap-4 lg:gap-6 my-5 lg:my-6">
                                        <Separator className="flex-1 h-[1px] bg-[#cac9d6]" />
                                        <span className="[font-family:'Montserrat',Helvetica] font-medium text-[#676576] text-base">
                                            Xác thực
                                        </span>
                                        <Separator className="flex-1 h-[1px] bg-[#cac9d6]" />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="[font-family:'Montserrat',Helvetica] font-medium text-[#9794aa] text-sm lg:text-base">
                                                OTP (6 chữ số)
                                            </Label>

                                            <div className="flex items-center justify-between gap-2">
                                                {Array.from({ length: OTP_LEN }).map((_, i) => {
                                                    const d = otp[i] ?? "";
                                                    return (
                                                        <Input
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
                                                            className="h-12 lg:h-14 w-12 lg:w-14 text-center text-lg lg:text-xl font-bold rounded-md border border-[#cac9d6]"
                                                        />
                                                    );
                                                })}
                                            </div>

                                            <div className="flex items-center justify-between text-sm lg:text-base mt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(-1)}
                                                    className="[font-family:'Montserrat',Helvetica] font-medium italic text-[#676576] hover:opacity-70"
                                                >
                                                    Quay lại
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={cooldown > 0 || isLoading}
                                                    onClick={() => void handleResend()}
                                                    className="[font-family:'Montserrat',Helvetica] font-semibold italic text-[#6938ef] disabled:opacity-50 disabled:cursor-not-allowed hover:underline"
                                                >
                                                    {cooldown > 0 ? `Gửi lại OTP (${cooldown}s)` : "Gửi lại OTP"}
                                                </button>
                                            </div>
                                        </div>

                                        <Button
                                            type="button"
                                            onClick={() => void handleVerify()}
                                            disabled={isLoading}
                                            className="w-full h-14 lg:h-16 bg-[#6838ee] rounded-[2.5rem] hover:bg-[#5527d9] mt-3"
                                        >
                                            <span className="[font-family:'Baloo_2',Helvetica] font-extrabold text-white text-lg lg:text-xl">
                                                {isLoading ? "Đang xác thực..." : "Xác thực"}
                                            </span>
                                        </Button>

                                        <p className="text-center [font-family:'Poppins',Helvetica] font-normal text-sm lg:text-base">
                                            <span className="text-[#494759]">Sai email? </span>
                                            <span
                                                onClick={() => navigate("/register", { replace: true })}
                                                className="[font-family:'Montserrat',Helvetica] font-semibold italic text-[#6938ef] cursor-pointer hover:underline"
                                            >
                                                Đăng ký lại
                                            </span>
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
                                    <p className="[font-family:'Montserrat',Helvetica] font-semibold italic text-white text-xl lg:text-3xl leading-relaxed mb-6">
                                        AI Try-On đồng phục trong vài giây
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
