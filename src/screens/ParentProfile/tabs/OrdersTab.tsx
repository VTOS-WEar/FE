import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, CreditCard, Clock, CheckCircle, XCircle, ChevronDown, Star } from "lucide-react";
import {
    payOrder,
    getParentPaymentHistory,
    type ParentPaymentDto,
} from "../../../lib/api/payments";

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
                                className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-300 border-2 border-[#1A1A2E] ${
                                    isCompleted
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
                            <span className={`mt-2 text-[11px] font-bold text-center leading-tight ${
                                isCompleted ? "text-[#065F46]" : isCurrent ? "text-[#1A1A2E]" : "text-[#9CA3AF]"
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

/* ── Status Tabs ── */
const ALL_STATUSES = ["Pending", "Paid", "Confirmed", "Processed", "Shipped", "Delivered", "Cancelled"];

function StatusTabs({ 
    payments, 
    selectedStatus, 
    onStatusChange 
}: { 
    payments: ParentPaymentDto[], 
    selectedStatus: string | null,
    onStatusChange: (status: string | null) => void 
}) {
    const statusCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        ALL_STATUSES.forEach(s => counts[s] = 0);
        payments.forEach(p => {
            const status = p.status || "Unknown";
            counts[status] = (counts[status] || 0) + 1;
        });
        return counts;
    }, [payments]);

    return (
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
            <button
                onClick={() => onStatusChange(null)}
                className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${
                    selectedStatus === null
                        ? "bg-[#B8A9E8] text-white border-2 border-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E]"
                        : "bg-[#F3F4F6] text-[#6B7280] border-2 border-[#D1D5DB]"
                }`}
            >
                Tất cả ({payments.length})
            </button>
            {ALL_STATUSES.map(status => {
                const count = statusCounts[status] || 0;
                if (count === 0) return null;

                return (
                    <button
                        key={status}
                        onClick={() => onStatusChange(status)}
                        className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${
                            selectedStatus === status
                                ? "bg-[#B8A9E8] text-white border-2 border-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E]"
                                : "bg-[#F3F4F6] text-[#6B7280] border-2 border-[#D1D5DB]"
                        }`}
                    >
                        {status} ({count})
                    </button>
                );
            })}
        </div>
    );
}

/* ── Main Component ── */
export const OrdersTab = (): JSX.Element => {
    const navigate = useNavigate();
    const [payments, setPayments] = useState<ParentPaymentDto[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [payingId, setPayingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getParentPaymentHistory(page, 10);
            setPayments(res.items || []);
            setTotal(res.total || 0);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    }, [page]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Filter payments by selected status
    const filteredPayments = useMemo(() => {
        if (!selectedStatus) return payments;
        return payments.filter(p => p.status === selectedStatus);
    }, [payments, selectedStatus]);

    const handlePay = async (orderId: string) => {
        if (!confirm("Xác nhận thanh toán đơn hàng này?")) return;
        setPayingId(orderId);
        try {
            await payOrder(orderId);
            alert("Thanh toán thành công!");
            await fetchData();
        } catch (err: any) {
            alert(err?.message || "Thanh toán thất bại");
        } finally { setPayingId(null); }
    };

    const totalPages = Math.ceil(total / 10);

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
            <StatusTabs payments={payments} selectedStatus={selectedStatus} onStatusChange={setSelectedStatus} />

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
                            <div key={p.paymentId} className="nb-card overflow-hidden">
                                {/* Top row */}
                                <div
                                    className={`p-5 flex items-center justify-between ${showStepper ? "cursor-pointer" : ""}`}
                                    onClick={() => showStepper && setExpandedId(isExpanded ? null : p.paymentId)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-[#EDE9FE] rounded-xl flex items-center justify-center border-2 border-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E]">
                                            <CreditCard className="w-6 h-6 text-[#1A1A2E]" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-[#1A1A2E] text-sm">
                                                Đơn #{p.orderId.slice(0, 8)}
                                            </p>
                                            <p className="font-medium text-[#9CA3AF] text-xs mt-0.5">
                                                {fmtDate(p.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <p className="font-extrabold text-[#1A1A2E] text-base">
                                            {fmt(p.amount)}
                                        </p>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border-2 ${badge.bg} ${badge.text} ${badge.border}`}>
                                            {badge.icon}
                                            {badge.label}
                                        </span>
                                        {p.orderStatus === "Delivered" && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); navigate(`/parentprofile/feedback?orderId=${p.orderId}`); }}
                                                className="nb-btn nb-btn-purple text-sm flex items-center gap-1"
                                            >
                                                <Star className="w-3.5 h-3.5" />
                                                Đánh giá
                                            </button>
                                        )}
                                        {isPending && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handlePay(p.orderId); }}
                                                disabled={payingId === p.orderId}
                                                className="nb-btn nb-btn-purple text-sm disabled:opacity-50"
                                            >
                                                {payingId === p.orderId ? "Đang xử lý..." : "Thanh toán"}
                                            </button>
                                        )}
                                        {showStepper && (
                                            <ChevronDown className={`w-5 h-5 text-[#6B7280] transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                                        )}
                                    </div>
                                </div>

                                {/* Expanded stepper */}
                                {isExpanded && showStepper && (
                                    <div className="px-5 pb-5 border-t-2 border-[#1A1A2E]/10">
                                        <p className="font-bold text-[#6B7280] text-xs mt-3 mb-1">
                                            📍 Trạng thái đơn hàng
                                        </p>
                                        <OrderStatusStepper orderStatus={p.orderStatus} />
                                    </div>
                                )}
                            </div>
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
