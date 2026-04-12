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
    measurements: MeasurementFormItem[];
};

const EMPTY_FORM: VariantForm = { size: "", measurements: [] };
const COMMON_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "100", "110", "120", "130", "140", "150", "160"];

function BrutalInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            className="w-full rounded-[8px] border-[2px] border-[#19182B] bg-white px-4 py-3 text-[15px] font-semibold text-[#19182B] shadow-[3px_3px_0_#19182B] outline-none transition-all placeholder:text-[#8B859A] focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0_#19182B]"
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
        setForm({ ...EMPTY_FORM, measurements: [] });
        setShowForm(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.size.trim()) return;

        setSaving(true);
        try {
            const payload: CreateVariantRequest = {
                size: form.size.trim(),
                measurements: normalizeMeasurements(form.measurements),
            };

            if (editingId) {
                await updateVariant(outfitId, editingId, payload);
                showToast("Cap nhat kich co thanh cong", "success");
            } else {
                await createVariant(outfitId, payload);
                showToast("Them kich co thanh cong", "success");
            }

            setShowForm(false);
            setEditingId(null);
            setForm(EMPTY_FORM);
            fetchVariants();
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : "Co loi xay ra", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        setSaving(true);
        try {
            await deleteVariant(outfitId, deletingId);
            showToast("Xoa kich co thanh cong", "success");
            setDeletingId(null);
            fetchVariants();
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : "Co loi xay ra", "error");
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
            <div className="relative w-full max-w-[1180px] mx-4 max-h-[90vh] overflow-y-auto rounded-[18px] border-[3px] border-[#19182B] bg-white shadow-[6px_6px_0_#19182B]">
                <div className="flex items-start justify-between gap-4 border-b-[3px] border-[#19182B] bg-[#F2ECFF] px-6 py-5 sticky top-0 z-10">
                    <div>
                        <div className="mb-2 inline-flex items-center gap-2 rounded-[8px] border-[2px] border-[#19182B] bg-[#FFD978] px-3 py-1 text-[12px] font-black shadow-[2px_2px_0_#19182B]">
                            QUAN LY KICH CO
                        </div>
                        <h2 className="text-[24px] font-black leading-none text-[#19182B]">Kích cỡ sản phẩm</h2>
                        <p className="mt-2 text-[14px] font-semibold text-[#6F6A7D]">{outfitName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[10px] border-[3px] border-[#19182B] bg-white text-[22px] font-black shadow-[4px_4px_0_#19182B]"
                    >
                        x
                    </button>
                </div>

                <div className="px-6 py-6 space-y-5">
                    {!showForm && (
                        <button
                            onClick={openCreate}
                            className="flex items-center gap-2 rounded-[8px] border-[3px] border-[#19182B] bg-[#8B6BFF] px-5 py-3 text-[15px] font-extrabold text-white shadow-[4px_4px_0_#19182B]"
                        >
                            Them kich co
                        </button>
                    )}

                    {showForm && (
                        <form onSubmit={handleSave} className="rounded-[14px] border-[3px] border-[#19182B] bg-[#F2ECFF] p-5 shadow-[4px_4px_0_#19182B] space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[16px] font-black text-[#19182B]">
                                    {editingId ? "Sua kich co" : "Them kich co moi"}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); }}
                                    className="flex h-8 w-8 items-center justify-center rounded-full border-[2px] border-[#19182B] bg-white"
                                >
                                    x
                                </button>
                            </div>

                            <div>
                                <label className="mb-2 block text-[14px] font-extrabold text-[#19182B]">
                                    Kích cỡ
                                </label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {COMMON_SIZES.map((size) => (
                                        <button
                                            key={size}
                                            type="button"
                                            onClick={() => setForm((current) => ({ ...current, size }))}
                                            className={`px-3 py-1.5 rounded-[8px] text-[13px] font-extrabold border-[2px] border-[#19182B] ${form.size === size ? "bg-[#8B6BFF] text-white" : "bg-white text-[#19182B]"
                                                }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                                <BrutalInput
                                    type="text"
                                    value={form.size}
                                    onChange={(e) => setForm((current) => ({ ...current, size: e.target.value }))}
                                    placeholder="Nhap size tuy chinh"
                                    required
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[14px] font-extrabold text-[#19182B]">Số đo theo size</p>
                                        <p className="text-[12px] font-semibold text-[#6F6A7D]">Chọn loại số đo và nhập min/max cho từng chỉ số</p>
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
                                            className="rounded-[8px] border-[2px] border-[#19182B] bg-[#FFF7D6] px-3 py-1.5 text-[12px] font-bold text-[#19182B] hover:bg-[#FFE99A] transition-colors"
                                        >
                                            + {field.displayName}
                                        </button>
                                    ))}
                                    {STANDARD_MEASUREMENTS.every((field) => form.measurements.some((m) => m.fieldKey === field.fieldKey)) && (
                                        <span className="text-[12px] font-semibold text-[#6F6A7D] italic py-1.5">Đã thêm tất cả số đo</span>
                                    )}
                                </div>

                                {form.measurements.length === 0 && (
                                    <div className="rounded-[10px] border-[2px] border-dashed border-[#19182B] bg-white/70 px-4 py-4 text-[13px] font-semibold text-[#6F6A7D]">
                                        Chưa có chỉ số nào. Bấm vào các nút ở trên để thêm số đo.
                                    </div>
                                )}

                                {form.measurements.map((measurement) => {
                                    const std = MEASUREMENT_BY_KEY.get(measurement.fieldKey);
                                    return (
                                    <div key={measurement.id} className="rounded-[12px] border-[2px] border-[#19182B] bg-white p-4 shadow-[3px_3px_0_#19182B]">
                                        <div className="grid items-end gap-3" style={{ gridTemplateColumns: '2fr 2.5fr 1fr 1.5fr 1.5fr auto' }}>
                                            <div>
                                                <label className="mb-2 block text-[12px] font-extrabold text-[#19182B]">Loại số đo</label>
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
                                                    className="w-full rounded-[8px] border-[2px] border-[#19182B] bg-white px-3 py-3 text-[14px] font-semibold text-[#19182B] shadow-[3px_3px_0_#19182B] outline-none"
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
                                                <label className="mb-2 block text-[12px] font-extrabold text-[#19182B]">Tên hiển thị</label>
                                                <BrutalInput
                                                    value={measurement.displayName}
                                                    onChange={(e) => updateMeasurement(measurement.id, { displayName: e.target.value })}
                                                    placeholder={std?.displayName ?? "Tên hiển thị"}
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-[12px] font-extrabold text-[#19182B]">Đơn vị</label>
                                                <div className="w-full rounded-[8px] border-[2px] border-[#19182B] bg-gray-50 px-3 py-3 text-[14px] font-semibold text-[#6F6A7D]">
                                                    {measurement.unit}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-[12px] font-extrabold text-[#19182B]">Min</label>
                                                <BrutalInput
                                                    type="number"
                                                    step="0.01"
                                                    min={1}
                                                    value={measurement.minValue}
                                                    onChange={(e) => updateMeasurement(measurement.id, { minValue: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-[12px] font-extrabold text-[#19182B]">Max</label>
                                                <BrutalInput
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
                                                className="rounded-[8px] border-[2px] border-[#19182B] bg-[#FEE2E2] px-4 py-3 text-[13px] font-extrabold text-[#19182B] whitespace-nowrap"
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
                                    onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); }}
                                    className="rounded-[8px] border-[3px] border-[#19182B] bg-white px-5 py-3 text-[15px] font-extrabold text-[#19182B]"
                                >
                                    Huy
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || !form.size.trim()}
                                    className="rounded-[8px] border-[3px] border-[#19182B] bg-[#8B6BFF] px-5 py-3 text-[15px] font-extrabold text-white disabled:opacity-50"
                                >
                                    {saving ? "Đang lưu..." : editingId ? "Lưu" : "Thêm"}
                                </button>
                            </div>
                        </form>
                    )}

                    {loading && (
                        <div className="space-y-3">
                            {[1, 2, 3].map((item) => (
                                <div key={item} className="h-16 rounded-[10px] border-[2px] border-[#19182B]/10 bg-[#F2ECFF] animate-pulse" />
                            ))}
                        </div>
                    )}

                    {!loading && variants.length > 0 && (
                        <div className="rounded-[14px] border-[3px] border-[#19182B] overflow-hidden shadow-[4px_4px_0_#19182B]">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-[#F2ECFF] border-b-[3px] border-[#19182B]">
                                        <th className="px-5 py-3.5 text-left text-[12px] font-black text-[#19182B] uppercase tracking-wider">Kích cỡ</th>
                                        <th className="px-5 py-3.5 text-left text-[12px] font-black text-[#19182B] uppercase tracking-wider">So do</th>
                                        <th className="px-5 py-3.5 text-right text-[12px] font-black text-[#19182B] uppercase tracking-wider">Thao tac</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {variants.map((variant, index) => (
                                        <tr key={variant.productVariantId} className={index < variants.length - 1 ? "border-b-[2px] border-[#19182B]/15" : ""}>
                                            <td className="px-5 py-3.5">
                                                <span className="inline-flex items-center justify-center min-w-[44px] px-3 py-1.5 rounded-[8px] border-[2px] border-[#19182B] bg-[#E9E1FF] text-[14px] font-extrabold text-[#8B6BFF]">
                                                    {variant.size}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {variant.measurements.length === 0 ? (
                                                    <span className="text-[13px] font-semibold text-[#6F6A7D]">Chưa có số đo, sẽ fallback</span>
                                                ) : (
                                                    <div className="flex flex-wrap gap-2">
                                                        {variant.measurements.map((measurement) => (
                                                            <span key={`${variant.productVariantId}-${measurement.fieldKey}`} className="rounded-[999px] border-[2px] border-[#19182B] bg-[#FFF7D6] px-3 py-1 text-[12px] font-bold text-[#19182B]">
                                                                {measurement.displayName}: {measurement.minCm ?? "-"} - {measurement.maxCm ?? "-"} {measurement.unit}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => openEdit(variant)} className="rounded-[8px] border-[2px] border-[#19182B] bg-white px-3 py-2 text-[13px] font-extrabold text-[#19182B]">
                                                        Sua
                                                    </button>
                                                    <button onClick={() => setDeletingId(variant.productVariantId)} className="rounded-[8px] border-[2px] border-[#19182B] bg-[#FEE2E2] px-3 py-2 text-[13px] font-extrabold text-[#19182B]">
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
                        <div className="rounded-[14px] border-[2px] border-dashed border-[#8B6BFF] bg-[#F2ECFF]/50 py-12 text-center">
                            <p className="font-extrabold text-[#19182B] text-[15px]">Chưa có kích cỡ nào</p>
                            <p className="font-semibold text-[#6F6A7D] text-[13px] mt-1">Nhan Them kich co de bat dau</p>
                        </div>
                    )}
                </div>
            </div>

            {deletingId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setDeletingId(null)} />
                    <div className="relative w-full max-w-[420px] mx-4 rounded-[18px] border-[3px] border-[#19182B] bg-white shadow-[6px_6px_0_#19182B] overflow-hidden">
                        <div className="border-b-[3px] border-[#19182B] bg-[#FEE2E2] px-6 py-4">
                            <h3 className="text-[18px] font-black text-[#19182B]">Xoa kich co?</h3>
                        </div>
                        <div className="px-6 py-5">
                            <p className="font-semibold text-[#6F6A7D] text-[15px] mb-5">
                                Kích cỡ và các chỉ số đã cấu hình sẽ bị xoá.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setDeletingId(null)} className="rounded-[8px] border-[3px] border-[#19182B] bg-white px-5 py-3 text-[15px] font-extrabold text-[#19182B]">
                                    Huy
                                </button>
                                <button onClick={handleDelete} disabled={saving} className="rounded-[8px] border-[3px] border-[#19182B] bg-[#FF6B57] px-5 py-3 text-[15px] font-extrabold text-white disabled:opacity-50">
                                    {saving ? "Đang xoá..." : "Xoá"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div className={`fixed bottom-6 right-6 z-[70] flex items-center gap-3 px-5 py-3.5 rounded-[10px] border-[3px] border-[#19182B] shadow-[4px_4px_0_#19182B] ${toast.type === "success" ? "bg-[#10b981] text-white" : "bg-[#FF6B57] text-white"
                    }`}>
                    <span className="font-extrabold text-[15px]">{toast.msg}</span>
                </div>
            )}
        </div>
    );
}
