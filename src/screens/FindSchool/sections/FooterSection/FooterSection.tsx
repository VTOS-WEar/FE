import { ChevronDownIcon, LogInIcon, SearchIcon } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";

const navigationItems = [
  { label: "Trang chủ", hasDropdown: false },
  { label: "Cách hoạt động", hasDropdown: false },
  { label: "Sản phẩm", hasDropdown: true },
  { label: "Liên hệ", hasDropdown: false },
];

export const FooterSection = (): JSX.Element => {
  return (
    <header className="flex w-full items-center justify-center gap-[13px] px-5 py-[50px]">
      <img
        className="relative w-[164px] h-[55px] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:0ms]"
        alt="Vtos removebg"
        src="https://c.animaapp.com/mjxt3t8wNP0otU/img/vtos--1--removebg-preview-1-9.png"
      />

      <nav className="inline-flex h-[60px] items-center justify-center gap-[30px] px-5 py-2.5 flex-[0_0_auto] bg-white rounded-[50px] shadow-[0px_4px_4px_#0000006b] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]">
        {navigationItems.map((item, index) => (
          <button
            key={index}
            className="relative flex items-center justify-center gap-2.5 p-1 [font-family:'Baloo-Regular',Helvetica] font-normal text-black text-base text-center tracking-[0] leading-[normal] transition-colors hover:text-gray-600"
          >
            {item.label}
            {item.hasDropdown && <ChevronDownIcon className="w-3.5 h-3.5" />}
          </button>
        ))}

        <div className="relative flex items-center gap-2">
          <Input
            type="text"
            placeholder="Tìm kiếm..."
            className="w-[198px] h-auto border-0 bg-transparent [font-family:'Roboto',Helvetica] font-light text-[#000000a1] text-base tracking-[0] leading-[normal] placeholder:text-[#000000a1] focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Button
            size="icon"
            className="w-[70px] h-[70px] rounded-full bg-primary hover:bg-primary/90 transition-colors -mr-[15px] -my-[15px]"
          >
            <SearchIcon className="w-6 h-6 text-white" />
          </Button>
        </div>
      </nav>

      <Button
        variant="outline"
        className="inline-flex items-center justify-center gap-2.5 h-auto px-4 py-2.5 bg-white rounded-[50px] shadow-[0px_4px_4px_#00000040] [font-family:'Baloo-Regular',Helvetica] font-normal text-black text-base text-center tracking-[0] leading-[normal] border-0 hover:bg-gray-50 transition-colors translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms]"
      >
        <LogInIcon className="w-10 h-10" />
        Đăng nhập
      </Button>
    </header>
  );
};
