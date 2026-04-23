import { useCallback, useEffect, useMemo, useState } from "react";
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
import { usePreservedResultsHeight } from "../../hooks/usePreservedResultsHeight";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import {
    createAccountForRequest,
    getAccountRequestDetail,
    getAccountRequests,
    rejectAccountRequest,
    type AccountRequestDetail,
    type AccountRequestListItem,
} from "../../lib/api/accountRequests";
import {
    ADMIN_TONE,
    AdminBadge,
    AdminEmptyState,
    AdminHero,
    AdminSummaryCard,
} from "../AdminShared/adminWorkspace";

const statusTone: Record<string, { bg: string; text: string; label: string }> = {
    Pending: { bg: ADMIN_TONE.amberSoft, text: "#9A6506", label: "Chờ xử lý" },
    Approved: { bg: ADMIN_TONE.emeraldSoft, text: "#0C7A5D", label: "Đã duyệt" },
    Rejected: { bg: ADMIN_TONE.roseSoft, text: "#B23148", label: "Đã từ chối" },
};

const typeTone: Record<string, { bg: string; text: string; label: string }> = {
    School: { bg: ADMIN_TONE.skySoft, text: "#1D63BE", label: "Trường học" },
    Provider: { bg: ADMIN_TONE.amberSoft, text: "#9A6506", label: "Nhà cung cấp" },
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
    const isFilteredEmptyState = !loading && (filterStatus !== undefined || filterType !== undefined) && items.length === 0;
    const { preserveResultsHeight, preservedHeightStyle, resultsRegionRef } = usePreservedResultsHeight(isFilteredEmptyState);

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getAccountRequests({ page, pageSize, status: filterStatus, type: filterType });
            setItems(response.items);
            setTotalCount(response.totalCount);
        } catch {
            setItems([]);
            setTotalCount(0);
        } finally {
            setLoading(false);
        }
    }, [page, filterStatus, filterType]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    const closeModal = () => {
        setSelected(null);
        setActionMode("");
        setActionError("");
        setCreateEmail("");
        setCreateName("");
        setCreatePhone("");
        setRejectReason("");
    };

    const handleViewDetail = async (id: string) => {
        setDetailLoading(true);
        setActionMode("");
        setActionError("");
        try {
            setSelected(await getAccountRequestDetail(id));
        } finally {
            setDetailLoading(false);
        }
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
            closeModal();
            await fetchList();
        } catch (error: any) {
            setActionError(error?.message || "Tạo tài khoản thất bại.");
        } finally {
            setActionLoading(false);
        }
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
            closeModal();
            await fetchList();
        } catch (error: any) {
            setActionError(error?.message || "Từ chối thất bại.");
        } finally {
            setActionLoading(false);
        }
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

    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const pendingCount = useMemo(() => items.filter((item) => item.status === "Pending").length, [items]);
    const schoolCount = useMemo(() => items.filter((item) => item.type === "School").length, [items]);
    const providerCount = useMemo(() => items.filter((item) => item.type === "Provider").length, [items]);
    const gridCols = "2fr 2fr 1.15fr 1.15fr 1.15fr 1.15fr 1fr";

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
                                    <BreadcrumbPage className="font-bold text-gray-900 text-base">Yêu cầu cấp tài khoản</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </TopNavBar>

                    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8 space-y-6 nb-fade-in">
                        <AdminHero
                            eyebrow="Cap tai khoan"
                            title="Xử lý yêu cầu cấp tài khoản từ trường học và nhà cung cấp."
                            description="Bạn có thể xem nhanh hồ sơ đang chờ, mở chi tiết và tạo tài khoản hoặc từ chối ngay tại đây."
                            stats={[
                                { label: "Đang hiển thị", value: loading ? "…" : String(items.length) },
                                { label: "Chờ xử lý", value: loading ? "…" : String(pendingCount) },
                            ]}
                        />

                        <section className="grid gap-4 md:grid-cols-3">
                            <AdminSummaryCard
                                label="Tổng yêu cầu"
                                value={loading ? "…" : totalCount.toLocaleString("vi-VN")}
                                detail="Tổng số hồ sơ trong tập dữ liệu hiện tại sau khi gọi danh sách từ backend."
                                accent={ADMIN_TONE.sky}
                            />
                            <AdminSummaryCard
                                label="Từ trường học"
                                value={loading ? "…" : schoolCount.toLocaleString("vi-VN")}
                                detail="Nhóm này cần kiểm tra độ đầy đủ thông tin tổ chức và đầu mối liên hệ."
                                accent={ADMIN_TONE.violet}
                            />
                            <AdminSummaryCard
                                label="Từ nhà cung cấp"
                                value={loading ? "…" : providerCount.toLocaleString("vi-VN")}
                                detail="Nhóm này thường cần duyệt nhanh để không làm chậm onboarding và vận hành hợp đồng."
                                accent={ADMIN_TONE.amber}
                            />
                        </section>

                        <section className="rounded-[24px] border p-4 shadow-soft-lg" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}>
                            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                                <select
                                    value={filterStatus ?? ""}
                                    onChange={(event) => {
                                        preserveResultsHeight();
                                        setFilterStatus(event.target.value ? Number(event.target.value) : undefined);
                                        setPage(1);
                                    }}
                                    className="min-w-[200px] rounded-xl border px-4 py-3 text-[15px] font-semibold outline-none transition-all"
                                    style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.soft, color: ADMIN_TONE.pageInk }}
                                >
                                    <option value="">Tất cả trạng thái</option>
                                    <option value="1">Chờ xử lý</option>
                                    <option value="2">Đã duyệt</option>
                                    <option value="3">Đã từ chối</option>
                                </select>

                                <select
                                    value={filterType ?? ""}
                                    onChange={(event) => {
                                        preserveResultsHeight();
                                        setFilterType(event.target.value ? Number(event.target.value) : undefined);
                                        setPage(1);
                                    }}
                                    className="min-w-[200px] rounded-xl border px-4 py-3 text-[15px] font-semibold outline-none transition-all"
                                    style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.soft, color: ADMIN_TONE.pageInk }}
                                >
                                    <option value="">Tất cả loại</option>
                                    <option value="1">Trường học</option>
                                    <option value="2">Nhà cung cấp</option>
                                </select>

                                <div className="ml-auto flex items-center gap-3">
                                    <AdminBadge bg={ADMIN_TONE.soft} text={ADMIN_TONE.pageInk}>
                                        Tổng: {totalCount}
                                    </AdminBadge>
                                </div>
                            </div>
                        </section>

                        <section className="overflow-hidden rounded-[24px] border shadow-soft-lg" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}>
                            <div
                                className="sticky top-0 z-10 hidden lg:grid items-center border-b px-5 py-4"
                                style={{ gridTemplateColumns: gridCols, borderColor: ADMIN_TONE.line, background: ADMIN_TONE.violetSoft }}
                            >
                                {["Tổ chức", "Email", "SĐT", "Loại", "Trạng thái", "Ngày gửi", "Hành động"].map((header, index, arr) => (
                                    <div
                                        key={header}
                                        className={`text-[12px] font-black uppercase tracking-[0.08em]${index === arr.length - 1 ? " text-right" : ""}`}
                                        style={{ color: ADMIN_TONE.muted }}
                                    >
                                        {header}
                                    </div>
                                ))}
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
                                            {Array.from({ length: 7 }).map((__, cellIndex) => (
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

                            {!loading && items.length === 0 && (
                                <AdminEmptyState
                                    title="Chưa có yêu cầu nào"
                                    detail="Không tìm thấy yêu cầu cấp tài khoản phù hợp bộ lọc hiện tại."
                                    icon="📭"
                                    bg={ADMIN_TONE.amberSoft}
                                />
                            )}

                            {!loading && items.length > 0 && (
                                <div>
                                    {items.map((item, index) => (
                                        <div
                                            key={item.id}
                                            className="hidden lg:grid items-center gap-4 border-b px-5 py-4 transition-colors hover:bg-[#F7F2FF] nb-fade-in"
                                            style={{ gridTemplateColumns: gridCols, borderColor: ADMIN_TONE.line, animationDelay: `${index * 40}ms` }}
                                        >
                                            <div className="text-[15px] font-black text-gray-900">{item.organizationName}</div>
                                            <div className="truncate text-[14px] font-semibold" style={{ color: "#3D384A" }}>
                                                {item.contactEmail}
                                            </div>
                                            <div className="text-[14px] font-semibold" style={{ color: "#3D384A" }}>
                                                {item.contactPhone}
                                            </div>
                                            <div>
                                                <AdminBadge bg={typeTone[item.type]?.bg} text={typeTone[item.type]?.text}>
                                                    {typeTone[item.type]?.label || item.type}
                                                </AdminBadge>
                                            </div>
                                            <div>
                                                <AdminBadge bg={statusTone[item.status]?.bg} text={statusTone[item.status]?.text}>
                                                    {statusTone[item.status]?.label || item.status}
                                                </AdminBadge>
                                            </div>
                                            <div className="text-[14px] font-semibold" style={{ color: ADMIN_TONE.muted }}>
                                                {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                                            </div>
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={() => handleViewDetail(item.id)}
                                                    className="rounded-xl border px-4 py-2 text-[13px] font-extrabold transition-all hover:scale-[0.99]"
                                                    style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell, color: ADMIN_TONE.pageInk }}
                                                >
                                                    Chi tiết
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {items.map((item, index) => (
                                        <div
                                            key={`mobile-${item.id}`}
                                            className="lg:hidden border-b p-4 space-y-3 nb-fade-in"
                                            style={{ borderColor: ADMIN_TONE.line, animationDelay: `${index * 40}ms` }}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="text-[16px] font-black text-gray-900">{item.organizationName}</div>
                                                    <div className="mt-1 text-[13px] font-semibold" style={{ color: "#3D384A" }}>
                                                        {item.contactEmail}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1.5 items-end">
                                                    <AdminBadge bg={typeTone[item.type]?.bg} text={typeTone[item.type]?.text}>
                                                        {typeTone[item.type]?.label || item.type}
                                                    </AdminBadge>
                                                    <AdminBadge bg={statusTone[item.status]?.bg} text={statusTone[item.status]?.text}>
                                                        {statusTone[item.status]?.label || item.status}
                                                    </AdminBadge>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[13px] font-semibold" style={{ color: ADMIN_TONE.muted }}>
                                                    {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                                                </span>
                                                <button
                                                    onClick={() => handleViewDetail(item.id)}
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
                                            Hiển thị {items.length} / {totalCount} yêu cầu · Trang {page}/{totalPages}
                                        </div>
                                        {totalPages > 1 && (
                                            <div className="flex gap-3">
                                                <button
                                                    disabled={page <= 1}
                                                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                                                    className="rounded-xl border px-4 py-2 text-[13px] font-extrabold transition-all disabled:opacity-40 hover:scale-[0.99]"
                                                    style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell, color: ADMIN_TONE.pageInk }}
                                                >
                                                    ← Trước
                                                </button>
                                                <button
                                                    disabled={page >= totalPages}
                                                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
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
                    onClick={() => !detailLoading && !actionLoading && closeModal()}
                >
                    <div
                        className="w-full max-w-2xl rounded-2xl border p-6 space-y-5 nb-modal-enter max-h-[90vh] overflow-y-auto shadow-soft-lg"
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
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h2 className="text-[24px] font-black" style={{ color: ADMIN_TONE.pageInk }}>
                                                Chi tiết yêu cầu cấp tài khoản
                                            </h2>
                                            <p className="mt-2 text-[14px] font-semibold leading-6" style={{ color: ADMIN_TONE.muted }}>
                                                Xem xét thông tin tổ chức, người liên hệ và chọn một trong hai hành động: tạo tài khoản hoặc từ chối.
                                            </p>
                                        </div>
                                        <button
                                            onClick={closeModal}
                                            className="flex h-10 w-10 items-center justify-center rounded-xl border text-[16px] font-black transition-all hover:scale-[0.99]"
                                            style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}
                                        >
                                            ×
                                        </button>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-3">
                                        <AdminSummaryCard
                                            label="Loại tổ chức"
                                            value={typeTone[selected.type]?.label || selected.type}
                                            detail="Định hướng cách Admin kiểm tra hồ sơ và chuẩn bị tài khoản."
                                            accent={typeTone[selected.type]?.text || ADMIN_TONE.sky}
                                        />
                                        <AdminSummaryCard
                                            label="Trạng thái"
                                            value={statusTone[selected.status]?.label || selected.status}
                                            detail="Nếu còn chờ xử lý, Admin có thể tạo tài khoản hoặc từ chối ngay trong hộp thoại này."
                                            accent={statusTone[selected.status]?.text || ADMIN_TONE.amber}
                                        />
                                        <AdminSummaryCard
                                            label="Ngày gửi"
                                            value={new Date(selected.createdAt).toLocaleDateString("vi-VN")}
                                            detail="Theo dõi thời gian tồn đọng để ưu tiên duyệt hồ sơ lâu chưa xử lý."
                                            accent={ADMIN_TONE.violet}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { label: "Tổ chức", value: selected.organizationName },
                                            { label: "Người liên hệ", value: selected.contactPersonName || "—" },
                                            { label: "Email", value: selected.contactEmail },
                                            { label: "SĐT", value: selected.contactPhone || "—" },
                                            { label: "Loại", badge: true, bg: typeTone[selected.type]?.bg, text: typeTone[selected.type]?.text, badgeValue: typeTone[selected.type]?.label || selected.type },
                                            { label: "Trạng thái", badge: true, bg: statusTone[selected.status]?.bg, text: statusTone[selected.status]?.text, badgeValue: statusTone[selected.status]?.label || selected.status },
                                            ...(selected.address ? [{ label: "Địa chỉ", value: selected.address, span: true }] : []),
                                            ...(selected.description ? [{ label: "Mô tả", value: selected.description, span: true }] : []),
                                            ...(selected.rejectionReason ? [{ label: "Lý do từ chối", value: selected.rejectionReason, span: true }] : []),
                                            ...(selected.processedByName ? [{ label: "Xử lý bởi", value: selected.processedByName }] : []),
                                            ...(selected.processedAt ? [{ label: "Ngày xử lý", value: new Date(selected.processedAt).toLocaleString("vi-VN") }] : []),
                                        ].map((item, index) => (
                                            <div key={index} className={item.span ? "col-span-2" : ""}>
                                                <p className="mb-1 text-[12px] font-black uppercase tracking-wide" style={{ color: ADMIN_TONE.muted }}>
                                                    {item.label}
                                                </p>
                                                {item.badge ? (
                                                    <AdminBadge bg={item.bg} text={item.text}>
                                                        {item.badgeValue}
                                                    </AdminBadge>
                                                ) : (
                                                    <p className="text-[15px] font-semibold" style={{ color: ADMIN_TONE.pageInk }}>
                                                        {item.value}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {selected.status === "Pending" && !actionMode && (
                                        <div className="grid gap-3 md:grid-cols-2">
                                            <button
                                                onClick={() => {
                                                    setActionMode("approve");
                                                    setCreateEmail(selected.contactEmail);
                                                    setCreateName(selected.organizationName);
                                                    setCreatePhone(selected.contactPhone || "");
                                                }}
                                                className="rounded-xl border py-3 text-[15px] font-extrabold text-white transition-all hover:scale-[0.99]"
                                                style={{ borderColor: ADMIN_TONE.emerald, background: ADMIN_TONE.emerald }}
                                            >
                                                Tạo tài khoản
                                            </button>
                                            <button
                                                onClick={() => setActionMode("reject")}
                                                className="rounded-xl border py-3 text-[15px] font-extrabold text-white transition-all hover:scale-[0.99]"
                                                style={{ borderColor: ADMIN_TONE.rose, background: ADMIN_TONE.rose }}
                                            >
                                                Từ chối yêu cầu
                                            </button>
                                        </div>
                                    )}

                                    {actionMode === "approve" && (
                                        <div className="rounded-xl border p-5 space-y-3" style={{ borderColor: ADMIN_TONE.emerald, background: ADMIN_TONE.emeraldSoft }}>
                                            <h3 className="text-[15px] font-black" style={{ color: "#065F46" }}>
                                                Tạo tài khoản từ hồ sơ này
                                            </h3>
                                            <div className="grid gap-3 md:grid-cols-2">
                                                <input
                                                    value={createEmail}
                                                    onChange={(event) => setCreateEmail(event.target.value)}
                                                    placeholder="Email đăng nhập *"
                                                    className="rounded-xl border px-4 py-3 text-[14px] font-semibold outline-none"
                                                    style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}
                                                />
                                                <input
                                                    value={createName}
                                                    onChange={(event) => setCreateName(event.target.value)}
                                                    placeholder="Họ tên đầy đủ *"
                                                    className="rounded-xl border px-4 py-3 text-[14px] font-semibold outline-none"
                                                    style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}
                                                />
                                            </div>
                                            <input
                                                value={createPhone}
                                                onChange={(event) => setCreatePhone(event.target.value)}
                                                placeholder="Số điện thoại (tùy chọn)"
                                                className="w-full rounded-xl border px-4 py-3 text-[14px] font-semibold outline-none"
                                                style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}
                                            />
                                            <p className="text-[12px] font-semibold" style={{ color: ADMIN_TONE.muted }}>
                                                Mật khẩu tạm thời sẽ được gửi qua email cho người dùng.
                                            </p>
                                            {actionError && (
                                                <p className="text-[13px] font-bold" style={{ color: "#B23148" }}>
                                                    {actionError}
                                                </p>
                                            )}
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={handleApprove}
                                                    disabled={actionLoading}
                                                    className="flex-1 rounded-xl border py-3 text-[14px] font-extrabold text-white transition-all disabled:opacity-50 hover:scale-[0.99]"
                                                    style={{ borderColor: ADMIN_TONE.emerald, background: ADMIN_TONE.emerald }}
                                                >
                                                    {actionLoading ? "Đang tạo..." : "Xác nhận tạo"}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setActionMode("");
                                                        setActionError("");
                                                    }}
                                                    className="rounded-xl border px-5 py-3 text-[14px] font-extrabold transition-all hover:scale-[0.99]"
                                                    style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell, color: ADMIN_TONE.pageInk }}
                                                >
                                                    Hủy
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {actionMode === "reject" && (
                                        <div className="rounded-xl border p-5 space-y-3" style={{ borderColor: ADMIN_TONE.rose, background: ADMIN_TONE.roseSoft }}>
                                            <h3 className="text-[15px] font-black" style={{ color: "#9F1D34" }}>
                                                Từ chối hồ sơ này
                                            </h3>
                                            <textarea
                                                value={rejectReason}
                                                onChange={(event) => setRejectReason(event.target.value)}
                                                placeholder="Lý do từ chối *"
                                                rows={3}
                                                className="w-full resize-none rounded-xl border px-4 py-3 text-[14px] font-semibold outline-none"
                                                style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}
                                            />
                                            {actionError && (
                                                <p className="text-[13px] font-bold" style={{ color: "#B23148" }}>
                                                    {actionError}
                                                </p>
                                            )}
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={handleReject}
                                                    disabled={actionLoading}
                                                    className="flex-1 rounded-xl border py-3 text-[14px] font-extrabold text-white transition-all disabled:opacity-50 hover:scale-[0.99]"
                                                    style={{ borderColor: ADMIN_TONE.rose, background: ADMIN_TONE.rose }}
                                                >
                                                    {actionLoading ? "Đang xử lý..." : "Xác nhận từ chối"}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setActionMode("");
                                                        setActionError("");
                                                    }}
                                                    className="rounded-xl border px-5 py-3 text-[14px] font-extrabold transition-all hover:scale-[0.99]"
                                                    style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell, color: ADMIN_TONE.pageInk }}
                                                >
                                                    Hủy
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={closeModal}
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
        </div>
    );
};

export default AdminAccountRequests;
