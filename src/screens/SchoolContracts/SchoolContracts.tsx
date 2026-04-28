import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowRight,
    CalendarClock,
    CalendarRange,
    CheckCircle2,
    ClipboardCheck,
    ChevronDown,
    FilePenLine,
    MessageCircle,
    Plus,
    Search,
    ShieldCheck,
    Signature,
    Users2,
    XCircle,
} from "lucide-react";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { SCHOOL_THEME } from "../../constants/schoolTheme";
import { usePreservedResultsHeight } from "../../hooks/usePreservedResultsHeight";
import { useSidebarConfig } from "../../hooks/useSidebarConfig";
import { ChatWidget, type ChatContextInfo } from "../../components/ChatWidget/ChatWidget";
import {
    createContract,
    cancelSchoolContract,
    getSchoolContractDetail,
    getSchoolContracts,
    requestSchoolSignOTP,
    signSchoolContract,
    type ContractDto,
    type CreateContractItemRequest,
    type CreateContractRequest,
} from "../../lib/api/contracts";
import { ContractTemplate, type ContractTemplateData } from "../../components/ContractTemplate";
import { getSchoolProfile } from "../../lib/api/schools";

type ProviderOption = { id: string; name: string };
type OutfitOption = { id: string; name: string };

const STATUS_BADGE: Record<string, string> = {
    Pending: "nb-badge nb-badge-yellow",
    PendingSchoolSign: "nb-badge bg-amber-50 text-amber-800 border border-amber-200",
    PendingProviderSign: "nb-badge bg-indigo-50 text-indigo-700 border border-indigo-200",
    Active: "nb-badge bg-emerald-50 text-emerald-700 border border-emerald-200",
    InUse: "nb-badge bg-sky-50 text-sky-700 border border-sky-200",
    Fulfilled: "nb-badge bg-emerald-50 text-emerald-700 border border-emerald-200",
    Rejected: "nb-badge nb-badge-red",
    Expired: "nb-badge bg-slate-100 text-slate-600 border border-slate-200",
    Cancelled: "nb-badge bg-rose-50 text-rose-700 border border-rose-200",
};

const STATUS_LABELS: Record<string, string> = {
    Pending: "Chờ duyệt",
    PendingSchoolSign: "Chờ trường ký",
    PendingProviderSign: "Chờ nhà cung cấp ký",
    Active: "Đang hiệu lực",
    InUse: "Đang dùng",
    Fulfilled: "Hoàn thành",
    Rejected: "Từ chối",
    Expired: "Hết hạn",
    Cancelled: "Đã hủy",
};

const STATUS_COLORS: Record<string, string> = {
    Pending: "#d97706",
    PendingSchoolSign: "#92400e",
    PendingProviderSign: "#4338ca",
    Active: "#059669",
    InUse: "#0284c7",
    Fulfilled: "#059669",
    Rejected: "#dc2626",
    Expired: "#64748b",
    Cancelled: "#e11d48",
};

const FILTER_TABS = [
    { key: "", label: "Tất cả" },
    { key: "Pending", label: "Chờ duyệt" },
    { key: "PendingSchoolSign", label: "Chờ trường ký" },
    { key: "PendingProviderSign", label: "Chờ NCC ký" },
    { key: "Active", label: "Đang hiệu lực" },
    { key: "InUse", label: "Đang dùng" },
    { key: "Fulfilled", label: "Hoàn thành" },
    { key: "Rejected", label: "Từ chối" },
    { key: "Expired", label: "Hết hạn" },
    { key: "Cancelled", label: "Đã hủy" },
] as const;

const MIN_FILTER_FEEDBACK_MS = 700;
const CONTRACT_TABLE_GRID_CLASS = "lg:grid-cols-[1.35fr_1fr_190px_0.8fr_152px]";

function formatDate(value?: string | null) {
    if (!value) return "Chưa có";
    return new Date(value).toLocaleDateString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function getDaysRemaining(value: string) {
    const diff = new Date(value).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function SummaryCard({
    label,
    value,
    tone,
}: {
    label: string;
    value: number;
    tone: "school" | "amber" | "cyan" | "green";
}) {
    const toneClass =
        tone === "amber"
            ? SCHOOL_THEME.summary.cyan
            : tone === "cyan"
              ? SCHOOL_THEME.summary.slate
              : tone === "green"
                ? SCHOOL_THEME.summary.mint
                : SCHOOL_THEME.summary.school;

    return (
        <div className={`min-h-[112px] rounded-[8px] border p-5 shadow-soft-sm ${toneClass}`}>
            <p className="text-sm font-semibold text-slate-700">{label}</p>
            <p className="mt-2 text-2xl font-bold leading-tight text-slate-950">{value}</p>
        </div>
    );
}

function ContractRow({
    contract,
    onOpen,
    onViewDocument,
    onOpenChat,
    onCancel,
    cancelling,
}: {
    contract: ContractDto;
    onOpen: () => void;
    onViewDocument: () => void;
    onOpenChat: () => void;
    onCancel: () => void;
    cancelling: boolean;
}) {
    const daysRemaining = getDaysRemaining(contract.expiresAt);
    const expiresSoon = (contract.status === "Active" || contract.status === "InUse") && daysRemaining >= 0 && daysRemaining <= 14;
    const canCancel = contract.status === "Pending";
    const timelineLabel = daysRemaining >= 0 ? `Còn khoảng ${daysRemaining} ngày` : "Đã quá hạn, cần rà soát trạng thái";

    return (
        <div
            onClick={onOpen}
            className={`group grid cursor-pointer gap-4 px-5 py-4 transition-colors hover:bg-blue-50/50 lg:items-center ${CONTRACT_TABLE_GRID_CLASS}`}
        >
            <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate text-sm font-bold text-slate-950 transition-colors group-hover:text-[#2563EB]">
                        {contract.contractName}
                    </p>
                    {expiresSoon ? (
                        <span className="hidden flex-shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 xl:inline-flex">
                            Sắp hết hạn
                        </span>
                    ) : null}
                </div>
                <p className="mt-1 line-clamp-1 text-xs font-medium text-slate-500">
                    {contract.contractNumber ? `#${contract.contractNumber}` : "Chưa có số hợp đồng"}
                </p>
            </div>

            <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">{contract.providerName || "Chưa xác định"}</p>
                <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-500">{contract.items.length} mẫu đính kèm</p>
            </div>

            <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">{formatDate(contract.expiresAt)}</p>
                <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-500">{timelineLabel}</p>
            </div>

            <span className={`inline-flex w-fit ${STATUS_BADGE[contract.status] || "nb-badge"}`}>
                {STATUS_LABELS[contract.status] || contract.status}
            </span>

            <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
                <button type="button" onClick={onViewDocument} className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-slate-700 transition-colors hover:bg-blue-50 hover:text-[#2563EB]" aria-label="Xem hợp đồng">
                    <FilePenLine className="h-4 w-4" />
                </button>
                <button type="button" onClick={onOpenChat} className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-slate-700 transition-colors hover:bg-blue-50 hover:text-[#2563EB]" aria-label="Chat">
                    <MessageCircle className="h-4 w-4" />
                </button>
                {canCancel ? (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={cancelling}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-slate-700 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        aria-label="Hủy"
                    >
                        <XCircle className="h-4 w-4" />
                    </button>
                ) : null}
                <button type="button" onClick={onOpen} className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-slate-700 transition-colors hover:bg-blue-50 hover:text-[#2563EB]" aria-label="Mở">
                    <ArrowRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

function ContractTableSkeleton() {
    return (
        <div className="overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-soft-sm">
            <div className={`hidden items-center gap-4 border-b border-gray-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-950 lg:grid ${CONTRACT_TABLE_GRID_CLASS}`}>
                <span>Hợp đồng</span>
                <span>Nhà cung cấp</span>
                <span>Hết hạn</span>
                <span>Trạng thái</span>
                <span>Thao tác</span>
            </div>
            {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className={`grid gap-4 border-b border-gray-100 px-5 py-4 last:border-b-0 lg:items-center ${CONTRACT_TABLE_GRID_CLASS}`}>
                    <div className="space-y-2">
                        <div className="nb-skeleton h-5 w-48 rounded-full" />
                        <div className="nb-skeleton h-4 w-40 rounded-full" />
                    </div>
                    <div className="space-y-2">
                        <div className="nb-skeleton h-4 w-40 rounded-full" />
                        <div className="nb-skeleton h-3 w-28 rounded-full" />
                    </div>
                    <div className="space-y-2">
                        <div className="nb-skeleton h-4 w-28 rounded-full" />
                        <div className="nb-skeleton h-3 w-32 rounded-full" />
                    </div>
                    <div className="nb-skeleton h-6 w-24 rounded-full" />
                    <div className="nb-skeleton h-8 w-32 rounded-[8px]" />
                </div>
            ))}
        </div>
    );
}

function ContractTable({
    items,
    onOpen,
    onViewDocument,
    onOpenChat,
    onCancel,
    cancelling,
}: {
    items: ContractDto[];
    onOpen: (contract: ContractDto) => void;
    onViewDocument: (contract: ContractDto) => void;
    onOpenChat: (contract: ContractDto) => void;
    onCancel: (contract: ContractDto) => void;
    cancelling: string | null;
}) {
    return (
        <section className="overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-soft-sm">
            <div className={`hidden items-center gap-4 border-b border-gray-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-950 lg:grid ${CONTRACT_TABLE_GRID_CLASS}`}>
                <span>Hợp đồng</span>
                <span>Nhà cung cấp</span>
                <span>Hết hạn</span>
                <span>Trạng thái</span>
                <span>Thao tác</span>
            </div>
            <div className="divide-y divide-gray-100">
                {items.map((contract) => (
                    <ContractRow
                        key={contract.contractId}
                        contract={contract}
                        onOpen={() => onOpen(contract)}
                        onViewDocument={() => onViewDocument(contract)}
                        onOpenChat={() => onOpenChat(contract)}
                        onCancel={() => onCancel(contract)}
                        cancelling={cancelling === contract.contractId}
                    />
                ))}
            </div>
        </section>
    );
}

export function SchoolContracts() {
    const navigate = useNavigate();
    const sidebarConfig = useSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [schoolName, setSchoolName] = useState("");

    const [contracts, setContracts] = useState<ContractDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusInput, setStatusInput] = useState<(typeof FILTER_TABS)[number]["key"]>("");
    const [statusFilter, setStatusFilter] = useState<(typeof FILTER_TABS)[number]["key"]>("");
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [filtering, setFiltering] = useState(false);
    const [page, setPage] = useState(1);
    const pageSize = 9;
    const filterTimerRef = useRef<number | null>(null);

    const [showCreate, setShowCreate] = useState(false);
    const [providers, setProviders] = useState<ProviderOption[]>([]);
    const [outfits, setOutfits] = useState<OutfitOption[]>([]);
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const [contractName, setContractName] = useState("");
    const [selectedProvider, setSelectedProvider] = useState("");
    const [items, setItems] = useState<CreateContractItemRequest[]>([{ outfitId: "" }]);
    const [expiresAt, setExpiresAt] = useState("");
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");
    const [cancelling, setCancelling] = useState<string | null>(null);

    const [chatOpen, setChatOpen] = useState(false);
    const [chatContractId, setChatContractId] = useState("");
    const [chatContext, setChatContext] = useState<ChatContextInfo | undefined>();

    const [templateContract, setTemplateContract] = useState<ContractTemplateData | null>(null);
    const [templateLoading, setTemplateLoading] = useState(false);

    const [selected, setSelected] = useState<ContractDto | null>(null);
    const [showDetail, setShowDetail] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);

    const showFeedback = useCallback((message: string, type: "success" | "error") => {
        setFeedback({ message, type });
        window.setTimeout(() => setFeedback(null), 3500);
    }, []);

    useEffect(() => {
        getSchoolProfile()
            .then((profile) => setSchoolName(profile.schoolName || ""))
            .catch(() => undefined);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    const fetchContracts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getSchoolContracts();
            setContracts(data);
        } catch (e) {
            console.error(e);
            showFeedback("Không thể tải danh sách hợp đồng.", "error");
        } finally {
            setLoading(false);
        }
    }, [showFeedback]);

    useEffect(() => {
        fetchContracts();
    }, [fetchContracts]);

    useEffect(() => () => {
        if (filterTimerRef.current !== null) {
            window.clearTimeout(filterTimerRef.current);
        }
    }, []);

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const { api } = await import("../../lib/api/clients");
                const [prov, outfRes] = await Promise.all([
                    api<any[]>("/api/schools/me/providers", { method: "GET", auth: true }),
                    api<any>("/api/schools/me/outfits", { method: "GET", auth: true }),
                ]);

                setProviders(prov.map((provider: any) => ({ id: provider.providerId ?? provider.id, name: provider.providerName ?? provider.name })));

                const outfitArray = Array.isArray(outfRes) ? outfRes : outfRes?.items ?? [];
                setOutfits(outfitArray.map((outfit: any) => ({ id: outfit.outfitId ?? outfit.id, name: outfit.outfitName ?? outfit.name })));
            } catch (e) {
                console.error(e);
            }
        };

        fetchOptions();
    }, []);

    const openContractChat = (contract: ContractDto) => {
        setChatContractId(contract.contractId);
        setChatContext({
            icon: "📄",
            title: contract.contractName,
            status: STATUS_LABELS[contract.status] || contract.status,
            statusColor: STATUS_COLORS[contract.status] || "#888",
            subtitle: `Nhà cung cấp: ${contract.providerName || "—"} · ${contract.items.length} mẫu`,
        });
        setChatOpen(true);
    };

    const openContractTemplate = async (id: string) => {
        setTemplateLoading(true);
        try {
            const contract = await getSchoolContractDetail(id);
            setTemplateContract(contract as ContractTemplateData);
        } catch (e) {
            console.error(e);
            showFeedback("Không thể mở văn bản hợp đồng.", "error");
        } finally {
            setTemplateLoading(false);
        }
    };

    const handleSchoolSign = async (signatureData: string, otpCode: string, pdfBase64?: string) => {
        if (!templateContract) return;
        await signSchoolContract(templateContract.contractId, signatureData, otpCode, pdfBase64);
        showFeedback("Đã ký hợp đồng thành công.", "success");
        await fetchContracts();
    };

    const handleRequestSchoolOTP = async () => {
        if (!templateContract) return;
        await requestSchoolSignOTP(templateContract.contractId);
        showFeedback("Mã OTP đã được gửi tới đầu mối của nhà trường.", "success");
    };

    const openDetail = async (id: string) => {
        setDetailLoading(true);
        setShowDetail(true);
        try {
            const contract = await getSchoolContractDetail(id);
            setSelected(contract);
        } catch (e) {
            console.error(e);
            setShowDetail(false);
            showFeedback("Không thể tải chi tiết hợp đồng.", "error");
        } finally {
            setDetailLoading(false);
        }
    };

    const resetCreateForm = () => {
        setShowCreate(false);
        setContractName("");
        setSelectedProvider("");
        setExpiresAt("");
        setItems([{ outfitId: "" }]);
        setError("");
    };

    const handleCreate = async () => {
        setError("");

        if (!contractName.trim()) {
            setError("Vui lòng nhập tên hợp đồng.");
            return;
        }
        if (!selectedProvider) {
            setError("Vui lòng chọn nhà cung cấp.");
            return;
        }
        if (!expiresAt) {
            setError("Vui lòng chọn thời hạn hợp đồng.");
            return;
        }
        if (new Date(expiresAt) <= new Date()) {
            setError("Thời hạn phải ở trong tương lai.");
            return;
        }
        if (items.some((item) => !item.outfitId)) {
            setError("Vui lòng chọn đủ các mẫu đính kèm.");
            return;
        }

        setCreating(true);
        try {
            await createContract({
                contractName,
                providerId: selectedProvider,
                expiresAt: new Date(expiresAt).toISOString(),
                items,
            } as CreateContractRequest);
            resetCreateForm();
            showFeedback("Đã tạo hợp đồng mới.", "success");
            await fetchContracts();
        } catch (e: any) {
            setError(e.message || "Lỗi tạo hợp đồng.");
        } finally {
            setCreating(false);
        }
    };

    const addItem = () => setItems((current) => [...current, { outfitId: "" }]);
    const removeItem = (index: number) => setItems((current) => current.filter((_, currentIndex) => currentIndex !== index));
    const updateItem = (index: number, value: string) =>
        setItems((current) => current.map((item, currentIndex) => (currentIndex === index ? { ...item, outfitId: value } : item)));

    const handleCancel = async (contractId: string) => {
        if (!window.confirm("Bạn có chắc muốn hủy hợp đồng này?")) return;
        setCancelling(contractId);
        try {
            await cancelSchoolContract(contractId);
            showFeedback("Đã hủy hợp đồng.", "success");
            await fetchContracts();
            if (selected?.contractId === contractId) {
                setSelected(null);
                setShowDetail(false);
            }
        } catch (e: any) {
            showFeedback(e.message || "Lỗi hủy hợp đồng.", "error");
        } finally {
            setCancelling(null);
        }
    };

    const filteredContracts = useMemo(() => {
        const query = search.trim().toLowerCase();
        return contracts.filter((contract) => {
            if (statusFilter && contract.status !== statusFilter) {
                return false;
            }

            if (!query) return true;
            return `${contract.contractName} ${contract.providerName || ""} ${contract.contractNumber || ""}`
                .toLowerCase()
                .includes(query);
        });
    }, [contracts, search, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredContracts.length / pageSize));
    const pagedContracts = filteredContracts.slice((page - 1) * pageSize, page * pageSize);
    const isSearchEmptyState = !loading && contracts.length > 0 && filteredContracts.length === 0;
    const {
        resultsRegionRef,
        preserveResultsHeight,
        clearPreservedHeight,
        preservedHeightStyle,
    } = usePreservedResultsHeight(isSearchEmptyState);

    const scheduleFilterCommit = useCallback((next: {
        search: string;
        status: (typeof FILTER_TABS)[number]["key"];
    }) => {
        preserveResultsHeight();
        setFiltering(true);

        if (filterTimerRef.current !== null) {
            window.clearTimeout(filterTimerRef.current);
        }

        filterTimerRef.current = window.setTimeout(() => {
            setSearch(next.search);
            setStatusFilter(next.status);
            setFiltering(false);
            filterTimerRef.current = null;
        }, MIN_FILTER_FEEDBACK_MS);
    }, [preserveResultsHeight]);

    const clearFilters = () => {
        if (filterTimerRef.current !== null) {
            window.clearTimeout(filterTimerRef.current);
            filterTimerRef.current = null;
        }

        setSearchInput("");
        setSearch("");
        setStatusInput("");
        setStatusFilter("");
        setFiltering(false);
        clearPreservedHeight();
    };

    useEffect(() => {
        setPage(1);
    }, [search, statusFilter]);

    const summary = useMemo(() => {
        const total = contracts.length;
        const waitingSchool = contracts.filter((contract) => contract.status === "Pending" || contract.status === "PendingSchoolSign").length;
        const waitingProvider = contracts.filter((contract) => contract.status === "PendingProviderSign").length;
        const active = contracts.filter((contract) => contract.status === "Active" || contract.status === "InUse").length;
        const rejected = contracts.filter((contract) => contract.status === "Rejected").length;
        const expiringSoon = contracts.filter((contract) => {
            const days = getDaysRemaining(contract.expiresAt);
            return (contract.status === "Active" || contract.status === "InUse") && days >= 0 && days <= 14;
        }).length;

        return { total, waitingSchool, waitingProvider, active, rejected, expiringSoon };
    }, [contracts]);

    return (
        <div className="nb-page flex flex-col">
            {feedback && (
                <div
                    className={`fixed right-6 top-6 z-[99999] flex items-center gap-3 rounded-[12px] border px-5 py-3 text-sm font-extrabold shadow-soft-md ${
                        feedback.type === "success"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-rose-200 bg-rose-50 text-rose-700"
                    }`}
                >
                    {feedback.message}
                </div>
            )}

            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 transition-all duration-300 lg:sticky lg:top-0 lg:h-screen`}>
                    <DashboardSidebar
                        {...sidebarConfig}
                        name={schoolName}
                        isCollapsed={isCollapsed}
                        onToggle={toggle}
                        onLogout={handleLogout}
                    />
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                    <TopNavBar>
                        <div className="flex items-center gap-2 px-2 py-2">
                            <FilePenLine className={`h-5 w-5 ${SCHOOL_THEME.primaryText}`} />
                            <h1 className="text-xl font-bold text-gray-900">Hợp đồng</h1>
                        </div>
                    </TopNavBar>

                    <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        <section className="space-y-5">
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-950">Theo dõi hợp đồng cung ứng</h2>
                                    <p className="mt-1 text-sm font-semibold text-slate-500">
                                        Quản lý hợp đồng theo nhà cung cấp, trạng thái ký và thời hạn hiệu lực.
                                    </p>
                                </div>

                                <button onClick={() => setShowCreate(true)} className={SCHOOL_THEME.primaryButton}>
                                    <Plus className="h-4 w-4" />
                                    Tạo hợp đồng mới
                                </button>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <SummaryCard label="Tổng hợp đồng" value={summary.total} tone="school" />
                                <SummaryCard label="Chờ trường xử lý" value={summary.waitingSchool} tone="amber" />
                                <SummaryCard label="Chờ NCC" value={summary.waitingProvider} tone="cyan" />
                                <SummaryCard label="Đang hiệu lực" value={summary.active} tone="green" />
                            </div>
                        </section>

                        <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <label className="relative block w-full lg:max-w-[340px]">
                                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    value={searchInput}
                                    onChange={(event) => {
                                        const nextSearch = event.target.value;
                                        setSearchInput(nextSearch);
                                        scheduleFilterCommit({ search: nextSearch, status: statusInput });
                                    }}
                                    placeholder="Tìm hợp đồng..."
                                    className="h-10 w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-800 outline-none shadow-soft-xs transition-colors placeholder:text-slate-500 focus:border-blue-200 focus:ring-4 focus:ring-blue-50"
                                />
                            </label>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                                <label className="relative block">
                                    <select
                                        value={statusInput}
                                        onChange={(event) => {
                                            const nextStatus = event.target.value as (typeof FILTER_TABS)[number]["key"];
                                            setStatusInput(nextStatus);
                                            scheduleFilterCommit({ search: searchInput, status: nextStatus });
                                        }}
                                        className="h-10 min-w-[170px] appearance-none rounded-full border border-slate-200 bg-white py-0 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none shadow-soft-xs transition-colors focus:border-blue-200 focus:ring-4 focus:ring-blue-50"
                                    >
                                        {FILTER_TABS.map((tab) => (
                                            <option key={tab.key || "all"} value={tab.key}>{tab.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-900" />
                                </label>

                                <div className="inline-flex h-10 items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 text-xs font-bold text-[#5b6475]">
                                    <CalendarRange className={`h-4 w-4 ${SCHOOL_THEME.primaryText}`} />
                                    {filteredContracts.length} hợp đồng
                                </div>

                                {filtering ? (
                                    <div className="inline-flex h-10 items-center gap-2 rounded-full border border-blue-100 bg-white px-3 text-xs font-bold text-[#2563EB] shadow-soft-sm">
                                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-100 border-t-[#2563EB]" />
                                        Đang lọc
                                    </div>
                                ) : null}
                            </div>
                        </section>

                        {loading && <ContractTableSkeleton />}

                        <div ref={resultsRegionRef} style={preservedHeightStyle} className="relative">
                        {!loading && filteredContracts.length > 0 && (
                            <>
                                <ContractTable
                                    items={pagedContracts}
                                    onOpen={(contract) => openDetail(contract.contractId)}
                                    onViewDocument={(contract) => openContractTemplate(contract.contractId)}
                                    onOpenChat={openContractChat}
                                    onCancel={(contract) => handleCancel(contract.contractId)}
                                    cancelling={cancelling}
                                />

                                {totalPages > 1 && (
                                    <div className="mt-8 flex items-center justify-center gap-3">
                                        <button
                                            disabled={page <= 1}
                                            onClick={() => setPage((current) => current - 1)}
                                            className="nb-btn nb-btn-outline nb-btn-sm text-sm"
                                        >
                                            ← Trước
                                        </button>
                                        <span className="text-sm font-bold text-gray-500">
                                            {page}/{totalPages}
                                        </span>
                                        <button
                                            disabled={page >= totalPages}
                                            onClick={() => setPage((current) => current + 1)}
                                            className="nb-btn nb-btn-outline nb-btn-sm text-sm"
                                        >
                                            Sau →
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        {!loading && filteredContracts.length === 0 && (
                            <section className="rounded-[8px] border border-gray-200 bg-white p-12 text-center shadow-soft-sm">
                                <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full border ${SCHOOL_THEME.primarySoftBorder} ${SCHOOL_THEME.primarySoftBg} ${SCHOOL_THEME.primaryText} shadow-soft-sm`}>
                                    <FilePenLine className="h-8 w-8" />
                                </div>
                                <h2 className="mt-5 text-xl font-extrabold text-gray-900">
                                    {contracts.length === 0 ? "Chưa có hợp đồng nào" : "Không tìm thấy hợp đồng phù hợp"}
                                </h2>
                                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                                    {contracts.length === 0 ? (
                                        <button onClick={() => setShowCreate(true)} className={SCHOOL_THEME.primaryButton}>
                                            Tạo hợp đồng mới
                                        </button>
                                    ) : (
                                        <button
                                            onClick={clearFilters}
                                            className="nb-btn nb-btn-outline text-sm hover:border-blue-200 hover:text-[#2563EB]"
                                        >
                                            Xóa bộ lọc
                                        </button>
                                    )}
                                </div>
                            </section>
                        )}
                        </div>
                    </main>
                </div>
            </div>

            {showDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowDetail(false)}>
                    <div
                        className="max-h-[90vh] w-full max-w-[960px] overflow-auto rounded-[8px] border border-gray-200 bg-white shadow-soft-lg"
                        onClick={(event) => event.stopPropagation()}
                    >
                        {detailLoading ? (
                            <div className="flex items-center justify-center px-8 py-16 text-base font-semibold text-gray-500">Đang tải chi tiết hợp đồng...</div>
                        ) : selected ? (
                            <>
                                <div className="border-b border-gray-200 bg-white px-6 py-6 lg:px-8">
                                    <div className="flex flex-col gap-4">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={STATUS_BADGE[selected.status] || "nb-badge"}>
                                                    {STATUS_LABELS[selected.status] || selected.status}
                                                </span>
                                                {selected.schoolSignedAt && (
                                                    <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-extrabold text-emerald-700 shadow-soft-sm">
                                                        Trường đã ký
                                                    </span>
                                                )}
                                                {selected.providerSignedAt && (
                                                    <span className="rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-extrabold text-indigo-700 shadow-soft-sm">
                                                        NCC đã ký
                                                    </span>
                                                )}
                                            </div>
                                            <h2 className="mt-4 text-[26px] font-extrabold leading-tight text-gray-900 lg:text-[32px]">
                                                {selected.contractName}
                                            </h2>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 px-6 py-6 lg:px-8">
                                    <section className="rounded-[8px] border border-gray-200 bg-white p-5 shadow-soft-sm">
                                        <h3 className="text-lg font-extrabold text-gray-900">Thông tin hợp đồng</h3>
                                        <div className="mt-4 grid gap-x-8 gap-y-1 md:grid-cols-2">
                                            {[
                                                {
                                                    label: "Nhà cung cấp",
                                                    value: selected.providerName || "Chưa xác định",
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
                                                    <div className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${SCHOOL_THEME.primarySoftBg} ${SCHOOL_THEME.primaryText}`}>
                                                        {item.icon}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">{item.label}</p>
                                                        <p className="mt-1 break-words text-sm font-bold leading-6 text-gray-900">{item.value}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    {(selected.status === "PendingSchoolSign" || selected.status === "Pending") && (
                                        <section className="rounded-[8px] border border-amber-200 bg-amber-50 p-5 shadow-soft-sm">
                                            <div className="flex items-start gap-3">
                                                <div className="rounded-full bg-white p-3 text-amber-700 shadow-soft-sm">
                                                    <ShieldCheck className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-extrabold text-gray-900">Thao tác của nhà trường</h3>
                                                </div>
                                            </div>
                                        </section>
                                    )}

                                    {selected.rejectionReason && (
                                        <section className="rounded-[8px] border border-rose-200 bg-rose-50 p-5 shadow-soft-sm">
                                            <div className="flex items-start gap-3">
                                                <div className="rounded-full bg-white p-3 text-rose-700 shadow-soft-sm">
                                                    <XCircle className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-extrabold text-gray-900">Lý do từ chối</h3>
                                                    <p className="mt-1 text-sm font-medium leading-6 text-rose-700">{selected.rejectionReason}</p>
                                                </div>
                                            </div>
                                        </section>
                                    )}

                                    <section className="rounded-[8px] border border-gray-200 bg-white shadow-soft-sm">
                                        <div className="border-b border-gray-200 px-6 py-5">
                                            <h3 className="text-lg font-extrabold text-gray-900">Mẫu đồng phục đính kèm</h3>
                                        </div>
                                        <div className="space-y-3 px-6 py-6">
                                            {selected.items.map((item) => (
                                                <div key={item.itemId} className="flex items-center gap-3 rounded-[8px] border border-gray-200 bg-white p-3 shadow-soft-sm">
                                                    <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-[8px] border border-gray-200 bg-slate-50 shadow-soft-xs">
                                                        {item.mainImageURL ? (
                                                            <img src={item.mainImageURL} alt={item.outfitName} className="h-full w-full object-cover" />
                                                        ) : (
                                                            <div className={`flex h-full w-full items-center justify-center ${SCHOOL_THEME.primarySoftBg} ${SCHOOL_THEME.primaryText}`}>
                                                                <ClipboardCheck className="h-5 w-5" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-extrabold text-gray-900">{item.outfitName}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    <div className="flex flex-wrap justify-end gap-3 border-t border-gray-200 pt-2">
                                        {selected.status === "Pending" && (
                                            <button
                                                onClick={() => handleCancel(selected.contractId)}
                                                disabled={cancelling === selected.contractId}
                                                className="nb-btn nb-btn-red text-sm disabled:opacity-50"
                                            >
                                                {cancelling === selected.contractId ? "Đang hủy..." : "Hủy hợp đồng"}
                                            </button>
                                        )}
                                        <button onClick={() => setShowDetail(false)} className="nb-btn nb-btn-outline text-sm">
                                            Đóng
                                        </button>
                                        <button onClick={() => openContractChat(selected)} className="nb-btn nb-btn-outline text-sm">
                                            <MessageCircle className="h-4 w-4" />
                                            Chat
                                        </button>
                                        <button
                                            onClick={() => {
                                                openContractTemplate(selected.contractId);
                                            }}
                                            className={SCHOOL_THEME.primaryButton}
                                        >
                                            Xem & ký hợp đồng
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            )}

            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={resetCreateForm}>
                    <div
                        className="max-h-[90vh] w-full max-w-[900px] overflow-auto rounded-[28px] border border-gray-200 bg-white shadow-soft-lg"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="border-b border-gray-200 bg-[linear-gradient(135deg,#f8f4ff_0%,#eef6ff_55%,#ffffff_100%)] px-6 py-6 lg:px-8">
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                <div className="max-w-3xl">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#2563EB]">
                                        <Plus className="h-4 w-4" />
                                        Contract Setup
                                    </div>
                                    <h2 className="mt-4 text-[26px] font-extrabold leading-tight text-gray-900 lg:text-[32px]">
                                        Tạo hợp đồng cung ứng mới
                                    </h2>
                                </div>
                                <button onClick={resetCreateForm} className="nb-btn nb-btn-outline text-sm">
                                    Đóng
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6 px-6 py-6 lg:px-8">
                            {error && (
                                <div className="nb-alert nb-alert-error text-sm">
                                    <span>⚠️</span>
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
                                <section className="space-y-6">
                                    <div className="nb-card-static p-0">
                                        <div className="border-b border-gray-200 px-6 py-5">
                                            <h3 className="text-lg font-extrabold text-gray-900">Nhận diện hợp đồng</h3>
                                        </div>
                                        <div className="space-y-5 px-6 py-6">
                                            <div>
                                                <label className="mb-1.5 block text-sm font-bold text-gray-900">Tên hợp đồng</label>
                                                <input
                                                    value={contractName}
                                                    onChange={(event) => setContractName(event.target.value)}
                                                    placeholder="VD: Hợp đồng đồng phục HK1 2026"
                                                    maxLength={200}
                                                    className="nb-input w-full py-3"
                                                />
                                            </div>

                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div>
                                                    <label className="mb-1.5 block text-sm font-bold text-gray-900">Nhà cung cấp</label>
                                                    <select value={selectedProvider} onChange={(event) => setSelectedProvider(event.target.value)} className="nb-select w-full">
                                                        <option value="">-- Chọn nhà cung cấp --</option>
                                                        {providers.map((provider) => (
                                                            <option key={provider.id} value={provider.id}>
                                                                {provider.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="mb-1.5 block text-sm font-bold text-gray-900">Thời hạn hợp đồng</label>
                                                    <input
                                                        type="date"
                                                        value={expiresAt}
                                                        onChange={(event) => setExpiresAt(event.target.value)}
                                                        min={new Date().toISOString().split("T")[0]}
                                                        className="nb-input w-full py-3"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="nb-card-static p-0">
                                        <div className="border-b border-gray-200 px-6 py-5">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <h3 className="text-lg font-extrabold text-gray-900">Mẫu đính kèm</h3>
                                                </div>
                                                <button onClick={addItem} className="nb-btn nb-btn-outline nb-btn-sm text-xs">
                                                    Thêm mẫu
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-3 px-6 py-6">
                                            {items.map((item, index) => (
                                                <div key={index} className="rounded-[18px] border border-gray-200 bg-white p-4 shadow-soft-sm">
                                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                        <div className="flex-1">
                                                            <label className="mb-1.5 block text-sm font-bold text-gray-900">Mẫu tham chiếu #{index + 1}</label>
                                                            <select
                                                                value={item.outfitId}
                                                                onChange={(event) => updateItem(index, event.target.value)}
                                                                className="nb-select w-full"
                                                            >
                                                                <option value="">-- Chọn mẫu đồng phục --</option>
                                                                {outfits.map((outfit) => (
                                                                    <option key={outfit.id} value={outfit.id}>
                                                                        {outfit.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        {items.length > 1 && (
                                                            <button onClick={() => removeItem(index)} className="nb-btn nb-btn-red nb-btn-sm text-xs">
                                                                Xóa mục
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </section>

                                <aside className="space-y-6">
                                    <div className="nb-card-static p-0">
                                        <div className="border-b border-gray-200 px-6 py-5">
                                            <h3 className="text-lg font-extrabold text-gray-900">Checklist trước khi tạo</h3>
                                        </div>
                                        <div className="space-y-3 px-6 py-6">
                                            {[
                                                { label: "Đã đặt tên hợp đồng", done: Boolean(contractName.trim()) },
                                                { label: "Đã chọn nhà cung cấp", done: Boolean(selectedProvider) },
                                                { label: "Đã chọn thời hạn hợp lệ", done: Boolean(expiresAt) },
                                                { label: "Đã gắn ít nhất một mẫu", done: items.some((item) => Boolean(item.outfitId)) },
                                            ].map((item) => (
                                                <div
                                                    key={item.label}
                                                    className={`flex items-center justify-between rounded-[16px] border px-4 py-3 shadow-soft-sm ${
                                                        item.done ? "border-emerald-200 bg-emerald-50" : "border-gray-200 bg-white"
                                                    }`}
                                                >
                                                    <span className="text-sm font-semibold text-gray-800">{item.label}</span>
                                                    {item.done ? (
                                                        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700">
                                                            <CheckCircle2 className="h-4 w-4" />
                                                            Sẵn sàng
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs font-extrabold text-amber-700">Cần bổ sung</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                </aside>
                            </div>

                            <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">
                                <button onClick={resetCreateForm} className="nb-btn nb-btn-outline text-sm">
                                    Hủy
                                </button>
                                <button onClick={handleCreate} disabled={creating} className={`${SCHOOL_THEME.primaryButton} disabled:opacity-50`}>
                                    {creating ? "Đang tạo..." : "Tạo hợp đồng"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {templateLoading && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
                    <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-white px-8 py-5 shadow-soft-md">
                        <div className="h-5 w-5 animate-spin rounded-full border-[3px] border-[#2563EB] border-t-transparent" />
                        <span className="font-bold text-gray-900">Đang tải hợp đồng...</span>
                    </div>
                </div>
            )}

            {templateContract && !templateLoading && (
                <ContractTemplate
                    contract={templateContract}
                    viewerRole="school"
                    onRequestSchoolOTP={handleRequestSchoolOTP}
                    onSchoolSign={handleSchoolSign}
                    onClose={() => setTemplateContract(null)}
                />
            )}

            <ChatWidget
                channelType="contract"
                channelId={chatContractId}
                isOpen={chatOpen}
                onClose={() => setChatOpen(false)}
                contextInfo={chatContext}
            />
        </div>
    );
}
