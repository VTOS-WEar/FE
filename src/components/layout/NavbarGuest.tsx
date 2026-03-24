import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Bell, ChevronDown, Clock, GraduationCap, LogIn, LogOut, Menu, Package, Search, Settings, ShoppingCart, Star, User, Users, X } from "lucide-react"
import { useState, useEffect } from "react"
import { useNavigate, Link, useLocation } from "react-router-dom"
import { useCart } from "../../contexts/CartContext"
import { motion, AnimatePresence } from "framer-motion"

function getSessionUser(): { fullName: string; role: string } | null {
  const raw = localStorage.getItem("user") || sessionStorage.getItem("user")
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

function isLoggedIn(): boolean {
  return !!(localStorage.getItem("access_token") || sessionStorage.getItem("access_token"))
}

export function NavbarGuest() {
  const navigate = useNavigate()
  const location = useLocation()
  const cartCtx = useCart()
  const [loggedIn, setLoggedIn] = useState(isLoggedIn())
  const [userName, setUserName] = useState("")
  const [userRole, setUserRole] = useState("")
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const check = () => {
      const hasSession = isLoggedIn()
      setLoggedIn(hasSession)
      if (hasSession) {
        const u = getSessionUser()
        setUserName(u?.fullName || "Hồ sơ")
        setUserRole(u?.role || "")
      }
    }
    check()
    const interval = setInterval(check, 500)
    return () => clearInterval(interval)
  }, [])

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname, location.hash])

  const cartCount = loggedIn ? cartCtx.getItemCount() : 0

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    sessionStorage.removeItem("access_token")
    localStorage.removeItem("user")
    sessionStorage.removeItem("user")
    setLoggedIn(false)
    setUserName("")
    setUserRole("")
    navigate("/")
  }

  const handleAnchorClick = (e: React.MouseEvent<HTMLElement>, href: string) => {
    if (href.startsWith("/homepage#")) {
      const hash = href.replace("/homepage", "")
      if (location.pathname === "/homepage") {
        e.preventDefault()
        const element = document.querySelector(hash)
        if (element) {
          element.scrollIntoView({ behavior: "smooth" })
          window.history.pushState(null, "", href)
        }
      }
    }
    setIsMenuOpen(false)
  }

  const navItems = [
    { label: "Trang chủ", type: "route", to: "/homepage" },
    { label: "Cách hoạt động", type: "anchor", href: "/homepage#how-it-works" },
  ] as const
  const parentProfileItems = [
    { label: "Tài khoản", to: "/parentprofile/account", icon: User },
    { label: "Học sinh", to: "/parentprofile/students", icon: Users },
    { label: "Đơn hàng", to: "/parentprofile/orders", icon: Package },
    { label: "Lịch sử", to: "/parentprofile/history", icon: Clock },
    { label: "Đánh giá", to: "/parentprofile/reviews", icon: Star },
    { label: "Cài đặt", to: "/parentprofile/settings", icon: Settings },
  ] as const
  const desktopNavClass = "flex h-10 items-center rounded-full px-3 lg:px-4 text-sm font-bold transition-colors"
  const activeNavClass = "bg-purple-50 text-purple-600"

  const isAnchorActive = (href?: string) => {
    if (!href) return false
    if (href.startsWith("/homepage#")) {
      const hash = href.replace("/homepage", "")
      return location.pathname === "/homepage" && location.hash === hash
    }
    if (href.startsWith("#")) {
      return location.hash === href
    }
    return false
  }

  const isProductsActive = location.pathname === "/schools" || location.pathname === "/products"
  const isContactActive = isAnchorActive("#contact")

  return (
    <nav className="sticky top-0 z-50 border-none bg-transparent py-2">
      <div className="mx-auto w-full max-w-[1240px] px-3 sm:px-4 lg:px-6">
        <div className="flex h-16 items-center justify-between gap-2 sm:gap-3 lg:gap-5">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Trigger */}
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md lg:hidden"
            >
              <Menu size={20} className="text-gray-700" />
            </button>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center"
              aria-label="Về trang chủ"
            >
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/b5b02bd27ae25e8fcc3a61694891ffa491402bfb?width=328"
                alt="VTOS Logo"
                className="h-10 w-auto object-contain sm:h-12"
              />
            </button>
          </div>

          <div className="hidden w-full max-w-[760px] items-center rounded-full border border-purple-200 bg-white px-2 py-1 shadow-md transition-all duration-200 hover:-translate-y-[1px] hover:shadow-lg lg:flex">
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                if (item.type === "route") {
                  const isHome = item.to === "/homepage"
                  const isActive = isHome
                    ? location.pathname === "/homepage" && !location.hash
                    : location.pathname === item.to
                  return (
                    <Link
                      key={item.label}
                      to={item.to}
                      onClick={() => {
                        if (isHome) window.scrollTo({ top: 0, behavior: "smooth" })
                      }}
                      className={`${desktopNavClass} ${isActive ? activeNavClass : "text-gray-700"}`}
                    >
                      {item.label}
                    </Link>
                  )
                }
                const isActive = isAnchorActive(item.href)
                return (
                  <a 
                    key={item.label} 
                    href={item.href} 
                    onClick={(e) => handleAnchorClick(e, item.href)}
                    className={`${desktopNavClass} ${isActive ? activeNavClass : "text-gray-700"} font-bold`}
                  >
                    {item.label}
                  </a>
                )
              })}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className={`flex h-10 items-center rounded-full border-none px-3 text-sm font-bold outline-none focus:border-none focus:outline-none focus:ring-0 lg:px-4 active:outline-none ${isProductsActive ? activeNavClass : "text-gray-700"}`}>
                    Sản phẩm <ChevronDown size={14} className="ml-1" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="z-[70] w-72 border border-purple-100 bg-white/95 p-1.5 shadow-xl backdrop-blur">
                  <div className="mb-1 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">Khám phá sản phẩm</p>
                  </div>
                  <DropdownMenuItem asChild className="group m-0 cursor-pointer rounded-lg px-2 py-2 transition-all duration-200 data-[highlighted]:-translate-y-0.5 data-[highlighted]:bg-gray-100">
                    <Link to="/schools" className="flex w-full items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                        <GraduationCap size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800">Tìm trường</p>
                        <p className="text-xs text-gray-500">Danh sách trường và đối tác đồng phục</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="group m-0 cursor-pointer rounded-lg px-2 py-2 transition-all duration-200 data-[highlighted]:-translate-y-0.5 data-[highlighted]:bg-gray-100">
                    <Link to="/products" className="flex w-full items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                        <Package size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800">Kho đồng phục</p>
                        <p className="text-xs text-gray-500">Mẫu sản phẩm sẵn có để đặt nhanh</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <a href="#contact" className={`${desktopNavClass} ${isContactActive ? activeNavClass : "text-gray-700"} font-bold`}>
                Liên hệ
              </a>
            </div>

            <div className="mx-2 h-6 w-px bg-purple-200" />

            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Input placeholder="Tìm kiếm..." className="h-9 border-none bg-transparent text-sm shadow-none focus-visible:ring-0 placeholder:text-gray-400" />
              <Button size="icon" className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-600 to-purple-500 hover:opacity-90">
                <Search size={16} className="text-white" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-1 sm:gap-2">
            <Button
              onClick={() => navigate("/cart")}
              variant="ghost"
              size="icon"
              className="relative h-10 w-10 rounded-full shadow-md hover:shadow-lg transition hover:-translate-y-[1px] bg-white hover:bg-gray-50"
            >
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full shadow-md hover:shadow-lg transition hover:-translate-y-[1px] bg-white hover:bg-gray-50"
            >
              <Bell size={18} />
            </Button>

            {loggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="hidden h-12 items-center gap-2 rounded-full bg-white px-3 shadow-md transition-all duration-200 hover:-translate-y-[1px] hover:bg-gray-50 hover:shadow-lg lg:flex !outline-none"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                      <User size={16} className="text-purple-600" />
                    </div>
                    <span className="max-w-[120px] truncate text-sm font-semibold">{userName}</span>
                    <ChevronDown size={14} className="text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-[70] w-56 bg-white border-none shadow-lg p-0">
                  {userRole === "Parent" && (
                    <>
                      <div className="border-b border-gray-200">
                        <DropdownMenuItem asChild className="cursor-pointer transition-transform duration-150 data-[highlighted]:bg-gray-100 data-[highlighted]: m-0 rounded-none px-3 py-2">
                          <Link to="/parentprofile/account" className="flex w-full items-center gap-3">
                            <User size={16} className="text-purple-600 flex-shrink-0" />
                            <span className="text-sm">Tài khoản</span>
                          </Link>
                        </DropdownMenuItem>
                      </div>
                      <div className="border-b border-gray-200">
                        {parentProfileItems.slice(1, 5).map((item) => {
                          const IconComp = item.icon
                          return (
                            <DropdownMenuItem key={item.to} asChild className="cursor-pointer transition-transform duration-150 data-[highlighted]:bg-gray-100 data-[highlighted]: m-0 rounded-none px-3 py-2">
                              <Link to={item.to} className="flex w-full items-center gap-3">
                                <IconComp size={16} className="text-purple-600 flex-shrink-0" />
                                <span className="text-sm">{item.label}</span>
                              </Link>
                            </DropdownMenuItem>
                          )
                        })}
                      </div>
                      <div>
                        <DropdownMenuItem asChild className="cursor-pointer transition-transform duration-150 data-[highlighted]:bg-gray-100 data-[highlighted]: m-0 rounded-none px-3 py-2">
                          <Link to="/parentprofile/settings" className="flex w-full items-center gap-3">
                            <Settings size={16} className="text-purple-600 flex-shrink-0" />
                            <span className="text-sm">Cài đặt</span>
                          </Link>
                        </DropdownMenuItem>
                        <div className="border-t border-gray-200 px-3 py-2">
                          <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 text-sm font-medium text-red-600 hover:text-red-700">
                            <LogOut size={16} />
                            <span>Đăng xuất</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => navigate("/signin")} variant="outline" className="hidden h-9 items-center gap-2 rounded-full px-3 shadow-md hover:shadow-lg transition lg:flex">
                <LogIn size={14} />
                <span className="text-sm font-semibold">Đăng nhập</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-[101] w-[280px] bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <img src="https://api.builder.io/api/v1/image/assets/TEMP/b5b02bd27ae25e8fcc3a61694891ffa491402bfb?width=328" alt="VTOS Logo" className="h-8 w-auto" />
                <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-full bg-gray-100 text-gray-500">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-2">
                {navItems.map((item) => {
                  if (item.type === "route") {
                    return (
                      <Link
                        key={item.label}
                        to={item.to}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                      >
                        {item.label}
                      </Link>
                    )
                  }
                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      onClick={(e) => handleAnchorClick(e, item.href)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                    >
                      {item.label}
                    </a>
                  )
                })}

                <div className="pt-4 mt-4 border-t border-gray-100">
                  <p className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Sản phẩm</p>
                  <Link to="/schools" className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors">
                    <GraduationCap size={18} className="text-purple-600" /> Tìm trường
                  </Link>
                  <Link to="/products" className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors">
                    <Package size={18} className="text-purple-600" /> Kho đồng phục
                  </Link>
                </div>

                <a 
                  href="#contact" 
                  onClick={(e) => {
                    e.preventDefault();
                    const element = document.querySelector("#contact");
                    if (element) element.scrollIntoView({ behavior: "smooth" });
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                >
                  Liên hệ
                </a>

                <div className="pt-8 space-y-3">
                  {!loggedIn && (
                    <Button onClick={() => navigate("/signin")} className="w-full h-12 rounded-full bg-purple-600 hover:bg-purple-700 shadow-lg text-white font-bold">
                      Đăng nhập
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  )
}
