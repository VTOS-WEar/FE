import { Facebook, Youtube, Instagram, MapPin, Phone, Mail } from "lucide-react";

export const Footer = (): JSX.Element => {
  return (
    <footer className="relative w-full overflow-hidden bg-gradient-to-b from-[#f8fafc] via-[#f3e8ff] to-[#60a5fa] pt-14 border-t-3 border-[#1A1A2E]">

      <div className="relative z-10 mx-auto max-w-[1100px] px-6 lg:px-8">

        {/* Top Section: CTA & Subscription */}
        <div className="flex flex-col items-center text-center space-y-8 pb-10 border-b-2 border-[#1A1A2E]/10">
          <div className="space-y-5">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#1A1A2E] leading-tight max-w-[700px]">
              Nền tảng thử đồng phục trực tuyến bằng AI dành cho học sinh, phụ huynh và trường học.
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <a href="/schools" className="nb-btn nb-btn-purple text-base px-8 py-3">
                <span className="tracking-wide uppercase">Thử ngay</span>
                <span>→</span>
              </a>

              <div className="flex items-center bg-white p-1 pr-1.5 border-3 border-[#1A1A2E] rounded-xl shadow-[4px_4px_0_#1A1A2E] w-full max-w-[360px]">
                <input
                  type="email"
                  placeholder="Nhập email của bạn"
                  className="bg-transparent text-[#1A1A2E] placeholder:text-[#6B7280] outline-none flex-1 px-3 py-2 text-sm font-semibold"
                />
                <button className="nb-btn nb-btn-purple h-8 text-xs uppercase rounded-lg">
                  Gửi ngay
                </button>
              </div>
            </div>
          </div>
          <p className="text-sm text-[#1A1A2E]/60 font-medium leading-relaxed max-w-[450px]">
            Cập nhật những thông tin, hiểu biết và sự kiện mới nhất từ VTOS.
          </p>
        </div>

        {/* Middle Section: Links Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10 py-12">
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
                  className="w-9 h-9 flex items-center justify-center rounded-lg border-2 border-[#1A1A2E] bg-white shadow-[2px_2px_0_#1A1A2E] hover:shadow-[3px_3px_0_#1A1A2E] hover:-translate-y-[1px] transition-all"
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
                { label: "Cách hoạt động", href: "/homepage#how-it-works" },
                { label: "Tìm trường học", href: "/schools" },
                { label: "Kho đồng phục", href: "/schools" },
                { label: "Liên hệ", href: "/contact" },
              ].map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="text-sm font-semibold text-[#1A1A2E]/80 hover:text-[#B8A9E8] transition-colors">{item.label}</a>
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
                  <a href="#" className="text-sm font-semibold text-[#1A1A2E]/80 hover:text-[#B8A9E8] transition-colors">{item}</a>
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
        <div className="flex flex-col md:flex-row justify-between items-center py-8 border-t-2 border-[#1A1A2E]/10 gap-4">
          <p className="text-xs font-bold text-[#1A1A2E]/40">© 2025 VTOS. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-[11px] font-bold text-[#1A1A2E]/30 hover:text-[#1A1A2E] uppercase tracking-wider transition-all">Cookies Policy</a>
            <a href="#" className="text-[11px] font-bold text-[#1A1A2E]/30 hover:text-[#1A1A2E] uppercase tracking-wider transition-all">Legal Notice</a>
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
