import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, CreditCard, Clock, CheckCircle, XCircle, ChevronDown, Star, Package, Calendar, ChevronRight, User } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "../../../contexts/ToastContext";
import { cn } from "@/lib/utils";
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
    if (!status) return { label: "---", bg: "bg-gray-100", text: "text-gray-400", border: "border-gray-200", icon: null };
    const s = status.toLowerCase();
    switch (s) {
        case "paid":
            return { label: "Đã thanh toán", bg: "bg-green-50", text: "text-green-600", border: "border-green-200", icon: <span className="text-[10px]">💳</span> };
        case "confirmed":
            return { label: "Đã xác nhận", bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200", icon: <span className="text-[10px]">✅</span> };
        case "processed":
            return { label: "Đang xử lý", bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-200", icon: <span className="text-[10px]">📦</span> };
        case "shipped":
            return { label: "Đang giao", bg: "bg-sky-50", text: "text-sky-600", border: "border-sky-200", icon: <span className="text-[10px]">🚚</span> };
        case "delivered":
            return { label: "Đã nhận", bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", icon: <span className="text-[10px]">🎉</span> };

        case "pending":
            return { label: "Chờ thanh toán", bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200", icon: <Clock className="w-3 h-3" /> };
        case "cancelled": case "failed": case "refunded":
            return { label: s === "refunded" ? "Đã hoàn tiền" : "Đã hủy", bg: "bg-red-50", text: "text-red-600", border: "border-red-200", icon: <XCircle className="w-3 h-3" /> };
        default:
            return { label: status, bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200", icon: null };
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
    const navigate = useNavigate();
    const badge = statusBadge(p.orderStatus);
    const isPending = p.paymentStatus === "Pending" || p.paymentStatus === "Unpaid";
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
        <div
            onClick={onExpandToggle}
            className={`nb-card !rounded-[12px] overflow-hidden transition-all duration-300 shadow-[3px_3px_0_#1A1A2E] hover:shadow-[6px_6px_0_#1A1A2E] hover:-translate-y-1 cursor-pointer select-none ${isExpanded ? 'ring-2 ring-[#B8A9E8]' : ''}`}
        >
            <div className="p-5">
                <div className="flex flex-col lg:flex-row gap-6 justify-between items-stretch">
                    {/* Left: Identity & Product */}
                    <div className="flex flex-row gap-5 items-start flex-1 min-w-0">
                        {/* Image Section */}
                        <div className="relative flex-shrink-0">
                            <div className="w-24 h-24 rounded-2xl border-2 border-[#1A1A2E] shadow-[3px_3px_0_#1A1A2E] overflow-hidden bg-white flex items-center justify-center group pointer-events-none">
                                {loadingDetail ? (
                                    <div className="w-5 h-5 border-2 border-[#B8A9E8] border-t-transparent rounded-full animate-spin" />
                                ) : firstItem?.outfitImage ? (
                                    <img src={firstItem.outfitImage} alt={firstItem.outfitName} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                ) : (
                                    <Package className="w-8 h-8 text-[#B8A9E8]" />
                                )}
                            </div>

                            {/* Items count badge on image */}
                            {orderDetail && orderDetail.items.length > 1 && (
                                <div className="absolute -top-2 -left-2 bg-[#C8E44D] text-[#1A1A2E] text-[9px] font-black px-1.5 py-0.5 rounded-md border-2 border-[#1A1A2E] shadow-[1.5px_1.5px_0_#1A1A2E] z-20">
                                    +{orderDetail.items.length - 1}
                                </div>
                            )}

                            {orderDetail?.childAvatar && (
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-2 border-[#1A1A2E] shadow-[1.5px_1.5px_0_#1A1A2E] overflow-hidden bg-white z-10">
                                    <Avatar className="w-full h-full rounded-none">
                                        <AvatarImage src={orderDetail.childAvatar} />
                                        <AvatarFallback className="text-[10px] font-black bg-[#E9D5FF]">
                                            {orderDetail.childName.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                            )}
                        </div>

                        {/* Details Section */}
                        <div className="flex-1 space-y-1.5 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border-2 font-black text-[9px] uppercase shadow-[2px_2px_0_#1A1A2E] ${badge.bg} ${badge.text} ${badge.border}`}>
                                    {badge.icon}
                                    {badge.label}
                                </span>
                                <span className="text-[9px] font-black text-[#9CA3AF] uppercase tracking-wider flex items-center gap-1">
                                    <ShoppingBag className="w-3 h-3" />
                                    {orderDetail?.campaignName || "---"}
                                </span>
                            </div>

                            <div className="space-y-0.5">
                                <h3
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (firstItem?.outfitId) {
                                            navigate(`/outfits/${firstItem.outfitId}`);
                                        }
                                    }}
                                    className="font-extrabold text-[#1A1A2E] text-lg leading-tight truncate hover:text-[#B8A9E8] transition-colors cursor-pointer decoration-[#B8A9E8] hover:underline underline-offset-4"
                                >
                                    {firstItem?.outfitName || "Mã đơn: #" + p.orderId.substring(0, 8)}
                                </h3>


                            </div>
                            <div>
                                {orderDetail?.childName && (
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#6B7280]">
                                        <User className="w-3 h-3 text-[#1A1A2E]" />
                                        <span> <span className="text-[#1A1A2E] font-gray">{orderDetail.childName}</span></span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold text-[#9CA3AF]">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {fmtDate(p.timestamp)}
                                </span>
                                <span className="text-[#D1D5DB]">|</span>
                                <span>Size: <span className="text-[#6B7280] font-extrabold">{firstItem?.size || "-"}</span></span>
                                <span className="text-[#D1D5DB]">|</span>
                                <span>SL: <span className="text-[#6B7280] font-extrabold">{firstItem?.quantity || "-"}</span></span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Modern Summary Box */}
                    <div className="flex flex-col justify-between p-4 bg-[#F9F7FF] border-2 border-[#1A1A2E] rounded-[15px] shadow-[2px_2px_0_#1A1A2E] min-w-[220px]">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-[8px] text-[#9CA3AF] font-black uppercase tracking-widest mb-1">Tổng thanh toán</p>
                                <p className="font-black text-xl text-[#1A1A2E] leading-none mb-1">{fmt(p.amount)}</p>
                                {orderDetail && (
                                    <p className="text-[10px] font-bold text-[#6B7280]">
                                        {orderDetail.items.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm
                                    </p>
                                )}
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] text-[#9CA3AF] font-black uppercase tracking-widest mb-1">Thanh toán</p>
                                <div className={`text-[10px] font-black ${p.paymentStatus === 'Paid' || p.paymentStatus === 'Completed' ? 'text-green-600' : p.paymentStatus === 'Cancelled' ? 'text-red-500' : 'text-orange-500'}`}>
                                    {p.paymentStatus === 'Paid' || p.paymentStatus === 'Completed' ? 'Đã xong' : p.paymentStatus === 'Pending' ? 'Chờ xử lý' : 'Đã hủy'}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); onNavigateDetail(); }}
                                className="flex-1 py-1.5 bg-white hover:bg-gray-50 text-[9px] font-black text-[#1A1A2E] uppercase tracking-widest rounded-lg border-2 border-[#1A1A2E] shadow-[1px_1px_0_#1A1A2E] transition-all active:translate-y-[1px] active:shadow-none"
                            >
                                Chi tiết
                            </button>
                            {p.orderStatus === "Delivered" && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onNavigateFeedback(); }}
                                    className="flex-1 py-1.5 bg-[#1A1A2E] text-white text-[9px] font-black uppercase tracking-widest rounded-lg border-2 border-[#1A1A2E] shadow-[1px_1px_0_#B8A9E8] hover:scale-[1.02] transition-all"
                                >
                                    Đánh giá
                                </button>
                            )}
                            {isPending && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onPay(); }}
                                    disabled={payingId === p.orderId}
                                    className="flex-1 nb-btn nb-btn-purple !py-1.5 !text-[9px] !rounded-lg !shadow-[1px_1px_0_#1A1A2E] hover:!shadow-[2px_2px_0_#1A1A2E] !font-black uppercase tracking-widest"
                                >
                                    Thanh toán
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
    const [pageSize] = useState(2); // Increased for better UX
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [payingId, setPayingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getParentPaymentHistory(
                page,
                pageSize,
                startDate || undefined,
                endDate || undefined,
                selectedStatus || undefined
            );
            setPayments(res.items || []);
            setTotal(res.total || 0);
            setStatusCounts(res.statusCounts || []);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    }, [page, pageSize, startDate, endDate, selectedStatus]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Handle filter changes: Reset to page 1
    const handleStatusChange = (status: string | null) => {
        setSelectedStatus(status);
        setPage(1);
    };

    const handleDateChange = (start: string, end: string) => {
        setStartDate(start);
        setEndDate(end);
        setPage(1);
    };

    const totalPages = Math.ceil(total / pageSize);

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

    if (loading && payments.length === 0) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-[#E5E7EB] border-t-[#B8A9E8] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Status Tabs */}
            <StatusTabs payments={payments} total={total} statusCounts={statusCounts} selectedStatus={selectedStatus} onStatusChange={handleStatusChange} />

            {/* Date Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-white/50 p-3 rounded-2xl border-2 border-[#1A1A2E]/5">
                <div className="flex items-center gap-2">
                    <div className={cn("w-2.5 h-2.5 rounded-full transition-all duration-500", loading ? "bg-[#B8A9E8] animate-ping" : "bg-green-400")} />
                    <span className="text-[10px] font-black text-[#1A1A2E] uppercase tracking-wider">
                        {loading ? "Đang cập nhật danh sách..." : "Lọc theo thời gian đặt đồ"}
                    </span>
                </div>

                <div className="flex items-center gap-2 bg-white border-2 border-[#1A1A2E] rounded-xl px-4 py-1.5 shadow-[3px_3px_0_#1A1A2E] group transition-all hover:translate-y-[-1px]">
                    <Calendar className={cn("w-3.5 h-3.5 transition-colors", loading ? "text-[#B8A9E8]" : "text-[#6B7280]")} />
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => handleDateChange(e.target.value, endDate)}
                        className="text-[11px] font-bold outline-none bg-transparent cursor-pointer"
                    />
                    <span className="text-[#1A1A2E]/10 font-black">→</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => handleDateChange(startDate, e.target.value)}
                        className="text-[11px] font-bold outline-none bg-transparent cursor-pointer"
                    />
                    {(startDate || endDate) && (
                        <button
                            onClick={() => handleDateChange("", "")}
                            className="ml-2 text-[9px] bg-[#FEE2E2] text-[#991B1B] hover:bg-[#FCA5A5] px-2 py-0.5 rounded-lg border-2 border-[#1A1A2E] font-black transition-colors"
                        >
                            XÓA
                        </button>
                    )}
                </div>
            </div>

            {/* Orders List Content */}
            <div className={cn("space-y-4 transition-all duration-300", loading ? "opacity-40 pointer-events-none scale-[0.99] grayscale-[0.5]" : "opacity-100")}>
                {payments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                        <div className="w-16 h-16 bg-[#F3F4F6] rounded-xl flex items-center justify-center border-2 border-[#1A1A2E] shadow-[3px_3px_0_#1A1A2E]">
                            <ShoppingBag className="w-8 h-8 text-[#9CA3AF]" />
                        </div>
                        <p className="font-bold text-[#6B7280] text-sm text-center">
                            {(startDate || endDate || selectedStatus)
                                ? "Không tìm thấy đơn hàng nào khớp với bộ lọc."
                                : "Bạn chưa có đơn hàng nào."}
                        </p>
                    </div>
                ) : (
                    payments.map((p) => {
                        const badge = statusBadge(p.paymentStatus);
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
