import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, MapPinHouse, Pencil, Plus, Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  createParentAddress,
  DEFAULT_PARENT_ADDRESS_FORM,
  deleteParentAddress,
  formatParentAddressLine,
  getParentAddresses,
  parseParentAddressLine,
  type ParentAddressDto,
  setDefaultParentAddress,
  updateParentAddress,
} from "../../../lib/api/users";
import { fetchProvinces, type Province } from "../../../lib/utils/vietnamProvinces";

const presetAddressLabels = [
  { value: "Nhà riêng", label: "Nhà riêng" },
  { value: "Cơ quan", label: "Cơ quan" },
];

const customLabelOption = { value: "__custom__", label: "Tùy chọn nhãn" };

const readCurrentUserId = (): string | null => {
  try {
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!raw) return null;
    const user = JSON.parse(raw);
    if (typeof user?.userId === "string" && user.userId) return user.userId;
    return typeof user?.id === "string" && user.id ? user.id : null;
  } catch {
    return null;
  }
};

const customLabelStorageKey = (userId: string | null): string =>
  userId ? `vtos_parent_address_labels_${userId}` : "vtos_parent_address_labels_guest";

const loadStoredCustomLabels = (userId: string | null): string[] => {
  try {
    const raw = localStorage.getItem(customLabelStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
};

export const AddressBookTab = (): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userId] = useState<string | null>(() => readCurrentUserId());
  const [addresses, setAddresses] = useState<ParentAddressDto[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [customLabels, setCustomLabels] = useState<string[]>(() => loadStoredCustomLabels(readCurrentUserId()));
  const [addressLoading, setAddressLoading] = useState(true);
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressMsg, setAddressMsg] = useState("");
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState(DEFAULT_PARENT_ADDRESS_FORM);
  const [isCustomLabelModalOpen, setIsCustomLabelModalOpen] = useState(false);
  const [customLabelDraft, setCustomLabelDraft] = useState("");
  const [editingCustomLabel, setEditingCustomLabel] = useState<string | null>(null);
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

  useEffect(() => {
    const loadProvinces = async () => {
      const items = await fetchProvinces();
      setProvinces(items);
    };

    void loadProvinces();
  }, []);

  useEffect(() => {
    localStorage.setItem(customLabelStorageKey(userId), JSON.stringify(customLabels));
  }, [customLabels, userId]);

  const resetAddressForm = () => {
    setEditingAddressId(null);
    setAddressForm(DEFAULT_PARENT_ADDRESS_FORM);
  };

  const provinceOptions = useMemo(
    () => provinces.map((province) => ({ value: province.codename, label: province.name })),
    [provinces]
  );

  const wardOptions = useMemo(() => {
    const selectedProvince = provinces.find((province) => province.codename === addressForm.provinceCode);
    return (selectedProvince?.districts ?? []).map((district) => ({
      value: district.codename,
      label: district.name,
    }));
  }, [addressForm.provinceCode, provinces]);

  const customLabelsInUse = useMemo(
    () =>
      new Set(
        addresses
          .map((address) => address.label.trim())
          .filter(Boolean)
          .filter((label) => !presetAddressLabels.some((option) => option.value === label))
      ),
    [addresses]
  );

  const labelOptions = useMemo(() => {
    const mergedCustomLabels = Array.from(new Set([...customLabels, ...Array.from(customLabelsInUse)]));

    return [
      ...presetAddressLabels,
      ...mergedCustomLabels.map((label) => ({ value: label, label })),
      customLabelOption,
    ];
  }, [customLabels, customLabelsInUse]);

  const selectedLabelValue = useMemo(() => {
    if (!addressForm.label) {
      return "Nhà riêng";
    }

    return labelOptions.some((option) => option.value === addressForm.label)
      ? addressForm.label
      : "__custom__";
  }, [addressForm.label, labelOptions]);

  const openCustomLabelModal = () => {
    setCustomLabelDraft("");
    setEditingCustomLabel(null);
    setIsCustomLabelModalOpen(true);
  };

  const closeCustomLabelModal = () => {
    setCustomLabelDraft("");
    setEditingCustomLabel(null);
    setIsCustomLabelModalOpen(false);
  };

  const setModalMessage = (message: string) => {
    setAddressMsg(message);
    setTimeout(() => setAddressMsg(""), 3000);
  };

  const handleSaveCustomLabel = () => {
    const nextLabel = customLabelDraft.trim();
    if (!nextLabel) {
      setModalMessage("Nhập tên nhãn trước khi lưu.");
      return;
    }

    const existingLabels = [...presetAddressLabels.map((option) => option.value), ...customLabels];
    const hasConflict = existingLabels.some(
      (label) =>
        label.toLowerCase() === nextLabel.toLowerCase() &&
        label.toLowerCase() !== (editingCustomLabel ?? "").toLowerCase()
    );

    if (hasConflict) {
      setModalMessage("Nhãn này đã tồn tại.");
      return;
    }

    if (editingCustomLabel) {
      if (customLabelsInUse.has(editingCustomLabel)) {
        setModalMessage("Nhãn đang được dùng trong sổ địa chỉ.");
        return;
      }

      setCustomLabels((current) => current.map((label) => (label === editingCustomLabel ? nextLabel : label)));
      if (addressForm.label === editingCustomLabel) {
        setAddressForm((current) => ({ ...current, label: nextLabel }));
      }
    } else if (!customLabels.some((label) => label.toLowerCase() === nextLabel.toLowerCase())) {
      setCustomLabels((current) => [...current, nextLabel]);
      setAddressForm((current) => ({ ...current, label: nextLabel }));
    } else {
      setAddressForm((current) => ({ ...current, label: nextLabel }));
    }

    setAddressMsg(editingCustomLabel ? "Đã cập nhật nhãn." : "Đã thêm nhãn.");
    setEditingCustomLabel(null);
    setCustomLabelDraft("");
    setTimeout(() => setAddressMsg(""), 3000);
  };

  const handleStartEditCustomLabel = (label: string) => {
    if (customLabelsInUse.has(label)) {
      setModalMessage("Nhãn đang được dùng trong sổ địa chỉ.");
      return;
    }

    setEditingCustomLabel(label);
    setCustomLabelDraft(label);
  };

  const handleDeleteCustomLabel = (label: string) => {
    if (customLabelsInUse.has(label)) {
      setModalMessage("Nhãn đang được dùng trong sổ địa chỉ nên chưa thể xóa.");
      return;
    }

    setCustomLabels((current) => current.filter((item) => item !== label));
    if (addressForm.label === label) {
      setAddressForm((current) => ({ ...current, label: "Nhà riêng" }));
    }
    if (editingCustomLabel === label) {
      setEditingCustomLabel(null);
      setCustomLabelDraft("");
    }
  };

  const handleEditAddress = (address: ParentAddressDto) => {
    const parsedAddress = parseParentAddressLine(address.addressLine, provinces);
    setEditingAddressId(address.addressId);
    setAddressForm({
      label: address.label,
      recipientName: address.recipientName,
      recipientPhone: address.recipientPhone,
      ...parsedAddress,
      houseNumber: parsedAddress.houseNumber || address.addressLine,
      isDefault: address.isDefault,
    });
  };

  const handleSaveAddress = async () => {
    if (
      !addressForm.label.trim() ||
      !addressForm.recipientName.trim() ||
      !addressForm.recipientPhone.trim() ||
      !addressForm.provinceName.trim() ||
      !addressForm.wardName.trim() ||
      !addressForm.houseNumber.trim()
    ) {
      setAddressMsg("Điền đầy đủ nhãn, người nhận, số điện thoại, tỉnh, xã/phường và số nhà.");
      return;
    }

    setAddressSaving(true);
    setAddressMsg("");

    const payload = {
      label: addressForm.label.trim(),
      recipientName: addressForm.recipientName.trim(),
      recipientPhone: addressForm.recipientPhone.trim(),
      addressLine: formatParentAddressLine(addressForm),
      isDefault: addressForm.isDefault,
    };

    try {
      if (editingAddressId) {
        await updateParentAddress(editingAddressId, payload);
      } else {
        await createParentAddress(payload);
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
                Chưa có địa chỉ nào.
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
                <select
                  value={selectedLabelValue}
                  onChange={(event) => {
                    if (event.target.value === "__custom__") {
                      openCustomLabelModal();
                      return;
                    }

                    setAddressForm((current) => ({
                      ...current,
                      label: event.target.value,
                    }));
                  }}
                  className={inputClass}
                >
                  {labelOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
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

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-bold text-slate-600">Tỉnh/Thành phố</label>
                  <select
                    value={addressForm.provinceCode}
                    onChange={(event) => {
                      const province = provinces.find((item) => item.codename === event.target.value);
                      setAddressForm((current) => ({
                        ...current,
                        provinceCode: event.target.value,
                        provinceName: province?.name ?? "",
                        wardCode: "",
                        wardName: "",
                      }));
                    }}
                    className={inputClass}
                  >
                    <option value="">Chọn tỉnh/thành phố</option>
                    {provinceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-bold text-slate-600">Xã/Phường</label>
                  <select
                    value={addressForm.wardCode}
                    onChange={(event) => {
                      const ward = wardOptions.find((item) => item.value === event.target.value);
                      setAddressForm((current) => ({
                        ...current,
                        wardCode: event.target.value,
                        wardName: ward?.label ?? "",
                      }));
                    }}
                    disabled={!addressForm.provinceCode}
                    className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
                  >
                    <option value="">
                      {addressForm.provinceCode ? "Chọn xã/phường" : "Chọn tỉnh/thành phố trước"}
                    </option>
                    {wardOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-600">Số nhà / Địa chỉ chi tiết</label>
                <input
                  value={addressForm.houseNumber}
                  onChange={(event) => setAddressForm((current) => ({ ...current, houseNumber: event.target.value }))}
                  className={inputClass}
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

      {isCustomLabelModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-md rounded-[24px] border border-gray-200 bg-white p-6 shadow-soft-lg">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Tùy chọn nhãn</p>
            <h3 className="mt-2 text-xl font-black text-gray-900">Quản lý nhãn riêng</h3>

            <div className="mt-5 grid gap-2">
              <label className="text-sm font-bold text-slate-600">Tên nhãn</label>
              <input
                value={customLabelDraft}
                onChange={(event) => setCustomLabelDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleSaveCustomLabel();
                  }
                }}
                className={inputClass}
                autoFocus
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSaveCustomLabel}
                className="inline-flex items-center gap-2 rounded-[16px] border border-gray-200 bg-violet-500 px-5 py-3 text-sm font-extrabold text-white shadow-soft-sm"
              >
                {editingCustomLabel ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingCustomLabel ? "Lưu chỉnh sửa" : "Thêm nhãn"}
              </button>
              {editingCustomLabel ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingCustomLabel(null);
                    setCustomLabelDraft("");
                  }}
                  className="rounded-[16px] border border-gray-200 bg-white px-4 py-3 text-sm font-extrabold text-gray-900"
                >
                  Hủy sửa
                </button>
              ) : null}
            </div>

            <div className="mt-6 space-y-3">
              {customLabels.length === 0 ? (
                <div className="rounded-[18px] border border-dashed border-gray-200 bg-slate-50 p-4 text-sm font-bold text-slate-500">
                  Chưa có nhãn riêng nào.
                </div>
              ) : (
                customLabels.map((label) => {
                  const isInUse = customLabelsInUse.has(label);
                  return (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-3 rounded-[18px] border border-gray-200 bg-slate-50 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-black text-gray-900">{label}</p>
                        {isInUse ? (
                          <p className="mt-1 text-xs font-bold text-slate-500">Đang dùng trong sổ địa chỉ</p>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleStartEditCustomLabel(label)}
                          className="rounded-[14px] border border-gray-200 bg-white px-3 py-2 text-xs font-extrabold text-gray-900 disabled:opacity-50"
                          disabled={isInUse}
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomLabel(label)}
                          className="inline-flex items-center gap-1 rounded-[14px] border border-red-200 bg-white px-3 py-2 text-xs font-extrabold text-red-700 disabled:opacity-50"
                          disabled={isInUse}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Xóa
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={closeCustomLabelModal}
                className="rounded-[16px] border border-gray-200 bg-white px-4 py-3 text-sm font-extrabold text-gray-900"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
