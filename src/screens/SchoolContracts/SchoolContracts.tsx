import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    AlertTriangle,
    ArrowRight,
    CalendarClock,
    CalendarRange,
    CheckCircle2,
    ClipboardCheck,
    FilePenLine,
    Layers3,
    MessageCircle,
    Plus,
    Search,
    ShieldCheck,
    Signature,
    Users2,
    XCircle,
} from "lucide-react";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
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

function getContractTone(status: string) {
    switch (status) {
        case "Pending":
            return {
                surface: "border-amber-200 bg-amber-50/70",
            };
        case "PendingSchoolSign":
            return {
                surface: "border-orange-200 bg-orange-50/70",
            };
        case "PendingProviderSign":
            return {
                surface: "border-indigo-200 bg-indigo-50/70",
            };
        case "Active":
        case "InUse":
            return {
                surface: "border-emerald-200 bg-emerald-50/70",
            };
        case "Rejected":
            return {
                surface: "border-rose-200 bg-rose-50/70",
            };
        default:
            return {
                surface: "border-slate-200 bg-slate-50",
            };
    }
}

function SummaryCard({
    label,
    value,
    tone,
}: {
    label: string;
    value: number;
    tone: "violet" | "amber" | "indigo" | "green";
}) {
    const toneClass =
        tone === "amber"
            ? "border-amber-200 bg-amber-50"
            : tone === "indigo"
              ? "border-indigo-200 bg-indigo-50"
              : tone === "green"
                ? "border-emerald-200 bg-emerald-50"
                : "border-violet-200 bg-violet-50";

    return (
        <div className={`rounded-[22px] border p-4 shadow-soft-sm ${toneClass}`}>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-gray-500">{label}</p>
            <p className="mt-3 text-3xl font-extrabold text-gray-900">{value}</p>
        </div>
    );
}

function ContractCard({
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
    const tone = getContractTone(contract.status);
    const daysRemaining = getDaysRemaining(contract.expiresAt);
    const expiresSoon = (contract.status === "Active" || contract.status === "InUse") && daysRemaining >= 0 && daysRemaining <= 14;
    const canCancel = contract.status === "Pending";

    return (
        <div
            onClick={onOpen}
            className={`group cursor-pointer rounded-[26px] border p-5 shadow-soft-md transition-all hover:-translate-y-0.5 hover:shadow-soft-lg ${tone.surface}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={STATUS_BADGE[contract.status] || "nb-badge"}>
                            {STATUS_LABELS[contract.status] || contract.status}
                        </span>
                        {expiresSoon && (
                            <span className="rounded-full border border-amber-200 bg-white px-2.5 py-1 text-[11px] font-extrabold text-amber-700 shadow-soft-sm">
                                Sắp đến hạn hiệu lực
                            </span>
                        )}
                    </div>

                    <h3 className="mt-4 text-xl font-extrabold leading-tight text-gray-900 transition-colors group-hover:text-violet-700">
                        {contract.contractName}
                    </h3>
                    <p className="mt-2 text-sm font-semibold text-[#4c5769]">
                        Nhà cung cấp: <span className="text-gray-900">{contract.providerName || "Chưa xác định"}</span>
                    </p>
                </div>

                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onOpen();
                    }}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-soft-sm transition-colors hover:text-violet-700"
                >
                    <ArrowRight className="h-4 w-4" />
                </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-[18px] border border-white/70 bg-white/90 p-4 shadow-soft-sm">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-gray-500">Khung thời gian</p>
                    <p className="mt-2 text-sm font-bold text-gray-900">Hết hạn {formatDate(contract.expiresAt)}</p>
                    <p className="mt-2 text-xs font-semibold text-[#5b6475]">
                        {daysRemaining >= 0 ? `Còn khoảng ${daysRemaining} ngày` : "Đã quá hạn, cần rà soát trạng thái"}
                    </p>
                </div>
                <div className="rounded-[18px] border border-white/70 bg-white/90 p-4 shadow-soft-sm">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-gray-500">Phạm vi thỏa thuận</p>
                    <p className="mt-2 text-sm font-bold text-gray-900">{contract.items.length} mẫu đính kèm</p>
                </div>
            </div>

            {contract.rejectionReason && (
                <div className="mt-4 rounded-[18px] border border-rose-200 bg-white/90 px-4 py-3 text-sm font-medium text-rose-700 shadow-soft-sm">
                    <span className="font-extrabold">Lý do từ chối:</span> {contract.rejectionReason}
                </div>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-white/70 pt-4">
                <div className="flex flex-wrap gap-2" onClick={(event) => event.stopPropagation()}>
                    <button onClick={onViewDocument} className="nb-btn nb-btn-outline nb-btn-sm text-xs">
                        Xem hợp đồng
                    </button>
                    <button onClick={onOpenChat} className="nb-btn nb-btn-outline nb-btn-sm text-xs">
                        Chat
                    </button>
                    {canCancel && (
                        <button
                            onClick={onCancel}
                            disabled={cancelling}
                            className="nb-btn nb-btn-red nb-btn-sm text-xs disabled:opacity-50"
                        >
                            {cancelling ? "Đang hủy..." : "Hủy"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function DetailMetric({
    label,
    value,
    icon,
}: {
    label: string;
    value: string;
    icon: React.ReactNode;
}) {
    return (
        <div className="rounded-[18px] border border-gray-200 bg-white p-4 shadow-soft-sm">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-gray-500">
                {icon}
                {label}
            </div>
            <p className="mt-3 text-sm font-bold leading-6 text-gray-900">{value}</p>
        </div>
    );
}

export function SchoolContracts() {
    const navigate = useNavigate();
    const sidebarConfig = useSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [schoolName, setSchoolName] = useState("");

    const [contracts, setContracts] = useState<ContractDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 9;

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
            const data = await getSchoolContracts(statusFilter || undefined);
            setContracts(data);
        } catch (e) {
            console.error(e);
            showFeedback("Không thể tải danh sách hợp đồng.", "error");
        } finally {
            setLoading(false);
        }
    }, [showFeedback, statusFilter]);

    useEffect(() => {
        fetchContracts();
    }, [fetchContracts]);

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
            if (!query) return true;
            return `${contract.contractName} ${contract.providerName || ""} ${contract.contractNumber || ""}`
                .toLowerCase()
                .includes(query);
        });
    }, [contracts, search]);

    const totalPages = Math.max(1, Math.ceil(filteredContracts.length / pageSize));
    const pagedContracts = filteredContracts.slice((page - 1) * pageSize, page * pageSize);
    const isSearchEmptyState = !loading && contracts.length > 0 && filteredContracts.length === 0;
    const {
        resultsRegionRef,
        preserveResultsHeight,
        clearPreservedHeight,
        preservedHeightStyle,
    } = usePreservedResultsHeight(isSearchEmptyState);

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
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/school/dashboard" className="text-base font-semibold text-[#4c5769]">
                                        Trang chủ
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="text-base font-bold text-gray-900">Hợp đồng</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </TopNavBar>

                    <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        <section className="overflow-hidden rounded-[30px] border border-violet-200 bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.18),_transparent_35%),linear-gradient(135deg,_#ffffff_5%,_#f8f4ff_50%,_#eef6ff_100%)] p-6 shadow-soft-lg lg:p-7">
                            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                                <div className="max-w-3xl">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-violet-700">
                                        <Layers3 className="h-4 w-4" />
                                        Hợp đồng cung ứng
                                    </div>
                                    <h1 className="mt-4 text-[28px] font-extrabold leading-tight text-gray-900 lg:text-[34px]">
                                        Theo dõi hợp đồng cung ứng của nhà trường
                                    </h1>
                                </div>

                                <div className="flex w-full max-w-[420px] flex-col gap-3 xl:items-end">
                                    <button onClick={() => setShowCreate(true)} className="nb-btn nb-btn-purple min-w-[220px] text-sm">
                                        <Plus className="h-4 w-4" />
                                        Tạo hợp đồng mới
                                    </button>
                                </div>
                            </div>

                            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                <SummaryCard label="Tổng hợp đồng" value={summary.total} tone="violet" />
                                <SummaryCard label="Chờ trường xử lý" value={summary.waitingSchool} tone="amber" />
                                <SummaryCard label="Chờ NCC" value={summary.waitingProvider} tone="indigo" />
                                <SummaryCard label="Đang hiệu lực" value={summary.active} tone="green" />
                            </div>
                        </section>

                        {(summary.waitingSchool > 0 || summary.expiringSoon > 0 || summary.rejected > 0) && (
                            <section className="rounded-[24px] border border-amber-200 bg-amber-50 p-5 shadow-soft-sm">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-2xl bg-white p-3 text-amber-700 shadow-soft-sm">
                                            <AlertTriangle className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-extrabold text-gray-900">Hạng mục cần lưu ý</h2>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            preserveResultsHeight();
                                            setStatusFilter(summary.waitingSchool > 0 ? "Pending" : summary.rejected > 0 ? "Rejected" : "Active");
                                        }}
                                        className="nb-btn nb-btn-outline text-sm"
                                    >
                                        Xem ngay
                                    </button>
                                </div>
                            </section>
                        )}

                        <section className="nb-card-static sticky top-0 z-20 space-y-4 rounded-[24px] bg-white/85 p-4 backdrop-blur-sm">
                            <div className="flex items-center gap-2 nb-input py-2.5">
                                <Search className="h-5 w-5 flex-shrink-0 text-[#97A3B6]" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) => {
                                        preserveResultsHeight();
                                        setSearch(event.target.value);
                                    }}
                                    placeholder="Tìm theo tên hợp đồng, số hợp đồng hoặc nhà cung cấp..."
                                    className="flex-1 bg-transparent text-sm font-medium text-[#1a1a2e] outline-none placeholder:text-[#97A3B6]"
                                />
                            </div>

                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <div className="nb-tabs w-fit">
                                    {FILTER_TABS.map((tab) => {
                                        const isActive = statusFilter === tab.key;
                                        const count =
                                            tab.key === ""
                                                ? contracts.length
                                                : contracts.filter((contract) => contract.status === tab.key).length;

                                        return (
                                            <button key={tab.key} onClick={() => {
                                                preserveResultsHeight();
                                                setStatusFilter(tab.key);
                                            }} className={`nb-tab ${isActive ? "nb-tab-active" : ""}`}>
                                                {tab.label}
                                                <span
                                                    className={`ml-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                                                        isActive ? "bg-white/20 text-white" : "bg-[#E5E7EB] text-gray-600"
                                                    }`}
                                                >
                                                    {count}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-[#5b6475]">
                                    <CalendarRange className="h-4 w-4 text-violet-600" />
                                    {filteredContracts.length} hợp đồng trong chế độ xem hiện tại
                                </div>
                            </div>
                        </section>

                        {loading && (
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                                {[1, 2, 3].map((item) => (
                                    <div key={item} className="nb-skeleton h-[320px] rounded-[26px]" />
                                ))}
                            </div>
                        )}

                        <div ref={resultsRegionRef} style={preservedHeightStyle}>
                        {!loading && filteredContracts.length > 0 && (
                            <>
                                <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                                    {pagedContracts.map((contract) => (
                                        <ContractCard
                                            key={contract.contractId}
                                            contract={contract}
                                            onOpen={() => openDetail(contract.contractId)}
                                            onViewDocument={() => openContractTemplate(contract.contractId)}
                                            onOpenChat={() => openContractChat(contract)}
                                            onCancel={() => handleCancel(contract.contractId)}
                                            cancelling={cancelling === contract.contractId}
                                        />
                                    ))}
                                </section>

                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-3">
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
                            <section className="rounded-[26px] border border-gray-200 bg-white p-12 text-center shadow-soft-md">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-violet-200 bg-violet-50 text-violet-600 shadow-soft-sm">
                                    <FilePenLine className="h-8 w-8" />
                                </div>
                                <h2 className="mt-5 text-xl font-extrabold text-gray-900">
                                    {contracts.length === 0 ? "Chưa có hợp đồng nào" : "Không tìm thấy hợp đồng phù hợp"}
                                </h2>
                                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                                    {contracts.length === 0 ? (
                                        <button onClick={() => setShowCreate(true)} className="nb-btn nb-btn-purple text-sm">
                                            Tạo hợp đồng mới
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setSearch("");
                                                setStatusFilter("");
                                                clearPreservedHeight();
                                            }}
                                            className="nb-btn nb-btn-outline text-sm"
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
                        className="max-h-[90vh] w-full max-w-[960px] overflow-auto rounded-[28px] border border-gray-200 bg-white shadow-soft-lg"
                        onClick={(event) => event.stopPropagation()}
                    >
                        {detailLoading ? (
                            <div className="flex items-center justify-center px-8 py-16 text-base font-semibold text-gray-500">Đang tải chi tiết hợp đồng...</div>
                        ) : selected ? (
                            <>
                                <div className="border-b border-gray-200 bg-[linear-gradient(135deg,#f8f4ff_0%,#eef6ff_55%,#ffffff_100%)] px-6 py-6 lg:px-8">
                                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                                        <div className="max-w-3xl">
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

                                        <div className="flex flex-wrap gap-2 xl:justify-end">
                                            <button
                                                onClick={() => {
                                                    openContractTemplate(selected.contractId);
                                                }}
                                                className="nb-btn nb-btn-outline text-sm"
                                            >
                                                Xem & ký văn bản
                                            </button>
                                            <button onClick={() => openContractChat(selected)} className="nb-btn nb-btn-outline text-sm">
                                                Chat
                                            </button>
                                            {selected.status === "Pending" && (
                                                <button
                                                    onClick={() => handleCancel(selected.contractId)}
                                                    disabled={cancelling === selected.contractId}
                                                    className="nb-btn nb-btn-red text-sm disabled:opacity-50"
                                                >
                                                    {cancelling === selected.contractId ? "Đang hủy..." : "Hủy hợp đồng"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 px-6 py-6 lg:px-8">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                                        <DetailMetric label="Nhà cung cấp" value={selected.providerName || "Chưa xác định"} icon={<Users2 className="h-4 w-4 text-violet-600" />} />
                                        <DetailMetric label="Ngày tạo" value={formatDate(selected.createdAt)} icon={<CalendarRange className="h-4 w-4 text-violet-600" />} />
                                        <DetailMetric label="Hết hạn" value={formatDate(selected.expiresAt)} icon={<CalendarClock className="h-4 w-4 text-violet-600" />} />
                                        <DetailMetric
                                            label="Tình trạng ký"
                                            value={`${selected.schoolSignedAt ? "Trường đã ký" : "Trường chưa ký"} · ${selected.providerSignedAt ? "NCC đã ký" : "NCC chưa ký"}`}
                                            icon={<Signature className="h-4 w-4 text-violet-600" />}
                                        />
                                    </div>

                                    {(selected.status === "PendingSchoolSign" || selected.status === "Pending") && (
                                        <section className="rounded-[24px] border border-amber-200 bg-amber-50 p-5 shadow-soft-sm">
                                            <div className="flex items-start gap-3">
                                                <div className="rounded-2xl bg-white p-3 text-amber-700 shadow-soft-sm">
                                                    <ShieldCheck className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-extrabold text-gray-900">Thao tác của nhà trường</h3>
                                                </div>
                                            </div>
                                        </section>
                                    )}

                                    {selected.rejectionReason && (
                                        <section className="rounded-[24px] border border-rose-200 bg-rose-50 p-5 shadow-soft-sm">
                                            <div className="flex items-start gap-3">
                                                <div className="rounded-2xl bg-white p-3 text-rose-700 shadow-soft-sm">
                                                    <XCircle className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-extrabold text-gray-900">Lý do từ chối</h3>
                                                    <p className="mt-1 text-sm font-medium leading-6 text-rose-700">{selected.rejectionReason}</p>
                                                </div>
                                            </div>
                                        </section>
                                    )}

                                    <section className="nb-card-static p-0">
                                        <div className="border-b border-gray-200 px-6 py-5">
                                            <h3 className="text-lg font-extrabold text-gray-900">Mẫu đồng phục đính kèm</h3>
                                        </div>
                                        <div className="grid gap-3 px-6 py-6 md:grid-cols-2">
                                            {selected.items.map((item) => (
                                                <div key={item.itemId} className="rounded-[18px] border border-gray-200 bg-white p-4 shadow-soft-sm">
                                                    <div className="flex items-start gap-3">
                                                        <div className="mt-0.5 rounded-2xl bg-violet-50 p-3 text-violet-600 shadow-soft-sm">
                                                            <ClipboardCheck className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-extrabold text-gray-900">{item.outfitName}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    <div className="flex flex-wrap justify-end gap-3 border-t border-gray-200 pt-2">
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
                                            className="nb-btn nb-btn-purple text-sm"
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
                                    <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-violet-700">
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
                                <button onClick={handleCreate} disabled={creating} className="nb-btn nb-btn-purple text-sm disabled:opacity-50">
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
                        <div className="h-5 w-5 animate-spin rounded-full border-[3px] border-violet-600 border-t-transparent" />
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
