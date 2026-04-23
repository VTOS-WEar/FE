import { useEffect, useState } from "react";
import { ArrowLeft, MapPinHouse, Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  createParentAddress,
  deleteParentAddress,
  getParentAddresses,
  type ParentAddressDto,
  setDefaultParentAddress,
  updateParentAddress,
} from "../../../lib/api/users";

const emptyAddressForm = {
  label: "",
  recipientName: "",
  recipientPhone: "",
  addressLine: "",
  isDefault: false,
};

export const AddressBookTab = (): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  const [addresses, setAddresses] = useState<ParentAddressDto[]>([]);
  const [addressLoading, setAddressLoading] = useState(true);
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressMsg, setAddressMsg] = useState("");
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const cameFromCart =
    location.state && typeof location.state === "object" && "returnTo" in location.state
      ? (location.state as { returnTo?: string }).returnTo === "/cart"
      : false;

  const loadAddresses = async () => {
    try {
      const items = await getParentAddresses();
      setAddresses(items);
    } catch (error) {
      console.error("Failed to load parent addresses", error);
    } finally {
      setAddressLoading(false);
    }
  };

  useEffect(() => {
    void loadAddresses();
  }, []);

  const resetAddressForm = () => {
    setEditingAddressId(null);
    setAddressForm(emptyAddressForm);
  };

  const handleEditAddress = (address: ParentAddressDto) => {
    setEditingAddressId(address.addressId);
    setAddressForm({
      label: address.label,
      recipientName: address.recipientName,
      recipientPhone: address.recipientPhone,
      addressLine: address.addressLine,
      isDefault: address.isDefault,
    });
  };

  const handleSaveAddress = async () => {
    if (
      !addressForm.label.trim() ||
      !addressForm.recipientName.trim() ||
      !addressForm.recipientPhone.trim() ||
      !addressForm.addressLine.trim()
    ) {
      setAddressMsg("Điền đầy đủ nhãn, người nhận, số điện thoại và địa chỉ.");
      return;
    }

    setAddressSaving(true);
    setAddressMsg("");

    try {
      if (editingAddressId) {
        await updateParentAddress(editingAddressId, addressForm);
      } else {
        await createParentAddress(addressForm);
      }

      await loadAddresses();
      resetAddressForm();
      setAddressMsg("Đã lưu sổ địa chỉ.");
    } catch (error: any) {
      setAddressMsg(error?.message || "Không thể lưu địa chỉ.");
    } finally {
      setAddressSaving(false);
      setTimeout(() => setAddressMsg(""), 3000);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    setAddressSaving(true);
    setAddressMsg("");

    try {
      await deleteParentAddress(addressId);
      await loadAddresses();
      if (editingAddressId === addressId) resetAddressForm();
      setAddressMsg("Đã xóa địa chỉ.");
    } catch (error: any) {
      setAddressMsg(error?.message || "Không thể xóa địa chỉ.");
    } finally {
      setAddressSaving(false);
      setTimeout(() => setAddressMsg(""), 3000);
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    setAddressSaving(true);
    setAddressMsg("");

    try {
      await setDefaultParentAddress(addressId);
      await loadAddresses();
      setAddressMsg("Đã cập nhật địa chỉ mặc định.");
    } catch (error: any) {
      setAddressMsg(error?.message || "Không thể cập nhật địa chỉ mặc định.");
    } finally {
      setAddressSaving(false);
      setTimeout(() => setAddressMsg(""), 3000);
    }
  };

  const inputClass =
    "h-12 w-full rounded-[16px] border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-900 outline-none transition-all focus:border-violet-300 focus:ring-4 focus:ring-violet-100";

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-gray-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6 shadow-soft-sm lg:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Address book</p>
            <h1 className="mt-2 text-2xl font-black text-gray-900">Sổ địa chỉ giao hàng</h1>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-7 text-slate-600">
              Lưu các địa chỉ nhận hàng thường dùng để checkout nhanh hơn ở giỏ hàng và direct order.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {cameFromCart && addresses.length > 0 ? (
              <button
                type="button"
                onClick={() => navigate("/cart")}
                className="inline-flex items-center gap-2 rounded-[16px] border border-gray-200 bg-white px-4 py-3 text-sm font-extrabold text-gray-900 shadow-soft-sm transition-all hover:-translate-y-0.5"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại giỏ hàng
              </button>
            ) : null}
            <button
              type="button"
              onClick={resetAddressForm}
              className="rounded-[16px] border border-gray-200 bg-slate-50 px-4 py-3 text-sm font-extrabold text-gray-900 transition-all hover:bg-white"
            >
              Tạo địa chỉ mới
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-soft-sm lg:p-7">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <div className="space-y-4">
            {addressLoading ? (
              <div className="rounded-[22px] border border-dashed border-gray-200 bg-slate-50 p-6 text-sm font-bold text-slate-500">
                Đang tải sổ địa chỉ...
              </div>
            ) : addresses.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-gray-200 bg-slate-50 p-6 text-sm font-bold text-slate-500">
                Chưa có địa chỉ nào. Hãy tạo địa chỉ đầu tiên để checkout nhanh hơn.
              </div>
            ) : (
              addresses.map((address) => (
                <div key={address.addressId} className="rounded-[22px] border border-gray-200 bg-slate-50 p-5 shadow-soft-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-black text-gray-900">{address.label}</p>
                        {address.isDefault ? (
                          <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-extrabold text-violet-700">
                            Mặc định
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm font-bold text-gray-900">{address.recipientName}</p>
                      <p className="mt-1 text-sm font-medium text-slate-500">{address.recipientPhone}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {!address.isDefault ? (
                        <button
                          type="button"
                          onClick={() => void handleSetDefaultAddress(address.addressId)}
                          className="rounded-[14px] border border-gray-200 bg-white px-3 py-2 text-xs font-extrabold text-gray-900"
                        >
                          Đặt mặc định
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handleEditAddress(address)}
                        className="rounded-[14px] border border-gray-200 bg-white px-3 py-2 text-xs font-extrabold text-gray-900"
                      >
                        Chỉnh sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteAddress(address.addressId)}
                        className="inline-flex items-center gap-1 rounded-[14px] border border-red-200 bg-white px-3 py-2 text-xs font-extrabold text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Xóa
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 inline-flex items-start gap-2 text-sm font-medium text-slate-600">
                    <MapPinHouse className="mt-0.5 h-4 w-4 text-violet-600" />
                    <span>{address.addressLine}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="rounded-[24px] border border-gray-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-soft-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">
              {editingAddressId ? "Cập nhật địa chỉ" : "Địa chỉ mới"}
            </p>
            <h3 className="mt-2 text-xl font-black text-gray-900">
              {editingAddressId ? "Chỉnh sửa sổ địa chỉ" : "Thêm địa chỉ giao hàng"}
            </h3>

            <div className="mt-5 grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-600">Nhãn</label>
                <input
                  value={addressForm.label}
                  onChange={(event) => setAddressForm((current) => ({ ...current, label: event.target.value }))}
                  placeholder="Ví dụ: Nhà riêng, Ông bà, Văn phòng"
                  className={inputClass}
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-bold text-slate-600">Người nhận</label>
                  <input
                    value={addressForm.recipientName}
                    onChange={(event) => setAddressForm((current) => ({ ...current, recipientName: event.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-bold text-slate-600">Số điện thoại</label>
                  <input
                    value={addressForm.recipientPhone}
                    onChange={(event) => setAddressForm((current) => ({ ...current, recipientPhone: event.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-600">Địa chỉ chi tiết</label>
                <textarea
                  value={addressForm.addressLine}
                  onChange={(event) => setAddressForm((current) => ({ ...current, addressLine: event.target.value }))}
                  rows={4}
                  className="w-full rounded-[16px] border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition-all focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                />
              </div>

              <label className="inline-flex items-center gap-3 text-sm font-bold text-gray-900">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(event) => setAddressForm((current) => ({ ...current, isDefault: event.target.checked }))}
                  className="h-4 w-4 rounded accent-violet-600"
                />
                Đặt làm địa chỉ mặc định
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void handleSaveAddress()}
                  disabled={addressSaving}
                  className="rounded-[16px] border border-gray-200 bg-violet-500 px-5 py-3 text-sm font-extrabold text-white shadow-soft-sm disabled:opacity-60"
                >
                  {addressSaving ? "Đang lưu..." : editingAddressId ? "Lưu cập nhật" : "Thêm địa chỉ"}
                </button>
                {editingAddressId ? (
                  <button
                    type="button"
                    onClick={resetAddressForm}
                    className="rounded-[16px] border border-gray-200 bg-white px-4 py-3 text-sm font-extrabold text-gray-900"
                  >
                    Hủy chỉnh sửa
                  </button>
                ) : null}
                {addressMsg ? <span className="text-sm font-bold text-slate-600">{addressMsg}</span> : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
