import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useState, useEffect, useCallback } from "react";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useProviderSidebarConfig } from "../../hooks/useProviderSidebarConfig";
import {
    getProviderProductionOrders,
    getProviderProductionOrderDetail,
    acceptProductionOrder,
    completeProductionOrder,
    providerRejectProductionOrder,
    providerDeliver,
    getProviderDeliveryStatus,
    getProviderDistributionOverview,
    type ProductionOrderListItemDto,
    type ProductionOrderDetailDto,
    type DeliveryStatusResponse,
    type ProviderDistributionOverviewDto,
} from "../../lib/api/productionOrders";

const STATUS_MAP: Record<string, { label: string; badge: string }> = {
    Pending: { label: "Chờ xử lý", badge: "nb-badge nb-badge-yellow" },
    Approved: { label: "Đã duyệt", badge: "nb-badge nb-badge-blue" },
    InProduction: { label: "Đang sản xuất", badge: "nb-badge nb-badge-purple" },
    Completed: { label: "Hoàn thành", badge: "nb-badge nb-badge-green" },
    Rejected: { label: "Từ chối", badge: "nb-badge nb-badge-red" },
    Delivered: { label: "Đã giao", badge: "nb-badge nb-badge-blue" },
};

export function ProviderProductionOrders() {
    const sidebarConfig = useProviderSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();

    const [orders, setOrders] = useState<ProductionOrderListItemDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const [total, setTotal] = useState(0);
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
    // Phase 5 — Distribution overview
    const [providerActiveTab, setProviderActiveTab] = useState<"detail" | "delivery" | "distribution">("detail");
    const [distOverview, setDistOverview] = useState<ProviderDistributionOverviewDto | null>(null);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getProviderProductionOrders(page, pageSize, statusFilter || undefined);
            setOrders(res.items);
            setTotal(res.total);
        } catch (e: any) {
            console.error("Error fetching production orders:", e);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, page]);

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
            setProviderActiveTab("detail");
            if (d.status === "Completed" || d.status === "Delivered") {
                loadDeliveryHistory(id);
            }
        } catch (e: any) {
            console.error("Error fetching detail:", e);
        }
    };

    const loadDistOverview = async (batchId: string) => {
        try {
            const ov = await getProviderDistributionOverview(batchId);
            setDistOverview(ov);
        } catch (e: any) { console.error("Error loading distribution overview:", e); }
    };

    const filterTabs = [
        { value: "", label: "Tất cả" },
        { value: "Pending", label: "Chờ xử lý" },
        { value: "Approved", label: "Đã duyệt" },
        { value: "InProduction", label: "Đang SX" },
        { value: "Completed", label: "Hoàn thành" },
        { value: "Rejected", label: "Từ chối" },
        { value: "Delivered", label: "Đã giao" },
    ];

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} />
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                    <TopNavBar>
                        <h1 className="font-extrabold text-[#1A1A2E] text-2xl">🏭 Đơn sản xuất</h1>
                        <p className="font-medium text-[#6B7280] text-sm mt-1">Quản lý đơn sản xuất, giao hàng và phân phối</p>
                    </TopNavBar>

                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6">
                        {/* Status filter tabs */}
                        <div className="nb-tabs flex-wrap">
                            {filterTabs.map(t => (
                                <button
                                    key={t.value}
                                    onClick={() => { setStatusFilter(t.value); setPage(1); }}
                                    className={`nb-tab ${statusFilter === t.value ? "nb-tab-active" : ""}`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        {/* Order list */}
                        {loading ? (
                            <div className="text-center py-20">
                                <div className="inline-block w-8 h-8 border-4 border-[#6938EF] border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="nb-card-static p-10 text-center">
                                <div className="text-5xl mb-3">🏭</div>
                                <p className="font-medium text-[#9CA3AF] text-base">Chưa có đơn sản xuất nào được giao.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {orders.map(o => (
                                    <div
                                        key={o.batchId}
                                        onClick={() => openDetailWithDelivery(o.batchId)}
                                        className="nb-card p-5 cursor-pointer"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-[#1A1A2E] text-base">{o.batchName}</h3>
                                                <p className="font-medium text-[#9CA3AF] text-sm mt-1">
                                                    Chiến dịch: <strong className="text-[#6B7280]">{o.campaignName}</strong> &nbsp;·&nbsp;
                                                    Trường: <strong className="text-[#6B7280]">{o.schoolName || "—"}</strong> &nbsp;·&nbsp;
                                                    SL: <strong className="text-[#6B7280]">{o.totalQuantity}</strong> &nbsp;·&nbsp;
                                                    {new Date(o.createdDate).toLocaleDateString("vi")}
                                                </p>
                                                {o.deliveryDeadline && (
                                                    <p className="font-medium text-[#9CA3AF] text-xs mt-1">
                                                        📅 Hạn giao: <strong className="text-[#6B7280]">{new Date(o.deliveryDeadline).toLocaleDateString("vi")}</strong>
                                                    </p>
                                                )}
                                            </div>
                                            <span className={STATUS_MAP[o.status]?.badge || "nb-badge"}>
                                                {STATUS_MAP[o.status]?.label || o.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {(() => {
                            const totalPages = Math.ceil(total / pageSize);
                            return !loading && totalPages > 1 ? (
                                <div className="flex items-center justify-center gap-3 mt-4">
                                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="nb-btn nb-btn-outline nb-btn-sm text-sm">← Trước</button>
                                    <span className="text-sm font-bold text-[#6B7280]">{page}/{totalPages} ({total} đơn)</span>
                                    <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="nb-btn nb-btn-outline nb-btn-sm text-sm">Sau →</button>
                                </div>
                            ) : null;
                        })()}

                        {/* Detail Modal */}
                        {showDetail && detail && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
                                <div className="bg-white rounded-md border-2 border-[#1A1A2E] shadow-[4px_4px_0_#1A1A2E] p-8 w-full max-w-[700px] max-h-[85vh] overflow-auto">
                                    <div className="flex items-center justify-between mb-5">
                                        <h2 className="font-extrabold text-[#1A1A2E] text-xl">📋 {detail.batchName}</h2>
                                        <span className={STATUS_MAP[detail.status]?.badge || "nb-badge"}>
                                            {STATUS_MAP[detail.status]?.label || detail.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-5">
                                        <InfoBox label="Chiến dịch" value={detail.campaignName} />
                                        <InfoBox label="Trường học" value={detail.schoolName || "—"} />
                                        <InfoBox label="Tổng SL" value={String(detail.totalQuantity)} />
                                        {detail.deliveryDeadline && (
                                            <InfoBox label="Hạn giao" value={new Date(detail.deliveryDeadline).toLocaleDateString("vi")} />
                                        )}
                                    </div>

                                    {detail.rejectionReason && (
                                        <div className="nb-alert nb-alert-error mb-4">
                                            ❌ Lý do từ chối: {detail.rejectionReason}
                                        </div>
                                    )}

                                    <h3 className="font-extrabold text-[#1A1A2E] text-base mb-3">📦 Danh sách sản phẩm</h3>
                                    <table className="nb-table">
                                        <thead>
                                            <tr>
                                                <th>Đồng phục</th>
                                                <th>Size</th>
                                                <th>SL</th>
                                                <th>Đơn giá</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detail.items.map(item => (
                                                <tr key={item.id}>
                                                    <td>{item.outfitName}</td>
                                                    <td>{item.size}</td>
                                                    <td className="font-bold">{item.quantity}</td>
                                                    <td>{item.unitPrice.toLocaleString("vi")}₫</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* Phase 4/5 — Tabs for Completed/Delivered */}
                                    {(detail.status === "Completed" || detail.status === "Delivered") && (
                                        <div className="mt-6">
                                            <div className="nb-tabs border-b-2 border-[#E5E7EB]">
                                                {(["detail", "delivery", "distribution"] as const).map(tab => (
                                                    <button key={tab} onClick={() => {
                                                        setProviderActiveTab(tab);
                                                        if (tab === "delivery") loadDeliveryHistory(detail.batchId);
                                                        if (tab === "distribution") loadDistOverview(detail.batchId);
                                                    }} className={`nb-tab ${providerActiveTab === tab ? "nb-tab-active" : ""}`}>
                                                        {tab === "detail" ? "📋 Chi tiết" : tab === "delivery" ? "🚚 Giao hàng" : "📦 Phân phối"}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Delivery Tab */}
                                            {providerActiveTab === "delivery" && deliveryStatus && (
                                                <div className="py-5 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="font-extrabold text-[#1A1A2E] text-base">🚚 Tình trạng giao hàng</h3>
                                                        {detail.status === "Completed" && (
                                                            <button onClick={() => {
                                                                setDeliverQty(deliveryStatus.totalQuantity - deliveryStatus.totalDelivered);
                                                                setShowDeliver(true);
                                                            }} className="nb-btn nb-btn-purple nb-btn-sm">
                                                                📦 Giao hàng
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Progress bar */}
                                                    <div>
                                                        <div className="flex justify-between text-sm font-medium text-[#6B7280] mb-2">
                                                            <span>Đã giao: <strong className="text-[#1A1A2E]">{deliveryStatus.totalDelivered}/{deliveryStatus.totalQuantity}</strong></span>
                                                            <span className={`font-bold ${deliveryStatus.isFullyDelivered ? "text-[#10B981]" : "text-[#6938EF]"}`}>
                                                                {Math.round((deliveryStatus.totalDelivered / deliveryStatus.totalQuantity) * 100)}%
                                                            </span>
                                                        </div>
                                                        <div className="h-3 rounded-full bg-[#E5E7EB] border-2 border-[#1A1A2E] overflow-hidden">
                                                            <div className={`h-full rounded-full transition-all duration-500 ${deliveryStatus.isFullyDelivered ? "bg-[#10B981]" : "bg-[#6938EF]"}`}
                                                                style={{ width: `${Math.min(100, (deliveryStatus.totalDelivered / deliveryStatus.totalQuantity) * 100)}%` }}
                                                            />
                                                        </div>
                                                        {deliveryStatus.isFullyDelivered && (
                                                            <p className="font-bold text-[#10B981] text-sm mt-2">✅ Đã giao đủ 100%</p>
                                                        )}
                                                    </div>

                                                    {/* Delivery history */}
                                                    {deliveryStatus.deliveries.length === 0 ? (
                                                        <p className="text-center py-4 text-[#9CA3AF] font-medium">Chưa có lần giao nào.</p>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {deliveryStatus.deliveries.map((d, i) => (
                                                                <div key={d.id} className={`rounded-xl border-2 p-4 ${d.isConfirmed ? "bg-[#F0FDF4] border-[#86EFAC]" : "bg-[#FFFBEB] border-[#FDE68A]"}`}>
                                                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                                        <div>
                                                                            <strong className="text-sm text-[#1A1A2E]">Lần {deliveryStatus.deliveries.length - i}: {d.quantity} sản phẩm</strong>
                                                                            <span className="text-[#9CA3AF] text-xs ml-2">
                                                                                {new Date(d.deliveredAt).toLocaleDateString("vi")}
                                                                            </span>
                                                                            {d.note && <p className="text-[#6B7280] text-sm mt-1">📝 {d.note}</p>}
                                                                        </div>
                                                                        {d.isConfirmed ? (
                                                                            <div className="text-right">
                                                                                <span className="nb-badge nb-badge-green text-xs">✅ Trường đã xác nhận</span>
                                                                                <p className="text-xs text-[#9CA3AF] mt-1">
                                                                                    OK: {d.acceptedQuantity}{d.defectiveQuantity ? ` · Lỗi: ${d.defectiveQuantity}` : ""}
                                                                                </p>
                                                                            </div>
                                                                        ) : (
                                                                            <span className="nb-badge nb-badge-yellow text-xs">⏳ Chờ trường xác nhận</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Distribution Overview Tab (read-only) */}
                                            {providerActiveTab === "distribution" && distOverview && (
                                                <div className="py-5 space-y-5">
                                                    <div className="grid grid-cols-5 gap-2">
                                                        {[
                                                            { label: "Tổng đơn", val: distOverview.totalOrders, color: "#6938EF" },
                                                            { label: "Đã phân phối", val: distOverview.distributedCount, color: "#10B981" },
                                                            { label: "Chờ", val: distOverview.pendingCount, color: "#F59E0B" },
                                                            { label: "Tại trường", val: distOverview.atSchoolCount, color: "#16A34A" },
                                                            { label: "Giao nhà", val: distOverview.atHomeCount, color: "#2563EB" },
                                                        ].map(s => (
                                                            <div key={s.label} className="bg-white border-2 border-[#1A1A2E] rounded-lg p-3 text-center shadow-[2px_2px_0_#1A1A2E]">
                                                                <p className="text-xl font-extrabold" style={{ color: s.color }}>{s.val}</p>
                                                                <p className="text-xs font-medium text-[#9CA3AF]">{s.label}</p>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Progress bar */}
                                                    <div>
                                                        <div className="flex justify-between text-sm font-medium text-[#6B7280] mb-2">
                                                            <span>Tiến độ phân phối</span>
                                                            <span className={`font-bold ${distOverview.distributedCount === distOverview.totalOrders ? "text-[#10B981]" : "text-[#6938EF]"}`}>
                                                                {distOverview.totalOrders > 0 ? Math.round((distOverview.distributedCount / distOverview.totalOrders) * 100) : 0}%
                                                            </span>
                                                        </div>
                                                        <div className="h-3 rounded-full bg-[#E5E7EB] border-2 border-[#1A1A2E] overflow-hidden">
                                                            <div className={`h-full rounded-full transition-all duration-500 ${distOverview.distributedCount === distOverview.totalOrders ? "bg-[#10B981]" : "bg-[#6938EF]"}`}
                                                                style={{ width: `${distOverview.totalOrders > 0 ? Math.min(100, (distOverview.distributedCount / distOverview.totalOrders) * 100) : 0}%` }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Schedule Timeline */}
                                                    <h4 className="font-extrabold text-[#1A1A2E] text-sm">📅 Lịch phân phối</h4>
                                                    {distOverview.schedules.length === 0 ? (
                                                        <p className="text-center py-4 text-[#9CA3AF] font-medium bg-[#F9FAFB] rounded-xl border-2 border-[#E5E7EB]">
                                                            Trường chưa lên lịch phân phối.
                                                        </p>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {distOverview.schedules.map(s => (
                                                                <div key={s.id} className={`rounded-xl border-2 p-4 ${s.status === "Completed" ? "bg-[#F0FDF4] border-[#86EFAC]" : "bg-[#FEFCE8] border-[#FDE68A]"}`}>
                                                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                                        <div>
                                                                            <strong className="text-sm text-[#1A1A2E]">
                                                                                {new Date(s.scheduledDate).toLocaleDateString("vi")} — {s.timeSlot}
                                                                            </strong>
                                                                            <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full border ${s.method === "AtHome" ? "bg-[#DBEAFE] text-[#2563EB] border-[#93C5FD]" : "bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]"}`}>
                                                                                {s.method === "AtHome" ? "🏠 Giao nhà" : "🏫 Tại trường"}
                                                                            </span>
                                                                            {s.note && <p className="text-[#6B7280] text-sm mt-1">📝 {s.note}</p>}
                                                                        </div>
                                                                        <span className={s.status === "Completed" ? "nb-badge nb-badge-green text-xs" : "nb-badge nb-badge-yellow text-xs"}>
                                                                            {s.status === "Completed" ? "✅ Hoàn thành" : "📋 Kế hoạch"}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Action buttons based on status */}
                                    <div className="flex gap-3 mt-6">
                                        <button onClick={() => setShowDetail(false)} className="nb-btn nb-btn-outline flex-1">
                                            Đóng
                                        </button>

                                        {detail.status === "Approved" && (
                                            <button onClick={handleAccept} disabled={actionLoading} className="nb-btn nb-btn-purple flex-1">
                                                {actionLoading ? "Đang xử lý..." : "🚀 Bắt đầu sản xuất"}
                                            </button>
                                        )}

                                        {detail.status === "InProduction" && (
                                            <button onClick={handleComplete} disabled={actionLoading} className="nb-btn nb-btn-green flex-1">
                                                {actionLoading ? "Đang xử lý..." : "✅ Hoàn thành sản xuất"}
                                            </button>
                                        )}

                                        {detail.status === "Completed" && !deliveryStatus?.isFullyDelivered && (
                                            <button onClick={() => {
                                                if (deliveryStatus) setDeliverQty(deliveryStatus.totalQuantity - deliveryStatus.totalDelivered);
                                                setShowDeliver(true);
                                            }} disabled={actionLoading} className="nb-btn nb-btn-purple flex-1">
                                                📦 Giao hàng
                                            </button>
                                        )}

                                        {(detail.status === "Pending" || detail.status === "Approved") && (
                                            <button onClick={() => setShowReject(true)} className="nb-btn nb-btn-red">
                                                Từ chối
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Reject Modal */}
                        {showReject && detail && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1100] p-4">
                                <div className="bg-white rounded-md border-2 border-[#1A1A2E] shadow-[4px_4px_0_#1A1A2E] p-7 w-full max-w-[440px]">
                                    <h3 className="font-extrabold text-[#1A1A2E] text-lg mb-4">❌ Từ chối đơn sản xuất</h3>
                                    <textarea
                                        value={rejectReason}
                                        onChange={e => setRejectReason(e.target.value)}
                                        placeholder="Nhập lý do từ chối..."
                                        rows={3}
                                        className="nb-input w-full resize-y"
                                    />
                                    <div className="flex gap-3 mt-4">
                                        <button onClick={() => { setShowReject(false); setRejectReason(""); }} className="nb-btn nb-btn-outline flex-1">Hủy</button>
                                        <button onClick={handleReject} disabled={actionLoading || !rejectReason.trim()} className="nb-btn nb-btn-red flex-1">
                                            {actionLoading ? "Đang xử lý..." : "Xác nhận từ chối"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Deliver Modal */}
                        {showDeliver && detail && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1100] p-4">
                                <div className="bg-white rounded-md border-2 border-[#1A1A2E] shadow-[4px_4px_0_#1A1A2E] p-7 w-full max-w-[440px]">
                                    <h3 className="font-extrabold text-[#1A1A2E] text-lg mb-4">📦 Giao hàng</h3>

                                    {deliveryStatus && (
                                        <div className="mb-4">
                                            <div className="flex justify-between text-sm text-[#6B7280] mb-2">
                                                <span>Đã giao: {deliveryStatus.totalDelivered}/{deliveryStatus.totalQuantity}</span>
                                                <span>Còn lại: <strong className="text-[#1A1A2E]">{deliveryStatus.totalQuantity - deliveryStatus.totalDelivered}</strong></span>
                                            </div>
                                            <div className="h-2 rounded-full bg-[#E5E7EB] border border-[#1A1A2E] overflow-hidden">
                                                <div className="h-full rounded-full bg-[#6938EF] transition-all duration-500"
                                                    style={{ width: `${(deliveryStatus.totalDelivered / deliveryStatus.totalQuantity) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-bold text-[#1A1A2E] mb-1">Số lượng giao lần này</label>
                                            <input type="number" min={1}
                                                max={deliveryStatus ? deliveryStatus.totalQuantity - deliveryStatus.totalDelivered : undefined}
                                                value={deliverQty}
                                                onChange={e => setDeliverQty(Number(e.target.value))}
                                                className="nb-input w-full text-lg font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-[#1A1A2E] mb-1">Ghi chú (tùy chọn)</label>
                                            <textarea value={deliverNote}
                                                onChange={e => setDeliverNote(e.target.value)}
                                                placeholder="VD: Đợt 1 gồm áo sơ mi size S-M..."
                                                rows={2}
                                                className="nb-input w-full resize-y"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 mt-4">
                                        <button onClick={() => { setShowDeliver(false); setDeliverQty(0); setDeliverNote(""); }} className="nb-btn nb-btn-outline flex-1">Hủy</button>
                                        <button onClick={handleDeliver} disabled={actionLoading || deliverQty <= 0} className="nb-btn nb-btn-purple flex-1">
                                            {actionLoading ? "Đang gửi..." : "📦 Xác nhận giao"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}

function InfoBox({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-[#F8FAFC] border-2 border-[#E5E7EB] rounded-lg p-3">
            <p className="text-xs font-bold text-[#9CA3AF] uppercase mb-1">{label}</p>
            <p className="text-sm font-bold text-[#1A1A2E]">{value}</p>
        </div>
    );
}
