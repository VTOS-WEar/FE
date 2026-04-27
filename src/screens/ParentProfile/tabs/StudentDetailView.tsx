import { useState, useEffect, useRef } from "react";
import { Camera, Loader2, ArrowLeft, ScanLine } from "lucide-react";
import { getChildProfile, updateChildProfile, updateChildAvatar, type GetChildDetailResponse, type UpdateChildProfileDto } from "../../../lib/api/users";
import { getVietnamseGender, genderMap } from "../../../lib/utils";
import { useNavigate } from "react-router-dom";

interface StudentDetailViewProps {
  childId: string;
  onBack: () => void;
}

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const YEARS = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);

export const StudentDetailView = ({ childId, onBack }: StudentDetailViewProps): JSX.Element => {
  const navigate = useNavigate();
  const [student, setStudent] = useState<GetChildDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState("");

  // Form fields
  const [fullName, setFullName] = useState("");
  const [grade, setGrade] = useState("");
  const [gender, setGender] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [dobDay, setDobDay] = useState(1);
  const [dobMonth, setDobMonth] = useState(1);
  const [dobYear, setDobYear] = useState(new Date().getFullYear());

  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true);
        const data = await getChildProfile(childId);
        setStudent(data);
        setFullName(data.fullName);
        setGrade(data.grade);
        
        // Convert gender to Vietnamese
        setGender(getVietnamseGender(data.gender));
        
        setHeightCm(data.bodyMetric.heightCm.toString());
        setWeightKg(data.bodyMetric.weightKg.toString());
        
        // Calculate DOB from age
        const currentYear = new Date().getFullYear();
        const birthYear = currentYear - data.age;
        setDobYear(birthYear);
      } catch (err) {
        console.error("Failed to fetch student:", err);
        setMessage("Lỗi: Không thể tải thông tin học sinh");
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [childId]);

  const handleSave = async () => {
    if (!fullName.trim() || !grade.trim()) {
      setMessage("Lỗi: Vui lòng điền đầy đủ thông tin");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const dob = `${dobYear}-${String(dobMonth).padStart(2, '0')}-${String(dobDay).padStart(2, '0')}T00:00:00`;
      const updateData: UpdateChildProfileDto = {
        childId,
        fullName,
        dob,
        grade,
        gender: gender ? genderMap[gender] : undefined,
        heightCm: heightCm ? Number.parseInt(heightCm) : undefined,
        weightKg: weightKg ? Number.parseInt(weightKg) : undefined,
      };

      const result = await updateChildProfile(updateData);
      setStudent(result);
      setMessage("✓ Đã lưu thành công!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setMessage("Lỗi: " + (err?.message || "Không thể lưu thông tin"));
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setMessage("Lỗi: Vui lòng chọn tệp hình ảnh");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    // Validate file size (5MB max)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > MAX_SIZE) {
      setMessage("Lỗi: Kích thước tệp không được vượt quá 5MB");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setUploadingAvatar(true);
    setMessage("");

    try {
      const result = await updateChildAvatar(childId, file);
      setStudent(prev => prev ? { ...prev, avatarUrl: result.avatarUrl } : null);
      setMessage("✓ Đã cập nhật ảnh thành công!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setMessage("Lỗi: " + (err?.message || "Không thể cập nhật ảnh"));
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-24 bg-gray-200 rounded-xl" />
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-40 h-40 bg-gray-200 rounded-xl" />
          <div className="flex-1 space-y-5">
            {new Array(5).fill(0).map((_, i) => (
              <div key={`skeleton-${i}`} className="h-11 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 font-bold">Không thể tải thông tin học sinh</p>
        <button onClick={onBack} className="nb-btn nb-btn-outline mt-4 text-sm">
          Quay lại
        </button>
      </div>
    );
  }

  const initials = fullName?.split(" ").map(w => w[0]).join("").slice(-2).toUpperCase();
  const inputClass = "nb-input w-full h-11 text-sm border border-gray-200 hover:shadow-sm hover:border-purple-300 focus:shadow-sm focus:border-purple-300 transition-all duration-300";
  const selectClass = "nb-input h-11 text-sm px-3 border border-gray-200 hover:shadow-sm hover:border-purple-300 focus:shadow-sm focus:border-purple-300 transition-all duration-300";

  return (
    <div className="space-y-0">
      {/* Back button */}
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-2 font-bold text-gray-500 hover:text-gray-800 hover:translate-x-[-4px] transition-all duration-300"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại
      </button>

      {/* Main layout */}
      <div className="flex flex-col md:flex-row gap-8 animate-in fade-in duration-500">
        {/* Left: Avatar */}
        <div className="flex flex-col items-center gap-4 group">
          <div className="relative">
            <div className="w-60 h-80 bg-violet-50 rounded-xl flex items-center justify-center border border-gray-200 shadow-soft-md overflow-hidden hover:shadow-soft-md transition-all duration-300">
              {student.avatarUrl ? (
                <img
                  src={student.avatarUrl}
                  alt={student.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-extrabold text-gray-900 text-5xl">{initials}</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleAvatarClick}
              disabled={saving || uploadingAvatar}
              className="absolute bottom-[-4px] right-[-4px] w-11 h-11 bg-emerald-400 border border-gray-200 rounded-lg flex items-center justify-center shadow-sm hover:shadow-none hover:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadingAvatar ? (
                <Loader2 className="w-5 h-5 text-gray-900 animate-spin" />
              ) : (
                <Camera className="w-5 h-5 text-gray-900" />
              )}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <div className="text-center">
            <p className="font-bold text-gray-900 text-base">{fullName}</p>
            <p className="font-medium text-gray-500 text-sm mt-1">{student.schoolName || "—"}</p>
          </div>
        </div>

        {/* Right: Form */}
        <div className="flex-1 space-y-5">
          {/* Họ và tên */}
          <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-4 duration-500">
            <label htmlFor="fullName" className="font-bold text-gray-900 text-sm transition-colors duration-300">HỌ VÀ TÊN</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Trường học + Lớp học */}
          <div className="grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Trường học - 2 columns */}
            <div className="col-span-2 flex flex-col gap-2">
              <label htmlFor="school" className="font-bold text-gray-900 text-sm transition-colors duration-300">TRƯỜNG HỌC</label>
              <input
                id="school"
                type="text"
                disabled
                value={student.schoolName || "—"}
                className={`${inputClass} !bg-gray-100 !cursor-not-allowed opacity-70 hover:shadow-none`}
              />
            </div>

            {/* Lớp học - 1 column */}
            <div className="col-span-1 flex flex-col gap-2">
              <label htmlFor="grade" className="font-bold text-gray-900 text-sm transition-colors duration-300">LỚP HỌC</label>
              <input
                id="grade"
                type="text"
                disabled
                value={grade}
                onChange={e => setGrade(e.target.value)}
                className={`${inputClass} !bg-gray-100 !cursor-not-allowed opacity-70 hover:shadow-none`}
              />
            </div>
          </div>

          {/* Giới tính */}
          <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-4 duration-500">
            <label className="font-bold text-gray-900 text-sm transition-colors duration-300">GIỚI TÍNH</label>
            <div className="inline-flex h-11 min-w-[120px] items-center rounded-xl border border-gray-200 bg-gray-100 px-4 text-sm font-bold text-gray-900">
              {gender || "—"}
            </div>
          </div>

          {/* Tuổi - Row */}
          <div className="grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Tuổi (calculated) */}
            <div className="flex flex-col gap-2">
              <label htmlFor="age" className="font-bold text-gray-900 text-sm transition-colors duration-300">TUỔI</label>
              <input
                id="age"
                type="number"
                disabled
                value={student.age}
                className={`${inputClass} !bg-gray-100 !cursor-not-allowed opacity-70 hover:shadow-none`}
              />
            </div>

            {/* Chiều cao */}
            <div className="flex flex-col gap-2">
              <label htmlFor="height" className="font-bold text-gray-900 text-sm transition-colors duration-300">CHIỀU CAO (cm)</label>
              <input
                id="height"
                type="number"
                value={heightCm}
                onChange={e => setHeightCm(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Cân nặng */}
            <div className="flex flex-col gap-2">
              <label htmlFor="weight" className="font-bold text-gray-900 text-sm transition-colors duration-300">CÂN NẶNG (kg)</label>
              <input
                id="weight"
                type="number"
                value={weightKg}
                onChange={e => setWeightKg(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Ngày sinh (not shown in edit, but using for calculations) */}
          <div className="hidden">
            <div className="flex items-center gap-3">
              {([
                { value: dobDay, set: setDobDay, opts: DAYS },
                { value: dobMonth, set: setDobMonth, opts: MONTHS },
                { value: dobYear, set: setDobYear, opts: YEARS },
              ] as const).map((s, i) => (
                <select
                  key={i}
                  value={s.value}
                  onChange={e => (s.set as (v: number) => void)(Number(e.target.value))}
                  className={selectClass}
                >
                  {s.opts.map(v => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
              onClick={() => navigate(`/children/${childId}/scan`)}
              disabled={saving || uploadingAvatar}
              className="nb-btn nb-btn-outline text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ScanLine className="w-4 h-4" />
              Quét số đo với Bodygram
            </button>
            <button
              onClick={() => {
                localStorage.setItem("selectedStudentId", childId);
                navigate("/parentprofile/bodygram-history");
              }}
              disabled={saving || uploadingAvatar}
              className="nb-btn nb-btn-outline text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ScanLine className="w-4 h-4" />
              Xem lịch sử quét Bodygram
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-[14px] border border-gray-200 bg-gradient-to-r from-[#7C63E6] via-[#8F79EB] to-[#6F56E0] px-6 text-sm font-extrabold text-white shadow-[0_10px_22px_rgba(124,99,230,0.28)] transition-all duration-200 hover:-translate-y-[2px] hover:brightness-110 hover:shadow-[0_14px_28px_rgba(124,99,230,0.35)] active:translate-y-0 active:shadow-[0_8px_18px_rgba(124,99,230,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              <span className="pointer-events-none absolute -left-10 top-0 h-full w-14 -skew-x-12 bg-white/25 blur-[1px] transition-all duration-300 group-hover:left-[110%]" />
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <span className="relative">Lưu thay đổi ✦</span>
              )}
            </button>
            {message && (
              <span className={`font-bold text-sm animate-in fade-in duration-300 ${message.startsWith("✓") ? "text-emerald-800" : "text-red-800"}`}>
                {message}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
