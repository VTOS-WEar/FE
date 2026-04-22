import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { XCircle, ShoppingCart, Home, RotateCcw, Loader2 } from "lucide-react";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { useCart } from "../../contexts/CartContext";
import { retryPayment, cancelOrder } from "../../lib/api/orders";

export const PaymentCancel = (): JSX.Element => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cart = useCart();
  const [processing, setProcessing] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  // Store pending order IDs so we can retry
  const [pendingOrderIds, setPendingOrderIds] = useState<string[]>([]);

  const orderCode = searchParams.get("orderCode") || searchParams.get("code");

  useEffect(() => {
    const processOrders = async () => {
      try {
        const raw = sessionStorage.getItem("vtos_pending_order_ids");
        if (raw) {
          const orderIds: string[] = JSON.parse(raw);
          setPendingOrderIds(orderIds);
          // Hủy toàn bộ order khi user quay lại từ màn hình PayOS
          await Promise.allSettled(
            orderIds.map((id) => cancelOrder(id, "Người dùng hủy trên trang thanh toán PayOS"))
          );
        }
      } catch {
        // Silently ignore
      } finally {
        setProcessing(false);
      }
    };
    processOrders();
    cart.clearCart();
  }, []);

  const handleRetryPayment = async () => {
    if (pendingOrderIds.length === 0) {
      // No order IDs available — redirect to orders page
      navigate("/parentprofile/orders");
      return;
    }

    setRetrying(true);
    setRetryError(null);

    try {
      // Retry payment for each order and collect payment links
      const results = await Promise.all(
        pendingOrderIds.map((id) => retryPayment(id))
      );

      // Store new order IDs for the payment success/cancel flow
      const newOrderIds = results.map((r) => r.orderId);
      sessionStorage.setItem("vtos_pending_order_ids", JSON.stringify(newOrderIds));

      // Redirect to the first payment link (PayOS checkout)
      // If multiple orders, they each have their own links — use the first one
      const paymentLink = results[0]?.paymentLink;
      if (paymentLink) {
        window.location.href = paymentLink;
      } else {
        setRetryError("Không thể tạo liên kết thanh toán mới.");
      }
    } catch (err: any) {
      setRetryError(err?.message || "Có lỗi xảy ra khi thử lại thanh toán.");
    } finally {
      setRetrying(false);
    }
  };

  return (
    <GuestLayout bgColor="#f9fafb">
      <div className="flex items-center justify-center py-16 md:py-24 px-4 nb-fade-in">
        <div className="max-w-md w-full text-center">
          {/* Cancel icon */}
          <div className="relative mb-8 flex items-center justify-center">
            <div className="w-20 h-20 bg-red-100 rounded-xl border border-gray-200 shadow-soft-md flex items-center justify-center">
              <XCircle className="w-10 h-10 text-gray-900" />
            </div>
          </div>

          {/* Content card */}
          <div className="nb-card-static p-8 mb-6">
            <h1 className="font-extrabold text-2xl text-gray-900 mb-2">
              Thanh toán bị huỷ
            </h1>
            <p className="text-sm text-gray-500 font-medium mb-6">
              Giao dịch của bạn đã bị huỷ hoặc hết hạn. Đơn hàng đã được huỷ tự động.
            </p>

            {/* Cancel status */}
            {processing ? (
              <div className="flex items-center justify-center gap-2 mb-6 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">Đang huỷ đơn hàng...</span>
              </div>
            ) : (
              orderCode && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200/10">
                  <p className="text-xs text-gray-500 mb-1 font-medium">Mã đơn hàng</p>
                  <p className="font-extrabold text-lg text-gray-900">
                    #{orderCode}
                  </p>
                  <span className="inline-block mt-2 px-3 py-1 bg-red-100 text-red-800 font-bold text-xs rounded-lg border border-red-200 shadow-sm">
                    ✓ Đã huỷ
                  </span>
                </div>
              )
            )}

            {/* Reasons */}
            <div className="text-left bg-amber-100 rounded-xl p-4 mb-6 border border-gray-200/15">
              <p className="font-bold text-sm text-gray-900 mb-2">
                ⚠️ Lý do có thể:
              </p>
              <ul className="space-y-1.5 text-xs text-gray-600 font-medium">
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

            {/* Retry error */}
            {retryError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-left">
                <p className="text-xs font-bold text-red-700">❌ {retryError}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                onClick={handleRetryPayment}
                disabled={processing || retrying}
                className="nb-btn nb-btn-purple w-full text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {retrying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang tạo giao dịch mới...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    Thử thanh toán lại ✦
                  </>
                )}
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
                className="w-full py-3 bg-gray-100 text-gray-600 font-bold text-sm rounded-xl border border-gray-200/10 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Về trang chủ
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-400 font-medium">
            Nếu bạn gặp vấn đề, vui lòng liên hệ support@vtos.vn
          </p>
        </div>
      </div>
    </GuestLayout>
  );
};
