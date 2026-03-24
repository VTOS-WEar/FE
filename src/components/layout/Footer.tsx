import { Facebook, Youtube, Play, AtSign, MapPin, Phone, Mail, Instagram } from "lucide-react";

export const Footer = (): JSX.Element => {
  return (
    <footer className="relative w-full overflow-hidden bg-gradient-to-b from-[#f8fafc] via-[#f3e8ff] to-[#60a5fa] pt-12 md:pt-16 mt-12 md:mt-16">
      {/* Mesh Gradient Overlay */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_20%_30%,#f0abfc_0%,transparent_50%),radial-gradient(circle_at_80%_70%,#60a5fa_0%,transparent_50%)]" />

      <div className="relative z-10 mx-auto max-w-[1240px] px-6">
        {/* Top Section: CTA & Subscription (Compact) */}
        <div className="flex flex-col items-center text-center space-y-8 pb-10 border-b border-black/5">
          <div className="space-y-5">
            <h2 className="[font-family:'Baloo_2',Helvetica] text-2xl md:text-3xl lg:text-4xl font-bold text-[#1a1a1a] leading-tight max-w-[700px]">
              Nền tảng thử đồng phục trực tuyến bằng AI dành cho học sinh, phụ huynh và trường học.
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <button className="group flex items-center gap-3 bg-[#0000FF] hover:bg-[#0000CC] text-white px-8 py-3.5 rounded-full text-base font-bold transition-all hover:scale-105 shadow-lg">
                <span className="tracking-wide uppercase">THỬ NGAY</span>
                <div className="bg-white rounded-full p-1 text-[#0000FF] transition-transform group-hover:translate-x-1">
                  <Play size={10} fill="currentColor" strokeWidth={0} />
                </div>
              </button>

              <div className="flex items-center bg-white/50 backdrop-blur-md rounded-full p-1 pr-1.5 border border-white/60 shadow-sm w-full max-w-[360px]">
                <div className="pl-3 text-[#0000FF]">
                  <AtSign size={18} />
                </div>
                <input
                  type="email"
                  placeholder="Nhập email của bạn"
                  className="bg-transparent text-[#1a1a1a] placeholder:text-[#1a1a1a]/40 outline-none flex-1 px-3 py-2 text-sm font-medium"
                />
                <button className="bg-[#0000FF] text-white font-bold px-5 py-2 rounded-full hover:bg-[#0000CC] transition-all whitespace-nowrap text-xs uppercase">
                  Gửi ngay
                </button>
              </div>
            </div>
          </div>
          <p className="text-sm text-[#1a1a1a]/60 font-medium leading-relaxed max-w-[450px]">
            Cập nhật những thông tin, hiểu biết và sự kiện mới nhất từ VTOS.
          </p>
        </div>

        {/* Middle Section: Links Grid (More compact) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10 py-12">
          {/* Column 1: Brand */}
          <div className="space-y-4">
            <img
              className="w-[100px] h-auto grayscale opacity-80"
              alt="VTOS Logo"
              src="https://api.builder.io/api/v1/image/assets/TEMP/b5b02bd27ae25e8fcc3a61694891ffa491402bfb?width=328"
            />
            <p className="text-sm font-medium text-[#1a1a1a]/70 leading-relaxed">
              Thử đồ ảo AI hàng đầu. Nâng tầm trải nghiệm mua sắm trực tuyến cho phụ huynh và học sinh.
            </p>
            <div className="flex gap-3">
              <a href="#" className="p-2 rounded-full bg-white/40 hover:bg-white text-[#1a1a1a] transition-all">
                <Facebook size={16} fill="currentColor" strokeWidth={0} />
              </a>
              <a href="#" className="p-2 rounded-full bg-white/40 hover:bg-white text-[#1a1a1a] transition-all">
                <Instagram size={16} />
              </a>
              <a href="#" className="p-2 rounded-full bg-white/40 hover:bg-white text-[#1a1a1a] transition-all">
                <Youtube size={16} fill="currentColor" strokeWidth={0} />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#1a1a1a]/40">Khám phá</h4>
            <ul className="space-y-2.5">
              {["Trang chủ", "Cách hoạt động", "Tìm trường học", "Kho đồng phục", "Liên hệ"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm font-medium text-[#1a1a1a]/80 hover:text-[#0000FF] transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Support */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#1a1a1a]/40">Hỗ trợ</h4>
            <ul className="space-y-2.5">
              {["Câu hỏi thường gặp", "Chính sách bảo mật", "Điều khoản dịch vụ", "Chính sách đổi trả"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm font-medium text-[#1a1a1a]/80 hover:text-[#0000FF] transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#1a1a1a]/40">Liên hệ</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <MapPin className="text-[#0000FF] w-4 h-4 flex-shrink-0 mt-0.5 opacity-70" />
                <span className="text-sm font-medium text-[#1a1a1a]/90">Ngũ Hành Sơn, Đà Nẵng</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="text-[#0000FF] w-4 h-4 flex-shrink-0 opacity-70" />
                <span className="text-sm font-medium text-[#1a1a1a]/90">+84 123 456 789</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="text-[#0000FF] w-4 h-4 flex-shrink-0 opacity-70" />
                <span className="text-sm font-medium text-[#1a1a1a]/90">support@vtos.vn</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar Content */}
        <div className="flex flex-col md:flex-row justify-between items-center py-8 border-t border-black/5 gap-4">
          <p className="text-[12px] font-medium text-[#1a1a1a]/40">© 2025 VTOS. All rights reserved.</p>

          <div className="flex items-center gap-6">
            <a href="#" className="text-[11px] font-bold text-[#1a1a1a]/30 hover:text-[#1a1a1a] uppercase tracking-wider transition-all">Cookies Policy</a>
            <a href="#" className="text-[11px] font-bold text-[#1a1a1a]/30 hover:text-[#1a1a1a] uppercase tracking-wider transition-all">Legal Notice</a>
          </div>

          <div className="flex items-center gap-2 opacity-30">
            <span className="text-[10px] font-bold uppercase tracking-widest">Powered by AI Technology</span>
          </div>
        </div>
      </div>

      {/* Watermark (More subtle) */}
      <div className="absolute bottom-[-10%] md:bottom-[-15%] left-1/2 -translate-x-1/2 w-full text-center pointer-events-none opacity-[0.025] select-none mix-blend-multiply">
        <h1 className="text-[30vw] font-black text-black leading-none uppercase tracking-tighter">VTOS</h1>
      </div>
    </footer>
  );
};
