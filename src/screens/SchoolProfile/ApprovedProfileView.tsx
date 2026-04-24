import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, CalendarRange, CheckCircle2, Globe, ImagePlus, Mail, MapPin, Phone, Save, ShieldCheck } from "lucide-react";
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
            { label: "Tên trường", done: Boolean(form.schoolName.trim()) },
            { label: "Logo", done: Boolean(displayLogo) },
            { label: "Email liên hệ", done: Boolean(form.email.trim()) },
            { label: "Số điện thoại", done: Boolean(form.phone.trim()) },
            { label: "Địa chỉ", done: Boolean(form.address.trim()) },
            { label: "Giới thiệu ngắn", done: Boolean(form.description.trim()) },
        ],
        [displayLogo, form.address, form.description, form.email, form.phone, form.schoolName]
    );

    const completedCount = completenessItems.filter((item) => item.done).length;
    const completionPercent = Math.round((completedCount / completenessItems.length) * 100);
    const hasUnsavedChanges = pendingLogoFile !== null;

    const statusTone =
        status === "submitted"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-amber-200 bg-amber-50 text-amber-800";

    const statusLabel = status === "submitted" ? "Hồ sơ đã thiết lập" : "Cần bổ sung thông tin";
    const statusMessage =
        status === "submitted"
            ? "Thông tin nhận diện của trường đã sẵn sàng để tiếp tục rà soát và cập nhật khi cần."
            : "Hoàn thiện thêm các trường còn thiếu để hồ sơ hiển thị đầy đủ và nhất quán hơn.";

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
            <section className="nb-card-static overflow-hidden p-0">
                <div className="bg-[linear-gradient(135deg,#f8f4ff_0%,#eef6ff_55%,#ffffff_100%)] px-6 py-6 lg:px-8 lg:py-7">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                        <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-start">
                            <div className="relative flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="group flex h-24 w-24 items-center justify-center overflow-hidden rounded-[24px] border-2 border-dashed border-violet-200 bg-white shadow-soft-sm transition-colors hover:border-violet-400"
                                >
                                    {displayLogo ? (
                                        <img src={displayLogo} alt="Logo trường" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-1 text-violet-700">
                                            <ImagePlus className="h-6 w-6" />
                                            <span className="text-[11px] font-extrabold uppercase tracking-wide">Logo</span>
                                        </div>
                                    )}
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                    className="hidden"
                                    onChange={handleLogoSelect}
                                />
                            </div>

                            <div className="min-w-0 space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`rounded-full border px-3 py-1 text-xs font-extrabold shadow-soft-sm ${statusTone}`}>
                                        {statusLabel}
                                    </span>
                                    <span className="rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-extrabold text-violet-700 shadow-soft-sm">
                                        {form.level || "Chưa chọn cấp học"}
                                    </span>
                                    {hasUnsavedChanges && (
                                        <span className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-extrabold text-amber-700 shadow-soft-sm">
                                            Có thay đổi chưa lưu
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <h1 className="text-[28px] font-extrabold leading-tight text-gray-900 lg:text-[32px]">
                                        {form.schoolName.trim() || "Hồ sơ trường học"}
                                    </h1>
                                </div>

                                <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-[#5b6475]">
                                    <span className="inline-flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-violet-600" />
                                        Mã trường: {schoolCode}
                                    </span>
                                    <span className="inline-flex items-center gap-2">
                                        <CalendarRange className="h-4 w-4 text-violet-600" />
                                        Cập nhật lần cuối: {formatDateTime(profile.updatedAt || profile.createdAt)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 xl:items-end">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="nb-btn nb-btn-purple min-w-[180px] text-sm disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" />
                                {saving ? "Đang lưu..." : "Lưu thay đổi"}
                            </button>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="nb-btn nb-btn-outline text-sm"
                            >
                                <ImagePlus className="h-4 w-4" />
                                {displayLogo ? "Đổi logo" : "Tải logo"}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/60 bg-white px-6 py-5 lg:px-8">
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr,0.85fr]">
                        <div className={`rounded-[20px] border p-4 shadow-soft-sm ${statusTone}`}>
                            <div className="flex items-start gap-3">
                                <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-extrabold">{statusLabel}</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[20px] border border-gray-200 bg-white p-4 shadow-soft-sm">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-gray-500">Mức độ hoàn thiện</p>
                                    <p className="mt-1 text-2xl font-extrabold text-gray-900">{formatPercent(completionPercent, { maximumFractionDigits: 0 })}</p>
                                </div>
                                <div className="rounded-full bg-violet-50 px-3 py-1 text-xs font-extrabold text-violet-700">
                                    {completedCount}/{completenessItems.length} mục
                                </div>
                            </div>
                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
                                <div className="h-full rounded-full bg-[linear-gradient(90deg,#6938EF_0%,#0EA5E9_100%)]" style={{ width: `${completionPercent}%` }} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {error && (
                <div className="nb-alert nb-alert-error text-sm">
                    <span>⚠️</span>
                    <span>{error}</span>
                </div>
            )}
            {success && (
                <div className="nb-alert nb-alert-success text-sm">
                    <span>✅</span>
                    <span>{success}</span>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr,0.85fr]">
                <section className="space-y-6">
                    <div className="nb-card-static p-0">
                        <div className="border-b border-gray-200 px-6 py-5 lg:px-8">
                            <h2 className="text-lg font-extrabold text-gray-900">Nhận diện trường</h2>
                        </div>
                        <div className="space-y-5 px-6 py-6 lg:px-8">
                            <FieldGroup label="Tên trường">
                                <input
                                    value={form.schoolName}
                                    onChange={(event) => handleFieldChange("schoolName", event.target.value)}
                                    className="nb-input w-full py-3"
                                    placeholder="Nhập tên trường"
                                />
                            </FieldGroup>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

                                <FieldGroup label="Mã trường">
                                    <input value={schoolCode} disabled className="nb-input w-full bg-gray-50 py-3" />
                                </FieldGroup>
                            </div>
                        </div>
                    </div>

                    <div className="nb-card-static p-0">
                        <div className="border-b border-gray-200 px-6 py-5 lg:px-8">
                            <h2 className="text-lg font-extrabold text-gray-900">Thông tin liên hệ công khai</h2>
                        </div>
                        <div className="space-y-5 px-6 py-6 lg:px-8">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                            </div>

                            <FieldGroup label="Địa chỉ">
                                <IconInput
                                    icon={<MapPin className="h-4 w-4 text-gray-400" />}
                                    value={form.address}
                                    onChange={(value) => handleFieldChange("address", value)}
                                    placeholder="Nhập địa chỉ trường"
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
                        </div>
                    </div>

                    <div className="nb-card-static p-0">
                        <div className="border-b border-gray-200 px-6 py-5 lg:px-8">
                            <h2 className="text-lg font-extrabold text-gray-900">Thông tin bổ sung</h2>
                        </div>
                        <div className="space-y-5 px-6 py-6 lg:px-8">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <FieldGroup label="Năm thành lập">
                                    <input
                                        value={form.foundedYear}
                                        onChange={(event) => handleFieldChange("foundedYear", event.target.value)}
                                        className="nb-input w-full py-3"
                                        placeholder="VD: 1991"
                                    />
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
                            </div>

                            <FieldGroup label="Giới thiệu ngắn">
                                <textarea
                                    value={form.description}
                                    onChange={(event) => handleFieldChange("description", event.target.value)}
                                    rows={4}
                                    className="nb-input w-full resize-none py-3"
                                    placeholder="Mô tả ngắn gọn về định hướng hoặc điểm nhận diện của trường"
                                />
                            </FieldGroup>
                        </div>
                    </div>
                </section>

                <aside className="space-y-6">
                    <div className="nb-card-static p-0">
                        <div className="border-b border-gray-200 px-6 py-5">
                            <h2 className="text-lg font-extrabold text-gray-900">Checklist hoàn thiện</h2>
                        </div>
                        <div className="space-y-3 px-6 py-6">
                            {completenessItems.map((item) => (
                                <div
                                    key={item.label}
                                    className={`flex items-center justify-between rounded-[16px] border px-4 py-3 shadow-soft-sm ${
                                        item.done ? "border-emerald-200 bg-emerald-50" : "border-gray-200 bg-white"
                                    }`}
                                >
                                    <span className="text-sm font-semibold text-gray-800">{item.label}</span>
                                    {item.done ? (
                                        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700">
                                            <CheckCircle2 className="h-4 w-4" />
                                            Đã có
                                        </span>
                                    ) : (
                                        <span className="text-xs font-extrabold text-amber-700">Cần bổ sung</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="nb-card-static p-0">
                        <div className="border-b border-gray-200 px-6 py-5">
                            <h2 className="text-lg font-extrabold text-gray-900">Thông tin hệ thống</h2>
                        </div>
                        <div className="space-y-4 px-6 py-6">
                            <InfoRow label="Mã định danh" value={schoolCode} />
                            <InfoRow label="Khởi tạo hồ sơ" value={formatDateTime(profile.createdAt)} />
                            <InfoRow label="Cập nhật gần nhất" value={formatDateTime(profile.updatedAt || profile.createdAt)} />
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

const FieldGroup = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
        <label className="mb-1.5 block text-sm font-bold text-gray-900">{label}</label>
        {children}
    </div>
);

const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div className="rounded-[16px] border border-gray-200 bg-white px-4 py-3 shadow-soft-sm">
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-gray-500">{label}</p>
        <p className="mt-1 text-sm font-bold text-gray-900">{value}</p>
    </div>
);

const IconInput = ({
    icon,
    value,
    onChange,
    placeholder,
    type = "text",
}: {
    icon: React.ReactNode;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    type?: string;
}) => (
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
