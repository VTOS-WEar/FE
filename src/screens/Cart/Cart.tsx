import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Trash2,
  Minus,
  Plus,
  ShieldCheck,
  RotateCcw,
  Truck,
  School,
  ShoppingCart,
  Loader2,
  Star,
  CheckCircle2,
  X,
  Package,
} from "lucide-react";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { useCart, type CartItem } from "../../contexts/CartContext";
import { useToast } from "../../contexts/ToastContext";
import { checkout, createDirectOrder, type CheckoutRequest, type CreateDirectOrderRequest } from "../../lib/api/orders";
import { getMyChildren, type ChildProfileDto } from "../../lib/api/users";
import { getProvidersForPublicationOutfit, type SemesterCatalogProviderDto } from "../../lib/api/public";

/* ── Helpers ── */
const fmt = (n: number) =>
  n.toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + " VNĐ";

/* ── Provider Selection Modal ── */
type ProviderModalProps = {
  open: boolean;
  item: CartItem | null;
  onClose: () => void;
  onSelect: (provider: SemesterCatalogProviderDto) => void;
};

function ProviderSelectionModal({ open, item, onClose, onSelect }: ProviderModalProps) {
  const [providers, setProviders] = useState<SemesterCatalogProviderDto[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!open || !item?.semesterPublicationId || !item?.outfitId) return;

    setLoading(true);
    getProvidersForPublicationOutfit(item.semesterPublicationId, item.outfitId)
      .then(setProviders)
      .catch(() => {
        showToast({ title: "Lỗi", message: "Không thể tải danh sách nhà cung cấp", variant: "error" });
        onClose();
      })
      .finally(() => setLoading(false));
  }, [open, item, showToast, onClose]);

  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-soft-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-montserrat font-extrabold text-lg text-black">Thay đổi nhà cung cấp</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.outfitName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-black">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              <p className="text-sm font-medium text-gray-500">Đang tìm kiếm nhà cung cấp...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {providers.map((p) => (
                <button
                  key={p.providerId}
                  onClick={() => onSelect(p)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all group ${
                    p.providerId === item.providerId
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-100 hover:border-purple-100 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-montserrat font-bold text-sm text-black group-hover:text-purple-700 transition-colors">
                          {p.providerName}
                        </span>
                        {p.providerId === item.providerId && (
                          <span className="bg-purple-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Đang chọn</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-gray-500">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {p.averageRating.toFixed(1)}
                        </span>
                        <span>•</span>
                        <span>{p.totalCompletedOrders} đơn đã giao</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-montserrat font-extrabold text-base text-purple-600">{fmt(p.price)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 font-montserrat font-bold text-sm text-gray-500 hover:text-black transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
export const Cart = (): JSX.Element => {
  const navigate = useNavigate();
  const cart = useCart();
  const { showToast } = useToast();
  const [coupon, setCoupon] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"home" | "school">("home");
  const [checkingOut, setCheckingOut] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");
  const [childMap, setChildMap] = useState<Map<string, ChildProfileDto>>(new Map());
  const [initialLoading, setInitialLoading] = useState(true);

  // Provider update state
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);

  /* ── Fetch fresh child data ── */
  useEffect(() => {
    getMyChildren()
      .then((kids) => {
        const map = new Map<string, ChildProfileDto>();
        for (const k of kids) map.set(k.childId, k);
        setChildMap(map);
      })
      .catch(() => {})
      .finally(() => setInitialLoading(false));
  }, []);

  /* ── Derived ── */
  const { groups, items: allItems } = cart;
  const subtotal = allItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const shippingFee = deliveryMethod === "home" ? 30000 : 0;
  const discount = 0;
  const total = subtotal + shippingFee - discount;

  /* ── Checkout handler ── */
  const handleCheckout = async () => {
    if (allItems.length === 0) return;

    if (deliveryMethod === "home" && !shippingAddress.trim()) {
      showToast({ title: "Thiếu thông tin", message: "Vui lòng nhập địa chỉ giao hàng", variant: "error" });
      return;
    }

    setCheckingOut(true);
    try {
      // 1. Separate items into Campaign groups and Marketplace (Direct) groups
      const campaignGroups = new Map<string, { childProfileId: string; campaignId: string; items: CartItem[] }>();
      const marketplaceGroups = new Map<string, { childProfileId: string; publicationId: string; providerId: string; items: CartItem[] }>();

      for (const item of allItems) {
        if (item.orderMode === "marketplace" && item.semesterPublicationId && item.providerId) {
          const key = `${item.childProfileId}__${item.semesterPublicationId}__${item.providerId}`;
          if (!marketplaceGroups.has(key)) {
            marketplaceGroups.set(key, { 
              childProfileId: item.childProfileId, 
              publicationId: item.semesterPublicationId, 
              providerId: item.providerId, 
              items: [] 
            });
          }
          marketplaceGroups.get(key)!.items.push(item);
        } else {
          // Standard campaign order
          const key = `${item.childProfileId}__${item.campaignId}`;
          if (!campaignGroups.has(key)) {
            campaignGroups.set(key, { childProfileId: item.childProfileId, campaignId: item.campaignId, items: [] });
          }
          campaignGroups.get(key)!.items.push(item);
        }
      }

      let lastPaymentLink = "";
      const createdOrderIds: string[] = [];

      // 2. Process Campaign Orders
      for (const [, group] of campaignGroups) {
        const request: CheckoutRequest = {
          childProfileId: group.childProfileId,
          items: group.items.map(item => ({
            productVariantId: item.productVariantId,
            quantity: item.quantity,
          })),
          shippingAddress: deliveryMethod === "school" ? "Nhận tại trường" : shippingAddress,
          deliveryMethod: deliveryMethod === "home" ? "Giao tận nhà" : "Nhận tại trường",
          campaignId: group.campaignId,
        };

        const result = await checkout(request);
        lastPaymentLink = result.paymentLink;
        createdOrderIds.push(result.orderId);
      }

      // 3. Process Marketplace Orders (Direct)
      for (const [, group] of marketplaceGroups) {
        const request: CreateDirectOrderRequest = {
          childProfileId: group.childProfileId,
          semesterPublicationId: group.publicationId,
          providerId: group.providerId,
          items: group.items.map(item => ({
            productVariantId: item.productVariantId,
            quantity: item.quantity,
          })),
          shippingAddress: deliveryMethod === "school" ? "Nhận tại trường" : shippingAddress,
          deliveryMethod: deliveryMethod === "home" ? "Giao tận nhà" : "Nhận tại trường",
        };

        const result = await createDirectOrder(request);
        lastPaymentLink = result.paymentLink;
        createdOrderIds.push(result.orderId);
      }

      // 4. Redirect to last payment link (PayOS handles multiple payments or combined UI if backend supports it; 
      // but here we just go to the last one as per existing logic, assuming user completes them one by one or sequential redirect)
      if (lastPaymentLink) {
        sessionStorage.setItem("vtos_pending_order_ids", JSON.stringify(createdOrderIds));
        window.location.href = lastPaymentLink;
        return;
      }
    } catch (err: any) {
      showToast({
        title: "Đặt hàng thất bại",
        message: err?.message || "Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.",
        variant: "error",
      });
    } finally {
      setCheckingOut(false);
    }
  };

  const handleProviderSelect = (p: SemesterCatalogProviderDto) => {
    if (editingItem) {
      cart.updateProvider(editingItem.id, p.providerId, p.providerName, p.price);
      showToast({ title: "Cập nhật thành công", message: `Đã đổi sang nhà cung cấp ${p.providerName}`, variant: "success" });
      setEditingItem(null);
    }
  };

  if (initialLoading) {
    return (
      <GuestLayout bgColor="#F4F6FF" mainClassName="flex-1">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-16 flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
            <p className="font-montserrat text-sm text-gray-400">Đang tải giỏ hàng...</p>
          </div>
        </div>
      </GuestLayout>
    );
  }

  if (allItems.length === 0 && !checkingOut) {
    return (
      <GuestLayout bgColor="#f9fafb" mainClassName="flex-1">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-16 text-center">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="font-montserrat font-extrabold text-2xl text-black mb-2">
            Giỏ hàng trống
          </h1>
          <p className="font-montserrat text-sm text-gray-400 mb-6">
            Bạn chưa thêm sản phẩm nào vào giỏ hàng.
          </p>
          <button
            onClick={() => navigate("/schools")}
            className="px-6 py-3 bg-purple-600 text-white font-montserrat font-semibold text-sm rounded-xl hover:bg-purple-700 transition-colors"
          >
            Khám phá đồng phục
          </button>
        </div>
      </GuestLayout>
    );
  }

  return (
    <GuestLayout bgColor="#F4F6FF" mainClassName="flex-1">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-8">
        {/* ───── Breadcrumb ───── */}
        <div className="flex items-center gap-2 text-sm mb-6">
          <Link
            to="/homepage"
            className="font-montserrat text-black/40 hover:text-black/70"
          >
            Trang chủ
          </Link>
          <ChevronRight className="w-4 h-4 text-black/40" />
          <span className="font-montserrat font-semibold text-black">
            Giỏ hàng của Tôi
          </span>
        </div>

        {/* ───── Title ───── */}
        <h1 className="font-montserrat font-extrabold text-3xl text-black mb-1">
          Giỏ hàng của Tôi
        </h1>
        <p className="font-montserrat text-sm text-gray-400 mb-8">
          Bạn đang có {allItems.length} sản phẩm trong giỏ hàng
        </p>

        {/* ───── Main Grid ───── */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Left: Cart items ── */}
          <div className="flex-1 min-w-0 space-y-6">
            {groups.map((group) => (
              <div
                key={`${group.schoolId}-${group.campaignId}`}
                className="bg-white rounded-2xl border border-gray-200 shadow-soft-md overflow-hidden"
              >
                {/* School header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <School className="w-5 h-5 text-purple-500" />
                    <h2 className="font-montserrat font-bold text-base text-black">
                      {group.schoolName}
                    </h2>
                  </div>
                  {group.campaignLabel && (
                    <span className="bg-purple-100 text-purple-700 font-montserrat font-semibold text-xs px-3 py-1.5 rounded-full">
                      {group.campaignLabel}
                    </span>
                  )}
                </div>

                {/* Items */}
                <div className="divide-y divide-gray-50">
                  {group.items.map((item) => (
                    <div key={item.id} className="px-6 py-5">
                      {/* Student row */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-gray-400 text-sm">👤</span>
                        {(() => {
                          const child = childMap.get(item.childProfileId);
                          const name = child?.fullName || item.studentName;
                          const grade = child?.grade || item.studentClass;
                          const h = child?.heightCm;
                          const w = child?.weightKg;
                          return (
                            <span className="font-montserrat font-medium text-sm text-gray-600">
                              {name} - {grade}
                              {h && h > 0 && (
                                <span className="text-xs text-purple-400 ml-1.5">
                                  ({h}cm{w && w > 0 ? `, ${w}kg` : ""})
                                </span>
                              )}
                            </span>
                          );
                        })()}
                      </div>

                      {/* Item row */}
                      <div className="flex gap-4">
                        {/* Thumbnail */}
                        <div className="w-[72px] h-[72px] bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                          {item.imageURL ? (
                            <img
                              src={item.imageURL}
                              alt={item.outfitName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-montserrat font-bold text-sm text-black mb-1">
                            {item.outfitName}
                          </h3>
                          <div className="space-y-1 mb-2">
                            <p className="font-montserrat text-xs text-gray-400">
                              Size: <span className="text-black font-semibold">{item.size}</span>
                            </p>
                            {item.providerName && (
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-montserrat text-xs text-gray-400">
                                  Cung cấp bởi: <span className="text-purple-600 font-bold">{item.providerName}</span>
                                </p>
                                {item.semesterPublicationId && (
                                  <button
                                    onClick={() => setEditingItem(item)}
                                    className="text-[10px] font-bold text-blue-500 hover:text-blue-700 underline"
                                  >
                                    Thay đổi
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-montserrat text-xs text-gray-400">
                              Số lượng:
                            </span>
                            <div className="flex items-center border border-gray-200 rounded-md">
                              <button
                                onClick={() => cart.updateQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-30"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center font-montserrat font-semibold text-xs">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => cart.updateQuantity(item.id, item.quantity + 1)}
                                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => cart.removeItem(item.id)}
                              className="flex items-center gap-1 font-montserrat text-xs text-red-400 hover:text-red-600"
                            >
                              <Trash2 className="w-3 h-3" /> Xoá
                            </button>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="flex-shrink-0 text-right">
                          <p className="font-montserrat font-bold text-base text-black">
                            {fmt(item.price * item.quantity)}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {fmt(item.price)} / bộ
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ── Right: Order summary ── */}
          <div className="lg:w-[360px] flex-shrink-0 space-y-5">
            {/* Order info */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-soft-md p-6">
              <h3 className="font-montserrat font-bold text-base text-black mb-5">
                Thông tin đơn hàng
              </h3>

              <div className="space-y-3 mb-5">
                <div className="flex justify-between">
                  <span className="font-montserrat text-sm text-gray-500">
                    Tạm tính
                  </span>
                  <span className="font-montserrat font-medium text-sm text-black">
                    {fmt(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-montserrat text-sm text-gray-500">
                    Phí vận chuyển
                  </span>
                  <span className="font-montserrat font-medium text-sm text-black">
                    {shippingFee > 0 ? fmt(shippingFee) : "Miễn phí"}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between">
                    <span className="font-montserrat text-sm text-gray-500">
                      Giảm giá
                    </span>
                    <span className="font-montserrat font-medium text-sm text-green-600">
                      -{fmt(discount)}
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4 mb-5">
                <div className="flex justify-between items-baseline">
                  <span className="font-montserrat font-bold text-base text-black">
                    Tổng cộng
                  </span>
                  <div className="text-right">
                    <span className="font-montserrat font-extrabold text-2xl text-purple-600">
                      {fmt(total)}
                    </span>
                    <p className="font-montserrat text-[10px] text-gray-400 mt-0.5">
                      (Đã bao gồm VAT)
                    </p>
                  </div>
                </div>
              </div>

              {/* Shipping address (for home delivery) */}
              {deliveryMethod === "home" && (
                <div className="mb-5">
                  <p className="font-montserrat font-semibold text-sm text-black mb-2">
                    Địa chỉ giao hàng
                  </p>
                  <textarea
                    placeholder="Nhập địa chỉ nhận hàng (số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố)"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg font-montserrat text-sm placeholder:text-gray-300 focus:outline-none focus:border-purple-400 resize-none"
                  />
                </div>
              )}

              {/* Coupon */}
              <p className="font-montserrat font-semibold text-sm text-black mb-2">
                Mã giảm giá
              </p>
              <div className="flex gap-2 mb-5">
                <input
                  type="text"
                  placeholder="Nhập mã ưu đãi"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg font-montserrat text-sm placeholder:text-gray-300 focus:outline-none focus:border-purple-400"
                />
                <button className="px-4 py-2.5 bg-gray-900 text-white font-montserrat font-semibold text-sm rounded-lg hover:bg-gray-800 transition-colors whitespace-nowrap">
                  Áp dụng
                </button>
              </div>

              {/* Checkout button */}
              <button
                onClick={handleCheckout}
                disabled={checkingOut || allItems.length === 0}
                className="w-full py-4 nb-btn nb-btn-purple text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {checkingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    Tiến hành thanh toán
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Trust badges */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  <span className="font-montserrat text-xs text-gray-500">
                    Bảo mật thanh toán 100%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-blue-500" />
                  <span className="font-montserrat text-xs text-gray-500">
                    Đổi trả miễn phí trong 30 ngày
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery method */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-soft-md p-6">
              <h3 className="font-montserrat font-bold text-base text-black mb-4">
                Phương thức nhận hàng
              </h3>
              <div className="space-y-3">
                {/* Home delivery */}
                <label
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    deliveryMethod === "home"
                      ? "border-gray-200 bg-violet-50"
                      : "border-gray-200/20 hover:border-gray-300/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="delivery"
                    checked={deliveryMethod === "home"}
                    onChange={() => setDeliveryMethod("home")}
                    className="w-4 h-4 text-purple-600 accent-purple-600"
                  />
                  <div className="flex-1">
                    <p className="font-montserrat font-bold text-sm text-black">
                      Nhận tại nhà
                    </p>
                    <p className="font-montserrat text-xs text-gray-400">
                      Giao hàng 2-3 ngày làm việc
                    </p>
                  </div>
                  <Truck className="w-5 h-5 text-purple-400" />
                </label>

                {/* School pickup */}
                <label
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    deliveryMethod === "school"
                      ? "border-gray-200 bg-violet-50"
                      : "border-gray-200/20 hover:border-gray-300/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="delivery"
                    checked={deliveryMethod === "school"}
                    onChange={() => setDeliveryMethod("school")}
                    className="w-4 h-4 text-purple-600 accent-purple-600"
                  />
                  <div className="flex-1">
                    <p className="font-montserrat font-bold text-sm text-black">
                      Nhận tại trường
                    </p>
                    <p className="font-montserrat text-xs text-gray-400">
                      Nhận ngay tại văn phòng
                    </p>
                  </div>
                  <School className="w-5 h-5 text-purple-400" />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProviderSelectionModal
        open={editingItem !== null}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSelect={handleProviderSelect}
      />
    </GuestLayout>
  );
};
