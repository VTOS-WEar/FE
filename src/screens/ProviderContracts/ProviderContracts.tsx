import { useCallback, useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    CheckCircle2,
    ChevronDown,
    Eye,
    FileSignature,
    FileText,
    Loader2,
    MessageSquare,
    Search,
    ShieldCheck,
    XCircle,
} from "lucide-react";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { PROVIDER_LIST_PAGE_SIZE, ProviderDataTable, type ProviderDataTableColumn } from "../../components/provider/ProviderDataTable";
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
    Cancelled: { label: "Đã hủy", badge: "nb-badge nb-badge-red", tone: "bg-rose-50 text-rose-700" },
};

const STATUS_FILTER_OPTIONS = [
    { value: "", label: "Tất cả trạng thái" },
    { value: "Pending", label: "Chờ duyệt" },
    { value: "PendingProviderSign", label: "Chờ bạn ký" },
    { value: "PendingSchoolSign", label: "Chờ trường ký" },
    { value: "Active,InUse", label: "Đang hiệu lực" },
    { value: "Fulfilled", label: "Hoàn thành" },
    { value: "Rejected,Expired,Cancelled", label: "Có vấn đề" },
];

function formatDate(value?: string | null) {
    return value ? new Date(value).toLocaleDateString("vi-VN") : "Chưa có";
}

function matchesStatus(status: string, filter: string) {
    if (!filter) return true;
    return filter.split(",").includes(status);
}

function StatusSummaryCard({
    label,
    value,
    icon,
    surfaceClassName,
    iconClassName,
    active,
    onClick,
}: {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    surfaceClassName: string;
    iconClassName: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={`min-h-[100px] rounded-[8px] border p-5 text-left shadow-soft-sm transition-all hover:-translate-y-0.5 hover:shadow-soft-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-100 ${
                active ? "border-violet-500 ring-2 ring-violet-200" : "border-white/70"
            } ${surfaceClassName}`}
        >
            <div className="flex h-full items-center gap-4">
                <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-white shadow-soft-xs ${iconClassName}`}>
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700">{label}</p>
                    <p className="mt-2 text-2xl font-bold leading-none text-slate-950">{value}</p>
                </div>
            </div>
        </button>
    );
}

export function ProviderContracts() {
    const sidebarConfig = useProviderSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [contracts, setContracts] = useState<ContractDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
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

    const fetchContracts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getProviderContracts();
            setContracts(data);
        } catch (e) {
            console.error("Error fetching contracts:", e);
        } finally {
            setLoading(false);
        }
    }, []);

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

    const counts = useMemo(() => {
        const valueOf = (status: string[]) => contracts.filter((contract) => status.includes(contract.status)).length;
        return {
            all: contracts.length,
            pending: valueOf(["Pending"]),
            providerSign: valueOf(["PendingProviderSign"]),
            active: valueOf(["Active", "InUse"]),
            fulfilled: valueOf(["Fulfilled"]),
            issue: valueOf(["Rejected", "Expired", "Cancelled"]),
        };
    }, [contracts]);

    const displayedContracts = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return contracts.filter((contract) => {
            if (!matchesStatus(contract.status, statusFilter)) return false;
            if (!normalizedSearch) return true;

            const statusLabel = STATUS_MAP[contract.status]?.label || contract.status;
            return [
                contract.contractName,
                contract.contractNumber,
                contract.schoolName,
                statusLabel,
                ...contract.items.map((item) => item.outfitName),
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(normalizedSearch));
        });
    }, [contracts, searchTerm, statusFilter]);
    const totalPages = Math.max(1, Math.ceil(displayedContracts.length / PROVIDER_LIST_PAGE_SIZE));
    const pagedContracts = displayedContracts.slice((page - 1) * PROVIDER_LIST_PAGE_SIZE, page * PROVIDER_LIST_PAGE_SIZE);
    const isFilteredEmptyState = !loading && (!!statusFilter || !!searchTerm.trim()) && pagedContracts.length === 0;
    const { preserveResultsHeight, preservedHeightStyle, resultsRegionRef } = usePreservedResultsHeight(isFilteredEmptyState);

    const handleStatusChange = (nextStatus: string) => {
        preserveResultsHeight();
        setStatusFilter(nextStatus);
        setPage(1);
    };

    const handleSummaryCardClick = (nextStatus: string) => {
        preserveResultsHeight();
        setStatusFilter(nextStatus);
        setSearchTerm("");
        setPage(1);
    };

    const statusSummaryCards = useMemo(
        () => [
            {
                label: "Tổng hợp đồng",
                value: counts.all,
                filterValue: "",
                surfaceClassName: "bg-blue-100",
                iconClassName: "text-slate-900",
                icon: <FileText className="h-6 w-6" />,
            },
            {
                label: "Cần duyệt giá",
                value: counts.pending,
                filterValue: "Pending",
                surfaceClassName: "bg-yellow-100",
                iconClassName: "text-slate-900",
                icon: <AlertTriangle className="h-6 w-6" />,
            },
            {
                label: "Chờ bạn ký",
                value: counts.providerSign,
                filterValue: "PendingProviderSign",
                surfaceClassName: "bg-indigo-100",
                iconClassName: "text-slate-900",
                icon: <FileSignature className="h-6 w-6" />,
            },
            {
                label: "Đang hiệu lực",
                value: counts.active,
                filterValue: "Active,InUse",
                surfaceClassName: "bg-lime-200",
                iconClassName: "text-slate-900",
                icon: <ShieldCheck className="h-6 w-6" />,
            },
            {
                label: "Hoàn thành",
                value: counts.fulfilled,
                filterValue: "Fulfilled",
                surfaceClassName: "bg-teal-100",
                iconClassName: "text-slate-900",
                icon: <CheckCircle2 className="h-6 w-6" />,
            },
            {
                label: "Có vấn đề",
                value: counts.issue,
                filterValue: "Rejected,Expired,Cancelled",
                surfaceClassName: "bg-rose-100",
                iconClassName: "text-slate-900",
                icon: <XCircle className="h-6 w-6" />,
            },
        ],
        [counts],
    );

    const contractColumns: ProviderDataTableColumn<ContractDto>[] = [
        {
            key: "name",
            header: "Hợp đồng",
            render: (contract) => (
                <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{contract.contractName}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">{contract.contractNumber || "Chưa có mã"}</p>
                </div>
            ),
        },
        {
            key: "school",
            header: "Trường",
            render: (contract) => <span className="font-medium text-slate-800">{contract.schoolName || "Chưa xác định"}</span>,
        },
        {
            key: "items",
            header: "Mẫu",
            render: (contract) => <span className="font-medium">{contract.items.length} mẫu</span>,
        },
        {
            key: "status",
            header: "Trạng thái",
            render: (contract) => {
                const statusMeta = STATUS_MAP[contract.status];
                return <span className={statusMeta?.badge || "nb-badge"}>{statusMeta?.label || contract.status}</span>;
            },
        },
        {
            key: "created",
            header: "Ngày tạo",
            render: (contract) => <span className="whitespace-nowrap font-medium text-slate-600">{formatDate(contract.createdAt)}</span>,
        },
        {
            key: "expires",
            header: "Hạn",
            render: (contract) => <span className="whitespace-nowrap font-medium text-slate-600">{formatDate(contract.expiresAt)}</span>,
        },
        {
            key: "action",
            header: "Action",
            className: "text-right",
            render: (contract) => {
                const canReject = contract.status === "Pending";

                return (
                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                openDetail(contract.contractId);
                            }}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-slate-200 bg-white text-slate-700 transition-colors hover:border-violet-200 hover:text-violet-700"
                            aria-label="Mở vùng xử lý hợp đồng"
                        >
                            <Eye className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                openContractTemplate(contract.contractId);
                            }}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-slate-200 bg-white text-slate-700 transition-colors hover:border-violet-200 hover:text-violet-700"
                            aria-label="Xem tài liệu hợp đồng"
                        >
                            <FileText className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                openContractChat(contract);
                            }}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-slate-200 bg-white text-slate-700 transition-colors hover:border-violet-200 hover:text-violet-700"
                            aria-label="Chat với trường"
                        >
                            <MessageSquare className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                if (canReject) openDetail(contract.contractId, { reject: true });
                            }}
                            disabled={!canReject}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-rose-100 bg-rose-50 text-rose-600 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-300"
                            aria-label="Từ chối hợp đồng"
                        >
                            <XCircle className="h-4 w-4" />
                        </button>
                    </div>
                );
            },
        },
    ];

    useEffect(() => {
        setPage(1);
    }, [searchTerm, statusFilter]);

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} />
                </div>

                <div className="flex-1 min-w-0">
                    <TopNavBar>
                        <div className="flex items-center gap-3 px-2 py-2">
                            <div className="hidden h-10 w-10 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-soft-sm sm:flex">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold leading-none text-gray-900">Điều phối hợp đồng</h1>
                            </div>
                        </div>
                    </TopNavBar>

                    <main className="space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        <section className="space-y-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-950">Tổng quan hợp đồng</h2>
                                    <p className="mt-1 text-sm font-medium text-slate-500">
                                        Cần xử lý: <span className="font-semibold text-slate-900">{counts.pending + counts.providerSign}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                                {statusSummaryCards.map((card) => (
                                    <StatusSummaryCard
                                        key={card.label}
                                        {...card}
                                        active={statusFilter === card.filterValue}
                                        onClick={() => handleSummaryCardClick(card.filterValue)}
                                    />
                                ))}
                            </div>
                        </section>

                        <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <label className="relative block w-full lg:max-w-[300px]">
                                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                <input
                                    value={searchTerm}
                                    onChange={(event) => {
                                        preserveResultsHeight();
                                        setSearchTerm(event.target.value);
                                    }}
                                    placeholder="Search..."
                                    className="h-10 w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-800 outline-none shadow-soft-xs transition-colors placeholder:text-slate-500 focus:border-violet-200 focus:ring-4 focus:ring-violet-50"
                                />
                            </label>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                                <label className="relative block">
                                    <select
                                        value={statusFilter}
                                        onChange={(event) => handleStatusChange(event.target.value)}
                                        className="h-10 min-w-[178px] appearance-none rounded-full border border-slate-200 bg-white py-0 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none shadow-soft-xs transition-colors focus:border-violet-200 focus:ring-4 focus:ring-violet-50"
                                    >
                                        {STATUS_FILTER_OPTIONS.map((option) => (
                                            <option key={option.value || "all"} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-900" />
                                </label>
                            </div>
                        </section>

                        <div ref={resultsRegionRef} style={preservedHeightStyle}>
                        {loading ? (
                            <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-[32px] border border-gray-200 bg-white shadow-soft-sm">
                                <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Đang đồng bộ hợp đồng...</p>
                            </div>
                        ) : pagedContracts.length === 0 ? (
                            <div className="rounded-[32px] border border-dashed border-gray-300 bg-white p-20 text-center shadow-soft-sm">
                                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] border border-gray-100 bg-violet-50">
                                    <FileText className="h-9 w-9 text-violet-500" />
                                </div>
                                <h2 className="mt-6 text-xl font-bold text-gray-900">Không có hợp đồng trong nhóm này</h2>
                            </div>
                        ) : (
                            <ProviderDataTable
                                items={pagedContracts}
                                columns={contractColumns}
                                getKey={(contract) => contract.contractId}
                                onRowClick={(contract) => openDetail(contract.contractId)}
                            />
                        )}

                        {totalPages > 1 ? (
                            <div className="flex items-center justify-center gap-3">
                                <button disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="nb-btn nb-btn-outline nb-btn-sm text-sm">
                                    ← Trước
                                </button>
                                <span className="text-sm font-medium text-gray-500">{page}/{totalPages}</span>
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
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Vùng xử lý hợp đồng</p>
                                            <h2 className="mt-2 text-2xl font-bold text-gray-900">{selected.contractName}</h2>
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
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">Ngày tạo</p>
                                            <p className="mt-2 text-sm font-semibold text-gray-900">{formatDate(selected.createdAt)}</p>
                                        </div>
                                        <div className="rounded-[18px] border border-gray-200 bg-slate-50 p-4">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">Ngày duyệt</p>
                                            <p className="mt-2 text-sm font-semibold text-gray-900">{formatDate(selected.approvedAt)}</p>
                                        </div>
                                        <div className="rounded-[18px] border border-gray-200 bg-slate-50 p-4">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">Trường ký</p>
                                            <p className="mt-2 text-sm font-semibold text-gray-900">{selected.schoolSignedAt ? formatDate(selected.schoolSignedAt) : "Chưa ký"}</p>
                                        </div>
                                        <div className="rounded-[18px] border border-gray-200 bg-slate-50 p-4">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">Bạn ký</p>
                                            <p className="mt-2 text-sm font-semibold text-gray-900">{selected.providerSignedAt ? formatDate(selected.providerSignedAt) : "Chưa ký"}</p>
                                        </div>
                                    </div>

                                    <div className="mt-6">
                                        <h3 className="text-lg font-bold text-gray-900">Danh mục mẫu trong hợp đồng</h3>
                                        <div className="mt-4 space-y-3">
                                            {selected.items.map((item) => (
                                                <div key={item.itemId} className="rounded-[20px] border border-gray-200 bg-white p-4 shadow-soft-xs">
                                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                        <div>
                                                            <h4 className="text-base font-semibold text-gray-900">{item.outfitName}</h4>
                                                            <p className="mt-1 text-sm font-medium text-gray-500">
                                                                Số lượng đề xuất: {item.minQuantity ?? 0} - {item.maxQuantity ?? 0}
                                                            </p>
                                                        </div>
                                                        {selected.status === "Pending" ? (
                                                            <div className="w-full md:w-[240px]">
                                                                <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">Giá / sản phẩm</label>
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
                                                                    className="nb-input mt-2 w-full"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-gray-900">
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
                                            <label className="block text-sm font-semibold text-gray-900">Lý do từ chối</label>
                                            <textarea
                                                value={rejectReason}
                                                onChange={(event) => setRejectReason(event.target.value)}
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
