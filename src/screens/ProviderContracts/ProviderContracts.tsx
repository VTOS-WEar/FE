import { useState, useEffect, useCallback } from "react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { DashboardSidebar } from "../../components/layout";
import { useProviderSidebarConfig } from "../../hooks/useProviderSidebarConfig";
import { ChatWidget, type ChatContextInfo } from "../../components/ChatWidget/ChatWidget";
import {
    getProviderContracts,
    getProviderContractDetail,
    approveContract,
    rejectContract,
    type ContractDto,
} from "../../lib/api/contracts";

const STATUS_COLORS: Record<string, string> = {
    Pending: "#f59e0b",
    Approved: "#10b981",
    Rejected: "#ef4444",
    Expired: "#6b7280",
};

const STATUS_LABELS: Record<string, string> = {
    Pending: "Chờ duyệt",
    Approved: "Đã duyệt",
    Rejected: "Từ chối",
    Expired: "Hết hạn",
};

export function ProviderContracts() {
    const sidebarConfig = useProviderSidebarConfig();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const [contracts, setContracts] = useState<ContractDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [selected, setSelected] = useState<ContractDto | null>(null);
    const [showDetail, setShowDetail] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [showReject, setShowReject] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [error, setError] = useState("");
    // Chat
    const [chatOpen, setChatOpen] = useState(false);
    const [chatContractId, setChatContractId] = useState("");
    const [chatContext, setChatContext] = useState<ChatContextInfo | undefined>();

    const openContractChat = (c: ContractDto) => {
        setChatContractId(c.contractId);
        setChatContext({
            icon: "📄",
            title: c.contractName,
            status: STATUS_LABELS[c.status] || c.status,
            statusColor: STATUS_COLORS[c.status] || "#888",
            subtitle: `Trường: ${c.schoolName || "—"} · ${c.items.length} mục`,
        });
        setChatOpen(true);
    };

    const fetchContracts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getProviderContracts(statusFilter || undefined);
            setContracts(data);
        } catch (e: any) {
            console.error("Error fetching contracts:", e);
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchContracts();
    }, [fetchContracts]);

    const openDetail = async (id: string) => {
        try {
            const c = await getProviderContractDetail(id);
            setSelected(c);
            setShowDetail(true);
        } catch (e: any) {
            console.error("Error:", e);
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
            fetchContracts();
        } catch (e: any) {
            setError(e.message || "Lỗi duyệt hợp đồng");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!selected || !rejectReason.trim()) { setError("Vui lòng nhập lý do từ chối"); return; }
        setActionLoading(true);
        setError("");
        try {
            await rejectContract(selected.contractId, rejectReason);
            setShowDetail(false);
            setShowReject(false);
            setSelected(null);
            setRejectReason("");
            fetchContracts();
        } catch (e: any) {
            setError(e.message || "Lỗi từ chối hợp đồng");
        } finally {
            setActionLoading(false);
        }
    };

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
                            <BreadcrumbItem><BreadcrumbLink href="/provider/dashboard" className="font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                            <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                            <BreadcrumbItem><BreadcrumbPage className="font-semibold text-[#4c5769] text-base">Hợp đồng</BreadcrumbPage></BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>

                <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1a1a2e", margin: "24px 0" }}>📄 Hợp đồng</h1>

                {/* Status filter tabs */}
                <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                    {["", "Pending", "Approved", "Rejected"].map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            style={{
                                padding: "8px 20px", borderRadius: 20, border: "none", cursor: "pointer",
                                background: statusFilter === s ? "#f59e0b" : "#e8e8e8",
                                color: statusFilter === s ? "#fff" : "#555",
                                fontWeight: 600, fontSize: 14, transition: "all .2s",
                            }}
                        >
                            {s ? STATUS_LABELS[s] || s : "Tất cả"}
                        </button>
                    ))}
                </div>

                {/* Contract list */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: 60, color: "#999" }}>Đang tải...</div>
                ) : contracts.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 60, background: "#fff", borderRadius: 16, color: "#aaa" }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                        <p style={{ fontSize: 16 }}>Chưa có hợp đồng nào được gửi đến bạn.</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gap: 16 }}>
                        {contracts.map(c => (
                            <div
                                key={c.contractId}
                                onClick={() => openDetail(c.contractId)}
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
                                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#1a1a2e" }}>{c.contractName}</h3>
                                        <p style={{ margin: "4px 0 0", color: "#888", fontSize: 14 }}>
                                            Trường: <strong>{c.schoolName || "—"}</strong> &nbsp;·&nbsp; {c.items.length} mục &nbsp;·&nbsp; {new Date(c.createdAt).toLocaleDateString("vi")}
                                        </p>
                                    </div>
                                    <span style={{
                                        padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                                        background: `${STATUS_COLORS[c.status]}18`,
                                        color: STATUS_COLORS[c.status],
                                    }}>
                                        {STATUS_LABELS[c.status] || c.status}
                                    </span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openContractChat(c); }}
                                        style={{
                                            padding: "6px 14px", borderRadius: 10, border: "none",
                                            background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff",
                                            fontWeight: 600, fontSize: 13, cursor: "pointer",
                                            boxShadow: "0 2px 8px rgba(59,130,246,.3)",
                                        }}
                                    >💬 Chat</button>
                                </div>
                                {c.status === "Pending" && (
                                    <p style={{ margin: "8px 0 0", fontSize: 13, color: "#f59e0b", fontWeight: 500 }}>
                                        ⏳ Đang chờ bạn xem xét và duyệt
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Contract Detail Modal ── */}
                {showDetail && selected && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                        <div style={{ background: "#fff", borderRadius: 20, padding: 36, width: "90%", maxWidth: 640, maxHeight: "85vh", overflow: "auto" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>📄 {selected.contractName}</h2>
                                <span style={{
                                    padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                                    background: `${STATUS_COLORS[selected.status]}18`,
                                    color: STATUS_COLORS[selected.status],
                                }}>
                                    {STATUS_LABELS[selected.status] || selected.status}
                                </span>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                                <div style={infoBox}><span style={infoLabel}>Trường</span><span style={infoValue}>{selected.schoolName || "—"}</span></div>
                                <div style={infoBox}><span style={infoLabel}>Ngày tạo</span><span style={infoValue}>{new Date(selected.createdAt).toLocaleDateString("vi")}</span></div>
                            </div>

                            {error && <div style={{ padding: "10px 14px", background: "#fef2f2", borderRadius: 8, color: "#dc2626", marginBottom: 16, fontSize: 14 }}>{error}</div>}

                            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Danh sách đồng phục</h3>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                                <thead>
                                    <tr style={{ background: "#f8fafc" }}>
                                        <th style={thStyle}>Đồng phục</th>
                                        <th style={thStyle}>Giá/đơn vị</th>
                                        <th style={thStyle}>SL tối thiểu</th>
                                        <th style={thStyle}>SL tối đa</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selected.items.map(item => (
                                        <tr key={item.itemId}>
                                            <td style={tdStyle}>{item.outfitName}</td>
                                            <td style={tdStyle}>{item.pricePerUnit.toLocaleString("vi")}₫</td>
                                            <td style={{ ...tdStyle, textAlign: "center" }}>{item.minQuantity}</td>
                                            <td style={{ ...tdStyle, textAlign: "center" }}>{item.maxQuantity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {selected.rejectionReason && (
                                <div style={{ margin: "16px 0", padding: "12px 16px", background: "#fef2f2", borderRadius: 10, color: "#dc2626", fontSize: 14 }}>
                                    <strong>Lý do từ chối:</strong> {selected.rejectionReason}
                                </div>
                            )}

                            {/* Actions for Pending contracts */}
                            {selected.status === "Pending" && !showReject && (
                                <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                                    <button onClick={() => { setShowReject(true); setError(""); }} style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "2px solid #ef4444", background: "#fff", color: "#ef4444", fontWeight: 600, cursor: "pointer" }}>
                                        ❌ Từ chối
                                    </button>
                                    <button onClick={handleApprove} disabled={actionLoading} style={{
                                        flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
                                        background: actionLoading ? "#ccc" : "linear-gradient(135deg, #10b981, #059669)",
                                        color: "#fff", fontWeight: 600, cursor: actionLoading ? "not-allowed" : "pointer",
                                    }}>
                                        {actionLoading ? "Đang xử lý..." : "✅ Duyệt hợp đồng"}
                                    </button>
                                </div>
                            )}

                            {/* Reject form */}
                            {showReject && (
                                <div style={{ marginTop: 16 }}>
                                    <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#444", marginBottom: 6 }}>Lý do từ chối</label>
                                    <textarea
                                        value={rejectReason}
                                        onChange={e => setRejectReason(e.target.value)}
                                        placeholder="Giải thích lý do từ chối..."
                                        style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #ddd", fontSize: 14, minHeight: 80, boxSizing: "border-box" }}
                                    />
                                    <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                                        <button onClick={() => { setShowReject(false); setRejectReason(""); setError(""); }} style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: "1px solid #ddd", background: "#fff", fontWeight: 600, cursor: "pointer" }}>Hủy</button>
                                        <button onClick={handleReject} disabled={actionLoading} style={{
                                            flex: 1, padding: "10px 0", borderRadius: 12, border: "none",
                                            background: actionLoading ? "#ccc" : "#ef4444", color: "#fff", fontWeight: 600,
                                            cursor: actionLoading ? "not-allowed" : "pointer",
                                        }}>
                                            {actionLoading ? "Đang xử lý..." : "Xác nhận từ chối"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                                <button
                                    onClick={() => { setShowDetail(false); setSelected(null); setError(""); setShowReject(false); setRejectReason(""); }}
                                    style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: "1px solid #ddd", background: "#fff", color: "#888", cursor: "pointer", fontSize: 14, fontWeight: 600 }}
                                >
                                    Đóng
                                </button>
                                <button
                                    onClick={() => { if (selected) openContractChat(selected); }}
                                    style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 }}
                                >
                                    💬 Chat
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <ChatWidget
                    channelType="contract"
                    channelId={chatContractId}
                    isOpen={chatOpen}
                    onClose={() => setChatOpen(false)}
                    contextInfo={chatContext}
                />
            </main>
        </div>
    );
}

const infoBox: React.CSSProperties = { background: "#f8fafc", padding: "10px 14px", borderRadius: 10 };
const infoLabel: React.CSSProperties = { display: "block", fontSize: 12, color: "#888", marginBottom: 2 };
const infoValue: React.CSSProperties = { display: "block", fontSize: 15, fontWeight: 600, color: "#1a1a2e" };
const thStyle: React.CSSProperties = { padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#555", borderBottom: "2px solid #e8e8e8" };
const tdStyle: React.CSSProperties = { padding: "10px 12px", borderBottom: "1px solid #f0f0f0" };
