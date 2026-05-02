import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsUpDown, Edit3, Plus, RefreshCcw, Save, Search, Tags, Trash2, X } from "lucide-react";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useAdminSidebarConfig } from "../../hooks/useAdminSidebarConfig";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { addCategory, deleteCategory, getCategories, updateCategory, type CategoryDto } from "../../lib/api/admin";
import { ADMIN_TONE, AdminEmptyState, AdminSummaryCard, AdminTopNavTitle } from "../AdminShared/adminWorkspace";

type ToastState = { message: string; type: "success" | "error" };
type UsageFilter = "all" | "used" | "empty";
type SortKey = "categoryName" | "outfitCount" | "createdAt";

const MIN_REFRESH_ANIMATION_MS = 650;
const PAGE_SIZE = 10;

function getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error && error.message ? error.message : fallback;
}

function formatDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("vi-VN");
}

function CompactBadge({
    children,
    bg = "#FFFFFF",
    text = "#374151",
}: {
    children: ReactNode;
    bg?: string;
    text?: string;
}) {
    return (
        <span
            className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-[13px] font-medium leading-none shadow-soft-xs"
            style={{ background: bg, color: text }}
        >
            {children}
        </span>
    );
}

function SortButton({
    children,
    active,
    direction,
    onClick,
}: {
    children: ReactNode;
    active: boolean;
    direction: "asc" | "desc";
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center gap-1 text-left text-[12px] font-semibold uppercase tracking-[0.08em] transition-colors hover:text-rose-700 ${
                active ? "text-gray-900" : "text-[#4E4A5B]"
            }`}
        >
            <span>{children}</span>
            {active ? (
                direction === "asc" ? (
                    <ChevronUp className="h-3 w-3 text-rose-700" strokeWidth={2} />
                ) : (
                    <ChevronDown className="h-3 w-3 text-rose-700" strokeWidth={2} />
                )
            ) : (
                <ChevronsUpDown className="h-3 w-3 text-slate-400" strokeWidth={1.8} />
            )}
        </button>
    );
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
    const [usageFilter, setUsageFilter] = useState<UsageFilter>("all");
    const [page, setPage] = useState(1);
    const [sortKey, setSortKey] = useState<SortKey>("createdAt");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
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
            showToast("Đã tải lại danh mục.", "success");
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

    const recentlyAddedCount = useMemo(() => {
        const now = Date.now();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        return categories.filter((category) => {
            const createdAt = new Date(category.createdAt).getTime();
            return !Number.isNaN(createdAt) && now - createdAt <= sevenDays;
        }).length;
    }, [categories]);

    const usedCount = useMemo(() => categories.filter((category) => (category.outfitCount ?? 0) > 0).length, [categories]);

    const filteredCategories = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        return categories.filter((category) => {
            const outfitCount = category.outfitCount ?? 0;
            const matchesSearch = !keyword || category.categoryName.toLowerCase().includes(keyword);
            const matchesUsage =
                usageFilter === "all" ||
                (usageFilter === "used" && outfitCount > 0) ||
                (usageFilter === "empty" && outfitCount === 0);
            return matchesSearch && matchesUsage;
        });
    }, [categories, search, usageFilter]);

    const sortedCategories = useMemo(() => {
        const rows = [...filteredCategories];
        rows.sort((leftRow, rightRow) => {
            let compare = 0;
            if (sortKey === "outfitCount") {
                compare = (leftRow.outfitCount ?? 0) - (rightRow.outfitCount ?? 0);
            } else if (sortKey === "createdAt") {
                compare = new Date(leftRow.createdAt).getTime() - new Date(rightRow.createdAt).getTime();
            } else {
                compare = leftRow.categoryName.localeCompare(rightRow.categoryName, "vi");
            }
            return sortDir === "asc" ? compare : -compare;
        });
        return rows;
    }, [filteredCategories, sortDir, sortKey]);

    const totalPages = Math.max(1, Math.ceil(sortedCategories.length / PAGE_SIZE));
    const pagedCategories = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return sortedCategories.slice(start, start + PAGE_SIZE);
    }, [page, sortedCategories]);

    useEffect(() => {
        setPage((current) => Math.min(current, totalPages));
    }, [totalPages]);

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

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir((current) => (current === "asc" ? "desc" : "asc"));
            return;
        }
        setSortKey(key);
        setSortDir(key === "createdAt" ? "desc" : "asc");
    };

    const gridCols = "minmax(220px,1.7fr) minmax(120px,0.75fr) minmax(130px,0.85fr) minmax(140px,0.85fr) minmax(120px,0.65fr)";
    const refreshAnimating = loading || refreshing;

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                    <TopNavBar>
                        <AdminTopNavTitle title="Danh mục đồng phục" />
                    </TopNavBar>

                    <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-6 space-y-5 nb-fade-in">
                        <section className="grid gap-4 md:grid-cols-3">
                            <AdminSummaryCard
                                label="Tổng danh mục"
                                value={loading ? "..." : categories.length.toLocaleString("vi-VN")}
                                accent={ADMIN_TONE.sky}
                            />
                            <AdminSummaryCard
                                label="Đang dùng"
                                value={loading ? "..." : usedCount.toLocaleString("vi-VN")}
                                accent={ADMIN_TONE.emerald}
                            />
                            <AdminSummaryCard
                                label="Mới gần đây"
                                value={loading ? "..." : recentlyAddedCount.toLocaleString("vi-VN")}
                                accent={ADMIN_TONE.violet}
                            />
                        </section>

                        <section className="overflow-hidden rounded-[8px] border shadow-soft-sm" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}>
                            <div className="flex flex-col gap-3 border-b px-5 py-4 xl:flex-row xl:items-center xl:justify-between" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.soft }}>
                                <form onSubmit={handleCreate} className="flex w-full flex-col gap-3 sm:flex-row sm:items-center xl:max-w-[560px]">
                                    <label className="relative block flex-1">
                                        <Tags className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                        <input
                                            value={newName}
                                            onChange={(event) => setNewName(event.target.value)}
                                            maxLength={255}
                                            placeholder="Tên danh mục mới"
                                            className="h-10 w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-800 outline-none shadow-soft-xs transition-colors placeholder:text-slate-500 focus:border-rose-200 focus:ring-4 focus:ring-rose-50"
                                        />
                                    </label>

                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-[13px] font-semibold text-white shadow-soft-sm transition-all hover:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                                        style={{ background: ADMIN_TONE.rose }}
                                    >
                                        <Plus className="h-4 w-4" />
                                        Tạo danh mục
                                    </button>
                                </form>

                                <div className="flex flex-wrap items-center gap-3">
                                    {refreshing && (
                                        <div className="inline-flex h-9 items-center gap-2 rounded-full border border-rose-100 bg-white px-3 text-xs font-semibold text-rose-700 shadow-soft-sm">
                                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-rose-100 border-t-rose-700" />
                                            Đang tải
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => void refreshCategories()}
                                        disabled={refreshAnimating}
                                        aria-busy={refreshAnimating}
                                        className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 shadow-soft-xs transition-all hover:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <RefreshCcw className={`h-4 w-4 transition-transform duration-300 ${refreshAnimating ? "animate-spin text-rose-700" : ""}`} />
                                        Làm mới
                                    </button>
                                    <span className="inline-flex h-9 items-center rounded-full border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 shadow-soft-xs">
                                        Tổng: {filteredCategories.length.toLocaleString("vi-VN")}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 border-b px-5 py-4 lg:flex-row lg:items-center" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.soft }}>
                                <label className="relative block w-full lg:max-w-[320px]">
                                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                    <input
                                        value={search}
                                        onChange={(event) => {
                                            setSearch(event.target.value);
                                            setPage(1);
                                        }}
                                        placeholder="Tìm theo tên danh mục..."
                                        className="h-10 w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-800 outline-none shadow-soft-xs transition-colors placeholder:text-slate-500 focus:border-rose-200 focus:ring-4 focus:ring-rose-50"
                                    />
                                </label>

                                <label className="relative block">
                                    <select
                                        value={usageFilter}
                                        onChange={(event) => {
                                            setUsageFilter(event.target.value as UsageFilter);
                                            setPage(1);
                                        }}
                                        className="h-10 min-w-[160px] appearance-none rounded-full border border-slate-200 bg-white py-0 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none shadow-soft-xs transition-colors focus:border-rose-200 focus:ring-4 focus:ring-rose-50"
                                    >
                                        <option value="all">Tất cả trạng thái</option>
                                        <option value="used">Đang dùng</option>
                                        <option value="empty">Chưa dùng</option>
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-900" />
                                </label>
                            </div>

                            <div
                                className="sticky top-0 z-10 hidden items-center border-b px-5 py-3 lg:grid"
                                style={{ gridTemplateColumns: gridCols, borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}
                            >
                                <SortButton active={sortKey === "categoryName"} direction={sortDir} onClick={() => handleSort("categoryName")}>
                                    Danh mục
                                </SortButton>
                                <SortButton active={sortKey === "outfitCount"} direction={sortDir} onClick={() => handleSort("outfitCount")}>
                                    Số mẫu
                                </SortButton>
                                <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#4E4A5B]">Trạng thái</div>
                                <SortButton active={sortKey === "createdAt"} direction={sortDir} onClick={() => handleSort("createdAt")}>
                                    Ngày tạo
                                </SortButton>
                                <div className="text-right text-[12px] font-semibold uppercase tracking-[0.08em] text-[#4E4A5B]">Hành động</div>
                            </div>

                            {loading && (
                                <div className="space-y-3 px-5 py-5">
                                    {Array.from({ length: 5 }).map((_, index) => (
                                        <div
                                            key={index}
                                            className="hidden items-center gap-4 rounded-[8px] border px-4 py-3 lg:grid"
                                            style={{ gridTemplateColumns: gridCols, borderColor: ADMIN_TONE.line, background: ADMIN_TONE.soft }}
                                        >
                                            {Array.from({ length: 5 }).map((__, cellIndex) => (
                                                <div key={cellIndex} className="h-5 animate-pulse rounded bg-rose-50" />
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!loading && (error || sortedCategories.length === 0) && (
                                <AdminEmptyState
                                    title={error ? "Không tải được danh mục" : "Chưa có danh mục phù hợp"}
                                    detail={error ? "Kiểm tra phiên đăng nhập hoặc thử tải lại dữ liệu." : "Tạo danh mục mới hoặc thay đổi bộ lọc hiện tại."}
                                    icon={<Tags className="h-8 w-8" />}
                                    bg={error ? ADMIN_TONE.roseSoft : ADMIN_TONE.skySoft}
                                />
                            )}

                            {!loading && !error && sortedCategories.length > 0 && (
                                <div>
                                    {pagedCategories.map((category, index) => {
                                        const isEditing = editingId === category.id;
                                        const outfitCount = category.outfitCount ?? 0;
                                        return (
                                            <div
                                                key={category.id}
                                                className="hidden min-h-[58px] items-center gap-4 border-b px-5 py-3 transition-colors hover:bg-rose-50 lg:grid nb-fade-in"
                                                style={{ gridTemplateColumns: gridCols, borderColor: ADMIN_TONE.line, animationDelay: `${index * 30}ms` }}
                                            >
                                                <div className="min-w-0">
                                                    {isEditing ? (
                                                        <input
                                                            value={editingName}
                                                            onChange={(event) => setEditingName(event.target.value)}
                                                            maxLength={255}
                                                            className="h-10 w-full rounded-[8px] border px-3 text-[14px] font-medium text-slate-900 outline-none focus:border-rose-200 focus:ring-4 focus:ring-rose-50"
                                                            style={{ borderColor: ADMIN_TONE.line }}
                                                        />
                                                    ) : (
                                                        <>
                                                            <div className="truncate text-[14px] font-medium text-gray-900">{category.categoryName}</div>
                                                            <div className="mt-1 font-mono text-[12px] font-medium" style={{ color: ADMIN_TONE.muted }}>
                                                                {category.id.substring(0, 8).toUpperCase()}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                <div className="text-[14px] font-medium text-gray-900">{outfitCount.toLocaleString("vi-VN")}</div>

                                                <div>
                                                    <CompactBadge
                                                        bg={outfitCount > 0 ? ADMIN_TONE.emeraldSoft : ADMIN_TONE.amberSoft}
                                                        text={outfitCount > 0 ? "#0C7A5D" : "#9A6506"}
                                                    >
                                                        {outfitCount > 0 ? "Đang dùng" : "Chưa dùng"}
                                                    </CompactBadge>
                                                </div>

                                                <div className="text-[14px] font-normal" style={{ color: "#3D384A" }}>
                                                    {formatDate(category.createdAt)}
                                                </div>

                                                <div className="flex items-center justify-end gap-2">
                                                    {isEditing ? (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUpdate(category)}
                                                                disabled={saving}
                                                                className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] text-white transition-all hover:scale-[0.98] disabled:opacity-50"
                                                                style={{ background: ADMIN_TONE.emerald }}
                                                                title="Lưu"
                                                            >
                                                                <Save className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={cancelEdit}
                                                                className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border transition-all hover:scale-[0.98]"
                                                                style={{ borderColor: ADMIN_TONE.line, color: ADMIN_TONE.muted }}
                                                                title="Hủy"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => startEdit(category)}
                                                                className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border transition-all hover:scale-[0.98]"
                                                                style={{ borderColor: ADMIN_TONE.line, color: ADMIN_TONE.sky }}
                                                                title="Sửa"
                                                            >
                                                                <Edit3 className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDelete(category)}
                                                                disabled={deletingId === category.id}
                                                                className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border transition-all hover:scale-[0.98] disabled:opacity-50"
                                                                style={{ borderColor: ADMIN_TONE.line, color: ADMIN_TONE.rose }}
                                                                title="Xóa"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {pagedCategories.map((category, index) => {
                                        const isEditing = editingId === category.id;
                                        const outfitCount = category.outfitCount ?? 0;
                                        return (
                                            <div
                                                key={`mobile-${category.id}`}
                                                className="space-y-3 border-b p-4 lg:hidden nb-fade-in"
                                                style={{ borderColor: ADMIN_TONE.line, animationDelay: `${index * 30}ms` }}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    {isEditing ? (
                                                        <input
                                                            value={editingName}
                                                            onChange={(event) => setEditingName(event.target.value)}
                                                            maxLength={255}
                                                            className="h-10 min-w-0 flex-1 rounded-[8px] border px-3 text-[14px] font-medium text-slate-900 outline-none focus:border-rose-200 focus:ring-4 focus:ring-rose-50"
                                                            style={{ borderColor: ADMIN_TONE.line }}
                                                        />
                                                    ) : (
                                                        <div className="min-w-0">
                                                            <div className="truncate text-[15px] font-medium text-gray-900">{category.categoryName}</div>
                                                            <div className="mt-1 font-mono text-[12px] font-medium" style={{ color: ADMIN_TONE.muted }}>
                                                                {category.id.substring(0, 8).toUpperCase()}
                                                            </div>
                                                        </div>
                                                    )}
                                                    <CompactBadge
                                                        bg={outfitCount > 0 ? ADMIN_TONE.emeraldSoft : ADMIN_TONE.amberSoft}
                                                        text={outfitCount > 0 ? "#0C7A5D" : "#9A6506"}
                                                    >
                                                        {outfitCount > 0 ? "Đang dùng" : "Chưa dùng"}
                                                    </CompactBadge>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2 text-[13px] font-medium" style={{ color: ADMIN_TONE.muted }}>
                                                    <span>{outfitCount.toLocaleString("vi-VN")} mẫu</span>
                                                    <span>·</span>
                                                    <span>{formatDate(category.createdAt)}</span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {isEditing ? (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUpdate(category)}
                                                                disabled={saving}
                                                                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[8px] text-[13px] font-semibold text-white disabled:opacity-50"
                                                                style={{ background: ADMIN_TONE.emerald }}
                                                            >
                                                                <Save className="h-4 w-4" />
                                                                Lưu
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={cancelEdit}
                                                                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[8px] border text-[13px] font-semibold"
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
                                                                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[8px] border text-[13px] font-semibold"
                                                                style={{ borderColor: ADMIN_TONE.line, color: ADMIN_TONE.sky }}
                                                            >
                                                                <Edit3 className="h-4 w-4" />
                                                                Sửa
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDelete(category)}
                                                                disabled={deletingId === category.id}
                                                                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[8px] border text-[13px] font-semibold disabled:opacity-50"
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

                                    <div
                                        className="flex flex-col gap-3 border-t px-5 py-4 md:flex-row md:items-center md:justify-between"
                                        style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.soft }}
                                    >
                                        <div className="text-[13px] font-semibold" style={{ color: ADMIN_TONE.muted }}>
                                            Trang {page}/{totalPages} · {sortedCategories.length.toLocaleString("vi-VN")} danh mục
                                        </div>
                                        {totalPages > 1 && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    disabled={page <= 1}
                                                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                                                    className="flex h-9 w-9 items-center justify-center rounded-full border transition-all hover:scale-[0.99] disabled:opacity-40"
                                                    style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell, color: ADMIN_TONE.pageInk }}
                                                    title="Trang trước"
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </button>
                                                <span className="flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-[13px] font-semibold" style={{ background: ADMIN_TONE.emeraldSoft, color: ADMIN_TONE.emerald }}>
                                                    {page}
                                                </span>
                                                <button
                                                    type="button"
                                                    disabled={page >= totalPages}
                                                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                                                    className="flex h-9 w-9 items-center justify-center rounded-full border transition-all hover:scale-[0.99] disabled:opacity-40"
                                                    style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell, color: ADMIN_TONE.pageInk }}
                                                    title="Trang sau"
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </section>
                    </main>
                </div>
            </div>

            {toast && (
                <div
                    className="fixed bottom-6 right-6 z-[70] flex max-w-[min(420px,calc(100vw-48px))] items-center gap-3 rounded-[8px] border px-5 py-3.5 text-[14px] font-semibold shadow-soft-md"
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
