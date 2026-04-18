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
    <GuestLayout bgColor="#f9fafb">
      <div className="flex items-center justify-center py-16 md:py-24 px-4 nb-fade-in">
        <div className="max-w-md w-full text-center">
          {/* Success icon */}
          <div className="relative mb-8 flex items-center justify-center">
            <div className={`w-20 h-20 bg-emerald-400 rounded-xl border border-gray-200 shadow-soft-md flex items-center justify-center transition-all duration-500 ${showIcon ? "scale-100 opacity-100" : "scale-0 opacity-0"}`}>
              <CheckCircle className="w-10 h-10 text-gray-900" />
            </div>
          </div>

          {/* Content card */}
          <div className="nb-card-static p-8 mb-6">
            <h1 className="font-extrabold text-2xl text-gray-900 mb-2">
              Thanh toán thành công! 🎉
            </h1>
            <p className="text-sm text-gray-500 mb-6 font-medium">
              Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đang được xử lý.
            </p>

            {/* Order info */}
            {orderCode && (
              <div className="bg-violet-50 rounded-xl p-4 mb-6 border border-gray-200/10">
                <p className="text-xs text-gray-500 mb-1 font-medium">Mã đơn hàng</p>
                <p className="font-extrabold text-lg text-gray-900">
                  #{orderCode}
                </p>
                {status && (
                  <span className="inline-block mt-2 px-3 py-1 bg-emerald-400 text-gray-900 font-bold text-xs rounded-lg border border-gray-200 shadow-sm">
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
                  <div className={`w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0 ${step.done ? "bg-emerald-400 shadow-sm" : "bg-violet-50"}`}>
                    {step.done ? (
                      <span className="text-gray-900 text-xs font-bold">✓</span>
                    ) : (
                      <Loader2 className="w-3 h-3 text-gray-900 animate-spin" />
                    )}
                  </div>
                  <span className="text-sm text-gray-600 font-medium">{step.label}</span>
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

          <p className="text-xs text-gray-400 font-medium">
            Bạn sẽ nhận được email xác nhận đơn hàng trong vài phút.
          </p>
        </div>
      </div>
    </GuestLayout>
  );
};
