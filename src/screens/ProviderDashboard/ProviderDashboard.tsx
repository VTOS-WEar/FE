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
import { getProviderProfile, type ProviderProfileDto } from "../../lib/api/providers";

/* ── Stats Card ── */
function StatsCard({
    icon,
    iconBg,
    label,
    value,
    subtext,
}: {
    icon: React.ReactNode;
    iconBg: string;
    label: string;
    value: string;
    subtext?: string;
}) {
    return (
        <div className="bg-white border border-[#CBCAD7] rounded-[16px] p-5 flex-1 min-w-[180px] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-shadow duration-200">
            <div className="flex items-start justify-between mb-3">
                <p className="[font-family:'Montserrat',Helvetica] font-semibold text-[#6B7280] text-sm">{label}</p>
                <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center ${iconBg}`}>
                    {icon}
                </div>
            </div>
            <p className="[font-family:'Montserrat',Helvetica] font-bold text-[#1A1A2E] text-[28px] leading-tight mb-1">
                {value}
            </p>
            {subtext && (
                <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#6B7280] text-xs mt-1">
                    {subtext}
                </p>
            )}
        </div>
    );
}

/* ── Quick Action Card ── */
function QuickActionCard({
    emoji,
    title,
    description,
    href,
    color,
}: {
    emoji: string;
    title: string;
    description: string;
    href?: string;
    color: string;
}) {
    const navigate = useNavigate();
    return (
        <button
            onClick={() => href && navigate(href)}
            className={`bg-white border border-[#CBCAD7] rounded-[16px] p-5 text-left hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all duration-200 hover:-translate-y-0.5 group ${!href ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={!href}
        >
            <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center text-xl mb-3 ${color}`}>
                {emoji}
            </div>
            <h3 className="[font-family:'Montserrat',Helvetica] font-bold text-[#1A1A2E] text-base mb-1">
                {title}
            </h3>
            <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#6B7280] text-sm leading-relaxed">
                {description}
            </p>
        </button>
    );
}

/* ── Main Page ── */
export const ProviderDashboard = (): JSX.Element => {
    const navigate = useNavigate();
    const sidebarConfig = useProviderSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [providerName, setProviderName] = useState("");
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<ProviderProfileDto | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getProviderProfile();
            setProfile(data);
            setProviderName(data.providerName || "");
            if (data.providerName) localStorage.setItem("vtos_org_name", data.providerName);
        } catch {
            // Profile API might fail if not set up yet
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleLogout = () => {
        localStorage.removeItem("access_token"); localStorage.removeItem("user"); localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token"); sessionStorage.removeItem("user"); sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    return (
        <div className="bg-[#f6f7f8] w-full min-h-screen flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                {/* Sidebar */}
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[20rem] xl:w-[23.75rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} name={providerName} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                    {/* Breadcrumb */}
                    <div className="bg-white border-b border-[#cbcad7] px-6 lg:px-10 py-5 flex items-center justify-between">
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem><BreadcrumbLink href="/provider/dashboard" className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                                <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                                <BreadcrumbItem><BreadcrumbPage className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4c5769] text-base">Tổng quan</BreadcrumbPage></BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                        <div className="flex items-center gap-3">
                            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f0f0f5] transition-colors relative">
                                <svg className="w-6 h-6 text-[#4c5769]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 002 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.93 6 11v5l-2 2v1h16v-1l-2-2z" /></svg>
                            </button>
                            <div className="w-9 h-9 rounded-full bg-[#F59E0B] flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity">
                                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6">
                        {/* Greeting */}
                        <div>
                            <h1 className="[font-family:'Montserrat',Helvetica] font-bold text-black text-[28px] lg:text-[32px] leading-[1.22]">
                                Xin chào, {providerName || "Nhà cung cấp"}
                            </h1>
                            <p className="mt-1 [font-family:'Montserrat',Helvetica] font-medium text-[#4c5769] text-sm lg:text-base">
                                Dưới đây là tổng quan hoạt động sản xuất của bạn.
                            </p>
                        </div>

                        {/* Stats Cards */}
                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="bg-white rounded-[16px] p-5 animate-pulse border border-[#CBCAD7]">
                                        <div className="flex justify-between mb-3">
                                            <div className="h-4 bg-gray-200 rounded w-24" />
                                            <div className="w-10 h-10 bg-gray-200 rounded-[10px]" />
                                        </div>
                                        <div className="h-8 bg-gray-200 rounded w-20 mb-2" />
                                        <div className="h-3 bg-gray-200 rounded w-32" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                                <StatsCard
                                    label="Hợp đồng"
                                    value="0"
                                    subtext="Chưa có hợp đồng"
                                    icon={<svg className="w-5 h-5 text-[#F59E0B]" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z" /></svg>}
                                    iconBg="bg-[#FEF3C7]"
                                />
                                <StatsCard
                                    label="Đơn sản xuất"
                                    value="0"
                                    subtext="Chưa có đơn mới"
                                    icon={<svg className="w-5 h-5 text-[#3B82F6]" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l4.59-4.58L18 11l-6 6z" /></svg>}
                                    iconBg="bg-[#DBEAFE]"
                                />
                                <StatsCard
                                    label="Đang sản xuất"
                                    value="0"
                                    subtext="Không có đơn đang xử lý"
                                    icon={<svg className="w-5 h-5 text-[#10B981]" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" /></svg>}
                                    iconBg="bg-[#D1FAE5]"
                                />
                                <StatsCard
                                    label="Khiếu nại"
                                    value="0"
                                    subtext="Không có khiếu nại"
                                    icon={<svg className="w-5 h-5 text-[#EF4444]" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" /></svg>}
                                    iconBg="bg-[#FEE2E2]"
                                />
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div>
                            <h2 className="[font-family:'Montserrat',Helvetica] font-bold text-[#1A1A2E] text-xl mb-4">
                                Thao tác nhanh
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <QuickActionCard
                                    emoji="📋"
                                    title="Hợp đồng"
                                    description="Xem và duyệt hợp đồng từ trường"
                                    href="/provider/contracts"
                                    color="bg-[#FEF3C7]"
                                />
                                <QuickActionCard
                                    emoji="🏭"
                                    title="Đơn sản xuất"
                                    description="Quản lý các đơn sản xuất đồng phục"
                                    href="/provider/production-orders"
                                    color="bg-[#DBEAFE]"
                                />
                                <QuickActionCard
                                    emoji="📦"
                                    title="Giao hàng"
                                    description="Xác nhận giao hàng cho trường"
                                    color="bg-[#D1FAE5]"
                                />
                                <QuickActionCard
                                    emoji="👤"
                                    title="Hồ sơ"
                                    description="Cập nhật thông tin nhà cung cấp"
                                    href="/provider/profile"
                                    color="bg-[#EDE9FE]"
                                />
                            </div>
                        </div>

                        {/* Profile Summary Card */}
                        {profile && (
                            <div className="bg-white border border-[#CBCAD7] rounded-[16px] p-6">
                                <h2 className="[font-family:'Montserrat',Helvetica] font-bold text-[#1A1A2E] text-lg mb-4">
                                    Thông tin nhà cung cấp
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {[
                                        { label: "Tên", value: profile.providerName },
                                        { label: "Email", value: profile.email || "Chưa cập nhật" },
                                        { label: "Điện thoại", value: profile.phone || "Chưa cập nhật" },
                                        { label: "Người liên hệ", value: profile.contactPersonName || "Chưa cập nhật" },
                                        { label: "Địa chỉ", value: profile.address || "Chưa cập nhật" },
                                        { label: "Trạng thái", value: profile.status },
                                    ].map((item) => (
                                        <div key={item.label}>
                                            <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#6B7280] text-xs uppercase tracking-wider mb-1">
                                                {item.label}
                                            </p>
                                            <p className="[font-family:'Montserrat',Helvetica] font-semibold text-[#1A1A2E] text-sm">
                                                {item.value}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default ProviderDashboard;
