import { ChevronDownIcon } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";

const navigationItems = [
  { label: "Trang chủ", hasDropdown: false },
  { label: "Cách hoạt động", hasDropdown: false },
  { label: "Sản phẩm", hasDropdown: true },
  { label: "Liên hệ", hasDropdown: false },
];

export const MainLayoutSection = (): JSX.Element => {
  return (
    <header className="flex w-full items-center justify-center gap-[13px] px-5 py-[50px] translate-y-[-1rem] animate-fade-in opacity-0">
      <img
        className="w-[164px] h-[55px]"
        alt="Vtos removebg"
        src="https://c.animaapp.com/mjxt3t8wNP0otU/img/vtos--1--removebg-preview-1-3.png"
      />

      <nav className="inline-flex h-[60px] items-center justify-center gap-[30px] px-5 py-2.5 bg-white rounded-[50px] shadow-[0px_4px_4px_#0000006b]">
        {navigationItems.map((item, index) => (
          <Button
            key={index}
            variant="ghost"
            className="h-auto p-0 hover:bg-transparent"
          >
            <div className="inline-flex items-center gap-2.5 p-1">
              <span className="[font-family:'Baloo-Regular',Helvetica] font-normal text-black text-base text-center tracking-[0] leading-[normal]">
                {item.label}
              </span>
              {item.hasDropdown && <ChevronDownIcon className="w-3.5 h-2" />}
            </div>
          </Button>
        ))}

        <div className="relative flex items-center w-[198px]">
          <Input
            type="text"
            placeholder="Tìm kiếm..."
            className="border-0 bg-transparent [font-family:'Roboto',Helvetica] font-light text-[#000000a1] text-base h-auto p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        <Button
          size="icon"
          className="w-[70px] h-[70px] rounded-full bg-transparent hover:bg-transparent p-0 -mr-[15px] -my-[15px]"
        >
          <img
            className="w-full h-full"
            alt="Button"
            src="https://c.animaapp.com/mjxt3t8wNP0otU/img/button-1.svg"
          />
        </Button>
      </nav>

      <Button
        variant="ghost"
        size="icon"
        className="h-auto p-0 hover:bg-transparent"
      >
        <img
          className="w-auto h-auto"
          alt="Notification"
          src="https://c.animaapp.com/mjxt3t8wNP0otU/img/frame-5-3.svg"
        />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-auto p-0 hover:bg-transparent"
      >
        <img
          className="w-auto h-auto"
          alt="Favorites"
          src="https://c.animaapp.com/mjxt3t8wNP0otU/img/frame-7-5.svg"
        />
      </Button>

      <Button
        variant="ghost"
        className="inline-flex items-center justify-center gap-2.5 p-2.5 h-auto bg-white rounded-[50px] shadow-[0px_4px_4px_#00000040] hover:bg-white"
      >
        <img
          className="w-10 h-10"
          alt="Mingcute user fill"
          src="https://c.animaapp.com/mjxt3t8wNP0otU/img/mingcute-user-4-fill.svg"
        />
        <span className="[font-family:'Baloo-Regular',Helvetica] font-normal text-black text-base text-center tracking-[0] leading-[normal]">
          Hồ sơ
        </span>
        <ChevronDownIcon className="w-3.5 h-2" />
      </Button>
    </header>
  );
};
