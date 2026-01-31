import {
  AlertCircleIcon,
  ArrowRightIcon,
  PhoneIcon,
  UserIcon,
} from "lucide-react";
import { NavbarGuest, Footer } from "../../components/layout";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

export const FillInformation = (): JSX.Element => {
  return (
    <div className="bg-white w-full min-h-screen flex flex-col">
      <NavbarGuest />

      <main className="flex-1 bg-[#f4f2ff] py-8 lg:py-12 px-4 relative overflow-hidden">
        <img
          className="absolute top-[15rem] right-[45rem] w-[42rem] h-[42rem] opacity-50"
          alt="Vector"
          src="https://c.animaapp.com/mjxt3t8wNP0otU/img/vector-23.svg"
        />
        <img
          className="absolute top-[25rem] right-[56rem] w-[45rem] h-[51rem] opacity-50"
          alt="Vector"
          src="https://c.animaapp.com/mjxt3t8wNP0otU/img/vector-20.svg"
        />
        <img
          className="absolute top-[-5rem] right-[51rem] w-[51rem] h-[42rem] opacity-50"
          alt="Vector"
          src="https://c.animaapp.com/mjxt3t8wNP0otU/img/vector-21.svg"
        />

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h1 className="[font-family:'Montserrat',Helvetica] font-bold text-black text-4xl mb-4">
              Thông tin phụ huynh
            </h1>
            <p className="[font-family:'Montserrat',Helvetica] font-medium text-black text-xl opacity-60 max-w-2xl mx-auto">
              Để bắt đầu trải nghiệm mua sắm, vui lòng cập nhật thông tin liên hệ của bạn
            </p>
          </div>

          <div className="bg-white rounded-[1.875rem] shadow-lg p-6 lg:p-10 max-w-[32rem] mx-auto">
            <div className="flex flex-col items-center mb-8">
              <img
                className="w-[8.75rem] h-[8.75rem] rounded-full mb-4"
                alt="Avatar"
                src="https://c.animaapp.com/mjxt3t8wNP0otU/img/group-239260.png"
              />
              <Button
                variant="link"
                className="[font-family:'Montserrat',Helvetica] font-medium text-[#7e45d9] text-base p-0 h-auto"
              >
                Tải lên ảnh đại diện
              </Button>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="[font-family:'Montserrat',Helvetica] font-medium text-black text-xl">
                  Họ và tên phụ huynh
                  <span className="text-[#ff0000] ml-1">*</span>
                </Label>
                <div className="relative">
                  <UserIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-6 h-6 text-black" />
                  <Input
                    type="text"
                    defaultValue="Võ Gia Truyền"
                    className="h-[3.125rem] pl-11 pr-2.5 bg-white rounded-lg border border-[#00000036] opacity-40 [font-family:'Montserrat',Helvetica] font-normal text-base"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="[font-family:'Montserrat',Helvetica] font-medium text-black text-xl">
                  Số điện thoại liên hệ
                  <span className="text-[#ff0000] ml-1">*</span>
                </Label>
                <div className="relative">
                  <PhoneIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-6 h-6 text-black" />
                  <Input
                    type="tel"
                    defaultValue="01234857430"
                    className="h-[3.125rem] pl-11 pr-2.5 bg-white rounded-lg border border-[#00000036] opacity-40 [font-family:'Montserrat',Helvetica] font-normal text-base"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <AlertCircleIcon className="w-4 h-4" />
                  <p className="[font-family:'Montserrat',Helvetica] font-medium text-black text-xs opacity-60">
                    Số điện thoại sẽ được sử dụng để liên hệ giao hàng và hỗ trợ
                  </p>
                </div>
              </div>

              <Button className="w-full h-16 bg-[#4e46dd] rounded-lg shadow-[0px_0px_0.525rem_#4e46dd] hover:bg-[#4e46dd]/90 mt-8">
                <span className="[font-family:'Montserrat',Helvetica] font-semibold text-white text-2xl">
                  Tiếp tục: Chọn trường học
                </span>
                <ArrowRightIcon className="w-6 h-6 ml-2.5" />
              </Button>

              <div className="flex flex-col items-center gap-5 mt-8">
                <div className="flex items-center gap-2">
                  <img
                    className="w-[3.625rem] h-[1.125rem]"
                    alt="Progress"
                    src="https://c.animaapp.com/mjxt3t8wNP0otU/img/line-17.svg"
                  />
                  <img
                    className="w-4 h-2.5"
                    alt="Progress"
                    src="https://c.animaapp.com/mjxt3t8wNP0otU/img/line-18.svg"
                  />
                </div>
                <p className="[font-family:'Montserrat',Helvetica] font-medium text-black text-sm opacity-60">
                  BƯỚC 1 TRÊN 2
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
