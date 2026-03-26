import { ChevronLeftIcon, ChevronRightIcon, LogOut } from "lucide-react";
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
    avatarSrc: string;
    avatarAlt?: string;
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
    isCollapsed, onToggle, avatarSrc, avatarAlt = "avatar",
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
        <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? "text-[#6938ef]" : "text-[#6b7280]"}`} strokeWidth={1.75} />
    );

    return (
        <aside className="nb-sidebar w-full h-full">
            {/* Logo + Name header */}
            <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center px-2 py-4" : "px-4 py-4"} border-b-2 border-[#E5E7EB]`}>
                <img
                    src={avatarSrc}
                    alt={avatarAlt}
                    className={`${isCollapsed ? "w-8 h-8" : "w-9 h-9"} rounded-full border-2 border-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E] object-cover flex-shrink-0`}
                />
                {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#1A1A2E] text-sm leading-tight truncate">{displayName}</p>
                        {displayName !== personName && personName && (
                            <p className="font-medium text-[#9CA3AF] text-xs truncate">{personName}</p>
                        )}
                    </div>
                )}
                <button onClick={onToggle}
                    className="h-7 w-7 rounded-full border-2 border-[#1A1A2E] bg-white hover:bg-[#FFF5EB] flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0_#1A1A2E] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] transition-all"
                >
                    {isCollapsed ? <ChevronRightIcon className="w-3.5 h-3.5 text-[#1A1A2E]" /> : <ChevronLeftIcon className="w-3.5 h-3.5 text-[#1A1A2E]" />}
                </button>
            </div>

            {/* Nav */}
            <nav className={`flex-1 ${isCollapsed ? "px-1.5" : "px-2.5"} mt-3 overflow-y-auto overflow-x-hidden`}>
                {/* Top-level items (e.g. Tổng quan) */}
                {topNavItems.map((item, index) => (
                    <div key={index} className="relative group mb-1">
                        <button onClick={() => item.href && navigate(item.href)}
                            className={`w-full flex items-center ${isCollapsed ? "justify-center px-0" : "gap-2.5 px-3"} py-2 rounded-lg text-[13px] font-semibold transition-all duration-150
                                ${item.active
                                    ? "bg-[#6938EF] text-white border-2 border-[#1A1A2E] shadow-[3px_3px_0_#1A1A2E]"
                                    : "text-[#4C5769] border-2 border-transparent hover:bg-[#F3F4F6] hover:border-[#E5E7EB]"
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
                            <h2 className="px-3 font-bold text-[10px] uppercase tracking-[0.08em] text-[#9CA3AF] mb-1.5">{section.title}</h2>
                        )}
                        {isCollapsed && <div className="my-1.5 border-t-2 border-[#E5E7EB]" />}
                        <div className="flex flex-col gap-[2px]">
                            {section.items.map((item, iIdx) => (
                                <div key={iIdx} className="relative group flex items-stretch">
                                    {/* Connector line (QuizLM style) */}
                                    {!isCollapsed && (
                                        <div className="flex flex-col items-center w-5 flex-shrink-0 ml-1">
                                            {iIdx < section.items.length - 1 ? (
                                                <div className="w-[2px] h-full bg-[#E5E7EB]" />
                                            ) : (
                                                <div className="flex flex-col items-center h-full">
                                                    <div className="w-[2px] h-1/2 bg-[#E5E7EB]" />
                                                    <div className="w-[2px] h-1/2" />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <button onClick={() => item.href && navigate(item.href)}
                                        className={`flex-1 flex items-center ${isCollapsed ? "justify-center px-0" : "gap-2.5 px-2.5"} py-[7px] rounded-lg text-[13px] transition-all duration-150
                                            ${item.active
                                                ? "bg-[#EDE9FE] text-[#6938EF] font-bold border-2 border-[#6938EF] shadow-[2px_2px_0_#6938EF]"
                                                : "text-[#4C5769] font-medium border-2 border-transparent hover:bg-[#F9FAFB] hover:border-[#E5E7EB]"
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
                        className={`w-full flex items-center ${isCollapsed ? "justify-center" : "justify-center gap-2"} py-2 rounded-lg text-[13px] font-bold text-white bg-[#EF4444] border-2 border-[#1A1A2E] shadow-[3px_3px_0_#1A1A2E] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#1A1A2E] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all`}
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
