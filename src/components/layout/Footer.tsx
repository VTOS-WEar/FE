import { FacebookIcon, InstagramIcon, MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export const Footer = (): JSX.Element => {
  return (
    <footer className="w-full bg-gradient-to-br from-[#6838ee] via-[#8b5cf6] to-[#a78bfa] text-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Logo & Description */}
          <div className="space-y-4">
            <img
              className="w-[140px] h-auto brightness-0 invert"
              alt="VTOS Logo"
              src="https://c.animaapp.com/mjxt3t8wNP0otU/img/vtos--1--removebg-preview-1-1.png"
            />
            <p className="text-sm text-white/80 leading-relaxed">
              Nền tảng thử đồng phục trực tuyến bằng AI hàng đầu Việt Nam. 
              Giúp phụ huynh và học sinh dễ dàng lựa chọn đồng phục phù hợp.
            </p>
            <div className="flex gap-3">
              <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <FacebookIcon className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <InstagramIcon className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold [font-family:'Baloo_2',Helvetica]">
              Liên kết nhanh
            </h3>
            <ul className="space-y-2">
              {["Trang chủ", "Cách hoạt động", "Sản phẩm", "Liên hệ", "Về chúng tôi"].map(
                (item, index) => (
                  <li key={index}>
                    <a
                      href="#"
                      className="text-sm text-white/80 hover:text-white transition-colors [font-family:'Baloo_2',Helvetica]"
                    >
                      {item}
                    </a>
                  </li>
                ),
              )}
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold [font-family:'Baloo_2',Helvetica]">
              Hỗ trợ
            </h3>
            <ul className="space-y-2">
              {[
                "Câu hỏi thường gặp",
                "Hướng dẫn sử dụng",
                "Chính sách bảo mật",
                "Điều khoản dịch vụ",
                "Đổi trả hàng",
              ].map((item, index) => (
                <li key={index}>
                  <a
                    href="#"
                    className="text-sm text-white/80 hover:text-white transition-colors [font-family:'Baloo_2',Helvetica]"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold [font-family:'Baloo_2',Helvetica]">
              Liên hệ
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <MapPinIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-white/80 [font-family:'Baloo_2',Helvetica]">
                  123 Đường ABC, Quận 1, TP.HCM
                </span>
              </li>
              <li className="flex items-center gap-2">
                <PhoneIcon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm text-white/80 [font-family:'Baloo_2',Helvetica]">
                  1900 xxxx
                </span>
              </li>
              <li className="flex items-center gap-2">
                <MailIcon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm text-white/80 [font-family:'Baloo_2',Helvetica]">
                  support@vtos.vn
                </span>
              </li>
            </ul>

            <div className="pt-2">
              <p className="text-sm font-medium mb-2 [font-family:'Baloo_2',Helvetica]">
                Đăng ký nhận tin
              </p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Email của bạn"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/50"
                />
                <Button className="bg-white text-[#6838ee] hover:bg-white/90 font-semibold">
                  Gửi
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-white/60 [font-family:'Baloo_2',Helvetica]">
              © 2025 VTOS. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a
                href="#"
                className="text-sm text-white/60 hover:text-white transition-colors [font-family:'Baloo_2',Helvetica]"
              >
                Chính sách bảo mật
              </a>
              <a
                href="#"
                className="text-sm text-white/60 hover:text-white transition-colors [font-family:'Baloo_2',Helvetica]"
              >
                Điều khoản sử dụng
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
