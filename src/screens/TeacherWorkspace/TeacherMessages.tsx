import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MessageSquare, Send } from "lucide-react";
import { getChatMessages, sendChatMessage, type ChatMessageDto } from "../../lib/api/chat";
import { getTeacherClassesOverview } from "../../lib/api/teachers";
import { TeacherWorkspaceShell } from "./TeacherWorkspaceShell";

export const TeacherMessages = (): JSX.Element => {
    const [searchParams] = useSearchParams();
    const [classOptions, setClassOptions] = useState<{ id: string; className: string }[]>([]);
    const [classGroupId, setClassGroupId] = useState(searchParams.get("classGroupId") || "");
    const [messages, setMessages] = useState<ChatMessageDto[]>([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getTeacherClassesOverview()
            .then((overview) => {
                const options = overview.classes.map((item) => ({ id: item.id, className: item.className }));
                setClassOptions(options);
                if (!classGroupId && options.length > 0) {
                    setClassGroupId(options[0].id);
                } else {
                    setLoading(false);
                }
            })
            .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : "Không thể tải danh sách lớp");
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        if (!classGroupId) return;

        setLoading(true);
        setError(null);
        getChatMessages("classgroup", classGroupId)
            .then((response) => setMessages(response.items))
            .catch((err: unknown) => setError(err instanceof Error ? err.message : "Không thể tải tin nhắn lớp"))
            .finally(() => setLoading(false));
    }, [classGroupId]);

    const handleSend = async () => {
        if (!classGroupId || !message.trim()) return;

        setSending(true);
        try {
            await sendChatMessage("classgroup", classGroupId, message.trim());
            const response = await getChatMessages("classgroup", classGroupId);
            setMessages(response.items);
            setMessage("");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Không thể gửi tin nhắn");
        } finally {
            setSending(false);
        }
    };

    return (
        <TeacherWorkspaceShell breadcrumbs={[{ label: "Teacher workspace", href: "/teacher/dashboard" }, { label: "Tin nhắn" }]}>
            <section className="rounded-[28px] border border-sky-200 bg-[linear-gradient(135deg,_#ffffff_0%,_#f6fbff_48%,_#eef8ff_100%)] p-6 shadow-soft-lg">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-sky-700">
                            <MessageSquare className="h-4 w-4" />
                            Class group chat
                        </div>
                        <h1 className="mt-4 text-[30px] font-extrabold leading-tight text-gray-900 lg:text-[38px]">Tin nhắn với phụ huynh</h1>
                        <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-[#4c5769] lg:text-base">
                            Sử dụng phòng chat theo từng lớp để nhắc phụ huynh, trả lời nhanh, và giữ thông tin trao đổi tập trung theo lớp chủ nhiệm.
                        </p>
                    </div>
                    <label className="text-sm font-semibold text-[#4c5769]">
                        Lớp
                        <select value={classGroupId} onChange={(event) => setClassGroupId(event.target.value)} className="mt-2 w-full min-w-[220px] rounded-2xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-900 outline-none focus:border-sky-300">
                            {classOptions.length === 0 && <option value="">Chưa có lớp</option>}
                            {classOptions.map((item) => (
                                <option key={item.id} value={item.id}>Lớp {item.className}</option>
                            ))}
                        </select>
                    </label>
                </div>
            </section>

            {loading && (
                <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-soft-md">
                    <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-sky-600" />
                    <p className="text-sm font-semibold text-[#4c5769]">Đang tải phòng chat lớp...</p>
                </section>
            )}

            {!loading && error && (
                <section className="mt-6 rounded-2xl border border-red-200 bg-white p-8 text-center shadow-soft-md">
                    <p className="text-base font-bold text-red-600">{error}</p>
                </section>
            )}

            {!loading && !error && (
                <section className="mt-6 rounded-[24px] border border-gray-200 bg-white shadow-soft-md">
                    <div className="border-b border-gray-200 px-5 py-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">Phòng chat lớp</p>
                        <h2 className="text-xl font-extrabold text-gray-900">
                            {classGroupId ? `Lớp ${classOptions.find((item) => item.id === classGroupId)?.className || ""}` : "Chưa chọn lớp"}
                        </h2>
                    </div>

                    <div className="max-h-[420px] space-y-4 overflow-y-auto px-5 py-5">
                        {messages.length === 0 && (
                            <div className="rounded-2xl bg-[#f8fbff] px-5 py-8 text-center text-sm font-semibold text-[#4c5769]">
                                Chưa có tin nhắn nào trong lớp này. Hãy gửi lời nhắn đầu tiên để mở đầu cuộc trò chuyện với phụ huynh.
                            </div>
                        )}
                        {messages.map((item) => (
                            <div key={item.messageId} className={`flex ${item.isMe ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-soft-sm ${item.isMe ? "bg-emerald-100 text-emerald-950" : "bg-[#f8fafc] text-[#334155]"}`}>
                                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6b7280]">{item.isMe ? "Bạn" : item.senderName}</p>
                                    <p className="mt-2 whitespace-pre-wrap leading-6">{item.content}</p>
                                    <p className="mt-2 text-xs font-semibold text-[#6b7280]">{new Date(item.sentAt).toLocaleString("vi-VN")}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-gray-200 px-5 py-4">
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <textarea
                                value={message}
                                onChange={(event) => setMessage(event.target.value)}
                                rows={3}
                                placeholder="Gửi thông báo cho phụ huynh trong lớp này..."
                                className="min-h-[88px] flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none focus:border-sky-300"
                            />
                            <button type="button" onClick={handleSend} disabled={sending || !classGroupId || !message.trim()} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-600 px-5 py-3 text-sm font-bold text-white shadow-soft-sm transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60">
                                <Send className="h-4 w-4" />
                                {sending ? "Đang gửi..." : "Gửi tin nhắn"}
                            </button>
                        </div>
                    </div>
                </section>
            )}
        </TeacherWorkspaceShell>
    );
};
