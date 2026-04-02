import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useAdminSidebarConfig } from "../../hooks/useAdminSidebarConfig";
import {
    getAccountRequests, getAccountRequestDetail,
    createAccountForRequest, rejectAccountRequest,
    type AccountRequestListItem, type AccountRequestDetail,
} from "../../lib/api/accountRequests";

/* ── Design tokens ── */
const T = {
    ink: "#19182B", surface: "#FFFFFF", surfaceSoft: "#FFFDF9",
    primary: "#8B6BFF", primarySoft: "#E9E1FF",
    successSoft: "#D9F8E8", warningSoft: "#FFF1BF", dangerSoft: "#FFE3D8",
    infoSoft: "#DCEBFF", muted: "#6F6A7D",
};

const STATUS_TONE: Record<string, { bg: string; text: string }> = {
    Pending: { bg: T.warningSoft, text: "#9A590E" },
    Approved: { bg: T.successSoft, text: "#187A4C" },
    Rejected: { bg: T.dangerSoft, text: "#B2452D" },
};
const STATUS_LABEL: Record<string, string> = { Pending: "Chờ xử lý", Approved: "Đã duyệt", Rejected: "Đã từ chối" };
const TYPE_TONE: Record<string, { bg: string; text: string }> = {
    School: { bg: T.infoSoft, text: "#2758B8" },
    Provider: { bg: T.warningSoft, text: "#9A590E" },
};
const TYPE_LABEL: Record<string, string> = { School: "🏫 Trường học", Provider: "🏭 Nhà cung cấp" };

function Badge({ children, tone }: { children: React.ReactNode; tone?: { bg: string; text: string } }) {
    const t = tone || { bg: T.surface, text: T.ink };
    return (
        <span className="inline-flex items-center rounded-full border-[2px] px-3 py-1 text-[12px] font-black uppercase tracking-wide"
            style={{ borderColor: T.ink, background: t.bg, color: t.text, boxShadow: `2px 2px 0 ${T.ink}` }}>
            {children}
        </span>
    );
}

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

    const [selected, setSelected] = useState<AccountRequestDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [actionMode, setActionMode] = useState<"" | "approve" | "reject">("");
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState("");

    const [createEmail, setCreateEmail] = useState("");
    const [createName, setCreateName] = useState("");
    const [createPhone, setCreatePhone] = useState("");
    const [rejectReason, setRejectReason] = useState("");

    const pageSize = 15;

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAccountRequests({ page, pageSize, status: filterStatus, type: filterType });
            setItems(res.items); setTotalCount(res.totalCount);
        } catch { setItems([]); setTotalCount(0); }
        finally { setLoading(false); }
    }, [page, filterStatus, filterType]);

    useEffect(() => { fetchList(); }, [fetchList]);

    const handleViewDetail = async (id: string) => {
        setDetailLoading(true); setActionMode(""); setActionError("");
        try { setSelected(await getAccountRequestDetail(id)); } catch { /* */ }
        finally { setDetailLoading(false); }
    };

    const handleApprove = async () => {
        if (!selected) return;
        if (!createEmail.trim() || !createName.trim()) { setActionError("Vui lòng nhập email và họ tên."); return; }
        setActionLoading(true); setActionError("");
        try {
            await createAccountForRequest(selected.id, { email: createEmail.trim(), fullName: createName.trim(), phone: createPhone.trim() || undefined });
            closeModal(); await fetchList();
        } catch (err: any) { setActionError(err?.message || "Tạo tài khoản thất bại."); }
        finally { setActionLoading(false); }
    };

    const handleReject = async () => {
        if (!selected) return;
        if (!rejectReason.trim()) { setActionError("Vui lòng nhập lý do từ chối."); return; }
        setActionLoading(true); setActionError("");
        try {
            await rejectAccountRequest(selected.id, rejectReason.trim());
            closeModal(); await fetchList();
        } catch (err: any) { setActionError(err?.message || "Từ chối thất bại."); }
        finally { setActionLoading(false); }
    };

    const closeModal = () => {
        setSelected(null); setActionMode(""); setActionError("");
        setCreateEmail(""); setCreateName(""); setCreatePhone(""); setRejectReason("");
    };

    const handleLogout = () => {
        localStorage.removeItem("access_token"); localStorage.removeItem("user"); localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token"); sessionStorage.removeItem("user"); sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const gridCols = "2fr 2fr 1.2fr 1.2fr 1.2fr 1.2fr 1fr";

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                    <TopNavBar>
                        <Breadcrumb><BreadcrumbList>
                            <BreadcrumbItem><BreadcrumbLink href="/admin/dashboard" className="font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                            <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                            <BreadcrumbItem><BreadcrumbPage className="font-bold text-[#1A1A2E] text-base">Yêu cầu hợp tác</BreadcrumbPage></BreadcrumbItem>
                        </BreadcrumbList></Breadcrumb>
                    </TopNavBar>
                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6 nb-fade-in">
                        {/* Header */}
                        <div>
                            <h1 className="text-[40px] font-black leading-none md:text-[48px]" style={{ color: T.ink }}>📋 Yêu cầu hợp tác</h1>
                            <p className="mt-3 max-w-3xl text-[17px] font-semibold leading-8" style={{ color: T.muted }}>
                                Xem xét và xử lý yêu cầu mở tài khoản từ Trường học và Nhà cung cấp.
                            </p>
                        </div>

                        {/* Toolbar */}
                        <div className="rounded-[18px] border-[3px] p-4" style={{ borderColor: T.ink, background: T.surface, boxShadow: `6px 6px 0 ${T.ink}` }}>
                            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                                <select value={filterStatus ?? ""}
                                    onChange={e => { setFilterStatus(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
                                    className="min-w-[180px] rounded-[12px] border-[2px] px-4 py-3 text-[15px] font-semibold outline-none transition-all focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0_#19182B]"
                                    style={{ borderColor: T.ink, color: T.ink, background: T.surface, boxShadow: `3px 3px 0 ${T.ink}` }}>
                                    <option value="">Tất cả trạng thái</option>
                                    <option value="1">Chờ xử lý</option>
                                    <option value="2">Đã duyệt</option>
                                    <option value="3">Đã từ chối</option>
                                </select>
                                <select value={filterType ?? ""}
                                    onChange={e => { setFilterType(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
                                    className="min-w-[180px] rounded-[12px] border-[2px] px-4 py-3 text-[15px] font-semibold outline-none transition-all focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0_#19182B]"
                                    style={{ borderColor: T.ink, color: T.ink, background: T.surface, boxShadow: `3px 3px 0 ${T.ink}` }}>
                                    <option value="">Tất cả loại</option>
                                    <option value="1">🏫 Trường học</option>
                                    <option value="2">🏭 Nhà cung cấp</option>
                                </select>
                                <div className="ml-auto">
                                    <Badge tone={{ bg: T.surface, text: T.ink }}>Tổng: {totalCount}</Badge>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-hidden rounded-[18px] border-[3px]" style={{ borderColor: T.ink, background: T.surface, boxShadow: `6px 6px 0 ${T.ink}` }}>
                            <div className="sticky top-0 z-10 hidden lg:grid items-center border-b-[3px] px-5 py-4"
                                style={{ gridTemplateColumns: gridCols, borderColor: T.ink, background: T.primarySoft }}>
                                {["Tên tổ chức", "Email", "SĐT", "Loại", "Trạng thái", "Ngày gửi", "Hành động"].map((h, i, arr) => (
                                    <div key={h} className={`text-[12px] font-black uppercase tracking-[0.08em]${i === arr.length - 1 ? " text-right" : ""}`} style={{ color: "#4E4A5B" }}>{h}</div>
                                ))}
                            </div>

                            {/* Loading */}
                            {loading && (
                                <div className="space-y-3 px-5 py-5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="hidden lg:grid items-center gap-4 rounded-[14px] border px-4 py-4"
                                            style={{ gridTemplateColumns: gridCols, borderColor: "#D9D4E6", background: T.surfaceSoft }}>
                                            {Array.from({ length: 7 }).map((_, j) => (
                                                <div key={j} className="h-5 rounded animate-pulse" style={{ background: "#EAE3FF" }} />
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Empty */}
                            {!loading && items.length === 0 && (
                                <div className="flex min-h-[240px] flex-col items-center justify-center px-6 py-12 text-center">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-[16px] border-[3px] text-[28px]"
                                        style={{ borderColor: T.ink, background: T.warningSoft, boxShadow: `4px 4px 0 ${T.ink}` }}>📭</div>
                                    <div className="mt-5 text-[28px] font-black">Chưa có yêu cầu nào</div>
                                    <p className="mt-3 max-w-lg text-[15px] font-semibold leading-7" style={{ color: T.muted }}>
                                        Không tìm thấy yêu cầu hợp tác phù hợp bộ lọc hiện tại.
                                    </p>
                                </div>
                            )}

                            {/* Rows */}
                            {!loading && items.length > 0 && (
                                <div>
                                    {items.map((item, idx) => (
                                        <div key={item.id} className="hidden lg:grid items-center gap-4 border-b px-5 py-4 transition-colors hover:bg-[#F7F2FF] nb-fade-in"
                                            style={{ gridTemplateColumns: gridCols, borderColor: "#D9D4E6", animationDelay: `${idx * 40}ms` }}>
                                            <div className="text-[15px] font-black" style={{ color: T.ink }}>{item.organizationName}</div>
                                            <div className="text-[14px] font-semibold truncate" style={{ color: "#3D384A" }}>{item.contactEmail}</div>
                                            <div className="text-[14px] font-semibold" style={{ color: "#3D384A" }}>{item.contactPhone}</div>
                                            <div><Badge tone={TYPE_TONE[item.type]}>{TYPE_LABEL[item.type] || item.type}</Badge></div>
                                            <div><Badge tone={STATUS_TONE[item.status]}>{STATUS_LABEL[item.status] || item.status}</Badge></div>
                                            <div className="text-[14px] font-semibold" style={{ color: T.muted }}>{new Date(item.createdAt).toLocaleDateString("vi")}</div>
                                            <div className="flex justify-end">
                                                <button onClick={() => handleViewDetail(item.id)}
                                                    className="rounded-[12px] border-[3px] px-4 py-2 text-[13px] font-extrabold transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                                                    style={{ borderColor: T.ink, background: T.surface, color: T.ink, boxShadow: `4px 4px 0 ${T.ink}` }}>
                                                    👁 Chi tiết
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Mobile cards */}
                                    {items.map((item, idx) => (
                                        <div key={`m-${item.id}`} className="lg:hidden border-b p-4 space-y-3 nb-fade-in"
                                            style={{ borderColor: "#D9D4E6", animationDelay: `${idx * 40}ms` }}>
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="text-[16px] font-black" style={{ color: T.ink }}>{item.organizationName}</div>
                                                    <div className="text-[13px] font-semibold mt-1" style={{ color: "#3D384A" }}>{item.contactEmail}</div>
                                                </div>
                                                <div className="flex flex-col gap-1.5 items-end">
                                                    <Badge tone={TYPE_TONE[item.type]}>{TYPE_LABEL[item.type] || item.type}</Badge>
                                                    <Badge tone={STATUS_TONE[item.status]}>{STATUS_LABEL[item.status] || item.status}</Badge>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[13px] font-semibold" style={{ color: T.muted }}>{new Date(item.createdAt).toLocaleDateString("vi")}</span>
                                                <button onClick={() => handleViewDetail(item.id)}
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
                                            Hiển thị {items.length} / {totalCount} yêu cầu · Trang {page}/{totalPages}
                                        </div>
                                        {totalPages > 1 && (
                                            <div className="flex gap-3">
                                                <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}
                                                    className="rounded-[12px] border-[3px] px-4 py-2 text-[13px] font-extrabold transition-all disabled:opacity-40 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                                                    style={{ borderColor: T.ink, background: T.surface, color: T.ink, boxShadow: `4px 4px 0 ${T.ink}` }}>← Trước</button>
                                                <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}
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

            {/* ── Detail / Action Modal ── */}
            {(selected || detailLoading) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 nb-backdrop-enter"
                    style={{ background: "rgba(25, 24, 43, 0.55)" }}
                    onClick={() => !detailLoading && !actionLoading && closeModal()}>
                    <div className="w-full max-w-lg rounded-[18px] border-[3px] p-6 space-y-5 nb-modal-enter max-h-[90vh] overflow-y-auto"
                        style={{ borderColor: T.ink, background: T.surface, boxShadow: `6px 6px 0 ${T.ink}` }}
                        onClick={e => e.stopPropagation()}>
                        {detailLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin w-10 h-10 border-[3px] rounded-full" style={{ borderColor: T.primarySoft, borderTopColor: T.primary }} />
                            </div>
                        ) : selected && (
                            <>
                                <div className="flex justify-between items-center">
                                    <h2 className="text-[24px] font-black" style={{ color: T.ink }}>Chi tiết yêu cầu</h2>
                                    <button onClick={closeModal}
                                        className="flex h-10 w-10 items-center justify-center rounded-[10px] border-[2px] text-[16px] font-black transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                                        style={{ borderColor: T.ink, background: T.surface, boxShadow: `2px 2px 0 ${T.ink}` }}>✕</button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { label: "Tổ chức", value: selected.organizationName },
                                        { label: "Loại", badge: true, badgeTone: TYPE_TONE[selected.type], badgeText: TYPE_LABEL[selected.type] || selected.type },
                                        { label: "Email", value: selected.contactEmail },
                                        { label: "SĐT", value: selected.contactPhone },
                                        { label: "Trạng thái", badge: true, badgeTone: STATUS_TONE[selected.status], badgeText: STATUS_LABEL[selected.status] || selected.status },
                                        { label: "Ngày gửi", value: new Date(selected.createdAt).toLocaleString("vi") },
                                        ...(selected.contactPersonName ? [{ label: "Người liên hệ", value: selected.contactPersonName }] : []),
                                        ...(selected.address ? [{ label: "Địa chỉ", value: selected.address, span: true }] : []),
                                        ...(selected.description ? [{ label: "Mô tả", value: selected.description, span: true }] : []),
                                        ...(selected.rejectionReason ? [{ label: "Lý do từ chối", value: selected.rejectionReason, span: true, color: "#B2452D" }] : []),
                                        ...(selected.processedByName ? [{ label: "Xử lý bởi", value: selected.processedByName }] : []),
                                        ...(selected.processedAt ? [{ label: "Ngày xử lý", value: new Date(selected.processedAt).toLocaleString("vi") }] : []),
                                    ].map((item: any, i) => (
                                        <div key={i} className={item.span ? "col-span-2" : ""}>
                                            <p className="text-[12px] font-black uppercase mb-1 tracking-wide" style={{ color: T.muted }}>{item.label}</p>
                                            {item.badge ? (
                                                <Badge tone={item.badgeTone}>{item.badgeText}</Badge>
                                            ) : (
                                                <p className="text-[15px] font-semibold" style={{ color: item.color || T.ink }}>{item.value}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Action buttons (only for Pending) */}
                                {selected.status === "Pending" && !actionMode && (
                                    <div className="flex gap-3">
                                        <button onClick={() => { setActionMode("approve"); setCreateEmail(selected.contactEmail); setCreateName(selected.organizationName); setCreatePhone(selected.contactPhone || ""); }}
                                            className="flex-1 rounded-[12px] border-[3px] py-3 text-[15px] font-extrabold text-white transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                                            style={{ borderColor: T.ink, background: "#10B981", boxShadow: `4px 4px 0 ${T.ink}` }}>
                                            ✅ Tạo tài khoản
                                        </button>
                                        <button onClick={() => setActionMode("reject")}
                                            className="flex-1 rounded-[12px] border-[3px] py-3 text-[15px] font-extrabold text-white transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                                            style={{ borderColor: T.ink, background: "#EF4444", boxShadow: `4px 4px 0 ${T.ink}` }}>
                                            ❌ Từ chối
                                        </button>
                                    </div>
                                )}

                                {/* Approve form */}
                                {actionMode === "approve" && (
                                    <div className="rounded-[14px] border-[2px] p-5 space-y-3" style={{ borderColor: "#187A4C", background: T.successSoft }}>
                                        <h3 className="text-[14px] font-black" style={{ color: "#065F46" }}>Tạo tài khoản mới</h3>
                                        {[
                                            { value: createEmail, set: setCreateEmail, placeholder: "Email đăng nhập *" },
                                            { value: createName, set: setCreateName, placeholder: "Họ tên đầy đủ *" },
                                            { value: createPhone, set: setCreatePhone, placeholder: "Số điện thoại (tuỳ chọn)" },
                                        ].map((f, i) => (
                                            <input key={i} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                                                className="w-full rounded-[12px] border-[2px] px-4 py-3 text-[14px] font-semibold outline-none transition-all placeholder:text-[#9A95A8] focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0_#19182B]"
                                                style={{ borderColor: T.ink, background: T.surface, boxShadow: `3px 3px 0 ${T.ink}` }} />
                                        ))}
                                        <p className="text-[12px] font-semibold" style={{ color: T.muted }}>Mật khẩu tạm thời sẽ được gửi qua email cho người dùng.</p>
                                        {actionError && <p className="text-[13px] font-bold" style={{ color: "#B2452D" }}>{actionError}</p>}
                                        <div className="flex gap-3">
                                            <button onClick={handleApprove} disabled={actionLoading}
                                                className="flex-1 rounded-[12px] border-[3px] py-3 text-[14px] font-extrabold text-white transition-all disabled:opacity-50 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B]"
                                                style={{ borderColor: T.ink, background: "#10B981", boxShadow: `4px 4px 0 ${T.ink}` }}>
                                                {actionLoading ? "Đang tạo..." : "Xác nhận tạo"}
                                            </button>
                                            <button onClick={() => { setActionMode(""); setActionError(""); }}
                                                className="rounded-[12px] border-[3px] px-5 py-3 text-[14px] font-extrabold transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B]"
                                                style={{ borderColor: T.ink, background: T.surface, color: T.ink, boxShadow: `4px 4px 0 ${T.ink}` }}>Huỷ</button>
                                        </div>
                                    </div>
                                )}

                                {/* Reject form */}
                                {actionMode === "reject" && (
                                    <div className="rounded-[14px] border-[2px] p-5 space-y-3" style={{ borderColor: "#B2452D", background: T.dangerSoft }}>
                                        <h3 className="text-[14px] font-black" style={{ color: "#991B1B" }}>Từ chối yêu cầu</h3>
                                        <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Lý do từ chối *" rows={3}
                                            className="w-full resize-none rounded-[12px] border-[2px] px-4 py-3 text-[14px] font-semibold outline-none transition-all placeholder:text-[#9A95A8] focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0_#19182B]"
                                            style={{ borderColor: T.ink, background: T.surface, boxShadow: `3px 3px 0 ${T.ink}` }} />
                                        {actionError && <p className="text-[13px] font-bold" style={{ color: "#B2452D" }}>{actionError}</p>}
                                        <div className="flex gap-3">
                                            <button onClick={handleReject} disabled={actionLoading}
                                                className="flex-1 rounded-[12px] border-[3px] py-3 text-[14px] font-extrabold text-white transition-all disabled:opacity-50 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B]"
                                                style={{ borderColor: T.ink, background: "#EF4444", boxShadow: `4px 4px 0 ${T.ink}` }}>
                                                {actionLoading ? "Đang xử lý..." : "Xác nhận từ chối"}
                                            </button>
                                            <button onClick={() => { setActionMode(""); setActionError(""); }}
                                                className="rounded-[12px] border-[3px] px-5 py-3 text-[14px] font-extrabold transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#19182B]"
                                                style={{ borderColor: T.ink, background: T.surface, color: T.ink, boxShadow: `4px 4px 0 ${T.ink}` }}>Huỷ</button>
                                        </div>
                                    </div>
                                )}

                                <button onClick={closeModal}
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

export default AdminAccountRequests;
