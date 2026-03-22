import { useState, useRef, useEffect } from "react";
import { Shield, Copy, Download, CheckCircle, Key } from "lucide-react";
import { Button } from "../../components/ui/button";
import { setup2FA, confirm2FA, type Setup2FAResponse } from "../../lib/api/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "../../contexts/ToastContext";
import { Notify } from "../../components/ui/notify";

type Step = "loading" | "scan" | "verify" | "recovery";

export const TwoFactorSetup = (): JSX.Element => {
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();
    const forced = (location.state as any)?.forced === true;

    const [step, setStep] = useState<Step>("loading");
    const [setupData, setSetupData] = useState<Setup2FAResponse | null>(null);
    const [showManualKey, setShowManualKey] = useState(false);
    const [digits, setDigits] = useState(["", "", "", "", "", ""]);
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [copiedKey, setCopiedKey] = useState(false);
    const [copiedCodes, setCopiedCodes] = useState(false);
    const [notify, setNotify] = useState<{ title: string; message: string; variant: "error" | "success" | "info" } | null>(null);
    const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Auto-initiate setup
    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token) { navigate("/login", { replace: true }); return; }

        setup2FA(token).then(data => {
            setSetupData(data);
            setStep("scan");
        }).catch(err => {
            if (err?.message?.includes("already enabled")) {
                showToast({ title: "2FA đã được bật", message: "Bạn đã bật xác thực 2 bước.", variant: "info" });
                navigate(-1);
            } else {
                setNotify({ title: "Lỗi", message: err?.message || "Không thể khởi tạo 2FA", variant: "error" });
            }
        });
    }, []);

    const handleDigitChange = (idx: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const newDigits = [...digits];
        newDigits[idx] = value.slice(-1);
        setDigits(newDigits);
        if (value && idx < 5) digitRefs.current[idx + 1]?.focus();
    };

    const handleDigitKeyDown = (idx: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !digits[idx] && idx > 0) {
            digitRefs.current[idx - 1]?.focus();
        }
    };

    const handleConfirm = async () => {
        const code = digits.join("");
        if (code.length !== 6) return;
        try {
            setIsLoading(true);
            const token = localStorage.getItem("access_token")!;
            const result = await confirm2FA(code, token);
            setRecoveryCodes(result.recoveryCodes);
            setStep("recovery");
        } catch (e: any) {
            setNotify({ title: "Xác thực thất bại", message: e?.message || "Mã không hợp lệ. Hãy thử lại.", variant: "error" });
            setDigits(["", "", "", "", "", ""]);
            digitRefs.current[0]?.focus();
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinish = () => {
        showToast({ title: "2FA đã bật thành công! 🔐", message: "Tài khoản của bạn đã được bảo vệ.", variant: "success" });
        const userRaw = localStorage.getItem("user");
        if (userRaw) {
            const u = JSON.parse(userRaw);
            if (u.role === "Admin") navigate("/admin/dashboard", { replace: true });
            else if (u.role === "School") navigate("/school/dashboard", { replace: true });
            else if (u.role === "Provider") navigate("/provider/dashboard", { replace: true });
            else navigate("/homepage", { replace: true });
        } else {
            navigate("/login", { replace: true });
        }
    };

    const copyToClipboard = (text: string, type: "key" | "codes") => {
        navigator.clipboard.writeText(text).then(() => {
            if (type === "key") setCopiedKey(true);
            else setCopiedCodes(true);
            setTimeout(() => { setCopiedKey(false); setCopiedCodes(false); }, 2000);
        });
    };

    const downloadCodes = () => {
        const text = `VTOS - Mã khôi phục 2FA\n${"═".repeat(30)}\n\n${recoveryCodes.map((c, i) => `${i + 1}. ${c}`).join("\n")}\n\n⚠ Mỗi mã chỉ dùng được 1 lần.\nLưu ở nơi an toàn.`;
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "vtos-recovery-codes.txt"; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 lg:p-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-200">
                        <Shield className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {step === "recovery" ? "Mã khôi phục" : "Thiết lập xác thực 2 bước"}
                    </h1>
                    {forced && step !== "recovery" && (
                        <p className="text-amber-600 text-sm mt-2 bg-amber-50 rounded-lg px-3 py-1.5 inline-block">
                            ⚠ Vai trò của bạn yêu cầu bật 2FA trước khi sử dụng
                        </p>
                    )}
                </div>

                {/* ── STEP: Loading ── */}
                {step === "loading" && (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
                    </div>
                )}

                {/* ── STEP: Scan QR ── */}
                {step === "scan" && setupData && (
                    <div className="space-y-6">
                        <p className="text-gray-600 text-sm text-center">
                            Quét mã QR bằng Google Authenticator hoặc nhập mã thủ công
                        </p>

                        {/* QR Code */}
                        <div className="flex justify-center">
                            <div className="bg-white p-4 rounded-2xl border-2 border-gray-100">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.qrCodeUri)}`}
                                    alt="2FA QR Code"
                                    className="w-48 h-48"
                                />
                            </div>
                        </div>

                        {/* Manual key toggle */}
                        <button
                            onClick={() => setShowManualKey(!showManualKey)}
                            className="w-full flex items-center justify-center gap-2 text-sm text-violet-600 hover:text-violet-800 font-medium"
                        >
                            <Key className="w-4 h-4" />
                            {showManualKey ? "Ẩn mã thủ công" : "Nhập mã thủ công"}
                        </button>

                        {showManualKey && (
                            <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                                <code className="flex-1 text-sm font-mono text-gray-700 break-all select-all">
                                    {setupData.manualKey}
                                </code>
                                <button
                                    onClick={() => copyToClipboard(setupData.manualKey, "key")}
                                    className="flex-shrink-0 text-gray-400 hover:text-violet-600"
                                >
                                    {copiedKey ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                                </button>
                            </div>
                        )}

                        <Button
                            onClick={() => setStep("verify")}
                            className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-xl text-white font-semibold"
                        >
                            Tiếp tục
                        </Button>
                    </div>
                )}

                {/* ── STEP: Verify first code ── */}
                {step === "verify" && (
                    <div className="space-y-6">
                        <p className="text-gray-600 text-sm text-center">
                            Nhập mã 6 chữ số từ ứng dụng xác thực để hoàn tất
                        </p>

                        <div className="flex justify-center gap-2">
                            {digits.map((d, i) => (
                                <input
                                    key={i}
                                    ref={el => { digitRefs.current[i] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={d}
                                    onChange={e => handleDigitChange(i, e.target.value)}
                                    onKeyDown={e => handleDigitKeyDown(i, e)}
                                    onFocus={e => e.target.select()}
                                    autoFocus={i === 0}
                                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all"
                                />
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={() => { setStep("scan"); setDigits(["","","","","",""]); }}
                                variant="outline"
                                className="flex-1 h-12 rounded-xl"
                            >
                                ← Quay lại
                            </Button>
                            <Button
                                onClick={handleConfirm}
                                disabled={isLoading || digits.some(d => !d)}
                                className="flex-1 h-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-xl text-white font-semibold"
                            >
                                {isLoading ? "Đang xác thực..." : "Xác nhận"}
                            </Button>
                        </div>
                    </div>
                )}

                {/* ── STEP: Recovery codes ── */}
                {step === "recovery" && (
                    <div className="space-y-6">
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                            <strong>⚠ Quan trọng:</strong> Lưu các mã khôi phục này ở nơi an toàn.
                            Mỗi mã chỉ dùng được <strong>1 lần</strong> khi bạn không truy cập được ứng dụng xác thực.
                        </div>

                        <div className="bg-gray-50 rounded-xl p-5 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                {recoveryCodes.map((code, i) => (
                                    <div key={i} className="bg-white rounded-lg px-3 py-2 text-center font-mono text-sm border border-gray-200">
                                        {code}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={() => copyToClipboard(recoveryCodes.join("\n"), "codes")}
                                variant="outline"
                                className="flex-1 h-11 rounded-xl gap-2"
                            >
                                {copiedCodes ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                {copiedCodes ? "Đã sao chép" : "Sao chép"}
                            </Button>
                            <Button
                                onClick={downloadCodes}
                                variant="outline"
                                className="flex-1 h-11 rounded-xl gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Tải xuống
                            </Button>
                        </div>

                        <Button
                            onClick={handleFinish}
                            className="w-full h-12 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 rounded-xl text-white font-semibold"
                        >
                            Đã lưu, tiếp tục sử dụng ✓
                        </Button>
                    </div>
                )}
            </div>

            <Notify
                open={!!notify}
                title={notify?.title || ""}
                message={notify?.message}
                variant={notify?.variant}
                onClose={() => setNotify(null)}
            />
        </div>
    );
};
