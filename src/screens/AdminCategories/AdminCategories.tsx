import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Edit3, Plus, RefreshCcw, Save, Search, Tags, Trash2, X } from "lucide-react";
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
import { useAdminSidebarConfig } from "../../hooks/useAdminSidebarConfig";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import {
    addCategory,
    deleteCategory,
    getCategories,
    updateCategory,
    type CategoryDto,
} from "../../lib/api/admin";
import {
    ADMIN_TONE,
    AdminBadge,
    AdminEmptyState,
    AdminHero,
    AdminSummaryCard,
} from "../AdminShared/adminWorkspace";

type ToastState = { message: string; type: "success" | "error" };

const MIN_REFRESH_ANIMATION_MS = 650;

function getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error && error.message ? error.message : fallback;
}

function formatDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("vi-VN");
}

export function AdminCategories(): JSX.Element {
    const navigate = useNavigate();
    const sidebarConfig = useAdminSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [categories, setCategories] = useState<CategoryDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState(false);
    const [search, setSearch] = useState("");
    const [newName, setNewName] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");
    const [toast, setToast] = useState<ToastState | null>(null);
    const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = useCallback((message: string, type: ToastState["type"]) => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setToast({ message, type });
        toastTimerRef.current = setTimeout(() => setToast(null), 3000);
    }, []);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            setCategories(await getCategories());
        } catch {
            setCategories([]);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const refreshCategories = useCallback(async () => {
        if (loading || refreshing) return;

        setRefreshing(true);
        setError(false);
        try {
            const [nextCategories] = await Promise.all([
                getCategories(),
                new Promise((resolve) => setTimeout(resolve, MIN_REFRESH_ANIMATION_MS)),
            ]);
            setCategories(nextCategories);
        } catch {
            showToast("Không thể tải lại danh mục.", "error");
        } finally {
            setRefreshing(false);
        }
    }, [loading, refreshing, showToast]);

    useEffect(() => {
        return () => {
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        };
    }, []);

    const filteredCategories = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return categories;
        return categories.filter((category) => category.categoryName.toLowerCase().includes(keyword));
    }, [categories, search]);

    const recentlyAddedCount = useMemo(() => {
        const now = Date.now();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        return categories.filter((category) => {
            const createdAt = new Date(category.createdAt).getTime();
            return !Number.isNaN(createdAt) && now - createdAt <= sevenDays;
        }).length;
    }, [categories]);

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    const handleCreate = async (event: FormEvent) => {
        event.preventDefault();
        const categoryName = newName.trim();
        if (!categoryName) {
            showToast("Nhập tên danh mục trước khi tạo.", "error");
            return;
        }

        setSaving(true);
        try {
            await addCategory(categoryName);
            setNewName("");
            await fetchCategories();
            showToast("Đã tạo danh mục đồng phục.", "success");
        } catch (err) {
            showToast(getErrorMessage(err, "Không thể tạo danh mục."), "error");
        } finally {
            setSaving(false);
        }
    };

    const startEdit = (category: CategoryDto) => {
        setEditingId(category.id);
        setEditingName(category.categoryName);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditingName("");
    };

    const handleUpdate = async (category: CategoryDto) => {
        const categoryName = editingName.trim();
        if (!categoryName) {
            showToast("Nhập tên danh mục trước khi lưu.", "error");
            return;
        }
        if (categoryName === category.categoryName) {
            cancelEdit();
            return;
        }

        setSaving(true);
        try {
            await updateCategory(category.id, categoryName);
            cancelEdit();
            await fetchCategories();
            showToast("Đã cập nhật danh mục.", "success");
        } catch (err) {
            showToast(getErrorMessage(err, "Không thể cập nhật danh mục."), "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (category: CategoryDto) => {
        const confirmed = window.confirm(`Xóa danh mục "${category.categoryName}"?`);
        if (!confirmed) return;

        setDeletingId(category.id);
        try {
            await deleteCategory(category.id);
            if (editingId === category.id) cancelEdit();
            await fetchCategories();
            showToast("Đã xóa danh mục.", "success");
        } catch (err) {
            showToast(getErrorMessage(err, "Không thể xóa danh mục."), "error");
        } finally {
            setDeletingId(null);
        }
    };

    const gridCols = "minmax(220px, 1.7fr) minmax(120px, 0.7fr) minmax(120px, 0.7fr) minmax(180px, 1fr)";
    const refreshAnimating = loading || refreshing;

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                    <TopNavBar>
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/admin/dashboard" className="text-base font-semibold text-[#4c5769]">
                                        Trang chủ
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="text-base font-bold text-gray-900">Danh mục đồng phục</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </TopNavBar>

                    <main className="nb-fade-in flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        <AdminHero
                            eyebrow="Vận hành danh mục"
                            title="Quản lý danh mục đồng phục cho toàn hệ thống."
                            description="Admin có thể tạo, chỉnh sửa và xóa các nhóm danh mục dùng khi trường lập sản phẩm đồng phục."
                            stats={[
                                { label: "Tổng danh mục", value: loading ? "..." : String(categories.length) },
                                { label: "Mới 7 ngày", value: loading ? "..." : String(recentlyAddedCount) },
                            ]}
                        />

                        <section className="grid gap-4 md:grid-cols-3">
                            <AdminSummaryCard
                                label="Tổng danh mục"
                                value={loading ? "..." : categories.length.toLocaleString("vi-VN")}
                                detail="Số nhóm đang có trong bảng Category của hệ thống."
                                accent={ADMIN_TONE.violet}
                            />
                            <AdminSummaryCard
                                label="Kết quả hiển thị"
                                value={loading ? "..." : filteredCategories.length.toLocaleString("vi-VN")}
                                detail="Thay đổi theo từ khóa tìm kiếm của Admin."
                                accent={ADMIN_TONE.sky}
                            />
                            <AdminSummaryCard
                                label="Mới gần đây"
                                value={loading ? "..." : recentlyAddedCount.toLocaleString("vi-VN")}
                                detail="Danh mục được tạo trong 7 ngày gần nhất."
                                accent={ADMIN_TONE.emerald}
                            />
                        </section>

                        <section className="rounded-[24px] border p-4 shadow-soft-lg" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}>
                            <form onSubmit={handleCreate} className="flex flex-col gap-3 lg:flex-row lg:items-center">
                                <div className="relative flex-1">
                                    <Tags className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                    <input
                                        value={newName}
                                        onChange={(event) => setNewName(event.target.value)}
                                        maxLength={255}
                                        placeholder="Tên danh mục mới"
                                        className="h-12 w-full rounded-xl border bg-white pl-12 pr-4 text-[15px] font-semibold outline-none transition-all focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                                        style={{ borderColor: ADMIN_TONE.line, color: ADMIN_TONE.pageInk }}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-[14px] font-black text-white shadow-soft-md transition-all hover:scale-[0.99] disabled:opacity-50"
                                    style={{ background: ADMIN_TONE.violet }}
                                >
                                    <Plus className="h-5 w-5" />
                                    Tạo danh mục
                                </button>
                            </form>
                        </section>

                        <section className="rounded-[24px] border p-4 shadow-soft-lg" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}>
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                                <div className="relative flex-1">
                                    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                    <input
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Tìm theo tên danh mục"
                                        className="h-12 w-full rounded-xl border pl-12 pr-4 text-[15px] font-semibold outline-none transition-all focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                                        style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.soft, color: ADMIN_TONE.pageInk }}
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={() => void refreshCategories()}
                                    disabled={refreshAnimating}
                                    aria-busy={refreshAnimating}
                                    className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl border px-5 text-[14px] font-black shadow-soft-sm transition-all duration-200 hover:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 ${
                                        refreshAnimating ? "shadow-violet-100" : ""
                                    }`}
                                    style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell, color: ADMIN_TONE.pageInk }}
                                >
                                    <RefreshCcw className={`h-5 w-5 transition-transform duration-300 ${refreshAnimating ? "animate-spin text-violet-600" : ""}`} />
                                    Làm mới
                                </button>

                                <AdminBadge bg={ADMIN_TONE.soft} text={ADMIN_TONE.pageInk}>
                                    {filteredCategories.length} mục
                                </AdminBadge>
                            </div>
                        </section>

                        <section className="overflow-hidden rounded-[24px] border shadow-soft-lg" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}>
                            <div
                                className="hidden items-center border-b px-5 py-4 lg:grid"
                                style={{ gridTemplateColumns: gridCols, borderColor: ADMIN_TONE.line, background: ADMIN_TONE.violetSoft }}
                            >
                                {["Danh mục", "Số mẫu", "Ngày tạo", "Thao tác"].map((header) => (
                                    <div key={header} className="text-[12px] font-black uppercase tracking-[0.08em]" style={{ color: ADMIN_TONE.muted }}>
                                        {header}
                                    </div>
                                ))}
                            </div>

                            {loading && (
                                <div className="space-y-3 px-5 py-5">
                                    {Array.from({ length: 5 }).map((_, index) => (
                                        <div
                                            key={index}
                                            className="hidden items-center gap-4 rounded-[14px] border px-4 py-4 lg:grid"
                                            style={{ gridTemplateColumns: gridCols, borderColor: ADMIN_TONE.line, background: ADMIN_TONE.soft }}
                                        >
                                            {Array.from({ length: 3 }).map((__, cellIndex) => (
                                                <div key={cellIndex} className="h-5 animate-pulse rounded" style={{ background: ADMIN_TONE.violetSoft }} />
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!loading && (error || filteredCategories.length === 0) && (
                                <AdminEmptyState
                                    title={error ? "Không tải được danh mục" : "Chưa có danh mục phù hợp"}
                                    detail={error ? "Kiểm tra phiên đăng nhập hoặc thử tải lại dữ liệu." : "Tạo danh mục mới hoặc thay đổi từ khóa tìm kiếm hiện tại."}
                                    icon={<Tags className="h-8 w-8" />}
                                    bg={error ? ADMIN_TONE.roseSoft : ADMIN_TONE.skySoft}
                                />
                            )}

                            {!loading && !error && filteredCategories.length > 0 && (
                                <div>
                                    {filteredCategories.map((category, index) => {
                                        const isEditing = editingId === category.id;
                                        return (
                                            <div
                                                key={category.id}
                                                className="hidden items-center gap-4 border-b px-5 py-4 transition-colors hover:bg-[#F7F2FF] lg:grid"
                                                style={{ gridTemplateColumns: gridCols, borderColor: ADMIN_TONE.line, animationDelay: `${index * 35}ms` }}
                                            >
                                                <div>
                                                    {isEditing ? (
                                                        <input
                                                            value={editingName}
                                                            onChange={(event) => setEditingName(event.target.value)}
                                                            maxLength={255}
                                                            className="h-11 w-full rounded-xl border px-4 text-[15px] font-bold outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                                                            style={{ borderColor: ADMIN_TONE.line, color: ADMIN_TONE.pageInk }}
                                                        />
                                                    ) : (
                                                        <div>
                                                            <div className="text-[16px] font-black text-gray-950">{category.categoryName}</div>
                                                            <div className="mt-1 font-mono text-[12px] font-bold" style={{ color: ADMIN_TONE.muted }}>
                                                                {category.id.substring(0, 8).toUpperCase()}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div>
                                                    <AdminBadge bg={ADMIN_TONE.skySoft} text={ADMIN_TONE.sky}>
                                                        {category.outfitCount ?? 0} mẫu
                                                    </AdminBadge>
                                                </div>

                                                <div className="text-[14px] font-semibold" style={{ color: ADMIN_TONE.muted }}>
                                                    {formatDate(category.createdAt)}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {isEditing ? (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUpdate(category)}
                                                                disabled={saving}
                                                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white transition-all hover:scale-[0.98] disabled:opacity-50"
                                                                style={{ background: ADMIN_TONE.emerald }}
                                                                title="Lưu"
                                                            >
                                                                <Save className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={cancelEdit}
                                                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-all hover:scale-[0.98]"
                                                                style={{ borderColor: ADMIN_TONE.line, color: ADMIN_TONE.muted }}
                                                                title="Hủy"
                                                            >
                                                                <X className="h-5 w-5" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => startEdit(category)}
                                                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-all hover:scale-[0.98]"
                                                                style={{ borderColor: ADMIN_TONE.line, color: ADMIN_TONE.violet }}
                                                                title="Sửa"
                                                            >
                                                                <Edit3 className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDelete(category)}
                                                                disabled={deletingId === category.id}
                                                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-all hover:scale-[0.98] disabled:opacity-50"
                                                                style={{ borderColor: ADMIN_TONE.line, color: ADMIN_TONE.rose }}
                                                                title="Xóa"
                                                            >
                                                                <Trash2 className="h-5 w-5" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {filteredCategories.map((category, index) => {
                                        const isEditing = editingId === category.id;
                                        return (
                                            <div
                                                key={`mobile-${category.id}`}
                                                className="space-y-3 border-b p-4 lg:hidden"
                                                style={{ borderColor: ADMIN_TONE.line, animationDelay: `${index * 35}ms` }}
                                            >
                                                {isEditing ? (
                                                    <input
                                                        value={editingName}
                                                        onChange={(event) => setEditingName(event.target.value)}
                                                        maxLength={255}
                                                        className="h-11 w-full rounded-xl border px-4 text-[15px] font-bold outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                                                        style={{ borderColor: ADMIN_TONE.line, color: ADMIN_TONE.pageInk }}
                                                    />
                                                ) : (
                                                    <div>
                                                        <div className="text-[17px] font-black text-gray-950">{category.categoryName}</div>
                                                        <div className="mt-1 text-[13px] font-semibold" style={{ color: ADMIN_TONE.muted }}>
                                                            {formatDate(category.createdAt)} - {(category.outfitCount ?? 0).toLocaleString("vi-VN")} mẫu - {category.id.substring(0, 8).toUpperCase()}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-2">
                                                    {isEditing ? (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUpdate(category)}
                                                                disabled={saving}
                                                                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-[13px] font-black text-white disabled:opacity-50"
                                                                style={{ background: ADMIN_TONE.emerald }}
                                                            >
                                                                <Save className="h-4 w-4" />
                                                                Lưu
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={cancelEdit}
                                                                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border text-[13px] font-black"
                                                                style={{ borderColor: ADMIN_TONE.line, color: ADMIN_TONE.muted }}
                                                            >
                                                                <X className="h-4 w-4" />
                                                                Hủy
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => startEdit(category)}
                                                                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border text-[13px] font-black"
                                                                style={{ borderColor: ADMIN_TONE.line, color: ADMIN_TONE.violet }}
                                                            >
                                                                <Edit3 className="h-4 w-4" />
                                                                Sửa
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDelete(category)}
                                                                disabled={deletingId === category.id}
                                                                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border text-[13px] font-black disabled:opacity-50"
                                                                style={{ borderColor: ADMIN_TONE.line, color: ADMIN_TONE.rose }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                                Xóa
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    </main>
                </div>
            </div>

            {toast && (
                <div
                    className="fixed bottom-6 right-6 z-[70] flex max-w-[min(420px,calc(100vw-48px))] items-center gap-3 rounded-xl border px-5 py-3.5 text-[14px] font-black shadow-soft-md"
                    style={{
                        background: toast.type === "success" ? ADMIN_TONE.emerald : ADMIN_TONE.rose,
                        borderColor: "rgba(255,255,255,0.35)",
                        color: "#FFFFFF",
                    }}
                >
                    {toast.message}
                </div>
            )}
        </div>
    );
}

export default AdminCategories;
