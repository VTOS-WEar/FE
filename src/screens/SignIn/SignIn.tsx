import { EyeIcon, EyeOffIcon, AlertCircle } from "lucide-react";
import { NavbarGuest, Footer } from "../../components/layout";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Separator } from "../../components/ui/separator";
import { useEffect, useState } from "react";
import { login } from "../../lib/api/auth";
import { Alert, AlertTitle, AlertDescription } from "../../components/ui/alert";
import { Notify } from "../../components/ui/notify";
import { useNavigate, Link } from "react-router-dom";
import { GuestLayout } from "../../components/layout/GuestLayout";
export const SignIn = (): JSX.Element => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notify, setNotify] = useState<{ title: string; message: string; variant: "error" | "success" | "info" } | null>(null);
  const handleSignIn = async () => {
    setNotify(null);

    if (!email.trim() || !password) {
      setNotify({
        title: "Đăng nhập thất bại",
        message: "Vui lòng nhập email và mật khẩu.",
        variant: "error",
      });
      return;
    }

    try {
      setIsLoading(true);

      const data = await login({ email, password });

      // rememberMe: lưu localStorage (bền) hoặc sessionStorage (chỉ phiên)
      const storage = rememberMe ? localStorage : sessionStorage;

      storage.setItem("access_token", data.accessToken);
      storage.setItem("user", JSON.stringify(data.user));
      storage.setItem("expires_in", String(data.expiresIn));

      navigate("/homepage", {
        replace: true,
        state: { from: "/login" },
      });

    } catch (e: any) {
      setErrorMsg(e?.message || "Có lỗi xảy ra.");
      setNotify({
        title: "Đăng nhập thất bại",
        message: e?.message || "Có lỗi xảy ra.",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GuestLayout bgColor="#f4f2ff" >

      <main className="flex-1 bg-[#F4F6FF] px-4 py-10 lg:py-14">
        <div className="mx-auto w-full max-w-6xl">
          <div className="overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_60px_rgba(16,15,20,0.12)] ring-1 ring-black/5">
            <div className="flex flex-col lg:flex-row">
              {/* LEFT */}
              <div className="lg:w-[52%] flex items-center justify-center p-6 lg:p-12">
                <div className="w-full max-w-[26rem]">
                  <h1 className="[font-family:'Baloo_2',Helvetica] font-extrabold text-[#100f14] text-3xl lg:text-4xl text-center mb-6 lg:mb-8">
                    Đăng nhập
                  </h1>

                  <Button
                    variant="outline"
                    className="w-full h-auto flex items-center justify-center gap-3 px-5 py-3 lg:py-4 rounded-lg border border-[#cac9d6] hover:bg-gray-50"
                    type="button"
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
                    {/* error */}
                    {/* {errorMsg && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <div
                          className="absolute inset-0 bg-black/30"
                          onClick={() => setErrorMsg(null)}
                        />
                        <div className="relative w-full max-w-md">
                          <Alert variant="destructive" className="shadow-lg">
                            <AlertCircle className="h-4 w-4" />
                            <div>
                              <AlertTitle>Đăng nhập thất bại</AlertTitle>
                              <AlertDescription>{errorMsg}</AlertDescription>
                            </div>
                          </Alert>
                        </div>
                      </div>
                    )} */}

                    <div className="space-y-2">
                      <Label className="[font-family:'Montserrat',Helvetica] font-medium text-[#9794aa] text-sm lg:text-base">
                        Email
                      </Label>
                      <Input
                        type="email"
                        placeholder="Nhập email của bạn"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-11 lg:h-12 px-4 lg:px-5 pr-12 rounded-md border border-[#cac9d6] [font-family:'Montserrat',Helvetica] font-medium text-sm lg:text-base"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSignIn();
                          }}
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
                        <Checkbox
                          id="remember"
                          checked={rememberMe}
                          onCheckedChange={(v) => setRememberMe(Boolean(v))}
                          className="w-4 lg:w-5 h-4 lg:h-5"
                        />
                        <span className="[font-family:'Montserrat',Helvetica] font-medium italic text-[#676576] text-sm lg:text-base">
                          Ghi nhớ mật khẩu
                        </span>
                      </label>

                      <button
                        type="button"
                        className="[font-family:'Montserrat',Helvetica] font-medium italic text-[#676576] text-sm lg:text-base hover:opacity-70"
                      >
                        <Link to="/forgot-password">
                          Quên mật khẩu?
                        </Link>
                      </button>
                    </div>

                    <Button
                      type="button"
                      onClick={handleSignIn}
                      disabled={isLoading}
                      className="w-full h-14 lg:h-16 bg-[#6838ee] rounded-[2.5rem] hover:bg-[#5527d9] mt-3 lg:mt-5"
                    >
                      <span className="[font-family:'Baloo_2',Helvetica] font-extrabold text-white text-lg lg:text-xl">
                        {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
                      </span>
                    </Button>

                    <p className="text-center [font-family:'Poppins',Helvetica] font-normal text-sm lg:text-base">
                      <span className="text-[#494759]">Bạn chưa có tài khoản? </span>
                      <Link
                        to="/sign-up"
                        className="[font-family:'Montserrat',Helvetica] font-semibold italic text-[#6938ef] cursor-pointer hover:underline"
                      >
                        Tạo tài khoản
                      </Link>
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div className="lg:w-[48%] relative overflow-hidden bg-gradient-to-br from-[#94bfff] to-[#c68cf4] p-8 lg:p-12 flex items-center justify-center">
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


      <Notify
        open={!!notify}
        title={notify?.title || ""}
        message={notify?.message}
        variant={notify?.variant}
        onClose={() => setNotify(null)}
      />
    </GuestLayout>
  );

};
