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

//#region UC-43: Student Import

export type ImportError = {
    rowNumber: number;
    studentName: string | null;
    errorMessage: string;
};

export type ImportStudentResult = {
    totalRows: number;
    successCount: number;
    skippedCount: number;
    errorCount: number;
    errors: ImportError[];
};

/** UC-43: Download the .xlsx import template */
export async function downloadImportTemplate(): Promise<void> {
    const token =
        localStorage.getItem("access_token") || sessionStorage.getItem("access_token");

    const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

    const res = await fetch(`${API_BASE}${endpoints.schools.importTemplate}`, {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!res.ok) {
        throw new Error(`Download failed (${res.status})`);
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_import_template.xlsx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/** UC-43: Import student data from .xlsx/.csv file */
export async function importStudents(file: File): Promise<ImportStudentResult> {
    const formData = new FormData();
    formData.append("file", file);

    return api<ImportStudentResult>(endpoints.schools.importStudents, {
        method: "POST",
        body: formData,
        auth: true,
    });
}
//#endregion

//#region Student List

export type StudentListItem = {
    id: string;
    fullName: string;
    studentCode: string | null;
    grade: string;
    gender: string;
    dateOfBirth: string | null;
    hasMeasurements: boolean;
    parentName: string | null;
    parentPhone: string | null;
    isParentLinked: boolean;
};

export type StudentListResponse = {
    items: StudentListItem[];
    totalCount: number;
    page: number;
    pageSize: number;
};

export type GetStudentsParams = {
    page?: number;
    pageSize?: number;
    search?: string;
    grade?: string;
    measurementStatus?: string;
    parentLinkStatus?: string;
};

/** Get school students with optional filters */
export async function getSchoolStudents(params: GetStudentsParams = {}): Promise<StudentListResponse> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));
    if (params.search) searchParams.set("search", params.search);
    if (params.grade) searchParams.set("grade", params.grade);
    if (params.measurementStatus) searchParams.set("measurementStatus", params.measurementStatus);
    if (params.parentLinkStatus) searchParams.set("parentLinkStatus", params.parentLinkStatus);

    const qs = searchParams.toString();
    const url = `${endpoints.schools.students}${qs ? `?${qs}` : ""}`;

    return api<StudentListResponse>(url, {
        method: "GET",
        auth: true,
    });
}
//#endregion

//#region Student CRUD

export type StudentDetailDto = {
    id: string;
    fullName: string;
    studentCode: string | null;
    grade: string;
    gender: string;
    dateOfBirth: string | null;
    heightCm: number;
    weightKg: number;
    hasMeasurements: boolean;
    parentName: string | null;
    parentPhone: string | null;
    isParentLinked: boolean;
};

export type CreateOrUpdateStudentRequest = {
    fullName: string;
    dateOfBirth?: string | null;
    grade?: string;
    gender?: string;
    parentPhone?: string;
    heightCm?: number;
    weightKg?: number;
};

/** Create a student */
export async function createStudent(data: CreateOrUpdateStudentRequest): Promise<StudentDetailDto> {
    return api<StudentDetailDto>(endpoints.schools.students, {
        method: "POST",
        body: JSON.stringify(data),
        auth: true,
    });
}

/** Get a single student by ID */
export async function getStudentById(id: string): Promise<StudentDetailDto> {
    return api<StudentDetailDto>(`${endpoints.schools.students}/${id}`, {
        method: "GET",
        auth: true,
    });
}

/** Update a student by ID */
export async function updateStudent(id: string, data: CreateOrUpdateStudentRequest): Promise<StudentDetailDto> {
    return api<StudentDetailDto>(`${endpoints.schools.students}/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        auth: true,
    });
}

/** Delete (soft) a student by ID */
export async function deleteStudent(id: string): Promise<{ message: string }> {
    return api<{ message: string }>(`${endpoints.schools.students}/${id}`, {
        method: "DELETE",
        auth: true,
    });
}
//#endregion

