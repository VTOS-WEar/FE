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
import { getAdminTransactions, type AdminTransactionDto, type AdminTransactionListResult } from "../../lib/api/admin";
import {
    ADMIN_TONE,
    AdminBadge,
    AdminEmptyState,
    AdminHero,
    AdminSummaryCard,
} from "../AdminShared/adminWorkspace";

const typeTone: Record<string, { bg: string; text: string; label: string }> = {
    OrderPayment: { bg: ADMIN_TONE.emeraldSoft, text: "#0C7A5D", label: "Thanh toán" },
    ProviderPayment: { bg: ADMIN_TONE.skySoft, text: "#1D63BE", label: "Chi NCC" },
    Refund: { bg: ADMIN_TONE.amberSoft, text: "#9A6506", label: "Hoàn tiền" },
};

const statusTone: Record<string, { bg: string; text: string; label: string }> = {
    Completed: { bg: ADMIN_TONE.emeraldSoft, text: "#0C7A5D", label: "Hoàn thành" },
    Pending: { bg: ADMIN_TONE.amberSoft, text: "#9A6506", label: "Chờ xử lý" },
    Processing: { bg: ADMIN_TONE.skySoft, text: "#1D63BE", label: "Đang xử lý" },
    Failed: { bg: ADMIN_TONE.roseSoft, text: "#B23148", label: "Thất bại" },
    Cancelled: { bg: "#F1F3F8", text: "#667085", label: "Đã hủy" },
    Refunded: { bg: ADMIN_TONE.violetSoft, text: "#4B39C8", label: "Đã hoàn tiền" },
};

function formatCurrency(value: number) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

export default function AdminTransactions() {
    const navigate = useNavigate();
    const sidebarConfig = useAdminSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [data, setData] = useState<AdminTransactionListResult | null>(null);
    const [page, setPage] = useState(1);
    const [filterType, setFilterType] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [loading, setLoading] = useState(true);
    const isFilteredEmptyState = !loading && !!(filterType || filterStatus) && (!data || data.items.length === 0);
    const { preserveResultsHeight, preservedHeightStyle, resultsRegionRef } = usePreservedResultsHeight(isFilteredEmptyState);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            setData(await getAdminTransactions({ page, pageSize: 15, type: filterType || undefined, status: filterStatus || undefined }));
        } catch {
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [page, filterType, filterStatus]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;
    const watchCount = useMemo(
        () => (data?.items ?? []).filter((item) => item.status === "Pending" || item.status === "Processing").length,
        [data],
    );
    const gridCols = "1fr 1.5fr 1.15fr 1.2fr 1fr 1fr 1.1fr";

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
                                    <BreadcrumbPage className="font-bold text-gray-900 text-base">Giao dịch</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </TopNavBar>

                    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8 space-y-6 nb-fade-in">
                        <AdminHero
                            eyebrow="Tai chinh"
                            title="Theo dõi giao dịch cần kiểm tra trong hệ thống."
                            description="Tập trung vào các khoản thanh toán, chi trả và hoàn tiền để phát hiện giao dịch cần theo dõi hoặc can thiệp sớm."
                            stats={[
                                { label: "Tổng giao dịch", value: loading ? "…" : String(data?.totalCount ?? 0) },
                                { label: "Cần theo dõi", value: loading ? "…" : String(watchCount) },
                            ]}
                        />

                        <section className="grid gap-4 md:grid-cols-3">
                            <AdminSummaryCard
                                label="Tổng giao dịch"
                                value={loading ? "…" : (data?.totalCount ?? 0).toLocaleString("vi-VN")}
                                detail="Khối lượng phát sinh dùng để đọc nhanh tải vận hành của hệ thống thanh toán."
                                accent={ADMIN_TONE.sky}
                            />
                            <AdminSummaryCard
                                label="Tổng giá trị"
                                value={loading ? "…" : formatCurrency(data?.totalAmountAll ?? 0)}
                                detail="Bao gồm toàn bộ các giao dịch trong phạm vi trả về của API quản trị."
                                accent={ADMIN_TONE.emerald}
                            />
                            <AdminSummaryCard
                                label="Hôm nay"
                                value={loading ? "…" : (data?.todayCount ?? 0).toLocaleString("vi-VN")}
                                detail="Giúp Admin thấy nhanh nhịp vận động tài chính trong ngày hiện tại."
                                accent={ADMIN_TONE.violet}
                            />
                        </section>

                        <section className="rounded-[24px] border p-4 shadow-soft-lg" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}>
                            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                                <select
                                    value={filterType}
                                    onChange={(event) => {
                                        preserveResultsHeight();
                                        setFilterType(event.target.value);
                                        setPage(1);
                                    }}
                                    className="min-w-[200px] rounded-xl border px-4 py-3 text-[15px] font-semibold outline-none transition-all"
                                    style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.soft, color: ADMIN_TONE.pageInk }}
                                >
                                    <option value="">Tất cả loại</option>
                                    <option value="OrderPayment">Thanh toán</option>
                                    <option value="ProviderPayment">Chi nhà cung cấp</option>
                                    <option value="Refund">Hoàn tiền</option>
                                </select>

                                <select
                                    value={filterStatus}
                                    onChange={(event) => {
                                        preserveResultsHeight();
                                        setFilterStatus(event.target.value);
                                        setPage(1);
                                    }}
                                    className="min-w-[200px] rounded-xl border px-4 py-3 text-[15px] font-semibold outline-none transition-all"
                                    style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.soft, color: ADMIN_TONE.pageInk }}
                                >
                                    <option value="">Tất cả trạng thái</option>
                                    <option value="Completed">Hoàn thành</option>
                                    <option value="Pending">Chờ xử lý</option>
                                    <option value="Processing">Đang xử lý</option>
                                    <option value="Failed">Thất bại</option>
                                    <option value="Cancelled">Đã hủy</option>
                                </select>

                                <div className="ml-auto">
                                    <AdminBadge bg={ADMIN_TONE.soft} text={ADMIN_TONE.pageInk}>
                                        Theo dõi: {watchCount}
                                    </AdminBadge>
                                </div>
                            </div>
                        </section>

                        <section className="overflow-hidden rounded-[24px] border shadow-soft-lg" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}>
                            <div
                                className="sticky top-0 z-10 hidden lg:grid items-center border-b px-5 py-4"
                                style={{ gridTemplateColumns: gridCols, borderColor: ADMIN_TONE.line, background: ADMIN_TONE.violetSoft }}
                            >
                                {["Mã GD", "Thời gian", "Loại", "Số tiền", "Đơn hàng", "Ví", "Trạng thái"].map((header) => (
                                    <div key={header} className="text-[12px] font-black uppercase tracking-[0.08em]" style={{ color: ADMIN_TONE.muted }}>
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
                                                <div key={cellIndex} className="h-5 rounded animate-pulse" style={{ background: ADMIN_TONE.violetSoft }} />
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!loading && (!data || data.items.length === 0) && (
                                <AdminEmptyState
                                    title="Không có giao dịch nào"
                                    detail="Thử thay đổi bộ lọc loại hoặc trạng thái để xem dữ liệu tài chính khác."
                                    icon="📭"
                                    bg={ADMIN_TONE.amberSoft}
                                />
                            )}

                            {!loading && data && data.items.length > 0 && (
                                <div>
                                    {data.items.map((item: AdminTransactionDto, index) => (
                                        <div
                                            key={item.id}
                                            className="hidden lg:grid items-center gap-4 border-b px-5 py-4 transition-colors hover:bg-[#F7F2FF] nb-fade-in"
                                            style={{ gridTemplateColumns: gridCols, borderColor: ADMIN_TONE.line, animationDelay: `${index * 40}ms` }}
                                        >
                                            <div className="font-mono text-[13px] font-black" style={{ color: ADMIN_TONE.muted }}>
                                                {item.id.substring(0, 8).toUpperCase()}
                                            </div>
                                            <div className="text-[14px] font-semibold" style={{ color: "#3D384A" }}>
                                                {new Date(item.createdAt).toLocaleString("vi-VN")}
                                            </div>
                                            <div>
                                                <AdminBadge bg={typeTone[item.transactionType]?.bg} text={typeTone[item.transactionType]?.text}>
                                                    {typeTone[item.transactionType]?.label || item.transactionType}
                                                </AdminBadge>
                                            </div>
                                            <div className="text-[15px] font-black text-right text-gray-900">{formatCurrency(item.amount)}</div>
                                            <div className="font-mono text-[13px] font-black" style={{ color: ADMIN_TONE.violet }}>
                                                {item.orderCode ?? "—"}
                                            </div>
                                            <div className="text-[14px] font-semibold" style={{ color: "#3D384A" }}>
                                                {item.walletOwner ?? "—"}
                                            </div>
                                            <div>
                                                <AdminBadge bg={statusTone[item.status]?.bg} text={statusTone[item.status]?.text}>
                                                    {statusTone[item.status]?.label || item.status}
                                                </AdminBadge>
                                            </div>
                                        </div>
                                    ))}

                                    {data.items.map((item: AdminTransactionDto, index) => (
                                        <div
                                            key={`mobile-${item.id}`}
                                            className="lg:hidden border-b p-4 space-y-2 nb-fade-in"
                                            style={{ borderColor: ADMIN_TONE.line, animationDelay: `${index * 40}ms` }}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="text-[16px] font-black text-gray-900">{formatCurrency(item.amount)}</div>
                                                <AdminBadge bg={statusTone[item.status]?.bg} text={statusTone[item.status]?.text}>
                                                    {statusTone[item.status]?.label || item.status}
                                                </AdminBadge>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <AdminBadge bg={typeTone[item.transactionType]?.bg} text={typeTone[item.transactionType]?.text}>
                                                    {typeTone[item.transactionType]?.label || item.transactionType}
                                                </AdminBadge>
                                                <span className="font-mono text-[12px] font-bold" style={{ color: ADMIN_TONE.muted }}>
                                                    {item.id.substring(0, 8).toUpperCase()}
                                                </span>
                                                {item.orderCode && (
                                                    <span className="font-mono text-[12px] font-bold" style={{ color: ADMIN_TONE.violet }}>
                                                        #{item.orderCode}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[13px] font-semibold" style={{ color: ADMIN_TONE.muted }}>
                                                {(item.walletOwner ?? "—") + " · " + new Date(item.createdAt).toLocaleString("vi-VN")}
                                            </div>
                                        </div>
                                    ))}

                                    <div
                                        className="flex flex-col gap-3 border-t px-5 py-4 md:flex-row md:items-center md:justify-between"
                                        style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.soft }}
                                    >
                                        <div className="text-[14px] font-bold" style={{ color: ADMIN_TONE.muted }}>
                                            Trang {page}/{totalPages} · {data.totalCount} giao dịch
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
        </div>
    );
}
