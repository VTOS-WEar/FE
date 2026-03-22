import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useState, useEffect, useCallback } from "react";
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { DashboardSidebar } from "../../components/layout";
import { ChatWidget, type ChatContextInfo } from "../../components/ChatWidget/ChatWidget";
import {
    getProviderComplaints, getProviderComplaintDetail, respondComplaint,
    type ComplaintDto, type ComplaintDetailDto,
} from "../../lib/api/complaints";

// Provider sidebar config
import { PROVIDER_SIDEBAR_CONFIG } from "../../constants/providerDashboardConfig";
import { useMemo } from "react";
import { useLocation } from "react-router-dom";

function useProviderSidebar() {
    const { pathname } = useLocation();
    return useMemo(() => ({
        ...PROVIDER_SIDEBAR_CONFIG,
        topNavItems: (PROVIDER_SIDEBAR_CONFIG.topNavItems || []).map(item => ({
            ...item,
            active: item.href ? pathname === item.href || pathname.startsWith(item.href + "/") : false,
        })),
        navSections: PROVIDER_SIDEBAR_CONFIG.navSections.map(section => ({
            ...section,
            items: section.items.map(item => ({
                ...item,
                active: item.href ? pathname === item.href || pathname.startsWith(item.href + "/") : false,
            })),
        })),
    }), [pathname]);
}

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

export function ProviderComplaints() {
    const sidebarConfig = useProviderSidebar();
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
            status: STATUS_LABELS[c.status] || c.status,
            statusColor: STATUS_COLORS[c.status] || "#888",
            subtitle: `Chiến dịch: ${c.campaignName || "—"}`,
        });
        setChatOpen(true);
    };

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "#f5f5f5" }}>
            <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[20rem] xl:w-[23.75rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} />
            </div>

            <main style={{ flex: 1, padding: "32px 40px" }}>
                {/* Breadcrumb */}
                <div style={{ marginBottom: 8 }}>
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem><BreadcrumbLink href="/provider/dashboard" className="font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                            <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                            <BreadcrumbItem><BreadcrumbPage className="font-semibold text-[#4c5769] text-base">Khiếu nại</BreadcrumbPage></BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>

                <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1a1a2e", margin: "24px 0" }}>📋 Khiếu nại từ Trường học</h1>

                {/* Status tabs */}
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

                {/* List */}
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
                                            Chiến dịch: <strong>{c.campaignName || "—"}</strong> &nbsp;·&nbsp;
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

                {/* Detail + Respond Modal */}
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
                                        <InfoRow label="Ngày tạo" value={new Date(detail.createdAt).toLocaleString("vi")} />

                                        {detail.response && (
                                            <div style={{ padding: "12px 16px", background: "#f0fdf4", borderRadius: 12 }}>
                                                <p style={{ margin: 0, color: "#16a34a", fontWeight: 600, fontSize: 13 }}>✅ Phản hồi của bạn:</p>
                                                <p style={{ margin: "4px 0 0", color: "#333", fontSize: 14 }}>{detail.response}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Respond form — only show when Open or InProgress */}
                                    {(detail.status === "Open" || detail.status === "InProgress") && (
                                        <div style={{ marginTop: 20, padding: "16px", background: "#f8fafc", borderRadius: 12 }}>
                                            <label style={{ display: "block", fontWeight: 600, color: "#444", fontSize: 14, marginBottom: 8 }}>
                                                ✍️ Phản hồi khiếu nại
                                            </label>
                                            <textarea
                                                value={responseText}
                                                onChange={e => setResponseText(e.target.value)}
                                                placeholder="Nhập phản hồi..."
                                                rows={3}
                                                style={{
                                                    width: "100%", padding: "10px 14px", borderRadius: 10,
                                                    border: "1px solid #ddd", fontSize: 14, resize: "vertical",
                                                    boxSizing: "border-box",
                                                }}
                                            />
                                            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 14, color: "#555", cursor: "pointer" }}>
                                                <input
                                                    type="checkbox"
                                                    checked={markResolved}
                                                    onChange={e => setMarkResolved(e.target.checked)}
                                                    style={{ width: 18, height: 18, accentColor: "#10b981" }}
                                                />
                                                Đánh dấu đã giải quyết
                                            </label>
                                        </div>
                                    )}

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

                                        {(detail.status === "Open" || detail.status === "InProgress") && (
                                            <button onClick={handleRespond} disabled={responding || !responseText.trim()} style={{
                                                flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
                                                background: responding || !responseText.trim() ? "#ccc" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                                color: "#fff", fontWeight: 600,
                                                cursor: responding || !responseText.trim() ? "not-allowed" : "pointer",
                                            }}>
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
