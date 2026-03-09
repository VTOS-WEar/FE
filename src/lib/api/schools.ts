import { api } from "./clients";
import { endpoints } from "./endpoints";

//#region Types
export type SchoolProfileDto = {
    id: string;
    schoolName: string;
    logoURL: string | null;
    contactInfo: string | null;
    level: string | null;
    catalogID: string | null;
    createdAt: string;
    updatedAt: string | null;
};

export type UpdateSchoolProfileRequest = {
    schoolName?: string;
    logoURL?: string;
    contactInfo?: string;
    level?: string;
};

/** Structured contact info stored as JSON inside `contactInfo` field */
export type ContactInfoData = {
    email?: string;
    phone?: string;
    address?: string;
    academicYear?: string;
    foundedYear?: string;
    website?: string;
    description?: string;
};
//#endregion

//#region Helpers
/** Parse `contactInfo` JSON string → structured object */
export function parseContactInfo(raw: string | null | undefined): ContactInfoData {
    if (!raw) return {};
    try {
        const parsed = JSON.parse(raw);
        return {
            email: parsed.email ?? "",
            phone: parsed.phone ?? "",
            address: parsed.address ?? "",
            academicYear: parsed.academicYear ?? "",
            foundedYear: parsed.foundedYear ?? "",
            website: parsed.website ?? "",
            description: parsed.description ?? "",
        };
    } catch {
        // Legacy: if contactInfo is plain text, treat as address
        return { address: raw };
    }
}

/** Stringify structured contact info → JSON string for API */
export function stringifyContactInfo(data: ContactInfoData): string {
    return JSON.stringify({
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        academicYear: data.academicYear || "",
        foundedYear: data.foundedYear || "",
        website: data.website || "",
        description: data.description || "",
    });
}

/** Derive profile status from profile data */
export type ProfileStatus = "draft" | "submitted";

export function deriveProfileStatus(profile: SchoolProfileDto | null): ProfileStatus {
    if (!profile) return "draft";
    if (!profile.contactInfo) return "draft";
    try {
        const info = JSON.parse(profile.contactInfo);
        const hasData = info.email || info.phone || info.address;
        return hasData ? "submitted" : "draft";
    } catch {
        // Legacy plain string
        return profile.contactInfo.trim() ? "submitted" : "draft";
    }
}
//#endregion

//#region API Calls
/** UC-42: Get current school's profile */
export async function getSchoolProfile() {
    return api<SchoolProfileDto>(endpoints.schools.me, {
        method: "GET",
        auth: true,
    });
}

/** UC-42: Update current school's profile */
export async function updateSchoolProfile(data: UpdateSchoolProfileRequest) {
    return api<SchoolProfileDto>(endpoints.schools.me, {
        method: "PUT",
        body: JSON.stringify(data),
        auth: true,
    });
}

/** UC-42: Upload school logo via BE → ImgBB, returns { logoURL } */
export async function uploadSchoolLogo(file: File): Promise<{ logoURL: string }> {
    const formData = new FormData();
    formData.append("file", file);

    return api<{ logoURL: string }>(endpoints.schools.logo, {
        method: "POST",
        body: formData,
        auth: true,
    });
}
//#endregion
