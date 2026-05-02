import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsUpDown, Eye, FileDown, Loader2, Lock, Search, Unlock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useAdminSidebarConfig } from "../../hooks/useAdminSidebarConfig";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { usePreservedResultsHeight } from "../../hooks/usePreservedResultsHeight";
import { approveUser, getUserDetail, getUsers, suspendUser, type UserDetailDto, type UserDto } from "../../lib/api/admin";
import { ADMIN_TONE, AdminEmptyState, AdminTopNavTitle } from "../AdminShared/adminWorkspace";
import * as XLSX from "xlsx";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const MIN_PAGE_FETCH_FEEDBACK_MS = 700;
const MIN_FILTER_COMMIT_MS = 450;
const PAGE_SIZE = 10;

function getAccessToken(): string {
    return localStorage.getItem("access_token") || sessionStorage.getItem("access_token") || "";
}

const roleTone: Record<string, { bg: string; text: string; label: string }> = {
    Admin: { bg: ADMIN_TONE.violetSoft, text: "#4B39C8", label: "Admin" },
    Parent: { bg: ADMIN_TONE.skySoft, text: "#1D63BE", label: "Phụ huynh" },
    School: { bg: ADMIN_TONE.amberSoft, text: "#9A6506", label: "QL Trường" },
    Provider: { bg: ADMIN_TONE.emeraldSoft, text: "#0C7A5D", label: "NCC" },
};

const statusTone: Record<string, { bg: string; text: string; label: string }> = {
    Active: { bg: ADMIN_TONE.emeraldSoft, text: "#0C7A5D", label: "Active" },
    Suspended: { bg: ADMIN_TONE.roseSoft, text: "#B23148", label: "InActive" },
};

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

function getInitials(name: string): string {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(-2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "U";
}

function formatUserCode(id: string): string {
    const compact = id.replace(/-/g, "");
    return `#${compact.slice(0, 6).toUpperCase()}`;
}

export const AdminUsers = (): JSX.Element => {
    const navigate = useNavigate();
    const sidebarConfig = useAdminSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [users, setUsers] = useState<UserDto[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [filterRole, setFilterRole] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [sortKey, setSortKey] = useState<string>("createdAt");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
    const [page, setPage] = useState(1);
    const [fetchingOrders, setFetchingOrders] = useState(false);
    const [filtering, setFiltering] = useState(false);
    const [selected, setSelected] = useState<UserDetailDto | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "warning" | "error" } | null>(null);

    const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const actionLoadingRef = useRef(false);
    const hasLoadedRef = useRef(false);
    const fetchSequenceRef = useRef(0);
    const fetchStartedAtRef = useRef(0);
    const filterTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

    const isFilteredEmptyState = !loading && !fetchingOrders && !filtering && users.length === 0 && hasLoadedRef.current;
    const { resultsRegionRef, preserveResultsHeight, preservedHeightStyle } = usePreservedResultsHeight(isFilteredEmptyState);

    const showToast = useCallback((message: string, type: "success" | "warning" | "error") => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setToast({ message, type });
        toastTimerRef.current = setTimeout(() => setToast(null), 3000);
    }, []);

    const fetchData = useCallback(() => {
        const isInitialLoad = !hasLoadedRef.current;
        const fetchSeq = fetchSequenceRef.current + 1;
        fetchSequenceRef.current = fetchSeq;
        setLoading(isInitialLoad);
        setFetchingOrders(!isInitialLoad);
        fetchStartedAtRef.current = Date.now();

        getUsers({
            page,
            pageSize: PAGE_SIZE,
            search: search || undefined,
            role: filterRole !== "all" ? filterRole : undefined,
            status: filterStatus !== "all" ? filterStatus : undefined,
        })
            .then((result) => {
                if (fetchSeq !== fetchSequenceRef.current) return;
                setUsers(result.items);
                setTotalCount(result.totalCount);
                setError(false);
            })
            .catch(() => {
                if (fetchSeq !== fetchSequenceRef.current) return;
                setError(true);
                setUsers([]);
                setTotalCount(0);
            })
            .finally(() => {
                const elapsed = Date.now() - fetchStartedAtRef.current;
                const finish = () => {
                    if (fetchSeq !== fetchSequenceRef.current) return;
                    hasLoadedRef.current = true;
                    setLoading(false);
                    setFetchingOrders(false);
                };
                if (!isInitialLoad && elapsed < MIN_PAGE_FETCH_FEEDBACK_MS) {
                    window.setTimeout(finish, MIN_PAGE_FETCH_FEEDBACK_MS - elapsed);
                    return;
                }
                finish();
            });
    }, [page, search, filterRole, filterStatus]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        return () => {
            if (filterTimerRef.current) window.clearTimeout(filterTimerRef.current);
        };
    }, []);

    const scheduleSearchCommit = useCallback(
        (nextSearch: string) => {
            preserveResultsHeight();
            setFiltering(true);
            if (filterTimerRef.current) window.clearTimeout(filterTimerRef.current);
            filterTimerRef.current = window.setTimeout(() => {
                setSearch(nextSearch);
                setPage(1);
                setFiltering(false);
                filterTimerRef.current = null;
            }, MIN_FILTER_COMMIT_MS);
        },
        [preserveResultsHeight],
    );

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

    const sorted = useMemo(() => {
        const rows = [...users];
        rows.sort((leftRow, rightRow) => {
            const left = (leftRow as Record<string, unknown>)[sortKey] ?? "";
            const right = (rightRow as Record<string, unknown>)[sortKey] ?? "";
            const compare = String(left).localeCompare(String(right), "vi");
            return sortDir === "asc" ? compare : -compare;
        });
        return rows;
    }, [users, sortKey, sortDir]);

    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDir((current) => (current === "asc" ? "desc" : "asc"));
            return;
        }
        setSortKey(key);
        setSortDir("asc");
    };

    const handleRoleChange = (value: string) => {
        preserveResultsHeight();
        setFilterRole(value);
        setPage(1);
    };

    const handleStatusChange = (value: string) => {
        preserveResultsHeight();
        setFilterStatus(value);
        setPage(1);
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
        exportXLSX(users, `users${suffix ? "_" + suffix : ""}_${new Date().toISOString().slice(0, 10)}.xlsx`);
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
        { key: "id", label: "ID", flex: "0.7fr" },
        { key: "fullName", label: "Người dùng", flex: "1.8fr" },
        { key: "email", label: "Email", flex: "2.1fr" },
        { key: "role", label: "Vai trò", flex: "1.1fr" },
        { key: "createdAt", label: "Ngày tạo", flex: "1fr" },
        { key: "status", label: "Trạng thái", flex: "1.1fr" },
    ];
    const gridCols = `${columns.map((column) => column.flex).join(" ")} 0.9fr`;
    const isSuspended = selected?.status === "Suspended";

    return (
        <div className="nb-page nb-font-vietnam flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                    <TopNavBar>
                        <AdminTopNavTitle title="Người dùng" />
                    </TopNavBar>

                    <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-6 nb-fade-in">
                        <section className="overflow-hidden rounded-[8px] border shadow-soft-sm" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}>
                            <div className="flex flex-col gap-4 border-b px-5 py-4 xl:flex-row xl:items-center xl:justify-between" style={{ borderColor: ADMIN_TONE.line }}>
                                <div>
                                    <h1 className="text-xl font-bold leading-tight text-slate-950">Danh sách người dùng</h1>
                                    <p className="mt-1 text-sm font-semibold text-slate-500">
                                        {loading ? "Đang tải dữ liệu" : `${totalCount.toLocaleString("vi-VN")} tài khoản · ${users.length.toLocaleString("vi-VN")} đang hiển thị`}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    {(fetchingOrders || filtering) && (
                                        <div className="inline-flex h-9 items-center gap-2 rounded-full border border-rose-100 bg-white px-3 text-xs font-bold text-rose-700 shadow-soft-sm">
                                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-rose-100 border-t-rose-700" />
                                            Đang tải
                                        </div>
                                    )}
                                    <button
                                        onClick={handleExport}
                                        disabled={users.length === 0}
                                        className="inline-flex h-9 items-center gap-2 rounded-full border px-4 text-[13px] font-bold transition-all disabled:opacity-40 hover:scale-[0.99]"
                                        style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.rose, color: "#FFFFFF" }}
                                    >
                                        <FileDown className="h-4 w-4" />
                                        Xuất Excel
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 border-b px-5 py-4 lg:flex-row lg:items-center lg:justify-between" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.soft }}>
                            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                                <label className="relative block w-full sm:max-w-[300px]">
                                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                    <input
                                        value={searchInput}
                                        onChange={(event) => {
                                            const val = event.target.value;
                                            setSearchInput(val);
                                            scheduleSearchCommit(val);
                                        }}
                                        placeholder="Tìm theo họ tên hoặc email..."
                                        className="h-10 w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-800 outline-none shadow-soft-xs transition-colors placeholder:text-slate-500 focus:border-rose-200 focus:ring-4 focus:ring-rose-50"
                                    />
                                </label>

                                <label className="relative block">
                                    <select
                                        value={filterRole}
                                        onChange={(event) => handleRoleChange(event.target.value)}
                                        className="h-10 min-w-[160px] appearance-none rounded-full border border-slate-200 bg-white py-0 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none shadow-soft-xs transition-colors focus:border-rose-200 focus:ring-4 focus:ring-rose-50"
                                    >
                                        <option value="all">Tất cả vai trò</option>
                                        <option value="Admin">Admin</option>
                                        <option value="School">QL Trường</option>
                                        <option value="Provider">NCC</option>
                                        <option value="Parent">Phụ huynh</option>
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-900" />
                                </label>

                                <label className="relative block">
                                    <select
                                        value={filterStatus}
                                        onChange={(event) => handleStatusChange(event.target.value)}
                                        className="h-10 min-w-[160px] appearance-none rounded-full border border-slate-200 bg-white py-0 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none shadow-soft-xs transition-colors focus:border-rose-200 focus:ring-4 focus:ring-rose-50"
                                    >
                                        <option value="all">Tất cả trạng thái</option>
                                        <option value="Active">Active</option>
                                        <option value="Suspended">InActive</option>
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-900" />
                                </label>

                            </div>
                        </div>

                        <div>
                            <div
                                className="sticky top-0 z-10 hidden lg:grid items-center border-b px-5 py-3"
                                style={{ gridTemplateColumns: gridCols, borderColor: ADMIN_TONE.line }}
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
                                <div className="text-right text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: ADMIN_TONE.muted }}>
                                    Hành động
                                </div>
                            </div>

                            <div ref={resultsRegionRef} style={preservedHeightStyle}>
                                {loading && (
                                    <div className="space-y-3 px-5 py-5">
                                        {Array.from({ length: 5 }).map((_, index) => (
                                            <div
                                                key={index}
                                                className="hidden lg:grid items-center gap-4 rounded-[8px] border px-4 py-3"
                                                style={{ gridTemplateColumns: gridCols, borderColor: ADMIN_TONE.line, background: ADMIN_TONE.soft }}
                                            >
                                                {Array.from({ length: 7 }).map((__, cellIndex) => (
                                                    <div
                                                        key={cellIndex}
                                                        className="h-5 rounded animate-pulse bg-rose-50"
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

                                {!loading && !error && users.length === 0 && (
                                    <AdminEmptyState
                                        title="Không tìm thấy người dùng"
                                        detail="Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc để xem lại toàn bộ danh sách."
                                        icon="📭"
                                        bg={ADMIN_TONE.amberSoft}
                                    />
                                )}

                                {!loading && !error && sorted.length > 0 && (
                                    <div>
                                        {sorted.map((user, index) => (
                                            <div
                                                key={user.id}
                                                className="hidden min-h-[58px] lg:grid items-center gap-4 border-b px-5 py-3 transition-colors hover:bg-rose-50 nb-fade-in"
                                                style={{
                                                    gridTemplateColumns: gridCols,
                                                    borderColor: ADMIN_TONE.line,
                                                    animationDelay: `${index * 30}ms`,
                                                }}
                                            >
                                                <div className="text-[13px] font-medium text-slate-700">{formatUserCode(user.id)}</div>
                                                <div className="flex min-w-0 items-center gap-3">
                                                    {user.avatarUrl ? (
                                                        <img src={user.avatarUrl} alt="" className="h-8 w-8 flex-shrink-0 rounded-[8px] object-cover" />
                                                    ) : (
                                                        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] bg-rose-50 text-[12px] font-bold text-rose-700">
                                                            {getInitials(user.fullName)}
                                                        </span>
                                                    )}
                                                    <span className="truncate text-[14px] font-medium text-gray-900">{user.fullName}</span>
                                                </div>
                                                <div className="truncate text-[14px] font-normal" style={{ color: "#3D384A" }}>
                                                    {user.email}
                                                </div>
                                                <div>
                                                    <CompactBadge bg={roleTone[user.role]?.bg} text={roleTone[user.role]?.text}>
                                                        {roleTone[user.role]?.label || user.role}
                                                    </CompactBadge>
                                                </div>
                                                <div className="text-[14px] font-medium" style={{ color: "#3D384A" }}>
                                                    {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                                                </div>
                                                <div>
                                                    <CompactBadge bg={statusTone[user.status]?.bg} text={statusTone[user.status]?.text}>
                                                        {statusTone[user.status]?.label || user.status}
                                                    </CompactBadge>
                                                </div>
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleViewDetail(user.id)}
                                                        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-white hover:text-rose-700"
                                                        title="Xem chi tiết"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleViewDetail(user.id)}
                                                        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-white hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                                                        title={user.status === "Suspended" ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                                                        disabled={user.role === "Admin"}
                                                    >
                                                        {user.status === "Suspended" ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        {sorted.map((user, index) => (
                                            <div
                                                key={`mobile-${user.id}`}
                                                className="lg:hidden border-b p-4 space-y-3 nb-fade-in"
                                                style={{ borderColor: ADMIN_TONE.line, animationDelay: `${index * 30}ms` }}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex min-w-0 gap-3">
                                                        {user.avatarUrl ? (
                                                            <img src={user.avatarUrl} alt="" className="h-10 w-10 flex-shrink-0 rounded-[8px] object-cover" />
                                                        ) : (
                                                            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[8px] bg-rose-50 text-[12px] font-bold text-rose-700">
                                                                {getInitials(user.fullName)}
                                                            </span>
                                                        )}
                                                        <div className="min-w-0">
                                                            <div className="text-[12px] font-medium text-slate-500">{formatUserCode(user.id)}</div>
                                                            <div className="truncate text-[15px] font-medium text-gray-900">{user.fullName}</div>
                                                            <div className="mt-0.5 truncate text-[13px] font-normal" style={{ color: "#3D384A" }}>
                                                                {user.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleViewDetail(user.id)}
                                                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border text-slate-700 transition-colors hover:text-rose-700"
                                                        style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}
                                                        title="Xem chi tiết"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <div className="flex flex-wrap gap-2">
                                                        <CompactBadge bg={roleTone[user.role]?.bg} text={roleTone[user.role]?.text}>
                                                            {roleTone[user.role]?.label || user.role}
                                                        </CompactBadge>
                                                        <CompactBadge bg={statusTone[user.status]?.bg} text={statusTone[user.status]?.text}>
                                                            {statusTone[user.status]?.label || user.status}
                                                        </CompactBadge>
                                                    </div>
                                                    <span className="text-[12px] font-medium" style={{ color: ADMIN_TONE.muted }}>
                                                        {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}

                                        <div
                                            className="flex flex-col gap-3 border-t px-5 py-4 md:flex-row md:items-center md:justify-between"
                                            style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.soft }}
                                        >
                                            <div className="text-[13px] font-bold" style={{ color: ADMIN_TONE.muted }}>
                                                Hiển thị {((page - 1) * PAGE_SIZE + 1).toLocaleString("vi-VN")}–{Math.min(page * PAGE_SIZE, totalCount).toLocaleString("vi-VN")} / {totalCount.toLocaleString("vi-VN")} tài khoản · Trang {page}/{totalPages}
                                            </div>
                                            {totalPages > 1 && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        disabled={page <= 1}
                                                        onClick={() => setPage((current) => current - 1)}
                                                        className="flex h-9 w-9 items-center justify-center rounded-full border transition-all disabled:opacity-40 hover:scale-[0.99]"
                                                        style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell, color: ADMIN_TONE.pageInk }}
                                                        title="Trang trước"
                                                    >
                                                        <ChevronLeft className="h-4 w-4" />
                                                    </button>
                                                    <span className="flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-[13px] font-bold" style={{ background: ADMIN_TONE.emeraldSoft, color: ADMIN_TONE.emerald }}>
                                                        {page}
                                                    </span>
                                                    <button
                                                        disabled={page >= totalPages}
                                                        onClick={() => setPage((current) => current + 1)}
                                                        className="flex h-9 w-9 items-center justify-center rounded-full border transition-all disabled:opacity-40 hover:scale-[0.99]"
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
                            </div>
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
                        className="w-full max-w-lg rounded-2xl border p-6 space-y-5 nb-modal-enter shadow-soft-sm"
                        style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}
                        onClick={(event) => event.stopPropagation()}
                    >
                        {detailLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-10 w-10 animate-spin text-rose-700" />
                            </div>
                        ) : (
                            selected && (
                                <>
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-[24px] font-bold" style={{ color: ADMIN_TONE.pageInk }}>
                                            Chi tiết người dùng
                                        </h2>
                                        <button
                                            onClick={() => setSelected(null)}
                                            className="flex h-10 w-10 items-center justify-center rounded-[8px] border text-[16px] font-bold transition-all hover:scale-[0.99]"
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
                                                <p className="mb-1 text-[12px] font-semibold uppercase tracking-wide" style={{ color: ADMIN_TONE.muted }}>
                                                    {item.label}
                                                </p>
                                                {item.badge ? (
                                                    <CompactBadge bg={item.badgeBg} text={item.badgeText}>
                                                        {item.badgeValue}
                                                    </CompactBadge>
                                                ) : (
                                                    <p className="text-[15px] font-normal text-gray-900">{item.value}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {selected.role !== "Admin" && (
                                        <button
                                            onClick={handleToggleBan}
                                            className="w-full rounded-[8px] border py-3 text-[15px] font-bold text-white transition-all hover:scale-[0.99]"
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
                                        className="w-full rounded-[8px] border py-3 text-[15px] font-bold transition-all hover:scale-[0.99]"
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
                    className="fixed right-6 top-6 z-[60] flex items-center gap-3 rounded-[8px] border px-5 py-4 text-[15px] font-bold nb-fade-in shadow-soft-md"
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
