import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    AlertTriangle,
    CalendarClock,
    CalendarRange,
    CheckCircle2,
    ChevronDown,
    ClipboardCheck,
    Eye,
    FileSignature,
    FileText,
    Loader2,
    MessageSquare,
    Search,
    ShieldCheck,
    Signature,
    Users2,
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
    type ContractDto,
    type ContractListSummary,
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

const MIN_FILTER_FEEDBACK_MS = 450;

function formatDate(value?: string | null) {
    return value ? new Date(value).toLocaleDateString("vi-VN") : "Chưa có";
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
    const [statusInput, setStatusInput] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [filtering, setFiltering] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [counts, setCounts] = useState({
        all: 0,
        pending: 0,
        providerSign: 0,
        active: 0,
        fulfilled: 0,
        issue: 0,
    });
    const [selected, setSelected] = useState<ContractDto | null>(null);
    const [showDetail, setShowDetail] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [showReject, setShowReject] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [error, setError] = useState("");
    const [templateContract, setTemplateContract] = useState<ContractTemplateData | null>(null);
    const [templateLoading, setTemplateLoading] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);
    const [chatContractId, setChatContractId] = useState("");
    const [chatContext, setChatContext] = useState<ChatContextInfo | undefined>();
    const filterTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

    const fetchContracts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getProviderContracts({
                page,
                pageSize: PROVIDER_LIST_PAGE_SIZE,
                status: statusFilter || undefined,
                search: searchTerm || undefined,
            });
            const nextTotalPages = Math.max(1, data.totalPages);
            const summary: ContractListSummary = data.summary;
            setContracts(data.items);
            setTotalPages(nextTotalPages);
            setCounts({
                all: summary.total,
                pending: summary.pending ?? summary.waitingSchool,
                providerSign: summary.waitingProvider,
                active: summary.active,
                fulfilled: summary.fulfilled,
                issue: summary.issue,
            });
            if (page > nextTotalPages) {
                setPage(nextTotalPages);
            }
        } catch (e) {
            console.error("Error fetching contracts:", e);
            setContracts([]);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    }, [page, searchTerm, statusFilter]);

    useEffect(() => {
        fetchContracts();
    }, [fetchContracts]);

    useEffect(() => {
        return () => {
            if (filterTimerRef.current) {
                window.clearTimeout(filterTimerRef.current);
            }
        };
    }, []);

    const openDetail = async (id: string, options?: { reject?: boolean }) => {
        try {
            const contract = await getProviderContractDetail(id);
            setSelected(contract);
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

    const isFilteredEmptyState = !loading && (!!statusFilter || !!searchTerm.trim()) && contracts.length === 0;
    const { preserveResultsHeight, preservedHeightStyle, resultsRegionRef } = usePreservedResultsHeight(isFilteredEmptyState);

    const scheduleFilterCommit = useCallback(
        (next: { search: string; status: string }) => {
            preserveResultsHeight();
            setFiltering(true);
            if (filterTimerRef.current) {
                window.clearTimeout(filterTimerRef.current);
            }
            filterTimerRef.current = window.setTimeout(() => {
                setSearchTerm(next.search);
                setStatusFilter(next.status);
                setPage(1);
                setFiltering(false);
                filterTimerRef.current = null;
            }, MIN_FILTER_FEEDBACK_MS);
        },
        [preserveResultsHeight],
    );

    const handleStatusChange = (nextStatus: string) => {
        setStatusInput(nextStatus);
        scheduleFilterCommit({ search: searchInput, status: nextStatus });
    };

    const handleSummaryCardClick = (nextStatus: string) => {
        setStatusInput(nextStatus);
        setSearchInput("");
        scheduleFilterCommit({ search: "", status: nextStatus });
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

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} />
                </div>

                <div className="flex-1 min-w-0">
                    <TopNavBar>
                        <div className="flex items-center gap-3 px-2 py-2">
                            <div className="hidden h-10 w-10 items-center justify-center rounded-2xl bg-[#3B82F6] text-white shadow-soft-sm sm:flex">
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
                                        active={statusInput === card.filterValue}
                                        onClick={() => handleSummaryCardClick(card.filterValue)}
                                    />
                                ))}
                            </div>
                        </section>

                        <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <label className="relative block w-full lg:max-w-[300px]">
                                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                <input
                                    value={searchInput}
                                    onChange={(event) => {
                                        const nextSearch = event.target.value;
                                        setSearchInput(nextSearch);
                                        scheduleFilterCommit({ search: nextSearch, status: statusInput });
                                    }}
                                    placeholder="Search..."
                                    className="h-10 w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-800 outline-none shadow-soft-xs transition-colors placeholder:text-slate-500 focus:border-violet-200 focus:ring-4 focus:ring-violet-50"
                                />
                            </label>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                                {filtering ? (
                                    <div className="inline-flex h-10 items-center gap-2 rounded-full border border-blue-100 bg-white px-3 text-xs font-bold text-blue-700 shadow-soft-xs">
                                        <Loader2 className="h-4 w-4 animate-spin text-[#3B82F6]" />
                                        Đang tải
                                    </div>
                                ) : null}
                                <label className="relative block">
                                    <select
                                        value={statusInput}
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
                                <Loader2 className="h-10 w-10 animate-spin text-[#3B82F6]" />
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Đang đồng bộ hợp đồng...</p>
                            </div>
                        ) : contracts.length === 0 ? (
                            <div className="rounded-[32px] border border-dashed border-gray-300 bg-white p-20 text-center shadow-soft-sm">
                                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] border border-gray-100 bg-violet-50">
                                    <FileText className="h-9 w-9 text-violet-500" />
                                </div>
                                <h2 className="mt-6 text-xl font-bold text-gray-900">Không có hợp đồng trong nhóm này</h2>
                            </div>
                        ) : (
                            <ProviderDataTable
                                items={contracts}
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
                            <div
                                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                                onClick={() => {
                                    setShowDetail(false);
                                    setSelected(null);
                                    setError("");
                                    setShowReject(false);
                                    setRejectReason("");
                                }}
                            >
                                <div
                                    className="max-h-[90vh] w-full max-w-[960px] overflow-auto rounded-[8px] border border-gray-200 bg-white shadow-soft-lg"
                                    onClick={(event) => event.stopPropagation()}
                                >
                                    <div className="border-b border-gray-200 bg-white px-6 py-6 lg:px-8">
                                        <div className="flex flex-col gap-4">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className={STATUS_MAP[selected.status]?.badge || "nb-badge"}>{STATUS_MAP[selected.status]?.label || selected.status}</span>
                                                    {selected.schoolSignedAt ? (
                                                        <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-bold text-emerald-700 shadow-soft-sm">
                                                            Trường đã ký
                                                        </span>
                                                    ) : null}
                                                    {selected.providerSignedAt ? (
                                                        <span className="rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-bold text-indigo-700 shadow-soft-sm">
                                                            NCC đã ký
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <h2 className="mt-4 text-[26px] font-bold leading-tight text-gray-900 lg:text-[32px]">
                                                    {selected.contractName}
                                                </h2>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6 px-6 py-6 lg:px-8">

                                    {error ? (
                                        <div className="mt-5 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                                            {error}
                                        </div>
                                    ) : null}

                                    <section className="rounded-[8px] border border-gray-200 bg-white p-5 shadow-soft-sm">
                                        <h3 className="text-lg font-bold text-gray-900">Thông tin hợp đồng</h3>
                                        <div className="mt-4 grid gap-x-8 gap-y-1 md:grid-cols-2">
                                            {[
                                                {
                                                    label: "Trường",
                                                    value: selected.schoolName || "Chưa xác định",
                                                    icon: <Users2 className="h-4 w-4" />,
                                                },
                                                {
                                                    label: "Ngày tạo",
                                                    value: formatDate(selected.createdAt),
                                                    icon: <CalendarRange className="h-4 w-4" />,
                                                },
                                                {
                                                    label: "Hết hạn",
                                                    value: formatDate(selected.expiresAt),
                                                    icon: <CalendarClock className="h-4 w-4" />,
                                                },
                                                {
                                                    label: "Tình trạng ký",
                                                    value: `${selected.schoolSignedAt ? "Trường đã ký" : "Trường chưa ký"} · ${selected.providerSignedAt ? "NCC đã ký" : "NCC chưa ký"}`,
                                                    icon: <Signature className="h-4 w-4" />,
                                                },
                                            ].map((item) => (
                                                <div key={item.label} className="flex items-start gap-3 border-b border-gray-100 py-4 last:border-b-0 md:[&:nth-last-child(-n+2)]:border-b-0">
                                                    <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-700">
                                                        {item.icon}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{item.label}</p>
                                                        <p className="mt-1 break-words text-sm font-bold leading-6 text-gray-900">{item.value}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="rounded-[8px] border border-gray-200 bg-white shadow-soft-sm">
                                        <div className="border-b border-gray-200 px-6 py-5">
                                            <h3 className="text-lg font-bold text-gray-900">Mẫu đồng phục đính kèm</h3>
                                        </div>
                                        <div className="space-y-3 px-6 py-6">
                                            {selected.items.map((item) => (
                                                <div key={item.itemId} className="flex flex-col gap-3 rounded-[8px] border border-gray-200 bg-white p-3 shadow-soft-sm md:flex-row md:items-center md:justify-between">
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-[8px] border border-gray-200 bg-slate-50 shadow-soft-xs">
                                                            {item.mainImageURL ? (
                                                                <img src={item.mainImageURL} alt={item.outfitName} className="h-full w-full object-cover" />
                                                            ) : (
                                                                <div className="flex h-full w-full items-center justify-center bg-violet-50 text-violet-700">
                                                                    <ClipboardCheck className="h-5 w-5" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-bold text-gray-900">{item.outfitName}</p>
                                                            <p className="mt-1 text-xs font-semibold text-gray-500">
                                                                Giá và chất liệu quản lý tại Catalog cung ứng
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="rounded-[8px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
                                                        Quản lý sau ký tại Catalog
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    {selected.rejectionReason ? (
                                        <section className="rounded-[8px] border border-rose-200 bg-rose-50 p-5 shadow-soft-sm">
                                            <div className="flex items-start gap-3">
                                                <div className="rounded-full bg-white p-3 text-rose-700 shadow-soft-sm">
                                                    <XCircle className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900">Lý do từ chối</h3>
                                                    <p className="mt-1 text-sm font-medium leading-6 text-rose-700">{selected.rejectionReason}</p>
                                                </div>
                                            </div>
                                        </section>
                                    ) : null}

                                    {selected.status === "Pending" && !showReject ? (
                                        <section className="rounded-[8px] border border-amber-200 bg-amber-50 p-5 shadow-soft-sm">
                                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                                <div className="flex items-start gap-3">
                                                    <div className="rounded-full bg-white p-3 text-amber-700 shadow-soft-sm">
                                                        <ShieldCheck className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-gray-900">Thao tác của nhà cung cấp</h3>
                                                        <p className="mt-1 text-sm font-semibold text-amber-800">
                                                            Kiểm tra danh mục mẫu trước khi duyệt hoặc từ chối hợp đồng.
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="grid w-full gap-3 sm:grid-cols-2 md:w-auto">
                                                    <button onClick={() => { setShowReject(true); setError(""); }} className="nb-btn nb-btn-red text-sm">
                                                        Từ chối
                                                    </button>
                                                    <button onClick={handleApprove} disabled={actionLoading} className="nb-btn nb-btn-green text-sm">
                                                        {actionLoading ? "Đang xử lý..." : "Duyệt hợp đồng"}
                                                    </button>
                                                </div>
                                            </div>
                                        </section>
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

                                    <div className="flex flex-wrap justify-end gap-3 border-t border-gray-200 pt-2">
                                        <button
                                            onClick={() => {
                                                setShowDetail(false);
                                                setSelected(null);
                                                setError("");
                                                setShowReject(false);
                                                setRejectReason("");
                                            }}
                                            className="nb-btn nb-btn-outline text-sm"
                                        >
                                            Đóng
                                        </button>
                                        <button onClick={() => openContractChat(selected)} className="nb-btn nb-btn-outline text-sm">
                                            <MessageSquare className="h-4 w-4" />
                                            Chat
                                        </button>
                                        <button
                                            onClick={() => {
                                                openContractTemplate(selected.contractId);
                                                setShowDetail(false);
                                                setSelected(null);
                                            }}
                                            className="nb-btn nb-btn-provider text-sm"
                                        >
                                            Xem & ký hợp đồng
                                        </button>
                                    </div>
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
                        <div className="h-5 w-5 rounded-full border-4 border-[#3B82F6] border-t-transparent animate-spin" />
                        <span className="font-bold text-blue-700">Đang tải hợp đồng...</span>
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
