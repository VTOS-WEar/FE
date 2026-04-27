import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Banknote,
    Clock3,
    ExternalLink,
    Landmark,
    Loader2,
    WalletCards,
} from "lucide-react";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { PROVIDER_LIST_PAGE_SIZE, ProviderDataTable, type ProviderDataTableColumn } from "../../components/provider/ProviderDataTable";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useProviderSidebarConfig } from "../../hooks/useProviderSidebarConfig";
import {
    getProviderWallet,
    getProviderWalletTransactions,
    getProviderWithdrawalRequests,
    requestProviderWithdrawal,
    updateProviderWalletBankInfo,
    type ProviderWithdrawalRequestDto,
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

function formatBankOption(bankName: string, bankCode: string) {
    return bankCode ? `${bankName} (${bankCode})` : "";
}

function txLabel(type: string) {
    switch (type) {
        case "OrderPayment":
            return "Thanh toán đơn hàng";
        case "ProviderPayment":
            return "Thanh toán sản xuất";
        case "Refund":
            return "Hoàn tiền";
        case "Withdrawal":
            return "Rút tiền";
        default:
            return type;
    }
}

function txColor(type: string) {
    switch (type) {
        case "ProviderPayment":
        case "OrderPayment":
            return "text-emerald-600";
        case "Refund":
            return "text-amber-600";
        case "Withdrawal":
            return "text-rose-600";
        default:
            return "text-slate-600";
    }
}

function orderStatusLabel(status?: string | null) {
    switch (status) {
        case "Pending":
            return "chờ xử lý";
        case "Paid":
            return "đã thanh toán";
        case "Accepted":
            return "đã tiếp nhận";
        case "InProduction":
            return "đang sản xuất";
        case "ReadyToShip":
            return "sẵn sàng giao";
        case "Shipped":
            return "đang giao";
        case "Delivered":
            return "được giao thành công";
        case "Cancelled":
            return "đã hủy";
        case "Refunded":
            return "đã hoàn tiền";
        default:
            return status ? status.toLowerCase() : "";
    }
}

function walletTransactionTitle(tx: WalletTransactionDto) {
    if (tx.orderId && (tx.transactionType === "OrderPayment" || tx.transactionType === "ProviderPayment")) {
        return `Thanh toán đơn #${tx.orderId.slice(0, 8)}`;
    }

    return txLabel(tx.transactionType);
}

function walletTransactionDescription(tx: WalletTransactionDto) {
    if (tx.orderStatus === "Delivered") return "Đơn hàng được giao thành công";
    if (tx.orderStatus) return `Đơn hàng ${orderStatusLabel(tx.orderStatus)}`;
    return tx.description || "-";
}

function withdrawalStatusLabel(status: string) {
    switch (status) {
        case "Pending":
            return "Đang chờ duyệt";
        case "Approved":
            return "Đã duyệt";
        case "Rejected":
            return "Từ chối";
        case "Paid":
            return "Đã chuyển tiền";
        default:
            return status;
    }
}

function withdrawalStatusTone(status: string) {
    switch (status) {
        case "Pending":
            return "border-amber-200 bg-amber-50 text-amber-700";
        case "Approved":
            return "border-blue-200 bg-blue-50 text-blue-700";
        case "Paid":
            return "border-emerald-200 bg-emerald-50 text-emerald-700";
        case "Rejected":
            return "border-rose-200 bg-rose-50 text-rose-700";
        default:
            return "border-slate-200 bg-slate-50 text-slate-600";
    }
}

function SummaryCard({
    label,
    value,
    icon,
    surfaceClassName,
    iconClassName,
}: {
    label: string;
    value: string;
    icon: React.ReactNode;
    surfaceClassName: string;
    iconClassName: string;
}) {
    return (
        <div className={`min-h-[112px] rounded-[8px] border border-white/70 p-5 shadow-soft-sm ${surfaceClassName}`}>
            <div className="flex h-full items-center gap-4">
                <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-white shadow-soft-xs ${iconClassName}`}>
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700">{label}</p>
                    <p className="mt-2 text-2xl font-bold leading-tight text-slate-950">{value}</p>
                </div>
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
    const [withdrawals, setWithdrawals] = useState<ProviderWithdrawalRequestDto[]>([]);
    const [withdrawalTotal, setWithdrawalTotal] = useState(0);
    const [pendingWithdrawal, setPendingWithdrawal] = useState<ProviderWithdrawalRequestDto | undefined>();
    const [pendingWithdrawalAmount, setPendingWithdrawalAmount] = useState(0);
    const [page, setPage] = useState(1);
    const [withdrawalPage, setWithdrawalPage] = useState(1);
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
            const [profile, currentWallet, tx, withdrawalRes, pendingWithdrawalRes] = await Promise.all([
                getProviderProfile(),
                getProviderWallet(),
                getProviderWalletTransactions(page, PROVIDER_LIST_PAGE_SIZE),
                getProviderWithdrawalRequests(withdrawalPage, PROVIDER_LIST_PAGE_SIZE),
                getProviderWithdrawalRequests(1, PROVIDER_LIST_PAGE_SIZE, "Pending"),
            ]);
            setProviderName(profile.providerName || "Nhà cung cấp");
            setWallet(currentWallet);
            setTxns(tx.items);
            setTxTotal(tx.total);
            setWithdrawals(withdrawalRes.items ?? []);
            setWithdrawalTotal(withdrawalRes.total ?? 0);
            setPendingWithdrawal(pendingWithdrawalRes.items?.[0]);
            setPendingWithdrawalAmount((pendingWithdrawalRes.items ?? []).reduce((total, item) => total + item.amount, 0));
            setBankForm({
                bankCode: currentWallet.bankCode || "",
                bankName: currentWallet.bankName || "",
                accountNumber: currentWallet.bankAccountNumber || "",
                accountName: currentWallet.bankAccountName || "",
            });
            setBankSearch(formatBankOption(currentWallet.bankName || "", currentWallet.bankCode || ""));
        } catch {
            // keep current UI state if wallet APIs are temporarily unavailable
        } finally {
            setLoading(false);
        }
    }, [page, withdrawalPage]);

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

    const totalPages = Math.max(1, Math.ceil(txTotal / PROVIDER_LIST_PAGE_SIZE));
    const withdrawalTotalPages = Math.max(1, Math.ceil(withdrawalTotal / PROVIDER_LIST_PAGE_SIZE));
    const isBankReady = Boolean(wallet?.bankAccountNumber && wallet?.bankAccountName);
    const canRequestWithdrawal = isBankReady && !pendingWithdrawal;

    const summaryCards = useMemo(
        () => [
            {
                label: "Số dư khả dụng",
                value: fmt(wallet?.balance ?? 0),
                icon: <WalletCards className="h-5 w-5" />,
                surfaceClassName: "bg-emerald-100",
                iconClassName: "text-slate-900",
            },
            {
                label: "Đang chờ rút",
                value: fmt(pendingWithdrawalAmount),
                icon: <Clock3 className="h-5 w-5" />,
                surfaceClassName: pendingWithdrawal ? "bg-yellow-100" : "bg-lime-200",
                iconClassName: "text-slate-900",
            },
            {
                label: "Yêu cầu rút tiền",
                value: String(withdrawalTotal),
                icon: <Banknote className="h-5 w-5" />,
                surfaceClassName: "bg-teal-100",
                iconClassName: "text-slate-900",
            },
            {
                label: "Ngân hàng",
                value: wallet?.bankName || (isBankReady ? "Sẵn sàng" : "Chưa đủ"),
                icon: <Landmark className="h-5 w-5" />,
                surfaceClassName: "bg-blue-100",
                iconClassName: "text-slate-900",
            },
        ],
        [isBankReady, pendingWithdrawal, pendingWithdrawalAmount, wallet, withdrawalTotal],
    );

    const withdrawalColumns: ProviderDataTableColumn<ProviderWithdrawalRequestDto>[] = [
        {
            key: "amount",
            header: "Số tiền",
            render: (item) => <span className="font-bold text-slate-900">{fmt(item.amount)}</span>,
        },
        {
            key: "status",
            header: "Trạng thái",
            render: (item) => (
                <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold ${withdrawalStatusTone(item.status)}`}>
                    {withdrawalStatusLabel(item.status)}
                </span>
            ),
        },
        {
            key: "requested",
            header: "Ngày gửi",
            render: (item) => <span className="whitespace-nowrap font-semibold text-slate-600">{fmtDate(item.requestedAt)}</span>,
        },
        {
            key: "paid",
            header: "Ngày chuyển",
            render: (item) => <span className="whitespace-nowrap font-semibold text-slate-600">{item.paidAt ? fmtDate(item.paidAt) : "-"}</span>,
        },
        {
            key: "note",
            header: "Ghi chú",
            render: (item) => <span className="line-clamp-1 font-semibold text-slate-600">{item.adminNote || "-"}</span>,
        },
    ];

    const walletTransactionColumns: ProviderDataTableColumn<WalletTransactionDto>[] = [
        {
            key: "time",
            header: "Thời gian",
            render: (tx) => <span className="whitespace-nowrap font-semibold text-slate-600">{fmtDate(tx.timestamp)}</span>,
        },
        {
            key: "type",
            header: "Loại giao dịch",
            render: (tx) => <span className="font-bold text-slate-950">{walletTransactionTitle(tx)}</span>,
        },
        {
            key: "description",
            header: "Mô tả",
            render: (tx) => <span className="line-clamp-2 font-semibold text-slate-700">{walletTransactionDescription(tx)}</span>,
        },
        {
            key: "amount",
            header: "Số tiền",
            className: "text-right",
            render: (tx) => (
                <span className={`font-bold ${txColor(tx.transactionType)}`}>
                    {tx.amount >= 0 ? "+" : ""}
                    {fmt(tx.amount)}
                </span>
            ),
        },
        {
            key: "status",
            header: "Trạng thái",
            className: "text-center",
            render: (tx) => (
                <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                    {tx.status}
                </span>
            ),
        },
        {
            key: "action",
            header: "Đơn hàng",
            className: "text-right",
            render: (tx) => tx.orderId ? (
                <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-slate-200 bg-white text-slate-700 transition-colors hover:border-violet-200 hover:text-violet-700"
                    onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/provider/orders/${tx.orderId}`);
                    }}
                    aria-label="Xem đơn hàng"
                >
                    <ExternalLink className="h-4 w-4" />
                </button>
            ) : <span className="text-sm font-semibold text-slate-400">-</span>,
        },
    ];

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} name={providerName} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                    <TopNavBar>
                        <div className="px-2 py-2">
                            <h1 className="text-xl font-bold text-gray-900">Ví nhà cung cấp</h1>
                        </div>
                    </TopNavBar>

                    <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        <section className="space-y-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-950">Tổng quan ví</h2>
                                    <p className="mt-1 text-sm font-semibold text-slate-500">
                                        Theo dõi số dư khả dụng, yêu cầu rút tiền và tài khoản nhận tiền.
                                    </p>
                                </div>
                                {pendingWithdrawal ? (
                                    <span className="inline-flex w-fit items-center rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700 shadow-soft-xs">
                                        Có yêu cầu chờ duyệt
                                    </span>
                                ) : (
                                    <button
                                        className="nb-btn nb-btn-green w-full sm:w-auto"
                                        disabled={!canRequestWithdrawal || loading}
                                        onClick={() => {
                                            setShowWithdraw(true);
                                            setWithdrawMsg(null);
                                            setWithdrawAmount("");
                                        }}
                                    >
                                        Yêu cầu rút tiền
                                    </button>
                                )}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                {summaryCards.map((card) => (
                                    <SummaryCard key={card.label} {...card} />
                                ))}
                            </div>
                        </section>

                        {loading ? (
                            <div className="flex min-h-[320px] items-center justify-center rounded-[8px] border border-gray-200 bg-white shadow-soft-sm">
                                <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
                            </div>
                        ) : (
                            <>
                                <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                                    <div className="rounded-[8px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Rút tiền</p>
                                                <h2 className="mt-2 text-2xl font-bold text-gray-900">Chuẩn bị yêu cầu rút tiền</h2>
                                            </div>
                                            {pendingWithdrawal ? (
                                                <span className="inline-flex w-fit items-center rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700">
                                                    Chờ admin xử lý
                                                </span>
                                            ) : (
                                                <button
                                                    className="nb-btn nb-btn-green"
                                                    disabled={!canRequestWithdrawal}
                                                    onClick={() => {
                                                        setShowWithdraw(true);
                                                        setWithdrawMsg(null);
                                                        setWithdrawAmount("");
                                                    }}
                                                >
                                                    Yêu cầu rút tiền
                                                </button>
                                            )}
                                        </div>

                                        <div className={`mt-5 rounded-[8px] border p-4 ${pendingWithdrawal ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
                                            <div className="flex items-start gap-3">
                                                <div className={`flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-soft-sm ${pendingWithdrawal ? "text-amber-600" : "text-emerald-600"}`}>
                                                    {pendingWithdrawal ? <Clock3 className="h-5 w-5" /> : <Banknote className="h-5 w-5" />}
                                                </div>
                                                <div>
                                                    <h3 className={`text-base font-bold ${pendingWithdrawal ? "text-amber-900" : "text-emerald-900"}`}>
                                                        {pendingWithdrawal ? `Đang chờ rút ${fmt(pendingWithdrawal.amount)}` : "Sẵn sàng tạo yêu cầu rút tiền"}
                                                    </h3>
                                                    <p className={`mt-1 text-sm font-medium leading-6 ${pendingWithdrawal ? "text-amber-900/80" : "text-emerald-900/80"}`}>
                                                        {pendingWithdrawal
                                                            ? `Gửi lúc ${fmtDate(pendingWithdrawal.requestedAt)}. Admin sẽ cập nhật trạng thái tại đây.`
                                                            : isBankReady
                                                                ? "Thông tin ngân hàng đã đầy đủ. Yêu cầu mới sẽ xuất hiện trong lịch sử bên dưới."
                                                                : "Cập nhật ngân hàng trước khi gửi yêu cầu rút tiền."}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-5">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-bold text-gray-900">Lịch sử yêu cầu rút tiền</h3>
                                                <span className="text-xs font-medium text-gray-400">{withdrawalTotal} yêu cầu</span>
                                            </div>
                                            {withdrawals.length === 0 ? (
                                                <p className="mt-4 rounded-[8px] border border-dashed border-gray-200 bg-slate-50 p-4 text-sm font-medium text-gray-500">
                                                    Chưa có yêu cầu rút tiền nào.
                                                </p>
                                            ) : (
                                                <div className="mt-4">
                                                    <ProviderDataTable
                                                        items={withdrawals}
                                                        columns={withdrawalColumns}
                                                        getKey={(item) => item.withdrawalRequestId}
                                                    />
                                                    {withdrawalTotalPages > 1 ? (
                                                        <div className="mt-4 flex justify-center gap-2">
                                                            <button disabled={withdrawalPage <= 1} onClick={() => setWithdrawalPage((current) => current - 1)} className="nb-btn nb-btn-outline nb-btn-sm text-sm">
                                                                ← Trước
                                                            </button>
                                                            <span className="flex items-center px-2 text-sm font-medium text-gray-500">{withdrawalPage}/{withdrawalTotalPages}</span>
                                                            <button disabled={withdrawalPage >= withdrawalTotalPages} onClick={() => setWithdrawalPage((current) => current + 1)} className="nb-btn nb-btn-outline nb-btn-sm text-sm">
                                                                Sau →
                                                            </button>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="rounded-[8px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Độ sẵn sàng</p>
                                                <h2 className="mt-2 text-2xl font-bold text-gray-900">Thông tin ngân hàng</h2>
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
                                                        <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">Ngân hàng</label>
                                                        <input
                                                            className="nb-input mt-2 w-full"
                                                            value={bankSearch}
                                                            onChange={(event) => {
                                                                setBankSearch(event.target.value);
                                                                setBankForm((current) => ({ ...current, bankCode: "", bankName: "" }));
                                                                setShowBankDropdown(true);
                                                            }}
                                                            onFocus={() => setShowBankDropdown(true)}
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
                                                                            setBankSearch(formatBankOption(bank.shortName, bank.code));
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
                                                            <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">Số tài khoản</label>
                                                            <input className="nb-input mt-2 w-full" value={bankForm.accountNumber} onChange={(event) => setBankForm((current) => ({ ...current, accountNumber: event.target.value }))} />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">Tên chủ tài khoản</label>
                                                            <input className="nb-input mt-2 w-full" value={bankForm.accountName} onChange={(event) => setBankForm((current) => ({ ...current, accountName: event.target.value }))} />
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-end gap-2">
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
                                                                setBankSearch(formatBankOption(wallet?.bankName || "", wallet?.bankCode || ""));
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
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </section>

                                <section className="rounded-[8px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Ví nhà cung cấp</p>
                                            <h2 className="mt-2 text-2xl font-bold text-gray-900">Lịch sử giao dịch ví</h2>
                                        </div>
                                        <span className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
                                            {txTotal} giao dịch
                                        </span>
                                    </div>

                                    {txns.length === 0 ? (
                                        <p className="py-10 text-center text-sm font-medium text-gray-500">Chưa có giao dịch nào trong ví.</p>
                                    ) : (
                                        <div className="mt-5">
                                            <ProviderDataTable
                                                items={txns}
                                                columns={walletTransactionColumns}
                                                getKey={(tx) => tx.paymentId}
                                                onRowClick={(tx) => {
                                                    if (tx.orderId) navigate(`/provider/orders/${tx.orderId}`);
                                                }}
                                            />
                                        </div>
                                    )}

                                    {totalPages > 1 ? (
                                        <div className="mt-5 flex justify-center gap-2">
                                            <button disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="nb-btn nb-btn-outline nb-btn-sm text-sm">
                                                ← Trước
                                            </button>
                                            <span className="flex items-center px-2 text-sm font-medium text-gray-500">{page}/{totalPages}</span>
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
                        <h3 className="text-lg font-bold text-gray-900">Yêu cầu rút tiền</h3>
                        <p className="text-sm text-gray-500">
                            Số dư hiện tại: <span className="font-bold text-emerald-600">{fmt(wallet?.balance ?? 0)}</span>
                        </p>
                        <div>
                            <label className="mb-1 block text-xs font-bold text-gray-500">Số tiền muốn rút (₫)</label>
                            <input
                                className="nb-input w-full"
                                type="number"
                                min={100000}
                                step={10}
                                max={wallet?.balance ?? 0}
                                value={withdrawAmount}
                                onChange={(event) => setWithdrawAmount(event.target.value)}
                            />
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
                                disabled={withdrawing || Boolean(pendingWithdrawal)}
                                onClick={async () => {
                                    const amount = Number(withdrawAmount);
                                    const max = wallet?.balance ?? 0;
                                    if (!amount || amount <= 0) { setWithdrawMsg({ type: "err", text: "Số tiền không hợp lệ" }); return; }
                                    if (amount < 100000) { setWithdrawMsg({ type: "err", text: "Số tiền tối thiểu là 100,000₫" }); return; }
                                    if (amount % 10 !== 0) { setWithdrawMsg({ type: "err", text: "Số tiền phải chia hết cho 10" }); return; }
                                    if (amount > max) { setWithdrawMsg({ type: "err", text: "Số tiền vượt quá số dư" }); return; }
                                    if (!wallet?.bankAccountNumber) { setWithdrawMsg({ type: "err", text: "Vui lòng cập nhật thông tin ngân hàng trước" }); return; }
                                    if (pendingWithdrawal) { setWithdrawMsg({ type: "err", text: "Bạn đang có một yêu cầu rút tiền chờ xử lý" }); return; }
                                    setWithdrawing(true);
                                    try {
                                        await requestProviderWithdrawal(amount);
                                        setWithdrawAmount("");
                                        await fetchData();
                                        setShowWithdraw(false);
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
        <div className="rounded-[8px] border border-gray-200 bg-slate-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">{label}</p>
            <p className="mt-2 text-sm font-bold text-gray-900">{value}</p>
        </div>
    );
}
