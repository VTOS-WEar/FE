import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, ShoppingBag, Home, Loader2 } from "lucide-react";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { useCart } from "../../contexts/CartContext";

export const PaymentSuccess = (): JSX.Element => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cart = useCart();
  const [showIcon, setShowIcon] = useState(false);

  const orderCode = searchParams.get("orderCode") || searchParams.get("code");
  const status = searchParams.get("status");

  useEffect(() => {
    cart.clearCart();
    sessionStorage.removeItem("vtos_pending_order_ids");
    const timer = setTimeout(() => setShowIcon(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <GuestLayout bgColor="#FFF8F0">
      <div className="flex items-center justify-center py-16 md:py-24 px-4 nb-fade-in">
        <div className="max-w-md w-full text-center">
          {/* Success icon */}
          <div className="relative mb-8 flex items-center justify-center">
            <div className={`w-20 h-20 bg-[#C8E44D] rounded-xl border-2 border-[#1A1A2E] shadow-[4px_4px_0_#1A1A2E] flex items-center justify-center transition-all duration-500 ${showIcon ? "scale-100 opacity-100" : "scale-0 opacity-0"}`}>
              <CheckCircle className="w-10 h-10 text-[#1A1A2E]" />
            </div>
          </div>

          {/* Content card */}
          <div className="nb-card-static p-8 mb-6">
            <h1 className="font-extrabold text-2xl text-[#1A1A2E] mb-2">
              Thanh toán thành công! 🎉
            </h1>
            <p className="text-sm text-[#6B7280] mb-6 font-medium">
              Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đang được xử lý.
            </p>

            {/* Order info */}
            {orderCode && (
              <div className="bg-[#EDE9FE] rounded-xl p-4 mb-6 border-2 border-[#1A1A2E]/10">
                <p className="text-xs text-[#6B7280] mb-1 font-medium">Mã đơn hàng</p>
                <p className="font-extrabold text-lg text-[#1A1A2E]">
                  #{orderCode}
                </p>
                {status && (
                  <span className="inline-block mt-2 px-3 py-1 bg-[#C8E44D] text-[#1A1A2E] font-bold text-xs rounded-lg border-2 border-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E]">
                    {status === "PAID" ? "Đã thanh toán" : status}
                  </span>
                )}
              </div>
            )}

            {/* Steps */}
            <div className="text-left space-y-3 mb-6">
              {[
                { done: true, label: "Đặt hàng thành công" },
                { done: true, label: "Thanh toán đã được xác nhận" },
                { done: false, label: "Đang chờ nhà trường xác nhận" },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg border-2 border-[#1A1A2E] flex items-center justify-center flex-shrink-0 ${step.done ? "bg-[#C8E44D] shadow-[2px_2px_0_#1A1A2E]" : "bg-[#EDE9FE]"}`}>
                    {step.done ? (
                      <span className="text-[#1A1A2E] text-xs font-bold">✓</span>
                    ) : (
                      <Loader2 className="w-3 h-3 text-[#1A1A2E] animate-spin" />
                    )}
                  </div>
                  <span className="text-sm text-[#4C5769] font-medium">{step.label}</span>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                onClick={() => navigate("/parentprofile/orders")}
                className="nb-btn nb-btn-purple w-full text-sm flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                Xem đơn hàng ✦
              </button>
              <button
                onClick={() => navigate("/homepage")}
                className="nb-btn nb-btn-outline w-full text-sm flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Về trang chủ
              </button>
            </div>
          </div>

          <p className="text-xs text-[#9CA3AF] font-medium">
            Bạn sẽ nhận được email xác nhận đơn hàng trong vài phút.
          </p>
        </div>
      </div>
    </GuestLayout>
  );
};
