import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ChevronRight, GraduationCap, History, LifeBuoy, LogOut, MapPinHouse, ScanLine, Settings, ShoppingBag, Star, User, WalletCards } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { getParentProfile } from "../../lib/api/users";

const SECTION_ITEMS = [
  { label: "Tài khoản", description: "Thông tin cá nhân", icon: User, to: "/parentprofile/account" },
  { label: "Sổ địa chỉ", description: "Địa chỉ giao hàng", icon: MapPinHouse, to: "/parentprofile/address-book" },
  { label: "Học sinh", description: "Liên kết hồ sơ", icon: GraduationCap, to: "/parentprofile/students" },
  { label: "Đơn hàng", description: "Đơn theo trường", icon: ShoppingBag, to: "/parentprofile/orders" },
  { label: "Ví hoàn tiền", description: "Rút tiền hoàn", icon: WalletCards, to: "/parentprofile/wallet" },
  { label: "Thử đồ", description: "Lịch sử fitting", icon: History, to: "/parentprofile/history" },
  { label: "Bodygram", description: "Theo dõi số đo", icon: ScanLine, to: "/parentprofile/bodygram-history" },
  { label: "Đánh giá", description: "Phản hồi đơn hàng", icon: Star, to: "/parentprofile/reviews" },
  { label: "Hỗ trợ", description: "Yêu cầu Admin", icon: LifeBuoy, to: "/parentprofile/support" },
  { label: "Cài đặt", description: "Bảo mật tài khoản", icon: Settings, to: "/parentprofile/settings" },
];

const SECTION_MATCHERS: Record<string, string[]> = {
  "/parentprofile/account": ["/parentprofile/account"],
  "/parentprofile/address-book": ["/parentprofile/address-book"],
  "/parentprofile/students": ["/parentprofile/students"],
  "/parentprofile/orders": ["/parentprofile/orders", "/parentprofile/feedback"],
  "/parentprofile/wallet": ["/parentprofile/wallet"],
  "/parentprofile/history": ["/parentprofile/history"],
  "/parentprofile/bodygram-history": ["/parentprofile/bodygram-history"],
  "/parentprofile/reviews": ["/parentprofile/reviews"],
  "/parentprofile/support": ["/parentprofile/support"],
  "/parentprofile/settings": ["/parentprofile/settings"],
};

type ParentUser = {
  fullName?: string;
  email?: string;
  avatar?: string | null;
};

export const ParentProfile = (): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const prevPathRef = useRef(location.pathname);
  const [showLoader, setShowLoader] = useState(false);
  const [user, setUser] = useState<ParentUser | null>(() => {
    try {
      const raw = localStorage.getItem("user") ?? sessionStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!user) navigate("/signin", { replace: true });
  }, [navigate, user]);

  useEffect(() => {
    const refresh = () => {
      try {
        const raw = localStorage.getItem("user") ?? sessionStorage.getItem("user");
        if (raw) setUser(JSON.parse(raw));
      } catch {
        // Ignore malformed storage payloads.
      }
    };

    window.addEventListener("vtos:user-updated", refresh);
    return () => window.removeEventListener("vtos:user-updated", refresh);
  }, []);

  useEffect(() => {
    const syncFromApi = async () => {
      try {
        const data = await getParentProfile();
        const storage = localStorage.getItem("access_token") ? localStorage : sessionStorage;
        const raw = storage.getItem("user");
        if (!raw) return;

        const stored = JSON.parse(raw);
        const updated = {
          ...stored,
          avatar: data.avatar ?? stored.avatar,
          fullName: data.fullName || stored.fullName,
          email: data.email || stored.email,
        };
        storage.setItem("user", JSON.stringify(updated));
        setUser(updated);
      } catch {
        // Non-critical sync.
      }
    };

    void syncFromApi();
  }, []);

  useLayoutEffect(() => {
    if (location.pathname !== prevPathRef.current) {
      prevPathRef.current = location.pathname;
      setShowLoader(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!showLoader) return;
    const timeoutId = setTimeout(() => setShowLoader(false), 300);
    return () => clearTimeout(timeoutId);
  }, [showLoader]);

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      ["access_token", "user", "expires_in"].forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      navigate("/signin", { replace: true });
    }, 350);
  };

  const initials = useMemo(() => {
    const value = user?.fullName?.trim();
    if (!value) return "PH";
    return value
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(-2)
      .toUpperCase();
  }, [user?.fullName]);

  if (!user) {
    return <div />;
  }

  return (
    <GuestLayout bgColor="#f8fafc" mainClassName="flex-1">
      <div className="relative z-10 mx-auto max-w-[1320px] px-4 py-6 md:py-8 lg:px-8">
        <nav className="mb-5 flex items-center gap-2 text-sm font-bold">
          <a href="/" className="text-gray-500 transition-colors hover:text-gray-800">
            Trang chủ
          </a>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900">Khu vực phụ huynh</span>
        </nav>

        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start">
          <aside className="xl:sticky xl:top-20">
            <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-soft-md">
              <div className="border-b border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-5 sm:px-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[22px] border border-gray-200 bg-violet-50 shadow-soft-sm">
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xl font-black text-violet-700">{initials}</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Tài khoản phụ huynh</p>
                    <p className="mt-1 truncate text-lg font-black text-slate-950">{user.fullName || "Phụ huynh"}</p>
                    <p className="truncate text-sm font-medium text-slate-500">{user.email || "Chưa có email"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 px-4 py-4 sm:px-5">
                <div className="space-y-2">
                  {SECTION_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = (SECTION_MATCHERS[item.to] ?? [item.to]).some((path) => location.pathname.startsWith(path));
                    return (
                      <NavLink key={item.to} to={item.to}>
                        {() => (
                          <div
                            className={`flex items-center gap-3 rounded-[20px] border px-4 py-3 transition-all ${
                              isActive
                                ? "border-violet-200 bg-violet-50 text-slate-950 shadow-soft-sm"
                                : "border-transparent bg-slate-50 text-slate-600 hover:border-slate-200 hover:bg-white"
                            }`}
                          >
                            <div
                              className={`flex h-11 w-11 items-center justify-center rounded-[16px] border ${
                                isActive
                                  ? "border-violet-100 bg-white text-violet-700"
                                  : "border-slate-200 bg-white text-slate-500"
                              }`}
                            >
                              <Icon className="h-4.5 w-4.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-extrabold">{item.label}</p>
                              <p className="truncate text-xs font-medium text-slate-500">{item.description}</p>
                            </div>
                            {isActive ? <ChevronRight className="h-4 w-4 text-violet-600" /> : null}
                          </div>
                        )}
                      </NavLink>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex w-full items-center justify-center gap-3 rounded-[18px] border border-red-200 bg-white px-4 py-3 text-sm font-extrabold text-red-700 shadow-soft-sm transition-all hover:-translate-y-0.5 hover:bg-red-50"
                >
                  <LogOut className={`h-4.5 w-4.5 ${isLoggingOut ? "animate-spin" : ""}`} />
                  {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
                </button>
              </div>
            </div>
          </aside>

          <section className="relative min-h-[420px] overflow-hidden rounded-[30px] border border-gray-200 bg-white shadow-soft-md">
            <AnimatePresence>
              {showLoader ? (
                <motion.div
                  key="parent-tab-loader"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 z-10 flex items-center justify-center bg-white/95"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-100 border-t-violet-600" />
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Đang tải khu vực</p>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {!showLoader ? (
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="space-y-6 p-5 lg:p-8"
                >
                  <Outlet />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </section>
        </div>
      </div>
    </GuestLayout>
  );
};
