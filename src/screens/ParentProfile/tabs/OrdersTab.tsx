import { useState, useEffect, useCallback } from "react";
import { ShoppingBag, CreditCard, Clock, CheckCircle, XCircle } from "lucide-react";
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

export const OrdersTab = (): JSX.Element => {
    const [payments, setPayments] = useState<ParentPaymentDto[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [payingId, setPayingId] = useState<string | null>(null);

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
                return (
                    <div key={p.paymentId} className="bg-white rounded-[12px] border border-[#E5E7EB] p-5 flex items-center justify-between hover:shadow-sm transition-shadow">
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
                                    onClick={() => handlePay(p.orderId)}
                                    disabled={payingId === p.orderId}
                                    className="bg-[#6938EF] hover:bg-[#5B2FD6] text-white rounded-[8px] text-sm font-semibold px-4 py-1.5 h-auto"
                                >
                                    {payingId === p.orderId ? "Đang xử lý..." : "Thanh toán"}
                                </Button>
                            )}
                        </div>
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
