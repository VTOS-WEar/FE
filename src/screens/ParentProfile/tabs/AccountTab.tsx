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
      finally { setProfileLoading(false); }
    };
    fetchProfile();
  }, [navigate]);

    useEffect(() => {
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
    <div className="space-y-0">
      {/* Tabs — NB style */}
      <div className="flex items-center gap-3 mb-8">
        {(["personal", "security"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all border-2 ${activeTab === tab
              ? "bg-[#B8A9E8] text-[#1A1A2E] border-[#1A1A2E] shadow-[3px_3px_0_#1A1A2E]"
              : "bg-[#F3F4F6] text-[#4C5769] border-transparent hover:border-[#1A1A2E]/20 hover:bg-[#EDE9FE]"}`}>
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
                <div className="w-28 h-28 bg-[#EDE9FE] rounded-xl flex items-center justify-center border-2 border-[#1A1A2E] shadow-[4px_4px_0_#1A1A2E]">
                  {user.avatar
                    ? <img src={user.avatar} alt="" className="w-full h-full rounded-xl object-cover" />
                    : <span className="font-extrabold text-[#1A1A2E] text-3xl">{initials}</span>}
                </div>
                <button className="absolute bottom-[-4px] right-[-4px] w-9 h-9 bg-[#C8E44D] border-2 border-[#1A1A2E] rounded-lg flex items-center justify-center shadow-[2px_2px_0_#1A1A2E] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                  <Camera className="w-4 h-4 text-[#1A1A2E]" />
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="flex-1 space-y-5">
              <div className="flex items-center gap-4">
                <label className="w-28 flex-shrink-0 font-bold text-[#1A1A2E] text-sm text-right">Họ và tên</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  className={inputClass} />
              </div>
              <div className="flex items-center gap-4">
                <label className="w-28 flex-shrink-0 font-bold text-[#1A1A2E] text-sm text-right">Ngày sinh</label>
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
                <label className="w-28 flex-shrink-0 font-bold text-[#1A1A2E] text-sm text-right">Giới tính</label>
                <div className="flex items-center gap-6">
                  {["Nam", "Nữ", "Khác"].map(g => (
                    <label key={g} className="flex items-center gap-2 cursor-pointer group" onClick={() => setGender(g)}>
                      <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors ${gender === g ? "border-[#1A1A2E] bg-[#B8A9E8] shadow-[2px_2px_0_#1A1A2E]" : "border-[#D1D5DB] group-hover:border-[#1A1A2E]"}`}>
                        {gender === g && <div className="w-2 h-2 rounded-sm bg-[#1A1A2E]" />}
                      </div>
                      <span className="font-bold text-sm text-[#1A1A2E]">{g}</span>
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
                {saveMsg && <span className="font-bold text-sm text-[#065F46]">✓ {saveMsg}</span>}
              </div>
            </div>
          </div>

          <hr className="border-[#1A1A2E]/10 border-t-2" />

          {/* Email */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#EDE9FE] rounded-lg flex items-center justify-center border-2 border-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E] flex-shrink-0"><Mail className="w-5 h-5 text-[#1A1A2E]" /></div>
            <label className="w-28 flex-shrink-0 font-bold text-[#1A1A2E] text-sm">Địa chỉ email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="nb-input h-11 text-sm flex-1 max-w-xs" />
            <button onClick={handleUpdateEmail} disabled={emailSaving}
              className="nb-btn nb-btn-outline text-sm disabled:opacity-50">
              {emailSaving ? "Đang lưu..." : "Cập nhật"}
            </button>
            {emailMsg && <span className="font-bold text-sm text-[#065F46]">{emailMsg}</span>}
          </div>

          {/* Phone */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#EDE9FE] rounded-lg flex items-center justify-center border-2 border-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E] flex-shrink-0"><Phone className="w-5 h-5 text-[#1A1A2E]" /></div>
            <label className="w-28 flex-shrink-0 font-bold text-[#1A1A2E] text-sm">Số điện thoại</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="01234567890"
              className="nb-input h-11 text-sm flex-1 max-w-xs" />
            <button onClick={handleUpdatePhone} disabled={phoneSaving}
              className="nb-btn nb-btn-outline text-sm disabled:opacity-50">
              {phoneSaving ? "Đang lưu..." : "Cập nhật"}
            </button>
            {phoneMsg && <span className="font-bold text-sm text-[#065F46]">{phoneMsg}</span>}
          </div>
        </div>
      )}

      {/* Security */}
      {activeTab === "security" && (
        <div className="space-y-6">
          <div className="nb-card-static p-6">
            <h3 className="font-extrabold text-[#1A1A2E] text-base mb-4">Đổi mật khẩu</h3>
            <div className="space-y-4 max-w-md">
              {["Mật khẩu hiện tại", "Mật khẩu mới", "Xác nhận mật khẩu mới"].map((label, i) => (
                <div key={i}>
                  <label className="font-bold text-[#1A1A2E] text-sm mb-1.5 block">{label}</label>
                  <input type="password" placeholder={`Nhập ${label.toLowerCase()}`}
                    className="nb-input w-full h-11 text-sm" />
                </div>
              ))}
              <button className="nb-btn nb-btn-purple text-sm mt-2">
                Cập nhật mật khẩu ✦
              </button>
            </div>
          </div>

          {/* 2FA Section */}
          <div className="nb-card-static p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 border-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E] ${is2FAEnabled ? 'bg-[#C8E44D]' : 'bg-[#EDE9FE]'}`}>
                  {is2FAEnabled ? <ShieldCheck className="w-5 h-5 text-[#1A1A2E]" /> : <Shield className="w-5 h-5 text-[#1A1A2E]" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-[#1A1A2E] text-base">Xác thực 2 bước (2FA)</h3>
                  <p className="font-medium text-[#6B7280] text-sm mt-0.5">
                    Bảo vệ tài khoản bằng Google Authenticator
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-lg text-xs font-bold border-2 ${
                  is2FAEnabled ? 'bg-[#C8E44D] text-[#1A1A2E] border-[#1A1A2E]' : 'bg-[#F3F4F6] text-[#6B7280] border-transparent'
                }`}>
                  {is2FAEnabled ? 'Đang bật' : 'Đang tắt'}
                </span>
                {is2FAEnabled ? (
                  <button
                    onClick={() => setShowDisable2FA(true)}
                    className="nb-btn nb-btn-outline text-sm !text-[#991B1B] !border-[#FCA5A5] hover:!bg-[#FEE2E2]"
                  >
                    Tắt 2FA
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/2fa-setup')}
                    className="nb-btn nb-btn-purple text-sm"
                  >
                    Bật 2FA ✦
                  </button>
                )}
              </div>
            </div>

            {/* Disable 2FA Dialog */}
            {showDisable2FA && (
              <div className="mt-4 nb-card-static p-4 !border-[#FCA5A5] !bg-[#FFF5F5]">
                <p className="font-medium text-sm text-[#4C5769] mb-3">
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
                    className="nb-input max-w-[160px] h-11 text-center font-mono text-lg tracking-widest"
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
                    className="nb-btn text-sm !bg-[#991B1B] !text-white !border-[#1A1A2E] disabled:opacity-50"
                  >
                    {disabling2FA ? "Đang xử lý..." : "Xác nhận tắt"}
                  </button>
                  <button
                    onClick={() => { setShowDisable2FA(false); setDisable2FACode(""); setDisable2FAMsg(""); }}
                    className="text-[#6B7280] hover:text-[#1A1A2E] font-bold text-sm transition-colors"
                  >
                    Hủy
                  </button>
                </div>
                {disable2FAMsg && (
                  <p className={`mt-2 font-bold text-sm ${
                    disable2FAMsg.startsWith("✓") ? "text-[#065F46]" : "text-[#991B1B]"
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
