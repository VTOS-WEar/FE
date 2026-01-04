import { EyeIcon, EyeOffIcon } from "lucide-react";
import { NavbarGuest, Footer } from "../../components/layout";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Separator } from "../../components/ui/separator";
import { useState } from "react";
export const SignIn = (): JSX.Element => {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="bg-white w-full min-h-screen flex flex-col">
      <NavbarGuest />

      {/* nền xám + card centered */}
      <main className="flex-1 bg-[#F4F6FF] px-4 py-10 lg:py-14">
        <div className="mx-auto w-full max-w-6xl">
          <div className="overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_60px_rgba(16,15,20,0.12)] ring-1 ring-black/5">
            <div className="flex flex-col lg:flex-row">
              {/* LEFT: form */}
              <div className="lg:w-[52%] flex items-center justify-center p-6 lg:p-12">
                <div className="w-full max-w-[26rem]">
                  <h1 className="[font-family:'Baloo_2',Helvetica] font-extrabold text-[#100f14] text-3xl lg:text-4xl text-center mb-6 lg:mb-8">
                    Đăng nhập
                  </h1>

                  <Button
                    variant="outline"
                    className="w-full h-auto flex items-center justify-center gap-3 px-5 py-3 lg:py-4 rounded-lg border border-[#cac9d6] hover:bg-gray-50"
                  >
                    <span className="[font-family:'Montserrat',Helvetica] font-medium text-[#19181f] text-sm lg:text-base">
                      Đăng nhập với Google
                    </span>
                    <img
                      className="w-6 lg:w-7 h-6 lg:h-7"
                      alt="Google"
                      src="https://c.animaapp.com/mjxt3t8wNP0otU/img/flat-color-icons-google.svg"
                    />
                  </Button>

                  <div className="flex items-center gap-4 lg:gap-6 my-5 lg:my-6">
                    <Separator className="flex-1 h-[1px] bg-[#cac9d6]" />
                    <span className="[font-family:'Montserrat',Helvetica] font-medium text-[#676576] text-base">
                      Hoặc
                    </span>
                    <Separator className="flex-1 h-[1px] bg-[#cac9d6]" />
                  </div>

                  <div className="space-y-4 lg:space-y-5">
                    <div className="space-y-2">
                      <Label className="[font-family:'Montserrat',Helvetica] font-medium text-[#9794aa] text-sm lg:text-base">
                        Email
                      </Label>
                      <Input
                        type="email"
                        placeholder="Nhập email của bạn"
                        className="h-11 lg:h-12 px-4 lg:px-5 rounded-md border border-[#cac9d6] [font-family:'Montserrat',Helvetica] font-medium text-sm lg:text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="[font-family:'Montserrat',Helvetica] font-medium text-[#9794aa] text-sm lg:text-base">
                        Mật khẩu
                      </Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Nhập mật khẩu của bạn"
                          className="h-11 lg:h-12 px-4 lg:px-5 pr-12 rounded-md border border-[#cac9d6] [font-family:'Montserrat',Helvetica] font-medium text-sm lg:text-base"
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-4 lg:right-5 top-1/2 -translate-y-1/2 text-[#676576] hover:opacity-80"
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? (
                            <EyeIcon className="w-5 lg:w-6 h-5 lg:h-6" />
                          ) : (
                            <EyeOffIcon className="w-5 lg:w-6 h-5 lg:h-6" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox id="remember" className="w-4 lg:w-5 h-4 lg:h-5" />
                        <span className="[font-family:'Montserrat',Helvetica] font-medium italic text-[#676576] text-sm lg:text-base">
                          Ghi nhớ mật khẩu
                        </span>
                      </label>

                      <button
                        type="button"
                        className="[font-family:'Montserrat',Helvetica] font-medium italic text-[#676576] text-sm lg:text-base hover:opacity-70"
                      >
                        Quên mật khẩu?
                      </button>
                    </div>

                    <Button className="w-full h-14 lg:h-16 bg-[#6838ee] rounded-[2.5rem] hover:bg-[#5527d9] mt-3 lg:mt-5">
                      <span className="[font-family:'Baloo_2',Helvetica] font-extrabold text-white text-lg lg:text-xl">
                        Đăng nhập
                      </span>
                    </Button>

                    <p className="text-center [font-family:'Poppins',Helvetica] font-normal text-sm lg:text-base">
                      <span className="text-[#494759]">Bạn chưa có tài khoản? </span>
                      <span className="[font-family:'Montserrat',Helvetica] font-semibold italic text-[#6938ef] cursor-pointer hover:underline">
                        Tạo tài khoản
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT: illustration */}
              <div className="lg:w-[48%] relative overflow-hidden bg-gradient-to-br from-[#94bfff] to-[#c68cf4] p-8 lg:p-12 flex items-center justify-center">
                {/* decor vectors nhẹ hơn */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                  <img
                    className="absolute -top-24 -left-24 w-[36rem] h-[36rem]"
                    alt="Vector"
                    src="https://c.animaapp.com/mjxt3t8wNP0otU/img/vector-29.svg"
                  />
                  <img
                    className="absolute top-28 -right-40 w-[42rem] h-[48rem]"
                    alt="Vector"
                    src="https://c.animaapp.com/mjxt3t8wNP0otU/img/vector-28.svg"
                  />
                  <img
                    className="absolute -top-40 right-0 w-[44rem] h-[36rem]"
                    alt="Vector"
                    src="https://c.animaapp.com/mjxt3t8wNP0otU/img/vector-24.svg"
                  />
                </div>

                <div className="relative z-10 w-full max-w-md text-right">
                  <img
                    className="w-14 lg:w-16 h-auto mb-4 ml-auto"
                    alt="Vtos logo"
                    src="https://c.animaapp.com/mjxt3t8wNP0otU/img/vtos--1--removebg-preview-2-1.png"
                  />

                  <p className="[font-family:'Montserrat',Helvetica] font-semibold italic text-white text-xl lg:text-3xl leading-relaxed mb-6">
                    Hỗ trợ hơn 200 mẫu đồng phục
                  </p>

                  <img
                    className="w-full max-w-[22rem] lg:max-w-[26rem] h-auto ml-auto"
                    alt="Students"
                    src="https://c.animaapp.com/mjxt3t8wNP0otU/img/vtos--3--removebg-preview-1.png"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
