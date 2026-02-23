import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Avatar, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

export interface NavItem {
    icon: string;
    label: string;
    active?: boolean;
    badge?: string;
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
}

const Tooltip = ({ label }: { label: string }) => (
    <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap rounded-md bg-gray-800 px-2.5 py-1 text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
        {label}
    </span>
);

export const DashboardSidebar = ({
    isCollapsed,
    onToggle,
    avatarSrc,
    avatarAlt = "avatar",
    greeting,
    name,
    navSections,
    topNavItems = [],
}: DashboardSidebarProps): JSX.Element => {
    return (
        <aside className="w-full h-full flex flex-col bg-white border-r border-[#cac9d6] overflow-hidden">
            {/* Toggle button */}
            <div className={`flex ${isCollapsed ? "justify-center" : "justify-end"} pt-3 px-3`}>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggle}
                    className="h-8 w-8 rounded-full border border-[#cac9d6] hover:bg-[#ebf3fd] flex-shrink-0"
                >
                    {isCollapsed
                        ? <ChevronRightIcon className="w-4 h-4 text-[#4c5769]" />
                        : <ChevronLeftIcon className="w-4 h-4 text-[#4c5769]" />
                    }
                </Button>
            </div>

            {/* Avatar / Logo */}
            <div className={`flex flex-col items-center pt-3 ${isCollapsed ? "px-2" : "px-5"}`}>
                <Avatar className={`${isCollapsed ? "w-10 h-10" : "w-24 h-24"} border-2 border-white shadow-[0px_4px_4px_#00000040] transition-all duration-300`}>
                    <AvatarImage src={avatarSrc} alt={avatarAlt} />
                </Avatar>

                {!isCollapsed && (
                    <div className="mt-3 text-center [font-family:'Montserrat',Helvetica]">
                        {greeting && <p className="font-medium italic text-black text-sm">{greeting}</p>}
                        <p className="font-extrabold text-black text-base leading-snug">{name}</p>
                    </div>
                )}
            </div>

            {/* Nav */}
            <nav className={`flex-1 ${isCollapsed ? "px-2" : "px-3"} mt-4`}>
                {/* Top-level nav items (e.g. Tổng quan) */}
                {topNavItems.map((item, index) => (
                    <div key={index} className="relative group mb-2">
                        <Button
                            variant="ghost"
                            className={`w-full ${isCollapsed ? "justify-center px-0" : "justify-start gap-2.5 px-3"} h-auto py-2.5 hover:bg-[#ebf3fd] ${item.active ? "bg-[#ebf3fd]" : ""}`}
                        >
                            <img className="w-6 h-6 flex-shrink-0" alt={item.label} src={item.icon} />
                            {!isCollapsed && (
                                <span className={`[font-family:'Montserrat',Helvetica] font-semibold text-base ${item.active ? "text-[#478aea]" : "text-[#4c5769]"}`}>
                                    {item.label}
                                </span>
                            )}
                        </Button>
                        {isCollapsed && <Tooltip label={item.label} />}
                    </div>
                ))}

                {/* Sections */}
                {navSections.map((section, sIdx) => (
                    <div key={sIdx} className={sIdx > 0 ? "mt-1" : "mb-1"}>
                        {!isCollapsed && (
                            <h2 className="px-2 [font-family:'Montserrat',Helvetica] font-bold text-[#97a3b6] text-xs tracking-wide mb-1.5 mt-2">
                                {section.title}
                            </h2>
                        )}
                        {isCollapsed && <div className="my-2 border-t border-[#cac9d6]" />}

                        <div className="flex flex-col gap-1">
                            {section.items.map((item, iIdx) => (
                                <div key={iIdx} className="relative group">
                                    <Button
                                        variant="ghost"
                                        className={`w-full ${isCollapsed ? "justify-center px-0" : "justify-start gap-2.5 px-3"} h-auto py-2.5 rounded-[8px] hover:bg-[#ebf3fd] ${item.active ? "bg-[#ebf3fd]" : ""}`}
                                    >
                                        <div className="relative flex-shrink-0">
                                            <img className="w-6 h-6" alt={item.label} src={item.icon} />
                                            {item.badge && isCollapsed && (
                                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#ff0000] rounded-full" />
                                            )}
                                        </div>
                                        {!isCollapsed && (
                                            <>
                                                <span className={`flex-1 text-left [font-family:'Montserrat',Helvetica] font-semibold text-base ${item.active ? "text-[#478aea]" : "text-[#4c5769]"}`}>
                                                    {item.label}
                                                </span>
                                                {item.badge && (
                                                    <Badge className="w-5 h-5 flex items-center justify-center bg-[#ff0000] hover:bg-[#ff0000] rounded-full p-0">
                                                        <span className="[font-family:'Montserrat',Helvetica] font-semibold text-white text-xs">
                                                            {item.badge}
                                                        </span>
                                                    </Badge>
                                                )}
                                            </>
                                        )}
                                    </Button>
                                    {isCollapsed && (
                                        <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap rounded-md bg-gray-800 px-2.5 py-1 text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
                                            {item.label}
                                            {item.badge && (
                                                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 bg-[#ff0000] rounded-full text-xs">
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
                    <Button
                        variant="ghost"
                        className={`w-full ${isCollapsed ? "justify-center px-0" : "justify-center gap-2.5 px-2"} h-auto py-2.5 bg-[#ff000029] hover:bg-[#ff000029] rounded-[8px]`}
                    >
                        {!isCollapsed && (
                            <span className="[font-family:'Montserrat',Helvetica] font-semibold text-[#ff0000] text-base">
                                Đăng xuất
                            </span>
                        )}
                        <img
                            className="w-6 h-6"
                            alt="Logout"
                            src="https://c.animaapp.com/mlsaxpa0EQIM7j/img/material-symbols-logout-rounded.svg"
                        />
                    </Button>
                    {isCollapsed && <Tooltip label="Đăng xuất" />}
                </div>
            </div>
        </aside>
    );
};
