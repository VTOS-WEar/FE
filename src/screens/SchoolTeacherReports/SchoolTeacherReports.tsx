import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../../components/ui/breadcrumb";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { usePreservedResultsHeight } from "../../hooks/usePreservedResultsHeight";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useSidebarConfig } from "../../hooks/useSidebarConfig";
import { getSchoolClassesOverview } from "../../lib/api/schools";
import {
    getSchoolTeacherReports,
    reviewTeacherReport,
    type TeacherReportListItemDto,
} from "../../lib/api/teachers";

function formatReportType(reportType: string) {
    switch (reportType) {
        case "General":
            return "Tổng hợp";
        case "OrderCoverage":
            return "Độ phủ đơn hàng";
        case "QualityIssue":
            return "Vấn đề chất lượng";
        default:
            return reportType;
    }
}

function formatStatus(status: string) {
    return status === "Reviewed" ? "Đã xem" : "Đang chờ xem";
}

export const SchoolTeacherReports = (): JSX.Element => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const sidebarConfig = useSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [reports, setReports] = useState<TeacherReportListItemDto[]>([]);
    const [classOptions, setClassOptions] = useState<{ id: string; className: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState(searchParams.get("status") || "");
    const [classGroupId, setClassGroupId] = useState(searchParams.get("classGroupId") || "");
    const [selectedReport, setSelectedReport] = useState<TeacherReportListItemDto | null>(null);
    const [reviewNote, setReviewNote] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const hasActiveFilters = !!(status || classGroupId);
    const isFilteredEmptyState = !loading && !error && hasActiveFilters && reports.length === 0;
    const { preserveResultsHeight, preservedHeightStyle, resultsRegionRef } = usePreservedResultsHeight(isFilteredEmptyState);

    useEffect(() => {
        getSchoolClassesOverview()
            .then((overview) => setClassOptions(overview.grades.flatMap((group) => group.classes.map((item) => ({ id: item.id, className: item.className })))))
            .catch(() => undefined);
    }, []);

    useEffect(() => {
        setLoading(true);
        setError(null);
        getSchoolTeacherReports({
            classGroupId: classGroupId || undefined,
            status: status || undefined,
        })
            .then((response) => {
                setReports(response.items);
                setSelectedReport((current) => {
                    if (!current) return null;
                    return response.items.find((item) => item.id === current.id) ?? null;
                });
            })
            .catch((err: unknown) => setError(err instanceof Error ? err.message : "Không thể tải báo cáo giáo viên"))
            .finally(() => setLoading(false));
    }, [classGroupId, status]);

    useEffect(() => {
        if (!selectedReport) {
            setReviewNote("");
            return;
        }

        setReviewNote(selectedReport.reviewNote || "");
    }, [selectedReport]);

    const pendingCount = useMemo(() => reports.filter((item) => item.status !== "Reviewed").length, [reports]);
    const reviewedCount = reports.length - pendingCount;

    const handleReviewSubmit = async () => {
        if (!selectedReport || selectedReport.status === "Reviewed") {
            return;
        }

        setSubmitting(true);
        try {
            const updated = await reviewTeacherReport(selectedReport.id, {
                reviewNote: reviewNote.trim() || undefined,
            });

            setReports((current) => current.map((item) => (item.id === updated.id ? updated : item)));
            setSelectedReport(updated);
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Không thể lưu phản hồi");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} name="" isCollapsed={isCollapsed} onToggle={toggle} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                    <TopNavBar>
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem><BreadcrumbLink href="/school/dashboard" className="font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                                <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                                <BreadcrumbItem><BreadcrumbPage className="font-bold text-gray-900 text-base">Báo cáo giáo viên</BreadcrumbPage></BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </TopNavBar>

                    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        <section className="rounded-[28px] border border-amber-200 bg-[linear-gradient(135deg,_#fffef8_0%,_#ffffff_45%,_#f4fbff_100%)] p-6 shadow-soft-lg">
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                                <div>
                                     <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-700">Báo cáo giáo viên</p>
                                     <h1 className="mt-2 text-[30px] font-extrabold leading-tight text-gray-900 lg:text-[38px]">Báo cáo từ giáo viên chủ nhiệm</h1>
                                 </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-2xl border border-amber-200 bg-white/90 p-4">
                                        <p className="text-sm font-semibold text-[#6b7280]">Đang chờ xem</p>
                                        <p className="mt-2 text-3xl font-extrabold text-gray-900">{pendingCount}</p>
                                    </div>
                                    <div className="rounded-2xl border border-emerald-200 bg-white/90 p-4">
                                        <p className="text-sm font-semibold text-[#6b7280]">Đã xử lý</p>
                                        <p className="mt-2 text-3xl font-extrabold text-gray-900">{reviewedCount}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="mt-6 rounded-[24px] border border-gray-200 bg-white p-5 shadow-soft-md">
                            <div className="grid gap-3 md:grid-cols-2">
                                <label className="text-sm font-semibold text-[#4c5769]">
                                    Lớp
                                    <select value={classGroupId} onChange={(e) => {
                                        preserveResultsHeight();
                                        setClassGroupId(e.target.value);
                                    }} className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-900 outline-none focus:border-amber-300">
                                        <option value="">Tất cả lớp</option>
                                        {classOptions.map((item) => (
                                            <option key={item.id} value={item.id}>Lớp {item.className}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="text-sm font-semibold text-[#4c5769]">
                                    Trạng thái
                                    <select value={status} onChange={(e) => {
                                        preserveResultsHeight();
                                        setStatus(e.target.value);
                                    }} className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-900 outline-none focus:border-amber-300">
                                        <option value="">Tất cả</option>
                                        <option value="Submitted">Đang chờ xem</option>
                                        <option value="Reviewed">Đã xem</option>
                                    </select>
                                </label>
                            </div>
                        </section>

                        {loading && (
                            <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-soft-md">
                                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-amber-600" />
                                <p className="text-sm font-semibold text-[#4c5769]">Đang tải báo cáo...</p>
                            </section>
                        )}

                        {!loading && error && (
                            <section className="mt-6 rounded-2xl border border-red-200 bg-white p-8 text-center shadow-soft-md">
                                <p className="text-base font-bold text-red-600">{error}</p>
                            </section>
                        )}

                        {!loading && !error && (
                            <section ref={resultsRegionRef} style={preservedHeightStyle} className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.95fr]">
                                <div className="rounded-[24px] border border-gray-200 bg-white shadow-soft-md">
                                    <div className="border-b border-gray-100 px-5 py-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Danh sách báo cáo</p>
                                        <h2 className="text-xl font-extrabold text-gray-900">{reports.length} báo cáo</h2>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {reports.length === 0 && (
                                            <div className="px-5 py-10 text-center text-sm font-semibold text-[#4c5769]">
                                                Chưa có báo cáo phù hợp với bộ lọc hiện tại.
                                            </div>
                                        )}
                                        {reports.map((report) => (
                                            <button
                                                key={report.id}
                                                type="button"
                                                onClick={() => setSelectedReport(report)}
                                                className={`w-full px-5 py-5 text-left transition-colors hover:bg-[#fffdf5] ${selectedReport?.id === report.id ? "bg-[#fff9e8]" : "bg-white"}`}
                                            >
                                                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h3 className="text-lg font-extrabold text-gray-900">{report.title}</h3>
                                                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${report.status === "Reviewed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                                                {formatStatus(report.status)}
                                                            </span>
                                                            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">{formatReportType(report.reportType)}</span>
                                                        </div>
                                                        <p className="mt-2 text-sm font-semibold text-[#4c5769]">Lớp {report.className}</p>
                                                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#4c5769]">{report.content}</p>
                                                    </div>
                                                    <div className="text-sm font-semibold text-[#6b7280] lg:text-right">
                                                        <p>Gửi: {new Date(report.submittedAt).toLocaleDateString("vi-VN")}</p>
                                                        <p className="mt-1">{report.reviewedAt ? `Xem: ${new Date(report.reviewedAt).toLocaleDateString("vi-VN")}` : "Chưa xem"}</p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-soft-md">
                                    {!selectedReport ? (
                                        <div className="flex h-full min-h-[320px] items-center justify-center text-center">
                                            <div>
                                                <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#6b7280]">Chi tiết báo cáo</p>
                                                <p className="mt-3 text-base font-semibold text-[#4c5769]">Chọn một báo cáo để đọc nội dung và phản hồi cho giáo viên.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h2 className="text-2xl font-extrabold text-gray-900">{selectedReport.title}</h2>
                                                <span className={`rounded-full px-3 py-1 text-xs font-bold ${selectedReport.status === "Reviewed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                                    {formatStatus(selectedReport.status)}
                                                </span>
                                            </div>

                                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                                <div className="rounded-2xl bg-[#f8fafc] p-4">
                                                    <p className="text-sm font-semibold text-[#6b7280]">Lớp</p>
                                                    <button type="button" onClick={() => navigate(`/school/students/classes/${selectedReport.classGroupId}`)} className="mt-1 text-left text-lg font-extrabold text-gray-900 hover:text-amber-700">
                                                        {selectedReport.className}
                                                    </button>
                                                </div>
                                                <div className="rounded-2xl bg-[#f8fafc] p-4">
                                                    <p className="text-sm font-semibold text-[#6b7280]">Loại báo cáo</p>
                                                    <p className="mt-1 text-lg font-extrabold text-gray-900">{formatReportType(selectedReport.reportType)}</p>
                                                </div>
                                            </div>

                                            <div className="mt-4 rounded-2xl bg-[#fffdf5] p-4">
                                                <p className="text-sm font-semibold text-[#6b7280]">Nội dung giáo viên gửi</p>
                                                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#334155]">{selectedReport.content}</p>
                                            </div>

                                            <div className="mt-4 rounded-2xl bg-[#f8fafc] p-4 text-sm font-semibold text-[#4c5769]">
                                                <p>Gửi lúc: {new Date(selectedReport.submittedAt).toLocaleString("vi-VN")}</p>
                                                <p className="mt-1">{selectedReport.reviewedAt ? `Đã xem lúc: ${new Date(selectedReport.reviewedAt).toLocaleString("vi-VN")}` : "Báo cáo này chưa được nhà trường đánh dấu đã xem."}</p>
                                            </div>

                                            <div className="mt-4">
                                                <label className="text-sm font-semibold text-[#4c5769]">
                                                    Ghi chú phản hồi
                                                    <textarea
                                                        value={reviewNote}
                                                        onChange={(e) => setReviewNote(e.target.value)}
                                                        rows={6}
                                                        placeholder="Thêm ghi chú để giáo viên biết nhà trường đã tiếp nhận và cần làm gì tiếp theo..."
                                                        className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none focus:border-amber-300"
                                                    />
                                                </label>
                                            </div>

                                            <div className="mt-5 flex flex-wrap gap-3">
                                                <button type="button" onClick={handleReviewSubmit} disabled={submitting || selectedReport.status === "Reviewed"} className="nb-btn text-sm disabled:cursor-not-allowed disabled:opacity-60">
                                                    {selectedReport.status === "Reviewed" ? "Đã được đánh dấu" : submitting ? "Đang lưu..." : "Đánh dấu đã xem"}
                                                </button>
                                                <button type="button" onClick={() => navigate(`/school/students/classes/${selectedReport.classGroupId}`)} className="nb-btn nb-btn-outline text-sm">
                                                    Mở chi tiết lớp
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </section>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};
