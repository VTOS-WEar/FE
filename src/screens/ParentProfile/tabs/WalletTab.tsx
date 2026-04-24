import { useEffect, useMemo, useState } from "react";
import { Banknote, CreditCard, RefreshCw, Send, WalletCards } from "lucide-react";
import {
  getParentWallet,
  getParentWalletTransactions,
  requestParentWithdrawal,
  type WalletDto,
  type WalletTransactionDto,
} from "../../../lib/api/payments";
import { addParentBankAccount } from "../../../lib/api/users";
import { VIETNAM_BANKS } from "../../../lib/constants/vietnamBanks";

const fmtCurrency = (value: number): string =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);

const fmtDate = (value: string): string =>
  new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));

type BankForm = {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountHolderName: string;
};

const defaultBankForm: BankForm = {
  bankName: "",
  bankCode: "",
  accountNumber: "",
  accountHolderName: "",
};

const formatBankOption = (bankName: string, bankCode: string): string =>
  bankCode ? `${bankName} (${bankCode})` : "";

const MIN_REFRESH_ANIMATION_MS = 650;

export const WalletTab = (): JSX.Element => {
  const [wallet, setWallet] = useState<WalletDto | null>(null);
  const [transactions, setTransactions] = useState<WalletTransactionDto[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankForm, setBankForm] = useState<BankForm>(defaultBankForm);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [bankSearch, setBankSearch] = useState("");
  const [showBankDropdown, setShowBankDropdown] = useState(false);

  const bankReady = useMemo(
    () => Boolean(wallet?.bankCode && wallet?.bankAccountNumber && wallet?.bankAccountName),
    [wallet],
  );

  const loadWallet = async () => {
    setLoading(true);
    try {
      const [walletResult, transactionResult] = await Promise.all([
        getParentWallet(),
        getParentWalletTransactions(1, 10),
      ]);
      setWallet(walletResult);
      setTransactions(transactionResult.items ?? []);
      setBankForm({
        bankName: walletResult.bankName ?? "",
        bankCode: walletResult.bankCode ?? "",
        accountNumber: walletResult.bankAccountNumber ?? "",
        accountHolderName: walletResult.bankAccountName ?? "",
      });
      setBankSearch(formatBankOption(walletResult.bankName ?? "", walletResult.bankCode ?? ""));
    } catch {
      setMessage({ type: "err", text: "Không tải được ví phụ huynh." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWallet();
  }, []);

  const refreshWallet = async () => {
    if (loading || refreshing) return;

    setRefreshing(true);
    try {
      await Promise.all([
        loadWallet(),
        new Promise((resolve) => setTimeout(resolve, MIN_REFRESH_ANIMATION_MS)),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const saveBank = async () => {
    if (!bankForm.bankName.trim() || !bankForm.bankCode.trim() || !bankForm.accountNumber.trim() || !bankForm.accountHolderName.trim()) {
      setMessage({ type: "err", text: "Vui lòng nhập đủ thông tin ngân hàng." });
      return;
    }

    setSubmitting(true);
    try {
      await addParentBankAccount({ ...bankForm, isDefault: true });
      setMessage({ type: "ok", text: "Đã lưu tài khoản ngân hàng mặc định." });
      await loadWallet();
    } catch {
      setMessage({ type: "err", text: "Lưu thông tin ngân hàng thất bại." });
    } finally {
      setSubmitting(false);
    }
  };

  const submitWithdrawal = async () => {
    const amount = Number(withdrawAmount);
    const balance = wallet?.balance ?? 0;

    if (!amount || amount <= 0) {
      setMessage({ type: "err", text: "Số tiền không hợp lệ." });
      return;
    }
    if (amount > balance) {
      setMessage({ type: "err", text: "Số tiền vượt quá số dư ví." });
      return;
    }
    if (!bankReady) {
      setMessage({ type: "err", text: "Vui lòng lưu tài khoản ngân hàng mặc định trước khi rút tiền." });
      return;
    }

    setSubmitting(true);
    try {
      await requestParentWithdrawal(amount);
      setWithdrawAmount("");
      setMessage({ type: "ok", text: "Đã gửi yêu cầu rút tiền. Admin sẽ xử lý tiếp." });
      await loadWallet();
    } catch {
      setMessage({ type: "err", text: "Gửi yêu cầu rút tiền thất bại." });
    } finally {
      setSubmitting(false);
    }
  };

  const refreshAnimating = loading || refreshing;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-600">Ví hoàn tiền</p>
          <h1 className="mt-2 text-2xl font-black text-slate-950">Ví phụ huynh</h1>
        </div>
        <button
          type="button"
          disabled={refreshAnimating}
          aria-busy={refreshAnimating}
          onClick={() => void refreshWallet()}
          className={`inline-flex items-center justify-center gap-2 rounded-[16px] border px-4 py-2.5 text-sm font-extrabold shadow-soft-sm transition-all duration-200 disabled:cursor-not-allowed ${
            refreshAnimating
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-emerald-100"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <RefreshCw className={`h-4 w-4 transition-transform duration-300 ${refreshAnimating ? "animate-spin text-emerald-600" : ""}`} />
          Làm mới
        </button>
      </div>

      {message ? (
        <div className={`rounded-[18px] border px-4 py-3 text-sm font-bold ${message.type === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
          {message.text}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[24px] border border-slate-200 bg-slate-950 p-5 text-white shadow-soft-md lg:col-span-1">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-white/10">
              <WalletCards className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-black text-emerald-100">
              {wallet?.isActive ? "ACTIVE" : "INACTIVE"}
            </span>
          </div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-slate-300">Số dư có thể rút</p>
          <p className="mt-2 text-3xl font-black">{fmtCurrency(wallet?.balance ?? 0)}</p>
          <p className="mt-4 text-sm font-medium text-slate-300">
            {wallet?.updatedAt ? `Cập nhật ${fmtDate(wallet.updatedAt)}` : "Chưa có dữ liệu cập nhật"}
          </p>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-soft-sm lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-slate-200 bg-slate-50 text-slate-700">
              <Banknote className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-950">Tài khoản nhận tiền</h2>
              <p className="text-sm font-medium text-slate-500">Tài khoản mặc định được gửi kèm yêu cầu rút tiền.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <div className="relative">
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Ngân hàng</label>
              <input
                className="w-full rounded-[14px] border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-emerald-400"
                placeholder="Tìm ngân hàng..."
                value={bankSearch}
                onChange={(event) => {
                  const value = event.target.value;
                  setBankSearch(value);
                  setBankForm((form) => ({ ...form, bankCode: "", bankName: "" }));
                  setShowBankDropdown(true);
                }}
                onFocus={() => {
                  setShowBankDropdown(true);
                }}
                autoComplete="off"
              />
              {showBankDropdown ? (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-y-auto rounded-[14px] border border-slate-200 bg-white shadow-soft-md">
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
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors hover:bg-emerald-50"
                      onClick={() => {
                        setBankForm((form) => ({ ...form, bankCode: bank.code, bankName: bank.shortName }));
                        setBankSearch(formatBankOption(bank.shortName, bank.code));
                        setShowBankDropdown(false);
                      }}
                    >
                      <span className="font-extrabold text-slate-900">{bank.shortName}</span>
                      <span className="text-xs font-bold text-slate-400">{bank.code}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
            <input className="rounded-[14px] border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-emerald-400" placeholder="Số tài khoản" value={bankForm.accountNumber} onChange={(event) => setBankForm((form) => ({ ...form, accountNumber: event.target.value }))} />
            <input className="rounded-[14px] border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-emerald-400" placeholder="Chủ tài khoản" value={bankForm.accountHolderName} onChange={(event) => setBankForm((form) => ({ ...form, accountHolderName: event.target.value }))} />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className={`text-sm font-bold ${bankReady ? "text-emerald-700" : "text-amber-700"}`}>
              {bankReady ? "Đã có thông tin ngân hàng mặc định." : "Cần lưu ngân hàng trước khi rút tiền."}
            </p>
            <button type="button" disabled={submitting} onClick={() => void saveBank()} className="inline-flex items-center justify-center gap-2 rounded-[16px] bg-slate-950 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-slate-800 disabled:opacity-60">
              <CreditCard className="h-4 w-4" />
              Lưu ngân hàng
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-soft-sm">
          <h2 className="text-base font-black text-slate-950">Rút tiền</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">Tạo yêu cầu để admin duyệt và chuyển khoản thủ công.</p>
          <input
            className="mt-5 w-full rounded-[14px] border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-emerald-400"
            type="number"
            min={0}
            max={wallet?.balance ?? 0}
            placeholder="Số tiền muốn rút"
            value={withdrawAmount}
            onChange={(event) => setWithdrawAmount(event.target.value)}
          />
          <button type="button" disabled={submitting || loading} onClick={() => void submitWithdrawal()} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[16px] bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-emerald-700 disabled:opacity-60">
            <Send className="h-4 w-4" />
            Gửi yêu cầu rút tiền
          </button>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-soft-sm">
          <h2 className="text-base font-black text-slate-950">Lịch sử ví</h2>
          <div className="mt-4 divide-y divide-slate-100">
            {transactions.length ? transactions.map((tx) => (
              <div key={tx.paymentId} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-black text-slate-900">{tx.transactionType}</p>
                  <p className="text-xs font-medium text-slate-500">{tx.description || "Giao dịch ví"} - {fmtDate(tx.timestamp)}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-black text-emerald-700">+{fmtCurrency(tx.amount)}</p>
                  <p className="text-xs font-bold text-slate-500">{tx.status}</p>
                </div>
              </div>
            )) : (
              <div className="py-10 text-center text-sm font-bold text-slate-500">
                Chưa có giao dịch ví.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
