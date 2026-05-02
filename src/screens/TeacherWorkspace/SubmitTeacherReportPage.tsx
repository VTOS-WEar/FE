import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getTeacherClassesOverview, submitTeacherReport } from "../../lib/api/teachers";
import { TeacherWorkspaceShell } from "./TeacherWorkspaceShell";
import { TeacherHero, TEACHER_THEME } from "./teacherWorkspace";

export const SubmitTeacherReportPage = (): JSX.Element => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [classOptions, setClassOptions] = useState<{ id: string; className: string }[]>([]);
    const [classGroupId, setClassGroupId] = useState(searchParams.get("classGroupId") || "");
    const [reportType, setReportType] = useState("General");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getTeacherClassesOverview()
            .then((overview) => {
                const options = overview.classes.map((item) => ({ id: item.id, className: item.className }));
                setClassOptions(options);
                if (!classGroupId && options.length > 0) {
                    setClassGroupId(options[0].id);
                }
            })
            .catch((err: unknown) => setError(err instanceof Error ? err.message : "Không thể tải danh sách lớp"))
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = async () => {
        setError(null);

        if (!classGroupId) {
            setError("Vui lòng chọn lớp cần báo cáo.");
            return;
        }

        if (title.trim().length < 5) {
            setError("Tiêu đề báo cáo phải dài ít nhất 5 ký tự.");
            return;
        }

        if (content.trim().length < 10) {
            setError("Nội dung báo cáo phải dài ít nhất 10 ký tự.");
            return;
        }

        try {
            setSaving(true);
            await submitTeacherReport({
                classGroupId,
                reportType,
                title,
                content,
            });
            navigate("/teacher/reports", { replace: true });
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Không thể gửi báo cáo");
        } finally {
            setSaving(false);
        }
    };

    return (
        <TeacherWorkspaceShell breadcrumbs={[{ label: "Teacher workspace", href: "/teacher/dashboard" }, { label: "Báo cáo", href: "/teacher/reports" }, { label: "Tạo báo cáo" }]}>
            <TeacherHero
                eyebrow="BÁO CÁO"
                title="Gửi báo cáo cho nhà trường"
                description="Ghi rõ vấn đề của lớp, mức độ ảnh hưởng, và thông tin nhà trường cần xem để xử lý nhanh hơn."
            />

            {loading && (
                <section className={`${TEACHER_THEME.panel} mt-6 p-10 text-center`}>
                    <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#059669]" />
                    <p className="text-sm font-semibold text-[#4c5769]">Đang tải dữ liệu lớp...</p>
                </section>
            )}

            {!loading && (
                <section className={`${TEACHER_THEME.panel} mt-6 p-6`}>
                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="text-sm font-semibold text-[#4c5769]">
                            Lớp
                            <select value={classGroupId} onChange={(e) => setClassGroupId(e.target.value)} className={`${TEACHER_THEME.input} mt-2`}>
                                <option value="">Chọn lớp</option>
                                {classOptions.map((item) => (
                                    <option key={item.id} value={item.id}>Lớp {item.className}</option>
                                ))}
                            </select>
                        </label>
                        <label className="text-sm font-semibold text-[#4c5769]">
                            Loại báo cáo
                            <select value={reportType} onChange={(e) => setReportType(e.target.value)} className={`${TEACHER_THEME.input} mt-2`}>
                                <option value="General">Tổng hợp</option>
                                <option value="OrderCoverage">Độ phủ đơn hàng</option>
                                <option value="QualityIssue">Vấn đề chất lượng</option>
                            </select>
                        </label>
                    </div>

                    <label className="mt-4 block text-sm font-semibold text-[#4c5769]">
                        Tiêu đề
                        <input value={title} onChange={(e) => setTitle(e.target.value)} className={`${TEACHER_THEME.input} mt-2`} placeholder="Ví dụ: Lớp 6A1 còn nhiều học sinh chưa đặt đồng phục" />
                    </label>

                    <label className="mt-4 block text-sm font-semibold text-[#4c5769]">
                        Nội dung
                        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={7} className={`${TEACHER_THEME.input} mt-2`} placeholder="Mô tả rõ tình hình, số học sinh ảnh hưởng, và điều cần nhà trường hỗ trợ." />
                    </label>

                    {error && (
                        <div className="mt-4 rounded-[8px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                            {error}
                        </div>
                    )}

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <button type="button" onClick={() => navigate(-1)} className="rounded-[8px] border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-900 shadow-soft-xs transition-colors hover:bg-gray-50">
                            Quay lại
                        </button>
                        <button type="button" onClick={handleSubmit} disabled={saving} className={TEACHER_THEME.primaryButton}>
                            {saving ? "Đang gửi..." : "Gửi báo cáo"}
                        </button>
                    </div>
                </section>
            )}
        </TeacherWorkspaceShell>
    );
};
