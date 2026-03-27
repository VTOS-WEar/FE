import { NavbarGuest, Footer } from "../../components/layout";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Separator } from "../../components/ui/separator";
import { Notify } from "../../components/ui/notify";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword } from "../../lib/api/auth";
import { GuestLayout } from "../../components/layout/GuestLayout";
// ✅ TODO: đổi sang API thật của bạn
// ví dụ: import { forgotPassword } from "../../lib/api/auth";


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
        <GuestLayout bgColor="#f4f2ff">

            <main className="flex-1 bg-[#F4F6FF] px-4 py-10 lg:py-14">
                <div className="mx-auto w-full max-w-6xl">
                    <div className="overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_60px_rgba(16,15,20,0.12)] ring-1 ring-black/5">
                        <div className="flex flex-col lg:flex-row">
                            {/* LEFT */}
                            <div className="lg:w-[52%] flex items-center justify-center p-6 lg:p-12">
                                <div className="w-full max-w-[26rem]">
                                    <h1 className="[font-family:'Baloo_2',Helvetica] font-extrabold text-[#100f14] text-3xl lg:text-4xl text-center mb-6 lg:mb-8">
                                        Quên mật khẩu
                                    </h1>

                                    <div className="flex items-center gap-4 lg:gap-6 my-5 lg:my-6">
                                        <Separator className="flex-1 h-[1px] bg-[#cac9d6]" />
                                        <span className="font-medium text-[#676576] text-base">
                                            Nhập email để nhận link
                                        </span>
                                        <Separator className="flex-1 h-[1px] bg-[#cac9d6]" />
                                    </div>

                                    <div className="space-y-4 lg:space-y-5">
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
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleSendLink();
                                                }}
                                            />
                                            <p className="text-xs lg:text-sm text-[#676576] italic">
                                                Nếu email tồn tại, hệ thống sẽ gửi link đặt lại mật khẩu.
                                            </p>
                                        </div>

                                        <Button
                                            type="button"
                                            onClick={handleSendLink}
                                            disabled={isLoading}
                                            className="w-full h-14 lg:h-16 bg-[#6838ee] rounded-[2.5rem] hover:bg-[#5527d9] mt-3 lg:mt-5"
                                        >
                                            <span className="[font-family:'Baloo_2',Helvetica] font-extrabold text-white text-lg lg:text-xl">
                                                {isLoading ? "Đang gửi..." : "Gửi link đặt lại"}
                                            </span>
                                        </Button>

                                        <p className="text-center [font-family:'Poppins',Helvetica] font-normal text-sm lg:text-base">
                                            <span className="text-[#494759]">Quay lại </span>
                                            <Link
                                                to="/signin"
                                                className="font-semibold italic text-[#6938ef] cursor-pointer hover:underline"
                                            >
                                                Đăng nhập
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
                                        Khôi phục mật khẩu dễ dàng
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
            />
        </GuestLayout>
    );
};
export default ForgotPassword;