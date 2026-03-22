import { BellIcon, SaveIcon, SettingsIcon, XIcon } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import { Separator } from "../../../../components/ui/separator";
import { Switch } from "../../../../components/ui/switch";

const navigationItems = [
  { label: "Thông tin tài khoản", active: false },
  { label: "Quản lý học sinh", active: false },
  { label: "Đơn hàng", active: false },
  { label: "Lịch sử", active: false },
  { label: "Đánh giá", active: false },
  { label: "Cài đặt tài khoản", active: true },
];

const notificationSettings = [
  {
    title: "Thông báo qua Email",
    description: "Nhận tin tức về đơn hàng và khuyến mãi qua email.",
    enabled: true,
  },
  {
    title: "Thông báo SMS",
    description: "Nhận mã xác thực và trạng thái giao hàng.",
    enabled: false,
  },
  {
    title: "Nhắc nhỏ thử đồ ảo",
    description: "Gợi ý kích cỡ phù hợp khi có sản phẩm mới",
    enabled: false,
  },
];

export const AccountSettingsSection = (): JSX.Element => {
  return (
    <div className="w-full bg-white rounded-[30px] shadow-[0px_4px_4px_#0000006b] p-0 relative">
      <div className="flex gap-0">
        <aside className="w-[266px] flex-shrink-0 p-[27px] flex flex-col">
          <div className="flex gap-[13px] mb-[22px]">
            <img
              className="w-[50px] h-[50px]"
              alt="Frame"
              src="https://c.animaapp.com/mjxt3t8wNP0otU/img/frame-239299.svg"
            />
            <div className="flex flex-col gap-[3px] justify-center">
              <div className="[font-family:'Montserrat',Helvetica] font-normal text-black text-[15px] tracking-[0] leading-[normal]">
                Tài khoản
              </div>
              <div className="[font-family:'Montserrat',Helvetica] font-semibold text-black text-xl tracking-[0] leading-[normal] whitespace-nowrap">
                Võ Gia Truyền
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-5">
            {navigationItems.map((item, index) => (
              <button
                key={index}
                className={`w-full h-11 rounded-lg flex items-center justify-center px-4 transition-colors ${
                  item.active
                    ? "bg-[#3c6efd] text-white"
                    : "bg-[#4182f9] bg-opacity-10 text-[#4182f9]"
                }`}
              >
                <span className="[font-family:'Montserrat',Helvetica] font-semibold text-base text-center tracking-[0] leading-[normal]">
                  {item.label}
                </span>
              </button>
            ))}
          </nav>

          <button className="w-full h-11 rounded-lg flex items-center justify-center px-4 bg-[#f94144] bg-opacity-10 text-[#f94144] mt-auto">
            <span className="[font-family:'Montserrat',Helvetica] font-semibold text-base text-center tracking-[0] leading-[normal]">
              Đăng Xuất
            </span>
          </button>
        </aside>

        <main className="flex-1 bg-[#f5f5fa] rounded-[0px_30px_30px_0px] p-5 min-h-[771px] flex flex-col">
          <div className="mb-2">
            <h1 className="[font-family:'Montserrat',Helvetica] font-bold text-[#111112] text-[32px] tracking-[0] leading-[normal]">
              Cài đặt chung
            </h1>
            <p className="opacity-50 [font-family:'Montserrat',Helvetica] font-normal text-black text-base tracking-[0] leading-[normal] mt-[10px]">
              Quản lý thông báo và quyền riêng tư.
            </p>
          </div>

          <div className="flex flex-col gap-[25px] flex-1">
            <Card className="bg-white rounded-[10px] shadow-[0px_0px_4px_#00000040] border-0">
              <CardContent className="p-0">
                <div className="flex items-center gap-2.5 px-5 pt-[21px] pb-[19px]">
                  <BellIcon className="w-[35px] h-[34px] text-black" />
                  <h2 className="[font-family:'Montserrat',Helvetica] font-semibold text-black text-xl tracking-[0] leading-[normal]">
                    Cài đặt thông báo
                  </h2>
                </div>

                <Separator className="bg-black opacity-10" />

                <div className="flex flex-col gap-[30px] px-[17px] pt-[34px] pb-[32px]">
                  {notificationSettings.map((setting, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between"
                    >
                      <div className="flex flex-col gap-2.5 max-w-[500px]">
                        <div className="[font-family:'Montserrat',Helvetica] font-semibold text-black text-base tracking-[0] leading-[normal]">
                          {setting.title}
                        </div>
                        <div className="opacity-70 [font-family:'Montserrat',Helvetica] font-medium text-black text-[13px] tracking-[0] leading-[normal]">
                          {setting.description}
                        </div>
                      </div>
                      <Switch
                        defaultChecked={setting.enabled}
                        className="data-[state=checked]:bg-[#3c6efd]"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white rounded-[10px] shadow-[0px_0px_4px_#00000040] border-0">
              <CardContent className="p-0">
                <div className="flex items-center gap-2.5 px-5 pt-[21px] pb-[20.4px]">
                  <SettingsIcon className="w-[34px] h-[32.58px] text-black" />
                  <h2 className="[font-family:'Montserrat',Helvetica] font-semibold text-black text-xl tracking-[0] leading-[normal]">
                    Tuỳ chọn ứng dụng
                  </h2>
                </div>

                <Separator className="bg-black opacity-10" />

                <div className="flex items-start justify-between gap-[44px] px-[30px] pt-[21px] pb-[31px]">
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="opacity-70 [font-family:'Montserrat',Helvetica] font-bold text-black text-sm tracking-[0] leading-[normal]">
                      NGÔN NGỮ
                    </label>
                    <Select defaultValue="vi">
                      <SelectTrigger className="w-full h-[50px] bg-slate-50 rounded-[15px] border border-solid border-[#00000036] px-5">
                        <SelectValue>
                          <span className="opacity-80 [font-family:'Montserrat',Helvetica] font-semibold text-black text-base tracking-[0] leading-[normal]">
                            Tiếng Việt
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vi">Tiếng Việt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1 flex-1">
                    <label className="opacity-70 [font-family:'Montserrat',Helvetica] font-bold text-black text-sm tracking-[0] leading-[normal]">
                      ĐƠN VỊ TIỀN TỆ
                    </label>
                    <Select defaultValue="vnd">
                      <SelectTrigger className="w-full h-[50px] bg-slate-50 rounded-[15px] border border-solid border-[#00000036] px-5">
                        <SelectValue>
                          <span className="opacity-80 [font-family:'Montserrat',Helvetica] font-semibold text-black text-base tracking-[0] leading-[normal]">
                            VNĐ
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vnd">VNĐ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-end gap-[23px] mt-auto pt-[29px]">
            <Button className="h-[47px] px-[15px] py-2.5 bg-[#3c6efd] rounded-[10px] shadow-[0px_0px_8.4px_#3c6efd] hover:bg-[#3c6efd]/90 transition-colors">
              <SaveIcon className="w-6 h-6" />
              <span className="[font-family:'Montserrat',Helvetica] font-semibold text-white text-xl text-center tracking-[0] leading-[normal] whitespace-nowrap">
                Lưu thay đổi
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-[47px] px-[15px] py-2.5 bg-white rounded-[10px] border border-solid border-[#cac9d6] hover:bg-gray-50 transition-colors"
            >
              <XIcon className="w-6 h-6" />
              <span className="opacity-70 [font-family:'Montserrat',Helvetica] font-semibold text-black text-xl text-center tracking-[0] leading-[normal] whitespace-nowrap">
                Huỷ
              </span>
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
};
