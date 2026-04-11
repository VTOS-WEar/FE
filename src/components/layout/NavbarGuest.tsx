import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Bell, ChevronDown, Clock, GraduationCap, History, LogIn, LogOut, Menu, Package, ScanLine, Search, Settings, ShoppingCart, Star, User, Users, X } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useNavigate, Link, useLocation } from "react-router-dom"
import { useCart } from "../../contexts/CartContext"
import { getParentProfile } from "../../lib/api/users"
import { searchPublic, type PublicSearchResponse } from "../../lib/api/public"

function getSessionUser(): { fullName: string; role: string; avatar?: string | null } | null {
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
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const check = () => {
      const hasSession = isLoggedIn()
      setLoggedIn(hasSession)
      if (hasSession) {
        const u = getSessionUser()
        setUserName(u?.fullName || "Hồ sơ")
        setUserRole(u?.role || "")
        setUserAvatar(u?.avatar || null)
      }
    }
    check()
    const interval = setInterval(check, 500)
    return () => clearInterval(interval)
  }, [])

  // Fetch avatar from API when logged in as Parent but localStorage has no avatar yet
  useEffect(() => {
    if (!loggedIn || userAvatar || userRole !== "Parent") return
    getParentProfile()
      .then(data => {
        if (!data.avatar) return
        setUserAvatar(data.avatar)
        const storage = localStorage.getItem("access_token") ? localStorage : sessionStorage
        const raw = storage.getItem("user")
        if (raw) {
          try {
            storage.setItem("user", JSON.stringify({ ...JSON.parse(raw), avatar: data.avatar }))
          } catch { }
        }
      })
      .catch(() => { })
  }, [loggedIn, userRole, userAvatar])

  // Keep avatar in sync when AccountTab or ParentProfile dispatch vtos:user-updated
  useEffect(() => {
    const refresh = () => {
      const u = getSessionUser()
      if (u) {
        setUserName(u.fullName || "Hồ sơ")
        setUserAvatar(u.avatar || null)
      }
    }
    window.addEventListener("vtos:user-updated", refresh)
    return () => window.removeEventListener("vtos:user-updated", refresh)
  }, [])

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false)
    setShowDropdown(false)
  }, [location.pathname, location.hash])

  const cartCount = loggedIn ? cartCtx.getItemCount() : 0

  /* ── Search state ── */
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<PublicSearchResponse | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  const onSearchChange = (value: string) => {
    setSearchQuery(value)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    if (!value.trim()) {
      setSearchResults(null)
      setShowDropdown(false)
      return
    }
    setSearchLoading(true)
    setShowDropdown(true)
    searchTimerRef.current = setTimeout(async () => {
      try {
        const data = await searchPublic(value.trim())
        setSearchResults(data)
      } catch {
        setSearchResults(null)
      } finally {
        setSearchLoading(false)
      }
    }, 300)
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

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
    { label: "Cách hoạt động", type: "route", to: "/huong-dan-try-on" },
  ] as const
  const parentProfileItems = [
    { label: "Tài khoản", to: "/parentprofile/account", icon: User },
    { label: "Học sinh", to: "/parentprofile/students", icon: Users },
    { label: "Đơn hàng", to: "/parentprofile/orders", icon: Package },
    { label: "Lịch sử thử đồ", to: "/parentprofile/history", icon: History },
    { label: "Lịch sử Bodygram", to: "/parentprofile/bodygram-history", icon: ScanLine },
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
  const nbNavLinkActive = "bg-[#1A1A2E] text-white ring-1 ring-[#1A1A2E] shadow-none"
  const nbNavLinkIdle = "text-[#1A1A2E] hover:bg-[#1A1A2E]/5"
  const nbIconBtn = "relative flex h-10 w-10 items-center justify-center rounded-lg border border-[#1A1A2E] bg-white shadow-[2px_2px_0_#1A1A2E] transition-all duration-150 hover:shadow-[3px_3px_0_#1A1A2E] hover:-translate-y-[1px] active:shadow-none active:translate-y-0"

  return (
    <nav className="sticky top-0 z-50 border-b border-[#1A1A2E]/15 bg-[#FFF8F0]/95 py-2 backdrop-blur supports-[backdrop-filter]:bg-[#FFF8F0]/90">
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
          <div className="hidden w-full max-w-[760px] items-center rounded-xl border border-[#1A1A2E] bg-white px-2 py-1 shadow-[4px_4px_0_#1A1A2E] lg:flex">
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

            {/* ── Search Bar ── */}
            <div className="relative flex min-w-0 flex-1 items-center gap-2" ref={searchContainerRef}>
              <Input
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
                    setSearchQuery("")
                    setSearchResults(null)
                    setShowDropdown(false)
                  }
                  if (e.key === "Escape") {
                    setSearchQuery("")
                    setSearchResults(null)
                    setShowDropdown(false)
                  }
                }}
                onFocus={() => { if (searchResults) setShowDropdown(true) }}
                placeholder="Tìm kiếm trường, đồng phục..."
                className="h-9 border-none bg-transparent text-sm font-medium shadow-none focus-visible:ring-0 placeholder:text-[#9CA3AF]"
              />
              <button
                type="button"
                onClick={() => {
                  if (searchQuery.trim()) {
                    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
                    setSearchQuery("")
                    setSearchResults(null)
                    setShowDropdown(false)
                  }
                }}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-[#1A1A2E] bg-[#1A1A2E] text-white shadow-[2px_2px_0_#6B7280] transition-all duration-150 hover:shadow-[3px_3px_0_#6B7280] hover:-translate-y-[1px] active:shadow-none active:translate-y-0"
              >
                <Search size={16} />
              </button>

              {/* ── Search Dropdown ── */}
              {showDropdown && (searchResults || searchLoading) && (
                <div className="absolute top-full left-0 right-0 mt-2 z-[200] rounded-xl border-2 border-[#1A1A2E] bg-white shadow-[4px_4px_0_#1A1A2E] overflow-hidden">
                  {searchLoading && (
                    <div className="flex items-center justify-center gap-3 py-6">
                      <div className="w-5 h-5 rounded-full border-2 border-[#EDE9FE] border-t-[#1A1A2E] animate-spin" />
                      <span className="text-sm text-[#6B7280] font-medium">Đang tìm...</span>
                    </div>
                  )}
                  {!searchLoading && searchResults && (
                    <>
                      {/* Schools section */}
                      {searchResults.schools.length > 0 && (
                        <div>
                          <div className="px-4 py-2 bg-[#F6F1E8] border-b border-[#1A1A2E]/10">
                            <span className="text-[11px] font-black uppercase tracking-wider text-[#1A1A2E]/50">Trường học</span>
                          </div>
                          {searchResults.schools.slice(0, 3).map(school => (
                            <button
                              key={school.id}
                              onClick={() => {
                                navigate(`/schools/${school.id}`)
                                setSearchQuery("")
                                setSearchResults(null)
                                setShowDropdown(false)
                              }}
                              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#FFF8F0] transition-colors border-b border-[#1A1A2E]/5 last:border-0"
                            >
                              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-[#1A1A2E]/20 bg-[#C8E44D] shadow-[1px_1px_0_#1A1A2E]">
                                <GraduationCap size={14} className="text-[#1A1A2E]" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-[#1A1A2E] truncate">{school.schoolName}</p>
                                <p className="text-xs text-[#6B7280] truncate">{school.address || "—"}</p>
                              </div>
                              <span className="text-[10px] font-bold text-[#6B7280] shrink-0">{school.uniformCount} đồng phục</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {/* Uniforms section */}
                      {searchResults.uniforms.length > 0 && (
                        <div>
                          <div className="px-4 py-2 bg-[#F6F1E8] border-b border-[#1A1A2E]/10">
                            <span className="text-[11px] font-black uppercase tracking-wider text-[#1A1A2E]/50">Đồng phục</span>
                          </div>
                          {searchResults.uniforms.slice(0, 3).map(item => (
                            <button
                              key={item.id}
                              onClick={() => {
                                navigate(`/outfits/${item.id}`)
                                setSearchQuery("")
                                setSearchResults(null)
                                setShowDropdown(false)
                              }}
                              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#FFF8F0] transition-colors border-b border-[#1A1A2E]/5 last:border-0"
                            >
                              <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-lg border border-[#1A1A2E]/20 shadow-[1px_1px_0_#1A1A2E]">
                                {item.mainImageUrl ? (
                                  <img src={item.mainImageUrl} alt={item.outfitName} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-[#EDE9FE]">
                                    <Package size={12} className="text-[#1A1A2E]" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-[#1A1A2E] truncate">{item.outfitName}</p>
                                <p className="text-xs text-[#6B7280] truncate">{item.schoolName}</p>
                              </div>
                              <span className="text-[11px] font-extrabold text-[#6938EF] shrink-0">
                                {new Intl.NumberFormat("vi-VN").format(item.price)}đ
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                      {/* Footer: view all */}
                      {(searchResults.totalSchools > 0 || searchResults.totalUniforms > 0) && (
                        <button
                          onClick={() => {
                            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
                            setSearchQuery("")
                            setSearchResults(null)
                            setShowDropdown(false)
                          }}
                          className="flex w-full items-center justify-center gap-2 px-4 py-3 bg-[#F6F1E8] border-t-2 border-[#1A1A2E]/10 text-sm font-bold text-[#6938EF] hover:bg-[#EDE9FE] transition-colors"
                        >
                          Xem {searchResults.totalSchools + searchResults.totalUniforms} kết quả →
                        </button>
                      )}
                      {/* No results */}
                      {searchResults.schools.length === 0 && searchResults.uniforms.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 gap-2">
                          <Search size={24} className="text-[#9CA3AF]" />
                          <p className="text-sm font-medium text-[#6B7280]">Không tìm thấy kết quả cho "{searchQuery}"</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
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
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt="Avatar"
                        className="h-7 w-7 rounded-lg border-2 border-[#1A1A2E] object-cover"
                      />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-[#1A1A2E] bg-[#EDE9FE]">
                        <User size={14} className="text-[#1A1A2E]" />
                      </div>
                    )}
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
                        {parentProfileItems.slice(1, 6).map((item) => {
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
                className="group relative hidden h-10 items-center gap-2 overflow-hidden rounded-xl border border-[#1A1A2E] bg-gradient-to-r from-[#C8E44D] via-[#FDE68A] to-[#EDE9FE] px-4 font-bold text-sm text-[#1A1A2E] shadow-[3px_3px_0_#1A1A2E] transition-all duration-150 hover:-translate-y-[1px] hover:shadow-[5px_5px_0_#1A1A2E] active:shadow-none active:translate-y-0 lg:flex"
              >
                <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.55),transparent_40%)] opacity-80 transition-opacity duration-150 group-hover:opacity-100" />
                <LogIn size={14} className="relative" />
                <span className="relative">Đăng nhập</span>
                <span className="relative text-[11px] leading-none">✦</span>
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
