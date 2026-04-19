import { useState, useEffect, useCallback } from "react";
import {
    getOutfitVariants,
    createVariant,
    updateVariant,
    deleteVariant,
    type ProductVariantDto,
    type CreateVariantRequest,
    type VariantMeasurementInputDto,
} from "../../lib/api/schools";
import { STANDARD_MEASUREMENTS, MEASUREMENT_BY_KEY } from "../../lib/constants/measurements";

type MeasurementFormItem = {
    id: string;
    fieldKey: string;
    displayName: string;
    unit: string;
    minValue: string;
    maxValue: string;
};

type VariantForm = {
    size: string;
    materialType: string;
    measurements: MeasurementFormItem[];
};

const EMPTY_FORM: VariantForm = { size: "", materialType: "", measurements: [] };
const COMMON_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "100", "110", "120", "130", "140", "150", "160"];

function ModernInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-[15px] font-semibold text-gray-900 shadow-soft-sm outline-none transition-all placeholder:text-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50 focus:outline-none"
        />
    );
}

function toFormMeasurement(item?: Partial<MeasurementFormItem>): MeasurementFormItem {
    return {
        id: crypto.randomUUID(),
        fieldKey: item?.fieldKey ?? "",
        displayName: item?.displayName ?? "",
        unit: item?.unit ?? "cm",
        minValue: item?.minValue ?? "",
        maxValue: item?.maxValue ?? "",
    };
}

function normalizeMeasurements(measurements: MeasurementFormItem[]): VariantMeasurementInputDto[] {
    return measurements
        .map((measurement) => ({
            fieldKey: measurement.fieldKey.trim(),
            displayName: measurement.displayName.trim() || measurement.fieldKey.trim(),
            unit: measurement.unit.trim() || "cm",
            minCm: measurement.minValue.trim() === "" ? null : Number(measurement.minValue),
            maxCm: measurement.maxValue.trim() === "" ? null : Number(measurement.maxValue),
        }))
        .filter((measurement) => measurement.fieldKey)
        .filter((measurement) => measurement.minCm !== null || measurement.maxCm !== null);
}

export default function VariantManager({
    outfitId,
    outfitName,
    defaultMaterialType,
    isOpen,
    onClose,
}: {
    outfitId: string;
    outfitName: string;
    defaultMaterialType?: string;
    isOpen: boolean;
    onClose: () => void;
}) {
    const [variants, setVariants] = useState<ProductVariantDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<VariantForm>(EMPTY_FORM);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

    const showToast = useCallback((msg: string, type: "success" | "error") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    }, []);

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
        if (isOpen) {
            fetchVariants();
        }
    }, [isOpen, fetchVariants]);

    if (!isOpen) return null;

    const openEdit = (variant: ProductVariantDto) => {
        setEditingId(variant.productVariantId);
        setForm({
            size: variant.size,
            materialType: variant.materialType ?? "",
            measurements: variant.measurements.map((measurement) =>
                toFormMeasurement({
                    fieldKey: measurement.fieldKey,
                    displayName: measurement.displayName,
                    unit: measurement.unit,
                    minValue: measurement.minCm?.toString() ?? "",
                    maxValue: measurement.maxCm?.toString() ?? "",
                })
            ),
        });
        setShowForm(true);
    };

    const openCreate = () => {
        setEditingId(null);
        setForm({
            ...EMPTY_FORM,
            materialType: defaultMaterialType ?? "",
            measurements: [],
        });
        setShowForm(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.size.trim()) return;

        setSaving(true);
        try {
            const payload: CreateVariantRequest = {
                size: form.size.trim(),
                materialType: form.materialType.trim() || null,
                measurements: normalizeMeasurements(form.measurements),
            };

            if (editingId) {
                await updateVariant(outfitId, editingId, payload);
                showToast("Cập nhật kích cỡ thành công", "success");
            } else {
                await createVariant(outfitId, payload);
                showToast("Thêm kích cỡ thành công", "success");
            }

            setShowForm(false);
            setEditingId(null);
            setForm({ ...EMPTY_FORM, materialType: defaultMaterialType ?? "" });
            fetchVariants();
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : "Có lỗi xảy ra", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        setSaving(true);
        try {
            await deleteVariant(outfitId, deletingId);
            showToast("Xóa kích cỡ thành công", "success");
            setDeletingId(null);
            fetchVariants();
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : "Có lỗi xảy ra", "error");
        } finally {
            setSaving(false);
        }
    };

    const updateMeasurement = (id: string, patch: Partial<MeasurementFormItem>) => {
        setForm((current) => ({
            ...current,
            measurements: current.measurements.map((measurement) =>
                measurement.id === id ? { ...measurement, ...patch } : measurement
            ),
        }));
    };

    const addMeasurement = (preset?: { fieldKey: string; displayName: string; unit: string }) => {
        setForm((current) => ({
            ...current,
            measurements: [
                ...current.measurements,
                toFormMeasurement({
                    fieldKey: preset?.fieldKey ?? "",
                    displayName: preset?.displayName ?? "",
                    unit: preset?.unit ?? "cm",
                }),
            ],
        }));
    };

    const removeMeasurement = (id: string) => {
        setForm((current) => ({
            ...current,
            measurements: current.measurements.filter((measurement) => measurement.id !== id),
        }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative w-full max-w-[1180px] mx-4 max-h-[90vh] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-soft-lg">
                <div className="flex items-start justify-between gap-4 border-b border-gray-200 bg-violet-50 px-6 py-5 sticky top-0 z-10">
                    <div>
                        <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-1 text-[12px] font-black shadow-soft-sm">
                            QUẢN LÝ KÍCH CỠ
                        </div>
                        <h2 className="text-[24px] font-black leading-none text-gray-900">Kích cỡ sản phẩm</h2>
                        <p className="mt-2 text-[14px] font-semibold text-gray-500">{outfitName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-[22px] font-black shadow-soft-sm"
                    >
                        x
                    </button>
                </div>

                <div className="px-6 py-6 space-y-5">
                    {!showForm && (
                        <button
                            onClick={openCreate}
                            className="flex items-center gap-2 rounded-lg border border-purple-500 bg-violet-500 px-5 py-3 text-[15px] font-extrabold text-white shadow-soft-sm"
                        >
                            Thêm kích cỡ
                        </button>
                    )}

                    {showForm && (
                        <form onSubmit={handleSave} className="rounded-xl border border-purple-200 bg-violet-50 p-5 shadow-soft-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[16px] font-black text-gray-900">
                                    {editingId ? "Sửa kích cỡ" : "Thêm kích cỡ mới"}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => { setShowForm(false); setEditingId(null); setForm({ ...EMPTY_FORM, materialType: defaultMaterialType ?? "" }); }}
                                    className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white shadow-soft-sm"
                                >
                                    x
                                </button>
                            </div>

                            <div>
                                <label className="mb-2 block text-[14px] font-extrabold text-gray-900">
                                    Kích cỡ
                                </label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {COMMON_SIZES.map((size) => (
                                        <button
                                            key={size}
                                            type="button"
                                            onClick={() => setForm((current) => ({ ...current, size }))}
                                            className={`px-3 py-1.5 rounded-lg text-[13px] font-extrabold border ${form.size === size ? "border-purple-500 bg-violet-500 text-white" : "border-gray-200 bg-white text-gray-900"
                                                }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                                <ModernInput
                                    type="text"
                                    value={form.size}
                                    onChange={(e) => setForm((current) => ({ ...current, size: e.target.value }))}
                                    placeholder="Nhập size tùy chỉnh"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-[14px] font-extrabold text-gray-900">
                                    Chất liệu
                                </label>
                                <ModernInput
                                    type="text"
                                    value={form.materialType}
                                    onChange={(e) => setForm((current) => ({ ...current, materialType: e.target.value }))}
                                    placeholder="Ví dụ: Cotton, Cotton Spandex, Kaki..."
                                />
                                <p className="mt-2 text-[12px] font-semibold text-gray-500">
                                    Dùng cho hiển thị sản phẩm và phân tích độ co giãn khi gợi ý size.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[14px] font-extrabold text-gray-900">Số đo theo size</p>
                                        <p className="text-[12px] font-semibold text-gray-500">Chọn loại số đo và nhập min/max cho từng chỉ số</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {STANDARD_MEASUREMENTS
                                        .filter((field) => !form.measurements.some((m) => m.fieldKey === field.fieldKey))
                                        .map((field) => (
                                            <button
                                                key={field.fieldKey}
                                                type="button"
                                                onClick={() => addMeasurement(field)}
                                                className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-1.5 text-[12px] font-bold text-gray-900 hover:bg-yellow-100 transition-colors"
                                            >
                                                + {field.displayName}
                                            </button>
                                        ))}
                                    {STANDARD_MEASUREMENTS.every((field) => form.measurements.some((m) => m.fieldKey === field.fieldKey)) && (
                                        <span className="text-[12px] font-semibold text-gray-500 italic py-1.5">Đã thêm tất cả số đo</span>
                                    )}
                                </div>

                                {form.measurements.length === 0 && (
                                    <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white/70 px-4 py-4 text-[13px] font-semibold text-gray-500">
                                        Chưa có chỉ số nào. Bấm vào các nút ở trên để thêm số đo.
                                    </div>
                                )}

                                {form.measurements.map((measurement) => {
                                    const std = MEASUREMENT_BY_KEY.get(measurement.fieldKey);
                                    return (
                                        <div key={measurement.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-soft-sm">
                                            <div className="grid items-end gap-3" style={{ gridTemplateColumns: '2fr 2.5fr 1fr 1.5fr 1.5fr auto' }}>
                                                <div>
                                                    <label className="mb-2 block text-[12px] font-extrabold text-gray-900">Loại số đo</label>
                                                    <select
                                                        value={measurement.fieldKey}
                                                        onChange={(e) => {
                                                            const selected = MEASUREMENT_BY_KEY.get(e.target.value);
                                                            updateMeasurement(measurement.id, {
                                                                fieldKey: e.target.value,
                                                                displayName: selected?.displayName ?? measurement.displayName,
                                                                unit: selected?.unit ?? measurement.unit,
                                                            });
                                                        }}
                                                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-[14px] font-semibold text-gray-900 shadow-soft-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50 focus:outline-none"
                                                    >
                                                        <option value="">-- Chọn --</option>
                                                        {STANDARD_MEASUREMENTS.map((s) => {
                                                            const alreadyUsed = form.measurements.some((m) => m.fieldKey === s.fieldKey && m.id !== measurement.id);
                                                            return (
                                                                <option key={s.fieldKey} value={s.fieldKey} disabled={alreadyUsed}>
                                                                    {s.displayName} ({s.fieldKey})
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="mb-2 block text-[12px] font-extrabold text-gray-900">Tên hiển thị</label>
                                                    <ModernInput
                                                        value={measurement.displayName}
                                                        onChange={(e) => updateMeasurement(measurement.id, { displayName: e.target.value })}
                                                        placeholder={std?.displayName ?? "Tên hiển thị"}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-2 block text-[12px] font-extrabold text-gray-900">Đơn vị</label>
                                                    <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-[14px] font-semibold text-gray-500">
                                                        {measurement.unit}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="mb-2 block text-[12px] font-extrabold text-gray-900">Min</label>
                                                    <ModernInput
                                                        type="number"
                                                        step="0.01"
                                                        min={1}
                                                        value={measurement.minValue}
                                                        onChange={(e) => updateMeasurement(measurement.id, { minValue: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-2 block text-[12px] font-extrabold text-gray-900">Max</label>
                                                    <ModernInput
                                                        type="number"
                                                        step="0.01"
                                                        min={1}
                                                        value={measurement.maxValue}
                                                        onChange={(e) => updateMeasurement(measurement.id, { maxValue: e.target.value })}
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeMeasurement(measurement.id)}
                                                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-extrabold text-red-600 whitespace-nowrap shadow-soft-sm"
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex justify-end gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={() => { setShowForm(false); setEditingId(null); setForm({ ...EMPTY_FORM, materialType: defaultMaterialType ?? "" }); }}
                                    className="rounded-lg border border-gray-200 bg-white px-5 py-3 text-[15px] font-extrabold text-gray-700 shadow-soft-sm hover:scale-[0.99] hover:shadow-soft-sm active:scale-[0.98] active:shadow-none"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || !form.size.trim()}
                                    className="rounded-lg border border-purple-500 bg-violet-500 px-5 py-3 text-[15px] font-extrabold text-white disabled:opacity-50 shadow-soft-sm hover:scale-[0.99] hover:shadow-soft-sm active:scale-[0.98] active:shadow-none"
                                >
                                    {saving ? "Đang lưu..." : editingId ? "Lưu" : "Thêm"}
                                </button>
                            </div>
                        </form>
                    )}

                    {loading && (
                        <div className="space-y-3">
                            {[1, 2, 3].map((item) => (
                                <div key={item} className="h-16 rounded-xl border border-gray-200 bg-violet-50 animate-pulse" />
                            ))}
                        </div>
                    )}

                    {!loading && variants.length > 0 && (
                        <div className="rounded-xl border border-gray-200 overflow-hidden shadow-soft-sm">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-violet-50 border-b border-gray-200">
                                        <th className="px-5 py-3.5 text-left text-[12px] font-black text-gray-900 uppercase tracking-wider">Kích cỡ</th>
                                        <th className="px-5 py-3.5 text-left text-[12px] font-black text-gray-900 uppercase tracking-wider">Chất liệu</th>
                                        <th className="px-5 py-3.5 text-left text-[12px] font-black text-gray-900 uppercase tracking-wider">Số đo</th>
                                        <th className="px-5 py-3.5 text-right text-[12px] font-black text-gray-900 uppercase tracking-wider">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {variants.map((variant, index) => (
                                        <tr key={variant.productVariantId} className={index < variants.length - 1 ? "border-b border-gray-200" : ""}>
                                            <td className="px-5 py-3.5">
                                                <span className="inline-flex items-center justify-center min-w-[44px] px-3 py-1.5 rounded-lg border border-purple-200 bg-violet-100 text-[14px] font-extrabold text-purple-600">
                                                    {variant.size}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {variant.materialType ? (
                                                    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[12px] font-bold text-emerald-700">
                                                        {variant.materialType}
                                                    </span>
                                                ) : (
                                                    <span className="text-[13px] font-semibold text-gray-400 italic">Chưa cập nhật</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {variant.measurements.length === 0 ? (
                                                    <span className="text-[13px] font-semibold text-gray-500">Chưa có số đo, sẽ fallback</span>
                                                ) : (
                                                    <div className="flex flex-wrap gap-2">
                                                        {variant.measurements.map((measurement) => (
                                                            <span key={`${variant.productVariantId}-${measurement.fieldKey}`} className="rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-[12px] font-bold text-yellow-700">
                                                                {measurement.displayName}: {measurement.minCm ?? "-"} - {measurement.maxCm ?? "-"} {measurement.unit}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => openEdit(variant)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] font-extrabold text-gray-700 shadow-soft-sm hover:scale-[0.99] hover:shadow-soft-sm active:scale-[0.98] active:shadow-none">
                                                        Sua
                                                    </button>
                                                    <button onClick={() => setDeletingId(variant.productVariantId)} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] font-extrabold text-red-600 shadow-soft-sm hover:scale-[0.99] hover:shadow-soft-sm active:scale-[0.98] active:shadow-none">
                                                        Xoa
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!loading && variants.length === 0 && (
                        <div className="rounded-xl border-2 border-dashed border-purple-300 bg-violet-50/50 py-12 text-center">
                            <p className="font-extrabold text-gray-900 text-[15px]">ChÆ°a cÃ³ kÃ­ch cá»¡ nÃ o</p>
                            <p className="font-semibold text-gray-500 text-[13px] mt-1">Nhan Them kich co de bat dau</p>
                        </div>
                    )}
                </div>
            </div>

            {deletingId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setDeletingId(null)} />
                    <div className="relative w-full max-w-[420px] mx-4 rounded-xl border border-gray-200 bg-white shadow-soft-lg overflow-hidden">
                        <div className="border-b border-red-200 bg-red-50 px-6 py-4">
                            <h3 className="text-[18px] font-black text-gray-900">Xoa kich co?</h3>
                        </div>
                        <div className="px-6 py-5">
                            <p className="font-semibold text-gray-500 text-[15px] mb-5">
                                KÃ­ch cá»¡ vÃ  cÃ¡c chá»‰ sá»‘ Ä‘Ã£ cáº¥u hÃ¬nh sáº½ bá»‹ xoÃ¡.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setDeletingId(null)} className="rounded-lg border border-gray-200 bg-white px-5 py-3 text-[15px] font-extrabold text-gray-700 shadow-soft-sm hover:scale-[0.99] hover:shadow-soft-sm active:scale-[0.98] active:shadow-none">
                                    Huy
                                </button>
                                <button onClick={handleDelete} disabled={saving} className="rounded-lg border border-red-500 bg-red-500 px-5 py-3 text-[15px] font-extrabold text-white disabled:opacity-50 shadow-soft-sm hover:scale-[0.99] hover:shadow-soft-sm active:scale-[0.98] active:shadow-none">
                                    {saving ? "Äang xoÃ¡..." : "XoÃ¡"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div className={`fixed bottom-6 right-6 z-[70] flex items-center gap-3 px-5 py-3.5 rounded-xl border border-gray-200 shadow-soft-md ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                    }`}>
                    <span className="font-extrabold text-[15px]">{toast.msg}</span>
                </div>
            )}
        </div>
    );
}
