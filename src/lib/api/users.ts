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
