import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useSidebarConfig } from "../../hooks/useSidebarConfig";
import {
    getSchoolWallet,
    getWalletTransactions,
    updateWalletBankInfo,
    requestSchoolWithdrawal,
    type WalletDto,
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
        case "ProviderPayment": return "Thanh toán Nhà Cung Cấp";
        case "Refund": return "Hoàn tiền";
        default: return type;
    }
}
function txSign(type: string) { return type === "OrderPayment" ? "+" : "−"; }
function txColor(type: string) {
    switch (type) {
        case "OrderPayment": return "text-[#10B981]";
        case "ProviderPayment": return "text-[#EF4444]";
        case "Refund": return "text-[#F59E0B]";
        default: return "text-[#6B7280]";
    }
}

export default function SchoolWallet() {
    const navigate = useNavigate();
    const sidebarConfig = useSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [schoolName, setSchoolName] = useState("");

    const [wallet, setWallet] = useState<WalletDto | null>(null);
    const [txns, setTxns] = useState<WalletTransactionDto[]>([]);
    const [txTotal, setTxTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    // Bank info edit state
    const [editingBank, setEditingBank] = useState(false);
    const [bankForm, setBankForm] = useState({ bankCode: "", bankName: "", accountNumber: "", accountName: "" });
    const [savingBank, setSavingBank] = useState(false);

    // Withdraw modal state
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [withdrawing, setWithdrawing] = useState(false);
    const [withdrawMsg, setWithdrawMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

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
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} name={schoolName} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                    <TopNavBar>
                        <h1 className="font-extrabold text-[#1A1A2E] text-2xl">💰 Ví trường học</h1>
                        <p className="font-medium text-[#6B7280] text-sm mt-1">Số dư được quản lý bởi hệ thống</p>
                    </TopNavBar>

                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6 nb-fade-in">
                        {loading ? (
                            <div className="text-center py-20">
                                <div className="inline-block w-8 h-8 border-4 border-[#6938EF] border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <>
                                {/* Balance Card — NB style with gradient */}
                                <div className="nb-stat-card nb-stat-primary p-8">
                                    <p className="nb-stat-label">Số dư hiện tại</p>
                                    <p className="nb-stat-value text-4xl mt-2">{fmt(wallet?.balance ?? 0)}</p>
                                    <div className="flex items-center gap-4 mt-4">
                                        <p className="font-medium text-[#6B7280] text-xs">
                                            Mã ví: {wallet?.walletId?.slice(0, 8) ?? "—"}
                                        </p>
                                        <p className="font-medium text-[#6B7280] text-xs">
                                            Cập nhật: {wallet?.updatedAt ? fmtDate(wallet.updatedAt) : "—"}
                                        </p>
                                    </div>
                                </div>

                                {/* Withdraw Button */}
                                <div className="flex justify-end">
                                    <button className="nb-btn nb-btn-purple" onClick={() => { setShowWithdraw(true); setWithdrawMsg(null); setWithdrawAmount(""); }}>
                                        💸 Yêu cầu rút tiền
                                    </button>
                                </div>

                                {/* Info note — NB alert */}
                                <div className="nb-alert nb-alert-info">
                                    <span className="text-lg leading-none flex-shrink-0">ℹ️</span>
                                    <p className="font-medium text-[#1E40AF] text-sm leading-snug">
                                        Số dư được cập nhật tự động khi phụ huynh thanh toán đơn hàng. Quản trị viên sẽ phân bổ tiền cho trường thông qua mã ví.
                                    </p>
                                </div>

                                {/* Bank Info Card */}
                                <div className="nb-card-static p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="font-extrabold text-[#1A1A2E] text-lg">🏦 Thông tin ngân hàng</h2>
                                        {!editingBank && (
                                            <button className="nb-btn nb-btn-outline text-sm" onClick={() => setEditingBank(true)}>✏️ Chỉnh sửa</button>
                                        )}
                                    </div>
                                    {editingBank ? (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-bold text-[#6B7280] mb-1">Mã ngân hàng</label>
                                                    <input className="nb-input w-full" value={bankForm.bankCode} onChange={e => setBankForm(f => ({ ...f, bankCode: e.target.value }))} placeholder="VCB" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-[#6B7280] mb-1">Tên ngân hàng</label>
                                                    <input className="nb-input w-full" value={bankForm.bankName} onChange={e => setBankForm(f => ({ ...f, bankName: e.target.value }))} placeholder="Vietcombank" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-[#6B7280] mb-1">Số tài khoản</label>
                                                    <input className="nb-input w-full" value={bankForm.accountNumber} onChange={e => setBankForm(f => ({ ...f, accountNumber: e.target.value }))} placeholder="0491000234567" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-[#6B7280] mb-1">Tên chủ tài khoản</label>
                                                    <input className="nb-input w-full" value={bankForm.accountName} onChange={e => setBankForm(f => ({ ...f, accountName: e.target.value }))} placeholder="TRUONG THPT ABC" />
                                                </div>
                                            </div>
                                            <div className="flex gap-2 justify-end">
                                                <button className="nb-btn nb-btn-outline text-sm" onClick={() => { setEditingBank(false); setBankForm({ bankCode: wallet?.bankCode || "", bankName: wallet?.bankName || "", accountNumber: wallet?.bankAccountNumber || "", accountName: wallet?.bankAccountName || "" }); }}>Hủy</button>
                                                <button className="nb-btn nb-btn-purple text-sm" disabled={savingBank} onClick={async () => {
                                                    setSavingBank(true);
                                                    try { await updateWalletBankInfo(bankForm); await fetchData(); setEditingBank(false); } catch { /* ignore */ } finally { setSavingBank(false); }
                                                }}>{savingBank ? "Đang lưu..." : "💾 Lưu"}</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div><p className="text-xs font-bold text-[#9CA3AF] uppercase mb-1">Ngân hàng</p><p className="text-sm font-bold text-[#1A1A2E]">{wallet?.bankName || "Chưa cập nhật"} {wallet?.bankCode ? `(${wallet.bankCode})` : ""}</p></div>
                                            <div><p className="text-xs font-bold text-[#9CA3AF] uppercase mb-1">Số tài khoản</p><p className="text-sm font-bold text-[#1A1A2E]">{wallet?.bankAccountNumber || "Chưa cập nhật"}</p></div>
                                            <div className="sm:col-span-2"><p className="text-xs font-bold text-[#9CA3AF] uppercase mb-1">Chủ tài khoản</p><p className="text-sm font-bold text-[#1A1A2E]">{wallet?.bankAccountName || "Chưa cập nhật"}</p></div>
                                        </div>
                                    )}
                                </div>

                                {/* Transaction History */}
                                <div className="nb-card-static p-6">
                                    <h2 className="font-extrabold text-[#1A1A2E] text-lg mb-4">📋 Lịch sử giao dịch</h2>
                                    {txns.length === 0 ? (
                                        <p className="text-center py-10 text-[#9CA3AF] font-medium">Chưa có giao dịch nào</p>
                                    ) : (
                                        <>
                                            <div className="space-y-3">
                                                {txns.map(tx => (
                                                    <div key={tx.paymentId} className="flex items-center justify-between py-3 border-b border-[#E5E7EB] last:border-0">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg border-2 border-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E] ${tx.transactionType === "OrderPayment" ? "bg-[#D1FAE5]" : tx.transactionType === "Refund" ? "bg-[#FEF3C7]" : "bg-[#FEE2E2]"}`}>
                                                                {tx.transactionType === "OrderPayment" ? "↓" : "↑"}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-[#1A1A2E] text-sm">{txLabel(tx.transactionType)}</p>
                                                                <p className="font-medium text-[#9CA3AF] text-xs">{tx.description || fmtDate(tx.timestamp)}</p>
                                                            </div>
                                                        </div>
                                                        <p className={`font-extrabold text-base ${txColor(tx.transactionType)}`}>
                                                            {txSign(tx.transactionType)}{fmt(tx.amount)}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                            {totalPages > 1 && (
                                                <div className="flex justify-center gap-2 mt-4">
                                                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="nb-btn nb-btn-outline nb-btn-sm text-sm">← Trước</button>
                                                    <span className="flex items-center text-sm text-[#6B7280] px-2 font-bold">{page}/{totalPages}</span>
                                                    <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="nb-btn nb-btn-outline nb-btn-sm text-sm">Sau →</button>
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

            {/* Withdraw Modal */}
            {showWithdraw && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="nb-card-static p-6 w-full max-w-md space-y-4">
                        <h3 className="font-extrabold text-[#1A1A2E] text-lg">💸 Yêu cầu rút tiền</h3>
                        <p className="text-sm text-[#6B7280]">Số dư hiện tại: <span className="font-extrabold text-[#6938EF]">{fmt(wallet?.balance ?? 0)}</span></p>
                        <div>
                            <label className="block text-xs font-bold text-[#6B7280] mb-1">Số tiền muốn rút (₫)</label>
                            <input className="nb-input w-full" type="number" min={1} max={wallet?.balance ?? 0}
                                value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                                placeholder="Nhập số tiền..." />
                        </div>
                        {withdrawMsg && (
                            <div className={`nb-alert ${withdrawMsg.type === "ok" ? "nb-alert-success" : "nb-alert-error"}`}>
                                <p className="text-sm font-medium">{withdrawMsg.text}</p>
                            </div>
                        )}
                        <div className="flex gap-2 justify-end">
                            <button className="nb-btn nb-btn-outline text-sm" onClick={() => setShowWithdraw(false)}>Hủy</button>
                            <button className="nb-btn nb-btn-purple text-sm" disabled={withdrawing} onClick={async () => {
                                const amt = Number(withdrawAmount);
                                const max = wallet?.balance ?? 0;
                                if (!amt || amt <= 0) { setWithdrawMsg({ type: "err", text: "Số tiền không hợp lệ" }); return; }
                                if (amt > max) { setWithdrawMsg({ type: "err", text: "Số tiền vượt quá số dư" }); return; }
                                if (!wallet?.bankAccountNumber) { setWithdrawMsg({ type: "err", text: "Vui lòng cập nhật thông tin ngân hàng trước" }); return; }
                                setWithdrawing(true);
                                try {
                                    await requestSchoolWithdrawal(amt);
                                    setWithdrawMsg({ type: "ok", text: "Đã gửi yêu cầu rút tiền! Quản trị viên sẽ xử lý." });
                                    setWithdrawAmount("");
                                    await fetchData();
                                } catch { setWithdrawMsg({ type: "err", text: "Gửi yêu cầu thất bại" }); }
                                finally { setWithdrawing(false); }
                            }}>
                                {withdrawing ? "Đang gửi..." : "Gửi yêu cầu"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
