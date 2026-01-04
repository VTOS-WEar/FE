import { NavbarGuest, Footer } from "../../components/layout";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Separator } from "../../components/ui/separator";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
export const SignUp = (): JSX.Element => {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="bg-white w-full min-h-screen flex flex-col">
      <NavbarGuest />

      <main className="flex-1 bg-[#F4F6FF] px-4 py-10 lg:py-14">
        <div className="mx-auto w-full max-w-6xl">
          {/* Card */}
          <div className="overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_60px_rgba(16,15,20,0.12)] ring-1 ring-black/5">
            <div className="flex flex-col lg:flex-row">
              {/* Left panel (trong card) */}
              <div className="relative lg:w-[42%] bg-gradient-to-br from-[#94bfff] to-[#c68cf4] p-8 lg:p-10 flex items-center justify-center overflow-hidden">
                {/* decor vectors (nhẹ lại để giống mock) */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                  <img
                    className="absolute -top-20 -left-24 w-[36rem] h-[36rem]"
                    alt="Vector"
                    src="https://c.animaapp.com/mjxt3t8wNP0otU/img/vector.svg"
                  />
                  <img
                    className="absolute top-32 -left-10 w-[40rem] h-[46rem]"
                    alt="Vector"
                    src="https://c.animaapp.com/mjxt3t8wNP0otU/img/vector-3.svg"
                  />
                  <img
                    className="absolute -bottom-28 -left-16 w-[44rem] h-[36rem]"
                    alt="Vector"
                    src="https://c.animaapp.com/mjxt3t8wNP0otU/img/vector-1.svg"
                  />
                </div>

                <div className="relative z-10 w-full max-w-sm">
                  <img
                    className="w-14 lg:w-16 h-auto mb-4"
                    alt="Vtos logo"
                    src="https://c.animaapp.com/mjxt3t8wNP0otU/img/vtos--1--removebg-preview-2.png"
                  />

                  <p className="[font-family:'Montserrat',Helvetica] font-semibold italic text-white text-lg lg:text-2xl leading-relaxed mb-6">
                    AI Try-On đồng phục: xem bạn mặc thế nào chỉ trong vài giây
                  </p>

                  <img
                    className="w-full h-auto"
                    alt="Illustration"
                    src="https://c.animaapp.com/mjxt3t8wNP0otU/img/7850dea647994b6db38f4ccd875eaf37-removebg-preview-1.png"
                  />
                </div>
              </div>

              {/* Right panel */}
              <div className="lg:w-[58%] flex items-center justify-center p-6 lg:p-10">
                <div className="w-full max-w-[30rem]">
                  <div className="mb-6">
                    <h1 className="[font-family:'Baloo_2',Helvetica] font-extrabold text-[#100f14] text-3xl lg:text-4xl text-center">
                      Tạo tài khoản mới
                    </h1>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full h-auto flex items-center justify-center gap-2.5 px-5 py-3 lg:py-4 rounded-lg border border-[#cac9d6] hover:bg-gray-50"
                  >
                    <span className="[font-family:'Montserrat',Helvetica] font-medium text-[#19181f] text-sm lg:text-base">
                      Tạo tài khoản với Google
                    </span>
                    <img
                      className="w-6 lg:w-7 h-6 lg:h-7"
                      alt="Google"
                      src="https://c.animaapp.com/mjxt3t8wNP0otU/img/flat-color-icons-google.svg"
                    />
                  </Button>

                  <div className="flex items-center gap-4 lg:gap-6 my-5">
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
                        Họ tên
                      </Label>
                      <Input
                        type="text"
                        placeholder="Nhập họ tên của bạn"
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
                          placeholder="Tạo mật khẩu của bạn"
                          className="h-11 lg:h-12 px-4 lg:px-5 pr-12 rounded-md border border-[#cac9d6] [font-family:'Montserrat',Helvetica] font-medium text-sm lg:text-base"
                        />
                        <Button
                          onClick={() => setShowPassword((prev) => !prev)}
                          variant="ghost"
                          size="icon"
                          className="absolute right-3 top-1/2 -translate-y-1/2 h-auto w-auto p-0 hover:bg-transparent"
                        >
                          <img
                            className="w-5 lg:w-6 h-5 lg:h-6"
                            alt="Toggle password"
                            src="https://c.animaapp.com/mjxt3t8wNP0otU/img/eye-disable.svg"
                          />
                        </Button>
                      </div>
                    </div>

                    <Button className="w-full h-14 lg:h-16 bg-[#6838ee] rounded-[2.5rem] hover:bg-[#5730c9] mt-3">
                      <span className="[font-family:'Baloo_2',Helvetica] font-extrabold text-white text-lg lg:text-xl">
                        Tạo tài khoản
                      </span>
                    </Button>

                    <p className="text-center [font-family:'Poppins',Helvetica] font-normal text-sm lg:text-base">
                      <span className="text-[#494759]">Bạn đã có tài khoản? </span>
                      <Button
                        variant="link"
                        className="[font-family:'Montserrat',Helvetica] font-semibold italic text-[#6938ef] p-0 h-auto hover:underline"
                      >
                        Đăng Nhập
                      </Button>
                    </p>
                  </div>
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
