import { useEffect, useMemo, useState } from "react";
import { KeyRound, Mail, Shield, ShieldAlert, ShieldCheck, ShieldOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getParentProfile } from "../../lib/api/users";
import { getSchoolProfile } from "../../lib/api/schools";
import { getProviderProfile } from "../../lib/api/providers";
import { disable2FA, requestChangePasswordOtp, changePassword } from "../../lib/api/auth";

export const AccountSecuritySettings = (): JSX.Element => {
    const navigate = useNavigate();
    const getToken = () =>
        localStorage.getItem("access_token") || sessionStorage.getItem("access_token") || "";

    const [is2FAEnabled, setIs2FAEnabled] = useState<boolean | null>(
        localStorage.getItem("vtos_2fa_enabled") === "true"
    );
    const [showDisable2FA, setShowDisable2FA] = useState(false);
    const [disable2FACode, setDisable2FACode] = useState("");
    const [disabling2FA, setDisabling2FA] = useState(false);
    const [disable2FAMsg, setDisable2FAMsg] = useState("");

    const [otpSent, setOtpSent] = useState(false);
    const [requestingOtp, setRequestingOtp] = useState(false);
    const [otpRequestMsg, setOtpRequestMsg] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [changingPassword, setChangingPassword] = useState(false);
    const [changePasswordMsg, setChangePasswordMsg] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
                let twoFAEnabled = false;

                try {
                    const user = raw ? JSON.parse(raw) : {};
                    if (user.role === "School") {
                        const profile = await getSchoolProfile();
                        twoFAEnabled = !!(profile.twoFactorEnabled ?? (profile as any).TwoFactorEnabled);
                    } else if (user.role === "Provider") {
                        const profile = await getProviderProfile();
                        twoFAEnabled = !!(profile.twoFactorEnabled ?? (profile as any).TwoFactorEnabled);
                    } else if (user.role === "Admin") {
                        const twoFA = localStorage.getItem("vtos_2fa_enabled");
                        twoFAEnabled = twoFA === "true";
                    } else {
                        const profile = await getParentProfile();
                        twoFAEnabled = profile.twoFactorEnabled ?? false;
                    }
                } catch {
                    const twoFA = localStorage.getItem("vtos_2fa_enabled");
                    twoFAEnabled = twoFA === "true";
                }

                setIs2FAEnabled(twoFAEnabled);
                localStorage.setItem("vtos_2fa_enabled", twoFAEnabled ? "true" : "false");
            } catch {
                const twoFA = localStorage.getItem("vtos_2fa_enabled");
                setIs2FAEnabled(twoFA === "true");
            }
        };

        fetchProfile();
    }, []);

    const protectionLabel =
        is2FAEnabled === null ? "Đang kiểm tra bảo mật" : is2FAEnabled ? "Đang được bảo vệ tốt" : "Mức bảo vệ cơ bản";
    const protectionCopy =
        is2FAEnabled === null
            ? "Đang đồng bộ trạng thái xác thực hai bước cho tài khoản hiện tại."
            : is2FAEnabled
                ? "Tài khoản đã có thêm lớp xác thực qua ứng dụng, giúp giảm rủi ro khi lộ mật khẩu."
                : "Tài khoản hiện chỉ dựa vào mật khẩu. Nên bật 2FA để tăng độ an toàn cho thao tác quản trị.";

    const summaryCards = useMemo(
        () => [
            {
                label: "Trạng thái 2FA",
                value: is2FAEnabled === null ? "Đang tải" : is2FAEnabled ? "Đang bật" : "Đang tắt",
                tone:
                    is2FAEnabled === null
                        ? "border-gray-200 bg-gray-50 text-gray-600"
                        : is2FAEnabled
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-amber-200 bg-amber-50 text-amber-800",
                icon:
                    is2FAEnabled === null ? (
                        <Shield className="h-5 w-5" />
                    ) : is2FAEnabled ? (
                        <ShieldCheck className="h-5 w-5" />
                    ) : (
                        <ShieldAlert className="h-5 w-5" />
                    ),
            },
            {
                label: "Luồng đổi mật khẩu",
                value: otpSent ? "Đang chờ xác minh OTP" : "Sẵn sàng yêu cầu OTP",
                tone: otpSent
                    ? "border-violet-200 bg-violet-50 text-violet-700"
                    : "border-sky-200 bg-sky-50 text-sky-700",
                icon: <KeyRound className="h-5 w-5" />,
            },
        ],
        [is2FAEnabled, otpSent]
    );

    const handleRequestOtp = async () => {
        setRequestingOtp(true);
        setOtpRequestMsg("");
        setChangePasswordMsg("");

        try {
            const token = getToken();
            await requestChangePasswordOtp(token);
            setOtpSent(true);
            setOtpRequestMsg("Đã gửi mã OTP đến email của bạn.");
        } catch (err: any) {
            setOtpRequestMsg(err?.message || "Không thể gửi OTP.");
        } finally {
            setRequestingOtp(false);
        }
    };

    const handleChangePassword = async () => {
        if (!otp || !newPassword || !confirmPassword) return;
        if (newPassword !== confirmPassword) {
            setChangePasswordMsg("Mật khẩu mới không khớp.");
            return;
        }

        setChangingPassword(true);
        setChangePasswordMsg("");

        try {
            const token = getToken();
            await changePassword({ otp, newPassword, confirmPassword }, token);
            setChangePasswordMsg("Đổi mật khẩu thành công.");
            setOtp("");
            setNewPassword("");
            setConfirmPassword("");
            setOtpSent(false);
        } catch (err: any) {
            setChangePasswordMsg(err?.message || "Không thể đổi mật khẩu.");
        } finally {
            setChangingPassword(false);
        }
    };

    const handleDisable2FA = async () => {
        if (disable2FACode.length !== 6) return;

        setDisabling2FA(true);
        setDisable2FAMsg("");

        try {
            const token = getToken();
            await disable2FA(disable2FACode, token);
            setIs2FAEnabled(false);
            localStorage.setItem("vtos_2fa_enabled", "false");
            setShowDisable2FA(false);
            setDisable2FACode("");
            setDisable2FAMsg("Đã tắt 2FA.");
        } catch (err: any) {
            setDisable2FAMsg(err?.message || "Mã không hợp lệ.");
        } finally {
            setDisabling2FA(false);
        }
    };

    return (
        <div className="space-y-6">
            <section className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-[22px] border border-gray-200 bg-white p-5 shadow-soft-sm">
                    <div className="flex items-start gap-3">
                        <div
                            className={`rounded-2xl p-3 ${
                                is2FAEnabled === null
                                    ? "bg-gray-100 text-gray-500"
                                    : is2FAEnabled
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "bg-amber-50 text-amber-700"
                            }`}
                        >
                            {is2FAEnabled === null ? (
                                <Shield className="h-5 w-5" />
                            ) : is2FAEnabled ? (
                                <ShieldCheck className="h-5 w-5" />
                            ) : (
                                <ShieldOff className="h-5 w-5" />
                            )}
                        </div>
                        <div>
                            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-gray-500">Tổng quan bảo mật</p>
                            <h2 className="mt-2 text-lg font-extrabold text-gray-900">{protectionLabel}</h2>
                            <p className="mt-1 text-sm font-medium leading-6 text-[#4c5769]">{protectionCopy}</p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    {summaryCards.map((card) => (
                        <div key={card.label} className={`rounded-[22px] border p-4 shadow-soft-sm ${card.tone}`}>
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs font-extrabold uppercase tracking-[0.16em] opacity-70">{card.label}</p>
                                    <p className="mt-2 text-sm font-bold">{card.value}</p>
                                </div>
                                <div className="rounded-2xl bg-white/70 p-3">{card.icon}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
                <section className="nb-card-static p-0">
                    <div className="border-b border-gray-200 px-6 py-5">
                        <div className="flex items-center gap-3">
                            <div className="rounded-2xl bg-violet-50 p-3 text-violet-700">
                                <KeyRound className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-extrabold text-gray-900">Đổi mật khẩu</h3>
                                <p className="mt-1 text-sm font-medium text-[#4c5769]">
                                    Luồng này yêu cầu OTP gửi qua email trước khi xác nhận mật khẩu mới.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-5 px-6 py-6">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <StepCard
                                number="1"
                                title="Yêu cầu mã OTP"
                                description="Gửi mã xác minh về email đã liên kết với tài khoản."
                                active={!otpSent}
                            />
                            <StepCard
                                number="2"
                                title="Nhập OTP và mật khẩu mới"
                                description="Chỉ hiển thị sau khi OTP đã được gửi thành công."
                                active={otpSent}
                            />
                        </div>

                        {!otpSent ? (
                            <div className="rounded-[18px] border border-sky-200 bg-sky-50 p-5">
                                <div className="flex items-start gap-3">
                                    <div className="rounded-2xl bg-white p-3 text-sky-700 shadow-soft-sm">
                                        <Mail className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-extrabold text-sky-900">Bước khởi tạo OTP</p>
                                        <p className="mt-1 text-sm font-medium leading-6 text-sky-900/80">
                                            Nhấn nút bên dưới để gửi mã xác minh. Sau đó giao diện sẽ mở bước nhập OTP và mật khẩu mới.
                                        </p>
                                        <button
                                            onClick={handleRequestOtp}
                                            disabled={requestingOtp}
                                            className="nb-btn nb-btn-purple mt-4 text-sm disabled:opacity-50"
                                        >
                                            {requestingOtp ? "Đang gửi..." : "Yêu cầu mã OTP"}
                                        </button>
                                        {otpRequestMsg && (
                                            <InlineMessage
                                                className={otpRequestMsg.startsWith("Đã") ? "text-emerald-700" : "text-red-700"}
                                                message={otpRequestMsg}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 rounded-[18px] border border-violet-200 bg-violet-50/70 p-5">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FieldGroup label="Mã OTP">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={6}
                                            value={otp}
                                            onChange={(event) => {
                                                if (/^\d*$/.test(event.target.value)) setOtp(event.target.value);
                                            }}
                                            placeholder="Nhập mã OTP 6 chữ số"
                                            className="nb-input w-full h-11 text-sm"
                                        />
                                    </FieldGroup>

                                    <div className="rounded-[16px] border border-white/80 bg-white px-4 py-3 shadow-soft-sm">
                                        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-violet-600">Trạng thái</p>
                                        <p className="mt-1 text-sm font-bold text-gray-900">OTP đã sẵn sàng để xác minh</p>
                                        <p className="mt-1 text-sm font-medium text-[#5b6475]">
                                            Hoàn tất 3 trường bên dưới rồi xác nhận đổi mật khẩu.
                                        </p>
                                    </div>
                                </div>

                                <FieldGroup label="Mật khẩu mới">
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(event) => setNewPassword(event.target.value)}
                                        placeholder="Nhập mật khẩu mới"
                                        className="nb-input w-full h-11 text-sm"
                                    />
                                </FieldGroup>

                                <FieldGroup label="Xác nhận mật khẩu mới">
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(event) => setConfirmPassword(event.target.value)}
                                        placeholder="Nhập lại mật khẩu mới"
                                        className="nb-input w-full h-11 text-sm"
                                    />
                                </FieldGroup>

                                <div className="flex flex-wrap items-center gap-3 pt-1">
                                    <button
                                        onClick={handleChangePassword}
                                        disabled={changingPassword || !otp || !newPassword || !confirmPassword}
                                        className="nb-btn nb-btn-purple text-sm disabled:opacity-50"
                                    >
                                        {changingPassword ? "Đang xử lý..." : "Đổi mật khẩu"}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setOtpSent(false);
                                            setOtp("");
                                            setNewPassword("");
                                            setConfirmPassword("");
                                            setOtpRequestMsg("");
                                            setChangePasswordMsg("");
                                        }}
                                        className="nb-btn nb-btn-outline text-sm"
                                    >
                                        Hủy luồng OTP
                                    </button>
                                </div>

                                {changePasswordMsg && (
                                    <InlineMessage
                                        className={changePasswordMsg.startsWith("Đổi") ? "text-emerald-700" : "text-red-700"}
                                        message={changePasswordMsg}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </section>

                <section className="nb-card-static p-0">
                    <div className="border-b border-gray-200 px-6 py-5">
                        <div className="flex items-center gap-3">
                            <div
                                className={`rounded-2xl p-3 ${
                                    is2FAEnabled ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                                }`}
                            >
                                {is2FAEnabled ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                            </div>
                            <div>
                                <h3 className="text-lg font-extrabold text-gray-900">Xác thực 2 bước (2FA)</h3>
                                <p className="mt-1 text-sm font-medium text-[#4c5769]">
                                    Quản lý lớp bảo vệ bổ sung bằng ứng dụng xác thực trước các thao tác đăng nhập.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-5 px-6 py-6">
                        <div
                            className={`rounded-[18px] border p-5 ${
                                is2FAEnabled
                                    ? "border-emerald-200 bg-emerald-50"
                                    : "border-amber-200 bg-amber-50"
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="rounded-2xl bg-white p-3 shadow-soft-sm">
                                    {is2FAEnabled ? (
                                        <ShieldCheck className="h-5 w-5 text-emerald-700" />
                                    ) : (
                                        <ShieldAlert className="h-5 w-5 text-amber-700" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-extrabold text-gray-900">
                                        {is2FAEnabled ? "2FA hiện đang bật" : "2FA hiện chưa bật"}
                                    </p>
                                    <p className="mt-1 text-sm font-medium leading-6 text-[#5b6475]">
                                        {is2FAEnabled
                                            ? "Tài khoản yêu cầu thêm mã xác minh từ ứng dụng xác thực. Đây là lớp bảo vệ nên được giữ bật khi có thể."
                                            : "Bật 2FA để giảm rủi ro khi lộ mật khẩu hoặc đăng nhập từ thiết bị không mong muốn."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {is2FAEnabled === null ? (
                            <div className="h-24 animate-pulse rounded-[18px] border border-gray-200 bg-gray-100" />
                        ) : is2FAEnabled ? (
                            <div className="space-y-4">
                                <div className="rounded-[18px] border border-red-200 bg-red-50 p-5">
                                    <p className="text-sm font-extrabold text-red-900">Tắt 2FA là thao tác nhạy cảm</p>
                                    <p className="mt-1 text-sm font-medium leading-6 text-red-900/80">
                                        Chỉ tắt khi bạn có lý do rõ ràng. Sau khi tắt, tài khoản sẽ quay về mức bảo vệ chỉ bằng mật khẩu.
                                    </p>
                                    <button
                                        onClick={() => setShowDisable2FA((current) => !current)}
                                        className="nb-btn nb-btn-outline mt-4 text-sm !border-red-300 !text-red-800 hover:!bg-red-100"
                                    >
                                        {showDisable2FA ? "Đóng xác nhận tắt 2FA" : "Mở xác nhận tắt 2FA"}
                                    </button>
                                </div>

                                {showDisable2FA && (
                                    <div className="rounded-[18px] border border-red-200 bg-white p-5 shadow-soft-sm">
                                        <FieldGroup label="Mã xác thực 6 chữ số">
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={6}
                                                value={disable2FACode}
                                                onChange={(event) => {
                                                    if (/^\d*$/.test(event.target.value)) setDisable2FACode(event.target.value);
                                                }}
                                                placeholder="000000"
                                                className="nb-input h-11 max-w-[180px] text-center font-mono text-lg tracking-widest"
                                            />
                                        </FieldGroup>
                                        <div className="mt-4 flex flex-wrap items-center gap-3">
                                            <button
                                                onClick={handleDisable2FA}
                                                disabled={disabling2FA || disable2FACode.length !== 6}
                                                className="nb-btn text-sm !border-gray-200 !bg-red-800 !text-white disabled:opacity-50"
                                            >
                                                {disabling2FA ? "Đang xử lý..." : "Xác nhận tắt 2FA"}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowDisable2FA(false);
                                                    setDisable2FACode("");
                                                    setDisable2FAMsg("");
                                                }}
                                                className="nb-btn nb-btn-outline text-sm"
                                            >
                                                Hủy
                                            </button>
                                        </div>
                                        {disable2FAMsg && (
                                            <InlineMessage
                                                className={disable2FAMsg.startsWith("Đã") ? "text-emerald-700" : "text-red-700"}
                                                message={disable2FAMsg}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="rounded-[18px] border border-violet-200 bg-violet-50 p-5">
                                <p className="text-sm font-extrabold text-violet-900">Khuyến nghị bật 2FA</p>
                                <p className="mt-1 text-sm font-medium leading-6 text-violet-900/80">
                                    Khi bật, bạn sẽ được chuyển sang bước thiết lập với mã QR và mã khôi phục để hoàn tất cấu hình.
                                </p>
                                <button
                                    onClick={() => navigate("/2fa-setup")}
                                    className="nb-btn nb-btn-purple mt-4 text-sm"
                                >
                                    Bật 2FA
                                </button>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

const FieldGroup = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
        <label className="mb-1.5 block text-sm font-bold text-gray-900">{label}</label>
        {children}
    </div>
);

const StepCard = ({
    number,
    title,
    description,
    active,
}: {
    number: string;
    title: string;
    description: string;
    active: boolean;
}) => (
    <div className={`rounded-[18px] border p-4 shadow-soft-sm ${active ? "border-violet-200 bg-violet-50" : "border-gray-200 bg-white"}`}>
        <div className="flex items-start gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold ${active ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                {number}
            </div>
            <div>
                <p className="text-sm font-extrabold text-gray-900">{title}</p>
                <p className="mt-1 text-sm font-medium leading-6 text-[#5b6475]">{description}</p>
            </div>
        </div>
    </div>
);

const InlineMessage = ({ className, message }: { className: string; message: string }) => (
    <p className={`mt-3 text-sm font-bold ${className}`}>{message}</p>
);
