import { EyeIcon, EyeOffIcon } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Notify } from "../../components/ui/notify";
import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../../lib/api/auth";
import { GuestLayout } from "../../components/layout/GuestLayout";

export const ResetPassword = (): JSX.Element => {
    const navigate = useNavigate();
    const [params] = useSearchParams();

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
        if (!newPassword || !rePassword) return true;
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
                navigate("/signin", { replace: true });
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
        <GuestLayout bgColor="#f9fafb">
            <main className="nb-page flex-1 px-4 py-10 lg:py-14 nb-fade-in">
                <div className="mx-auto w-full max-w-6xl">
                    <div className="nb-card-static overflow-hidden rounded-2xl">
                        <div className="flex flex-col lg:flex-row">
                            {/* LEFT — Form */}
                            <div className="lg:w-[52%] flex items-center justify-center p-6 lg:p-12 bg-white">
                                <div className="w-full max-w-[26rem]">
                                    <h1 className="font-extrabold text-gray-900 text-3xl lg:text-4xl text-center mb-6 lg:mb-8">
                                        Đặt lại mật khẩu ✦
                                    </h1>

                                    <div className="flex items-center gap-4 lg:gap-6 my-5 lg:my-6">
                                        <div className="flex-1 h-[2px] bg-gray-900/10" />
                                        <span className="font-bold text-gray-500 text-sm uppercase tracking-wider">
                                            Nhập mật khẩu mới
                                        </span>
                                        <div className="flex-1 h-[2px] bg-gray-900/10" />
                                    </div>

                                    <div className="space-y-4 lg:space-y-5">
                                        {/* Password */}
                                        <div className="space-y-2">
                                            <Label className="font-bold text-gray-900 text-sm">
                                                Mật khẩu mới
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    type={showPass1 ? "text" : "password"}
                                                    placeholder="Nhập mật khẩu mới"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="nb-input w-full h-11 lg:h-12 pr-12"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPass1((p) => !p)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 transition-colors"
                                                    aria-label="Toggle password visibility"
                                                >
                                                    {showPass1 ? (
                                                        <EyeIcon className="w-5 h-5" />
                                                    ) : (
                                                        <EyeOffIcon className="w-5 h-5" />
                                                    )}
                                                </button>
                                            </div>
                                            <p className="text-xs lg:text-sm text-gray-500 font-medium">
                                                Gợi ý: tối thiểu 8 ký tự.
                                            </p>
                                        </div>

                                        {/* Re Password */}
                                        <div className="space-y-2">
                                            <Label className="font-bold text-gray-900 text-sm">
                                                Nhập lại mật khẩu
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    type={showPass2 ? "text" : "password"}
                                                    placeholder="Nhập lại mật khẩu"
                                                    value={rePassword}
                                                    onChange={(e) => setRePassword(e.target.value)}
                                                    className={`nb-input w-full h-11 lg:h-12 pr-12 ${!passwordsMatch ? "!border-[#E8A0A0]" : ""}`}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") handleSubmit();
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPass2((p) => !p)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 transition-colors"
                                                    aria-label="Toggle password visibility"
                                                >
                                                    {showPass2 ? (
                                                        <EyeIcon className="w-5 h-5" />
                                                    ) : (
                                                        <EyeOffIcon className="w-5 h-5" />
                                                    )}
                                                </button>
                                            </div>

                                            {!passwordsMatch && (
                                                <p className="text-xs lg:text-sm text-red-800 font-bold">
                                                    Mật khẩu nhập lại không khớp.
                                                </p>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleSubmit}
                                            disabled={isLoading}
                                            className="nb-btn nb-btn-purple w-full h-14 lg:h-16 text-lg lg:text-xl mt-3 lg:mt-5 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? "Đang xử lý..." : "Xác nhận ✦"}
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
                            <div className="lg:w-[48%] relative overflow-hidden bg-pink-200 p-8 lg:p-12 flex items-center justify-center border-l-0 lg:border-l-2 border-t-2 lg:border-t-0 border-gray-200">
                                <div className="absolute top-8 left-8 w-14 h-14 bg-purple-400 border border-gray-200 rounded-lg shadow-soft-sm rotate-12 opacity-60" />
                                <div className="absolute bottom-14 left-6 w-10 h-10 bg-emerald-400 border border-gray-200 rounded-full shadow-soft-sm opacity-50" />
                                <div className="absolute top-[35%] right-8 w-12 h-12 bg-amber-400 border border-gray-200 rounded-lg shadow-sm -rotate-6 opacity-60" />

                                <div className="relative z-10 w-full max-w-md text-right">
                                    <img
                                        className="w-14 lg:w-16 h-auto mb-4 ml-auto"
                                        alt="Vtos logo"
                                        src="https://c.animaapp.com/mjxt3t8wNP0otU/img/vtos--1--removebg-preview-2-1.png"
                                    />
                                    <p className="font-extrabold text-gray-900 text-xl lg:text-3xl leading-relaxed mb-6">
                                        Đổi mật khẩu nhanh chóng & an toàn ✦
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
export default ResetPassword;