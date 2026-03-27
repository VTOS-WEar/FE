import { useEffect, useState } from "react";
import { useNavigate, NavLink, Outlet, Link, useLocation } from "react-router-dom";
import {
  User, LogOut, ShoppingBag, History, Star, Settings, GraduationCap, ChevronRight
} from "lucide-react";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

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

  /* ── Auth guard ── */
  const rawUser = localStorage.getItem("user") || sessionStorage.getItem("user");
  let user: { fullName?: string; avatar?: string | null } | null = null;
  try { if (rawUser) user = JSON.parse(rawUser); } catch { /* ignore */ }

  useEffect(() => {
    if (!rawUser) navigate("/signin", { replace: true });
  }, [navigate, rawUser]);

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      ["access_token", "user", "expires_in"].forEach(k => {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      });
      navigate("/signin", { replace: true });
    }, 400); // Wait for feedback animation
  };

  if (!user) return <div />;

  // Framer Motion Variants
  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  return (
    <GuestLayout bgColor="#faf9ff" mainClassName="flex-1">
      {/* ── Ambient Glow Background ───────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          className="absolute top-[-5%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-purple-100/50 to-indigo-50/40 rounded-full blur-[100px]"
          animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[10%] right-[-5%] w-[400px] h-[400px] bg-gradient-to-tr from-sky-50/50 to-purple-50/30 rounded-full blur-[80px]"
          animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-4 lg:px-8 py-8 md:py-12">
        {/* ───── Breadcrumb ───── */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mb-6">
          <Breadcrumb>
            <BreadcrumbList className="text-[13px]">
              <BreadcrumbItem>
                <BreadcrumbLink href="/" className="text-gray-500 hover:text-purple-600 font-medium transition-colors">Trang chủ</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-gray-900 font-bold">Hồ sơ phụ huynh</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </motion.div>

        {/* ───── Main Layout Container ───── */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible"
          className="bg-white/90 backdrop-blur-xl rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-gray-100/80 overflow-hidden flex flex-col lg:flex-row min-h-[500px] transition-all"
        >
          {/* ── Left Sidebar ── */}
          <div className="lg:w-[280px] flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-100/80 bg-gray-50/30 p-5 xl:p-6 flex flex-col relative z-10">
            {/* User info Header */}
            <div className="flex items-center gap-3.5 mb-8">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-full opacity-0 group-hover:opacity-100 blur transition-all duration-500" />
                <div className="relative w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                  {user.avatar
                    ? <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    : <User className="w-5 h-5 text-white" />}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-purple-600/80 text-[10px] mb-0.5 uppercase tracking-widest">Tài khoản</p>
                <p className="font-baloo font-extrabold text-gray-900 text-[16px] leading-tight truncate" title={user.fullName}>{user.fullName}</p>
              </div>
            </div>

            {/* Nav Menu using NavLink for URL-based active state */}
            <motion.nav variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-2 flex-1 relative z-10">
              {SIDEBAR_ITEMS.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                  >
                    {({ isActive }) => (
                      <motion.div
                        whileHover={{ scale: 1.015, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className={`group relative flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all [font-family:'Montserrat',Helvetica] font-semibold text-[13px] overflow-hidden ${isActive
                          ? "bg-[#6938ef] text-white shadow-[0_4px_12px_rgba(105,56,239,0.3)]"
                          : "text-[#4c5769] hover:bg-[#f4f2ff] hover:text-[#6938ef]"
                          }`}
                      >
                        <Icon className={`w-[18px] h-[18px] relative z-10 transition-colors ${isActive ? "text-white" : "text-[#4c5769] group-hover:text-[#6938ef]"}`} />
                        <span className="relative z-10 flex-1">{item.label}</span>
                        {isActive && <ChevronRight className="w-3.5 h-3.5 relative z-10 opacity-70" />}
                      </motion.div>
                    )}
                  </NavLink>
                );
              })}
            </motion.nav>

            {/* Logout Divider & Button */}
            <div className="mt-6 pt-5 border-t border-gray-100/80">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all font-bold text-[13px] text-red-500 hover:bg-red-50 hover:border-red-100 border border-transparent"
              >
                <LogOut className={`w-[18px] h-[18px] ${isLoggingOut ? "animate-spin" : ""}`} />
                {isLoggingOut ? "Đang xuất..." : "Đăng Xuất"}
              </motion.button>
            </div>
          </div>

          {/* ── Right Content: rendered by child route ── */}
          <div className="flex-1 min-w-0 bg-white relative z-10">
            {/* AnimatePresence for smoothly switching child pages if desired, keyed by location */}
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="h-full p-5 lg:p-8"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </GuestLayout>
  );
};
