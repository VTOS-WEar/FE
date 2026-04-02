import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../../components/ui/avatar";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "../../../../components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";

const navigationItems = [
  { label: "Thông tin tài khoản", active: true },
  { label: "Quản lý học sinh", active: false },
  { label: "Đơn hàng", active: false },
  { label: "Lịch sử", active: false },
  { label: "Đánh giá", active: false },
  { label: "Cài đặt tài khoản", active: false },
];

const tabs = [
  { label: "Thông tin cá nhân", active: true },
  { label: "Bảo mật", active: false },
];

export const AccountManagementSection = (): JSX.Element => {
  return (
    <section className="relative w-full bg-white rounded-[30px] shadow-[0px_4px_4px_#0000006b] p-5">
      <div className="flex gap-6">
        <aside className="flex flex-col w-[209px] shrink-0">
          <header className="flex items-center gap-[13px] mb-[73px]">
            <Avatar className="w-[50px] h-[50px]">
              <AvatarImage
                src="https://c.animaapp.com/mjxt3t8wNP0otU/img/group.png"
                alt="Võ Gia Truyền"
              />
              <AvatarFallback>VGT</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-[3px]">
              <p className="font-normal text-black text-[15px] tracking-[0] leading-[normal]">
                Tài khoản
              </p>
              <h2 className="font-semibold text-black text-xl tracking-[0] leading-[normal] whitespace-nowrap">
                Võ Gia Truyền
              </h2>
            </div>
          </header>

          <nav className="flex flex-col gap-5 mb-auto">
            {navigationItems.map((item, index) => (
              <Button
                key={index}
                variant="ghost"
                className={`h-11 justify-center rounded-lg font-semibold text-base ${
                  item.active
                    ? "bg-[#3c6efd] text-white hover:bg-[#3c6efd]/90"
                    : "bg-[#4182f9]/10 text-[#4182f9] hover:bg-[#4182f9]/20"
                }`}
              >
                {item.label}
              </Button>
            ))}
          </nav>

          <Button
            variant="ghost"
            className="h-11 mt-[72px] bg-[#f94144]/10 text-[#f94144] hover:bg-[#f94144]/20 rounded-lg font-semibold text-base"
          >
            Đăng Xuất
          </Button>
        </aside>

        <main className="flex-1">
          <Card className="bg-[#f5f5fa] rounded-[30px] border-0">
            <CardContent className="p-0">
              <div className="bg-white rounded-[30px] m-[19px] p-[18px]">
                <div className="flex gap-2 mb-6">
                  {tabs.map((tab, index) => (
                    <Button
                      key={index}
                      className={`h-auto px-[15px] py-2.5 rounded-[10px] font-semibold text-white text-base ${
                        tab.active
                          ? "bg-[linear-gradient(90deg,rgba(65,130,249,1)_0%,rgba(168,122,240,1)_100%)] shadow-[2px_0px_4px_#00000040]"
                          : "bg-[#4182f9] opacity-40"
                      }`}
                    >
                      {tab.label}
                    </Button>
                  ))}
                </div>

                <div className="flex gap-[34px]">
                  <div className="shrink-0">
                    <Avatar className="w-[170px] h-[170px]">
                      <AvatarImage
                        src="https://c.animaapp.com/mjxt3t8wNP0otU/img/group-239192.png"
                        alt="Profile"
                      />
                      <AvatarFallback>VGT</AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="flex-1 flex flex-col gap-5">
                    <div className="flex items-center gap-[5px]">
                      <Label className="w-[154px] font-medium text-black text-base">
                        Họ và tên
                      </Label>
                      <Input
                        defaultValue="Võ Gia Truyền"
                        className="flex-1 h-[50px] bg-white rounded-lg border-[#00000036] opacity-40 font-normal text-black text-base"
                      />
                    </div>

                    <div className="flex items-center gap-[15px]">
                      <Label className="w-[139px] font-medium text-black text-base">
                        Ngày sinh
                      </Label>
                      <Select defaultValue="1">
                        <SelectTrigger className="w-[82px] h-[50px] bg-white rounded-lg border-[#00000036]">
                          <SelectValue className="opacity-40 font-normal text-black text-base" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select defaultValue="1">
                        <SelectTrigger className="w-[82px] h-[50px] bg-white rounded-lg border-[#00000036]">
                          <SelectValue className="opacity-40 font-normal text-black text-base" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select defaultValue="2000">
                        <SelectTrigger className="w-[105px] h-[50px] bg-white rounded-lg border-[#00000036]">
                          <SelectValue className="opacity-40 font-normal text-black text-base" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2000">2000</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center">
                      <Label className="w-[154px] font-medium text-black text-base">
                        Giới tính
                      </Label>
                      <RadioGroup defaultValue="female" className="flex gap-0">
                        <div className="flex items-center gap-[4px] w-[94px]">
                          <RadioGroupItem
                            value="male"
                            id="male"
                            className="w-6 h-6"
                          />
                          <Label
                            htmlFor="male"
                            className="font-normal text-black text-base cursor-pointer"
                          >
                            Nam
                          </Label>
                        </div>
                        <div className="flex items-center gap-[4px] w-[81px]">
                          <RadioGroupItem
                            value="female"
                            id="female"
                            className="w-6 h-6"
                          />
                          <Label
                            htmlFor="female"
                            className="font-normal text-black text-base cursor-pointer"
                          >
                            Nữ
                          </Label>
                        </div>
                        <div className="flex items-center gap-[4px] w-[81px]">
                          <RadioGroupItem
                            value="other"
                            id="other"
                            className="w-6 h-6"
                          />
                          <Label
                            htmlFor="other"
                            className="font-normal text-black text-base cursor-pointer"
                          >
                            Khác
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <Button className="w-[138px] h-[51px] self-start bg-[#7e45d9b2] hover:bg-[#7e45d9] rounded-[10px] font-semibold text-white text-base">
                      Lưu thay đổi
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-[13px] mt-[92px]">
                  <div className="flex items-center gap-[5px]">
                    <Label className="w-[154px] font-medium text-black text-base">
                      Địa chỉ email
                    </Label>
                    <div className="flex-1 flex items-center gap-2.5 px-2.5 py-[15px] h-[50px] bg-white rounded-lg border border-solid border-[#00000036]">
                      <Input
                        defaultValue="truyen@gmail.com"
                        className="flex-1 h-auto border-0 p-0 opacity-40 font-normal text-black text-base focus-visible:ring-0"
                      />
                      <Button
                        variant="outline"
                        className="h-auto px-[15px] py-2.5 bg-white rounded-[5px] border-[#4182f9] font-semibold text-[#3c6efd] text-base hover:bg-[#4182f9]/10"
                      >
                        Cập nhật
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-[5px]">
                    <Label className="w-[154px] font-medium text-black text-base">
                      Số điện thoại
                    </Label>
                    <div className="flex-1 flex items-center gap-2.5 px-2.5 py-[15px] h-[50px] bg-white rounded-lg border border-solid border-[#00000036]">
                      <Input
                        defaultValue="0123456789"
                        className="flex-1 h-auto border-0 p-0 opacity-40 font-normal text-black text-base focus-visible:ring-0"
                      />
                      <Button
                        variant="outline"
                        className="h-auto px-[15px] py-2.5 bg-white rounded-[5px] border-[#4182f9] font-semibold text-[#3c6efd] text-base hover:bg-[#4182f9]/10"
                      >
                        Cập nhật
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </section>
  );
};
