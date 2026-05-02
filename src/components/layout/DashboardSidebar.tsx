import { Building2, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, GraduationCap, LogOut, School, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";

export interface NavItem {
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    label: string;
    active?: boolean;
    badge?: string;
    href?: string;
    activeWhen?: (pathname: string) => boolean;
    children?: NavItem[];
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
    iconType?: "school" | "provider" | "admin" | "teacher";
    greeting?: string;
    name: string;
    /** Organization name (school name / provider name) — shown as secondary line below name */
    orgName?: string;
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
    name, orgName, navSections, topNavItems = [], onLogout,
}: DashboardSidebarProps): JSX.Element => {
    const navigate = useNavigate();
    const personName = useMemo(() => getStoredUserName(), []);
    // Primary display: orgName (school/provider name) → name prop (passed from parent) → localStorage org → localStorage user
    const displayOrg = useMemo(() => orgName || getStoredOrgName() || name, [orgName, name]);

    const handleLogout = onLogout ?? (() => {
        localStorage.removeItem("access_token"); localStorage.removeItem("user"); localStorage.removeItem("expires_in");
        localStorage.removeItem("vtos_org_name");
        sessionStorage.removeItem("access_token"); sessionStorage.removeItem("user"); sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    });

    const renderIcon = (Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>, active: boolean) => (
        <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? "text-white" : "text-gray-400"}`} strokeWidth={1.75} />
    );
    const activeNavClass = {
        school: "bg-gradient-to-r from-[#B8A9E8]/35 to-[#A996E2]/10 text-white font-bold border border-[#C4B5FD]/70 shadow-[0_0_0_1px_rgba(184,169,232,0.22)]",
        provider: "bg-gradient-to-r from-[#3B82F6]/35 to-[#2563EB]/10 text-white font-bold border border-[#93C5FD]/70 shadow-[0_0_0_1px_rgba(59,130,246,0.22)]",
        admin: "bg-gradient-to-r from-[#BE123C]/35 to-[#9F1239]/10 text-white font-bold border border-[#FDA4AF]/70 shadow-[0_0_0_1px_rgba(190,18,60,0.22)]",
        teacher: "bg-gradient-to-r from-[#059669]/38 to-[#047857]/12 text-white font-bold border border-[#6EE7B7]/70 shadow-[0_0_0_1px_rgba(5,150,105,0.24)]",
    }[iconType];
    const activeChildMarkerClass = iconType === "teacher"
        ? "border-[#6EE7B7] bg-[#6EE7B7]"
        : iconType === "provider"
            ? "border-[#93C5FD] bg-[#93C5FD]"
            : iconType === "admin"
                ? "border-[#FDA4AF] bg-[#FDA4AF]"
                : "border-[#93C5FD] bg-[#93C5FD]";

    const renderNavItem = (item: NavItem, key: string, depth = 0, topLevel = false) => {
        const hasChildren = Boolean(item.children?.length);
        const active = Boolean(item.active || item.children?.some((child) => child.active));
        const childExpanded = hasChildren && (active || topLevel);
        const handleClick = () => {
            if (item.href) {
                navigate(item.href);
                return;
            }
            const firstChildHref = item.children?.find((child) => child.href)?.href;
            if (firstChildHref) navigate(firstChildHref);
        };

        if (depth > 0) {
            return (
                <div key={key} className="relative group">
                    <button
                        onClick={handleClick}
                        className={`w-full flex items-center ${isCollapsed ? "justify-center px-0" : "gap-2 px-3"} py-[6px] rounded-md text-[13px] transition-all duration-150
                            ${active
                                ? "text-white font-bold"
                                : "text-[#D1D5DB] font-medium hover:bg-white/8 hover:text-white"
                            } ${item.href || hasChildren ? "cursor-pointer" : ""}`}
                    >
                        <span className={`h-1.5 w-1.5 rotate-45 rounded-[1px] border ${active ? activeChildMarkerClass : "border-[#7D8398]"}`} />
                        {!isCollapsed && <span className="flex-1 text-left">{item.label}</span>}
                        {!isCollapsed && item.badge ? (
                            <span className="min-w-[20px] h-5 flex items-center justify-center bg-[#FECACA] text-[#DC2626] rounded-full px-1.5 text-[10px] font-bold border border-[#DC2626]">{item.badge}</span>
                        ) : null}
                    </button>
                    {isCollapsed && <span className="nb-tooltip">{item.label}</span>}
                    {!isCollapsed && childExpanded && hasChildren ? (
                        <div className="ml-4 mt-1 flex flex-col gap-[2px] border-l border-white/10 pl-2">
                            {item.children!.map((child, index) => renderNavItem(child, `${key}-${index}`, depth + 1))}
                        </div>
                    ) : null}
                </div>
            );
        }

        return (
            <div key={key} className="relative group">
                <button
                    onClick={handleClick}
                    className={`w-full flex items-center ${isCollapsed ? "justify-center px-0" : "gap-2.5 px-2.5"} py-[7px] rounded-md text-[13px] transition-all duration-150
                        ${active
                            ? activeNavClass
                            : "text-[#D1D5DB] font-medium hover:bg-white/8 hover:text-white hover:-translate-y-px"
                        } ${item.href || hasChildren ? "cursor-pointer" : ""}`}
                >
                    <div className="relative flex-shrink-0">
                        {renderIcon(item.icon, active)}
                        {item.badge && isCollapsed && <span className="nb-dot" />}
                    </div>
                    {!isCollapsed && (
                        <>
                            <span className="flex-1 text-left">{item.label}</span>
                            {item.badge && (
                                <span className="min-w-[20px] h-5 flex items-center justify-center bg-[#FECACA] text-[#DC2626] rounded-full px-1.5 text-[10px] font-bold border border-[#DC2626]">{item.badge}</span>
                            )}
                            {hasChildren ? (
                                <ChevronDownIcon className={`h-3.5 w-3.5 flex-shrink-0 transition-transform ${childExpanded ? "rotate-0" : "-rotate-90"}`} />
                            ) : null}
                        </>
                    )}
                </button>
                {isCollapsed && <span className="nb-tooltip">{item.label}</span>}
                {!isCollapsed && childExpanded && hasChildren ? (
                    <div className="ml-5 mt-1 flex flex-col gap-[2px] border-l border-white/10 pl-2">
                        {item.children!.map((child, index) => renderNavItem(child, `${key}-${index}`, depth + 1))}
                    </div>
                ) : null}
            </div>
        );
    };

    const IconComponent = iconType === "provider" ? Building2 : iconType === "admin" ? ShieldCheck : iconType === "teacher" ? GraduationCap : School;
    const iconBg = iconType === "provider" ? "bg-[#3B82F6]" : iconType === "admin" ? "bg-[#BE123C]" : iconType === "teacher" ? "bg-[#059669]" : "bg-[#6938EF]";
    const iconColor = "text-white";

    return (
        <aside className="nb-sidebar w-full h-full bg-gradient-to-b from-[#171932] via-[#15172E] to-[#12142A]">
            {/* Logo + Name header */}
            <div className={`flex ${isCollapsed ? "flex-col items-center gap-2 px-2 py-3" : "items-center gap-3 px-4 py-4"} border-b border-white/10 bg-white/[0.02]`}>
                <div className={`${isCollapsed ? "w-8 h-8" : "w-9 h-9"} rounded-md border border-white/20 ${iconBg} flex items-center justify-center flex-shrink-0 shadow-soft-sm`}>
                    <IconComponent className={`${isCollapsed ? "w-4 h-4" : "w-5 h-5"} ${iconColor}`} strokeWidth={1.75} />
                </div>
                {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm leading-tight">{displayOrg}</p>
                        {displayOrg !== personName && personName && (
                            <p className="font-medium text-gray-400 text-xs">{personName}</p>
                        )}
                    </div>
                )}
                <button onClick={onToggle}
                    className="h-7 w-7 rounded-md border border-white/20 bg-white/10 hover:bg-white/20 hover:-translate-y-px flex items-center justify-center flex-shrink-0 transition-all"
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
                                    ? activeNavClass
                                    : "text-[#D1D5DB] hover:bg-white/8 hover:text-white hover:-translate-y-px"
                                } ${item.href ? "cursor-pointer" : ""}`}
                        >
                            {item.active ? (
                                <item.icon className="w-[18px] h-[18px] flex-shrink-0 text-white" strokeWidth={1.75} />
                            ) : renderIcon(item.icon, false)}
                            {!isCollapsed && <span>{item.label}</span>}
                        </button>
                        {isCollapsed && <span className="nb-tooltip">{item.label}</span>}
                        {!isCollapsed && item.children?.length ? (
                            <div className="ml-5 mt-1 flex flex-col gap-[2px] border-l border-white/10 pl-2">
                                {item.children.map((child, childIndex) => renderNavItem(child, `top-${index}-${childIndex}`, 1, true))}
                            </div>
                        ) : null}
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
                            {section.items.map((item, iIdx) => renderNavItem(item, `${sIdx}-${iIdx}`))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Logout */}
            <div className={`${isCollapsed ? "px-1.5" : "px-2.5"} pb-3 mt-2`}>
                <div className="relative group">
                    <button onClick={handleLogout}
                        className={`w-full flex items-center ${isCollapsed ? "justify-center" : "justify-center gap-2"} py-2 rounded-md text-[13px] font-bold text-white bg-gradient-to-r from-[#EF4444] to-[#DC2626] border border-red-500 shadow-soft-sm hover:-translate-y-px hover:brightness-105 active:bg-[#B91C1C] transition-all`}
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
