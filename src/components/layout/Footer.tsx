import { Facebook, Youtube, Instagram, MapPin, Phone, Mail } from "lucide-react";

export const Footer = (): JSX.Element => {
  return (
    <footer className="relative w-full overflow-hidden border-t-2 border-[#1A1A2E] bg-gradient-to-b from-[#faf7ff] via-[#f4ecff] to-[#d8ecff] pt-14">
      <div className="pointer-events-none absolute -top-24 left-[-8%] h-56 w-56 rounded-full bg-[#B8A9E8]/30 blur-3xl" />
      <div className="pointer-events-none absolute right-[-10%] top-12 h-64 w-64 rounded-full bg-[#A8D4E6]/35 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-[1100px] px-6 lg:px-8">

        {/* Top Section: CTA & Subscription */}
        <div className="relative flex flex-col items-center space-y-8 rounded-2xl border border-[#1A1A2E]/15 bg-white/70 px-5 py-8 text-center shadow-[0_12px_35px_rgba(26,26,46,0.08)] backdrop-blur-sm md:px-8">
          <div className="mx-auto flex w-full flex-col items-center space-y-5">
            <h2 className="mx-auto max-w-[700px] text-2xl font-extrabold leading-tight text-[#1A1A2E] md:text-3xl lg:text-4xl">
              Nền tảng thử đồng phục trực tuyến bằng AI dành cho học sinh, phụ huynh và trường học.
            </h2>
            <div className="mx-auto flex w-full max-w-[430px] flex-col items-center justify-center gap-3 pt-2">
              <a
                href="/schools"
                className="group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-[10px] border border-[#1A1A2E] bg-gradient-to-r from-[#C8E44D] via-[#FDE68A] to-[#EDE9FE] px-7 text-base font-extrabold text-[#1A1A2E] shadow-[3px_3px_0_#1A1A2E] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[5px_5px_0_#1A1A2E] active:translate-y-[1px] active:shadow-[2px_2px_0_#1A1A2E]"
              >
                <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.55),transparent_40%)] opacity-80 transition-opacity duration-150 group-hover:opacity-100" />
                <span className="tracking-wide uppercase">Thử ngay</span>
                <span className="relative transition-transform duration-200 group-hover:translate-x-1">→</span>
              </a>

              <div className="flex h-12 w-full items-center gap-1.5 rounded-[12px] border border-[#1A1A2E]/25 bg-white px-2 shadow-[0_8px_20px_rgba(26,26,46,0.12)]">
                <input
                  type="email"
                  placeholder="Nhập email của bạn"
                  className="h-full flex-1 bg-transparent px-3 text-sm font-semibold text-[#1A1A2E] placeholder:text-[#6B7280] outline-none"
                />
                <button className="group relative inline-flex h-8 items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-[9px] border-2 border-[#1A1A2E] bg-gradient-to-r from-[#B8A9E8] via-[#C7BBEE] to-[#A996E2] px-4 text-sm font-extrabold text-[#1A1A2E] shadow-[3px_3px_0_#1A1A2E] transition-all duration-200 hover:-translate-y-[1px] hover:brightness-110 hover:shadow-[5px_5px_0_#1A1A2E] active:translate-y-[1px] active:shadow-[2px_2px_0_#1A1A2E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A2E] focus-visible:ring-offset-2">
                  <span className="pointer-events-none absolute -left-8 top-0 h-full w-10 -skew-x-12 bg-white/25 blur-[1px] transition-all duration-300 group-hover:left-[105%]" />
                  <span className="relative">Gửi ngay</span>
                </button>
              </div>
            </div>
          </div>
          <p className="text-sm text-[#1A1A2E]/60 font-medium leading-relaxed max-w-[450px]">
            Cập nhật những thông tin, hiểu biết và sự kiện mới nhất từ VTOS.
          </p>
        </div>

        {/* Middle Section: Links Grid */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Brand */}
          <div className="space-y-4">
            <img
              className="w-[100px] h-auto"
              alt="VTOS Logo"
              src="https://api.builder.io/api/v1/image/assets/TEMP/b5b02bd27ae25e8fcc3a61694891ffa491402bfb?width=328"
            />
            <p className="text-sm font-medium text-[#1A1A2E]/70 leading-relaxed">
              Thử đồ ảo AI hàng đầu. Nâng tầm trải nghiệm mua sắm trực tuyến cho phụ huynh và học sinh.
            </p>
            <div className="flex gap-2">
              {[
                { Icon: Facebook, label: "Facebook" },
                { Icon: Instagram, label: "Instagram" },
                { Icon: Youtube, label: "YouTube" },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#1A1A2E]/35 bg-white/90 shadow-[0_6px_14px_rgba(26,26,46,0.12)] transition-all duration-200 hover:-translate-y-[2px] hover:border-[#1A1A2E]/60 hover:bg-white hover:shadow-[0_10px_22px_rgba(26,26,46,0.22)]"
                >
                  <Icon size={14} className="text-[#1A1A2E]" />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#1A1A2E]/40">Khám phá</h4>
            <ul className="space-y-2.5">
              {[
                { label: "Trang chủ", href: "/homepage" },
                { label: "Cách hoạt động", href: "/huong-dan-try-on" },
                { label: "Tìm trường học", href: "/schools" },
                { label: "Kho đồng phục", href: "/schools" },
                { label: "Liên hệ", href: "/contact" },
              ].map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="group inline-flex text-sm font-semibold text-[#1A1A2E]/80 transition-colors hover:text-[#7C63C9]">
                    <span className="bg-gradient-to-r from-[#7C63C9] to-[#7C63C9] bg-[length:0%_1.5px] bg-left-bottom bg-no-repeat transition-all duration-200 group-hover:bg-[length:100%_1.5px]">
                      {item.label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Support */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#1A1A2E]/40">Hỗ trợ</h4>
            <ul className="space-y-2.5">
              {["Câu hỏi thường gặp", "Chính sách bảo mật", "Điều khoản dịch vụ", "Chính sách đổi trả"].map((item) => (
                <li key={item}>
                  <a href="#" className="group inline-flex text-sm font-semibold text-[#1A1A2E]/80 transition-colors hover:text-[#7C63C9]">
                    <span className="bg-gradient-to-r from-[#7C63C9] to-[#7C63C9] bg-[length:0%_1.5px] bg-left-bottom bg-no-repeat transition-all duration-200 group-hover:bg-[length:100%_1.5px]">
                      {item}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#1A1A2E]/40">Liên hệ</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <div className="p-1 bg-[#EDE9FE] rounded-md border border-[#1A1A2E]">
                  <MapPin className="w-3.5 h-3.5 text-[#1A1A2E]" />
                </div>
                <span className="text-sm font-semibold text-[#1A1A2E]/90">Ngũ Hành Sơn, Đà Nẵng</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="p-1 bg-[#EDE9FE] rounded-md border border-[#1A1A2E]">
                  <Phone className="w-3.5 h-3.5 text-[#1A1A2E]" />
                </div>
                <span className="text-sm font-semibold text-[#1A1A2E]/90">+84 123 456 789</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="p-1 bg-[#EDE9FE] rounded-md border border-[#1A1A2E]">
                  <Mail className="w-3.5 h-3.5 text-[#1A1A2E]" />
                </div>
                <span className="text-sm font-semibold text-[#1A1A2E]/90">support@vtos.vn</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-[#1A1A2E]/15 py-8 md:flex-row">
          <p className="text-xs font-bold text-[#1A1A2E]/45">© 2025 VTOS. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-[11px] font-bold uppercase tracking-wider text-[#1A1A2E]/35 transition-all hover:text-[#1A1A2E]">Cookies Policy</a>
            <span className="h-1 w-1 rounded-full bg-[#1A1A2E]/30" />
            <a href="#" className="text-[11px] font-bold uppercase tracking-wider text-[#1A1A2E]/35 transition-all hover:text-[#1A1A2E]">Legal Notice</a>
          </div>
        </div>
      </div>

      {/* VTOS Watermark — Gochi Hand font like hero */}
      <div className="absolute bottom-[-10%] md:bottom-[-15%] left-1/2 -translate-x-1/2 w-full text-center pointer-events-none opacity-[0.04] select-none">
        <h1
          className="text-[30vw] font-normal text-[#1A1A2E] leading-none"
          style={{ fontFamily: "'Gochi Hand', cursive" }}
        >
          VTOS
        </h1>
      </div>
    </footer>
  );
};
