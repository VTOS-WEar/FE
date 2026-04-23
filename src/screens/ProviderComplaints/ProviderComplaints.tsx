import { useCallback, useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    CheckCircle2,
    Loader2,
    MessageSquare,
    ShieldAlert,
    TimerReset,
} from "lucide-react";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
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

function formatDateTime(value: string) {
    return new Date(value).toLocaleString("vi-VN");
}

function SummaryCard({
    label,
    value,
    note,
    icon,
    tone,
}: {
    label: string;
    value: number;
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

export function ProviderComplaints() {
    const sidebarConfig = useProviderSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [complaints, setComplaints] = useState<ComplaintDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");
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
    const pageSize = 10;

    const fetchComplaints = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getProviderComplaints(page, pageSize, statusFilter || undefined);
            setComplaints(result.items);
            setTotal(result.total);
        } catch (e) {
            console.error("Error:", e);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter]);

    useEffect(() => {
        fetchComplaints();
    }, [fetchComplaints]);

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

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const isFilteredEmptyState = !loading && !!statusFilter && complaints.length === 0;
    const { preserveResultsHeight, preservedHeightStyle, resultsRegionRef } = usePreservedResultsHeight(isFilteredEmptyState);

    const filterTabs = [
        { value: "", label: "Tất cả" },
        { value: "Open", label: "Mở" },
        { value: "InProgress", label: "Đang xử lý" },
        { value: "Resolved", label: "Đã giải quyết" },
        { value: "Closed", label: "Đã đóng" },
    ];

    const counts = useMemo(
        () => ({
            all: complaints.length,
            open: complaints.filter((item) => item.status === "Open").length,
            inProgress: complaints.filter((item) => item.status === "InProgress").length,
            resolved: complaints.filter((item) => item.status === "Resolved").length,
        }),
        [complaints],
    );

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} />
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                    <TopNavBar>
                        <div className="px-2 py-2">
                            <h1 className="text-xl font-extrabold text-gray-900">Điều phối khiếu nại</h1>
                            <p className="mt-1 text-[12px] font-semibold text-gray-400">
                                Theo dõi các vấn đề từ trường, phản hồi rõ ràng, và chốt trạng thái xử lý.
                            </p>
                        </div>
                    </TopNavBar>

                    <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        <section className="overflow-hidden rounded-[32px] border border-slate-900/70 bg-slate-950 bg-gradient-to-br from-slate-950 via-slate-800 to-rose-900 px-6 py-7 text-white shadow-soft-lg lg:px-8">
                            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                                <div className="max-w-3xl">
                                    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white">
                                        Xử lý khiếu nại
                                    </span>
                                    <h2 className="mt-4 text-3xl font-black leading-tight text-white sm:text-4xl">
                                        {counts.open + counts.inProgress} khiếu nại đang cần theo dõi hoặc phản hồi thêm.
                                    </h2>
                                    <p className="mt-3 text-sm font-medium leading-7 text-slate-100 sm:text-base">
                                        Xác nhận bối cảnh, phản hồi rõ ràng và chốt trạng thái đúng lúc để khiếu nại không bị kéo dài.
                                    </p>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-3 lg:w-[420px]">
                                    <div className="rounded-[22px] border border-white/10 bg-white/8 p-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">Mở</p>
                                        <p className="mt-2 text-2xl font-black text-white">{counts.open}</p>
                                    </div>
                                    <div className="rounded-[22px] border border-white/10 bg-white/8 p-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">Đang xử lý</p>
                                        <p className="mt-2 text-2xl font-black text-white">{counts.inProgress}</p>
                                    </div>
                                    <div className="rounded-[22px] border border-white/10 bg-white/8 p-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">Đã giải quyết</p>
                                        <p className="mt-2 text-2xl font-black text-white">{counts.resolved}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <SummaryCard
                                label="Cần phản hồi"
                                value={counts.open}
                                note="Các khiếu nại mới vào hàng chờ cần đọc và xác nhận."
                                icon={<ShieldAlert className="h-5 w-5" />}
                                tone="bg-amber-50 text-amber-600"
                            />
                            <SummaryCard
                                label="Đang xử lý"
                                value={counts.inProgress}
                                note="Các trường hợp đã có trao đổi nhưng chưa thể chốt."
                                icon={<TimerReset className="h-5 w-5" />}
                                tone="bg-blue-50 text-blue-600"
                            />
                            <SummaryCard
                                label="Đã giải quyết"
                                value={counts.resolved}
                                note="Các tình huống đã có phản hồi rõ ràng và khép lại."
                                icon={<CheckCircle2 className="h-5 w-5" />}
                                tone="bg-emerald-50 text-emerald-600"
                            />
                            <SummaryCard
                                label="Tổng hiển thị"
                                value={complaints.length}
                                note="Số lượng khiếu nại đang hiển thị trong trang hiện tại."
                                icon={<AlertTriangle className="h-5 w-5" />}
                                tone="bg-violet-50 text-violet-600"
                            />
                        </section>

                        <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Bộ lọc theo trạng thái</p>
                                    <h2 className="mt-2 text-2xl font-black text-gray-900">Chọn nhóm vấn đề cần rà soát</h2>
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-black text-amber-700">
                                    <MessageSquare className="h-4 w-4" />
                                    {counts.open} trường hợp cần phản hồi đầu tiên
                                </div>
                            </div>

                            <div className="mt-6 flex min-w-full gap-3 overflow-x-auto pb-1">
                                {filterTabs.map((tab) => {
                                    const count = tab.value === ""
                                        ? total
                                        : complaints.filter((item) => item.status === tab.value).length;
                                    const active = statusFilter === tab.value;

                                    return (
                                        <button
                                            key={tab.value || "all"}
                                            onClick={() => {
                                                preserveResultsHeight();
                                                setStatusFilter(tab.value);
                                                setPage(1);
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
                                <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">Đang đồng bộ khiếu nại...</p>
                            </div>
                        ) : complaints.length === 0 ? (
                            <div className="rounded-[32px] border border-dashed border-gray-300 bg-white p-20 text-center shadow-soft-sm">
                                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] border border-gray-100 bg-violet-50">
                                    <AlertTriangle className="h-9 w-9 text-violet-500" />
                                </div>
                                <h2 className="mt-6 text-xl font-black text-gray-900">Không có khiếu nại trong nhóm này</h2>
                                <p className="mt-2 text-sm font-medium text-gray-500">
                                    Thử đổi bộ lọc để xem các trường hợp ở trạng thái khác.
                                </p>
                            </div>
                        ) : (
                            <section className="space-y-4">
                                {complaints.map((complaint) => {
                                    const statusMeta = STATUS_MAP[complaint.status];
                                    const actionable = complaint.status === "Open" || complaint.status === "InProgress";

                                    return (
                                        <article
                                            key={complaint.complaintId}
                                            className="w-full rounded-[28px] border border-gray-200 bg-white p-5 shadow-soft-sm transition-all hover:border-violet-200"
                                        >
                                            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_220px] xl:items-start">
                                                <div className="min-w-0 flex-1 break-normal [overflow-wrap:normal]">
                                                    <div className="flex min-w-0 flex-wrap items-center gap-3">
                                                        <h3 className="min-w-0 break-normal text-lg font-black text-gray-900">{complaint.title}</h3>
                                                        <span className={statusMeta?.badge || "nb-badge"}>{statusMeta?.label || complaint.status}</span>
                                                        <span className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-[11px] font-black ${statusMeta?.tone || "bg-slate-100 text-slate-700"}`}>
                                                            {new Date(complaint.createdAt).toLocaleDateString("vi-VN")}
                                                        </span>
                                                    </div>

                                                    <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Mô tả nhanh</p>
                                                            <p className="mt-1 text-sm font-medium leading-6 text-gray-700">{complaint.description}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Danh mục</p>
                                                            <p className="mt-1 text-base font-black text-gray-900">{complaint.campaignName || "Chưa có"}</p>
                                                            <p className="mt-1 text-sm font-medium text-gray-500">Nguồn phát sinh vụ việc</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Phản hồi hiện có</p>
                                                            <p className="mt-1 text-sm font-black text-gray-900">
                                                                {complaint.response ? "Đã phản hồi" : "Chưa phản hồi"}
                                                            </p>
                                                            <p className="mt-1 text-sm font-medium text-gray-500">
                                                                {complaint.respondedAt ? `Lúc ${formatDateTime(complaint.respondedAt)}` : "Chưa có mốc phản hồi"}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Next step</p>
                                                            <p className="mt-1 text-base font-black text-gray-900">
                                                                {complaint.status === "Open"
                                                                    ? "Phản hồi lần đầu"
                                                                    : complaint.status === "InProgress"
                                                                        ? "Cập nhật tiến độ"
                                                                        : "Lưu hồ sơ"}
                                                            </p>
                                                            <p className="mt-1 text-sm font-medium text-gray-500">
                                                                {actionable ? "Mở chi tiết để phản hồi hoặc chat." : "Đã ở trạng thái đã chốt."}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex w-full flex-col gap-3 xl:w-[220px] xl:shrink-0">
                                                    <button
                                                        onClick={() => openDetail(complaint.complaintId)}
                                                        className="inline-flex h-11 items-center justify-center rounded-[16px] bg-violet-600 px-4 text-sm font-black text-white shadow-soft-sm transition-all hover:bg-violet-700"
                                                    >
                                                        Mở vùng xử lý
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            openChat(complaint)
                                                        }
                                                        className="inline-flex h-11 items-center justify-center rounded-[16px] bg-slate-50 px-4 text-sm font-black text-slate-700 transition-all hover:bg-slate-100"
                                                    >
                                                        Chat trao đổi
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
                                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Vùng xử lý khiếu nại</p>
                                                    <h2 className="mt-2 text-2xl font-black text-gray-900">{detail.title}</h2>
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
                                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Mô tả khiếu nại</p>
                                                <p className="mt-2 text-sm font-medium leading-7 text-gray-700">{detail.description}</p>
                                            </div>

                                            {detail.response ? (
                                                <div className="mt-4 rounded-[22px] border border-emerald-200 bg-emerald-50 p-4">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">Phản hồi hiện có</p>
                                                    <p className="mt-2 text-sm font-medium leading-7 text-emerald-900">{detail.response}</p>
                                                </div>
                                            ) : null}

                                            {(detail.status === "Open" || detail.status === "InProgress") ? (
                                                <div className="mt-5 rounded-[22px] border border-violet-200 bg-violet-50/60 p-4">
                                                    <label className="block text-sm font-black text-gray-900">Phản hồi cho trường</label>
                                                    <textarea
                                                        value={responseText}
                                                        onChange={(event) => setResponseText(event.target.value)}
                                                        placeholder="Nêu rõ tình trạng hiện tại, hướng xử lý, hoặc thông tin bạn cần xác nhận thêm."
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
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">{label}</p>
            <p className="mt-2 text-sm font-black text-gray-900">{value}</p>
        </div>
    );
}
