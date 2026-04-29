import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    AlertTriangle,
    CheckCircle2,
    ChevronDown,
    Eye,
    Loader2,
    MessageSquare,
    Search,
    ShieldAlert,
    TimerReset,
} from "lucide-react";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { PROVIDER_LIST_PAGE_SIZE, ProviderDataTable, type ProviderDataTableColumn } from "../../components/provider/ProviderDataTable";
import { usePreservedResultsHeight } from "../../hooks/usePreservedResultsHeight";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useProviderSidebarConfig } from "../../hooks/useProviderSidebarConfig";
import { ChatWidget, type ChatContextInfo } from "../../components/ChatWidget/ChatWidget";
import {
    getProviderComplaintDetail,
    getProviderComplaints,
    respondComplaint,
    type ComplaintDetailDto,
    type ComplaintDto,
} from "../../lib/api/complaints";

const STATUS_MAP: Record<string, { label: string; badge: string; tone: string }> = {
    Open: { label: "Mở", badge: "nb-badge nb-badge-yellow", tone: "bg-amber-50 text-amber-700" },
    InProgress: { label: "Đang xử lý", badge: "nb-badge nb-badge-blue", tone: "bg-blue-50 text-blue-700" },
    Resolved: { label: "Đã giải quyết", badge: "nb-badge nb-badge-green", tone: "bg-emerald-50 text-emerald-700" },
    Closed: { label: "Đã đóng", badge: "nb-badge nb-badge-purple", tone: "bg-violet-50 text-violet-700" },
};

const STATUS_FILTER_OPTIONS = [
    { value: "", label: "Tất cả" },
    { value: "Open", label: "Mở" },
    { value: "InProgress", label: "Đang xử lý" },
    { value: "Resolved", label: "Đã giải quyết" },
    { value: "Closed", label: "Đã đóng" },
];

const MIN_PAGE_FETCH_FEEDBACK_MS = 700;
const MIN_FILTER_COMMIT_MS = 450;

function formatDateTime(value: string) {
    return new Date(value).toLocaleString("vi-VN");
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
    value: number;
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

export function ProviderComplaints() {
    const sidebarConfig = useProviderSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [complaints, setComplaints] = useState<ComplaintDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchingComplaints, setFetchingComplaints] = useState(false);
    const [statusFilter, setStatusFilter] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [filtering, setFiltering] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [detail, setDetail] = useState<ComplaintDetailDto | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [responseText, setResponseText] = useState("");
    const [markResolved, setMarkResolved] = useState(false);
    const [responding, setResponding] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);
    const [chatId, setChatId] = useState("");
    const [chatContext, setChatContext] = useState<ChatContextInfo | undefined>();
    const hasLoadedComplaintsRef = useRef(false);
    const fetchStartedAtRef = useRef(0);
    const fetchSequenceRef = useRef(0);
    const filterTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

    const fetchComplaints = useCallback(async () => {
        const isInitialLoad = !hasLoadedComplaintsRef.current;
        const fetchSequence = fetchSequenceRef.current + 1;
        fetchSequenceRef.current = fetchSequence;
        setLoading(isInitialLoad);
        setFetchingComplaints(!isInitialLoad);
        fetchStartedAtRef.current = Date.now();
        try {
            const result = await getProviderComplaints(page, PROVIDER_LIST_PAGE_SIZE, statusFilter || undefined);
            setComplaints(result.items);
            setTotal(result.total);
        } catch (e) {
            console.error("Error:", e);
        } finally {
            const elapsed = Date.now() - fetchStartedAtRef.current;
            const finish = () => {
                if (fetchSequence !== fetchSequenceRef.current) return;
                hasLoadedComplaintsRef.current = true;
                setLoading(false);
                setFetchingComplaints(false);
            };

            if (!isInitialLoad && elapsed < MIN_PAGE_FETCH_FEEDBACK_MS) {
                window.setTimeout(finish, MIN_PAGE_FETCH_FEEDBACK_MS - elapsed);
                return;
            }

            finish();
        }
    }, [page, statusFilter]);

    useEffect(() => {
        fetchComplaints();
    }, [fetchComplaints]);

    useEffect(() => {
        return () => {
            if (filterTimerRef.current) {
                window.clearTimeout(filterTimerRef.current);
            }
        };
    }, []);

    const openDetail = async (id: string) => {
        setDetailLoading(true);
        setResponseText("");
        setMarkResolved(false);
        try {
            const result = await getProviderComplaintDetail(id);
            setDetail(result);
        } catch (e) {
            console.error("Error:", e);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleRespond = async () => {
        if (!detail || !responseText.trim()) return;
        setResponding(true);
        try {
            await respondComplaint(detail.complaintId, responseText.trim(), markResolved);
            setDetail(null);
            await fetchComplaints();
        } catch (e: any) {
            alert(e.message || "Lỗi khi phản hồi");
        } finally {
            setResponding(false);
        }
    };

    const openChat = (complaint: ComplaintDetailDto) => {
        setChatId(complaint.complaintId);
        setChatContext({
            icon: "📋",
            title: complaint.title,
            status: STATUS_MAP[complaint.status]?.label || complaint.status,
            statusColor: "#888",
            subtitle: `Danh mục: ${complaint.campaignName || "—"}`,
        });
        setChatOpen(true);
    };

    const totalPages = Math.max(1, Math.ceil(total / PROVIDER_LIST_PAGE_SIZE));
    const counts = useMemo(
        () => ({
            all: total,
            open: complaints.filter((item) => item.status === "Open").length,
            inProgress: complaints.filter((item) => item.status === "InProgress").length,
            resolved: complaints.filter((item) => item.status === "Resolved").length,
            closed: complaints.filter((item) => item.status === "Closed").length,
        }),
        [complaints, total],
    );
    const displayedComplaints = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        if (!normalizedSearch) return complaints;

        return complaints.filter((complaint) => {
            const statusLabel = STATUS_MAP[complaint.status]?.label || complaint.status;
            return [
                complaint.title,
                complaint.description,
                complaint.campaignName,
                complaint.response,
                statusLabel,
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(normalizedSearch));
        });
    }, [complaints, searchTerm]);
    const isFilteredEmptyState = !loading && (!!statusFilter || !!searchTerm.trim()) && displayedComplaints.length === 0;
    const { preserveResultsHeight, preservedHeightStyle, resultsRegionRef } = usePreservedResultsHeight(isFilteredEmptyState);

    const scheduleSearchCommit = useCallback(
        (nextSearch: string) => {
            preserveResultsHeight();
            setFiltering(true);
            if (filterTimerRef.current) {
                window.clearTimeout(filterTimerRef.current);
            }
            filterTimerRef.current = window.setTimeout(() => {
                setSearchTerm(nextSearch);
                setPage(1);
                setFiltering(false);
                filterTimerRef.current = null;
            }, MIN_FILTER_COMMIT_MS);
        },
        [preserveResultsHeight],
    );

    const handleStatusChange = (nextStatus: string) => {
        preserveResultsHeight();
        setStatusFilter(nextStatus);
        setPage(1);
    };

    const handleSummaryCardClick = (nextStatus: string) => {
        preserveResultsHeight();
        setStatusFilter(nextStatus);
        setSearchInput("");
        setSearchTerm("");
        setPage(1);
    };

    const statusSummaryCards = useMemo(
        () => [
            {
                label: "Tổng khiếu nại",
                value: counts.all,
                filterValue: "",
                surfaceClassName: "bg-blue-100",
                iconClassName: "text-slate-900",
                icon: <AlertTriangle className="h-6 w-6" />,
            },
            {
                label: "Cần phản hồi",
                value: counts.open,
                filterValue: "Open",
                surfaceClassName: "bg-yellow-100",
                iconClassName: "text-slate-900",
                icon: <ShieldAlert className="h-6 w-6" />,
            },
            {
                label: "Đang xử lý",
                value: counts.inProgress,
                filterValue: "InProgress",
                surfaceClassName: "bg-orange-100",
                iconClassName: "text-slate-900",
                icon: <TimerReset className="h-6 w-6" />,
            },
            {
                label: "Đã giải quyết",
                value: counts.resolved,
                filterValue: "Resolved",
                surfaceClassName: "bg-lime-200",
                iconClassName: "text-slate-900",
                icon: <CheckCircle2 className="h-6 w-6" />,
            },
            {
                label: "Đã đóng",
                value: counts.closed,
                filterValue: "Closed",
                surfaceClassName: "bg-cyan-100",
                iconClassName: "text-slate-900",
                icon: <MessageSquare className="h-6 w-6" />,
            },
        ],
        [counts],
    );

    const complaintColumns: ProviderDataTableColumn<ComplaintDto>[] = [
        {
            key: "title",
            header: "Khiếu nại",
            render: (complaint) => (
                <div className="min-w-0">
                    <p className="font-bold text-slate-900">{complaint.title}</p>
                    <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-500">{complaint.description}</p>
                </div>
            ),
        },
        {
            key: "category",
            header: "Danh mục",
            render: (complaint) => <span className="font-semibold text-slate-700">{complaint.campaignName || "Chưa có"}</span>,
        },
        {
            key: "status",
            header: "Trạng thái",
            render: (complaint) => {
                const statusMeta = STATUS_MAP[complaint.status];
                return <span className={statusMeta?.badge || "nb-badge"}>{statusMeta?.label || complaint.status}</span>;
            },
        },
        {
            key: "response",
            header: "Phản hồi",
            render: (complaint) => (
                <span className={`nb-badge ${complaint.response ? "nb-badge-green" : "nb-badge-yellow"}`}>
                    {complaint.response ? "Đã phản hồi" : "Chưa phản hồi"}
                </span>
            ),
        },
        {
            key: "date",
            header: "Ngày",
            render: (complaint) => (
                <span className="whitespace-nowrap font-semibold text-slate-600">
                    {new Date(complaint.createdAt).toLocaleDateString("vi-VN")}
                </span>
            ),
        },
        {
            key: "action",
            header: "Action",
            className: "text-right",
            render: (complaint) => (
                <div className="flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            openDetail(complaint.complaintId);
                        }}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-slate-200 bg-white text-slate-700 transition-colors hover:border-violet-200 hover:text-violet-700"
                        aria-label="Mở chi tiết khiếu nại"
                    >
                        <Eye className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            openChat(complaint);
                        }}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-slate-200 bg-white text-slate-700 transition-colors hover:border-violet-200 hover:text-violet-700"
                        aria-label="Chat trao đổi"
                    >
                        <MessageSquare className="h-4 w-4" />
                    </button>
                </div>
            ),
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
                            <div className="hidden h-10 w-10 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-soft-sm sm:flex">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold leading-none text-gray-900">Điều phối khiếu nại</h1>
                            </div>
                        </div>
                    </TopNavBar>

                    <main className="space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        <section className="space-y-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-950">Tổng quan khiếu nại</h2>
                                    <p className="mt-1 text-sm font-semibold text-slate-500">
                                        Cần theo dõi: <span className="text-slate-900">{counts.open + counts.inProgress}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
                                    value={searchInput}
                                    onChange={(event) => {
                                        const nextSearch = event.target.value;
                                        setSearchInput(nextSearch);
                                        scheduleSearchCommit(nextSearch);
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
                                        className="h-10 min-w-[168px] appearance-none rounded-full border border-slate-200 bg-white py-0 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none shadow-soft-xs transition-colors focus:border-violet-200 focus:ring-4 focus:ring-violet-50"
                                    >
                                        {STATUS_FILTER_OPTIONS.map((option) => (
                                            <option key={option.value || "all"} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-900" />
                                </label>

                                {fetchingComplaints || filtering ? (
                                    <div className="inline-flex h-10 items-center gap-2 rounded-full border border-violet-100 bg-white px-3 text-xs font-bold text-violet-700 shadow-soft-sm">
                                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-violet-100 border-t-violet-700" />
                                        Đang lọc
                                    </div>
                                ) : null}
                            </div>
                        </section>

                        <div ref={resultsRegionRef} style={preservedHeightStyle} className="relative">
                        {loading ? (
                            <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-[32px] border border-gray-200 bg-white shadow-soft-sm">
                                <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Đang đồng bộ khiếu nại...</p>
                            </div>
                        ) : displayedComplaints.length === 0 ? (
                            <div className="rounded-[32px] border border-dashed border-gray-300 bg-white p-20 text-center shadow-soft-sm">
                                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] border border-gray-100 bg-violet-50">
                                    <AlertTriangle className="h-9 w-9 text-violet-500" />
                                </div>
                                <h2 className="mt-6 text-xl font-bold text-gray-900">Không có khiếu nại trong nhóm này</h2>
                            </div>
                        ) : (
                            <ProviderDataTable
                                items={displayedComplaints}
                                columns={complaintColumns}
                                getKey={(complaint) => complaint.complaintId}
                                onRowClick={(complaint) => openDetail(complaint.complaintId)}
                            />
                        )}

                        {totalPages > 1 ? (
                            <div className="flex items-center justify-center gap-3">
                                <button
                                    disabled={page <= 1 || fetchingComplaints}
                                    onClick={() => {
                                        preserveResultsHeight();
                                        setPage((current) => current - 1);
                                    }}
                                    className="nb-btn nb-btn-outline nb-btn-sm text-sm"
                                >
                                    ← Trước
                                </button>
                                <span className="text-sm font-medium text-gray-500">{page}/{totalPages}</span>
                                <button
                                    disabled={page >= totalPages || fetchingComplaints}
                                    onClick={() => {
                                        preserveResultsHeight();
                                        setPage((current) => current + 1);
                                    }}
                                    className="nb-btn nb-btn-outline nb-btn-sm text-sm"
                                >
                                    Sau →
                                </button>
                            </div>
                        ) : null}
                        </div>

                        {(detail || detailLoading) ? (
                            <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4">
                                <div className="w-full max-w-[760px] max-h-[88vh] overflow-auto rounded-[28px] border border-gray-200 bg-white p-6 shadow-soft-xl">
                                    {detailLoading ? (
                                        <div className="flex min-h-[260px] items-center justify-center">
                                            <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
                                        </div>
                                    ) : detail ? (
                                        <>
                                            <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                                                <div>
                                                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Vùng xử lý khiếu nại</p>
                                                    <h2 className="mt-2 text-2xl font-bold text-gray-900">{detail.title}</h2>
                                                    <p className="mt-2 text-sm font-medium text-gray-500">
                                                        Danh mục: {detail.campaignName || "Chưa có"} · Tạo lúc {formatDateTime(detail.createdAt)}
                                                    </p>
                                                </div>
                                                <span className={STATUS_MAP[detail.status]?.badge || "nb-badge"}>{STATUS_MAP[detail.status]?.label || detail.status}</span>
                                            </div>

                                            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                                <DetailBox label="Phản hồi gần nhất" value={detail.respondedAt ? formatDateTime(detail.respondedAt) : "Chưa phản hồi"} />
                                                <DetailBox label="Đã giải quyết lúc" value={detail.resolvedAt ? formatDateTime(detail.resolvedAt) : "Chưa chốt"} />
                                                <DetailBox label="Danh mục" value={detail.campaignName || "Chưa có"} />
                                            </div>

                                            <div className="mt-6 rounded-[22px] border border-gray-200 bg-slate-50 p-4">
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">Mô tả khiếu nại</p>
                                                <p className="mt-2 text-sm font-medium leading-7 text-gray-700">{detail.description}</p>
                                            </div>

                                            {detail.response ? (
                                                <div className="mt-4 rounded-[22px] border border-emerald-200 bg-emerald-50 p-4">
                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">Phản hồi hiện có</p>
                                                    <p className="mt-2 text-sm font-medium leading-7 text-emerald-900">{detail.response}</p>
                                                </div>
                                            ) : null}

                                            {(detail.status === "Open" || detail.status === "InProgress") ? (
                                                <div className="mt-5 rounded-[22px] border border-violet-200 bg-violet-50/60 p-4">
                                                    <label className="block text-sm font-bold text-gray-900">Phản hồi cho trường</label>
                                                    <textarea
                                                        value={responseText}
                                                        onChange={(event) => setResponseText(event.target.value)}
                                                        rows={4}
                                                        className="nb-input mt-3 w-full resize-y"
                                                        maxLength={500}
                                                    />
                                                    <label className="mt-3 flex items-center gap-2 text-sm font-medium text-gray-600">
                                                        <input
                                                            type="checkbox"
                                                            checked={markResolved}
                                                            onChange={(event) => setMarkResolved(event.target.checked)}
                                                            className="h-4 w-4 accent-[#10B981]"
                                                        />
                                                        Đánh dấu đã giải quyết sau khi gửi phản hồi này
                                                    </label>
                                                </div>
                                            ) : null}

                                            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                                                <button onClick={() => setDetail(null)} className="nb-btn nb-btn-outline flex-1">
                                                    Đóng
                                                </button>
                                                <button onClick={() => openChat(detail)} className="nb-btn nb-btn-purple flex-1">
                                                    Chat
                                                </button>
                                                {(detail.status === "Open" || detail.status === "InProgress") ? (
                                                    <button onClick={handleRespond} disabled={responding || !responseText.trim()} className="nb-btn nb-btn-green flex-1">
                                                        {responding ? "Đang gửi..." : markResolved ? "Gửi và giải quyết" : "Gửi phản hồi"}
                                                    </button>
                                                ) : null}
                                            </div>
                                        </>
                                    ) : null}
                                </div>
                            </div>
                        ) : null}

                        <ChatWidget
                            channelType="complaint"
                            channelId={chatId}
                            isOpen={chatOpen}
                            onClose={() => setChatOpen(false)}
                            contextInfo={chatContext}
                        />
                    </main>
                </div>
            </div>
        </div>
    );
}

function DetailBox({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-[18px] border border-gray-200 bg-slate-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">{label}</p>
            <p className="mt-2 text-sm font-bold text-gray-900">{value}</p>
        </div>
    );
}
