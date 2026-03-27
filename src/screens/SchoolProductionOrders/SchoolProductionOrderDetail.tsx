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

const STATUS_BADGE: Record<string, string> = {
    Pending: "nb-badge nb-badge-yellow", Approved: "nb-badge nb-badge-blue",
    InProduction: "nb-badge nb-badge-purple", Completed: "nb-badge nb-badge-green",
    Rejected: "nb-badge nb-badge-red", Delivered: "nb-badge bg-[#CFFAFE] text-[#0E7490]",
};
const STATUS_LABELS: Record<string, string> = {
    Pending: "Chờ xử lý", Approved: "Đã duyệt", InProduction: "Đang sản xuất",
    Completed: "Hoàn thành", Rejected: "Từ chối", Delivered: "Đã giao",
};
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

    const [showReject, setShowReject] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

    const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatusResponse | null>(null);
    const [verifyData, setVerifyData] = useState<VerifyQuantityResponse | null>(null);
    const [confirmingDelivery, setConfirmingDelivery] = useState<DeliveryRecordDto | null>(null);
    const [confirmForm, setConfirmForm] = useState({ acceptedQuantity: 0, defectiveQuantity: 0, defectNote: "" });

    const [distStatus, setDistStatus] = useState<DistributionStatusResponse | null>(null);
    const [distSubTab, setDistSubTab] = useState<"all" | "atSchool" | "atHome">("all");
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [shipForm, setShipForm] = useState({ shippingCompany: "", trackingCode: "", proofImageUrl: "", note: "" });
    const [schedules, setSchedules] = useState<DistributionScheduleDto[]>([]);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduleForm, setScheduleForm] = useState({ scheduledDate: "", method: "AtSchool", timeSlot: "", note: "" });
    const [distSearch, setDistSearch] = useState("");

    const [defectForm, setDefectForm] = useState({ title: "", description: "", proofImageUrls: [""] as string[] });

    const loadDetail = useCallback(async () => {
        if (!batchId) return; setLoading(true);
        try { setDetail(await getSchoolProductionOrderDetail(batchId)); } catch { /* */ }
        finally { setLoading(false); }
    }, [batchId]);

    useEffect(() => { loadDetail(); }, [loadDetail]);

    const loadDeliveryData = async () => {
        if (!batchId) return;
        try { const [ds, vq] = await Promise.all([getDeliveryStatus(batchId), getVerifyQuantity(batchId)]); setDeliveryStatus(ds); setVerifyData(vq); } catch { /* */ }
    };
    const loadDistributionData = async () => {
        if (!batchId) return;
        try { const [ds, sched] = await Promise.all([getDistributionStatus(batchId), getDistributionSchedules(batchId)]); setDistStatus(ds); setSchedules(sched); } catch { /* */ }
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
        try { await createDistributionSchedule(batchId, scheduleForm); setShowScheduleModal(false); setScheduleForm({ scheduledDate: "", method: "AtSchool", timeSlot: "", note: "" }); loadDistributionData(); }
        catch (e: any) { alert(e.message || "Lỗi"); } finally { setActionLoading(false); }
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
        try { await reportDefect(batchId, { ...defectForm, proofImageUrls: validUrls }); setDefectForm({ title: "", description: "", proofImageUrls: [""] }); alert("Đã báo cáo lỗi thành công!"); }
        catch (e: any) { alert(e.message || "Lỗi"); } finally { setActionLoading(false); }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 border-4 border-[#6938EF] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!detail) return (
        <div className="text-center py-20">
            <p className="text-[#6B7280] mb-4">Không tìm thấy đơn sản xuất.</p>
            <button onClick={() => navigate("/school/production-orders")} className="nb-btn nb-btn-purple text-sm">← Quay lại</button>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="nb-breadcrumb-bar -mx-4 sm:-mx-6 lg:-mx-10 -mt-6 lg:-mt-8 mb-6">
                <Breadcrumb><BreadcrumbList>
                    <BreadcrumbItem><BreadcrumbLink href="/school/dashboard" className="font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                    <BreadcrumbItem><BreadcrumbLink href="/school/production-orders" className="font-semibold text-[#4c5769] text-base">Đơn sản xuất</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                    <BreadcrumbItem><BreadcrumbPage className="font-bold text-[#1A1A2E] text-base">{detail.batchName}</BreadcrumbPage></BreadcrumbItem>
                </BreadcrumbList></Breadcrumb>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate("/school/production-orders")} className="nb-btn nb-btn-outline nb-btn-sm text-sm">← Quay lại</button>
                    <h1 className="font-extrabold text-[#1A1A2E] text-2xl">🏭 {detail.batchName}</h1>
                </div>
                <span className={STATUS_BADGE[detail.status] || "nb-badge"}>{STATUS_LABELS[detail.status] || detail.status}</span>
            </div>

            {/* Tab bar — NB */}
            <div className="nb-tabs w-fit">
                {TABS.map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        className={`nb-tab ${activeTab === tab.key ? "nb-tab-active" : ""}`}>
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* ═══ TAB: Chi tiết ═══ */}
            {activeTab === "detail" && (
                <div className="space-y-5">
                    <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                        {[
                            { label: "Chiến dịch", value: detail.campaignName },
                            { label: "Nhà cung cấp", value: detail.providerName || "—" },
                            { label: "Tổng số lượng", value: String(detail.totalQuantity) },
                            ...(detail.deliveryDeadline ? [{ label: "Hạn giao", value: new Date(detail.deliveryDeadline).toLocaleDateString("vi") }] : []),
                            ...(detail.processedAt ? [{ label: "Ngày xử lý", value: new Date(detail.processedAt).toLocaleDateString("vi") }] : []),
                            { label: "Ngày tạo", value: new Date(detail.createdDate).toLocaleDateString("vi") },
                        ].map(({ label, value }) => (
                            <div key={label} className="nb-card-static p-4">
                                <p className="nb-stat-label text-xs">{label}</p>
                                <p className="font-bold text-[#1A1A2E] text-base mt-1">{value}</p>
                            </div>
                        ))}
                    </div>

                    {detail.rejectionReason && (
                        <div className="nb-alert nb-alert-error text-sm"><span>❌</span><span>Lý do từ chối: {detail.rejectionReason}</span></div>
                    )}

                    <div className="nb-card-static p-0">
                        <div className="px-6 pt-5 pb-3 border-b-2 border-[#E5E7EB]">
                            <h3 className="font-bold text-[#1A1A2E] text-base">📦 Danh sách sản phẩm</h3>
                        </div>
                        <table className="nb-table">
                            <thead><tr><th>Đồng phục</th><th>Size</th><th>SL</th><th>Đơn giá</th></tr></thead>
                            <tbody>
                                {detail.items.map(item => (
                                    <tr key={item.id}>
                                        <td className="font-bold text-[#1A1A2E]">{item.outfitName}</td>
                                        <td>{item.size}</td>
                                        <td className="font-bold">{item.quantity}</td>
                                        <td>{item.unitPrice.toLocaleString("vi")}₫</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {detail.status === "Pending" && (
                        <div className="flex gap-3">
                            <button onClick={handleConfirm} disabled={actionLoading} className="flex-1 nb-btn nb-btn-green text-sm disabled:opacity-50">
                                {actionLoading ? "Đang xử lý..." : "✅ Xác nhận đơn sản xuất"}
                            </button>
                            <button onClick={() => setShowReject(true)} className="flex-1 nb-btn nb-btn-red text-sm">❌ Từ chối</button>
                        </div>
                    )}
                </div>
            )}

            {/* ═══ TAB: Giao hàng ═══ */}
            {activeTab === "delivery" && (
                <div className="space-y-5">
                    {!deliveryStatus ? (
                        <div className="text-center py-10 text-[#9CA3AF]">Đang tải...</div>
                    ) : (
                        <>
                            {/* Progress */}
                            <div className="nb-card-static p-5">
                                <div className="flex justify-between text-sm text-[#6B7280] mb-2">
                                    <span>Đã giao: <strong className="text-[#1A1A2E]">{deliveryStatus.totalDelivered}/{deliveryStatus.totalQuantity}</strong></span>
                                    <span className="font-bold">{deliveryStatus.totalQuantity > 0 ? Math.round((deliveryStatus.totalDelivered / deliveryStatus.totalQuantity) * 100) : 0}%</span>
                                </div>
                                <div className="nb-progress">
                                    <div className="nb-progress-bar" style={{
                                        width: `${deliveryStatus.totalQuantity > 0 ? Math.min(100, (deliveryStatus.totalDelivered / deliveryStatus.totalQuantity) * 100) : 0}%`,
                                        background: deliveryStatus.isFullyDelivered ? "#10B981" : "#6938EF",
                                    }} />
                                </div>
                            </div>

                            {/* Delivery records */}
                            <div className="nb-card-static p-5">
                                <h3 className="font-bold text-[#1A1A2E] text-base mb-4">📋 Các lần giao hàng</h3>
                                {deliveryStatus.deliveries.length === 0 ? (
                                    <p className="text-center text-[#9CA3AF] py-5">Chưa có lần giao nào.</p>
                                ) : (
                                    <div className="grid gap-3">
                                        {deliveryStatus.deliveries.map(d => (
                                            <div key={d.id} className={`p-4 rounded-xl border-2 ${d.isConfirmed ? "border-[#10B981] bg-[#D1FAE5]" : "border-[#F59E0B] bg-[#FEF3C7]"}`}>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <strong className="text-[#1A1A2E]">{d.quantity} sản phẩm</strong>
                                                        <span className="text-xs text-[#6B7280] ml-2">{new Date(d.deliveredAt).toLocaleDateString("vi")}</span>
                                                        {d.note && <p className="text-xs text-[#4C5769] mt-1">📝 {d.note}</p>}
                                                    </div>
                                                    {d.isConfirmed ? (
                                                        <span className="nb-badge nb-badge-green text-xs">
                                                            ✅ Đã xác nhận ({d.acceptedQuantity} ok{d.defectiveQuantity ? `, ${d.defectiveQuantity} lỗi` : ""})
                                                        </span>
                                                    ) : (
                                                        <button onClick={() => { setConfirmingDelivery(d); setConfirmForm({ acceptedQuantity: d.quantity, defectiveQuantity: 0, defectNote: "" }); }}
                                                            className="nb-btn nb-btn-purple nb-btn-sm text-xs">Xác nhận</button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Confirm delivery form */}
                            {confirmingDelivery && (
                                <div className="nb-card-static p-5 border-[#6938EF]">
                                    <h3 className="font-bold text-[#1A1A2E] text-base mb-4">📋 Xác nhận lần giao — {confirmingDelivery.quantity} sản phẩm</h3>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <label className="block text-xs font-bold text-[#6B7280] mb-1">SL chấp nhận</label>
                                            <input type="number" min={0} max={confirmingDelivery.quantity} value={confirmForm.acceptedQuantity}
                                                onChange={e => setConfirmForm(f => ({ ...f, acceptedQuantity: Number(e.target.value) }))} className="nb-input w-full" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#6B7280] mb-1">SL lỗi</label>
                                            <input type="number" min={0} value={confirmForm.defectiveQuantity}
                                                onChange={e => setConfirmForm(f => ({ ...f, defectiveQuantity: Number(e.target.value) }))} className="nb-input w-full" />
                                        </div>
                                    </div>
                                    {confirmForm.defectiveQuantity > 0 && (
                                        <div className="mb-3">
                                            <label className="block text-xs font-bold text-[#6B7280] mb-1">Ghi chú lỗi</label>
                                            <textarea value={confirmForm.defectNote} onChange={e => setConfirmForm(f => ({ ...f, defectNote: e.target.value }))}
                                                placeholder="Mô tả lỗi..." rows={2} className="nb-input w-full resize-y" />
                                        </div>
                                    )}
                                    <div className="flex gap-3">
                                        <button onClick={() => setConfirmingDelivery(null)} className="flex-1 nb-btn nb-btn-outline text-sm">Hủy</button>
                                        <button onClick={handleConfirmDelivery} disabled={actionLoading} className="flex-1 nb-btn nb-btn-purple text-sm disabled:opacity-50">
                                            {actionLoading ? "Đang xử lý..." : "✅ Xác nhận"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Verify quantity */}
                            {verifyData && (
                                <div className="nb-card-static p-5">
                                    <h3 className="font-bold text-[#1A1A2E] text-base mb-4">📊 Tổng hợp số lượng</h3>
                                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                                        {[
                                            { label: "Yêu cầu", val: verifyData.totalExpected, cls: "nb-card-purple" },
                                            { label: "Đã giao", val: verifyData.totalDelivered, cls: "nb-card-blue" },
                                            { label: "Chấp nhận", val: verifyData.totalAccepted, cls: "nb-card-green" },
                                            { label: "Lỗi", val: verifyData.totalDefective, cls: "nb-card-red" },
                                        ].map(s => (
                                            <div key={s.label} className={`nb-stat-card ${s.cls} text-center`}>
                                                <p className="nb-stat-value">{s.val}</p>
                                                <p className="nb-stat-label mt-1">{s.label}</p>
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
                <div className="space-y-5">
                    {!distStatus ? (
                        <div className="text-center py-10 text-[#9CA3AF]">Đang tải...</div>
                    ) : (
                        <>
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { label: "Tổng đơn", val: distStatus.totalOrders, cls: "nb-card-purple" },
                                    { label: "Đã phân phối", val: distStatus.distributedCount, cls: "nb-card-green" },
                                    { label: "Chờ phân phối", val: distStatus.pendingCount, cls: "nb-card-yellow" },
                                ].map(s => (
                                    <div key={s.label} className={`nb-stat-card ${s.cls} text-center`}>
                                        <p className="nb-stat-value">{s.val}</p>
                                        <p className="nb-stat-label mt-1">{s.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Sub-tabs */}
                            <div className="nb-tabs w-fit">
                                {([
                                    { key: "all" as const, label: "📋 Tất cả", count: distStatus.orders.length },
                                    { key: "atSchool" as const, label: "🏫 Tại trường", count: distStatus.orders.filter(o => o.deliveryMethod !== "AtHome").length },
                                    { key: "atHome" as const, label: "🏠 Giao nhà", count: distStatus.orders.filter(o => o.deliveryMethod === "AtHome").length },
                                ]).map(tab => (
                                    <button key={tab.key} onClick={() => setDistSubTab(tab.key)}
                                        className={`nb-tab ${distSubTab === tab.key ? "nb-tab-active" : ""}`}>
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
                                    <div className="nb-card-static p-5">
                                        <h3 className="font-bold text-[#1A1A2E] text-base mb-3">📋 Chờ phân phối</h3>
                                        <div className="relative mb-3">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none">🔍</span>
                                            <input type="text" placeholder="Tìm theo tên học sinh hoặc phụ huynh..." value={distSearch}
                                                onChange={e => setDistSearch(e.target.value)} className="nb-input w-full pl-9 text-sm" />
                                        </div>
                                        {pending.length === 0 ? (
                                            <p className="text-center text-[#9CA3AF] text-sm py-4">Không tìm thấy kết quả.</p>
                                        ) : pending.map(o => (
                                            <label key={o.orderId} className={`flex items-center gap-3 p-3 rounded-lg mb-2 cursor-pointer border-2 transition-colors ${selectedOrders.includes(o.orderId) ? "border-[#6938EF] bg-[#EDE9FE]" : "border-[#E5E7EB] bg-[#F9FAFB]"}`}>
                                                <input type="checkbox" className="w-4 h-4 accent-[#6938EF]"
                                                    checked={selectedOrders.includes(o.orderId)}
                                                    onChange={e => { if (e.target.checked) setSelectedOrders(p => [...p, o.orderId]); else setSelectedOrders(p => p.filter(id => id !== o.orderId)); }} />
                                                <div className="flex-1"><strong className="text-[#1A1A2E] text-sm">{o.childName}</strong> <span className="text-xs text-[#6B7280]">({o.parentName})</span></div>
                                                <span className={`nb-badge text-[10px] ${o.deliveryMethod === "AtHome" ? "nb-badge-blue" : "nb-badge-green"}`}>
                                                    {o.deliveryMethod === "AtHome" ? "🏠 Giao nhà" : "🏫 Tại trường"}
                                                </span>
                                            </label>
                                        ))}

                                        {/* Shipping form for AtHome */}
                                        {selectedOrders.some(id => distStatus.orders.find(o => o.orderId === id)?.deliveryMethod === "AtHome") && (
                                            <div className="nb-alert nb-alert-info mt-3">
                                                <div className="w-full space-y-2">
                                                    <h5 className="font-bold text-sm text-[#1A1A2E]">🚛 Thông tin vận chuyển</h5>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <input placeholder="Đơn vị vận chuyển" value={shipForm.shippingCompany} onChange={e => setShipForm(f => ({ ...f, shippingCompany: e.target.value }))} className="nb-input text-sm" />
                                                        <input placeholder="Mã vận đơn" value={shipForm.trackingCode} onChange={e => setShipForm(f => ({ ...f, trackingCode: e.target.value }))} className="nb-input text-sm" />
                                                    </div>
                                                    <input placeholder="URL ảnh xác nhận" value={shipForm.proofImageUrl} onChange={e => setShipForm(f => ({ ...f, proofImageUrl: e.target.value }))} className="nb-input w-full text-sm" />
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex gap-3 mt-4">
                                            <button disabled={selectedOrders.length === 0 || actionLoading} onClick={() => handleDistribute("AtSchool")}
                                                className="flex-1 nb-btn nb-btn-green text-sm disabled:opacity-50">🏫 Phát tại trường</button>
                                            <button disabled={selectedOrders.length === 0 || actionLoading} onClick={() => handleDistribute("AtHome")}
                                                className="flex-1 nb-btn text-sm bg-[#3B82F6] text-white border-[#1A1A2E] disabled:opacity-50">🏠 Giao tận nhà</button>
                                        </div>
                                    </div>
                                ) : null;
                            })()}

                            {/* Distributed orders */}
                            {(() => {
                                const distributed = distStatus.orders.filter(o => o.isDistributed)
                                    .filter(o => distSubTab === "all" ? true : distSubTab === "atHome" ? o.deliveryMethod === "AtHome" : o.deliveryMethod !== "AtHome");
                                return distributed.length > 0 ? (
                                    <div className="nb-card-static p-5">
                                        <h3 className="font-bold text-[#10B981] text-base mb-3">✅ Đã phân phối</h3>
                                        {distributed.map(o => (
                                            <div key={o.orderId} className="p-3 rounded-lg mb-2 border-2 border-[#10B981] bg-[#D1FAE5] flex items-center justify-between">
                                                <div>
                                                    <strong className="text-[#1A1A2E] text-sm">{o.childName}</strong>
                                                    <span className="text-xs text-[#6B7280] ml-2">({o.parentName})</span>
                                                    {o.trackingCode && <span className="text-xs text-[#6938EF] ml-2">📦 {o.trackingCode}</span>}
                                                    <span className={`nb-badge text-[10px] ml-2 ${o.deliveryMethod === "AtHome" ? "nb-badge-blue" : "nb-badge-green"}`}>
                                                        {o.deliveryMethod === "AtHome" ? "🏠" : "🏫"}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-[#6B7280]">{o.distributedAt ? new Date(o.distributedAt).toLocaleDateString("vi") : ""}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : null;
                            })()}

                            {/* Schedules */}
                            <div className="nb-card-static p-5">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-[#1A1A2E] text-base">📅 Lịch phân phối</h3>
                                    <button onClick={() => setShowScheduleModal(true)} className="nb-btn nb-btn-purple nb-btn-sm text-xs">+ Tạo lịch</button>
                                </div>
                                {schedules.length === 0 ? (
                                    <p className="text-center text-[#9CA3AF] py-5 bg-[#F9FAFB] rounded-lg">Chưa có lịch nào.</p>
                                ) : (
                                    <div className="grid gap-3">
                                        {schedules.map(s => (
                                            <div key={s.id} className={`p-4 rounded-xl border-2 ${s.status === "Completed" ? "border-[#10B981] bg-[#D1FAE5]" : "border-[#F59E0B] bg-[#FEF3C7]"}`}>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <strong className="text-sm text-[#1A1A2E]">{new Date(s.scheduledDate).toLocaleDateString("vi")} — {s.timeSlot}</strong>
                                                        <span className={`nb-badge text-[10px] ml-2 ${s.method === "AtHome" ? "nb-badge-blue" : "nb-badge-green"}`}>
                                                            {s.method === "AtHome" ? "🏠 Giao nhà" : "🏫 Tại trường"}
                                                        </span>
                                                        {s.note && <p className="text-xs text-[#4C5769] mt-1">📝 {s.note}</p>}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`nb-badge text-[10px] ${s.status === "Completed" ? "nb-badge-green" : "nb-badge-yellow"}`}>
                                                            {s.status === "Completed" ? "✅ Hoàn thành" : "📋 Đã lên kế hoạch"}
                                                        </span>
                                                        {s.status !== "Completed" && (
                                                            <button onClick={() => handleCompleteSchedule(s.id)} disabled={actionLoading}
                                                                className="nb-btn nb-btn-green nb-btn-sm text-[10px]">✓ Xong</button>
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
                <div className="nb-card-static p-5">
                    <h3 className="font-bold text-[#1A1A2E] text-base mb-4">🐛 Báo cáo lỗi sản phẩm</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-[#6B7280] mb-1">Tiêu đề *</label>
                            <input value={defectForm.title} onChange={e => setDefectForm(f => ({ ...f, title: e.target.value }))}
                                placeholder="VD: Áo sơ mi bị rách" className="nb-input w-full" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#6B7280] mb-1">Mô tả chi tiết *</label>
                            <textarea value={defectForm.description} onChange={e => setDefectForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="Mô tả chi tiết lỗi..." rows={3} className="nb-input w-full resize-y" />
                        </div>
                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-xs font-bold text-[#6B7280]">📷 Ảnh chứng minh (URL)</label>
                                <span className="text-[10px] text-[#EF4444] font-bold">* Bắt buộc ≥ 1</span>
                            </div>
                            {defectForm.proofImageUrls.map((url, idx) => (
                                <div key={idx} className="flex gap-2 mb-2">
                                    <input value={url} onChange={e => { const urls = [...defectForm.proofImageUrls]; urls[idx] = e.target.value; setDefectForm(f => ({ ...f, proofImageUrls: urls })); }}
                                        placeholder={`URL ảnh ${idx + 1}...`} className="nb-input flex-1 text-sm" />
                                    {defectForm.proofImageUrls.length > 1 && (
                                        <button onClick={() => { const urls = defectForm.proofImageUrls.filter((_, i) => i !== idx); setDefectForm(f => ({ ...f, proofImageUrls: urls })); }}
                                            className="text-[#EF4444] font-bold text-lg hover:text-[#DC2626] px-2">×</button>
                                    )}
                                </div>
                            ))}
                            <button onClick={() => setDefectForm(f => ({ ...f, proofImageUrls: [...f.proofImageUrls, ""] }))}
                                className="nb-btn nb-btn-outline nb-btn-sm text-xs">+ Thêm ảnh</button>
                        </div>
                        <button onClick={handleReportDefect} disabled={actionLoading || !defectForm.title.trim() || !defectForm.description.trim()}
                            className="w-full nb-btn nb-btn-red text-sm disabled:opacity-50">
                            {actionLoading ? "Đang xử lý..." : "🐛 Gửi báo cáo lỗi"}
                        </button>
                    </div>
                </div>
            )}

            {/* ═══ MODALS ═══ */}

            {/* Reject modal */}
            {showReject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setShowReject(false); setRejectReason(""); }}>
                    <div className="bg-white rounded-xl w-full max-w-md mx-4 p-6 border-2 border-[#1A1A2E] shadow-[6px_6px_0_#1A1A2E]" onClick={e => e.stopPropagation()}>
                        <h3 className="font-extrabold text-lg text-[#1A1A2E] mb-4">❌ Từ chối đơn sản xuất</h3>
                        <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                            placeholder="Nhập lý do từ chối..." rows={3} className="nb-input w-full resize-y mb-4" />
                        <div className="flex gap-3">
                            <button onClick={() => { setShowReject(false); setRejectReason(""); }} className="flex-1 nb-btn nb-btn-outline text-sm">Hủy</button>
                            <button onClick={handleReject} disabled={actionLoading || !rejectReason.trim()} className="flex-1 nb-btn nb-btn-red text-sm disabled:opacity-50">
                                {actionLoading ? "Đang xử lý..." : "Xác nhận từ chối"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Schedule creation modal */}
            {showScheduleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setShowScheduleModal(false); setScheduleForm({ scheduledDate: "", method: "AtSchool", timeSlot: "", note: "" }); }}>
                    <div className="bg-white rounded-xl w-full max-w-md mx-4 p-6 border-2 border-[#1A1A2E] shadow-[6px_6px_0_#1A1A2E]" onClick={e => e.stopPropagation()}>
                        <h3 className="font-extrabold text-lg text-[#1A1A2E] mb-4">📅 Tạo lịch phân phối</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-[#6B7280] mb-1">Ngày dự kiến *</label>
                                <input type="date" value={scheduleForm.scheduledDate} onChange={e => setScheduleForm(f => ({ ...f, scheduledDate: e.target.value }))} className="nb-input w-full" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#6B7280] mb-1">Hình thức</label>
                                <select value={scheduleForm.method} onChange={e => setScheduleForm(f => ({ ...f, method: e.target.value }))} className="nb-select w-full">
                                    <option value="AtSchool">🏫 Phát tại trường</option>
                                    <option value="AtHome">🏠 Giao tận nhà</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#6B7280] mb-1">Khung giờ *</label>
                                <input value={scheduleForm.timeSlot} onChange={e => setScheduleForm(f => ({ ...f, timeSlot: e.target.value }))} placeholder="VD: 8:00 - 11:00" className="nb-input w-full" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#6B7280] mb-1">Ghi chú</label>
                                <textarea value={scheduleForm.note} onChange={e => setScheduleForm(f => ({ ...f, note: e.target.value }))}
                                    placeholder="VD: Phát đồng phục cho khối 10..." rows={2} className="nb-input w-full resize-y" />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button onClick={() => { setShowScheduleModal(false); setScheduleForm({ scheduledDate: "", method: "AtSchool", timeSlot: "", note: "" }); }}
                                className="flex-1 nb-btn nb-btn-outline text-sm">Hủy</button>
                            <button onClick={handleCreateSchedule} disabled={actionLoading || !scheduleForm.scheduledDate || !scheduleForm.timeSlot.trim()}
                                className="flex-1 nb-btn nb-btn-purple text-sm disabled:opacity-50">
                                {actionLoading ? "Đang tạo..." : "📅 Tạo lịch"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
