import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardSidebar } from "../../components/layout";
import { useProviderSidebarConfig } from "../../hooks/useProviderSidebarConfig";
import { Button } from "../../components/ui/button";
import {
    getProviderWallet,
    getProviderWalletTransactions,
    updateProviderWalletBankInfo,
    type WalletDto,
    type WalletTransactionDto,
} from "../../lib/api/payments";
import { getProviderProfile } from "../../lib/api/providers";

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
        case "OrderPayment": return "Nhận từ trường";
        case "ProviderPayment": return "Thanh toán sản xuất";
        case "Refund": return "Hoàn tiền";
        default: return type;
    }
}
function txColor(type: string) {
    switch (type) {
        case "ProviderPayment": return "text-[#10B981]";
        case "Refund": return "text-[#F59E0B]";
        default: return "text-[#6B7280]";
    }
}

export default function ProviderWallet() {
    const navigate = useNavigate();
    const sidebarConfig = useProviderSidebarConfig();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [providerName, setProviderName] = useState("");

    const [wallet, setWallet] = useState<WalletDto | null>(null);
    const [txns, setTxns] = useState<WalletTransactionDto[]>([]);
    const [txTotal, setTxTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    // Bank info edit state
    const [editingBank, setEditingBank] = useState(false);
    const [bankForm, setBankForm] = useState({ bankCode: "", bankName: "", accountNumber: "", accountName: "" });
    const [savingBank, setSavingBank] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [profile, w, tx] = await Promise.all([
                getProviderProfile(),
                getProviderWallet(),
                getProviderWalletTransactions(page, 10),
            ]);
            setProviderName(profile.providerName || "NCC");
            setWallet(w);
            setTxns(tx.items);
            setTxTotal(tx.total);
            // Init bank form with current values
            setBankForm({
                bankCode: w.bankCode || "", bankName: w.bankName || "",
                accountNumber: w.bankAccountNumber || "", accountName: w.bankAccountName || "",
            });
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
                    <DashboardSidebar {...sidebarConfig} name={providerName} isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(c => !c)} onLogout={handleLogout} />
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                    <div className="bg-white border-b border-[#cbcad7] px-6 lg:px-10 py-5">
                        <h1 className="[font-family:'Montserrat',Helvetica] font-bold text-[#1A1A2E] text-2xl">💰 Ví nhà cung cấp</h1>
                        <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#6B7280] text-sm mt-1">Theo dõi số dư và lịch sử giao dịch</p>
                    </div>

                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6">
                        {loading ? (
                            <div className="text-center py-20">
                                <div className="inline-block w-8 h-8 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <>
                                {/* Balance Card */}
                                <div className="bg-gradient-to-br from-[#10B981] to-[#059669] rounded-[20px] p-8 text-white shadow-lg">
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
                                <div className="bg-[#D1FAE5] border border-[#6EE7B7] rounded-[12px] px-4 py-3 flex items-center gap-3">
                                    <span className="text-lg leading-none flex-shrink-0">ℹ️</span>
                                    <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#065F46] text-sm leading-snug">
                                        Số dư được cập nhật tự động khi trường thanh toán đơn sản xuất. Quản trị viên sẽ phân bổ tiền thực tế thông qua mã ví.
                                    </p>
                                </div>

                                {/* Bank Info Card */}
                                <div className="bg-white rounded-[16px] border border-[#CBCAD7] p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="[font-family:'Montserrat',Helvetica] font-bold text-[#1A1A2E] text-lg">🏦 Thông tin ngân hàng</h2>
                                        {!editingBank && (
                                            <Button variant="outline" className="text-sm rounded-[8px]" onClick={() => setEditingBank(true)}>✏️ Chỉnh sửa</Button>
                                        )}
                                    </div>
                                    {editingBank ? (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-semibold text-[#6B7280] mb-1 [font-family:'Montserrat',Helvetica]">Mã ngân hàng</label>
                                                    <input className="w-full border border-[#CBCAD7] rounded-[8px] px-3 py-2 text-sm [font-family:'Montserrat',Helvetica]" value={bankForm.bankCode} onChange={e => setBankForm(f => ({ ...f, bankCode: e.target.value }))} placeholder="VCB" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-[#6B7280] mb-1 [font-family:'Montserrat',Helvetica]">Tên ngân hàng</label>
                                                    <input className="w-full border border-[#CBCAD7] rounded-[8px] px-3 py-2 text-sm [font-family:'Montserrat',Helvetica]" value={bankForm.bankName} onChange={e => setBankForm(f => ({ ...f, bankName: e.target.value }))} placeholder="Vietcombank" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-[#6B7280] mb-1 [font-family:'Montserrat',Helvetica]">Số tài khoản</label>
                                                    <input className="w-full border border-[#CBCAD7] rounded-[8px] px-3 py-2 text-sm [font-family:'Montserrat',Helvetica]" value={bankForm.accountNumber} onChange={e => setBankForm(f => ({ ...f, accountNumber: e.target.value }))} placeholder="0491000567890" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-[#6B7280] mb-1 [font-family:'Montserrat',Helvetica]">Tên chủ tài khoản</label>
                                                    <input className="w-full border border-[#CBCAD7] rounded-[8px] px-3 py-2 text-sm [font-family:'Montserrat',Helvetica]" value={bankForm.accountName} onChange={e => setBankForm(f => ({ ...f, accountName: e.target.value }))} placeholder="CONG TY ABC" />
                                                </div>
                                            </div>
                                            <div className="flex gap-2 justify-end">
                                                <Button variant="outline" className="text-sm rounded-[8px]" onClick={() => { setEditingBank(false); setBankForm({ bankCode: wallet?.bankCode || "", bankName: wallet?.bankName || "", accountNumber: wallet?.bankAccountNumber || "", accountName: wallet?.bankAccountName || "" }); }}>Hủy</Button>
                                                <Button className="text-sm rounded-[8px] bg-[#10B981] hover:bg-[#059669] text-white" disabled={savingBank} onClick={async () => {
                                                    setSavingBank(true);
                                                    try { await updateProviderWalletBankInfo(bankForm); await fetchData(); setEditingBank(false); } catch { /* ignore */ } finally { setSavingBank(false); }
                                                }}>{savingBank ? "Đang lưu..." : "💾 Lưu"}</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div><p className="text-xs text-[#9CA3AF] [font-family:'Montserrat',Helvetica]">Ngân hàng</p><p className="text-sm font-semibold text-[#1A1A2E] [font-family:'Montserrat',Helvetica]">{wallet?.bankName || "Chưa cập nhật"} {wallet?.bankCode ? `(${wallet.bankCode})` : ""}</p></div>
                                            <div><p className="text-xs text-[#9CA3AF] [font-family:'Montserrat',Helvetica]">Số tài khoản</p><p className="text-sm font-semibold text-[#1A1A2E] [font-family:'Montserrat',Helvetica]">{wallet?.bankAccountNumber || "Chưa cập nhật"}</p></div>
                                            <div className="sm:col-span-2"><p className="text-xs text-[#9CA3AF] [font-family:'Montserrat',Helvetica]">Chủ tài khoản</p><p className="text-sm font-semibold text-[#1A1A2E] [font-family:'Montserrat',Helvetica]">{wallet?.bankAccountName || "Chưa cập nhật"}</p></div>
                                        </div>
                                    )}
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
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${tx.transactionType === "ProviderPayment" ? "bg-[#D1FAE5]" : tx.transactionType === "Refund" ? "bg-[#FEF3C7]" : "bg-[#F3F4F6]"}`}>
                                                                {tx.transactionType === "ProviderPayment" ? "↓" : "↑"}
                                                            </div>
                                                            <div>
                                                                <p className="[font-family:'Montserrat',Helvetica] font-semibold text-[#1A1A2E] text-sm">{txLabel(tx.transactionType)}</p>
                                                                <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#9CA3AF] text-xs">{tx.description || fmtDate(tx.timestamp)}</p>
                                                            </div>
                                                        </div>
                                                        <p className={`[font-family:'Montserrat',Helvetica] font-bold text-base ${txColor(tx.transactionType)}`}>
                                                            +{fmt(tx.amount)}
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
