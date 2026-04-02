import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useAdminSidebarConfig } from "../../hooks/useAdminSidebarConfig";
import { getUsers, getUserDetail, approveUser, suspendUser, type UserDto, type UserDetailDto } from "../../lib/api/admin";
import * as XLSX from "xlsx";

/* ── Design tokens (matching html.ts reference) ── */
const T = {
    ink: "#19182B",
    bg: "#F6F1E8",
    surface: "#FFFFFF",
    surfaceSoft: "#FFFDF9",
    primary: "#8B6BFF",
    primarySoft: "#E9E1FF",
    infoSoft: "#DCEBFF",
    warningSoft: "#FFF1BF",
    successSoft: "#D9F8E8",
    dangerSoft: "#FFE3D8",
    muted: "#6F6A7D",
};

/* ── Badge tone maps ── */
const roleTone: Record<string, { bg: string; text: string }> = {
    Admin: { bg: T.primarySoft, text: "#5F45D8" },
    Parent: { bg: T.infoSoft, text: "#2758B8" },
    School: { bg: T.warningSoft, text: "#9A590E" },
    Provider: { bg: T.successSoft, text: "#187A4C" },
};
const roleLabel: Record<string, string> = {
    Admin: "Quản trị",
    Parent: "Phụ huynh",
    School: "QL Trường",
    Provider: "NCC",
};
const statusTone: Record<string, { bg: string; text: string }> = {
    Active: { bg: T.successSoft, text: "#187A4C" },
    Suspended: { bg: T.dangerSoft, text: "#B2452D" },
};

/* ── Micro-components ── */

function Badge({ children, tone }: { children: React.ReactNode; tone?: { bg: string; text: string } }) {
    const t = tone || { bg: T.surface, text: T.ink };
    return (
        <span
            className="inline-flex items-center rounded-full border-[2px] px-3 py-1 text-[12px] font-black uppercase tracking-wide"
            style={{ borderColor: T.ink, background: t.bg, color: t.text, boxShadow: `2px 2px 0 ${T.ink}` }}
        >
            {children}
        </span>
    );
}

function SortButton({ children, active, direction, onClick }: {
    children: React.ReactNode; active: boolean; direction: string; onClick: () => void;
}) {
    return (
        <button onClick={onClick}
            className={`inline-flex items-center gap-1 text-left text-[12px] font-black uppercase tracking-[0.08em] transition-colors hover:text-[#6938EF] ${active ? "text-[#19182B]" : "text-[#4E4A5B]"}`}
        >
            <span>{children}</span>
            <span className="inline-flex flex-col leading-none text-[10px] opacity-60">
                <span className={active && direction === "asc" ? "text-[#6938EF] opacity-100" : ""}>▲</span>
                <span className={active && direction === "desc" ? "text-[#6938EF] opacity-100" : ""}>▼</span>
            </span>
        </button>
    );
}

/* ── XLSX Export helper ── */
function exportXLSX(rows: UserDto[], filename: string) {
    const data = rows.map(u => ({
        "Họ tên": u.fullName,
        "Email": u.email,
        "Vai trò": roleLabel[u.role] || u.role,
        "Trạng thái": u.status === "Active" ? "Hoạt động" : "Bị khoá",
        "Ngày tạo": new Date(u.createdAt).toLocaleDateString("vi"),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    /* Auto-width columns */
    const colWidths = Object.keys(data[0] || {}).map(key => ({
        wch: Math.max(key.length, ...data.map(r => String((r as any)[key] || "").length)) + 2,
    }));
    ws["!cols"] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Người dùng");
    XLSX.writeFile(wb, filename.replace(/\.csv$/, "") + ".xlsx");
}

export const AdminUsers = (): JSX.Element => {
    const navigate = useNavigate();
    const sidebarConfig = useAdminSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();

    /* ── Data state ── */
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [users, setUsers] = useState<UserDto[]>([]);

    /* ── Filter / Sort / Page ── */
    const [search, setSearch] = useState("");
    const [filterRole, setFilterRole] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [sortKey, setSortKey] = useState<string>("createdAt");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
    const [page, setPage] = useState(1);
    const pageSize = 10;

    /* ── Detail modal ── */
    const [selected, setSelected] = useState<UserDetailDto | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    /* ── Fetch ── */
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(false);
        try { setUsers(await getUsers()); } catch { setError(true); setUsers([]); }
        finally { setLoading(false); }
    }, []);
    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    /* ── Derived data ── */
    const filtered = useMemo(() => {
        let rows = [...users];
        if (search.trim()) {
            const q = search.toLowerCase();
            rows = rows.filter(u => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
        }
        if (filterRole !== "all") rows = rows.filter(u => u.role === filterRole);
        if (filterStatus !== "all") rows = rows.filter(u => u.status === filterStatus);

        rows.sort((a, b) => {
            const left = (a as any)[sortKey] ?? "";
            const right = (b as any)[sortKey] ?? "";
            const cmp = String(left).localeCompare(String(right), "vi");
            return sortDir === "asc" ? cmp : -cmp;
        });
        return rows;
    }, [users, search, filterRole, filterStatus, sortKey, sortDir]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

    /* ── Handlers ── */
    const handleSort = (key: string) => {
        if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortKey(key); setSortDir("asc"); }
    };

    const handleViewDetail = async (id: string) => {
        setDetailLoading(true);
        try { setSelected(await getUserDetail(id)); } catch { /* */ }
        finally { setDetailLoading(false); }
    };

    const handleToggleBan = async () => {
        if (!selected) return;
        setActionLoading(true);
        try {
            if (selected.status === "Suspended") await approveUser(selected.id);
            else await suspendUser(selected.id);
            setSelected(null); await fetchUsers();
        } catch { /* */ }
        finally { setActionLoading(false); }
    };

    const handleExportCSV = () => {
        const suffix = [
            filterRole !== "all" ? filterRole : "",
            filterStatus !== "all" ? filterStatus : "",
            search ? "search" : "",
        ].filter(Boolean).join("_");
        exportXLSX(filtered, `users${suffix ? "_" + suffix : ""}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const handleLogout = () => {
        localStorage.removeItem("access_token"); localStorage.removeItem("user"); localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token"); sessionStorage.removeItem("user"); sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    const isBanned = selected?.status === "Suspended";

    /* ── Column definitions ── */
    const columns = [
        { key: "fullName", label: "Họ tên", flex: "2.1fr" },
        { key: "email", label: "Email", flex: "2.3fr" },
        { key: "role", label: "Vai trò", flex: "1.3fr" },
        { key: "status", label: "Trạng thái", flex: "1.3fr" },
        { key: "createdAt", label: "Ngày tạo", flex: "1.2fr" },
    ];
    const gridCols = columns.map(c => c.flex).join(" ") + " 1fr";

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                {/* Sidebar */}
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>

                {/* Main content */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Breadcrumb */}
                    <TopNavBar>
                        <Breadcrumb><BreadcrumbList>
                            <BreadcrumbItem><BreadcrumbLink href="/admin/dashboard" className="font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                            <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                            <BreadcrumbItem><BreadcrumbPage className="font-bold text-[#1A1A2E] text-base">Quản lý người dùng</BreadcrumbPage></BreadcrumbItem>
                        </BreadcrumbList></Breadcrumb>
                    </TopNavBar>

                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6 nb-fade-in">
                        {/* ── Page Header ── */}
                        <div>
                            <h1 className="text-[40px] font-black leading-none md:text-[48px]" style={{ color: T.ink }}>
                                👥 Quản lý người dùng
                            </h1>
                            <p className="mt-3 max-w-3xl text-[17px] font-semibold leading-8" style={{ color: T.muted }}>
                                Xem, tìm kiếm và quản lý tất cả tài khoản trong hệ thống. Tài khoản chờ duyệt được xử lý riêng tại mục Yêu cầu cấp TK.
                            </p>
                        </div>

                        {/* ── Toolbar ── */}
                        <div className="rounded-[18px] border-[3px] p-4" style={{ borderColor: T.ink, background: T.surface, boxShadow: `6px 6px 0 ${T.ink}` }}>
                            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                                {/* Left: Search + Filters */}
                                <div className="flex flex-1 flex-col gap-3 xl:flex-row xl:items-center">
                                    {/* Search */}
                                    <div className="relative min-w-[280px] flex-1">
                                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[16px]" style={{ color: T.muted }}>🔎</span>
                                        <input
                                            value={search}
                                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                                            placeholder="Tìm theo tên, email..."
                                            className="w-full rounded-[12px] border-[2px] py-3 pl-12 pr-4 text-[15px] font-semibold outline-none transition-all placeholder:text-[#9A95A8] focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0_#19182B]"
                                            style={{ borderColor: T.ink, color: T.ink, background: T.surface, boxShadow: `3px 3px 0 ${T.ink}` }}
                                        />
                                    </div>
                                    {/* Role filter */}
                                    <select
                                        value={filterRole}
                                        onChange={e => { setFilterRole(e.target.value); setPage(1); }}
                                        className="min-w-[180px] rounded-[12px] border-[2px] px-4 py-3 text-[15px] font-semibold outline-none transition-all focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0_#19182B]"
                                        style={{ borderColor: T.ink, color: T.ink, background: T.surface, boxShadow: `3px 3px 0 ${T.ink}` }}
                                    >
                                        <option value="all">Tất cả vai trò</option>
                                        <option value="Admin">Quản trị viên</option>
                                        <option value="School">Quản lý trường</option>
                                        <option value="Provider">Nhà cung cấp</option>
                                        <option value="Parent">Phụ huynh</option>
                                    </select>
                                    {/* Status filter */}
                                    <select
                                        value={filterStatus}
                                        onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                                        className="min-w-[180px] rounded-[12px] border-[2px] px-4 py-3 text-[15px] font-semibold outline-none transition-all focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0_#19182B]"
                                        style={{ borderColor: T.ink, color: T.ink, background: T.surface, boxShadow: `3px 3px 0 ${T.ink}` }}
                                    >
                                        <option value="all">Tất cả trạng thái</option>
                                        <option value="Active">Hoạt động</option>
                                        <option value="Suspended">Bị khoá</option>
                                    </select>
                                </div>
                                {/* Right: count + export */}
                                <div className="flex items-center gap-3">
                                    <Badge tone={{ bg: T.surface, text: T.ink }}>
                                        Tổng: {filtered.length}
                                    </Badge>
                                    <button
                                        onClick={handleExportCSV}
                                        disabled={filtered.length === 0}
                                        className="rounded-[12px] border-[3px] px-5 py-3 text-[14px] font-extrabold transition-all disabled:opacity-40 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                                        style={{ borderColor: T.ink, background: T.surface, color: T.ink, boxShadow: `4px 4px 0 ${T.ink}` }}
                                    >
                                        📥 Xuất Excel
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ── Table ── */}
                        <div className="overflow-hidden rounded-[18px] border-[3px]" style={{ borderColor: T.ink, background: T.surface, boxShadow: `6px 6px 0 ${T.ink}` }}>
                            {/* Table Header */}
                            <div
                                className="sticky top-0 z-10 hidden lg:grid items-center border-b-[3px] px-5 py-4"
                                style={{ gridTemplateColumns: gridCols, borderColor: T.ink, background: T.primarySoft }}
                            >
                                {columns.map(col => (
                                    <SortButton key={col.key} active={sortKey === col.key} direction={sortDir} onClick={() => handleSort(col.key)}>
                                        {col.label}
                                    </SortButton>
                                ))}
                                <div className="text-[12px] font-black uppercase tracking-[0.08em] text-right" style={{ color: "#4E4A5B" }}>
                                    Hành động
                                </div>
                            </div>

                            {/* Loading */}
                            {loading && (
                                <div className="space-y-3 px-5 py-5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="hidden lg:grid items-center gap-4 rounded-[14px] border px-4 py-4"
                                            style={{ gridTemplateColumns: gridCols, borderColor: "#D9D4E6", background: T.surfaceSoft }}>
                                            {columns.map((_, j) => (
                                                <div key={j} className="h-5 rounded animate-pulse" style={{ background: "#EAE3FF" }} />
                                            ))}
                                            <div className="h-10 rounded animate-pulse" style={{ background: "#EAE3FF" }} />
                                        </div>
                                    ))}
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <div key={`m-${i}`} className="lg:hidden rounded-[14px] border p-4 space-y-3"
                                            style={{ borderColor: "#D9D4E6", background: T.surfaceSoft }}>
                                            <div className="h-5 w-2/3 rounded animate-pulse" style={{ background: "#EAE3FF" }} />
                                            <div className="h-4 w-1/2 rounded animate-pulse" style={{ background: "#EAE3FF" }} />
                                            <div className="flex gap-2">
                                                <div className="h-6 w-16 rounded-full animate-pulse" style={{ background: "#EAE3FF" }} />
                                                <div className="h-6 w-16 rounded-full animate-pulse" style={{ background: "#EAE3FF" }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Error */}
                            {!loading && error && (
                                <div className="flex min-h-[240px] flex-col items-center justify-center px-6 py-12 text-center">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-[16px] border-[3px] text-[28px]"
                                        style={{ borderColor: T.ink, background: T.dangerSoft, boxShadow: `4px 4px 0 ${T.ink}` }}>⚠️</div>
                                    <div className="mt-5 text-[28px] font-black">Không tải được dữ liệu</div>
                                    <p className="mt-3 max-w-lg text-[15px] font-semibold leading-7" style={{ color: T.muted }}>
                                        Có lỗi khi lấy danh sách người dùng. Kiểm tra kết nối hoặc thử lại.
                                    </p>
                                    <button onClick={fetchUsers}
                                        className="mt-5 rounded-[12px] border-[3px] px-5 py-3 text-[15px] font-extrabold text-white transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                                        style={{ borderColor: T.ink, background: T.primary, boxShadow: `4px 4px 0 ${T.ink}` }}>Thử lại</button>
                                </div>
                            )}

                            {/* Empty */}
                            {!loading && !error && filtered.length === 0 && (
                                <div className="flex min-h-[240px] flex-col items-center justify-center px-6 py-12 text-center">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-[16px] border-[3px] text-[28px]"
                                        style={{ borderColor: T.ink, background: T.warningSoft, boxShadow: `4px 4px 0 ${T.ink}` }}>📭</div>
                                    <div className="mt-5 text-[28px] font-black">Không tìm thấy người dùng</div>
                                    <p className="mt-3 max-w-lg text-[15px] font-semibold leading-7" style={{ color: T.muted }}>
                                        Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc để xem lại toàn bộ danh sách.
                                    </p>
                                </div>
                            )}

                            {/* Data */}
                            {!loading && !error && filtered.length > 0 && (
                                <div>
                                    {paginated.map((u, idx) => (
                                        <div key={u.id}
                                            className="hidden lg:grid items-center gap-4 border-b px-5 py-4 transition-colors hover:bg-[#F7F2FF] nb-fade-in"
                                            style={{ gridTemplateColumns: gridCols, borderColor: "#D9D4E6", animationDelay: `${idx * 40}ms` }}>
                                            <div className="min-w-0">
                                                <div className="text-[16px] font-black" style={{ color: T.ink }}>{u.fullName}</div>
                                            </div>
                                            <div className="truncate text-[15px] font-semibold" style={{ color: "#3D384A" }}>{u.email}</div>
                                            <div><Badge tone={roleTone[u.role]}>{roleLabel[u.role] || u.role}</Badge></div>
                                            <div><Badge tone={statusTone[u.status]}>{u.status}</Badge></div>
                                            <div className="text-[15px] font-semibold" style={{ color: "#3D384A" }}>
                                                {new Date(u.createdAt).toLocaleDateString("vi")}
                                            </div>
                                            <div className="flex items-center justify-end">
                                                <button onClick={() => handleViewDetail(u.id)}
                                                    className="rounded-[12px] border-[3px] px-4 py-2 text-[13px] font-extrabold transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                                                    style={{ borderColor: T.ink, background: T.surface, color: T.ink, boxShadow: `4px 4px 0 ${T.ink}` }}>
                                                    👁 Chi tiết
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Mobile cards */}
                                    {paginated.map((u, idx) => (
                                        <div key={`m-${u.id}`} className="lg:hidden border-b p-4 space-y-3 nb-fade-in"
                                            style={{ borderColor: "#D9D4E6", animationDelay: `${idx * 40}ms` }}>
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="text-[16px] font-black" style={{ color: T.ink }}>{u.fullName}</div>
                                                    <div className="text-[14px] font-semibold mt-1" style={{ color: "#3D384A" }}>{u.email}</div>
                                                </div>
                                                <div className="flex flex-col gap-1.5 items-end">
                                                    <Badge tone={roleTone[u.role]}>{roleLabel[u.role] || u.role}</Badge>
                                                    <Badge tone={statusTone[u.status]}>{u.status}</Badge>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[13px] font-semibold" style={{ color: T.muted }}>
                                                    {new Date(u.createdAt).toLocaleDateString("vi")}
                                                </span>
                                                <button onClick={() => handleViewDetail(u.id)}
                                                    className="rounded-[12px] border-[3px] px-4 py-2 text-[13px] font-extrabold transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                                                    style={{ borderColor: T.ink, background: T.surface, color: T.ink, boxShadow: `4px 4px 0 ${T.ink}` }}>
                                                    👁 Chi tiết
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Pagination */}
                                    <div className="flex flex-col gap-3 border-t-[3px] px-5 py-4 md:flex-row md:items-center md:justify-between"
                                        style={{ borderColor: T.ink, background: T.surfaceSoft }}>
                                        <div className="text-[14px] font-bold" style={{ color: T.muted }}>
                                            Hiển thị {Math.min((page - 1) * pageSize + 1, filtered.length)}–{Math.min(page * pageSize, filtered.length)} / {filtered.length} người dùng · Trang {page}/{totalPages}
                                        </div>
                                        {totalPages > 1 && (
                                            <div className="flex gap-3">
                                                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                                                    className="rounded-[12px] border-[3px] px-4 py-2 text-[13px] font-extrabold transition-all disabled:opacity-40 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                                                    style={{ borderColor: T.ink, background: T.surface, color: T.ink, boxShadow: `4px 4px 0 ${T.ink}` }}>← Trước</button>
                                                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                                                    className="rounded-[12px] border-[3px] px-4 py-2 text-[13px] font-extrabold text-white transition-all disabled:opacity-40 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                                                    style={{ borderColor: T.ink, background: T.primary, boxShadow: `4px 4px 0 ${T.ink}` }}>Sau →</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>

            {/* ── Detail Modal ── */}
            {(selected || detailLoading) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 nb-backdrop-enter"
                    style={{ background: "rgba(25, 24, 43, 0.55)" }}
                    onClick={() => !detailLoading && setSelected(null)}>
                    <div className="w-full max-w-lg rounded-[18px] border-[3px] p-6 space-y-5 nb-modal-enter"
                        style={{ borderColor: T.ink, background: T.surface, boxShadow: `6px 6px 0 ${T.ink}` }}
                        onClick={e => e.stopPropagation()}>
                        {detailLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin w-10 h-10 border-[3px] rounded-full" style={{ borderColor: T.primarySoft, borderTopColor: T.primary }} />
                            </div>
                        ) : selected && (
                            <>
                                <div className="flex justify-between items-center">
                                    <h2 className="text-[24px] font-black" style={{ color: T.ink }}>Chi tiết người dùng</h2>
                                    <button onClick={() => setSelected(null)}
                                        className="flex h-10 w-10 items-center justify-center rounded-[10px] border-[2px] text-[16px] font-black transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                                        style={{ borderColor: T.ink, background: T.surface, boxShadow: `2px 2px 0 ${T.ink}` }}>✕</button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { label: "Họ tên", value: selected.fullName },
                                        { label: "Email", value: selected.email },
                                        { label: "Số điện thoại", value: selected.phone || "—" },
                                        { label: "Vai trò", badge: true, badgeTone: roleTone[selected.role], badgeText: roleLabel[selected.role] || selected.role },
                                        { label: "Trạng thái", badge: true, badgeTone: statusTone[selected.status], badgeText: selected.status },
                                        { label: "Ngày tạo", value: new Date(selected.createdAt).toLocaleDateString("vi") },
                                        ...(selected.schoolName ? [{ label: "Trường", value: selected.schoolName }] : []),
                                        ...(selected.providerName ? [{ label: "Nhà cung cấp", value: selected.providerName }] : []),
                                        ...(selected.lastLogin ? [{ label: "Đăng nhập cuối", value: new Date(selected.lastLogin).toLocaleString("vi") }] : []),
                                    ].map((item, i) => (
                                        <div key={i}>
                                            <p className="text-[12px] font-black uppercase mb-1 tracking-wide" style={{ color: T.muted }}>{item.label}</p>
                                            {item.badge ? (
                                                <Badge tone={item.badgeTone}>{item.badgeText}</Badge>
                                            ) : (
                                                <p className="text-[15px] font-semibold" style={{ color: T.ink }}>{item.value}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {selected.role !== "Admin" && (
                                    <button onClick={handleToggleBan} disabled={actionLoading}
                                        className="w-full rounded-[12px] border-[3px] py-3 text-[15px] font-extrabold text-white transition-all disabled:opacity-50 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                                        style={{ borderColor: T.ink, background: isBanned ? "#10B981" : "#EF4444", boxShadow: `4px 4px 0 ${T.ink}` }}>
                                        {actionLoading ? "Đang xử lý..." : isBanned ? "🔓 Mở khoá tài khoản" : "🔒 Khoá tài khoản"}
                                    </button>
                                )}
                                <button onClick={() => setSelected(null)}
                                    className="w-full rounded-[12px] border-[3px] py-3 text-[15px] font-extrabold transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                                    style={{ borderColor: T.ink, background: T.surface, color: T.ink, boxShadow: `4px 4px 0 ${T.ink}` }}>Đóng</button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
