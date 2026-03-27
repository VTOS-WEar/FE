import { ChevronDownIcon } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../../components/ui/dropdown-menu";
import { Input } from "../../../../components/ui/input";

const navigationItems = [
  { label: "Trang chủ", hasDropdown: false },
  { label: "Cách hoạt động", hasDropdown: false },
  { label: "Sản phẩm", hasDropdown: true },
  { label: "Liên hệ", hasDropdown: false },
];

export const MainLayoutSection = (): JSX.Element => {
  return (
    <header className="flex w-full items-center justify-center gap-[13px] px-5 py-[25px] translate-y-[-1rem] animate-fade-in opacity-0">
      <img
        className="w-[164px] h-[55px]"
        alt="Vtos removebg"
        src="https://c.animaapp.com/mjxt3t8wNP0otU/img/vtos--1--removebg-preview-1-5.png"
      />

      <nav className="inline-flex h-[60px] items-center justify-center gap-[30px] px-5 py-2.5 bg-white rounded-[50px] shadow-[0px_4px_4px_#0000006b]">
        {navigationItems.map((item, index) => (
          <div key={index}>
            {item.hasDropdown ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="inline-flex items-center gap-2.5 p-1 h-auto [font-family:'Baloo_2',Helvetica] font-normal text-black text-base hover:bg-transparent"
                  >
                    {item.label}
                    <ChevronDownIcon className="w-3.5 h-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Option 1</DropdownMenuItem>
                  <DropdownMenuItem>Option 2</DropdownMenuItem>
                  <DropdownMenuItem>Option 3</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button className="flex items-center justify-center [font-family:'Baloo_2',Helvetica] font-normal text-black text-base text-center tracking-[0] leading-[normal] hover:opacity-70 transition-opacity">
                {item.label}
              </button>
            )}
          </div>
        ))}

        <div className="relative flex items-center">
          <Input
            type="text"
            placeholder="Tìm kiếm..."
            className="w-[198px] border-0 bg-transparent [font-family:'Roboto',Helvetica] font-light text-[#000000a1] text-base focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="w-[70px] h-[70px] -mr-[15px] -my-[15px] p-0 hover:bg-transparent hover:opacity-70 transition-opacity"
        >
          <img
            className="w-full h-full"
            alt="Button"
            src="https://c.animaapp.com/mjxt3t8wNP0otU/img/button-11.svg"
          />
        </Button>
      </nav>

      <Button
        variant="ghost"
        size="icon"
        className="h-auto p-0 hover:bg-transparent hover:opacity-70 transition-opacity"
      >
        <img
          alt="Frame"
          src="https://c.animaapp.com/mjxt3t8wNP0otU/img/frame-5-4.svg"
        />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-auto p-0 hover:bg-transparent hover:opacity-70 transition-opacity"
      >
        <img
          alt="Frame"
          src="https://c.animaapp.com/mjxt3t8wNP0otU/img/frame-7-4.svg"
        />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="inline-flex items-center justify-center gap-2.5 p-2.5 h-auto bg-white rounded-[50px] overflow-hidden shadow-[0px_4px_4px_#00000040] hover:bg-white hover:opacity-90 transition-opacity"
          >
            <img
              className="w-10 h-10"
              alt="Mingcute user fill"
              src="https://c.animaapp.com/mjxt3t8wNP0otU/img/mingcute-user-4-fill.svg"
            />
            <span className="flex items-center justify-center [font-family:'Baloo_2',Helvetica] font-normal text-black text-base text-center tracking-[0] leading-[normal]">
              Hồ sơ
            </span>
            <ChevronDownIcon className="w-3.5 h-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Thông tin cá nhân</DropdownMenuItem>
          <DropdownMenuItem>Cài đặt</DropdownMenuItem>
          <DropdownMenuItem>Đăng xuất</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};
