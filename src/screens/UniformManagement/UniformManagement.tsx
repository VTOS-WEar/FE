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
    uploadOutfitImage,
    type OutfitDto,
    type CreateOutfitRequest,
} from "../../lib/api/schools";
import VariantManager from "./VariantManager";



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
    price: string;
    outfitType: number;
    mainImageURL: string;
};

const EMPTY_FORM: OutfitFormData = {
    outfitName: "",
    description: "",
    price: "",
    outfitType: 1,
    mainImageURL: "",
};

/* ────────────────────────────────────────────────────────────────────── */
/* Create / Edit Outfit Modal                                             */
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
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isEditing = !!editingOutfit;

    useEffect(() => {
        if (isOpen) {
            if (editingOutfit) {
                setForm({
                    outfitName: editingOutfit.outfitName,
                    description: editingOutfit.description || "",
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.outfitName.trim()) return;
        onSave(
            {
                outfitName: form.outfitName.trim(),
                description: form.description.trim() || null,
                price: parseFloat(form.price) || 0,
                outfitType: form.outfitType,
                mainImageURL: form.mainImageURL.trim() || null,
                isCustomizable: false,
            },
            imageFile,
        );
    };

    const inputClass = "nb-input py-2.5 text-sm";
    const labelClass = "font-bold text-[#1a1a2e] text-sm mb-1.5 block";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white rounded-md w-full max-w-[560px] mx-4 max-h-[90vh] overflow-y-auto border-2 border-[#1A1A2E] shadow-[4px_4px_0_#1A1A2E]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b-2 border-[#E5E7EB]">
                    <h2 className="font-extrabold text-[#1a1a2e] text-xl">
                        {isEditing ? "✏️ Chỉnh sửa đồng phục" : "➕ Thêm đồng phục mới"}
                    </h2>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-[#1A1A2E] hover:bg-[#F3F4F6] font-bold">✕</button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    {/* Image Upload */}
                    <div>
                        <label className={labelClass}>Hình ảnh đồng phục</label>
                        <div
                            className={`relative border-2 border-dashed rounded-[10px] transition-colors cursor-pointer ${
                                imagePreview ? "border-[#6938EF] bg-[#F5F3FF]" : "border-[#cbcad7] bg-[#f8f9fb] hover:border-[#6938EF] hover:bg-[#F5F3FF]"
                            }`}
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
                                <div className="relative p-3">
                                    <img src={imagePreview} alt="Preview" className="w-full h-48 object-contain rounded-lg" />
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); setForm((f) => ({ ...f, mainImageURL: "" })); }}
                                        className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-white/90 hover:bg-red-50 text-[#97A3B6] hover:text-red-500 shadow transition-colors"
                                    >
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8">
                                    <svg className="w-10 h-10 text-[#97A3B6] mb-2" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                                    </svg>
                                    <p className="font-semibold text-[#4C5769] text-sm">
                                        Kéo thả hoặc nhấn để chọn ảnh
                                    </p>
                                    <p className="font-medium text-[#97A3B6] text-xs mt-1">
                                        JPEG, PNG, WebP • Tối đa 5MB
                                    </p>
                                </div>
                            )}
                        </div>
                        {uploadError && (
                            <p className="font-medium text-red-500 text-xs mt-1.5">{uploadError}</p>
                        )}
                    </div>

                    {/* Name */}
                    <div>
                        <label className={labelClass}>Tên đồng phục <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={form.outfitName}
                            onChange={(e) => setForm((f) => ({ ...f, outfitName: e.target.value }))}
                            placeholder="VD: Áo sơ mi Nam"
                            className={inputClass}
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className={labelClass}>Mô tả</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                            placeholder="VD: Vải cotton thoáng mát, form dáng chuẩn"
                            rows={3}
                            className={inputClass + " resize-none"}
                        />
                    </div>

                    {/* Price + Type */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Giá (VND) <span className="text-red-500">*</span></label>
                            <input
                                type="number"
                                value={form.price}
                                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                                placeholder="VD: 250000"
                                className={inputClass}
                                min="0"
                                step="1000"
                                required
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Loại</label>
                            <select
                                value={form.outfitType}
                                onChange={(e) => setForm((f) => ({ ...f, outfitType: parseInt(e.target.value) }))}
                                className={inputClass}
                            >
                                {OUTFIT_TYPE_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-3 border-t-2 border-[#E5E7EB]">
                        <button type="button" onClick={onClose} className="nb-btn-outline px-5 py-2.5 text-sm">Hủy</button>
                        <button type="submit" disabled={isLoading || !form.outfitName.trim()} className="nb-btn nb-btn-purple px-5 py-2.5 text-sm disabled:opacity-50">
                            {isLoading && <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M4 12a8 8 0 018-8" strokeLinecap="round" /></svg>}
                            {isEditing ? "Lưu thay đổi" : "Tạo đồng phục"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Delete Confirm Dialog                                                  */
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
            <div className="relative bg-white rounded-md w-full max-w-[420px] mx-4 border-2 border-[#1A1A2E] shadow-[4px_4px_0_#1A1A2E]">
                <div className="px-6 py-6 text-center">
                    <div className="w-14 h-14 rounded-full bg-[#FEE2E2] flex items-center justify-center mx-auto mb-4 border-2 border-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E]">
                        <svg className="w-7 h-7 text-[#EF4444]" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></svg>
                    </div>
                    <h3 className="font-extrabold text-[#1a1a2e] text-lg mb-2">Xóa đồng phục?</h3>
                    <p className="font-medium text-[#4c5769] text-sm mb-6">Bạn có chắc muốn xóa <strong>"{outfitName}"</strong>? Hành động này không thể hoàn tác.</p>
                    <div className="flex justify-center gap-3">
                        <button onClick={onClose} className="nb-btn-outline px-5 py-2.5 text-sm">Hủy</button>
                        <button onClick={onConfirm} disabled={isLoading} className="nb-btn nb-btn-red px-5 py-2.5 text-sm disabled:opacity-50">
                            {isLoading && <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M4 12a8 8 0 018-8" strokeLinecap="round" /></svg>}
                            Xóa
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
function UniformCard({ item, onEdit, onDelete, onManageVariants }: { item: OutfitDto; onEdit: (item: OutfitDto) => void; onDelete: (item: OutfitDto) => void; onManageVariants: (item: OutfitDto) => void }) {
    const formattedPrice = new Intl.NumberFormat("vi-VN").format(item.price) + "đ";

    return (
        <div className="nb-card overflow-hidden group">
            <div className="w-full aspect-[4/3] bg-[#F3F4F6] border-b-2 border-[#1A1A2E] flex items-center justify-center relative">
                {item.mainImageURL ? (
                    <img src={item.mainImageURL} alt={item.outfitName} className="w-full h-full object-cover" />
                ) : (
                    <svg className="w-16 h-16 text-[#9CA3AF]" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16V7.99C21 6.89 20.1 6 19 6H5C3.9 6 3 6.89 3 7.99V16C3 17.1 3.9 18 5 18H19C20.1 18 21 17.1 21 16ZM12 14L17 10H7L12 14Z" /></svg>
                )}
                <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => onEdit(item)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border-2 border-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E] hover:bg-[#F5F3FF] text-[#6938EF] transition-all" title="Sửa">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>
                    </button>
                    <button onClick={() => onDelete(item)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border-2 border-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E] hover:bg-[#FEE2E2] text-[#EF4444] transition-all" title="Xóa">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></svg>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex flex-col bg-white">
                <div className="px-4 pt-3 pb-2">
                    <h3 className="font-bold text-[#1A1A2E] text-base leading-tight">{item.outfitName}</h3>
                    <p className="font-medium text-[#4C5769] text-sm mt-0.5 line-clamp-1">{item.description || "Không có mô tả"}</p>
                </div>
                <div className="mx-4 border-t-2 border-[#E5E7EB]" />
                <div className="px-4 py-3 flex items-center justify-between">
                    <span className="nb-badge text-[#4C5769] bg-[#F3F4F6]">{OUTFIT_TYPE_LABELS[item.outfitType] || "Khác"}</span>
                    <span className="font-extrabold text-[#6938EF] text-sm">{formattedPrice}</span>
                </div>
                <div className="px-4 pb-3">
                    <button onClick={() => onManageVariants(item)} className="w-full nb-btn-outline text-xs py-2 text-[#6938EF] border-[#DDD6FE] bg-[#F5F3FF] hover:bg-[#EDE9FE]">
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
        <div onClick={onClick} className="flex flex-col items-center justify-center rounded-md border-2 border-dashed border-[#1A1A2E] bg-[#FAFBFC] hover:border-[#6938EF] hover:bg-[#F5F3FF] cursor-pointer transition-all duration-200 min-h-[320px] group hover:shadow-[4px_4px_0_#6938EF]">
            <div className="w-14 h-14 rounded-full border-2 border-dashed border-[#1A1A2E] group-hover:border-[#6938EF] flex items-center justify-center mb-3 transition-colors">
                <svg className="w-8 h-8 text-[#9CA3AF] group-hover:text-[#6938EF] transition-colors" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
            </div>
            <p className="font-bold text-[#4C5769] group-hover:text-[#6938EF] text-sm transition-colors">Tải lên mẫu thiết kế mới</p>
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
                                <h1 className="font-extrabold text-[#1A1A2E] text-[28px] lg:text-[32px] leading-tight">👕 Danh mục đồng phục</h1>
                                <p className="mt-1 font-medium text-[#4c5769] text-sm lg:text-base">Xem và quản lý các mẫu thiết kế từ nhà cung cấp.</p>
                            </div>
                            <button onClick={openCreate} className="nb-btn nb-btn-purple text-sm whitespace-nowrap">
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
                                Thêm mẫu mới
                            </button>
                        </div>

                        {/* Search + Filters */}
                        <div className="nb-card-static p-4 space-y-4">
                            <div className="flex items-center gap-2 bg-[#F8F9FB] border border-[#cbcad7] rounded-[10px] px-4 py-2.5">
                                <svg className="w-5 h-5 text-[#97A3B6] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
                                <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm kiếm..." className="flex-1 bg-transparent outline-none font-medium text-sm text-[#1a1a2e] placeholder:text-[#97A3B6]" />
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-1.5 px-3 py-2 nb-card-static">
                                    <svg className="w-4 h-4 text-[#4C5769]" viewBox="0 0 24 24" fill="currentColor"><path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" /></svg>
                                    <span className="font-semibold text-[#4C5769] text-sm">Bộ lọc</span>
                                </div>
                                {FILTER_TABS.map((tab) => {
                                    const isActive = activeTab === tab.key;
                                    const badge = tab.key === "available" ? availableCount : tab.key === "unavailable" ? unavailableCount : 0;
                                    return (
                                        <button key={tab.key} onClick={() => { setActiveTab(tab.key); setPage(1); }} className={`nb-tab ${isActive ? "nb-tab-active" : ""}`}>
                                            {tab.label}
                                            {badge > 0 && <span className={`ml-1.5 min-w-[20px] h-5 flex items-center justify-center rounded-full text-xs font-bold px-1.5 ${isActive ? "bg-white/20 text-white" : "bg-[#E5E7EB] text-[#4C5769]"}`}>{badge}</span>}
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
                                        <UniformCard key={item.outfitId} item={item} onEdit={openEdit} onDelete={setDeletingOutfit} onManageVariants={setVariantOutfit} />
                                    ))}
                                    <UploadPlaceholderCard onClick={openCreate} />
                                </div>
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-3 mt-4">
                                        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="nb-btn nb-btn-outline nb-btn-sm text-sm">← Trước</button>
                                        <span className="text-sm font-bold text-[#6B7280]">{page}/{totalPages} ({filteredOutfits.length} mẫu)</span>
                                        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="nb-btn nb-btn-outline nb-btn-sm text-sm">Sau →</button>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Empty state */}
                        {!loading && filteredOutfits.length === 0 && (
                            <div className="nb-card-static p-12 text-center">
                                <svg className="w-16 h-16 text-[#CBCAD7] mx-auto mb-4" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16V7.99C21 6.89 20.1 6 19 6H5C3.9 6 3 6.89 3 7.99V16C3 17.1 3.9 18 5 18H19C20.1 18 21 17.1 21 16ZM12 14L17 10H7L12 14Z" /></svg>
                                <p className="font-semibold text-[#4C5769] text-base">Chưa có mẫu đồng phục nào</p>
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

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-md border-2 border-[#1A1A2E] shadow-[4px_4px_0_#1A1A2E] animate-in slide-in-from-bottom-4 duration-300 font-bold text-sm ${toast.type === "success" ? "bg-[#10b981] text-white" : "bg-[#ef4444] text-white"}`}>
                    {toast.type === "success" ? "✅" : "❌"}
                    <span>{toast.message}</span>
                </div>
            )}

            {/* Variant Manager Modal */}
            <VariantManager
                outfitId={variantOutfit?.outfitId || ""}
                outfitName={variantOutfit?.outfitName || ""}
                
                isOpen={!!variantOutfit}
                onClose={() => setVariantOutfit(null)}
            />
        </div>
    );
};

export default UniformManagement;
