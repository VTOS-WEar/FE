import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useProviderSidebarConfig } from "../../hooks/useProviderSidebarConfig";
import {
    getProviderProfile, updateProviderProfile, type ProviderProfileDto,
} from "../../lib/api/providers";

const statusConfig: Record<string, { label: string; cls: string }> = {
    Approved: { label: "Đã duyệt", cls: "nb-badge nb-badge-green" },
    Pending: { label: "Chờ duyệt", cls: "nb-badge nb-badge-yellow" },
};

export const ProviderProfile = (): JSX.Element => {
    const navigate = useNavigate();
    const sidebarConfig = useProviderSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

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
        } catch { /* empty form */ }
        finally { setLoading(false); }
    }, []);
    useEffect(() => { loadProfile(); }, [loadProfile]);

    const handleSubmit = async () => {
        setSaving(true); setError(null); setSuccess(null);
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
        } finally { setSaving(false); }
    };

    const handleLogout = () => {
        localStorage.removeItem("access_token"); localStorage.removeItem("user"); localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token"); sessionStorage.removeItem("user"); sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    const fieldClass = "nb-input w-full py-3 text-sm";
    const labelClass = "font-bold text-gray-900 text-sm mb-2 block";
    const sc = statusConfig[status];

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} name={providerName} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                    <TopNavBar>
                        <Breadcrumb><BreadcrumbList>
                            <BreadcrumbItem><BreadcrumbLink href="/provider/dashboard" className="font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                            <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                            <BreadcrumbItem><BreadcrumbPage className="font-bold text-gray-900 text-base">Hồ sơ Nhà Cung Cấp</BreadcrumbPage></BreadcrumbItem>
                        </BreadcrumbList></Breadcrumb>
                    </TopNavBar>

                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6 nb-fade-in">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#6938EF] border-t-transparent" />
                            </div>
                        ) : (
                            <>
                                {/* Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div>
                                        <h1 className="font-extrabold text-gray-900 text-[28px] lg:text-[32px] leading-tight">🏢 Hồ sơ Nhà Cung Cấp</h1>
                                        <p className="mt-1 font-medium text-[#4c5769] text-sm lg:text-base">Cập nhật thông tin của nhà cung cấp.</p>
                                    </div>
                                    {sc && <span className={sc.cls}>{sc.label}</span>}
                                </div>

                                {/* Feedback */}
                                {error && (
                                    <div className="nb-card-static border-[#EF4444] bg-[#FEE2E2] px-4 py-3 text-sm font-semibold text-[#DC2626]">⚠️ {error}</div>
                                )}
                                {success && (
                                    <div className="nb-card-static border-[#10B981] bg-[#D1FAE5] px-4 py-3 text-sm font-semibold text-emerald-800">✅ {success}</div>
                                )}

                                {/* Form Card */}
                                <div className="nb-card p-0">
                                    <div className="px-6 sm:px-8 pt-6 pb-4 border-b-2 border-gray-200">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-9 h-9 bg-[#6938EF] rounded-lg border border-gray-200 shadow-sm">
                                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <h2 className="font-extrabold text-gray-900 text-lg">Thông tin nhà cung cấp</h2>
                                        </div>
                                    </div>

                                    <div className="px-6 sm:px-8 py-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="md:col-span-2">
                                                <label className={labelClass}>Tên nhà cung cấp <span className="text-red-500">*</span></label>
                                                <input value={providerName} onChange={e => setProviderName(e.target.value)} placeholder="Nhập tên nhà cung cấp..." className={fieldClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Người liên hệ</label>
                                                <input value={contactPersonName} onChange={e => setContactPersonName(e.target.value)} placeholder="Nhập tên người liên hệ..." className={fieldClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Email</label>
                                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" className={fieldClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Số điện thoại</label>
                                                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0901 234 567" className={fieldClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Địa chỉ</label>
                                                <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Nhập địa chỉ..." className={fieldClass} />
                                            </div>
                                        </div>

                                        <div className="mt-6 flex justify-end">
                                            <button onClick={handleSubmit} disabled={saving} className="nb-btn nb-btn-purple text-[15px] px-8 py-3 disabled:opacity-50">
                                                {saving ? "Đang lưu..." : "💾 Lưu hồ sơ"}
                                            </button>
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

export default ProviderProfile;
