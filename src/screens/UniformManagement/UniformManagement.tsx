import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    ChevronDown,
    Eye,
    EyeOff,
    ImagePlus,
    Loader2,
    Pencil,
    Plus,
    Search,
    Shirt,
    Trash2,
    X,
} from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { SCHOOL_THEME } from "../../constants/schoolTheme";
import { useSidebarConfig } from "../../hooks/useSidebarConfig";
import {
    getSchoolProfile,
    getSchoolOutfits,
    createOutfit,
    updateOutfit,
    deleteOutfit,
    setOutfitAvailability,
    uploadOutfitImage,
    getUniformCategories,
    type OutfitDto,
    type CreateOutfitRequest,
    type UniformCategoryDto,
} from "../../lib/api/schools";
import { RichTextEditor } from "../../components/RichTextEditor/RichTextEditor";

function stripHtml(html: string): string {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
}

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

const MIN_FILTER_FEEDBACK_MS = 700;

function inferOutfitTypeFromCategoryName(categoryName: string): number {
    const normalized = categoryName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase();
    if (normalized.includes("the thao")) return 2;
    if (normalized.includes("phu kien")) return 3;
    if (normalized.includes("khac")) return 4;
    return 1;
}

type OutfitFormData = {
    outfitName: string;
    description: string;
    outfitType: number;
    categoryId: string;
    mainImageURL: string;
};

const EMPTY_FORM: OutfitFormData = {
    outfitName: "",
    description: "",
    outfitType: 1,
    categoryId: "",
    mainImageURL: "",
};

function OutfitFormModal({
    isOpen,
    onClose,
    onSave,
    isLoading,
    editingOutfit,
    categories,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CreateOutfitRequest, imageFile: File | null) => void;
    isLoading: boolean;
    editingOutfit: OutfitDto | null;
    categories: UniformCategoryDto[];
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
                    outfitType: editingOutfit.outfitType,
                    categoryId: editingOutfit.categoryId || "",
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
        if (!file) {
            setImageFile(null);
            setImagePreview(null);
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setUploadError("File quá lớn. Tối đa 5MB.");
            return;
        }
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            setUploadError("Chỉ hỗ trợ JPEG, PNG hoặc WebP.");
            return;
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
        if (isNameOver) {
            alert("Tên đồng phục không được vượt quá 50 ký tự.");
            return;
        }
        if (isDescOver) {
            alert("Mô tả không được vượt quá 500 ký tự (bao gồm định dạng HTML).");
            return;
        }
        onSave(
            {
                outfitName: form.outfitName.trim(),
                description: form.description.trim() || null,
                materialType: null,
                outfitType: form.outfitType,
                categoryId: form.categoryId || null,
                mainImageURL: form.mainImageURL.trim() || null,
                isCustomizable: false,
            },
            imageFile,
        );
    };

    const modernInputClass = `w-full rounded-[8px] border border-gray-200 bg-white px-4 py-3 text-[15px] font-medium text-gray-900 shadow-soft-sm outline-none transition-all placeholder:text-gray-400 ${SCHOOL_THEME.primaryFocus}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/45" onClick={onClose} />
            <div className="relative max-h-[92vh] w-full max-w-[920px] overflow-hidden rounded-[8px] border border-gray-200 bg-white shadow-soft-lg">
                <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-gray-200 bg-white px-6 py-5">
                    <div>
                        <div className={`mb-2 inline-flex items-center gap-2 rounded-full border ${SCHOOL_THEME.primarySoftBorder} ${SCHOOL_THEME.primarySoftBg} px-3 py-1 text-[12px] font-black uppercase tracking-[0.12em] ${SCHOOL_THEME.primaryText}`}>
                            {isEditing ? "Chỉnh sửa mẫu" : "Thêm mẫu mới"}
                        </div>
                        <h2 className="text-2xl font-bold leading-none text-gray-900">
                            {isEditing ? "Chỉnh sửa mẫu đồng phục" : "Thêm mẫu đồng phục mới"}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[8px] border border-gray-200 bg-white text-gray-700 shadow-soft-sm transition-colors hover:bg-slate-50"
                        aria-label="Đóng"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="max-h-[calc(92vh-154px)] overflow-y-auto px-6 py-6 md:px-8">
                    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
                    <section className="space-y-5">
                        <label className="mb-2 block text-[14px] font-extrabold text-gray-900">Thiết kế đồng phục</label>
                        <div className={`rounded-[8px] border ${SCHOOL_THEME.primarySoftBorder} ${SCHOOL_THEME.primarySoftBg} p-3 shadow-soft-sm`}>
                            <div
                                className={`relative flex min-h-[340px] cursor-pointer items-center justify-center overflow-hidden rounded-[8px] border-2 border-dashed ${SCHOOL_THEME.primarySoftBorder} bg-slate-50 px-4 py-6 transition-colors hover:border-blue-300`}
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const f = e.dataTransfer.files?.[0];
                                    if (f) handleFileChange(f);
                                }}
                            >
                                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleFileChange(e.target.files?.[0] || null)} />
                                {imagePreview ? (
                                    <div className="relative flex h-[300px] w-full items-center justify-center">
                                        <img src={imagePreview} alt="Preview" className="max-h-full max-w-full object-contain drop-shadow-md" />
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); setForm((f) => ({ ...f, mainImageURL: "" })); }}
                                            className="absolute right-0 top-0 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 shadow-soft-sm transition-colors hover:text-red-500"
                                            aria-label="Xóa ảnh"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                            className={`absolute bottom-0 right-0 z-10 rounded-[8px] border ${SCHOOL_THEME.primarySoftBorder} bg-white px-3 py-2 text-xs font-extrabold ${SCHOOL_THEME.primaryText} shadow-soft-sm transition-colors hover:bg-blue-50`}
                                        >
                                            Đổi ảnh
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3 text-center">
                                        <div className={`flex h-12 w-12 items-center justify-center rounded-[8px] border ${SCHOOL_THEME.primarySoftBorder} bg-white ${SCHOOL_THEME.primaryText} shadow-soft-sm`}>
                                            <ImagePlus className="h-6 w-6" />
                                        </div>
                                        <p className="text-[14px] font-extrabold text-gray-900">Kéo thả hoặc nhấn để chọn ảnh</p>
                                        <p className="text-[13px] font-bold leading-5 text-gray-500">JPG, PNG hoặc WebP tối đa 5MB. Ảnh này sẽ hiển thị trong danh sách mẫu đồng phục của trường.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        {uploadError && <p className="mt-2 text-[13px] font-bold text-[#FF6B57]">{uploadError}</p>}
                        <div className="hidden">
                            <label className="mb-2 block text-[14px] font-extrabold text-gray-900">Loại đồng phục</label>
                            <select
                                value={form.categoryId}
                                onChange={(e) => {
                                    const category = categories.find((item) => item.categoryId === e.target.value);
                                    setForm((f) => ({
                                        ...f,
                                        categoryId: e.target.value,
                                        outfitType: category ? inferOutfitTypeFromCategoryName(category.categoryName) : 1,
                                    }));
                                }}
                                className={modernInputClass}
                            >
                                <option value="">Chọn danh mục</option>
                                {categories.map((category) => (
                                    <option key={category.categoryId} value={category.categoryId}>{category.categoryName}</option>
                                ))}
                            </select>
                            {categories.length === 0 && (
                                <p className="mt-2 text-[13px] font-bold text-amber-600">Admin cần tạo danh mục trước khi trường gắn danh mục cho đồng phục.</p>
                            )}
                        </div>
                    </section>

                    <section className="space-y-4">
                        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(220px,0.65fr)]">
                        <div>
                            <label className="mb-2 block text-[14px] font-extrabold text-gray-900">Tên mẫu <span className="ml-1 text-red-500">*</span></label>
                            <input type="text" value={form.outfitName} onChange={(e) => setForm((f) => ({ ...f, outfitName: e.target.value }))} placeholder="VD: Áo sơ mi Nam" className={`${modernInputClass} ${isNameOver ? "!border-[#EF4444]" : ""}`} required maxLength={50} />
                            <div className={`mt-1 text-right text-xs font-semibold ${isNameOver ? "text-red-500" : nameLength > 40 ? "text-[#F59E0B]" : "text-gray-400"}`}>{nameLength}/50</div>
                        </div>

                        <div>
                            <label className="mb-2 block text-[14px] font-extrabold text-gray-900">Loại đồng phục</label>
                            <select
                                value={form.categoryId}
                                onChange={(e) => {
                                    const category = categories.find((item) => item.categoryId === e.target.value);
                                    setForm((f) => ({
                                        ...f,
                                        categoryId: e.target.value,
                                        outfitType: category ? inferOutfitTypeFromCategoryName(category.categoryName) : 1,
                                    }));
                                }}
                                className={modernInputClass}
                            >
                                <option value="">Chọn danh mục</option>
                                {categories.map((category) => (
                                    <option key={category.categoryId} value={category.categoryId}>{category.categoryName}</option>
                                ))}
                            </select>
                            {categories.length === 0 && (
                                <p className="mt-2 text-[13px] font-bold text-amber-600">Admin cần tạo danh mục trước khi trường gắn danh mục cho đồng phục.</p>
                            )}
                        </div>
                        </div>

                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <label className="block text-[14px] font-extrabold text-gray-900">Mô tả thiết kế</label>
                                <button type="button" onClick={() => setShowPreview(!showPreview)} className={`flex items-center gap-1.5 rounded-[8px] border px-3 py-1.5 text-[12px] font-extrabold transition-colors ${showPreview ? "border-blue-500 bg-[#2563EB] text-white shadow-soft-sm" : "border-gray-200 bg-white text-gray-900 shadow-soft-sm hover:border-blue-200 hover:text-[#2563EB]"}`}>{showPreview ? "Chỉnh sửa" : "Xem trước"}</button>
                            </div>
                            <div className={showPreview ? "hidden" : ""}>
                                <RichTextEditor value={form.description} onChange={(html) => setForm((f) => ({ ...f, description: html }))} placeholder="VD: Mẫu áo sơ mi cổ Đức, tay dài, dùng cho học sinh nam khối THCS..." />
                            </div>
                            {showPreview && (
                                <div className={`min-h-[120px] rounded-[8px] border ${SCHOOL_THEME.primarySoftBorder} ${SCHOOL_THEME.primarySoftBg} px-5 py-4 shadow-soft-sm`}>
                                    {form.description ? <div className="prose-editor-content text-[15px] leading-relaxed text-gray-700" dangerouslySetInnerHTML={{ __html: form.description }} /> : <p className="text-[15px] italic font-normal text-gray-400">Chưa có nội dung mô tả.</p>}
                                </div>
                            )}
                            <div className={`mt-1 text-right text-xs font-semibold ${isDescOver ? "text-red-500" : descLength > 400 ? "text-[#F59E0B]" : "text-gray-400"}`}>{descLength}/500</div>
                        </div>
                    </section>
                    </div>
                </form>

                <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-white px-6 py-5 sm:flex-row sm:justify-end">
                    <button type="button" onClick={onClose} className="rounded-[8px] border border-gray-200 bg-white px-5 py-3 text-[15px] font-extrabold text-gray-900 shadow-soft-sm transition-all hover:scale-[0.99]">Huỷ</button>
                    <button onClick={handleSubmit} disabled={isLoading || !form.outfitName.trim() || isNameOver || isDescOver} className={SCHOOL_THEME.primaryButton}>
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isEditing ? "Lưu thay đổi" : "Tạo mẫu"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function DeleteConfirmDialog({
    isOpen, onClose, onConfirm, outfitName, isLoading,
}: {
    isOpen: boolean; onClose: () => void; onConfirm: () => void; outfitName: string; isLoading: boolean;
}) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative mx-4 w-full max-w-[420px] overflow-hidden rounded-[18px] border border-gray-200 bg-white shadow-soft-lg">
                <div className="border-b border-gray-200 bg-red-50 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-gray-200 bg-white text-lg shadow-soft-sm">🗑️</div>
                        <h3 className="text-[18px] font-black text-gray-900">Xóa mẫu đồng phục?</h3>
                    </div>
                </div>
                <div className="px-6 py-5">
                    <p className="mb-5 text-[15px] font-semibold text-gray-500">Bạn có chắc muốn xóa <strong>"{outfitName}"</strong>? Hành động này không thể hoàn tác.</p>
                    <div className="flex justify-end gap-3">
                        <button onClick={onClose} className="rounded-[8px] border border-gray-200 bg-white px-5 py-3 text-[15px] font-extrabold text-gray-900 shadow-soft-sm transition-all">Huỷ</button>
                        <button onClick={onConfirm} disabled={isLoading} className="flex items-center gap-2 rounded-[8px] bg-red-500 px-5 py-3 text-[15px] font-extrabold text-white shadow-soft-sm disabled:opacity-50">
                            {isLoading && <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M4 12a8 8 0 018-8" strokeLinecap="round" /></svg>}
                            Xóa
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function HideConfirmDialog({
    isOpen, onClose, onConfirm, outfitName, isLoading,
}: {
    isOpen: boolean; onClose: () => void; onConfirm: () => void; outfitName: string; isLoading: boolean;
}) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative mx-4 w-full max-w-[420px] overflow-hidden rounded-[18px] border border-gray-200 bg-white shadow-soft-lg">
                <div className="border-b border-gray-200 bg-amber-50 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-gray-200 bg-white text-lg shadow-soft-sm">🙈</div>
                        <h3 className="text-[18px] font-black text-gray-900">Ẩn mẫu đồng phục?</h3>
                    </div>
                </div>
                <div className="px-6 py-5">
                    <p className="mb-5 text-[15px] font-semibold text-gray-500">Mẫu <strong>"{outfitName}"</strong> đã từng thuộc chiến dịch đã hoàn tất nên không thể xóa. Bạn có muốn ẩn mẫu này khỏi trang công khai không?</p>
                    <div className="flex justify-end gap-3">
                        <button onClick={onClose} className="rounded-[8px] border border-gray-200 bg-white px-5 py-3 text-[15px] font-extrabold text-gray-900 shadow-soft-sm transition-all">Huỷ</button>
                        <button onClick={onConfirm} disabled={isLoading} className="flex items-center gap-2 rounded-[8px] bg-amber-600 px-5 py-3 text-[15px] font-extrabold text-white shadow-soft-sm disabled:opacity-50">
                            {isLoading && <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M4 12a8 8 0 018-8" strokeLinecap="round" /></svg>}
                            Ẩn
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
    return (
        <div className="rounded-[8px] border border-gray-200 bg-white p-12 text-center shadow-soft-sm">
            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full border ${SCHOOL_THEME.primarySoftBorder} ${SCHOOL_THEME.primarySoftBg} ${SCHOOL_THEME.primaryText} shadow-soft-sm`}>
                <Box className="h-8 w-8" />
            </div>
            <h2 className="mt-5 text-xl font-extrabold text-gray-900">Chưa có thiết kế đồng phục nào</h2>
            <button onClick={onCreate} className={`${SCHOOL_THEME.primaryButton} mt-5`}>
                Tạo mẫu đầu tiên
            </button>
        </div>
    );
}

function SearchEmptyState({
    onClear,
}: {
    onClear: () => void;
}) {
    return (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[8px] border border-gray-200 bg-white p-12 text-center shadow-soft-sm">
            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full border ${SCHOOL_THEME.primarySoftBorder} ${SCHOOL_THEME.primarySoftBg} ${SCHOOL_THEME.primaryText} shadow-soft-sm`}>
                <Search className="h-8 w-8" />
            </div>
            <h2 className="mt-5 text-xl font-extrabold text-gray-900">Không tìm thấy mẫu phù hợp</h2>
            <button onClick={onClear} className="nb-btn nb-btn-outline mt-5 text-sm hover:border-blue-200 hover:text-[#2563EB]">
                Xóa bộ lọc
            </button>
        </div>
    );
}

function LoadingState() {
    return (
        <div className="bg-white">
            {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="grid grid-cols-[90px_1.4fr_1fr_0.8fr_0.7fr_110px] items-center gap-4 border-b border-gray-100 px-5 py-4 last:border-b-0">
                    <div className="h-4 animate-pulse rounded bg-gray-100" />
                    <div className="h-12 animate-pulse rounded-[8px] bg-gray-100" />
                    <div className="h-4 animate-pulse rounded bg-gray-100" />
                    <div className="h-4 animate-pulse rounded bg-gray-100" />
                    <div className="h-6 animate-pulse rounded-full bg-gray-100" />
                    <div className="h-8 animate-pulse rounded bg-gray-100" />
                </div>
            ))}
        </div>
    );
}

function UniformTable({
    items,
    onEdit,
    onDelete,
    onHide,
    onUnhide,
}: {
    items: OutfitDto[];
    onEdit: (item: OutfitDto) => void;
    onDelete: (item: OutfitDto) => void;
    onHide: (item: OutfitDto) => void;
    onUnhide: (item: OutfitDto) => void;
}) {
    return (
        <div className="overflow-hidden bg-white">
            <div className="hidden grid-cols-[90px_1.5fr_1fr_0.8fr_0.7fr_112px] items-center gap-4 border-b border-gray-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-950 lg:grid">
                <span>ID</span>
                <span>Thiết kế</span>
                <span>Danh mục</span>
                <span>Loại</span>
                <span>Trạng thái</span>
                <span>Thao tác</span>
            </div>
            <div className="divide-y divide-gray-100">
                {items.map((item) => (
                    <div key={item.outfitId} className="grid gap-4 px-5 py-4 transition-colors hover:bg-blue-50/50 lg:grid-cols-[90px_1.5fr_1fr_0.8fr_0.7fr_112px] lg:items-center">
                        <span className="font-mono text-sm font-semibold text-slate-600">#{item.outfitId.slice(0, 6).toUpperCase()}</span>

                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-gray-200 bg-slate-50">
                                {item.mainImageURL ? (
                                    <img src={item.mainImageURL} alt={item.outfitName} className="h-full w-full object-cover" />
                                ) : (
                                    <Shirt className="h-5 w-5 text-slate-300" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-slate-950">{item.outfitName}</p>
                                <p className="mt-1 line-clamp-1 text-xs font-medium text-slate-500">
                                    {item.description ? stripHtml(item.description) : "Chưa có mô tả"}
                                </p>
                            </div>
                        </div>

                        <span className="text-sm font-semibold text-slate-700">{item.categoryName || "Chưa phân loại"}</span>
                        <span className="text-sm font-semibold text-slate-700">{OUTFIT_TYPE_LABELS[item.outfitType] || "Khác"}</span>
                        <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${item.isAvailable ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                            {item.isAvailable ? "Hiển thị" : "Tạm ẩn"}
                        </span>

                        <div className="flex items-center gap-2">
                            <button type="button" onClick={() => onEdit(item)} className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-slate-700 transition-colors hover:bg-blue-50 hover:text-[#2563EB]" aria-label="Sửa">
                                <Pencil className="h-4 w-4" />
                            </button>
                            {item.canDelete ? (
                                <button type="button" onClick={() => onDelete(item)} className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-slate-700 transition-colors hover:bg-red-50 hover:text-red-600" aria-label="Xóa">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            ) : item.isAvailable ? (
                                <button type="button" onClick={() => onHide(item)} className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900" aria-label="Ẩn">
                                    <EyeOff className="h-4 w-4" />
                                </button>
                            ) : (
                                <button type="button" onClick={() => onUnhide(item)} className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700" aria-label="Hiện">
                                    <Eye className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Pagination({
    page,
    totalPages,
    setPage,
}: {
    page: number;
    totalPages: number;
    setPage: React.Dispatch<React.SetStateAction<number>>;
}) {
    if (totalPages <= 1) return null;

    return (
        <div className="mt-8 flex items-center justify-center gap-3">
            <button disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="nb-btn nb-btn-outline nb-btn-sm text-sm">
                ← Trước
            </button>
            <span className="text-sm font-bold text-gray-500">{page}/{totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} className="nb-btn nb-btn-outline nb-btn-sm text-sm">
                Sau →
            </button>
        </div>
    );
}

export const UniformManagement = (): JSX.Element => {
    const navigate = useNavigate();
    const sidebarConfig = useSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [schoolName, setSchoolName] = useState("");
    const { showToast } = useToast();

    const [outfits, setOutfits] = useState<OutfitDto[]>([]);
    const [categories, setCategories] = useState<UniformCategoryDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [categoryInput, setCategoryInput] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [statusInput, setStatusInput] = useState<"all" | "available" | "unavailable">("all");
    const [statusFilter, setStatusFilter] = useState<"all" | "available" | "unavailable">("all");
    const [filtering, setFiltering] = useState(false);
    const [page, setPage] = useState(1);
    const pageSize = 8;

    const [showFormModal, setShowFormModal] = useState(false);
    const [editingOutfit, setEditingOutfit] = useState<OutfitDto | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [deletingOutfit, setDeletingOutfit] = useState<OutfitDto | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [hidingOutfit, setHidingOutfit] = useState<OutfitDto | null>(null);
    const [hideLoading, setHideLoading] = useState(false);
    const [unhidingOutfit, setUnhidingOutfit] = useState<OutfitDto | null>(null);
    const [unhideLoading, setUnhideLoading] = useState(false);
    const resultsRegionRef = useRef<HTMLDivElement>(null);
    const [searchEmptyMinHeight, setSearchEmptyMinHeight] = useState<number | null>(null);
    const filterTimerRef = useRef<number | null>(null);

    useEffect(() => {
        getSchoolProfile().then((p) => setSchoolName(p.schoolName || "")).catch(() => {});
    }, []);

    useEffect(() => {
        getUniformCategories().then(setCategories).catch(() => setCategories([]));
    }, []);

    const fetchOutfits = useCallback(() => {
        setLoading(true);
        getSchoolOutfits().then((res) => setOutfits(res.items)).catch(() => setOutfits([])).finally(() => setLoading(false));
    }, []);

    useEffect(() => { fetchOutfits(); }, [fetchOutfits]);

    useEffect(() => () => {
        if (filterTimerRef.current !== null) {
            window.clearTimeout(filterTimerRef.current);
        }
    }, []);

    const openCreate = () => { setEditingOutfit(null); setShowFormModal(true); };
    const openEdit = (outfit: OutfitDto) => { setEditingOutfit(outfit); setShowFormModal(true); };

    const handleSave = async (data: CreateOutfitRequest, imageFile: File | null) => {
        setFormLoading(true);
        try {
            let imageUrl = data.mainImageURL;
            if (imageFile) {
                const res = await uploadOutfitImage(imageFile);
                imageUrl = res.imageUrl;
            }
            if (editingOutfit) {
                await updateOutfit(editingOutfit.outfitId, { ...data, mainImageURL: imageUrl, materialType: null });
                showToast({ title: "Thành công", message: "Cập nhật mẫu đồng phục thành công!", variant: "success" });
            } else {
                await createOutfit({ ...data, mainImageURL: imageUrl, materialType: null });
                showToast({ title: "Thành công", message: "Tạo mẫu đồng phục thành công!", variant: "success" });
            }
            setShowFormModal(false);
            setEditingOutfit(null);
            fetchOutfits();
        } catch (err: any) {
            showToast({ title: "Lỗi", message: err.message || "Có lỗi xảy ra", variant: "error" });
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingOutfit) return;
        setDeleteLoading(true);
        try {
            await deleteOutfit(deletingOutfit.outfitId);
            showToast({ title: "Thành công", message: "Xóa mẫu đồng phục thành công!", variant: "success" });
            setDeletingOutfit(null);
            fetchOutfits();
        } catch (err: any) {
            showToast({ title: "Lỗi", message: err.message || "Có lỗi xảy ra", variant: "error" });
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleHide = async () => {
        if (!hidingOutfit) return;
        setHideLoading(true);
        try {
            await setOutfitAvailability(hidingOutfit.outfitId, false);
            showToast({ title: "Thành công", message: "Mẫu đồng phục đã được ẩn.", variant: "success" });
            setHidingOutfit(null);
            fetchOutfits();
        } catch (err: any) {
            showToast({ title: "Lỗi", message: err.message || "Có lỗi xảy ra", variant: "error" });
        } finally {
            setHideLoading(false);
        }
    };

    const handleUnhide = async () => {
        if (!unhidingOutfit) return;
        setUnhideLoading(true);
        try {
            await setOutfitAvailability(unhidingOutfit.outfitId, true);
            showToast({ title: "Thành công", message: "Mẫu đồng phục đã hiển thị lại.", variant: "success" });
            setUnhidingOutfit(null);
            fetchOutfits();
        } catch (err: any) {
            showToast({ title: "Lỗi", message: err.message || "Có lỗi xảy ra", variant: "error" });
        } finally {
            setUnhideLoading(false);
        }
    };

    const preserveResultsHeight = useCallback(() => {
        const currentHeight = resultsRegionRef.current?.offsetHeight;
        if (!currentHeight || currentHeight <= 0) return;
        setSearchEmptyMinHeight(currentHeight);
    }, []);

    const scheduleFilterCommit = useCallback((next: {
        search?: string;
        category?: string;
        status?: "all" | "available" | "unavailable";
    }) => {
        preserveResultsHeight();
        setFiltering(true);

        if (filterTimerRef.current !== null) {
            window.clearTimeout(filterTimerRef.current);
        }

        filterTimerRef.current = window.setTimeout(() => {
            if (next.search !== undefined) setSearch(next.search);
            if (next.category !== undefined) setCategoryFilter(next.category);
            if (next.status !== undefined) setStatusFilter(next.status);
            setPage(1);
            setFiltering(false);
            filterTimerRef.current = null;
        }, MIN_FILTER_FEEDBACK_MS);
    }, [preserveResultsHeight]);

    const filteredOutfits = useMemo(() => {
        let items = outfits;
        if (statusFilter === "available") items = items.filter((o) => o.isAvailable);
        else if (statusFilter === "unavailable") items = items.filter((o) => !o.isAvailable);
        if (categoryFilter) items = items.filter((o) => o.categoryId === categoryFilter);
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            items = items.filter((o) => {
                const searchable = [
                    o.outfitName,
                    o.description ? stripHtml(o.description) : "",
                    o.categoryName || "",
                    OUTFIT_TYPE_LABELS[o.outfitType] || "",
                ].join(" ").toLowerCase();
                return searchable.includes(q);
            });
        }
        return items;
    }, [outfits, categoryFilter, search, statusFilter]);

    const stats = useMemo(() => ({
        total: outfits.length,
        available: outfits.filter((item) => item.isAvailable).length,
        unavailable: outfits.filter((item) => !item.isAvailable).length,
    }), [outfits]);

    const totalPages = Math.max(1, Math.ceil(filteredOutfits.length / pageSize));
    const paginatedOutfits = filteredOutfits.slice((page - 1) * pageSize, page * pageSize);
    const isSearchEmptyState = !loading && outfits.length > 0 && filteredOutfits.length === 0;

    useEffect(() => {
        if (!isSearchEmptyState) {
            setSearchEmptyMinHeight(null);
        }
    }, [isSearchEmptyState]);

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        navigate("/signin", { replace: true });
    };

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300 shadow-soft-sm`}>
                    <DashboardSidebar {...sidebarConfig} name={schoolName} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                    <TopNavBar>
                        <div className="flex items-center gap-2 px-2 py-2">
                            <Shirt className={`h-5 w-5 ${SCHOOL_THEME.primaryText}`} />
                            <h1 className="text-xl font-bold text-gray-900">Quản lý đồng phục</h1>
                        </div>
                    </TopNavBar>

                    <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        <section className="rounded-[8px] border border-gray-200 bg-white shadow-soft-sm">
                            <div className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-950">Danh sách đồng phục</h2>
                                    <p className="mt-1 text-sm font-semibold text-slate-500">
                                        {stats.total} mẫu, {stats.available} đang hiển thị, {stats.unavailable} tạm ẩn
                                    </p>
                                </div>
                                <button type="button" onClick={openCreate} className={SCHOOL_THEME.primaryButton}>
                                    <Plus className="h-4 w-4" />
                                    Thêm thiết kế
                                </button>
                            </div>

                            <div className="flex flex-col gap-4 border-t border-gray-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                                <label className="relative block w-full lg:max-w-[320px]">
                                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="text"
                                        value={searchInput}
                                        onChange={(event) => {
                                            setSearchInput(event.target.value);
                                            scheduleFilterCommit({ search: event.target.value });
                                        }}
                                        placeholder="Tìm mẫu đồng phục..."
                                        className="h-10 w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-800 outline-none shadow-soft-xs transition-colors placeholder:text-slate-500 focus:border-blue-200 focus:ring-4 focus:ring-blue-50"
                                    />
                                </label>

                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                                    <label className="relative block">
                                        <select
                                            value={categoryInput}
                                            onChange={(event) => {
                                                setCategoryInput(event.target.value);
                                                scheduleFilterCommit({ category: event.target.value });
                                            }}
                                            className="h-10 min-w-[156px] appearance-none rounded-full border border-slate-200 bg-white py-0 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none shadow-soft-xs transition-colors focus:border-blue-200 focus:ring-4 focus:ring-blue-50"
                                        >
                                            <option value="">Danh mục</option>
                                            {categories.map((category) => (
                                                <option key={category.categoryId} value={category.categoryId}>{category.categoryName}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-900" />
                                    </label>

                                    <label className="relative block">
                                        <select
                                            value={statusInput}
                                            onChange={(event) => {
                                                const nextStatus = event.target.value as "all" | "available" | "unavailable";
                                                setStatusInput(nextStatus);
                                                scheduleFilterCommit({ status: nextStatus });
                                            }}
                                            className="h-10 min-w-[148px] appearance-none rounded-full border border-slate-200 bg-white py-0 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none shadow-soft-xs transition-colors focus:border-blue-200 focus:ring-4 focus:ring-blue-50"
                                        >
                                            <option value="all">Trạng thái</option>
                                            <option value="available">Đang hiển thị</option>
                                            <option value="unavailable">Tạm ẩn</option>
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-900" />
                                    </label>

                                    {filtering ? (
                                        <div className="inline-flex h-10 items-center gap-2 rounded-full border border-blue-100 bg-white px-3 text-xs font-bold text-[#2563EB] shadow-soft-sm">
                                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-100 border-t-[#2563EB]" />
                                            Đang lọc
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            <div
                                ref={resultsRegionRef}
                                style={isSearchEmptyState && searchEmptyMinHeight ? { minHeight: `${searchEmptyMinHeight}px` } : undefined}
                                className="relative border-t border-gray-100"
                            >
                                {loading ? (
                                    <LoadingState />
                                ) : filteredOutfits.length > 0 ? (
                                    <>
                                        <UniformTable
                                            items={paginatedOutfits}
                                            onEdit={openEdit}
                                            onDelete={setDeletingOutfit}
                                            onHide={setHidingOutfit}
                                            onUnhide={setUnhidingOutfit}
                                        />
                                        <Pagination page={page} totalPages={totalPages} setPage={setPage} />
                                    </>
                                ) : outfits.length > 0 ? (
                                    <SearchEmptyState
                                        onClear={() => {
                                            setSearchInput("");
                                            setSearch("");
                                            setCategoryInput("");
                                            setCategoryFilter("");
                                            setStatusInput("all");
                                            setStatusFilter("all");
                                            setSearchEmptyMinHeight(null);
                                        }}
                                    />
                                ) : (
                                    <EmptyState onCreate={openCreate} />
                                )}
                            </div>
                        </section>
                    </main>
                </div>
            </div>

            <OutfitFormModal isOpen={showFormModal} onClose={() => { setShowFormModal(false); setEditingOutfit(null); }} onSave={handleSave} isLoading={formLoading} editingOutfit={editingOutfit} categories={categories} />
            <DeleteConfirmDialog isOpen={!!deletingOutfit} onClose={() => setDeletingOutfit(null)} onConfirm={handleDelete} outfitName={deletingOutfit?.outfitName || ""} isLoading={deleteLoading} />
            <HideConfirmDialog isOpen={!!hidingOutfit} onClose={() => setHidingOutfit(null)} onConfirm={handleHide} outfitName={hidingOutfit?.outfitName || ""} isLoading={hideLoading} />
            <HideConfirmDialog isOpen={!!unhidingOutfit} onClose={() => setUnhidingOutfit(null)} onConfirm={handleUnhide} outfitName={unhidingOutfit?.outfitName || ""} isLoading={unhideLoading} />
        </div>
    );
};

export default UniformManagement;
