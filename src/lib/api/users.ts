import { api } from "./clients";
import { endpoints } from "./endpoints";

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

