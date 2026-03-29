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

  useEffect(() => {
    const autoCancelOrders = async () => {
      try {
        const raw = sessionStorage.getItem("vtos_pending_order_ids");
        if (raw) {
          const orderIds: string[] = JSON.parse(raw);
          await Promise.allSettled(
            orderIds.map((id) => cancelOrder(id, "Người dùng huỷ trên trang thanh toán PayOS"))
          );
          sessionStorage.removeItem("vtos_pending_order_ids");
        }
      } catch {
        // Silently ignore
      } finally {
        setCancelling(false);
      }
    };
    autoCancelOrders();
    cart.clearCart();
  }, []);

  return (
    <GuestLayout bgColor="#FFF8F0">
      <div className="flex items-center justify-center py-16 md:py-24 px-4 nb-fade-in">
        <div className="max-w-md w-full text-center">
          {/* Cancel icon */}
          <div className="relative mb-8 flex items-center justify-center">
            <div className="w-20 h-20 bg-[#FFD6D6] rounded-xl border-2 border-[#1A1A2E] shadow-[4px_4px_0_#1A1A2E] flex items-center justify-center">
              <XCircle className="w-10 h-10 text-[#1A1A2E]" />
            </div>
          </div>

          {/* Content card */}
          <div className="nb-card-static p-8 mb-6">
            <h1 className="font-extrabold text-2xl text-[#1A1A2E] mb-2">
              Thanh toán bị huỷ
            </h1>
            <p className="text-sm text-[#6B7280] font-medium mb-6">
              Giao dịch của bạn đã bị huỷ hoặc hết hạn. Đơn hàng đã được huỷ tự động.
            </p>

            {/* Cancel status */}
            {cancelling ? (
              <div className="flex items-center justify-center gap-2 mb-6 text-[#6B7280]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">Đang huỷ đơn hàng...</span>
              </div>
            ) : (
              orderCode && (
                <div className="bg-[#F9FAFB] rounded-xl p-4 mb-6 border-2 border-[#1A1A2E]/10">
                  <p className="text-xs text-[#6B7280] mb-1 font-medium">Mã đơn hàng</p>
                  <p className="font-extrabold text-lg text-[#1A1A2E]">
                    #{orderCode}
                  </p>
                  <span className="inline-block mt-2 px-3 py-1 bg-[#FFD6D6] text-[#1A1A2E] font-bold text-xs rounded-lg border-2 border-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E]">
                    ✓ Đã huỷ
                  </span>
                </div>
              )
            )}

            {/* Reasons */}
            <div className="text-left bg-[#FFF3CD] rounded-xl p-4 mb-6 border-2 border-[#1A1A2E]/15">
              <p className="font-bold text-sm text-[#1A1A2E] mb-2">
                ⚠️ Lý do có thể:
              </p>
              <ul className="space-y-1.5 text-xs text-[#4C5769] font-medium">
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
                className="nb-btn nb-btn-purple w-full text-sm flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Thử thanh toán lại ✦
              </button>
              <button
                onClick={() => navigate("/parentprofile/orders")}
                className="nb-btn nb-btn-outline w-full text-sm flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Xem đơn hàng
              </button>
              <button
                onClick={() => navigate("/homepage")}
                className="w-full py-3 bg-[#F3F4F6] text-[#4C5769] font-bold text-sm rounded-xl border-2 border-[#1A1A2E]/10 hover:bg-[#E5E7EB] transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Về trang chủ
              </button>
            </div>
          </div>

          <p className="text-xs text-[#9CA3AF] font-medium">
            Nếu bạn gặp vấn đề, vui lòng liên hệ support@vtos.vn
          </p>
        </div>
      </div>
    </GuestLayout>
  );
};
