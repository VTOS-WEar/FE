import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
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
import { useSidebarConfig } from "../../hooks/useSidebarConfig";
import { ChatWidget, type ChatContextInfo } from "../../components/ChatWidget/ChatWidget";
import {
    getSchoolContracts,
    getSchoolContractDetail,
    createContract,
    type ContractDto,
    type CreateContractRequest,
    type CreateContractItemRequest,
} from "../../lib/api/contracts";

type ProviderOption = { id: string; name: string };
type OutfitOption = { id: string; name: string; price: number };

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

export function SchoolContracts() {
    const sidebarConfig = useSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();

    const [contracts, setContracts] = useState<ContractDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [showCreate, setShowCreate] = useState(false);
    const [providers, setProviders] = useState<ProviderOption[]>([]);
    const [outfits, setOutfits] = useState<OutfitOption[]>([]);

    // ── Create form state ──
    const [contractName, setContractName] = useState("");
    const [selectedProvider, setSelectedProvider] = useState("");
    const [items, setItems] = useState<CreateContractItemRequest[]>([
        { outfitId: "", pricePerUnit: 0, minQuantity: 1, maxQuantity: 100 },
    ]);
    const [creating, setCreating] = useState(false);
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
            subtitle: `Nhà Cung Cấp: ${c.providerName || "—"} · ${c.items.length} mục`,
        });
        setChatOpen(true);
    };

    // Detail modal
    const [selected, setSelected] = useState<ContractDto | null>(null);
    const [showDetail, setShowDetail] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);

    const openDetail = async (id: string) => {
        setDetailLoading(true);
        setShowDetail(true);
        try {
            const c = await getSchoolContractDetail(id);
            setSelected(c);
        } catch (e: any) {
            console.error("Error fetching contract detail:", e);
        } finally {
            setDetailLoading(false);
        }
    };

    const closeDetail = () => {
        setShowDetail(false);
        setSelected(null);
    };

    const fetchContracts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getSchoolContracts(statusFilter || undefined);
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

    // Fetch providers + outfits for the create form
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const { api } = await import("../../lib/api/clients");
                const [prov, outfRes] = await Promise.all([
                    api<any[]>("/api/schools/me/providers", { method: "GET", auth: true }),
                    api<any>("/api/schools/me/outfits", { method: "GET", auth: true }),
                ]);
                setProviders(prov.map((p: any) => ({ id: p.providerId ?? p.id, name: p.providerName ?? p.name })));
                // API returns { items: [...], total: N } — unwrap the items array
                const outfArr = Array.isArray(outfRes) ? outfRes : (outfRes?.items ?? []);
                setOutfits(outfArr.map((o: any) => ({ id: o.outfitId ?? o.id, name: o.outfitName ?? o.name, price: o.price ?? 0 })));
            } catch (e) {
                console.error("Error fetching options:", e);
            }
        };
        fetchOptions();
    }, []);

    const handleCreate = async () => {
        setError("");
        if (!contractName.trim()) { setError("Vui lòng nhập tên hợp đồng"); return; }
        if (!selectedProvider) { setError("Vui lòng chọn nhà cung cấp"); return; }
        if (items.some(i => !i.outfitId)) { setError("Vui lòng chọn đồng phục cho tất cả mục"); return; }

        setCreating(true);
        try {
            const payload: CreateContractRequest = {
                contractName,
                providerId: selectedProvider,
                items,
            };
            await createContract(payload);
            setShowCreate(false);
            setContractName("");
            setSelectedProvider("");
            setItems([{ outfitId: "", pricePerUnit: 0, minQuantity: 1, maxQuantity: 100 }]);
            fetchContracts();
        } catch (e: any) {
            setError(e.message || "Lỗi tạo hợp đồng");
        } finally {
            setCreating(false);
        }
    };

    const addItem = () => setItems([...items, { outfitId: "", pricePerUnit: 0, minQuantity: 1, maxQuantity: 100 }]);
    const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
    const updateItem = (i: number, field: string, value: any) => {
        const next = [...items];
        (next[i] as any)[field] = value;
        setItems(next);
    };

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
                            <BreadcrumbItem><BreadcrumbLink href="/school/dashboard" className="font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                            <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                            <BreadcrumbItem><BreadcrumbPage className="font-semibold text-[#4c5769] text-base">Hợp đồng</BreadcrumbPage></BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "24px 0" }}>
                    <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1a1a2e" }}>📄 Quản lý Hợp đồng</h1>
                    <button
                        onClick={() => setShowCreate(true)}
                        style={{
                            padding: "12px 24px", borderRadius: 12, border: "none",
                            background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff",
                            fontWeight: 600, fontSize: 15, cursor: "pointer",
                            boxShadow: "0 4px 14px rgba(99,102,241,.3)",
                        }}
                    >
                        + Tạo hợp đồng mới
                    </button>
                </div>

                {/* Status filter tabs */}
                <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                    {["", "Pending", "Approved", "Rejected"].map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
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

                {/* Contract list */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: 60, color: "#999" }}>Đang tải...</div>
                ) : contracts.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 60, background: "#fff", borderRadius: 16, color: "#aaa" }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                        <p style={{ fontSize: 16 }}>Chưa có hợp đồng nào. Tạo hợp đồng mới để bắt đầu!</p>
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
                                            Nhà cung cấp: <strong>{c.providerName || "—"}</strong> &nbsp;·&nbsp; {c.items.length} mục &nbsp;·&nbsp; {new Date(c.createdAt).toLocaleDateString("vi")}
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
                                {c.rejectionReason && (
                                    <p style={{ margin: "10px 0 0", padding: "8px 12px", background: "#fef2f2", borderRadius: 8, color: "#dc2626", fontSize: 13 }}>
                                        ❌ Lý do từ chối: {c.rejectionReason}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Contract Detail Modal ── */}
                {showDetail && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                        <div style={{ background: "#fff", borderRadius: 20, padding: 36, width: "90%", maxWidth: 640, maxHeight: "85vh", overflow: "auto" }}>
                            {detailLoading ? (
                                <div style={{ textAlign: "center", padding: 40, color: "#999" }}>Đang tải...</div>
                            ) : selected && (
                                <>
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
                                        <div style={infoBox}><span style={infoLabel}>Nhà cung cấp</span><span style={infoValue}>{selected.providerName || "—"}</span></div>
                                        <div style={infoBox}><span style={infoLabel}>Ngày tạo</span><span style={infoValue}>{new Date(selected.createdAt).toLocaleDateString("vi")}</span></div>
                                        {selected.approvedAt && (
                                            <div style={infoBox}><span style={infoLabel}>Ngày duyệt</span><span style={infoValue}>{new Date(selected.approvedAt).toLocaleDateString("vi")}</span></div>
                                        )}
                                    </div>

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

                                    <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                                        <button onClick={closeDetail} style={{
                                            flex: 1, padding: "12px 0", borderRadius: 12,
                                            border: "1px solid #ddd", background: "#fff", fontWeight: 600, cursor: "pointer",
                                        }}>Đóng</button>
                                        <button onClick={() => openContractChat(selected)} style={{
                                            flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
                                            background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff",
                                            fontWeight: 600, cursor: "pointer",
                                        }}>💬 Chat</button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Create Contract Modal ── */}
                {showCreate && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                        <div style={{ background: "#fff", borderRadius: 20, padding: 36, width: "90%", maxWidth: 640, maxHeight: "85vh", overflow: "auto" }}>
                            <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 700 }}>📝 Tạo hợp đồng mới</h2>

                            {error && <div style={{ padding: "10px 14px", background: "#fef2f2", borderRadius: 8, color: "#dc2626", marginBottom: 16, fontSize: 14 }}>{error}</div>}

                            <label style={labelStyle}>Tên hợp đồng</label>
                            <input value={contractName} onChange={e => setContractName(e.target.value)} placeholder="VD: Hợp đồng đồng phục HK1 2026" style={inputStyle} />

                            <label style={labelStyle}>Nhà cung cấp</label>
                            <select value={selectedProvider} onChange={e => setSelectedProvider(e.target.value)} style={inputStyle}>
                                <option value="">-- Chọn nhà cung cấp --</option>
                                {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>

                            <div style={{ marginTop: 20 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                    <label style={{ ...labelStyle, margin: 0 }}>Danh sách đồng phục</label>
                                    <button onClick={addItem} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #6366f1", background: "transparent", color: "#6366f1", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>+ Thêm mục</button>
                                </div>

                                {items.map((item, idx) => (
                                    <div key={idx} style={{ background: "#f8fafc", padding: 16, borderRadius: 12, marginBottom: 8, position: "relative" }}>
                                        {items.length > 1 && (
                                            <button onClick={() => removeItem(idx)} style={{ position: "absolute", top: 8, right: 12, border: "none", background: "transparent", color: "#ef4444", cursor: "pointer", fontSize: 18 }}>×</button>
                                        )}
                                        <select value={item.outfitId} onChange={e => updateItem(idx, "outfitId", e.target.value)} style={{ ...inputStyle, marginBottom: 8 }}>
                                            <option value="">-- Chọn đồng phục --</option>
                                            {outfits.map(o => <option key={o.id} value={o.id}>{o.name} ({o.price.toLocaleString("vi")}₫)</option>)}
                                        </select>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                                            <div>
                                                <label style={{ fontSize: 12, color: "#888" }}>Giá/đơn vị (₫)</label>
                                                <input type="number" value={item.pricePerUnit || ""} onChange={e => updateItem(idx, "pricePerUnit", Number(e.target.value))} style={inputStyle} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: 12, color: "#888" }}>SL tối thiểu</label>
                                                <input type="number" value={item.minQuantity} onChange={e => updateItem(idx, "minQuantity", Number(e.target.value))} style={inputStyle} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: 12, color: "#888" }}>SL tối đa</label>
                                                <input type="number" value={item.maxQuantity} onChange={e => updateItem(idx, "maxQuantity", Number(e.target.value))} style={inputStyle} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                                <button onClick={() => setShowCreate(false)} style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "1px solid #ddd", background: "#fff", fontWeight: 600, cursor: "pointer" }}>Hủy</button>
                                <button onClick={handleCreate} disabled={creating} style={{
                                    flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
                                    background: creating ? "#ccc" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                    color: "#fff", fontWeight: 600, cursor: creating ? "not-allowed" : "pointer",
                                }}>
                                    {creating ? "Đang tạo..." : "Tạo hợp đồng"}
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

const labelStyle: React.CSSProperties = { display: "block", fontSize: 14, fontWeight: 600, color: "#444", marginBottom: 6, marginTop: 12 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" };
const infoBox: React.CSSProperties = { background: "#f8fafc", padding: "10px 14px", borderRadius: 10 };
const infoLabel: React.CSSProperties = { display: "block", fontSize: 12, color: "#888", marginBottom: 2 };
const infoValue: React.CSSProperties = { display: "block", fontSize: 15, fontWeight: 600, color: "#1a1a2e" };
const thStyle: React.CSSProperties = { padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#555", borderBottom: "2px solid #e8e8e8" };
const tdStyle: React.CSSProperties = { padding: "10px 12px", borderBottom: "1px solid #f0f0f0" };
