import { EyeIcon, EyeOffIcon } from "lucide-react";
import { NavbarGuest, Footer, } from "../../components/layout";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Separator } from "../../components/ui/separator";
import { Notify } from "../../components/ui/notify";
import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../../lib/api/auth";
import { GuestLayout } from "../../components/layout/GuestLayout";

export const ResetPassword = (): JSX.Element => {
    const navigate = useNavigate();
    const [params] = useSearchParams();

    // ✅ token nằm trong URL: /reset-password?token=...
    const token = params.get("token") ?? "";

    const [showPass1, setShowPass1] = useState(false);
    const [showPass2, setShowPass2] = useState(false);

    const [newPassword, setNewPassword] = useState("");
    const [rePassword, setRePassword] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [notify, setNotify] = useState<{
        title: string;
        message: string;
        variant: "error" | "success" | "info";
    } | null>(null);

    const passwordsMatch = useMemo(() => {
        if (!newPassword || !rePassword) return true; // chưa nhập đủ thì chưa báo sai
        return newPassword === rePassword;
    }, [newPassword, rePassword]);

    const handleSubmit = async () => {
        setNotify(null);

        if (!token) {
            setNotify({
                title: "Link không hợp lệ",
                message: "Token không tồn tại hoặc link đã bị lỗi. Vui lòng gửi lại yêu cầu quên mật khẩu.",
                variant: "error",
            });
            return;
        }

        if (!newPassword || !rePassword) {
            setNotify({
                title: "Thiếu thông tin",
                message: "Vui lòng nhập mật khẩu mới và nhập lại mật khẩu.",
                variant: "error",
            });
            return;
        }

        if (newPassword.length < 8) {
            setNotify({
                title: "Mật khẩu chưa đủ mạnh",
                message: "Mật khẩu cần tối thiểu 8 ký tự.",
                variant: "error",
            });
            return;
        }

        if (!passwordsMatch) {
            setNotify({
                title: "Không khớp mật khẩu",
                message: "Mật khẩu nhập lại không giống mật khẩu mới.",
                variant: "error",
            });
            return;
        }

        try {
            setIsLoading(true);

            const res = await resetPassword({ token, newPassword });

            setNotify({
                title: "Đổi mật khẩu thành công",
                message: res?.message || "Bạn có thể đăng nhập bằng mật khẩu mới.",
                variant: "success",
            });

            setTimeout(() => {
                navigate("/sign-in", { replace: true });
            }, 900);
        } catch (e: any) {
            setNotify({
                title: "Đổi mật khẩu thất bại",
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
                                        Đặt lại mật khẩu
                                    </h1>

                                    <div className="flex items-center gap-4 lg:gap-6 my-5 lg:my-6">
                                        <Separator className="flex-1 h-[1px] bg-[#cac9d6]" />
                                        <span className="[font-family:'Montserrat',Helvetica] font-medium text-[#676576] text-base">
                                            Nhập mật khẩu mới
                                        </span>
                                        <Separator className="flex-1 h-[1px] bg-[#cac9d6]" />
                                    </div>

                                    <div className="space-y-4 lg:space-y-5">
                                        {/* Password */}
                                        <div className="space-y-2">
                                            <Label className="[font-family:'Montserrat',Helvetica] font-medium text-[#9794aa] text-sm lg:text-base">
                                                Mật khẩu mới
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    type={showPass1 ? "text" : "password"}
                                                    placeholder="Nhập mật khẩu mới"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="h-11 lg:h-12 px-4 lg:px-5 pr-12 rounded-md border border-[#cac9d6] [font-family:'Montserrat',Helvetica] font-medium text-sm lg:text-base"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPass1((p) => !p)}
                                                    className="absolute right-4 lg:right-5 top-1/2 -translate-y-1/2 text-[#676576] hover:opacity-80"
                                                    aria-label="Toggle password visibility"
                                                >
                                                    {showPass1 ? (
                                                        <EyeIcon className="w-5 lg:w-6 h-5 lg:h-6" />
                                                    ) : (
                                                        <EyeOffIcon className="w-5 lg:w-6 h-5 lg:h-6" />
                                                    )}
                                                </button>
                                            </div>

                                            <p className="[font-family:'Montserrat',Helvetica] text-xs lg:text-sm text-[#676576] italic">
                                                Gợi ý: tối thiểu 8 ký tự.
                                            </p>
                                        </div>

                                        {/* Re Password */}
                                        <div className="space-y-2">
                                            <Label className="[font-family:'Montserrat',Helvetica] font-medium text-[#9794aa] text-sm lg:text-base">
                                                Nhập lại mật khẩu
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    type={showPass2 ? "text" : "password"}
                                                    placeholder="Nhập lại mật khẩu"
                                                    value={rePassword}
                                                    onChange={(e) => setRePassword(e.target.value)}
                                                    className={[
                                                        "h-11 lg:h-12 px-4 lg:px-5 pr-12 rounded-md border [font-family:'Montserrat',Helvetica] font-medium text-sm lg:text-base",
                                                        passwordsMatch ? "border-[#cac9d6]" : "border-red-400",
                                                    ].join(" ")}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") handleSubmit();
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPass2((p) => !p)}
                                                    className="absolute right-4 lg:right-5 top-1/2 -translate-y-1/2 text-[#676576] hover:opacity-80"
                                                    aria-label="Toggle password visibility"
                                                >
                                                    {showPass2 ? (
                                                        <EyeIcon className="w-5 lg:w-6 h-5 lg:h-6" />
                                                    ) : (
                                                        <EyeOffIcon className="w-5 lg:w-6 h-5 lg:h-6" />
                                                    )}
                                                </button>
                                            </div>

                                            {!passwordsMatch && (
                                                <p className="[font-family:'Montserrat',Helvetica] text-xs lg:text-sm text-red-500 italic">
                                                    Mật khẩu nhập lại không khớp.
                                                </p>
                                            )}
                                        </div>

                                        <Button
                                            type="button"
                                            onClick={handleSubmit}
                                            disabled={isLoading}
                                            className="w-full h-14 lg:h-16 bg-[#6838ee] rounded-[2.5rem] hover:bg-[#5527d9] mt-3 lg:mt-5"
                                        >
                                            <span className="[font-family:'Baloo_2',Helvetica] font-extrabold text-white text-lg lg:text-xl">
                                                {isLoading ? "Đang xử lý..." : "Xác nhận"}
                                            </span>
                                        </Button>

                                        <p className="text-center [font-family:'Poppins',Helvetica] font-normal text-sm lg:text-base">
                                            <span className="text-[#494759]">Quay lại </span>
                                            <Link
                                                to="/signin"
                                                className="[font-family:'Montserrat',Helvetica] font-semibold italic text-[#6938ef] cursor-pointer hover:underline"
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

                                    <p className="[font-family:'Montserrat',Helvetica] font-semibold italic text-white text-xl lg:text-3xl leading-relaxed mb-6">
                                        Đổi mật khẩu nhanh chóng & an toàn
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
export default ResetPassword;