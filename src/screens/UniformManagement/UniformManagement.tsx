import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useSidebarConfig } from "../../hooks/useSidebarConfig";
import {
    getSchoolProfile,
    getSchoolOutfits,
    createOutfit,
    updateOutfit,
    deleteOutfit,
    setOutfitAvailability,
    uploadOutfitImage,
    type OutfitDto,
    type CreateOutfitRequest,
} from "../../lib/api/schools";
import VariantManager from "./VariantManager";
import { RichTextEditor } from "../../components/RichTextEditor/RichTextEditor";

/* ── Helper: strip HTML tags for preview ── */
function stripHtml(html: string): string {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
}



/* ── OutfitType labels ── */
const OUTFIT_TYPE_LABELS: Record<number, string> = {
    1: "Đồng phục",
    2: "Đồ thể thao",
    3: "Phụ kiện",
    4: "Khác",
};

const OUTFIT_TYPE_OPTIONS = [
    { value: 1, label: "Đồng phục" },
    { value: 2, label: "Đồ thể thao" },
    { value: 3, label: "Phụ kiện" },
    { value: 4, label: "Khác" },
];

/* ── Form data ── */
type OutfitFormData = {
    outfitName: string;
    description: string;
    materialType: string;
    price: string;
    outfitType: number;
    mainImageURL: string;
};

const EMPTY_FORM: OutfitFormData = {
    outfitName: "",
    description: "",
    materialType: "",
    price: "",
    outfitType: 1,
    mainImageURL: "",
};

/* ────────────────────────────────────────────────────────────────────── */
/* Create / Edit Outfit Modal  — Neubrutalism Concept                     */
/* ────────────────────────────────────────────────────────────────────── */
function OutfitFormModal({
    isOpen,
    onClose,
    onSave,
    isLoading,
    editingOutfit,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CreateOutfitRequest, imageFile: File | null) => void;
    isLoading: boolean;
    editingOutfit: OutfitDto | null;
}) {
    const [form, setForm] = useState<OutfitFormData>(EMPTY_FORM);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isEditing = !!editingOutfit;

    useEffect(() => {
        if (isOpen) {
            if (editingOutfit) {
                setForm({
                    outfitName: editingOutfit.outfitName,
                    description: editingOutfit.description || "",
                    materialType: editingOutfit.materialType || "",
                    price: String(editingOutfit.price),
                    outfitType: editingOutfit.outfitType,
                    mainImageURL: editingOutfit.mainImageURL || "",
                });
                setImagePreview(editingOutfit.mainImageURL || null);
            } else {
                setForm(EMPTY_FORM);
                setImagePreview(null);
            }
            setImageFile(null);
            setUploadError(null);
        }
    }, [isOpen, editingOutfit]);

    if (!isOpen) return null;

    const handleFileChange = (file: File | null) => {
        setUploadError(null);
        if (!file) { setImageFile(null); setImagePreview(null); return; }
        if (file.size > 5 * 1024 * 1024) { setUploadError("File quá lớn. Tối đa 5MB."); return; }
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            setUploadError("Chỉ hỗ trợ JPEG, PNG hoặc WebP."); return;
        }
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target?.result as string);
        reader.readAsDataURL(file);
    };

    const descLength = form.description.length;
    const nameLength = form.outfitName.length;
    const isDescOver = descLength > 500;
    const isNameOver = nameLength > 50;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.outfitName.trim()) return;
        if (isNameOver) { alert("Tên đồng phục không được vượt quá 50 ký tự."); return; }
        if (isDescOver) { alert("Mô tả không được vượt quá 500 ký tự (bao gồm định dạng HTML)."); return; }
        onSave(
            {
                outfitName: form.outfitName.trim(),
                description: form.description.trim() || null,
                materialType: form.materialType.trim() || null,
                price: parseFloat(form.price) || 0,
                outfitType: form.outfitType,
                mainImageURL: form.mainImageURL.trim() || null,
                isCustomizable: false,
            },
            imageFile,
        );
    };

    /* Brutal input class */
    const modernInputClass = "w-full rounded-[10px] border border-gray-200 bg-white px-4 py-3 text-[15px] font-medium text-gray-900 shadow-soft-sm outline-none transition-all placeholder:text-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative w-full max-w-[640px] mx-4 max-h-[90vh] overflow-y-auto rounded-[18px] border border-gray-200 bg-white shadow-soft-lg">

                {/* ── Header ── */}
                <div className="flex items-start justify-between gap-4 border-b border-gray-200 bg-violet-50 px-6 py-5 sticky top-0 z-10">
                    <div>
                        <div className="mb-2 inline-flex items-center gap-2 rounded-[8px] border border-yellow-200 bg-yellow-50 px-3 py-1 text-[12px] font-black shadow-soft-sm">
                            {isEditing ? "✏️ CHỈNH SỬA SẢN PHẨM" : "➕ THÊM MỚI"}
                        </div>
                        <h2 className="text-[24px] font-black leading-none text-gray-900 md:text-[28px]">
                            {isEditing ? "Chỉnh sửa đồng phục" : "Thêm đồng phục mới"}
                        </h2>
                        <p className="mt-2 text-[14px] font-semibold text-[#6F6A7D]">
                            {isEditing ? "Cập nhật ảnh, thông tin mô tả và giá bán." : "Điền thông tin để tạo đồng phục mới."}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[10px] border border-gray-200 bg-white text-[22px] font-black shadow-soft-sm transition-all hover:scale-[0.99] hover:shadow-soft-sm active:scale-[0.98] active:shadow-none"
                    >
                        ×
                    </button>
                </div>

                {/* ── Form Body ── */}
                <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6 md:px-8 md:py-8">

                    {/* Image Upload Card */}
                    <section>
                        <label className="mb-2 block text-[14px] font-extrabold text-gray-900">
                            Hình ảnh đồng phục
                        </label>
                        <div className="rounded-[14px] border border-purple-200 bg-violet-50 p-3 shadow-soft-sm">
                            <div
                                className="relative flex min-h-[200px] items-center justify-center rounded-[10px] border-[2px] border-dashed border-[#8B6BFF] bg-white/70 px-4 py-6 cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                onDrop={(e) => {
                                    e.preventDefault(); e.stopPropagation();
                                    const f = e.dataTransfer.files?.[0];
                                    if (f) handleFileChange(f);
                                }}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="hidden"
                                    onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                                />

                                {imagePreview ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); setForm((f) => ({ ...f, mainImageURL: "" })); }}
                                            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 shadow-soft-sm transition-all hover:scale-[0.99] hover:shadow-soft-sm hover:text-red-500 z-10"
                                        >
                                            ×
                                        </button>
                                        <img src={imagePreview} alt="Preview" className="h-[180px] w-[180px] rounded-[10px] border border-gray-200 object-cover shadow-soft-sm" />
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-3 text-center">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-[10px] border border-gray-200 bg-white shadow-soft-sm">
                                            <svg className="w-6 h-6 text-violet-500" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                                            </svg>
                                        </div>
                                        <p className="text-[14px] font-extrabold text-gray-900">
                                            Kéo thả hoặc nhấn để chọn ảnh
                                        </p>
                                        <p className="text-[13px] font-bold text-gray-500">
                                            JPG, PNG tối đa 5MB. Ảnh sản phẩm nên có nền sáng, rõ mặt trước
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                        {uploadError && (
                            <p className="mt-2 text-[13px] font-bold text-[#FF6B57]">{uploadError}</p>
                        )}
                    </section>

                    {/* Fields Grid */}
                    <section className="grid gap-5 md:grid-cols-2">
                        {/* Name — full width */}
                        <div className="md:col-span-2">
                            <label className="mb-2 block text-[14px] font-extrabold text-gray-900">
                                Tên đồng phục <span className="ml-1 text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.outfitName}
                                onChange={(e) => setForm((f) => ({ ...f, outfitName: e.target.value }))}
                                placeholder="VD: Áo sơ mi Nam"
                                className={`${modernInputClass} ${isNameOver ? '!border-[#EF4444]' : ''}`}
                                required
                                maxLength={50}
                            />
                            <div className={`text-xs font-semibold mt-1 text-right ${isNameOver ? 'text-red-500' : nameLength > 40 ? 'text-[#F59E0B]' : 'text-gray-400'}`}>
                                {nameLength}/50
                            </div>
                        </div>

                        {/* Description — full width */}
                        <div className="md:col-span-2">
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-[14px] font-extrabold text-gray-900">
                                    Mô tả
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowPreview(!showPreview)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-gray-200 text-[12px] font-extrabold transition-all ${
                                        showPreview
                                            ? "bg-violet-500 text-white shadow-soft-sm"
                                            : "bg-white text-gray-900 shadow-soft-sm hover:bg-violet-50"
                                    }`}
                                >
                                    {showPreview ? (
                                        <>
                                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                                            Chỉnh sửa
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                            Xem trước
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className={showPreview ? "hidden" : ""}>
                                <RichTextEditor
                                    value={form.description}
                                    onChange={(html) => setForm((f) => ({ ...f, description: html }))}
                                    placeholder="VD: Vải cotton thoáng mát, form dáng chuẩn"
                                />
                            </div>

                            {showPreview && (
                                <div className="rounded-[8px] border border-violet-200 bg-violet-50 shadow-soft-sm min-h-[120px] px-5 py-4">
                                    <div className="flex items-center gap-1.5 mb-3 pb-2 border-b border-violet-100">
                                        <svg className="w-3.5 h-3.5 text-violet-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                        <span className="text-[11px] font-extrabold text-violet-500 uppercase tracking-wider">Xem trước</span>
                                    </div>
                                    {form.description ? (
                                        <div
                                            className="prose-editor-content text-[15px] text-gray-700 leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: form.description }}
                                        />
                                    ) : (
                                        <p className="text-gray-400 text-[15px] font-normal italic">Chưa có nội dung mô tả.</p>
                                    )}
                                </div>
                            )}

                            <div className={`text-xs font-semibold mt-1 text-right ${isDescOver ? 'text-red-500' : descLength > 400 ? 'text-[#F59E0B]' : 'text-gray-400'}`}>
                                {descLength}/500
                            </div>
                        </div>

                        {/* Material Info - Full Width */}
                        <div className="md:col-span-2">
                            <label className="mb-2 block text-[14px] font-extrabold text-gray-900">
                                Chất liệu chuẩn
                            </label>
                            <input
                                type="text"
                                value={form.materialType}
                                onChange={(e) => setForm((f) => ({ ...f, materialType: e.target.value }))}
                                placeholder="VD: Cotton, Cotton Spandex, Kaki..."
                                className={modernInputClass}
                                maxLength={100}
                            />
                            <p className="mt-2 text-[12px] font-semibold text-gray-500">
                                Sản phẩm khi mới thêm sẽ lấy chất liệu này làm mặc định.
                            </p>
                        </div>

                        {/* Price & Category - Same Row */}
                        <div>
                            <label className="mb-2 block text-[14px] font-extrabold text-gray-900">
                                Giá bán (VND) <span className="ml-1 text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={form.price}
                                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                                    placeholder="0"
                                    className={`${modernInputClass} pr-12`}
                                    min="0"
                                    step="1000"
                                    required
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs pointer-events-none">
                                    VNĐ
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-[14px] font-extrabold text-gray-900">
                                Loại đồng phục
                            </label>
                            <select
                                value={form.outfitType}
                                onChange={(e) => setForm((f) => ({ ...f, outfitType: parseInt(e.target.value) }))}
                                className={modernInputClass}
                            >
                                {OUTFIT_TYPE_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </section>
                </form>

                {/* Footer */}
                <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-[#FFFDF9] px-6 py-5 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-[8px] border border-gray-200 bg-white px-5 py-3 text-[15px] font-extrabold text-gray-900 shadow-soft-sm hover:scale-[0.99] transition-all"
                    >
                        Huỷ
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !form.outfitName.trim() || isNameOver || isDescOver}
                        className="flex items-center justify-center gap-2 rounded-[8px] bg-violet-500 px-5 py-3 text-[15px] font-extrabold text-white shadow-soft-sm hover:scale-[0.99] transition-all disabled:opacity-50"
                    >
                        {isLoading && (
                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                                <path d="M4 12a8 8 0 018-8" strokeLinecap="round" />
                            </svg>
                        )}
                        {isEditing ? "Lưu thay đổi" : "Tạo đồng phục"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Delete Confirm Dialog                                                */
/* ────────────────────────────────────────────────────────────────────── */
function DeleteConfirmDialog({
    isOpen, onClose, onConfirm, outfitName, isLoading,
}: {
    isOpen: boolean; onClose: () => void; onConfirm: () => void; outfitName: string; isLoading: boolean;
}) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative w-full max-w-[420px] mx-4 rounded-[18px] border border-gray-200 bg-white shadow-soft-lg overflow-hidden">
                {/* Delete header */}
                <div className="border-b border-gray-200 bg-red-50 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-gray-200 bg-white shadow-soft-sm text-lg">
                            🗑️
                        </div>
                        <h3 className="text-[18px] font-black text-gray-900">Xóa đồng phục?</h3>
                    </div>
                </div>
                <div className="px-6 py-5">
                    <p className="font-semibold text-gray-500 text-[15px] mb-5">
                        Bạn có chắc muốn xóa <strong className="text-gray-900">"{outfitName}"</strong>? Hành động này không thể hoàn tác.
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="rounded-[8px] border border-gray-200 bg-white px-5 py-3 text-[15px] font-extrabold text-gray-900 shadow-soft-sm transition-all hover:scale-[0.99] hover:shadow-soft-sm active:scale-[0.98] active:shadow-none"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className="flex items-center gap-2 rounded-[8px] border border-red-500 bg-red-500 px-5 py-3 text-[15px] font-extrabold text-white shadow-soft-sm transition-all hover:scale-[0.99] hover:shadow-soft-sm active:scale-[0.98] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading && (
                                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                                    <path d="M4 12a8 8 0 018-8" strokeLinecap="round" />
                                </svg>
                            )}
                            Xóa
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Hide Confirm Dialog                                                  */
/* ────────────────────────────────────────────────────────────────────── */
function HideConfirmDialog({
    isOpen, onClose, onConfirm, outfitName, isLoading,
}: {
    isOpen: boolean; onClose: () => void; onConfirm: () => void; outfitName: string; isLoading: boolean;
}) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative w-full max-w-[420px] mx-4 rounded-[18px] border border-gray-200 bg-white shadow-soft-lg overflow-hidden">
                <div className="border-b border-gray-200 bg-amber-50 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-gray-200 bg-white shadow-soft-sm text-lg">
                            🙈
                        </div>
                        <h3 className="text-[18px] font-black text-gray-900">Ẩn đồng phục?</h3>
                    </div>
                </div>
                <div className="px-6 py-5">
                    <p className="font-semibold text-gray-500 text-[15px] mb-5">
                        Đồng phục <strong className="text-gray-900">"{outfitName}"</strong> đã từng thuộc chiến dịch đã hoàn tất nên không thể xóa. Bạn có muốn ẩn đồng phục này khỏi trang công khai không?
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="rounded-[8px] border border-gray-200 bg-white px-5 py-3 text-[15px] font-extrabold text-gray-900 shadow-soft-sm transition-all hover:scale-[0.99] hover:shadow-soft-sm active:scale-[0.98] active:shadow-none"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className="flex items-center gap-2 rounded-[8px] border border-amber-600 bg-amber-600 px-5 py-3 text-[15px] font-extrabold text-white shadow-soft-sm transition-all hover:scale-[0.99] hover:shadow-soft-sm active:scale-[0.98] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading && (
                                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                                    <path d="M4 12a8 8 0 018-8" strokeLinecap="round" />
                                </svg>
                            )}
                            Ẩn
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Uniform Card                                                          */
/* ────────────────────────────────────────────────────────────────────── */
function UniformCard({ item, onEdit, onDelete, onManageVariants, onHide }: {
    item: OutfitDto; onEdit: (item: OutfitDto) => void; onDelete: (item: OutfitDto) => void;
    onManageVariants: (item: OutfitDto) => void; onHide: (item: OutfitDto) => void;
}) {
    const formattedPrice = new Intl.NumberFormat("vi-VN").format(item.price) + "đ";

    return (
        <div className="nb-card overflow-hidden group">
            <div className="w-full aspect-[4/3] bg-gray-100 border-b border-gray-200 flex items-center justify-center relative">
                {item.mainImageURL ? (
                    <img src={item.mainImageURL} alt={item.outfitName} className="w-full h-full object-cover" />
                ) : (
                    <svg className="w-16 h-16 text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16V7.99C21 6.89 20.1 6 19 6H5C3.9 6 3 6.89 3 7.99V16C3 17.1 3.9 18 5 18H19C20.1 18 21 17.1 21 16ZM12 14L17 10H7L12 14Z" /></svg>
                )}
                <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => onEdit(item)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-violet-50 text-violet-600 transition-all" title="Sửa">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>
                    </button>
                    {item.canDelete ? (
                        <button onClick={() => onDelete(item)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-red-50 text-red-500 transition-all" title="Xóa">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></svg>
                        </button>
                    ) : (
                        <button onClick={() => onHide(item)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-amber-50 text-amber-600 transition-all" title="Ẩn đồng phục">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" /></svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex flex-col bg-white">
                <div className="px-4 pt-3 pb-2">
                    <h3 className="font-bold text-gray-900 text-base leading-tight truncate">{item.outfitName}</h3>
                    <p className="font-medium text-gray-600 text-sm mt-0.5 line-clamp-1">{item.description ? stripHtml(item.description) : "Không có mô tả"}</p>
                </div>
                <div className="mx-4 border-t-2 border-gray-200" />
                <div className="px-4 py-3 flex items-center justify-between">
                    <span className="nb-badge text-gray-600 bg-gray-100">{OUTFIT_TYPE_LABELS[item.outfitType] || "Khác"}</span>
                    <span className="font-extrabold text-violet-600 text-sm">{formattedPrice}</span>
                </div>
                <div className="px-4 pb-3">
                    <button onClick={() => onManageVariants(item)} className="w-full nb-btn-outline text-xs py-2 text-violet-600 border-[#DDD6FE] bg-violet-50 hover:bg-violet-50">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" /></svg>
                        Quản lý kích cỡ
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Upload Placeholder Card                                                */
/* ────────────────────────────────────────────────────────────────────── */
function UploadPlaceholderCard({ onClick }: { onClick: () => void }) {
    return (
        <div onClick={onClick} className="flex flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-200 bg-gray-50 hover:border-violet-600 hover:bg-violet-50 cursor-pointer transition-all duration-200 min-h-[320px] group hover:shadow-soft-md">
            <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-200 group-hover:border-violet-600 flex items-center justify-center mb-3 transition-colors">
                <svg className="w-8 h-8 text-gray-400 group-hover:text-violet-600 transition-colors" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
            </div>
            <p className="font-bold text-gray-600 group-hover:text-violet-600 text-sm transition-colors">Tải lên mẫu thiết kế mới</p>
            <p className="font-medium text-[#97A3B6] text-xs mt-1">Nhấn để thêm đồng phục</p>
        </div>
    );
}

/* ── Filter tab config ── */
const FILTER_TABS: { key: "all" | "available" | "unavailable"; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "available", label: "Đang bán" },
    { key: "unavailable", label: "Tạm ẩn" },
];

/* ────────────────────────────────────────────────────────────────────── */
/* Main Page                                                              */
/* ────────────────────────────────────────────────────────────────────── */
export const UniformManagement = (): JSX.Element => {
    const navigate = useNavigate();
    const sidebarConfig = useSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [schoolName, setSchoolName] = useState("");

    const [outfits, setOutfits] = useState<OutfitDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState<"all" | "available" | "unavailable">("all");
    const [page, setPage] = useState(1);
    const pageSize = 12;

    /* ── Modal state ── */
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingOutfit, setEditingOutfit] = useState<OutfitDto | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [deletingOutfit, setDeletingOutfit] = useState<OutfitDto | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [hidingOutfit, setHidingOutfit] = useState<OutfitDto | null>(null);
    const [hideLoading, setHideLoading] = useState(false);

    /* ── Variant modal state ── */
    const [variantOutfit, setVariantOutfit] = useState<OutfitDto | null>(null);

    /* ── Toast ── */
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const showToast = useCallback((message: string, type: "success" | "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    }, []);

    useEffect(() => {
        getSchoolProfile()
            .then((p) => setSchoolName(p.schoolName || ""))
            .catch(() => {});
    }, []);

    const fetchOutfits = useCallback(() => {
        setLoading(true);
        getSchoolOutfits()
            .then((res) => setOutfits(res.items))
            .catch(() => setOutfits([]))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { fetchOutfits(); }, [fetchOutfits]);

    /* ── Open create ── */
    const openCreate = () => { setEditingOutfit(null); setShowFormModal(true); };

    /* ── Open edit ── */
    const openEdit = (outfit: OutfitDto) => { setEditingOutfit(outfit); setShowFormModal(true); };

    /* ── Save (create or update) ── */
    const handleSave = async (data: CreateOutfitRequest, imageFile: File | null) => {
        setFormLoading(true);
        try {
            // Upload image if a new file was selected
            let imageUrl = data.mainImageURL;
            if (imageFile) {
                const res = await uploadOutfitImage(imageFile);
                imageUrl = res.imageUrl;
            }

            if (editingOutfit) {
                await updateOutfit(editingOutfit.outfitId, {
                    outfitName: data.outfitName,
                    description: data.description,
                    materialType: data.materialType,
                    price: data.price,
                    outfitType: data.outfitType,
                    mainImageURL: imageUrl,
                });
                showToast("Cập nhật đồng phục thành công!", "success");
            } else {
                await createOutfit({ ...data, mainImageURL: imageUrl });
                showToast("Tạo đồng phục thành công!", "success");
            }
            setShowFormModal(false);
            setEditingOutfit(null);
            fetchOutfits();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Có lỗi xảy ra";
            showToast(msg, "error");
        } finally {
            setFormLoading(false);
        }
    };

    /* ── Delete ── */
    const handleDelete = async () => {
        if (!deletingOutfit) return;
        setDeleteLoading(true);
        try {
            await deleteOutfit(deletingOutfit.outfitId);
            showToast("Xóa đồng phục thành công!", "success");
            setDeletingOutfit(null);
            fetchOutfits();
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : "Có lỗi xảy ra", "error");
        } finally {
            setDeleteLoading(false);
        }
    };

    /* ── Hide (toggle availability = false) ── */
    const handleHide = async () => {
        if (!hidingOutfit) return;
        setHideLoading(true);
        try {
            await setOutfitAvailability(hidingOutfit.outfitId, false);
            showToast("Đồng phục đã được ẩn khỏi trang công khai.", "success");
            setHidingOutfit(null);
            fetchOutfits();
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : "Có lỗi xảy ra", "error");
        } finally {
            setHideLoading(false);
        }
    };

    /* ── Filter ── */
    const filteredOutfits = useMemo(() => {
        let items = outfits;
        if (activeTab === "available") items = items.filter((o) => o.isAvailable);
        else if (activeTab === "unavailable") items = items.filter((o) => !o.isAvailable);
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            items = items.filter((o) => o.outfitName.toLowerCase().includes(q) || (o.description && o.description.toLowerCase().includes(q)));
        }
        return items;
    }, [outfits, activeTab, search]);

    const totalPages = Math.ceil(filteredOutfits.length / pageSize);
    const paginatedOutfits = filteredOutfits.slice((page - 1) * pageSize, page * pageSize);

    const availableCount = useMemo(() => outfits.filter((o) => o.isAvailable).length, [outfits]);
    const unavailableCount = useMemo(() => outfits.filter((o) => !o.isAvailable).length, [outfits]);

    const handleLogout = () => {
        localStorage.removeItem("access_token"); localStorage.removeItem("user"); localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token"); sessionStorage.removeItem("user"); sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} name={schoolName} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                    {/* Breadcrumb */}
                    <TopNavBar>
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem><BreadcrumbLink href="/school/dashboard" className="font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                                <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                                <BreadcrumbItem><BreadcrumbPage className="font-semibold text-[#4c5769] text-base">Quản lý đồng phục</BreadcrumbPage></BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </TopNavBar>

                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div>
                                <h1 className="font-extrabold text-gray-900 text-[28px] lg:text-[32px] leading-tight">👕 Danh mục đồng phục</h1>
                                <p className="mt-1 font-medium text-[#4c5769] text-sm lg:text-base">Xem và quản lý các mẫu thiết kế từ nhà cung cấp.</p>
                            </div>
                            <button onClick={openCreate} className="nb-btn nb-btn-purple text-sm whitespace-nowrap">
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
                                Thêm mẫu mới
                            </button>
                        </div>

                        {/* Search + Filters */}
                        <div className="nb-card-static p-4 space-y-4">
                            <div className="flex items-center gap-2 bg-gray-50 border border-[#cbcad7] rounded-[10px] px-4 py-2.5">
                                <svg className="w-5 h-5 text-[#97A3B6] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
                                <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm kiếm..." className="flex-1 bg-transparent outline-none font-medium text-sm text-[#1a1a2e] placeholder:text-[#97A3B6]" />
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-1.5 px-3 py-2 nb-card-static">
                                    <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="currentColor"><path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" /></svg>
                                    <span className="font-semibold text-gray-600 text-sm">Bộ lọc</span>
                                </div>
                                {FILTER_TABS.map((tab) => {
                                    const isActive = activeTab === tab.key;
                                    const badge = tab.key === "available" ? availableCount : tab.key === "unavailable" ? unavailableCount : 0;
                                    return (
                                        <button key={tab.key} onClick={() => { setActiveTab(tab.key); setPage(1); }} className={`nb-tab ${isActive ? "nb-tab-active" : ""}`}>
                                            {tab.label}
                                            {badge > 0 && <span className={`ml-1.5 min-w-[20px] h-5 flex items-center justify-center rounded-full text-xs font-bold px-1.5 ${isActive ? "bg-white/20 text-white" : "bg-[#E5E7EB] text-gray-600"}`}>{badge}</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Loading */}
                        {loading && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="rounded-[10px] overflow-hidden animate-pulse">
                                        <div className="w-full aspect-[4/3] bg-gray-200" />
                                        <div className="bg-white p-4 space-y-2 border border-t-0 border-[#CBCAD7] rounded-b-[10px]"><div className="h-4 bg-gray-200 rounded w-3/4" /><div className="h-3 bg-gray-200 rounded w-1/2" /></div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Cards Grid */}
                        {!loading && (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                    {paginatedOutfits.map((item) => (
                                        <UniformCard key={item.outfitId} item={item} onEdit={openEdit} onDelete={setDeletingOutfit} onManageVariants={setVariantOutfit} onHide={setHidingOutfit} />
                                    ))}
                                    <UploadPlaceholderCard onClick={openCreate} />
                                </div>
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-3 mt-4">
                                        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="nb-btn nb-btn-outline nb-btn-sm text-sm">← Trước</button>
                                        <span className="text-sm font-bold text-gray-500">{page}/{totalPages} ({filteredOutfits.length} mẫu)</span>
                                        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="nb-btn nb-btn-outline nb-btn-sm text-sm">Sau →</button>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Empty state */}
                        {!loading && filteredOutfits.length === 0 && (
                            <div className="nb-card-static p-12 text-center">
                                <svg className="w-16 h-16 text-[#CBCAD7] mx-auto mb-4" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16V7.99C21 6.89 20.1 6 19 6H5C3.9 6 3 6.89 3 7.99V16C3 17.1 3.9 18 5 18H19C20.1 18 21 17.1 21 16ZM12 14L17 10H7L12 14Z" /></svg>
                                <p className="font-semibold text-gray-600 text-base">Chưa có mẫu đồng phục nào</p>
                                <p className="font-medium text-[#97A3B6] text-sm mt-1">Nhấn "Thêm mẫu mới" để bắt đầu thêm sản phẩm.</p>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Modals */}
            <OutfitFormModal
                isOpen={showFormModal}
                onClose={() => { setShowFormModal(false); setEditingOutfit(null); }}
                onSave={handleSave}
                isLoading={formLoading}
                editingOutfit={editingOutfit}
            />

            <DeleteConfirmDialog
                isOpen={!!deletingOutfit}
                onClose={() => setDeletingOutfit(null)}
                onConfirm={handleDelete}
                outfitName={deletingOutfit?.outfitName || ""}
                isLoading={deleteLoading}
            />

            <HideConfirmDialog
                isOpen={!!hidingOutfit}
                onClose={() => setHidingOutfit(null)}
                onConfirm={handleHide}
                outfitName={hidingOutfit?.outfitName || ""}
                isLoading={hideLoading}
            />

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-[10px] border border-gray-200 shadow-soft-md animate-in slide-in-from-bottom-4 duration-300 ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
                    {toast.type === "success" ? "✅" : "❌"}
                    <span className="font-extrabold text-[15px]">{toast.message}</span>
                </div>
            )}

            {/* Variant Manager Modal */}
            <VariantManager
                outfitId={variantOutfit?.outfitId || ""}
                outfitName={variantOutfit?.outfitName || ""}
                defaultMaterialType={variantOutfit?.materialType || ""}
                isOpen={!!variantOutfit}
                onClose={() => setVariantOutfit(null)}
            />
        </div>
    );
};

export default UniformManagement;
