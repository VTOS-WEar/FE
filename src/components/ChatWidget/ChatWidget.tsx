import { useState, useEffect, useRef, useCallback } from "react";
import { HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { getChatMessages, sendChatMessage, type ChatMessageDto } from "../../lib/api/chat";

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

export function ChatWidget({ channelType, channelId, isOpen, onClose, contextInfo }: ChatWidgetProps) {
    const [messages, setMessages] = useState<ChatMessageDto[]>([]);
    const [newMsg, setNewMsg] = useState("");
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [connected, setConnected] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const connectionRef = useRef<ReturnType<typeof buildConnection> | null>(null);

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
            // Fix: Backend broadcasts IsMe=false for all clients.
            // We override by comparing senderUserId with current user.
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

    const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-6 right-6 w-[400px] h-[520px] flex flex-col z-[9999] border-2 border-[#1A1A2E] rounded-xl shadow-[6px_6px_0_#1A1A2E] bg-white overflow-hidden">
            {/* Header — NB purple with border */}
            <div className="px-5 py-4 bg-[#6938EF] border-b-2 border-[#1A1A2E] flex justify-between items-center">
                <div>
                    <h3 className="text-white font-extrabold text-base m-0">💬 Chat</h3>
                    <p className="text-white/80 text-xs mt-0.5 flex items-center gap-1.5">
                        {channelType === "complaint" ? "Khiếu nại" : "Hợp đồng"}
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
                <div className="mx-3 mt-3 p-3 border-2 border-[#1A1A2E] rounded-lg shadow-[2px_2px_0_#1A1A2E] bg-[#EDE9FE] flex items-center gap-3">
                    <span className="text-2xl leading-none">{contextInfo.icon}</span>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#1A1A2E] truncate">{contextInfo.title}</span>
                            <span className="nb-badge text-[10px] px-2 py-0.5"
                                style={{ background: `${contextInfo.statusColor}18`, color: contextInfo.statusColor, borderColor: contextInfo.statusColor }}>
                                {contextInfo.status}
                            </span>
                        </div>
                        <p className="text-[11px] text-[#6B7280] mt-0.5 truncate">{contextInfo.subtitle}</p>
                    </div>
                </div>
            )}

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2 bg-[#FFF8F0]">
                {loading ? (
                    <div className="text-center text-[#9CA3AF] py-10">Đang tải...</div>
                ) : messages.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-4xl mb-2">💬</p>
                        <p className="text-sm text-[#9CA3AF]">Chưa có tin nhắn nào. Gửi tin nhắn đầu tiên!</p>
                    </div>
                ) : (
                    messages.map(m => (
                        <div key={m.messageId} className={`max-w-[80%] ${m.isMe ? "self-end" : "self-start"}`}>
                            {!m.isMe && <span className="text-[11px] text-[#6B7280] mb-0.5 block font-bold">{m.senderName}</span>}
                            <div className={`px-3.5 py-2.5 text-sm leading-relaxed border-2 border-[#1A1A2E] ${
                                m.isMe
                                    ? "bg-[#6938EF] text-white rounded-xl rounded-br-sm shadow-[2px_2px_0_#1A1A2E]"
                                    : "bg-white text-[#1A1A2E] rounded-xl rounded-bl-sm shadow-[2px_2px_0_#1A1A2E]"
                            }`}>
                                {m.content}
                            </div>
                            <span className={`text-[10px] text-[#9CA3AF] mt-0.5 block ${m.isMe ? "text-right" : "text-left"}`}>
                                {new Date(m.sentAt).toLocaleTimeString("vi", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                        </div>
                    ))
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input — NB styled */}
            <div className="px-4 py-3 border-t-2 border-[#1A1A2E] flex gap-2 bg-white">
                <input
                    value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="Nhập tin nhắn..."
                    className="nb-input flex-1 text-sm"
                />
                <button onClick={handleSend} disabled={sending || !newMsg.trim()}
                    className="nb-btn nb-btn-purple nb-btn-sm text-sm disabled:opacity-50">
                    {sending ? "..." : "Gửi"}
                </button>
            </div>
        </div>
    );
}
