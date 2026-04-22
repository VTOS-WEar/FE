import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Banknote,
    Building2,
    CreditCard,
    Landmark,
    Loader2,
    ShieldCheck,
    WalletCards,
} from "lucide-react";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useProviderSidebarConfig } from "../../hooks/useProviderSidebarConfig";
import {
    getProviderWallet,
    getProviderWalletTransactions,
    requestProviderWithdrawal,
    updateProviderWalletBankInfo,
    type WalletDto,
    type WalletTransactionDto,
} from "../../lib/api/payments";
import { getProviderProfile } from "../../lib/api/providers";
import { VIETNAM_BANKS } from "../../lib/constants/vietnamBanks";

function fmt(value: number) {
    return `${value.toLocaleString("vi-VN")} ₫`;
}

function fmtDate(iso: string) {
    return new Date(iso).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function txLabel(type: string) {
    switch (type) {
        case "OrderPayment":
            return "Nhận từ trường";
        case "ProviderPayment":
            return "Thanh toán sản xuất";
        case "Refund":
            return "Hoàn tiền";
        default:
            return type;
    }
}

function txColor(type: string) {
    switch (type) {
        case "ProviderPayment":
            return "text-emerald-600";
        case "Refund":
            return "text-amber-600";
        default:
            return "text-slate-600";
    }
}

function SummaryCard({
    label,
    value,
    note,
    icon,
    tone,
}: {
    label: string;
    value: string;
    note: string;
    icon: React.ReactNode;
    tone: string;
}) {
    return (
        <div className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-soft-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">{label}</p>
                    <p className="mt-2 text-3xl font-black text-gray-900">{value}</p>
                    <p className="mt-2 text-sm font-semibold text-gray-500">{note}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}>{icon}</div>
            </div>
        </div>
    );
}

export default function ProviderWallet() {
    const navigate = useNavigate();
    const sidebarConfig = useProviderSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [providerName, setProviderName] = useState("");
    const [wallet, setWallet] = useState<WalletDto | null>(null);
    const [txns, setTxns] = useState<WalletTransactionDto[]>([]);
    const [txTotal, setTxTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [editingBank, setEditingBank] = useState(false);
    const [bankForm, setBankForm] = useState({ bankCode: "", bankName: "", accountNumber: "", accountName: "" });
    const [savingBank, setSavingBank] = useState(false);
    const [bankSearch, setBankSearch] = useState("");
    const [showBankDropdown, setShowBankDropdown] = useState(false);
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [withdrawing, setWithdrawing] = useState(false);
    const [withdrawMsg, setWithdrawMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [profile, currentWallet, tx] = await Promise.all([
                getProviderProfile(),
                getProviderWallet(),
                getProviderWalletTransactions(page, 10),
            ]);
            setProviderName(profile.providerName || "Nhà cung cấp");
            setWallet(currentWallet);
            setTxns(tx.items);
            setTxTotal(tx.total);
            setBankForm({
                bankCode: currentWallet.bankCode || "",
                bankName: currentWallet.bankName || "",
                accountNumber: currentWallet.bankAccountNumber || "",
                accountName: currentWallet.bankAccountName || "",
            });
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("user");
        navigate("/signin", { replace: true });
    };

    const totalPages = Math.max(1, Math.ceil(txTotal / 10));

    const isBankReady = !!wallet?.bankAccountNumber && !!wallet?.bankAccountName;

    const summaryCards = useMemo(
        () => [
            {
                label: "Số dư khả dụng",
                value: fmt(wallet?.balance ?? 0),
                note: "Số tiền hiện có thể theo dõi để chuẩn bị rút hoặc đối soát.",
                icon: <WalletCards className="h-5 w-5" />,
                tone: "bg-emerald-50 text-emerald-600",
            },
            {
                label: "Ngân hàng",
                value: isBankReady ? "Sẵn sàng" : "Chưa đủ",
                note: isBankReady ? "Đã có thông tin để gửi yêu cầu rút tiền." : "Cần cập nhật tài khoản ngân hàng trước khi rút tiền.",
                icon: <Landmark className="h-5 w-5" />,
                tone: "bg-blue-50 text-blue-600",
            },
            {
                label: "Giao dịch",
                value: String(txTotal),
                note: "Tổng số giao dịch đang có trong lịch sử ví nhà cung cấp.",
                icon: <CreditCard className="h-5 w-5" />,
                tone: "bg-violet-50 text-violet-600",
            },
            {
                label: "Mã ví",
                value: wallet?.walletId?.slice(0, 8) || "—",
                note: wallet?.updatedAt ? `Cập nhật lúc ${fmtDate(wallet.updatedAt)}` : "Chưa có thông tin cập nhật",
                icon: <ShieldCheck className="h-5 w-5" />,
                tone: "bg-amber-50 text-amber-600",
            },
        ],
        [wallet, txTotal, isBankReady],
    );

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} name={providerName} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                    <TopNavBar>
                        <div className="px-2 py-2">
                            <h1 className="text-xl font-extrabold text-gray-900">Ví nhà cung cấp</h1>
                            <p className="mt-1 text-[12px] font-semibold text-gray-400">
                                Theo dõi số dư, chuẩn bị rút tiền, và kiểm tra thông tin ngân hàng đối soát.
                            </p>
                        </div>
                    </TopNavBar>

                    <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        <section className="overflow-hidden rounded-[32px] border border-slate-900/70 bg-slate-950 bg-gradient-to-br from-slate-950 via-slate-800 to-emerald-900 px-6 py-7 text-white shadow-soft-lg lg:px-8">
                            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                                <div className="max-w-3xl">
                                    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white">
                                        Cash-out workspace
                                    </span>
                                    <h2 className="mt-4 text-3xl font-black leading-tight text-white sm:text-4xl">
                                        Số dư hiện tại là {fmt(wallet?.balance ?? 0)}.
                                    </h2>
                                    <p className="mt-3 text-sm font-medium leading-7 text-slate-100 sm:text-base">
                                        Mục tiêu của khu vực này là giữ dòng tiền rõ ràng: biết mình đang có bao nhiêu, tài khoản ngân hàng đã sẵn sàng chưa, và giao dịch gần đây đang phản ánh điều gì.
                                    </p>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-3 lg:w-[430px]">
                                    <div className="rounded-[22px] border border-white/10 bg-white/8 p-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">Số dư</p>
                                        <p className="mt-2 text-2xl font-black text-white">{fmt(wallet?.balance ?? 0)}</p>
                                    </div>
                                    <div className="rounded-[22px] border border-white/10 bg-white/8 p-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">Ngân hàng</p>
                                        <p className="mt-2 text-2xl font-black text-white">{isBankReady ? "OK" : "Thiếu"}</p>
                                    </div>
                                    <div className="rounded-[22px] border border-white/10 bg-white/8 p-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">Giao dịch</p>
                                        <p className="mt-2 text-2xl font-black text-white">{txTotal}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {loading ? (
                            <div className="flex min-h-[320px] items-center justify-center rounded-[32px] border border-gray-200 bg-white shadow-soft-sm">
                                <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
                            </div>
                        ) : (
                            <>
                                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                    {summaryCards.map((card) => (
                                        <SummaryCard key={card.label} {...card} />
                                    ))}
                                </section>

                                <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                                    <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Rút tiền</p>
                                                <h2 className="mt-2 text-2xl font-black text-gray-900">Chuẩn bị yêu cầu rút tiền</h2>
                                            </div>
                                            <button
                                                className="nb-btn nb-btn-green"
                                                onClick={() => {
                                                    setShowWithdraw(true);
                                                    setWithdrawMsg(null);
                                                    setWithdrawAmount("");
                                                }}
                                            >
                                                Yêu cầu rút tiền
                                            </button>
                                        </div>

                                        <div className="mt-5 rounded-[22px] border border-emerald-200 bg-emerald-50 p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-soft-sm">
                                                    <Banknote className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-black text-emerald-900">Trạng thái dòng tiền</h3>
                                                    <p className="mt-1 text-sm font-medium leading-6 text-emerald-900/80">
                                                        Số dư được cập nhật theo các thanh toán đi vào ví. Khi thông tin ngân hàng đã đầy đủ, bạn có thể gửi yêu cầu rút tiền để đội vận hành xử lý tiếp.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Độ sẵn sàng</p>
                                                <h2 className="mt-2 text-2xl font-black text-gray-900">Thông tin ngân hàng</h2>
                                            </div>
                                            {!editingBank ? (
                                                <button className="nb-btn nb-btn-outline text-sm" onClick={() => setEditingBank(true)}>
                                                    Chỉnh sửa
                                                </button>
                                            ) : null}
                                        </div>

                                        <div className="mt-5 grid gap-4">
                                            {editingBank ? (
                                                <>
                                                    <div className="relative">
                                                        <label className="block text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Ngân hàng</label>
                                                        <input
                                                            className="nb-input mt-2 w-full"
                                                            value={bankSearch || (bankForm.bankCode ? `${bankForm.bankName} (${bankForm.bankCode})` : "")}
                                                            onChange={(event) => { setBankSearch(event.target.value); setShowBankDropdown(true); }}
                                                            onFocus={() => { setBankSearch(""); setShowBankDropdown(true); }}
                                                            placeholder="Tìm ngân hàng..."
                                                            autoComplete="off"
                                                        />
                                                        {showBankDropdown ? (
                                                            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-soft-md">
                                                                {VIETNAM_BANKS.filter((bank) => {
                                                                    const query = bankSearch.toLowerCase();
                                                                    return !query
                                                                        || bank.code.toLowerCase().includes(query)
                                                                        || bank.shortName.toLowerCase().includes(query)
                                                                        || bank.name.toLowerCase().includes(query);
                                                                }).map((bank) => (
                                                                    <button
                                                                        key={bank.code}
                                                                        type="button"
                                                                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-violet-50"
                                                                        onClick={() => {
                                                                            setBankForm((current) => ({ ...current, bankCode: bank.code, bankName: bank.shortName }));
                                                                            setBankSearch("");
                                                                            setShowBankDropdown(false);
                                                                        }}
                                                                    >
                                                                        <span className="font-semibold text-gray-900">{bank.shortName}</span>
                                                                        <span className="text-xs text-gray-400">{bank.code}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        ) : null}
                                                    </div>

                                                    <div className="grid gap-3 sm:grid-cols-2">
                                                        <div>
                                                            <label className="block text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Số tài khoản</label>
                                                            <input className="nb-input mt-2 w-full" value={bankForm.accountNumber} onChange={(event) => setBankForm((current) => ({ ...current, accountNumber: event.target.value }))} />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Tên chủ tài khoản</label>
                                                            <input className="nb-input mt-2 w-full" value={bankForm.accountName} onChange={(event) => setBankForm((current) => ({ ...current, accountName: event.target.value }))} />
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            className="nb-btn nb-btn-outline text-sm"
                                                            onClick={() => {
                                                                setEditingBank(false);
                                                                setBankForm({
                                                                    bankCode: wallet?.bankCode || "",
                                                                    bankName: wallet?.bankName || "",
                                                                    accountNumber: wallet?.bankAccountNumber || "",
                                                                    accountName: wallet?.bankAccountName || "",
                                                                });
                                                            }}
                                                        >
                                                            Hủy
                                                        </button>
                                                        <button
                                                            className="nb-btn nb-btn-green text-sm"
                                                            disabled={savingBank}
                                                            onClick={async () => {
                                                                setSavingBank(true);
                                                                try {
                                                                    await updateProviderWalletBankInfo(bankForm);
                                                                    await fetchData();
                                                                    setEditingBank(false);
                                                                } finally {
                                                                    setSavingBank(false);
                                                                }
                                                            }}
                                                        >
                                                            {savingBank ? "Đang lưu..." : "Lưu"}
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <BankInfoRow label="Ngân hàng" value={wallet?.bankName ? `${wallet.bankName}${wallet.bankCode ? ` (${wallet.bankCode})` : ""}` : "Chưa cập nhật"} />
                                                    <BankInfoRow label="Số tài khoản" value={wallet?.bankAccountNumber || "Chưa cập nhật"} />
                                                    <BankInfoRow label="Chủ tài khoản" value={wallet?.bankAccountName || "Chưa cập nhật"} />
                                                    <div className={`rounded-[18px] border px-4 py-3 text-sm font-semibold ${isBankReady ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                                                        {isBankReady ? "Thông tin ngân hàng đã sẵn sàng cho việc rút tiền." : "Cần hoàn thiện ngân hàng để gửi yêu cầu rút tiền."}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </section>

                                <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Dòng tiền gần đây</p>
                                            <h2 className="mt-2 text-2xl font-black text-gray-900">Lịch sử giao dịch</h2>
                                        </div>
                                    </div>

                                    {txns.length === 0 ? (
                                        <p className="py-10 text-center text-sm font-medium text-gray-500">Chưa có giao dịch nào trong ví.</p>
                                    ) : (
                                        <div className="mt-5 space-y-3">
                                            {txns.map((tx) => (
                                                <div key={tx.paymentId} className="flex flex-col gap-3 rounded-[20px] border border-gray-200 bg-slate-50/70 p-4 md:flex-row md:items-center md:justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-white bg-white shadow-soft-sm ${tx.transactionType === "ProviderPayment" ? "text-emerald-600" : tx.transactionType === "Refund" ? "text-amber-600" : "text-slate-600"}`}>
                                                            <Building2 className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-gray-900">{txLabel(tx.transactionType)}</p>
                                                            <p className="mt-1 text-xs font-medium text-gray-500">{tx.description || fmtDate(tx.timestamp)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-left md:text-right">
                                                        <p className={`text-base font-black ${txColor(tx.transactionType)}`}>+{fmt(tx.amount)}</p>
                                                        <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-gray-400">{tx.status}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {totalPages > 1 ? (
                                        <div className="mt-5 flex justify-center gap-2">
                                            <button disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="nb-btn nb-btn-outline nb-btn-sm text-sm">
                                                ← Trước
                                            </button>
                                            <span className="flex items-center px-2 text-sm font-bold text-gray-500">{page}/{totalPages}</span>
                                            <button disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} className="nb-btn nb-btn-outline nb-btn-sm text-sm">
                                                Sau →
                                            </button>
                                        </div>
                                    ) : null}
                                </section>
                            </>
                        )}
                    </main>
                </div>
            </div>

            {showWithdraw ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md space-y-4 rounded-md border border-gray-200 bg-white p-6 shadow-soft-md">
                        <h3 className="text-lg font-extrabold text-gray-900">Yêu cầu rút tiền</h3>
                        <p className="text-sm text-gray-500">
                            Số dư hiện tại: <span className="font-extrabold text-emerald-600">{fmt(wallet?.balance ?? 0)}</span>
                        </p>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Số tiền muốn rút (₫)</label>
                            <input
                                className="nb-input w-full"
                                type="number"
                                min={100000}
                                step={10}
                                max={wallet?.balance ?? 0}
                                value={withdrawAmount}
                                onChange={(event) => setWithdrawAmount(event.target.value)}
                                placeholder="Nhập số tiền..."
                            />
                            <p className="mt-1 text-xs text-gray-400">Tối thiểu 100,000₫ · Số tiền phải chia hết cho 10</p>
                        </div>
                        {withdrawMsg ? (
                            <div className={`nb-alert ${withdrawMsg.type === "ok" ? "nb-alert-success" : "nb-alert-error"}`}>
                                <p className="text-sm font-medium">{withdrawMsg.text}</p>
                            </div>
                        ) : null}
                        <div className="flex justify-end gap-2">
                            <button className="nb-btn nb-btn-outline text-sm" onClick={() => setShowWithdraw(false)}>Hủy</button>
                            <button
                                className="nb-btn nb-btn-green text-sm"
                                disabled={withdrawing}
                                onClick={async () => {
                                    const amount = Number(withdrawAmount);
                                    const max = wallet?.balance ?? 0;
                                    if (!amount || amount <= 0) { setWithdrawMsg({ type: "err", text: "Số tiền không hợp lệ" }); return; }
                                    if (amount < 100000) { setWithdrawMsg({ type: "err", text: "Số tiền tối thiểu là 100,000₫" }); return; }
                                    if (amount % 10 !== 0) { setWithdrawMsg({ type: "err", text: "Số tiền phải chia hết cho 10" }); return; }
                                    if (amount > max) { setWithdrawMsg({ type: "err", text: "Số tiền vượt quá số dư" }); return; }
                                    if (!wallet?.bankAccountNumber) { setWithdrawMsg({ type: "err", text: "Vui lòng cập nhật thông tin ngân hàng trước" }); return; }
                                    setWithdrawing(true);
                                    try {
                                        await requestProviderWithdrawal(amount);
                                        setWithdrawMsg({ type: "ok", text: "Đã gửi yêu cầu rút tiền. Đội vận hành sẽ xử lý tiếp." });
                                        setWithdrawAmount("");
                                        await fetchData();
                                    } catch {
                                        setWithdrawMsg({ type: "err", text: "Gửi yêu cầu thất bại" });
                                    } finally {
                                        setWithdrawing(false);
                                    }
                                }}
                            >
                                {withdrawing ? "Đang gửi..." : "Gửi yêu cầu"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function BankInfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-[18px] border border-gray-200 bg-slate-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">{label}</p>
            <p className="mt-2 text-sm font-black text-gray-900">{value}</p>
        </div>
    );
}
