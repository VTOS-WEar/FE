import { api } from "./clients";
import { endpoints } from "./endpoints";
import type { ClassGroupDetailDto, TeacherClassesOverviewDto } from "./schools";

export type TeacherClassAttentionDto = {
    classGroupId: string;
    className: string;
    academicYear: string;
    studentCount: number;
    missingParentLinkCount: number;
    missingMeasurementCount: number;
    orderedStudentCount: number;
};

export type TeacherReportListItemDto = {
    id: string;
    classGroupId: string;
    className: string;
    reportType: string;
    title: string;
    content: string;
    status: string;
    submittedAt: string;
    reviewedAt: string | null;
    reviewNote: string | null;
};

export type TeacherReportListResponseDto = {
    totalCount: number;
    items: TeacherReportListItemDto[];
};

export type TeacherDashboardDto = {
    teacherId: string;
    teacherName: string;
    teacherEmail: string;
    totalClasses: number;
    totalStudents: number;
    missingParentLinkCount: number;
    missingMeasurementCount: number;
    pendingReviewReportCount: number;
    classesNeedingAttention: TeacherClassAttentionDto[];
    latestReports: TeacherReportListItemDto[];
};

export type TeacherClassOrderCoverageDto = {
    classGroupId: string;
    totalStudents: number;
    studentsWithOrders: number;
    studentsWithoutOrders: number;
    totalOrders: number;
    pendingOrders: number;
    activeOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
};

export type TeacherClassFeedbackDto = {
    feedbackId: string;
    studentName: string;
    providerName: string | null;
    rating: number;
    comment: string | null;
    timestamp: string;
};

export type TeacherClassFeedbackListDto = {
    classGroupId: string;
    averageRating: number;
    totalFeedbacks: number;
    items: TeacherClassFeedbackDto[];
};

export type GetTeacherReportsParams = {
    classGroupId?: string;
    status?: string;
    reportType?: string;
};

export type SubmitTeacherReportRequest = {
    classGroupId: string;
    reportType: string;
    title: string;
    content: string;
};

export type ReviewTeacherReportRequest = {
    reviewNote?: string;
};

export type TeacherReminderCandidateStudentDto = {
    childId: string;
    childName: string;
};

export type TeacherReminderCandidateDto = {
    parentUserId: string;
    parentName: string;
    parentEmail: string;
    parentPhone: string | null;
    pendingStudents: TeacherReminderCandidateStudentDto[];
};

export type TeacherReminderCandidatesResponseDto = {
    classGroupId: string;
    className: string;
    totalPendingParents: number;
    totalPendingStudents: number;
    items: TeacherReminderCandidateDto[];
};

export type SendTeacherReminderRequest = {
    classGroupId: string;
    parentUserIds?: string[];
    note?: string;
};

export type TeacherReminderSendResponseDto = {
    classGroupId: string;
    className: string;
    sentCount: number;
    parentUserIds: string[];
};

export async function getTeacherDashboard(): Promise<TeacherDashboardDto> {
    return api<TeacherDashboardDto>(endpoints.teacher.dashboard, {
        method: "GET",
        auth: true,
    });
}

export async function getTeacherClassesOverview(): Promise<TeacherClassesOverviewDto> {
    return api<TeacherClassesOverviewDto>(endpoints.teacher.classes, {
        method: "GET",
        auth: true,
    });
}

export async function getTeacherClassDetail(id: string): Promise<ClassGroupDetailDto> {
    return api<ClassGroupDetailDto>(`${endpoints.teacher.classes}/${id}`, {
        method: "GET",
        auth: true,
    });
}

export async function getTeacherClassOrderCoverage(id: string): Promise<TeacherClassOrderCoverageDto> {
    return api<TeacherClassOrderCoverageDto>(`${endpoints.teacher.classes}/${id}/order-coverage`, {
        method: "GET",
        auth: true,
    });
}

export async function getTeacherClassFeedback(id: string, limit = 5): Promise<TeacherClassFeedbackListDto> {
    return api<TeacherClassFeedbackListDto>(`${endpoints.teacher.classes}/${id}/feedback?limit=${limit}`, {
        method: "GET",
        auth: true,
    });
}

export async function getTeacherReports(params: GetTeacherReportsParams = {}): Promise<TeacherReportListResponseDto> {
    const searchParams = new URLSearchParams();
    if (params.classGroupId) searchParams.set("classGroupId", params.classGroupId);
    if (params.status) searchParams.set("status", params.status);
    if (params.reportType) searchParams.set("reportType", params.reportType);
    const suffix = searchParams.toString();

    return api<TeacherReportListResponseDto>(`${endpoints.teacher.reports}${suffix ? `?${suffix}` : ""}`, {
        method: "GET",
        auth: true,
    });
}

export async function submitTeacherReport(payload: SubmitTeacherReportRequest): Promise<TeacherReportListItemDto> {
    return api<TeacherReportListItemDto>(endpoints.teacher.reports, {
        method: "POST",
        body: JSON.stringify(payload),
        auth: true,
    });
}

export async function getSchoolTeacherReports(params: GetTeacherReportsParams = {}): Promise<TeacherReportListResponseDto> {
    const searchParams = new URLSearchParams();
    if (params.classGroupId) searchParams.set("classGroupId", params.classGroupId);
    if (params.status) searchParams.set("status", params.status);
    const suffix = searchParams.toString();

    return api<TeacherReportListResponseDto>(`${endpoints.schoolManager.teacherReports}${suffix ? `?${suffix}` : ""}`, {
        method: "GET",
        auth: true,
    });
}

export async function reviewTeacherReport(reportId: string, payload: ReviewTeacherReportRequest): Promise<TeacherReportListItemDto> {
    return api<TeacherReportListItemDto>(`${endpoints.schoolManager.teacherReports}/${reportId}/review`, {
        method: "PUT",
        body: JSON.stringify(payload),
        auth: true,
    });
}

export async function getTeacherReminderCandidates(classGroupId: string): Promise<TeacherReminderCandidatesResponseDto> {
    return api<TeacherReminderCandidatesResponseDto>(`${endpoints.teacher.reminders}/candidates?classGroupId=${classGroupId}`, {
        method: "GET",
        auth: true,
    });
}

export async function sendTeacherReminder(payload: SendTeacherReminderRequest): Promise<TeacherReminderSendResponseDto> {
    return api<TeacherReminderSendResponseDto>(`${endpoints.teacher.reminders}/send`, {
        method: "POST",
        body: JSON.stringify(payload),
        auth: true,
    });
}
