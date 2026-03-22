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

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try { setUsers(await getUsers()); } catch { setUsers([]); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    // Client-side filtering
    const filtered = users.filter(u => {
        const matchSearch = !search || u.fullName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
        const matchRole = !filterRole || u.role === filterRole;
        const matchStatus = !filterStatus || u.status === filterStatus;
        return matchSearch && matchRole && matchStatus;
    });

    const handleViewDetail = async (id: string) => {
        setDetailLoading(true);
        try { setSelected(await getUserDetail(id)); } catch { /* */ }
        finally { setDetailLoading(false); }
    };

    const handleToggleBan = async () => {
        if (!selected) return;
        setActionLoading(true);
        try {
            if (selected.status === "Suspended" || selected.status === "Inactive") {
                await approveUser(selected.id);
            } else {
                await suspendUser(selected.id);
            }
            setSelected(null);
            await fetchUsers();
        } catch { /* */ }
        finally { setActionLoading(false); }
    };

    const handleLogout = () => {
        localStorage.removeItem("access_token"); localStorage.removeItem("user"); localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token"); sessionStorage.removeItem("user"); sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    const statusBadge = (status: string) => {
        const map: Record<string, string> = {
            Active: "bg-[#D1FAE5] text-[#065F46]",
            Pending: "bg-[#FEF3C7] text-[#92400E]",
            Suspended: "bg-[#FEE2E2] text-[#991B1B]",
            Inactive: "bg-[#F3F4F6] text-[#6B7280]",
        };
        return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${map[status] || "bg-gray-100"}`}>{status}</span>;
    };

    const roleBadge = (role: string) => {
        const map: Record<string, string> = {
            Admin: "bg-[#EDE9FE] text-[#5B21B6]",
            Parent: "bg-[#DBEAFE] text-[#1E40AF]",
            School: "bg-[#FEF3C7] text-[#92400E]",
            Provider: "bg-[#D1FAE5] text-[#065F46]",
        };
        return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${map[role] || "bg-gray-100"}`}>{role}</span>;
    };

    const isBanned = selected?.status === "Suspended" || selected?.status === "Inactive";

    return (
        <div className="bg-[#f6f7f8] w-full min-h-screen flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[20rem] xl:w-[23.75rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="bg-white border-b border-[#cbcad7] px-6 lg:px-10 py-5">
                        <Breadcrumb><BreadcrumbList>
                            <BreadcrumbItem><BreadcrumbLink href="/admin/dashboard" className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                            <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                            <BreadcrumbItem><BreadcrumbPage className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4c5769] text-base">Quản lý người dùng</BreadcrumbPage></BreadcrumbItem>
                        </BreadcrumbList></Breadcrumb>
                    </div>
                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6">
                        <h1 className="[font-family:'Montserrat',Helvetica] font-bold text-black text-[28px]">👥 Quản lý người dùng</h1>

                        {/* Filters */}
                        <div className="flex flex-wrap gap-3">
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Tìm theo tên, email..."
                                className="border border-[#CBCAD7] rounded-xl px-4 py-2.5 text-sm w-64 [font-family:'Montserrat',Helvetica] focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30" />
                            <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
                                className="border border-[#CBCAD7] rounded-xl px-4 py-2.5 text-sm [font-family:'Montserrat',Helvetica] focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30">
                                <option value="">Tất cả vai trò</option>
                                <option value="Parent">Phụ huynh</option>
                                <option value="School">Quản lý trường</option>
                                <option value="Provider">Nhà cung cấp</option>
                                <option value="Admin">Quản trị viên</option>
                            </select>
                            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                                className="border border-[#CBCAD7] rounded-xl px-4 py-2.5 text-sm [font-family:'Montserrat',Helvetica] focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30">
                                <option value="">Tất cả trạng thái</option>
                                <option value="Active">Hoạt động</option>
                                <option value="Pending">Chờ duyệt</option>
                                <option value="Suspended">Bị khoá</option>
                            </select>
                        </div>

                        {/* Table */}
                        <div className="bg-white border border-[#CBCAD7] rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm [font-family:'Montserrat',Helvetica]">
                                    <thead>
                                        <tr className="bg-[#F9FAFB] border-b border-[#CBCAD7]">
                                            <th className="text-left px-6 py-3 font-semibold text-[#6B7280]">Họ tên</th>
                                            <th className="text-left px-6 py-3 font-semibold text-[#6B7280]">Email</th>
                                            <th className="text-left px-6 py-3 font-semibold text-[#6B7280]">Vai trò</th>
                                            <th className="text-left px-6 py-3 font-semibold text-[#6B7280]">Trạng thái</th>
                                            <th className="text-left px-6 py-3 font-semibold text-[#6B7280]">Ngày tạo</th>
                                            <th className="text-center px-6 py-3 font-semibold text-[#6B7280]">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i} className="border-b border-gray-100 animate-pulse">
                                                {Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20" /></td>)}
                                            </tr>
                                        )) : filtered.length === 0 ? (
                                            <tr><td colSpan={6} className="text-center py-12 text-[#9CA3AF]">Không tìm thấy người dùng nào</td></tr>
                                        ) : filtered.map(u => (
                                            <tr key={u.id} className="border-b border-gray-100 hover:bg-[#F9FAFB] transition-colors">
                                                <td className="px-6 py-4 font-semibold text-[#1A1A2E]">{u.fullName}</td>
                                                <td className="px-6 py-4 text-[#4c5769]">{u.email}</td>
                                                <td className="px-6 py-4">{roleBadge(u.role)}</td>
                                                <td className="px-6 py-4">{statusBadge(u.status)}</td>
                                                <td className="px-6 py-4 text-[#6B7280]">{new Date(u.createdAt).toLocaleDateString("vi")}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <button onClick={() => handleViewDetail(u.id)}
                                                        className="px-3 py-1.5 text-xs font-semibold border border-[#CBCAD7] rounded-lg hover:bg-gray-50 transition-colors">
                                                        👁 Chi tiết
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="px-6 py-3 bg-[#F9FAFB] border-t border-[#CBCAD7] text-xs text-[#6B7280] [font-family:'Montserrat',Helvetica]">
                                Hiển thị {filtered.length} / {users.length} người dùng
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* Detail Modal */}
            {(selected || detailLoading) && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => !detailLoading && setSelected(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-xl" onClick={e => e.stopPropagation()}>
                        {detailLoading ? (
                            <div className="flex items-center justify-center py-12"><div className="animate-spin w-8 h-8 border-3 border-[#6366F1] border-t-transparent rounded-full" /></div>
                        ) : selected && (
                            <>
                                <div className="flex justify-between items-center">
                                    <h2 className="[font-family:'Montserrat',Helvetica] font-bold text-lg">Chi tiết người dùng</h2>
                                    <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm [font-family:'Montserrat',Helvetica]">
                                    <div><p className="font-medium text-[#6B7280] text-xs uppercase mb-1">Họ tên</p><p className="font-semibold text-[#1A1A2E]">{selected.fullName}</p></div>
                                    <div><p className="font-medium text-[#6B7280] text-xs uppercase mb-1">Email</p><p className="font-semibold text-[#1A1A2E]">{selected.email}</p></div>
                                    <div><p className="font-medium text-[#6B7280] text-xs uppercase mb-1">Số điện thoại</p><p className="font-semibold text-[#1A1A2E]">{selected.phone || "—"}</p></div>
                                    <div><p className="font-medium text-[#6B7280] text-xs uppercase mb-1">Vai trò</p>{roleBadge(selected.role)}</div>
                                    <div><p className="font-medium text-[#6B7280] text-xs uppercase mb-1">Trạng thái</p>{statusBadge(selected.status)}</div>
                                    <div><p className="font-medium text-[#6B7280] text-xs uppercase mb-1">Ngày tạo</p><p className="font-semibold text-[#1A1A2E]">{new Date(selected.createdAt).toLocaleDateString("vi")}</p></div>
                                    {selected.schoolName && <div><p className="font-medium text-[#6B7280] text-xs uppercase mb-1">Trường</p><p className="font-semibold text-[#1A1A2E]">{selected.schoolName}</p></div>}
                                    {selected.providerName && <div><p className="font-medium text-[#6B7280] text-xs uppercase mb-1">Nhà cung cấp</p><p className="font-semibold text-[#1A1A2E]">{selected.providerName}</p></div>}
                                    {selected.lastLogin && <div><p className="font-medium text-[#6B7280] text-xs uppercase mb-1">Đăng nhập cuối</p><p className="font-semibold text-[#1A1A2E]">{new Date(selected.lastLogin).toLocaleString("vi")}</p></div>}
                                </div>

                                {/* Ban/Unban button */}
                                {selected.role !== "Admin" && (
                                    <button onClick={handleToggleBan} disabled={actionLoading}
                                        className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 [font-family:'Montserrat',Helvetica] ${
                                            isBanned
                                                ? "bg-[#10B981] text-white hover:bg-[#059669]"
                                                : "bg-[#EF4444] text-white hover:bg-[#DC2626]"
                                        }`}>
                                        {actionLoading ? "Đang xử lý..." : isBanned ? "🔓 Mở khoá tài khoản" : "🔒 Khoá tài khoản"}
                                    </button>
                                )}
                                <button onClick={() => setSelected(null)}
                                    className="w-full border border-[#CBCAD7] py-2.5 rounded-xl font-semibold hover:bg-gray-50 text-sm [font-family:'Montserrat',Helvetica]">
                                    Đóng
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
