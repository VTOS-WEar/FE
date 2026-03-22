import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { getSchoolProductionOrders, type ProductionOrderListItemDto } from "../../lib/api/productionOrders";

const STATUS_COLORS: Record<string, string> = { Pending: "#f59e0b", Approved: "#3b82f6", InProduction: "#8b5cf6", Completed: "#10b981", Rejected: "#ef4444", Delivered: "#06b6d4" };
const STATUS_LABELS: Record<string, string> = { Pending: "Chờ xử lý", Approved: "Đã duyệt", InProduction: "Đang sản xuất", Completed: "Hoàn thành", Rejected: "Từ chối", Delivered: "Đã giao" };

export function SchoolProductionOrders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<ProductionOrderListItemDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>("");

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getSchoolProductionOrders(1, 50, statusFilter || undefined);
            setOrders(res.items);
        } catch (e: any) { console.error("Error fetching production orders:", e); }
        finally { setLoading(false); }
    }, [statusFilter]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    return (
        <>
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
                    <button key={s} onClick={() => setStatusFilter(s)} style={{
                        padding: "8px 20px", borderRadius: 20, border: "none", cursor: "pointer",
                        background: statusFilter === s ? "#6366f1" : "#e8e8e8",
                        color: statusFilter === s ? "#fff" : "#555", fontWeight: 600, fontSize: 14, transition: "all .2s",
                    }}>
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
                            onClick={() => navigate(`/school/production-orders/${o.batchId}`)}
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
                                        Nhà Cung Cấp: <strong>{o.providerName || "—"}</strong> &nbsp;·&nbsp;
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
                                    background: `${STATUS_COLORS[o.status]}18`, color: STATUS_COLORS[o.status],
                                }}>
                                    {STATUS_LABELS[o.status] || o.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
