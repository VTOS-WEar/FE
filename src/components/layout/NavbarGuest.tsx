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
  const isContactActive = location.pathname === "/contact-partnership"

  /* ── NB style tokens ── */
  const nbNavLink = "flex h-10 items-center rounded-lg px-3 lg:px-4 text-sm font-bold transition-all duration-150"
  const nbNavLinkActive = "bg-[#1A1A2E] text-white shadow-[2px_2px_0_#1A1A2E]"
  const nbNavLinkIdle = "text-[#1A1A2E] hover:bg-[#1A1A2E]/5"
  const nbIconBtn = "relative flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[#1A1A2E] bg-white shadow-[2px_2px_0_#1A1A2E] transition-all duration-150 hover:shadow-[3px_3px_0_#1A1A2E] hover:-translate-y-[1px] active:shadow-none active:translate-y-0"

  return (
    <nav className="sticky top-0 z-50 bg-[#FFF8F0] py-2">
      <div className="mx-auto w-full max-w-[1240px] px-3 sm:px-4 lg:px-6">
        <div className="flex h-16 items-center justify-between gap-2 sm:gap-3 lg:gap-5">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Trigger */}
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className={`${nbIconBtn} lg:hidden`}
            >
              <Menu size={20} className="text-[#1A1A2E]" />
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

          {/* ── Desktop Nav Bar ── */}
          <div className="hidden w-full max-w-[760px] items-center rounded-xl border-2 border-[#1A1A2E] bg-white px-2 py-1 shadow-[4px_4px_0_#1A1A2E] lg:flex">
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
                      className={`${nbNavLink} ${isActive ? nbNavLinkActive : nbNavLinkIdle}`}
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
                    className={`${nbNavLink} ${isActive ? nbNavLinkActive : nbNavLinkIdle}`}
                  >
                    {item.label}
                  </a>
                )
              })}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className={`${nbNavLink} outline-none focus:outline-none focus:ring-0 ${isProductsActive ? nbNavLinkActive : nbNavLinkIdle}`}>
                    Sản phẩm <ChevronDown size={14} className="ml-1" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="z-[70] w-72 rounded-xl border-2 border-[#1A1A2E] bg-white p-1.5 shadow-[4px_4px_0_#1A1A2E]">
                  <div className="mb-1 rounded-lg bg-[#EDE9FE] px-3 py-2 border border-[#1A1A2E]/10">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#1A1A2E]">Khám phá sản phẩm</p>
                  </div>
                  <DropdownMenuItem asChild className="group m-0 cursor-pointer rounded-lg px-2 py-2 transition-all duration-150 data-[highlighted]:bg-[#FFF8F0]">
                    <Link to="/schools" className="flex w-full items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-[#1A1A2E] bg-[#C8E44D] shadow-[2px_2px_0_#1A1A2E]">
                        <GraduationCap size={16} className="text-[#1A1A2E]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#1A1A2E]">Tìm trường</p>
                        <p className="text-xs text-[#6B7280]">Danh sách trường và đối tác đồng phục</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="group m-0 cursor-pointer rounded-lg px-2 py-2 transition-all duration-150 data-[highlighted]:bg-[#FFF8F0]">
                    <Link to="/products" className="flex w-full items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-[#1A1A2E] bg-[#EDE9FE] shadow-[2px_2px_0_#1A1A2E]">
                        <Package size={16} className="text-[#1A1A2E]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#1A1A2E]">Kho đồng phục</p>
                        <p className="text-xs text-[#6B7280]">Mẫu sản phẩm sẵn có để đặt nhanh</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Link to="/contact-partnership" className={`${nbNavLink} ${isContactActive ? nbNavLinkActive : nbNavLinkIdle}`}>
                Liên hệ
              </Link>
            </div>

            <div className="mx-2 h-6 w-px bg-[#1A1A2E]/15" />

            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Input placeholder="Tìm kiếm..." className="h-9 border-none bg-transparent text-sm font-medium shadow-none focus-visible:ring-0 placeholder:text-[#9CA3AF]" />
              <button type="button" className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border-2 border-[#1A1A2E] bg-[#1A1A2E] text-white shadow-[2px_2px_0_#6B7280] transition-all duration-150 hover:shadow-[3px_3px_0_#6B7280] hover:-translate-y-[1px] active:shadow-none active:translate-y-0">
                <Search size={16} />
              </button>
            </div>
          </div>

          {/* ── Right Actions ── */}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => navigate("/cart")}
              className={nbIconBtn}
            >
              <ShoppingCart size={18} className="text-[#1A1A2E]" />
              {cartCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-md border-2 border-[#1A1A2E] bg-[#C8E44D] text-[10px] font-black text-[#1A1A2E]">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>

            <button type="button" className={nbIconBtn}>
              <Bell size={18} className="text-[#1A1A2E]" />
            </button>

            {loggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="hidden h-11 items-center gap-2 rounded-xl border-2 border-[#1A1A2E] bg-white px-3 shadow-[3px_3px_0_#1A1A2E] transition-all duration-150 hover:-translate-y-[1px] hover:shadow-[4px_4px_0_#1A1A2E] active:shadow-none active:translate-y-0 lg:flex !outline-none"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-[#1A1A2E] bg-[#EDE9FE]">
                      <User size={14} className="text-[#1A1A2E]" />
                    </div>
                    <span className="max-w-[120px] truncate text-sm font-bold text-[#1A1A2E]">{userName}</span>
                    <ChevronDown size={14} className="text-[#1A1A2E]/50" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-[70] w-56 rounded-xl border-2 border-[#1A1A2E] bg-white p-0 shadow-[4px_4px_0_#1A1A2E]">
                  {userRole === "Parent" && (
                    <>
                      <div className="border-b-2 border-[#1A1A2E]/10">
                        <DropdownMenuItem asChild className="cursor-pointer transition-colors duration-150 data-[highlighted]:bg-[#FFF8F0] m-0 rounded-none px-3 py-2.5">
                          <Link to="/parentprofile/account" className="flex w-full items-center gap-3">
                            <User size={16} className="text-[#1A1A2E] flex-shrink-0" />
                            <span className="text-sm font-bold text-[#1A1A2E]">Tài khoản</span>
                          </Link>
                        </DropdownMenuItem>
                      </div>
                      <div className="border-b-2 border-[#1A1A2E]/10">
                        {parentProfileItems.slice(1, 5).map((item) => {
                          const IconComp = item.icon
                          return (
                            <DropdownMenuItem key={item.to} asChild className="cursor-pointer transition-colors duration-150 data-[highlighted]:bg-[#FFF8F0] m-0 rounded-none px-3 py-2.5">
                              <Link to={item.to} className="flex w-full items-center gap-3">
                                <IconComp size={16} className="text-[#1A1A2E] flex-shrink-0" />
                                <span className="text-sm font-medium text-[#1A1A2E]">{item.label}</span>
                              </Link>
                            </DropdownMenuItem>
                          )
                        })}
                      </div>
                      <div>
                        <DropdownMenuItem asChild className="cursor-pointer transition-colors duration-150 data-[highlighted]:bg-[#FFF8F0] m-0 rounded-none px-3 py-2.5">
                          <Link to="/parentprofile/settings" className="flex w-full items-center gap-3">
                            <Settings size={16} className="text-[#1A1A2E] flex-shrink-0" />
                            <span className="text-sm font-medium text-[#1A1A2E]">Cài đặt</span>
                          </Link>
                        </DropdownMenuItem>
                        <div className="border-t-2 border-[#1A1A2E]/10 px-3 py-2.5">
                          <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 text-sm font-bold text-red-600 hover:text-red-700 transition-colors">
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
              <button
                type="button"
                onClick={() => navigate("/signin")}
                className="hidden h-10 items-center gap-2 rounded-xl border-2 border-[#1A1A2E] bg-white px-4 font-bold text-sm text-[#1A1A2E] shadow-[3px_3px_0_#1A1A2E] transition-all duration-150 hover:-translate-y-[1px] hover:shadow-[4px_4px_0_#1A1A2E] active:shadow-none active:translate-y-0 lg:flex"
              >
                <LogIn size={14} />
                <span>Đăng nhập</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile Menu Overlay (CSS-only, no Framer Motion) ── */}
      {isMenuOpen && (
        <>
          <div
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 z-[100] bg-[#1A1A2E]/40"
          />
          <div
            className="fixed inset-y-0 left-0 z-[101] w-[280px] border-r-2 border-[#1A1A2E] bg-[#FFF8F0] p-6 shadow-[6px_0_0_#1A1A2E] animate-in slide-in-from-left duration-300"
          >
            <div className="flex items-center justify-between mb-8">
              <img src="https://api.builder.io/api/v1/image/assets/TEMP/b5b02bd27ae25e8fcc3a61694891ffa491402bfb?width=328" alt="VTOS Logo" className="h-8 w-auto" />
              <button onClick={() => setIsMenuOpen(false)} className={nbIconBtn}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-1">
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
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold transition-all duration-150 ${isActive ? "bg-[#1A1A2E] text-white shadow-[3px_3px_0_#6B7280]" : "text-[#1A1A2E] hover:bg-white border border-transparent hover:border-[#1A1A2E]/10"}`}
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
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold transition-all duration-150 ${isActive ? "bg-[#1A1A2E] text-white shadow-[3px_3px_0_#6B7280]" : "text-[#1A1A2E] hover:bg-white border border-transparent hover:border-[#1A1A2E]/10"}`}
                  >
                    {item.label}
                  </a>
                )
              })}

              <div className="pt-4 mt-4 border-t-2 border-[#1A1A2E]/10">
                <p className="px-4 mb-2 text-xs font-black uppercase tracking-wider text-[#1A1A2E]/40">Sản phẩm</p>
                <Link to="/schools" className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold text-[#1A1A2E] hover:bg-white transition-colors">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-[#1A1A2E] bg-[#C8E44D] shadow-[2px_2px_0_#1A1A2E]">
                    <GraduationCap size={14} />
                  </div>
                  Tìm trường
                </Link>
                <Link to="/products" className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold text-[#1A1A2E] hover:bg-white transition-colors">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-[#1A1A2E] bg-[#EDE9FE] shadow-[2px_2px_0_#1A1A2E]">
                    <Package size={14} />
                  </div>
                  Kho đồng phục
                </Link>
              </div>

              <Link 
                to="/contact-partnership"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold transition-all duration-150 ${isContactActive ? "bg-[#1A1A2E] text-white shadow-[3px_3px_0_#6B7280]" : "text-[#1A1A2E] hover:bg-white border border-transparent hover:border-[#1A1A2E]/10"}`}
              >
                Liên hệ
              </Link>

              <div className="pt-8 space-y-3">
                {!loggedIn && (
                  <button
                    type="button"
                    onClick={() => { navigate("/signin"); setIsMenuOpen(false); }}
                    className="w-full h-12 rounded-xl border-2 border-[#1A1A2E] bg-[#1A1A2E] text-white font-bold shadow-[4px_4px_0_#6B7280] transition-all duration-150 hover:shadow-[5px_5px_0_#6B7280] active:shadow-none active:translate-y-[2px]"
                  >
                    Đăng nhập ✦
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  )
}
