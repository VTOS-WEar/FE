import { Link } from "react-router-dom";
import { Search, ShoppingCart, Bell, User, ChevronDown, LogIn } from "lucide-react";

interface HeaderProps {
  isLoggedIn?: boolean;
}

export default function Header({ isLoggedIn = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-purple-light/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3">
        <nav className="flex items-center justify-between gap-3">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <img
              src="https://api.builder.io/api/v1/image/assets/TEMP/b5b02bd27ae25e8fcc3a61694891ffa491402bfb?width=328"
              alt="VTOS Logo"
              className="h-14 w-auto object-contain"
            />
          </Link>

          {/* Navigation Menu */}
          <div className="hidden lg:flex items-center gap-8 px-8 py-3 bg-white rounded-full shadow-lg">
            <Link to="/" className="font-baloo text-base text-black hover:text-purple-dark transition-colors">
              Trang chủ
            </Link>
            <a href="#how-it-works" className="font-baloo text-base text-black hover:text-purple-dark transition-colors">
              Cách hoạt động
            </a>
            <div className="flex items-center gap-2 cursor-pointer group">
              <span className="font-baloo text-base text-black group-hover:text-purple-dark transition-colors">
                Sản phẩm
              </span>
              <ChevronDown className="w-3 h-3 stroke-2" />
            </div>
            <a href="#contact" className="font-baloo text-base text-black hover:text-purple-dark transition-colors">
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

          {/* Right Icons - Show different content based on login state */}
          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <button className="flex items-center justify-center p-2.5 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow">
                <ShoppingCart className="w-10 h-10" />
              </button>
              <button className="flex items-center justify-center p-2.5 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow">
                <Bell className="w-10 h-10" />
              </button>
              <Link
                to={(() => {
                  const userRaw = localStorage.getItem("user") || sessionStorage.getItem("user");
                  try { const u = userRaw ? JSON.parse(userRaw) : null; return u?.role === "School" ? "/school/profile" : "/parentprofile"; } catch { return "/parentprofile"; }
                })()}
                className="flex items-center gap-2.5 px-3 py-2.5 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
              >
                <User className="w-10 h-10" />
                <span className="hidden md:inline font-baloo text-base text-black">Hồ sơ</span>
                <ChevronDown className="hidden md:inline w-3 h-3 stroke-2" />
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/signin"
                className="hidden lg:flex items-center gap-2.5 bg-white rounded-[50px] shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] px-5 py-2.5 hover:bg-gray-50 transition-colors"
              >
                <LogIn className="w-10 h-10" />
                <span className="font-baloo text-base text-black">Đăng nhập</span>
              </Link>
              {/* Mobile Menu Button */}
              <Link
                to="/signin"
                className="lg:hidden flex items-center gap-2 bg-white rounded-full shadow-md px-4 py-2"
              >
                <LogIn className="w-6 h-6" />
                <span className="font-baloo text-sm">Menu</span>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

export { Header };
