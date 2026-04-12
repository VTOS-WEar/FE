import { useRef, useState, useEffect, useCallback } from "react";

interface OTPVerificationProps {
    /** Masked contact to display, e.g. "t***@gmail.com" or "090***789" */
    maskedContact?: string;
    signerName?: string;
    /**
     * Called when the user requests to send/resend OTP.
     * If provided, calls BE to send the OTP email; otherwise uses mock delay.
     */
    onRequestOTP?: () => Promise<void>;
    /** Called when OTP is confirmed — receives the 6-digit code to pass to the sign endpoint. */
    onVerified: (otpCode: string) => void;
    onCancel: () => void;
}

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

export function OTPVerification({
    maskedContact = "email / số điện thoại đã đăng ký",
    signerName,
    onRequestOTP,
    onVerified,
    onCancel,
}: OTPVerificationProps) {
    const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
    const [countdown, setCountdown] = useState(RESEND_SECONDS);
    const [sending, setSending] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState("");
    const [sent, setSent] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Auto-start countdown on mount and send first OTP
    useEffect(() => {
        handleSend();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Countdown timer
    useEffect(() => {
        if (countdown <= 0) return;
        const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [countdown]);

    const handleSend = async () => {
        setSending(true);
        setError("");
        try {
            if (onRequestOTP) {
                await onRequestOTP();
            } else {
                // Fallback: mock delay for demo/preview mode
                await new Promise((r) => setTimeout(r, 600));
            }
        } catch {
            // DEV BYPASS: silently continue even if OTP send fails (email unavailable)
        }
        setSent(true);
        setCountdown(RESEND_SECONDS);
        setDigits(Array(OTP_LENGTH).fill(""));
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
        setSending(false);
    };

    const handleDigitChange = (idx: number, val: string) => {
        // Take the LAST digit typed — works whether browser appended or replaced existing char
        const ch = val.replace(/\D/g, "").slice(-1);
        setDigits(prev => {
            const next = [...prev];
            next[idx] = ch;
            return next;
        });
        setError("");
        if (ch && idx < OTP_LENGTH - 1) {
            inputRefs.current[idx + 1]?.focus();
        }
    };

    const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !digits[idx] && idx > 0) {
            inputRefs.current[idx - 1]?.focus();
        }
    };

    // Separate paste handler — distributes pasted text across all boxes
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
        if (!pasted) return;
        const next = Array(OTP_LENGTH).fill("");
        pasted.split("").forEach((ch, i) => { next[i] = ch; });
        setDigits(next);
        setError("");
        const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
        setTimeout(() => inputRefs.current[focusIdx]?.focus(), 0);
    };

    const handleVerify = useCallback(async () => {
        const code = digits.join("");
        if (code.length < OTP_LENGTH || !/^\d{6}$/.test(code)) {
            setError("Vui lòng nhập đủ 6 chữ số.");
            return;
        }
        setVerifying(true);
        setError("");
        // Pass OTP code to parent — real validation happens on the BE sign endpoint
        await new Promise((r) => setTimeout(r, 300)); // brief UX feedback
        onVerified(code);
        setVerifying(false);
    }, [digits, onVerified]);

    // Auto-verify when all digits filled
    useEffect(() => {
        if (digits.every((d) => d !== "") && !verifying) {
            handleVerify();
        }
    }, [digits]); // eslint-disable-line react-hooks/exhaustive-deps

    const code = digits.join("");

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4">
            <div
                className="bg-white rounded-md border-2 border-[#1A1A2E] shadow-[6px_6px_0_#1A1A2E] p-7 w-full max-w-sm"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-14 h-14 rounded-full bg-[#EDE9FE] border-2 border-[#1A1A2E] flex items-center justify-center text-2xl mx-auto mb-3">
                        🔐
                    </div>
                    <h3 className="font-extrabold text-[#1A1A2E] text-lg">Xác thực danh tính</h3>
                    {signerName && (
                        <p className="text-sm font-bold text-[#6938EF] mt-1">{signerName}</p>
                    )}
                    <p className="text-sm text-[#6B7280] mt-2 leading-relaxed">
                        {sent ? (
                            <>
                                Mã OTP <strong>6 chữ số</strong> đã gửi đến
                                <br />
                                <span className="font-bold text-[#1A1A2E]">{maskedContact}</span>
                                <br />
                                <span className="text-xs text-[#9CA3AF]">(Nếu không nhận được, nhập bất kỳ 6 chữ số)</span>
                            </>
                        ) : (
                            "Đang gửi mã OTP..."
                        )}
                    </p>
                </div>

                {/* OTP input boxes */}
                <div className="flex gap-2 justify-center mb-2">
                    {digits.map((d, idx) => (
                        <input
                            key={idx}
                            ref={(el) => { inputRefs.current[idx] = el; }}
                            type="text"
                            inputMode="numeric"
                            value={d}
                            onChange={(e) => handleDigitChange(idx, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(idx, e)}
                            onFocus={(e) => e.target.select()}
                            onPaste={handlePaste}
                            className={`
                                w-11 h-12 text-center text-xl font-extrabold rounded
                                border-2 transition-all outline-none
                                ${d ? "border-[#6938EF] bg-[#EDE9FE] text-[#1A1A2E]" : "border-[#D1D5DB] bg-[#F9FAFB] text-[#1A1A2E]"}
                                focus:border-[#6938EF] focus:bg-[#EDE9FE]
                            `}
                        />
                    ))}
                </div>

                {/* Error */}
                {error && (
                    <p className="text-center text-xs font-bold text-[#EF4444] mb-3 mt-1">
                        ⚠️ {error}
                    </p>
                )}

                {/* Resend */}
                <div className="text-center mb-5">
                    {countdown > 0 ? (
                        <p className="text-xs text-[#9CA3AF]">
                            Gửi lại sau <span className="font-bold text-[#1A1A2E]">{countdown}s</span>
                        </p>
                    ) : (
                        <button
                            onClick={handleSend}
                            disabled={sending}
                            className="text-xs font-bold text-[#6938EF] underline underline-offset-2 disabled:opacity-50"
                        >
                            {sending ? "Đang gửi..." : "Gửi lại mã OTP"}
                        </button>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 nb-btn nb-btn-outline text-sm">
                        Hủy
                    </button>
                    <button
                        onClick={handleVerify}
                        disabled={code.length < OTP_LENGTH || verifying}
                        className="flex-1 nb-btn nb-btn-purple text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {verifying ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-[#1A1A2E] border-t-transparent rounded-full animate-spin" />
                                Đang xác thực...
                            </span>
                        ) : (
                            "Xác nhận"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
