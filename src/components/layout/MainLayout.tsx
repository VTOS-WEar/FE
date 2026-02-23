// // src/components/layout/MainLayout.tsx
// import { useLocation } from "react-router-dom";
// import { PAGE_CONFIGS, MENU_DATA } from "../../lib/pageRegistry";
// import { DashboardSidebar, Footer } from "./index";
// import { useState } from "react";

// export const MainLayout = ({ children }: { children: React.ReactNode }) => {
//     const location = useLocation();
//     const [isCollapsed, setIsCollapsed] = useState(false);

//     // Lấy config dựa trên URL
//     const config = Object.values(PAGE_CONFIGS).find(p => p.path === location.pathname) || PAGE_CONFIGS.CONFIRM_SAVE;
//     const menu = MENU_DATA[config.sidebarId as keyof typeof MENU_DATA];

//     const isVertical = config.layout === "VERTICAL";

//     return (
//         <div className="bg-[#f6f7f8] min-h-screen flex flex-col font-['Montserrat']">
//             <div className={`flex flex-1 ${isVertical ? "flex-row" : "flex-col"}`}>

//                 {/* RENDER SIDEBAR DỌC NẾU CONFIG LÀ VERTICAL */}
//                 {isVertical && (
//                     <div className={`${isCollapsed ? "w-16" : "w-[20rem]"} flex-shrink-0 sticky top-0 h-screen transition-all`}>
//                         <DashboardSidebar
//                             isCollapsed={isCollapsed}
//                             onToggle={() => setIsCollapsed(!isCollapsed)}
//                             navSections={menu.navSections}
//                             topNavItems={menu.topNavItems}
//                             name="Trường Tiểu học FPT"
//                             greeting="Xin chào!"
//                             avatarSrc="https://..."
//                         />
//                     </div>
//                 )}

//                 {/* AREA NÀY CHỨA TOP NAV HOẶC CONTENT */}
//                 <main className="flex-1 flex flex-col h-screen overflow-y-auto">
//                     {/* Nếu là HORIZONTAL thì render Navbar ngang ở đây */}
//                     {!isVertical && <div className="h-16 bg-white border-b">Navbar Ngang</div>}

//                     <div className="flex-1">
//                         {children}
//                     </div>
//                     <Footer />
//                 </main>
//             </div>
//         </div>
//     );
// };