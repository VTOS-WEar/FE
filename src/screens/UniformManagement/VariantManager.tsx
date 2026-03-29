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

    /* ── Inline styles ── */
    const inputClass =
        "w-full bg-[#f8f9fb] border border-[#cbcad7] rounded-[10px] px-3 py-2.5 font-medium text-sm text-[#1a1a2e] outline-none focus:border-[#6938ef] focus:ring-1 focus:ring-[#6938ef]/20 transition-colors";
    const labelClass = "font-semibold text-[#1a1a2e] text-sm mb-1.5 block";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[680px] mx-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#f0f0f5] sticky top-0 bg-white z-10 rounded-t-2xl">
                    <div>
                        <h2 className="font-bold text-[#1a1a2e] text-xl">
                            Quản lý kích cỡ
                        </h2>
                        <p className="font-medium text-[#97a3b6] text-sm mt-0.5">
                            {outfitName}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f0f0f5] transition-colors"
                    >
                        <svg className="w-5 h-5 text-[#97a3b6]" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                    </button>
                </div>

                <div className="px-6 py-5">
                    {/* Add button */}
                    {!showForm && (
                        <button
                            onClick={openCreate}
                            className="mb-4 flex items-center gap-2 nb-btn nb-btn-purple text-sm px-4 py-2.5"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                            </svg>
                            Thêm kích cỡ
                        </button>
                    )}

                    {/* Inline Form */}
                    {showForm && (
                        <form onSubmit={handleSave} className="mb-5 p-4 bg-[#f8f9fb] rounded-[10px] border border-[#e5e7eb] space-y-3">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="font-bold text-[#1a1a2e] text-sm">
                                    {editingId ? "Sửa kích cỡ" : "Thêm kích cỡ mới"}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => { setShowForm(false); setEditingId(null); }}
                                    className="text-[#97a3b6] hover:text-[#1a1a2e] transition-colors"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                    </svg>
                                </button>
                            </div>

                            {/* Size quick-pick */}
                            <div>
                                <label className={labelClass}>
                                    Kích cỡ <span className="text-red-500">*</span>
                                </label>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {COMMON_SIZES.map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setForm((f) => ({ ...f, size: s }))}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                                                form.size === s
                                                    ? "bg-[#6938EF] text-white border-[#6938EF]"
                                                    : "bg-white text-[#4c5769] border-[#cbcad7] hover:border-[#6938EF] hover:text-[#6938EF]"
                                            }`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    value={form.size}
                                    onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}
                                    placeholder="Hoặc nhập kích cỡ tùy chỉnh"
                                    className={inputClass}
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowForm(false); setEditingId(null); }}
                                    className="px-4 py-2 rounded-[10px] border border-[#cbcad7] bg-white hover:bg-[#f6f7f8] font-semibold text-sm text-[#4c5769] transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || !form.size.trim()}
                                    className="flex items-center gap-2 nb-btn nb-btn-purple text-sm px-4 py-2 disabled:opacity-50"
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
                                <div key={i} className="h-14 bg-gray-100 rounded-[10px] animate-pulse" />
                            ))}
                        </div>
                    )}

                    {/* Variant Table */}
                    {!loading && variants.length > 0 && (
                        <div className="border border-[#e5e7eb] rounded-[10px] overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-[#f8f9fb]">
                                        <th className="px-4 py-3 text-left font-bold text-[#4c5769] text-xs uppercase tracking-wider">
                                            Kích cỡ
                                        </th>
                                        <th className="px-4 py-3 text-right font-bold text-[#4c5769] text-xs uppercase tracking-wider">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#f0f0f5]">
                                    {variants.map((v) => (
                                        <tr key={v.productVariantId} className="hover:bg-[#fafbfc] transition-colors">
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center justify-center min-w-[40px] px-2.5 py-1 rounded-lg bg-[#F5F3FF] border border-[#DDD6FE] font-bold text-[#6938EF] text-sm">
                                                    {v.size}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => openEdit(v)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F5F3FF] text-[#97A3B6] hover:text-[#6938EF] transition-colors"
                                                        title="Sửa"
                                                    >
                                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => setDeletingId(v.productVariantId)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-[#97A3B6] hover:text-red-500 transition-colors"
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
                        <div className="py-10 text-center">
                            <svg className="w-12 h-12 text-[#CBCAD7] mx-auto mb-3" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M21 16V7.99C21 6.89 20.1 6 19 6H5C3.9 6 3 6.89 3 7.99V16C3 17.1 3.9 18 5 18H19C20.1 18 21 17.1 21 16ZM12 14L17 10H7L12 14Z" />
                            </svg>
                            <p className="font-semibold text-[#4C5769] text-sm">
                                Chưa có kích cỡ nào
                            </p>
                            <p className="font-medium text-[#97A3B6] text-xs mt-1">
                                Nhấn "Thêm kích cỡ" để bắt đầu
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirm Dialog */}
            {deletingId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setDeletingId(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[400px] mx-4 p-6 text-center animate-in fade-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                            </svg>
                        </div>
                        <h3 className="font-bold text-[#1a1a2e] text-lg mb-2">Xóa kích cỡ?</h3>
                        <p className="font-medium text-[#4c5769] text-sm mb-5">
                            Hành động này không thể hoàn tác.
                        </p>
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={() => setDeletingId(null)}
                                className="px-5 py-2.5 rounded-[10px] border border-[#cbcad7] bg-white hover:bg-[#f6f7f8] font-semibold text-sm text-[#4c5769] transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={saving}
                                className="px-5 py-2.5 rounded-[10px] bg-red-500 hover:bg-red-600 text-white font-semibold text-sm disabled:opacity-50 transition-colors"
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-[70] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 ${
                    toast.type === "success" ? "bg-[#10b981] text-white" : "bg-[#ef4444] text-white"
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
                    <span className="font-semibold text-sm">{toast.msg}</span>
                </div>
            )}
        </div>
    );
}
