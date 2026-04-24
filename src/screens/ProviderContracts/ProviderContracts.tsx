import { useCallback, useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    CheckCircle2,
    FileSignature,
    FileText,
    Loader2,
    MessageSquare,
    PenSquare,
    ShieldCheck,
} from "lucide-react";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { usePreservedResultsHeight } from "../../hooks/usePreservedResultsHeight";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useProviderSidebarConfig } from "../../hooks/useProviderSidebarConfig";
import { ChatWidget, type ChatContextInfo } from "../../components/ChatWidget/ChatWidget";
import {
    approveContract,
    getProviderContractDetail,
    getProviderContracts,
    rejectContract,
    requestProviderSignOTP,
    signProviderContract,
    updateContractPricing,
    type ContractDto,
} from "../../lib/api/contracts";
import { ContractTemplate, type ContractTemplateData } from "../../components/ContractTemplate";

const STATUS_MAP: Record<string, { label: string; badge: string; tone: string }> = {
    Pending: { label: "Chờ duyệt", badge: "nb-badge nb-badge-yellow", tone: "bg-amber-50 text-amber-700" },
    PendingSchoolSign: { label: "Chờ trường ký", badge: "nb-badge bg-[#FEF3C7] text-amber-800 border-gray-200", tone: "bg-orange-50 text-orange-700" },
    PendingProviderSign: { label: "Chờ bạn ký", badge: "nb-badge bg-[#E0E7FF] text-[#3730A3] border-gray-200", tone: "bg-indigo-50 text-indigo-700" },
    Active: { label: "Đang hiệu lực", badge: "nb-badge bg-[#D1FAE5] text-emerald-800 border-gray-200", tone: "bg-emerald-50 text-emerald-700" },
    InUse: { label: "Đang dùng", badge: "nb-badge bg-[#DBEAFE] text-[#1D4ED8] border-gray-200", tone: "bg-blue-50 text-blue-700" },
    Fulfilled: { label: "Hoàn thành", badge: "nb-badge bg-[#D1FAE5] text-emerald-800 border-gray-200", tone: "bg-emerald-50 text-emerald-700" },
    Rejected: { label: "Từ chối", badge: "nb-badge nb-badge-red", tone: "bg-rose-50 text-rose-700" },
    Expired: { label: "Hết hạn", badge: "nb-badge bg-gray-100 text-gray-500", tone: "bg-slate-100 text-slate-700" },
};

function formatDate(value?: string | null) {
    return value ? new Date(value).toLocaleDateString("vi-VN") : "Chưa có";
}

function SummaryCard({
    label,
    value,
    note,
    icon,
    tone,
}: {
    label: string;
    value: string | number;
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

export function ProviderContracts() {
    const sidebarConfig = useProviderSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [contracts, setContracts] = useState<ContractDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<ContractDto | null>(null);
    const [showDetail, setShowDetail] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [showReject, setShowReject] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [error, setError] = useState("");
    const [pricingDraft, setPricingDraft] = useState<Record<string, string>>({});
    const [templateContract, setTemplateContract] = useState<ContractTemplateData | null>(null);
    const [templateLoading, setTemplateLoading] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);
    const [chatContractId, setChatContractId] = useState("");
    const [chatContext, setChatContext] = useState<ChatContextInfo | undefined>();
    const pageSize = 8;

    const fetchContracts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getProviderContracts(statusFilter || undefined);
            setContracts(data);
        } catch (e) {
            console.error("Error fetching contracts:", e);
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchContracts();
    }, [fetchContracts]);

    const openDetail = async (id: string, options?: { reject?: boolean }) => {
        try {
            const contract = await getProviderContractDetail(id);
            setSelected(contract);
            setPricingDraft(
                Object.fromEntries(
                    contract.items.map((item) => [
                        item.itemId,
                        item.pricePerUnit && item.pricePerUnit > 0 ? String(item.pricePerUnit) : "",
                    ]),
                ),
            );
            setShowDetail(true);
            setShowReject(Boolean(options?.reject));
            setRejectReason("");
            setError("");
        } catch (e) {
            console.error("Error:", e);
        }
    };

    const openContractTemplate = async (id: string) => {
        setTemplateLoading(true);
        try {
            const contract = await getProviderContractDetail(id);
            setTemplateContract(contract as ContractTemplateData);
        } catch (e) {
            console.error(e);
        } finally {
            setTemplateLoading(false);
        }
    };

    const handleProviderSign = async (sigData: string, otpCode: string, pdfBase64?: string) => {
        if (!templateContract) return;
        await signProviderContract(templateContract.contractId, sigData, otpCode, pdfBase64);
        await fetchContracts();
    };

    const handleRequestProviderOTP = async () => {
        if (!templateContract) return;
        await requestProviderSignOTP(templateContract.contractId);
    };

    const openContractChat = (contract: ContractDto) => {
        setChatContractId(contract.contractId);
        setChatContext({
            icon: "📄",
            title: contract.contractName,
            status: STATUS_MAP[contract.status]?.label || contract.status,
            statusColor: "#888",
            subtitle: `Trường: ${contract.schoolName || "—"} · ${contract.items.length} mẫu`,
        });
        setChatOpen(true);
    };

    const handleSavePricing = async () => {
        if (!selected) return;
        setActionLoading(true);
        setError("");
        try {
            const payload = {
                items: selected.items.map((item) => ({
                    itemId: item.itemId,
                    pricePerUnit: Number(pricingDraft[item.itemId] || 0),
                })),
            };
            const updated = await updateContractPricing(selected.contractId, payload);
            setSelected(updated);
            setPricingDraft(
                Object.fromEntries(
                    updated.items.map((item) => [
                        item.itemId,
                        item.pricePerUnit && item.pricePerUnit > 0 ? String(item.pricePerUnit) : "",
                    ]),
                ),
            );
        } catch (e: any) {
            setError(e.message || "Lỗi cập nhật giá");
        } finally {
            setActionLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!selected) return;
        setActionLoading(true);
        setError("");
        try {
            await approveContract(selected.contractId);
            setShowDetail(false);
            setSelected(null);
            await fetchContracts();
        } catch (e: any) {
            setError(e.message || "Lỗi duyệt hợp đồng");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!selected || !rejectReason.trim()) {
            setError("Vui lòng nhập lý do từ chối");
            return;
        }
        setActionLoading(true);
        setError("");
        try {
            await rejectContract(selected.contractId, rejectReason);
            setShowDetail(false);
            setSelected(null);
            setShowReject(false);
            setRejectReason("");
            await fetchContracts();
        } catch (e: any) {
            setError(e.message || "Lỗi từ chối hợp đồng");
        } finally {
            setActionLoading(false);
        }
    };

    const filterTabs = [
        { value: "", label: "Tất cả" },
        { value: "Pending", label: "Chờ duyệt" },
        { value: "PendingProviderSign", label: "Chờ bạn ký" },
        { value: "PendingSchoolSign", label: "Chờ trường ký" },
        { value: "Active", label: "Hiệu lực" },
        { value: "InUse", label: "Đang dùng" },
        { value: "Rejected", label: "Từ chối" },
        { value: "Expired", label: "Hết hạn" },
    ];

    const counts = useMemo(() => {
        const valueOf = (status: string[]) => contracts.filter((contract) => status.includes(contract.status)).length;
        return {
            all: contracts.length,
            pending: valueOf(["Pending"]),
            providerSign: valueOf(["PendingProviderSign"]),
            active: valueOf(["Active", "InUse"]),
            review: valueOf(["Pending", "PendingProviderSign"]),
        };
    }, [contracts]);

    const totalPages = Math.max(1, Math.ceil(contracts.length / pageSize));
    const pagedContracts = contracts.slice((page - 1) * pageSize, page * pageSize);
    const isFilteredEmptyState = !loading && !!statusFilter && pagedContracts.length === 0;
    const { preserveResultsHeight, preservedHeightStyle, resultsRegionRef } = usePreservedResultsHeight(isFilteredEmptyState);

    useEffect(() => {
        setPage(1);
    }, [statusFilter]);

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} />
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                    <TopNavBar>
                        <div className="px-2 py-2">
                            <h1 className="text-xl font-extrabold text-gray-900">Điều phối hợp đồng</h1>
                            <p className="mt-1 text-[12px] font-semibold text-gray-400">
                                Duyệt giá, ký số, và theo dõi các hợp đồng đang ràng buộc với trường.
                            </p>
                        </div>
                    </TopNavBar>

                    <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        <section className="overflow-hidden rounded-[32px] border border-slate-900/70 bg-slate-950 bg-gradient-to-br from-slate-950 via-slate-800 to-indigo-900 px-6 py-7 text-white shadow-soft-lg lg:px-8">
                            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                                <div className="max-w-3xl">
                                    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white">
                                        Hợp đồng với trường
                                    </span>
                                    <h2 className="mt-4 text-3xl font-black leading-tight text-white sm:text-4xl">
                                        {counts.review} hợp đồng đang chờ bạn phản hồi hoặc ký xác nhận.
                                    </h2>
                                    <p className="mt-3 text-sm font-medium leading-7 text-slate-100 sm:text-base">
                                        Ưu tiên các hợp đồng đang chờ duyệt giá hoặc chờ ký từ phía bạn để không làm chậm công bố học kỳ và các đơn hàng phía sau.
                                    </p>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-3 lg:w-[420px]">
                                    <div className="rounded-[22px] border border-white/10 bg-white/8 p-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">Chờ duyệt</p>
                                        <p className="mt-2 text-2xl font-black text-white">{counts.pending}</p>
                                    </div>
                                    <div className="rounded-[22px] border border-white/10 bg-white/8 p-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">Chờ ký</p>
                                        <p className="mt-2 text-2xl font-black text-white">{counts.providerSign}</p>
                                    </div>
                                    <div className="rounded-[22px] border border-white/10 bg-white/8 p-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">Hiệu lực</p>
                                        <p className="mt-2 text-2xl font-black text-white">{counts.active}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <SummaryCard
                                label="Cần phản hồi"
                                value={counts.review}
                                note="Tổng hợp các hợp đồng đang chờ duyệt hoặc chờ ký."
                                icon={<AlertTriangle className="h-5 w-5" />}
                                tone="bg-amber-50 text-amber-600"
                            />
                            <SummaryCard
                                label="Chờ ký số"
                                value={counts.providerSign}
                                note="Mở tài liệu để gửi OTP và hoàn tất chữ ký số."
                                icon={<FileSignature className="h-5 w-5" />}
                                tone="bg-indigo-50 text-indigo-600"
                            />
                            <SummaryCard
                                label="Đang hiệu lực"
                                value={counts.active}
                                note="Các hợp đồng đang sử dụng được cho công việc học kỳ."
                                icon={<ShieldCheck className="h-5 w-5" />}
                                tone="bg-emerald-50 text-emerald-600"
                            />
                            <SummaryCard
                                label="Tổng hợp đồng"
                                value={counts.all}
                                note="Bao gồm cả hợp đồng đã hết hạn hoặc bị từ chối."
                                icon={<FileText className="h-5 w-5" />}
                                tone="bg-blue-50 text-blue-600"
                            />
                        </section>

                        <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Bộ lọc hợp đồng</p>
                                    <h2 className="mt-2 text-2xl font-black text-gray-900">Chọn hàng đợi cần xử lý</h2>
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-black text-indigo-700">
                                    <PenSquare className="h-4 w-4" />
                                    {counts.providerSign} hợp đồng có thể cần ký ngay
                                </div>
                            </div>

                            <div className="mt-6 flex min-w-full gap-3 overflow-x-auto pb-1">
                                {filterTabs.map((tab) => {
                                    const count = tab.value === ""
                                        ? counts.all
                                        : contracts.filter((contract) => contract.status === tab.value).length;
                                    const active = statusFilter === tab.value;

                                    return (
                                        <button
                                            key={tab.value || "all"}
                                            onClick={() => {
                                                preserveResultsHeight();
                                                setStatusFilter(tab.value);
                                            }}
                                            className={`inline-flex min-w-max items-center gap-3 rounded-[18px] border px-4 py-3 transition-all ${
                                                active
                                                    ? "border-violet-200 bg-violet-50 text-violet-700"
                                                    : "border-gray-200 bg-white text-gray-600 hover:border-violet-100 hover:text-gray-900"
                                            }`}
                                        >
                                            <span className="text-sm font-black">{tab.label}</span>
                                            <span className={`inline-flex h-6 min-w-[24px] items-center justify-center rounded-full px-2 text-[11px] font-black ${
                                                active ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-700"
                                            }`}>
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        <div ref={resultsRegionRef} style={preservedHeightStyle}>
                        {loading ? (
                            <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-[32px] border border-gray-200 bg-white shadow-soft-sm">
                                <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
                                <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">Đang đồng bộ hợp đồng...</p>
                            </div>
                        ) : pagedContracts.length === 0 ? (
                            <div className="rounded-[32px] border border-dashed border-gray-300 bg-white p-20 text-center shadow-soft-sm">
                                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] border border-gray-100 bg-violet-50">
                                    <FileText className="h-9 w-9 text-violet-500" />
                                </div>
                                <h2 className="mt-6 text-xl font-black text-gray-900">Không có hợp đồng trong nhóm này</h2>
                                <p className="mt-2 text-sm font-medium text-gray-500">
                                    Thử đổi bộ lọc để xem các hợp đồng ở trạng thái khác.
                                </p>
                            </div>
                        ) : (
                            <section className="space-y-4">
                                {pagedContracts.map((contract) => {
                                    const statusMeta = STATUS_MAP[contract.status];
                                    const needsAction = contract.status === "Pending" || contract.status === "PendingProviderSign";
                                    const canReject = contract.status === "Pending";

                                    return (
                                        <article
                                            key={contract.contractId}
                                            className="w-full rounded-[28px] border border-gray-200 bg-white p-5 shadow-soft-sm transition-all hover:border-violet-200"
                                        >
                                            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_230px] xl:items-start">
                                                <div className="min-w-0 flex-1 break-normal [overflow-wrap:normal]">
                                                    <div className="flex min-w-0 flex-wrap items-center gap-3">
                                                        <h3 className="min-w-0 break-normal text-lg font-black text-gray-900">{contract.contractName}</h3>
                                                        <span className={statusMeta?.badge || "nb-badge"}>{statusMeta?.label || contract.status}</span>
                                                        <span className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-[11px] font-black ${statusMeta?.tone || "bg-slate-100 text-slate-700"}`}>
                                                            Hạn {formatDate(contract.expiresAt)}
                                                        </span>
                                                    </div>

                                                    <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Trường</p>
                                                            <p className="mt-1 text-base font-black text-gray-900">{contract.schoolName || "Chưa xác định"}</p>
                                                            <p className="mt-1 text-sm font-medium text-gray-500">Mã số: {contract.contractNumber || "Chưa có"}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Danh mục mẫu</p>
                                                            <p className="mt-1 text-base font-black text-gray-900">{contract.items.length} mẫu</p>
                                                            <p className="mt-1 text-sm font-medium text-gray-500">Đính kèm trong hợp đồng</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Tạo lúc</p>
                                                            <p className="mt-1 text-base font-black text-gray-900">{formatDate(contract.createdAt)}</p>
                                                            <p className="mt-1 text-sm font-medium text-gray-500">Ngày vào hàng chờ xử lý</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Next step</p>
                                                            <p className="mt-1 text-base font-black text-gray-900">
                                                                {contract.status === "Pending"
                                                                    ? "Duyệt giá"
                                                                    : contract.status === "PendingProviderSign"
                                                                        ? "Ký xác nhận"
                                                                        : contract.status === "PendingSchoolSign"
                                                                            ? "Chờ trường ký"
                                                                            : "Theo dõi hiệu lực"}
                                                            </p>
                                                            <p className="mt-1 text-sm font-medium text-gray-500">
                                                                {needsAction ? "Hợp đồng đang chờ tác vụ từ phía bạn." : "Theo dõi tiến độ và trao đổi khi cần."}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {needsAction ? (
                                                        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-black text-amber-700">
                                                            <AlertTriangle className="h-4 w-4" />
                                                            Hợp đồng này đang cần phản hồi từ phía nhà cung cấp.
                                                        </div>
                                                    ) : null}
                                                </div>

                                                <div className="flex w-full flex-col gap-3 xl:w-[230px] xl:shrink-0">
                                                    <button
                                                        onClick={() => openDetail(contract.contractId)}
                                                        className="inline-flex h-11 items-center justify-center rounded-[16px] bg-violet-600 px-4 text-sm font-black text-white shadow-soft-sm transition-all hover:bg-violet-700"
                                                    >
                                                        Mở vùng xử lý
                                                    </button>
                                                    <button
                                                        onClick={() => openContractTemplate(contract.contractId)}
                                                        className="inline-flex h-11 items-center justify-center rounded-[16px] border border-gray-200 bg-white px-4 text-sm font-black text-gray-700 transition-all hover:border-violet-200 hover:text-violet-700"
                                                    >
                                                        Xem tài liệu
                                                    </button>
                                                    <button
                                                        onClick={() => openContractChat(contract)}
                                                        className="inline-flex h-11 items-center justify-center rounded-[16px] bg-slate-50 px-4 text-sm font-black text-slate-700 transition-all hover:bg-slate-100"
                                                    >
                                                        Chat với trường
                                                    </button>
                                                    <button
                                                        onClick={() => canReject && openDetail(contract.contractId, { reject: true })}
                                                        disabled={!canReject}
                                                        title={canReject ? "Từ chối hợp đồng" : "Chỉ có thể từ chối khi hợp đồng ở trạng thái Chờ duyệt"}
                                                        className={`inline-flex h-11 items-center justify-center rounded-[16px] border px-4 text-sm font-black transition-all ${
                                                            canReject
                                                                ? "border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100"
                                                                : "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
                                                        }`}
                                                    >
                                                        Từ chối
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </section>
                        )}

                        {totalPages > 1 ? (
                            <div className="flex items-center justify-center gap-3">
                                <button disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="nb-btn nb-btn-outline nb-btn-sm text-sm">
                                    ← Trước
                                </button>
                                <span className="text-sm font-bold text-gray-500">{page}/{totalPages}</span>
                                <button disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} className="nb-btn nb-btn-outline nb-btn-sm text-sm">
                                    Sau →
                                </button>
                            </div>
                        ) : null}
                        </div>

                        {showDetail && selected ? (
                            <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4">
                                <div className="w-full max-w-[760px] max-h-[88vh] overflow-auto rounded-[28px] border border-gray-200 bg-white p-6 shadow-soft-xl">
                                    <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Vùng xử lý hợp đồng</p>
                                            <h2 className="mt-2 text-2xl font-black text-gray-900">{selected.contractName}</h2>
                                            <p className="mt-2 text-sm font-medium text-gray-500">
                                                Trường: {selected.schoolName || "Chưa xác định"} · Hạn {formatDate(selected.expiresAt)}
                                            </p>
                                        </div>
                                        <span className={STATUS_MAP[selected.status]?.badge || "nb-badge"}>{STATUS_MAP[selected.status]?.label || selected.status}</span>
                                    </div>

                                    {error ? (
                                        <div className="mt-5 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                                            {error}
                                        </div>
                                    ) : null}

                                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                        <div className="rounded-[18px] border border-gray-200 bg-slate-50 p-4">
                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Ngày tạo</p>
                                            <p className="mt-2 text-sm font-black text-gray-900">{formatDate(selected.createdAt)}</p>
                                        </div>
                                        <div className="rounded-[18px] border border-gray-200 bg-slate-50 p-4">
                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Ngày duyệt</p>
                                            <p className="mt-2 text-sm font-black text-gray-900">{formatDate(selected.approvedAt)}</p>
                                        </div>
                                        <div className="rounded-[18px] border border-gray-200 bg-slate-50 p-4">
                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Trường ký</p>
                                            <p className="mt-2 text-sm font-black text-gray-900">{selected.schoolSignedAt ? formatDate(selected.schoolSignedAt) : "Chưa ký"}</p>
                                        </div>
                                        <div className="rounded-[18px] border border-gray-200 bg-slate-50 p-4">
                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Bạn ký</p>
                                            <p className="mt-2 text-sm font-black text-gray-900">{selected.providerSignedAt ? formatDate(selected.providerSignedAt) : "Chưa ký"}</p>
                                        </div>
                                    </div>

                                    <div className="mt-6">
                                        <h3 className="text-lg font-black text-gray-900">Danh mục mẫu trong hợp đồng</h3>
                                        <div className="mt-4 space-y-3">
                                            {selected.items.map((item) => (
                                                <div key={item.itemId} className="rounded-[20px] border border-gray-200 bg-white p-4 shadow-soft-xs">
                                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                        <div>
                                                            <h4 className="text-base font-black text-gray-900">{item.outfitName}</h4>
                                                            <p className="mt-1 text-sm font-medium text-gray-500">
                                                                Số lượng đề xuất: {item.minQuantity ?? 0} - {item.maxQuantity ?? 0}
                                                            </p>
                                                        </div>
                                                        {selected.status === "Pending" ? (
                                                            <div className="w-full md:w-[240px]">
                                                                <label className="block text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Giá / sản phẩm</label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="1000"
                                                                    value={pricingDraft[item.itemId] ?? ""}
                                                                    onChange={(event) =>
                                                                        setPricingDraft((current) => ({
                                                                            ...current,
                                                                            [item.itemId]: event.target.value,
                                                                        }))
                                                                    }
                                                                    placeholder="Nhập giá"
                                                                    className="nb-input mt-2 w-full"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-gray-900">
                                                                Giá chốt: {(item.pricePerUnit ?? 0).toLocaleString("vi-VN")} ₫
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {selected.rejectionReason ? (
                                        <div className="mt-5 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                                            Lý do từ chối trước đó: {selected.rejectionReason}
                                        </div>
                                    ) : null}

                                    {selected.status === "Pending" && !showReject ? (
                                        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                            <button onClick={() => { setShowReject(true); setError(""); }} className="nb-btn nb-btn-red">
                                                Từ chối
                                            </button>
                                            <button onClick={handleSavePricing} disabled={actionLoading} className="nb-btn nb-btn-outline">
                                                {actionLoading ? "Đang lưu..." : "Lưu giá"}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    openContractTemplate(selected.contractId);
                                                    setShowDetail(false);
                                                    setSelected(null);
                                                }}
                                                className="nb-btn border-gray-200 bg-violet-50"
                                            >
                                                Xem hợp đồng
                                            </button>
                                            <button onClick={handleApprove} disabled={actionLoading} className="nb-btn nb-btn-green">
                                                {actionLoading ? "Đang xử lý..." : "Duyệt hợp đồng"}
                                            </button>
                                        </div>
                                    ) : null}

                                    {showReject ? (
                                        <div className="mt-5 rounded-[22px] border border-rose-200 bg-rose-50 p-4">
                                            <label className="block text-sm font-black text-gray-900">Lý do từ chối</label>
                                            <textarea
                                                value={rejectReason}
                                                onChange={(event) => setRejectReason(event.target.value)}
                                                placeholder="Giải thích rõ lý do để trường có thể chỉnh sửa hoặc trao đổi tiếp."
                                                className="nb-input mt-3 min-h-[96px] w-full resize-y"
                                                maxLength={500}
                                            />
                                            <div className="mt-3 flex gap-3">
                                                <button onClick={() => { setShowReject(false); setRejectReason(""); setError(""); }} className="nb-btn nb-btn-outline flex-1">
                                                    Hủy
                                                </button>
                                                <button onClick={handleReject} disabled={actionLoading} className="nb-btn nb-btn-red flex-1">
                                                    {actionLoading ? "Đang xử lý..." : "Xác nhận từ chối"}
                                                </button>
                                            </div>
                                        </div>
                                    ) : null}

                                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                                        <button
                                            onClick={() => {
                                                setShowDetail(false);
                                                setSelected(null);
                                                setError("");
                                                setShowReject(false);
                                                setRejectReason("");
                                            }}
                                            className="nb-btn nb-btn-outline flex-1"
                                        >
                                            Đóng
                                        </button>
                                        <button onClick={() => openContractChat(selected)} className="nb-btn nb-btn-purple flex-1">
                                            Chat với trường
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        <ChatWidget
                            channelType="contract"
                            channelId={chatContractId}
                            isOpen={chatOpen}
                            onClose={() => setChatOpen(false)}
                            contextInfo={chatContext}
                        />
                    </main>
                </div>
            </div>

            {templateLoading ? (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
                    <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-white px-8 py-5 shadow-soft-md">
                        <div className="h-5 w-5 rounded-full border-4 border-violet-600 border-t-transparent animate-spin" />
                        <span className="font-bold text-gray-900">Đang tải hợp đồng...</span>
                    </div>
                </div>
            ) : null}

            {templateContract && !templateLoading ? (
                <ContractTemplate
                    contract={templateContract}
                    viewerRole="provider"
                    onRequestProviderOTP={handleRequestProviderOTP}
                    onProviderSign={handleProviderSign}
                    onClose={() => setTemplateContract(null)}
                />
            ) : null}
        </div>
    );
}
