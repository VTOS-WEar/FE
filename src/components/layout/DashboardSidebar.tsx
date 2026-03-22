import { ChevronLeftIcon, ChevronRightIcon, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { Avatar, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

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

const Tooltip = ({ label }: { label: string }) => (
    <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap rounded-md bg-gray-800 px-2.5 py-1 text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
        {label}
    </span>
);

/** Read display name from localStorage user object */
function getStoredUserName(): string {
    try {
        const raw = localStorage.getItem("user") ?? sessionStorage.getItem("user");
        if (!raw) return "";
        const u = JSON.parse(raw);
        return u.fullName || u.email || "";
    } catch {
        return "";
    }
}

/** Read cached organization name (school/provider) from localStorage */
function getStoredOrgName(): string {
    try {
        return localStorage.getItem("vtos_org_name") || "";
    } catch {
        return "";
    }
}

export const DashboardSidebar = ({
    isCollapsed,
    onToggle,
    avatarSrc,
    avatarAlt = "avatar",
    greeting,
    name,
    navSections,
    topNavItems = [],
    onLogout,
}: DashboardSidebarProps): JSX.Element => {
    const navigate = useNavigate();

    // Auto-detect name: prop > cached org name > user full name
    const displayName = useMemo(() => name || getStoredOrgName() || getStoredUserName(), [name]);

    // Person's name from localStorage (always the person, not org)
    const personName = useMemo(() => getStoredUserName(), []);

    // Built-in logout fallback
    const handleLogout = onLogout ?? (() => {
        localStorage.removeItem("access_token"); localStorage.removeItem("user"); localStorage.removeItem("expires_in");
        localStorage.removeItem("vtos_org_name");
        sessionStorage.removeItem("access_token"); sessionStorage.removeItem("user"); sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    });

    const renderIcon = (
        Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>,
        active: boolean
    ) => (
        <Icon
            className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${
                active ? "text-[#6938ef]" : "text-[#6b7280]"
            }`}
            strokeWidth={1.75}
        />
    );

    return (
        <aside className="w-full h-full flex flex-col bg-white border-r border-gray-200 overflow-x-hidden overflow-y-auto">
            {/* Toggle button */}
            <div className={`flex ${isCollapsed ? "justify-center" : "justify-end"} pt-3 px-3`}>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggle}
                    className="h-8 w-8 rounded-full border border-gray-200 hover:bg-gray-50 flex-shrink-0"
                >
                    {isCollapsed
                        ? <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                        : <ChevronLeftIcon className="w-4 h-4 text-gray-500" />
                    }
                </Button>
            </div>

            {/* Avatar / Logo */}
            <div className={`flex flex-col items-center pt-3 ${isCollapsed ? "px-2" : "px-5"}`}>
                <Avatar className={`${isCollapsed ? "w-10 h-10" : "w-20 h-20"} border-2 border-white shadow-md transition-all duration-300`}>
                    <AvatarImage src={avatarSrc} alt={avatarAlt} />
                </Avatar>

                {!isCollapsed && (
                    <div className="mt-3 text-center">
                        {greeting && <p className="font-medium italic text-gray-500 text-sm">{greeting}</p>}
                        <p className="font-bold text-gray-900 text-base leading-snug">{displayName}</p>
                        {displayName !== personName && personName && (
                            <p className="font-medium text-gray-500 text-xs mt-0.5">{personName}</p>
                        )}
                    </div>
                )}
            </div>

            {/* Nav */}
            <nav className={`flex-1 ${isCollapsed ? "px-2" : "px-3"} mt-4 overflow-y-auto overflow-x-hidden`}>
                {/* Top-level nav items (e.g. Tổng quan) */}
                {topNavItems.map((item, index) => (
                    <div key={index} className="relative group mb-1">
                        <button
                            onClick={() => item.href && navigate(item.href)}
                            className={`w-full flex items-center ${isCollapsed ? "justify-center px-0" : "gap-3 px-3"} h-auto py-2.5 rounded-lg transition-all duration-200
                                ${item.active
                                    ? "bg-[#f0eaff] border-l-[3px] border-[#6938ef]"
                                    : "hover:bg-gray-50 border-l-[3px] border-transparent"
                                } ${item.href ? "cursor-pointer" : ""}`}
                        >
                            {renderIcon(item.icon, !!item.active)}
                            {!isCollapsed && (
                                <span className={`font-semibold text-sm ${item.active ? "text-[#6938ef]" : "text-gray-600"}`}>
                                    {item.label}
                                </span>
                            )}
                        </button>
                        {isCollapsed && <Tooltip label={item.label} />}
                    </div>
                ))}

                {/* Sections */}
                {navSections.map((section, sIdx) => (
                    <div key={sIdx} className="mt-3">
                        {!isCollapsed && (
                            <h2 className="px-3 font-semibold text-[11px] uppercase tracking-[0.05em] text-gray-400 mb-2">
                                {section.title}
                            </h2>
                        )}
                        {isCollapsed && <div className="my-2 border-t border-gray-200" />}

                        <div className="flex flex-col gap-0.5">
                            {section.items.map((item, iIdx) => (
                                <div key={iIdx} className="relative group">
                                    <button
                                        onClick={() => item.href && navigate(item.href)}
                                        className={`w-full flex items-center ${isCollapsed ? "justify-center px-0" : "gap-3 px-3"} h-auto py-2 rounded-lg transition-all duration-200
                                            ${item.active
                                                ? "bg-[#f0eaff] border-l-[3px] border-[#6938ef]"
                                                : "hover:bg-gray-50 border-l-[3px] border-transparent"
                                            } ${item.href ? "cursor-pointer" : ""}`}
                                    >
                                        <div className="relative flex-shrink-0">
                                            {renderIcon(item.icon, !!item.active)}
                                            {item.badge && isCollapsed && (
                                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
                                            )}
                                        </div>
                                        {!isCollapsed && (
                                            <>
                                                <span className={`flex-1 text-left font-medium text-sm ${item.active ? "text-[#6938ef]" : "text-gray-600"}`}>
                                                    {item.label}
                                                </span>
                                                {item.badge && (
                                                    <Badge className="w-5 h-5 flex items-center justify-center bg-red-500 hover:bg-red-500 rounded-full p-0">
                                                        <span className="font-semibold text-white text-xs">
                                                            {item.badge}
                                                        </span>
                                                    </Badge>
                                                )}
                                            </>
                                        )}
                                    </button>
                                    {isCollapsed && (
                                        <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap rounded-md bg-gray-800 px-2.5 py-1 text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
                                            {item.label}
                                            {item.badge && (
                                                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 bg-red-500 rounded-full text-xs">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Logout */}
            <div className={`${isCollapsed ? "px-2" : "px-3"} pb-4 mt-2`}>
                <div className="relative group">
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center ${isCollapsed ? "justify-center px-0" : "justify-center gap-2.5 px-2"} h-auto py-2.5 bg-red-50 hover:bg-red-100 rounded-lg transition-all duration-200`}
                    >
                        {!isCollapsed && (
                            <span className="font-semibold text-red-500 text-sm">
                                Đăng Xuất
                            </span>
                        )}
                        <LogOut className="w-5 h-5 text-red-500" strokeWidth={1.75} />
                    </button>
                    {isCollapsed && <Tooltip label="Đăng Xuất" />}
                </div>
            </div>
        </aside>
    );
};
