import { useState, useEffect, useCallback } from "react";
import {
    getOutfitVariants,
    createVariant,
    updateVariant,
    deleteVariant,
    type ProductVariantDto,
    type CreateVariantRequest,
} from "../../lib/api/schools";

/* ── Types ── */
type VariantForm = {
    size: string;
};

const EMPTY_FORM: VariantForm = { size: "" };

/* ── Common Sizes ── */
const COMMON_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "100", "110", "120", "130", "140", "150", "160"];

/* ── Brutal Design Sub-components ── */
function BrutalInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            className="w-full rounded-[8px] border-[2px] border-[#19182B] bg-white px-4 py-3 text-[15px] font-semibold text-[#19182B] shadow-[3px_3px_0_#19182B] outline-none transition-all placeholder:text-[#8B859A] focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0_#19182B]"
        />
    );
}

/* ────────────────────────────────────────────────────────────────────── */
/* VariantManager Component                                              */
/* ────────────────────────────────────────────────────────────────────── */
export default function VariantManager({
    outfitId,
    outfitName,
    isOpen,
    onClose,
}: {
    outfitId: string;
    outfitName: string;
    isOpen: boolean;
    onClose: () => void;
}) {
    const [variants, setVariants] = useState<ProductVariantDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    /* ── Form state ── */
    const [form, setForm] = useState<VariantForm>(EMPTY_FORM);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    /* ── Toast ── */
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
    const showToast = useCallback((msg: string, type: "success" | "error") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    }, []);

    /* ── Fetch variants ── */
    const fetchVariants = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getOutfitVariants(outfitId);
            setVariants(data);
        } catch {
            setVariants([]);
        } finally {
            setLoading(false);
        }
    }, [outfitId]);

    useEffect(() => {
        if (isOpen) fetchVariants();
    }, [isOpen, fetchVariants]);

    if (!isOpen) return null;

    /* ── Open edit form ── */
    const openEdit = (v: ProductVariantDto) => {
        setEditingId(v.productVariantId);
        setForm({
            size: v.size,
        });
        setShowForm(true);
    };

    /* ── Open create form ── */
    const openCreate = () => {
        setEditingId(null);
        setForm({ ...EMPTY_FORM });
        setShowForm(true);
    };

    /* ── Save (create or update) ── */
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.size.trim()) return;

        setSaving(true);
        try {
            const payload: CreateVariantRequest = {
                size: form.size.trim(),
            };

            if (editingId) {
                await updateVariant(outfitId, editingId, payload);
                showToast("Cập nhật kích cỡ thành công!", "success");
            } else {
                await createVariant(outfitId, payload);
                showToast("Thêm kích cỡ thành công!", "success");
            }
            setShowForm(false);
            setEditingId(null);
            setForm(EMPTY_FORM);
            fetchVariants();
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : "Có lỗi xảy ra", "error");
        } finally {
            setSaving(false);
        }
    };

    /* ── Delete ── */
    const handleDelete = async () => {
        if (!deletingId) return;
        setSaving(true);
        try {
            await deleteVariant(outfitId, deletingId);
            showToast("Xóa kích cỡ thành công!", "success");
            setDeletingId(null);
            fetchVariants();
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : "Có lỗi xảy ra", "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* ── Main Modal ── */}
            <div className="relative w-full max-w-[680px] mx-4 max-h-[90vh] overflow-y-auto rounded-[18px] border-[3px] border-[#19182B] bg-white shadow-[6px_6px_0_#19182B]">

                {/* ── Header ── */}
                <div className="flex items-start justify-between gap-4 border-b-[3px] border-[#19182B] bg-[#F2ECFF] px-6 py-5 sticky top-0 z-10">
                    <div>
                        <div className="mb-2 inline-flex items-center gap-2 rounded-[8px] border-[2px] border-[#19182B] bg-[#FFD978] px-3 py-1 text-[12px] font-black shadow-[2px_2px_0_#19182B]">
                            📐 QUẢN LÝ KÍCH CỠ
                        </div>
                        <h2 className="text-[24px] font-black leading-none text-[#19182B]">
                            Kích cỡ sản phẩm
                        </h2>
                        <p className="mt-2 text-[14px] font-semibold text-[#6F6A7D]">
                            {outfitName}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[10px] border-[3px] border-[#19182B] bg-white text-[22px] font-black shadow-[4px_4px_0_#19182B] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                    >
                        ×
                    </button>
                </div>

                {/* ── Body ── */}
                <div className="px-6 py-6 space-y-5">

                    {/* Add button */}
                    {!showForm && (
                        <button
                            onClick={openCreate}
                            className="flex items-center gap-2 rounded-[8px] border-[3px] border-[#19182B] bg-[#8B6BFF] px-5 py-3 text-[15px] font-extrabold text-white shadow-[4px_4px_0_#19182B] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                            </svg>
                            Thêm kích cỡ
                        </button>
                    )}

                    {/* ── Inline Form ── */}
                    {showForm && (
                        <form onSubmit={handleSave} className="rounded-[14px] border-[3px] border-[#19182B] bg-[#F2ECFF] p-5 shadow-[4px_4px_0_#19182B] space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[16px] font-black text-[#19182B]">
                                    {editingId ? "✏️ Sửa kích cỡ" : "✨ Thêm kích cỡ mới"}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => { setShowForm(false); setEditingId(null); }}
                                    className="flex h-8 w-8 items-center justify-center rounded-full border-[2px] border-[#19182B] bg-white text-[#6F6A7D] shadow-[2px_2px_0_#19182B] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#19182B]"
                                >
                                    ×
                                </button>
                            </div>

                            {/* Size quick-pick */}
                            <div>
                                <label className="mb-2 block text-[14px] font-extrabold text-[#19182B]">
                                    Kích cỡ <span className="ml-1 text-[#FF6B57]">*</span>
                                </label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {COMMON_SIZES.map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setForm((f) => ({ ...f, size: s }))}
                                            className={`px-3 py-1.5 rounded-[8px] text-[13px] font-extrabold border-[2px] border-[#19182B] transition-all ${
                                                form.size === s
                                                    ? "bg-[#8B6BFF] text-white shadow-[2px_2px_0_#19182B] translate-x-[1px] translate-y-[1px]"
                                                    : "bg-white text-[#19182B] shadow-[3px_3px_0_#19182B] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B]"
                                            }`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                                <BrutalInput
                                    type="text"
                                    value={form.size}
                                    onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}
                                    placeholder="Hoặc nhập kích cỡ tùy chỉnh"
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={() => { setShowForm(false); setEditingId(null); }}
                                    className="rounded-[8px] border-[3px] border-[#19182B] bg-white px-5 py-3 text-[15px] font-extrabold text-[#19182B] shadow-[4px_4px_0_#19182B] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || !form.size.trim()}
                                    className="flex items-center gap-2 rounded-[8px] border-[3px] border-[#19182B] bg-[#8B6BFF] px-5 py-3 text-[15px] font-extrabold text-white shadow-[4px_4px_0_#19182B] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving && (
                                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                                            <path d="M4 12a8 8 0 018-8" strokeLinecap="round" />
                                        </svg>
                                    )}
                                    {editingId ? "Lưu" : "Thêm"}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-16 rounded-[10px] border-[2px] border-[#19182B]/10 bg-[#F2ECFF] animate-pulse" />
                            ))}
                        </div>
                    )}

                    {/* ── Variant Table ── */}
                    {!loading && variants.length > 0 && (
                        <div className="rounded-[14px] border-[3px] border-[#19182B] overflow-hidden shadow-[4px_4px_0_#19182B]">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-[#F2ECFF] border-b-[3px] border-[#19182B]">
                                        <th className="px-5 py-3.5 text-left text-[12px] font-black text-[#19182B] uppercase tracking-wider">
                                            Kích cỡ
                                        </th>
                                        <th className="px-5 py-3.5 text-right text-[12px] font-black text-[#19182B] uppercase tracking-wider">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {variants.map((v, idx) => (
                                        <tr
                                            key={v.productVariantId}
                                            className={`transition-colors hover:bg-[#F2ECFF]/50 ${
                                                idx < variants.length - 1 ? "border-b-[2px] border-[#19182B]/15" : ""
                                            }`}
                                        >
                                            <td className="px-5 py-3.5">
                                                <span className="inline-flex items-center justify-center min-w-[44px] px-3 py-1.5 rounded-[8px] border-[2px] border-[#19182B] bg-[#E9E1FF] text-[14px] font-extrabold text-[#8B6BFF] shadow-[2px_2px_0_#19182B]">
                                                    {v.size}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEdit(v)}
                                                        className="flex h-9 w-9 items-center justify-center rounded-[8px] border-[2px] border-[#19182B] bg-white text-[#6F6A7D] shadow-[2px_2px_0_#19182B] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#19182B] hover:bg-[#F2ECFF] hover:text-[#8B6BFF]"
                                                        title="Sửa"
                                                    >
                                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => setDeletingId(v.productVariantId)}
                                                        className="flex h-9 w-9 items-center justify-center rounded-[8px] border-[2px] border-[#19182B] bg-white text-[#6F6A7D] shadow-[2px_2px_0_#19182B] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#19182B] hover:bg-[#FEE2E2] hover:text-[#FF6B57]"
                                                        title="Xóa"
                                                    >
                                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && variants.length === 0 && (
                        <div className="rounded-[14px] border-[2px] border-dashed border-[#8B6BFF] bg-[#F2ECFF]/50 py-12 text-center">
                            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-[10px] border-[2px] border-[#19182B] bg-white shadow-[3px_3px_0_#19182B] text-2xl">
                                📐
                            </div>
                            <p className="font-extrabold text-[#19182B] text-[15px]">
                                Chưa có kích cỡ nào
                            </p>
                            <p className="font-semibold text-[#6F6A7D] text-[13px] mt-1">
                                Nhấn "Thêm kích cỡ" để bắt đầu
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Delete Confirm Dialog ── */}
            {deletingId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setDeletingId(null)} />
                    <div className="relative w-full max-w-[420px] mx-4 rounded-[18px] border-[3px] border-[#19182B] bg-white shadow-[6px_6px_0_#19182B] overflow-hidden">
                        {/* Delete header */}
                        <div className="border-b-[3px] border-[#19182B] bg-[#FEE2E2] px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-[8px] border-[2px] border-[#19182B] bg-white shadow-[2px_2px_0_#19182B] text-lg">
                                    🗑️
                                </div>
                                <h3 className="text-[18px] font-black text-[#19182B]">Xóa kích cỡ?</h3>
                            </div>
                        </div>
                        <div className="px-6 py-5">
                            <p className="font-semibold text-[#6F6A7D] text-[15px] mb-5">
                                Hành động này không thể hoàn tác. Kích cỡ sẽ bị xoá vĩnh viễn.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setDeletingId(null)}
                                    className="rounded-[8px] border-[3px] border-[#19182B] bg-white px-5 py-3 text-[15px] font-extrabold text-[#19182B] shadow-[4px_4px_0_#19182B] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={saving}
                                    className="rounded-[8px] border-[3px] border-[#19182B] bg-[#FF6B57] px-5 py-3 text-[15px] font-extrabold text-white shadow-[4px_4px_0_#19182B] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? "Đang xóa..." : "Xóa"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Toast ── */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-[70] flex items-center gap-3 px-5 py-3.5 rounded-[10px] border-[3px] border-[#19182B] shadow-[4px_4px_0_#19182B] animate-in slide-in-from-bottom-4 duration-300 ${
                    toast.type === "success" ? "bg-[#10b981] text-white" : "bg-[#FF6B57] text-white"
                }`}>
                    {toast.type === "success" ? (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                        </svg>
                    )}
                    <span className="font-extrabold text-[15px]">{toast.msg}</span>
                </div>
            )}
        </div>
    );
}
