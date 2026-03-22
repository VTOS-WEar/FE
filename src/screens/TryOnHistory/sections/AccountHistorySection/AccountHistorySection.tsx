import { CameraIcon, ChevronDownIcon, SearchIcon } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";

const menuItems = [
  { label: "Thông tin tài khoản", active: false },
  { label: "Quản lý học sinh", active: false },
  { label: "Đơn hàng", active: false },
  { label: "Lịch sử", active: true },
  { label: "Đánh giá", active: false },
  { label: "Cài đặt tài khoản", active: false },
];

const tryOnHistory = [
  {
    id: 1,
    image: "https://c.animaapp.com/mjxt3t8wNP0otU/img/gdp045-5-1.svg",
    title: "Đồng phục tiểu học Trần Đại Nghĩa",
    price: "250.000 VNĐ",
    student: "Thử cho: Bé Khôi (Lớp 3A)",
    time: "2 giờ trước",
  },
  {
    id: 2,
    image: "https://c.animaapp.com/mjxt3t8wNP0otU/img/gdp045-5-1.svg",
    title: "Đồng phục tiểu học Trần Đại Nghĩa",
    price: "250.000 VNĐ",
    student: "Thử cho: Bé Khôi (Lớp 3A)",
    time: "2 giờ trước",
  },
  {
    id: 3,
    image: "https://c.animaapp.com/mjxt3t8wNP0otU/img/gdp045-5-1.svg",
    title: "Đồng phục tiểu học Trần Đại Nghĩa",
    price: "250.000 VNĐ",
    student: "Thử cho: Bé Khôi (Lớp 3A)",
    time: "2 giờ trước",
  },
];

export const AccountHistorySection = (): JSX.Element => {
  return (
    <section className="relative w-full bg-white rounded-[30px] shadow-[0px_4px_4px_#0000006b] p-[27px]">
      <header className="flex items-center gap-[13px] mb-[23px]">
        <img
          className="w-[50px] h-[50px]"
          alt="Frame"
          src="https://c.animaapp.com/mjxt3t8wNP0otU/img/frame-239299.svg"
        />
        <div className="flex flex-col gap-[3px]">
          <div className="[font-family:'Montserrat',Helvetica] font-normal text-black text-[15px] tracking-[0] leading-[normal]">
            Tài khoản
          </div>
          <div className="[font-family:'Montserrat',Helvetica] font-semibold text-black text-xl tracking-[0] leading-[normal] whitespace-nowrap">
            Võ Gia Truyền
          </div>
        </div>
      </header>

      <div className="flex gap-[56px]">
        <aside className="flex flex-col gap-5 w-[209px] shrink-0">
          <nav className="flex flex-col gap-5">
            {menuItems.map((item, index) => (
              <Button
                key={index}
                variant="ghost"
                className={`h-11 w-full justify-center rounded-lg transition-colors ${
                  item.active
                    ? "bg-[#3c6efd] text-white hover:bg-[#3c6efd] hover:text-white"
                    : "bg-[#4182f9]/10 text-[#4182f9] hover:bg-[#4182f9]/20 hover:text-[#4182f9]"
                }`}
              >
                <span className="[font-family:'Montserrat',Helvetica] font-semibold text-base text-center tracking-[0] leading-[normal]">
                  {item.label}
                </span>
              </Button>
            ))}
          </nav>

          <Button
            variant="ghost"
            className="h-11 w-full justify-center rounded-lg bg-[#f94144]/10 text-[#f94144] hover:bg-[#f94144]/20 hover:text-[#f94144] transition-colors mt-[184px]"
          >
            <span className="[font-family:'Montserrat',Helvetica] font-semibold text-base text-center tracking-[0] leading-[normal]">
              Đăng Xuất
            </span>
          </Button>
        </aside>

        <main className="flex-1 bg-[#f5f5fa] rounded-[30px] p-[32px]">
          <Card className="bg-white rounded-[30px] border-0 shadow-none">
            <CardContent className="p-0">
              <div className="mb-[29px]">
                <Button className="h-auto px-[15px] py-2.5 rounded-[10px] shadow-[2px_0px_4px_#00000040] bg-[linear-gradient(90deg,rgba(65,130,249,1)_0%,rgba(168,122,240,1)_100%)] hover:opacity-90 transition-opacity">
                  <span className="[font-family:'Montserrat',Helvetica] font-semibold text-white text-base text-center tracking-[0] leading-[normal]">
                    Lịch sử thử đồ
                  </span>
                </Button>
              </div>

              <div className="flex items-center justify-between mb-[31px]">
                <div className="flex items-center gap-2.5">
                  <CameraIcon className="w-6 h-6" />
                  <h2 className="[font-family:'Montserrat',Helvetica] font-bold text-black text-xl tracking-[0] leading-[normal] whitespace-nowrap">
                    Ảnh thử đồ gần đây
                  </h2>
                </div>

                <div className="flex items-center gap-[7px]">
                  <div className="relative w-60">
                    <SearchIcon className="absolute left-[15px] top-1/2 -translate-y-1/2 w-6 h-6 text-black/50" />
                    <Input
                      placeholder="Tìm kiếm theo ngày..."
                      className="h-9 pl-[51px] pr-[15px] py-2.5 bg-white rounded-[10px] border border-[#999999] [font-family:'Montserrat',Helvetica] font-medium text-[13px] placeholder:opacity-50"
                    />
                  </div>
                  <img
                    className="w-[37px] h-9"
                    alt="Mynaui filter solid"
                    src="https://c.animaapp.com/mjxt3t8wNP0otU/img/mynaui-filter-solid.svg"
                  />
                </div>
              </div>

              <div className="flex gap-[50px] mb-[32px]">
                {tryOnHistory.map((item) => (
                  <Card
                    key={item.id}
                    className="w-[200px] rounded-[10px] shadow-[0px_0px_4px_#00000040] border border-[#cac9d6] overflow-hidden transition-transform hover:scale-105"
                  >
                    <CardContent className="p-0">
                      <div className="relative">
                        <img
                          className="w-[200px] h-[281px] object-cover"
                          alt="Gdp"
                          src={item.image}
                        />
                        <div className="absolute top-2 left-[145px] inline-flex items-center justify-center gap-2.5 px-[5px] py-0.5 bg-[#00000080] rounded-[5px]">
                          <span className="[font-family:'Montserrat',Helvetica] font-medium text-white text-[7px] text-center tracking-[0] leading-[normal]">
                            {item.time}
                          </span>
                        </div>
                      </div>

                      <div className="p-2.5 pt-[17px]">
                        <h3 className="w-[179px] [font-family:'Montserrat',Helvetica] font-semibold text-black text-[15px] tracking-[0] leading-[normal] mb-[9px]">
                          {item.title}
                        </h3>
                        <p className="w-[179px] opacity-[0.69] [font-family:'Montserrat',Helvetica] font-medium text-black text-[10px] tracking-[0] leading-[normal] mb-[31px]">
                          {item.student}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="[font-family:'Montserrat',Helvetica] font-bold text-[#3c6efd] text-[15px] tracking-[0] leading-[normal] whitespace-nowrap">
                            {item.price}
                          </span>
                          <Button
                            variant="outline"
                            className="h-auto px-[5px] py-0.5 bg-white rounded-[5px] border-[0.5px] border-[#3c6efd] hover:bg-[#3c6efd]/10 transition-colors"
                          >
                            <span className="[font-family:'Montserrat',Helvetica] font-medium text-[#3c6efd] text-[7px] text-center tracking-[0] leading-[normal]">
                              Xem lại
                            </span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <button className="flex items-center justify-center gap-1 mx-auto transition-opacity hover:opacity-80">
                <span className="opacity-60 [font-family:'Montserrat',Helvetica] font-semibold text-black text-[13px] tracking-[0] leading-[normal]">
                  Xem thêm lịch sử cũ hơn
                </span>
                <ChevronDownIcon className="w-[18px] h-[9px] opacity-60" />
              </button>
            </CardContent>
          </Card>
        </main>
      </div>
    </section>
  );
};
