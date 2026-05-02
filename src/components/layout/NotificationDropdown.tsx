import { useState, useRef, useEffect, type ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import {
    AlertTriangle,
    Bell,
    ClipboardList,
    CreditCard,
    Info,
    Package,
    ShoppingCart,
    Truck,
    UserPlus,
    Wallet,
} from "lucide-react";
import type { InAppNotification } from "../../lib/api/notifications";

type NotificationIcon = ComponentType<{ className?: string; strokeWidth?: number }>;

const typeIcons: Record<string, NotificationIcon> = {
    ContractAction: ClipboardList,
    ProductionAction: Package,
    DeliveryAction: Truck,
    OrderAction: ShoppingCart,
    AccountRequest: UserPlus,
    WithdrawalRequest: Wallet,
    Payment: CreditCard,
    Complaint: AlertTriangle,
    System: Info,
};

const roleAccentMap: Record<string, { primary: string; hover: string; soft: string; text: string }> = {
    Admin: { primary: "#BE123C", hover: "#FFF1F2", soft: "#FFF1F2", text: "#9F1239" },
    Provider: { primary: "#3B82F6", hover: "#EFF6FF", soft: "#EFF6FF", text: "#1D4ED8" },
    School: { primary: "#6938EF", hover: "#F3F0FF", soft: "#F3F0FF", text: "#5B21B6" },
    HomeroomTeacher: { primary: "#059669", hover: "#ECFDF5", soft: "#ECFDF5", text: "#047857" },
    Teacher: { primary: "#059669", hover: "#ECFDF5", soft: "#ECFDF5", text: "#047857" },
};

function getCurrentUserRole(): string {
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    try {
        if (raw) return JSON.parse(raw).role || "";
    } catch {
        // ignore malformed local session data
    }
    return "";
}

function getNotificationAccent() {
    return roleAccentMap[getCurrentUserRole()] ?? roleAccentMap.School;
}

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
    const accent = getNotificationAccent();

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
            <button
                onClick={handleToggle}
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-colors"
                style={{ color: isOpen ? accent.primary : "#111827", backgroundColor: isOpen ? accent.hover : "#FFFFFF" }}
                onMouseEnter={(event) => {
                    event.currentTarget.style.backgroundColor = accent.hover;
                    event.currentTarget.style.color = accent.primary;
                }}
                onMouseLeave={(event) => {
                    event.currentTarget.style.backgroundColor = isOpen ? accent.hover : "#FFFFFF";
                    event.currentTarget.style.color = isOpen ? accent.primary : "#111827";
                }}
                aria-label="Mở thông báo"
            >
                <Bell className="h-5 w-5" strokeWidth={2} />
                {unreadCount > 0 && (
                    <span
                        className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white px-1 text-[10px] font-semibold text-white"
                        style={{ backgroundColor: accent.primary }}
                    >
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-12 z-50 flex max-h-[460px] w-[360px] flex-col overflow-hidden rounded-[8px] border border-gray-200 bg-white shadow-soft-md">
                    <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                        <div className="flex items-center gap-2">
                            <span
                                className="flex h-8 w-8 items-center justify-center rounded-[8px]"
                                style={{ backgroundColor: accent.soft, color: accent.primary }}
                            >
                                <Bell className="h-4 w-4" strokeWidth={2} />
                            </span>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">Thông báo</h3>
                                <p className="text-[11px] font-medium text-gray-500">
                                    {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : "Tất cả đã được đọc"}
                                </p>
                            </div>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={onMarkAllAsRead}
                                className="rounded-[8px] px-2.5 py-1.5 text-xs font-semibold transition-colors"
                                style={{ color: accent.text }}
                                onMouseEnter={(event) => { event.currentTarget.style.backgroundColor = accent.soft; }}
                                onMouseLeave={(event) => { event.currentTarget.style.backgroundColor = "transparent"; }}
                            >
                                Đọc tất cả
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto bg-gray-50/60 p-2">
                        {loading ? (
                            <div className="flex items-center justify-center py-10">
                                <div
                                    className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
                                    style={{ borderColor: accent.primary, borderTopColor: "transparent" }}
                                />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="m-2 flex flex-col items-center justify-center rounded-[8px] border border-gray-200 bg-white px-6 py-8 text-center">
                                <span
                                    className="mb-3 flex h-11 w-11 items-center justify-center rounded-[8px]"
                                    style={{ backgroundColor: accent.soft, color: accent.primary }}
                                >
                                    <Bell className="h-5 w-5" strokeWidth={1.8} />
                                </span>
                                <p className="text-sm font-semibold text-gray-900">Chưa có thông báo</p>
                                <p className="mt-1 max-w-[240px] text-xs leading-5 text-gray-500">
                                    Các cập nhật quan trọng sẽ xuất hiện tại đây.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {notifications.map((n) => {
                                    const Icon = typeIcons[n.type] || Bell;

                                    return (
                                        <button
                                            key={n.id}
                                            onClick={() => handleClick(n)}
                                            className="flex w-full items-start gap-3 rounded-[8px] border border-transparent px-3 py-3 text-left transition-colors hover:border-gray-200 hover:bg-white"
                                            style={{ backgroundColor: !n.isRead ? accent.soft : "transparent" }}
                                        >
                                            <span
                                                className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] border"
                                                style={{
                                                    color: accent.primary,
                                                    backgroundColor: "#FFFFFF",
                                                    borderColor: !n.isRead ? accent.primary : "#E5E7EB",
                                                }}
                                            >
                                                <Icon className="h-4 w-4" strokeWidth={1.8} />
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start gap-2">
                                                    <p className={`min-w-0 flex-1 truncate text-sm leading-5 ${!n.isRead ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                                                        {n.title}
                                                    </p>
                                                    {!n.isRead && (
                                                        <span
                                                            className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
                                                            style={{ backgroundColor: accent.primary }}
                                                        />
                                                    )}
                                                </div>
                                                <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-gray-500">
                                                    {n.message}
                                                </p>
                                                <p className="mt-1 text-[11px] font-medium text-gray-400">
                                                    {timeAgo(n.createdAt)}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
