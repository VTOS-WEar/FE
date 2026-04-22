import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BellRing, ClipboardList, GraduationCap, Mail, MessageSquare, Ruler, ShoppingBag, Star, Users } from "lucide-react";
import {
    getTeacherClassDetail,
    getTeacherClassFeedback,
    getTeacherClassOrderCoverage,
    getTeacherReports,
    type TeacherClassFeedbackListDto,
    type TeacherClassOrderCoverageDto,
    type TeacherReportListItemDto,
} from "../../lib/api/teachers";
import type { ClassGroupDetailDto } from "../../lib/api/schools";
import { TeacherWorkspaceShell } from "../TeacherWorkspace/TeacherWorkspaceShell";

export const TeacherClassDetail = (): JSX.Element => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [detail, setDetail] = useState<ClassGroupDetailDto | null>(null);
    const [coverage, setCoverage] = useState<TeacherClassOrderCoverageDto | null>(null);
    const [feedback, setFeedback] = useState<TeacherClassFeedbackListDto | null>(null);
    const [reports, setReports] = useState<TeacherReportListItemDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        Promise.all([
            getTeacherClassDetail(id),
            getTeacherClassOrderCoverage(id),
            getTeacherClassFeedback(id, 4),
            getTeacherReports({ classGroupId: id }),
        ])
            .then(([detailData, coverageData, feedbackData, reportsData]) => {
                setDetail(detailData);
                setCoverage(coverageData);
                setFeedback(feedbackData);
                setReports(reportsData.items.slice(0, 3));
            })
            .catch((err: unknown) => setError(err instanceof Error ? err.message : "Không thể tải chi tiết lớp"))
            .finally(() => setLoading(false));
    }, [id]);

    return (
        <TeacherWorkspaceShell breadcrumbs={[{ label: "Teacher workspace", href: "/teacher/dashboard" }, { label: "Lớp chủ nhiệm", href: "/teacher/classes" }, { label: detail?.className || "Chi tiết lớp" }]}>
            <button type="button" onClick={() => navigate("/teacher/classes")} className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-900">
                <ArrowLeft className="h-4 w-4" />
                Quay lại danh sách lớp
            </button>

            {loading && (
                <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-soft-md">
                    <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-emerald-600" />
                    <p className="text-sm font-semibold text-[#4c5769]">Đang tải thông tin lớp...</p>
                </div>
            )}

            {!loading && error && (
                <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-soft-md">
                    <p className="text-base font-bold text-red-600">{error}</p>
                </div>
            )}

            {!loading && !error && detail && (
                <>
                    <section className="rounded-[28px] border border-emerald-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_36%),linear-gradient(135deg,_#ffffff_10%,_#f2fff8_55%,_#f7fbff_100%)] p-6 shadow-soft-lg">
                        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                            <div>
                                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700">{detail.schoolName}</p>
                                <h1 className="mt-2 text-[30px] font-extrabold leading-tight text-gray-900 lg:text-[38px]">Lớp {detail.className}</h1>
                                <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-[#4c5769] lg:text-base">
                                    Xem sĩ số, đo áo, liên kết phụ huynh, độ phủ đơn hàng và phản hồi gần đây của lớp trong một màn hình duy nhất.
                                </p>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="rounded-2xl border border-emerald-200 bg-white/90 px-5 py-4">
                                    <p className="text-sm font-semibold text-[#6b7280]">Học sinh</p>
                                    <p className="mt-2 text-3xl font-extrabold text-gray-900">{detail.studentCount}</p>
                                </div>
                                <div className="rounded-2xl border border-sky-200 bg-white/90 px-5 py-4">
                                    <p className="text-sm font-semibold text-[#6b7280]">Đo áo đầy đủ</p>
                                    <p className="mt-2 text-3xl font-extrabold text-gray-900">{detail.measurementReadyCount}</p>
                                </div>
                                <div className="rounded-2xl border border-amber-200 bg-white/90 px-5 py-4">
                                    <p className="text-sm font-semibold text-[#6b7280]">Đã đặt hàng</p>
                                    <p className="mt-2 text-3xl font-extrabold text-gray-900">{coverage?.studentsWithOrders ?? 0}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="mt-6 grid gap-4 xl:grid-cols-[1.05fr_1.35fr]">
                        <div className="space-y-4">
                            <div className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-soft-md">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><GraduationCap className="h-5 w-5" /></div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Giáo viên chủ nhiệm</p>
                                        <h2 className="text-xl font-extrabold text-gray-900">{detail.homeroomTeacher?.fullName || "Chưa cập nhật"}</h2>
                                    </div>
                                </div>
                                <div className="mt-5 space-y-3 rounded-2xl bg-[#f4fffb] p-4 text-sm font-semibold text-[#4c5769]">
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-emerald-600" />
                                        <span>{detail.homeroomTeacher?.email || "Chưa có email"}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-emerald-600" />
                                        <span>{detail.parentLinkedCount}/{detail.studentCount} học sinh đã liên kết phụ huynh</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Ruler className="h-4 w-4 text-sky-600" />
                                        <span>{detail.measurementReadyCount}/{detail.studentCount} học sinh đã có đo áo</span>
                                    </div>
                                </div>
                                <div className="mt-4 grid gap-3">
                                    <button type="button" onClick={() => navigate(`/teacher/reports/new?classGroupId=${detail.id}`)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm font-bold text-gray-900 shadow-soft-sm transition-all hover:-translate-y-0.5">
                                        <ClipboardList className="h-4 w-4 text-sky-700" />
                                        Tạo báo cáo
                                    </button>
                                    <button type="button" onClick={() => navigate(`/teacher/reminders?classGroupId=${detail.id}`)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-bold text-gray-900 shadow-soft-sm transition-all hover:-translate-y-0.5">
                                        <BellRing className="h-4 w-4 text-amber-700" />
                                        Nhắc phụ huynh
                                    </button>
                                    <button type="button" onClick={() => navigate(`/teacher/messages?classGroupId=${detail.id}`)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-gray-900 shadow-soft-sm transition-all hover:-translate-y-0.5">
                                        <MessageSquare className="h-4 w-4 text-emerald-700" />
                                        Mở chat lớp
                                    </button>
                                </div>
                            </div>

                            <div className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-soft-md">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-2xl bg-[#eef6ff] p-3 text-sky-700"><ShoppingBag className="h-5 w-5" /></div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">Độ phủ đơn hàng</p>
                                        <h2 className="text-xl font-extrabold text-gray-900">
                                            {coverage?.studentsWithOrders ?? 0}/{coverage?.totalStudents ?? detail.studentCount} học sinh đã đặt
                                        </h2>
                                    </div>
                                </div>
                                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-2xl bg-[#f8fbff] p-4">
                                        <p className="text-sm font-semibold text-[#6b7280]">Đang chờ</p>
                                        <p className="mt-1 text-xl font-extrabold text-gray-900">{coverage?.pendingOrders ?? 0}</p>
                                    </div>
                                    <div className="rounded-2xl bg-[#f8fbff] p-4">
                                        <p className="text-sm font-semibold text-[#6b7280]">Đang xử lý</p>
                                        <p className="mt-1 text-xl font-extrabold text-gray-900">{coverage?.activeOrders ?? 0}</p>
                                    </div>
                                    <div className="rounded-2xl bg-[#f8fbff] p-4">
                                        <p className="text-sm font-semibold text-[#6b7280]">Đã giao</p>
                                        <p className="mt-1 text-xl font-extrabold text-gray-900">{coverage?.deliveredOrders ?? 0}</p>
                                    </div>
                                    <div className="rounded-2xl bg-[#f8fbff] p-4">
                                        <p className="text-sm font-semibold text-[#6b7280]">Chưa đặt</p>
                                        <p className="mt-1 text-xl font-extrabold text-gray-900">{coverage?.studentsWithoutOrders ?? 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-[24px] border border-gray-200 bg-white shadow-soft-md">
                                <div className="border-b border-gray-200 px-5 py-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Danh sách học sinh</p>
                                    <h2 className="text-xl font-extrabold text-gray-900">Theo dõi nhanh tình trạng từng em</h2>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {detail.students.map((student) => (
                                        <div key={student.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[1.2fr_0.8fr_1.2fr_1fr] lg:items-center">
                                            <div>
                                                <p className="text-base font-bold text-gray-900">{student.fullName}</p>
                                                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#6b7280]">{student.studentCode || "Không có mã học sinh"}</p>
                                            </div>
                                            <div className="text-sm font-semibold text-[#4c5769]">
                                                <p>{student.gender === "Male" ? "Nam" : student.gender === "Female" ? "Nữ" : student.gender}</p>
                                                <p className="mt-1 text-xs">{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString("vi-VN") : "Chưa có ngày sinh"}</p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${student.hasMeasurements ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                                    {student.hasMeasurements ? "Đã đo áo" : "Thiếu đo áo"}
                                                </span>
                                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${student.isParentLinked ? "bg-sky-100 text-sky-700" : "bg-gray-100 text-gray-700"}`}>
                                                    {student.isParentLinked ? "Đã liên kết PH" : "Chưa liên kết"}
                                                </span>
                                            </div>
                                            <div className="text-sm font-semibold text-[#4c5769]">
                                                <p>{student.parentName || "Chưa có phụ huynh"}</p>
                                                <p className="mt-1 text-xs">{student.parentPhone || "Chưa có số điện thoại"}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid gap-4 xl:grid-cols-2">
                                <div className="rounded-[24px] border border-gray-200 bg-white shadow-soft-md">
                                    <div className="border-b border-gray-200 px-5 py-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">Phản hồi gần đây</p>
                                        <h2 className="text-xl font-extrabold text-gray-900">Đánh giá từ phụ huynh</h2>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {feedback && feedback.items.length === 0 && (
                                            <div className="px-5 py-8 text-sm font-semibold text-[#4c5769]">Chưa có phản hồi nào cho lớp này.</div>
                                        )}
                                        {feedback?.items.map((item) => (
                                            <div key={item.feedbackId} className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                                    <p className="text-sm font-bold text-gray-900">{item.rating}/5 • {item.studentName}</p>
                                                </div>
                                                <p className="mt-1 text-sm font-semibold text-[#4c5769]">{item.providerName || "Không rõ nhà cung cấp"}</p>
                                                <p className="mt-2 text-sm text-[#4c5769]">{item.comment || "Phụ huynh không để lại nội dung."}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-[24px] border border-gray-200 bg-white shadow-soft-md">
                                    <div className="border-b border-gray-200 px-5 py-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Báo cáo gần đây</p>
                                        <h2 className="text-xl font-extrabold text-gray-900">Lịch sử gửi nhà trường</h2>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {reports.length === 0 && (
                                            <div className="px-5 py-8 text-sm font-semibold text-[#4c5769]">Chưa có báo cáo nào cho lớp này.</div>
                                        )}
                                        {reports.map((report) => (
                                            <div key={report.id} className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-extrabold text-gray-900">{report.title}</p>
                                                    <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${report.status === "Reviewed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                                        {report.status === "Reviewed" ? "Đã xem" : "Đang chờ"}
                                                    </span>
                                                </div>
                                                <p className="mt-2 text-sm text-[#4c5769]">{report.content}</p>
                                                {report.reviewNote && (
                                                    <p className="mt-2 text-sm font-semibold text-emerald-800">Phản hồi: {report.reviewNote}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </>
            )}
        </TeacherWorkspaceShell>
    );
};
