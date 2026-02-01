import { useEffect, useMemo, useState } from "react";
import { Alert, AlertTitle, AlertDescription } from "./alert";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

type Variant = "error" | "success" | "info";

export function Notify({
    open,
    title,
    message,
    variant = "error",
    onClose,
    durationMs = 3500,
}: {
    open: boolean;
    title: string;
    message?: string | null;
    variant?: Variant;
    onClose: () => void;
    durationMs?: number; // thời gian tự đóng
}) {
    const [progress, setProgress] = useState(100);

    const Icon = useMemo(() => {
        return variant === "success"
            ? CheckCircle2
            : variant === "info"
                ? Info
                : AlertCircle;
    }, [variant]);

    // màu progress theo variant
    const progressClass =
        variant === "success"
            ? "bg-emerald-500"
            : variant === "info"
                ? "bg-blue-500"
                : "bg-red-500";

    // (tuỳ chọn) đổi màu viền/chữ theo variant cho đúng (hiện bạn đang fixed đỏ)
    const alertColorClass =
        variant === "success"
            ? "border-emerald-200 text-emerald-950 [&>svg]:text-emerald-600"
            : variant === "info"
                ? "border-blue-200 text-blue-950 [&>svg]:text-blue-600"
                : "border-red-200 text-red-950 [&>svg]:text-red-600";

    useEffect(() => {
        if (!open || !message) return;

        setProgress(100);
        const start = performance.now();
        let raf = 0;

        const tick = () => {
            const elapsed = performance.now() - start;
            const next = Math.max(0, 100 - (elapsed / durationMs) * 100);
            setProgress(next);

            if (elapsed >= durationMs) {
                onClose();
                return;
            }
            raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [open, message, durationMs, onClose]);

    if (!open || !message) return null;

    return (
        <div className="fixed top-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)]">
            <div className="relative overflow-hidden rounded-xl">
                <Alert
                    className={`px-6 py-4 text-base rounded-xl
            bg-white/75 backdrop-blur-md shadow-lg
            [&>svg]:top-5 [&>svg]:left-5 ${alertColorClass}`}
                >
                    <Icon className="h-5 w-5" />
                    <div>
                        <AlertTitle className="text-base font-semibold">{title}</AlertTitle>
                        <AlertDescription className="text-sm leading-relaxed opacity-90">
                            {message}
                        </AlertDescription>
                    </div>
                </Alert>

                {/* Close */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-3 top-3 h-8 w-8 rounded-full bg-white/70 backdrop-blur shadow grid place-items-center hover:opacity-80"
                    aria-label="Close"
                >
                    ✕
                </button>

                {/* Progress line */}
                <div className="absolute left-0 bottom-0 h-[3px] w-full bg-black/10">
                    <div
                        className={`h-full ${progressClass}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
