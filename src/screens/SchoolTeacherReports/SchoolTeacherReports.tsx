import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, ChevronDown, ClipboardList, Clock3, FileText, Inbox, Loader2, Search } from "lucide-react";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { SCHOOL_THEME } from "../../constants/schoolTheme";
import { usePreservedResultsHeight } from "../../hooks/usePreservedResultsHeight";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useSidebarConfig } from "../../hooks/useSidebarConfig";
import { getSchoolClassesOverview } from "../../lib/api/schools";
import {
    getSchoolTeacherReports,
    reviewTeacherReport,
    type TeacherReportListItemDto,
} from "../../lib/api/teachers";

const MIN_FILTER_FETCH_FEEDBACK_MS = 700;

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

function SummaryCard({
    label,
    value,
    icon,
    surfaceClassName,
}: {
    label: string;
    value: number | string;
    icon: ReactNode;
    surfaceClassName: string;
}) {
    return (
        <div className={`min-h-[112px] rounded-[8px] border p-5 shadow-soft-sm ${surfaceClassName}`}>
            <div className="flex h-full items-center gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-white text-slate-900 shadow-soft-xs">
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700">{label}</p>
                    <p className="mt-2 text-2xl font-bold leading-tight text-slate-950">{value}</p>
                </div>
            </div>
        </div>
    );
}

export const SchoolTeacherReports = (): JSX.Element => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const sidebarConfig = useSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [reports, setReports] = useState<TeacherReportListItemDto[]>([]);
    const [summaryReports, setSummaryReports] = useState<TeacherReportListItemDto[]>([]);
    const [classOptions, setClassOptions] = useState<{ id: string; className: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [fetchingReports, setFetchingReports] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState(searchParams.get("status") || "");
    const [classGroupId, setClassGroupId] = useState(searchParams.get("classGroupId") || "");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedReport, setSelectedReport] = useState<TeacherReportListItemDto | null>(null);
    const [reviewNote, setReviewNote] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const hasLoadedReportsRef = useRef(false);
    const fetchStartedAtRef = useRef(0);
    const fetchSequenceRef = useRef(0);

    useEffect(() => {
        getSchoolClassesOverview()
            .then((overview) => setClassOptions(overview.grades.flatMap((group) => group.classes.map((item) => ({ id: item.id, className: item.className })))))
            .catch(() => undefined);
    }, []);

    useEffect(() => {
        setSummaryLoading(true);
        getSchoolTeacherReports()
            .then((response) => setSummaryReports(response.items))
            .catch(() => undefined)
            .finally(() => setSummaryLoading(false));
    }, []);

    useEffect(() => {
        const fetchSequence = fetchSequenceRef.current + 1;
        const isInitialLoad = !hasLoadedReportsRef.current;
        fetchSequenceRef.current = fetchSequence;
        fetchStartedAtRef.current = Date.now();
        setLoading(isInitialLoad);
        setFetchingReports(!isInitialLoad);
        setError(null);
        getSchoolTeacherReports({
            classGroupId: classGroupId || undefined,
            status: status || undefined,
        })
            .then((response) => {
                if (fetchSequence !== fetchSequenceRef.current) return;
                setReports(response.items);
                setSelectedReport((current) => {
                    if (!current) return null;
                    return response.items.find((item) => item.id === current.id) ?? null;
                });
            })
            .catch((err: unknown) => {
                if (fetchSequence !== fetchSequenceRef.current) return;
                setError(err instanceof Error ? err.message : "Không thể tải báo cáo giáo viên");
            })
            .finally(() => {
                if (fetchSequence !== fetchSequenceRef.current) return;

                const finish = () => {
                    if (fetchSequence !== fetchSequenceRef.current) return;
                    hasLoadedReportsRef.current = true;
                    setLoading(false);
                    setFetchingReports(false);
                };

                const elapsed = Date.now() - fetchStartedAtRef.current;
                if (!isInitialLoad && elapsed < MIN_FILTER_FETCH_FEEDBACK_MS) {
                    window.setTimeout(finish, MIN_FILTER_FETCH_FEEDBACK_MS - elapsed);
                    return;
                }

                finish();
            });
    }, [classGroupId, status]);

    useEffect(() => {
        if (!selectedReport) {
            setReviewNote("");
            return;
        }

        setReviewNote(selectedReport.reviewNote || "");
    }, [selectedReport]);

    const pendingCount = useMemo(() => summaryReports.filter((item) => item.status !== "Reviewed").length, [summaryReports]);
    const reviewedCount = summaryReports.length - pendingCount;
    const displayedReports = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return reports;

        return reports.filter((report) => {
            const searchable = [
                report.title,
                report.content,
                report.className,
                formatReportType(report.reportType),
                formatStatus(report.status),
            ].join(" ").toLowerCase();

            return searchable.includes(query);
        });
    }, [reports, searchTerm]);
    const hasActiveFilters = !!(status || classGroupId || searchTerm.trim());
    const isFilteredEmptyState = !loading && !error && hasActiveFilters && displayedReports.length === 0;
    const { preserveResultsHeight, preservedHeightStyle, resultsRegionRef } = usePreservedResultsHeight(isFilteredEmptyState);

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
            setSummaryReports((current) => current.map((item) => (item.id === updated.id ? updated : item)));
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
                        <div className="flex items-center gap-2 px-2 py-2">
                            <ClipboardList className={`h-5 w-5 ${SCHOOL_THEME.primaryText}`} />
                            <h1 className="text-xl font-bold text-gray-900">Báo cáo giáo viên</h1>
                        </div>
                    </TopNavBar>

                    <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        <section className="space-y-5">
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                                <div>
                                     <h1 className="text-2xl font-bold leading-tight text-slate-950">Báo cáo từ giáo viên chủ nhiệm</h1>
                                     <p className="mt-1 text-sm font-semibold text-slate-500">
                                         Theo dõi phản hồi từ GVCN, lọc theo lớp và đánh dấu các báo cáo đã được nhà trường xử lý.
                                     </p>
                                 </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <SummaryCard label="Tổng báo cáo" value={summaryLoading ? "..." : summaryReports.length} icon={<FileText className="h-5 w-5" />} surfaceClassName={SCHOOL_THEME.summary.school} />
                                <SummaryCard label="Đang chờ xem" value={summaryLoading ? "..." : pendingCount} icon={<Clock3 className="h-5 w-5" />} surfaceClassName={SCHOOL_THEME.summary.cyan} />
                                <SummaryCard label="Đã xử lý" value={summaryLoading ? "..." : reviewedCount} icon={<CheckCircle2 className="h-5 w-5" />} surfaceClassName={SCHOOL_THEME.summary.mint} />
                            </div>
                        </section>

                        <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <label className="relative block w-full lg:max-w-[320px]">
                                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                <input
                                    value={searchTerm}
                                    onChange={(event) => {
                                        preserveResultsHeight();
                                        setSearchTerm(event.target.value);
                                    }}
                                    placeholder="Tìm báo cáo..."
                                    className="h-10 w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-800 outline-none shadow-soft-xs transition-colors placeholder:text-slate-500 focus:border-blue-200 focus:ring-4 focus:ring-blue-50"
                                />
                            </label>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                                <label className="relative block">
                                    <select
                                        value={classGroupId}
                                        onChange={(event) => {
                                            preserveResultsHeight();
                                            setClassGroupId(event.target.value);
                                        }}
                                        className="h-10 min-w-[156px] appearance-none rounded-full border border-slate-200 bg-white py-0 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none shadow-soft-xs transition-colors focus:border-blue-200 focus:ring-4 focus:ring-blue-50"
                                    >
                                        <option value="">Tất cả lớp</option>
                                        {classOptions.map((item) => (
                                            <option key={item.id} value={item.id}>Lớp {item.className}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-900" />
                                </label>

                                <label className="relative block">
                                    <select
                                        value={status}
                                        onChange={(event) => {
                                            preserveResultsHeight();
                                            setStatus(event.target.value);
                                        }}
                                        className="h-10 min-w-[148px] appearance-none rounded-full border border-slate-200 bg-white py-0 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none shadow-soft-xs transition-colors focus:border-blue-200 focus:ring-4 focus:ring-blue-50"
                                    >
                                        <option value="">Tất cả trạng thái</option>
                                        <option value="Submitted">Đang chờ xem</option>
                                        <option value="Reviewed">Đã xem</option>
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-900" />
                                </label>
                            </div>
                        </section>

                        {loading && (
                            <section className="rounded-[8px] border border-gray-200 bg-white p-10 text-center shadow-soft-sm">
                                <div className={`mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 ${SCHOOL_THEME.spinner}`} />
                                <p className="text-sm font-semibold text-[#4c5769]">Đang tải báo cáo...</p>
                            </section>
                        )}

                        {!loading && error && (
                            <section className="rounded-[8px] border border-red-200 bg-white p-8 text-center shadow-soft-sm">
                                <p className="text-base font-bold text-red-600">{error}</p>
                            </section>
                        )}

                        {!loading && !error && (
                            <section ref={resultsRegionRef} style={preservedHeightStyle} className="relative grid gap-6 xl:grid-cols-[1.15fr_0.95fr]">
                                <div className="rounded-[8px] border border-gray-200 bg-white shadow-soft-sm">
                                    <div className="border-b border-gray-100 px-5 py-4">
                                        <p className={`text-xs font-bold uppercase tracking-[0.16em] ${SCHOOL_THEME.primaryText}`}>Danh sách báo cáo</p>
                                        <h2 className="text-xl font-extrabold text-gray-900">{displayedReports.length} báo cáo</h2>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {displayedReports.length === 0 && (
                                            <div className="px-5 py-10 text-center text-sm font-semibold text-[#4c5769]">
                                                <Inbox className={`mx-auto mb-3 h-9 w-9 ${SCHOOL_THEME.primaryText}`} />
                                                Chưa có báo cáo phù hợp với bộ lọc hiện tại.
                                            </div>
                                        )}
                                        {displayedReports.map((report) => (
                                            <button
                                                key={report.id}
                                                type="button"
                                                onClick={() => setSelectedReport(report)}
                                                className={`w-full px-5 py-5 text-left transition-colors hover:bg-blue-50/70 ${selectedReport?.id === report.id ? "bg-blue-50" : "bg-white"}`}
                                            >
                                                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h3 className="text-lg font-extrabold text-gray-900">{report.title}</h3>
                                                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${report.status === "Reviewed" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-[#2563EB]"}`}>
                                                                {formatStatus(report.status)}
                                                            </span>
                                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{formatReportType(report.reportType)}</span>
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

                                <div className="rounded-[8px] border border-gray-200 bg-white p-5 shadow-soft-sm">
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
                                                <span className={`rounded-full px-3 py-1 text-xs font-bold ${selectedReport.status === "Reviewed" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-[#2563EB]"}`}>
                                                    {formatStatus(selectedReport.status)}
                                                </span>
                                            </div>

                                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                                <div className="rounded-[8px] bg-[#F8FAFC] p-4">
                                                    <p className="text-sm font-semibold text-[#6b7280]">Lớp</p>
                                                    <button type="button" onClick={() => navigate(`/school/students/classes/${selectedReport.classGroupId}`)} className="mt-1 text-left text-lg font-extrabold text-gray-900 hover:text-[#2563EB]">
                                                        {selectedReport.className}
                                                    </button>
                                                </div>
                                                <div className="rounded-[8px] bg-[#F8FAFC] p-4">
                                                    <p className="text-sm font-semibold text-[#6b7280]">Loại báo cáo</p>
                                                    <p className="mt-1 text-lg font-extrabold text-gray-900">{formatReportType(selectedReport.reportType)}</p>
                                                </div>
                                            </div>

                                            <div className="mt-4 rounded-[8px] bg-[#EFF6FF] p-4">
                                                <p className="text-sm font-semibold text-[#6b7280]">Nội dung giáo viên gửi</p>
                                                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#334155]">{selectedReport.content}</p>
                                            </div>

                                            <div className="mt-4 rounded-[8px] bg-[#F8FAFC] p-4 text-sm font-semibold text-[#4c5769]">
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
                                                        className={`mt-2 w-full rounded-[8px] border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none ${SCHOOL_THEME.primaryFocus}`}
                                                    />
                                                </label>
                                            </div>

                                            <div className="mt-5 flex flex-wrap gap-3">
                                                <button type="button" onClick={handleReviewSubmit} disabled={submitting || selectedReport.status === "Reviewed"} className={SCHOOL_THEME.primaryButton}>
                                                    {selectedReport.status === "Reviewed" ? "Đã được đánh dấu" : submitting ? "Đang lưu..." : "Đánh dấu đã xem"}
                                                </button>
                                                <button type="button" onClick={() => navigate(`/school/students/classes/${selectedReport.classGroupId}`)} className="nb-btn nb-btn-outline text-sm hover:border-blue-200 hover:text-[#2563EB]">
                                                    Mở chi tiết lớp
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {fetchingReports ? (
                                    <div className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/90 px-3 py-1.5 text-xs font-bold text-[#2563EB] shadow-soft-sm backdrop-blur">
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Đang tải
                                    </div>
                                ) : null}
                            </section>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};
