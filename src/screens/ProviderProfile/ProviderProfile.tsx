import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
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
import { useProviderSidebarConfig } from "../../hooks/useProviderSidebarConfig";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import {
    getProviderProfile,
    updateProviderProfile,
    type ProviderProfileDto,
} from "../../lib/api/providers";

export const ProviderProfile = (): JSX.Element => {
    const navigate = useNavigate();
    const sidebarConfig = useProviderSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form fields
    const [providerName, setProviderName] = useState("");
    const [contactPersonName, setContactPersonName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [status, setStatus] = useState("");

    const loadProfile = useCallback(async () => {
        setLoading(true);
        try {
            const data: ProviderProfileDto = await getProviderProfile();
            setProviderName(data.providerName || "");
            setContactPersonName(data.contactPersonName || "");
            setPhone(data.phone || "");
            setEmail(data.email || "");
            setAddress(data.address || "");
            setStatus(data.status || "");
        } catch {
            // Not registered yet — show empty form
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const handleSubmit = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            await updateProviderProfile({
                providerName: providerName || undefined,
                contactPersonName: contactPersonName || undefined,
                phone: phone || undefined,
                email: email || undefined,
                address: address || undefined,
            });
            setSuccess("Đã cập nhật hồ sơ thành công!");
            setTimeout(() => setSuccess(null), 4000);
        } catch (err: any) {
            setError(err?.message || "Không thể cập nhật hồ sơ. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

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
        <div className="bg-[#f6f7f8] w-full min-h-screen flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                {/* Sidebar */}
                <div
                    className={`${isCollapsed ? "lg:w-16" : "lg:w-[20rem] xl:w-[23.75rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}
                >
                    <DashboardSidebar
                        {...sidebarConfig}
                        name={providerName}
                        isCollapsed={isCollapsed}
                        onToggle={toggle}
                        onLogout={handleLogout}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Breadcrumb */}
                    <div className="bg-white border-b border-[#cbcad7] px-4 sm:px-6 lg:px-10 py-5">
                        <Breadcrumb>
                            <BreadcrumbList className="gap-2.5">
                                <BreadcrumbItem>
                                    <BreadcrumbLink
                                        href="/provider/dashboard"
                                        className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4c5769] text-base"
                                    >
                                        Trang chủ
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="[font-family:'Montserrat',Helvetica] font-semibold text-[#cbcad7] text-base">
                                    /
                                </BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4c5769] text-base">
                                        Hồ sơ Nhà Cung Cấp
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>

                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6">
                        {/* Loading */}
                        {loading && (
                            <div className="flex items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#F59E0B] border-t-transparent" />
                            </div>
                        )}

                        {/* Header */}
                        {!loading && (
                            <>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div>
                                        <h1 className="[font-family:'Montserrat',Helvetica] font-bold text-black text-[28px] lg:text-[32px] leading-[1.22]">
                                            Hồ sơ Nhà Cung Cấp
                                        </h1>
                                        <p className="mt-1 [font-family:'Montserrat',Helvetica] font-medium text-[#4c5769] text-sm lg:text-base">
                                            Cập nhật thông tin của nhà cung cấp.
                                        </p>
                                    </div>
                                    {status && (
                                        <span
                                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-semibold [font-family:'Montserrat',Helvetica] whitespace-nowrap ${
                                                status === "Approved"
                                                    ? "bg-green-100 text-green-700"
                                                    : status === "Pending"
                                                    ? "bg-yellow-100 text-yellow-700"
                                                    : "bg-gray-100 text-gray-700"
                                            }`}
                                        >
                                            <span
                                                className={`w-2.5 h-2.5 rounded-full ${
                                                    status === "Approved"
                                                        ? "bg-green-500"
                                                        : status === "Pending"
                                                        ? "bg-yellow-500"
                                                        : "bg-gray-400"
                                                }`}
                                            />
                                            {status === "Approved" ? "Đã duyệt" : status === "Pending" ? "Chờ duyệt" : status}
                                        </span>
                                    )}
                                </div>

                                {/* Feedback */}
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

                                {/* Form */}
                                <Card className="border border-[#cbcad7] rounded-[10px] shadow-none">
                                    <CardHeader className="px-6 sm:px-8 pt-6 pb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center justify-center w-8 h-8 bg-[#F59E0B] rounded-[10px]">
                                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </div>
                                            <CardTitle className="[font-family:'Montserrat',Helvetica] font-bold text-black text-lg">
                                                Thông tin nhà cung cấp
                                            </CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="px-6 sm:px-8 pb-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="md:col-span-2">
                                                <Label className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4c5769] text-sm mb-2 block">
                                                    Tên nhà cung cấp
                                                </Label>
                                                <Input
                                                    value={providerName}
                                                    onChange={(e) => setProviderName(e.target.value)}
                                                    placeholder="Nhập tên nhà cung cấp..."
                                                    className="[font-family:'Montserrat',Helvetica] border-[#cbcad7] focus:border-[#F59E0B] rounded-lg h-11"
                                                />
                                            </div>
                                            <div>
                                                <Label className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4c5769] text-sm mb-2 block">
                                                    Người liên hệ
                                                </Label>
                                                <Input
                                                    value={contactPersonName}
                                                    onChange={(e) => setContactPersonName(e.target.value)}
                                                    placeholder="Nhập tên người liên hệ..."
                                                    className="[font-family:'Montserrat',Helvetica] border-[#cbcad7] focus:border-[#F59E0B] rounded-lg h-11"
                                                />
                                            </div>
                                            <div>
                                                <Label className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4c5769] text-sm mb-2 block">
                                                    Email
                                                </Label>
                                                <Input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="email@example.com"
                                                    className="[font-family:'Montserrat',Helvetica] border-[#cbcad7] focus:border-[#F59E0B] rounded-lg h-11"
                                                />
                                            </div>
                                            <div>
                                                <Label className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4c5769] text-sm mb-2 block">
                                                    Số điện thoại
                                                </Label>
                                                <Input
                                                    type="tel"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    placeholder="0901 234 567"
                                                    className="[font-family:'Montserrat',Helvetica] border-[#cbcad7] focus:border-[#F59E0B] rounded-lg h-11"
                                                />
                                            </div>
                                            <div>
                                                <Label className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4c5769] text-sm mb-2 block">
                                                    Địa chỉ
                                                </Label>
                                                <Input
                                                    value={address}
                                                    onChange={(e) => setAddress(e.target.value)}
                                                    placeholder="Nhập địa chỉ..."
                                                    className="[font-family:'Montserrat',Helvetica] border-[#cbcad7] focus:border-[#F59E0B] rounded-lg h-11"
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-6 flex justify-end">
                                            <Button
                                                onClick={handleSubmit}
                                                disabled={saving}
                                                className="bg-[#F59E0B] hover:bg-[#D97706] text-white [font-family:'Montserrat',Helvetica] font-semibold text-[15px] rounded-[10px] px-8 py-3 h-auto shadow-[0px_4px_4px_rgba(245,158,11,0.25)]"
                                            >
                                                {saving ? "Đang lưu..." : "💾 Lưu hồ sơ"}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default ProviderProfile;
