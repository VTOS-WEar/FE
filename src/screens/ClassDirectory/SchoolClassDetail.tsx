import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ClipboardList, Pencil, Plus, Ruler, Trash2, Upload, UserRound, Users, X } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../../components/ui/breadcrumb";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useSidebarConfig } from "../../hooks/useSidebarConfig";
import {
    createStudent,
    deleteStudent,
    getSchoolClassDetail,
    getSchoolProfile,
    getStudentById,
    updateStudent,
    type ClassGroupDetailDto,
    type CreateOrUpdateStudentRequest,
    type StudentDetailDto,
} from "../../lib/api/schools";

function StudentBadge({ ok, yesText, noText }: { ok: boolean; yesText: string; noText: string }) {
    return (
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
            {ok ? yesText : noText}
        </span>
    );
}

type ClassStudentFormData = {
    fullName: string;
    dateOfBirth: string;
    gender: string;
    parentPhone: string;
};

const EMPTY_STUDENT_FORM: ClassStudentFormData = {
    fullName: "",
    dateOfBirth: "",
    gender: "Nam",
    parentPhone: "",
};

function AddStudentModal({
    isOpen,
    className,
    isLoading,
    initialData,
    isEditing = false,
    isParentLinked = false,
    onClose,
    onSave,
}: {
    isOpen: boolean;
    className: string;
    isLoading: boolean;
    initialData?: ClassStudentFormData;
    isEditing?: boolean;
    isParentLinked?: boolean;
    onClose: () => void;
    onSave: (data: Omit<CreateOrUpdateStudentRequest, "classGroupId" | "grade">) => void;
}) {
    const [form, setForm] = useState<ClassStudentFormData>(EMPTY_STUDENT_FORM);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            setForm(initialData ?? EMPTY_STUDENT_FORM);
            setErrors({});
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const validate = () => {
        const nextErrors: Record<string, string> = {};
        if (!form.fullName.trim()) nextErrors.fullName = "Vui lòng nhập họ và tên";
        if (form.parentPhone && !/^0\d{9}$/.test(form.parentPhone)) nextErrors.parentPhone = "SĐT phải bắt đầu bằng 0 và có đúng 10 số";
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!validate()) return;

        onSave({
            fullName: form.fullName.trim(),
            dateOfBirth: form.dateOfBirth || undefined,
            gender: form.gender || undefined,
            parentPhone: form.parentPhone || undefined,
        });
    };

    const inputClass = "w-full nb-input text-sm text-[#1a1a2e]";
    const labelClass = "mb-1.5 block text-sm font-semibold text-[#1a1a2e]";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative mx-4 max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-md border border-gray-200 bg-white shadow-soft-md">
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">Lớp {className}</p>
                        <h2 className="mt-1 text-xl font-bold text-[#1a1a2e]">{isEditing ? "Chỉnh sửa học sinh" : "Thêm học sinh"}</h2>
                    </div>
                    <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 hover:bg-[#FFF5EB]">
                        <X className="h-4 w-4 text-gray-900" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
                    <div>
                        <label className={labelClass}>Họ và tên <span className="text-red-500">*</span></label>
                        <input type="text" required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} placeholder="Nhập họ và tên học sinh" className={inputClass} />
                        {errors.fullName && <p className="mt-1 text-xs font-medium text-red-500">{errors.fullName}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Ngày sinh</label>
                            <input type="date" value={form.dateOfBirth} onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Giới tính</label>
                            <select value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })} className="w-full nb-select text-sm">
                                <option value="Nam">Nam</option>
                                <option value="Nữ">Nữ</option>
                                <option value="Other">Khác</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>SĐT Phụ huynh</label>
                        <input type="tel" maxLength={10} value={form.parentPhone} onChange={(event) => setForm({ ...form, parentPhone: event.target.value.replace(/\D/g, "").slice(0, 10) })} placeholder="0901234567" disabled={isEditing && isParentLinked} className={`${inputClass} ${isEditing && isParentLinked ? "cursor-not-allowed bg-gray-100 text-gray-400" : ""}`} />
                        {errors.parentPhone && <p className="mt-1 text-xs font-medium text-red-500">{errors.parentPhone}</p>}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="nb-btn nb-btn-outline text-sm">Hủy</button>
                        <button type="submit" disabled={isLoading || !form.fullName.trim()} className="nb-btn nb-btn-purple text-sm disabled:opacity-50">
                            {isLoading ? "Đang lưu..." : isEditing ? "Cập nhật" : "Thêm học sinh"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function EditStudentModal({
    isOpen,
    className,
    initialData,
    isLoading,
    isParentLinked,
    onClose,
    onSave,
}: {
    isOpen: boolean;
    className: string;
    initialData: ClassStudentFormData;
    isLoading: boolean;
    isParentLinked: boolean;
    onClose: () => void;
    onSave: (data: Omit<CreateOrUpdateStudentRequest, "classGroupId" | "grade">) => void;
}) {
    return (
        <AddStudentModal
            isOpen={isOpen}
            className={className}
            isLoading={isLoading}
            initialData={initialData}
            isEditing
            isParentLinked={isParentLinked}
            onClose={onClose}
            onSave={onSave}
        />
    );
}

function DeleteConfirmDialog({
    isOpen,
    isLoading,
    studentName,
    onClose,
    onConfirm,
}: {
    isOpen: boolean;
    isLoading: boolean;
    studentName: string;
    onClose: () => void;
    onConfirm: () => void;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative mx-4 w-full max-w-[420px] rounded-md border border-gray-200 bg-white p-6 text-center shadow-soft-md">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-red-100 bg-red-50 text-red-500">
                    <Trash2 className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold text-[#1a1a2e]">Xóa học sinh?</h3>
                <p className="mt-2 text-sm font-medium text-[#6b7280]">
                    Bạn có chắc muốn xóa <span className="font-bold text-[#1a1a2e]">{studentName}</span>? Hành động này không thể hoàn tác.
                </p>
                <div className="mt-6 flex gap-3">
                    <button type="button" onClick={onClose} className="nb-btn nb-btn-outline flex-1 text-sm">Hủy</button>
                    <button type="button" onClick={onConfirm} disabled={isLoading} className="nb-btn nb-btn-red flex-1 text-sm disabled:opacity-50">
                        {isLoading ? "Đang xóa..." : "Xóa"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export const SchoolClassDetail = (): JSX.Element => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const sidebarConfig = useSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [schoolName, setSchoolName] = useState("");
    const [detail, setDetail] = useState<ClassGroupDetailDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddStudentModal, setShowAddStudentModal] = useState(false);
    const [addStudentLoading, setAddStudentLoading] = useState(false);
    const [editingStudent, setEditingStudent] = useState<StudentDetailDto | null>(null);
    const [editStudentLoading, setEditStudentLoading] = useState(false);
    const [editStudentInitialData, setEditStudentInitialData] = useState<ClassStudentFormData>(EMPTY_STUDENT_FORM);
    const [deletingStudent, setDeletingStudent] = useState<{ id: string; name: string } | null>(null);
    const [deleteStudentLoading, setDeleteStudentLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const showToast = (message: string, type: "success" | "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const loadClassDetail = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const data = await getSchoolClassDetail(id);
            setDetail(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Không thể tải chi tiết lớp");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        getSchoolProfile().then((profile) => setSchoolName(profile.schoolName || "")).catch(() => {});
        void loadClassDetail();
    }, [loadClassDetail]);

    const handleCreateStudent = async (data: Omit<CreateOrUpdateStudentRequest, "classGroupId" | "grade">) => {
        if (!detail) return;
        setAddStudentLoading(true);
        try {
            await createStudent({
                ...data,
                classGroupId: detail.id,
                grade: detail.className,
            });
            setShowAddStudentModal(false);
            showToast("Thêm học sinh thành công!", "success");
            await loadClassDetail();
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : "Có lỗi xảy ra", "error");
        } finally {
            setAddStudentLoading(false);
        }
    };

    const closeEditStudentModal = () => {
        setEditingStudent(null);
        setEditStudentInitialData(EMPTY_STUDENT_FORM);
    };

    const handleOpenEditStudent = async (studentId: string) => {
        setEditStudentLoading(true);
        try {
            const student = await getStudentById(studentId);
            setEditingStudent(student);
            setEditStudentInitialData({
                fullName: student.fullName,
                dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split("T")[0] : "",
                gender: student.gender === "Male" ? "Nam" : student.gender === "Female" ? "Nữ" : student.gender,
                parentPhone: student.parentPhone || "",
            });
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : "Không thể tải thông tin học sinh", "error");
        } finally {
            setEditStudentLoading(false);
        }
    };

    const handleUpdateStudent = async (data: Omit<CreateOrUpdateStudentRequest, "classGroupId" | "grade">) => {
        if (!detail || !editingStudent) return;
        setEditStudentLoading(true);
        try {
            await updateStudent(editingStudent.id, {
                ...data,
                classGroupId: detail.id,
                grade: detail.className,
            });
            closeEditStudentModal();
            showToast("Cập nhật học sinh thành công!", "success");
            await loadClassDetail();
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : "Có lỗi xảy ra", "error");
        } finally {
            setEditStudentLoading(false);
        }
    };

    const handleConfirmDeleteStudent = async () => {
        if (!deletingStudent) return;
        setDeleteStudentLoading(true);
        try {
            await deleteStudent(deletingStudent.id);
            setDeletingStudent(null);
            showToast("Xóa học sinh thành công!", "success");
            await loadClassDetail();
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : "Có lỗi xảy ra", "error");
        } finally {
            setDeleteStudentLoading(false);
        }
    };

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} name={schoolName} isCollapsed={isCollapsed} onToggle={toggle} />
                </div>
                <div className="flex-1 flex min-w-0 flex-col">
                    <TopNavBar>
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem><BreadcrumbLink href="/school/dashboard" className="font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                                <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                                <BreadcrumbItem><BreadcrumbLink href="/school/students" className="font-semibold text-[#4c5769] text-base">Học sinh theo lớp</BreadcrumbLink></BreadcrumbItem>
                                <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                                <BreadcrumbItem><BreadcrumbPage className="font-bold text-gray-900 text-base">{detail?.className || "Chi tiết lớp"}</BreadcrumbPage></BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </TopNavBar>

                    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        <button type="button" onClick={() => navigate("/school/students")} className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-violet-700 hover:text-violet-900">
                            <ArrowLeft className="h-4 w-4" />
                            Quay lại sơ đồ lớp
                        </button>

                        {loading && (
                            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-soft-md">
                                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-violet-600" />
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
                                <section className="rounded-[28px] border border-sky-200 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.16),_transparent_35%),linear-gradient(135deg,_#ffffff_10%,_#f9fdff_55%,_#f6f2ff_100%)] p-6 shadow-soft-lg">
                                    <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                                        <div>
                                             <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-sky-700">{detail.academicYear}</p>
                                             <h1 className="mt-2 text-[30px] font-extrabold leading-tight text-gray-900 lg:text-[38px]">Lớp {detail.className}</h1>
                                         </div>
                                        <div className="flex flex-wrap gap-3">
                                            <button type="button" onClick={() => setShowAddStudentModal(true)} className="nb-btn nb-btn-purple text-sm">
                                                <Plus className="h-4 w-4" />
                                                Thêm học sinh
                                            </button>
                                            <button type="button" onClick={() => navigate("/school/students/import")} className="nb-btn nb-btn-outline text-sm">
                                                <Upload className="h-4 w-4" />
                                                Nhập từ Excel
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-6 grid gap-4 md:grid-cols-4">
                                        <div className="rounded-2xl border border-violet-200 bg-white/80 p-4">
                                            <p className="text-sm font-semibold text-[#6b7280]">Học sinh</p>
                                            <p className="mt-2 text-3xl font-extrabold text-gray-900">{detail.studentCount}</p>
                                        </div>
                                        <div className="rounded-2xl border border-sky-200 bg-white/80 p-4">
                                            <p className="text-sm font-semibold text-[#6b7280]">Đo áo đầy đủ</p>
                                            <p className="mt-2 text-3xl font-extrabold text-gray-900">{detail.measurementReadyCount}</p>
                                        </div>
                                        <div className="rounded-2xl border border-emerald-200 bg-white/80 p-4">
                                            <p className="text-sm font-semibold text-[#6b7280]">Phụ huynh liên kết</p>
                                            <p className="mt-2 text-3xl font-extrabold text-gray-900">{detail.parentLinkedCount}</p>
                                        </div>
                                        <div className="rounded-2xl border border-amber-200 bg-white/80 p-4">
                                            <p className="text-sm font-semibold text-[#6b7280]">GVCN</p>
                                            <p className="mt-2 text-lg font-extrabold text-gray-900">{detail.homeroomTeacher?.fullName || "Chưa gán"}</p>
                                        </div>
                                    </div>
                                </section>

                                <section className="mt-6 grid gap-4 xl:grid-cols-[1.3fr_2.2fr]">
                                    <div className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-soft-md">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-2xl bg-violet-50 p-3 text-violet-700"><UserRound className="h-5 w-5" /></div>
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">Giáo viên chủ nhiệm</p>
                                                <h2 className="text-xl font-extrabold text-gray-900">{detail.homeroomTeacher?.fullName || "Chưa cập nhật"}</h2>
                                            </div>
                                        </div>
                                        <div className="mt-5 rounded-2xl bg-[#faf7ff] p-4 text-sm">
                                            <p className="font-semibold text-[#6b7280]">Email</p>
                                            <p className="mt-1 font-bold text-gray-900">{detail.homeroomTeacher?.email || "Chưa có email"}</p>
                                        </div>
                                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                            <div className="rounded-2xl bg-[#eef7ff] p-4">
                                                <p className="text-sm font-semibold text-[#6b7280]">Khối</p>
                                                <p className="mt-1 text-xl font-extrabold text-gray-900">{detail.grade}</p>
                                            </div>
                                            <div className="rounded-2xl bg-[#fff8eb] p-4">
                                                <p className="text-sm font-semibold text-[#6b7280]">Trường</p>
                                                <p className="mt-1 text-base font-extrabold text-gray-900">{detail.schoolName}</p>
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <button type="button" onClick={() => navigate(`/school/teacher-reports?classGroupId=${detail.id}`)} className="nb-btn nb-btn-outline text-sm">
                                                <ClipboardList className="h-4 w-4" />
                                                Xem báo cáo giáo viên
                                            </button>
                                        </div>
                                    </div>

                                    <div className="rounded-[24px] border border-gray-200 bg-white shadow-soft-md">
                                        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">Danh sách học sinh</p>
                                                <h2 className="text-xl font-extrabold text-gray-900">{detail.students.length} học sinh trong lớp</h2>
                                            </div>
                                            <div className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-[#4c5769]">
                                                {detail.className}
                                            </div>
                                        </div>

                                        <div className="divide-y divide-gray-100">
                                            {detail.students.map((student) => (
                                                <div key={student.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[1.3fr_0.8fr_0.9fr_1fr_auto] lg:items-center">
                                                    <div>
                                                        <p className="text-base font-bold text-gray-900">{student.fullName}</p>
                                                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#6b7280]">{student.studentCode || "Không có mã học sinh"}</p>
                                                    </div>
                                                    <div className="text-sm font-semibold text-[#4c5769]">
                                                        <p>{student.gender === "Male" ? "Nam" : student.gender === "Female" ? "Nữ" : student.gender}</p>
                                                        <p className="mt-1 text-xs">{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString("vi-VN") : "Chưa có ngày sinh"}</p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        <StudentBadge ok={student.hasMeasurements} yesText="Đã đo áo" noText="Thiếu đo áo" />
                                                        <StudentBadge ok={student.isParentLinked} yesText="Đã liên kết PH" noText="Chưa liên kết" />
                                                    </div>
                                                    <div className="text-sm font-semibold text-[#4c5769]">
                                                        <div className="flex items-center gap-2">
                                                            <Users className="h-4 w-4 text-violet-600" />
                                                            <span>{student.parentName || "Chưa có phụ huynh"}</span>
                                                        </div>
                                                        <div className="mt-2 flex items-center gap-2">
                                                            <Ruler className="h-4 w-4 text-sky-600" />
                                                            <span>{student.parentPhone || "Chưa có số điện thoại"}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 lg:justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() => void handleOpenEditStudent(student.id)}
                                                            title="Chỉnh sửa"
                                                            className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-transparent transition-all hover:border-violet-600 hover:bg-violet-50"
                                                        >
                                                            <Pencil className="h-4 w-4 text-violet-600" />
                                                        </button>
                                                        {student.isParentLinked ? (
                                                            <span
                                                                title="Không thể xóa học sinh đã liên kết phụ huynh"
                                                                className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-lg opacity-30"
                                                            >
                                                                <Trash2 className="h-4 w-4 text-gray-400" />
                                                            </span>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => setDeletingStudent({ id: student.id, name: student.fullName })}
                                                                title="Xóa"
                                                                className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-transparent transition-all hover:border-red-500 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="h-4 w-4 text-red-500" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </section>
                            </>
                        )}
                    </main>
                </div>
            </div>

            {detail && (
                <AddStudentModal
                    isOpen={showAddStudentModal}
                    className={detail.className}
                    isLoading={addStudentLoading}
                    onClose={() => setShowAddStudentModal(false)}
                    onSave={handleCreateStudent}
                />
            )}

            {detail && editingStudent && (
                <EditStudentModal
                    isOpen={!!editingStudent}
                    className={detail.className}
                    initialData={editStudentInitialData}
                    isLoading={editStudentLoading}
                    isParentLinked={editingStudent.isParentLinked}
                    onClose={closeEditStudentModal}
                    onSave={handleUpdateStudent}
                />
            )}

            <DeleteConfirmDialog
                isOpen={!!deletingStudent}
                isLoading={deleteStudentLoading}
                studentName={deletingStudent?.name || ""}
                onClose={() => setDeletingStudent(null)}
                onConfirm={handleConfirmDeleteStudent}
            />

            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 rounded-md border border-gray-200 px-5 py-3.5 text-sm font-bold text-white shadow-soft-md ${toast.type === "success" ? "bg-[#10b981]" : "bg-[#ef4444]"}`}>
                    {toast.message}
                </div>
            )}
        </div>
    );
};

