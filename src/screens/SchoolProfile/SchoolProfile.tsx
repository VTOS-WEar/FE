import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useSidebarConfig } from "../../hooks/useSidebarConfig";
import { getSchoolProfile, deriveProfileStatus, type ProfileStatus, type SchoolProfileDto } from "../../lib/api/schools";
import { ApiError } from "../../lib/api/clients";
import { ApprovedProfileView } from "./ApprovedProfileView";

export const SchoolProfile = (): JSX.Element => {
    const navigate = useNavigate();
    const sidebarConfig = useSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();

    const [profileData, setProfileData] = useState<SchoolProfileDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [status, setStatus] = useState<ProfileStatus>("draft");

    const loadProfile = useCallback(async () => {
        setLoading(true);
        setFetchError(null);

        try {
            const data = await getSchoolProfile();
            setProfileData(data);
            setStatus(deriveProfileStatus(data));
        } catch (err) {
            setProfileData(null);
            if (err instanceof ApiError) {
                if (err.status === 401) {
                    setFetchError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
                } else {
                    setFetchError(err.message || "Không thể tải thông tin hồ sơ trường.");
                }
            } else {
                setFetchError("Không thể tải thông tin hồ sơ trường.");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar
                        {...sidebarConfig}
                        name={profileData?.schoolName || ""}
                        isCollapsed={isCollapsed}
                        onToggle={toggle}
                        onLogout={handleLogout}
                    />
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                    <TopNavBar>
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/school/dashboard" className="font-semibold text-[#4c5769] text-base">
                                        Trang chủ
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="font-bold text-gray-900 text-base">
                                        Hồ sơ trường học
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </TopNavBar>

                    <main className="nb-fade-in flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        {loading && (
                            <div className="flex items-center justify-center py-20">
                                <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#6938EF] border-t-transparent" />
                            </div>
                        )}

                        {fetchError && (
                            <div className="nb-card-static border-[#EF4444] bg-[#FEE2E2] px-4 py-3 text-sm font-semibold text-[#DC2626]">
                                ⚠️ {fetchError}
                            </div>
                        )}

                        {!loading && !fetchError && profileData && (
                            <ApprovedProfileView
                                profile={profileData}
                                status={status}
                                onProfileUpdate={loadProfile}
                            />
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};
