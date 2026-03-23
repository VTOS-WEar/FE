import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Bell, ChevronDown, LogIn, Menu, Search, ShoppingCart, User } from "lucide-react"
import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
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
  const cartCtx = useCart()
  const [loggedIn, setLoggedIn] = useState(isLoggedIn())
  const [userName, setUserName] = useState("")
  const [userRole, setUserRole] = useState("")

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

  const cartCount = loggedIn ? cartCtx.getItemCount() : 0
  const profilePath = userRole === "School" ? "/school/profile" : "/parentprofile"

  const navItems = [
    { label: "Trang chủ", type: "route", to: "/homepage" },
    { label: "Cách hoạt động", type: "anchor", href: "#how-it-works" },
    { label: "Liên hệ", type: "anchor", href: "#contact" },
  ] as const
  const desktopNavClass = "flex h-10 items-center rounded-full px-3 lg:px-4 text-sm font-semibold transition-colors"

  return (
    <nav className="sticky top-0 z-50 border-b border-[#e0d9ff] bg-[#eeebff]">
      <div className="mx-auto w-full max-w-[1240px] px-3 sm:px-4 lg:px-6">
        <div className="grid h-16 grid-cols-[auto,1fr,auto] items-center gap-2 sm:gap-3 lg:gap-5">

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

          <div className="hidden w-full items-center justify-center md:flex">
            <div className="flex h-11 w-full max-w-[760px] items-center rounded-full border border-purple-200 bg-white px-2 shadow-sm">
              <div className="flex items-center gap-1">
                {navItems.map((item, index) => {
                  if (item.type === "route") {
                    return (
                      <Link
                        key={item.label}
                        to={item.to}
                        className={`${desktopNavClass} ${
                          index === 0 ? "text-purple-600" : "text-gray-700"
                        }`}
                      >
                        {item.label}
                      </Link>
                    )
                  }

                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      className={`${desktopNavClass} text-gray-700`}
                    >
                      {item.label}
                    </a>
                  )
                })}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-10 rounded-full px-3 lg:px-4 text-sm font-semibold text-gray-700">
                      Sản phẩm <ChevronDown size={14} className="ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52">
                    <DropdownMenuItem asChild>
                      <Link to="/schools">Tìm trường</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/products">Kho đồng phục</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mx-2 h-6 w-px bg-purple-200" />

              <div className="flex min-w-0 flex-1 items-center gap-2">
                <Input
                  placeholder="Tìm kiếm..."
                  className="h-9 border-none bg-transparent text-sm shadow-none focus-visible:ring-0"
                />
                <Button
                  size="icon"
                  className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-600 to-purple-500 hover:opacity-90"
                >
                  <Search size={16} />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-1 sm:gap-2">
            <Button
              onClick={() => navigate("/cart")}
              variant="outline"
              size="icon"
              className="relative h-9 w-9 rounded-full shadow-sm transition hover:-translate-y-[1px]"
            >
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full shadow-sm transition hover:-translate-y-[1px]"
            >
              <Bell size={18} />
            </Button>

            {loggedIn ? (
              <Link
                to={profilePath}
                className="hidden h-9 items-center gap-2 rounded-full border border-gray-200 bg-white px-3 shadow-sm transition hover:-translate-y-[1px] hover:bg-gray-50 lg:flex"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100">
                  <User size={14} className="text-purple-600" />
                </div>
                <span className="max-w-[120px] truncate text-sm font-semibold">{userName}</span>
                <ChevronDown size={14} className="text-gray-400" />
              </Link>
            ) : (
              <Button
                onClick={() => navigate("/signin")}
                variant="outline"
                className="hidden h-9 items-center gap-2 rounded-full px-3 shadow-sm transition hover:-translate-y-[1px] lg:flex"
              >
                <LogIn size={14} />
                <span className="text-sm font-semibold">Đăng nhập</span>
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full shadow-sm md:hidden"
                >
                  <Menu size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {navItems.map((item) => (
                  <DropdownMenuItem key={item.label} asChild>
                    {item.type === "route" ? (
                      <Link to={item.to}>{item.label}</Link>
                    ) : (
                      <a href={item.href}>{item.label}</a>
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem asChild>
                  <Link to="/schools">Tìm trường</Link>
                </DropdownMenuItem>
                {loggedIn ? (
                  <DropdownMenuItem asChild>
                    <Link to={profilePath}>Hồ sơ</Link>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem asChild>
                    <button type="button" onClick={() => navigate("/signin")} className="w-full text-left">
                      Đăng nhập
                    </button>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
}
