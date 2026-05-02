import { useState, useEffect, useRef, useCallback, type KeyboardEvent } from "react";
import { HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import {
    CheckCircle2,
    Clock3,
    FileText,
    ImagePlus,
    MessageSquare,
    PackagePlus,
    Send,
    X,
} from "lucide-react";
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

type ChatTheme = {
    primary: string;
    hover: string;
    soft: string;
    softBorder: string;
    text: string;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

const CHAT_ROLE_THEMES: Record<string, ChatTheme> = {
    School: { primary: "#6938EF", hover: "#5B21B6", soft: "#F3F0FF", softBorder: "#DDD6FE", text: "#5B21B6" },
    Provider: { primary: "#3B82F6", hover: "#2563EB", soft: "#EFF6FF", softBorder: "#BFDBFE", text: "#1D4ED8" },
    Admin: { primary: "#BE123C", hover: "#9F1239", soft: "#FFF1F2", softBorder: "#FECDD3", text: "#9F1239" },
    HomeroomTeacher: { primary: "#059669", hover: "#047857", soft: "#ECFDF5", softBorder: "#A7F3D0", text: "#047857" },
    Teacher: { primary: "#059669", hover: "#047857", soft: "#ECFDF5", softBorder: "#A7F3D0", text: "#047857" },
};

function getAccessToken(): string {
    return localStorage.getItem("access_token") || sessionStorage.getItem("access_token") || "";
}

function getCurrentUserRole(): string {
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    try { if (raw) return JSON.parse(raw).role || ""; } catch { /* ignore */ }
    return "";
}

function getChatTheme(role: string): ChatTheme {
    return CHAT_ROLE_THEMES[role] ?? CHAT_ROLE_THEMES.School;
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

    const [showProposalForm, setShowProposalForm] = useState(false);
    const [proposalName, setProposalName] = useState("");
    const [proposalImage, setProposalImage] = useState<File | null>(null);
    const [sendingProposal, setSendingProposal] = useState(false);
    const [acceptingId, setAcceptingId] = useState<string | null>(null);

    const userRole = getCurrentUserRole();
    const theme = getChatTheme(userRole);
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

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isOpen) return null;

    const renderMessage = (m: ChatMessageDto) => {
        const msgType = m.messageType || "Text";
        const sentTime = new Date(m.sentAt).toLocaleTimeString("vi", { hour: "2-digit", minute: "2-digit" });

        if (msgType === "SystemNotification") {
            return (
                <div key={m.messageId} className="flex justify-center py-1">
                    <div className="max-w-[86%] rounded-[8px] border px-3 py-2 text-center text-xs shadow-soft-sm"
                        style={{ backgroundColor: theme.soft, borderColor: theme.softBorder, color: theme.text }}>
                        {m.imageUrl && (
                            <img src={m.imageUrl} alt="" className="mx-auto mb-2 h-16 w-16 rounded-[8px] border border-white object-cover" />
                        )}
                        <span className="font-semibold">{m.content}</span>
                        <p className="mt-1 text-[10px] font-medium text-gray-400">{sentTime}</p>
                    </div>
                </div>
            );
        }

        if (msgType === "UniformProposal") {
            const isPending = m.proposalStatus === "Pending";
            const isAccepted = m.proposalStatus === "Accepted";

            return (
                <div key={m.messageId} className={`max-w-[86%] ${m.isMe ? "self-end" : "self-start"}`}>
                    {!m.isMe && <span className="mb-1 block text-[11px] font-medium text-gray-500">{m.senderName}</span>}
                    <div className="overflow-hidden rounded-[8px] border border-gray-200 bg-white shadow-soft-sm">
                        <div className="flex items-center gap-2 border-b border-gray-200 px-3 py-2"
                            style={{ backgroundColor: theme.soft }}>
                            <FileText className="h-4 w-4" strokeWidth={1.8} style={{ color: theme.primary }} />
                            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: theme.text }}>
                                Đề xuất đồng phục
                            </span>
                            {isAccepted && (
                                <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                    <CheckCircle2 className="h-3 w-3" /> Đã chấp nhận
                                </span>
                            )}
                            {isPending && (
                                <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                    <Clock3 className="h-3 w-3" /> Chờ duyệt
                                </span>
                            )}
                        </div>
                        {m.imageUrl && (
                            <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                                <img src={m.imageUrl} alt={m.proposalOutfitName || "Đề xuất đồng phục"} className="h-full w-full object-cover" />
                            </div>
                        )}
                        <div className="px-3 py-2.5">
                            <p className="truncate text-sm font-semibold text-gray-900">{m.proposalOutfitName || "Đồng phục đề xuất"}</p>
                            <p className="mt-1 text-[11px] leading-5 text-gray-500">{m.content}</p>
                        </div>
                        {isSchool && isPending && !m.isMe && (
                            <div className="border-t border-gray-100 px-3 py-3">
                                <button
                                    onClick={() => handleAcceptProposal(m.messageId)}
                                    disabled={acceptingId === m.messageId}
                                    className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-[8px] border border-emerald-600 bg-emerald-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                    {acceptingId === m.messageId ? "Đang xử lý..." : "Chấp nhận đề xuất"}
                                </button>
                            </div>
                        )}
                    </div>
                    <span className={`mt-1 block text-[10px] font-medium text-gray-400 ${m.isMe ? "text-right" : "text-left"}`}>
                        {sentTime}
                    </span>
                </div>
            );
        }

        return (
            <div key={m.messageId} className={`max-w-[80%] ${m.isMe ? "self-end" : "self-start"}`}>
                {!m.isMe && <span className="mb-1 block text-[11px] font-medium text-gray-500">{m.senderName}</span>}
                <div
                    className={`whitespace-pre-wrap break-words rounded-[8px] border px-3.5 py-2.5 text-sm leading-6 shadow-sm ${
                        m.isMe ? "text-white" : "border-gray-200 bg-white text-gray-900"
                    }`}
                    style={m.isMe ? { backgroundColor: theme.primary, borderColor: theme.primary } : undefined}
                >
                    {m.content}
                </div>
                <span className={`mt-1 block text-[10px] font-medium text-gray-400 ${m.isMe ? "text-right" : "text-left"}`}>
                    {sentTime}
                </span>
            </div>
        );
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex h-[520px] w-[400px] flex-col overflow-hidden rounded-[8px] border border-gray-200 bg-white shadow-soft-lg">
            <div className="h-1 flex-shrink-0" style={{ backgroundColor: theme.primary }} />

            <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[8px]"
                        style={{ backgroundColor: theme.soft, color: theme.primary }}>
                        <MessageSquare className="h-5 w-5" strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-gray-900">{widgetTitle}</h3>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-gray-500">
                            {channelLabel}
                            <span
                                className={`inline-block h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-amber-400"}`}
                                title={connected ? "Real-time" : "Polling"}
                            />
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
                    aria-label="Đóng chat"
                >
                    <X className="h-4 w-4" strokeWidth={2} />
                </button>
            </div>

            {contextInfo && (
                <div className="mx-3 mt-3 flex items-center gap-3 rounded-[8px] border bg-white p-3 shadow-soft-sm"
                    style={{ borderColor: theme.softBorder }}>
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[8px]"
                        style={{ backgroundColor: theme.soft, color: theme.primary }}>
                        {isContractChat ? <FileText className="h-5 w-5" strokeWidth={1.8} /> : <span className="text-lg leading-none">{contextInfo.icon}</span>}
                    </span>
                    <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-2">
                            <span className="truncate text-xs font-semibold text-gray-900">{contextInfo.title}</span>
                            <span
                                className="inline-flex flex-shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                                style={{ background: `${contextInfo.statusColor}12`, color: contextInfo.statusColor, borderColor: `${contextInfo.statusColor}40` }}
                            >
                                {contextInfo.status}
                            </span>
                        </div>
                        <p className="mt-0.5 truncate text-[11px] leading-5 text-gray-500">{contextInfo.subtitle}</p>
                    </div>
                </div>
            )}

            <div className="flex flex-1 flex-col gap-2 overflow-y-auto bg-gray-50 px-4 py-4">
                {loading ? (
                    <div className="flex flex-1 items-center justify-center text-sm font-medium text-gray-400">Đang tải...</div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center text-center">
                        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-[8px] border"
                            style={{ backgroundColor: theme.soft, borderColor: theme.softBorder, color: theme.primary }}>
                            <MessageSquare className="h-6 w-6" strokeWidth={1.8} />
                        </span>
                        <p className="text-sm font-semibold text-gray-900">Chưa có tin nhắn</p>
                        <p className="mt-1 max-w-[240px] text-xs leading-5 text-gray-500">Gửi tin đầu tiên để bắt đầu trao đổi.</p>
                    </div>
                ) : (
                    messages.map(renderMessage)
                )}
                <div ref={bottomRef} />
            </div>

            {showProposalForm && isProvider && isContractChat && (
                <div className="space-y-2 border-t border-gray-200 px-4 py-3" style={{ backgroundColor: theme.soft }}>
                    <div className="flex items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-2 text-xs font-semibold" style={{ color: theme.text }}>
                            <PackagePlus className="h-4 w-4" /> Gửi đề xuất đồng phục
                        </span>
                        <button
                            onClick={() => { setShowProposalForm(false); setProposalName(""); setProposalImage(null); }}
                            className="flex h-7 w-7 items-center justify-center rounded-[8px] text-gray-400 transition-colors hover:bg-white hover:text-gray-800"
                            aria-label="Đóng form đề xuất"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <input
                        value={proposalName}
                        onChange={e => setProposalName(e.target.value)}
                        placeholder="Tên đồng phục..."
                        className="nb-input w-full text-xs"
                        maxLength={100}
                    />
                    <div className="flex items-center gap-2">
                        <label className="min-w-0 flex-1 cursor-pointer">
                            <div className="flex h-9 items-center justify-center gap-2 truncate rounded-[8px] border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 shadow-soft-sm">
                                <ImagePlus className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{proposalImage ? proposalImage.name : "Chọn ảnh đồng phục"}</span>
                            </div>
                            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                                onChange={e => { const f = e.target.files?.[0]; if (f) setProposalImage(f); }} />
                        </label>
                        <button
                            onClick={handleSendProposal}
                            disabled={!proposalName.trim() || !proposalImage || sendingProposal}
                            className="inline-flex h-9 items-center justify-center rounded-[8px] px-3 text-xs font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                            style={{ backgroundColor: theme.primary }}
                        >
                            {sendingProposal ? "..." : "Gửi"}
                        </button>
                    </div>
                </div>
            )}

            <div className="flex gap-2 border-t border-gray-200 bg-white px-4 py-3">
                {isProvider && isContractChat && !showProposalForm && (
                    <button
                        onClick={() => setShowProposalForm(true)}
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[8px] border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50"
                        title="Gửi đề xuất đồng phục"
                        aria-label="Gửi đề xuất đồng phục"
                    >
                        <PackagePlus className="h-4 w-4" strokeWidth={1.8} />
                    </button>
                )}
                <input
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Nhập tin nhắn..."
                    className="nb-input h-10 flex-1 text-sm"
                    maxLength={2000}
                />
                <button
                    onClick={handleSend}
                    disabled={sending || !newMsg.trim()}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] px-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ backgroundColor: theme.primary }}
                >
                    {sending ? "..." : <><Send className="h-4 w-4" /> Gửi</>}
                </button>
            </div>
        </div>
    );
}
