import { Search, ShoppingCart, Bell, ChevronDown, LogIn, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";

function getSessionUser(): { fullName: string; role: string } | null {
  const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function isLoggedIn(): boolean {
  return !!(localStorage.getItem("access_token") || sessionStorage.getItem("access_token"));
}

export const NavbarGuest = (): JSX.Element => {
  const navigate = useNavigate();
  const cartCtx = useCart();
  const [loggedIn, setLoggedIn] = useState(isLoggedIn);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");

  // Poll login status so navbar reacts immediately to logout/login
  useEffect(() => {
    const check = () => {
      const hasSession = isLoggedIn();
      setLoggedIn(hasSession);
      if (hasSession) {
        const u = getSessionUser();
        setUserName(u?.fullName || "Hồ sơ");
        setUserRole(u?.role || "");
      }
    };
    check(); // run once immediately
    const interval = setInterval(check, 500);
    return () => clearInterval(interval);
  }, []);

  // Only show cart badge for logged-in users
  const cartCount = loggedIn ? cartCtx.getItemCount() : 0;

  const profilePath = userRole === "School" ? "/school/profile" : "/parentprofile";

  return (
    <header className="relative z-10 bg-purple-light/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3">
        <nav className="flex items-center justify-between gap-3">
          {/* Logo */}
          <img
            src="https://api.builder.io/api/v1/image/assets/TEMP/b5b02bd27ae25e8fcc3a61694891ffa491402bfb?width=328"
            alt="VTOS Logo"
            className="h-14 w-auto object-contain cursor-pointer"
            onClick={() => navigate("/")}
          />

          {/* Navigation Menu - Pill shape */}
          <div className="hidden lg:flex items-center gap-8 px-8 py-3 bg-white rounded-full shadow-lg">
            <a href="/homepage" className="font-baloo font-semibold text-base text-black hover:text-purple-dark transition-colors">
              Trang chủ
            </a>
            <a href="#how-it-works" className="font-baloo font-semibold text-base text-black hover:text-purple-dark transition-colors">
              Cách hoạt động
            </a>
            <Link to="/schools" className="font-baloo font-semibold text-base text-black hover:text-purple-dark transition-colors">
              Tìm trường
            </Link>
            <div className="flex items-center gap-2 cursor-pointer group">
              <span className="font-baloo font-semibold text-base text-black group-hover:text-purple-dark transition-colors">
                Sản phẩm
              </span>
              <ChevronDown className="w-3 h-3 stroke-2" />
            </div>
            <a href="#contact" className="font-baloo font-semibold text-base text-black hover:text-purple-dark transition-colors">
              Liên hệ
            </a>
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="font-roboto text-base text-black/60 bg-transparent outline-none w-48 placeholder:text-black/60"
              />
            </div>
            <button className="flex items-center justify-center w-10 h-10 bg-purple-medium rounded-full shadow-md hover:shadow-lg transition-shadow">
              <Search className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/cart")}
              className="relative flex items-center justify-center p-2.5 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>
            <button className="flex items-center justify-center p-2.5 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow">
              <Bell className="w-6 h-6" />
            </button>

            {loggedIn ? (
              /* Logged in: show user name + link to profile */
              <Link
                to={profilePath}
                className="hidden lg:flex items-center gap-2.5 bg-white rounded-[50px] shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] px-5 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <User className="w-6 h-6" />
                <span className="font-baloo font-semibold text-base text-black truncate max-w-[160px]">{userName}</span>
                <ChevronDown className="w-3 h-3 stroke-2" />
              </Link>
            ) : (
              /* Not logged in: show Đăng nhập */
              <button
                onClick={() => navigate("/signin")}
                className="hidden lg:flex items-center gap-2.5 bg-white rounded-[50px] shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] px-5 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <LogIn className="w-6 h-6" />
                <span className="font-baloo font-semibold text-base text-black">Đăng nhập</span>
              </button>
            )}

            {/* Mobile */}
            {loggedIn ? (
              <Link
                to={profilePath}
                className="lg:hidden flex items-center gap-2 bg-white rounded-full shadow-md px-4 py-2"
              >
                <User className="w-6 h-6" />
                <span className="font-baloo text-sm truncate max-w-[100px]">{userName}</span>
              </Link>
            ) : (
              <button
                onClick={() => navigate("/signin")}
                className="lg:hidden flex items-center gap-2 bg-white rounded-full shadow-md px-4 py-2"
              >
                <LogIn className="w-6 h-6" />
                <span className="font-baloo text-sm">Menu</span>
              </button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};
