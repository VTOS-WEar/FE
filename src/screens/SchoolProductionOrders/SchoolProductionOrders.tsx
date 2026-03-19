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
import { useSidebarConfig } from "../../hooks/useSidebarConfig";
import {
    getSchoolProductionOrders,
    getSchoolProductionOrderDetail,
    confirmProductionOrder,
    rejectProductionOrder,
    getDeliveryStatus,
    confirmDelivery,
    getVerifyQuantity,
    reportDefect,
    distributeOrders,
    getDistributionStatus,
    type ProductionOrderListItemDto,
    type ProductionOrderDetailDto,
    type DeliveryRecordDto,
    type DeliveryStatusResponse,
    type VerifyQuantityResponse,
    type DistributionStatusResponse,
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

export function SchoolProductionOrders() {
    const sidebarConfig = useSidebarConfig();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const [orders, setOrders] = useState<ProductionOrderListItemDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [detail, setDetail] = useState<ProductionOrderDetailDto | null>(null);
    const [showDetail, setShowDetail] = useState(false);
    const [showReject, setShowReject] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    // Phase 4 — Delivery & Distribution
    const [activeTab, setActiveTab] = useState<"detail" | "delivery" | "distribution">("detail");
    const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatusResponse | null>(null);
    const [verifyData, setVerifyData] = useState<VerifyQuantityResponse | null>(null);
    const [distStatus, setDistStatus] = useState<DistributionStatusResponse | null>(null);
    const [confirmingDelivery, setConfirmingDelivery] = useState<DeliveryRecordDto | null>(null);
    const [confirmForm, setConfirmForm] = useState({ acceptedQuantity: 0, defectiveQuantity: 0, defectNote: "" });
    const [showDefectModal, setShowDefectModal] = useState(false);
    const [defectForm, setDefectForm] = useState({ title: "", description: "" });
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [shipForm, setShipForm] = useState({ shippingCompany: "", trackingCode: "", proofImageUrl: "", note: "" });

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getSchoolProductionOrders(1, 50, statusFilter || undefined);
            setOrders(res.items);
        } catch (e: any) {
            console.error("Error fetching production orders:", e);
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const openDetail = async (id: string) => {
        try {
            const d = await getSchoolProductionOrderDetail(id);
            setDetail(d);
            setShowDetail(true);
        } catch (e: any) {
            console.error("Error fetching detail:", e);
        }
    };

    const handleReject = async () => {
        if (!detail || !rejectReason.trim()) return;
        setActionLoading(true);
        try {
            await rejectProductionOrder(detail.batchId, rejectReason);
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

    const handleConfirm = async () => {
        if (!detail) return;
        if (!window.confirm("Xác nhận đơn sản xuất này? Nhà cung cấp sẽ có thể chấp nhận và bắt đầu sản xuất.")) return;
        setActionLoading(true);
        try {
            await confirmProductionOrder(detail.batchId);
            setShowDetail(false);
            fetchOrders();
        } catch (e: any) {
            alert(e.message || "Lỗi xác nhận đơn");
        } finally {
            setActionLoading(false);
        }
    };

    // Phase 4 — load delivery/distribution data
    const loadDeliveryData = async (batchId: string) => {
        try {
            const [ds, vq] = await Promise.all([
                getDeliveryStatus(batchId),
                getVerifyQuantity(batchId),
            ]);
            setDeliveryStatus(ds);
            setVerifyData(vq);
        } catch (e: any) { console.error("Error loading delivery data:", e); }
    };

    const loadDistributionData = async (batchId: string) => {
        try {
            const ds = await getDistributionStatus(batchId);
            setDistStatus(ds);
        } catch (e: any) { console.error("Error loading distribution data:", e); }
    };

    const handleConfirmDelivery = async () => {
        if (!detail || !confirmingDelivery) return;
        setActionLoading(true);
        try {
            await confirmDelivery(detail.batchId, confirmingDelivery.id, {
                acceptedQuantity: confirmForm.acceptedQuantity,
                defectiveQuantity: confirmForm.defectiveQuantity || undefined,
                defectNote: confirmForm.defectNote || undefined,
            });
            setConfirmingDelivery(null);
            loadDeliveryData(detail.batchId);
        } catch (e: any) { alert(e.message || "Lỗi xác nhận giao hàng"); }
        finally { setActionLoading(false); }
    };

    const handleReportDefect = async () => {
        if (!detail || !defectForm.title.trim() || !defectForm.description.trim()) return;
        setActionLoading(true);
        try {
            await reportDefect(detail.batchId, defectForm);
            setShowDefectModal(false);
            setDefectForm({ title: "", description: "" });
            alert("Đã báo cáo lỗi thành công!");
        } catch (e: any) { alert(e.message || "Lỗi báo cáo"); }
        finally { setActionLoading(false); }
    };

    const handleDistribute = async (method: "AtSchool" | "AtHome") => {
        if (!detail || selectedOrders.length === 0) return;
        setActionLoading(true);
        try {
            const body = method === "AtHome"
                ? { orderIds: selectedOrders, ...shipForm }
                : { orderIds: selectedOrders, note: shipForm.note };
            const res = await distributeOrders(detail.batchId, body);
            alert(res.message);
            setSelectedOrders([]);
            loadDistributionData(detail.batchId);
        } catch (e: any) { alert(e.message || "Lỗi phân phối"); }
        finally { setActionLoading(false); }
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
                            <BreadcrumbItem><BreadcrumbLink href="/school/dashboard" className="font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
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
                        <p style={{ fontSize: 16 }}>Chưa có đơn sản xuất nào.</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gap: 16 }}>
                        {orders.map(o => (
                            <div
                                key={o.batchId}
                                onClick={() => openDetail(o.batchId)}
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
                                            NCC: <strong>{o.providerName || "—"}</strong> &nbsp;·&nbsp;
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
                                    <p style={{ margin: 0, color: "#888", fontSize: 13 }}>Tổng SL</p>
                                    <p style={{ margin: "4px 0 0", fontWeight: 600 }}>{detail.totalQuantity}</p>
                                </div>
                                {detail.deliveryDeadline && (
                                    <div style={{ padding: 12, background: "#f8fafc", borderRadius: 10 }}>
                                        <p style={{ margin: 0, color: "#888", fontSize: 13 }}>Hạn giao</p>
                                        <p style={{ margin: "4px 0 0", fontWeight: 600 }}>{new Date(detail.deliveryDeadline).toLocaleDateString("vi")}</p>
                                    </div>
                                )}
                                {detail.processedAt && (
                                    <div style={{ padding: 12, background: "#f8fafc", borderRadius: 10 }}>
                                        <p style={{ margin: 0, color: "#888", fontSize: 13 }}>Ngày xử lý</p>
                                        <p style={{ margin: "4px 0 0", fontWeight: 600 }}>{new Date(detail.processedAt).toLocaleDateString("vi")}</p>
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

                            {/* Phase 4 — Tabs for Delivered batches */}
                            {(detail.status === "Completed" || detail.status === "Delivered") && (
                                <div style={{ marginTop: 24 }}>
                                    <div style={{ display: "flex", gap: 0, borderBottom: "2px solid #e5e7eb" }}>
                                        {(["detail", "delivery", "distribution"] as const).map(tab => (
                                            <button key={tab} onClick={() => {
                                                setActiveTab(tab);
                                                if (tab === "delivery") loadDeliveryData(detail.batchId);
                                                if (tab === "distribution") loadDistributionData(detail.batchId);
                                            }} style={{
                                                padding: "10px 24px", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14,
                                                background: activeTab === tab ? "#6366f1" : "transparent",
                                                color: activeTab === tab ? "#fff" : "#888",
                                                borderRadius: "8px 8px 0 0", transition: "all .2s",
                                            }}>
                                                {tab === "detail" ? "📋 Chi tiết" : tab === "delivery" ? "🚚 Giao hàng" : "📦 Phân phối"}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Delivery Tab */}
                                    {activeTab === "delivery" && deliveryStatus && (
                                        <div style={{ padding: "20px 0" }}>
                                            {/* Progress bar */}
                                            <div style={{ marginBottom: 20 }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#555", marginBottom: 6 }}>
                                                    <span>Đã giao: <strong>{deliveryStatus.totalDelivered}/{deliveryStatus.totalQuantity}</strong></span>
                                                    <span>{Math.round((deliveryStatus.totalDelivered / deliveryStatus.totalQuantity) * 100)}%</span>
                                                </div>
                                                <div style={{ height: 10, borderRadius: 5, background: "#e5e7eb", overflow: "hidden" }}>
                                                    <div style={{
                                                        height: "100%", borderRadius: 5,
                                                        width: `${Math.min(100, (deliveryStatus.totalDelivered / deliveryStatus.totalQuantity) * 100)}%`,
                                                        background: deliveryStatus.isFullyDelivered ? "#10b981" : "#6366f1",
                                                        transition: "width .5s",
                                                    }} />
                                                </div>
                                            </div>

                                            {/* Delivery records */}
                                            {deliveryStatus.deliveries.length === 0 ? (
                                                <p style={{ color: "#999", textAlign: "center", padding: 20 }}>Chưa có lần giao nào.</p>
                                            ) : (
                                                <div style={{ display: "grid", gap: 12 }}>
                                                    {deliveryStatus.deliveries.map(d => (
                                                        <div key={d.id} style={{
                                                            padding: "14px 18px", background: d.isConfirmed ? "#f0fdf4" : "#fffbeb",
                                                            borderRadius: 12, border: `1px solid ${d.isConfirmed ? "#86efac" : "#fde68a"}`,
                                                        }}>
                                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                                <div>
                                                                    <strong>{d.quantity} sản phẩm</strong>
                                                                    <span style={{ color: "#888", fontSize: 13, marginLeft: 8 }}>
                                                                        {new Date(d.deliveredAt).toLocaleDateString("vi")}
                                                                    </span>
                                                                    {d.note && <p style={{ margin: "4px 0 0", color: "#666", fontSize: 13 }}>📝 {d.note}</p>}
                                                                </div>
                                                                {d.isConfirmed ? (
                                                                    <span style={{ padding: "4px 12px", borderRadius: 20, background: "#dcfce7", color: "#16a34a", fontSize: 12, fontWeight: 600 }}>
                                                                        ✅ Đã xác nhận ({d.acceptedQuantity} ok{d.defectiveQuantity ? `, ${d.defectiveQuantity} lỗi` : ""})
                                                                    </span>
                                                                ) : (
                                                                    <button onClick={() => {
                                                                        setConfirmingDelivery(d);
                                                                        setConfirmForm({ acceptedQuantity: d.quantity, defectiveQuantity: 0, defectNote: "" });
                                                                    }} style={{
                                                                        padding: "6px 16px", borderRadius: 8, border: "none",
                                                                        background: "#6366f1", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 13,
                                                                    }}>
                                                                        Xác nhận
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Verify Quantity Summary */}
                                            {verifyData && (
                                                <div style={{ marginTop: 20 }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>📊 Tổng hợp số lượng</h4>
                                                        <button onClick={() => setShowDefectModal(true)} style={{
                                                            padding: "6px 14px", borderRadius: 8, border: "none",
                                                            background: "#ef4444", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 13,
                                                        }}>🐛 Báo lỗi</button>
                                                    </div>
                                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 12 }}>
                                                        {[
                                                            { label: "Yêu cầu", val: verifyData.totalExpected, color: "#6366f1" },
                                                            { label: "Đã giao", val: verifyData.totalDelivered, color: "#3b82f6" },
                                                            { label: "Chấp nhận", val: verifyData.totalAccepted, color: "#10b981" },
                                                            { label: "Lỗi", val: verifyData.totalDefective, color: "#ef4444" },
                                                        ].map(s => (
                                                            <div key={s.label} style={{ padding: 10, background: `${s.color}10`, borderRadius: 10, textAlign: "center" }}>
                                                                <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: s.color }}>{s.val}</p>
                                                                <p style={{ margin: 0, fontSize: 12, color: "#888" }}>{s.label}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Distribution Tab */}
                                    {activeTab === "distribution" && distStatus && (
                                        <div style={{ padding: "20px 0" }}>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
                                                {[
                                                    { label: "Tổng đơn", val: distStatus.totalOrders, color: "#6366f1" },
                                                    { label: "Đã phân phối", val: distStatus.distributedCount, color: "#10b981" },
                                                    { label: "Chờ phân phối", val: distStatus.pendingCount, color: "#f59e0b" },
                                                ].map(s => (
                                                    <div key={s.label} style={{ padding: 12, background: `${s.color}10`, borderRadius: 10, textAlign: "center" }}>
                                                        <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: s.color }}>{s.val}</p>
                                                        <p style={{ margin: 0, fontSize: 12, color: "#888" }}>{s.label}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Pending orders — select & distribute */}
                                            {distStatus.orders.filter(o => !o.isDistributed).length > 0 && (
                                                <div style={{ marginBottom: 20 }}>
                                                    <h4 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 600 }}>📋 Chờ phân phối</h4>
                                                    {distStatus.orders.filter(o => !o.isDistributed).map(o => (
                                                        <label key={o.orderId} style={{
                                                            display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                                                            background: selectedOrders.includes(o.orderId) ? "#eef2ff" : "#f9fafb",
                                                            borderRadius: 8, marginBottom: 6, cursor: "pointer",
                                                            border: `1px solid ${selectedOrders.includes(o.orderId) ? "#a5b4fc" : "#e5e7eb"}`,
                                                        }}>
                                                            <input type="checkbox" checked={selectedOrders.includes(o.orderId)}
                                                                onChange={e => {
                                                                    if (e.target.checked) setSelectedOrders(p => [...p, o.orderId]);
                                                                    else setSelectedOrders(p => p.filter(id => id !== o.orderId));
                                                                }} />
                                                            <div style={{ flex: 1 }}>
                                                                <strong>{o.childName}</strong>
                                                                <span style={{ color: "#888", fontSize: 13, marginLeft: 8 }}>({o.parentName})</span>
                                                            </div>
                                                            <span style={{
                                                                padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                                                                background: o.deliveryMethod === "AtHome" ? "#dbeafe" : "#dcfce7",
                                                                color: o.deliveryMethod === "AtHome" ? "#2563eb" : "#16a34a",
                                                            }}>
                                                                {o.deliveryMethod === "AtHome" ? "🏠 Giao tận nhà" : "🏫 Nhận tại trường"}
                                                            </span>
                                                        </label>
                                                    ))}

                                                    {/* Shipping form for AtHome */}
                                                    {selectedOrders.some(id => distStatus.orders.find(o => o.orderId === id)?.deliveryMethod === "AtHome") && (
                                                        <div style={{ marginTop: 12, padding: 16, background: "#eff6ff", borderRadius: 12 }}>
                                                            <h5 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 600 }}>🚛 Thông tin vận chuyển (AtHome)</h5>
                                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                                                <input placeholder="Đơn vị vận chuyển" value={shipForm.shippingCompany}
                                                                    onChange={e => setShipForm(f => ({ ...f, shippingCompany: e.target.value }))}
                                                                    style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14 }} />
                                                                <input placeholder="Mã vận đơn" value={shipForm.trackingCode}
                                                                    onChange={e => setShipForm(f => ({ ...f, trackingCode: e.target.value }))}
                                                                    style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14 }} />
                                                            </div>
                                                            <input placeholder="URL ảnh xác nhận (proof)" value={shipForm.proofImageUrl}
                                                                onChange={e => setShipForm(f => ({ ...f, proofImageUrl: e.target.value }))}
                                                                style={{ width: "100%", marginTop: 10, padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" }} />
                                                        </div>
                                                    )}

                                                    <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                                                        <button disabled={selectedOrders.length === 0 || actionLoading}
                                                            onClick={() => handleDistribute("AtSchool")}
                                                            style={{
                                                                flex: 1, padding: "10px 0", borderRadius: 10, border: "none",
                                                                background: selectedOrders.length === 0 ? "#ccc" : "#10b981",
                                                                color: "#fff", fontWeight: 600, cursor: selectedOrders.length === 0 ? "not-allowed" : "pointer",
                                                            }}>
                                                            🏫 Phát tại trường ({selectedOrders.filter(id => distStatus.orders.find(o => o.orderId === id)?.deliveryMethod !== "AtHome").length})
                                                        </button>
                                                        <button disabled={selectedOrders.length === 0 || actionLoading}
                                                            onClick={() => handleDistribute("AtHome")}
                                                            style={{
                                                                flex: 1, padding: "10px 0", borderRadius: 10, border: "none",
                                                                background: selectedOrders.length === 0 ? "#ccc" : "#3b82f6",
                                                                color: "#fff", fontWeight: 600, cursor: selectedOrders.length === 0 ? "not-allowed" : "pointer",
                                                            }}>
                                                            🏠 Giao tận nhà ({selectedOrders.filter(id => distStatus.orders.find(o => o.orderId === id)?.deliveryMethod === "AtHome").length})
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Already distributed */}
                                            {distStatus.orders.filter(o => o.isDistributed).length > 0 && (
                                                <div>
                                                    <h4 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 600, color: "#10b981" }}>✅ Đã phân phối</h4>
                                                    {distStatus.orders.filter(o => o.isDistributed).map(o => (
                                                        <div key={o.orderId} style={{
                                                            padding: "10px 14px", background: "#f0fdf4", borderRadius: 8, marginBottom: 6,
                                                            display: "flex", justifyContent: "space-between", alignItems: "center",
                                                            border: "1px solid #86efac",
                                                        }}>
                                                            <div>
                                                                <strong>{o.childName}</strong>
                                                                <span style={{ color: "#888", fontSize: 13, marginLeft: 8 }}>({o.parentName})</span>
                                                                {o.trackingCode && <span style={{ color: "#6366f1", fontSize: 12, marginLeft: 8 }}>📦 {o.trackingCode}</span>}
                                                            </div>
                                                            <span style={{ fontSize: 12, color: "#888" }}>{o.distributedAt ? new Date(o.distributedAt).toLocaleDateString("vi") : ""}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                                <button onClick={() => setShowDetail(false)} style={{
                                    flex: 1, padding: "12px 0", borderRadius: 12, border: "1px solid #ddd",
                                    background: "#fff", fontWeight: 600, cursor: "pointer",
                                }}>
                                    Đóng
                                </button>
                                {detail.status === "Pending" && (
                                    <>
                                        <button onClick={handleConfirm} disabled={actionLoading} style={{
                                            flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
                                            background: actionLoading ? "#ccc" : "linear-gradient(135deg, #10b981, #059669)", color: "#fff",
                                            fontWeight: 600, cursor: actionLoading ? "not-allowed" : "pointer",
                                        }}>
                                            {actionLoading ? "Đang xử lý..." : "✅ Xác nhận"}
                                        </button>
                                        <button onClick={() => setShowReject(true)} style={{
                                            flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
                                            background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff",
                                            fontWeight: 600, cursor: "pointer",
                                        }}>
                                            Từ chối
                                        </button>
                                    </>
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

                {/* Confirm Delivery Modal */}
                {confirmingDelivery && detail && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200 }}>
                        <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "90%", maxWidth: 440 }}>
                            <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700 }}>📋 Xác nhận lần giao</h3>
                            <p style={{ color: "#666", fontSize: 14, marginBottom: 16 }}>Số lượng giao: <strong>{confirmingDelivery.quantity}</strong></p>
                            <div style={{ display: "grid", gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>SL chấp nhận</label>
                                    <input type="number" min={0} max={confirmingDelivery.quantity}
                                        value={confirmForm.acceptedQuantity}
                                        onChange={e => setConfirmForm(f => ({ ...f, acceptedQuantity: Number(e.target.value) }))}
                                        style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>SL lỗi</label>
                                    <input type="number" min={0}
                                        value={confirmForm.defectiveQuantity}
                                        onChange={e => setConfirmForm(f => ({ ...f, defectiveQuantity: Number(e.target.value) }))}
                                        style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" }} />
                                </div>
                                {confirmForm.defectiveQuantity > 0 && (
                                    <div>
                                        <label style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>Ghi chú lỗi</label>
                                        <textarea value={confirmForm.defectNote}
                                            onChange={e => setConfirmForm(f => ({ ...f, defectNote: e.target.value }))}
                                            placeholder="Mô tả lỗi..."
                                            rows={2}
                                            style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box", resize: "vertical" }} />
                                    </div>
                                )}
                            </div>
                            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                                <button onClick={() => setConfirmingDelivery(null)} style={{
                                    flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #ddd",
                                    background: "#fff", fontWeight: 600, cursor: "pointer",
                                }}>Hủy</button>
                                <button onClick={handleConfirmDelivery} disabled={actionLoading} style={{
                                    flex: 1, padding: "10px 0", borderRadius: 10, border: "none",
                                    background: actionLoading ? "#ccc" : "#6366f1", color: "#fff",
                                    fontWeight: 600, cursor: actionLoading ? "not-allowed" : "pointer",
                                }}>
                                    {actionLoading ? "Đang xử lý..." : "✅ Xác nhận"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Defect Report Modal */}
                {showDefectModal && detail && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200 }}>
                        <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "90%", maxWidth: 440 }}>
                            <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700 }}>🐛 Báo cáo lỗi sản phẩm</h3>
                            <div style={{ display: "grid", gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>Tiêu đề</label>
                                    <input value={defectForm.title}
                                        onChange={e => setDefectForm(f => ({ ...f, title: e.target.value }))}
                                        placeholder="VD: Áo sơ mi bị rách"
                                        style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>Mô tả chi tiết</label>
                                    <textarea value={defectForm.description}
                                        onChange={e => setDefectForm(f => ({ ...f, description: e.target.value }))}
                                        placeholder="Mô tả chi tiết lỗi..."
                                        rows={3}
                                        style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box", resize: "vertical" }} />
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                                <button onClick={() => { setShowDefectModal(false); setDefectForm({ title: "", description: "" }); }} style={{
                                    flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #ddd",
                                    background: "#fff", fontWeight: 600, cursor: "pointer",
                                }}>Hủy</button>
                                <button onClick={handleReportDefect} disabled={actionLoading || !defectForm.title.trim() || !defectForm.description.trim()} style={{
                                    flex: 1, padding: "10px 0", borderRadius: 10, border: "none",
                                    background: actionLoading ? "#ccc" : "#ef4444", color: "#fff",
                                    fontWeight: 600, cursor: actionLoading ? "not-allowed" : "pointer",
                                }}>
                                    {actionLoading ? "Đang xử lý..." : "Gửi báo cáo"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
