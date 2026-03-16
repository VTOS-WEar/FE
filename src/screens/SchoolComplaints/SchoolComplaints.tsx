import { useState, useEffect, useCallback } from "react";
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { DashboardSidebar } from "../../components/layout";
import { useSidebarConfig } from "../../hooks/useSidebarConfig";
import { ChatWidget, type ChatContextInfo } from "../../components/ChatWidget/ChatWidget";
import {
    getSchoolComplaints, getSchoolComplaintDetail, closeComplaint,
    type ComplaintDto, type ComplaintDetailDto,
} from "../../lib/api/complaints";

const STATUS_COLORS: Record<string, string> = {
    Open: "#f59e0b",
    InProgress: "#3b82f6",
    Resolved: "#10b981",
    Closed: "#6b7280",
};
const STATUS_LABELS: Record<string, string> = {
    Open: "Mở",
    InProgress: "Đang xử lý",
    Resolved: "Đã giải quyết",
    Closed: "Đã đóng",
};

export function SchoolComplaints() {
    const sidebarConfig = useSidebarConfig();
    const [isCollapsed, setIsCollapsed] = useState(false);

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
        try {
            const res = await getSchoolComplaints(page, pageSize, statusFilter || undefined);
            setComplaints(res.items);
            setTotal(res.total);
        } catch (e: any) {
            console.error("Error fetching complaints:", e);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter]);

    useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

    const openDetail = async (id: string) => {
        setDetailLoading(true);
        try {
            const d = await getSchoolComplaintDetail(id);
            setDetail(d);
        } catch (e: any) {
            console.error("Error fetching detail:", e);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleClose = async () => {
        if (!detail) return;
        setClosing(true);
        try {
            await closeComplaint(detail.complaintId);
            setDetail(null);
            fetchComplaints();
        } catch (e: any) {
            alert(e.message || "Lỗi khi đóng khiếu nại");
        } finally {
            setClosing(false);
        }
    };

    const openChat = (c: ComplaintDetailDto) => {
        setChatId(c.complaintId);
        setChatContext({
            icon: "📋",
            title: c.title,
            status: STATUS_LABELS[c.status] || c.status,
            statusColor: STATUS_COLORS[c.status] || "#888",
            subtitle: `NCC: ${c.providerName || "—"} · ${c.campaignName || "—"}`,
        });
        setChatOpen(true);
    };

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "#f5f5f5" }}>
            <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[20rem] xl:w-[23.75rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(c => !c)} />
            </div>

            <main style={{ flex: 1, padding: "32px 40px" }}>
                {/* Breadcrumb */}
                <div style={{ marginBottom: 8 }}>
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem><BreadcrumbLink href="/school/dashboard" className="font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                            <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                            <BreadcrumbItem><BreadcrumbPage className="font-semibold text-[#4c5769] text-base">Khiếu nại</BreadcrumbPage></BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>

                <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1a1a2e", margin: "24px 0" }}>📋 Quản lý Khiếu nại</h1>

                {/* Status filter tabs */}
                <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                    {["", "Open", "InProgress", "Resolved", "Closed"].map(s => (
                        <button
                            key={s}
                            onClick={() => { setStatusFilter(s); setPage(1); }}
                            style={{
                                padding: "8px 20px", borderRadius: 20, border: "none", cursor: "pointer",
                                background: statusFilter === s ? "#6366f1" : "#e8e8e8",
                                color: statusFilter === s ? "#fff" : "#555",
                                fontWeight: 600, fontSize: 14, transition: "all .2s",
                            }}
                        >
                            {s ? STATUS_LABELS[s] || s : "Tất cả"}
                        </button>
                    ))}
                </div>

                {/* Complaint list */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: 60, color: "#999" }}>Đang tải...</div>
                ) : complaints.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 60, background: "#fff", borderRadius: 16, color: "#aaa" }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                        <p style={{ fontSize: 16 }}>Chưa có khiếu nại nào.</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gap: 16 }}>
                        {complaints.map(c => (
                            <div
                                key={c.complaintId}
                                onClick={() => openDetail(c.complaintId)}
                                style={{
                                    background: "#fff", borderRadius: 16, padding: "20px 28px",
                                    boxShadow: "0 2px 12px rgba(0,0,0,.06)", cursor: "pointer",
                                    borderLeft: `5px solid ${STATUS_COLORS[c.status] || "#ccc"}`,
                                    transition: "transform .15s, box-shadow .15s",
                                }}
                                onMouseOver={e => { (e.currentTarget as any).style.transform = "translateY(-2px)"; (e.currentTarget as any).style.boxShadow = "0 6px 20px rgba(0,0,0,.1)"; }}
                                onMouseOut={e => { (e.currentTarget as any).style.transform = "none"; (e.currentTarget as any).style.boxShadow = "0 2px 12px rgba(0,0,0,.06)"; }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#1a1a2e" }}>{c.title}</h3>
                                        <p style={{ margin: "4px 0 0", color: "#888", fontSize: 14 }}>
                                            NCC: <strong>{c.providerName || "—"}</strong> &nbsp;·&nbsp;
                                            {c.campaignName || "—"} &nbsp;·&nbsp;
                                            {new Date(c.createdAt).toLocaleDateString("vi")}
                                        </p>
                                    </div>
                                    <span style={{
                                        padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                                        background: `${STATUS_COLORS[c.status]}18`,
                                        color: STATUS_COLORS[c.status],
                                    }}>
                                        {STATUS_LABELS[c.status] || c.status}
                                    </span>
                                </div>
                                {c.response && (
                                    <p style={{ margin: "10px 0 0", padding: "8px 12px", background: "#f0fdf4", borderRadius: 8, color: "#16a34a", fontSize: 13 }}>
                                        ✅ Phản hồi: {c.response}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <button key={p} onClick={() => setPage(p)} style={{
                                width: 36, height: 36, borderRadius: "50%", border: "none", cursor: "pointer",
                                background: page === p ? "#6366f1" : "#e8e8e8",
                                color: page === p ? "#fff" : "#555", fontWeight: 600, fontSize: 14,
                            }}>{p}</button>
                        ))}
                    </div>
                )}

                {/* Detail Modal */}
                {(detail || detailLoading) && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                        <div style={{ background: "#fff", borderRadius: 20, padding: 36, width: "90%", maxWidth: 640, maxHeight: "85vh", overflow: "auto" }}>
                            {detailLoading ? (
                                <div style={{ textAlign: "center", padding: 40, color: "#999" }}>Đang tải...</div>
                            ) : detail && (
                                <>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                                        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>📋 Chi tiết khiếu nại</h2>
                                        <span style={{
                                            padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                                            background: `${STATUS_COLORS[detail.status]}18`,
                                            color: STATUS_COLORS[detail.status],
                                        }}>
                                            {STATUS_LABELS[detail.status] || detail.status}
                                        </span>
                                    </div>

                                    <div style={{ display: "grid", gap: 12 }}>
                                        <InfoRow label="Tiêu đề" value={detail.title} />
                                        <InfoRow label="Mô tả" value={detail.description} />
                                        <InfoRow label="Chiến dịch" value={detail.campaignName || "—"} />
                                        <InfoRow label="Lô sản xuất" value={detail.batchName || "—"} />
                                        <InfoRow label="Nhà cung cấp" value={detail.providerName || "—"} />
                                        <InfoRow label="Ngày tạo" value={new Date(detail.createdAt).toLocaleString("vi")} />
                                        {detail.response && (
                                            <div style={{ padding: "12px 16px", background: "#f0fdf4", borderRadius: 12 }}>
                                                <p style={{ margin: 0, color: "#16a34a", fontWeight: 600, fontSize: 13 }}>✅ Phản hồi từ NCC:</p>
                                                <p style={{ margin: "4px 0 0", color: "#333", fontSize: 14 }}>{detail.response}</p>
                                                {detail.respondedAt && (
                                                    <p style={{ margin: "4px 0 0", color: "#999", fontSize: 12 }}>
                                                        Lúc: {new Date(detail.respondedAt).toLocaleString("vi")}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                                        <button onClick={() => setDetail(null)} style={{
                                            flex: 1, padding: "12px 0", borderRadius: 12,
                                            border: "1px solid #ddd", background: "#fff", fontWeight: 600, cursor: "pointer",
                                        }}>Đóng</button>

                                        <button onClick={() => openChat(detail)} style={{
                                            flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
                                            background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff",
                                            fontWeight: 600, cursor: "pointer",
                                        }}>💬 Chat</button>

                                        {detail.status === "Resolved" && (
                                            <button onClick={handleClose} disabled={closing} style={{
                                                flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
                                                background: closing ? "#ccc" : "linear-gradient(135deg, #10b981, #059669)",
                                                color: "#fff", fontWeight: 600,
                                                cursor: closing ? "not-allowed" : "pointer",
                                            }}>
                                                {closing ? "Đang đóng..." : "✅ Đóng khiếu nại"}
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
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ display: "flex", gap: 12 }}>
            <span style={{ minWidth: 120, fontWeight: 600, color: "#666", fontSize: 14 }}>{label}:</span>
            <span style={{ color: "#333", fontSize: 14 }}>{value}</span>
        </div>
    );
}
