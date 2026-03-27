import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useState, useEffect, useCallback } from "react";
import { DashboardSidebar } from "../../components/layout";
import { useProviderSidebarConfig } from "../../hooks/useProviderSidebarConfig";
import { ChatWidget, type ChatContextInfo } from "../../components/ChatWidget/ChatWidget";
import {
    getProviderComplaints, getProviderComplaintDetail, respondComplaint,
    type ComplaintDto, type ComplaintDetailDto,
} from "../../lib/api/complaints";

const STATUS_MAP: Record<string, { label: string; badge: string }> = {
    Open: { label: "Mở", badge: "nb-badge nb-badge-yellow" },
    InProgress: { label: "Đang xử lý", badge: "nb-badge nb-badge-blue" },
    Resolved: { label: "Đã giải quyết", badge: "nb-badge nb-badge-green" },
    Closed: { label: "Đã đóng", badge: "nb-badge nb-badge-purple" },
};

export function ProviderComplaints() {
    const sidebarConfig = useProviderSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();

    const [complaints, setComplaints] = useState<ComplaintDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 10;

    // Detail
    const [detail, setDetail] = useState<ComplaintDetailDto | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    // Respond
    const [responseText, setResponseText] = useState("");
    const [markResolved, setMarkResolved] = useState(false);
    const [responding, setResponding] = useState(false);
    // Chat
    const [chatOpen, setChatOpen] = useState(false);
    const [chatId, setChatId] = useState("");
    const [chatContext, setChatContext] = useState<ChatContextInfo | undefined>();

    const fetchComplaints = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getProviderComplaints(page, pageSize, statusFilter || undefined);
            setComplaints(res.items);
            setTotal(res.total);
        } catch (e: any) {
            console.error("Error:", e);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter]);

    useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

    const openDetail = async (id: string) => {
        setDetailLoading(true);
        setResponseText("");
        setMarkResolved(false);
        try {
            const d = await getProviderComplaintDetail(id);
            setDetail(d);
        } catch (e: any) {
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
            fetchComplaints();
        } catch (e: any) {
            alert(e.message || "Lỗi khi phản hồi");
        } finally {
            setResponding(false);
        }
    };

    const openChat = (c: ComplaintDetailDto) => {
        setChatId(c.complaintId);
        setChatContext({
            icon: "📋",
            title: c.title,
            status: STATUS_MAP[c.status]?.label || c.status,
            statusColor: "#888",
            subtitle: `Chiến dịch: ${c.campaignName || "—"}`,
        });
        setChatOpen(true);
    };

    const totalPages = Math.ceil(total / pageSize);

    const filterTabs = [
        { value: "", label: "Tất cả" },
        { value: "Open", label: "Mở" },
        { value: "InProgress", label: "Đang xử lý" },
        { value: "Resolved", label: "Đã giải quyết" },
        { value: "Closed", label: "Đã đóng" },
    ];

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} />
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                    <div className="nb-breadcrumb-bar px-6 lg:px-10 py-5">
                        <h1 className="font-extrabold text-[#1A1A2E] text-2xl">📋 Khiếu nại từ Trường học</h1>
                        <p className="font-medium text-[#6B7280] text-sm mt-1">Xem và phản hồi các khiếu nại</p>
                    </div>

                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6">
                        {/* Status tabs */}
                        <div className="nb-tabs">
                            {filterTabs.map(t => (
                                <button
                                    key={t.value}
                                    onClick={() => { setStatusFilter(t.value); setPage(1); }}
                                    className={`nb-tab ${statusFilter === t.value ? "nb-tab-active" : ""}`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        {/* List */}
                        {loading ? (
                            <div className="text-center py-20">
                                <div className="inline-block w-8 h-8 border-4 border-[#6938EF] border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : complaints.length === 0 ? (
                            <div className="nb-card-static p-10 text-center">
                                <div className="text-5xl mb-3">📋</div>
                                <p className="font-medium text-[#9CA3AF] text-base">Chưa có khiếu nại nào.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {complaints.map(c => (
                                    <div
                                        key={c.complaintId}
                                        onClick={() => openDetail(c.complaintId)}
                                        className="nb-card p-5 cursor-pointer"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-[#1A1A2E] text-base">{c.title}</h3>
                                                <p className="font-medium text-[#9CA3AF] text-sm mt-1">
                                                    Chiến dịch: <strong className="text-[#6B7280]">{c.campaignName || "—"}</strong> &nbsp;·&nbsp;
                                                    {new Date(c.createdAt).toLocaleDateString("vi")}
                                                </p>
                                            </div>
                                            <span className={STATUS_MAP[c.status]?.badge || "nb-badge"}>
                                                {STATUS_MAP[c.status]?.label || c.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center gap-2 mt-4">
                                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="nb-btn nb-btn-outline nb-btn-sm text-sm">← Trước</button>
                                <span className="flex items-center text-sm text-[#6B7280] px-2 font-bold">{page}/{totalPages}</span>
                                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="nb-btn nb-btn-outline nb-btn-sm text-sm">Sau →</button>
                            </div>
                        )}

                        {/* Detail + Respond Modal */}
                        {(detail || detailLoading) && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
                                <div className="nb-card-static p-8 w-full max-w-[640px] max-h-[85vh] overflow-auto">
                                    {detailLoading ? (
                                        <div className="text-center py-10">
                                            <div className="inline-block w-8 h-8 border-4 border-[#6938EF] border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    ) : detail && (
                                        <>
                                            <div className="flex items-center justify-between mb-5">
                                                <h2 className="font-extrabold text-[#1A1A2E] text-xl">📋 Chi tiết khiếu nại</h2>
                                                <span className={STATUS_MAP[detail.status]?.badge || "nb-badge"}>
                                                    {STATUS_MAP[detail.status]?.label || detail.status}
                                                </span>
                                            </div>

                                            <div className="space-y-3 mb-5">
                                                <InfoRow label="Tiêu đề" value={detail.title} />
                                                <InfoRow label="Mô tả" value={detail.description} />
                                                <InfoRow label="Chiến dịch" value={detail.campaignName || "—"} />
                                                <InfoRow label="Lô sản xuất" value={detail.batchName || "—"} />
                                                <InfoRow label="Ngày tạo" value={new Date(detail.createdAt).toLocaleString("vi")} />

                                                {detail.response && (
                                                    <div className="nb-alert nb-alert-success mt-3">
                                                        <p className="font-bold text-[#065F46] text-sm">✅ Phản hồi của bạn:</p>
                                                        <p className="font-medium text-[#1A1A2E] text-sm mt-1">{detail.response}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Respond form — only show when Open or InProgress */}
                                            {(detail.status === "Open" || detail.status === "InProgress") && (
                                                <div className="bg-[#F8FAFC] border-2 border-[#E5E7EB] rounded-xl p-4 mt-4">
                                                    <label className="block font-bold text-[#1A1A2E] text-sm mb-2">
                                                        ✍️ Phản hồi khiếu nại
                                                    </label>
                                                    <textarea
                                                        value={responseText}
                                                        onChange={e => setResponseText(e.target.value)}
                                                        placeholder="Nhập phản hồi..."
                                                        rows={3}
                                                        className="nb-input w-full resize-y"
                                                    />
                                                    <label className="flex items-center gap-2 mt-3 text-sm text-[#6B7280] font-medium cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={markResolved}
                                                            onChange={e => setMarkResolved(e.target.checked)}
                                                            className="w-4 h-4 accent-[#10B981]"
                                                        />
                                                        Đánh dấu đã giải quyết
                                                    </label>
                                                </div>
                                            )}

                                            <div className="flex gap-3 mt-5">
                                                <button onClick={() => setDetail(null)} className="nb-btn nb-btn-outline flex-1">Đóng</button>
                                                <button onClick={() => openChat(detail)} className="nb-btn nb-btn-purple flex-1">💬 Chat</button>
                                                {(detail.status === "Open" || detail.status === "InProgress") && (
                                                    <button onClick={handleRespond} disabled={responding || !responseText.trim()} className="nb-btn nb-btn-green flex-1">
                                                        {responding ? "Đang gửi..." : (markResolved ? "Gửi & Giải quyết" : "Gửi phản hồi")}
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

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

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex gap-3">
            <span className="min-w-[120px] font-bold text-[#9CA3AF] text-sm">{label}:</span>
            <span className="font-medium text-[#1A1A2E] text-sm">{value}</span>
        </div>
    );
}
