import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, CreditCard, Clock, CheckCircle, XCircle, ChevronDown, Star, Package, Calendar, ChevronRight, User } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "../../../contexts/ToastContext";
import {
    payOrder,
    getParentPaymentHistory,
    type ParentPaymentDto,
    type StatusCountDto,
} from "../../../lib/api/payments";
import { getOrderDetail, type OrderDetailDto } from "../../../lib/api/orders";

function fmt(n: number) { return n.toLocaleString("vi-VN") + " ₫"; }
function fmtDate(iso: string) {
    return new Date(iso).toLocaleString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

function statusBadge(status: string) {
    switch (status.toLowerCase()) {
        case "pending": return { label: "Chờ thanh toán", bg: "bg-[#FEF3C7]", text: "text-[#92400E]", border: "border-[#F5E642]", icon: <Clock className="w-3.5 h-3.5" /> };
        case "paid": case "completed": case "success": return { label: "Đã thanh toán", bg: "bg-[#D1FAE5]", text: "text-[#065F46]", border: "border-[#C8E44D]", icon: <CheckCircle className="w-3.5 h-3.5" /> };
        case "cancelled": case "failed": return { label: "Đã hủy", bg: "bg-[#FEE2E2]", text: "text-[#991B1B]", border: "border-[#FCA5A5]", icon: <XCircle className="w-3.5 h-3.5" /> };
        default: return { label: status, bg: "bg-[#F3F4F6]", text: "text-[#6B7280]", border: "border-[#D1D5DB]", icon: null };
    }
}

/* ── Order Status Stepper — NB Style ── */
const ORDER_STEPS = [
    { key: "Paid", label: "Đã thanh toán", icon: "💳" },
    { key: "Confirmed", label: "Đã xác nhận", icon: "✅" },
    { key: "Processed", label: "Đang xử lý", icon: "📦" },
    { key: "Shipped", label: "Đang giao", icon: "🚚" },
    { key: "Delivered", label: "Đã nhận", icon: "🎉" },
];

const STATUS_ORDER: Record<string, number> = {
    Pending: 0, Paid: 1, Confirmed: 2, Processed: 3, Shipped: 4, Delivered: 5,
    Cancelled: -1, Refunded: -2,
};

function OrderStatusStepper({ orderStatus }: { orderStatus: string }) {
    const currentIdx = STATUS_ORDER[orderStatus] ?? 0;
    const isCancelled = orderStatus === "Cancelled" || orderStatus === "Refunded";

    if (isCancelled) {
        return (
            <div className="mt-4 nb-alert nb-alert-error">
                <XCircle className="w-5 h-5 flex-shrink-0" />
                <span className="font-bold text-sm">
                    {orderStatus === "Cancelled" ? "Đơn hàng đã bị hủy" : "Đơn hàng đã hoàn tiền"}
                </span>
            </div>
        );
    }

    return (
        <div className="mt-4 px-2">
            <div className="flex items-center justify-between relative">
                {/* Background line */}
                <div className="absolute top-[18px] h-[3px] bg-[#E5E7EB] rounded-full" style={{ left: `${100 / (ORDER_STEPS.length * 2)}%`, right: `${100 / (ORDER_STEPS.length * 2)}%` }} />
                {/* Progress line */}
                {currentIdx >= 2 && (
                    <div
                        className="absolute top-[18px] h-[3px] bg-[#C8E44D] rounded-full transition-all duration-500"
                        style={{
                            left: `${100 / (ORDER_STEPS.length * 2)}%`,
                            width: `${((Math.min(currentIdx, ORDER_STEPS.length) - 1) / (ORDER_STEPS.length - 1)) * (100 - 100 / ORDER_STEPS.length)}%`,
                        }}
                    />
                )}

                {ORDER_STEPS.map((step, idx) => {
                    const stepNum = idx + 1;
                    const isCompleted = currentIdx > stepNum;
                    const isCurrent = currentIdx === stepNum;

                    return (
                        <div key={step.key} className="flex flex-col items-center relative z-10" style={{ flex: 1 }}>
                            <div
                                className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-300 border-2 border-[#1A1A2E] ${isCompleted
                                    ? "bg-[#C8E44D] shadow-[2px_2px_0_#1A1A2E]"
                                    : isCurrent
                                        ? "bg-[#B8A9E8] shadow-[2px_2px_0_#1A1A2E] animate-pulse"
                                        : "bg-[#F3F4F6] border-[#D1D5DB]"
                                    }`}
                            >
                                {isCompleted ? (
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                                ) : (
                                    <span className="text-xs">{step.icon}</span>
                                )}
                            </div>
                            <span className={`mt-2 text-[11px] font-bold text-center leading-tight ${isCompleted ? "text-[#065F46]" : isCurrent ? "text-[#1A1A2E]" : "text-[#9CA3AF]"
                                }`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ── Order Card Component ── */
type OrderCardProps = {
    payment: ParentPaymentDto;
    isExpanded: boolean;
    showStepper: boolean;
    onExpandToggle: () => void;
    onNavigateDetail: () => void;
    onNavigateFeedback: () => void;
    onPay: () => void;
    payingId: string | null;
    setPayingId: (id: string | null) => void;
};

function OrderCard({
    payment: p,
    isExpanded,
    showStepper,
    onExpandToggle,
    onNavigateDetail,
    onNavigateFeedback,
    onPay,
    payingId,
    setPayingId,
}: OrderCardProps) {
    const badge = statusBadge(p.status);
    const isPending = p.status.toLowerCase() === "pending";
    const [orderDetail, setOrderDetail] = useState<OrderDetailDto | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            setLoadingDetail(true);
            try {
                const data = await getOrderDetail(p.orderId);
                setOrderDetail(data);
            } catch (err) {
                console.error("Failed to fetch order detail:", err);
            } finally {
                setLoadingDetail(false);
            }
        };
        fetchDetail();
    }, [p.orderId]);

    const firstItem = orderDetail?.items[0];

    return (
        <div className={`nb-card overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-2 ring-[#B8A9E8]' : ''}`}>
            {/* Header: Campaign + Status */}
            <div className="px-5 py-3 bg-[#1A1A2E]/5 flex items-center justify-between border-b-2 border-[#1A1A2E]/10">
                <div className="flex items-center gap-2">
                    <div className="bg-[#1A1A2E] text-white p-1 rounded">
                        <ShoppingBag className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-[10px] uppercase tracking-wider text-[#1A1A2E]">
                        {orderDetail?.campaignName || "---"}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border-2 ${badge.bg} ${badge.text} ${badge.border} shadow-[2px_2px_0_#1A1A2E]`}>
                        {badge.icon}
                        {STATUS_LABELS[p.orderStatus] || p.orderStatus}
                    </span>
                    {showStepper && (
                        <button onClick={onExpandToggle} className="p-1 hover:bg-white rounded transition-colors">
                            <ChevronDown className={`w-4 h-4 text-[#1A1A2E] transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="p-5">
                <div className="flex flex-col lg:flex-row gap-6 justify-between items-start">
                    {/* Left: Product & Child (Tightly Grouped) */}
                    <div className="flex flex-row gap-5 items-start">
                        {/* Product Image + Child Avatar Badge */}
                        <div className="relative flex-shrink-0">
                            <div className="w-28 h-28 rounded-2xl border-2 border-[#1A1A2E] shadow-[4px_4px_0_#1A1A2E] overflow-hidden bg-white flex items-center justify-center group pointer-events-none">
                                {loadingDetail ? (
                                    <div className="w-5 h-5 border-2 border-[#B8A9E8] border-t-transparent rounded-full animate-spin" />
                                ) : firstItem?.outfitImage ? (
                                    <img src={firstItem.outfitImage} alt={firstItem.outfitName} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                ) : (
                                    <Package className="w-10 h-10 text-[#B8A9E8]" />
                                )}
                            </div>
                            {/* Child Avatar Overlap */}
                            {orderDetail?.childAvatar && (
                                <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full border-2 border-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E] overflow-hidden bg-white z-10">
                                    <Avatar className="w-full h-full rounded-none">
                                        <AvatarImage src={orderDetail.childAvatar} />
                                        <AvatarFallback className="text-[10px] font-black bg-[#E9D5FF]">
                                            {orderDetail.childName.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 text-[#9CA3AF] font-bold text-[10px] uppercase tracking-wider">
                                <Calendar className="w-3.5 h-3.5" />
                                {fmtDate(p.timestamp)}
                                {orderDetail?.childName && (
                                    <span className="text-[#1A1A2E] font-black ml-1">• {orderDetail.childName}</span>
                                )}
                            </div>

                            <h3 className="font-extrabold text-[#1A1A2E] text-lg leading-tight">
                                {firstItem?.outfitName || "Mã đơn: #" + p.orderId.substring(0, 8)}
                            </h3>
                            
                            <div className="flex items-center gap-4 text-[12px] font-bold text-[#6B7280]">
                                <span>Size: <span className="text-[#1A1A2E]">{firstItem?.size || "-"}</span></span>
                                <span className="text-[#D1D5DB]">|</span>
                                <span>Số lượng: <span className="text-[#1A1A2E]">{firstItem?.quantity || "-"}</span></span>
                                {orderDetail && orderDetail.items.length > 1 && (
                                    <>
                                        <span className="text-[#D1D5DB]">|</span>
                                        <span className="text-[#B8A9E8]">+{orderDetail.items.length - 1} sp khác</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Informative Summary Box */}
                    <div className="flex flex-col justify-between p-4 bg-[#E9D5FF] border-2 border-[#1A1A2E] rounded-[20px] shadow-[4px_4px_0_#1A1A2E] min-w-[210px]">
                        <div className="space-y-4">
                            <div className="flex justify-between items-start border-b border-[#1A1A2E]/10 pb-3">
                                <div>
                                    <p className="text-[9px] text-[#1A1A2E] font-black uppercase tracking-widest mb-1.5 opacity-60">Thanh toán</p>
                                    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border-2 font-black text-[9px] uppercase ${badge.bg === 'bg-white' ? 'bg-white' : badge.bg} ${badge.text} border-[#1A1A2E]`}>
                                        {badge.label}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] text-[#1A1A2E] font-black uppercase tracking-widest mb-1.5 opacity-60">Sản phẩm</p>
                                    <span className="font-black text-[#1A1A2E] text-xs">x{orderDetail?.items.length || 0}</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[9px] text-[#1A1A2E] font-black uppercase tracking-widest mb-1 opacity-60">Tổng tiền</p>
                                    <p className="font-black text-xl text-[#1A1A2E] leading-none">{fmt(p.amount)}</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => onNavigateDetail()}
                                        className="text-[10px] font-black text-[#1A1A2E] flex items-center justify-end gap-1 hover:text-[#B8A9E8] transition-colors uppercase"
                                    >
                                        Chi tiết <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-[#1A1A2E]/10">
                            {p.orderStatus === "Delivered" && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onNavigateFeedback(); }}
                                    className="nb-btn nb-btn-purple w-full text-[10px] py-2 font-black shadow-[3px_3px_0_#1A1A2E] bg-white text-[#1A1A2E]"
                                >
                                    ĐÁNH GIÁ NGAY
                                </button>
                            )}

                            {isPending && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onPay(); }}
                                    disabled={payingId === p.orderId}
                                    className="nb-btn nb-btn-purple w-full text-[10px] py-2 font-black shadow-[3px_3px_0_#1A1A2E]"
                                >
                                    THANH TOÁN NGAY
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stepper (Collapsible) */}
            {isExpanded && showStepper && (
                <div className="px-5 pb-6 border-t-2 border-[#1A1A2E]/5 bg-[#F9FAFB]/50 animate-in slide-in-from-top duration-300">
                    <div className="flex items-center gap-2 mt-4 mb-2">
                        <div className="w-1.5 h-4 bg-[#B8A9E8] rounded-full" />
                        <p className="font-bold text-[#1A1A2E] text-xs">Lộ trình đơn hàng</p>
                    </div>
                    <OrderStatusStepper orderStatus={p.orderStatus} />
                </div>
            )}
        </div>
    );
}

/* ── Status Tabs ── */
const ALL_STATUSES = ["Paid", "Confirmed", "Processed", "Shipped", "Delivered", "Cancelled"];

const STATUS_LABELS: Record<string, string> = {
    Paid: "Đã thanh toán",
    Confirmed: "Đã xác nhận",
    Processed: "Đang xử lý",
    Shipped: "Đang giao",
    Delivered: "Đã nhận",
    Cancelled: "Đã hủy",
};

function StatusTabs({
    payments,
    total,
    statusCounts,
    selectedStatus,
    onStatusChange
}: {
    payments: ParentPaymentDto[],
    total: number,
    statusCounts: StatusCountDto[],
    selectedStatus: string | null,
    onStatusChange: (status: string | null) => void
}) {
    const statusCountMap = useMemo(() => {
        const map: Record<string, number> = {};
        statusCounts.forEach(sc => {
            map[sc.status] = sc.count;
        });
        return map;
    }, [statusCounts]);

    return (
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 pt-4">
            <button
                onClick={() => onStatusChange(null)}
                className={`relative px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${selectedStatus === null
                    ? "bg-[#B8A9E8] text-white border-2 border-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E]"
                    : "bg-[#F3F4F6] text-[#6B7280] border-2 border-[#D1D5DB]"
                    }`}
            >
                Tất cả
                {total > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#C8E44D] text-[#1A1A2E] text-xs font-bold px-2 py-0.5 rounded-full border-2 border-[#1A1A2E] shadow-[1px_1px_0_#1A1A2E] min-w-[24px] text-center">
                        {total}
                    </span>
                )}
            </button>
            {ALL_STATUSES.map(status => {
                const count = statusCountMap[status] || 0;

                return (
                    <button
                        key={status}
                        onClick={() => onStatusChange(status)}
                        className={`relative px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${selectedStatus === status
                            ? "bg-[#B8A9E8] text-white border-2 border-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E]"
                            : "bg-[#F3F4F6] text-[#6B7280] border-2 border-[#D1D5DB]"
                            }`}
                    >
                        {STATUS_LABELS[status]}
                        {count > 0 && (
                            <span className="absolute -top-2 -right-2 bg-[#C8E44D] text-[#1A1A2E] text-xs font-bold px-2 py-0.5 rounded-full border-2 border-[#1A1A2E] shadow-[1px_1px_0_#1A1A2E] min-w-[24px] text-center">
                                {count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

/* ── Main Component ── */
export const OrdersTab = (): JSX.Element => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [payments, setPayments] = useState<ParentPaymentDto[]>([]);
    const [statusCounts, setStatusCounts] = useState<StatusCountDto[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const pageSize = 2;
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [payingId, setPayingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getParentPaymentHistory(page, pageSize);
            setPayments(res.items || []);
            setTotal(res.total || 0);
            setStatusCounts(res.statusCounts || []);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    }, [page]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        setPage(1);
    }, [selectedStatus]);

    // Filter payments by selected order status
    const filteredPayments = useMemo(() => {
        if (!selectedStatus) return payments;
        return payments.filter(p => p.orderStatus === selectedStatus);
    }, [payments, selectedStatus]);

    // Get correct total for pagination
    const getFilteredTotal = () => {
        if (!selectedStatus) return total;
        const count = statusCounts.find(sc => sc.status === selectedStatus);
        return count ? count.count : 0;
    };

    const filteredTotal = getFilteredTotal();
    const totalPages = Math.ceil(filteredTotal / pageSize);

    const handlePay = async (orderId: string) => {
        if (!confirm("Xác nhận thanh toán đơn hàng này?")) return;
        setPayingId(orderId);
        try {
            await payOrder(orderId);
            showToast({
                title: "✅ Thành công",
                message: "Thanh toán thành công!",
                variant: "success",
                durationMs: 3000,
            });
            await fetchData();
        } catch (err: any) {
            showToast({
                title: "❌ Lỗi",
                message: err?.message || "Thanh toán thất bại",
                variant: "error",
            });
        } finally { setPayingId(null); }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-[#E5E7EB] border-t-[#B8A9E8] rounded-full animate-spin" />
            </div>
        );
    }

    if (payments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-16 h-16 bg-[#EDE9FE] rounded-xl flex items-center justify-center border-2 border-[#1A1A2E] shadow-[3px_3px_0_#1A1A2E]">
                    <ShoppingBag className="w-8 h-8 text-[#1A1A2E]" />
                </div>
                <p className="font-medium text-[#6B7280] text-sm text-center">
                    Bạn chưa có đơn hàng nào.
                </p>
            </div>
        );
    }

    return (
        <div>
            {/* Status Filter Tabs */}
            <StatusTabs payments={payments} total={total} statusCounts={statusCounts} selectedStatus={selectedStatus} onStatusChange={setSelectedStatus} />

            {/* Filtered Orders List */}
            <div className="space-y-4">
                {filteredPayments.length === 0 ? (
                    <div className="text-center py-8 text-[#9CA3AF] text-sm">
                        Không có đơn hàng nào ở trạng thái này
                    </div>
                ) : (
                    filteredPayments.map((p) => {
                        const badge = statusBadge(p.status);
                        const isPending = p.status.toLowerCase() === "pending";
                        const isExpanded = expandedId === p.paymentId;
                        const showStepper = p.orderStatus && p.orderStatus !== "Pending";

                        return (
                            <OrderCard
                                key={p.paymentId}
                                payment={p}
                                isExpanded={isExpanded}
                                showStepper={showStepper}
                                onExpandToggle={() => showStepper && setExpandedId(isExpanded ? null : p.paymentId)}
                                onNavigateDetail={() => navigate(`/parentprofile/orders/${p.orderId}`)}
                                onNavigateFeedback={() => navigate(`/parentprofile/feedback?orderId=${p.orderId}`)}
                                onPay={() => handlePay(p.orderId)}
                                payingId={payingId}
                                setPayingId={setPayingId}
                            />
                        );
                    })
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="nb-btn nb-btn-outline text-sm disabled:opacity-50">← Trước</button>
                    <span className="flex items-center text-sm text-[#6B7280] px-2 font-bold">{page}/{totalPages}</span>
                    <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="nb-btn nb-btn-outline text-sm disabled:opacity-50">Sau →</button>
                </div>
            )}
        </div>
    );
};
