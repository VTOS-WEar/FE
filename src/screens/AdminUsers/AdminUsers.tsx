import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { DashboardSidebar } from "../../components/layout";
import { useAdminSidebarConfig } from "../../hooks/useAdminSidebarConfig";
import { getUsers, getUserDetail, approveUser, suspendUser, type UserDto, type UserDetailDto } from "../../lib/api/admin";

const statusBadgeClass: Record<string, string> = {
    Active: "nb-badge nb-badge-green",
    Pending: "nb-badge nb-badge-yellow",
    Suspended: "nb-badge nb-badge-red",
    Inactive: "nb-badge text-[#6B7280] bg-[#F3F4F6]",
};
const roleBadgeClass: Record<string, string> = {
    Admin: "nb-badge nb-badge-purple",
    Parent: "nb-badge nb-badge-blue",
    School: "nb-badge nb-badge-yellow",
    Provider: "nb-badge nb-badge-green",
};

export const AdminUsers = (): JSX.Element => {
    const navigate = useNavigate();
    const sidebarConfig = useAdminSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<UserDto[]>([]);
    const [search, setSearch] = useState("");
    const [filterRole, setFilterRole] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [selected, setSelected] = useState<UserDetailDto | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [page, setPage] = useState(1);
    const pageSize = 15;

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try { setUsers(await getUsers()); } catch { setUsers([]); }
        finally { setLoading(false); }
    }, []);
    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const filtered = users.filter(u => {
        const matchSearch = !search || u.fullName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
        const matchRole = !filterRole || u.role === filterRole;
        const matchStatus = !filterStatus || u.status === filterStatus;
        return matchSearch && matchRole && matchStatus;
    });
    const totalPages = Math.ceil(filtered.length / pageSize);
    const paginatedUsers = filtered.slice((page - 1) * pageSize, page * pageSize);

    const handleViewDetail = async (id: string) => {
        setDetailLoading(true);
        try { setSelected(await getUserDetail(id)); } catch { /* */ }
        finally { setDetailLoading(false); }
    };

    const handleToggleBan = async () => {
        if (!selected) return;
        setActionLoading(true);
        try {
            if (selected.status === "Suspended" || selected.status === "Inactive") await approveUser(selected.id);
            else await suspendUser(selected.id);
            setSelected(null); await fetchUsers();
        } catch { /* */ }
        finally { setActionLoading(false); }
    };

    const handleLogout = () => {
        localStorage.removeItem("access_token"); localStorage.removeItem("user"); localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token"); sessionStorage.removeItem("user"); sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    const isBanned = selected?.status === "Suspended" || selected?.status === "Inactive";

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="nb-breadcrumb-bar">
                        <Breadcrumb><BreadcrumbList>
                            <BreadcrumbItem><BreadcrumbLink href="/admin/dashboard" className="font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                            <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                            <BreadcrumbItem><BreadcrumbPage className="font-bold text-[#1A1A2E] text-base">Quản lý người dùng</BreadcrumbPage></BreadcrumbItem>
                        </BreadcrumbList></Breadcrumb>
                    </div>
                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6 nb-fade-in">
                        <h1 className="font-extrabold text-[#1A1A2E] text-[28px] leading-tight">👥 Quản lý người dùng</h1>

                        {/* Filters */}
                        <div className="nb-card-static p-4 flex flex-wrap gap-3">
                            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="🔍 Tìm theo tên, email..."
                                className="nb-input w-64 py-2.5 text-sm" />
                            <select value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(1); }} className="nb-select text-sm">
                                <option value="">Tất cả vai trò</option>
                                <option value="Parent">Phụ huynh</option>
                                <option value="School">Quản lý trường</option>
                                <option value="Provider">Nhà cung cấp</option>
                                <option value="Admin">Quản trị viên</option>
                            </select>
                            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className="nb-select text-sm">
                                <option value="">Tất cả trạng thái</option>
                                <option value="Active">Hoạt động</option>
                                <option value="Pending">Chờ duyệt</option>
                                <option value="Suspended">Bị khoá</option>
                            </select>
                        </div>

                        {/* Table */}
                        <div className="nb-card-static overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className={`nb-table ${!loading && filtered.length > 0 ? "nb-table-animate" : ""}`}>
                                    <thead>
                                        <tr>
                                            <th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th><th>Ngày tạo</th><th className="text-center">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i}>
                                                {Array.from({ length: 6 }).map((_, j) => <td key={j}><div className="h-4 bg-gray-200 rounded w-20 animate-pulse" /></td>)}
                                            </tr>
                                        )) : filtered.length === 0 ? (
                                            <tr><td colSpan={6} className="text-center py-12 text-[#9CA3AF]">Không tìm thấy người dùng nào</td></tr>
                                        ) : paginatedUsers.map(u => (
                                            <tr key={u.id}>
                                                <td className="font-semibold text-[#1A1A2E]">{u.fullName}</td>
                                                <td className="text-[#4c5769]">{u.email}</td>
                                                <td><span className={roleBadgeClass[u.role] || "nb-badge"}>{u.role}</span></td>
                                                <td><span className={statusBadgeClass[u.status] || "nb-badge"}>{u.status}</span></td>
                                                <td className="text-[#6B7280]">{new Date(u.createdAt).toLocaleDateString("vi")}</td>
                                                <td className="text-center">
                                                    <button onClick={() => handleViewDetail(u.id)} className="nb-btn-outline text-xs py-1.5 px-3">👁 Chi tiết</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="px-6 py-3 bg-[#F9FAFB] border-t-2 border-[#1A1A2E] text-xs text-[#6B7280] font-semibold flex items-center justify-between">
                                <span>Hiển thị {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} / {filtered.length} người dùng</span>
                                {totalPages > 1 && (
                                    <div className="flex items-center gap-2">
                                        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="nb-btn nb-btn-outline nb-btn-sm text-xs">← Trước</button>
                                        <span className="font-bold px-2">{page}/{totalPages}</span>
                                        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="nb-btn nb-btn-outline nb-btn-sm text-xs">Sau →</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* Detail Modal - Neubrutalism */}
            {(selected || detailLoading) && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 nb-backdrop-enter" onClick={() => !detailLoading && setSelected(null)}>
                    <div className="bg-white rounded-xl w-full max-w-lg p-6 space-y-5 border-2 border-[#1A1A2E] shadow-[6px_6px_0_#1A1A2E] nb-modal-enter" onClick={e => e.stopPropagation()}>
                        {detailLoading ? (
                            <div className="flex items-center justify-center py-12"><div className="animate-spin w-8 h-8 border-[3px] border-[#6938EF] border-t-transparent rounded-full" /></div>
                        ) : selected && (
                            <>
                                <div className="flex justify-between items-center">
                                    <h2 className="font-extrabold text-lg text-[#1A1A2E]">Chi tiết người dùng</h2>
                                    <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-[#1A1A2E] hover:bg-[#F3F4F6] text-[#1A1A2E] font-bold">✕</button>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><p className="font-bold text-[#9CA3AF] text-xs uppercase mb-1">Họ tên</p><p className="font-semibold text-[#1A1A2E]">{selected.fullName}</p></div>
                                    <div><p className="font-bold text-[#9CA3AF] text-xs uppercase mb-1">Email</p><p className="font-semibold text-[#1A1A2E]">{selected.email}</p></div>
                                    <div><p className="font-bold text-[#9CA3AF] text-xs uppercase mb-1">Số điện thoại</p><p className="font-semibold text-[#1A1A2E]">{selected.phone || "—"}</p></div>
                                    <div><p className="font-bold text-[#9CA3AF] text-xs uppercase mb-1">Vai trò</p><span className={roleBadgeClass[selected.role] || "nb-badge"}>{selected.role}</span></div>
                                    <div><p className="font-bold text-[#9CA3AF] text-xs uppercase mb-1">Trạng thái</p><span className={statusBadgeClass[selected.status] || "nb-badge"}>{selected.status}</span></div>
                                    <div><p className="font-bold text-[#9CA3AF] text-xs uppercase mb-1">Ngày tạo</p><p className="font-semibold text-[#1A1A2E]">{new Date(selected.createdAt).toLocaleDateString("vi")}</p></div>
                                    {selected.schoolName && <div><p className="font-bold text-[#9CA3AF] text-xs uppercase mb-1">Trường</p><p className="font-semibold text-[#1A1A2E]">{selected.schoolName}</p></div>}
                                    {selected.providerName && <div><p className="font-bold text-[#9CA3AF] text-xs uppercase mb-1">Nhà cung cấp</p><p className="font-semibold text-[#1A1A2E]">{selected.providerName}</p></div>}
                                    {selected.lastLogin && <div><p className="font-bold text-[#9CA3AF] text-xs uppercase mb-1">Đăng nhập cuối</p><p className="font-semibold text-[#1A1A2E]">{new Date(selected.lastLogin).toLocaleString("vi")}</p></div>}
                                </div>
                                {selected.role !== "Admin" && (
                                    <button onClick={handleToggleBan} disabled={actionLoading}
                                        className={`w-full py-2.5 rounded-xl font-bold text-sm border-2 border-[#1A1A2E] shadow-[3px_3px_0_#1A1A2E] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-50 ${
                                            isBanned ? "bg-[#10B981] text-white" : "bg-[#EF4444] text-white"
                                        }`}>
                                        {actionLoading ? "Đang xử lý..." : isBanned ? "🔓 Mở khoá tài khoản" : "🔒 Khoá tài khoản"}
                                    </button>
                                )}
                                <button onClick={() => setSelected(null)} className="nb-btn-outline w-full py-2.5 text-sm font-bold">Đóng</button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
