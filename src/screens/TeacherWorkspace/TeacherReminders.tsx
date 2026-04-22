import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BellRing, Send } from "lucide-react";
import {
    getTeacherClassesOverview,
    getTeacherReminderCandidates,
    sendTeacherReminder,
    type TeacherReminderCandidateDto,
    type TeacherReminderCandidatesResponseDto,
} from "../../lib/api/teachers";
import { TeacherWorkspaceShell } from "./TeacherWorkspaceShell";

export const TeacherReminders = (): JSX.Element => {
    const [searchParams] = useSearchParams();
    const [classOptions, setClassOptions] = useState<{ id: string; className: string }[]>([]);
    const [classGroupId, setClassGroupId] = useState(searchParams.get("classGroupId") || "");
    const [data, setData] = useState<TeacherReminderCandidatesResponseDto | null>(null);
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(true);
    const [sendingParentId, setSendingParentId] = useState<string | null>(null);
    const [sendingAll, setSendingAll] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        getTeacherClassesOverview()
            .then((overview) => {
                const options = overview.classes.map((item) => ({ id: item.id, className: item.className }));
                setClassOptions(options);
                if (!classGroupId && options.length > 0) {
                    setClassGroupId(options[0].id);
                } else {
                    setLoading(false);
                }
            })
            .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : "Không thể tải danh sách lớp");
                setLoading(false);
            });
    }, []);

    const loadCandidates = async (targetClassGroupId: string) => {
        if (!targetClassGroupId) return;

        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const response = await getTeacherReminderCandidates(targetClassGroupId);
            setData(response);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Không thể tải danh sách phụ huynh cần nhắc");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!classGroupId) return;
        void loadCandidates(classGroupId);
    }, [classGroupId]);

    const pendingParentIds = useMemo(() => data?.items.map((item) => item.parentUserId) || [], [data]);

    const handleSend = async (parentUserIds?: string[]) => {
        if (!classGroupId) return;

        setError(null);
        setSuccess(null);
        if (parentUserIds && parentUserIds.length === 1) {
            setSendingParentId(parentUserIds[0]);
        } else {
            setSendingAll(true);
        }

        try {
            const response = await sendTeacherReminder({
                classGroupId,
                parentUserIds,
                note: note.trim() || undefined,
            });
            setSuccess(`Đã gửi ${response.sentCount} nhắc nhở cho phụ huynh lớp ${response.className}.`);
            await loadCandidates(classGroupId);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Không thể gửi nhắc nhở");
        } finally {
            setSendingParentId(null);
            setSendingAll(false);
        }
    };

    return (
        <TeacherWorkspaceShell breadcrumbs={[{ label: "Teacher workspace", href: "/teacher/dashboard" }, { label: "Nhắc phụ huynh" }]}>
            <section className="rounded-[28px] border border-amber-200 bg-[linear-gradient(135deg,_#fffef8_0%,_#ffffff_48%,_#fff8eb_100%)] p-6 shadow-soft-lg">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
                            <BellRing className="h-4 w-4" />
                            Reminder workspace
                        </div>
                        <h1 className="mt-4 text-[30px] font-extrabold leading-tight text-gray-900 lg:text-[38px]">Nhắc phụ huynh chưa đặt hàng</h1>
                        <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-[#4c5769] lg:text-base">
                            Xem các phụ huynh trong lớp chưa hoàn tất đặt đồng phục, gửi nhắc riêng hoặc gửi hàng loạt để không bỏ sót học sinh cần theo dõi.
                        </p>
                    </div>
                    <label className="text-sm font-semibold text-[#4c5769]">
                        Lớp
                        <select value={classGroupId} onChange={(event) => setClassGroupId(event.target.value)} className="mt-2 w-full min-w-[220px] rounded-2xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-900 outline-none focus:border-amber-300">
                            {classOptions.length === 0 && <option value="">Chưa có lớp</option>}
                            {classOptions.map((item) => (
                                <option key={item.id} value={item.id}>Lớp {item.className}</option>
                            ))}
                        </select>
                    </label>
                </div>
            </section>

            <section className="mt-6 rounded-[24px] border border-gray-200 bg-white p-5 shadow-soft-md">
                <label className="text-sm font-semibold text-[#4c5769]">
                    Ghi chú thêm
                    <textarea
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        rows={4}
                        placeholder="Ví dụ: Nhà trường đang cần chốt số liệu đồng phục trong tuần này..."
                        className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none focus:border-amber-300"
                    />
                </label>

                <div className="mt-4 flex flex-wrap gap-3">
                    <button type="button" onClick={() => void handleSend(pendingParentIds)} disabled={sendingAll || pendingParentIds.length === 0 || !classGroupId} className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-500 px-4 py-3 text-sm font-bold text-white shadow-soft-sm transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60">
                        <Send className="h-4 w-4" />
                        {sendingAll ? "Đang gửi..." : "Gửi nhắc hàng loạt"}
                    </button>
                    {data && (
                        <div className="rounded-2xl bg-[#fff8eb] px-4 py-3 text-sm font-semibold text-[#6b7280]">
                            {data.totalPendingParents} phụ huynh, {data.totalPendingStudents} học sinh đang chờ đặt hàng
                        </div>
                    )}
                </div>

                {success && (
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                        {success}
                    </div>
                )}

                {error && (
                    <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                        {error}
                    </div>
                )}
            </section>

            {loading && (
                <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-soft-md">
                    <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-amber-600" />
                    <p className="text-sm font-semibold text-[#4c5769]">Đang tải danh sách phụ huynh cần nhắc...</p>
                </section>
            )}

            {!loading && data && (
                <section className="mt-6 rounded-[24px] border border-gray-200 bg-white shadow-soft-md">
                    <div className="divide-y divide-gray-100">
                        {data.items.length === 0 && (
                            <div className="px-5 py-10 text-center text-sm font-semibold text-[#4c5769]">
                                Lớp này hiện không còn phụ huynh nào cần nhắc thêm.
                            </div>
                        )}
                        {data.items.map((item: TeacherReminderCandidateDto) => (
                            <div key={item.parentUserId} className="px-5 py-5">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-lg font-extrabold text-gray-900">{item.parentName}</h2>
                                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                                                {item.pendingStudents.length} học sinh chưa đặt
                                            </span>
                                        </div>
                                        <p className="mt-2 text-sm font-semibold text-[#4c5769]">{item.parentEmail}{item.parentPhone ? ` • ${item.parentPhone}` : ""}</p>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {item.pendingStudents.map((student) => (
                                                <span key={student.childId} className="rounded-full bg-[#fff8eb] px-3 py-1 text-xs font-bold text-[#92400e]">
                                                    {student.childName}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => void handleSend([item.parentUserId])} disabled={sendingParentId === item.parentUserId} className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-bold text-gray-900 shadow-soft-sm transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60">
                                        <Send className="h-4 w-4 text-amber-700" />
                                        {sendingParentId === item.parentUserId ? "Đang gửi..." : "Gửi riêng"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </TeacherWorkspaceShell>
    );
};
