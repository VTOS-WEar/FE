import { useState, useEffect, useCallback } from "react";
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
import { Footer } from "../../components/Footer";
import { DASHBOARD_SIDEBAR_CONFIG } from "../../constants/dashboardConfig";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
    getSchoolProfile,
    updateSchoolProfile,
    parseContactInfo,
    stringifyContactInfo,
    deriveProfileStatus,
    type ContactInfoData,
    type ProfileStatus,
    type SchoolProfileDto,
} from "../../lib/api/schools";
import { ApiError } from "../../lib/api/clients";
import { ApprovedProfileView } from "./ApprovedProfileView";

/** Override sidebar config: set "Hồ sơ trường" as active */
const sidebarConfig = {
    ...DASHBOARD_SIDEBAR_CONFIG,
    navSections: DASHBOARD_SIDEBAR_CONFIG.navSections.map((section) => ({
        ...section,
        items: section.items.map((item) => ({
            ...item,
            active: item.label === "Hồ sơ trường",
        })),
    })),
};

export const SchoolProfile = (): JSX.Element => {
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // ── Profile data ──
    const [profileData, setProfileData] = useState<SchoolProfileDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // ── Draft form state ──
    const [status, setStatus] = useState<ProfileStatus>("draft");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [schoolName, setSchoolName] = useState("");

    // ── Load profile ──
    const loadProfile = useCallback(async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const data = await getSchoolProfile();
            setProfileData(data);
            setSchoolName(data.schoolName || "");
            setStatus(deriveProfileStatus(data));

            const info = parseContactInfo(data.contactInfo);
            setEmail(info.email || "");
            setPhone(info.phone || "");
            setAddress(info.address || "");
        } catch (err) {
            setProfileData(null);
            if (err instanceof ApiError) {
                if (err.status === 401) {
                    setFetchError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
                } else {
                    // API error → not approved/registered → show draft form
                    setFetchError(null);
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

    // ── Draft form submit ──
    const handleSubmit = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);

        const contactInfo: ContactInfoData = { email, phone, address };

        try {
            const updated = await updateSchoolProfile({
                schoolName: schoolName || undefined,
                contactInfo: stringifyContactInfo(contactInfo),
            });
            setStatus(deriveProfileStatus(updated));
            setSuccess("Đã cập nhật hồ sơ trường thành công!");
            setTimeout(() => setSuccess(null), 4000);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError("Không thể cập nhật hồ sơ. Vui lòng thử lại.");
            }
        } finally {
            setSaving(false);
        }
    };

    /** Clear session and redirect to login */
    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    // ── Determine which view to show ──
    const isApproved = !loading && profileData !== null;

    // ── Render ─────────────────────────────────────────────
    return (
        <div className="bg-[#f6f7f8] w-full min-h-screen flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                {/* Sidebar */}
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[20rem] xl:w-[23.75rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar
                        {...sidebarConfig}
                        name={profileData?.schoolName || sidebarConfig.name}
                        isCollapsed={isCollapsed}
                        onToggle={() => setIsCollapsed(prev => !prev)}
                        onLogout={handleLogout}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Breadcrumb header */}
                    <div className="bg-white border-b border-[#cbcad7] px-4 sm:px-6 lg:px-10 py-5">
                        <Breadcrumb>
                            <BreadcrumbList className="gap-2.5">
                                <BreadcrumbItem>
                                    <BreadcrumbLink className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4c5769] text-base">
                                        Trang chủ
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="[font-family:'Montserrat',Helvetica] font-semibold text-[#cbcad7] text-base">
                                    /
                                </BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4c5769] text-base">
                                        Hồ sơ Trường học
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>

                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6">
                        {/* ── Loading state ── */}
                        {loading && (
                            <div className="flex items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#6938ef] border-t-transparent" />
                            </div>
                        )}

                        {/* ── Fetch error ── */}
                        {fetchError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 rounded-[10px] px-4 py-3 [font-family:'Montserrat',Helvetica] text-sm font-medium">
                                ⚠️ {fetchError}
                            </div>
                        )}

                        {/* ══════ APPROVED VIEW ══════ */}
                        {isApproved && profileData && (
                            <ApprovedProfileView
                                profile={profileData}
                                onProfileUpdate={loadProfile}
                            />
                        )}

                        {/* ══════ DRAFT/PENDING VIEW ══════ */}
                        {!loading && !isApproved && !fetchError && (
                            <>
                                {/* Page Header + Status Badge */}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div>
                                        <h1 className="[font-family:'Montserrat',Helvetica] font-bold text-black text-[32px] leading-[1.22]">
                                            Cung cấp thông tin Trường học
                                        </h1>
                                        <p className="mt-1 [font-family:'Montserrat',Helvetica] font-medium text-[#4c5769] text-base">
                                            Cập nhật thông tin định danh và tài liệu pháp lý của nhà trường.
                                        </p>
                                    </div>

                                    <Badge
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-xl font-semibold [font-family:'Montserrat',Helvetica] whitespace-nowrap ${
                                            status === "submitted"
                                                ? "bg-green-100 text-green-700 hover:bg-green-100"
                                                : "bg-[rgba(243,206,72,0.2)] text-[#cfa91d] hover:bg-[rgba(243,206,72,0.2)]"
                                        }`}
                                    >
                                        <span
                                            className={`w-3 h-3 rounded-full ${
                                                status === "submitted" ? "bg-green-500" : "bg-[#cfa91d]"
                                            }`}
                                        />
                                        Trạng thái: {status === "submitted" ? "Đã gửi" : "Nháp"}
                                    </Badge>
                                </div>

                                {/* Status Alert Card */}
                                <Card className="border border-[#cbcad7] rounded-[10px] shadow-none">
                                    <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div>
                                            <h2 className="[font-family:'Montserrat',Helvetica] font-semibold text-black text-xl leading-[1.22]">
                                                Hồ sơ hiện tại: {status === "submitted" ? "Đã gửi" : "Nháp"}
                                            </h2>
                                            <p className="mt-2 [font-family:'Montserrat',Helvetica] font-medium text-[#4c5769] text-sm leading-[1.22]">
                                                Vui lòng hoàn thiện các trường thông tin bắt buộc và tải lên tài liệu pháp lý để Admin xét duyệt.
                                            </p>
                                        </div>
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={saving || loading}
                                            className="bg-[#4ca2e6] hover:bg-[#3b8fd0] text-white [font-family:'Montserrat',Helvetica] font-semibold text-[15px] rounded-[10px] px-6 py-3 shadow-[0px_4px_4px_rgba(76,162,230,0.25)] whitespace-nowrap"
                                        >
                                            {saving ? "Đang lưu..." : "Gửi hồ sơ ngay"}
                                        </Button>
                                    </CardContent>
                                </Card>

                                {/* Feedback messages */}
                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-[10px] px-4 py-3 [font-family:'Montserrat',Helvetica] text-sm font-medium">
                                        ⚠️ {error}
                                    </div>
                                )}
                                {success && (
                                    <div className="bg-green-50 border border-green-200 text-green-700 rounded-[10px] px-4 py-3 [font-family:'Montserrat',Helvetica] text-sm font-medium">
                                        ✅ {success}
                                    </div>
                                )}

                                {/* Card: Thông tin liên hệ */}
                                <Card className="border border-[#cbcad7] rounded-[10px] shadow-none">
                                    <CardHeader className="px-6 sm:px-8 pt-6 pb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center justify-center w-8 h-8 bg-[#3c6efd] rounded-[10px]">
                                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <CardTitle className="[font-family:'Montserrat',Helvetica] font-bold text-black text-lg">
                                                Thông tin liên hệ
                                            </CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="px-6 sm:px-8 pb-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="md:col-span-2">
                                                <Label
                                                    htmlFor="schoolName"
                                                    className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4c5769] text-sm mb-2 block"
                                                >
                                                    Tên trường
                                                </Label>
                                                <Input
                                                    id="schoolName"
                                                    value={schoolName}
                                                    onChange={(e) => setSchoolName(e.target.value)}
                                                    placeholder="Nhập tên trường..."
                                                    className="[font-family:'Montserrat',Helvetica] border-[#cbcad7] focus:border-[#478aea] rounded-lg h-11"
                                                />
                                            </div>

                                            <div>
                                                <Label
                                                    htmlFor="email"
                                                    className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4c5769] text-sm mb-2 block"
                                                >
                                                    Email
                                                </Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="school@example.com"
                                                    className="[font-family:'Montserrat',Helvetica] border-[#cbcad7] focus:border-[#478aea] rounded-lg h-11"
                                                />
                                            </div>

                                            <div>
                                                <Label
                                                    htmlFor="phone"
                                                    className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4c5769] text-sm mb-2 block"
                                                >
                                                    Số điện thoại
                                                </Label>
                                                <Input
                                                    id="phone"
                                                    type="tel"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    placeholder="0901 234 567"
                                                    className="[font-family:'Montserrat',Helvetica] border-[#cbcad7] focus:border-[#478aea] rounded-lg h-11"
                                                />
                                            </div>

                                            <div className="md:col-span-2">
                                                <Label
                                                    htmlFor="address"
                                                    className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4c5769] text-sm mb-2 block"
                                                >
                                                    Địa chỉ
                                                </Label>
                                                <Input
                                                    id="address"
                                                    value={address}
                                                    onChange={(e) => setAddress(e.target.value)}
                                                    placeholder="Nhập địa chỉ trường..."
                                                    className="[font-family:'Montserrat',Helvetica] border-[#cbcad7] focus:border-[#478aea] rounded-lg h-11"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Card: Tài liệu pháp lý (Placeholder) */}
                                <Card className="border border-[#cbcad7] rounded-[10px] shadow-none">
                                    <CardHeader className="px-6 sm:px-8 pt-6 pb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center justify-center w-8 h-8 bg-[#3c6efd] rounded-[10px]">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <CardTitle className="[font-family:'Montserrat',Helvetica] font-bold text-black text-lg">
                                                Tài liệu pháp lý
                                            </CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="px-6 sm:px-8 pb-8">
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                                                </svg>
                                            </div>
                                            <h3 className="[font-family:'Montserrat',Helvetica] font-semibold text-gray-500 text-base mb-2">
                                                Tính năng đang phát triển
                                            </h3>
                                            <p className="[font-family:'Montserrat',Helvetica] font-medium text-gray-400 text-sm max-w-md">
                                                Chức năng tải lên tài liệu pháp lý (Giấy phép hoạt động, Quyết định thành lập...) sẽ được cập nhật trong phiên bản tiếp theo.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </main>
                </div>
            </div>

            {/* Homepage-style Footer */}
            <Footer />
        </div>
    );
};
