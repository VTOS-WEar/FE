import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
    AlertCircle,
    BadgeCheck,
    Building2,
    CalendarRange,
    CheckCircle2,
    Globe,
    ImagePlus,
    Mail,
    MapPin,
    Phone,
    Save,
    ShieldCheck,
} from "lucide-react";
import {
    type ProfileStatus,
    type SchoolProfileDto,
    parseContactInfo,
    stringifyContactInfo,
    updateSchoolProfile,
    uploadSchoolLogo,
} from "../../lib/api/schools";
import { ApiError } from "../../lib/api/clients";
import { formatPercent } from "../../lib/utils/format";
import { SCHOOL_THEME } from "../../constants/schoolTheme";

interface ApprovedProfileViewProps {
    profile: SchoolProfileDto;
    status: ProfileStatus;
    onProfileUpdate: () => void;
}

type FieldState = {
    schoolName: string;
    logoURL: string;
    level: string;
    academicYear: string;
    foundedYear: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    description: string;
};

function buildFormState(profile: SchoolProfileDto): FieldState {
    const contact = parseContactInfo(profile.contactInfo);
    return {
        schoolName: profile.schoolName || "",
        logoURL: profile.logoURL || "",
        level: profile.level || "Tiểu học",
        academicYear: contact.academicYear || "2025 - 2026",
        foundedYear: contact.foundedYear || "",
        address: contact.address || "",
        phone: contact.phone || "",
        email: contact.email || "",
        website: contact.website || "",
        description: contact.description || "",
    };
}

function formatDateTime(value: string | null | undefined): string {
    if (!value) return "Chưa có";
    return new Date(value).toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function SummaryCard({
    label,
    value,
    icon,
    surfaceClassName,
    iconClassName,
}: {
    label: string;
    value: string;
    icon: ReactNode;
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

export const ApprovedProfileView = ({
    profile,
    status,
    onProfileUpdate,
}: ApprovedProfileViewProps): JSX.Element => {
    const [form, setForm] = useState<FieldState>(() => buildFormState(profile));
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setForm(buildFormState(profile));
        setPendingLogoFile(null);
        setLogoPreview(null);
    }, [profile]);

    const schoolCode = profile.id?.substring(0, 8).toUpperCase() || "N/A";
    const displayLogo = logoPreview || form.logoURL;

    const completenessItems = useMemo(
        () => [
            { label: "Tên trường", value: form.schoolName, done: Boolean(form.schoolName.trim()), required: true },
            { label: "Logo", value: displayLogo ? "Đã có logo" : "", done: Boolean(displayLogo), required: false },
            { label: "Email liên hệ", value: form.email, done: Boolean(form.email.trim()), required: false },
            { label: "Số điện thoại", value: form.phone, done: Boolean(form.phone.trim()), required: false },
            { label: "Địa chỉ", value: form.address, done: Boolean(form.address.trim()), required: false },
            { label: "Giới thiệu ngắn", value: form.description, done: Boolean(form.description.trim()), required: false },
        ],
        [displayLogo, form.address, form.description, form.email, form.phone, form.schoolName]
    );

    const completedCount = completenessItems.filter((item) => item.done).length;
    const completionPercent = Math.round((completedCount / completenessItems.length) * 100);
    const hasUnsavedChanges = pendingLogoFile !== null;

    const statusLabel = status === "submitted" ? "Hồ sơ đã thiết lập" : "Cần bổ sung thông tin";
    const statusBadgeClass =
        status === "submitted"
            ? "nb-badge nb-badge-green"
            : "nb-badge text-amber-700 bg-amber-50 border border-amber-200";

    const handleFieldChange = (field: keyof FieldState, value: string) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const handleLogoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            setError("Ảnh logo phải nhỏ hơn 2MB.");
            return;
        }

        setError(null);
        setPendingLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
        event.target.value = "";
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            let nextLogoURL = form.logoURL;

            if (pendingLogoFile) {
                const uploaded = await uploadSchoolLogo(pendingLogoFile);
                nextLogoURL = uploaded.logoURL;
            }

            await updateSchoolProfile({
                schoolName: form.schoolName.trim() || undefined,
                level: form.level,
                logoURL: nextLogoURL || undefined,
                contactInfo: stringifyContactInfo({
                    email: form.email,
                    phone: form.phone,
                    address: form.address,
                    academicYear: form.academicYear,
                    foundedYear: form.foundedYear,
                    website: form.website,
                    description: form.description,
                }),
            });

            setForm((current) => ({ ...current, logoURL: nextLogoURL }));
            setPendingLogoFile(null);
            setLogoPreview(null);
            setSuccess("Đã lưu thông tin hồ sơ trường thành công.");
            window.setTimeout(() => setSuccess(null), 4000);
            onProfileUpdate();
        } catch (err) {
            if (err instanceof ApiError) setError(err.message);
            else setError("Không thể cập nhật hồ sơ. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                    <p className="text-sm font-semibold text-slate-500">Thông tin trường học</p>
                    <h1 className="mt-2 text-3xl font-bold tracking-normal text-slate-950">Hồ sơ trường học</h1>
                </div>
                <div className="flex flex-col gap-3 xl:items-end">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className={statusBadgeClass}>{statusLabel}</span>
                        {hasUnsavedChanges ? (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                                Có logo chưa lưu
                            </span>
                        ) : null}
                        <button onClick={handleSave} disabled={saving} className={`${SCHOOL_THEME.primaryButton} disabled:opacity-50`}>
                            <Save className="h-4 w-4" />
                            {saving ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                    </div>
                    <div className="grid w-full gap-2 sm:grid-cols-2 xl:w-auto">
                        <SystemInfoChip label="Khởi tạo hồ sơ" value={formatDateTime(profile.createdAt)} />
                        <SystemInfoChip label="Cập nhật gần nhất" value={formatDateTime(profile.updatedAt || profile.createdAt)} />
                    </div>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    label="Trạng thái hồ sơ"
                    value={statusLabel}
                    icon={<BadgeCheck className="h-6 w-6" />}
                    surfaceClassName={status === "submitted" ? SCHOOL_THEME.summary.mint : SCHOOL_THEME.summary.cyan}
                    iconClassName={status === "submitted" ? "text-emerald-700" : "text-amber-700"}
                />
                <SummaryCard
                    label="Hoàn thiện hồ sơ"
                    value={formatPercent(completionPercent, { maximumFractionDigits: 0 })}
                    icon={<CheckCircle2 className="h-6 w-6" />}
                    surfaceClassName={SCHOOL_THEME.summary.school}
                    iconClassName={SCHOOL_THEME.primaryText}
                />
                <SummaryCard
                    label="Cấp học / Niên khóa"
                    value={`${form.level || "Chưa chọn"} · ${form.academicYear || "Chưa có"}`}
                    icon={<Building2 className="h-6 w-6" />}
                    surfaceClassName={SCHOOL_THEME.summary.slate}
                    iconClassName="text-slate-700"
                />
                <SummaryCard
                    label="Thông tin liên hệ"
                    value={form.phone || form.email || "Chưa cập nhật"}
                    icon={<Phone className="h-6 w-6" />}
                    surfaceClassName={SCHOOL_THEME.summary.cyan}
                    iconClassName="text-cyan-700"
                />
            </section>

            {error ? (
                <div className="rounded-[8px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>
            ) : null}
            {success ? (
                <div className="rounded-[8px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{success}</div>
            ) : null}

            <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-6">
                    <div className="rounded-[8px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                        <div className="flex items-center gap-3">
                            <div className={`flex h-11 w-11 items-center justify-center rounded-full ${SCHOOL_THEME.primarySoftBg} ${SCHOOL_THEME.primaryText}`}>
                                <Building2 className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-500">Thông tin nhận diện</p>
                                <h2 className="mt-1 text-xl font-bold text-gray-900">Cập nhật hồ sơ</h2>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <FieldGroup label="Tên trường">
                                    <input
                                        value={form.schoolName}
                                        onChange={(event) => handleFieldChange("schoolName", event.target.value)}
                                        className="nb-input w-full py-3"
                                        placeholder="Nhập tên trường"
                                    />
                                </FieldGroup>
                            </div>

                            <FieldGroup label="Cấp học">
                                <select
                                    value={form.level}
                                    onChange={(event) => handleFieldChange("level", event.target.value)}
                                    className="nb-select w-full"
                                >
                                    <option value="Tiểu học">Tiểu học</option>
                                    <option value="THCS">THCS</option>
                                    <option value="THPT">THPT</option>
                                </select>
                            </FieldGroup>

                            <FieldGroup label="Niên khóa">
                                <select
                                    value={form.academicYear}
                                    onChange={(event) => handleFieldChange("academicYear", event.target.value)}
                                    className="nb-select w-full"
                                >
                                    <option value="2024 - 2025">2024 - 2025</option>
                                    <option value="2025 - 2026">2025 - 2026</option>
                                    <option value="2026 - 2027">2026 - 2027</option>
                                </select>
                            </FieldGroup>

                            <FieldGroup label="Năm thành lập">
                                <input
                                    value={form.foundedYear}
                                    onChange={(event) => handleFieldChange("foundedYear", event.target.value)}
                                    className="nb-input w-full py-3"
                                    placeholder="VD: 1991"
                                />
                            </FieldGroup>
                        </div>
                    </div>

                    <div className="rounded-[8px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                        <h2 className="text-xl font-bold text-gray-900">Thông tin liên hệ</h2>
                        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                            <FieldGroup label="Email liên hệ">
                                <IconInput
                                    icon={<Mail className="h-4 w-4 text-gray-400" />}
                                    value={form.email}
                                    onChange={(value) => handleFieldChange("email", value)}
                                    placeholder="school@example.com"
                                    type="email"
                                />
                            </FieldGroup>

                            <FieldGroup label="Số điện thoại">
                                <IconInput
                                    icon={<Phone className="h-4 w-4 text-gray-400" />}
                                    value={form.phone}
                                    onChange={(value) => handleFieldChange("phone", value)}
                                    placeholder="0901 234 567"
                                />
                            </FieldGroup>

                            <FieldGroup label="Website">
                                <IconInput
                                    icon={<Globe className="h-4 w-4 text-gray-400" />}
                                    value={form.website}
                                    onChange={(value) => handleFieldChange("website", value)}
                                    placeholder="https://www.truong.edu.vn"
                                />
                            </FieldGroup>

                            <FieldGroup label="Địa chỉ">
                                <IconInput
                                    icon={<MapPin className="h-4 w-4 text-gray-400" />}
                                    value={form.address}
                                    onChange={(value) => handleFieldChange("address", value)}
                                    placeholder="Nhập địa chỉ trường"
                                />
                            </FieldGroup>
                        </div>
                    </div>

                    <div className="rounded-[8px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                        <FieldGroup label="Giới thiệu ngắn">
                            <textarea
                                value={form.description}
                                onChange={(event) => handleFieldChange("description", event.target.value)}
                                rows={3}
                                className="nb-input min-h-[96px] w-full resize-none py-3"
                                placeholder="Mô tả ngắn gọn về định hướng hoặc điểm nhận diện của trường"
                            />
                        </FieldGroup>

                        <div className="mt-5 flex justify-end">
                            <button onClick={handleSave} disabled={saving} className={`${SCHOOL_THEME.primaryButton} disabled:opacity-50`}>
                                <Save className="h-4 w-4" />
                                {saving ? "Đang lưu..." : "Lưu hồ sơ"}
                            </button>
                        </div>
                    </div>
                </div>

                <aside className="space-y-6">
                    <div className="rounded-[8px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className={`group flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-[8px] border-2 border-dashed ${SCHOOL_THEME.primarySoftBorder} bg-white shadow-soft-sm transition-colors hover:border-blue-400`}
                            >
                                {displayLogo ? (
                                    <img src={displayLogo} alt="Logo trường" className="h-full w-full object-cover" />
                                ) : (
                                    <div className={`flex flex-col items-center gap-1 ${SCHOOL_THEME.primaryText}`}>
                                        <ImagePlus className="h-6 w-6" />
                                        <span className="text-xs font-bold">Logo</span>
                                    </div>
                                )}
                            </button>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-500">Logo trường</p>
                                <h2 className="mt-1 text-xl font-bold text-gray-900">{form.schoolName || "Chưa đặt tên trường"}</h2>
                                <p className="mt-1 text-sm font-semibold text-slate-500">Mã trường: {schoolCode}</p>
                            </div>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                            className="hidden"
                            onChange={handleLogoSelect}
                        />

                        <div className="mt-5 flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="nb-btn nb-btn-outline text-sm hover:border-blue-200 hover:text-[#2563EB]"
                            >
                                <ImagePlus className="h-4 w-4" />
                                {displayLogo ? "Đổi logo" : "Tải logo"}
                            </button>
                        </div>
                    </div>

                    <div className="rounded-[8px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-500">Độ tin cậy hồ sơ</p>
                                <h2 className="mt-1 text-xl font-bold text-gray-900">Mức hoàn thiện</h2>
                            </div>
                        </div>

                        <div className="mt-6">
                            <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                                <span>{completedCount}/{completenessItems.length} thông tin đã có</span>
                                <span>{formatPercent(completionPercent, { maximumFractionDigits: 0 })}</span>
                            </div>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-[#2563EB] transition-all" style={{ width: `${completionPercent}%` }} />
                            </div>
                        </div>

                        <div className="mt-6 space-y-3">
                            {completenessItems.map((item) => (
                                <SignalRow key={item.label} title={item.label} value={item.value} completed={item.done} required={item.required} />
                            ))}
                        </div>
                    </div>

                </aside>
            </section>
        </div>
    );
};

function FieldGroup({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div>
            <label className="mb-1.5 block text-sm font-bold text-gray-900">{label}</label>
            {children}
        </div>
    );
}

function IconInput({
    icon,
    value,
    onChange,
    placeholder,
    type = "text",
}: {
    icon: ReactNode;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    type?: string;
}) {
    return (
        <div className="relative">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>
            <input
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="nb-input w-full py-3 pl-10"
            />
        </div>
    );
}

function SignalRow({
    title,
    value,
    completed,
    required,
}: {
    title: string;
    value: string;
    completed: boolean;
    required: boolean;
}) {
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

function SystemInfoChip({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-[8px] border border-gray-200 bg-white px-3 py-2 shadow-soft-xs">
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            <p className="mt-0.5 text-sm font-bold text-slate-950">{value}</p>
        </div>
    );
}
