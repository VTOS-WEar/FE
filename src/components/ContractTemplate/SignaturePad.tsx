import { useRef, useState, useCallback, useEffect } from "react";

type Tab = "draw" | "upload";

interface SignaturePadProps {
    onSave: (dataUrl: string) => void;
    onCancel: () => void;
    title?: string;
}

export function SignaturePad({ onSave, onCancel, title = "Ký tên điện tử" }: SignaturePadProps) {
    const [tab, setTab] = useState<Tab>("draw");

    // ── Draw tab state ──
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);
    const lastPoint = useRef<{ x: number; y: number } | null>(null);
    const [canvasEmpty, setCanvasEmpty] = useState(true);

    // ── Upload tab state ──
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);

    // Scale canvas to device pixel ratio for crisp rendering
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.scale(dpr, dpr);
    }, [tab]); // re-init when switching to draw tab

    // ── Canvas drawing ──

    const getPoint = useCallback(
        (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
            const canvas = canvasRef.current;
            if (!canvas) return null;
            const rect = canvas.getBoundingClientRect();
            if ("touches" in e) {
                const t = e.touches[0];
                return { x: t.clientX - rect.left, y: t.clientY - rect.top };
            }
            return { x: e.clientX - rect.left, y: e.clientY - rect.top };
        },
        []
    );

    const startDraw = useCallback(
        (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
            e.preventDefault();
            isDrawing.current = true;
            lastPoint.current = getPoint(e);
            setCanvasEmpty(false);
        },
        [getPoint]
    );

    const draw = useCallback(
        (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
            e.preventDefault();
            if (!isDrawing.current) return;
            const ctx = canvasRef.current?.getContext("2d");
            if (!ctx) return;
            const pt = getPoint(e);
            if (!pt) return;
            ctx.beginPath();
            ctx.lineWidth = 2.5;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.strokeStyle = "#111827";
            if (lastPoint.current) {
                ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
                ctx.lineTo(pt.x, pt.y);
                ctx.stroke();
            }
            lastPoint.current = pt;
        },
        [getPoint]
    );

    const stopDraw = useCallback(() => {
        isDrawing.current = false;
        lastPoint.current = null;
    }, []);

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setCanvasEmpty(true);
        }
    };

    // ── Upload handling ──

    const loadFile = (file: File) => {
        if (!file.type.startsWith("image/")) {
            alert("Vui lòng chọn file ảnh (PNG, JPG...)");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert("File ảnh không được vượt quá 5MB");
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            setUploadedImage(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) loadFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) loadFile(file);
    };

    // ── Save ──

    const handleSave = () => {
        if (tab === "draw") {
            const canvas = canvasRef.current;
            if (!canvas || canvasEmpty) return;
            onSave(canvas.toDataURL("image/png"));
        } else {
            if (!uploadedImage) return;
            onSave(uploadedImage);
        }
    };

    const canConfirm = tab === "draw" ? !canvasEmpty : !!uploadedImage;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4">
            <div
                className="bg-white rounded-md border border-gray-200 shadow-soft-lg p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="font-extrabold text-gray-900 text-lg mb-4">{title}</h3>

                {/* ── Tab switcher ── */}
                <div className="flex border border-gray-200 rounded overflow-hidden mb-4">
                    {(["draw", "upload"] as Tab[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`
                                flex-1 py-2 text-sm font-bold transition-colors
                                ${tab === t
                                    ? "bg-violet-50 text-gray-900"
                                    : "bg-white text-gray-500 hover:bg-gray-50"
                                }
                                ${t === "draw" ? "border-r border-gray-200" : ""}
                            `}
                        >
                            {t === "draw" ? "✏️ Vẽ tay" : "📁 Tải ảnh lên"}
                        </button>
                    ))}
                </div>

                {/* ── Draw tab ── */}
                {tab === "draw" && (
                    <>
                        <p className="text-xs text-gray-500 mb-2">
                            Dùng chuột hoặc ngón tay để ký tên vào ô bên dưới
                        </p>
                        <div className="relative border border-gray-200 rounded bg-[#FDFCF8]">
                            <canvas
                                ref={canvasRef}
                                className="w-full h-[160px] cursor-crosshair rounded block"
                                style={{ touchAction: "none" }}
                                onMouseDown={startDraw}
                                onMouseMove={draw}
                                onMouseUp={stopDraw}
                                onMouseLeave={stopDraw}
                                onTouchStart={startDraw}
                                onTouchMove={draw}
                                onTouchEnd={stopDraw}
                            />
                            {canvasEmpty && (
                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                    <span className="text-[#CBD5E1] text-sm font-medium select-none">
                                        Ký tên tại đây...
                                    </span>
                                </div>
                            )}
                            {/* Baseline guide */}
                            <div className="absolute bottom-10 left-8 right-8 border-b border-dashed border-[#CBD5E1]" />
                        </div>
                    </>
                )}

                {/* ── Upload tab ── */}
                {tab === "upload" && (
                    <>
                        <p className="text-xs text-gray-500 mb-2">
                            Tải ảnh chữ ký của bạn lên (PNG nền trong tốt nhất)
                        </p>

                        {uploadedImage ? (
                            /* Preview */
                            <div className="relative border-2 border-[#6938EF] rounded bg-violet-50 p-3 flex items-center justify-center h-[160px]">
                                <img
                                    src={uploadedImage}
                                    alt="Chữ ký"
                                    className="max-h-[140px] max-w-full object-contain"
                                />
                                <button
                                    onClick={() => { setUploadedImage(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-[#EF4444] text-white text-sm font-bold border border-gray-200 flex items-center justify-center hover:bg-[#DC2626] transition-colors"
                                    title="Xóa ảnh"
                                >
                                    ✕
                                </button>
                            </div>
                        ) : (
                            /* Drop zone */
                            <div
                                className={`
                                    border-2 border-dashed rounded h-[160px] flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors
                                    ${dragging ? "border-[#6938EF] bg-violet-50" : "border-gray-300 bg-gray-50 hover:border-violet-600 hover:bg-violet-50"}
                                `}
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                                onDragLeave={() => setDragging(false)}
                                onDrop={handleDrop}
                            >
                                <span className="text-3xl">🖼️</span>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-gray-900">
                                        Kéo thả hoặc click để chọn ảnh
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">PNG, JPG · Tối đa 5MB</p>
                                </div>
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />

                        {/* Tip */}
                        <div className="mt-3 flex items-start gap-2 bg-gray-50 border border-[#F0C391] rounded p-3">
                            <span className="text-sm flex-shrink-0">💡</span>
                            <p className="text-xs text-amber-800">
                                <strong>Mẹo:</strong> Ký tay trên giấy trắng, chụp ảnh, dùng{" "}
                                <strong>remove.bg</strong> để xóa nền → chữ ký trông chuyên nghiệp hơn.
                            </p>
                        </div>
                    </>
                )}

                {/* ── Actions ── */}
                <div className="flex gap-3 mt-4">
                    <button onClick={onCancel} className="flex-1 nb-btn nb-btn-outline text-sm">
                        Hủy
                    </button>
                    {tab === "draw" && !canvasEmpty && (
                        <button
                            onClick={clearCanvas}
                            className="nb-btn text-sm px-4"
                            style={{ border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                        >
                            Xóa
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={!canConfirm}
                        className="flex-1 nb-btn nb-btn-purple text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Xác nhận chữ ký
                    </button>
                </div>
            </div>
        </div>
    );
}
