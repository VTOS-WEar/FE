import { useState, useEffect, useCallback } from "react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { DashboardSidebar } from "../../components/layout";
import { useProviderSidebarConfig } from "../../hooks/useProviderSidebarConfig";
import {
    getProviderProductionOrders,
    getProviderProductionOrderDetail,
    acceptProductionOrder,
    completeProductionOrder,
    providerRejectProductionOrder,
    providerDeliver,
    getProviderDeliveryStatus,
    type ProductionOrderListItemDto,
    type ProductionOrderDetailDto,
    type DeliveryStatusResponse,
} from "../../lib/api/productionOrders";

const STATUS_COLORS: Record<string, string> = {
    Pending: "#f59e0b",
    Approved: "#3b82f6",
    InProduction: "#8b5cf6",
    Completed: "#10b981",
    Rejected: "#ef4444",
    Delivered: "#06b6d4",
};

const STATUS_LABELS: Record<string, string> = {
    Pending: "Chờ xử lý",
    Approved: "Đã duyệt",
    InProduction: "Đang sản xuất",
    Completed: "Hoàn thành",
    Rejected: "Từ chối",
    Delivered: "Đã giao",
};

export function ProviderProductionOrders() {
    const sidebarConfig = useProviderSidebarConfig();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const [orders, setOrders] = useState<ProductionOrderListItemDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [detail, setDetail] = useState<ProductionOrderDetailDto | null>(null);
    const [showDetail, setShowDetail] = useState(false);
    const [showReject, setShowReject] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    // Phase 4 — Delivery
    const [showDeliver, setShowDeliver] = useState(false);
    const [deliverQty, setDeliverQty] = useState(0);
    const [deliverNote, setDeliverNote] = useState("");
    const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatusResponse | null>(null);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getProviderProductionOrders(1, 50, statusFilter || undefined);
            setOrders(res.items);
        } catch (e: any) {
            console.error("Error fetching production orders:", e);
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);



    const handleAccept = async () => {
        if (!detail) return;
        setActionLoading(true);
        try {
            await acceptProductionOrder(detail.batchId);
            setShowDetail(false);
            fetchOrders();
        } catch (e: any) {
            alert(e.message || "Lỗi chấp nhận đơn");
        } finally {
            setActionLoading(false);
        }
    };

    const handleComplete = async () => {
        if (!detail) return;
        setActionLoading(true);
        try {
            await completeProductionOrder(detail.batchId);
            setShowDetail(false);
            fetchOrders();
        } catch (e: any) {
            alert(e.message || "Lỗi hoàn thành đơn");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!detail || !rejectReason.trim()) return;
        setActionLoading(true);
        try {
            await providerRejectProductionOrder(detail.batchId, rejectReason);
            setShowReject(false);
            setShowDetail(false);
            setRejectReason("");
            fetchOrders();
        } catch (e: any) {
            alert(e.message || "Lỗi từ chối đơn");
        } finally {
            setActionLoading(false);
        }
    };

    // Phase 4 — Delivery handlers
    const loadDeliveryHistory = async (batchId: string) => {
        try {
            const ds = await getProviderDeliveryStatus(batchId);
            setDeliveryStatus(ds);
        } catch (e: any) { console.error("Error loading delivery status:", e); }
    };

    const handleDeliver = async () => {
        if (!detail || deliverQty <= 0) return;
        setActionLoading(true);
        try {
            const res = await providerDeliver(detail.batchId, { quantity: deliverQty, note: deliverNote || undefined });
            alert(res.message);
            setShowDeliver(false);
            setDeliverQty(0);
            setDeliverNote("");
            loadDeliveryHistory(detail.batchId);
            // Refresh detail to get updated status
            const updated = await getProviderProductionOrderDetail(detail.batchId);
            setDetail(updated);
            fetchOrders();
        } catch (e: any) { alert(e.message || "Lỗi giao hàng"); }
        finally { setActionLoading(false); }
    };

    const openDetailWithDelivery = async (id: string) => {
        try {
            const d = await getProviderProductionOrderDetail(id);
            setDetail(d);
            setShowDetail(true);
            if (d.status === "Completed" || d.status === "Delivered") {
                loadDeliveryHistory(id);
            }
        } catch (e: any) {
            console.error("Error fetching detail:", e);
        }
    };

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "#f5f5f5" }}>
            <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[20rem] xl:w-[23.75rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(c => !c)} />
            </div>

            <main style={{ flex: 1, padding: "32px 40px" }}>
                <div style={{ marginBottom: 8 }}>
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem><BreadcrumbLink href="/provider/dashboard" className="font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                            <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                            <BreadcrumbItem><BreadcrumbPage className="font-semibold text-[#4c5769] text-base">Đơn sản xuất</BreadcrumbPage></BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "24px 0" }}>
                    <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1a1a2e" }}>🏭 Đơn sản xuất</h1>
                </div>

                {/* Status filter tabs */}
                <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
                    {["", "Pending", "Approved", "InProduction", "Completed", "Rejected", "Delivered"].map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
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
                        <div style={{ fontSize: 48, marginBottom: 12 }}>🏭</div>
                        <p style={{ fontSize: 16 }}>Chưa có đơn sản xuất nào được giao.</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gap: 16 }}>
                        {orders.map(o => (
                            <div
                                key={o.batchId}
                                onClick={() => openDetailWithDelivery(o.batchId)}
                                style={{
                                    background: "#fff", borderRadius: 16, padding: "20px 28px",
                                    boxShadow: "0 2px 12px rgba(0,0,0,.06)", cursor: "pointer",
                                    borderLeft: `5px solid ${STATUS_COLORS[o.status] || "#ccc"}`,
                                    transition: "transform .15s, box-shadow .15s",
                                }}
                                onMouseOver={e => { (e.currentTarget as any).style.transform = "translateY(-2px)"; (e.currentTarget as any).style.boxShadow = "0 6px 20px rgba(0,0,0,.1)"; }}
                                onMouseOut={e => { (e.currentTarget as any).style.transform = "none"; (e.currentTarget as any).style.boxShadow = "0 2px 12px rgba(0,0,0,.06)"; }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#1a1a2e" }}>{o.batchName}</h3>
                                        <p style={{ margin: "4px 0 0", color: "#888", fontSize: 14 }}>
                                            Chiến dịch: <strong>{o.campaignName}</strong> &nbsp;·&nbsp;
                                            Trường: <strong>{o.schoolName || "—"}</strong> &nbsp;·&nbsp;
                                            SL: <strong>{o.totalQuantity}</strong> &nbsp;·&nbsp;
                                            {new Date(o.createdDate).toLocaleDateString("vi")}
                                        </p>
                                        {o.deliveryDeadline && (
                                            <p style={{ margin: "2px 0 0", color: "#666", fontSize: 13 }}>
                                                📅 Hạn giao: <strong>{new Date(o.deliveryDeadline).toLocaleDateString("vi")}</strong>
                                            </p>
                                        )}
                                    </div>
                                    <span style={{
                                        padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                                        background: `${STATUS_COLORS[o.status]}18`,
                                        color: STATUS_COLORS[o.status],
                                    }}>
                                        {STATUS_LABELS[o.status] || o.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Detail Modal */}
                {showDetail && detail && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                        <div style={{ background: "#fff", borderRadius: 20, padding: 36, width: "90%", maxWidth: 700, maxHeight: "85vh", overflow: "auto" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>📋 {detail.batchName}</h2>
                                <span style={{
                                    padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                                    background: `${STATUS_COLORS[detail.status]}18`,
                                    color: STATUS_COLORS[detail.status],
                                }}>
                                    {STATUS_LABELS[detail.status] || detail.status}
                                </span>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                                <div style={{ padding: 12, background: "#f8fafc", borderRadius: 10 }}>
                                    <p style={{ margin: 0, color: "#888", fontSize: 13 }}>Chiến dịch</p>
                                    <p style={{ margin: "4px 0 0", fontWeight: 600 }}>{detail.campaignName}</p>
                                </div>
                                <div style={{ padding: 12, background: "#f8fafc", borderRadius: 10 }}>
                                    <p style={{ margin: 0, color: "#888", fontSize: 13 }}>Trường học</p>
                                    <p style={{ margin: "4px 0 0", fontWeight: 600 }}>{detail.schoolName || "—"}</p>
                                </div>
                                <div style={{ padding: 12, background: "#f8fafc", borderRadius: 10 }}>
                                    <p style={{ margin: 0, color: "#888", fontSize: 13 }}>Tổng SL</p>
                                    <p style={{ margin: "4px 0 0", fontWeight: 600 }}>{detail.totalQuantity}</p>
                                </div>
                                {detail.deliveryDeadline && (
                                    <div style={{ padding: 12, background: "#f8fafc", borderRadius: 10 }}>
                                        <p style={{ margin: 0, color: "#888", fontSize: 13 }}>Hạn giao</p>
                                        <p style={{ margin: "4px 0 0", fontWeight: 600 }}>{new Date(detail.deliveryDeadline).toLocaleDateString("vi")}</p>
                                    </div>
                                )}
                            </div>

                            {detail.rejectionReason && (
                                <div style={{ padding: "10px 14px", background: "#fef2f2", borderRadius: 8, color: "#dc2626", marginBottom: 16, fontSize: 14 }}>
                                    ❌ Lý do từ chối: {detail.rejectionReason}
                                </div>
                            )}

                            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>📦 Danh sách sản phẩm</h3>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                                <thead>
                                    <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                                        <th style={{ padding: "10px 12px", borderRadius: "8px 0 0 0" }}>Đồng phục</th>
                                        <th style={{ padding: "10px 12px" }}>Size</th>
                                        <th style={{ padding: "10px 12px" }}>SL</th>
                                        <th style={{ padding: "10px 12px", borderRadius: "0 8px 0 0" }}>Đơn giá</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detail.items.map(item => (
                                        <tr key={item.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                                            <td style={{ padding: "10px 12px" }}>{item.outfitName}</td>
                                            <td style={{ padding: "10px 12px" }}>{item.size}</td>
                                            <td style={{ padding: "10px 12px", fontWeight: 600 }}>{item.quantity}</td>
                                            <td style={{ padding: "10px 12px" }}>{item.unitPrice.toLocaleString("vi")}₫</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Phase 4 — Delivery section for Completed/Delivered */}
                            {(detail.status === "Completed" || detail.status === "Delivered") && deliveryStatus && (
                                <div style={{ marginTop: 24 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>🚚 Tình trạng giao hàng</h3>
                                        {detail.status === "Completed" && (
                                            <button onClick={() => {
                                                setDeliverQty(deliveryStatus.totalQuantity - deliveryStatus.totalDelivered);
                                                setShowDeliver(true);
                                            }} style={{
                                                padding: "8px 20px", borderRadius: 10, border: "none",
                                                background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "#fff",
                                                fontWeight: 600, cursor: "pointer", fontSize: 14,
                                            }}>
                                                📦 Giao hàng
                                            </button>
                                        )}
                                    </div>

                                    {/* Progress bar */}
                                    <div style={{ marginBottom: 16 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#555", marginBottom: 6 }}>
                                            <span>Đã giao: <strong>{deliveryStatus.totalDelivered}/{deliveryStatus.totalQuantity}</strong></span>
                                            <span style={{ fontWeight: 700, color: deliveryStatus.isFullyDelivered ? "#10b981" : "#6366f1" }}>
                                                {Math.round((deliveryStatus.totalDelivered / deliveryStatus.totalQuantity) * 100)}%
                                            </span>
                                        </div>
                                        <div style={{ height: 12, borderRadius: 6, background: "#e5e7eb", overflow: "hidden" }}>
                                            <div style={{
                                                height: "100%", borderRadius: 6,
                                                width: `${Math.min(100, (deliveryStatus.totalDelivered / deliveryStatus.totalQuantity) * 100)}%`,
                                                background: deliveryStatus.isFullyDelivered
                                                    ? "linear-gradient(135deg, #10b981, #059669)"
                                                    : "linear-gradient(135deg, #6366f1, #4f46e5)",
                                                transition: "width .5s",
                                            }} />
                                        </div>
                                        {deliveryStatus.isFullyDelivered && (
                                            <p style={{ margin: "6px 0 0", color: "#10b981", fontSize: 13, fontWeight: 600 }}>✅ Đã giao đủ 100%</p>
                                        )}
                                    </div>

                                    {/* Delivery history */}
                                    {deliveryStatus.deliveries.length === 0 ? (
                                        <p style={{ color: "#999", textAlign: "center", padding: 16 }}>Chưa có lần giao nào.</p>
                                    ) : (
                                        <div style={{ display: "grid", gap: 10 }}>
                                            {deliveryStatus.deliveries.map((d, i) => (
                                                <div key={d.id} style={{
                                                    padding: "12px 16px",
                                                    background: d.isConfirmed ? "#f0fdf4" : "#fffbeb",
                                                    borderRadius: 10,
                                                    border: `1px solid ${d.isConfirmed ? "#86efac" : "#fde68a"}`,
                                                }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                        <div>
                                                            <strong style={{ fontSize: 14 }}>Lần {deliveryStatus.deliveries.length - i}: {d.quantity} sản phẩm</strong>
                                                            <span style={{ color: "#888", fontSize: 12, marginLeft: 8 }}>
                                                                {new Date(d.deliveredAt).toLocaleDateString("vi")}
                                                            </span>
                                                            {d.note && <p style={{ margin: "4px 0 0", color: "#666", fontSize: 13 }}>📝 {d.note}</p>}
                                                        </div>
                                                        {d.isConfirmed ? (
                                                            <div style={{ textAlign: "right" }}>
                                                                <span style={{ padding: "3px 10px", borderRadius: 20, background: "#dcfce7", color: "#16a34a", fontSize: 11, fontWeight: 600 }}>
                                                                    ✅ Trường đã xác nhận
                                                                </span>
                                                                <p style={{ margin: "4px 0 0", fontSize: 11, color: "#888" }}>
                                                                    OK: {d.acceptedQuantity}{d.defectiveQuantity ? ` · Lỗi: ${d.defectiveQuantity}` : ""}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <span style={{ padding: "3px 10px", borderRadius: 20, background: "#fef3c7", color: "#d97706", fontSize: 11, fontWeight: 600 }}>
                                                                ⏳ Chờ trường xác nhận
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Action buttons based on status */}
                            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                                <button onClick={() => setShowDetail(false)} style={{
                                    flex: 1, padding: "12px 0", borderRadius: 12, border: "1px solid #ddd",
                                    background: "#fff", fontWeight: 600, cursor: "pointer",
                                }}>
                                    Đóng
                                </button>

                                {detail.status === "Approved" && (
                                    <button onClick={handleAccept} disabled={actionLoading} style={{
                                        flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
                                        background: actionLoading ? "#ccc" : "linear-gradient(135deg, #8b5cf6, #6366f1)", color: "#fff",
                                        fontWeight: 600, cursor: actionLoading ? "not-allowed" : "pointer",
                                    }}>
                                        {actionLoading ? "Đang xử lý..." : "🚀 Bắt đầu sản xuất"}
                                    </button>
                                )}

                                {detail.status === "InProduction" && (
                                    <button onClick={handleComplete} disabled={actionLoading} style={{
                                        flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
                                        background: actionLoading ? "#ccc" : "linear-gradient(135deg, #10b981, #059669)", color: "#fff",
                                        fontWeight: 600, cursor: actionLoading ? "not-allowed" : "pointer",
                                    }}>
                                        {actionLoading ? "Đang xử lý..." : "✅ Hoàn thành sản xuất"}
                                    </button>
                                )}

                                {detail.status === "Completed" && !deliveryStatus?.isFullyDelivered && (
                                    <button onClick={() => {
                                        if (deliveryStatus) setDeliverQty(deliveryStatus.totalQuantity - deliveryStatus.totalDelivered);
                                        setShowDeliver(true);
                                    }} disabled={actionLoading} style={{
                                        flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
                                        background: actionLoading ? "#ccc" : "linear-gradient(135deg, #6366f1, #4f46e5)", color: "#fff",
                                        fontWeight: 600, cursor: actionLoading ? "not-allowed" : "pointer",
                                    }}>
                                        📦 Giao hàng
                                    </button>
                                )}

                                {(detail.status === "Pending" || detail.status === "Approved") && (
                                    <button onClick={() => setShowReject(true)} style={{
                                        padding: "12px 24px", borderRadius: 12, border: "none",
                                        background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff",
                                        fontWeight: 600, cursor: "pointer",
                                    }}>
                                        Từ chối
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Reject Modal */}
                {showReject && detail && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 }}>
                        <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "90%", maxWidth: 440 }}>
                            <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700 }}>❌ Từ chối đơn sản xuất</h3>
                            <textarea
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                placeholder="Nhập lý do từ chối..."
                                rows={3}
                                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box", resize: "vertical" }}
                            />
                            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                                <button onClick={() => { setShowReject(false); setRejectReason(""); }} style={{
                                    flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #ddd",
                                    background: "#fff", fontWeight: 600, cursor: "pointer",
                                }}>Hủy</button>
                                <button onClick={handleReject} disabled={actionLoading || !rejectReason.trim()} style={{
                                    flex: 1, padding: "10px 0", borderRadius: 10, border: "none",
                                    background: actionLoading ? "#ccc" : "#ef4444", color: "#fff",
                                    fontWeight: 600, cursor: actionLoading ? "not-allowed" : "pointer",
                                }}>
                                    {actionLoading ? "Đang xử lý..." : "Xác nhận từ chối"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Deliver Modal */}
                {showDeliver && detail && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 }}>
                        <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "90%", maxWidth: 440 }}>
                            <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700 }}>📦 Giao hàng</h3>

                            {deliveryStatus && (
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#555", marginBottom: 6 }}>
                                        <span>Đã giao: {deliveryStatus.totalDelivered}/{deliveryStatus.totalQuantity}</span>
                                        <span>Còn lại: <strong>{deliveryStatus.totalQuantity - deliveryStatus.totalDelivered}</strong></span>
                                    </div>
                                    <div style={{ height: 8, borderRadius: 4, background: "#e5e7eb", overflow: "hidden" }}>
                                        <div style={{
                                            height: "100%", borderRadius: 4, transition: "width .5s",
                                            width: `${(deliveryStatus.totalDelivered / deliveryStatus.totalQuantity) * 100}%`,
                                            background: "#6366f1",
                                        }} />
                                    </div>
                                </div>
                            )}

                            <div style={{ display: "grid", gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>Số lượng giao lần này</label>
                                    <input type="number" min={1}
                                        max={deliveryStatus ? deliveryStatus.totalQuantity - deliveryStatus.totalDelivered : undefined}
                                        value={deliverQty}
                                        onChange={e => setDeliverQty(Number(e.target.value))}
                                        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #ddd", fontSize: 16, fontWeight: 700, boxSizing: "border-box" }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>Ghi chú (tùy chọn)</label>
                                    <textarea value={deliverNote}
                                        onChange={e => setDeliverNote(e.target.value)}
                                        placeholder="VD: Đợt 1 gồm áo sơ mi size S-M..."
                                        rows={2}
                                        style={{ width: "100%", padding: "8px 12px", borderRadius: 10, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box", resize: "vertical" }} />
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                                <button onClick={() => { setShowDeliver(false); setDeliverQty(0); setDeliverNote(""); }} style={{
                                    flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #ddd",
                                    background: "#fff", fontWeight: 600, cursor: "pointer",
                                }}>Hủy</button>
                                <button onClick={handleDeliver} disabled={actionLoading || deliverQty <= 0} style={{
                                    flex: 1, padding: "10px 0", borderRadius: 10, border: "none",
                                    background: actionLoading || deliverQty <= 0 ? "#ccc" : "#6366f1", color: "#fff",
                                    fontWeight: 600, cursor: actionLoading || deliverQty <= 0 ? "not-allowed" : "pointer",
                                }}>
                                    {actionLoading ? "Đang gửi..." : "📦 Xác nhận giao"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
