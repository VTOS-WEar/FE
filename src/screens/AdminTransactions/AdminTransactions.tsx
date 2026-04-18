import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useAdminSidebarConfig } from "../../hooks/useAdminSidebarConfig";
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { getAdminTransactions, type AdminTransactionDto, type AdminTransactionListResult } from "../../lib/api/admin";

/* ── Design tokens ── */
const T = {
    surface: "#FFFFFF", surfaceSoft: "#FFFDF9",
    primary: "#8B6BFF", primarySoft: "#E9E1FF",
    successSoft: "#D9F8E8", warningSoft: "#FFF1BF", dangerSoft: "#FFE3D8",
    infoSoft: "#DCEBFF", muted: "#6F6A7D",
};

const TYPE_TONE: Record<string, { bg: string; text: string; label: string }> = {
    OrderPayment: { bg: T.successSoft, text: "#187A4C", label: "Thanh toán" },
    ProviderPayment: { bg: T.infoSoft, text: "#2758B8", label: "Chi NCC" },
    Refund: { bg: T.warningSoft, text: "#9A590E", label: "Hoàn tiền" },
};
const STATUS_TONE: Record<string, { bg: string; text: string }> = {
    Completed: { bg: T.successSoft, text: "#187A4C" },
    Pending: { bg: T.warningSoft, text: "#9A590E" },
    Processing: { bg: T.infoSoft, text: "#2758B8" },
    Failed: { bg: T.dangerSoft, text: "#B2452D" },
    Cancelled: { bg: "#F0EDF5", text: "#6F6A7D" },
    Refunded: { bg: T.primarySoft, text: "#5F45D8" },
};

function Badge({ children, tone }: { children: React.ReactNode; tone?: { bg: string; text: string } }) {
    const t = tone || { bg: T.surface, text: "#374151" };
    return (
        <span className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-[12px] font-black uppercase tracking-wide shadow-soft-sm"
            style={{ background: t.bg, color: t.text }}>
            {children}
        </span>
    );
}

const fmt = (n: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

export default function AdminTransactions() {
    const navigate = useNavigate();
    const sidebarConfig = useAdminSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [data, setData] = useState<AdminTransactionListResult | null>(null);
    const [page, setPage] = useState(1);
    const [filterType, setFilterType] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            setData(await getAdminTransactions({ page, pageSize: 15, type: filterType || undefined, status: filterStatus || undefined }));
        } catch (e) { console.error(e); }
        setLoading(false);
    }, [page, filterType, filterStatus]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleLogout = () => {
        localStorage.removeItem("access_token"); localStorage.removeItem("user"); localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token"); sessionStorage.removeItem("user"); sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;
    const gridCols = "1fr 1.5fr 1.2fr 1.3fr 1fr 1fr 1.2fr";

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
                            <BreadcrumbItem><BreadcrumbPage className="font-bold text-gray-900 text-base">Giao dịch</BreadcrumbPage></BreadcrumbItem>
                        </BreadcrumbList></Breadcrumb>
                    </TopNavBar>
                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6 nb-fade-in">
                        {/* Header */}
                        <div>
                            <h1 className="text-[40px] font-black leading-none md:text-[48px] text-gray-900">💳 Theo dõi giao dịch</h1>
                            <p className="mt-3 max-w-3xl text-[17px] font-semibold leading-8" style={{ color: T.muted }}>
                                Giám sát tất cả giao dịch thanh toán, chi trả nhà cung cấp và hoàn tiền.
                            </p>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { label: "Tổng giao dịch", value: data?.totalCount ?? 0, color: T.primary },
                                { label: "Tổng giá trị", value: fmt(data?.totalAmountAll ?? 0), color: "#10B981" },
                                { label: "Hôm nay", value: data?.todayCount ?? 0, color: "#3B82F6" },
                            ].map((s, i) => (
                                <div key={i} className="rounded-2xl border border-gray-200 p-5 shadow-soft-lg">
                                    <p className="text-[12px] font-black uppercase tracking-wide" style={{ color: T.muted }}>{s.label}</p>
                                    <p className="text-[28px] font-black mt-1" style={{ color: s.color }}>{s.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Toolbar */}
                        <div className="rounded-2xl border border-gray-200 p-4 shadow-soft-lg">
                            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                                <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}
                                    className="min-w-[180px] rounded-xl border border-gray-200 px-4 py-3 text-[15px] font-semibold outline-none transition-all placeholder:text-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50 focus:outline-none"
                                    style={{ background: T.surface }}>
                                    <option value="">Tất cả loại</option>
                                    <option value="OrderPayment">Thanh toán</option>
                                    <option value="ProviderPayment">Chi Nhà Cung Cấp</option>
                                    <option value="Refund">Hoàn tiền</option>
                                </select>
                                <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                                    className="min-w-[180px] rounded-xl border border-gray-200 px-4 py-3 text-[15px] font-semibold outline-none transition-all placeholder:text-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50 focus:outline-none"
                                    style={{ background: T.surface }}>
                                    <option value="">Tất cả trạng thái</option>
                                    <option value="Completed">Hoàn thành</option>
                                    <option value="Pending">Chờ xử lý</option>
                                    <option value="Processing">Đang xử lý</option>
                                    <option value="Failed">Thất bại</option>
                                    <option value="Cancelled">Đã hủy</option>
                                </select>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-soft-lg">
                            <div className="sticky top-0 z-10 hidden lg:grid items-center border-b border-gray-200 px-5 py-4"
                                style={{ gridTemplateColumns: gridCols, background: T.primarySoft }}>
                                {["Mã GD", "Thời gian", "Loại", "Số tiền", "Đơn hàng", "Ví", "Trạng thái"].map(h => (
                                    <div key={h} className="text-[12px] font-black uppercase tracking-[0.08em]" style={{ color: "#4E4A5B" }}>{h}</div>
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
                            {!loading && data?.items.length === 0 && (
                                <div className="flex min-h-[240px] flex-col items-center justify-center px-6 py-12 text-center">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200 text-[28px] shadow-soft-md"
                                        style={{ background: T.warningSoft }}>📭</div>
                                    <div className="mt-5 text-[28px] font-black">Không có giao dịch nào</div>
                                    <p className="mt-3 max-w-lg text-[15px] font-semibold leading-7" style={{ color: T.muted }}>
                                        Thử thay đổi bộ lọc loại hoặc trạng thái để xem giao dịch khác.
                                    </p>
                                </div>
                            )}

                            {/* Rows */}
                            {!loading && data && data.items.length > 0 && (
                                <div>
                                    {data.items.map((t, idx) => {
                                        const typeMeta = TYPE_TONE[t.transactionType] || { bg: T.surface, text: "#374151", label: t.transactionType };
                                        return (
                                            <div key={t.id} className="hidden lg:grid items-center gap-4 border-b px-5 py-4 transition-colors hover:bg-[#F7F2FF] nb-fade-in"
                                                style={{ gridTemplateColumns: gridCols, borderColor: "#D9D4E6", animationDelay: `${idx * 40}ms` }}>
                                                <div className="text-[13px] font-black font-mono" style={{ color: T.muted }}>{t.id.substring(0, 8).toUpperCase()}</div>
                                                <div className="text-[14px] font-semibold" style={{ color: "#3D384A" }}>{new Date(t.createdAt).toLocaleString("vi-VN")}</div>
                                                <div><Badge tone={{ bg: typeMeta.bg, text: typeMeta.text }}>{typeMeta.label}</Badge></div>
                                                <div className="text-[15px] font-black text-right text-gray-900">{fmt(t.amount)}</div>
                                                <div className="text-[13px] font-black font-mono" style={{ color: "#4338CA" }}>{t.orderCode ?? "—"}</div>
                                                <div className="text-[14px] font-semibold" style={{ color: "#3D384A" }}>{t.walletOwner ?? "—"}</div>
                                                <div><Badge tone={STATUS_TONE[t.status]}>{t.status}</Badge></div>
                                            </div>
                                        );
                                    })}

                                    {/* Mobile cards */}
                                    {data.items.map((t, idx) => {
                                        const typeMeta = TYPE_TONE[t.transactionType] || { bg: T.surface, text: "#374151", label: t.transactionType };
                                        return (
                                            <div key={`m-${t.id}`} className="lg:hidden border-b p-4 space-y-2 nb-fade-in"
                                                style={{ borderColor: "#D9D4E6", animationDelay: `${idx * 40}ms` }}>
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="text-[16px] font-black text-gray-900">{fmt(t.amount)}</div>
                                                    <Badge tone={STATUS_TONE[t.status]}>{t.status}</Badge>
                                                </div>
                                                <div className="flex flex-wrap gap-2 items-center">
                                                    <Badge tone={{ bg: typeMeta.bg, text: typeMeta.text }}>{typeMeta.label}</Badge>
                                                    <span className="text-[12px] font-bold font-mono" style={{ color: T.muted }}>{t.id.substring(0, 8).toUpperCase()}</span>
                                                    {t.orderCode && <span className="text-[12px] font-bold font-mono" style={{ color: "#4338CA" }}>#{t.orderCode}</span>}
                                                </div>
                                                <div className="text-[13px] font-semibold" style={{ color: T.muted }}>
                                                    {t.walletOwner ?? "—"} • {new Date(t.createdAt).toLocaleString("vi-VN")}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Pagination */}
                                    <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 md:flex-row md:items-center md:justify-between"
                                        style={{ background: T.surfaceSoft }}>
                                        <div className="text-[14px] font-bold" style={{ color: T.muted }}>
                                            Trang {page}/{totalPages} · {data.totalCount} giao dịch
                                        </div>
                                        {totalPages > 1 && (
                                            <div className="flex gap-3">
                                                <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}
                                                    className="rounded-xl border border-gray-200 px-4 py-2 text-[13px] font-extrabold transition-all disabled:opacity-40 hover:scale-[0.99] hover:shadow-soft-sm active:scale-[0.98] active:shadow-none"
                                                    style={{ background: T.surface, color: "#374151" }}>← Trước</button>
                                                <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                                    className="rounded-xl border border-gray-200 px-4 py-2 text-[13px] font-extrabold text-white transition-all disabled:opacity-40 hover:scale-[0.99] hover:shadow-soft-sm active:scale-[0.98] active:shadow-none"
                                                    style={{ background: T.primary }}>Sau →</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
