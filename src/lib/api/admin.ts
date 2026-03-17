import { api } from "./clients";

// ── Types ──

export type UserDto = {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    avatarUrl?: string;
    createdAt: string;
};

export type UserDetailDto = UserDto & {
    schoolName?: string;
    providerName?: string;
    lastLogin?: string;
    isEmailConfirmed: boolean;
};

export type ParentDto = {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    status: string;
    studentCount: number;
    createdAt: string;
};

export type ParentDetailDto = ParentDto & {
    students: { id: string; name: string; school: string; class: string }[];
    orders: { id: string; total: number; status: string; createdAt: string }[];
};

export type DashboardAnalyticsDto = {
    totalUsers: number;
    totalSchools: number;
    totalProviders: number;
    totalParents: number;
    totalOrders: number;
    totalRevenue: number;
    pendingApprovals: number;
    pendingWithdrawals: number;
    recentActivities: { description: string; createdAt: string }[];
};

export type WithdrawalRequestDto = {
    id: string;
    schoolName: string;
    amount: number;
    bankAccount: string;
    bankName: string;
    status: string;
    requestedAt: string;
    processedAt?: string;
    adminNote?: string;
};

export type PaymentTransactionDto = {
    id: string;
    orderId: string;
    parentName: string;
    amount: number;
    paymentGateway: string;
    status: string;
    transactionRef: string;
    createdAt: string;
};

export type CategoryDto = {
    id: string;
    categoryName: string;
    createdAt: string;
};

export type ReportDto = {
    reportType: string;
    data: Record<string, any>[];
    summary: Record<string, any>;
};

export type UserReportDto = {
    totalUsers: number;
    byRole: Record<string, number>;
    byStatus: Record<string, number>;
    newUsersInPeriod: number;
};

// ── User Management ──

export async function getUsers(): Promise<UserDto[]> {
    return api<UserDto[]>("/api/admin/users", { method: "GET", auth: true });
}

export async function getUserDetail(id: string): Promise<UserDetailDto> {
    return api<UserDetailDto>(`/api/admin/users/${id}`, { method: "GET", auth: true });
}

export async function approveUser(id: string): Promise<void> {
    await api(`/api/admin/users/${id}/approve`, { method: "POST", auth: true });
}

export async function suspendUser(id: string): Promise<void> {
    await api(`/api/admin/users/${id}/suspend`, { method: "POST", auth: true });
}

export async function getUserReport(params?: {
    dateFrom?: string; dateTo?: string; role?: string; status?: string;
}): Promise<UserReportDto> {
    const query = new URLSearchParams();
    if (params?.dateFrom) query.set("dateFrom", params.dateFrom);
    if (params?.dateTo) query.set("dateTo", params.dateTo);
    if (params?.role) query.set("role", params.role);
    if (params?.status) query.set("status", params.status);
    return api<UserReportDto>(`/api/admin/reports/users?${query}`, { method: "GET", auth: true });
}

// ── School / Provider Approval ──

export async function approveSchoolRequest(schoolId: string, action: string, rejectionReason?: string, adminNote?: string) {
    return api(`/api/admin/school-requests/${schoolId}`, {
        method: "POST", auth: true,
        body: JSON.stringify({ action, rejectionReason, adminNote }),
    });
}

export async function approveProviderRequest(providerId: string, action: string, rejectionReason?: string, adminNote?: string) {
    return api(`/api/admin/provider-requests/${providerId}`, {
        method: "POST", auth: true,
        body: JSON.stringify({ action, rejectionReason, adminNote }),
    });
}

// ── Parent Management ──

export async function getParentList(params?: {
    page?: number; pageSize?: number; search?: string; status?: string;
}): Promise<{ items: ParentDto[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.pageSize) query.set("pageSize", String(params.pageSize));
    if (params?.search) query.set("search", params.search);
    if (params?.status) query.set("status", params.status);
    return api(`/api/admin/parents?${query}`, { method: "GET", auth: true });
}

export async function getParentDetail(id: string): Promise<ParentDetailDto> {
    return api<ParentDetailDto>(`/api/admin/parents/${id}`, { method: "GET", auth: true });
}

// ── Dashboard & Analytics ──

export async function getDashboardAnalytics(timeRange = "Month"): Promise<DashboardAnalyticsDto> {
    return api<DashboardAnalyticsDto>(`/api/admin/analytics/dashboard?timeRange=${timeRange}`, { method: "GET", auth: true });
}

export async function getTotalOrders(dateFrom?: string, dateTo?: string) {
    const query = new URLSearchParams();
    if (dateFrom) query.set("dateFrom", dateFrom);
    if (dateTo) query.set("dateTo", dateTo);
    return api(`/api/admin/analytics/orders?${query}`, { method: "GET", auth: true });
}

export async function getTotalQuantityPerItem(dateFrom?: string, dateTo?: string) {
    const query = new URLSearchParams();
    if (dateFrom) query.set("dateFrom", dateFrom);
    if (dateTo) query.set("dateTo", dateTo);
    return api(`/api/admin/analytics/quantity-per-item?${query}`, { method: "GET", auth: true });
}

export async function getTotalRevenue(dateFrom?: string, dateTo?: string) {
    const query = new URLSearchParams();
    if (dateFrom) query.set("dateFrom", dateFrom);
    if (dateTo) query.set("dateTo", dateTo);
    return api(`/api/admin/analytics/revenue?${query}`, { method: "GET", auth: true });
}

export async function getPaymentCompletionRate(dateFrom?: string, dateTo?: string) {
    const query = new URLSearchParams();
    if (dateFrom) query.set("dateFrom", dateFrom);
    if (dateTo) query.set("dateTo", dateTo);
    return api(`/api/admin/analytics/payment-completion-rate?${query}`, { method: "GET", auth: true });
}

// ── Withdrawal Requests ──

export async function getWithdrawalRequests(params?: {
    page?: number; pageSize?: number; status?: string;
}): Promise<{ items: WithdrawalRequestDto[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.pageSize) query.set("pageSize", String(params.pageSize));
    if (params?.status) query.set("status", params.status);
    return api(`/api/admin/withdrawals?${query}`, { method: "GET", auth: true });
}

export async function approveWithdrawal(id: string, adminNote?: string) {
    return api(`/api/admin/withdrawals/${id}/approve`, {
        method: "POST", auth: true,
        body: JSON.stringify({ adminNote }),
    });
}

// ── Payment Monitoring ──

export async function monitorPaymentTransactions(params?: {
    dateFrom?: string; dateTo?: string; status?: string; paymentGateway?: string;
    page?: number; pageSize?: number;
}): Promise<{ items: PaymentTransactionDto[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.dateFrom) query.set("dateFrom", params.dateFrom);
    if (params?.dateTo) query.set("dateTo", params.dateTo);
    if (params?.status) query.set("status", params.status);
    if (params?.paymentGateway) query.set("paymentGateway", params.paymentGateway);
    if (params?.page) query.set("page", String(params.page));
    if (params?.pageSize) query.set("pageSize", String(params.pageSize));
    return api(`/api/admin/payments?${query}`, { method: "GET", auth: true });
}

// ── Reports ──

export async function viewReport(reportType: string, dateFrom?: string, dateTo?: string, schoolId?: string) {
    const query = new URLSearchParams({ reportType });
    if (dateFrom) query.set("dateFrom", dateFrom);
    if (dateTo) query.set("dateTo", dateTo);
    if (schoolId) query.set("schoolId", schoolId);
    return api(`/api/admin/reports?${query}`, { method: "GET", auth: true });
}

export async function exportReport(reportType: string, exportFormat: string, dateFrom?: string, dateTo?: string, schoolId?: string) {
    const query = new URLSearchParams({ reportType, exportFormat });
    if (dateFrom) query.set("dateFrom", dateFrom);
    if (dateTo) query.set("dateTo", dateTo);
    if (schoolId) query.set("schoolId", schoolId);
    // Returns blob — handle downstream
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "";
    const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
    const res = await fetch(`${baseUrl}/api/admin/reports/export?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Export failed");
    return res.blob();
}

export async function generateSystemReport(reportFrequency: string) {
    return api(`/api/admin/reports/generate`, {
        method: "POST", auth: true,
        body: JSON.stringify({ reportFrequency }),
    });
}

export async function exportSchoolActivityLogs(schoolId: string, dateFrom?: string, dateTo?: string) {
    const query = new URLSearchParams();
    if (dateFrom) query.set("dateFrom", dateFrom);
    if (dateTo) query.set("dateTo", dateTo);
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "";
    const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
    const res = await fetch(`${baseUrl}/api/admin/activities/export/${schoolId}?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Export failed");
    return res.blob();
}

// ── Uniform Categories ──

export async function getCategories(): Promise<CategoryDto[]> {
    return api<CategoryDto[]>("/api/admin/categories", { method: "GET", auth: true });
}

export async function addCategory(categoryName: string) {
    return api("/api/admin/categories", {
        method: "POST", auth: true,
        body: JSON.stringify({ categoryName }),
    });
}

export async function updateCategory(id: string, categoryName: string) {
    return api(`/api/admin/categories/${id}`, {
        method: "PUT", auth: true,
        body: JSON.stringify({ categoryName }),
    });
}

export async function deleteCategory(id: string) {
    return api(`/api/admin/categories/${id}`, { method: "DELETE", auth: true });
}

// ── Settings Configuration ──

export async function configureSizeTemplate(chartName: string, description?: string, unit?: string) {
    return api("/api/admin/settings/size-template", {
        method: "POST", auth: true,
        body: JSON.stringify({ chartName, description, unit }),
    });
}

export async function configureDefaultSizeChart(sizeChartId: string) {
    return api("/api/admin/settings/default-size-chart", {
        method: "POST", auth: true,
        body: JSON.stringify({ sizeChartId }),
    });
}

export async function configurePaymentMethod(paymentGateway: string, isEnabled: boolean, apiKey?: string, secretKey?: string) {
    return api("/api/admin/settings/payment-method", {
        method: "POST", auth: true,
        body: JSON.stringify({ paymentGateway, isEnabled, apiKey, secretKey }),
    });
}

export async function configureAITryOnSettings(modelVersion?: string, imageResolution?: string, maxUploadFileSizeMB?: number) {
    return api("/api/admin/settings/ai-tryon", {
        method: "POST", auth: true,
        body: JSON.stringify({ modelVersion, imageResolution, maxUploadFileSizeMB }),
    });
}

// ── Feedbacks ──

export async function getFeedbacks() {
    return api("/api/admin/feedbacks", { method: "GET", auth: true });
}

export async function removeFeedback(id: string) {
    return api(`/api/admin/feedback/${id}`, { method: "DELETE", auth: true });
}
