import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { Search } from "lucide-react";
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
import { usePreservedResultsHeight } from "../../hooks/usePreservedResultsHeight";
import {
    approveUser,
    getUserDetail,
    getUsers,
    suspendUser,
    type UserDetailDto,
    type UserDto,
} from "../../lib/api/admin";
import {
    ADMIN_TONE,
    AdminBadge,
    AdminEmptyState,
    AdminHero,
    AdminSummaryCard,
} from "../AdminShared/adminWorkspace";
import * as XLSX from "xlsx";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

function getAccessToken(): string {
    return localStorage.getItem("access_token") || sessionStorage.getItem("access_token") || "";
}

const roleTone: Record<string, { bg: string; text: string; label: string }> = {
    Admin: { bg: ADMIN_TONE.violetSoft, text: "#4B39C8", label: "Quản trị" },
    Parent: { bg: ADMIN_TONE.skySoft, text: "#1D63BE", label: "Phụ huynh" },
    School: { bg: ADMIN_TONE.amberSoft, text: "#9A6506", label: "QL trường" },
    Provider: { bg: ADMIN_TONE.emeraldSoft, text: "#0C7A5D", label: "NCC" },
};

const statusTone: Record<string, { bg: string; text: string; label: string }> = {
    Active: { bg: ADMIN_TONE.emeraldSoft, text: "#0C7A5D", label: "Hoạt động" },
    Suspended: { bg: ADMIN_TONE.roseSoft, text: "#B23148", label: "Tạm khóa" },
};

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
            onClick={onClick}
            className={`inline-flex items-center gap-1 text-left text-[12px] font-black uppercase tracking-[0.08em] transition-colors hover:text-violet-600 ${
                active ? "text-gray-900" : "text-[#4E4A5B]"
            }`}
        >
            <span>{children}</span>
            <span className="inline-flex flex-col leading-none text-[10px] opacity-60">
                <span className={active && direction === "asc" ? "text-violet-600 opacity-100" : ""}>▲</span>
                <span className={active && direction === "desc" ? "text-violet-600 opacity-100" : ""}>▼</span>
            </span>
        </button>
    );
}

function exportXLSX(rows: UserDto[], filename: string) {
    const data = rows.map((user) => ({
        "Họ tên": user.fullName,
        Email: user.email,
        "Vai trò": roleTone[user.role]?.label || user.role,
        "Trạng thái": statusTone[user.status]?.label || user.status,
        "Ngày tạo": new Date(user.createdAt).toLocaleDateString("vi-VN"),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
        wch: Math.max(key.length, ...data.map((row) => String((row as Record<string, unknown>)[key] || "").length)) + 2,
    }));
    worksheet["!cols"] = colWidths;
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "NguoiDung");
    XLSX.writeFile(workbook, filename.replace(/\.csv$/, "") + ".xlsx");
}

export const AdminUsers = (): JSX.Element => {
    const navigate = useNavigate();
    const sidebarConfig = useAdminSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [users, setUsers] = useState<UserDto[]>([]);
    const [search, setSearch] = useState("");
    const [filterRole, setFilterRole] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [sortKey, setSortKey] = useState<string>("createdAt");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<UserDetailDto | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "warning" | "error" } | null>(null);
    const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const actionLoadingRef = useRef(false);
    const pageSize = 10;

    const showToast = useCallback((message: string, type: "success" | "warning" | "error") => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setToast({ message, type });
        toastTimerRef.current = setTimeout(() => setToast(null), 3000);
    }, []);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            setUsers(await getUsers());
        } catch {
            setError(true);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const connectionRef = useRef<ReturnType<ReturnType<typeof HubConnectionBuilder.prototype.build>> | null>(null);
    useEffect(() => {
        const token = getAccessToken();
        if (!token) return;

        const connection = new HubConnectionBuilder()
            .withUrl(`${API_BASE}/hubs/notifications`, { accessTokenFactory: () => token })
            .withAutomaticReconnect([0, 2000, 5000, 10000])
            .configureLogging(LogLevel.Warning)
            .build();

        connectionRef.current = connection;
        connection.on("UserStatusChanged", (userId: string, isActive: boolean) => {
            setUsers((prev) =>
                prev.map((user) => (user.id === userId ? { ...user, status: isActive ? "Active" : "Suspended" } : user)),
            );
        });

        connection.start().catch(() => {
            // Leave the page functional even if realtime status updates fail.
        });

        return () => {
            if (connection.state === HubConnectionState.Connected) connection.stop();
            connectionRef.current = null;
        };
    }, []);

    const filtered = useMemo(() => {
        let rows = [...users];

        if (search.trim()) {
            const query = search.toLowerCase();
            rows = rows.filter(
                (user) => user.fullName.toLowerCase().includes(query) || user.email.toLowerCase().includes(query),
            );
        }

        if (filterRole !== "all") rows = rows.filter((user) => user.role === filterRole);
        if (filterStatus !== "all") rows = rows.filter((user) => user.status === filterStatus);

        rows.sort((leftRow, rightRow) => {
            const left = (leftRow as Record<string, unknown>)[sortKey] ?? "";
            const right = (rightRow as Record<string, unknown>)[sortKey] ?? "";
            const compare = String(left).localeCompare(String(right), "vi");
            return sortDir === "asc" ? compare : -compare;
        });

        return rows;
    }, [users, search, filterRole, filterStatus, sortKey, sortDir]);

    const paginated = useMemo(
        () => filtered.slice((page - 1) * pageSize, page * pageSize),
        [filtered, page],
    );
    const isSearchEmptyState = !loading && !error && users.length > 0 && filtered.length === 0;
    const {
        resultsRegionRef,
        preserveResultsHeight,
        preservedHeightStyle,
    } = usePreservedResultsHeight(isSearchEmptyState);
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const suspendedCount = users.filter((user) => user.status === "Suspended").length;
    const activeCount = users.filter((user) => user.status === "Active").length;
    const roleMix = new Set(users.map((user) => user.role)).size;

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDir((current) => (current === "asc" ? "desc" : "asc"));
            return;
        }

        setSortKey(key);
        setSortDir("asc");
    };

    const handleViewDetail = async (id: string) => {
        setDetailLoading(true);
        try {
            setSelected(await getUserDetail(id));
        } finally {
            setDetailLoading(false);
        }
    };

    const handleToggleBan = async () => {
        if (!selected || actionLoadingRef.current) return;
        actionLoadingRef.current = true;

        const targetId = selected.id;
        const userName = selected.fullName;
        const previousStatus = selected.status;
        const nextStatus = previousStatus === "Suspended" ? "Active" : "Suspended";

        setSelected(null);
        setUsers((prev) => prev.map((user) => (user.id === targetId ? { ...user, status: nextStatus } : user)));

        try {
            if (previousStatus === "Suspended") {
                await approveUser(targetId);
                showToast(`Đã mở khóa tài khoản "${userName}"`, "success");
            } else {
                await suspendUser(targetId);
                showToast(`Đã khóa tài khoản "${userName}"`, "warning");
            }
        } catch {
            setUsers((prev) => prev.map((user) => (user.id === targetId ? { ...user, status: previousStatus } : user)));
            showToast("Thao tác thất bại, vui lòng thử lại.", "error");
        } finally {
            actionLoadingRef.current = false;
        }
    };

    const handleExport = () => {
        const suffix = [filterRole !== "all" ? filterRole : "", filterStatus !== "all" ? filterStatus : "", search ? "search" : ""]
            .filter(Boolean)
            .join("_");
        exportXLSX(filtered, `users${suffix ? "_" + suffix : ""}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    const columns = [
        { key: "fullName", label: "Họ tên", flex: "2fr" },
        { key: "email", label: "Email", flex: "2.3fr" },
        { key: "role", label: "Vai trò", flex: "1.2fr" },
        { key: "status", label: "Trạng thái", flex: "1.2fr" },
        { key: "createdAt", label: "Ngày tạo", flex: "1.2fr" },
    ];
    const gridCols = `${columns.map((column) => column.flex).join(" ")} 1fr`;
    const isSuspended = selected?.status === "Suspended";

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                    <TopNavBar>
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/admin/dashboard" className="font-semibold text-[#4c5769] text-base">
                                        Trang chủ
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="font-bold text-gray-900 text-base">Người dùng</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </TopNavBar>

                    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8 space-y-6 nb-fade-in">
                        <AdminHero
                            eyebrow="Tai khoan"
                            title="Theo dõi tài khoản và xử lý các trường hợp cần chú ý."
                            description="Ưu tiên tìm kiếm, lọc theo vai trò và kiểm tra các tài khoản bất thường. Các yêu cầu tạo tài khoản mới vẫn được xử lý ở mục cấp tài khoản."
                            stats={[
                                { label: "Tổng tài khoản", value: loading ? "…" : String(filtered.length) },
                                { label: "Đang hoạt động", value: loading ? "…" : String(activeCount) },
                            ]}
                        />

                        <section className="grid gap-4 md:grid-cols-3">
                            <AdminSummaryCard
                                label="Tổng tài khoản"
                                value={loading ? "…" : users.length.toLocaleString("vi-VN")}
                                detail="Bao gồm Admin, trường học, nhà cung cấp và phụ huynh đang hiện diện trong hệ thống."
                                accent={ADMIN_TONE.sky}
                            />
                            <AdminSummaryCard
                                label="Đang hoạt động"
                                value={loading ? "…" : activeCount.toLocaleString("vi-VN")}
                                detail="Đây là nhóm có thể tiếp tục giao dịch và thao tác bình thường trên hệ thống."
                                accent={ADMIN_TONE.emerald}
                            />
                            <AdminSummaryCard
                                label="Cần theo dõi"
                                value={loading ? "…" : suspendedCount.toLocaleString("vi-VN")}
                                detail={`Hiện có ${roleMix.toLocaleString("vi-VN")} nhóm vai trò đang được vận hành trên cùng một màn hình quản trị.`}
                                accent={ADMIN_TONE.rose}
                            />
                        </section>

                        <section className="rounded-[24px] border p-4 shadow-soft-lg" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}>
                            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                                <div className="flex flex-1 flex-col gap-3 xl:flex-row xl:items-center">
                                    <div className="relative min-w-[280px] flex-1">
                                        <Search
                                            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
                                            style={{ color: ADMIN_TONE.muted }}
                                        />
                                        <input
                                            value={search}
                                            onChange={(event) => {
                                                preserveResultsHeight();
                                                setSearch(event.target.value);
                                                setPage(1);
                                            }}
                                            placeholder="Tìm theo họ tên hoặc email..."
                                            className="w-full rounded-xl border py-3 pl-11 pr-4 text-[15px] font-semibold outline-none transition-all"
                                            style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.soft, color: ADMIN_TONE.pageInk }}
                                        />
                                    </div>

                                    <select
                                        value={filterRole}
                                        onChange={(event) => {
                                            preserveResultsHeight();
                                            setFilterRole(event.target.value);
                                            setPage(1);
                                        }}
                                        className="min-w-[180px] rounded-xl border px-4 py-3 text-[15px] font-semibold outline-none transition-all"
                                        style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.soft, color: ADMIN_TONE.pageInk }}
                                    >
                                        <option value="all">Tất cả vai trò</option>
                                        <option value="Admin">Quản trị viên</option>
                                        <option value="School">Quản lý trường</option>
                                        <option value="Provider">Nhà cung cấp</option>
                                        <option value="Parent">Phụ huynh</option>
                                    </select>

                                    <select
                                        value={filterStatus}
                                        onChange={(event) => {
                                            preserveResultsHeight();
                                            setFilterStatus(event.target.value);
                                            setPage(1);
                                        }}
                                        className="min-w-[180px] rounded-xl border px-4 py-3 text-[15px] font-semibold outline-none transition-all"
                                        style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.soft, color: ADMIN_TONE.pageInk }}
                                    >
                                        <option value="all">Tất cả trạng thái</option>
                                        <option value="Active">Hoạt động</option>
                                        <option value="Suspended">Tạm khóa</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-3">
                                    <AdminBadge bg={ADMIN_TONE.soft} text={ADMIN_TONE.pageInk}>
                                        Tổng: {filtered.length}
                                    </AdminBadge>
                                    <button
                                        onClick={handleExport}
                                        disabled={filtered.length === 0}
                                        className="rounded-xl border px-5 py-3 text-[14px] font-extrabold transition-all disabled:opacity-40 hover:scale-[0.99]"
                                        style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell, color: ADMIN_TONE.pageInk }}
                                    >
                                        Xuất Excel
                                    </button>
                                </div>
                            </div>
                        </section>

                        <section className="overflow-hidden rounded-[24px] border shadow-soft-lg" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}>
                            <div
                                className="sticky top-0 z-10 hidden lg:grid items-center border-b px-5 py-4"
                                style={{ gridTemplateColumns: gridCols, borderColor: ADMIN_TONE.line, background: ADMIN_TONE.violetSoft }}
                            >
                                {columns.map((column) => (
                                    <SortButton
                                        key={column.key}
                                        active={sortKey === column.key}
                                        direction={sortDir}
                                        onClick={() => handleSort(column.key)}
                                    >
                                        {column.label}
                                    </SortButton>
                                ))}
                                <div className="text-right text-[12px] font-black uppercase tracking-[0.08em]" style={{ color: ADMIN_TONE.muted }}>
                                    Hành động
                                </div>
                            </div>

                            <div ref={resultsRegionRef} style={preservedHeightStyle}>
                            {loading && (
                                <div className="space-y-3 px-5 py-5">
                                    {Array.from({ length: 5 }).map((_, index) => (
                                        <div
                                            key={index}
                                            className="hidden lg:grid items-center gap-4 rounded-[14px] border px-4 py-4"
                                            style={{ gridTemplateColumns: gridCols, borderColor: ADMIN_TONE.line, background: ADMIN_TONE.soft }}
                                        >
                                            {Array.from({ length: 6 }).map((__, cellIndex) => (
                                                <div
                                                    key={cellIndex}
                                                    className="h-5 rounded animate-pulse"
                                                    style={{ background: ADMIN_TONE.violetSoft }}
                                                />
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!loading && error && (
                                <AdminEmptyState
                                    title="Không tải được dữ liệu"
                                    detail="Có lỗi khi lấy danh sách người dùng. Kiểm tra kết nối hoặc thử lại."
                                    icon="⚠️"
                                    bg={ADMIN_TONE.roseSoft}
                                />
                            )}

                            {!loading && !error && filtered.length === 0 && (
                                <AdminEmptyState
                                    title="Không tìm thấy người dùng"
                                    detail="Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc để xem lại toàn bộ danh sách."
                                    icon="📭"
                                    bg={ADMIN_TONE.amberSoft}
                                />
                            )}

                            {!loading && !error && filtered.length > 0 && (
                                <div>
                                    {paginated.map((user, index) => (
                                        <div
                                            key={user.id}
                                            className="hidden lg:grid items-center gap-4 border-b px-5 py-4 transition-colors hover:bg-[#F7F2FF] nb-fade-in"
                                            style={{
                                                gridTemplateColumns: gridCols,
                                                borderColor: ADMIN_TONE.line,
                                                animationDelay: `${index * 40}ms`,
                                            }}
                                        >
                                            <div className="min-w-0 text-[16px] font-black text-gray-900">{user.fullName}</div>
                                            <div className="truncate text-[15px] font-semibold" style={{ color: "#3D384A" }}>
                                                {user.email}
                                            </div>
                                            <div>
                                                <AdminBadge bg={roleTone[user.role]?.bg} text={roleTone[user.role]?.text}>
                                                    {roleTone[user.role]?.label || user.role}
                                                </AdminBadge>
                                            </div>
                                            <div>
                                                <AdminBadge bg={statusTone[user.status]?.bg} text={statusTone[user.status]?.text}>
                                                    {statusTone[user.status]?.label || user.status}
                                                </AdminBadge>
                                            </div>
                                            <div className="text-[15px] font-semibold" style={{ color: "#3D384A" }}>
                                                {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                                            </div>
                                            <div className="flex items-center justify-end">
                                                <button
                                                    onClick={() => handleViewDetail(user.id)}
                                                    className="rounded-xl border px-4 py-2 text-[13px] font-extrabold transition-all hover:scale-[0.99]"
                                                    style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell, color: ADMIN_TONE.pageInk }}
                                                >
                                                    Chi tiết
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {paginated.map((user, index) => (
                                        <div
                                            key={`mobile-${user.id}`}
                                            className="lg:hidden border-b p-4 space-y-3 nb-fade-in"
                                            style={{ borderColor: ADMIN_TONE.line, animationDelay: `${index * 40}ms` }}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="text-[16px] font-black text-gray-900">{user.fullName}</div>
                                                    <div className="mt-1 text-[14px] font-semibold" style={{ color: "#3D384A" }}>
                                                        {user.email}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1.5 items-end">
                                                    <AdminBadge bg={roleTone[user.role]?.bg} text={roleTone[user.role]?.text}>
                                                        {roleTone[user.role]?.label || user.role}
                                                    </AdminBadge>
                                                    <AdminBadge bg={statusTone[user.status]?.bg} text={statusTone[user.status]?.text}>
                                                        {statusTone[user.status]?.label || user.status}
                                                    </AdminBadge>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[13px] font-semibold" style={{ color: ADMIN_TONE.muted }}>
                                                    {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                                                </span>
                                                <button
                                                    onClick={() => handleViewDetail(user.id)}
                                                    className="rounded-xl border px-4 py-2 text-[13px] font-extrabold transition-all hover:scale-[0.99]"
                                                    style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell, color: ADMIN_TONE.pageInk }}
                                                >
                                                    Chi tiết
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <div
                                        className="flex flex-col gap-3 border-t px-5 py-4 md:flex-row md:items-center md:justify-between"
                                        style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.soft }}
                                    >
                                        <div className="text-[14px] font-bold" style={{ color: ADMIN_TONE.muted }}>
                                            Hiển thị {Math.min((page - 1) * pageSize + 1, filtered.length)}-{Math.min(page * pageSize, filtered.length)} / {filtered.length} tài khoản · Trang {page}/{totalPages}
                                        </div>
                                        {totalPages > 1 && (
                                            <div className="flex gap-3">
                                                <button
                                                    disabled={page <= 1}
                                                    onClick={() => setPage((current) => current - 1)}
                                                    className="rounded-xl border px-4 py-2 text-[13px] font-extrabold transition-all disabled:opacity-40 hover:scale-[0.99]"
                                                    style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell, color: ADMIN_TONE.pageInk }}
                                                >
                                                    ← Trước
                                                </button>
                                                <button
                                                    disabled={page >= totalPages}
                                                    onClick={() => setPage((current) => current + 1)}
                                                    className="rounded-xl border px-4 py-2 text-[13px] font-extrabold text-white transition-all disabled:opacity-40 hover:scale-[0.99]"
                                                    style={{ borderColor: ADMIN_TONE.violet, background: ADMIN_TONE.violet }}
                                                >
                                                    Sau →
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            </div>
                        </section>
                    </main>
                </div>
            </div>

            {(selected || detailLoading) && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 nb-backdrop-enter"
                    style={{ background: "rgba(25, 24, 43, 0.55)" }}
                    onClick={() => !detailLoading && setSelected(null)}
                >
                    <div
                        className="w-full max-w-lg rounded-2xl border p-6 space-y-5 nb-modal-enter shadow-soft-lg"
                        style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}
                        onClick={(event) => event.stopPropagation()}
                    >
                        {detailLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div
                                    className="h-10 w-10 animate-spin rounded-full border-2"
                                    style={{ borderColor: ADMIN_TONE.violetSoft, borderTopColor: ADMIN_TONE.violet }}
                                />
                            </div>
                        ) : (
                            selected && (
                                <>
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-[24px] font-black" style={{ color: ADMIN_TONE.pageInk }}>
                                            Chi tiết người dùng
                                        </h2>
                                        <button
                                            onClick={() => setSelected(null)}
                                            className="flex h-10 w-10 items-center justify-center rounded-xl border text-[16px] font-black transition-all hover:scale-[0.99]"
                                            style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}
                                        >
                                            ×
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { label: "Họ tên", value: selected.fullName },
                                            { label: "Email", value: selected.email },
                                            { label: "Số điện thoại", value: selected.phone || "—" },
                                            {
                                                label: "Vai trò",
                                                badge: true,
                                                badgeBg: roleTone[selected.role]?.bg,
                                                badgeText: roleTone[selected.role]?.text,
                                                badgeValue: roleTone[selected.role]?.label || selected.role,
                                            },
                                            {
                                                label: "Trạng thái",
                                                badge: true,
                                                badgeBg: statusTone[selected.status]?.bg,
                                                badgeText: statusTone[selected.status]?.text,
                                                badgeValue: statusTone[selected.status]?.label || selected.status,
                                            },
                                            { label: "Ngày tạo", value: new Date(selected.createdAt).toLocaleDateString("vi-VN") },
                                            ...(selected.schoolName ? [{ label: "Trường", value: selected.schoolName }] : []),
                                            ...(selected.providerName ? [{ label: "Nhà cung cấp", value: selected.providerName }] : []),
                                            ...(selected.lastLogin
                                                ? [{ label: "Đăng nhập cuối", value: new Date(selected.lastLogin).toLocaleString("vi-VN") }]
                                                : []),
                                        ].map((item, index) => (
                                            <div key={index}>
                                                <p className="mb-1 text-[12px] font-black uppercase tracking-wide" style={{ color: ADMIN_TONE.muted }}>
                                                    {item.label}
                                                </p>
                                                {item.badge ? (
                                                    <AdminBadge bg={item.badgeBg} text={item.badgeText}>
                                                        {item.badgeValue}
                                                    </AdminBadge>
                                                ) : (
                                                    <p className="text-[15px] font-semibold text-gray-900">{item.value}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {selected.role !== "Admin" && (
                                        <button
                                            onClick={handleToggleBan}
                                            className="w-full rounded-xl border py-3 text-[15px] font-extrabold text-white transition-all hover:scale-[0.99]"
                                            style={{
                                                borderColor: isSuspended ? ADMIN_TONE.emerald : ADMIN_TONE.rose,
                                                background: isSuspended ? ADMIN_TONE.emerald : ADMIN_TONE.rose,
                                            }}
                                        >
                                            {isSuspended ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                                        </button>
                                    )}

                                    <button
                                        onClick={() => setSelected(null)}
                                        className="w-full rounded-xl border py-3 text-[15px] font-extrabold transition-all hover:scale-[0.99]"
                                        style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell, color: ADMIN_TONE.pageInk }}
                                    >
                                        Đóng
                                    </button>
                                </>
                            )
                        )}
                    </div>
                </div>
            )}

            {toast && (
                <div
                    className="fixed right-6 top-6 z-[60] flex items-center gap-3 rounded-xl border px-5 py-4 text-[15px] font-extrabold nb-fade-in shadow-soft-md"
                    style={{
                        borderColor: ADMIN_TONE.line,
                        background:
                            toast.type === "success"
                                ? ADMIN_TONE.emeraldSoft
                                : toast.type === "warning"
                                  ? ADMIN_TONE.amberSoft
                                  : ADMIN_TONE.roseSoft,
                        color:
                            toast.type === "success"
                                ? "#0C7A5D"
                                : toast.type === "warning"
                                  ? "#9A6506"
                                  : "#B23148",
                        minWidth: "260px",
                        maxWidth: "420px",
                    }}
                >
                    <span className="flex-1">{toast.message}</span>
                    <button onClick={() => setToast(null)} className="ml-2 text-[18px] leading-none opacity-60 hover:opacity-100 transition-opacity">
                        ×
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
