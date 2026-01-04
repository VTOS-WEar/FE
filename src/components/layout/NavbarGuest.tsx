import { ChevronDownIcon, SearchIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
export const NavbarGuest = (): JSX.Element => {
  return (
    <header className="flex w-full items-center justify-between gap-4 px-4 lg:px-8 py-4 bg-white border-b border-gray-100">
      {/* Logo */}
      <img
        className="w-[120px] lg:w-[164px] h-auto flex-shrink-0"
        alt="Vtos logo"
        src="https://c.animaapp.com/mjxt3t8wNP0otU/img/vtos--1--removebg-preview-1-1.png"
      />

      {/* Navigation Menu */}
      <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
        <button className="[font-family:'Baloo-Regular',Helvetica] font-normal text-black text-base hover:text-gray-600 transition-colors whitespace-nowrap">
          Trang chủ
        </button>
        <button className="[font-family:'Baloo-Regular',Helvetica] font-normal text-black text-base hover:text-gray-600 transition-colors whitespace-nowrap">
          Cách hoạt động
        </button>
        <button className="flex items-center gap-1 [font-family:'Baloo-Regular',Helvetica] font-normal text-black text-base hover:text-gray-600 transition-colors whitespace-nowrap">
          Sản phẩm
          <ChevronDownIcon className="w-4 h-4" />
        </button>
        <button className="[font-family:'Baloo-Regular',Helvetica] font-normal text-black text-base hover:text-gray-600 transition-colors whitespace-nowrap">
          Liên hệ
        </button>
      </nav>

      {/* Search Box */}
      <div className="hidden lg:flex items-center gap-2 flex-1 max-w-xs">
        <div className="relative w-full">
          <Input
            type="text"
            placeholder="Tìm kiếm..."
            className="w-full h-10 pl-4 pr-12 rounded-full border border-gray-300 [font-family:'Roboto',Helvetica] font-light text-black text-sm placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-[#6838ee]"
          />
          <Button
            size="icon"
            className="absolute right-0 top-0 h-10 w-10 rounded-full bg-[#6838ee] hover:bg-[#5527d9] text-white"
          >
            <SearchIcon className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Login Button */}
      <Button className="h-auto px-4 lg:px-6 py-2 lg:py-3 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors flex items-center gap-2 flex-shrink-0">
        <img
          className="w-6 h-6"
          alt="Login icon"
          src="public/imgs/LoginButtonIcon1.png"
        />
        <span className="[font-family:'Baloo-Regular',Helvetica] font-normal text-black text-base whitespace-nowrap">
          Đăng nhập
        </span>
      </Button>
    </header>
  );
};
