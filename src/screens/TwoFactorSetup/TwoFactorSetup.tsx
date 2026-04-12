import { useState, useRef, useEffect } from "react";
import { Shield, Copy, Download, CheckCircle, Key } from "lucide-react";
import { setup2FA, confirm2FA, type Setup2FAResponse } from "../../lib/api/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "../../contexts/ToastContext";
import { Notify } from "../../components/ui/notify";
import { QRCodeSVG } from "qrcode.react";


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
                localStorage.removeItem("vtos_should_setup_2fa");
                showToast({ title: "2FA đã được bật", message: "Bạn đã bật xác thực 2 bước.", variant: "info" });
                navigate(-1);
            } else {
                setNotify({ title: "Lỗi", message: err?.message || "Không thể khởi tạo 2FA", variant: "error" });
            }
        });
    }, []);

    const handleDigitChange = (idx: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        // Handle multi-char paste
        if (value.length > 1) {
            const chars = value.replace(/\D/g, "").slice(0, 6).split("");
            const newDigits = [...digits];
            chars.forEach((d, i) => { if (idx + i < 6) newDigits[idx + i] = d; });
            setDigits(newDigits);
            const lastIdx = Math.min(idx + chars.length - 1, 5);
            digitRefs.current[lastIdx]?.focus();
            if (newDigits.every(d => d)) setTimeout(() => handleConfirm(), 100);
            return;
        }
        const newDigits = [...digits];
        newDigits[idx] = value.slice(-1);
        setDigits(newDigits);
        if (value && idx < 5) digitRefs.current[idx + 1]?.focus();
        if (value && idx === 5 && newDigits.every(d => d)) {
            setTimeout(() => handleConfirm(), 100);
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (pasted.length === 0) return;
        e.preventDefault();
        const newDigits = pasted.split("").concat(Array(6).fill("")).slice(0, 6);
        setDigits(newDigits);
        const lastIdx = Math.min(pasted.length - 1, 5);
        digitRefs.current[lastIdx]?.focus();
        if (newDigits.every(d => d)) setTimeout(() => handleConfirm(), 100);
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
            // Update cache immediately so AccountSettings shows correct status
            // even if user navigates there before clicking "Đã lưu"
            localStorage.setItem("vtos_2fa_enabled", "true");
            const userRaw = localStorage.getItem("user");
            if (userRaw) {
                const u = JSON.parse(userRaw);
                u.twoFactorEnabled = true;
                localStorage.setItem("user", JSON.stringify(u));
            }
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
        localStorage.removeItem("vtos_should_setup_2fa");
        // Update stored user so all pages know 2FA is enabled
        const userRaw = localStorage.getItem("user");
        if (userRaw) {
            const u = JSON.parse(userRaw);
            u.twoFactorEnabled = true;
            localStorage.setItem("user", JSON.stringify(u));
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

    /* ── Step Indicator ── */
    const stepIndex = step === "loading" ? 0 : step === "scan" ? 1 : step === "verify" ? 2 : 3;
    const stepLabels = ["Khởi tạo", "Quét mã", "Xác minh", "Hoàn tất"];

    return (
        <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center p-4" style={{ fontFamily: "'Space Grotesk Variable', sans-serif" }}>
            <div className="bg-white w-full max-w-lg p-8 lg:p-10 border-2 border-[#1A1A2E] rounded-2xl shadow-[6px_6px_0_#1A1A2E]">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-[#EDE9FE] rounded-xl flex items-center justify-center mx-auto mb-4 border-2 border-[#1A1A2E] shadow-[4px_4px_0_#1A1A2E]">
                        <Shield className="w-10 h-10 text-[#1A1A2E]" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-[#1A1A2E]">
                        {step === "recovery" ? "🔑 Mã khôi phục" : "🔐 Thiết lập xác thực 2 bước"}
                    </h1>
                    {forced && step !== "recovery" && (
                        <div className="nb-alert nb-alert-warning mt-3 text-sm justify-center">
                            <span>⚠</span><span>Vai trò của bạn yêu cầu bật 2FA trước khi sử dụng</span>
                        </div>
                    )}
                </div>

                {/* Step Indicator — connected */}
                <div className="flex items-center mb-8">
                    {stepLabels.map((label, i) => (
                        <div key={label} className="flex items-center" style={{ flex: i < 3 ? 1 : "none" }}>
                            {/* Step circle + label */}
                            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                                <div className={`w-9 h-9 rounded-lg border-2 border-[#1A1A2E] flex items-center justify-center text-sm font-bold transition-all ${
                                    i < stepIndex ? "bg-[#C8E44D] shadow-[2px_2px_0_#1A1A2E]" :
                                    i === stepIndex ? "bg-[#B8A9E8] shadow-[2px_2px_0_#1A1A2E]" :
                                    "bg-[#F3F4F6]"
                                }`}>
                                    {i < stepIndex ? "✓" : i + 1}
                                </div>
                                <span className={`text-[10px] font-bold ${i <= stepIndex ? "text-[#1A1A2E]" : "text-[#9CA3AF]"}`}>{label}</span>
                            </div>
                            {/* Connector line */}
                            {i < 3 && (
                                <div className={`flex-1 h-[3px] mx-1 rounded-full ${i < stepIndex ? "bg-[#C8E44D]" : "bg-[#E5E7EB]"}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* ── STEP: Loading ── */}
                {step === "loading" && (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-8 h-8 border-4 border-[#E5E7EB] border-t-[#B8A9E8] rounded-full animate-spin" />
                    </div>
                )}

                {/* ── STEP: Scan QR ── */}
                {step === "scan" && setupData && (
                    <div className="space-y-6">
                        <p className="text-[#4C5769] text-sm text-center font-medium">
                            Quét mã QR bằng Google Authenticator hoặc nhập mã thủ công
                        </p>

                        {/* QR Code */}
                        <div className="flex justify-center">
                            <div className="bg-white p-4 rounded-xl border-2 border-[#1A1A2E] shadow-[3px_3px_0_#1A1A2E]">
                                <QRCodeSVG
                                    value={setupData.qrCodeUri}
                                    size={192}
                                    level="M"
                                />
                            </div>
                        </div>

                        {/* Manual key toggle */}
                        <button
                            onClick={() => setShowManualKey(!showManualKey)}
                            className="w-full flex items-center justify-center gap-2 text-sm text-[#1A1A2E] hover:text-[#B8A9E8] font-bold border-2 border-transparent hover:border-[#E5E7EB] rounded-lg py-2 transition-all"
                        >
                            <Key className="w-4 h-4" />
                            {showManualKey ? "Ẩn mã thủ công" : "Nhập mã thủ công"}
                        </button>

                        {showManualKey && (
                            <div className="bg-[#F8F9FB] rounded-xl p-4 flex items-center gap-3 border-2 border-[#E5E7EB]">
                                <code className="flex-1 text-sm font-mono text-[#1A1A2E] break-all select-all font-bold">
                                    {setupData.manualKey}
                                </code>
                                <button
                                    onClick={() => copyToClipboard(setupData.manualKey, "key")}
                                    className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border-2 border-[#1A1A2E] bg-white shadow-[2px_2px_0_#1A1A2E] hover:bg-[#EDE9FE] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                                >
                                    {copiedKey ? <CheckCircle className="w-4 h-4 text-[#065F46]" /> : <Copy className="w-4 h-4 text-[#1A1A2E]" />}
                                </button>
                            </div>
                        )}

                        <button
                            onClick={() => setStep("verify")}
                            className="w-full h-12 nb-btn nb-btn-purple text-base font-bold"
                        >
                            Tiếp tục →
                        </button>
                    </div>
                )}

                {/* ── STEP: Verify first code ── */}
                {step === "verify" && (
                    <div className="space-y-6">
                        <p className="text-[#4C5769] text-sm text-center font-medium">
                            Nhập mã 6 chữ số từ ứng dụng xác thực để hoàn tất
                        </p>

                        <div className="flex justify-center gap-2" onPaste={handlePaste}>
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
                                    onPaste={handlePaste}
                                    onFocus={e => e.target.select()}
                                    autoFocus={i === 0}
                                    className="w-12 h-14 text-center text-2xl font-extrabold border-2 border-[#1A1A2E] rounded-xl bg-white shadow-[3px_3px_0_#1A1A2E] focus:shadow-[3px_3px_0_#1A1A2E,0_0_0_2px_#B8A9E8] outline-none transition-all"
                                />
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setStep("scan"); setDigits(["","","","","",""]); }}
                                className="flex-1 h-12 nb-btn nb-btn-outline text-sm font-bold"
                            >
                                ← Quay lại
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={isLoading || digits.some(d => !d)}
                                className="flex-1 h-12 nb-btn nb-btn-purple text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? "Đang xác thực..." : "Xác nhận ✦"}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STEP: Recovery codes ── */}
                {step === "recovery" && (
                    <div className="space-y-6">
                        <div className="nb-alert nb-alert-warning text-sm">
                            <span className="text-lg">⚠</span>
                            <span>
                                <strong>Quan trọng:</strong> Lưu các mã khôi phục này ở nơi an toàn.
                                Mỗi mã chỉ dùng được <strong>1 lần</strong> khi bạn không truy cập được ứng dụng xác thực.
                            </span>
                        </div>

                        <div className="nb-card-static p-5">
                            <div className="grid grid-cols-2 gap-2">
                                {recoveryCodes.map((code, i) => (
                                    <div key={i} className="bg-[#F8F9FB] rounded-lg px-3 py-2.5 text-center font-mono text-sm font-bold text-[#1A1A2E] border-2 border-[#E5E7EB]">
                                        {code}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => copyToClipboard(recoveryCodes.join("\n"), "codes")}
                                className="flex-1 h-11 nb-btn nb-btn-outline text-sm font-bold"
                            >
                                {copiedCodes ? <CheckCircle className="w-4 h-4 text-[#065F46]" /> : <Copy className="w-4 h-4" />}
                                {copiedCodes ? "Đã sao chép" : "Sao chép"}
                            </button>
                            <button
                                onClick={downloadCodes}
                                className="flex-1 h-11 nb-btn nb-btn-outline text-sm font-bold"
                            >
                                <Download className="w-4 h-4" />
                                Tải xuống
                            </button>
                        </div>

                        <button
                            onClick={handleFinish}
                            className="w-full h-12 nb-btn nb-btn-green text-base font-bold"
                        >
                            Đã lưu, tiếp tục sử dụng ✓
                        </button>
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
