import { api } from "./clients";
import { endpoints } from "./endpoints";
import type { Province } from "../utils/vietnamProvinces";

/* ── Types ── */
export interface UpdateParentProfileDto {
  fullName?: string;
  dob?: string; // ISO date string: "2000-01-15"
  gender?: number; // 1=Male, 2=Female, 3=Other
  phone?: string;
  email?: string;
}

export interface ParentProfileResponse {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  dob: string;
  gender: string;
  role: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  lastLogin: string;
  avatar?: string | null;
  twoFactorEnabled?: boolean;
}

export interface ParentAddressDto {
  addressId: string;
  label: string;
  recipientName: string;
  recipientPhone: string;
  addressLine: string;
  isDefault: boolean;
}

export interface UpsertParentAddressDto {
  label: string;
  recipientName: string;
  recipientPhone: string;
  addressLine: string;
  isDefault: boolean;
}

export interface AddParentBankAccountDto {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountHolderName: string;
  isDefault: boolean;
}

export interface ParentBankAccountDto {
  bankAccountId: string;
  bankName: string;
  bankCode?: string | null;
  accountNumber: string;
  accountHolderName: string;
  isDefault: boolean;
  isVerified: boolean;
}

export interface ParentAddressFormValues {
  label: string;
  recipientName: string;
  recipientPhone: string;
  provinceCode: string;
  provinceName: string;
  wardCode: string;
  wardName: string;
  houseNumber: string;
  isDefault: boolean;
}

export const DEFAULT_PARENT_ADDRESS_FORM: ParentAddressFormValues = {
  label: "Nhà riêng",
  recipientName: "",
  recipientPhone: "",
  provinceCode: "",
  provinceName: "",
  wardCode: "",
  wardName: "",
  houseNumber: "",
  isDefault: false,
};

const normalizeAddressToken = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const findProvinceMatch = (candidate: string, provinces: Province[]): Province | undefined => {
  const normalizedCandidate = normalizeAddressToken(candidate);
  return provinces.find((province) => {
    const normalizedProvinceName = normalizeAddressToken(province.name);
    return (
      normalizedProvinceName === normalizedCandidate ||
      normalizedProvinceName.includes(normalizedCandidate) ||
      normalizedCandidate.includes(normalizedProvinceName)
    );
  });
};

export function formatParentAddressLine(
  form: Pick<ParentAddressFormValues, "houseNumber" | "wardName" | "provinceName">
): string {
  return [form.houseNumber.trim(), form.wardName.trim(), form.provinceName.trim()]
    .filter(Boolean)
    .join(", ");
}

export function parseParentAddressLine(
  addressLine: string,
  provinces: Province[]
): Pick<ParentAddressFormValues, "provinceCode" | "provinceName" | "wardCode" | "wardName" | "houseNumber"> {
  const segments = addressLine
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);

  const provinceSegment = segments.at(-1) ?? "";
  const wardSegment = segments.length > 1 ? segments.at(-2) ?? "" : "";
  const houseNumber = segments.length > 2 ? segments.slice(0, -2).join(", ") : segments[0] ?? "";

  const province = findProvinceMatch(provinceSegment, provinces);
  const ward = province?.districts.find((district) => {
    const normalizedWardName = normalizeAddressToken(district.name);
    const normalizedWardSegment = normalizeAddressToken(wardSegment);
    return (
      normalizedWardName === normalizedWardSegment ||
      normalizedWardName.includes(normalizedWardSegment) ||
      normalizedWardSegment.includes(normalizedWardName)
    );
  });

  return {
    provinceCode: province?.codename ?? "",
    provinceName: province?.name ?? provinceSegment,
    wardCode: ward?.codename ?? "",
    wardName: ward?.name ?? wardSegment,
    houseNumber,
  };
}

/* ── GET /api/users/me ── */
export async function getParentProfile(): Promise<ParentProfileResponse> {
  const res = await api(endpoints.users.me, { auth: true }) as { value: ParentProfileResponse };
  return res.value;
}

/* ── PUT /api/users/me/profile ── */
export async function updateParentProfile(
  dto: UpdateParentProfileDto
): Promise<ParentProfileResponse> {
  const res = await api(endpoints.users.profile, {
    method: "PUT",
    body: JSON.stringify(dto),
    auth: true,
  }) as { value: ParentProfileResponse };
  return res.value;
}

/* ── PUT /api/users/me/avatar ── */
export async function updateParentAvatar(
  file: File
): Promise<{ avatarUrl: string }> {
  const formData = new FormData();
  formData.append("avatar", file);
  
  const res = await api(endpoints.users.avatar, {
    method: "PUT",
    body: formData,
    auth: true,
  }) as { value: { id: string; avatarUrl: string } };
  return { avatarUrl: res.value.avatarUrl };
}

export async function getParentAddresses(): Promise<ParentAddressDto[]> {
  return api<ParentAddressDto[]>(endpoints.users.addresses, { auth: true });
}

export async function createParentAddress(dto: UpsertParentAddressDto): Promise<ParentAddressDto> {
  return api<ParentAddressDto>(endpoints.users.addresses, {
    method: "POST",
    body: JSON.stringify(dto),
    auth: true,
  });
}

export async function updateParentAddress(addressId: string, dto: UpsertParentAddressDto): Promise<ParentAddressDto> {
  return api<ParentAddressDto>(`${endpoints.users.addresses}/${addressId}`, {
    method: "PUT",
    body: JSON.stringify(dto),
    auth: true,
  });
}

export async function deleteParentAddress(addressId: string): Promise<void> {
  await api(`${endpoints.users.addresses}/${addressId}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function setDefaultParentAddress(addressId: string): Promise<void> {
  await api(`${endpoints.users.addresses}/${addressId}/default`, {
    method: "PUT",
    auth: true,
  });
}

export async function addParentBankAccount(dto: AddParentBankAccountDto): Promise<ParentBankAccountDto> {
  return api<ParentBankAccountDto>(endpoints.users.bankAccounts, {
    method: "POST",
    body: JSON.stringify(dto),
    auth: true,
  });
}

/* ── Children Management Types ── */
export interface ChildSchoolDto {
  schoolId: string;
  schoolName: string;
  logoURL?: string | null;
}

export interface ChildProfileDto {
  childId: string;
  fullName: string;
  age: number;
  grade: string;
  gender: string;
  avatarUrl:string;
  school: ChildSchoolDto;
  heightCm: number;
  weightKg: number;
}

export interface ConflictedChildDto {
  fullName: string;
  grade: string;
  schoolName: string;
  otherParentName: string;
}

export interface FindChildrenResponse {
  linkedCount: number;
  linked: ChildProfileDto[];
  conflictedCount: number;
  conflicted: ConflictedChildDto[];
  message: string;
}

/* ── GET /api/users/me/children ── */
export async function getMyChildren(): Promise<ChildProfileDto[]> {
  return api<ChildProfileDto[]>(endpoints.users.children, { auth: true });
}

/* ── POST /api/users/me/find-children ── */
export async function findMyChildren(): Promise<FindChildrenResponse> {
  return api<FindChildrenResponse>(endpoints.users.findChildren, {
    method: "POST",
    auth: true,
  });
}

/* ── GET /api/children/{id} ── */
export interface GetChildDetailResponse {
  childId: string;
  fullName: string;
  age: number;
  grade: string;
  gender: string; // "Male", "Female", etc.
  schoolName: string;
  schoolId: string;
  avatarUrl?: string | null;
  bodyMetric: {
    heightCm: number;
    weightKg: number;
  };
  isStandardSize?: boolean;
}

export async function getChildProfile(childId: string): Promise<GetChildDetailResponse> {
  const res = await api(`${endpoints.children.detail}/${childId}`, { auth: true }) as { value: GetChildDetailResponse };
  return res.value;
}

/* ── PUT /api/children ── */
export interface UpdateChildProfileDto {
  childId: string;
  fullName?: string;
  dob?: string; // ISO date string: "2000-01-15"
  grade?: string;
  gender?: number; // 1=Male, 2=Female, 3=Other
  heightCm?: number;
  weightKg?: number;
}

export async function updateChildProfile(
  dto: UpdateChildProfileDto
): Promise<GetChildDetailResponse> {
  const res = await api(endpoints.children.update, {
    method: "PUT",
    body: JSON.stringify(dto),
    auth: true,
  }) as { value: GetChildDetailResponse };
  return res.value;
}

/* ── PUT /api/children/{id}/avatar ── */
export async function updateChildAvatar(
  childId: string,
  file: File
): Promise<{ avatarUrl: string }> {
  const formData = new FormData();
  formData.append("avatar", file);
  
  const res = await api(`${endpoints.children.avatar}/${childId}/avatar`, {
    method: "PUT",
    body: formData,
    auth: true,
  }) as { value: { id: string; avatarUrl: string } };
  return { avatarUrl: res.value.avatarUrl };
}

