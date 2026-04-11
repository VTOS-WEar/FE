import { useEffect, useLayoutEffect, useState, useRef } from "react";
import { useNavigate, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  User, LogOut, ShoppingBag, History, Star, Settings, GraduationCap, ChevronRight
} from "lucide-react";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { AnimatePresence, motion } from "framer-motion";
import { getParentProfile } from "../../lib/api/users";

/* ─── Sidebar Menu Items ─── */
const SIDEBAR_ITEMS = [
  { label: "Thông tin tài khoản", icon: User, to: "/parentprofile/account" },
  { label: "Quản lý học sinh", icon: GraduationCap, to: "/parentprofile/students" },
  { label: "Đơn hàng", icon: ShoppingBag, to: "/parentprofile/orders" },
  { label: "Lịch sử", icon: History, to: "/parentprofile/history" },
  { label: "Đánh giá", icon: Star, to: "/parentprofile/reviews" },
  { label: "Cài đặt tài khoản", icon: Settings, to: "/parentprofile/settings" },
];

export const ParentProfile = (): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const prevPathRef = useRef(location.pathname);
  const [showLoader, setShowLoader] = useState(false);

  /* ── User state (reactive: re-renders on avatar/name update) ── */
  const [user, setUser] = useState<{ fullName?: string; avatar?: string | null } | null>(() => {
    try {
      const raw = localStorage.getItem("user") ?? sessionStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  useEffect(() => {
    if (!user) navigate("/signin", { replace: true });
  }, [navigate, user]);

  useEffect(() => {
    const refresh = () => {
      try {
        const raw = localStorage.getItem("user") ?? sessionStorage.getItem("user");
        if (raw) setUser(JSON.parse(raw));
      } catch {}
    };
    window.addEventListener("vtos:user-updated", refresh);
    return () => window.removeEventListener("vtos:user-updated", refresh);
  }, []);

  // Fetch avatar + fullName from API on mount so sidebar shows immediately after login
  useEffect(() => {
    const syncFromApi = async () => {
      try {
        const data = await getParentProfile();
        const storage = localStorage.getItem("access_token") ? localStorage : sessionStorage;
        const raw = storage.getItem("user");
        if (!raw) return;
        const stored = JSON.parse(raw);
        const updated = { ...stored, avatar: data.avatar ?? stored.avatar, fullName: data.fullName || stored.fullName };
        storage.setItem("user", JSON.stringify(updated));
        setUser(updated);
      } catch { /* non-critical */ }
    };
    syncFromApi();
  }, []);

  // useLayoutEffect fires after DOM commit but BEFORE browser paint
  // — guarantees the loader is visible before the user sees anything
  useLayoutEffect(() => {
    if (location.pathname !== prevPathRef.current) {
      prevPathRef.current = location.pathname;
      setShowLoader(true);
    }
  }, [location.pathname]);

  // Timer: dismiss loader after overlay has been visible
  useEffect(() => {
    if (!showLoader) return;
    const t = setTimeout(() => setShowLoader(false), 400);
    return () => clearTimeout(t);
  }, [showLoader]);

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      ["access_token", "user", "expires_in"].forEach(k => {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      });
      navigate("/signin", { replace: true });
    }, 400);
  };

  if (!user) return <div />;

  return (
    <GuestLayout bgColor="#FFF8F0" mainClassName="flex-1">
      <div className="relative z-10 max-w-[1200px] mx-auto px-4 lg:px-8 py-8 md:py-12 nb-fade-in">
        {/* ───── Breadcrumb ───── */}
        <nav className="mb-6 flex items-center gap-2 text-sm font-bold">
          <a href="/" className="text-[#6B7280] hover:text-[#1A1A2E] transition-colors">Trang chủ</a>
          <span className="text-[#6B7280]">/</span>
          <span className="text-[#1A1A2E]">Hồ sơ phụ huynh</span>
        </nav>

        {/* ───── Main Layout — NB Card ───── */}
        <div className="nb-card-static overflow-hidden rounded-2xl flex flex-col lg:flex-row min-h-[500px]">
          {/* ── Left Sidebar ── */}
          <div className="lg:w-[280px] flex-shrink-0 border-b-2 lg:border-b-0 lg:border-r-2 border-[#1A1A2E] bg-[#FAFAF5] p-5 xl:p-6 flex flex-col">
            {/* User info */}
            <div className="flex items-center gap-3.5 mb-8">
              <div className="w-12 h-12 bg-[#EDE9FE] rounded-xl flex items-center justify-center border-2 border-[#1A1A2E] shadow-[3px_3px_0_#1A1A2E]">
                {user.avatar
                  ? <img src={user.avatar} alt="" className="w-full h-full rounded-xl object-cover" />
                  : <User className="w-5 h-5 text-[#1A1A2E]" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-[#6B7280] text-[10px] mb-0.5 uppercase tracking-widest">Tài khoản</p>
                <p className="font-extrabold text-[#1A1A2E] text-[16px] leading-tight truncate" title={user.fullName}>{user.fullName}</p>
              </div>
            </div>

            {/* Nav Menu */}
            <nav className="flex flex-col gap-1.5 flex-1">
              {SIDEBAR_ITEMS.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                  >
                    {({ isActive }) => (
                      <div
                        className={`group relative flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all font-bold text-[13px] border-2 ${isActive
                          ? "bg-[#B8A9E8] text-[#1A1A2E] border-[#1A1A2E] shadow-[3px_3px_0_#1A1A2E]"
                          : "text-[#4C5769] border-transparent hover:bg-[#EDE9FE] hover:border-[#1A1A2E]/20"
                          }`}
                      >
                        <Icon className={`w-[18px] h-[18px] transition-colors ${isActive ? "text-[#1A1A2E]" : "text-[#4C5769] group-hover:text-[#1A1A2E]"}`} />
                        <span className="flex-1">{item.label}</span>
                        {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="mt-6 pt-5 border-t-2 border-[#1A1A2E]/10">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all font-bold text-[13px] text-[#991B1B] hover:bg-[#FEE2E2] border-2 border-transparent hover:border-[#991B1B]/30"
              >
                <LogOut className={`w-[18px] h-[18px] ${isLoggingOut ? "animate-spin" : ""}`} />
                {isLoggingOut ? "Đang xuất..." : "Đăng Xuất"}
              </button>
            </div>
          </div>

          {/* ── Right Content ── */}
          <div className="flex-1 min-w-0 bg-white relative overflow-hidden">
            {/* Loading overlay — shown briefly on tab change before new content mounts */}
            <AnimatePresence>
              {showLoader && (
                <motion.div
                  key="tab-loader"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 z-10 flex items-center justify-center bg-white"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-[3px] border-[#EDE9FE] border-t-[#1A1A2E] animate-spin" />
                    <p className="text-xs font-bold text-[#6B7280] tracking-wide">Đang tải...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Content — only mounts after loader clears */}
            <AnimatePresence mode="wait">
              {!showLoader && (
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="h-full p-5 lg:p-8"
                >
                  <Outlet />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </GuestLayout>
  );
};
