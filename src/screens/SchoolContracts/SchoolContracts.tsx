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
    getSchoolContracts, getSchoolContractDetail, createContract,
    type ContractDto, type CreateContractRequest, type CreateContractItemRequest,
} from "../../lib/api/contracts";

type ProviderOption = { id: string; name: string };
type OutfitOption = { id: string; name: string; price: number };

const STATUS_BADGE: Record<string, string> = {
    Pending: "nb-badge nb-badge-yellow",
    Approved: "nb-badge nb-badge-green",
    Rejected: "nb-badge nb-badge-red",
    Expired: "nb-badge bg-[#F3F4F6] text-[#6B7280]",
};
const STATUS_LABELS: Record<string, string> = { Pending: "Chờ duyệt", Approved: "Đã duyệt", Rejected: "Từ chối", Expired: "Hết hạn" };
const STATUS_COLORS: Record<string, string> = { Pending: "#f59e0b", Approved: "#10b981", Rejected: "#ef4444", Expired: "#6b7280" };

export function SchoolContracts() {
    const sidebarConfig = useSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();

    const [contracts, setContracts] = useState<ContractDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [showCreate, setShowCreate] = useState(false);
    const [providers, setProviders] = useState<ProviderOption[]>([]);
    const [outfits, setOutfits] = useState<OutfitOption[]>([]);

    // Create form
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
            icon: "📄", title: c.contractName,
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
        setDetailLoading(true); setShowDetail(true);
        try { const c = await getSchoolContractDetail(id); setSelected(c); }
        catch (e: any) { console.error(e); }
        finally { setDetailLoading(false); }
    };

    const fetchContracts = useCallback(async () => {
        setLoading(true);
        try { const data = await getSchoolContracts(statusFilter || undefined); setContracts(data); }
        catch (e: any) { console.error(e); }
        finally { setLoading(false); }
    }, [statusFilter]);

    useEffect(() => { fetchContracts(); }, [fetchContracts]);

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const { api } = await import("../../lib/api/clients");
                const [prov, outfRes] = await Promise.all([
                    api<any[]>("/api/schools/me/providers", { method: "GET", auth: true }),
                    api<any>("/api/schools/me/outfits", { method: "GET", auth: true }),
                ]);
                setProviders(prov.map((p: any) => ({ id: p.providerId ?? p.id, name: p.providerName ?? p.name })));
                const outfArr = Array.isArray(outfRes) ? outfRes : (outfRes?.items ?? []);
                setOutfits(outfArr.map((o: any) => ({ id: o.outfitId ?? o.id, name: o.outfitName ?? o.name, price: o.price ?? 0 })));
            } catch (e) { console.error(e); }
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
            await createContract({ contractName, providerId: selectedProvider, items } as CreateContractRequest);
            setShowCreate(false); setContractName(""); setSelectedProvider("");
            setItems([{ outfitId: "", pricePerUnit: 0, minQuantity: 1, maxQuantity: 100 }]);
            fetchContracts();
        } catch (e: any) { setError(e.message || "Lỗi tạo hợp đồng"); }
        finally { setCreating(false); }
    };

    const addItem = () => setItems([...items, { outfitId: "", pricePerUnit: 0, minQuantity: 1, maxQuantity: 100 }]);
    const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
    const updateItem = (i: number, field: string, value: any) => {
        const next = [...items]; (next[i] as any)[field] = value; setItems(next);
    };

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
                            <BreadcrumbItem><BreadcrumbPage className="font-bold text-[#1A1A2E] text-base">Hợp đồng</BreadcrumbPage></BreadcrumbItem>
                        </BreadcrumbList></Breadcrumb>
                    </TopNavBar>
                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6">

                        <div className="flex items-center justify-between">
                            <h1 className="font-extrabold text-[#1A1A2E] text-[28px]">📄 Quản lý Hợp đồng</h1>
                            <button onClick={() => setShowCreate(true)} className="nb-btn nb-btn-purple text-sm">+ Tạo hợp đồng mới</button>
                        </div>

                        {/* Status tabs — NB */}
                        <div className="nb-tabs w-fit">
                            {["", "Pending", "Approved", "Rejected"].map(s => (
                                <button key={s} onClick={() => setStatusFilter(s)}
                                    className={`nb-tab ${statusFilter === s ? "nb-tab-active" : ""}`}>
                                    {s ? STATUS_LABELS[s] || s : "Tất cả"}
                                </button>
                            ))}
                        </div>

                        {/* Contract list — NB cards */}
                        {loading ? (
                            <div className="text-center py-16">
                                <div className="inline-block w-8 h-8 border-4 border-[#6938EF] border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : contracts.length === 0 ? (
                            <div className="nb-card-static p-12 text-center">
                                <p className="text-4xl mb-3">📋</p>
                                <p className="font-medium text-[#9CA3AF]">Chưa có hợp đồng nào. Tạo hợp đồng mới để bắt đầu!</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {contracts.map(c => (
                                    <div key={c.contractId} onClick={() => openDetail(c.contractId)}
                                        className="nb-card p-5 cursor-pointer">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-[#1A1A2E] text-lg">{c.contractName}</h3>
                                                <p className="text-sm text-[#6B7280] mt-1">
                                                    NCC: <strong className="text-[#1A1A2E]">{c.providerName || "—"}</strong> · {c.items.length} mục · {new Date(c.createdAt).toLocaleDateString("vi")}
                                                </p>
                                            </div>
                                            <span className={STATUS_BADGE[c.status] || "nb-badge"}>{STATUS_LABELS[c.status] || c.status}</span>
                                            <button onClick={(e) => { e.stopPropagation(); openContractChat(c); }}
                                                className="nb-btn nb-btn-sm text-xs bg-[#3B82F6] text-white border-[#1A1A2E]">💬 Chat</button>
                                        </div>
                                        {c.rejectionReason && (
                                            <div className="nb-alert nb-alert-error mt-3 text-xs">
                                                <span>❌</span><span>Lý do từ chối: {c.rejectionReason}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Detail Modal — NB style */}
            {showDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setShowDetail(false); setSelected(null); }}>
                    <div className="bg-white rounded-xl w-full max-w-lg mx-4 p-6 max-h-[85vh] overflow-auto border-2 border-[#1A1A2E] shadow-[6px_6px_0_#1A1A2E]" onClick={e => e.stopPropagation()}>
                        {detailLoading ? (
                            <div className="text-center py-10 text-[#9CA3AF]">Đang tải...</div>
                        ) : selected && (
                            <>
                                <div className="flex justify-between items-center mb-5">
                                    <h2 className="font-extrabold text-xl text-[#1A1A2E]">📄 {selected.contractName}</h2>
                                    <span className={STATUS_BADGE[selected.status] || "nb-badge"}>{STATUS_LABELS[selected.status] || selected.status}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-5">
                                    <div className="nb-card-static p-3"><p className="text-xs text-[#9CA3AF] font-bold uppercase mb-1">Nhà cung cấp</p><p className="text-sm font-bold text-[#1A1A2E]">{selected.providerName || "—"}</p></div>
                                    <div className="nb-card-static p-3"><p className="text-xs text-[#9CA3AF] font-bold uppercase mb-1">Ngày tạo</p><p className="text-sm font-bold text-[#1A1A2E]">{new Date(selected.createdAt).toLocaleDateString("vi")}</p></div>
                                    {selected.approvedAt && (
                                        <div className="nb-card-static p-3 col-span-2"><p className="text-xs text-[#9CA3AF] font-bold uppercase mb-1">Ngày duyệt</p><p className="text-sm font-bold text-[#1A1A2E]">{new Date(selected.approvedAt).toLocaleDateString("vi")}</p></div>
                                    )}
                                </div>
                                <h3 className="font-bold text-sm text-[#1A1A2E] mb-3">Danh sách đồng phục</h3>
                                <table className="nb-table mb-4">
                                    <thead><tr><th>Đồng phục</th><th>Giá/đvị</th><th className="text-center">SL min</th><th className="text-center">SL max</th></tr></thead>
                                    <tbody>
                                        {selected.items.map(item => (
                                            <tr key={item.itemId}>
                                                <td className="font-bold text-[#1A1A2E]">{item.outfitName}</td>
                                                <td>{item.pricePerUnit.toLocaleString("vi")}₫</td>
                                                <td className="text-center">{item.minQuantity}</td>
                                                <td className="text-center">{item.maxQuantity}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {selected.rejectionReason && (
                                    <div className="nb-alert nb-alert-error text-sm mb-4"><span>❌</span><span><strong>Lý do từ chối:</strong> {selected.rejectionReason}</span></div>
                                )}
                                <div className="flex gap-3">
                                    <button onClick={() => { setShowDetail(false); setSelected(null); }} className="flex-1 nb-btn nb-btn-outline text-sm">Đóng</button>
                                    <button onClick={() => openContractChat(selected)} className="flex-1 nb-btn text-sm bg-[#3B82F6] text-white border-[#1A1A2E]">💬 Chat</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Create Contract Modal — NB style */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreate(false)}>
                    <div className="bg-white rounded-xl w-full max-w-lg mx-4 p-6 max-h-[85vh] overflow-auto border-2 border-[#1A1A2E] shadow-[6px_6px_0_#1A1A2E]" onClick={e => e.stopPropagation()}>
                        <h2 className="font-extrabold text-xl text-[#1A1A2E] mb-5">📝 Tạo hợp đồng mới</h2>
                        {error && <div className="nb-alert nb-alert-error text-sm mb-4"><span>⚠️</span><span>{error}</span></div>}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[#6B7280] mb-1">Tên hợp đồng</label>
                                <input value={contractName} onChange={e => setContractName(e.target.value)} placeholder="VD: Hợp đồng đồng phục HK1 2026" className="nb-input w-full" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#6B7280] mb-1">Nhà cung cấp</label>
                                <select value={selectedProvider} onChange={e => setSelectedProvider(e.target.value)} className="nb-select w-full">
                                    <option value="">-- Chọn nhà cung cấp --</option>
                                    {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-bold text-[#6B7280]">Danh sách đồng phục</label>
                                    <button onClick={addItem} className="nb-btn nb-btn-outline nb-btn-sm text-xs">+ Thêm mục</button>
                                </div>
                                {items.map((item, idx) => (
                                    <div key={idx} className="nb-card-static p-4 mb-2 relative">
                                        {items.length > 1 && (
                                            <button onClick={() => removeItem(idx)} className="absolute top-2 right-3 text-[#EF4444] font-bold text-lg hover:text-[#DC2626]">×</button>
                                        )}
                                        <select value={item.outfitId} onChange={e => updateItem(idx, "outfitId", e.target.value)} className="nb-select w-full text-sm mb-2">
                                            <option value="">-- Chọn đồng phục --</option>
                                            {outfits.map(o => <option key={o.id} value={o.id}>{o.name} ({o.price.toLocaleString("vi")}₫)</option>)}
                                        </select>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div>
                                                <label className="text-[10px] text-[#9CA3AF] font-bold">Giá/đvị (₫)</label>
                                                <input type="number" value={item.pricePerUnit || ""} onChange={e => updateItem(idx, "pricePerUnit", Number(e.target.value))} className="nb-input w-full text-sm" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-[#9CA3AF] font-bold">SL tối thiểu</label>
                                                <input type="number" value={item.minQuantity} onChange={e => updateItem(idx, "minQuantity", Number(e.target.value))} className="nb-input w-full text-sm" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-[#9CA3AF] font-bold">SL tối đa</label>
                                                <input type="number" value={item.maxQuantity} onChange={e => updateItem(idx, "maxQuantity", Number(e.target.value))} className="nb-input w-full text-sm" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 mt-5">
                            <button onClick={() => setShowCreate(false)} className="flex-1 nb-btn nb-btn-outline text-sm">Hủy</button>
                            <button onClick={handleCreate} disabled={creating} className="flex-1 nb-btn nb-btn-purple text-sm disabled:opacity-50">
                                {creating ? "Đang tạo..." : "Tạo hợp đồng"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ChatWidget channelType="contract" channelId={chatContractId} isOpen={chatOpen} onClose={() => setChatOpen(false)} contextInfo={chatContext} />
        </div>
    );
}
