import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Eye,
    EyeOff,
    Pencil,
    Plus,
    Search,
    Shirt,
    Trash2,
} from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
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

    const modernInputClass = "w-full rounded-[10px] border border-gray-200 bg-white px-4 py-3 text-[15px] font-medium text-gray-900 shadow-soft-sm outline-none transition-all placeholder:text-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative mx-4 max-h-[90vh] w-full max-w-[640px] overflow-y-auto rounded-[18px] border border-gray-200 bg-white shadow-soft-lg">
                <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-gray-200 bg-violet-50 px-6 py-5">
                    <div>
                        <div className="mb-2 inline-flex items-center gap-2 rounded-[8px] border border-yellow-200 bg-yellow-50 px-3 py-1 text-[12px] font-black shadow-soft-sm">
                            {isEditing ? "✏️ CHỈNH SỬA MẪU" : "➕ THÊM MỚI"}
                        </div>
                        <h2 className="text-[24px] font-black leading-none text-gray-900 md:text-[28px]">
                            {isEditing ? "Chỉnh sửa mẫu đồng phục" : "Thêm mẫu đồng phục mới"}
                        </h2>
                    </div>
                    <button onClick={onClose} className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[10px] border border-gray-200 bg-white text-[22px] font-black shadow-soft-sm transition-all hover:scale-[0.99] hover:shadow-soft-sm active:scale-[0.98] active:shadow-none">×</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6 md:px-8 md:py-8">
                    <section>
                        <label className="mb-2 block text-[14px] font-extrabold text-gray-900">Thiết kế đồng phục</label>
                        <div className="rounded-[14px] border border-purple-200 bg-violet-50 p-3 shadow-soft-sm">
                            <div
                                className="relative flex min-h-[200px] cursor-pointer items-center justify-center rounded-[10px] border-[2px] border-dashed border-[#8B6BFF] bg-white/70 px-4 py-6"
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
                                    <>
                                        <button type="button" onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); setForm((f) => ({ ...f, mainImageURL: "" })); }} className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 shadow-soft-sm transition-all hover:scale-[0.99] hover:shadow-soft-sm hover:text-red-500">×</button>
                                        <img src={imagePreview} alt="Preview" className="h-[180px] w-[180px] rounded-[10px] border border-gray-200 object-cover shadow-soft-sm" />
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-3 text-center">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-[10px] border border-gray-200 bg-white shadow-soft-sm">
                                            <svg className="h-6 w-6 text-violet-500" viewBox="0 0 24 24" fill="currentColor"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" /></svg>
                                        </div>
                                        <p className="text-[14px] font-extrabold text-gray-900">Kéo thả hoặc nhấn để chọn ảnh</p>
                                        <p className="text-[13px] font-bold text-gray-500">JPG, PNG tối đa 5MB. Đây là ảnh thiết kế để Provider tiếp nhận và hoàn thiện thông tin bán hàng.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        {uploadError && <p className="mt-2 text-[13px] font-bold text-[#FF6B57]">{uploadError}</p>}
                    </section>

                    <section className="grid gap-5 md:grid-cols-2">
                        <div className="md:col-span-2">
                            <label className="mb-2 block text-[14px] font-extrabold text-gray-900">Tên mẫu <span className="ml-1 text-red-500">*</span></label>
                            <input type="text" value={form.outfitName} onChange={(e) => setForm((f) => ({ ...f, outfitName: e.target.value }))} placeholder="VD: Áo sơ mi Nam" className={`${modernInputClass} ${isNameOver ? "!border-[#EF4444]" : ""}`} required maxLength={50} />
                            <div className={`mt-1 text-right text-xs font-semibold ${isNameOver ? "text-red-500" : nameLength > 40 ? "text-[#F59E0B]" : "text-gray-400"}`}>{nameLength}/50</div>
                        </div>

                        <div className="md:col-span-2">
                            <div className="mb-2 flex items-center justify-between">
                                <label className="block text-[14px] font-extrabold text-gray-900">Mô tả thiết kế</label>
                                <button type="button" onClick={() => setShowPreview(!showPreview)} className={`flex items-center gap-1.5 rounded-[8px] border border-gray-200 px-3 py-1.5 text-[12px] font-extrabold transition-all ${showPreview ? "bg-violet-500 text-white shadow-soft-sm" : "bg-white text-gray-900 shadow-soft-sm hover:bg-violet-50"}`}>{showPreview ? "Chỉnh sửa" : "Xem trước"}</button>
                            </div>
                            <div className={showPreview ? "hidden" : ""}>
                                <RichTextEditor value={form.description} onChange={(html) => setForm((f) => ({ ...f, description: html }))} placeholder="VD: Mẫu áo sơ mi cổ Đức, tay dài, dùng cho học sinh nam khối THCS..." />
                            </div>
                            {showPreview && (
                                <div className="min-h-[120px] rounded-[8px] border border-violet-200 bg-violet-50 px-5 py-4 shadow-soft-sm">
                                    {form.description ? <div className="prose-editor-content text-[15px] leading-relaxed text-gray-700" dangerouslySetInnerHTML={{ __html: form.description }} /> : <p className="text-[15px] italic font-normal text-gray-400">Chưa có nội dung mô tả.</p>}
                                </div>
                            )}
                            <div className={`mt-1 text-right text-xs font-semibold ${isDescOver ? "text-red-500" : descLength > 400 ? "text-[#F59E0B]" : "text-gray-400"}`}>{descLength}/500</div>
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
                    </section>
                </form>

                <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-[#FFFDF9] px-6 py-5 sm:flex-row sm:justify-end">
                    <button type="button" onClick={onClose} className="rounded-[8px] border border-gray-200 bg-white px-5 py-3 text-[15px] font-extrabold text-gray-900 shadow-soft-sm transition-all hover:scale-[0.99]">Huỷ</button>
                    <button onClick={handleSubmit} disabled={isLoading || !form.outfitName.trim() || isNameOver || isDescOver} className="flex items-center justify-center gap-2 rounded-[8px] bg-violet-500 px-5 py-3 text-[15px] font-extrabold text-white shadow-soft-sm transition-all hover:scale-[0.99] disabled:opacity-50">
                        {isLoading && <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M4 12a8 8 0 018-8" strokeLinecap="round" /></svg>}
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

function StatCard({
    label,
    value,
    tone,
}: {
    label: string;
    value: number;
    tone: "violet" | "blue" | "amber";
}) {
    const toneMap = {
        violet: "from-violet-50 to-white border-violet-200 text-violet-700",
        blue: "from-sky-50 to-white border-sky-200 text-sky-700",
        amber: "from-amber-50 to-white border-amber-200 text-amber-700",
    };

    return (
        <div className={`rounded-2xl border bg-gradient-to-br p-5 shadow-soft-md ${toneMap[tone]}`}>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] opacity-80">{label}</p>
            <p className="mt-3 text-3xl font-extrabold text-gray-900">{value}</p>
        </div>
    );
}

function UniformCard({ item, onEdit, onDelete, onHide, onUnhide }: {
    item: OutfitDto;
    onEdit: (item: OutfitDto) => void;
    onDelete: (item: OutfitDto) => void;
    onHide: (item: OutfitDto) => void;
    onUnhide: (item: OutfitDto) => void;
}) {
    return (
        <div className="overflow-hidden rounded-[26px] border border-gray-200 bg-white shadow-soft-md transition-all hover:-translate-y-1 hover:border-violet-300 hover:shadow-soft-lg">
            <div className="relative flex aspect-[4/3] w-full items-center justify-center border-b border-gray-200 bg-gray-100">
                {item.mainImageURL ? (
                    <img src={item.mainImageURL} alt={item.outfitName} className="h-full w-full object-cover" />
                ) : (
                    <Shirt className="h-14 w-14 text-gray-300" />
                )}
                <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/80 bg-white/90 px-3 py-1 text-[11px] font-black text-gray-700 shadow-soft-sm">
                        {item.categoryName || OUTFIT_TYPE_LABELS[item.outfitType] || "Khác"}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-[11px] font-black shadow-soft-sm ${item.isAvailable ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                        {item.isAvailable ? "Đang hiển thị" : "Tạm ẩn"}
                    </span>
                </div>
            </div>

            <div className="flex flex-col gap-4 p-5">
                <div>
                    <h3 className="text-lg font-extrabold leading-tight text-gray-900">{item.outfitName}</h3>
                    <p className="mt-2 line-clamp-3 text-sm font-medium leading-6 text-[#4c5769]">
                        {item.description ? stripHtml(item.description) : "Chưa có mô tả cho mẫu đồng phục này."}
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => onEdit(item)} className="flex items-center justify-center gap-1 rounded-[12px] border border-gray-200 bg-white px-3 py-2.5 text-[12px] font-bold text-gray-700 transition-all hover:border-violet-200 hover:text-violet-700">
                        <Pencil className="h-3.5 w-3.5" />
                        Sửa
                    </button>
                    {item.canDelete ? (
                        <button onClick={() => onDelete(item)} className="flex items-center justify-center gap-1 rounded-[12px] border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] font-bold text-red-600 transition-all hover:bg-red-100">
                            <Trash2 className="h-3.5 w-3.5" />
                            Xóa
                        </button>
                    ) : item.isAvailable ? (
                        <button onClick={() => onHide(item)} className="flex items-center justify-center gap-1 rounded-[12px] border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] font-bold text-amber-700 transition-all hover:bg-amber-100">
                            <EyeOff className="h-3.5 w-3.5" />
                            Ẩn
                        </button>
                    ) : (
                        <button onClick={() => onUnhide(item)} className="flex items-center justify-center gap-1 rounded-[12px] border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[12px] font-bold text-emerald-700 transition-all hover:bg-emerald-100">
                            <Eye className="h-3.5 w-3.5" />
                            Hiện
                        </button>
                    )}
                    <div className="flex items-center justify-center rounded-[12px] border border-gray-200 bg-gray-50 px-3 py-2.5 text-[12px] font-bold text-gray-500">
                        Design only
                    </div>
                </div>
            </div>
        </div>
    );
}

function UploadPlaceholderCard({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex min-h-[340px] flex-col items-center justify-center rounded-[26px] border-2 border-dashed border-violet-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#faf5ff_100%)] p-6 text-center transition-all duration-200 hover:-translate-y-1 hover:border-violet-400 hover:bg-violet-50"
        >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-violet-200 bg-white text-violet-600 shadow-soft-sm">
                <Plus className="h-8 w-8" />
            </div>
            <p className="text-base font-extrabold text-gray-900">Thêm thiết kế mới</p>
        </button>
    );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
    return (
        <div className="rounded-[26px] border border-gray-200 bg-white p-12 text-center shadow-soft-md">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-violet-200 bg-violet-50 text-violet-600 shadow-soft-sm">
                <Box className="h-8 w-8" />
            </div>
            <h2 className="mt-5 text-xl font-extrabold text-gray-900">Chưa có thiết kế đồng phục nào</h2>
            <button onClick={onCreate} className="nb-btn nb-btn-purple mt-5 text-sm">
                Tạo mẫu đầu tiên
            </button>
        </div>
    );
}

function SearchEmptyState({
    search,
    onClear,
}: {
    search: string;
    onClear: () => void;
}) {
    return (
        <div className="rounded-[26px] border border-gray-200 bg-white p-12 text-center shadow-soft-md min-h-[340px] flex flex-col items-center justify-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-violet-200 bg-violet-50 text-violet-600 shadow-soft-sm">
                <Search className="h-8 w-8" />
            </div>
            <h2 className="mt-5 text-xl font-extrabold text-gray-900">Không tìm thấy mẫu phù hợp</h2>
            <button onClick={onClear} className="nb-btn nb-btn-outline mt-5 text-sm">
                Xóa tìm kiếm
            </button>
        </div>
    );
}

function LoadingState() {
    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
                <div key={item} className="h-[340px] rounded-[26px] border border-gray-200 bg-white shadow-soft-md">
                    <div className="h-[180px] animate-pulse rounded-t-[26px] bg-violet-50" />
                    <div className="space-y-3 p-5">
                        <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
                        <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
                    </div>
                </div>
            ))}
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

const FILTER_TABS: { key: "all" | "available" | "unavailable"; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "available", label: "Đang hiển thị" },
    { key: "unavailable", label: "Tạm ẩn" },
];

export const UniformManagement = (): JSX.Element => {
    const navigate = useNavigate();
    const sidebarConfig = useSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [schoolName, setSchoolName] = useState("");
    const { showToast } = useToast();

    const [outfits, setOutfits] = useState<OutfitDto[]>([]);
    const [categories, setCategories] = useState<UniformCategoryDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState<"all" | "available" | "unavailable">("all");
    const [page, setPage] = useState(1);
    const pageSize = 12;

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

    const stats = useMemo(() => ({
        total: outfits.length,
        available: outfits.filter((item) => item.isAvailable).length,
        unavailable: outfits.filter((item) => !item.isAvailable).length,
    }), [outfits]);

    const totalPages = Math.ceil(filteredOutfits.length / pageSize);
    const paginatedOutfits = filteredOutfits.slice((page - 1) * pageSize, page * pageSize);
    const isSearchEmptyState = !loading && outfits.length > 0 && filteredOutfits.length === 0;

    const preserveResultsHeight = useCallback(() => {
        const currentHeight = resultsRegionRef.current?.offsetHeight;
        if (!currentHeight || currentHeight <= 0) return;
        setSearchEmptyMinHeight(currentHeight);
    }, []);

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
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem><BreadcrumbLink href="/school/dashboard" className="text-base font-semibold text-[#4c5769]">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                                <BreadcrumbSeparator>/</BreadcrumbSeparator>
                                <BreadcrumbItem><BreadcrumbPage className="text-base font-bold text-gray-900">Quản lý đồng phục</BreadcrumbPage></BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </TopNavBar>

                    <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        <section className="rounded-[28px] border border-violet-200 bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.18),_transparent_38%),linear-gradient(135deg,_#ffffff_10%,_#f8f5ff_55%,_#eef7ff_100%)] p-5 shadow-soft-lg lg:p-6">
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                                <div className="max-w-3xl">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-violet-700">
                                        <Shirt className="h-4 w-4" />
                                        Thiết kế đồng phục
                                    </div>
                                    <h1 className="mt-3 text-[26px] font-extrabold leading-tight text-gray-900 lg:text-[34px]">
                                        Quản lý thiết kế mẫu đồng phục
                                    </h1>
                                </div>
                                <button onClick={openCreate} className="nb-btn nb-btn-purple text-sm whitespace-nowrap">
                                    Thêm thiết kế mới
                                </button>
                            </div>

                            <div className="mt-5 grid gap-3 md:grid-cols-3">
                                <StatCard label="Tổng mẫu" value={stats.total} tone="violet" />
                                <StatCard label="Đang hiển thị" value={stats.available} tone="blue" />
                                <StatCard label="Tạm ẩn" value={stats.unavailable} tone="amber" />
                            </div>
                        </section>

                        <section className="sticky top-0 z-20 -mx-1 rounded-[24px] bg-white/80 px-1 pb-2 pt-1 backdrop-blur-sm">
                            <div className="nb-card-static space-y-4 p-4">
                            <div className="flex items-center gap-2 nb-input py-2.5">
                                <Search className="h-5 w-5 flex-shrink-0 text-[#97A3B6]" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => {
                                        preserveResultsHeight();
                                        setSearch(e.target.value);
                                        setPage(1);
                                    }}
                                    placeholder="Tìm theo tên mẫu hoặc mô tả..."
                                    className="flex-1 bg-transparent text-sm font-medium text-[#1a1a2e] outline-none placeholder:text-[#97A3B6]"
                                />
                            </div>

                            <div className="nb-tabs w-fit">
                                {FILTER_TABS.map((tab) => {
                                    const isActive = activeTab === tab.key;
                                    const count = tab.key === "all" ? outfits.length : tab.key === "available" ? stats.available : stats.unavailable;

                                    return (
                                        <button
                                            key={tab.key}
                                            onClick={() => {
                                                preserveResultsHeight();
                                                setActiveTab(tab.key);
                                                setPage(1);
                                            }}
                                            className={`nb-tab ${isActive ? "nb-tab-active" : ""}`}
                                        >
                                            {tab.label}
                                            <span className={`ml-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-bold ${isActive ? "bg-white/20 text-white" : "bg-[#E5E7EB] text-gray-600"}`}>
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            </div>
                        </section>

                        <div
                            ref={resultsRegionRef}
                            style={isSearchEmptyState && searchEmptyMinHeight ? { minHeight: `${searchEmptyMinHeight}px` } : undefined}
                        >
                            {loading ? (
                                <LoadingState />
                            ) : filteredOutfits.length > 0 ? (
                                <>
                                    <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                                        {paginatedOutfits.map((item) => (
                                            <UniformCard
                                                key={item.outfitId}
                                                item={item}
                                                onEdit={openEdit}
                                                onDelete={setDeletingOutfit}
                                                onHide={setHidingOutfit}
                                                onUnhide={setUnhidingOutfit}
                                            />
                                        ))}
                                        <UploadPlaceholderCard onClick={openCreate} />
                                    </section>
                                    <Pagination page={page} totalPages={totalPages} setPage={setPage} />
                                </>
                            ) : outfits.length > 0 ? (
                                <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                                    <SearchEmptyState
                                        search={search.trim()}
                                        onClear={() => {
                                            setSearch("");
                                            setSearchEmptyMinHeight(null);
                                        }}
                                    />
                                    <UploadPlaceholderCard onClick={openCreate} />
                                </section>
                            ) : (
                                <EmptyState onCreate={openCreate} />
                            )}
                        </div>
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
