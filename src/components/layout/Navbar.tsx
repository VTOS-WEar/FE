import { ChevronDownIcon, SearchIcon, LogIn } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import { useNavigate } from "react-router-dom";

const navigationItems = [
  { label: "Trang chủ", hasDropdown: false },
  { label: "Cách hoạt động", hasDropdown: false },
  { label: "Sản phẩm", hasDropdown: true },
  { label: "Liên hệ", hasDropdown: false },
];

export const Navbar = (): JSX.Element => {
  const navigate = useNavigate();

  return (
    <header className="flex w-full items-center justify-between gap-4 px-4 lg:px-8 py-4 bg-[#FFF8F0] border-b-2 border-[#1A1A2E]">
      {/* Logo */}
      <button type="button" onClick={() => navigate("/")} className="flex-shrink-0">
        <img
          className="w-[120px] lg:w-[164px] h-auto"
          alt="Vtos logo"
          src="https://c.animaapp.com/mjxt3t8wNP0otU/img/vtos--1--removebg-preview-1-1.png"
        />
      </button>

      {/* Navigation Menu */}
      <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
        {navigationItems.map((item, index) =>
          item.hasDropdown ? (
            <DropdownMenu key={index}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1 font-bold text-[#1A1A2E] text-sm hover:text-[#1A1A2E]/70 transition-colors outline-none"
                >
                  {item.label}
                  <ChevronDownIcon className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="rounded-xl border-2 border-[#1A1A2E] bg-white shadow-[4px_4px_0_#1A1A2E]">
                <DropdownMenuItem className="font-medium cursor-pointer data-[highlighted]:bg-[#FFF8F0]">Sản phẩm 1</DropdownMenuItem>
                <DropdownMenuItem className="font-medium cursor-pointer data-[highlighted]:bg-[#FFF8F0]">Sản phẩm 2</DropdownMenuItem>
                <DropdownMenuItem className="font-medium cursor-pointer data-[highlighted]:bg-[#FFF8F0]">Sản phẩm 3</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button
              key={index}
              className="font-bold text-[#1A1A2E] text-sm hover:text-[#1A1A2E]/70 transition-colors whitespace-nowrap"
            >
              {item.label}
            </button>
          ),
        )}
      </nav>

      {/* Search Box */}
      <div className="hidden lg:flex items-center gap-2 flex-1 max-w-xs">
        <div className="relative w-full">
          <Input
            type="text"
            placeholder="Tìm kiếm..."
            className="w-full h-10 pl-4 pr-12 rounded-xl border-2 border-[#1A1A2E] bg-white text-sm font-medium placeholder:text-[#9CA3AF] focus-visible:ring-0 focus-visible:border-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E]"
          />
          <button
            type="button"
            className="absolute right-0 top-0 h-10 w-10 rounded-r-xl border-l-2 border-[#1A1A2E] bg-[#1A1A2E] text-white flex items-center justify-center hover:bg-[#1A1A2E]/90 transition-colors"
          >
            <SearchIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Login Button */}
      <button
        type="button"
        onClick={() => navigate("/signin")}
        className="flex items-center gap-2 h-10 px-4 lg:px-5 rounded-xl border-2 border-[#1A1A2E] bg-white text-[#1A1A2E] font-bold text-sm shadow-[3px_3px_0_#1A1A2E] transition-all duration-150 hover:-translate-y-[1px] hover:shadow-[4px_4px_0_#1A1A2E] active:shadow-none active:translate-y-0 flex-shrink-0"
      >
        <LogIn className="w-4 h-4" />
        <span className="whitespace-nowrap">Đăng nhập</span>
      </button>
    </header>
  );
};
