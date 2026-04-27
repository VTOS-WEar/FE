import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Camera, Mail, Phone, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getParentProfile, updateParentAvatar, updateParentProfile } from "../../../lib/api/users";

const DAYS = Array.from({ length: 31 }, (_, index) => index + 1);
const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 80 }, (_, index) => CURRENT_YEAR - index);

interface UserInfo {
  userId: string;
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  avatar: string | null;
  gender?: string;
  dateOfBirth?: string;
}

const genderMap: Record<string, number> = { Nam: 1, Nữ: 2, Khác: 3 };

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
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const dobPickerRef = useRef<HTMLInputElement>(null);

  const getStorage = () => (localStorage.getItem("access_token") ? localStorage : sessionStorage);

  const syncUserStorage = (updates: Partial<UserInfo>) => {
    if (!user) return;
    const updated = {
      ...user,
      ...updates,
      userId: updates.userId ?? user.userId ?? user.id,
      id: updates.id ?? user.id ?? user.userId,
    };
    getStorage().setItem("user", JSON.stringify(updated));
    setUser(updated);
  };

  useEffect(() => {
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!raw) {
      navigate("/signin", { replace: true });
      return;
    }

    try {
      const stored = JSON.parse(raw);
      setUser(stored);
      setFullName(stored.fullName || "");
      setEmail(stored.email || "");
      setPhone(stored.phone || "");
    } catch {
      navigate("/signin", { replace: true });
      return;
    }

    const fetchProfile = async () => {
      try {
        const data = await getParentProfile();
        const profile: UserInfo = {
          userId: data.id,
          id: data.id,
          fullName: data.fullName || "",
          email: data.email || "",
          phone: data.phone || "",
          role: data.role || "Parent",
          avatar: data.avatar || null,
          gender: data.gender || "",
          dateOfBirth: data.dob || "",
        };

        setUser(profile);
        setFullName(profile.fullName);
        setEmail(profile.email);
        setPhone(profile.phone || "");

        if (data.gender === "Male") setGender("Nam");
        else if (data.gender === "Female") setGender("Nữ");
        else if (data.gender === "Other") setGender("Khác");
        else setGender("");

        if (data.dob) {
          const parsed = new Date(data.dob);
          if (!Number.isNaN(parsed.getTime())) {
            setDobDay(parsed.getDate());
            setDobMonth(parsed.getMonth() + 1);
            setDobYear(parsed.getFullYear());
          }
        }

        getStorage().setItem("user", JSON.stringify(profile));
        localStorage.setItem("vtos_2fa_enabled", (data.twoFactorEnabled ?? false) ? "true" : "false");
        window.dispatchEvent(new CustomEvent("vtos:user-updated"));
      } catch (error) {
        console.error("Failed to fetch parent profile", error);
      } finally {
        setProfileLoading(false);
      }
    };

    void fetchProfile();
  }, [navigate]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMsg("");

    try {
      const dob = `${dobYear}-${String(dobMonth).padStart(2, "0")}-${String(dobDay).padStart(2, "0")}T00:00:00`;
      await updateParentProfile({
        fullName: fullName || undefined,
        dob,
        gender: gender ? genderMap[gender] : undefined,
      });
      syncUserStorage({ fullName, gender });
      setSaveMsg("Đã lưu thay đổi hồ sơ.");
    } catch (error: any) {
      setSaveMsg(error?.message || "Không thể cập nhật hồ sơ.");
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
      setEmailMsg("Đã cập nhật email.");
    } catch (error: any) {
      setEmailMsg(error?.message || "Không thể cập nhật email.");
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
      setPhoneMsg("Đã cập nhật số điện thoại.");
    } catch (error: any) {
      setPhoneMsg(error?.message || "Không thể cập nhật số điện thoại.");
    } finally {
      setPhoneSaving(false);
      setTimeout(() => setPhoneMsg(""), 3000);
    }
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarMsg("Vui lòng chọn tệp hình ảnh.");
      setTimeout(() => setAvatarMsg(""), 3000);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarMsg("Kích thước tệp phải dưới 5MB.");
      setTimeout(() => setAvatarMsg(""), 3000);
      return;
    }

    setAvatarSaving(true);
    setAvatarMsg("");

    try {
      const response = await updateParentAvatar(file);
      syncUserStorage({ avatar: response.avatarUrl });
      window.dispatchEvent(new CustomEvent("vtos:user-updated"));
      setAvatarMsg("Đã cập nhật ảnh đại diện.");
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    } catch (error: any) {
      setAvatarMsg(error?.message || "Không thể cập nhật ảnh đại diện.");
    } finally {
      setAvatarSaving(false);
      setTimeout(() => setAvatarMsg(""), 3000);
    }
  };

  const initials = useMemo(() => {
    if (!fullName.trim()) return "PH";
    return fullName
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(-2)
      .toUpperCase();
  }, [fullName]);

  if (!user) return <div />;

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse rounded-[28px] border border-gray-200 bg-slate-50 p-6">
          <div className="h-6 w-44 rounded-full bg-gray-200" />
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="h-24 w-24 rounded-[24px] bg-gray-200" />
            <div className="flex-1 space-y-3">
              <div className="h-5 w-48 rounded-full bg-gray-200" />
              <div className="h-4 w-64 rounded-full bg-gray-200" />
            </div>
          </div>
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="animate-pulse rounded-[28px] border border-gray-200 bg-slate-50 p-6">
            <div className="h-5 w-36 rounded-full bg-gray-200" />
            <div className="mt-5 space-y-4">
              <div className="h-12 rounded-[16px] bg-gray-200" />
              <div className="h-12 rounded-[16px] bg-gray-200" />
              <div className="h-12 rounded-[16px] bg-gray-200" />
            </div>
          </div>
          <div className="animate-pulse rounded-[28px] border border-gray-200 bg-slate-50 p-6">
            <div className="h-5 w-36 rounded-full bg-gray-200" />
            <div className="mt-5 space-y-4">
              <div className="h-12 rounded-[16px] bg-gray-200" />
              <div className="h-12 rounded-[16px] bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const inputClass =
    "h-12 w-full rounded-[16px] border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-900 outline-none transition-all focus:border-violet-300 focus:ring-4 focus:ring-violet-100";

  return (
    <div className="space-y-5">
      <div className="space-y-5">
        <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-soft-sm lg:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Personal profile</p>
              <h2 className="mt-2 text-2xl font-black text-gray-900">Thông tin cá nhân</h2>
            </div>
          </div>

          <div className="mt-5 grid items-stretch gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="rounded-[16px] border border-gray-200 bg-slate-50 p-3">
              <div className="relative h-full min-h-[280px] overflow-hidden rounded-[12px] border border-gray-200 bg-violet-50">
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="text-4xl font-black text-violet-700">{initials}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarSaving}
                  className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-[10px] border border-gray-200 bg-emerald-300 text-gray-900 shadow-soft-sm transition-all hover:-translate-y-0.5 disabled:opacity-60"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </div>
            </div>

            <div className="grid gap-4 max-w-[780px]">
            <div className="grid gap-2">
              <label className="text-sm font-bold text-slate-600">Họ và tên</label>
              <input type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} className={inputClass} />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-bold text-slate-600">Ngày sinh</label>
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                <input
                  type="text"
                  inputMode="numeric"
                  value={dobDay}
                  onChange={(event) => {
                    const next = Number(event.target.value.replace(/[^\d]/g, ""));
                    if (Number.isNaN(next)) return;
                    setDobDay(Math.min(31, Math.max(1, next)));
                  }}
                  className={inputClass}
                  placeholder="Ngày"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  value={dobMonth}
                  onChange={(event) => {
                    const next = Number(event.target.value.replace(/[^\d]/g, ""));
                    if (Number.isNaN(next)) return;
                    setDobMonth(Math.min(12, Math.max(1, next)));
                  }}
                  className={inputClass}
                  placeholder="Tháng"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  value={dobYear}
                  onChange={(event) => {
                    const next = Number(event.target.value.replace(/[^\d]/g, ""));
                    if (Number.isNaN(next)) return;
                    setDobYear(Math.min(CURRENT_YEAR, Math.max(CURRENT_YEAR - 80, next)));
                  }}
                  className={inputClass}
                  placeholder="Năm"
                />
                <button
                  type="button"
                  onClick={() => {
                    const picker = dobPickerRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
                    if (!picker) return;
                    if (picker.showPicker) picker.showPicker();
                    else picker.click();
                  }}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-[16px] border border-gray-200 bg-slate-50 text-slate-600 transition-all hover:bg-white"
                  aria-label="Chọn ngày sinh"
                  title="Chọn ngày sinh"
                >
                  <CalendarDays className="h-5 w-5" />
                </button>
              </div>
              <input
                ref={dobPickerRef}
                type="date"
                value={`${dobYear}-${String(dobMonth).padStart(2, "0")}-${String(dobDay).padStart(2, "0")}`}
                min={`${CURRENT_YEAR - 80}-01-01`}
                max={`${CURRENT_YEAR}-12-31`}
                onChange={(event) => {
                  if (!event.target.value) return;
                  const parsed = new Date(event.target.value);
                  if (Number.isNaN(parsed.getTime())) return;
                  setDobDay(parsed.getDate());
                  setDobMonth(parsed.getMonth() + 1);
                  setDobYear(parsed.getFullYear());
                }}
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-bold text-slate-600">Giới tính</label>
              <div className="flex flex-wrap gap-3">
                {["Nam", "Nữ", "Khác"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setGender(option)}
                    className={`rounded-[16px] border px-4 py-3 text-sm font-extrabold transition-all ${
                      gender === option
                        ? "border-violet-200 bg-violet-50 text-violet-700 shadow-soft-sm"
                        : "border-gray-200 bg-slate-50 text-slate-600 hover:bg-white"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-[14px] border border-gray-200 bg-gradient-to-r from-[#7C63E6] via-[#8F79EB] to-[#6F56E0] px-6 text-sm font-extrabold text-white shadow-[0_10px_22px_rgba(124,99,230,0.28)] transition-all duration-200 hover:-translate-y-[2px] hover:brightness-110 hover:shadow-[0_14px_28px_rgba(124,99,230,0.35)] active:translate-y-0 active:shadow-[0_8px_18px_rgba(124,99,230,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                <span className="pointer-events-none absolute -left-10 top-0 h-full w-14 -skew-x-12 bg-white/25 blur-[1px] transition-all duration-300 group-hover:left-[110%]" />
                <UserRound className="relative h-4.5 w-4.5" />
                {saving ? "Đang lưu..." : "Lưu hồ sơ"}
              </button>
              {saveMsg ? <span className="text-sm font-bold text-slate-600">{saveMsg}</span> : null}
            </div>
            </div>
          </div>
          {avatarMsg ? (
            <div className="mt-3 inline-flex rounded-[12px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
              {avatarMsg}
            </div>
          ) : null}
        </section>

        <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-soft-sm">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Contact information</p>
            <h2 className="mt-2 text-2xl font-black text-gray-900">Thông tin liên hệ</h2>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[22px] border border-gray-200 bg-slate-50 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-[16px] border border-gray-200 bg-white p-3 text-violet-700">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Email</p>
                  <h3 className="text-lg font-black text-gray-900">Email đăng nhập</h3>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} />
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleUpdateEmail}
                    disabled={emailSaving}
                    className="rounded-[16px] border border-gray-200 bg-white px-4 py-3 text-sm font-extrabold text-gray-900 shadow-soft-sm transition-all hover:-translate-y-0.5 disabled:opacity-60"
                  >
                    {emailSaving ? "Đang lưu..." : "Cập nhật email"}
                  </button>
                  {emailMsg ? <span className="text-sm font-bold text-slate-600">{emailMsg}</span> : null}
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-gray-200 bg-slate-50 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-[16px] border border-gray-200 bg-white p-3 text-emerald-700">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Phone</p>
                  <h3 className="text-lg font-black text-gray-900">Số điện thoại</h3>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="0123456789"
                  className={inputClass}
                />
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleUpdatePhone}
                    disabled={phoneSaving}
                    className="rounded-[16px] border border-gray-200 bg-white px-4 py-3 text-sm font-extrabold text-gray-900 shadow-soft-sm transition-all hover:-translate-y-0.5 disabled:opacity-60"
                  >
                    {phoneSaving ? "Đang lưu..." : "Cập nhật số điện thoại"}
                  </button>
                  {phoneMsg ? <span className="text-sm font-bold text-slate-600">{phoneMsg}</span> : null}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
