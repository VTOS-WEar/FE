import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useSidebarConfig } from "../../hooks/useSidebarConfig";
import {
    getSchoolProfile, updateSchoolProfile,
    parseContactInfo, stringifyContactInfo,
    deriveProfileStatus, type ContactInfoData,
    type ProfileStatus, type SchoolProfileDto,
} from "../../lib/api/schools";
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
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [schoolName, setSchoolName] = useState("");

    const loadProfile = useCallback(async () => {
        setLoading(true); setFetchError(null);
        try {
            const data = await getSchoolProfile();
            setProfileData(data);
            setSchoolName(data.schoolName || "");
            setStatus(deriveProfileStatus(data));
            const info = parseContactInfo(data.contactInfo);
            setEmail(info.email || ""); setPhone(info.phone || ""); setAddress(info.address || "");
        } catch (err) {
            setProfileData(null);
            if (err instanceof ApiError) {
                if (err.status === 401) setFetchError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
            } else {
                setFetchError("Không thể tải thông tin hồ sơ trường.");
            }
        } finally { setLoading(false); }
    }, []);
    useEffect(() => { loadProfile(); }, [loadProfile]);

    const handleSubmit = async () => {
        setSaving(true); setError(null); setSuccess(null);
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
            setError(err instanceof ApiError ? err.message : "Không thể cập nhật hồ sơ. Vui lòng thử lại.");
        } finally { setSaving(false); }
    };

    const handleLogout = () => {
        localStorage.removeItem("access_token"); localStorage.removeItem("user"); localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token"); sessionStorage.removeItem("user"); sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    const isApproved = !loading && profileData !== null;
    const fieldClass = "nb-input py-3 text-sm";
    const labelClass = "font-bold text-[#1A1A2E] text-sm mb-2 block";

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} name={profileData?.schoolName || ""} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                    <TopNavBar>
                        <Breadcrumb><BreadcrumbList>
                            <BreadcrumbItem><BreadcrumbLink className="font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                            <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                            <BreadcrumbItem><BreadcrumbPage className="font-bold text-[#1A1A2E] text-base">Hồ sơ Trường học</BreadcrumbPage></BreadcrumbItem>
                        </BreadcrumbList></Breadcrumb>
                    </TopNavBar>

                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6 nb-fade-in">
                        {loading && (
                            <div className="flex items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-[#6938EF] border-t-transparent" />
                            </div>
                        )}

                        {fetchError && (
                            <div className="nb-card-static border-[#EF4444] bg-[#FEE2E2] px-4 py-3 text-sm font-semibold text-[#DC2626]">⚠️ {fetchError}</div>
                        )}

                        {/* ══════ APPROVED VIEW ══════ */}
                        {isApproved && profileData && (
                            <ApprovedProfileView profile={profileData} onProfileUpdate={loadProfile} />
                        )}

                        {/* ══════ DRAFT/PENDING VIEW ══════ */}
                        {!loading && !isApproved && !fetchError && (
                            <>
                                {/* Header + Status */}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div>
                                        <h1 className="font-extrabold text-[#1A1A2E] text-[32px] leading-tight">🏫 Cung cấp thông tin Trường học</h1>
                                        <p className="mt-1 font-medium text-[#4c5769] text-base">Cập nhật thông tin định danh và tài liệu pháp lý của nhà trường.</p>
                                    </div>
                                    <span className={`nb-badge text-base ${status === "submitted" ? "nb-badge-green" : "nb-badge-yellow"}`}>
                                        {status === "submitted" ? "✅ Đã gửi" : "📝 Nháp"}
                                    </span>
                                </div>

                                {/* Status Alert Card */}
                                <div className="nb-card p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div>
                                        <h2 className="font-extrabold text-[#1A1A2E] text-xl">
                                            Hồ sơ hiện tại: {status === "submitted" ? "Đã gửi" : "Nháp"}
                                        </h2>
                                        <p className="mt-2 font-medium text-[#4c5769] text-sm">
                                            Vui lòng hoàn thiện các trường thông tin bắt buộc và tải lên tài liệu pháp lý để Admin xét duyệt.
                                        </p>
                                    </div>
                                    <button onClick={handleSubmit} disabled={saving || loading} className="nb-btn nb-btn-purple text-[15px] px-6 py-3 whitespace-nowrap disabled:opacity-50">
                                        {saving ? "Đang lưu..." : "📨 Gửi hồ sơ ngay"}
                                    </button>
                                </div>

                                {/* Feedback */}
                                {error && <div className="nb-card-static border-[#EF4444] bg-[#FEE2E2] px-4 py-3 text-sm font-semibold text-[#DC2626]">⚠️ {error}</div>}
                                {success && <div className="nb-card-static border-[#10B981] bg-[#D1FAE5] px-4 py-3 text-sm font-semibold text-[#065F46]">✅ {success}</div>}

                                {/* Contact Info Card */}
                                <div className="nb-card p-0">
                                    <div className="px-6 sm:px-8 pt-6 pb-4 border-b-2 border-[#E5E7EB]">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-9 h-9 bg-[#6938EF] rounded-lg border-2 border-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E]">
                                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <h2 className="font-extrabold text-[#1A1A2E] text-lg">Thông tin liên hệ</h2>
                                        </div>
                                    </div>
                                    <div className="px-6 sm:px-8 py-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="md:col-span-2">
                                                <label className={labelClass}>Tên trường <span className="text-[#EF4444]">*</span></label>
                                                <input id="schoolName" value={schoolName} onChange={e => setSchoolName(e.target.value)} placeholder="Nhập tên trường..." className={fieldClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Email</label>
                                                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="school@example.com" className={fieldClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Số điện thoại</label>
                                                <input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0901 234 567" className={fieldClass} />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className={labelClass}>Địa chỉ</label>
                                                <input id="address" value={address} onChange={e => setAddress(e.target.value)} placeholder="Nhập địa chỉ trường..." className={fieldClass} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Legal Documents Card (Placeholder) */}
                                <div className="nb-card p-0">
                                    <div className="px-6 sm:px-8 pt-6 pb-4 border-b-2 border-[#E5E7EB]">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-9 h-9 bg-[#6938EF] rounded-lg border-2 border-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E]">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <h2 className="font-extrabold text-[#1A1A2E] text-lg">Tài liệu pháp lý</h2>
                                        </div>
                                    </div>
                                    <div className="px-6 sm:px-8 py-6">
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <div className="w-16 h-16 bg-[#F3F4F6] rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-[#1A1A2E]">
                                                <svg className="w-8 h-8 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                                                </svg>
                                            </div>
                                            <h3 className="font-bold text-[#6B7280] text-base mb-2">Tính năng đang phát triển</h3>
                                            <p className="font-medium text-[#9CA3AF] text-sm max-w-md">
                                                Chức năng tải lên tài liệu pháp lý (Giấy phép hoạt động, Quyết định thành lập...) sẽ được cập nhật trong phiên bản tiếp theo.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};
