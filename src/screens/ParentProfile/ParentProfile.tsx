import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  LogOut,
  ShoppingBag,
  History,
  Star,
  Settings,
  GraduationCap,
  Camera,
} from "lucide-react";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { updateParentProfile, getParentProfile } from "../../lib/api/users";

/* ─── Sidebar Menu Items ─── */
const SIDEBAR_ITEMS = [
  { key: "info", label: "Thông tin tài khoản", icon: User, href: "/parentprofile" },
  { key: "children", label: "Quản lý học sinh", icon: GraduationCap, href: "/parentprofile" },
  { key: "orders", label: "Đơn hàng", icon: ShoppingBag, href: "/parentprofile" },
  { key: "history", label: "Lịch sử", icon: History, href: "/parentprofile" },
  { key: "reviews", label: "Đánh giá", icon: Star, href: "/parentprofile" },
  { key: "settings", label: "Cài đặt tài khoản", icon: Settings, href: "/parentprofile" },
];

/* ─── Helper: generate day/month/year options ─── */
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const YEARS = Array.from({ length: 80 }, (_, i) => 2025 - i);

interface UserInfo {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  avatar: string | null;
  gender?: string;
  dateOfBirth?: string;
}

export const ParentProfile = (): JSX.Element => {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("info");
  const [activeTab, setActiveTab] = useState<"personal" | "security">("personal");

  /* ── User data ── */
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

  useEffect(() => {
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!raw) { navigate("/signin", { replace: true }); return; }

    // Set initial data from localStorage for immediate render
    try {
      const u = JSON.parse(raw);
      setUser(u);
      setFullName(u.fullName || "");
      setEmail(u.email || "");
      setPhone(u.phone || "");
    } catch { navigate("/signin", { replace: true }); return; }

    // Then fetch real data from DB
    const fetchProfile = async () => {
      try {
        const data = await getParentProfile();
        const u: UserInfo = {
          id: data.id,
          fullName: data.fullName || "",
          email: data.email || "",
          phone: data.phone || "",
          role: data.role || "Parent",
          avatar: null,
          gender: data.gender || "",
          dateOfBirth: data.dob || "",
        };
        setUser(u);
        setFullName(u.fullName);
        setEmail(u.email);
        setPhone(u.phone || "");

        // Parse gender from DB (returns "Male"/"Female"/"Other")
        if (data.gender === "Male") setGender("Nam");
        else if (data.gender === "Female") setGender("Nữ");
        else if (data.gender === "Other") setGender("Khác");
        else setGender("");

        // Parse DOB from DB
        if (data.dob) {
          const d = new Date(data.dob);
          if (!isNaN(d.getTime())) {
            setDobDay(d.getDate());
            setDobMonth(d.getMonth() + 1);
            setDobYear(d.getFullYear());
          }
        }

        // Sync localStorage with fresh DB data
        const storage = localStorage.getItem("access_token") ? localStorage : sessionStorage;
        storage.setItem("user", JSON.stringify(u));
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        // Keep localStorage data as fallback
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    localStorage.removeItem("expires_in");
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("expires_in");
    navigate("/signin", { replace: true });
  };

  const getStorage = () => localStorage.getItem("access_token") ? localStorage : sessionStorage;

  /** Map FE gender label → BE enum (Male=1, Female=2, Other=3) */
  const genderMap: Record<string, number> = {
    "Nam": 1, "Nữ": 2, "Khác": 3,
  };

  const syncUserStorage = (updates: Partial<UserInfo>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    getStorage().setItem("user", JSON.stringify(updated));
    setUser(updated);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      const dob = `${dobYear}-${String(dobMonth).padStart(2, '0')}-${String(dobDay).padStart(2, '0')}T00:00:00`;
      await updateParentProfile({
        fullName: fullName || undefined,
        dob: dob,
        gender: gender ? genderMap[gender] : undefined,
      });
      syncUserStorage({ fullName, gender });
      setSaveMsg("Đã lưu thành công!");
    } catch (err: any) {
      setSaveMsg("Lỗi: " + (err?.message || "Không thể cập nhật"));
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 3000);
    }
  };

  const handleUpdateEmail = async () => {
    if (!email.trim()) return;
    setEmailSaving(true);
    setEmailMsg("");
    try {
      await updateParentProfile({ email });
      syncUserStorage({ email });
      setEmailMsg("✓ Đã cập nhật!");
    } catch (err: any) {
      setEmailMsg("Lỗi: " + (err?.message || "Không thể cập nhật"));
    } finally {
      setEmailSaving(false);
      setTimeout(() => setEmailMsg(""), 3000);
    }
  };

  const handleUpdatePhone = async () => {
    if (!phone.trim()) return;
    setPhoneSaving(true);
    setPhoneMsg("");
    try {
      await updateParentProfile({ phone });
      syncUserStorage({ phone });
      setPhoneMsg("✓ Đã cập nhật!");
    } catch (err: any) {
      setPhoneMsg("Lỗi: " + (err?.message || "Không thể cập nhật"));
    } finally {
      setPhoneSaving(false);
      setTimeout(() => setPhoneMsg(""), 3000);
    }
  };

  if (!user) return <div />;

  const initials = fullName
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .slice(-2)
    .toUpperCase();

  return (
    <GuestLayout bgColor="transparent">
      <main className="flex-1 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 30%, #e0e7ff 60%, #ede9fe 100%)" }}>
        {/* Decorative blobs */}
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full opacity-30" style={{ background: "radial-gradient(circle, #c4b5fd 0%, transparent 70%)" }} />
        <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] rounded-full opacity-25" style={{ background: "radial-gradient(circle, #a5b4fc 0%, transparent 70%)" }} />

        <div className="container mx-auto px-4 py-6 relative z-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6 [font-family:'Montserrat',Helvetica]">
            <Link to="/homepage" className="font-medium text-[#4c5769] text-sm hover:text-[#6938ef] transition-colors">
              Trang chủ
            </Link>
            <span className="text-[#cbcad7] text-sm">&gt;</span>
            <span className="font-semibold text-black text-sm">Thông tin tài khoản</span>
          </div>

          {/* Main Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-[1.5rem] shadow-[0_4px_30px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col lg:flex-row min-h-[560px]">

            {/* ── Left Sidebar ── */}
            <div className="lg:w-[280px] flex-shrink-0 border-r border-[#f0f0f5] p-6 flex flex-col">
              {/* User info */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 bg-gradient-to-br from-[#6938ef] to-[#a78bfa] rounded-full flex items-center justify-center shadow-md">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <p className="[font-family:'Montserrat',Helvetica] font-medium text-black/50 text-xs">Tài khoản</p>
                  <p className="[font-family:'Montserrat',Helvetica] font-bold text-[#1a1a2e] text-sm">{user.fullName}</p>
                </div>
              </div>

              {/* Menu */}
              <nav className="flex flex-col gap-1.5 flex-1">
                {SIDEBAR_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.key === activeMenu;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setActiveMenu(item.key)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all [font-family:'Montserrat',Helvetica] font-semibold text-sm ${isActive
                          ? "bg-[#6938ef] text-white shadow-[0_2px_8px_rgba(105,56,239,0.35)]"
                          : "text-[#4c5769] hover:bg-[#f4f2ff] hover:text-[#6938ef]"
                        }`}
                    >
                      <Icon className="w-[18px] h-[18px]" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all [font-family:'Montserrat',Helvetica] font-semibold text-sm text-red-500 hover:bg-red-50 mt-4 border border-red-200"
              >
                <LogOut className="w-[18px] h-[18px]" />
                Logout
              </button>
            </div>

            {/* ── Right Content ── */}
            <div className="flex-1 p-6 lg:p-8">
              {/* Tabs */}
              <div className="flex items-center gap-3 mb-8">
                <button
                  onClick={() => setActiveTab("personal")}
                  className={`px-5 py-2.5 rounded-full [font-family:'Montserrat',Helvetica] font-semibold text-sm transition-all ${activeTab === "personal"
                      ? "bg-[#6938ef] text-white shadow-[0_2px_8px_rgba(105,56,239,0.3)]"
                      : "bg-[#f4f2ff] text-[#6938ef] hover:bg-[#ede9fe]"
                    }`}
                >
                  Thông tin cá nhân
                </button>
                <button
                  onClick={() => setActiveTab("security")}
                  className={`px-5 py-2.5 rounded-full [font-family:'Montserrat',Helvetica] font-semibold text-sm transition-all ${activeTab === "security"
                      ? "bg-[#6938ef] text-white shadow-[0_2px_8px_rgba(105,56,239,0.3)]"
                      : "bg-[#f4f2ff] text-[#6938ef] hover:bg-[#ede9fe]"
                    }`}
                >
                  Bảo mật
                </button>
              </div>

              {/* Tab: Personal Info */}
              {activeTab === "personal" && (
                <div className="space-y-8">
                  {/* Avatar + Form */}
                  <div className="flex flex-col md:flex-row gap-8">
                    {/* Avatar */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative">
                        <div className="w-28 h-28 bg-[#f0edff] rounded-full flex items-center justify-center border-[3px] border-[#cbcad7] shadow-inner">
                          {user.avatar ? (
                            <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span className="[font-family:'Montserrat',Helvetica] font-bold text-[#6938ef] text-3xl">{initials}</span>
                          )}
                        </div>
                        <button className="absolute bottom-0 right-0 w-8 h-8 bg-white border-2 border-[#6938ef] rounded-full flex items-center justify-center shadow-md hover:bg-[#f4f2ff] transition-colors">
                          <Camera className="w-4 h-4 text-[#6938ef]" />
                        </button>
                      </div>
                    </div>

                    {/* Form fields */}
                    <div className="flex-1 space-y-5">
                      {/* Full Name */}
                      <div className="flex items-center gap-4">
                        <label className="w-28 flex-shrink-0 [font-family:'Montserrat',Helvetica] font-semibold text-[#1a1a2e] text-sm text-right">
                          Họ và tên
                        </label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="flex-1 bg-[#f8f7fc] border border-[#cbcad7] rounded-xl px-4 py-2.5 [font-family:'Montserrat',Helvetica] font-medium text-sm text-[#1a1a2e] outline-none focus:border-[#6938ef] focus:ring-1 focus:ring-[#6938ef]/20 transition-colors"
                        />
                      </div>

                      {/* DOB */}
                      <div className="flex items-center gap-4">
                        <label className="w-28 flex-shrink-0 [font-family:'Montserrat',Helvetica] font-semibold text-[#1a1a2e] text-sm text-right">
                          Ngày sinh
                        </label>
                        <div className="flex items-center gap-3">
                          <select
                            value={dobDay}
                            onChange={(e) => setDobDay(Number(e.target.value))}
                            className="bg-[#f8f7fc] border border-[#cbcad7] rounded-xl px-3 py-2.5 [font-family:'Montserrat',Helvetica] font-medium text-sm text-[#1a1a2e] outline-none focus:border-[#6938ef] transition-colors min-w-[70px]"
                          >
                            {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                          </select>
                          <select
                            value={dobMonth}
                            onChange={(e) => setDobMonth(Number(e.target.value))}
                            className="bg-[#f8f7fc] border border-[#cbcad7] rounded-xl px-3 py-2.5 [font-family:'Montserrat',Helvetica] font-medium text-sm text-[#1a1a2e] outline-none focus:border-[#6938ef] transition-colors min-w-[70px]"
                          >
                            {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                          </select>
                          <select
                            value={dobYear}
                            onChange={(e) => setDobYear(Number(e.target.value))}
                            className="bg-[#f8f7fc] border border-[#cbcad7] rounded-xl px-3 py-2.5 [font-family:'Montserrat',Helvetica] font-medium text-sm text-[#1a1a2e] outline-none focus:border-[#6938ef] transition-colors min-w-[90px]"
                          >
                            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                      </div>

                      {/* Gender */}
                      <div className="flex items-center gap-4">
                        <label className="w-28 flex-shrink-0 [font-family:'Montserrat',Helvetica] font-semibold text-[#1a1a2e] text-sm text-right">
                          Giới tính
                        </label>
                        <div className="flex items-center gap-6">
                          {["Nam", "Nữ", "Khác"].map((g) => (
                            <label key={g} className="flex items-center gap-2 cursor-pointer group" onClick={() => setGender(g)}>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${gender === g ? "border-[#6938ef]" : "border-[#cbcad7] group-hover:border-[#a78bfa]"}`}>
                                {gender === g && <div className="w-2.5 h-2.5 rounded-full bg-[#6938ef]" />}
                              </div>
                              <span className="[font-family:'Montserrat',Helvetica] font-medium text-sm text-[#1a1a2e]">{g}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Save button */}
                      <div className="flex items-center gap-4">
                        <div className="w-28" />
                        <button
                          onClick={handleSaveProfile}
                          disabled={saving}
                          className="bg-[#6938ef] hover:bg-[#5a2dd6] disabled:opacity-60 text-white rounded-xl px-6 py-2.5 [font-family:'Montserrat',Helvetica] font-semibold text-sm shadow-[0_2px_8px_rgba(105,56,239,0.3)] transition-all"
                        >
                          {saving ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                        {saveMsg && (
                          <span className="[font-family:'Montserrat',Helvetica] font-medium text-sm text-emerald-600 animate-in fade-in duration-300">
                            ✓ {saveMsg}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <hr className="border-[#f0f0f5]" />

                  {/* Email */}
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#f0edff] rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-[#6938ef]" />
                    </div>
                    <label className="w-28 flex-shrink-0 [font-family:'Montserrat',Helvetica] font-semibold text-[#1a1a2e] text-sm">
                      Địa chỉ email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 bg-[#f8f7fc] border border-[#cbcad7] rounded-xl px-4 py-2.5 [font-family:'Montserrat',Helvetica] font-medium text-sm text-[#1a1a2e] outline-none focus:border-[#6938ef] transition-colors max-w-xs"
                    />
                    <button
                      onClick={handleUpdateEmail}
                      disabled={emailSaving}
                      className="border border-[#6938ef] text-[#6938ef] hover:bg-[#f4f2ff] disabled:opacity-60 rounded-xl px-5 py-2.5 [font-family:'Montserrat',Helvetica] font-semibold text-sm transition-colors"
                    >
                      {emailSaving ? "Đang lưu..." : "Cập nhật"}
                    </button>
                    {emailMsg && <span className="[font-family:'Montserrat',Helvetica] font-medium text-sm text-emerald-600">{emailMsg}</span>}
                  </div>

                  {/* Phone */}
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#f0edff] rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-[#6938ef]" />
                    </div>
                    <label className="w-28 flex-shrink-0 [font-family:'Montserrat',Helvetica] font-semibold text-[#1a1a2e] text-sm">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01234567890"
                      className="flex-1 bg-[#f8f7fc] border border-[#cbcad7] rounded-xl px-4 py-2.5 [font-family:'Montserrat',Helvetica] font-medium text-sm text-[#1a1a2e] outline-none focus:border-[#6938ef] transition-colors max-w-xs"
                    />
                    <button
                      onClick={handleUpdatePhone}
                      disabled={phoneSaving}
                      className="border border-[#6938ef] text-[#6938ef] hover:bg-[#f4f2ff] disabled:opacity-60 rounded-xl px-5 py-2.5 [font-family:'Montserrat',Helvetica] font-semibold text-sm transition-colors"
                    >
                      {phoneSaving ? "Đang lưu..." : "Cập nhật"}
                    </button>
                    {phoneMsg && <span className="[font-family:'Montserrat',Helvetica] font-medium text-sm text-emerald-600">{phoneMsg}</span>}
                  </div>
                </div>
              )}

              {/* Tab: Security */}
              {activeTab === "security" && (
                <div className="space-y-6">
                  <div className="bg-[#f8f7fc] rounded-xl border border-[#e8e5f5] p-6">
                    <h3 className="[font-family:'Montserrat',Helvetica] font-bold text-[#1a1a2e] text-base mb-4">
                      Đổi mật khẩu
                    </h3>
                    <div className="space-y-4 max-w-md">
                      <div>
                        <label className="[font-family:'Montserrat',Helvetica] font-semibold text-[#1a1a2e] text-sm mb-1.5 block">
                          Mật khẩu hiện tại
                        </label>
                        <input
                          type="password"
                          placeholder="Nhập mật khẩu hiện tại"
                          className="w-full bg-white border border-[#cbcad7] rounded-xl px-4 py-2.5 [font-family:'Montserrat',Helvetica] font-medium text-sm outline-none focus:border-[#6938ef] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="[font-family:'Montserrat',Helvetica] font-semibold text-[#1a1a2e] text-sm mb-1.5 block">
                          Mật khẩu mới
                        </label>
                        <input
                          type="password"
                          placeholder="Nhập mật khẩu mới"
                          className="w-full bg-white border border-[#cbcad7] rounded-xl px-4 py-2.5 [font-family:'Montserrat',Helvetica] font-medium text-sm outline-none focus:border-[#6938ef] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="[font-family:'Montserrat',Helvetica] font-semibold text-[#1a1a2e] text-sm mb-1.5 block">
                          Xác nhận mật khẩu mới
                        </label>
                        <input
                          type="password"
                          placeholder="Nhập lại mật khẩu mới"
                          className="w-full bg-white border border-[#cbcad7] rounded-xl px-4 py-2.5 [font-family:'Montserrat',Helvetica] font-medium text-sm outline-none focus:border-[#6938ef] transition-colors"
                        />
                      </div>
                      <button className="bg-[#6938ef] hover:bg-[#5a2dd6] text-white rounded-xl px-6 py-2.5 [font-family:'Montserrat',Helvetica] font-semibold text-sm shadow-[0_2px_8px_rgba(105,56,239,0.3)] transition-all mt-2">
                        Cập nhật mật khẩu
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </GuestLayout>
  );
};
