import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Camera, Mail, Phone, UserRound } from "lucide-react";
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
    <div className="space-y-6">
      <section className="rounded-[28px] border border-gray-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6 shadow-soft-sm lg:p-7">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[24px] border border-gray-200 bg-violet-50 shadow-soft-sm">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-black text-violet-700">{initials}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarSaving}
              className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-[14px] border border-gray-200 bg-emerald-300 text-gray-900 shadow-soft-sm transition-all hover:-translate-y-0.5 disabled:opacity-60"
            >
              <Camera className="h-4.5 w-4.5" />
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Hồ sơ phụ huynh</p>
            <h1 className="mt-1 text-2xl font-black text-gray-900">{fullName || "Phụ huynh"}</h1>
            <p className="mt-1 text-sm font-medium text-slate-600">Quản lý thông tin cá nhân và kênh liên hệ tài khoản.</p>
            {avatarMsg ? <p className="mt-3 text-sm font-bold text-slate-700">{avatarMsg}</p> : null}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-soft-sm lg:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Personal profile</p>
              <h2 className="mt-2 text-2xl font-black text-gray-900">Thông tin cá nhân</h2>
            </div>
            <div className="rounded-[16px] border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-extrabold text-violet-700">
              Đồng bộ toàn bộ parent profile
            </div>
          </div>

          <div className="mt-6 grid gap-5">
            <div className="grid gap-2">
              <label className="text-sm font-bold text-slate-600">Họ và tên</label>
              <input type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} className={inputClass} />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-bold text-slate-600">Ngày sinh</label>
              <div className="grid gap-3 sm:grid-cols-3">
                <select value={dobDay} onChange={(event) => setDobDay(Number(event.target.value))} className={inputClass}>
                  {DAYS.map((value) => (
                    <option key={value} value={value}>
                      Ngày {value}
                    </option>
                  ))}
                </select>
                <select value={dobMonth} onChange={(event) => setDobMonth(Number(event.target.value))} className={inputClass}>
                  {MONTHS.map((value) => (
                    <option key={value} value={value}>
                      Tháng {value}
                    </option>
                  ))}
                </select>
                <select value={dobYear} onChange={(event) => setDobYear(Number(event.target.value))} className={inputClass}>
                  {YEARS.map((value) => (
                    <option key={value} value={value}>
                      Năm {value}
                    </option>
                  ))}
                </select>
              </div>
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
                className="inline-flex items-center gap-2 rounded-[16px] border border-gray-200 bg-violet-500 px-5 py-3 text-sm font-extrabold text-white shadow-soft-sm transition-all hover:-translate-y-0.5 disabled:opacity-60"
              >
                <UserRound className="h-4.5 w-4.5" />
                {saving ? "Đang lưu..." : "Lưu hồ sơ"}
              </button>
              {saveMsg ? <span className="text-sm font-bold text-slate-600">{saveMsg}</span> : null}
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-soft-sm">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Contact information</p>
            <h2 className="mt-2 text-2xl font-black text-gray-900">Thông tin liên hệ</h2>
          </div>

          <div className="mt-6 space-y-5">
            <div className="rounded-[22px] border border-gray-200 bg-slate-50 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-[16px] border border-gray-200 bg-white p-3 text-violet-700">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Email</p>
                  <h3 className="text-lg font-black text-gray-900">Email đăng nhập</h3>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
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

            <div className="rounded-[22px] border border-gray-200 bg-slate-50 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-[16px] border border-gray-200 bg-white p-3 text-emerald-700">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Phone</p>
                  <h3 className="text-lg font-black text-gray-900">Số điện thoại</h3>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
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
