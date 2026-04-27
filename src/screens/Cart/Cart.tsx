import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Loader2,
  PencilLine,
  MapPinHouse,
  Minus,
  Package,
  Plus,
  RotateCcw,
  School,
  ShieldCheck,
  ShoppingCart,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { useCart, type CartItem } from "../../contexts/CartContext";
import { useToast } from "../../contexts/ToastContext";
import { checkout, createDirectOrder, type CheckoutRequest, type CreateDirectOrderRequest } from "../../lib/api/orders";
import { getMyChildren, getParentAddresses, type ChildProfileDto, type ParentAddressDto } from "../../lib/api/users";
import { getProvidersForPublicationOutfit, type SemesterCatalogProviderDto } from "../../lib/api/public";
import { formatRating } from "../../lib/utils/format";

const fmt = (value: number) => value.toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + " VNĐ";

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
  }, [open, item, onClose, showToast]);

  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-soft-lg" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-100 bg-slate-50 px-6 py-4">
          <div>
            <h3 className="font-montserrat text-lg font-extrabold text-black">Thay đổi nhà cung cấp</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{item.outfitName}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-black">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <p className="text-sm font-medium text-gray-500">Đang tìm kiếm nhà cung cấp...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {providers.map((provider) => (
                <button
                  key={provider.providerId}
                  onClick={() => onSelect(provider)}
                  className={`group w-full rounded-xl border-2 p-4 text-left transition-all ${
                    provider.providerId === item.providerId
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-100 hover:border-purple-100 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <span className="font-montserrat text-sm font-bold text-black transition-colors group-hover:text-purple-700">
                          {provider.providerName}
                        </span>
                        {provider.providerId === item.providerId ? (
                          <span className="rounded bg-purple-600 px-1.5 py-0.5 text-[8px] font-black uppercase text-white">Đang chọn</span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-gray-500">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {formatRating(provider.averageRating)}
                        </span>
                        <span>•</span>
                        <span>{provider.totalCompletedOrders} đơn đã giao</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-montserrat text-base font-extrabold text-purple-600">{fmt(provider.price)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-gray-100 bg-slate-50 px-6 py-4">
          <button onClick={onClose} className="px-5 py-2 text-sm font-bold text-gray-500 transition-colors hover:text-black">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export const Cart = (): JSX.Element => {
  const navigate = useNavigate();
  const cart = useCart();
  const { showToast } = useToast();
  const [coupon, setCoupon] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [savedAddresses, setSavedAddresses] = useState<ParentAddressDto[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [isChangingAddress, setIsChangingAddress] = useState(false);
  const [childMap, setChildMap] = useState<Map<string, ChildProfileDto>>(new Map());
  const [initialLoading, setInitialLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);

  useEffect(() => {
    getMyChildren()
      .then((children) => {
        const map = new Map<string, ChildProfileDto>();
        for (const child of children) map.set(child.childId, child);
        setChildMap(map);
      })
      .catch(() => {})
      .finally(() => setInitialLoading(false));
  }, []);

  useEffect(() => {
    getParentAddresses()
      .then((addresses) => {
        setSavedAddresses(addresses);
        const defaultAddress = addresses.find((item) => item.isDefault) ?? addresses[0];
        if (!defaultAddress) return;

        setSelectedAddressId(defaultAddress.addressId);
        setShippingAddress(defaultAddress.addressLine);
        setRecipientName(defaultAddress.recipientName);
        setRecipientPhone(defaultAddress.recipientPhone);
        setIsChangingAddress(false);
      })
      .catch(() => {});
  }, []);

  const { groups, items: allItems } = cart;
  const subtotal = allItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = 30000;
  const discount = 0;
  const total = subtotal + shippingFee - discount;
  const hasSavedAddresses = savedAddresses.length > 0;

  const handleCheckout = async () => {
    if (allItems.length === 0) return;

    if (!shippingAddress.trim()) {
      showToast({ title: "Thiếu thông tin", message: "Vui lòng chọn hoặc nhập địa chỉ giao hàng", variant: "error" });
      return;
    }

    setCheckingOut(true);
    try {
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
              items: [],
            });
          }
          marketplaceGroups.get(key)!.items.push(item);
        } else {
          const key = `${item.childProfileId}__${item.campaignId}`;
          if (!campaignGroups.has(key)) {
            campaignGroups.set(key, { childProfileId: item.childProfileId, campaignId: item.campaignId, items: [] });
          }
          campaignGroups.get(key)!.items.push(item);
        }
      }

      const payableGroupCount = campaignGroups.size + marketplaceGroups.size;
      if (payableGroupCount > 1) {
        showToast({
          title: "Chưa thể thanh toán nhiều nhóm đơn",
          message: "Giỏ hàng hiện có nhiều nhóm đơn khác nhau. Vui lòng thanh toán từng nhóm để tránh tạo đơn chờ thanh toán.",
          variant: "error",
        });
        return;
      }

      let lastPaymentLink = "";
      const createdOrderIds: string[] = [];

      for (const [, group] of campaignGroups) {
        const request: CheckoutRequest = {
          childProfileId: group.childProfileId,
          items: group.items.map((item) => ({
            productVariantId: item.productVariantId,
            quantity: item.quantity,
          })),
          shippingAddress,
          deliveryMethod: "Giao tận nhà",
          campaignId: group.campaignId,
        };

        const result = await checkout(request);
        lastPaymentLink = result.paymentLink;
        createdOrderIds.push(result.orderId);
      }

      for (const [, group] of marketplaceGroups) {
        const request: CreateDirectOrderRequest = {
          childProfileId: group.childProfileId,
          semesterPublicationId: group.publicationId,
          providerId: group.providerId,
          items: group.items.map((item) => ({
            productVariantId: item.productVariantId,
            quantity: item.quantity,
          })),
          shippingAddress,
          deliveryMethod: "Giao tận nhà",
          recipientName: recipientName || undefined,
          recipientPhone: recipientPhone || undefined,
        };

        const result = await createDirectOrder(request);
        lastPaymentLink = result.paymentLink;
        createdOrderIds.push(result.orderId);
      }

      if (lastPaymentLink) {
        sessionStorage.setItem("vtos_pending_order_ids", JSON.stringify(createdOrderIds));
        window.location.href = lastPaymentLink;
      }
    } catch (error: any) {
      showToast({
        title: "Đặt hàng thất bại",
        message: error?.message || "Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.",
        variant: "error",
      });
    } finally {
      setCheckingOut(false);
    }
  };

  const handleProviderSelect = (provider: SemesterCatalogProviderDto) => {
    if (!editingItem) return;
    cart.updateProvider(editingItem.id, provider.providerId, provider.providerName, provider.price);
    showToast({ title: "Cập nhật thành công", message: `Đã đổi sang nhà cung cấp ${provider.providerName}`, variant: "success" });
    setEditingItem(null);
  };

  const handleSelectSavedAddress = (addressId: string) => {
    setSelectedAddressId(addressId);
    const selected = savedAddresses.find((item) => item.addressId === addressId);
    if (!selected) return;
    setShippingAddress(selected.addressLine);
    setRecipientName(selected.recipientName);
    setRecipientPhone(selected.recipientPhone);
    setIsChangingAddress(false);
  };

  if (initialLoading) {
    return (
      <GuestLayout bgColor="#F4F6FF" mainClassName="flex-1">
        <div className="mx-auto flex min-h-[50vh] max-w-[1200px] items-center justify-center px-4 py-16 lg:px-8">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
            <p className="font-montserrat text-sm text-gray-400">Đang tải giỏ hàng...</p>
          </div>
        </div>
      </GuestLayout>
    );
  }

  if (allItems.length === 0 && !checkingOut) {
    return (
      <GuestLayout bgColor="#f9fafb" mainClassName="flex-1">
        <div className="mx-auto flex min-h-screen max-w-[1200px] items-center justify-center px-4 py-12 text-center lg:px-8">
          <div>
            <ShoppingCart className="mx-auto mb-4 h-16 w-16 text-gray-300" />
            <h1 className="mb-2 font-montserrat text-2xl font-extrabold text-black">Giỏ hàng trống</h1>
            <p className="mb-6 font-montserrat text-sm text-gray-400">Bạn chưa thêm sản phẩm nào vào giỏ hàng.</p>
            <button
              onClick={() => navigate("/schools")}
              className="rounded-xl bg-purple-600 px-6 py-3 font-montserrat text-sm font-semibold text-white transition-colors hover:bg-purple-700"
            >
              Khám phá đồng phục
            </button>
          </div>
        </div>
      </GuestLayout>
    );
  }

  return (
    <GuestLayout bgColor="#F4F6FF" mainClassName="flex-1">
      <div className="mx-auto max-w-[1200px] px-4 py-8 lg:px-8">
        <div className="mb-6 flex items-center gap-2 text-sm">
          <Link to="/homepage" className="font-montserrat text-black/40 hover:text-black/70">
            Trang chủ
          </Link>
          <ChevronRight className="h-4 w-4 text-black/40" />
          <span className="font-montserrat font-semibold text-black">Giỏ hàng của Tôi</span>
        </div>

        <h1 className="mb-1 font-montserrat text-3xl font-extrabold text-black">Giỏ hàng của Tôi</h1>
        <p className="mb-8 font-montserrat text-sm text-gray-400">Bạn đang có {allItems.length} sản phẩm trong giỏ hàng</p>

        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="min-w-0 flex-1 space-y-6">
            {groups.map((group) => (
              <div key={`${group.schoolId}-${group.campaignId}`} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-soft-md">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <div className="flex items-center gap-2">
                    <School className="h-5 w-5 text-purple-500" />
                    <h2 className="font-montserrat text-base font-bold text-black">{group.schoolName}</h2>
                  </div>
                  {group.campaignLabel ? (
                    <span className="rounded-full bg-purple-100 px-3 py-1.5 font-montserrat text-xs font-semibold text-purple-700">
                      {group.campaignLabel}
                    </span>
                  ) : null}
                </div>

                <div className="divide-y divide-gray-50">
                  {group.items.map((item) => (
                    <div key={item.id} className="px-6 py-5">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-sm text-gray-400">👤</span>
                        {(() => {
                          const child = childMap.get(item.childProfileId);
                          const name = child?.fullName || item.studentName;
                          const grade = child?.grade || item.studentClass;
                          const height = child?.heightCm;
                          const weight = child?.weightKg;

                          return (
                            <span className="font-montserrat text-sm font-medium text-gray-600">
                              {name} - {grade}
                              {height && height > 0 ? (
                                <span className="ml-1.5 text-xs text-purple-400">
                                  ({height}cm{weight && weight > 0 ? `, ${weight}kg` : ""})
                                </span>
                              ) : null}
                            </span>
                          );
                        })()}
                      </div>

                      <div className="flex gap-4">
                        <div className="h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                          {item.imageURL ? (
                            <img src={item.imageURL} alt={item.outfitName} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full bg-gradient-to-br from-gray-200 to-gray-300" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="mb-1 font-montserrat text-sm font-bold text-black">{item.outfitName}</h3>
                          <div className="mb-2 space-y-1">
                            <p className="font-montserrat text-xs text-gray-400">
                              Size: <span className="font-semibold text-black">{item.size}</span>
                            </p>
                            {item.providerName ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-montserrat text-xs text-gray-400">
                                  Cung cấp bởi: <span className="font-bold text-purple-600">{item.providerName}</span>
                                </p>
                                {item.semesterPublicationId ? (
                                  <button
                                    onClick={() => setEditingItem(item)}
                                    className="text-[10px] font-bold text-blue-500 underline hover:text-blue-700"
                                  >
                                    Thay đổi
                                  </button>
                                ) : null}
                              </div>
                            ) : null}
                          </div>

                          <div className="mb-2 flex items-center gap-2">
                            <span className="font-montserrat text-xs text-gray-400">Số lượng:</span>
                            <div className="flex items-center rounded-md border border-gray-200">
                              <button
                                onClick={() => cart.updateQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="flex h-6 w-6 items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-30"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-6 text-center font-montserrat text-xs font-semibold">{item.quantity}</span>
                              <button
                                onClick={() => cart.updateQuantity(item.id, item.quantity + 1)}
                                className="flex h-6 w-6 items-center justify-center text-gray-400 hover:text-gray-600"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => cart.removeItem(item.id)}
                              className="flex items-center gap-1 font-montserrat text-xs text-red-400 hover:text-red-600"
                            >
                              <Trash2 className="h-3 w-3" /> Xoá
                            </button>
                          </div>
                        </div>

                        <div className="flex-shrink-0 text-right">
                          <p className="font-montserrat text-base font-bold text-black">{fmt(item.price * item.quantity)}</p>
                          <p className="mt-1 text-[10px] text-gray-400">{fmt(item.price)} / bộ</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-5 lg:w-[360px] lg:flex-shrink-0">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-soft-md">
              <h3 className="mb-5 font-montserrat text-base font-bold text-black">Thông tin đơn hàng</h3>

              <div className="mb-5 space-y-3">
                <div className="flex justify-between">
                  <span className="font-montserrat text-sm text-gray-500">Tạm tính</span>
                  <span className="font-montserrat text-sm font-medium text-black">{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-montserrat text-sm text-gray-500">Phí vận chuyển</span>
                  <span className="font-montserrat text-sm font-medium text-black">{fmt(shippingFee)}</span>
                </div>
                {discount > 0 ? (
                  <div className="flex justify-between">
                    <span className="font-montserrat text-sm text-gray-500">Giảm giá</span>
                    <span className="font-montserrat text-sm font-medium text-green-600">-{fmt(discount)}</span>
                  </div>
                ) : null}
              </div>

              <div className="mb-5 border-t border-gray-100 pt-4">
                <div className="flex items-baseline justify-between">
                  <span className="font-montserrat text-base font-bold text-black">Tổng cộng</span>
                  <div className="text-right">
                    <span className="font-montserrat text-2xl font-extrabold text-purple-600">{fmt(total)}</span>
                    <p className="mt-0.5 font-montserrat text-[10px] text-gray-400">(Đã bao gồm VAT)</p>
                  </div>
                </div>
              </div>

              <div className="mb-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="font-montserrat text-sm font-semibold text-black">Địa chỉ đã lưu</p>
                  {hasSavedAddresses && savedAddresses.length > 1 && selectedAddressId ? (
                    <button
                      type="button"
                      onClick={() => setIsChangingAddress((current) => !current)}
                      className="inline-flex items-center gap-1 text-xs font-extrabold text-violet-600 transition-colors hover:text-violet-700"
                    >
                      <PencilLine className="h-3.5 w-3.5" />
                      {isChangingAddress ? "Ẩn thay đổi" : "Thay đổi địa chỉ giao hàng"}
                    </button>
                  ) : null}
                </div>
                {hasSavedAddresses ? (
                  <div className="space-y-2">
                    {savedAddresses
                      .filter((address) => isChangingAddress || address.addressId === selectedAddressId)
                      .map((address) => (
                        <label
                          key={address.addressId}
                          className={`flex items-start gap-3 rounded-xl border p-3 transition-all ${
                            selectedAddressId === address.addressId ? "border-purple-300 bg-violet-50" : "border-gray-200 bg-white"
                          }`}
                        >
                          <input
                            type="radio"
                            name="saved-address"
                            checked={selectedAddressId === address.addressId}
                            onChange={() => handleSelectSavedAddress(address.addressId)}
                            className="mt-1 h-4 w-4 accent-purple-600"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-montserrat text-sm font-bold text-black">{address.label}</span>
                              {address.isDefault ? (
                                <span className="rounded-full bg-purple-600 px-2 py-0.5 text-[10px] font-black uppercase text-white">
                                  Mặc định
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1 font-montserrat text-xs font-semibold text-gray-700">
                              {address.recipientName} · {address.recipientPhone}
                            </p>
                            <p className="mt-1 font-montserrat text-xs text-gray-500">{address.addressLine}</p>
                          </div>
                        </label>
                      ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => navigate("/parentprofile/address-book", { state: { returnTo: "/cart" } })}
                      className="inline-flex items-center gap-2 rounded-[16px] border border-gray-200 bg-violet-500 px-4 py-3 text-sm font-extrabold text-white shadow-soft-sm transition-all hover:-translate-y-0.5"
                    >
                      Thêm địa chỉ giao hàng
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <textarea
                      placeholder="Nhập địa chỉ nhận hàng (số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố)"
                      value={shippingAddress}
                      onChange={(event) => setShippingAddress(event.target.value)}
                      rows={3}
                      className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 font-montserrat text-sm placeholder:text-gray-300 focus:border-purple-400 focus:outline-none"
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        placeholder="Tên người nhận"
                        value={recipientName}
                        onChange={(event) => setRecipientName(event.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 font-montserrat text-sm placeholder:text-gray-300 focus:border-purple-400 focus:outline-none"
                      />
                      <input
                        placeholder="Số điện thoại người nhận"
                        value={recipientPhone}
                        onChange={(event) => setRecipientPhone(event.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 font-montserrat text-sm placeholder:text-gray-300 focus:border-purple-400 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-gray-500">
                  <MapPinHouse className="h-4 w-4 text-purple-500" />
                  Quản lý sổ địa chỉ trong hồ sơ phụ huynh.
                </div>
              </div>

              <p className="mb-2 font-montserrat text-sm font-semibold text-black">Mã giảm giá</p>
              <div className="mb-5 flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập mã ưu đãi"
                  value={coupon}
                  onChange={(event) => setCoupon(event.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 font-montserrat text-sm placeholder:text-gray-300 focus:border-purple-400 focus:outline-none"
                />
                <button className="whitespace-nowrap rounded-lg bg-gray-900 px-4 py-2.5 font-montserrat text-sm font-semibold text-white transition-colors hover:bg-gray-800">
                  Áp dụng
                </button>
              </div>

              <button
                onClick={handleCheckout}
                disabled={checkingOut || allItems.length === 0}
                className="nb-btn nb-btn-purple flex w-full items-center justify-center gap-2 py-4 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {checkingOut ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    Tiến hành thanh toán
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  <span className="font-montserrat text-xs text-gray-500">Bảo mật thanh toán 100%</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-blue-500" />
                  <span className="font-montserrat text-xs text-gray-500">Đổi trả miễn phí trong 30 ngày</span>
                </div>
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
