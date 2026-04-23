import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowDownToLine,
    BarChart3,
    CreditCard,
    Loader2,
    ReceiptText,
    Wallet,
} from "lucide-react";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useProviderSidebarConfig } from "../../hooks/useProviderSidebarConfig";
import {
    getProviderPaymentHistory,
    getProviderRevenue,
    type ProviderPaymentDto,
    type ProviderRevenueDto,
} from "../../lib/api/payments";
import { getProviderProfile } from "../../lib/api/providers";

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

export default function ProviderRevenue() {
    const navigate = useNavigate();
    const sidebarConfig = useProviderSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [providerName, setProviderName] = useState("");
    const [revenue, setRevenue] = useState<ProviderRevenueDto | null>(null);
    const [payments, setPayments] = useState<ProviderPaymentDto[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [profile, rev, pay] = await Promise.all([
                getProviderProfile(),
                getProviderRevenue(),
                getProviderPaymentHistory(page, 10),
            ]);
            setProviderName(profile.providerName || "Nhà cung cấp");
            setRevenue(rev);
            setPayments(pay.items);
            setTotal(pay.total);
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

    const totalPages = Math.max(1, Math.ceil(total / 10));

    const summaryCards = useMemo(
        () => [
            {
                label: "Tổng doanh thu",
                value: fmt(revenue?.totalRevenue ?? 0),
                note: "Tổng tiền đã ghi nhận qua các giao dịch thuộc nhà cung cấp.",
                icon: <Wallet className="h-5 w-5" />,
                tone: "bg-emerald-50 text-emerald-600",
            },
            {
                label: "Đơn đã thanh toán",
                value: String(revenue?.totalPaidOrders ?? 0),
                note: "Số đơn đã hoàn tất trạng thái thanh toán trong hệ thống.",
                icon: <ArrowDownToLine className="h-5 w-5" />,
                tone: "bg-blue-50 text-blue-600",
            },
            {
                label: "Đơn chờ thanh toán",
                value: String(revenue?.totalPendingOrders ?? 0),
                note: "Các đơn chưa đi hết vòng thanh toán và vẫn còn theo dõi.",
                icon: <CreditCard className="h-5 w-5" />,
                tone: "bg-amber-50 text-amber-600",
            },
            {
                label: "Số tiền đang chờ",
                value: fmt(revenue?.pendingAmount ?? 0),
                note: "Phần giá trị chưa được ghi nhận thành doanh thu thực nhận.",
                icon: <ReceiptText className="h-5 w-5" />,
                tone: "bg-rose-50 text-rose-600",
            },
        ],
        [revenue],
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
                            <h1 className="text-xl font-extrabold text-gray-900">Doanh thu</h1>
                            <p className="mt-1 text-[12px] font-semibold text-gray-400">
                                Theo dõi số tiền đã ghi nhận, phần còn chờ, và lịch sử thanh toán chi tiết.
                            </p>
                        </div>
                    </TopNavBar>

                    <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        <section className="overflow-hidden rounded-[32px] border border-slate-900/70 bg-slate-950 bg-gradient-to-br from-slate-950 via-slate-800 to-sky-900 px-6 py-7 text-white shadow-soft-lg lg:px-8">
                            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                                <div className="max-w-3xl">
                                    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white">
                                        Báo cáo doanh thu
                                    </span>
                                    <h2 className="mt-4 text-3xl font-black leading-tight text-white sm:text-4xl">
                                        Doanh thu hiện ghi nhận là {fmt(revenue?.totalRevenue ?? 0)}.
                                    </h2>
                                    <p className="mt-3 text-sm font-medium leading-7 text-slate-100 sm:text-base">
                                        Từ đây, bạn xem đơn nào đã ghi nhận doanh thu, khoản nào còn chờ và các thanh toán gần đây đang phản ánh tình hình kinh doanh ra sao.
                                    </p>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-3 lg:w-[430px]">
                                    <div className="rounded-[22px] border border-white/10 bg-white/8 p-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">Đã thanh toán</p>
                                        <p className="mt-2 text-2xl font-black text-white">{revenue?.totalPaidOrders ?? 0}</p>
                                    </div>
                                    <div className="rounded-[22px] border border-white/10 bg-white/8 p-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">Chờ thanh toán</p>
                                        <p className="mt-2 text-2xl font-black text-white">{revenue?.totalPendingOrders ?? 0}</p>
                                    </div>
                                    <div className="rounded-[22px] border border-white/10 bg-white/8 p-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">Lịch sử</p>
                                        <p className="mt-2 text-2xl font-black text-white">{total}</p>
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

                                <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Lịch sử nhận tiền</p>
                                            <h2 className="mt-2 text-2xl font-black text-gray-900">Các khoản thanh toán gần đây</h2>
                                        </div>
                                        <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-black text-sky-700">
                                            <BarChart3 className="h-4 w-4" />
                                            Theo dõi mối tương quan giữa doanh thu và dòng tiền thực nhận
                                        </div>
                                    </div>

                                    {payments.length === 0 ? (
                                        <p className="py-10 text-center text-sm font-medium text-gray-500">Chưa nhận thanh toán nào.</p>
                                    ) : (
                                        <div className="mt-5 overflow-x-auto">
                                            <table className="nb-table">
                                                <thead>
                                                    <tr>
                                                        <th>Thời gian</th>
                                                        <th>Mô tả</th>
                                                        <th className="text-right">Số tiền</th>
                                                        <th className="text-center">Trạng thái</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {payments.map((payment) => (
                                                        <tr key={payment.paymentId}>
                                                            <td className="text-gray-600">{fmtDate(payment.timestamp)}</td>
                                                            <td className="font-bold text-gray-900">{payment.description || `Đơn #${payment.orderId?.slice(0, 8)}`}</td>
                                                            <td className="text-right font-extrabold text-emerald-600">+{fmt(payment.amount)}</td>
                                                            <td className="text-center">
                                                                <span className="nb-badge nb-badge-green">{payment.status}</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    {totalPages > 1 ? (
                                        <div className="mt-5 flex justify-center gap-2 border-t border-gray-200 pt-4">
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
        </div>
    );
}
