import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, ShoppingBag, Home, Loader2 } from "lucide-react";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { useCart } from "../../contexts/CartContext";

export const PaymentSuccess = (): JSX.Element => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cart = useCart();
  const [showConfetti, setShowConfetti] = useState(false);

  // PayOS appends ?orderCode=123456&status=PAID etc.
  const orderCode = searchParams.get("orderCode") || searchParams.get("code");
  const status = searchParams.get("status");

  useEffect(() => {
    // Clear cart — order is already created in backend
    cart.clearCart();
    // Clean up pending order IDs (payment was successful, no need to cancel)
    sessionStorage.removeItem("vtos_pending_order_ids");
    // Trigger confetti animation after mount
    const timer = setTimeout(() => setShowConfetti(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <GuestLayout bgColor="#F4F6FF">
      <div className="flex items-center justify-center py-16 md:py-24 px-4">
        <div className="max-w-md w-full text-center">
          {/* Success animation */}
          <div className="relative mb-8">
            {/* Glow effect */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-32 h-32 rounded-full bg-green-400/20 transition-all duration-1000 ${showConfetti ? "scale-100 opacity-100" : "scale-50 opacity-0"}`} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-24 h-24 rounded-full bg-green-400/30 transition-all duration-700 delay-200 ${showConfetti ? "scale-100 opacity-100" : "scale-50 opacity-0"}`} />
            </div>
            {/* Icon */}
            <div className={`relative z-10 inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full shadow-lg shadow-green-400/30 transition-all duration-500 ${showConfetti ? "scale-100" : "scale-0"}`}>
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Content card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <h1 className="font-montserrat font-extrabold text-2xl text-black mb-2">
              Thanh toán thành công! 🎉
            </h1>
            <p className="font-montserrat text-sm text-gray-500 mb-6">
              Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đang được xử lý.
            </p>

            {/* Order info */}
            {orderCode && (
              <div className="bg-purple-50 rounded-xl p-4 mb-6">
                <p className="font-montserrat text-xs text-gray-500 mb-1">Mã đơn hàng</p>
                <p className="font-montserrat font-bold text-lg text-purple-600">
                  #{orderCode}
                </p>
                {status && (
                  <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 font-montserrat font-semibold text-xs rounded-full">
                    {status === "PAID" ? "Đã thanh toán" : status}
                  </span>
                )}
              </div>
            )}

            {/* Steps */}
            <div className="text-left space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 text-xs font-bold">✓</span>
                </div>
                <span className="font-montserrat text-sm text-gray-600">Đặt hàng thành công</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 text-xs font-bold">✓</span>
                </div>
                <span className="font-montserrat text-sm text-gray-600">Thanh toán đã được xác nhận</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Loader2 className="w-3 h-3 text-purple-600 animate-spin" />
                </div>
                <span className="font-montserrat text-sm text-gray-600">Đang chờ nhà trường xác nhận</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                onClick={() => navigate("/parentprofile/orders")}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-montserrat font-bold text-sm rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                Xem đơn hàng
              </button>
              <button
                onClick={() => navigate("/homepage")}
                className="w-full py-3.5 bg-gray-100 text-gray-700 font-montserrat font-semibold text-sm rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Về trang chủ
              </button>
            </div>
          </div>

          {/* Note */}
          <p className="font-montserrat text-xs text-gray-400">
            Bạn sẽ nhận được email xác nhận đơn hàng trong vài phút.
          </p>
        </div>
      </div>
    </GuestLayout>
  );
};
