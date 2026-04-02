import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { InAppNotification } from "../../lib/api/notifications";

const typeIcons: Record<string, string> = {
    ContractAction: "📋",
    ProductionAction: "🏭",
    DeliveryAction: "📦",
    OrderAction: "🛒",
    AccountRequest: "📋",
    WithdrawalRequest: "💸",
    Complaint: "⚠️",
    System: "🔔",
};

function timeAgo(iso: string): string {
    const now = Date.now();
    const then = new Date(iso).getTime();
    const diff = Math.max(0, now - then);
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "Vừa xong";
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
}

interface NotificationDropdownProps {
    notifications: InAppNotification[];
    unreadCount: number;
    loading: boolean;
    onOpen: () => void;
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
}

export function NotificationDropdown({
    notifications,
    unreadCount,
    loading,
    onOpen,
    onMarkAsRead,
    onMarkAllAsRead,
}: NotificationDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Close on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleToggle = () => {
        if (!isOpen) onOpen();
        setIsOpen(!isOpen);
    };

    const handleClick = (n: InAppNotification) => {
        if (!n.isRead) onMarkAsRead(n.id);
        if (n.actionUrl) {
            navigate(n.actionUrl);
            setIsOpen(false);
        }
    };

    return (
        <div ref={dropdownRef} className="relative">
            {/* Bell Button */}
            <button
                onClick={handleToggle}
                className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-[#1A1A2E] bg-white hover:bg-[#FFF5EB] shadow-[2px_2px_0_#1A1A2E] transition-all relative"
            >
                <svg className="w-5 h-5 text-[#1A1A2E]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 002 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.93 6 11v5l-2 2v1h16v-1l-2-2z" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#EF4444] border-2 border-white text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-12 w-[360px] max-h-[460px] bg-white border-2 border-[#1A1A2E] rounded-xl shadow-[4px_4px_0_#1A1A2E] z-50 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b-2 border-[#E5E7EB]">
                        <h3 className="font-bold text-[#1A1A2E] text-sm">
                            🔔 Thông báo {unreadCount > 0 && <span className="text-[#EF4444]">({unreadCount})</span>}
                        </h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={onMarkAllAsRead}
                                className="text-[#6938EF] font-semibold text-xs hover:underline"
                            >
                                Đọc tất cả
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#6938EF] border-t-transparent" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-[#9CA3AF]">
                                <svg className="w-10 h-10 mb-2" viewBox="0 0 24 24" fill="currentColor" opacity={0.3}>
                                    <path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 002 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.93 6 11v5l-2 2v1h16v-1l-2-2z" />
                                </svg>
                                <p className="font-semibold text-sm">Chưa có thông báo</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <button
                                    key={n.id}
                                    onClick={() => handleClick(n)}
                                    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-[#FFF8F0] transition-colors border-b border-[#F3F4F6] ${
                                        !n.isRead ? "bg-[#FEFCE8]" : ""
                                    }`}
                                >
                                    <span className="text-lg flex-shrink-0 mt-0.5">
                                        {typeIcons[n.type] || "🔔"}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm leading-snug ${!n.isRead ? "font-bold text-[#1A1A2E]" : "font-medium text-[#4C5769]"}`}>
                                            {n.title}
                                        </p>
                                        <p className="text-xs text-[#6B7280] mt-0.5 line-clamp-2">
                                            {n.message}
                                        </p>
                                        <p className="text-[10px] text-[#9CA3AF] mt-1">
                                            {timeAgo(n.createdAt)}
                                        </p>
                                    </div>
                                    {!n.isRead && (
                                        <span className="w-2 h-2 rounded-full bg-[#6938EF] flex-shrink-0 mt-2" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
