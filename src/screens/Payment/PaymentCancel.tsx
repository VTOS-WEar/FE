import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { XCircle, ShoppingCart, Home, RotateCcw, Loader2 } from "lucide-react";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { useCart } from "../../contexts/CartContext";
import { cancelOrder } from "../../lib/api/orders";

export const PaymentCancel = (): JSX.Element => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cart = useCart();
  const [cancelling, setCancelling] = useState(true);

  const orderCode = searchParams.get("orderCode") || searchParams.get("code");

  // On mount: cancel all pending orders from this checkout session
  useEffect(() => {
    const autoCancelOrders = async () => {
      try {
        const raw = sessionStorage.getItem("vtos_pending_order_ids");
        if (raw) {
          const orderIds: string[] = JSON.parse(raw);
          // Cancel each order (fire-and-forget, errors are ok)
          await Promise.allSettled(
            orderIds.map((id) => cancelOrder(id, "Người dùng huỷ trên trang thanh toán PayOS"))
          );
          // Clean up
          sessionStorage.removeItem("vtos_pending_order_ids");
        }
      } catch {
        // Silently ignore — order may already be cancelled or user not logged in
      } finally {
        setCancelling(false);
      }
    };
    autoCancelOrders();
    cart.clearCart();
  }, []);

  return (
    <GuestLayout bgColor="#F4F6FF">
      <div className="flex items-center justify-center py-16 md:py-24 px-4">
        <div className="max-w-md w-full text-center">
          {/* Cancel icon */}
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-28 h-28 rounded-full bg-red-100/60 animate-pulse" />
            </div>
            <div className="relative z-10 inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-400 to-rose-500 rounded-full shadow-lg shadow-red-400/30">
              <XCircle className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Content card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <h1 className="font-montserrat font-extrabold text-2xl text-black mb-2">
              Thanh toán bị huỷ
            </h1>
            <p className="font-montserrat text-sm text-gray-500 mb-6">
              Giao dịch của bạn đã bị huỷ hoặc hết hạn. Đơn hàng đã được huỷ tự động.
            </p>

            {/* Cancel status */}
            {cancelling ? (
              <div className="flex items-center justify-center gap-2 mb-6 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="font-montserrat text-sm">Đang huỷ đơn hàng...</span>
              </div>
            ) : (
              orderCode && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <p className="font-montserrat text-xs text-gray-500 mb-1">Mã đơn hàng</p>
                  <p className="font-montserrat font-bold text-lg text-gray-700">
                    #{orderCode}
                  </p>
                  <span className="inline-block mt-2 px-3 py-1 bg-red-100 text-red-600 font-montserrat font-semibold text-xs rounded-full">
                    ✓ Đã huỷ
                  </span>
                </div>
              )
            )}

            {/* Reasons */}
            <div className="text-left bg-amber-50 rounded-xl p-4 mb-6">
              <p className="font-montserrat font-semibold text-sm text-amber-800 mb-2">
                Lý do có thể:
              </p>
              <ul className="space-y-1.5 font-montserrat text-xs text-amber-700">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  Bạn đã nhấn huỷ trên trang thanh toán
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  Phiên thanh toán đã hết thời gian
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  Lỗi kết nối trong quá trình thanh toán
                </li>
              </ul>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                onClick={() => navigate("/cart")}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-montserrat font-bold text-sm rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Thử thanh toán lại
              </button>
              <button
                onClick={() => navigate("/parentprofile/orders")}
                className="w-full py-3.5 bg-white border border-gray-200 text-gray-700 font-montserrat font-semibold text-sm rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
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

          <p className="font-montserrat text-xs text-gray-400">
            Nếu bạn gặp vấn đề, vui lòng liên hệ support@vtos.vn
          </p>
        </div>
      </div>
    </GuestLayout>
  );
};
