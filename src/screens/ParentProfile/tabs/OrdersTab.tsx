import { useState, useEffect, useCallback } from "react";
import { ShoppingBag, CreditCard, Clock, CheckCircle, XCircle, ChevronDown } from "lucide-react";
import { Button } from "../../../components/ui/button";
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
        case "pending": return { label: "Chờ thanh toán", bg: "bg-[#FEF3C7]", text: "text-[#92400E]", icon: <Clock className="w-3.5 h-3.5" /> };
        case "paid": case "completed": case "success": return { label: "Đã thanh toán", bg: "bg-[#D1FAE5]", text: "text-[#065F46]", icon: <CheckCircle className="w-3.5 h-3.5" /> };
        case "cancelled": case "failed": return { label: "Đã hủy", bg: "bg-[#FEE2E2]", text: "text-[#991B1B]", icon: <XCircle className="w-3.5 h-3.5" /> };
        default: return { label: status, bg: "bg-[#F3F4F6]", text: "text-[#6B7280]", icon: null };
    }
}

/* ── Order Status Stepper ── */
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
        const cancelledAt = STATUS_ORDER[orderStatus] === -1 ? "Cancelled" : "Refunded";
        return (
            <div className="mt-4 px-4 py-3 bg-red-50 rounded-xl border border-red-100">
                <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="[font-family:'Montserrat',Helvetica] font-semibold text-red-700 text-sm">
                        {cancelledAt === "Cancelled" ? "Đơn hàng đã bị hủy" : "Đơn hàng đã hoàn tiền"}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-4 px-2">
            <div className="flex items-center justify-between relative">
                {/* Background line: spans from center of first node to center of last node */}
                <div className="absolute top-[18px] h-[3px] bg-gray-200 rounded-full" style={{ left: `${100 / (ORDER_STEPS.length * 2)}%`, right: `${100 / (ORDER_STEPS.length * 2)}%` }} />
                {/* Progress line: spans from center of first node to center of current node */}
                {currentIdx >= 2 && (
                    <div
                        className="absolute top-[18px] h-[3px] bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
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
                    const isPending = currentIdx < stepNum;

                    return (
                        <div key={step.key} className="flex flex-col items-center relative z-10" style={{ flex: 1 }}>
                            {/* Circle */}
                            <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                                    isCompleted
                                        ? "bg-emerald-500 text-white shadow-[0_0_0_4px_rgba(16,185,129,0.15)]"
                                        : isCurrent
                                            ? "bg-blue-500 text-white shadow-[0_0_0_4px_rgba(59,130,246,0.2)] animate-pulse"
                                            : "bg-gray-200 text-gray-400"
                                }`}
                            >
                                {isCompleted ? (
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                                ) : (
                                    <span className="text-xs">{step.icon}</span>
                                )}
                            </div>
                            {/* Label */}
                            <span className={`mt-2 [font-family:'Montserrat',Helvetica] text-[11px] font-semibold text-center leading-tight ${
                                isCompleted ? "text-emerald-700" : isCurrent ? "text-blue-600" : "text-gray-400"
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

/* ── Main Component ── */
export const OrdersTab = (): JSX.Element => {
    const [payments, setPayments] = useState<ParentPaymentDto[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
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
                <div className="w-8 h-8 border-4 border-[#6938ef] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (payments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-16 h-16 bg-[#f4f2ff] rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 text-[#6938ef] opacity-50" />
                </div>
                <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#1a1a2e]/50 text-sm text-center">
                    Bạn chưa có đơn hàng nào.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {payments.map((p) => {
                const badge = statusBadge(p.status);
                const isPending = p.status.toLowerCase() === "pending";
                const isExpanded = expandedId === p.paymentId;
                const showStepper = p.orderStatus && p.orderStatus !== "Pending";

                return (
                    <div key={p.paymentId} className="bg-white rounded-[12px] border border-[#E5E7EB] overflow-hidden hover:shadow-sm transition-shadow">
                        {/* Top row */}
                        <div
                            className={`p-5 flex items-center justify-between ${showStepper ? "cursor-pointer" : ""}`}
                            onClick={() => showStepper && setExpandedId(isExpanded ? null : p.paymentId)}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-[#EDE9FE] rounded-[10px] flex items-center justify-center">
                                    <CreditCard className="w-6 h-6 text-[#6938EF]" />
                                </div>
                                <div>
                                    <p className="[font-family:'Montserrat',Helvetica] font-semibold text-[#1A1A2E] text-sm">
                                        Đơn #{p.orderId.slice(0, 8)}
                                    </p>
                                    <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#9CA3AF] text-xs mt-0.5">
                                        {fmtDate(p.timestamp)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <p className="[font-family:'Montserrat',Helvetica] font-bold text-[#1A1A2E] text-base">
                                    {fmt(p.amount)}
                                </p>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                                    {badge.icon}
                                    {badge.label}
                                </span>
                                {isPending && (
                                    <Button
                                        onClick={(e) => { e.stopPropagation(); handlePay(p.orderId); }}
                                        disabled={payingId === p.orderId}
                                        className="bg-[#6938EF] hover:bg-[#5B2FD6] text-white rounded-[8px] text-sm font-semibold px-4 py-1.5 h-auto"
                                    >
                                        {payingId === p.orderId ? "Đang xử lý..." : "Thanh toán"}
                                    </Button>
                                )}
                                {showStepper && (
                                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                                )}
                            </div>
                        </div>

                        {/* Expanded stepper */}
                        {isExpanded && showStepper && (
                            <div className="px-5 pb-5 border-t border-[#F3F4F6]">
                                <p className="[font-family:'Montserrat',Helvetica] font-semibold text-[#6B7280] text-xs mt-3 mb-1">
                                    📍 Trạng thái đơn hàng
                                </p>
                                <OrderStatusStepper orderStatus={p.orderStatus} />
                            </div>
                        )}
                    </div>
                );
            })}

            {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                    <Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="text-sm rounded-[8px]">← Trước</Button>
                    <span className="flex items-center text-sm text-[#6B7280] px-2">{page}/{totalPages}</span>
                    <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="text-sm rounded-[8px]">Sau →</Button>
                </div>
            )}
        </div>
    );
};
