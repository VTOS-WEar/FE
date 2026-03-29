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

const STATUS_BADGE: Record<string, string> = {
    Pending: "nb-badge nb-badge-yellow",
    Approved: "nb-badge nb-badge-green",
    Rejected: "nb-badge nb-badge-red",
};
const STATUS_LABEL: Record<string, string> = {
    Pending: "Chờ xử lý",
    Approved: "Đã duyệt",
    Rejected: "Đã từ chối",
};
const TYPE_BADGE: Record<string, string> = {
    School: "nb-badge nb-badge-blue",
    Provider: "nb-badge nb-badge-yellow",
};
const TYPE_LABEL: Record<string, string> = {
    School: "🏫 Trường học",
    Provider: "🏭 Nhà cung cấp",
};

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

    const totalPages = Math.ceil(totalCount / pageSize);

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
                            <BreadcrumbItem><BreadcrumbPage className="font-bold text-[#1A1A2E] text-base">Yêu cầu hợp tác</BreadcrumbPage></BreadcrumbItem>
                        </BreadcrumbList></Breadcrumb>
                    </div>
                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6 nb-fade-in">
                        <h1 className="font-extrabold text-[#1A1A2E] text-[28px] leading-tight">📋 Yêu cầu hợp tác</h1>

                        {/* Filters — NB selects */}
                        <div className="nb-card-static p-4 flex flex-wrap gap-3">
                            <select
                                value={filterStatus ?? ""}
                                onChange={e => { setFilterStatus(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
                                className="nb-select text-sm"
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="1">Chờ xử lý</option>
                                <option value="2">Đã duyệt</option>
                                <option value="3">Đã từ chối</option>
                            </select>
                            <select
                                value={filterType ?? ""}
                                onChange={e => { setFilterType(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
                                className="nb-select text-sm"
                            >
                                <option value="">Tất cả loại</option>
                                <option value="1">🏫 Trường học</option>
                                <option value="2">🏭 Nhà cung cấp</option>
                            </select>
                        </div>

                        {/* Table — NB table */}
                        <div className="nb-card-static overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className={`nb-table ${!loading && items.length > 0 ? "nb-table-animate" : ""}`}>
                                    <thead>
                                        <tr>
                                            <th>Tên tổ chức</th>
                                            <th>Email</th>
                                            <th>SĐT</th>
                                            <th>Loại</th>
                                            <th>Trạng thái</th>
                                            <th>Ngày gửi</th>
                                            <th className="text-center">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i}>
                                                {Array.from({ length: 7 }).map((_, j) => <td key={j}><div className="h-4 bg-gray-200 rounded w-20 animate-pulse" /></td>)}
                                            </tr>
                                        )) : items.length === 0 ? (
                                            <tr><td colSpan={7} className="text-center py-12 text-[#9CA3AF]">Chưa có yêu cầu nào</td></tr>
                                        ) : items.map(item => (
                                            <tr key={item.id}>
                                                <td className="font-semibold text-[#1A1A2E]">{item.organizationName}</td>
                                                <td className="text-[#4c5769]">{item.contactEmail}</td>
                                                <td className="text-[#4c5769]">{item.contactPhone}</td>
                                                <td><span className={TYPE_BADGE[item.type] || "nb-badge"}>{TYPE_LABEL[item.type] || item.type}</span></td>
                                                <td><span className={STATUS_BADGE[item.status] || "nb-badge"}>{STATUS_LABEL[item.status] || item.status}</span></td>
                                                <td className="text-[#6B7280]">{new Date(item.createdAt).toLocaleDateString("vi")}</td>
                                                <td className="text-center">
                                                    <button onClick={() => handleViewDetail(item.id)}
                                                        className="nb-btn nb-btn-outline nb-btn-sm text-xs">
                                                        👁 Chi tiết
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="px-6 py-3 bg-[#F9FAFB] border-t-2 border-[#1A1A2E] flex justify-between items-center text-xs text-[#6B7280] font-semibold">
                                <span>Hiển thị {items.length} / {totalCount} yêu cầu</span>
                                {totalPages > 1 && (
                                    <div className="flex gap-2">
                                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                                            className="nb-btn nb-btn-outline nb-btn-sm text-sm disabled:opacity-40">← Trước</button>
                                        <span className="flex items-center px-2 font-bold">{page} / {totalPages}</span>
                                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                                            className="nb-btn nb-btn-outline nb-btn-sm text-sm disabled:opacity-40">Sau →</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* Detail / Action Modal — NB style */}
            {(selected || detailLoading) && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 nb-backdrop-enter" onClick={() => !detailLoading && !actionLoading && closeModal()}>
                    <div className="bg-white rounded-md w-full max-w-lg p-6 space-y-5 border-2 border-[#1A1A2E] shadow-[4px_4px_0_#1A1A2E] max-h-[90vh] overflow-y-auto nb-modal-enter" onClick={e => e.stopPropagation()}>
                        {detailLoading ? (
                            <div className="flex items-center justify-center py-12"><div className="animate-spin w-8 h-8 border-[3px] border-[#6938EF] border-t-transparent rounded-full" /></div>
                        ) : selected && (
                            <>
                                <div className="flex justify-between items-center">
                                    <h2 className="font-extrabold text-lg text-[#1A1A2E]">Chi tiết yêu cầu</h2>
                                    <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-[#1A1A2E] hover:bg-[#F3F4F6] text-[#1A1A2E] font-bold">✕</button>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><p className="font-bold text-[#9CA3AF] text-xs uppercase mb-1">Tổ chức</p><p className="font-semibold text-[#1A1A2E]">{selected.organizationName}</p></div>
                                    <div><p className="font-bold text-[#9CA3AF] text-xs uppercase mb-1">Loại</p><span className={TYPE_BADGE[selected.type] || "nb-badge"}>{TYPE_LABEL[selected.type] || selected.type}</span></div>
                                    <div><p className="font-bold text-[#9CA3AF] text-xs uppercase mb-1">Email</p><p className="font-semibold text-[#1A1A2E]">{selected.contactEmail}</p></div>
                                    <div><p className="font-bold text-[#9CA3AF] text-xs uppercase mb-1">SĐT</p><p className="font-semibold text-[#1A1A2E]">{selected.contactPhone}</p></div>
                                    <div><p className="font-bold text-[#9CA3AF] text-xs uppercase mb-1">Trạng thái</p><span className={STATUS_BADGE[selected.status] || "nb-badge"}>{STATUS_LABEL[selected.status] || selected.status}</span></div>
                                    <div><p className="font-bold text-[#9CA3AF] text-xs uppercase mb-1">Ngày gửi</p><p className="font-semibold text-[#1A1A2E]">{new Date(selected.createdAt).toLocaleString("vi")}</p></div>
                                    {selected.address && <div className="col-span-2"><p className="font-bold text-[#9CA3AF] text-xs uppercase mb-1">Địa chỉ</p><p className="font-semibold text-[#1A1A2E]">{selected.address}</p></div>}
                                    {selected.description && <div className="col-span-2"><p className="font-bold text-[#9CA3AF] text-xs uppercase mb-1">Mô tả</p><p className="font-semibold text-[#1A1A2E]">{selected.description}</p></div>}
                                    {selected.rejectionReason && <div className="col-span-2"><p className="font-bold text-[#9CA3AF] text-xs uppercase mb-1">Lý do từ chối</p><p className="font-semibold text-red-600">{selected.rejectionReason}</p></div>}
                                    {selected.processedByName && <div><p className="font-bold text-[#9CA3AF] text-xs uppercase mb-1">Xử lý bởi</p><p className="font-semibold text-[#1A1A2E]">{selected.processedByName}</p></div>}
                                    {selected.processedAt && <div><p className="font-bold text-[#9CA3AF] text-xs uppercase mb-1">Ngày xử lý</p><p className="font-semibold text-[#1A1A2E]">{new Date(selected.processedAt).toLocaleString("vi")}</p></div>}
                                </div>

                                {/* Action buttons (only for Pending) */}
                                {selected.status === "Pending" && !actionMode && (
                                    <div className="flex gap-3">
                                        <button onClick={() => { setActionMode("approve"); setCreateEmail(selected.contactEmail); setCreateName(selected.organizationName); }}
                                            className="flex-1 nb-btn nb-btn-green text-sm">
                                            ✅ Tạo tài khoản
                                        </button>
                                        <button onClick={() => setActionMode("reject")}
                                            className="flex-1 nb-btn nb-btn-red text-sm">
                                            ❌ Từ chối
                                        </button>
                                    </div>
                                )}

                                {/* Approve form — NB styled */}
                                {actionMode === "approve" && (
                                    <div className="nb-alert nb-alert-success p-4 space-y-3 flex-col !items-stretch">
                                        <h3 className="font-bold text-sm text-[#065F46]">Tạo tài khoản mới</h3>
                                        <input value={createEmail} onChange={e => setCreateEmail(e.target.value)} placeholder="Email đăng nhập *"
                                            className="nb-input w-full text-sm" />
                                        <input value={createName} onChange={e => setCreateName(e.target.value)} placeholder="Họ tên đầy đủ *"
                                            className="nb-input w-full text-sm" />
                                        <input value={createPhone} onChange={e => setCreatePhone(e.target.value)} placeholder="Số điện thoại (tuỳ chọn)"
                                            className="nb-input w-full text-sm" />
                                        <p className="text-xs text-[#6B7280]">Mật khẩu tạm thời sẽ được gửi qua email cho người dùng.</p>
                                        {actionError && <p className="text-xs text-red-600 font-semibold">{actionError}</p>}
                                        <div className="flex gap-2">
                                            <button onClick={handleApprove} disabled={actionLoading}
                                                className="flex-1 nb-btn nb-btn-green text-sm disabled:opacity-50">
                                                {actionLoading ? "Đang tạo..." : "Xác nhận tạo"}
                                            </button>
                                            <button onClick={() => { setActionMode(""); setActionError(""); }}
                                                className="nb-btn nb-btn-outline text-sm">Huỷ</button>
                                        </div>
                                    </div>
                                )}

                                {/* Reject form — NB styled */}
                                {actionMode === "reject" && (
                                    <div className="nb-alert nb-alert-error p-4 space-y-3 flex-col !items-stretch">
                                        <h3 className="font-bold text-sm text-[#991B1B]">Từ chối yêu cầu</h3>
                                        <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Lý do từ chối *"
                                            rows={3} className="nb-input w-full resize-none text-sm" />
                                        {actionError && <p className="text-xs text-red-600 font-semibold">{actionError}</p>}
                                        <div className="flex gap-2">
                                            <button onClick={handleReject} disabled={actionLoading}
                                                className="flex-1 nb-btn nb-btn-red text-sm disabled:opacity-50">
                                                {actionLoading ? "Đang xử lý..." : "Xác nhận từ chối"}
                                            </button>
                                            <button onClick={() => { setActionMode(""); setActionError(""); }}
                                                className="nb-btn nb-btn-outline text-sm">Huỷ</button>
                                        </div>
                                    </div>
                                )}

                                <button onClick={closeModal}
                                    className="nb-btn nb-btn-outline w-full text-sm">
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
