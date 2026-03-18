import { useState, useEffect, useCallback } from "react";
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { DashboardSidebar } from "../../components/layout";
import { useSidebarConfig } from "../../hooks/useSidebarConfig";
import {
    getSchoolOrders,
    type SchoolOrderDto,
} from "../../lib/api/orders";

/* ── Status config ── */
const STATUS_COLORS: Record<string, string> = {
    Pending: "#f59e0b",
    Paid: "#3b82f6",
    Confirmed: "#6366f1",
    Processed: "#8b5cf6",
    Shipped: "#f97316",
    Delivered: "#10b981",
    Cancelled: "#ef4444",
    Refunded: "#6b7280",
};
const STATUS_LABELS: Record<string, string> = {
    Pending: "Chờ thanh toán",
    Paid: "Đã thanh toán",
    Confirmed: "Đã xác nhận",
    Processed: "Đang xử lý",
    Shipped: "Đang giao",
    Delivered: "Đã giao",
    Cancelled: "Đã huỷ",
    Refunded: "Đã hoàn tiền",
};
const STATUS_FILTER_TABS = ["", "Pending", "Paid", "Confirmed", "Processed", "Shipped", "Delivered", "Cancelled", "Refunded"];

/* ── Helpers ── */
function formatVND(amount: number): string {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}
function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/* ── Component ── */
export const OrderManagement = (): JSX.Element => {
    const sidebarConfig = useSidebarConfig();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Data state
    const [orders, setOrders] = useState<SchoolOrderDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 10;

    // Detail modal
    const [detail, setDetail] = useState<SchoolOrderDto | null>(null);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getSchoolOrders(page, pageSize, statusFilter || undefined);
            setOrders(res.items);
            setTotal(res.totalCount);
        } catch (e: any) {
            console.error("Error fetching orders:", e);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const totalPages = Math.ceil(total / pageSize);

    // Compute stats from current page
    const statsProcessing = orders.filter(o => ["Paid", "Confirmed", "Processed"].includes(o.orderStatus)).length;
    const statsCompleted = orders.filter(o => ["Shipped", "Delivered"].includes(o.orderStatus)).length;
    const statsCancelled = orders.filter(o => ["Cancelled", "Refunded"].includes(o.orderStatus)).length;

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "#f5f5f5" }}>
            <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[20rem] xl:w-[23.75rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(c => !c)} />
            </div>

            <main style={{ flex: 1, padding: "32px 40px" }}>
                {/* Breadcrumb */}
                <div style={{ marginBottom: 8 }}>
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem><BreadcrumbLink href="/school/dashboard" className="font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                            <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                            <BreadcrumbItem><BreadcrumbPage className="font-semibold text-[#4c5769] text-base">Đơn hàng</BreadcrumbPage></BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>

                <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1a1a2e", margin: "24px 0" }}>📦 Quản lý Đơn hàng</h1>

                {/* Stats Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                    {[
                        { label: "Tổng đơn hàng", value: total, color: "#6366f1", icon: "📦" },
                        { label: "Đang xử lý", value: statsProcessing, color: "#3b82f6", icon: "⏳" },
                        { label: "Hoàn thành", value: statsCompleted, color: "#10b981", icon: "✅" },
                        { label: "Đã huỷ", value: statsCancelled, color: "#ef4444", icon: "❌" },
                    ].map((stat, i) => (
                        <div key={i} style={{
                            background: "#fff", borderRadius: 16, padding: "20px 24px",
                            boxShadow: "0 2px 12px rgba(0,0,0,.06)",
                            borderLeft: `5px solid ${stat.color}`,
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <span style={{ fontSize: 28 }}>{stat.icon}</span>
                                <div>
                                    <p style={{ margin: 0, color: "#888", fontSize: 13, fontWeight: 600 }}>{stat.label}</p>
                                    <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#1a1a2e" }}>{stat.value}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Status filter tabs */}
                <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
                    {STATUS_FILTER_TABS.map(s => (
                        <button
                            key={s}
                            onClick={() => { setStatusFilter(s); setPage(1); }}
                            style={{
                                padding: "8px 20px", borderRadius: 20, border: "none", cursor: "pointer",
                                background: statusFilter === s ? "#6366f1" : "#e8e8e8",
                                color: statusFilter === s ? "#fff" : "#555",
                                fontWeight: 600, fontSize: 14, transition: "all .2s",
                            }}
                        >
                            {s ? STATUS_LABELS[s] || s : "Tất cả"}
                        </button>
                    ))}
                </div>

                {/* Order list */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: 60, color: "#999" }}>Đang tải...</div>
                ) : orders.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 60, background: "#fff", borderRadius: 16, color: "#aaa" }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
                        <p style={{ fontSize: 16 }}>Chưa có đơn hàng nào.</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gap: 12 }}>
                        {orders.map(o => (
                            <div
                                key={o.orderId}
                                onClick={() => setDetail(o)}
                                style={{
                                    background: "#fff", borderRadius: 16, padding: "20px 28px",
                                    boxShadow: "0 2px 12px rgba(0,0,0,.06)", cursor: "pointer",
                                    borderLeft: `5px solid ${STATUS_COLORS[o.orderStatus] || "#ccc"}`,
                                    transition: "transform .15s, box-shadow .15s",
                                }}
                                onMouseOver={e => { (e.currentTarget as any).style.transform = "translateY(-2px)"; (e.currentTarget as any).style.boxShadow = "0 6px 20px rgba(0,0,0,.1)"; }}
                                onMouseOut={e => { (e.currentTarget as any).style.transform = "none"; (e.currentTarget as any).style.boxShadow = "0 2px 12px rgba(0,0,0,.06)"; }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                                            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "#1a1a2e" }}>
                                                Đơn #{o.orderId.slice(0, 8).toUpperCase()}
                                            </h3>
                                            <span style={{
                                                padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                                                background: `${STATUS_COLORS[o.orderStatus] || "#888"}18`,
                                                color: STATUS_COLORS[o.orderStatus] || "#888",
                                            }}>
                                                {STATUS_LABELS[o.orderStatus] || o.orderStatus}
                                            </span>
                                        </div>
                                        <p style={{ margin: 0, color: "#888", fontSize: 14 }}>
                                            👤 {o.parentName} &nbsp;·&nbsp; 👦 {o.childName}
                                            {o.campaignName && <> &nbsp;·&nbsp; 🏷️ {o.campaignName}</>}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1a1a2e" }}>
                                            {formatVND(o.totalAmount)}
                                        </p>
                                        <p style={{ margin: "2px 0 0", color: "#999", fontSize: 13 }}>
                                            {formatDate(o.orderDate)} · {o.itemCount} sản phẩm
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <button key={p} onClick={() => setPage(p)} style={{
                                width: 36, height: 36, borderRadius: "50%", border: "none", cursor: "pointer",
                                background: page === p ? "#6366f1" : "#e8e8e8",
                                color: page === p ? "#fff" : "#555", fontWeight: 600, fontSize: 14,
                            }}>{p}</button>
                        ))}
                    </div>
                )}

                {/* Detail Modal */}
                {detail && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
                        onClick={e => { if (e.target === e.currentTarget) setDetail(null); }}>
                        <div style={{ background: "#fff", borderRadius: 20, padding: 36, width: "90%", maxWidth: 560 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>📦 Chi tiết đơn hàng</h2>
                                <span style={{
                                    padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                                    background: `${STATUS_COLORS[detail.orderStatus]}18`,
                                    color: STATUS_COLORS[detail.orderStatus],
                                }}>
                                    {STATUS_LABELS[detail.orderStatus] || detail.orderStatus}
                                </span>
                            </div>

                            <div style={{ display: "grid", gap: 12 }}>
                                <InfoRow label="Mã đơn" value={detail.orderId} />
                                <InfoRow label="Phụ huynh" value={detail.parentName} />
                                <InfoRow label="Học sinh" value={detail.childName} />
                                <InfoRow label="Chiến dịch" value={detail.campaignName || "—"} />
                                <InfoRow label="Số sản phẩm" value={String(detail.itemCount)} />
                                <InfoRow label="Tổng tiền" value={formatVND(detail.totalAmount)} />
                                <InfoRow label="Ngày đặt" value={formatDate(detail.orderDate)} />
                            </div>

                            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                                <button onClick={() => setDetail(null)} style={{
                                    flex: 1, padding: "12px 0", borderRadius: 12,
                                    border: "1px solid #ddd", background: "#fff", fontWeight: 600, cursor: "pointer",
                                    fontFamily: "'Montserrat', sans-serif", fontSize: 15,
                                }}>Đóng</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ display: "flex", gap: 12 }}>
            <span style={{ minWidth: 120, fontWeight: 600, color: "#666", fontSize: 14 }}>{label}:</span>
            <span style={{ color: "#333", fontSize: 14, wordBreak: "break-all" }}>{value}</span>
        </div>
    );
}
