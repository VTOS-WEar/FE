import {
  AlertCircleIcon,
  ArrowRightIcon,
  PhoneIcon,
  UserIcon,
  Loader2,
  CheckCircle2,
  GraduationCapIcon,
  SchoolIcon,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Notify } from "../../components/ui/notify";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyPhone } from "../../lib/api/auth";

interface ChildResult {
  childId: string;
  fullName: string;
  age: number;
  grade: string;
  gender: string;
  school: {
    schoolId: string;
    schoolName: string;
    logoURL?: string | null;
  };
}

export const FillInformation = (): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get fullName and email from navigation state (passed from SignIn)
  const state = location.state as any;
  const fullName = state?.fullName || "";

  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [notify, setNotify] = useState<{
    title: string;
    message: string;
    variant: "error" | "success" | "info";
  } | null>(null);

  // Result state — after successful phone verification
  const [verifyResult, setVerifyResult] = useState<{
    matchedCount: number;
    children: ChildResult[];
    phone: string;
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

      const data = await verifyPhone({ phone: phoneClean }, accessToken);

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

      // Show result panel instead of auto-navigating
      setVerifyResult({
        matchedCount: data.matchedCount,
        children: data.children || [],
        phone: phoneClean,
      });
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

  const handleContinue = () => {
    navigate("/findschool", {
      replace: true,
      state: {
        phone: verifyResult?.phone,
        children: verifyResult?.children,
        matchedCount: verifyResult?.matchedCount,
      },
    });
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
              Để bắt đầu trải nghiệm mua sắm, vui lòng cập nhật thông tin liên
              hệ của bạn
            </p>
          </div>

          <div className="bg-white rounded-[1.875rem] shadow-lg p-6 lg:p-10 max-w-[32rem] mx-auto">
            {/* ========== RESULT VIEW (after successful verify) ========== */}
            {verifyResult ? (
              <div className="space-y-6">
                {/* Success header */}
                <div className="flex flex-col items-center gap-3 pb-6 border-b border-gray-100">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-9 h-9 text-emerald-500" />
                  </div>
                  <h2 className="[font-family:'Montserrat',Helvetica] font-bold text-black text-xl text-center">
                    Xác thực thành công!
                  </h2>
                  <p className="[font-family:'Montserrat',Helvetica] font-medium text-black/60 text-sm text-center">
                    Số điện thoại <span className="font-semibold text-black">{verifyResult.phone}</span> đã được liên kết
                  </p>
                </div>

                {/* Matched children */}
                {verifyResult.matchedCount > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-600">{verifyResult.matchedCount}</span>
                      </div>
                      <p className="[font-family:'Montserrat',Helvetica] font-semibold text-black text-base">
                        Học sinh được tìm thấy
                      </p>
                    </div>

                    <div className="space-y-3">
                      {verifyResult.children.map((child) => (
                        <div
                          key={child.childId}
                          className="flex items-center gap-4 p-4 bg-[#f4f2ff] rounded-xl border border-[#e8e5f5] hover:border-[#6938ef]/30 transition-colors"
                        >
                          {/* Avatar */}
                          <div className="w-12 h-12 bg-gradient-to-br from-[#6938ef] to-[#9b7af0] rounded-full flex items-center justify-center flex-shrink-0">
                            <UserIcon className="w-6 h-6 text-white" />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="[font-family:'Montserrat',Helvetica] font-semibold text-black text-base truncate">
                              {child.fullName}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="flex items-center gap-1 text-sm text-black/60">
                                <GraduationCapIcon className="w-3.5 h-3.5" />
                                {child.grade || "—"}
                              </span>
                              <span className="flex items-center gap-1 text-sm text-black/60">
                                <SchoolIcon className="w-3.5 h-3.5" />
                                {child.school?.schoolName || "—"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="[font-family:'Montserrat',Helvetica] font-medium text-black/60 text-base">
                      Chưa tìm thấy học sinh nào liên kết với số này.
                    </p>
                    <p className="[font-family:'Montserrat',Helvetica] font-normal text-black/40 text-sm mt-1">
                      Bạn có thể chọn trường và liên kết sau.
                    </p>
                  </div>
                )}

                {/* Continue button */}
                <Button
                  type="button"
                  onClick={handleContinue}
                  className="w-full h-16 bg-[#4e46dd] rounded-lg shadow-[0px_0px_0.525rem_#4e46dd] hover:bg-[#4e46dd]/90 mt-4 transition-all"
                >
                  <span className="[font-family:'Montserrat',Helvetica] font-semibold text-white text-2xl">
                    Tiếp tục: Chọn trường học
                  </span>
                  <ArrowRightIcon className="w-6 h-6 ml-2.5" />
                </Button>

                {/* Step indicator */}
                <div className="flex flex-col items-center gap-5 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-[3.625rem] h-[0.25rem] bg-[#4e46dd] rounded-full" />
                    <div className="w-4 h-[0.15rem] bg-gray-300 rounded-full" />
                  </div>
                  <p className="[font-family:'Montserrat',Helvetica] font-medium text-black text-sm opacity-60">
                    BƯỚC 1 TRÊN 2
                  </p>
                </div>
              </div>
            ) : (
              /* ========== FORM VIEW (initial state) ========== */
              <>
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

                  {/* Phone input (editable) */}
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
                      {isLoading ? "Đang xác thực..." : "Xác thực số điện thoại"}
                    </span>
                    {!isLoading && (
                      <ArrowRightIcon className="w-6 h-6 ml-2.5" />
                    )}
                  </Button>

                  {/* Step indicator */}
                  <div className="flex flex-col items-center gap-5 mt-8">
                    <div className="flex items-center gap-2">
                      <div className="w-[3.625rem] h-[0.25rem] bg-[#4e46dd] rounded-full" />
                      <div className="w-4 h-[0.15rem] bg-gray-300 rounded-full" />
                    </div>
                    <p className="[font-family:'Montserrat',Helvetica] font-medium text-black text-sm opacity-60">
                      BƯỚC 1 TRÊN 2
                    </p>
                  </div>
                </div>
              </>
            )}
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
