import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../../components/ui/breadcrumb";
import {
    getSchoolProductionOrderDetail,
    confirmProductionOrder, rejectProductionOrder,
    getDeliveryStatus, confirmDelivery, getVerifyQuantity, reportDefect,
    distributeOrders, getDistributionStatus,
    createDistributionSchedule, getDistributionSchedules, updateDistributionSchedule,
    type ProductionOrderDetailDto, type DeliveryStatusResponse,
    type VerifyQuantityResponse, type DeliveryRecordDto,
    type DistributionStatusResponse, type DistributionScheduleDto,
} from "../../lib/api/productionOrders";

const STATUS_COLORS: Record<string, string> = { Pending: "#f59e0b", Approved: "#3b82f6", InProduction: "#8b5cf6", Completed: "#10b981", Rejected: "#ef4444", Delivered: "#06b6d4" };
const STATUS_LABELS: Record<string, string> = { Pending: "Chờ xử lý", Approved: "Đã duyệt", InProduction: "Đang sản xuất", Completed: "Hoàn thành", Rejected: "Từ chối", Delivered: "Đã giao" };
type TabKey = "detail" | "delivery" | "distribution" | "complaints";
const TABS: { key: TabKey; label: string; icon: string }[] = [
    { key: "detail", label: "Chi tiết", icon: "📋" },
    { key: "delivery", label: "Giao hàng", icon: "🚚" },
    { key: "distribution", label: "Phân phối", icon: "📦" },
    { key: "complaints", label: "Khiếu nại", icon: "🐛" },
];

export default function SchoolProductionOrderDetail() {
    const { batchId } = useParams<{ batchId: string }>();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<TabKey>("detail");
    const [detail, setDetail] = useState<ProductionOrderDetailDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Reject
    const [showReject, setShowReject] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

    // Delivery
    const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatusResponse | null>(null);
    const [verifyData, setVerifyData] = useState<VerifyQuantityResponse | null>(null);
    const [confirmingDelivery, setConfirmingDelivery] = useState<DeliveryRecordDto | null>(null);
    const [confirmForm, setConfirmForm] = useState({ acceptedQuantity: 0, defectiveQuantity: 0, defectNote: "" });

    // Distribution
    const [distStatus, setDistStatus] = useState<DistributionStatusResponse | null>(null);
    const [distSubTab, setDistSubTab] = useState<"all" | "atSchool" | "atHome">("all");
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [shipForm, setShipForm] = useState({ shippingCompany: "", trackingCode: "", proofImageUrl: "", note: "" });
    const [schedules, setSchedules] = useState<DistributionScheduleDto[]>([]);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduleForm, setScheduleForm] = useState({ scheduledDate: "", method: "AtSchool", timeSlot: "", note: "" });
    const [distSearch, setDistSearch] = useState("");

    // Complaints
    const [defectForm, setDefectForm] = useState({ title: "", description: "", proofImageUrls: [""] as string[] });

    const loadDetail = useCallback(async () => {
        if (!batchId) return;
        setLoading(true);
        try { setDetail(await getSchoolProductionOrderDetail(batchId)); } catch { /* */ }
        finally { setLoading(false); }
    }, [batchId]);

    useEffect(() => { loadDetail(); }, [loadDetail]);

    const loadDeliveryData = async () => {
        if (!batchId) return;
        try {
            const [ds, vq] = await Promise.all([getDeliveryStatus(batchId), getVerifyQuantity(batchId)]);
            setDeliveryStatus(ds); setVerifyData(vq);
        } catch { /* */ }
    };

    const loadDistributionData = async () => {
        if (!batchId) return;
        try {
            const [ds, sched] = await Promise.all([getDistributionStatus(batchId), getDistributionSchedules(batchId)]);
            setDistStatus(ds); setSchedules(sched);
        } catch { /* */ }
    };

    useEffect(() => {
        if (activeTab === "delivery") loadDeliveryData();
        if (activeTab === "distribution") loadDistributionData();
    }, [activeTab, batchId]);

    const handleConfirm = async () => {
        if (!batchId || !window.confirm("Xác nhận đơn sản xuất này?")) return;
        setActionLoading(true);
        try { await confirmProductionOrder(batchId); loadDetail(); } catch (e: any) { alert(e.message || "Lỗi"); }
        finally { setActionLoading(false); }
    };
    const handleReject = async () => {
        if (!batchId || !rejectReason.trim()) return;
        setActionLoading(true);
        try { await rejectProductionOrder(batchId, rejectReason); setShowReject(false); setRejectReason(""); loadDetail(); }
        catch (e: any) { alert(e.message || "Lỗi"); } finally { setActionLoading(false); }
    };
    const handleConfirmDelivery = async () => {
        if (!batchId || !confirmingDelivery) return;
        setActionLoading(true);
        try {
            await confirmDelivery(batchId, confirmingDelivery.id, { acceptedQuantity: confirmForm.acceptedQuantity, defectiveQuantity: confirmForm.defectiveQuantity || undefined, defectNote: confirmForm.defectNote || undefined });
            setConfirmingDelivery(null); loadDeliveryData();
        } catch (e: any) { alert(e.message || "Lỗi"); } finally { setActionLoading(false); }
    };
    const handleDistribute = async (method: "AtSchool" | "AtHome") => {
        if (!batchId || selectedOrders.length === 0) return;
        setActionLoading(true);
        try {
            const body = method === "AtHome" ? { orderIds: selectedOrders, ...shipForm } : { orderIds: selectedOrders, note: shipForm.note };
            const res = await distributeOrders(batchId, body);
            alert(res.message); setSelectedOrders([]); loadDistributionData();
        } catch (e: any) { alert(e.message || "Lỗi"); } finally { setActionLoading(false); }
    };
    const handleCreateSchedule = async () => {
        if (!batchId || !scheduleForm.scheduledDate || !scheduleForm.timeSlot) return;
        setActionLoading(true);
        try {
            await createDistributionSchedule(batchId, scheduleForm);
            setShowScheduleModal(false); setScheduleForm({ scheduledDate: "", method: "AtSchool", timeSlot: "", note: "" }); loadDistributionData();
        } catch (e: any) { alert(e.message || "Lỗi"); } finally { setActionLoading(false); }
    };
    const handleCompleteSchedule = async (scheduleId: string) => {
        setActionLoading(true);
        try { await updateDistributionSchedule(scheduleId, { status: "Completed" }); loadDistributionData(); }
        catch (e: any) { alert(e.message || "Lỗi"); } finally { setActionLoading(false); }
    };
    const handleReportDefect = async () => {
        if (!batchId || !defectForm.title.trim() || !defectForm.description.trim()) return;
        const validUrls = defectForm.proofImageUrls.filter(u => u.trim());
        if (validUrls.length === 0) { alert("Vui lòng thêm ít nhất 1 URL ảnh."); return; }
        setActionLoading(true);
        try {
            await reportDefect(batchId, { ...defectForm, proofImageUrls: validUrls });
            setDefectForm({ title: "", description: "", proofImageUrls: [""] }); alert("Đã báo cáo lỗi thành công!");
        } catch (e: any) { alert(e.message || "Lỗi"); } finally { setActionLoading(false); }
    };

    if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}><div style={{ width: 32, height: 32, border: "4px solid #6366f1", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} /></div>;
    if (!detail) return <div style={{ textAlign: "center", padding: 80 }}><p>Không tìm thấy đơn sản xuất.</p><button onClick={() => navigate("/school/production-orders")} style={{ marginTop: 16, padding: "8px 20px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", fontWeight: 600, cursor: "pointer" }}>← Quay lại</button></div>;

    return (
        <>
            {/* Breadcrumb */}
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem><BreadcrumbLink href="/school/dashboard" className="font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                        <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                        <BreadcrumbItem><BreadcrumbLink href="/school/production-orders" className="font-semibold text-[#4c5769] text-base">Đơn sản xuất</BreadcrumbLink></BreadcrumbItem>
                        <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                        <BreadcrumbItem><BreadcrumbPage className="font-semibold text-[#4c5769] text-base">{detail.batchName}</BreadcrumbPage></BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "24px 0 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <button onClick={() => navigate("/school/production-orders")} style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>← Quay lại</button>
                        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1a1a2e", margin: 0 }}>🏭 {detail.batchName}</h1>
                    </div>
                    <span style={{ padding: "6px 18px", borderRadius: 20, fontSize: 14, fontWeight: 600, background: `${STATUS_COLORS[detail.status] || "#ccc"}18`, color: STATUS_COLORS[detail.status] }}>
                        {STATUS_LABELS[detail.status] || detail.status}
                    </span>
                </div>

                {/* Tab bar */}
                <div style={{ display: "flex", gap: 0, borderBottom: "2px solid #e5e7eb", marginBottom: 24 }}>
                    {TABS.map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                            padding: "12px 28px", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 15,
                            background: activeTab === tab.key ? "#6366f1" : "transparent",
                            color: activeTab === tab.key ? "#fff" : "#888",
                            borderRadius: "10px 10px 0 0", transition: "all .2s",
                        }}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* ═══ TAB: Chi tiết ═══ */}
                {activeTab === "detail" && (
                    <div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
                            {[
                                { label: "Chiến dịch", value: detail.campaignName },
                                { label: "Nhà cung cấp", value: detail.providerName || "—" },
                                { label: "Tổng số lượng", value: String(detail.totalQuantity) },
                                ...(detail.deliveryDeadline ? [{ label: "Hạn giao", value: new Date(detail.deliveryDeadline).toLocaleDateString("vi") }] : []),
                                ...(detail.processedAt ? [{ label: "Ngày xử lý", value: new Date(detail.processedAt).toLocaleDateString("vi") }] : []),
                                { label: "Ngày tạo", value: new Date(detail.createdDate).toLocaleDateString("vi") },
                            ].map(({ label, value }) => (
                                <div key={label} style={{ padding: 16, background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb" }}>
                                    <p style={{ margin: 0, color: "#888", fontSize: 13 }}>{label}</p>
                                    <p style={{ margin: "6px 0 0", fontWeight: 600, fontSize: 15, color: "#1a1a2e" }}>{value}</p>
                                </div>
                            ))}
                        </div>

                        {detail.rejectionReason && (
                            <div style={{ padding: "12px 16px", background: "#fef2f2", borderRadius: 10, color: "#dc2626", marginBottom: 20, fontSize: 14 }}>
                                ❌ Lý do từ chối: {detail.rejectionReason}
                            </div>
                        )}

                        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: 24, marginBottom: 24 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📦 Danh sách sản phẩm</h3>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                                <thead>
                                    <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                                        <th style={{ padding: "12px 14px", borderRadius: "8px 0 0 0" }}>Đồng phục</th>
                                        <th style={{ padding: "12px 14px" }}>Size</th>
                                        <th style={{ padding: "12px 14px" }}>SL</th>
                                        <th style={{ padding: "12px 14px", borderRadius: "0 8px 0 0" }}>Đơn giá</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detail.items.map(item => (
                                        <tr key={item.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                                            <td style={{ padding: "12px 14px" }}>{item.outfitName}</td>
                                            <td style={{ padding: "12px 14px" }}>{item.size}</td>
                                            <td style={{ padding: "12px 14px", fontWeight: 600 }}>{item.quantity}</td>
                                            <td style={{ padding: "12px 14px" }}>{item.unitPrice.toLocaleString("vi")}₫</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {detail.status === "Pending" && (
                            <div style={{ display: "flex", gap: 12 }}>
                                <button onClick={handleConfirm} disabled={actionLoading} style={{ flex: 1, padding: "14px 0", borderRadius: 12, border: "none", background: actionLoading ? "#ccc" : "linear-gradient(135deg, #10b981, #059669)", color: "#fff", fontWeight: 600, fontSize: 15, cursor: actionLoading ? "not-allowed" : "pointer" }}>
                                    {actionLoading ? "Đang xử lý..." : "✅ Xác nhận đơn sản xuất"}
                                </button>
                                <button onClick={() => setShowReject(true)} style={{ flex: 1, padding: "14px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>
                                    ❌ Từ chối
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ TAB: Giao hàng ═══ */}
                {activeTab === "delivery" && (
                    <div>
                        {!deliveryStatus ? (
                            <div style={{ textAlign: "center", padding: 40, color: "#999" }}>Đang tải...</div>
                        ) : (
                            <>
                                {/* Progress */}
                                <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: 24, marginBottom: 20 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#555", marginBottom: 8 }}>
                                        <span>Đã giao: <strong>{deliveryStatus.totalDelivered}/{deliveryStatus.totalQuantity}</strong></span>
                                        <span>{deliveryStatus.totalQuantity > 0 ? Math.round((deliveryStatus.totalDelivered / deliveryStatus.totalQuantity) * 100) : 0}%</span>
                                    </div>
                                    <div style={{ height: 12, borderRadius: 6, background: "#e5e7eb", overflow: "hidden" }}>
                                        <div style={{ height: "100%", borderRadius: 6, width: `${deliveryStatus.totalQuantity > 0 ? Math.min(100, (deliveryStatus.totalDelivered / deliveryStatus.totalQuantity) * 100) : 0}%`, background: deliveryStatus.isFullyDelivered ? "#10b981" : "#6366f1", transition: "width .5s" }} />
                                    </div>
                                </div>

                                {/* Delivery records */}
                                <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: 24, marginBottom: 20 }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📋 Các lần giao hàng</h3>
                                    {deliveryStatus.deliveries.length === 0 ? (
                                        <p style={{ color: "#999", textAlign: "center", padding: 20 }}>Chưa có lần giao nào.</p>
                                    ) : (
                                        <div style={{ display: "grid", gap: 12 }}>
                                            {deliveryStatus.deliveries.map(d => (
                                                <div key={d.id} style={{ padding: "16px 20px", background: d.isConfirmed ? "#f0fdf4" : "#fffbeb", borderRadius: 12, border: `1px solid ${d.isConfirmed ? "#86efac" : "#fde68a"}` }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                        <div>
                                                            <strong>{d.quantity} sản phẩm</strong>
                                                            <span style={{ color: "#888", fontSize: 13, marginLeft: 8 }}>{new Date(d.deliveredAt).toLocaleDateString("vi")}</span>
                                                            {d.note && <p style={{ margin: "4px 0 0", color: "#666", fontSize: 13 }}>📝 {d.note}</p>}
                                                        </div>
                                                        {d.isConfirmed ? (
                                                            <span style={{ padding: "4px 12px", borderRadius: 20, background: "#dcfce7", color: "#16a34a", fontSize: 12, fontWeight: 600 }}>
                                                                ✅ Đã xác nhận ({d.acceptedQuantity} ok{d.defectiveQuantity ? `, ${d.defectiveQuantity} lỗi` : ""})
                                                            </span>
                                                        ) : (
                                                            <button onClick={() => { setConfirmingDelivery(d); setConfirmForm({ acceptedQuantity: d.quantity, defectiveQuantity: 0, defectNote: "" }); }} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                                                                Xác nhận
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Confirm delivery inline form */}
                                {confirmingDelivery && (
                                    <div style={{ background: "#fff", borderRadius: 16, border: "2px solid #6366f1", padding: 24, marginBottom: 20 }}>
                                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📋 Xác nhận lần giao — {confirmingDelivery.quantity} sản phẩm</h3>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                                            <div>
                                                <label style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>SL chấp nhận</label>
                                                <input type="number" min={0} max={confirmingDelivery.quantity} value={confirmForm.acceptedQuantity} onChange={e => setConfirmForm(f => ({ ...f, acceptedQuantity: Number(e.target.value) }))} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" }} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>SL lỗi</label>
                                                <input type="number" min={0} value={confirmForm.defectiveQuantity} onChange={e => setConfirmForm(f => ({ ...f, defectiveQuantity: Number(e.target.value) }))} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" }} />
                                            </div>
                                        </div>
                                        {confirmForm.defectiveQuantity > 0 && (
                                            <div style={{ marginBottom: 12 }}>
                                                <label style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>Ghi chú lỗi</label>
                                                <textarea value={confirmForm.defectNote} onChange={e => setConfirmForm(f => ({ ...f, defectNote: e.target.value }))} placeholder="Mô tả lỗi..." rows={2} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box", resize: "vertical" }} />
                                            </div>
                                        )}
                                        <div style={{ display: "flex", gap: 12 }}>
                                            <button onClick={() => setConfirmingDelivery(null)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #ddd", background: "#fff", fontWeight: 600, cursor: "pointer" }}>Hủy</button>
                                            <button onClick={handleConfirmDelivery} disabled={actionLoading} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: actionLoading ? "#ccc" : "#6366f1", color: "#fff", fontWeight: 600, cursor: actionLoading ? "not-allowed" : "pointer" }}>
                                                {actionLoading ? "Đang xử lý..." : "✅ Xác nhận"}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Verify quantity */}
                                {verifyData && (
                                    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: 24 }}>
                                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📊 Tổng hợp số lượng</h3>
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                                            {[
                                                { label: "Yêu cầu", val: verifyData.totalExpected, color: "#6366f1" },
                                                { label: "Đã giao", val: verifyData.totalDelivered, color: "#3b82f6" },
                                                { label: "Chấp nhận", val: verifyData.totalAccepted, color: "#10b981" },
                                                { label: "Lỗi", val: verifyData.totalDefective, color: "#ef4444" },
                                            ].map(s => (
                                                <div key={s.label} style={{ padding: 14, background: `${s.color}10`, borderRadius: 12, textAlign: "center" }}>
                                                    <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: s.color }}>{s.val}</p>
                                                    <p style={{ margin: 0, fontSize: 12, color: "#888" }}>{s.label}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* ═══ TAB: Phân phối ═══ */}
                {activeTab === "distribution" && (
                    <div>
                        {!distStatus ? (
                            <div style={{ textAlign: "center", padding: 40, color: "#999" }}>Đang tải...</div>
                        ) : (
                            <>
                                {/* Stats */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
                                    {[
                                        { label: "Tổng đơn", val: distStatus.totalOrders, color: "#6366f1" },
                                        { label: "Đã phân phối", val: distStatus.distributedCount, color: "#10b981" },
                                        { label: "Chờ phân phối", val: distStatus.pendingCount, color: "#f59e0b" },
                                    ].map(s => (
                                        <div key={s.label} style={{ padding: 16, background: `${s.color}10`, borderRadius: 12, textAlign: "center" }}>
                                            <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: s.color }}>{s.val}</p>
                                            <p style={{ margin: 0, fontSize: 12, color: "#888" }}>{s.label}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Sub-tabs */}
                                <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                                    {([
                                        { key: "all" as const, label: "📋 Tất cả", count: distStatus.orders.length },
                                        { key: "atSchool" as const, label: "🏫 Tại trường", count: distStatus.orders.filter(o => o.deliveryMethod !== "AtHome").length },
                                        { key: "atHome" as const, label: "🏠 Giao nhà", count: distStatus.orders.filter(o => o.deliveryMethod === "AtHome").length },
                                    ]).map(tab => (
                                        <button key={tab.key} onClick={() => setDistSubTab(tab.key)} style={{
                                            padding: "8px 20px", borderRadius: 20, border: "none", cursor: "pointer",
                                            background: distSubTab === tab.key ? "#6366f1" : "#e8e8e8",
                                            color: distSubTab === tab.key ? "#fff" : "#555", fontWeight: 600, fontSize: 13,
                                        }}>
                                            {tab.label} ({tab.count})
                                        </button>
                                    ))}
                                </div>

                                {/* Pending orders */}
                                {(() => {
                                    const searchLower = distSearch.toLowerCase();
                                    const pending = distStatus.orders
                                        .filter(o => !o.isDistributed)
                                        .filter(o => distSubTab === "all" ? true : distSubTab === "atHome" ? o.deliveryMethod === "AtHome" : o.deliveryMethod !== "AtHome")
                                        .filter(o => !distSearch || o.childName.toLowerCase().includes(searchLower) || o.parentName.toLowerCase().includes(searchLower));
                                    return pending.length > 0 || distSearch ? (
                                        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: 24, marginBottom: 20 }}>
                                            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>📋 Chờ phân phối</h3>
                                            <div style={{ position: "relative", marginBottom: 14 }}>
                                                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16, pointerEvents: "none" }}>🔍</span>
                                                <input
                                                    type="text"
                                                    placeholder="Tìm theo tên học sinh hoặc phụ huynh..."
                                                    value={distSearch}
                                                    onChange={e => setDistSearch(e.target.value)}
                                                    style={{
                                                        width: "100%", padding: "10px 14px 10px 36px", borderRadius: 10,
                                                        border: "1px solid #e5e7eb", fontSize: 13, fontWeight: 500,
                                                        background: "#f9fafb", outline: "none", boxSizing: "border-box",
                                                    }}
                                                />
                                            </div>
                                            {pending.length === 0 ? (
                                                <p style={{ textAlign: "center", color: "#999", fontSize: 14, padding: 16 }}>Không tìm thấy kết quả.</p>
                                            ) : pending.map(o => (
                                                <label key={o.orderId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: selectedOrders.includes(o.orderId) ? "#eef2ff" : "#f9fafb", borderRadius: 10, marginBottom: 8, cursor: "pointer", border: `1px solid ${selectedOrders.includes(o.orderId) ? "#a5b4fc" : "#e5e7eb"}` }}>
                                                    <input type="checkbox" checked={selectedOrders.includes(o.orderId)} onChange={e => { if (e.target.checked) setSelectedOrders(p => [...p, o.orderId]); else setSelectedOrders(p => p.filter(id => id !== o.orderId)); }} />
                                                    <div style={{ flex: 1 }}><strong>{o.childName}</strong><span style={{ color: "#888", fontSize: 13, marginLeft: 8 }}>({o.parentName})</span></div>
                                                    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: o.deliveryMethod === "AtHome" ? "#dbeafe" : "#dcfce7", color: o.deliveryMethod === "AtHome" ? "#2563eb" : "#16a34a" }}>
                                                        {o.deliveryMethod === "AtHome" ? "🏠 Giao nhà" : "🏫 Tại trường"}
                                                    </span>
                                                </label>
                                            ))}

                                            {/* Shipping form for AtHome */}
                                            {selectedOrders.some(id => distStatus.orders.find(o => o.orderId === id)?.deliveryMethod === "AtHome") && (
                                                <div style={{ marginTop: 12, padding: 16, background: "#eff6ff", borderRadius: 12 }}>
                                                    <h5 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 600 }}>🚛 Thông tin vận chuyển</h5>
                                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                                        <input placeholder="Đơn vị vận chuyển" value={shipForm.shippingCompany} onChange={e => setShipForm(f => ({ ...f, shippingCompany: e.target.value }))} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14 }} />
                                                        <input placeholder="Mã vận đơn" value={shipForm.trackingCode} onChange={e => setShipForm(f => ({ ...f, trackingCode: e.target.value }))} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14 }} />
                                                    </div>
                                                    <input placeholder="URL ảnh xác nhận" value={shipForm.proofImageUrl} onChange={e => setShipForm(f => ({ ...f, proofImageUrl: e.target.value }))} style={{ width: "100%", marginTop: 10, padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" }} />
                                                </div>
                                            )}

                                            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                                                <button disabled={selectedOrders.length === 0 || actionLoading} onClick={() => handleDistribute("AtSchool")} style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "none", background: selectedOrders.length === 0 ? "#ccc" : "#10b981", color: "#fff", fontWeight: 600, cursor: selectedOrders.length === 0 ? "not-allowed" : "pointer" }}>
                                                    🏫 Phát tại trường
                                                </button>
                                                <button disabled={selectedOrders.length === 0 || actionLoading} onClick={() => handleDistribute("AtHome")} style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "none", background: selectedOrders.length === 0 ? "#ccc" : "#3b82f6", color: "#fff", fontWeight: 600, cursor: selectedOrders.length === 0 ? "not-allowed" : "pointer" }}>
                                                    🏠 Giao tận nhà
                                                </button>
                                            </div>
                                        </div>
                                    ) : null;
                                })()}

                                {/* Distributed orders */}
                                {(() => {
                                    const distributed = distStatus.orders
                                        .filter(o => o.isDistributed)
                                        .filter(o => distSubTab === "all" ? true : distSubTab === "atHome" ? o.deliveryMethod === "AtHome" : o.deliveryMethod !== "AtHome");
                                    return distributed.length > 0 ? (
                                        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: 24, marginBottom: 20 }}>
                                            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: "#10b981" }}>✅ Đã phân phối</h3>
                                            {distributed.map(o => (
                                                <div key={o.orderId} style={{ padding: "12px 16px", background: "#f0fdf4", borderRadius: 10, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #86efac" }}>
                                                    <div>
                                                        <strong>{o.childName}</strong>
                                                        <span style={{ color: "#888", fontSize: 13, marginLeft: 8 }}>({o.parentName})</span>
                                                        {o.trackingCode && <span style={{ color: "#6366f1", fontSize: 12, marginLeft: 8 }}>📦 {o.trackingCode}</span>}
                                                        <span style={{ padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 600, marginLeft: 8, background: o.deliveryMethod === "AtHome" ? "#dbeafe" : "#dcfce7", color: o.deliveryMethod === "AtHome" ? "#2563eb" : "#16a34a" }}>
                                                            {o.deliveryMethod === "AtHome" ? "🏠" : "🏫"}
                                                        </span>
                                                    </div>
                                                    <span style={{ fontSize: 12, color: "#888" }}>{o.distributedAt ? new Date(o.distributedAt).toLocaleDateString("vi") : ""}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : null;
                                })()}

                                {/* Schedules */}
                                <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: 24 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>📅 Lịch phân phối</h3>
                                        <button onClick={() => setShowScheduleModal(true)} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>+ Tạo lịch</button>
                                    </div>
                                    {schedules.length === 0 ? (
                                        <p style={{ color: "#999", textAlign: "center", padding: 20, background: "#f9fafb", borderRadius: 10 }}>Chưa có lịch nào.</p>
                                    ) : (
                                        <div style={{ display: "grid", gap: 10 }}>
                                            {schedules.map(s => (
                                                <div key={s.id} style={{ padding: "16px 20px", background: s.status === "Completed" ? "#f0fdf4" : "#fefce8", borderRadius: 12, border: `1px solid ${s.status === "Completed" ? "#86efac" : "#fde68a"}` }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                        <div>
                                                            <strong style={{ fontSize: 14 }}>{new Date(s.scheduledDate).toLocaleDateString("vi")} — {s.timeSlot}</strong>
                                                            <span style={{ padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600, marginLeft: 8, background: s.method === "AtHome" ? "#dbeafe" : "#dcfce7", color: s.method === "AtHome" ? "#2563eb" : "#16a34a" }}>
                                                                {s.method === "AtHome" ? "🏠 Giao nhà" : "🏫 Tại trường"}
                                                            </span>
                                                            {s.note && <p style={{ margin: "4px 0 0", fontSize: 13, color: "#666" }}>📝 {s.note}</p>}
                                                        </div>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                            <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.status === "Completed" ? "#dcfce7" : "#fef3c7", color: s.status === "Completed" ? "#16a34a" : "#d97706" }}>
                                                                {s.status === "Completed" ? "✅ Hoàn thành" : "📋 Đã lên kế hoạch"}
                                                            </span>
                                                            {s.status !== "Completed" && (
                                                                <button onClick={() => handleCompleteSchedule(s.id)} disabled={actionLoading} style={{ padding: "4px 12px", borderRadius: 6, border: "none", background: "#10b981", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✓ Xong</button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ═══ TAB: Khiếu nại ═══ */}
                {activeTab === "complaints" && (
                    <div>
                        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: 24 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🐛 Báo cáo lỗi sản phẩm</h3>
                            <div style={{ display: "grid", gap: 14 }}>
                                <div>
                                    <label style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>Tiêu đề *</label>
                                    <input value={defectForm.title} onChange={e => setDefectForm(f => ({ ...f, title: e.target.value }))} placeholder="VD: Áo sơ mi bị rách" style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box", marginTop: 4 }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>Mô tả chi tiết *</label>
                                    <textarea value={defectForm.description} onChange={e => setDefectForm(f => ({ ...f, description: e.target.value }))} placeholder="Mô tả chi tiết lỗi..." rows={3} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box", resize: "vertical", marginTop: 4 }} />
                                </div>
                                <div>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                        <label style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>📷 Ảnh chứng minh (URL)</label>
                                        <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 600 }}>* Bắt buộc ≥ 1</span>
                                    </div>
                                    {defectForm.proofImageUrls.map((url, idx) => (
                                        <div key={idx} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                                            <input value={url} onChange={e => { const urls = [...defectForm.proofImageUrls]; urls[idx] = e.target.value; setDefectForm(f => ({ ...f, proofImageUrls: urls })); }} placeholder={`URL ảnh ${idx + 1}...`} style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, boxSizing: "border-box" }} />
                                            {defectForm.proofImageUrls.length > 1 && (
                                                <button onClick={() => { const urls = defectForm.proofImageUrls.filter((_, i) => i !== idx); setDefectForm(f => ({ ...f, proofImageUrls: urls })); }} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: "#fef2f2", color: "#ef4444", fontWeight: 700, cursor: "pointer", fontSize: 16 }}>×</button>
                                            )}
                                        </div>
                                    ))}
                                    <button onClick={() => setDefectForm(f => ({ ...f, proofImageUrls: [...f.proofImageUrls, ""] }))} style={{ padding: "6px 14px", borderRadius: 6, border: "1px dashed #a5b4fc", background: "#eef2ff", color: "#6366f1", fontWeight: 600, cursor: "pointer", fontSize: 12 }}>+ Thêm ảnh</button>
                                </div>
                                <button onClick={handleReportDefect} disabled={actionLoading || !defectForm.title.trim() || !defectForm.description.trim()} style={{ padding: "14px 0", borderRadius: 10, border: "none", background: actionLoading || !defectForm.title.trim() || !defectForm.description.trim() ? "#ccc" : "#ef4444", color: "#fff", fontWeight: 600, fontSize: 15, cursor: actionLoading ? "not-allowed" : "pointer" }}>
                                    {actionLoading ? "Đang xử lý..." : "🐛 Gửi báo cáo lỗi"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ MODALS (only small confirm dialogs) ═══ */}

                {/* Reject modal */}
                {showReject && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 }}>
                        <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "90%", maxWidth: 440 }}>
                            <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700 }}>❌ Từ chối đơn sản xuất</h3>
                            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Nhập lý do từ chối..." rows={3} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box", resize: "vertical" }} />
                            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                                <button onClick={() => { setShowReject(false); setRejectReason(""); }} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #ddd", background: "#fff", fontWeight: 600, cursor: "pointer" }}>Hủy</button>
                                <button onClick={handleReject} disabled={actionLoading || !rejectReason.trim()} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: actionLoading ? "#ccc" : "#ef4444", color: "#fff", fontWeight: 600, cursor: actionLoading ? "not-allowed" : "pointer" }}>
                                    {actionLoading ? "Đang xử lý..." : "Xác nhận từ chối"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Schedule creation modal */}
                {showScheduleModal && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200 }}>
                        <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "90%", maxWidth: 440 }}>
                            <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700 }}>📅 Tạo lịch phân phối</h3>
                            <div style={{ display: "grid", gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>Ngày dự kiến *</label>
                                    <input type="date" value={scheduleForm.scheduledDate} onChange={e => setScheduleForm(f => ({ ...f, scheduledDate: e.target.value }))} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>Hình thức</label>
                                    <select value={scheduleForm.method} onChange={e => setScheduleForm(f => ({ ...f, method: e.target.value }))} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" }}>
                                        <option value="AtSchool">🏫 Phát tại trường</option>
                                        <option value="AtHome">🏠 Giao tận nhà</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>Khung giờ *</label>
                                    <input value={scheduleForm.timeSlot} onChange={e => setScheduleForm(f => ({ ...f, timeSlot: e.target.value }))} placeholder="VD: 8:00 - 11:00" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>Ghi chú</label>
                                    <textarea value={scheduleForm.note} onChange={e => setScheduleForm(f => ({ ...f, note: e.target.value }))} placeholder="VD: Phát đồng phục cho khối 10..." rows={2} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box", resize: "vertical" }} />
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                                <button onClick={() => { setShowScheduleModal(false); setScheduleForm({ scheduledDate: "", method: "AtSchool", timeSlot: "", note: "" }); }} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #ddd", background: "#fff", fontWeight: 600, cursor: "pointer" }}>Hủy</button>
                                <button onClick={handleCreateSchedule} disabled={actionLoading || !scheduleForm.scheduledDate || !scheduleForm.timeSlot.trim()} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: actionLoading || !scheduleForm.scheduledDate || !scheduleForm.timeSlot.trim() ? "#ccc" : "#6366f1", color: "#fff", fontWeight: 600, cursor: actionLoading ? "not-allowed" : "pointer" }}>
                                    {actionLoading ? "Đang tạo..." : "📅 Tạo lịch"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
        </>
    );
}
