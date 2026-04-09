import { ChevronLeftIcon, ChevronRightIcon, LogOut, School, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";

export interface NavItem {
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    label: string;
    active?: boolean;
    badge?: string;
    href?: string;
}

export interface NavSection {
    title: string;
    items: NavItem[];
}

export interface DashboardSidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
    avatarSrc?: string;
    avatarAlt?: string;
    iconType?: "school" | "provider";
    greeting?: string;
    name: string;
    navSections: NavSection[];
    topNavItems?: NavItem[];
    onLogout?: () => void;
}

function getStoredUserName(): string {
    try {
        const raw = localStorage.getItem("user") ?? sessionStorage.getItem("user");
        if (!raw) return "";
        const u = JSON.parse(raw);
        return u.fullName || u.email || "";
    } catch { return ""; }
}

function getStoredOrgName(): string {
    try { return localStorage.getItem("vtos_org_name") || ""; } catch { return ""; }
}

export const DashboardSidebar = ({
    isCollapsed, onToggle, iconType = "school",
    name, navSections, topNavItems = [], onLogout,
}: DashboardSidebarProps): JSX.Element => {
    const navigate = useNavigate();
    const displayName = useMemo(() => name || getStoredOrgName() || getStoredUserName(), [name]);
    const personName = useMemo(() => getStoredUserName(), []);

    const handleLogout = onLogout ?? (() => {
        localStorage.removeItem("access_token"); localStorage.removeItem("user"); localStorage.removeItem("expires_in");
        localStorage.removeItem("vtos_org_name");
        sessionStorage.removeItem("access_token"); sessionStorage.removeItem("user"); sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    });

    const renderIcon = (Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>, active: boolean) => (
        <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? "text-white" : "text-[#9CA3AF]"}`} strokeWidth={1.75} />
    );

    const IconComponent = iconType === "provider" ? Building2 : School;
    const iconBg = iconType === "provider" ? "bg-[#3B82F6]" : "bg-[#6938EF]";
    const iconColor = "text-white";

    return (
        <aside className="nb-sidebar w-full h-full bg-gradient-to-b from-[#171932] via-[#15172E] to-[#12142A]">
            {/* Logo + Name header */}
            <div className={`flex ${isCollapsed ? "flex-col items-center gap-2 px-2 py-3" : "items-center gap-3 px-4 py-4"} border-b border-white/10 bg-white/[0.02]`}>
                <div className={`${isCollapsed ? "w-8 h-8" : "w-9 h-9"} rounded-md border-2 border-white/20 ${iconBg} flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0_rgba(0,0,0,0.25)]`}>
                    <IconComponent className={`${isCollapsed ? "w-4 h-4" : "w-5 h-5"} ${iconColor}`} strokeWidth={1.75} />
                </div>
                {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm leading-tight">{displayName}</p>
                        {displayName !== personName && personName && (
                            <p className="font-medium text-[#9CA3AF] text-xs">{personName}</p>
                        )}
                    </div>
                )}
                <button onClick={onToggle}
                    className="h-7 w-7 rounded-md border-2 border-white/20 bg-white/10 hover:bg-white/20 hover:-translate-y-px flex items-center justify-center flex-shrink-0 transition-all"
                >
                    {isCollapsed ? <ChevronRightIcon className="w-3.5 h-3.5 text-white" /> : <ChevronLeftIcon className="w-3.5 h-3.5 text-white" />}
                </button>
            </div>

            {/* Nav */}
            <nav className={`flex-1 ${isCollapsed ? "px-1.5" : "px-2.5"} mt-3 overflow-y-auto overflow-x-hidden`}>
                {/* Top-level items (e.g. Tổng quan) */}
                {topNavItems.map((item, index) => (
                    <div key={index} className="relative group mb-1">
                        <button onClick={() => item.href && navigate(item.href)}
                            className={`w-full flex items-center ${isCollapsed ? "justify-center px-0" : "gap-2.5 px-3"} py-2 rounded-md text-[13px] font-semibold transition-all duration-150
                                ${item.active
                                    ? "bg-gradient-to-r from-[#B8A9E8]/35 to-[#A996E2]/10 text-white border border-[#C4B5FD]/70 shadow-[0_0_0_1px_rgba(184,169,232,0.22)]"
                                    : "text-[#D1D5DB] hover:bg-white/8 hover:text-white hover:-translate-y-px"
                                } ${item.href ? "cursor-pointer" : ""}`}
                        >
                            {item.active ? (
                                <item.icon className="w-[18px] h-[18px] flex-shrink-0 text-white" strokeWidth={1.75} />
                            ) : renderIcon(item.icon, false)}
                            {!isCollapsed && <span>{item.label}</span>}
                        </button>
                        {isCollapsed && <span className="nb-tooltip">{item.label}</span>}
                    </div>
                ))}

                {/* Sections */}
                {navSections.map((section, sIdx) => (
                    <div key={sIdx} className="mt-3">
                        {!isCollapsed && (
                            <h2 className="px-3 font-bold text-[10px] uppercase tracking-[0.08em] text-[#7D8398] mb-1.5">{section.title}</h2>
                        )}
                        {isCollapsed && <div className="my-1.5 border-t border-white/10" />}
                        <div className="flex flex-col gap-[2px]">
                            {section.items.map((item, iIdx) => (
                                <div key={iIdx} className="relative group flex items-stretch">
                                    <button onClick={() => item.href && navigate(item.href)}
                                        className={`w-full flex items-center ${isCollapsed ? "justify-center px-0" : "gap-2.5 px-2.5"} py-[7px] rounded-md text-[13px] transition-all duration-150
                                            ${item.active
                                                ? "bg-gradient-to-r from-[#B8A9E8]/35 to-[#A996E2]/10 text-white font-bold border border-[#C4B5FD]/70 shadow-[0_0_0_1px_rgba(184,169,232,0.22)]"
                                                : "text-[#D1D5DB] font-medium hover:bg-white/8 hover:text-white hover:-translate-y-px"
                                            } ${item.href ? "cursor-pointer" : ""}`}
                                    >
                                        <div className="relative flex-shrink-0">
                                            {renderIcon(item.icon, !!item.active)}
                                            {item.badge && isCollapsed && <span className="nb-dot" />}
                                        </div>
                                        {!isCollapsed && (
                                            <>
                                                <span className="flex-1 text-left">{item.label}</span>
                                                {item.badge && (
                                                    <span className="min-w-[20px] h-5 flex items-center justify-center bg-[#FECACA] text-[#DC2626] rounded-full px-1.5 text-[10px] font-bold border border-[#DC2626]">{item.badge}</span>
                                                )}
                                            </>
                                        )}
                                    </button>
                                    {isCollapsed && (
                                        <span className="nb-tooltip">
                                            {item.label}
                                            {item.badge && <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 bg-[#EF4444] rounded-full text-xs font-bold text-white">{item.badge}</span>}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Logout */}
            <div className={`${isCollapsed ? "px-1.5" : "px-2.5"} pb-3 mt-2`}>
                <div className="relative group">
                    <button onClick={handleLogout}
                        className={`w-full flex items-center ${isCollapsed ? "justify-center" : "justify-center gap-2"} py-2 rounded-md text-[13px] font-bold text-white bg-gradient-to-r from-[#EF4444] to-[#DC2626] border-2 border-[#EF4444] shadow-[2px_2px_0_rgba(0,0,0,0.25)] hover:-translate-y-px hover:brightness-105 active:bg-[#B91C1C] transition-all`}
                    >
                        <LogOut className="w-4 h-4 text-white" strokeWidth={1.75} />
                        {!isCollapsed && <span>Đăng Xuất</span>}
                    </button>
                    {isCollapsed && <span className="nb-tooltip">Đăng Xuất</span>}
                </div>
            </div>
        </aside>
    );
};
