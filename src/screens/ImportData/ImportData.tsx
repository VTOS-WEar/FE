import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Footer } from "../../components/layout";
import { DataEntrySection } from "./sections/DataEntrySection";
import { HeaderBreadcrumbSection } from "./sections/HeaderBreadcrumbSection";
import { ImportDataSection } from "./sections/ImportDataSection";
import { ImportHistorySection } from "./sections/ImportHistorySection";
import { ImportInstructionsSection } from "./sections/ImportInstructionsSection";
import { ImportTemplateSection } from "./sections/ImportTemplateSection";
import { ImportantNotesSection } from "./sections/ImportantNotesSection";
import { SidebarNavigationSection } from "./sections/SidebarNavigationSection";
import { UploadFileSection } from "./sections/UploadFileSection";

export const ImportData = (): JSX.Element => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="bg-[#f6f7f8] w-full min-h-screen flex flex-col">
            {/* Sidebar + Content */}
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[20rem] xl:w-[23.75rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto transition-all duration-300`}>
                    <SidebarNavigationSection isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(prev => !prev)} />
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                    <div className="px-4 sm:px-6 lg:px-8 py-6">
                        <HeaderBreadcrumbSection />
                    </div>

                    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-4 lg:py-8 space-y-6">
                        <ImportDataSection />

                        <ImportInstructionsSection />

                        <div className="grid grid-cols-1 lg:grid-cols-[minmax(300px,450px)_1fr] gap-6">
                            <div className="space-y-6">
                                <ImportantNotesSection />
                                <ImportTemplateSection />
                            </div>

                            <DataEntrySection />
                        </div>

                        <div className="space-y-4">
                            <h2 className="[font-family:'Montserrat',Helvetica] font-bold text-black text-xl tracking-[0] leading-[normal]">
                                Lịch sử nhập liệu gần đây
                            </h2>

                            <UploadFileSection />

                            <ImportHistorySection />

                            <div className="flex justify-center bg-slate-50 rounded-[0px_0px_10px_10px] border border-solid border-[#cac9d6] py-[18px]">
                                <Button
                                    variant="link"
                                    className="[font-family:'Montserrat',Helvetica] font-bold text-[#4ca2e6] text-xl h-auto p-0"
                                >
                                    Xem tất cả lịch sử
                                </Button>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* Footer full width */}
            <Footer />
        </div>
    );
};
