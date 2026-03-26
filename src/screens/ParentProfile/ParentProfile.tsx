import { useEffect } from "react";
import { useNavigate, NavLink, Outlet, Link } from "react-router-dom";
import {
  User, LogOut, ShoppingBag, History, Star, Settings, GraduationCap,
} from "lucide-react";
import { GuestLayout } from "../../components/layout/GuestLayout";

/* ─── Sidebar Menu Items ─── */
const SIDEBAR_ITEMS = [
  { label: "Thông tin tài khoản", icon: User,          to: "/parentprofile/account"  },
  { label: "Quản lý học sinh",   icon: GraduationCap,  to: "/parentprofile/students" },
  { label: "Đơn hàng",           icon: ShoppingBag,    to: "/parentprofile/orders"   },
  { label: "Lịch sử",            icon: History,        to: "/parentprofile/history"  },
  { label: "Đánh giá",           icon: Star,           to: "/parentprofile/reviews"  },
  { label: "Cài đặt tài khoản",  icon: Settings,       to: "/parentprofile/settings" },
];

export const ParentProfile = (): JSX.Element => {
  const navigate = useNavigate();

  /* ── Auth guard ── */
  const rawUser = localStorage.getItem("user") || sessionStorage.getItem("user");
  let user: { fullName?: string; avatar?: string | null } | null = null;
  try { if (rawUser) user = JSON.parse(rawUser); } catch { /* ignore */ }

  useEffect(() => {
    if (!rawUser) navigate("/signin", { replace: true });
  }, [navigate, rawUser]);

  const handleLogout = () => {
    ["access_token", "user", "expires_in"].forEach(k => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
    navigate("/signin", { replace: true });
  };

  if (!user) return <div />;

  return (
    <GuestLayout bgColor="transparent">
      <main
        className="flex-1 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 30%, #e0e7ff 60%, #ede9fe 100%)" }}
      >
        {/* Decorative blobs */}
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, #c4b5fd 0%, transparent 70%)" }} />
        <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, #a5b4fc 0%, transparent 70%)" }} />

        <div className="container mx-auto px-4 py-6 relative z-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6 ">
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
                  {user.avatar
                    ? <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    : <User className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <p className="font-medium text-black/50 text-xs">Tài khoản</p>
                  <p className="font-bold text-[#1a1a2e] text-sm">{user.fullName}</p>
                </div>
              </div>

              {/* Nav Menu using NavLink for URL-based active state */}
              <nav className="flex flex-col gap-1.5 flex-1">
                {SIDEBAR_ITEMS.map(item => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all font-semibold text-sm ${
                          isActive
                            ? "bg-[#6938ef] text-white shadow-[0_2px_8px_rgba(105,56,239,0.35)]"
                            : "text-[#4c5769] hover:bg-[#f4f2ff] hover:text-[#6938ef]"
                        }`
                      }
                    >
                      <Icon className="w-[18px] h-[18px]" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </nav>

              {/* Đăng Xuất */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all font-semibold text-sm text-red-500 hover:bg-red-50 mt-4 border border-red-200"
              >
                <LogOut className="w-[18px] h-[18px]" />
                Đăng Xuất
              </button>
            </div>

            {/* ── Right Content: rendered by child route ── */}
            <div className="flex-1 p-6 lg:p-8">
              <Outlet />
            </div>
          </div>
        </div>
      </main>
    </GuestLayout>
  );
};
