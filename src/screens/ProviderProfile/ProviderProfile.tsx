import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    BadgeCheck,
    Building2,
    Loader2,
    Mail,
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

const statusConfig: Record<string, { label: string; badge: string; tone: string }> = {
    Approved: { label: "Đã duyệt", badge: "nb-badge nb-badge-green", tone: "bg-emerald-50 text-emerald-700" },
    Pending: { label: "Chờ duyệt", badge: "nb-badge nb-badge-yellow", tone: "bg-amber-50 text-amber-700" },
};

function SummaryCard({
    label,
    value,
    note,
    icon,
    tone,
}: {
    label: string;
    value: string;
    note: string;
    icon: React.ReactNode;
    tone: string;
}) {
    return (
        <div className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-soft-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">{label}</p>
                    <p className="mt-2 text-xl font-black text-gray-900">{value}</p>
                    <p className="mt-2 text-sm font-semibold text-gray-500">{note}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}>{icon}</div>
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

    const sc = statusConfig[status];
    const completeness = useMemo(() => {
        const fields = [providerName, contactPersonName, phone, email, address];
        const completed = fields.filter((field) => field.trim()).length;
        return Math.round((completed / fields.length) * 100);
    }, [providerName, contactPersonName, phone, email, address]);

    const fieldClass = "nb-input w-full py-3 text-sm";
    const labelClass = "mb-2 block text-sm font-bold text-gray-900";

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} name={providerName} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                    <TopNavBar>
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/provider/dashboard" className="font-semibold text-[#4c5769] text-base">
                                        Trang chủ
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="font-bold text-gray-900 text-base">Hồ sơ nhà cung cấp</BreadcrumbPage>
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
                                <section className="overflow-hidden rounded-[32px] border border-slate-900/70 bg-slate-950 bg-gradient-to-br from-slate-950 via-slate-800 to-violet-900 px-6 py-7 text-white shadow-soft-lg lg:px-8">
                                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                                        <div className="max-w-3xl">
                                            <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white">
                                                Business identity
                                            </span>
                                            <h1 className="mt-4 text-3xl font-black leading-tight text-white sm:text-4xl">
                                                {providerName || "Nhà cung cấp"} đang ở mức hoàn thiện hồ sơ {completeness}%.
                                            </h1>
                                            <p className="mt-3 text-sm font-medium leading-7 text-slate-100 sm:text-base">
                                                Hồ sơ này là lớp tin cậy vận hành của doanh nghiệp: tên đơn vị, người liên hệ, thông tin liên lạc, và địa chỉ cần rõ để việc ký hợp đồng, nhận thông báo, và xử lý đối soát không bị tắc.
                                            </p>
                                        </div>
                                        <div className="grid gap-3 sm:grid-cols-3 lg:w-[430px]">
                                            <div className="rounded-[22px] border border-white/10 bg-white/8 p-4">
                                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">Trạng thái</p>
                                                <p className="mt-2 text-2xl font-black text-white">{sc?.label || "Chưa rõ"}</p>
                                            </div>
                                            <div className="rounded-[22px] border border-white/10 bg-white/8 p-4">
                                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">Hoàn thiện</p>
                                                <p className="mt-2 text-2xl font-black text-white">{completeness}%</p>
                                            </div>
                                            <div className="rounded-[22px] border border-white/10 bg-white/8 p-4">
                                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">Liên hệ</p>
                                                <p className="mt-2 text-2xl font-black text-white">{contactPersonName ? "Đủ" : "Thiếu"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                    <SummaryCard
                                        label="Trạng thái xét duyệt"
                                        value={sc?.label || "Chưa rõ"}
                                        note="Cho biết hồ sơ doanh nghiệp đã được duyệt hay còn cần rà soát."
                                        icon={<BadgeCheck className="h-5 w-5" />}
                                        tone={sc?.tone || "bg-slate-100 text-slate-700"}
                                    />
                                    <SummaryCard
                                        label="Người liên hệ"
                                        value={contactPersonName || "Chưa cập nhật"}
                                        note="Đầu mối để trường và hệ thống liên hệ khi cần xác minh."
                                        icon={<UserSquare2 className="h-5 w-5" />}
                                        tone="bg-blue-50 text-blue-600"
                                    />
                                    <SummaryCard
                                        label="Điện thoại"
                                        value={phone || "Chưa cập nhật"}
                                        note="Dùng cho các trao đổi vận hành cần xử lý nhanh."
                                        icon={<Phone className="h-5 w-5" />}
                                        tone="bg-emerald-50 text-emerald-600"
                                    />
                                    <SummaryCard
                                        label="Email"
                                        value={email || "Chưa cập nhật"}
                                        note="Nơi nhận thông báo, xác nhận, và thông tin hợp đồng."
                                        icon={<Mail className="h-5 w-5" />}
                                        tone="bg-violet-50 text-violet-600"
                                    />
                                </section>

                                {error ? (
                                    <div className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>
                                ) : null}
                                {success ? (
                                    <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{success}</div>
                                ) : null}

                                <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                                    <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                                                <Building2 className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Thông tin doanh nghiệp</p>
                                                <h2 className="mt-1 text-2xl font-black text-gray-900">Cập nhật hồ sơ nhà cung cấp</h2>
                                            </div>
                                        </div>

                                        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                                            <div className="md:col-span-2">
                                                <label className={labelClass}>Tên nhà cung cấp <span className="text-red-500">*</span></label>
                                                <input value={providerName} onChange={(event) => setProviderName(event.target.value)} placeholder="Nhập tên nhà cung cấp..." className={fieldClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Người liên hệ</label>
                                                <input value={contactPersonName} onChange={(event) => setContactPersonName(event.target.value)} placeholder="Nhập tên người liên hệ..." className={fieldClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Email</label>
                                                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@example.com" className={fieldClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Số điện thoại</label>
                                                <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="0901 234 567" className={fieldClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Địa chỉ</label>
                                                <input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Nhập địa chỉ..." className={fieldClass} />
                                            </div>
                                        </div>

                                        <div className="mt-6 flex justify-end">
                                            <button onClick={handleSubmit} disabled={saving} className="nb-btn nb-btn-purple px-8 py-3 text-[15px] disabled:opacity-50">
                                                {saving ? "Đang lưu..." : "Lưu hồ sơ"}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                                <MapPin className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Tín hiệu độ tin cậy</p>
                                                <h2 className="mt-1 text-2xl font-black text-gray-900">Những gì hồ sơ này đang nói</h2>
                                            </div>
                                        </div>

                                        <div className="mt-6 space-y-4">
                                            <SignalRow title="Tên doanh nghiệp" value={providerName} />
                                            <SignalRow title="Người liên hệ" value={contactPersonName} />
                                            <SignalRow title="Điện thoại" value={phone} />
                                            <SignalRow title="Email" value={email} />
                                            <SignalRow title="Địa chỉ" value={address} />
                                        </div>

                                        <div className={`mt-5 rounded-[20px] border px-4 py-4 text-sm font-semibold ${completeness === 100 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                                            {completeness === 100
                                                ? "Hồ sơ đã đủ các trường chính. Tiếp tục duy trì chính xác để tránh gián đoạn khi vận hành."
                                                : "Hồ sơ vẫn còn thiếu thông tin. Hoàn thiện trước để các luồng hợp đồng và thông báo không bị chậm."}
                                        </div>
                                    </div>
                                </section>
                            </>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

function SignalRow({ title, value }: { title: string; value: string }) {
    return (
        <div className="rounded-[18px] border border-gray-200 bg-slate-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">{title}</p>
            <p className="mt-2 text-sm font-black text-gray-900">{value || "Chưa cập nhật"}</p>
        </div>
    );
}

export default ProviderProfile;
