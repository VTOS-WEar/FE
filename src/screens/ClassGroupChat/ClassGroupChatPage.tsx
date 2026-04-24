import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { HubConnectionBuilder, HubConnectionState, LogLevel, type HubConnection } from "@microsoft/signalr";
import EmojiPicker, { Theme, type EmojiClickData } from "emoji-picker-react";
import { ArrowLeft, Image, Loader2, MessageCircle, RefreshCw, Search, Send, Smile, Users, X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { NavbarGuest } from "../../components/layout/NavbarGuest";
import { getChatMessages, sendChatMessage, type ChatMessageDto } from "../../lib/api/chat";
import { getTeacherClassesOverview } from "../../lib/api/teachers";
import { getMyChildren } from "../../lib/api/users";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const PAGE_SIZE = 50;
const MIN_REFRESH_ANIMATION_MS = 650;

type SessionUser = {
  userId?: string;
  id?: string;
  role?: string;
  fullName?: string;
};

type ClassChatOption = {
  id: string;
  className: string;
  academicYear?: string | null;
  subtitle: string;
  memberLabel: string;
  searchText: string;
};

type ClassGroupChatContentProps = {
  mode: "parent" | "teacher";
};

function getSessionUser(): SessionUser | null {
  const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

function getAccessToken(): string {
  return localStorage.getItem("access_token") || sessionStorage.getItem("access_token") || "";
}

function getCurrentUserId(): string {
  const user = getSessionUser();
  return user?.userId || user?.id || "";
}

function formatMessageTime(value: string): string {
  return new Date(value).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function formatMessageDate(value: string): string {
  return new Date(value).toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

function mergeMessages(items: ChatMessageDto[]): ChatMessageDto[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.messageId)) return false;
    seen.add(item.messageId);
    return true;
  });
}

function getMediaUrl(content: string): string | null {
  const trimmed = content.trim();
  if (!/^https?:\/\/\S+$/i.test(trimmed)) return null;

  try {
    const url = new URL(trimmed);
    const cleanPath = url.pathname.toLowerCase();
    if (/\.(gif|webp|png|jpg|jpeg)$/.test(cleanPath)) return trimmed;
  } catch {
    return null;
  }

  return null;
}

export function ClassGroupChatContent({ mode }: ClassGroupChatContentProps): JSX.Element {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialClassGroupId = searchParams.get("classGroupId") || "";
  const [classOptions, setClassOptions] = useState<ClassChatOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState(initialClassGroupId);
  const [classSearch, setClassSearch] = useState("");
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [messageDraft, setMessageDraft] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifInput, setShowGifInput] = useState(false);
  const [gifUrl, setGifUrl] = useState("");
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [refreshingMessages, setRefreshingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalMessages, setTotalMessages] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const connectionRef = useRef<HubConnection | null>(null);
  const shouldScrollBottomRef = useRef(true);

  const selectedClass = classOptions.find((item) => item.id === selectedClassId) || null;

  const filteredClasses = useMemo(() => {
    const query = classSearch.trim().toLowerCase();
    if (!query) return classOptions;
    return classOptions.filter((item) => item.searchText.toLowerCase().includes(query));
  }, [classOptions, classSearch]);

  const hasOlderMessages = messages.length < totalMessages;
  const refreshAnimating = loadingMessages || refreshingMessages;

  useEffect(() => {
    let cancelled = false;

    async function loadClassOptions() {
      setLoadingClasses(true);
      setError(null);
      try {
        if (mode === "teacher") {
          const overview = await getTeacherClassesOverview();
          if (cancelled) return;

          const options = overview.classes.map((item) => ({
            id: item.id,
            className: item.className,
            academicYear: item.academicYear,
            subtitle: `${overview.teacherName} • ${item.academicYear}`,
            memberLabel: `${item.parentLinkedCount}/${item.studentCount} phụ huynh`,
            searchText: `${item.className} ${item.academicYear} ${overview.teacherName}`,
          }));
          setClassOptions(options);
          if (!selectedClassId && options.length > 0) setSelectedClassId(options[0].id);
          return;
        }

        const children = await getMyChildren();
        if (cancelled) return;

        const grouped = new Map<string, ClassChatOption & { childNames: string[] }>();
        for (const child of children) {
          if (!child.classGroupId) continue;

          const current = grouped.get(child.classGroupId);
          if (current) {
            current.childNames.push(child.fullName);
            current.searchText += ` ${child.fullName}`;
            continue;
          }

          grouped.set(child.classGroupId, {
            id: child.classGroupId,
            className: child.className || child.grade,
            academicYear: child.academicYear,
            subtitle: child.school?.schoolName || "Lớp của học sinh",
            memberLabel: "Nhóm phụ huynh",
            searchText: `${child.className || child.grade} ${child.academicYear || ""} ${child.school?.schoolName || ""} ${child.fullName}`,
            childNames: [child.fullName],
          });
        }

        const options = Array.from(grouped.values()).map(({ childNames, ...option }) => ({
          ...option,
          subtitle: `${option.subtitle} • ${childNames.join(", ")}`,
        }));
        setClassOptions(options);
        if (!selectedClassId && options.length > 0) setSelectedClassId(options[0].id);
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Không thể tải danh sách lớp.");
      } finally {
        if (!cancelled) setLoadingClasses(false);
      }
    }

    void loadClassOptions();

    return () => {
      cancelled = true;
    };
  }, [mode]);

  const loadMessages = useCallback(
    async (targetPage: number, appendOlder = false, showLoading = true) => {
      if (!selectedClassId) return;

      if (appendOlder) setLoadingOlder(true);
      else if (showLoading) setLoadingMessages(true);
      setError(null);

      try {
        const response = await getChatMessages("classgroup", selectedClassId, targetPage, PAGE_SIZE);
        setTotalMessages(response.total);
        setPage(targetPage);
        setMessages((current) => {
          if (!appendOlder) return response.items;
          return mergeMessages([...response.items, ...current]);
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Không thể tải lịch sử chat.");
      } finally {
        if (appendOlder) setLoadingOlder(false);
        else if (showLoading) setLoadingMessages(false);
      }
    },
    [selectedClassId]
  );

  useEffect(() => {
    if (!selectedClassId) {
      setMessages([]);
      setTotalMessages(0);
      return;
    }

    shouldScrollBottomRef.current = true;
    setSearchParams({ classGroupId: selectedClassId }, { replace: true });
    void loadMessages(1);
  }, [selectedClassId, loadMessages, setSearchParams]);

  useEffect(() => {
    if (!selectedClassId) return;

    const connection = new HubConnectionBuilder()
      .withUrl(`${API_BASE}/hubs/chat`, { accessTokenFactory: () => getAccessToken() })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    connection.on("ReceiveMessage", (incoming: ChatMessageDto) => {
      const currentUserId = getCurrentUserId();
      const fixedMessage = {
        ...incoming,
        isMe: currentUserId ? incoming.senderUserId === currentUserId : incoming.isMe,
      };
      shouldScrollBottomRef.current = true;
      setTotalMessages((current) => current + 1);
      setMessages((current) => {
        if (current.some((item) => item.messageId === fixedMessage.messageId)) return current;
        return [...current, fixedMessage];
      });
    });

    connection.onreconnected(() => {
      connection.invoke("JoinChannel", "classgroup", selectedClassId).catch(() => {});
      setConnected(true);
    });
    connection.onclose(() => setConnected(false));
    connection
      .start()
      .then(() => {
        setConnected(true);
        return connection.invoke("JoinChannel", "classgroup", selectedClassId);
      })
      .catch(() => setConnected(false));

    return () => {
      if (connection.state === HubConnectionState.Connected) {
        connection.invoke("LeaveChannel", "classgroup", selectedClassId).catch(() => {});
      }
      connection.stop();
      connectionRef.current = null;
      setConnected(false);
    };
  }, [selectedClassId]);

  useEffect(() => {
    if (!shouldScrollBottomRef.current) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    shouldScrollBottomRef.current = false;
  }, [messages]);

  const handleSelectClass = (id: string) => {
    if (id === selectedClassId) return;
    setSelectedClassId(id);
  };

  const handleLoadOlder = async () => {
    shouldScrollBottomRef.current = false;
    await loadMessages(page + 1, true);
  };

  const handleRefreshMessages = async () => {
    if (!selectedClassId || loadingMessages || refreshingMessages) return;

    setRefreshingMessages(true);
    shouldScrollBottomRef.current = true;
    try {
      await Promise.all([
        loadMessages(1, false, false),
        new Promise((resolve) => setTimeout(resolve, MIN_REFRESH_ANIMATION_MS)),
      ]);
    } finally {
      setRefreshingMessages(false);
    }
  };

  const sendContent = async (rawContent: string, clearDraft = true) => {
    const content = rawContent.trim();
    if (!content || !selectedClassId || sending) return;

    setSending(true);
    try {
      await sendChatMessage("classgroup", selectedClassId, content);
      if (clearDraft) setMessageDraft("");
      shouldScrollBottomRef.current = true;
      if (!connected) await loadMessages(1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể gửi tin nhắn.");
    } finally {
      setSending(false);
    }
  };

  const handleSend = async () => {
    await sendContent(messageDraft);
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessageDraft((current) => `${current}${emojiData.emoji}`);
  };

  const handleSendGif = () => {
    const url = gifUrl.trim();
    if (!url || !selectedClassId || sending) return;

    void sendContent(url, false);
    setGifUrl("");
    setShowGifInput(false);
  };

  return (
    <section className="min-h-[calc(100svh-180px)] overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-soft-lg">
      <div className="grid min-h-[680px] lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="border-b border-gray-200 bg-[#f7f9fc] lg:border-b-0 lg:border-r">
          <div className="border-b border-gray-200 bg-white px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-700">Class groups</p>
                <h1 className="mt-1 text-xl font-extrabold text-gray-900">Tin nhắn lớp</h1>
              </div>
              <button
                type="button"
                onClick={() => void handleRefreshMessages()}
                disabled={!selectedClassId || refreshAnimating}
                aria-busy={refreshAnimating}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border shadow-sm transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70 ${
                  refreshAnimating
                    ? "border-sky-200 bg-sky-50 text-sky-700 shadow-sky-100"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
                aria-label="Tải lại"
                title="Tải lại"
              >
                <RefreshCw className={`h-4 w-4 transition-transform duration-300 ${refreshAnimating ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="mt-4 flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                value={classSearch}
                onChange={(event) => setClassSearch(event.target.value)}
                placeholder="Tìm lớp, trường, học sinh..."
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="max-h-[260px] overflow-y-auto p-2 lg:max-h-[570px]">
            {loadingClasses && (
              <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm font-semibold text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tải lớp...
              </div>
            )}

            {!loadingClasses && filteredClasses.length === 0 && (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-8 text-center">
                <MessageCircle className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-3 text-sm font-bold text-gray-900">Chưa có nhóm chat lớp</p>
                <p className="mt-1 text-xs font-semibold text-gray-500">
                  {mode === "parent" ? "Tài khoản cần liên kết học sinh đã được xếp lớp." : "Tài khoản cần được phân công lớp chủ nhiệm."}
                </p>
              </div>
            )}

            {filteredClasses.map((item) => {
              const active = item.id === selectedClassId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectClass(item.id)}
                  className={`mb-1 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all ${
                    active ? "bg-sky-600 text-white shadow-soft-md" : "bg-white text-gray-900 hover:bg-sky-50"
                  }`}
                >
                  <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border ${
                    active ? "border-white/30 bg-white/20" : "border-sky-100 bg-sky-50"
                  }`}>
                    <Users className={`h-5 w-5 ${active ? "text-white" : "text-sky-700"}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold">Lớp {item.className}</p>
                    <p className={`mt-0.5 truncate text-xs font-semibold ${active ? "text-white/75" : "text-gray-500"}`}>
                      {item.subtitle}
                    </p>
                  </div>
                  <span className={`hidden rounded-lg px-2 py-1 text-[10px] font-black sm:inline-flex ${
                    active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    {item.memberLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="flex min-h-[680px] min-w-0 flex-col bg-[#eef3f8]">
          <div className="flex min-h-[76px] items-center justify-between gap-3 border-b border-gray-200 bg-white px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
              {mode === "parent" && (
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm lg:hidden"
                  aria-label="Quay lại"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-sm">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-extrabold text-gray-900">
                  {selectedClass ? `Lớp ${selectedClass.className}` : "Chọn một lớp"}
                </h2>
                <p className="truncate text-xs font-bold text-gray-500">
                  {selectedClass ? selectedClass.subtitle : "Lịch sử trao đổi giữa giáo viên chủ nhiệm và phụ huynh"}
                </p>
              </div>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
              <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-amber-400"}`} />
              <span className="hidden text-xs font-black uppercase tracking-[0.12em] text-gray-600 sm:inline">
                {connected ? "Realtime" : "Đang đồng bộ"}
              </span>
            </div>
          </div>

          {error && (
            <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
            {selectedClassId && hasOlderMessages && (
              <div className="mb-5 flex justify-center">
                <button
                  type="button"
                  onClick={handleLoadOlder}
                  disabled={loadingOlder}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-extrabold text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:opacity-60"
                >
                  {loadingOlder && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Xem tin nhắn cũ hơn
                </button>
              </div>
            )}

            {loadingMessages && (
              <div className="flex items-center justify-center gap-2 py-16 text-sm font-bold text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                Đang tải lịch sử chat...
              </div>
            )}

            {!loadingMessages && selectedClassId && messages.length === 0 && (
              <div className="mx-auto mt-16 max-w-sm rounded-3xl border border-gray-200 bg-white px-6 py-8 text-center shadow-soft-sm">
                <MessageCircle className="mx-auto h-10 w-10 text-sky-600" />
                <h3 className="mt-4 text-lg font-extrabold text-gray-900">Chưa có tin nhắn</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-gray-500">
                  Mọi phụ huynh đã liên kết học sinh trong lớp và giáo viên chủ nhiệm sẽ thấy nội dung chat tại đây.
                </p>
              </div>
            )}

            {!loadingMessages && messages.length > 0 && (
              <div className="space-y-4">
                {messages.map((item, index) => {
                  const previous = messages[index - 1];
                  const showDate = !previous || formatMessageDate(previous.sentAt) !== formatMessageDate(item.sentAt);
                  return (
                    <div key={item.messageId}>
                      {showDate && (
                        <div className="mb-4 flex justify-center">
                          <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-gray-500 shadow-sm">
                            {formatMessageDate(item.sentAt)}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${item.isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`w-fit max-w-[min(72%,520px)] ${item.isMe ? "items-end" : "items-start"} flex flex-col`}>
                          {!item.isMe && (
                            <p className="mb-1 px-1 text-xs font-extrabold text-sky-800">{item.senderName}</p>
                          )}
                          <div
                            className={`rounded-[16px] px-3 py-1.5 text-[13px] font-medium leading-5 shadow-sm ${
                              item.isMe
                                ? "rounded-br-md bg-sky-600 text-white"
                                : "rounded-bl-md border border-gray-200 bg-white text-gray-900"
                            }`}
                          >
                            {getMediaUrl(item.content) ? (
                              <a href={item.content.trim()} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl">
                                <img
                                  src={item.content.trim()}
                                  alt="Nội dung hình ảnh"
                                  className="max-h-[220px] min-w-[180px] max-w-full object-cover"
                                />
                              </a>
                            ) : (
                              <p className="whitespace-pre-wrap break-words">
                                {item.content}
                                <span className={`ml-3 inline-block whitespace-nowrap align-baseline text-[10px] font-bold ${item.isMe ? "text-white/75" : "text-gray-400"}`}>
                                  {formatMessageTime(item.sentAt)}
                                </span>
                              </p>
                            )}
                            {getMediaUrl(item.content) && (
                              <p className={`mt-1 text-right text-[10px] font-bold ${item.isMe ? "text-white/75" : "text-gray-400"}`}>
                                {formatMessageTime(item.sentAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          <div className="relative border-t border-gray-200 bg-white px-4 py-3 sm:px-5">
            {showEmojiPicker && (
              <>
                <button
                  type="button"
                  aria-label="Đóng emoji"
                  className="fixed inset-0 z-[70] cursor-default bg-transparent"
                  onClick={() => setShowEmojiPicker(false)}
                />
                <div className="absolute bottom-[74px] left-4 z-[80] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-soft-lg sm:left-5">
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    theme={Theme.LIGHT}
                    width={320}
                    height={380}
                    searchPlaceHolder="Tìm emoji..."
                    previewConfig={{ showPreview: false }}
                    lazyLoadEmojis
                  />
                </div>
              </>
            )}

            {showGifInput && (
              <div className="mb-3 flex items-center gap-2 rounded-2xl border border-sky-100 bg-sky-50 px-3 py-2">
                <Image className="h-4 w-4 flex-shrink-0 text-sky-700" />
                <input
                  value={gifUrl}
                  onChange={(event) => setGifUrl(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleSendGif();
                    }
                  }}
                  placeholder="Dán link GIF hoặc ảnh..."
                  className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-gray-900 outline-none placeholder:text-gray-500"
                />
                <button type="button" onClick={handleSendGif} className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white">
                  Chèn
                </button>
                <button type="button" onClick={() => setShowGifInput(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="flex items-end gap-3">
              <button
                type="button"
                onClick={() => setShowEmojiPicker((current) => !current)}
                disabled={!selectedClassId}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Chọn emoji"
                title="Chọn emoji"
              >
                <Smile className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowGifInput((current) => !current)}
                disabled={!selectedClassId}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Chèn GIF"
                title="Chèn GIF bằng URL"
              >
                <Image className="h-4 w-4" />
              </button>
              <textarea
                value={messageDraft}
                onChange={(event) => setMessageDraft(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                disabled={!selectedClassId}
                rows={1}
                maxLength={2000}
                placeholder={selectedClassId ? "Nhập tin nhắn cho nhóm lớp..." : "Chọn lớp để bắt đầu chat"}
                className="max-h-28 min-h-[42px] flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[13px] font-semibold text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-sky-300 focus:bg-white"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || !selectedClassId || !messageDraft.trim()}
                className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white shadow-soft-sm transition-all hover:-translate-y-[1px] hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Gửi tin nhắn"
                title="Gửi tin nhắn"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </main>
      </div>
    </section>
  );
}

export function ParentClassGroupChatPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-[#f3f6fb]">
      <NavbarGuest />
      <main className="mx-auto w-full max-w-[1240px] px-3 py-4 sm:px-4 lg:px-6 lg:py-6">
        <ClassGroupChatContent mode="parent" />
      </main>
    </div>
  );
}
