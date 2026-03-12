import {
  AlertCircleIcon,
  ArrowRightIcon,
  PhoneIcon,
  UserIcon,
  Loader2,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Notify } from "../../components/ui/notify";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyPhone } from "../../lib/api/auth";

export const FillInformation = (): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get fullName from navigation state (passed from SignIn)
  const state = location.state as any;
  const fullName = state?.fullName || "";

  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [notify, setNotify] = useState<{
    title: string;
    message: string;
    variant: "error" | "success" | "info";
  } | null>(null);

  const handleSubmit = async () => {
    setNotify(null);

    if (!phone.trim()) {
      setNotify({
        title: "Thiếu thông tin",
        message: "Vui lòng nhập số điện thoại liên hệ.",
        variant: "info",
      });
      return;
    }

    // Basic phone validation (Vietnamese phone: 10-11 digits)
    const phoneClean = phone.replace(/\D/g, "");
    if (phoneClean.length < 10 || phoneClean.length > 11) {
      setNotify({
        title: "Số điện thoại không hợp lệ",
        message: "Vui lòng nhập số điện thoại 10-11 chữ số.",
        variant: "error",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Get access token from storage
      const accessToken =
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("access_token") ||
        "";

      if (!accessToken) {
        setNotify({
          title: "Phiên đăng nhập hết hạn",
          message: "Vui lòng đăng nhập lại.",
          variant: "error",
        });
        setTimeout(() => navigate("/signin", { replace: true }), 1500);
        return;
      }

      await verifyPhone({ phone: phoneClean }, accessToken);

      // Update stored user info with phone
      const storageKey = localStorage.getItem("access_token")
        ? localStorage
        : sessionStorage;
      const userRaw = storageKey.getItem("user");
      if (userRaw) {
        try {
          const user = JSON.parse(userRaw);
          user.phone = phoneClean;
          storageKey.setItem("user", JSON.stringify(user));
        } catch {
          /* ignore */
        }
      }

      // Show success notification, then redirect to parentprofile
      setNotify({
        title: "Liên kết số điện thoại thành công! 🎉",
        message: "Số điện thoại của bạn đã được lưu. Chuyển đến trang cá nhân sau 3 giây...",
        variant: "success",
      });
      setTimeout(() => {
        navigate("/parentprofile", { replace: true });
      }, 3000);
    } catch (e: any) {
      setNotify({
        title: "Có lỗi xảy ra",
        message: e?.message || "Không thể cập nhật thông tin.",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GuestLayout bgColor="#f4f2ff">
      <main className="flex-1 bg-[#f4f2ff] py-8 lg:py-12 px-4 relative overflow-hidden">
        {/* Decorative background vectors */}
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
              Để bắt đầu trải nghiệm mua sắm, vui lòng cập nhật số điện thoại
              liên hệ của bạn
            </p>
          </div>

          <div className="bg-white rounded-[1.875rem] shadow-lg p-6 lg:p-10 max-w-[32rem] mx-auto">
            {/* Avatar section */}
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
              {/* Full Name (read-only, from registration) */}
              <div className="space-y-3">
                <Label className="[font-family:'Montserrat',Helvetica] font-medium text-black text-xl">
                  Họ và tên phụ huynh
                  <span className="text-[#ff0000] ml-1">*</span>
                </Label>
                <div className="relative">
                  <UserIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-6 h-6 text-black opacity-40" />
                  <Input
                    type="text"
                    value={fullName}
                    disabled
                    className="h-[3.125rem] pl-11 pr-2.5 bg-gray-50 rounded-lg border border-[#00000036] [font-family:'Montserrat',Helvetica] font-normal text-base text-black/60 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Phone input */}
              <div className="space-y-3">
                <Label className="[font-family:'Montserrat',Helvetica] font-medium text-black text-xl">
                  Số điện thoại liên hệ
                  <span className="text-[#ff0000] ml-1">*</span>
                </Label>
                <div className="relative">
                  <PhoneIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-6 h-6 text-black opacity-40" />
                  <Input
                    type="tel"
                    placeholder="Nhập số điện thoại"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleSubmit();
                    }}
                    className="h-[3.125rem] pl-11 pr-2.5 bg-white rounded-lg border border-[#00000036] [font-family:'Montserrat',Helvetica] font-normal text-base focus:border-[#6938ef] focus:ring-1 focus:ring-[#6938ef] transition-colors"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <AlertCircleIcon className="w-4 h-4 opacity-60 flex-shrink-0" />
                  <p className="[font-family:'Montserrat',Helvetica] font-medium text-black text-xs opacity-60">
                    Số điện thoại sẽ được sử dụng để liên hệ giao hàng và hỗ
                    trợ
                  </p>
                </div>
              </div>

              {/* Submit button */}
              <Button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={isLoading}
                className="w-full h-16 bg-[#4e46dd] rounded-lg shadow-[0px_0px_0.525rem_#4e46dd] hover:bg-[#4e46dd]/90 mt-8 transition-all"
              >
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                ) : null}
                <span className="[font-family:'Montserrat',Helvetica] font-semibold text-white text-2xl">
                  {isLoading ? "Đang lưu..." : "Xác nhận số điện thoại"}
                </span>
                {!isLoading && (
                  <ArrowRightIcon className="w-6 h-6 ml-2.5" />
                )}
              </Button>

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
