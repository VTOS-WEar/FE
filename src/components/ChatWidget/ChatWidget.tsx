import { useState, useEffect, useRef, useCallback } from "react";
import { HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import {
    getChatMessages, sendChatMessage, sendUniformProposal, acceptUniformProposal,
    type ChatMessageDto,
} from "../../lib/api/chat";

export type ChatContextInfo = {
    icon: string;
    title: string;
    status: string;
    statusColor: string;
    subtitle: string;
};

type ChatWidgetProps = {
    channelType: string;
    channelId: string;
    isOpen: boolean;
    onClose: () => void;
    contextInfo?: ChatContextInfo;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

function getAccessToken(): string {
    return localStorage.getItem("access_token") || sessionStorage.getItem("access_token") || "";
}

function getCurrentUserRole(): string {
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    try { if (raw) return JSON.parse(raw).role || ""; } catch { /* ignore */ }
    return "";
}

export function ChatWidget({ channelType, channelId, isOpen, onClose, contextInfo }: ChatWidgetProps) {
    const [messages, setMessages] = useState<ChatMessageDto[]>([]);
    const [newMsg, setNewMsg] = useState("");
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [connected, setConnected] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const connectionRef = useRef<ReturnType<typeof buildConnection> | null>(null);

    // Proposal form state (Provider only)
    const [showProposalForm, setShowProposalForm] = useState(false);
    const [proposalName, setProposalName] = useState("");
    const [proposalImage, setProposalImage] = useState<File | null>(null);
    const [sendingProposal, setSendingProposal] = useState(false);
    const [acceptingId, setAcceptingId] = useState<string | null>(null);

    const userRole = getCurrentUserRole();
    const isProvider = userRole === "Provider";
    const isSchool = userRole === "School";
    const isContractChat = channelType === "contract";
    const channelLabel = channelType === "classgroup"
        ? "Nhóm lớp"
        : channelType === "complaint"
            ? "Khiếu nại"
            : "Hợp đồng";
    const widgetTitle = channelType === "classgroup" && contextInfo?.title ? contextInfo.title : "Chat";

    function buildConnection() {
        return new HubConnectionBuilder()
            .withUrl(`${API_BASE}/hubs/chat`, { accessTokenFactory: () => getAccessToken() })
            .withAutomaticReconnect([0, 2000, 5000, 10000])
            .configureLogging(LogLevel.Warning)
            .build();
    }

    const fetchMessages = useCallback(async () => {
        try { const res = await getChatMessages(channelType, channelId); setMessages(res.items); }
        catch (e) { console.error("Error fetching messages:", e); }
    }, [channelType, channelId]);

    useEffect(() => {
        if (!isOpen || !channelId) return;
        const connection = buildConnection();
        connectionRef.current = connection;

        connection.on("ReceiveMessage", (msg: ChatMessageDto) => {
            const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
            let currentUserId = "";
            try { if (raw) currentUserId = JSON.parse(raw).userId || JSON.parse(raw).id || ""; } catch { /* ignore */ }
            const fixedMsg = { ...msg, isMe: currentUserId ? msg.senderUserId === currentUserId : msg.isMe };
            setMessages(prev => prev.some(m => m.messageId === fixedMsg.messageId) ? prev : [...prev, fixedMsg]);
        });
        connection.onreconnected(() => {
            connection.invoke("JoinChannel", channelType, channelId).catch(() => {});
            setConnected(true);
        });
        connection.onclose(() => setConnected(false));
        connection.start()
            .then(() => { setConnected(true); return connection.invoke("JoinChannel", channelType, channelId); })
            .catch(err => { console.warn("SignalR failed, polling fallback:", err); setConnected(false); });

        return () => {
            if (connection.state === HubConnectionState.Connected)
                connection.invoke("LeaveChannel", channelType, channelId).catch(() => {});
            connection.stop(); connectionRef.current = null; setConnected(false);
        };
    }, [isOpen, channelId, channelType]);

    useEffect(() => {
        if (!isOpen || !channelId) return;
        setLoading(true); fetchMessages().finally(() => setLoading(false));
        pollRef.current = setInterval(() => { if (!connected) fetchMessages(); }, 5000);
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [isOpen, channelId, fetchMessages, connected]);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    const handleSend = async () => {
        const content = newMsg.trim(); if (!content || sending) return;
        setSending(true);
        try { await sendChatMessage(channelType, channelId, content); setNewMsg(""); if (!connected) await fetchMessages(); }
        catch (e: any) { console.error("Error sending:", e); }
        finally { setSending(false); }
    };

    const handleSendProposal = async () => {
        if (!proposalName.trim() || !proposalImage || sendingProposal) return;
        setSendingProposal(true);
        try {
            await sendUniformProposal(channelId, proposalName.trim(), proposalImage);
            setProposalName(""); setProposalImage(null); setShowProposalForm(false);
            if (!connected) await fetchMessages();
        } catch (e: any) { alert(e.message || "Lỗi gửi đề xuất"); }
        finally { setSendingProposal(false); }
    };

    const handleAcceptProposal = async (messageId: string) => {
        if (!confirm("Chấp nhận đề xuất này? Đồng phục sẽ được tạo trong danh mục trường.")) return;
        setAcceptingId(messageId);
        try {
            await acceptUniformProposal(messageId);
            await fetchMessages();
        } catch (e: any) { alert(e.message || "Lỗi chấp nhận đề xuất"); }
        finally { setAcceptingId(null); }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

    if (!isOpen) return null;

    // ── Render a single message ──
    const renderMessage = (m: ChatMessageDto) => {
        const msgType = m.messageType || "Text";

        // System notification
        if (msgType === "SystemNotification") {
            return (
                <div key={m.messageId} className="flex justify-center my-2">
                    <div className="px-3 py-2 rounded-lg bg-violet-50 border border-gray-200/20 text-xs text-center max-w-[85%]">
                        {m.imageUrl && (
                            <img src={m.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover mx-auto mb-2 border border-gray-200/30" />
                        )}
                        <span className="font-semibold text-violet-600">{m.content}</span>
                        <p className="text-[10px] text-gray-400 mt-1">
                            {new Date(m.sentAt).toLocaleTimeString("vi", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                    </div>
                </div>
            );
        }

        // Uniform proposal card
        if (msgType === "UniformProposal") {
            const isPending = m.proposalStatus === "Pending";
            const isAccepted = m.proposalStatus === "Accepted";
            return (
                <div key={m.messageId} className={`max-w-[85%] ${m.isMe ? "self-end" : "self-start"}`}>
                    {!m.isMe && <span className="text-[11px] text-gray-500 mb-0.5 block font-bold">{m.senderName}</span>}
                    <div className={`rounded-xl border border-gray-200 overflow-hidden shadow-soft-sm ${
                        m.isMe ? "bg-[#F3F0FF]" : "bg-white"
                    }`}>
                        {/* Proposal header */}
                        <div className="px-3 py-2 bg-[#6938EF]/10 border-b border-gray-200/20 flex items-center gap-2">
                            <span className="text-sm">📋</span>
                            <span className="text-[11px] font-extrabold text-violet-600 uppercase tracking-wider">Đề xuất đồng phục</span>
                            {isAccepted && (
                                <span className="ml-auto text-[10px] font-bold bg-[#D1FAE5] text-emerald-800 px-2 py-0.5 rounded-full border border-[#065F46]/30">
                                    ✓ Đã chấp nhận
                                </span>
                            )}
                            {isPending && (
                                <span className="ml-auto text-[10px] font-bold bg-[#FEF3C7] text-amber-800 px-2 py-0.5 rounded-full border border-[#92400E]/30">
                                    Chờ duyệt
                                </span>
                            )}
                        </div>
                        {/* Image */}
                        {m.imageUrl && (
                            <div className="aspect-[4/3] overflow-hidden bg-[#F6F1E8]">
                                <img src={m.imageUrl} alt={m.proposalOutfitName || ""} className="w-full h-full object-cover" />
                            </div>
                        )}
                        {/* Info */}
                        <div className="px-3 py-2.5">
                            <p className="font-bold text-gray-900 text-sm truncate">{m.proposalOutfitName || "N/A"}</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">{m.content}</p>
                        </div>
                        {/* Accept button (School only, Pending only) */}
                        {isSchool && isPending && !m.isMe && (
                            <div className="px-3 pb-3">
                                <button
                                    onClick={() => handleAcceptProposal(m.messageId)}
                                    disabled={acceptingId === m.messageId}
                                    className="w-full nb-btn nb-btn-green text-xs disabled:opacity-50"
                                >
                                    {acceptingId === m.messageId ? "Đang xử lý..." : "✓ Chấp nhận đề xuất"}
                                </button>
                            </div>
                        )}
                    </div>
                    <span className={`text-[10px] text-gray-400 mt-0.5 block ${m.isMe ? "text-right" : "text-left"}`}>
                        {new Date(m.sentAt).toLocaleTimeString("vi", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                </div>
            );
        }

        // Normal text message
        return (
            <div key={m.messageId} className={`max-w-[80%] ${m.isMe ? "self-end" : "self-start"}`}>
                {!m.isMe && <span className="text-[11px] text-gray-500 mb-0.5 block font-bold">{m.senderName}</span>}
                <div className={`px-3.5 py-2.5 text-sm leading-relaxed border border-gray-200 break-all ${
                    m.isMe
                        ? "bg-[#6938EF] text-white rounded-xl rounded-br-sm shadow-sm"
                        : "bg-white text-gray-900 rounded-xl rounded-bl-sm shadow-sm"
                }`}>
                    {m.content}
                </div>
                <span className={`text-[10px] text-gray-400 mt-0.5 block ${m.isMe ? "text-right" : "text-left"}`}>
                    {new Date(m.sentAt).toLocaleTimeString("vi", { hour: "2-digit", minute: "2-digit" })}
                </span>
            </div>
        );
    };

    return (
        <div className="fixed bottom-6 right-6 w-[400px] h-[520px] flex flex-col z-[9999] border border-gray-200 rounded-xl shadow-soft-lg bg-white overflow-hidden">
            {/* Header — NB purple with border */}
            <div className="px-5 py-4 bg-[#6938EF] border-b border-gray-200 flex justify-between items-center">
                <div>
                    <h3 className="text-white font-extrabold text-base m-0">{widgetTitle}</h3>
                    <p className="text-white/80 text-xs mt-0.5 flex items-center gap-1.5">
                        {channelLabel}
                        <span className={`inline-block w-2 h-2 rounded-full ${connected ? "bg-[#4ADE80]" : "bg-[#FACC15]"}`}
                            title={connected ? "Real-time" : "Polling"} />
                    </p>
                </div>
                <button onClick={onClose}
                    className="w-8 h-8 rounded-lg border-2 border-white/30 bg-white/20 text-white flex items-center justify-center text-lg font-bold hover:bg-white/30 transition-colors cursor-pointer">
                    ✕
                </button>
            </div>

            {/* Context Card — NB bordered */}
            {contextInfo && (
                <div className="mx-3 mt-3 p-3 border border-gray-200 rounded-lg shadow-sm bg-violet-50 flex items-center gap-3">
                    <span className="text-2xl leading-none">{contextInfo.icon}</span>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900 truncate">{contextInfo.title}</span>
                            <span className="nb-badge text-[10px] px-2 py-0.5"
                                style={{ background: `${contextInfo.statusColor}18`, color: contextInfo.statusColor, borderColor: contextInfo.statusColor }}>
                                {contextInfo.status}
                            </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5 truncate">{contextInfo.subtitle}</p>
                    </div>
                </div>
            )}

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2 bg-gray-50">
                {loading ? (
                    <div className="text-center text-gray-400 py-10">Đang tải...</div>
                ) : messages.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-4xl mb-2">💬</p>
                        <p className="text-sm text-gray-400">Chưa có tin nhắn nào. Gửi tin nhắn đầu tiên!</p>
                    </div>
                ) : (
                    messages.map(renderMessage)
                )}
                <div ref={bottomRef} />
            </div>

            {/* Proposal form (Provider only, contract chats) */}
            {showProposalForm && isProvider && isContractChat && (
                <div className="px-4 py-3 border-t border-gray-200 bg-violet-50 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-violet-600">📋 Gửi đề xuất đồng phục</span>
                        <button onClick={() => { setShowProposalForm(false); setProposalName(""); setProposalImage(null); }}
                            className="text-xs font-bold text-gray-400 hover:text-gray-800">✕</button>
                    </div>
                    <input
                        value={proposalName}
                        onChange={e => setProposalName(e.target.value)}
                        placeholder="Tên đồng phục..."
                        className="nb-input w-full text-xs"
                        maxLength={100}
                    />
                    <div className="flex items-center gap-2">
                        <label className="flex-1 cursor-pointer">
                            <div className="nb-input text-xs text-center py-1.5 truncate">
                                {proposalImage ? proposalImage.name : "📎 Chọn ảnh đồng phục..."}
                            </div>
                            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                                onChange={e => { const f = e.target.files?.[0]; if (f) setProposalImage(f); }} />
                        </label>
                        <button
                            onClick={handleSendProposal}
                            disabled={!proposalName.trim() || !proposalImage || sendingProposal}
                            className="nb-btn nb-btn-purple nb-btn-sm text-xs disabled:opacity-50"
                        >
                            {sendingProposal ? "..." : "Gửi"}
                        </button>
                    </div>
                </div>
            )}

            {/* Input — NB styled */}
            <div className="px-4 py-3 border-t border-gray-200 flex gap-2 bg-white">
                {isProvider && isContractChat && !showProposalForm && (
                    <button onClick={() => setShowProposalForm(true)}
                        className="nb-btn nb-btn-outline nb-btn-sm text-xs flex-shrink-0" title="Gửi đề xuất đồng phục">
                        📋
                    </button>
                )}
                <input
                    value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="Nhập tin nhắn..."
                    className="nb-input flex-1 text-sm"
                    maxLength={2000}
                />
                <button onClick={handleSend} disabled={sending || !newMsg.trim()}
                    className="nb-btn nb-btn-purple nb-btn-sm text-sm disabled:opacity-50">
                    {sending ? "..." : "Gửi"}
                </button>
            </div>
        </div>
    );
}
