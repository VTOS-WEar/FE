import { useState, useEffect, useRef, useCallback } from "react";
import { getChatMessages, sendChatMessage, type ChatMessageDto } from "../../lib/api/chat";

export type ChatContextInfo = {
    icon: string;       // emoji icon
    title: string;      // e.g. contract name or complaint title
    status: string;     // e.g. "Chờ duyệt", "Mở"
    statusColor: string;// hex color for badge
    subtitle: string;   // e.g. "NCC: Nhà CC 1 · Chiến dịch X"
};

type ChatWidgetProps = {
    channelType: string;
    channelId: string;
    isOpen: boolean;
    onClose: () => void;
    contextInfo?: ChatContextInfo;
};

export function ChatWidget({ channelType, channelId, isOpen, onClose, contextInfo }: ChatWidgetProps) {
    const [messages, setMessages] = useState<ChatMessageDto[]>([]);
    const [newMsg, setNewMsg] = useState("");
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchMessages = useCallback(async () => {
        try {
            const res = await getChatMessages(channelType, channelId);
            setMessages(res.items);
        } catch (e) {
            console.error("Error fetching messages:", e);
        }
    }, [channelType, channelId]);

    useEffect(() => {
        if (!isOpen || !channelId) return;
        setLoading(true);
        fetchMessages().finally(() => setLoading(false));

        // Poll every 3 seconds for new messages (fallback for SignalR)
        pollRef.current = setInterval(fetchMessages, 3000);
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [isOpen, channelId, fetchMessages]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        const content = newMsg.trim();
        if (!content || sending) return;
        setSending(true);
        try {
            await sendChatMessage(channelType, channelId, content);
            setNewMsg("");
            await fetchMessages();
        } catch (e: any) {
            console.error("Error sending message:", e);
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: "fixed", bottom: 24, right: 24, width: 400, height: 520,
            background: "#fff", borderRadius: 20, boxShadow: "0 8px 40px rgba(0,0,0,.18)",
            display: "flex", flexDirection: "column", zIndex: 9999,
            border: "1px solid rgba(0,0,0,.08)", overflow: "hidden",
        }}>
            {/* Header */}
            <div style={{
                padding: "16px 20px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>💬 Chat</h3>
                    <p style={{ margin: 0, fontSize: 12, opacity: .8 }}>
                        {channelType === "complaint" ? "Khiếu nại" : "Hợp đồng"}
                    </p>
                </div>
                <button onClick={onClose} style={{
                    border: "none", background: "rgba(255,255,255,.2)", color: "#fff",
                    width: 32, height: 32, borderRadius: "50%", cursor: "pointer",
                    fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
                }}>✕</button>
            </div>

            {/* Context Card — pinned reference like Shopee "ask about product" */}
            {contextInfo && (
                <div style={{
                    margin: "12px 16px 0", padding: "10px 14px",
                    background: "linear-gradient(135deg, #f8fafc, #eef2ff)",
                    borderRadius: 12, border: "1px solid #e0e7ff",
                    display: "flex", gap: 10, alignItems: "center",
                }}>
                    <span style={{ fontSize: 28, lineHeight: 1 }}>{contextInfo.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{
                                fontSize: 13, fontWeight: 700, color: "#1a1a2e",
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>{contextInfo.title}</span>
                            <span style={{
                                padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600,
                                background: `${contextInfo.statusColor}18`,
                                color: contextInfo.statusColor, whiteSpace: "nowrap",
                            }}>{contextInfo.status}</span>
                        </div>
                        <p style={{
                            margin: "2px 0 0", fontSize: 11, color: "#888",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>{contextInfo.subtitle}</p>
                    </div>
                </div>
            )}

            {/* Messages */}
            <div style={{
                flex: 1, overflowY: "auto", padding: "16px 20px",
                display: "flex", flexDirection: "column", gap: 8,
                background: "#f8fafc",
            }}>
                {loading ? (
                    <div style={{ textAlign: "center", color: "#999", padding: 40 }}>Đang tải...</div>
                ) : messages.length === 0 ? (
                    <div style={{ textAlign: "center", color: "#aaa", padding: 40 }}>
                        <div style={{ fontSize: 40, marginBottom: 8 }}>💬</div>
                        <p style={{ fontSize: 14 }}>Chưa có tin nhắn nào. Gửi tin nhắn đầu tiên!</p>
                    </div>
                ) : (
                    messages.map(m => (
                        <div key={m.messageId} style={{
                            alignSelf: m.isMe ? "flex-end" : "flex-start",
                            maxWidth: "80%",
                        }}>
                            {!m.isMe && (
                                <span style={{ fontSize: 11, color: "#888", marginBottom: 2, display: "block" }}>
                                    {m.senderName}
                                </span>
                            )}
                            <div style={{
                                padding: "10px 14px", borderRadius: m.isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                                background: m.isMe ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "#fff",
                                color: m.isMe ? "#fff" : "#333",
                                fontSize: 14, lineHeight: 1.5,
                                boxShadow: "0 1px 4px rgba(0,0,0,.06)",
                            }}>
                                {m.content}
                            </div>
                            <span style={{
                                fontSize: 10, color: "#aaa", marginTop: 2, display: "block",
                                textAlign: m.isMe ? "right" : "left",
                            }}>
                                {new Date(m.sentAt).toLocaleTimeString("vi", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                        </div>
                    ))
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{
                padding: "12px 16px", borderTop: "1px solid #eee",
                display: "flex", gap: 8, background: "#fff",
            }}>
                <input
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Nhập tin nhắn..."
                    style={{
                        flex: 1, padding: "10px 14px", borderRadius: 12,
                        border: "1px solid #e0e0e0", fontSize: 14, outline: "none",
                    }}
                />
                <button
                    onClick={handleSend}
                    disabled={sending || !newMsg.trim()}
                    style={{
                        padding: "10px 18px", borderRadius: 12, border: "none",
                        background: sending || !newMsg.trim() ? "#ccc" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        color: "#fff", fontWeight: 600, cursor: sending ? "not-allowed" : "pointer",
                        fontSize: 14, transition: "all .2s",
                    }}
                >
                    {sending ? "..." : "Gửi"}
                </button>
            </div>
        </div>
    );
}
