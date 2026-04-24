import { useState, useEffect, useCallback } from "react";
import { Layers3, Pencil, Plus, Ruler, Trash2, X } from "lucide-react";
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

function resetForm(defaultMaterialType?: string) {
    return { ...EMPTY_FORM, materialType: defaultMaterialType ?? "" };
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

    const closeEditor = () => {
        setShowForm(false);
        setEditingId(null);
        setForm(resetForm(defaultMaterialType));
    };

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
                }),
            ),
        });
        setShowForm(true);
    };

    const openCreate = () => {
        setEditingId(null);
        setForm(resetForm(defaultMaterialType));
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

            closeEditor();
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
                measurement.id === id ? { ...measurement, ...patch } : measurement,
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

    const availablePresets = STANDARD_MEASUREMENTS.filter((field) => !form.measurements.some((m) => m.fieldKey === field.fieldKey));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative mx-4 max-h-[90vh] w-full max-w-[880px] overflow-y-auto rounded-[24px] border border-gray-200 bg-white shadow-soft-lg">
                <div className="sticky top-0 z-10 border-b border-gray-200 bg-[linear-gradient(180deg,_#faf5ff_0%,_#ffffff_100%)] px-6 py-5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="max-w-2xl">
                            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-gray-900">
                                <Ruler className="h-3.5 w-3.5" />
                                Manage Size
                            </div>
                            <h2 className="text-[24px] font-black leading-none text-gray-900">Kích cỡ sản phẩm</h2>
                            <p className="mt-2 text-[14px] font-semibold text-gray-500">{outfitName}</p>
                        </div>
                        <button onClick={onClose} className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[12px] border border-gray-200 bg-white text-gray-600 shadow-soft-sm transition-all hover:text-gray-900">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="mt-4 inline-flex rounded-full border border-gray-200 bg-white p-1 shadow-soft-sm">
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className={`rounded-full px-4 py-2 text-[12px] font-bold transition-all ${!showForm ? "bg-violet-500 text-white" : "text-gray-600"}`}
                        >
                            Danh sách kích cỡ
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (!showForm) openCreate();
                            }}
                            className={`rounded-full px-4 py-2 text-[12px] font-bold transition-all ${showForm ? "bg-violet-500 text-white" : "text-gray-600"}`}
                        >
                            {editingId ? "Chỉnh sửa kích cỡ" : "Thêm kích cỡ"}
                        </button>
                    </div>
                </div>

                <div className="space-y-6 px-6 py-6">
                    {!showForm && (
                        <>
                            <div className="flex flex-col gap-4 rounded-[22px] border border-violet-200 bg-[linear-gradient(180deg,_#faf5ff_0%,_#ffffff_100%)] p-5 shadow-soft-sm sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-violet-700">Size workspace</p>
                                    <h3 className="mt-1 text-xl font-extrabold text-gray-900">{variants.length} kích cỡ đã cấu hình</h3>
                                </div>
                                <button onClick={openCreate} className="nb-btn nb-btn-purple text-sm whitespace-nowrap">
                                    Thêm kích cỡ
                                </button>
                            </div>

                            {loading && (
                                <div className="space-y-3">
                                    {[1, 2, 3].map((item) => (
                                        <div key={item} className="h-28 animate-pulse rounded-[22px] border border-gray-200 bg-violet-50" />
                                    ))}
                                </div>
                            )}

                            {!loading && variants.length > 0 && (
                                <div className="grid gap-4">
                                    {variants.map((variant) => (
                                        <div key={variant.productVariantId} className="rounded-[22px] border border-gray-200 bg-white p-5 shadow-soft-sm">
                                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <span className="inline-flex min-w-[52px] items-center justify-center rounded-[14px] border border-violet-200 bg-violet-100 px-3 py-2 text-[14px] font-extrabold text-violet-700">
                                                            {variant.size}
                                                        </span>
                                                        <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[12px] font-bold text-sky-700">
                                                            {variant.materialType || "Chưa cập nhật chất liệu"}
                                                        </span>
                                                        <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[12px] font-bold text-gray-600">
                                                            {variant.measurements.length} chỉ số
                                                        </span>
                                                    </div>

                                                    <div className="mt-4 flex flex-wrap gap-2">
                                                        {variant.measurements.length === 0 ? (
                                                            <span className="text-[13px] font-semibold text-gray-500">Chưa có số đo, hệ thống sẽ fallback khi gợi ý size.</span>
                                                        ) : (
                                                            variant.measurements.map((measurement) => (
                                                                <span key={`${variant.productVariantId}-${measurement.fieldKey}`} className="rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-[12px] font-bold text-yellow-800">
                                                                    {measurement.displayName}: {measurement.minCm ?? "-"} - {measurement.maxCm ?? "-"} {measurement.unit}
                                                                </span>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => openEdit(variant)} className="flex items-center gap-1 rounded-[12px] border border-gray-200 bg-white px-3 py-2 text-[13px] font-bold text-gray-700 transition-all hover:border-violet-200 hover:text-violet-700">
                                                        <Pencil className="h-3.5 w-3.5" />
                                                        Sửa
                                                    </button>
                                                    <button onClick={() => setDeletingId(variant.productVariantId)} className="flex items-center gap-1 rounded-[12px] border border-red-200 bg-red-50 px-3 py-2 text-[13px] font-bold text-red-600 transition-all hover:bg-red-100">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        Xóa
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!loading && variants.length === 0 && (
                                <div className="rounded-[22px] border-2 border-dashed border-purple-300 bg-violet-50/50 py-12 text-center">
                                    <p className="text-[15px] font-extrabold text-gray-900">Chưa có kích cỡ nào</p>
                                    <p className="mt-1 text-[13px] font-semibold text-gray-500">Nhấn Thêm kích cỡ để bắt đầu</p>
                                </div>
                            )}
                        </>
                    )}

                    {showForm && (
                        <form onSubmit={handleSave} className="space-y-5 rounded-[22px] border border-purple-200 bg-[linear-gradient(180deg,_#faf5ff_0%,_#ffffff_100%)] p-5 shadow-soft-sm">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-violet-700">{editingId ? "Cập nhật" : "Tạo mới"}</p>
                                    <h3 className="mt-1 text-xl font-extrabold text-gray-900">{editingId ? "Chỉnh sửa kích cỡ" : "Thêm kích cỡ mới"}</h3>
                                </div>
                                <button type="button" onClick={closeEditor} className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white shadow-soft-sm">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="space-y-3 rounded-[18px] border border-gray-200 bg-white p-4 shadow-soft-sm">
                                <div className="flex items-center gap-2">
                                    <Layers3 className="h-4 w-4 text-violet-600" />
                                    <p className="text-[14px] font-extrabold text-gray-900">Kích cỡ cơ bản</p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {COMMON_SIZES.map((size) => (
                                        <button
                                            key={size}
                                            type="button"
                                            onClick={() => setForm((current) => ({ ...current, size }))}
                                            className={`rounded-[12px] border px-3 py-1.5 text-[13px] font-extrabold transition-all ${form.size === size ? "border-purple-500 bg-violet-500 text-white" : "border-gray-200 bg-white text-gray-900"}`}
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

                            <div className="rounded-[18px] border border-gray-200 bg-white p-4 shadow-soft-sm">
                                <label className="mb-2 block text-[14px] font-extrabold text-gray-900">Chất liệu</label>
                                <ModernInput
                                    type="text"
                                    value={form.materialType}
                                    onChange={(e) => setForm((current) => ({ ...current, materialType: e.target.value }))}
                                    placeholder="Ví dụ: Cotton, Cotton Spandex, Kaki..."
                                />
                            </div>

                            <div className="space-y-4 rounded-[18px] border border-gray-200 bg-white p-4 shadow-soft-sm">
                                <div>
                                    <p className="text-[14px] font-extrabold text-gray-900">Số đo theo size</p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {availablePresets.map((field) => (
                                        <button
                                            key={field.fieldKey}
                                            type="button"
                                            onClick={() => addMeasurement(field)}
                                            className="rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1.5 text-[12px] font-bold text-gray-900 transition-colors hover:bg-yellow-100"
                                        >
                                            + {field.displayName}
                                        </button>
                                    ))}
                                    {availablePresets.length === 0 && (
                                        <span className="py-1.5 text-[12px] font-semibold italic text-gray-500">Đã thêm tất cả số đo chuẩn</span>
                                    )}
                                </div>

                                {form.measurements.length === 0 && (
                                    <div className="rounded-[18px] border-2 border-dashed border-gray-200 bg-white/70 px-4 py-5 text-[13px] font-semibold text-gray-500">
                                        Chưa có chỉ số nào. Bấm vào các preset ở trên để thêm số đo.
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {form.measurements.map((measurement) => {
                                        const std = MEASUREMENT_BY_KEY.get(measurement.fieldKey);
                                        return (
                                            <div key={measurement.id} className="rounded-[18px] border border-gray-200 bg-[#fcfcff] p-4 shadow-soft-sm">
                                                <div className="mb-3 flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-violet-700">Chỉ số</p>
                                                        <p className="mt-1 text-[15px] font-extrabold text-gray-900">{measurement.displayName || "Chưa đặt tên"}</p>
                                                    </div>
                                                    <button type="button" onClick={() => removeMeasurement(measurement.id)} className="flex items-center gap-1 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-bold text-red-600">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        Xóa
                                                    </button>
                                                </div>

                                                <div className="grid gap-3 md:grid-cols-2">
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
                                                </div>

                                                <div className="mt-3 grid gap-3 sm:grid-cols-3">
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
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-1">
                                <button type="button" onClick={closeEditor} className="rounded-lg border border-gray-200 bg-white px-5 py-3 text-[15px] font-extrabold text-gray-700 shadow-soft-sm transition-all hover:scale-[0.99] hover:shadow-soft-sm active:scale-[0.98] active:shadow-none">
                                    Hủy
                                </button>
                                <button type="submit" disabled={saving || !form.size.trim()} className="flex items-center gap-2 rounded-lg border border-purple-500 bg-violet-500 px-5 py-3 text-[15px] font-extrabold text-white shadow-soft-sm transition-all hover:scale-[0.99] hover:shadow-soft-sm active:scale-[0.98] active:shadow-none disabled:opacity-50">
                                    <Plus className="h-4 w-4" />
                                    {saving ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Thêm kích cỡ"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {deletingId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setDeletingId(null)} />
                    <div className="relative mx-4 w-full max-w-[420px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-soft-lg">
                        <div className="border-b border-red-200 bg-red-50 px-6 py-4">
                            <h3 className="text-[18px] font-black text-gray-900">Xóa kích cỡ?</h3>
                        </div>
                        <div className="px-6 py-5">
                            <p className="mb-5 text-[15px] font-semibold text-gray-500">
                                Kích cỡ và các chỉ số đã cấu hình sẽ bị xóa.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setDeletingId(null)} className="rounded-lg border border-gray-200 bg-white px-5 py-3 text-[15px] font-extrabold text-gray-700 shadow-soft-sm transition-all hover:scale-[0.99] hover:shadow-soft-sm active:scale-[0.98] active:shadow-none">
                                    Hủy
                                </button>
                                <button onClick={handleDelete} disabled={saving} className="rounded-lg border border-red-500 bg-red-500 px-5 py-3 text-[15px] font-extrabold text-white shadow-soft-sm transition-all hover:scale-[0.99] hover:shadow-soft-sm active:scale-[0.98] active:shadow-none disabled:opacity-50">
                                    {saving ? "Đang xóa..." : "Xóa"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div className={`fixed bottom-6 right-6 z-[70] flex items-center gap-3 rounded-xl border border-gray-200 px-5 py-3.5 shadow-soft-md ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
                    <span className="font-extrabold text-[15px]">{toast.msg}</span>
                </div>
            )}
        </div>
    );
}
