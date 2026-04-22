import { useCallback, useEffect, useState } from "react";
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
import {
    approveWithdrawal,
    getWithdrawalRequests,
    rejectWithdrawal,
    type WithdrawalRequestDto,
} from "../../lib/api/admin";
import {
    ADMIN_TONE,
    AdminBadge,
    AdminEmptyState,
    AdminHero,
    AdminSummaryCard,
} from "../AdminShared/adminWorkspace";

const statusTone: Record<string, { bg: string; text: string; label: string }> = {
    Pending: { bg: ADMIN_TONE.amberSoft, text: "#9A6506", label: "Chờ duyệt" },
    Approved: { bg: ADMIN_TONE.emeraldSoft, text: "#0C7A5D", label: "Đã duyệt" },
    Rejected: { bg: ADMIN_TONE.roseSoft, text: "#B23148", label: "Từ chối" },
};

function formatCurrency(value: number) {
    return `${value.toLocaleString("vi-VN")} ₫`;
}

function formatDate(value: string) {
    return new Date(value).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function AdminWithdrawals() {
    const navigate = useNavigate();
    const sidebarConfig = useAdminSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [items, setItems] = useState<WithdrawalRequestDto[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [filter, setFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const [actionItem, setActionItem] = useState<WithdrawalRequestDto | null>(null);
    const [actionType, setActionType] = useState<"approve" | "reject">("approve");
    const [adminNote, setAdminNote] = useState("");
    const [processing, setProcessing] = useState(false);
    const pageSize = 10;

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getWithdrawalRequests({ page, pageSize, status: filter || undefined });
            setItems(response.items || []);
            setTotal(response.total || 0);
        } finally {
            setLoading(false);
        }
    }, [page, filter]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAction = async () => {
        if (!actionItem) return;
        setProcessing(true);
        try {
            if (actionType === "approve") await approveWithdrawal(actionItem.id, adminNote || undefined);
            else await rejectWithdrawal(actionItem.id, adminNote || undefined);
            setActionItem(null);
            setAdminNote("");
            await fetchData();
        } finally {
            setProcessing(false);
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

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const pendingCount = items.filter((item) => item.status === "Pending").length;
    const gridCols = "2fr 1.3fr 2fr 1.4fr 1.15fr 1.35fr";

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
                                    <BreadcrumbPage className="font-bold text-gray-900 text-base">Yêu cầu rút tiền</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </TopNavBar>

                    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8 space-y-6 nb-fade-in">
                        <AdminHero
                            eyebrow="Payout"
                            title="Duyệt payout theo độ sẵn sàng và độ tồn đọng, không theo modal rời rạc."
                            description="Màn hình này tập trung vào quyết định payout: hồ sơ nào đang chờ, số tiền nào cần ưu tiên và tài khoản ngân hàng nào sẽ nhận chuyển khoản."
                            stats={[
                                { label: "Đang hiển thị", value: loading ? "…" : String(items.length) },
                                { label: "Chờ duyệt", value: loading ? "…" : String(pendingCount) },
                            ]}
                        />

                        <section className="grid gap-4 md:grid-cols-3">
                            <AdminSummaryCard
                                label="Tổng yêu cầu"
                                value={loading ? "…" : total.toLocaleString("vi-VN")}
                                detail="Tổng số payout trong danh sách quản trị ở trạng thái lọc hiện tại."
                                accent={ADMIN_TONE.sky}
                            />
                            <AdminSummaryCard
                                label="Cần duyệt ngay"
                                value={loading ? "…" : pendingCount.toLocaleString("vi-VN")}
                                detail="Đây là nhóm Admin cần quyết định sớm để tránh kéo dài chu kỳ thanh toán."
                                accent={ADMIN_TONE.amber}
                            />
                            <AdminSummaryCard
                                label="Đã xử lý"
                                value={loading ? "…" : (items.filter((item) => item.status !== "Pending").length).toLocaleString("vi-VN")}
                                detail="Giúp đọc nhanh nhịp độ xử lý payout trên màn hình vận hành tài chính."
                                accent={ADMIN_TONE.emerald}
                            />
                        </section>

                        <section className="rounded-[24px] border p-4 shadow-soft-lg" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}>
                            <div className="flex flex-wrap items-center gap-3">
                                {[
                                    { value: "", label: "Tất cả" },
                                    { value: "Pending", label: "Chờ duyệt" },
                                    { value: "Approved", label: "Đã duyệt" },
                                    { value: "Rejected", label: "Từ chối" },
                                ].map((tab) => (
                                    <button
                                        key={tab.value}
                                        onClick={() => {
                                            setFilter(tab.value);
                                            setPage(1);
                                        }}
                                        className="rounded-full border px-4 py-1.5 text-[13px] font-extrabold transition-all hover:scale-[0.99]"
                                        style={{
                                            borderColor: filter === tab.value ? ADMIN_TONE.violet : ADMIN_TONE.line,
                                            background: filter === tab.value ? ADMIN_TONE.violet : ADMIN_TONE.shell,
                                            color: filter === tab.value ? "#fff" : ADMIN_TONE.pageInk,
                                        }}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="overflow-hidden rounded-[24px] border shadow-soft-lg" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}>
                            <div
                                className="sticky top-0 z-10 hidden lg:grid items-center border-b px-5 py-4"
                                style={{ gridTemplateColumns: gridCols, borderColor: ADMIN_TONE.line, background: ADMIN_TONE.violetSoft }}
                            >
                                {["Tổ chức", "Số tiền", "Ngân hàng", "Ngày yêu cầu", "Trạng thái", "Hành động"].map((header, index, arr) => (
                                    <div
                                        key={header}
                                        className={`text-[12px] font-black uppercase tracking-[0.08em]${index === arr.length - 1 ? " text-right" : ""}`}
                                        style={{ color: ADMIN_TONE.muted }}
                                    >
                                        {header}
                                    </div>
                                ))}
                            </div>

                            {loading && (
                                <div className="space-y-3 px-5 py-5">
                                    {Array.from({ length: 5 }).map((_, index) => (
                                        <div
                                            key={index}
                                            className="hidden lg:grid items-center gap-4 rounded-[14px] border px-4 py-4"
                                            style={{ gridTemplateColumns: gridCols, borderColor: ADMIN_TONE.line, background: ADMIN_TONE.soft }}
                                        >
                                            {Array.from({ length: 6 }).map((__, cellIndex) => (
                                                <div key={cellIndex} className="h-5 rounded animate-pulse" style={{ background: ADMIN_TONE.violetSoft }} />
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!loading && items.length === 0 && (
                                <AdminEmptyState
                                    title="Chưa có yêu cầu rút tiền nào"
                                    detail="Không tìm thấy yêu cầu rút tiền phù hợp bộ lọc hiện tại."
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
                                            <div className="text-[15px] font-black text-gray-900">{item.schoolName || "—"}</div>
                                            <div className="text-[16px] font-black" style={{ color: ADMIN_TONE.rose }}>
                                                {formatCurrency(item.amount)}
                                            </div>
                                            <div>
                                                <div className="text-[14px] font-bold text-gray-900">{item.bankName || "—"}</div>
                                                <div className="text-[12px] font-semibold" style={{ color: ADMIN_TONE.muted }}>
                                                    {item.bankAccount || "—"}
                                                </div>
                                            </div>
                                            <div className="text-[14px] font-semibold" style={{ color: "#3D384A" }}>
                                                {formatDate(item.requestedAt)}
                                            </div>
                                            <div>
                                                <AdminBadge bg={statusTone[item.status]?.bg} text={statusTone[item.status]?.text}>
                                                    {statusTone[item.status]?.label || item.status}
                                                </AdminBadge>
                                            </div>
                                            <div className="flex justify-end">
                                                {item.status === "Pending" ? (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setActionItem(item);
                                                                setActionType("approve");
                                                            }}
                                                            className="rounded-xl border px-3 py-2 text-[12px] font-extrabold text-white transition-all hover:scale-[0.99]"
                                                            style={{ borderColor: ADMIN_TONE.emerald, background: ADMIN_TONE.emerald }}
                                                        >
                                                            Duyệt
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setActionItem(item);
                                                                setActionType("reject");
                                                            }}
                                                            className="rounded-xl border px-3 py-2 text-[12px] font-extrabold text-white transition-all hover:scale-[0.99]"
                                                            style={{ borderColor: ADMIN_TONE.rose, background: ADMIN_TONE.rose }}
                                                        >
                                                            Từ chối
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[12px] font-semibold" style={{ color: ADMIN_TONE.muted }}>
                                                        {item.processedAt ? formatDate(item.processedAt) : "—"}
                                                    </span>
                                                )}
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
                                                    <div className="text-[16px] font-black text-gray-900">{item.schoolName || "—"}</div>
                                                    <div className="mt-1 text-[18px] font-black" style={{ color: ADMIN_TONE.rose }}>
                                                        {formatCurrency(item.amount)}
                                                    </div>
                                                </div>
                                                <AdminBadge bg={statusTone[item.status]?.bg} text={statusTone[item.status]?.text}>
                                                    {statusTone[item.status]?.label || item.status}
                                                </AdminBadge>
                                            </div>
                                            <div className="text-[13px] font-semibold" style={{ color: ADMIN_TONE.muted }}>
                                                {(item.bankName || "—") + " — " + (item.bankAccount || "—") + " · " + formatDate(item.requestedAt)}
                                            </div>
                                            {item.status === "Pending" && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setActionItem(item);
                                                            setActionType("approve");
                                                        }}
                                                        className="flex-1 rounded-xl border py-2 text-[13px] font-extrabold text-white transition-all hover:scale-[0.99]"
                                                        style={{ borderColor: ADMIN_TONE.emerald, background: ADMIN_TONE.emerald }}
                                                    >
                                                        Duyệt
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setActionItem(item);
                                                            setActionType("reject");
                                                        }}
                                                        className="flex-1 rounded-xl border py-2 text-[13px] font-extrabold text-white transition-all hover:scale-[0.99]"
                                                        style={{ borderColor: ADMIN_TONE.rose, background: ADMIN_TONE.rose }}
                                                    >
                                                        Từ chối
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    <div
                                        className="flex flex-col gap-3 border-t px-5 py-4 md:flex-row md:items-center md:justify-between"
                                        style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.soft }}
                                    >
                                        <div className="text-[14px] font-bold" style={{ color: ADMIN_TONE.muted }}>
                                            Trang {page}/{totalPages} · {total} yêu cầu
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
                        </section>
                    </main>
                </div>
            </div>

            {actionItem && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 nb-backdrop-enter"
                    style={{ background: "rgba(25, 24, 43, 0.55)" }}
                    onClick={() => {
                        setActionItem(null);
                        setAdminNote("");
                    }}
                >
                    <div
                        className="w-full max-w-md rounded-2xl border p-6 space-y-5 nb-modal-enter shadow-soft-lg"
                        style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-[22px] font-black text-gray-900">
                                {actionType === "approve" ? "Duyệt yêu cầu rút tiền" : "Từ chối yêu cầu rút tiền"}
                            </h3>
                            <button
                                onClick={() => {
                                    setActionItem(null);
                                    setAdminNote("");
                                }}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border text-[16px] font-black transition-all hover:scale-[0.99]"
                                style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}
                            >
                                ×
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: "Tổ chức", value: actionItem.schoolName || "—" },
                                { label: "Số tiền", value: formatCurrency(actionItem.amount), color: ADMIN_TONE.rose },
                                { label: "Ngân hàng", value: `${actionItem.bankName || "—"} — ${actionItem.bankAccount || "—"}`, span: true },
                            ].map((item, index) => (
                                <div key={index} className={item.span ? "col-span-2" : ""}>
                                    <p className="mb-1 text-[12px] font-black uppercase tracking-wide" style={{ color: ADMIN_TONE.muted }}>
                                        {item.label}
                                    </p>
                                    <p className="text-[15px] font-bold" style={{ color: item.color || ADMIN_TONE.pageInk }}>
                                        {item.value}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div>
                            <label className="mb-2 block text-[12px] font-black uppercase tracking-wide" style={{ color: ADMIN_TONE.muted }}>
                                Ghi chú (tùy chọn)
                            </label>
                            <textarea
                                value={adminNote}
                                onChange={(event) => setAdminNote(event.target.value)}
                                placeholder="Nhập ghi chú..."
                                className="h-20 w-full resize-none rounded-xl border px-4 py-3 text-[14px] font-semibold outline-none"
                                style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setActionItem(null);
                                    setAdminNote("");
                                }}
                                className="flex-1 rounded-xl border py-3 text-[15px] font-extrabold transition-all hover:scale-[0.99]"
                                style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell, color: ADMIN_TONE.pageInk }}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleAction}
                                disabled={processing}
                                className="flex-1 rounded-xl border py-3 text-[15px] font-extrabold text-white transition-all disabled:opacity-50 hover:scale-[0.99]"
                                style={{
                                    borderColor: actionType === "approve" ? ADMIN_TONE.emerald : ADMIN_TONE.rose,
                                    background: actionType === "approve" ? ADMIN_TONE.emerald : ADMIN_TONE.rose,
                                }}
                            >
                                {processing ? "Đang xử lý..." : actionType === "approve" ? "Xác nhận duyệt" : "Xác nhận từ chối"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
