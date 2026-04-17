import { useState, useRef } from "react";
import { Eye, Save, MapPin, Phone, Mail, Globe, FileText, Upload } from "lucide-react";
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
    onProfileUpdate: () => void;
}

export const ApprovedProfileView = ({
    profile,
    onProfileUpdate,
}: ApprovedProfileViewProps): JSX.Element => {
    const contact = parseContactInfo(profile.contactInfo);

    const [schoolName, setSchoolName] = useState(profile.schoolName || "");
    const [logoURL, setLogoURL] = useState(profile.logoURL || "");
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
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

    const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { setError("Ảnh logo phải nhỏ hơn 2MB."); return; }
        setError(null);
        setPendingLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
        e.target.value = "";
    };

    const displayLogo = logoPreview || logoURL;

    const handleSave = async () => {
        setSaving(true); setError(null); setSuccess(null);
        try {
            if (pendingLogoFile) {
                const { logoURL: newUrl } = await uploadSchoolLogo(pendingLogoFile);
                setLogoURL(newUrl);
                setPendingLogoFile(null);
                setLogoPreview(null);
            }
            await updateSchoolProfile({
                schoolName, level,
                contactInfo: stringifyContactInfo({ email, phone, address, academicYear, foundedYear, website, description }),
            });
            setSuccess("Đã lưu thay đổi thành công!");
            setTimeout(() => setSuccess(null), 4000);
            onProfileUpdate();
        } catch (err) {
            if (err instanceof ApiError) setError(err.message);
            else setError("Không thể cập nhật. Vui lòng thử lại.");
        } finally { setSaving(false); }
    };

    const schoolCode = profile.id?.substring(0, 8).toUpperCase() || "N/A";

    return (
        <div className="space-y-6">
            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-extrabold text-gray-900 text-[28px] leading-tight">
                        Hồ sơ trường học
                    </h1>
                    <p className="mt-1 font-medium text-[#4c5769] text-sm">
                        Quản lý thông tin hiển thị, logo và cấu hình hệ thống.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="nb-btn nb-btn-outline text-sm">
                        <Eye className="w-4 h-4" /> Xem trang
                    </button>
                    <button onClick={handleSave} disabled={saving}
                        className="nb-btn nb-btn-purple text-sm disabled:opacity-50">
                        <Save className="w-4 h-4" />
                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                </div>
            </div>

            {/* ── Feedback ── */}
            {error && (
                <div className="nb-alert nb-alert-error text-sm"><span>⚠️</span><span>{error}</span></div>
            )}
            {success && (
                <div className="nb-alert nb-alert-success text-sm"><span>✅</span><span>{success}</span></div>
            )}

            {/* ── Two-Column Layout ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ── Card Left: Thông tin cơ bản ── */}
                <div className="nb-card-static p-0">
                    <div className="px-6 lg:px-8 pt-6 pb-4 border-b-2 border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-9 h-9 bg-[#6938EF] rounded-lg border border-gray-200 shadow-sm">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                </svg>
                            </div>
                            <h2 className="font-extrabold text-gray-900 text-lg">Thông tin cơ bản</h2>
                        </div>
                    </div>
                    <div className="px-6 lg:px-8 py-6 space-y-5">
                        {/* Logo Upload */}
                        <div className="flex items-center gap-5">
                            <div
                                className="w-20 h-20 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-violet-600 transition-colors group"
                                onClick={() => fileInputRef.current?.click()}>
                                {displayLogo ? (
                                    <img src={displayLogo} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                                ) : (
                                    <div className="flex flex-col items-center gap-1">
                                        <Upload className="w-5 h-5 text-gray-400 group-hover:text-violet-600" />
                                        <span className="text-gray-400 text-[10px] group-hover:text-violet-600">LOGO</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 text-sm">LOGO Trường</p>
                                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                    className="hidden" onChange={handleLogoSelect} />
                                <button type="button" onClick={() => fileInputRef.current?.click()}
                                    className="nb-btn nb-btn-outline nb-btn-sm text-xs mt-1">
                                    <Upload className="w-3 h-3" /> Tải ảnh lên
                                </button>
                                {pendingLogoFile && <span className="text-xs text-amber-600 ml-2">⏳ Chưa lưu</span>}
                            </div>
                        </div>

                        {/* School Name */}
                        <FieldGroup label="Tên trường">
                            <input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} className="nb-input w-full py-3" />
                        </FieldGroup>

                        <div className="grid grid-cols-2 gap-4">
                            <FieldGroup label="Cấp học">
                                <select value={level} onChange={(e) => setLevel(e.target.value)} className="nb-select w-full">
                                    <option value="Tiểu học">Tiểu học</option>
                                    <option value="THCS">THCS</option>
                                    <option value="THPT">THPT</option>
                                </select>
                            </FieldGroup>
                            <FieldGroup label="Niên khoá">
                                <select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className="nb-select w-full">
                                    <option value="2025 - 2026">2025 - 2026</option>
                                    <option value="2024 - 2025">2024 - 2025</option>
                                    <option value="2026 - 2027">2026 - 2027</option>
                                </select>
                            </FieldGroup>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                            <span className="nb-badge nb-badge-green text-xs">Đang mở order</span>
                        </div>
                    </div>
                </div>

                {/* ── Card Right: Thông tin liên hệ ── */}
                <div className="nb-card-static p-0">
                    <div className="px-6 lg:px-8 pt-6 pb-4 border-b-2 border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-9 h-9 bg-[#6938EF] rounded-lg border border-gray-200 shadow-sm">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                                </svg>
                            </div>
                            <h2 className="font-extrabold text-gray-900 text-lg">Thông tin liên hệ</h2>
                        </div>
                    </div>
                    <div className="px-6 lg:px-8 py-6 space-y-5">
                        <FieldGroup label="Mã trường">
                            <input value={schoolCode} disabled className="nb-input w-full py-3 bg-gray-50" />
                            <p className="mt-1 text-xs text-gray-500">Mã định danh không thể thay đổi.</p>
                        </FieldGroup>

                        <FieldGroup label="Năm thành lập">
                            <input value={foundedYear} onChange={(e) => setFoundedYear(e.target.value)}
                                placeholder="VD: 1991" className="nb-input w-full py-3" />
                        </FieldGroup>

                        <FieldGroup label="Địa chỉ trụ sở">
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input value={address} onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Nhập địa chỉ trường..." className="nb-input w-full py-3 pl-10 bg-gray-50" />
                            </div>
                        </FieldGroup>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FieldGroup label="Số điện thoại">
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input value={phone} onChange={(e) => setPhone(e.target.value)}
                                        placeholder="0236 3822 367" className="nb-input w-full py-3 pl-10 bg-gray-50" />
                                </div>
                            </FieldGroup>
                            <FieldGroup label="Email liên hệ">
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input value={email} onChange={(e) => setEmail(e.target.value)}
                                        placeholder="school@example.com" className="nb-input w-full py-3 pl-10" />
                                </div>
                            </FieldGroup>
                        </div>

                        <FieldGroup label="Website">
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input value={website} onChange={(e) => setWebsite(e.target.value)}
                                    placeholder="https://www.truong.edu.vn/" className="nb-input w-full py-3 pl-10 bg-gray-50" />
                            </div>
                        </FieldGroup>

                        <FieldGroup label="Giới thiệu ngắn">
                            <div className="relative">
                                <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                <textarea
                                    value={description} onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Mô tả ngắn gọn về trường..." rows={3}
                                    className="nb-input w-full pl-10 py-3 bg-gray-50 resize-none" />
                            </div>
                        </FieldGroup>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ── Helper component: FieldGroup ── */
const FieldGroup = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
        <label className="block mb-1.5 font-bold text-gray-900 text-sm">
            {label}
        </label>
        {children}
    </div>
);
