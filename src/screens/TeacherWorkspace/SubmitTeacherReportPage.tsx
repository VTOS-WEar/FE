import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getTeacherClassesOverview, submitTeacherReport } from "../../lib/api/teachers";
import { TeacherWorkspaceShell } from "./TeacherWorkspaceShell";

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
            <section className="rounded-[28px] border border-emerald-200 bg-[linear-gradient(135deg,_#ffffff_0%,_#f4fffb_48%,_#eef6ff_100%)] p-6 shadow-soft-lg">
                <h1 className="text-[30px] font-extrabold leading-tight text-gray-900 lg:text-[38px]">Gửi báo cáo cho nhà trường</h1>
                <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-[#4c5769] lg:text-base">
                    Ghi rõ vấn đề của lớp, mức độ ảnh hưởng, và thông tin cần nhà trường cần xem để xử lý nhanh hơn.
                </p>
            </section>

            {loading && (
                <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-soft-md">
                    <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-emerald-600" />
                    <p className="text-sm font-semibold text-[#4c5769]">Đang tải dữ liệu lớp...</p>
                </section>
            )}

            {!loading && (
                <section className="mt-6 rounded-[24px] border border-gray-200 bg-white p-6 shadow-soft-md">
                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="text-sm font-semibold text-[#4c5769]">
                            Lớp
                            <select value={classGroupId} onChange={(e) => setClassGroupId(e.target.value)} className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-900 outline-none focus:border-emerald-300">
                                <option value="">Chọn lớp</option>
                                {classOptions.map((item) => (
                                    <option key={item.id} value={item.id}>Lớp {item.className}</option>
                                ))}
                            </select>
                        </label>
                        <label className="text-sm font-semibold text-[#4c5769]">
                            Loại báo cáo
                            <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-900 outline-none focus:border-emerald-300">
                                <option value="General">Tổng hợp</option>
                                <option value="OrderCoverage">Độ phủ đơn hàng</option>
                                <option value="QualityIssue">Vấn đề chất lượng</option>
                            </select>
                        </label>
                    </div>

                    <label className="mt-4 block text-sm font-semibold text-[#4c5769]">
                        Tiêu đề
                        <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-900 outline-none focus:border-emerald-300" placeholder="Ví dụ: Lớp 6A1 còn nhiều học sinh chưa đặt đồng phục" />
                    </label>

                    <label className="mt-4 block text-sm font-semibold text-[#4c5769]">
                        Nội dung
                        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={7} className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-900 outline-none focus:border-emerald-300" placeholder="Mô tả rõ tình hình, số học sinh ảnh hưởng, và điều cần nhà trường hỗ trợ." />
                    </label>

                    {error && (
                        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <button type="button" onClick={() => navigate(-1)} className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-900 shadow-soft-sm transition-all hover:-translate-y-0.5">
                            Quay lại
                        </button>
                        <button type="button" onClick={handleSubmit} disabled={saving} className="rounded-2xl border border-emerald-200 bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-soft-sm transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60">
                            {saving ? "Đang gửi..." : "Gửi báo cáo"}
                        </button>
                    </div>
                </section>
            )}
        </TeacherWorkspaceShell>
    );
};
