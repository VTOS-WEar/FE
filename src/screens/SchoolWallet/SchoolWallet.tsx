import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardSidebar } from "../../components/layout";
import { useSidebarConfig } from "../../hooks/useSidebarConfig";
import { Button } from "../../components/ui/button";
import {
    getSchoolWallet,
    getWalletTransactions,
    type SchoolWalletDto,
    type WalletTransactionDto,
} from "../../lib/api/payments";
import { getSchoolProfile } from "../../lib/api/schools";

/* ── helpers ── */
function fmt(n: number) { return n.toLocaleString("vi-VN") + " ₫"; }
function fmtDate(iso: string) {
    return new Date(iso).toLocaleString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}
function txLabel(type: string) {
    switch (type) {
        case "OrderPayment": return "Nhận từ đơn hàng";
        case "ProviderPayment": return "Thanh toán NCC";
        case "Refund": return "Hoàn tiền";
        default: return type;
    }
}
function txColor(type: string) {
    switch (type) {
        case "OrderPayment": return "text-[#10B981]";
        case "ProviderPayment": return "text-[#EF4444]";
        case "Refund": return "text-[#F59E0B]";
        default: return "text-[#6B7280]";
    }
}
function txSign(type: string) { return type === "OrderPayment" ? "+" : "−"; }

export default function SchoolWallet() {
    const navigate = useNavigate();
    const sidebarConfig = useSidebarConfig();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [schoolName, setSchoolName] = useState("");

    const [wallet, setWallet] = useState<SchoolWalletDto | null>(null);
    const [txns, setTxns] = useState<WalletTransactionDto[]>([]);
    const [txTotal, setTxTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [profile, w, tx] = await Promise.all([
                getSchoolProfile(),
                getSchoolWallet(),
                getWalletTransactions(page, 10),
            ]);
            setSchoolName(profile.schoolName || "");
            setWallet(w);
            setTxns(tx.items);
            setTxTotal(tx.total);
        } catch { /* ignore */ } finally { setLoading(false); }
    }, [page]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleLogout = () => {
        localStorage.removeItem("access_token"); localStorage.removeItem("user");
        sessionStorage.removeItem("access_token"); sessionStorage.removeItem("user");
        navigate("/signin", { replace: true });
    };

    const totalPages = Math.ceil(txTotal / 10);

    return (
        <div className="bg-[#f6f7f8] w-full min-h-screen flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[20rem] xl:w-[23.75rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} name={schoolName} isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(c => !c)} onLogout={handleLogout} />
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                    <div className="bg-white border-b border-[#cbcad7] px-6 lg:px-10 py-5">
                        <h1 className="[font-family:'Montserrat',Helvetica] font-bold text-[#1A1A2E] text-2xl">💰 Ví trường học</h1>
                        <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#6B7280] text-sm mt-1">Số dư được quản lý bởi hệ thống</p>
                    </div>

                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6">
                        {loading ? (
                            <div className="text-center py-20">
                                <div className="inline-block w-8 h-8 border-4 border-[#6938EF] border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <>
                                {/* Balance Card */}
                                <div className="bg-gradient-to-br from-[#6938EF] to-[#5B2FD6] rounded-[20px] p-8 text-white shadow-lg">
                                    <p className="[font-family:'Montserrat',Helvetica] font-medium text-white/80 text-sm">Số dư hiện tại</p>
                                    <p className="[font-family:'Montserrat',Helvetica] font-bold text-4xl mt-2">{fmt(wallet?.balance ?? 0)}</p>
                                    <div className="flex items-center gap-4 mt-4">
                                        <p className="[font-family:'Montserrat',Helvetica] font-medium text-white/50 text-xs">
                                            Mã ví: {wallet?.walletId?.slice(0, 8) ?? "—"}
                                        </p>
                                        <p className="[font-family:'Montserrat',Helvetica] font-medium text-white/50 text-xs">
                                            Cập nhật: {wallet?.updatedAt ? fmtDate(wallet.updatedAt) : "—"}
                                        </p>
                                    </div>
                                </div>

                                {/* Info note */}
                                <div className="bg-[#EDE9FE] border border-[#C4B5FD] rounded-[12px] px-4 py-3 flex items-center gap-3">
                                    <span className="text-lg leading-none flex-shrink-0">ℹ️</span>
                                    <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#5B21B6] text-sm leading-snug">
                                        Số dư được cập nhật tự động khi phụ huynh thanh toán đơn hàng. Quản trị viên sẽ phân bổ tiền cho trường thông qua mã ví.
                                    </p>
                                </div>

                                {/* Transaction History */}
                                <div className="bg-white rounded-[16px] border border-[#CBCAD7] p-6">
                                    <h2 className="[font-family:'Montserrat',Helvetica] font-bold text-[#1A1A2E] text-lg mb-4">📋 Lịch sử giao dịch</h2>
                                    {txns.length === 0 ? (
                                        <p className="text-center py-10 text-[#9CA3AF] [font-family:'Montserrat',Helvetica] font-medium">Chưa có giao dịch nào</p>
                                    ) : (
                                        <>
                                            <div className="space-y-3">
                                                {txns.map(tx => (
                                                    <div key={tx.paymentId} className="flex items-center justify-between py-3 border-b border-[#F3F4F6] last:border-0">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${tx.transactionType === "OrderPayment" ? "bg-[#D1FAE5]" : tx.transactionType === "Refund" ? "bg-[#FEF3C7]" : "bg-[#FEE2E2]"}`}>
                                                                {tx.transactionType === "OrderPayment" ? "↓" : "↑"}
                                                            </div>
                                                            <div>
                                                                <p className="[font-family:'Montserrat',Helvetica] font-semibold text-[#1A1A2E] text-sm">{txLabel(tx.transactionType)}</p>
                                                                <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#9CA3AF] text-xs">{tx.description || fmtDate(tx.timestamp)}</p>
                                                            </div>
                                                        </div>
                                                        <p className={`[font-family:'Montserrat',Helvetica] font-bold text-base ${txColor(tx.transactionType)}`}>
                                                            {txSign(tx.transactionType)}{fmt(tx.amount)}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                            {totalPages > 1 && (
                                                <div className="flex justify-center gap-2 mt-4">
                                                    <Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="text-sm rounded-[8px]">← Trước</Button>
                                                    <span className="flex items-center text-sm text-[#6B7280] px-2">{page}/{totalPages}</span>
                                                    <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="text-sm rounded-[8px]">Sau →</Button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
