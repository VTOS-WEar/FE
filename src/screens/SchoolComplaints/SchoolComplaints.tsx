import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useState, useEffect, useCallback } from "react";
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useSidebarConfig } from "../../hooks/useSidebarConfig";
import { ChatWidget, type ChatContextInfo } from "../../components/ChatWidget/ChatWidget";
import {
    getSchoolComplaints, getSchoolComplaintDetail, closeComplaint,
    type ComplaintDto, type ComplaintDetailDto,
} from "../../lib/api/complaints";

const STATUS_BADGE: Record<string, string> = {
    Open: "nb-badge nb-badge-yellow",
    InProgress: "nb-badge nb-badge-blue",
    Resolved: "nb-badge nb-badge-green",
    Closed: "nb-badge bg-[#F3F4F6] text-[#6B7280]",
};
const STATUS_LABELS: Record<string, string> = { Open: "Mở", InProgress: "Đang xử lý", Resolved: "Đã giải quyết", Closed: "Đã đóng" };
const STATUS_COLORS: Record<string, string> = { Open: "#f59e0b", InProgress: "#3b82f6", Resolved: "#10b981", Closed: "#6b7280" };

export function SchoolComplaints() {
    const sidebarConfig = useSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();

    const [complaints, setComplaints] = useState<ComplaintDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 10;

    // Detail modal
    const [detail, setDetail] = useState<ComplaintDetailDto | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [closing, setClosing] = useState(false);
    // Chat
    const [chatOpen, setChatOpen] = useState(false);
    const [chatId, setChatId] = useState("");
    const [chatContext, setChatContext] = useState<ChatContextInfo | undefined>();

    const fetchComplaints = useCallback(async () => {
        setLoading(true);
        try { const res = await getSchoolComplaints(page, pageSize, statusFilter || undefined); setComplaints(res.items); setTotal(res.total); }
        catch (e: any) { console.error(e); }
        finally { setLoading(false); }
    }, [page, statusFilter]);

    useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

    const openDetail = async (id: string) => {
        setDetailLoading(true);
        try { const d = await getSchoolComplaintDetail(id); setDetail(d); }
        catch (e: any) { console.error(e); }
        finally { setDetailLoading(false); }
    };

    const handleClose = async () => {
        if (!detail) return;
        setClosing(true);
        try { await closeComplaint(detail.complaintId); setDetail(null); fetchComplaints(); }
        catch (e: any) { alert(e.message || "Lỗi khi đóng khiếu nại"); }
        finally { setClosing(false); }
    };

    const openChat = (c: ComplaintDetailDto) => {
        setChatId(c.complaintId);
        setChatContext({
            icon: "📋", title: c.title,
            status: STATUS_LABELS[c.status] || c.status,
            statusColor: STATUS_COLORS[c.status] || "#888",
            subtitle: `NCC: ${c.providerName || "—"} · ${c.campaignName || "—"}`,
        });
        setChatOpen(true);
    };

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} />
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                    <TopNavBar>
                        <Breadcrumb><BreadcrumbList>
                            <BreadcrumbItem><BreadcrumbLink href="/school/dashboard" className="font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                            <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                            <BreadcrumbItem><BreadcrumbPage className="font-bold text-[#1A1A2E] text-base">Khiếu nại</BreadcrumbPage></BreadcrumbItem>
                        </BreadcrumbList></Breadcrumb>
                    </TopNavBar>
                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6">

                        <h1 className="font-extrabold text-[#1A1A2E] text-[28px]">📋 Quản lý Khiếu nại</h1>

                        {/* Status tabs — NB */}
                        <div className="nb-tabs w-fit">
                            {["", "Open", "InProgress", "Resolved", "Closed"].map(s => (
                                <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                                    className={`nb-tab ${statusFilter === s ? "nb-tab-active" : ""}`}>
                                    {s ? STATUS_LABELS[s] || s : "Tất cả"}
                                </button>
                            ))}
                        </div>

                        {/* Complaint list — NB cards */}
                        {loading ? (
                            <div className="text-center py-16">
                                <div className="inline-block w-8 h-8 border-4 border-[#6938EF] border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : complaints.length === 0 ? (
                            <div className="nb-card-static p-12 text-center">
                                <p className="text-4xl mb-3">📋</p>
                                <p className="font-medium text-[#9CA3AF]">Chưa có khiếu nại nào.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {complaints.map(c => (
                                    <div key={c.complaintId} onClick={() => openDetail(c.complaintId)}
                                        className="nb-card p-5 cursor-pointer">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-[#1A1A2E] text-lg">{c.title}</h3>
                                                <p className="text-sm text-[#6B7280] mt-1">
                                                    NCC: <strong className="text-[#1A1A2E]">{c.providerName || "—"}</strong> · {c.campaignName || "—"} · {new Date(c.createdAt).toLocaleDateString("vi")}
                                                </p>
                                            </div>
                                            <span className={STATUS_BADGE[c.status] || "nb-badge"}>{STATUS_LABELS[c.status] || c.status}</span>
                                        </div>
                                        {c.response && (
                                            <div className="nb-alert nb-alert-success mt-3 text-xs">
                                                <span>✅</span><span>Phản hồi: {c.response}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center gap-2">
                                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="nb-btn nb-btn-outline nb-btn-sm text-sm">← Trước</button>
                                <span className="flex items-center text-sm text-[#6B7280] px-2 font-bold">{page}/{totalPages}</span>
                                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="nb-btn nb-btn-outline nb-btn-sm text-sm">Sau →</button>
                            </div>
                        )}

                    </main>
                </div>
            </div>

            {/* Detail Modal — NB style */}
            {(detail || detailLoading) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDetail(null)}>
                    <div className="bg-white rounded-md w-full max-w-lg mx-4 p-6 max-h-[85vh] overflow-auto border-2 border-[#1A1A2E] shadow-[4px_4px_0_#1A1A2E]" onClick={e => e.stopPropagation()}>
                        {detailLoading ? (
                            <div className="text-center py-10 text-[#9CA3AF]">Đang tải...</div>
                        ) : detail && (
                            <>
                                <div className="flex justify-between items-center mb-5">
                                    <h2 className="font-extrabold text-xl text-[#1A1A2E]">📋 Chi tiết khiếu nại</h2>
                                    <span className={STATUS_BADGE[detail.status] || "nb-badge"}>{STATUS_LABELS[detail.status] || detail.status}</span>
                                </div>

                                <div className="space-y-3 text-sm">
                                    <InfoRow label="Tiêu đề" value={detail.title} />
                                    <InfoRow label="Mô tả" value={detail.description} />
                                    <InfoRow label="Chiến dịch" value={detail.campaignName || "—"} />
                                    <InfoRow label="Lô sản xuất" value={detail.batchName || "—"} />
                                    <InfoRow label="Nhà cung cấp" value={detail.providerName || "—"} />
                                    <InfoRow label="Ngày tạo" value={new Date(detail.createdAt).toLocaleString("vi")} />
                                    {detail.response && (
                                        <div className="nb-alert nb-alert-success text-sm">
                                            <div>
                                                <p className="font-bold mb-1">✅ Phản hồi từ NCC:</p>
                                                <p>{detail.response}</p>
                                                {detail.respondedAt && <p className="text-xs text-[#9CA3AF] mt-1">Lúc: {new Date(detail.respondedAt).toLocaleString("vi")}</p>}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 mt-5">
                                    <button onClick={() => setDetail(null)} className="flex-1 nb-btn nb-btn-outline text-sm">Đóng</button>
                                    <button onClick={() => openChat(detail)} className="flex-1 nb-btn text-sm bg-[#3B82F6] text-white border-[#1A1A2E]">💬 Chat</button>
                                    {detail.status === "Resolved" && (
                                        <button onClick={handleClose} disabled={closing} className="flex-1 nb-btn nb-btn-green text-sm disabled:opacity-50">
                                            {closing ? "Đang đóng..." : "✅ Đóng khiếu nại"}
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <ChatWidget channelType="complaint" channelId={chatId} isOpen={chatOpen} onClose={() => setChatOpen(false)} contextInfo={chatContext} />
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex gap-3">
            <span className="min-w-[100px] font-bold text-[#6B7280] text-sm">{label}:</span>
            <span className="text-[#1A1A2E] text-sm font-medium">{value}</span>
        </div>
    );
}
