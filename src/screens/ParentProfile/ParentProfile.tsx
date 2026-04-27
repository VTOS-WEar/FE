import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, GraduationCap, History, LifeBuoy, LogOut, MapPinHouse, ScanLine, Settings, ShoppingBag, Star, User, WalletCards } from "lucide-react";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { getParentProfile } from "../../lib/api/users";

const SECTION_ITEMS = [
  { label: "Tài khoản", icon: User, to: "/parentprofile/account" },
  { label: "Sổ địa chỉ", icon: MapPinHouse, to: "/parentprofile/address-book" },
  { label: "Học sinh", icon: GraduationCap, to: "/parentprofile/students" },
  { label: "Đơn hàng", icon: ShoppingBag, to: "/parentprofile/orders" },
  { label: "Ví hoàn tiền", icon: WalletCards, to: "/parentprofile/wallet" },
  { label: "Thử đồ", icon: History, to: "/parentprofile/history" },
  { label: "Bodygram", icon: ScanLine, to: "/parentprofile/bodygram-history" },
  { label: "Đánh giá", icon: Star, to: "/parentprofile/reviews" },
  { label: "Hỗ trợ", icon: LifeBuoy, to: "/parentprofile/support" },
  { label: "Cài đặt", icon: Settings, to: "/parentprofile/settings" },
];

const MENU_GROUPS: Array<{ title: string; items: string[] }> = [
  { title: "Thông tin", items: ["/parentprofile/account-group", "/parentprofile/address-book", "/parentprofile/students"] },
  { title: "Mua sắm", items: ["/parentprofile/orders", "/parentprofile/wallet"] },
  { title: "Dịch vụ", items: ["/parentprofile/history", "/parentprofile/bodygram-history", "/parentprofile/reviews", "/parentprofile/support"] },
];

const ACCOUNT_CHILDREN = [
  { label: "Thông tin tài khoản", to: "/parentprofile/account" },
  { label: "Cài đặt tài khoản", to: "/parentprofile/settings" },
] as const;

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
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    account: true,
  });
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

  useEffect(() => {
    const accountActive = ACCOUNT_CHILDREN.some((child) =>
      (SECTION_MATCHERS[child.to] ?? [child.to]).some((path) => location.pathname.startsWith(path)),
    );
    setOpenGroups((prev) => ({ ...prev, account: accountActive }));
  }, [location.pathname]);

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
                <div className="space-y-3">
                  {MENU_GROUPS.map((group) => (
                    <div key={group.title} className="space-y-1">
                      <p className="px-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                        {group.title}
                      </p>
                      <div className="space-y-0.5">
                        {group.items.map((to) => {
                          if (to === "/parentprofile/account-group") {
                            const isAccountActive = ACCOUNT_CHILDREN.some((child) =>
                              (SECTION_MATCHERS[child.to] ?? [child.to]).some((path) =>
                                location.pathname.startsWith(path),
                              ),
                            );
                            const isOpen = openGroups.account;
                            return (
                              <div key={to} className="space-y-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenGroups((prev) => ({ ...prev, account: !prev.account }))
                                  }
                                  className={`flex w-full items-center gap-2.5 rounded-[12px] border px-3 py-2 transition-all ${
                                    isAccountActive
                                      ? "border-violet-200 bg-violet-50 text-slate-950 shadow-soft-sm"
                                      : "border-transparent bg-transparent text-slate-600 hover:border-slate-200/80 hover:bg-slate-50"
                                  }`}
                                >
                                  <div
                                    className={`flex h-8 w-8 items-center justify-center rounded-[10px] border ${
                                      isAccountActive
                                        ? "border-violet-100 bg-white text-violet-700"
                                        : "border-transparent bg-transparent text-slate-400"
                                    }`}
                                  >
                                    <User className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0 flex-1 text-left">
                                    <p className="truncate text-sm font-extrabold">Tài khoản</p>
                                  </div>
                                  <ChevronDown
                                    className={`h-4 w-4 transition-transform ${
                                      isOpen ? "rotate-180 text-violet-600" : "text-slate-400"
                                    }`}
                                  />
                                </button>

                                {isOpen ? (
                                  <div className="ml-4 space-y-1 border-l border-slate-200 pl-3">
                                    {ACCOUNT_CHILDREN.map((child) => {
                                      const isChildActive = (SECTION_MATCHERS[child.to] ?? [child.to]).some((path) =>
                                        location.pathname.startsWith(path),
                                      );
                                      return (
                                        <NavLink key={child.to} to={child.to}>
                                          <div
                                            className={`flex items-center rounded-[10px] px-2.5 py-2 text-sm font-bold transition-colors ${
                                              isChildActive
                                                ? "bg-violet-50 text-violet-700"
                                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                                            }`}
                                          >
                                            {child.label}
                                          </div>
                                        </NavLink>
                                      );
                                    })}
                                  </div>
                                ) : null}
                              </div>
                            );
                          }

                          const item = SECTION_ITEMS.find((entry) => entry.to === to);
                          if (!item) return null;
                          const Icon = item.icon;
                          const isActive = (SECTION_MATCHERS[item.to] ?? [item.to]).some((path) =>
                            location.pathname.startsWith(path),
                          );
                          return (
                            <NavLink key={item.to} to={item.to}>
                              {() => (
                                <div
                                  className={`flex items-center gap-2.5 rounded-[12px] border px-3 py-2 transition-all ${
                                    isActive
                                      ? "border-violet-200 bg-violet-50 text-slate-950 shadow-soft-sm"
                                      : "border-transparent bg-transparent text-slate-600 hover:border-slate-200/80 hover:bg-slate-50"
                                  }`}
                                >
                                  <div
                                    className={`flex h-8 w-8 items-center justify-center rounded-[10px] border ${
                                      isActive
                                        ? "border-violet-100 bg-white text-violet-700"
                                        : "border-transparent bg-transparent text-slate-400"
                                    }`}
                                  >
                                    <Icon className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-extrabold">{item.label}</p>
                                  </div>
                                  {isActive ? <ChevronRight className="h-4 w-4 text-violet-600" /> : null}
                                </div>
                              )}
                            </NavLink>
                          );
                        })}
                      </div>
                    </div>
                  ))}
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

          <section className="relative min-h-[420px] overflow-hidden rounded-[30px] border border-gray-200 bg-white shadow-soft-md md:min-h-[560px] xl:min-h-[calc(100vh-140px)]">
            <div className="space-y-6 p-5 lg:p-8">
              <Outlet />
            </div>
          </section>
        </div>
      </div>
    </GuestLayout>
  );
};
