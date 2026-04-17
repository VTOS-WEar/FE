import { AlertCircleIcon, LockIcon, SaveIcon, ShieldIcon } from "lucide-react";
import { Alert, AlertDescription } from "../../../../components/ui/alert";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";
import { Separator } from "../../../../components/ui/separator";

const navigationItems = [
  {
    label: "Thông tin tài khoản",
    active: true,
    color: "bg-[#3c6efd] text-white",
  },
  {
    label: "Quản lý học sinh",
    active: false,
    color: "bg-[#4182f9] bg-opacity-10 text-[#4182f9]",
  },
  {
    label: "Đơn hàng",
    active: false,
    color: "bg-[#4182f9] bg-opacity-10 text-[#4182f9]",
  },
  {
    label: "Lịch sử",
    active: false,
    color: "bg-[#4182f9] bg-opacity-10 text-[#4182f9]",
  },
  {
    label: "Đánh giá",
    active: false,
    color: "bg-[#4182f9] bg-opacity-10 text-[#4182f9]",
  },
  {
    label: "Cài đặt tài khoản",
    active: false,
    color: "bg-[#4182f9] bg-opacity-10 text-[#4182f9]",
  },
];

export const AccountSettingsSection = (): JSX.Element => {
  return (
    <section className="relative w-full bg-white rounded-[30px] border border-gray-200 shadow-soft-lg p-6">
      <div className="flex gap-6">
        <aside className="flex flex-col w-[209px] gap-5">
          <header className="flex gap-[13px] mb-6">
            <img
              className="w-[50px] h-[50px]"
              alt="User avatar"
              src="https://c.animaapp.com/mjxt3t8wNP0otU/img/frame-239299.svg"
            />
            <div className="flex flex-col gap-[3px] mt-[3px]">
              <div className="font-normal text-black text-[15px] tracking-[0] leading-[normal]">
                Tài khoản
              </div>
              <div className="font-semibold text-black text-xl tracking-[0] leading-[normal] whitespace-nowrap">
                Võ Gia Truyền
              </div>
            </div>
          </header>

          <nav className="flex flex-col gap-5">
            {navigationItems.map((item, index) => (
              <Button
                key={index}
                variant="ghost"
                className={`h-11 justify-center rounded-lg font-semibold text-base ${item.color} hover:opacity-90 transition-opacity`}
              >
                {item.label}
              </Button>
            ))}
          </nav>

          <Button
            variant="ghost"
            className="h-11 mt-auto justify-center rounded-lg bg-[#f94144] bg-opacity-10 text-[#f94144] font-semibold text-base hover:opacity-90 transition-opacity"
          >
            Đăng Xuất
          </Button>
        </aside>

        <main className="flex-1 bg-[#f5f5fa] rounded-[20px] p-6">
          <Card className="bg-white rounded-[30px] border-0 shadow-none">
            <CardContent className="p-8">
              <div className="flex gap-4 mb-8">
                <Button
                  variant="ghost"
                  className="h-auto px-[15px] py-2.5 bg-[#4182f9] opacity-40 rounded-[10px] font-semibold text-white text-base hover:opacity-50 transition-opacity"
                >
                  Thông tin cá nhân
                </Button>
                <Button
                  variant="ghost"
                  className="h-auto px-[15px] py-2.5 rounded-[10px] shadow-soft-sm border border-gray-200 bg-blue-accent font-semibold text-white text-base hover:scale-[0.98] hover:shadow-none transition-all"
                >
                  Bảo mật
                </Button>
              </div>

              <div className="space-y-12">
                <section className="space-y-6">
                  <div className="flex items-center gap-2.5">
                    <LockIcon className="w-6 h-6" />
                    <h2 className="font-bold text-black text-xl tracking-[0] leading-[normal]">
                      Đổi mật khẩu
                    </h2>
                  </div>

                  <div className="space-y-1">
                    <label className="block opacity-70 font-semibold text-black text-sm tracking-[0] leading-[normal]">
                      Mật khẩu hiện tại
                    </label>
                    <img
                      className="w-full h-[50px]"
                      alt="Current password field"
                      src="https://c.animaapp.com/mjxt3t8wNP0otU/img/frame-31.svg"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-[42px]">
                    <div className="space-y-1">
                      <label className="block opacity-70 font-semibold text-black text-sm tracking-[0] leading-[normal]">
                        Mật khẩu mới
                      </label>
                      <Input
                        type="password"
                        placeholder="Nhập mật khẩu mới"
                        className="h-[50px] bg-slate-50 rounded-[15px] border-[#00000036] font-semibold text-black text-base placeholder:opacity-60"
                      />
                      <p className="opacity-30 font-semibold text-black text-[10px] tracking-[0] leading-[normal]">
                        Tối thiểu 8 ký tự, bao gồm chữ hoa, số và kí tự đặc biệt
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="block opacity-70 font-semibold text-black text-sm tracking-[0] leading-[normal]">
                        Xác nhận mật khẩu mới
                      </label>
                      <Input
                        type="password"
                        placeholder="Nhập lại mật khẩu mới"
                        className="h-[50px] bg-slate-50 rounded-[15px] border-[#00000036] font-semibold text-black text-base placeholder:opacity-60"
                      />
                    </div>
                  </div>

                  <Button className="h-[47px] w-[290px] gap-2.5 px-[15px] py-2.5 bg-[#3c6efd] rounded-[10px] shadow-soft-sm border border-gray-200 font-semibold text-white text-xl hover:scale-[0.98] hover:shadow-none transition-all">
                    <SaveIcon className="w-6 h-6" />
                    Lưu thay đổi
                  </Button>
                </section>

                <Separator className="bg-black/10" />

                <section className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2.5">
                      <ShieldIcon className="w-6 h-6 mt-1" />
                      <div>
                        <h2 className="font-bold text-black text-xl tracking-[0] leading-[normal]">
                          Xác thực hai yếu tố (2FA)
                        </h2>
                        <p className="opacity-60 font-semibold text-black text-[10px] tracking-[0] leading-[normal] mt-1">
                          Tăng cường bảo mật cho tài khoản của bạn.
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="h-auto px-[15px] py-2.5 bg-white rounded-[20px] border-[#4182f9] font-semibold text-[#3c6efd] text-base hover:bg-[#4182f9]/5 transition-colors"
                    >
                      Thiết lập
                    </Button>
                  </div>

                  <Alert className="bg-[#4182f921] border-[#d6e2f5] rounded-[10px]">
                    <AlertCircleIcon className="w-6 h-6 text-[#1851ba]" />
                    <AlertDescription className="text-[13px] tracking-[0] leading-[normal] ml-2">
                      <span className="font-medium text-[#1851ba]">
                        Khi kích hoạt, bạn sẽ cần nhập mã xác minh được gửi đến
                        số điện thoại{" "}
                      </span>
                      <span className="font-bold text-[#1851ba]">
                        0123***789
                      </span>
                      <span className="font-medium text-[#1851ba]">
                        {" "}
                        mỗi khi đăng nhập trên thiết bị mới
                      </span>
                    </AlertDescription>
                  </Alert>
                </section>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </section>
  );
};
