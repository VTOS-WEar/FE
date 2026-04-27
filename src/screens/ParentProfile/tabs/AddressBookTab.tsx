import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronDown, MapPinHouse, Pencil, Plus, Trash2, X } from "lucide-react";
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
const VIETNAM_PHONE_REGEX = /^(03|05|07|08|09)\d{8}$/;

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
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [deleteConfirmAddress, setDeleteConfirmAddress] = useState<ParentAddressDto | null>(null);
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

  const openCreateAddressModal = () => {
    resetAddressForm();
    setIsAddressModalOpen(true);
  };

  const closeAddressModal = () => {
    setIsAddressModalOpen(false);
    resetAddressForm();
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
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = async () => {
    const recipientName = addressForm.recipientName.trim();
    const recipientPhone = addressForm.recipientPhone.trim();
    const houseNumber = addressForm.houseNumber.trim();

    if (
      !addressForm.label.trim() ||
      !recipientName ||
      !recipientPhone ||
      !addressForm.provinceName.trim() ||
      !addressForm.wardName.trim() ||
      !houseNumber
    ) {
      setAddressMsg("Điền đầy đủ nhãn, người nhận, số điện thoại, tỉnh, xã/phường và số nhà.");
      return;
    }

    if (recipientName.length <= 2) {
      setAddressMsg("Tên người nhận phải nhiều hơn 2 ký tự.");
      return;
    }

    if (houseNumber.length <= 2) {
      setAddressMsg("Địa chỉ chi tiết phải nhiều hơn 2 ký tự.");
      return;
    }

    if (!VIETNAM_PHONE_REGEX.test(recipientPhone)) {
      setAddressMsg("Số điện thoại phải là số di động Việt Nam gồm đúng 10 chữ số.");
      return;
    }

    setAddressSaving(true);
    setAddressMsg("");

    const payload = {
      label: addressForm.label.trim(),
      recipientName,
      recipientPhone,
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
      setIsAddressModalOpen(false);
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
  const selectClass = `${inputClass} appearance-none pr-11`;

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
              onClick={openCreateAddressModal}
              className="group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-[16px] border border-gray-200 bg-gradient-to-r from-[#7C63E6] via-[#8F79EB] to-[#6F56E0] px-6 text-sm font-extrabold text-white shadow-[0_10px_22px_rgba(124,99,230,0.24)] transition-all duration-200 hover:-translate-y-[1px] hover:brightness-110 hover:shadow-[0_14px_28px_rgba(124,99,230,0.32)] active:translate-y-0 active:shadow-[0_8px_18px_rgba(124,99,230,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2"
            >
              <span className="pointer-events-none absolute -left-10 top-0 h-full w-14 -skew-x-12 bg-white/25 blur-[1px] transition-all duration-300 group-hover:left-[110%]" />
              <Plus className="h-4 w-4" />
              Tạo địa chỉ mới
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-soft-sm lg:p-7">
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
                        onClick={() => setDeleteConfirmAddress(address)}
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
      </section>

      {isAddressModalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-2xl rounded-[24px] border border-gray-200 bg-white p-6 shadow-soft-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">
                  {editingAddressId ? "Cập nhật địa chỉ" : "Địa chỉ mới"}
                </p>
                <h3 className="mt-2 text-xl font-black text-gray-900">
                  {editingAddressId ? "Chỉnh sửa sổ địa chỉ" : "Thêm địa chỉ giao hàng"}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeAddressModal}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-all hover:bg-slate-50 hover:text-gray-900"
                aria-label="Đóng"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-600">Nhãn</label>
                <div className="relative">
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
                    className={selectClass}
                  >
                    {labelOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-bold text-slate-600">Người nhận</label>
                  <input
                    value={addressForm.recipientName}
                    onChange={(event) => setAddressForm((current) => ({ ...current, recipientName: event.target.value }))}
                    className={inputClass}
                    placeholder="Tên người nhận (trên 2 ký tự)"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-bold text-slate-600">Số điện thoại</label>
                  <input
                    value={addressForm.recipientPhone}
                    onChange={(event) =>
                      setAddressForm((current) => ({ ...current, recipientPhone: event.target.value.replace(/[^\d]/g, "").slice(0, 10) }))
                    }
                    inputMode="numeric"
                    maxLength={10}
                    className={inputClass}
                    placeholder="VD: 0912345678"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-bold text-slate-600">Tỉnh/Thành phố</label>
                  <div className="relative">
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
                      className={selectClass}
                    >
                      <option value="">Chọn tỉnh/thành phố</option>
                      {provinceOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-bold text-slate-600">Xã/Phường</label>
                  <div className="relative">
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
                      className={`${selectClass} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
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
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-600">Số nhà / Địa chỉ chi tiết</label>
                <input
                  value={addressForm.houseNumber}
                  onChange={(event) => setAddressForm((current) => ({ ...current, houseNumber: event.target.value }))}
                  className={inputClass}
                  placeholder="Địa chỉ chi tiết (trên 2 ký tự)"
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
                  className="group relative inline-flex h-12 min-w-[180px] items-center justify-center overflow-hidden rounded-[16px] border border-gray-200 bg-gradient-to-r from-[#7C63E6] via-[#8F79EB] to-[#6F56E0] px-6 text-sm font-extrabold text-white shadow-[0_10px_22px_rgba(124,99,230,0.28)] transition-all duration-200 hover:-translate-y-[1px] hover:brightness-110 hover:shadow-[0_14px_28px_rgba(124,99,230,0.34)] active:translate-y-0 active:shadow-[0_8px_18px_rgba(124,99,230,0.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  <span className="pointer-events-none absolute -left-10 top-0 h-full w-14 -skew-x-12 bg-white/25 blur-[1px] transition-all duration-300 group-hover:left-[110%]" />
                  {addressSaving ? "Đang lưu..." : editingAddressId ? "Lưu cập nhật" : "Thêm địa chỉ"}
                </button>
                <button
                  type="button"
                  onClick={closeAddressModal}
                  className="inline-flex h-12 min-w-[92px] items-center justify-center rounded-[16px] border border-gray-200 bg-white px-5 text-sm font-extrabold text-gray-900 shadow-soft-sm transition-all duration-200 hover:-translate-y-[1px] hover:bg-slate-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
                >
                  Hủy
                </button>
                {addressMsg ? <span className="text-sm font-bold text-slate-600">{addressMsg}</span> : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {deleteConfirmAddress ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-md rounded-[24px] border border-gray-200 bg-white p-6 shadow-soft-lg">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-red-500">Xác nhận xóa</p>
            <h3 className="mt-2 text-xl font-black text-gray-900">Bạn có chắc muốn xóa địa chỉ này?</h3>
            <p className="mt-3 text-sm font-medium text-slate-600">
              <span className="font-bold text-gray-900">{deleteConfirmAddress.label}</span> -{" "}
              {deleteConfirmAddress.recipientName}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-500">{deleteConfirmAddress.addressLine}</p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmAddress(null)}
                className="rounded-[14px] border border-gray-200 bg-white px-4 py-2.5 text-sm font-extrabold text-gray-900"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleDeleteAddress(deleteConfirmAddress.addressId);
                  setDeleteConfirmAddress(null);
                }}
                className="inline-flex items-center gap-1 rounded-[14px] border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-extrabold text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Xóa địa chỉ
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
