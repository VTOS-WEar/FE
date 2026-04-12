import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useState, useEffect, useCallback } from "react";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useProviderSidebarConfig } from "../../hooks/useProviderSidebarConfig";
import { ChatWidget, type ChatContextInfo } from "../../components/ChatWidget/ChatWidget";
import {
    getProviderContracts,
    getProviderContractDetail,
    approveContract,
    rejectContract,
    signProviderContract, requestProviderSignOTP,
    type ContractDto,
} from "../../lib/api/contracts";
import { ContractTemplate, type ContractTemplateData } from "../../components/ContractTemplate";

const STATUS_MAP: Record<string, { label: string; badge: string }> = {
    Pending: { label: "Chờ duyệt", badge: "nb-badge nb-badge-yellow" },
    PendingSchoolSign: { label: "Chờ trường ký", badge: "nb-badge bg-[#FEF3C7] text-[#92400E] border-[#1A1A2E]" },
    PendingProviderSign: { label: "✍️ Chờ bạn ký", badge: "nb-badge bg-[#E0E7FF] text-[#3730A3] border-[#1A1A2E]" },
    Active: { label: "Đang hiệu lực", badge: "nb-badge bg-[#D1FAE5] text-[#065F46] border-[#1A1A2E]" },
    InUse: { label: "Đang dùng", badge: "nb-badge bg-[#DBEAFE] text-[#1D4ED8] border-[#1A1A2E]" },
    Fulfilled: { label: "Hoàn thành", badge: "nb-badge bg-[#D1FAE5] text-[#065F46] border-[#1A1A2E]" },
    Rejected: { label: "Từ chối", badge: "nb-badge nb-badge-red" },
    Expired: { label: "Hết hạn", badge: "nb-badge bg-[#F3F4F6] text-[#6B7280]" },
};

export function ProviderContracts() {
    const sidebarConfig = useProviderSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();

    const [contracts, setContracts] = useState<ContractDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const [selected, setSelected] = useState<ContractDto | null>(null);
    const [showDetail, setShowDetail] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [showReject, setShowReject] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [error, setError] = useState("");

    // Contract Template (full document view + signing)
    const [templateContract, setTemplateContract] = useState<ContractTemplateData | null>(null);
    const [templateLoading, setTemplateLoading] = useState(false);

    const openContractTemplate = async (id: string) => {
        setTemplateLoading(true);
        try {
            const c = await getProviderContractDetail(id);
            setTemplateContract(c as ContractTemplateData);
        } catch (e: any) { console.error(e); }
        finally { setTemplateLoading(false); }
    };

    const handleProviderSign = async (sigData: string, otpCode: string, pdfBase64?: string) => {
        if (!templateContract) return;
        await signProviderContract(templateContract.contractId, sigData, otpCode, pdfBase64);
        fetchContracts();
    };

    const handleRequestProviderOTP = async () => {
        if (!templateContract) return;
        await requestProviderSignOTP(templateContract.contractId);
    };

    // Chat
    const [chatOpen, setChatOpen] = useState(false);
    const [chatContractId, setChatContractId] = useState("");
    const [chatContext, setChatContext] = useState<ChatContextInfo | undefined>();

    const openContractChat = (c: ContractDto) => {
        setChatContractId(c.contractId);
        setChatContext({
            icon: "📄",
            title: c.contractName,
            status: STATUS_MAP[c.status]?.label || c.status,
            statusColor: "#888",
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

    const filterTabs = [
        { value: "", label: "Tất cả" },
        { value: "Pending", label: "Chờ duyệt" },
        { value: "PendingSchoolSign", label: "Chờ trường ký" },
        { value: "PendingProviderSign", label: "✍️ Chờ bạn ký" },
        { value: "Active", label: "Đang hiệu lực" },
        { value: "InUse", label: "Đang dùng" },
        { value: "Fulfilled", label: "Hoàn thành" },
        { value: "Rejected", label: "Từ chối" },
        { value: "Expired", label: "Hết hạn" },
    ];

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} />
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                    <TopNavBar>
                        <h1 className="font-extrabold text-[#1A1A2E] text-2xl">📄 Hợp đồng</h1>
                        <p className="font-medium text-[#6B7280] text-sm mt-1">Quản lý hợp đồng từ các trường học</p>
                    </TopNavBar>

                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6">
                        {/* Status filter tabs */}
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

                        {/* Contract list */}
                        {loading ? (
                            <div className="text-center py-20">
                                <div className="inline-block w-8 h-8 border-4 border-[#6938EF] border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : contracts.length === 0 ? (
                            <div className="nb-card-static p-10 text-center">
                                <div className="text-5xl mb-3">📋</div>
                                <p className="font-medium text-[#9CA3AF] text-base">Chưa có hợp đồng nào được gửi đến bạn.</p>
                            </div>
                        ) : (() => {
                            const totalPages = Math.ceil(contracts.length / pageSize);
                            const paged = contracts.slice((page - 1) * pageSize, page * pageSize);
                            return (
                                <>
                                    <div className="space-y-4">
                                        {paged.map(c => (
                                            <div
                                                key={c.contractId}
                                                onClick={() => openDetail(c.contractId)}
                                                className="nb-card p-5 cursor-pointer"
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-bold text-[#1A1A2E] text-base truncate">{c.contractName}</h3>
                                                        <p className="font-medium text-[#9CA3AF] text-sm mt-1">
                                                            Trường: <strong className="text-[#6B7280]">{c.schoolName || "—"}</strong> &nbsp;·&nbsp; {c.items.length} mục &nbsp;·&nbsp; Hạn: {new Date(c.expiresAt).toLocaleDateString("vi")}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={STATUS_MAP[c.status]?.badge || "nb-badge"}>
                                                            {STATUS_MAP[c.status]?.label || c.status}
                                                        </span>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); openContractTemplate(c.contractId); }}
                                                            disabled={templateLoading}
                                                            className="nb-btn nb-btn-sm text-xs bg-[#EDE9FE] border-[#1A1A2E] disabled:opacity-50"
                                                        >📄 Xem HĐ</button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); openContractChat(c); }}
                                                            className="nb-btn nb-btn-sm nb-btn-purple"
                                                        >💬 Chat</button>
                                                    </div>
                                                </div>
                                                {c.status === "Pending" && (
                                                    <p className="font-medium text-[#F59E0B] text-sm mt-2">
                                                        ⏳ Đang chờ bạn xem xét và duyệt
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-center gap-3 mt-4">
                                            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="nb-btn nb-btn-outline nb-btn-sm text-sm">← Trước</button>
                                            <span className="text-sm font-bold text-[#6B7280]">{page}/{totalPages}</span>
                                            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="nb-btn nb-btn-outline nb-btn-sm text-sm">Sau →</button>
                                        </div>
                                    )}
                                </>
                            );
                        })()}

                        {/* ── Contract Detail Modal ── */}
                        {showDetail && selected && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
                                <div className="nb-card-static p-8 w-full max-w-[640px] max-h-[85vh] overflow-auto">
                                    <div className="flex items-center justify-between mb-5">
                                        <h2 className="font-extrabold text-[#1A1A2E] text-xl truncate" title={selected.contractName}>📄 {selected.contractName}</h2>
                                        <span className={STATUS_MAP[selected.status]?.badge || "nb-badge"}>
                                            {STATUS_MAP[selected.status]?.label || selected.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-5">
                                        <div className="bg-[#F8FAFC] border-2 border-[#E5E7EB] rounded-lg p-3">
                                            <span className="block text-xs font-bold text-[#9CA3AF] uppercase mb-1">Trường</span>
                                            <span className="block text-sm font-bold text-[#1A1A2E]">{selected.schoolName || "—"}</span>
                                        </div>
                                        <div className="bg-[#F8FAFC] border-2 border-[#E5E7EB] rounded-lg p-3">
                                            <span className="block text-xs font-bold text-[#9CA3AF] uppercase mb-1">Ngày tạo</span>
                                            <span className="block text-sm font-bold text-[#1A1A2E]">{new Date(selected.createdAt).toLocaleDateString("vi")}</span>
                                        </div>
                                        <div className="bg-[#F8FAFC] border-2 border-[#E5E7EB] rounded-lg p-3">
                                            <span className="block text-xs font-bold text-[#9CA3AF] uppercase mb-1">Thời hạn</span>
                                            <span className="block text-sm font-bold text-[#1A1A2E]">{new Date(selected.expiresAt).toLocaleDateString("vi")}</span>
                                        </div>
                                        {selected.approvedAt && (
                                            <div className="bg-[#F8FAFC] border-2 border-[#E5E7EB] rounded-lg p-3">
                                                <span className="block text-xs font-bold text-[#9CA3AF] uppercase mb-1">Ngày duyệt</span>
                                                <span className="block text-sm font-bold text-[#1A1A2E]">{new Date(selected.approvedAt).toLocaleDateString("vi")}</span>
                                            </div>
                                        )}
                                    </div>

                                    {error && <div className="nb-alert nb-alert-error mb-4">{error}</div>}

                                    <h3 className="font-extrabold text-[#1A1A2E] text-base mb-3">Danh sách đồng phục</h3>
                                    <table className="nb-table">
                                        <thead>
                                            <tr>
                                                <th>Đồng phục</th>
                                                <th>Giá/đơn vị</th>
                                                <th>SL tối thiểu</th>
                                                <th>SL tối đa</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selected.items.map(item => (
                                                <tr key={item.itemId}>
                                                    <td>{item.outfitName}</td>
                                                    <td>{item.pricePerUnit.toLocaleString("vi")}₫</td>
                                                    <td className="text-center">{item.minQuantity}</td>
                                                    <td className="text-center">{item.maxQuantity}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {selected.rejectionReason && (
                                        <div className="nb-alert nb-alert-error mt-4">
                                            <strong>Lý do từ chối:</strong> {selected.rejectionReason}
                                        </div>
                                    )}

                                    {/* Actions for Pending contracts */}
                                    {selected.status === "Pending" && !showReject && (
                                        <div className="flex gap-3 mt-6 flex-wrap">
                                            <button onClick={() => { setShowReject(true); setError(""); }} className="nb-btn nb-btn-red flex-1">
                                                ❌ Từ chối
                                            </button>
                                            <button
                                                onClick={() => { openContractTemplate(selected.contractId); setShowDetail(false); setSelected(null); }}
                                                className="nb-btn flex-1 text-sm bg-[#EDE9FE] border-[#1A1A2E]"
                                            >
                                                ✍️ Xem & Ký HĐ
                                            </button>
                                        </div>
                                    )}

                                    {/* Reject form */}
                                    {showReject && (
                                        <div className="mt-4 bg-[#FEF2F2] border-2 border-[#FECACA] rounded-xl p-4">
                                            <label className="block text-sm font-bold text-[#1A1A2E] mb-2">Lý do từ chối</label>
                                            <textarea
                                                value={rejectReason}
                                                onChange={e => setRejectReason(e.target.value)}
                                                placeholder="Giải thích lý do từ chối..."
                                                className="nb-input w-full min-h-[80px] resize-y"
                                                maxLength={500}
                                            />
                                            <div className="flex gap-3 mt-3">
                                                <button onClick={() => { setShowReject(false); setRejectReason(""); setError(""); }} className="nb-btn nb-btn-outline flex-1">Hủy</button>
                                                <button onClick={handleReject} disabled={actionLoading} className="nb-btn nb-btn-red flex-1">
                                                    {actionLoading ? "Đang xử lý..." : "Xác nhận từ chối"}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-3 mt-4">
                                        <button
                                            onClick={() => { setShowDetail(false); setSelected(null); setError(""); setShowReject(false); setRejectReason(""); }}
                                            className="nb-btn nb-btn-outline flex-1"
                                        >
                                            Đóng
                                        </button>
                                        <button
                                            onClick={() => { if (selected) openContractChat(selected); }}
                                            className="nb-btn nb-btn-purple flex-1"
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
            </div>

            {/* Contract Template full-document viewer */}
            {templateLoading && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-md border-2 border-[#1A1A2E] px-8 py-5 shadow-[4px_4px_0_#1A1A2E] flex items-center gap-3">
                        <div className="w-5 h-5 border-3 border-[#6938EF] border-t-transparent rounded-full animate-spin" />
                        <span className="font-bold text-[#1A1A2E]">Đang tải hợp đồng...</span>
                    </div>
                </div>
            )}
            {templateContract && !templateLoading && (
                <ContractTemplate
                    contract={templateContract}
                    viewerRole="provider"
                    onRequestProviderOTP={handleRequestProviderOTP}
                    onProviderSign={handleProviderSign}
                    onClose={() => setTemplateContract(null)}
                />
            )}
        </div>
    );
}
