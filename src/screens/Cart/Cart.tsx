import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Trash2,
  Pencil,
  Minus,
  Plus,
  ShieldCheck,
  RotateCcw,
  Truck,
  School,
  ShoppingCart,
} from "lucide-react";
import { GuestLayout } from "../../components/layout/GuestLayout";

/* ── Types ── */
type CartItem = {
  id: string;
  outfitId: string;
  outfitName: string;
  size: string;
  quantity: number;
  price: number;
  imageURL: string | null;
  studentName: string;
  studentClass: string;
};

type CartSchoolGroup = {
  schoolId: string;
  schoolName: string;
  campaignLabel: string | null;
  items: CartItem[];
};

/* ── Helpers ── */
const fmt = (n: number) =>
  n.toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + " VNĐ";

/* ── Mock data (replace with real cart state later) ── */
const MOCK_CART: CartSchoolGroup[] = [
  {
    schoolId: "1",
    schoolName: "THPT Lê Văn Hiến",
    campaignLabel: "Đợt may HKI 2026",
    items: [
      {
        id: "c1",
        outfitId: "o1",
        outfitName: "Đồng phục thể dục",
        size: "S",
        quantity: 1,
        price: 200000,
        imageURL: null,
        studentName: "Nguyễn Minh An",
        studentClass: "Lớp 10A1",
      },
      {
        id: "c2",
        outfitId: "o2",
        outfitName: "Đồng phục thường ngày",
        size: "S",
        quantity: 1,
        price: 520000,
        imageURL: null,
        studentName: "Nguyễn Minh Bo",
        studentClass: "Lớp 10A1",
      },
    ],
  },
];

/* ================================================================== */
export const Cart = (): JSX.Element => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartSchoolGroup[]>(MOCK_CART);
  const [coupon, setCoupon] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"home" | "school">("home");

  /* ── Derived ── */
  const allItems = cart.flatMap((g) => g.items);
  const subtotal = allItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const shippingFee = deliveryMethod === "home" ? 30000 : 0;
  const discount = 0;
  const total = subtotal + shippingFee - discount;

  /* ── Handlers ── */
  const updateQty = (groupIdx: number, itemIdx: number, delta: number) => {
    setCart((prev) => {
      const next = prev.map((g, gi) =>
        gi === groupIdx
          ? {
              ...g,
              items: g.items.map((item, ii) =>
                ii === itemIdx
                  ? { ...item, quantity: Math.max(1, item.quantity + delta) }
                  : item
              ),
            }
          : g
      );
      return next;
    });
  };

  const removeItem = (groupIdx: number, itemIdx: number) => {
    setCart((prev) => {
      const next = prev
        .map((g, gi) =>
          gi === groupIdx
            ? { ...g, items: g.items.filter((_, ii) => ii !== itemIdx) }
            : g
        )
        .filter((g) => g.items.length > 0);
      return next;
    });
  };

  /* ── Empty state ── */
  if (allItems.length === 0) {
    return (
      <GuestLayout bgColor="#F4F6FF">
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
    <GuestLayout bgColor="#F4F6FF">
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
            {cart.map((group, gi) => (
              <div
                key={group.schoolId}
                className="bg-white rounded-2xl shadow-sm overflow-hidden"
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
                  {group.items.map((item, ii) => (
                    <div key={item.id} className="px-6 py-5">
                      {/* Student row */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-gray-400 text-sm">👤</span>
                        <span className="font-montserrat font-medium text-sm text-gray-600">
                          {item.studentName} - {item.studentClass}
                        </span>
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
                          <p className="font-montserrat text-xs text-gray-400 mb-0.5">
                            Size: {item.size}
                          </p>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-montserrat text-xs text-gray-400">
                              Số lượng:
                            </span>
                            <div className="flex items-center border border-gray-200 rounded-md">
                              <button
                                onClick={() => updateQty(gi, ii, -1)}
                                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center font-montserrat font-semibold text-xs">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQty(gi, ii, 1)}
                                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button className="flex items-center gap-1 font-montserrat text-xs text-blue-500 hover:text-blue-700">
                              <Pencil className="w-3 h-3" /> Chỉnh sửa
                            </button>
                            <button
                              onClick={() => removeItem(gi, ii)}
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
            <div className="bg-white rounded-2xl shadow-sm p-6">
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
                <div className="flex justify-between">
                  <span className="font-montserrat text-sm text-gray-500">
                    Giảm giá
                  </span>
                  <span className="font-montserrat font-medium text-sm text-green-600">
                    -{fmt(discount)}
                  </span>
                </div>
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
              <button className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-montserrat font-bold text-sm rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
                Tiến hành thanh toán
                <ChevronRight className="w-4 h-4" />
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
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="font-montserrat font-bold text-base text-black mb-4">
                Phương thức nhận hàng
              </h3>
              <div className="space-y-3">
                {/* Home delivery */}
                <label
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    deliveryMethod === "home"
                      ? "border-purple-500 bg-purple-50/50"
                      : "border-gray-100 hover:border-gray-200"
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
                      ? "border-purple-500 bg-purple-50/50"
                      : "border-gray-100 hover:border-gray-200"
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
    </GuestLayout>
  );
};
