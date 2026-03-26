import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Phone, Camera, Shield, ShieldCheck } from "lucide-react";
import { updateParentProfile, getParentProfile } from "../../../lib/api/users";
import { disable2FA } from "../../../lib/api/auth";

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
  const [activeTab, setActiveTab] = useState<"personal" | "security">("personal");
  const [user, setUser] = useState<UserInfo | null>(null);
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

  // 2FA state
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [disable2FACode, setDisable2FACode] = useState("");
  const [disabling2FA, setDisabling2FA] = useState(false);
  const [disable2FAMsg, setDisable2FAMsg] = useState("");

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
          phone: data.phone || "", role: data.role || "Parent", avatar: null,
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
      } catch (err) { console.error("Failed to fetch profile:", err); }
    };
    fetchProfile();
  }, [navigate]);

    // Check 2FA status from user data in storage
    useEffect(() => {
      // We'll check if 2FA is enabled by trying to see if user has it set
      // For now, we read from a localStorage flag set during login or profile fetch
      const twoFA = localStorage.getItem("vtos_2fa_enabled");
      setIs2FAEnabled(twoFA === "true");
    }, []);

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

  if (!user) return <div />;
  const initials = fullName?.split(" ").map(w => w[0]).join("").slice(-2).toUpperCase();

  return (
    <div className="space-y-0">
      {/* Tabs */}
      <div className="flex items-center gap-3 mb-8">
        {(["personal", "security"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all ${activeTab === tab
              ? "bg-[#6938ef] text-white shadow-[0_2px_8px_rgba(105,56,239,0.3)]"
              : "bg-[#f4f2ff] text-[#6938ef] hover:bg-[#ede9fe]"}`}>
            {tab === "personal" ? "Thông tin cá nhân" : "Bảo mật"}
          </button>
        ))}
      </div>

      {/* Personal Info */}
      {activeTab === "personal" && (
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-28 h-28 bg-[#f0edff] rounded-full flex items-center justify-center border-[3px] border-[#cbcad7] shadow-inner">
                  {user.avatar
                    ? <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    : <span className="font-bold text-[#6938ef] text-3xl">{initials}</span>}
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-white border-2 border-[#6938ef] rounded-full flex items-center justify-center shadow-md hover:bg-[#f4f2ff] transition-colors">
                  <Camera className="w-4 h-4 text-[#6938ef]" />
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="flex-1 space-y-5">
              <div className="flex items-center gap-4">
                <label className="w-28 flex-shrink-0 font-semibold text-[#1a1a2e] text-sm text-right">Họ và tên</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  className="flex-1 bg-[#f8f7fc] border border-[#cbcad7] rounded-xl px-4 py-2.5 font-medium text-sm text-[#1a1a2e] outline-none focus:border-[#6938ef] focus:ring-1 focus:ring-[#6938ef]/20 transition-colors" />
              </div>
              <div className="flex items-center gap-4">
                <label className="w-28 flex-shrink-0 font-semibold text-[#1a1a2e] text-sm text-right">Ngày sinh</label>
                <div className="flex items-center gap-3">
                  {([
                    { value: dobDay, set: setDobDay, opts: DAYS, min: "70px" },
                    { value: dobMonth, set: setDobMonth, opts: MONTHS, min: "70px" },
                    { value: dobYear, set: setDobYear, opts: YEARS, min: "90px" },
                  ] as const).map((s, i) => (
                    <select key={i} value={s.value} onChange={e => (s.set as (v: number) => void)(Number(e.target.value))}
                      className={`bg-[#f8f7fc] border border-[#cbcad7] rounded-xl px-3 py-2.5 font-medium text-sm text-[#1a1a2e] outline-none focus:border-[#6938ef] transition-colors min-w-[${s.min}]`}>
                      {s.opts.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="w-28 flex-shrink-0 font-semibold text-[#1a1a2e] text-sm text-right">Giới tính</label>
                <div className="flex items-center gap-6">
                  {["Nam", "Nữ", "Khác"].map(g => (
                    <label key={g} className="flex items-center gap-2 cursor-pointer group" onClick={() => setGender(g)}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${gender === g ? "border-[#6938ef]" : "border-[#cbcad7] group-hover:border-[#a78bfa]"}`}>
                        {gender === g && <div className="w-2.5 h-2.5 rounded-full bg-[#6938ef]" />}
                      </div>
                      <span className="font-medium text-sm text-[#1a1a2e]">{g}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-28" />
                <button onClick={handleSaveProfile} disabled={saving}
                  className="bg-[#6938ef] hover:bg-[#5a2dd6] disabled:opacity-60 text-white rounded-xl px-6 py-2.5 font-semibold text-sm shadow-[0_2px_8px_rgba(105,56,239,0.3)] transition-all">
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
                {saveMsg && <span className="font-medium text-sm text-emerald-600">✓ {saveMsg}</span>}
              </div>
            </div>
          </div>

          <hr className="border-[#f0f0f5]" />

          {/* Email */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#f0edff] rounded-full flex items-center justify-center flex-shrink-0"><Mail className="w-5 h-5 text-[#6938ef]" /></div>
            <label className="w-28 flex-shrink-0 font-semibold text-[#1a1a2e] text-sm">Địa chỉ email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="flex-1 bg-[#f8f7fc] border border-[#cbcad7] rounded-xl px-4 py-2.5 font-medium text-sm text-[#1a1a2e] outline-none focus:border-[#6938ef] transition-colors max-w-xs" />
            <button onClick={handleUpdateEmail} disabled={emailSaving}
              className="border border-[#6938ef] text-[#6938ef] hover:bg-[#f4f2ff] disabled:opacity-60 rounded-xl px-5 py-2.5 font-semibold text-sm transition-colors">
              {emailSaving ? "Đang lưu..." : "Cập nhật"}
            </button>
            {emailMsg && <span className="font-medium text-sm text-emerald-600">{emailMsg}</span>}
          </div>

          {/* Phone */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#f0edff] rounded-full flex items-center justify-center flex-shrink-0"><Phone className="w-5 h-5 text-[#6938ef]" /></div>
            <label className="w-28 flex-shrink-0 font-semibold text-[#1a1a2e] text-sm">Số điện thoại</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="01234567890"
              className="flex-1 bg-[#f8f7fc] border border-[#cbcad7] rounded-xl px-4 py-2.5 font-medium text-sm text-[#1a1a2e] outline-none focus:border-[#6938ef] transition-colors max-w-xs" />
            <button onClick={handleUpdatePhone} disabled={phoneSaving}
              className="border border-[#6938ef] text-[#6938ef] hover:bg-[#f4f2ff] disabled:opacity-60 rounded-xl px-5 py-2.5 font-semibold text-sm transition-colors">
              {phoneSaving ? "Đang lưu..." : "Cập nhật"}
            </button>
            {phoneMsg && <span className="font-medium text-sm text-emerald-600">{phoneMsg}</span>}
          </div>
        </div>
      )}

      {/* Security */}
      {activeTab === "security" && (
        <div className="space-y-6">
          <div className="bg-[#f8f7fc] rounded-xl border border-[#e8e5f5] p-6">
            <h3 className="font-bold text-[#1a1a2e] text-base mb-4">Đổi mật khẩu</h3>
            <div className="space-y-4 max-w-md">
              {["Mật khẩu hiện tại", "Mật khẩu mới", "Xác nhận mật khẩu mới"].map((label, i) => (
                <div key={i}>
                  <label className="font-semibold text-[#1a1a2e] text-sm mb-1.5 block">{label}</label>
                  <input type="password" placeholder={`Nhập ${label.toLowerCase()}`}
                    className="w-full bg-white border border-[#cbcad7] rounded-xl px-4 py-2.5 font-medium text-sm outline-none focus:border-[#6938ef] transition-colors" />
                </div>
              ))}
              <button className="bg-[#6938ef] hover:bg-[#5a2dd6] text-white rounded-xl px-6 py-2.5 font-semibold text-sm shadow-[0_2px_8px_rgba(105,56,239,0.3)] transition-all mt-2">
                Cập nhật mật khẩu
              </button>
            </div>
          </div>

          {/* 2FA Section */}
          <div className="bg-[#f8f7fc] rounded-xl border border-[#e8e5f5] p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${is2FAEnabled ? 'bg-emerald-100' : 'bg-[#f0edff]'}`}>
                  {is2FAEnabled ? <ShieldCheck className="w-5 h-5 text-emerald-600" /> : <Shield className="w-5 h-5 text-[#6938ef]" />}
                </div>
                <div>
                  <h3 className="font-bold text-[#1a1a2e] text-base">Xác thực 2 bước (2FA)</h3>
                  <p className="font-medium text-[#9794aa] text-sm mt-0.5">
                    Bảo vệ tài khoản bằng Google Authenticator
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  is2FAEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {is2FAEnabled ? 'Đang bật' : 'Đang tắt'}
                </span>
                {is2FAEnabled ? (
                  <button
                    onClick={() => setShowDisable2FA(true)}
                    className="border border-red-300 text-red-500 hover:bg-red-50 rounded-xl px-5 py-2.5 font-semibold text-sm transition-colors"
                  >
                    Tắt 2FA
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/2fa-setup')}
                    className="bg-[#6938ef] hover:bg-[#5a2dd6] text-white rounded-xl px-5 py-2.5 font-semibold text-sm shadow-[0_2px_8px_rgba(105,56,239,0.3)] transition-all"
                  >
                    Bật 2FA
                  </button>
                )}
              </div>
            </div>

            {/* Disable 2FA Dialog */}
            {showDisable2FA && (
              <div className="mt-4 bg-white rounded-xl border border-red-200 p-4">
                <p className="font-medium text-sm text-gray-600 mb-3">
                  Nhập mã 6 chữ số từ ứng dụng xác thực để tắt 2FA:
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={disable2FACode}
                    onChange={e => { if (/^\d*$/.test(e.target.value)) setDisable2FACode(e.target.value); }}
                    placeholder="000000"
                    className="flex-1 max-w-[160px] bg-[#f8f7fc] border border-[#cbcad7] rounded-xl px-4 py-2.5 text-center font-mono text-lg tracking-widest outline-none focus:border-red-400 transition-colors"
                    autoFocus
                  />
                  <button
                    onClick={async () => {
                      if (disable2FACode.length !== 6) return;
                      setDisabling2FA(true); setDisable2FAMsg("");
                      try {
                        const token = localStorage.getItem("access_token")!;
                        await disable2FA(disable2FACode, token);
                        setIs2FAEnabled(false);
                        localStorage.setItem("vtos_2fa_enabled", "false");
                        setShowDisable2FA(false); setDisable2FACode("");
                        setDisable2FAMsg("✓ Đã tắt 2FA");
                      } catch (err: any) {
                        setDisable2FAMsg(err?.message || "Mã không hợp lệ");
                      } finally { setDisabling2FA(false); }
                    }}
                    disabled={disabling2FA || disable2FACode.length !== 6}
                    className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl px-5 py-2.5 font-semibold text-sm transition-colors"
                  >
                    {disabling2FA ? "Đang xử lý..." : "Xác nhận tắt"}
                  </button>
                  <button
                    onClick={() => { setShowDisable2FA(false); setDisable2FACode(""); setDisable2FAMsg(""); }}
                    className="text-gray-400 hover:text-gray-600 font-medium text-sm"
                  >
                    Hủy
                  </button>
                </div>
                {disable2FAMsg && (
                  <p className={`mt-2 font-medium text-sm ${
                    disable2FAMsg.startsWith("✓") ? "text-emerald-600" : "text-red-500"
                  }`}>{disable2FAMsg}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
