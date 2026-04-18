import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Phone, Camera } from "lucide-react";
import { updateParentProfile, getParentProfile, updateParentAvatar } from "../../../lib/api/users";

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const YEARS = Array.from({ length: 80 }, (_, i) => 2025 - i);

interface UserInfo {
  id: string; fullName: string; email: string;
  phone: string | null; role: string; avatar: string | null;
  gender?: string; dateOfBirth?: string;
}

const genderMap: Record<string, number> = { "Nam": 1, "Nữ": 2, "Khác": 3 };

export const AccountTab = (): JSX.Element => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [dobDay, setDobDay] = useState(1);
  const [dobMonth, setDobMonth] = useState(1);
  const [dobYear, setDobYear] = useState(2000);
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [emailMsg, setEmailMsg] = useState("");
  const [phoneMsg, setPhoneMsg] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [phoneSaving, setPhoneSaving] = useState(false);

  // Avatar state
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const getStorage = () => localStorage.getItem("access_token") ? localStorage : sessionStorage;
  const syncUserStorage = (updates: Partial<UserInfo>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    getStorage().setItem("user", JSON.stringify(updated));
    setUser(updated);
  };

  useEffect(() => {
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!raw) { navigate("/signin", { replace: true }); return; }
    try {
      const u = JSON.parse(raw);
      setUser(u); setFullName(u.fullName || ""); setEmail(u.email || ""); setPhone(u.phone || "");
    } catch { navigate("/signin", { replace: true }); return; }

    const fetchProfile = async () => {
      try {
        const data = await getParentProfile();
        const u: UserInfo = {
          id: data.id, fullName: data.fullName || "", email: data.email || "",
          phone: data.phone || "", role: data.role || "Parent", avatar: data.avatar || null,
          gender: data.gender || "", dateOfBirth: data.dob || "",
        };
        setUser(u); setFullName(u.fullName); setEmail(u.email); setPhone(u.phone || "");
        if (data.gender === "Male") setGender("Nam");
        else if (data.gender === "Female") setGender("Nữ");
        else if (data.gender === "Other") setGender("Khác");
        else setGender("");
        if (data.dob) {
          const d = new Date(data.dob);
          if (!isNaN(d.getTime())) { setDobDay(d.getDate()); setDobMonth(d.getMonth() + 1); setDobYear(d.getFullYear()); }
        }
        getStorage().setItem("user", JSON.stringify(u));
        localStorage.setItem("vtos_2fa_enabled", (data.twoFactorEnabled ?? false) ? "true" : "false");
        window.dispatchEvent(new CustomEvent("vtos:user-updated"));
      } catch (err) { console.error("Failed to fetch profile:", err); }
      finally { setProfileLoading(false); }
    };
    fetchProfile();
  }, [navigate]);

  const handleSaveProfile = async () => {
    setSaving(true); setSaveMsg("");
    try {
      const dob = `${dobYear}-${String(dobMonth).padStart(2, '0')}-${String(dobDay).padStart(2, '0')}T00:00:00`;
      await updateParentProfile({ fullName: fullName || undefined, dob, gender: gender ? genderMap[gender] : undefined });
      syncUserStorage({ fullName, gender });
      setSaveMsg("Đã lưu thành công!");
    } catch (err: any) { setSaveMsg("Lỗi: " + (err?.message || "Không thể cập nhật")); }
    finally { setSaving(false); setTimeout(() => setSaveMsg(""), 3000); }
  };

  const handleUpdateEmail = async () => {
    if (!email.trim()) return;
    setEmailSaving(true); setEmailMsg("");
    try { await updateParentProfile({ email }); syncUserStorage({ email }); setEmailMsg("✓ Đã cập nhật!"); }
    catch (err: any) { setEmailMsg("Lỗi: " + (err?.message || "Không thể cập nhật")); }
    finally { setEmailSaving(false); setTimeout(() => setEmailMsg(""), 3000); }
  };

  const handleUpdatePhone = async () => {
    if (!phone.trim()) return;
    setPhoneSaving(true); setPhoneMsg("");
    try { await updateParentProfile({ phone }); syncUserStorage({ phone }); setPhoneMsg("✓ Đã cập nhật!"); }
    catch (err: any) { setPhoneMsg("Lỗi: " + (err?.message || "Không thể cập nhật")); }
    finally { setPhoneSaving(false); setTimeout(() => setPhoneMsg(""), 3000); }
  };

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setAvatarMsg("Lỗi: Vui lòng chọn tệp hình ảnh!");
      setTimeout(() => setAvatarMsg(""), 3000);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setAvatarMsg("Lỗi: Kích thước tệp không được vượt quá 5MB!");
      setTimeout(() => setAvatarMsg(""), 3000);
      return;
    }

    setAvatarSaving(true);
    setAvatarMsg("");

    try {
      const result = await updateParentAvatar(file);
      syncUserStorage({ avatar: result.avatarUrl });
      window.dispatchEvent(new CustomEvent("vtos:user-updated"));
      setAvatarMsg("✓ Đã cập nhật avatar!");
      // Reset file input
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      setTimeout(() => setAvatarMsg(""), 3000);
    } catch (err: any) {
      setAvatarMsg("Lỗi: " + (err?.message || "Không thể cập nhật avatar"));
      setTimeout(() => setAvatarMsg(""), 3000);
    } finally {
      setAvatarSaving(false);
    }
  };

  if (!user) return <div />;

  if (profileLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-24 h-10 bg-gray-200 rounded-xl" />
          <div className="w-24 h-10 bg-gray-200 rounded-xl" />
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-28 h-28 bg-gray-200 rounded-xl" />
          <div className="flex-1 space-y-5">
            <div className="h-11 bg-gray-200 rounded-xl" />
            <div className="h-11 bg-gray-200 rounded-xl" />
            <div className="h-11 bg-gray-200 rounded-xl w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  const initials = fullName?.split(" ").map(w => w[0]).join("").slice(-2).toUpperCase();

  const inputClass = "nb-input w-full h-11 text-sm flex-1";
  const selectClass = "nb-input h-11 text-sm px-3";

  return (
    <div className="space-y-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-28 h-28 bg-violet-50 rounded-xl flex items-center justify-center border border-gray-200 shadow-soft-md">
                  {user.avatar
                    ? <img src={user.avatar} alt="" className="w-full h-full rounded-xl object-cover" />
                    : <span className="font-extrabold text-gray-900 text-3xl">{initials}</span>}
                </div>
                <button 
                  type="button"
                  onClick={handleAvatarClick}
                  disabled={avatarSaving}
                  className="absolute bottom-[-4px] right-[-4px] w-9 h-9 bg-emerald-400 border border-gray-200 rounded-lg flex items-center justify-center shadow-sm hover:shadow-none hover:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  <Camera className="w-4 h-4 text-gray-900" />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              {avatarMsg && (
                <span className={`font-bold text-xs ${avatarMsg.startsWith("✓") ? "text-emerald-800" : "text-red-800"}`}>
                  {avatarMsg}
                </span>
              )}
            </div>

            {/* Form */}
            <div className="flex-1 space-y-5">
              <div className="flex items-center gap-4">
                <label className="w-28 flex-shrink-0 font-bold text-gray-900 text-sm text-right">Họ và tên</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  className={inputClass} />
              </div>
              <div className="flex items-center gap-4">
                <label className="w-28 flex-shrink-0 font-bold text-gray-900 text-sm text-right">Ngày sinh</label>
                <div className="flex items-center gap-3">
                  {([
                    { value: dobDay, set: setDobDay, opts: DAYS },
                    { value: dobMonth, set: setDobMonth, opts: MONTHS },
                    { value: dobYear, set: setDobYear, opts: YEARS },
                  ] as const).map((s, i) => (
                    <select key={i} value={s.value} onChange={e => (s.set as (v: number) => void)(Number(e.target.value))}
                      className={selectClass}>
                      {s.opts.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="w-28 flex-shrink-0 font-bold text-gray-900 text-sm text-right">Giới tính</label>
                <div className="flex items-center gap-6">
                  {["Nam", "Nữ", "Khác"].map(g => (
                    <label key={g} className="flex items-center gap-2 cursor-pointer group" onClick={() => setGender(g)}>
                      <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors ${gender === g ? "border-gray-200 bg-purple-400 shadow-sm" : "border-gray-300 group-hover:border-gray-300"}`}>
                        {gender === g && <div className="w-2 h-2 rounded-sm bg-gray-900" />}
                      </div>
                      <span className="font-bold text-sm text-gray-900">{g}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-28" />
                <button onClick={handleSaveProfile} disabled={saving}
                  className="nb-btn nb-btn-purple text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  {saving ? "Đang lưu..." : "Lưu thay đổi ✦"}
                </button>
                {saveMsg && <span className="font-bold text-sm text-emerald-800">✓ {saveMsg}</span>}
              </div>
            </div>
          </div>

          <hr className="border-gray-200/10 border-t-2" />

          {/* Email */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center border border-gray-200 shadow-sm flex-shrink-0"><Mail className="w-5 h-5 text-gray-900" /></div>
            <label className="w-28 flex-shrink-0 font-bold text-gray-900 text-sm">Địa chỉ email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="nb-input h-11 text-sm flex-1 max-w-xs" />
            <button onClick={handleUpdateEmail} disabled={emailSaving}
              className="nb-btn nb-btn-outline text-sm disabled:opacity-50">
              {emailSaving ? "Đang lưu..." : "Cập nhật"}
            </button>
            {emailMsg && <span className="font-bold text-sm text-emerald-800">{emailMsg}</span>}
          </div>

          {/* Phone */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center border border-gray-200 shadow-sm flex-shrink-0"><Phone className="w-5 h-5 text-gray-900" /></div>
            <label className="w-28 flex-shrink-0 font-bold text-gray-900 text-sm">Số điện thoại</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="01234567890"
              className="nb-input h-11 text-sm flex-1 max-w-xs" />
            <button onClick={handleUpdatePhone} disabled={phoneSaving}
              className="nb-btn nb-btn-outline text-sm disabled:opacity-50">
              {phoneSaving ? "Đang lưu..." : "Cập nhật"}
            </button>
            {phoneMsg && <span className="font-bold text-sm text-emerald-800">{phoneMsg}</span>}
          </div>
    </div>
  );
};
