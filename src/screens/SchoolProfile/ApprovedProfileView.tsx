import { useState, useRef } from "react";
import { Eye, Save, MapPin, Phone, Mail, Globe, FileText, Upload } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import {
    type SchoolProfileDto,
    parseContactInfo,
    stringifyContactInfo,
    updateSchoolProfile,
    uploadSchoolLogo,
} from "../../lib/api/schools";
import { ApiError } from "../../lib/api/clients";

interface ApprovedProfileViewProps {
    profile: SchoolProfileDto;
    onProfileUpdate: () => void; // callback to re-fetch after save
}

export const ApprovedProfileView = ({
    profile,
    onProfileUpdate,
}: ApprovedProfileViewProps): JSX.Element => {
    const contact = parseContactInfo(profile.contactInfo);

    // ── Editable fields ──
    const [schoolName, setSchoolName] = useState(profile.schoolName || "");
    const [logoURL, setLogoURL] = useState(profile.logoURL || "");
    const [logoPreview, setLogoPreview] = useState<string | null>(null); // local preview
    const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
    const [level, setLevel] = useState(profile.level || "Tiểu học");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [academicYear, setAcademicYear] = useState(contact.academicYear || "2025 - 2026");
    const [foundedYear, setFoundedYear] = useState(contact.foundedYear || "");
    const [address, setAddress] = useState(contact.address || "");
    const [phone, setPhone] = useState(contact.phone || "");
    const [email, setEmail] = useState(contact.email || "");
    const [website, setWebsite] = useState(contact.website || "");
    const [description, setDescription] = useState(contact.description || "");

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    /** Handle logo file selection – preview only, upload on save */
    const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            setError("Ảnh logo phải nhỏ hơn 2MB.");
            return;
        }
        setError(null);
        setPendingLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
        // reset input so same file can be selected again
        e.target.value = "";
    };

    /** Display URL: pending preview > saved URL */
    const displayLogo = logoPreview || logoURL;

    // ── Save ──
    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            // 1) If there's a pending logo, upload to imgbb first
            if (pendingLogoFile) {
                const { logoURL: newUrl } = await uploadSchoolLogo(pendingLogoFile);
                setLogoURL(newUrl);
                setPendingLogoFile(null);
                setLogoPreview(null);
            }

            // 2) Save all profile fields
            await updateSchoolProfile({
                schoolName,
                level,
                contactInfo: stringifyContactInfo({
                    email,
                    phone,
                    address,
                    academicYear,
                    foundedYear,
                    website,
                    description,
                }),
            });
            setSuccess("Đã lưu thay đổi thành công!");
            setTimeout(() => setSuccess(null), 4000);
            onProfileUpdate();
        } catch (err) {
            if (err instanceof ApiError) setError(err.message);
            else setError("Không thể cập nhật. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    // ── School code derived from ID ──
    const schoolCode = profile.id?.substring(0, 8).toUpperCase() || "N/A";

    return (
        <div className="space-y-6">
            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="[font-family:'Montserrat',Helvetica] font-bold text-[#100f14] text-[28px] leading-tight">
                        Hồ sơ trường học
                    </h1>
                    <p className="mt-1 [font-family:'Montserrat',Helvetica] font-medium text-[#4c5769] text-sm">
                        Quản lý thông tin hiển thị, logo và cấu hình hệ thống.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] border-[#cbcad7] [font-family:'Montserrat',Helvetica] font-semibold text-[#100f14] text-sm hover:bg-gray-50"
                    >
                        <Eye className="w-4 h-4" />
                        Xem trang
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#6938ef] hover:bg-[#5527d9] text-white [font-family:'Montserrat',Helvetica] font-semibold text-sm"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                </div>
            </div>

            {/* ── Feedback ── */}
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

            {/* ── Two-Column Layout ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ── Card Left: Thông tin cơ bản ── */}
                <Card className="border-none rounded-[20px] shadow-[0px_4px_20px_rgba(0,0,0,0.06)]">
                    <CardContent className="p-6 lg:p-8 space-y-6">
                        {/* Section Header */}
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-[#6938ef] rounded-[10px] flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                </svg>
                            </div>
                            <h2 className="[font-family:'Montserrat',Helvetica] font-bold text-[#100f14] text-lg">
                                Thông tin cơ bản
                            </h2>
                        </div>
                        <div className="w-full h-px bg-[#e5e5e5]" />

                        {/* Logo Upload */}
                        <div className="flex items-center gap-5">
                            <div
                                className="w-20 h-20 rounded-[20px] bg-[#f0f0f5] border-2 border-dashed border-[#cbcad7] flex items-center justify-center overflow-hidden shadow-sm cursor-pointer hover:border-[#6938ef] transition-colors group"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {displayLogo ? (
                                    <img src={displayLogo} alt="Logo" className="w-full h-full object-cover rounded-[18px]" />
                                ) : (
                                    <div className="flex flex-col items-center gap-1">
                                        <Upload className="w-5 h-5 text-gray-400 group-hover:text-[#6938ef]" />
                                        <span className="text-gray-400 text-[10px] [font-family:'Montserrat',Helvetica] group-hover:text-[#6938ef]">LOGO</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#100f14] text-sm opacity-70">
                                    LOGO Trường
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                    className="hidden"
                                    onChange={handleLogoSelect}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="mt-1 text-xs rounded-[10px] border-[#cbcad7] [font-family:'Montserrat',Helvetica] hover:border-[#6938ef] hover:text-[#6938ef]"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="w-3 h-3 mr-1.5" />
                                    Tải ảnh lên
                                </Button>
                                {pendingLogoFile && (
                                    <span className="text-xs text-amber-600 [font-family:'Montserrat',Helvetica]">
                                        ⏳ Chưa lưu
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* School Name */}
                        <FieldGroup label="Tên trường">
                            <Input
                                value={schoolName}
                                onChange={(e) => setSchoolName(e.target.value)}
                                className="h-11 border-[#cbcad7] rounded-[15px] [font-family:'Montserrat',Helvetica] text-sm text-[#100f14] opacity-80"
                            />
                        </FieldGroup>

                        {/* Cấp học & Niên khoá */}
                        <div className="grid grid-cols-2 gap-4">
                            <FieldGroup label="Cấp học">
                                <select
                                    value={level}
                                    onChange={(e) => setLevel(e.target.value)}
                                    className="flex h-11 w-full items-center rounded-[15px] border border-[#cbcad7] bg-white px-4 text-sm [font-family:'Montserrat',Helvetica] text-[#100f14] opacity-80 focus:outline-none focus:ring-2 focus:ring-[#6938ef]"
                                >
                                    <option value="Tiểu học">Tiểu học</option>
                                    <option value="THCS">THCS</option>
                                    <option value="THPT">THPT</option>
                                </select>
                            </FieldGroup>

                            <FieldGroup label="Niên khoá">
                                <select
                                    value={academicYear}
                                    onChange={(e) => setAcademicYear(e.target.value)}
                                    className="flex h-11 w-full items-center rounded-[15px] border border-[#cbcad7] bg-white px-4 text-sm [font-family:'Montserrat',Helvetica] text-[#100f14] opacity-80 focus:outline-none focus:ring-2 focus:ring-[#6938ef]"
                                >
                                    <option value="2025 - 2026">2025 - 2026</option>
                                    <option value="2024 - 2025">2024 - 2025</option>
                                    <option value="2026 - 2027">2026 - 2027</option>
                                </select>
                            </FieldGroup>
                        </div>

                        {/* Status badge */}
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                            <span className="[font-family:'Montserrat',Helvetica] font-medium text-green-600 text-sm">
                                Đang mở order
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* ── Card Right: Thông tin liên hệ ── */}
                <Card className="border-none rounded-[20px] shadow-[0px_4px_20px_rgba(0,0,0,0.06)]">
                    <CardContent className="p-6 lg:p-8 space-y-6">
                        {/* Section Header */}
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-[#6938ef] rounded-[10px] flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                                </svg>
                            </div>
                            <h2 className="[font-family:'Montserrat',Helvetica] font-bold text-[#100f14] text-lg">
                                Thông tin liên hệ
                            </h2>
                        </div>
                        <div className="w-full h-px bg-[#e5e5e5]" />

                        {/* Mã trường (read-only) */}
                        <FieldGroup label="Mã trường">
                            <Input
                                value={schoolCode}
                                disabled
                                className="h-11 border-[#cbcad7] rounded-[15px] bg-[#f6f7f8] [font-family:'Montserrat',Helvetica] text-sm text-[#100f14] opacity-80"
                            />
                            <p className="mt-1 text-xs [font-family:'Montserrat',Helvetica] text-[#4c5769] opacity-80">
                                Mã định danh không thể thay đổi.
                            </p>
                        </FieldGroup>

                        {/* Năm thành lập */}
                        <FieldGroup label="Năm thành lập">
                            <Input
                                value={foundedYear}
                                onChange={(e) => setFoundedYear(e.target.value)}
                                placeholder="VD: 1991"
                                className="h-11 border-[#cbcad7] rounded-[15px] [font-family:'Montserrat',Helvetica] text-sm text-[#100f14] opacity-80"
                            />
                        </FieldGroup>

                        {/* Địa chỉ trụ sở */}
                        <FieldGroup label="Địa chỉ trụ sở">
                            <div className="relative">
                                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Nhập địa chỉ trường..."
                                    className="h-11 pl-10 border-[#cbcad7] rounded-[15px] bg-[#f6f7f8] [font-family:'Montserrat',Helvetica] text-sm text-[#100f14] opacity-80"
                                />
                            </div>
                        </FieldGroup>

                        {/* SĐT + Email */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FieldGroup label="Số điện thoại">
                                <div className="relative">
                                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="0129 245 245"
                                        className="h-11 pl-10 border-[#cbcad7] rounded-[15px] bg-[#f6f7f8] [font-family:'Montserrat',Helvetica] text-sm text-[#100f14] opacity-80"
                                    />
                                </div>
                            </FieldGroup>

                            <FieldGroup label="Email liên hệ">
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="school@example.com"
                                        className="h-11 pl-10 border-[#cbcad7] rounded-[15px] [font-family:'Montserrat',Helvetica] text-sm text-[#100f14] opacity-80"
                                    />
                                </div>
                            </FieldGroup>
                        </div>

                        {/* Website */}
                        <FieldGroup label="Website">
                            <div className="relative">
                                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    placeholder="https://www.truong.edu.vn/"
                                    className="h-11 pl-10 border-[#cbcad7] rounded-[15px] bg-[#f6f7f8] [font-family:'Montserrat',Helvetica] text-sm text-[#100f14] opacity-80"
                                />
                            </div>
                        </FieldGroup>

                        {/* Giới thiệu ngắn */}
                        <FieldGroup label="Giới thiệu ngắn">
                            <div className="relative">
                                <FileText className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Mô tả ngắn gọn về trường..."
                                    rows={3}
                                    className="flex w-full pl-10 pr-4 py-3 rounded-[15px] border border-[#cbcad7] bg-[#f6f7f8] text-sm [font-family:'Montserrat',Helvetica] text-[#100f14] opacity-80 focus:outline-none focus:ring-2 focus:ring-[#6938ef] resize-none"
                                />
                            </div>
                        </FieldGroup>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

/* ── Helper component: FieldGroup ── */
const FieldGroup = ({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) => (
    <div>
        <label className="block mb-1.5 [font-family:'Montserrat',Helvetica] font-medium text-[#100f14] text-sm opacity-70">
            {label}
        </label>
        {children}
    </div>
);
