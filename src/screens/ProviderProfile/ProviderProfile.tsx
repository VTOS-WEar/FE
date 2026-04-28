import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    AlertCircle,
    BadgeCheck,
    Building2,
    CheckCircle2,
    Loader2,
    MapPin,
    Phone,
    UserSquare2,
} from "lucide-react";
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
import { useProviderSidebarConfig } from "../../hooks/useProviderSidebarConfig";
import {
    getProviderProfile,
    updateProviderProfile,
    type ProviderProfileDto,
} from "../../lib/api/providers";
import { formatPercent } from "../../lib/utils/format";

const statusConfig: Record<string, { label: string; badge: string; tone: string }> = {
    Approved: { label: "Đã duyệt", badge: "nb-badge nb-badge-green", tone: "text-emerald-700" },
    Pending: { label: "Chờ duyệt", badge: "nb-badge nb-badge-yellow", tone: "text-amber-700" },
};

function SummaryCard({
    label,
    value,
    icon,
    surfaceClassName,
    iconClassName,
}: {
    label: string;
    value: string;
    icon: React.ReactNode;
    surfaceClassName: string;
    iconClassName: string;
}) {
    return (
        <div className={`min-h-[112px] rounded-[8px] border border-white/70 p-5 shadow-soft-sm ${surfaceClassName}`}>
            <div className="flex h-full items-center gap-4">
                <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-white shadow-soft-xs ${iconClassName}`}>
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700">{label}</p>
                    <p className="mt-2 truncate text-2xl font-bold leading-tight text-slate-950">{value}</p>
                </div>
            </div>
        </div>
    );
}

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
            setSuccess("Đã cập nhật hồ sơ thành công.");
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

    const profileSignals = useMemo(
        () => [
            { title: "Tên doanh nghiệp", value: providerName, required: true },
            { title: "Người liên hệ", value: contactPersonName, required: false },
            { title: "Điện thoại", value: phone, required: false },
            { title: "Email", value: email, required: false },
            { title: "Địa chỉ", value: address, required: false },
        ],
        [address, contactPersonName, email, phone, providerName],
    );
    const completedSignals = profileSignals.filter((signal) => signal.value.trim()).length;
    const completeness = Math.round((completedSignals / profileSignals.length) * 100);
    const sc = statusConfig[status];

    const fieldClass = "nb-input w-full py-3 text-sm";
    const labelClass = "mb-2 block text-sm font-bold text-gray-900";

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} name={providerName} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                    <TopNavBar>
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/provider/dashboard" className="text-base font-semibold text-[#4c5769]">
                                        Trang chủ
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="text-base font-bold text-gray-900">Hồ sơ nhà cung cấp</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </TopNavBar>

                    <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
                            </div>
                        ) : (
                            <>
                                <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-500">Thông tin doanh nghiệp</p>
                                        <h1 className="mt-2 text-3xl font-bold tracking-normal text-slate-950">Hồ sơ nhà cung cấp</h1>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className={sc?.badge || "nb-badge bg-slate-100 text-slate-700"}>{sc?.label || "Chưa rõ"}</span>
                                        <button onClick={handleSubmit} disabled={saving} className="nb-btn nb-btn-purple px-6 py-3 text-sm disabled:opacity-50">
                                            {saving ? "Đang lưu..." : "Lưu thay đổi"}
                                        </button>
                                    </div>
                                </section>

                                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                    <SummaryCard
                                        label="Trạng thái xét duyệt"
                                        value={sc?.label || "Chưa rõ"}
                                        icon={<BadgeCheck className="h-6 w-6" />}
                                        surfaceClassName="bg-emerald-50"
                                        iconClassName={sc?.tone || "text-slate-700"}
                                    />
                                    <SummaryCard
                                        label="Hoàn thiện hồ sơ"
                                        value={formatPercent(completeness, { maximumFractionDigits: 0 })}
                                        icon={<CheckCircle2 className="h-6 w-6" />}
                                        surfaceClassName="bg-violet-50"
                                        iconClassName="text-violet-600"
                                    />
                                    <SummaryCard
                                        label="Người liên hệ"
                                        value={contactPersonName || "Chưa cập nhật"}
                                        icon={<UserSquare2 className="h-6 w-6" />}
                                        surfaceClassName="bg-sky-50"
                                        iconClassName="text-sky-600"
                                    />
                                    <SummaryCard
                                        label="Thông tin liên lạc"
                                        value={phone || email || "Chưa cập nhật"}
                                        icon={<Phone className="h-6 w-6" />}
                                        surfaceClassName="bg-amber-50"
                                        iconClassName="text-amber-600"
                                    />
                                </section>

                                {error ? (
                                    <div className="rounded-[8px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>
                                ) : null}
                                {success ? (
                                    <div className="rounded-[8px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{success}</div>
                                ) : null}

                                <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                                    <div className="rounded-[8px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                                                <Building2 className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-500">Thông tin doanh nghiệp</p>
                                                <h2 className="mt-1 text-xl font-bold text-gray-900">Cập nhật hồ sơ</h2>
                                            </div>
                                        </div>

                                        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                                            <div className="md:col-span-2">
                                                <label className={labelClass}>
                                                    Tên nhà cung cấp <span className="text-red-500">*</span>
                                                </label>
                                                <input value={providerName} onChange={(event) => setProviderName(event.target.value)} className={fieldClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Người liên hệ</label>
                                                <input value={contactPersonName} onChange={(event) => setContactPersonName(event.target.value)} className={fieldClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Email</label>
                                                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={fieldClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Số điện thoại</label>
                                                <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className={fieldClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Địa chỉ</label>
                                                <input value={address} onChange={(event) => setAddress(event.target.value)} className={fieldClass} />
                                            </div>
                                        </div>

                                        <div className="mt-6 flex justify-end">
                                            <button onClick={handleSubmit} disabled={saving} className="nb-btn nb-btn-purple px-8 py-3 text-[15px] disabled:opacity-50">
                                                {saving ? "Đang lưu..." : "Lưu hồ sơ"}
                                            </button>
                                        </div>
                                    </div>

                                    <aside className="space-y-6">
                                        <div className="rounded-[8px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                                    <MapPin className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-500">Độ tin cậy hồ sơ</p>
                                                    <h2 className="mt-1 text-xl font-bold text-gray-900">Sẵn sàng vận hành</h2>
                                                </div>
                                            </div>

                                            <div className="mt-6">
                                                <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                                                    <span>{completedSignals}/{profileSignals.length} thông tin đã có</span>
                                                    <span>{formatPercent(completeness, { maximumFractionDigits: 0 })}</span>
                                                </div>
                                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                                                    <div className="h-full rounded-full bg-violet-600 transition-all" style={{ width: `${completeness}%` }} />
                                                </div>
                                            </div>

                                            <div className="mt-6 space-y-3">
                                                {profileSignals.map((signal) => (
                                                    <SignalRow key={signal.title} title={signal.title} value={signal.value} required={signal.required} />
                                                ))}
                                            </div>
                                        </div>

                                        <div className="rounded-[8px] border border-slate-200 bg-slate-50 p-5">
                                            <p className="text-sm font-bold text-slate-900">Gợi ý ưu tiên</p>
                                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                                Hoàn thiện tên doanh nghiệp, người liên hệ và số điện thoại giúp trường học xử lý hợp đồng, đơn hàng và đối soát nhanh hơn.
                                            </p>
                                        </div>
                                    </aside>
                                </section>
                            </>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

function SignalRow({ title, value, required }: { title: string; value: string; required: boolean }) {
    const completed = Boolean(value.trim());

    return (
        <div className="flex items-center justify-between gap-4 rounded-[8px] border border-gray-200 bg-slate-50 p-4">
            <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900">{title}</p>
                <p className="mt-1 truncate text-sm text-gray-500">{completed ? value : required ? "Thông tin bắt buộc" : "Chưa cập nhật"}</p>
            </div>
            <div
                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
                    completed ? "bg-emerald-50 text-emerald-600" : required ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                }`}
            >
                {completed ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            </div>
        </div>
    );
}

export default ProviderProfile;
