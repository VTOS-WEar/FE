import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { DashboardSidebar } from "../../components/layout";
import { useAdminSidebarConfig } from "../../hooks/useAdminSidebarConfig";
import {
    getAccountRequests, getAccountRequestDetail,
    createAccountForRequest, rejectAccountRequest,
    type AccountRequestListItem, type AccountRequestDetail,
} from "../../lib/api/accountRequests";

export const AdminAccountRequests = (): JSX.Element => {
    const navigate = useNavigate();
    const sidebarConfig = useAdminSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<AccountRequestListItem[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [filterStatus, setFilterStatus] = useState<number | undefined>(undefined);
    const [filterType, setFilterType] = useState<number | undefined>(undefined);

    // Detail / action modal
    const [selected, setSelected] = useState<AccountRequestDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [actionMode, setActionMode] = useState<"" | "approve" | "reject">("");
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState("");

    // Create account form fields
    const [createEmail, setCreateEmail] = useState("");
    const [createName, setCreateName] = useState("");
    const [createPhone, setCreatePhone] = useState("");
    const [rejectReason, setRejectReason] = useState("");

    const pageSize = 15;

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAccountRequests({
                page,
                pageSize,
                status: filterStatus,
                type: filterType,
            });
            setItems(res.items);
            setTotalCount(res.totalCount);
        } catch { setItems([]); setTotalCount(0); }
        finally { setLoading(false); }
    }, [page, filterStatus, filterType]);

    useEffect(() => { fetchList(); }, [fetchList]);

    const handleViewDetail = async (id: string) => {
        setDetailLoading(true);
        setActionMode("");
        setActionError("");
        try { setSelected(await getAccountRequestDetail(id)); } catch { /* */ }
        finally { setDetailLoading(false); }
    };

    const handleApprove = async () => {
        if (!selected) return;
        if (!createEmail.trim() || !createName.trim()) {
            setActionError("Vui lòng nhập email và họ tên.");
            return;
        }
        setActionLoading(true);
        setActionError("");
        try {
            await createAccountForRequest(selected.id, {
                email: createEmail.trim(),
                fullName: createName.trim(),
                phone: createPhone.trim() || undefined,
            });
            setSelected(null);
            setActionMode("");
            await fetchList();
        } catch (err: any) {
            setActionError(err?.message || "Tạo tài khoản thất bại.");
        } finally { setActionLoading(false); }
    };

    const handleReject = async () => {
        if (!selected) return;
        if (!rejectReason.trim()) {
            setActionError("Vui lòng nhập lý do từ chối.");
            return;
        }
        setActionLoading(true);
        setActionError("");
        try {
            await rejectAccountRequest(selected.id, rejectReason.trim());
            setSelected(null);
            setActionMode("");
            await fetchList();
        } catch (err: any) {
            setActionError(err?.message || "Từ chối thất bại.");
        } finally { setActionLoading(false); }
    };

    const closeModal = () => {
        setSelected(null);
        setActionMode("");
        setActionError("");
        setCreateEmail("");
        setCreateName("");
        setCreatePhone("");
        setRejectReason("");
    };

    const handleLogout = () => {
        localStorage.removeItem("access_token"); localStorage.removeItem("user"); localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token"); sessionStorage.removeItem("user"); sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    const statusBadge = (status: string) => {
        const map: Record<string, string> = {
            Pending: "bg-[#FEF3C7] text-[#92400E]",
            Approved: "bg-[#D1FAE5] text-[#065F46]",
            Rejected: "bg-[#FEE2E2] text-[#991B1B]",
        };
        const labels: Record<string, string> = {
            Pending: "Chờ xử lý",
            Approved: "Đã duyệt",
            Rejected: "Đã từ chối",
        };
        return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${map[status] || "bg-gray-100"}`}>{labels[status] || status}</span>;
    };

    const typeBadge = (type: string) => {
        const map: Record<string, string> = {
            School: "bg-[#DBEAFE] text-[#1E40AF]",
            Provider: "bg-[#FEF3C7] text-[#92400E]",
        };
        const labels: Record<string, string> = {
            School: "🏫 Trường học",
            Provider: "🏭 Nhà cung cấp",
        };
        return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${map[type] || "bg-gray-100"}`}>{labels[type] || type}</span>;
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="nb-breadcrumb-bar px-6 lg:px-10 py-5">
                        <Breadcrumb><BreadcrumbList>
                            <BreadcrumbItem><BreadcrumbLink href="/admin/dashboard" className="font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                            <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                            <BreadcrumbItem><BreadcrumbPage className="font-semibold text-[#4c5769] text-base">Yêu cầu hợp tác</BreadcrumbPage></BreadcrumbItem>
                        </BreadcrumbList></Breadcrumb>
                    </div>
                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6">
                        <h1 className="font-bold text-black text-[28px]">📋 Yêu cầu hợp tác</h1>

                        {/* Filters */}
                        <div className="flex flex-wrap gap-3">
                            <select
                                value={filterStatus ?? ""}
                                onChange={e => { setFilterStatus(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
                                className="border border-[#CBCAD7] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30"
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="1">Chờ xử lý</option>
                                <option value="2">Đã duyệt</option>
                                <option value="3">Đã từ chối</option>
                            </select>
                            <select
                                value={filterType ?? ""}
                                onChange={e => { setFilterType(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
                                className="border border-[#CBCAD7] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30"
                            >
                                <option value="">Tất cả loại</option>
                                <option value="1">🏫 Trường học</option>
                                <option value="2">🏭 Nhà cung cấp</option>
                            </select>
                        </div>

                        {/* Table */}
                        <div className="bg-white border border-[#CBCAD7] rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm ">
                                    <thead>
                                        <tr className="bg-[#F9FAFB] border-b border-[#CBCAD7]">
                                            <th className="text-left px-6 py-3 font-semibold text-[#6B7280]">Tên tổ chức</th>
                                            <th className="text-left px-6 py-3 font-semibold text-[#6B7280]">Email</th>
                                            <th className="text-left px-6 py-3 font-semibold text-[#6B7280]">SĐT</th>
                                            <th className="text-left px-6 py-3 font-semibold text-[#6B7280]">Loại</th>
                                            <th className="text-left px-6 py-3 font-semibold text-[#6B7280]">Trạng thái</th>
                                            <th className="text-left px-6 py-3 font-semibold text-[#6B7280]">Ngày gửi</th>
                                            <th className="text-center px-6 py-3 font-semibold text-[#6B7280]">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i} className="border-b border-gray-100 animate-pulse">
                                                {Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20" /></td>)}
                                            </tr>
                                        )) : items.length === 0 ? (
                                            <tr><td colSpan={7} className="text-center py-12 text-[#9CA3AF]">Chưa có yêu cầu nào</td></tr>
                                        ) : items.map(item => (
                                            <tr key={item.id} className="border-b border-gray-100 hover:bg-[#F9FAFB] transition-colors">
                                                <td className="px-6 py-4 font-semibold text-[#1A1A2E]">{item.organizationName}</td>
                                                <td className="px-6 py-4 text-[#4c5769]">{item.contactEmail}</td>
                                                <td className="px-6 py-4 text-[#4c5769]">{item.contactPhone}</td>
                                                <td className="px-6 py-4">{typeBadge(item.type)}</td>
                                                <td className="px-6 py-4">{statusBadge(item.status)}</td>
                                                <td className="px-6 py-4 text-[#6B7280]">{new Date(item.createdAt).toLocaleDateString("vi")}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <button onClick={() => handleViewDetail(item.id)}
                                                        className="px-3 py-1.5 text-xs font-semibold border border-[#CBCAD7] rounded-lg hover:bg-gray-50 transition-colors">
                                                        👁 Chi tiết
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="px-6 py-3 bg-[#F9FAFB] border-t border-[#CBCAD7] flex justify-between items-center text-xs text-[#6B7280] ">
                                <span>Hiển thị {items.length} / {totalCount} yêu cầu</span>
                                {totalPages > 1 && (
                                    <div className="flex gap-1">
                                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                                            className="px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-40">←</button>
                                        <span className="px-3 py-1">{page} / {totalPages}</span>
                                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                                            className="px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-40">→</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* Detail / Action Modal */}
            {(selected || detailLoading) && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => !detailLoading && !actionLoading && closeModal()}>
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        {detailLoading ? (
                            <div className="flex items-center justify-center py-12"><div className="animate-spin w-8 h-8 border-3 border-[#6366F1] border-t-transparent rounded-full" /></div>
                        ) : selected && (
                            <>
                                <div className="flex justify-between items-center">
                                    <h2 className="font-bold text-lg">Chi tiết yêu cầu</h2>
                                    <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm ">
                                    <div><p className="font-medium text-[#6B7280] text-xs uppercase mb-1">Tổ chức</p><p className="font-semibold text-[#1A1A2E]">{selected.organizationName}</p></div>
                                    <div><p className="font-medium text-[#6B7280] text-xs uppercase mb-1">Loại</p>{typeBadge(selected.type)}</div>
                                    <div><p className="font-medium text-[#6B7280] text-xs uppercase mb-1">Email</p><p className="font-semibold text-[#1A1A2E]">{selected.contactEmail}</p></div>
                                    <div><p className="font-medium text-[#6B7280] text-xs uppercase mb-1">SĐT</p><p className="font-semibold text-[#1A1A2E]">{selected.contactPhone}</p></div>
                                    <div><p className="font-medium text-[#6B7280] text-xs uppercase mb-1">Trạng thái</p>{statusBadge(selected.status)}</div>
                                    <div><p className="font-medium text-[#6B7280] text-xs uppercase mb-1">Ngày gửi</p><p className="font-semibold text-[#1A1A2E]">{new Date(selected.createdAt).toLocaleString("vi")}</p></div>
                                    {selected.address && <div className="col-span-2"><p className="font-medium text-[#6B7280] text-xs uppercase mb-1">Địa chỉ</p><p className="font-semibold text-[#1A1A2E]">{selected.address}</p></div>}
                                    {selected.description && <div className="col-span-2"><p className="font-medium text-[#6B7280] text-xs uppercase mb-1">Mô tả</p><p className="font-semibold text-[#1A1A2E]">{selected.description}</p></div>}
                                    {selected.rejectionReason && <div className="col-span-2"><p className="font-medium text-[#6B7280] text-xs uppercase mb-1">Lý do từ chối</p><p className="font-semibold text-red-600">{selected.rejectionReason}</p></div>}
                                    {selected.processedByName && <div><p className="font-medium text-[#6B7280] text-xs uppercase mb-1">Xử lý bởi</p><p className="font-semibold text-[#1A1A2E]">{selected.processedByName}</p></div>}
                                    {selected.processedAt && <div><p className="font-medium text-[#6B7280] text-xs uppercase mb-1">Ngày xử lý</p><p className="font-semibold text-[#1A1A2E]">{new Date(selected.processedAt).toLocaleString("vi")}</p></div>}
                                </div>

                                {/* Action buttons (only for Pending) */}
                                {selected.status === "Pending" && !actionMode && (
                                    <div className="flex gap-3">
                                        <button onClick={() => { setActionMode("approve"); setCreateEmail(selected.contactEmail); setCreateName(selected.organizationName); }}
                                            className="flex-1 bg-[#10B981] text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-[#059669] transition-colors ">
                                            ✅ Tạo tài khoản
                                        </button>
                                        <button onClick={() => setActionMode("reject")}
                                            className="flex-1 bg-[#EF4444] text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-[#DC2626] transition-colors ">
                                            ❌ Từ chối
                                        </button>
                                    </div>
                                )}

                                {/* Approve form */}
                                {actionMode === "approve" && (
                                    <div className="bg-[#F0FDF4] p-4 rounded-xl space-y-3 border border-[#BBF7D0]">
                                        <h3 className="font-bold text-sm text-[#065F46] ">Tạo tài khoản mới</h3>
                                        <input value={createEmail} onChange={e => setCreateEmail(e.target.value)} placeholder="Email đăng nhập *"
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/30" />
                                        <input value={createName} onChange={e => setCreateName(e.target.value)} placeholder="Họ tên đầy đủ *"
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/30" />
                                        <input value={createPhone} onChange={e => setCreatePhone(e.target.value)} placeholder="Số điện thoại (tuỳ chọn)"
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/30" />
                                        <p className="text-xs text-[#6B7280]">Mật khẩu tạm thời sẽ được gửi qua email cho người dùng.</p>
                                        {actionError && <p className="text-xs text-red-600">{actionError}</p>}
                                        <div className="flex gap-2">
                                            <button onClick={handleApprove} disabled={actionLoading}
                                                className="flex-1 bg-[#10B981] text-white py-2 rounded-lg font-semibold text-sm hover:bg-[#059669] disabled:opacity-50 transition-colors">
                                                {actionLoading ? "Đang tạo..." : "Xác nhận tạo"}
                                            </button>
                                            <button onClick={() => { setActionMode(""); setActionError(""); }}
                                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">Huỷ</button>
                                        </div>
                                    </div>
                                )}

                                {/* Reject form */}
                                {actionMode === "reject" && (
                                    <div className="bg-[#FEF2F2] p-4 rounded-xl space-y-3 border border-[#FECACA]">
                                        <h3 className="font-bold text-sm text-[#991B1B] ">Từ chối yêu cầu</h3>
                                        <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Lý do từ chối *"
                                            rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#EF4444]/30 resize-none" />
                                        {actionError && <p className="text-xs text-red-600">{actionError}</p>}
                                        <div className="flex gap-2">
                                            <button onClick={handleReject} disabled={actionLoading}
                                                className="flex-1 bg-[#EF4444] text-white py-2 rounded-lg font-semibold text-sm hover:bg-[#DC2626] disabled:opacity-50 transition-colors">
                                                {actionLoading ? "Đang xử lý..." : "Xác nhận từ chối"}
                                            </button>
                                            <button onClick={() => { setActionMode(""); setActionError(""); }}
                                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">Huỷ</button>
                                        </div>
                                    </div>
                                )}

                                <button onClick={closeModal}
                                    className="w-full border border-[#CBCAD7] py-2.5 rounded-xl font-semibold hover:bg-gray-50 text-sm ">
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

export default AdminAccountRequests;
