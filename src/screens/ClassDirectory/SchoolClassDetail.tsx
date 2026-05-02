import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ClipboardList, Pencil, Plus, Ruler, Search, Trash2, Upload, UserRound, Users, X } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../../components/ui/breadcrumb";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { SCHOOL_THEME } from "../../constants/schoolTheme";
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

const MIN_FILTER_FEEDBACK_MS = 700;
const STUDENT_PAGE_SIZE = 5;

function StudentBadge({ ok, yesText, noText }: { ok: boolean; yesText: string; noText: string }) {
    return (
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
            {ok ? yesText : noText}
        </span>
    );
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
                        <p className={`text-xs font-bold uppercase tracking-[0.16em] ${SCHOOL_THEME.primaryText}`}>Lớp {className}</p>
                        <h2 className="mt-1 text-xl font-bold text-[#1a1a2e]">{isEditing ? "Chỉnh sửa học sinh" : "Thêm học sinh"}</h2>
                    </div>
                    <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-gray-200 transition-colors hover:border-blue-200 hover:bg-blue-50">
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
                        <button type="submit" disabled={isLoading || !form.fullName.trim()} className={`${SCHOOL_THEME.primaryButton} disabled:opacity-50`}>
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
    const [studentSearchInput, setStudentSearchInput] = useState("");
    const [studentSearch, setStudentSearch] = useState("");
    const [filteringStudents, setFilteringStudents] = useState(false);
    const [studentPage, setStudentPage] = useState(1);
    const studentFilterTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

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

    useEffect(() => {
        return () => {
            if (studentFilterTimerRef.current) {
                window.clearTimeout(studentFilterTimerRef.current);
            }
        };
    }, []);

    const scheduleStudentSearchCommit = useCallback((nextSearch: string) => {
        setFilteringStudents(true);

        if (studentFilterTimerRef.current) {
            window.clearTimeout(studentFilterTimerRef.current);
        }

        studentFilterTimerRef.current = window.setTimeout(() => {
            setStudentSearch(nextSearch);
            setStudentPage(1);
            setFilteringStudents(false);
            studentFilterTimerRef.current = null;
        }, MIN_FILTER_FEEDBACK_MS);
    }, []);

    const clearStudentSearch = () => {
        if (studentFilterTimerRef.current) {
            window.clearTimeout(studentFilterTimerRef.current);
            studentFilterTimerRef.current = null;
        }
        setStudentSearchInput("");
        setStudentSearch("");
        setStudentPage(1);
        setFilteringStudents(false);
    };

    const scheduleStudentPageCommit = useCallback((nextPage: number) => {
        setFilteringStudents(true);

        if (studentFilterTimerRef.current) {
            window.clearTimeout(studentFilterTimerRef.current);
        }

        studentFilterTimerRef.current = window.setTimeout(() => {
            setStudentPage(nextPage);
            setFilteringStudents(false);
            studentFilterTimerRef.current = null;
        }, MIN_FILTER_FEEDBACK_MS);
    }, []);

    const filteredStudents = useMemo(() => {
        if (!detail) return [];

        const query = studentSearch.trim().toLowerCase();
        if (!query) return detail.students;

        return detail.students.filter((student) => {
            const genderLabel = student.gender === "Male" ? "Nam" : student.gender === "Female" ? "Nữ" : student.gender;
            const searchable = [
                student.fullName,
                student.studentCode || "",
                genderLabel || "",
                student.parentName || "",
                student.parentPhone || "",
                student.hasMeasurements ? "Đã đo áo" : "Thiếu đo áo",
                student.isParentLinked ? "Đã liên kết PH" : "Chưa liên kết",
            ].join(" ").toLowerCase();

            return searchable.includes(query);
        });
    }, [detail, studentSearch]);

    const hasStudentSearch = studentSearch.trim().length > 0;
    const totalStudentPages = Math.max(1, Math.ceil(filteredStudents.length / STUDENT_PAGE_SIZE));
    const paginatedStudents = useMemo(() => {
        const start = (studentPage - 1) * STUDENT_PAGE_SIZE;
        return filteredStudents.slice(start, start + STUDENT_PAGE_SIZE);
    }, [filteredStudents, studentPage]);
    const studentPageStart = filteredStudents.length === 0 ? 0 : (studentPage - 1) * STUDENT_PAGE_SIZE + 1;
    const studentPageEnd = Math.min(studentPage * STUDENT_PAGE_SIZE, filteredStudents.length);

    useEffect(() => {
        if (studentPage > totalStudentPages) {
            setStudentPage(totalStudentPages);
        }
    }, [studentPage, totalStudentPages]);

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

                    <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        <button type="button" onClick={() => navigate("/school/students")} className={`inline-flex items-center gap-2 text-sm font-bold ${SCHOOL_THEME.primaryText} hover:text-[#1D4ED8]`}>
                            <ArrowLeft className="h-4 w-4" />
                            Quay lại sơ đồ lớp
                        </button>

                        {loading && (
                            <div className="rounded-[8px] border border-gray-200 bg-white p-10 text-center shadow-soft-sm">
                                <div className={`mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 ${SCHOOL_THEME.spinner}`} />
                                <p className="text-sm font-semibold text-[#4c5769]">Đang tải thông tin lớp...</p>
                            </div>
                        )}

                        {!loading && error && (
                            <div className="rounded-[8px] border border-red-200 bg-white p-8 text-center shadow-soft-sm">
                                <p className="text-base font-bold text-red-600">{error}</p>
                            </div>
                        )}

                        {!loading && !error && detail && (
                            <>
                                <section className="space-y-5">
                                    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                                        <div>
                                             <p className={`text-xs font-bold uppercase tracking-[0.16em] ${SCHOOL_THEME.primaryText}`}>{detail.academicYear}</p>
                                             <h1 className="mt-1 text-2xl font-bold leading-tight text-slate-950">Lớp {detail.className}</h1>
                                         </div>
                                        <div className="flex flex-wrap gap-3">
                                            <button type="button" onClick={() => setShowAddStudentModal(true)} className={SCHOOL_THEME.primaryButton}>
                                                <Plus className="h-4 w-4" />
                                                Thêm học sinh
                                            </button>
                                            <button type="button" onClick={() => navigate("/school/students/import")} className="nb-btn nb-btn-outline text-sm">
                                                <Upload className="h-4 w-4" />
                                                Nhập từ Excel
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                        <SummaryCard label="Học sinh" value={detail.studentCount} icon={<Users className="h-5 w-5" />} surfaceClassName={SCHOOL_THEME.summary.school} />
                                        <SummaryCard label="Đo áo đầy đủ" value={detail.measurementReadyCount} icon={<Ruler className="h-5 w-5" />} surfaceClassName={SCHOOL_THEME.summary.cyan} />
                                        <SummaryCard label="Phụ huynh liên kết" value={detail.parentLinkedCount} icon={<Users className="h-5 w-5" />} surfaceClassName={SCHOOL_THEME.summary.mint} />
                                        <SummaryCard label="GVCN" value={detail.homeroomTeacher?.fullName || "Chưa gán"} icon={<UserRound className="h-5 w-5" />} surfaceClassName={SCHOOL_THEME.summary.slate} />
                                    </div>
                                </section>

                                <section className="grid items-start gap-4 xl:grid-cols-[1.3fr_2.2fr]">
                                    <div className="self-start rounded-[8px] border border-gray-200 bg-white p-5 shadow-soft-sm">
                                        <div className="flex items-center gap-3">
                                            <div className={`rounded-[8px] ${SCHOOL_THEME.primarySoftBg} p-3 ${SCHOOL_THEME.primaryText}`}><UserRound className="h-5 w-5" /></div>
                                            <div>
                                                <p className={`text-xs font-bold uppercase tracking-[0.16em] ${SCHOOL_THEME.primaryText}`}>Giáo viên chủ nhiệm</p>
                                                <h2 className="text-xl font-bold text-gray-900">{detail.homeroomTeacher?.fullName || "Chưa cập nhật"}</h2>
                                            </div>
                                        </div>
                                        <div className="mt-5 rounded-[8px] bg-blue-50 p-4 text-sm">
                                            <p className="font-semibold text-[#6b7280]">Email</p>
                                            <p className="mt-1 font-bold text-gray-900">{detail.homeroomTeacher?.email || "Chưa có email"}</p>
                                        </div>
                                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                            <div className="rounded-[8px] bg-cyan-50 p-4">
                                                <p className="text-sm font-semibold text-[#6b7280]">Khối</p>
                                                <p className="mt-1 text-xl font-bold text-gray-900">{detail.grade}</p>
                                            </div>
                                            <div className="rounded-[8px] bg-slate-50 p-4">
                                                <p className="text-sm font-semibold text-[#6b7280]">Trường</p>
                                                <p className="mt-1 text-base font-bold text-gray-900">{detail.schoolName}</p>
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <button type="button" onClick={() => navigate(`/school/teacher-reports?classGroupId=${detail.id}`)} className="nb-btn nb-btn-outline text-sm">
                                                <ClipboardList className="h-4 w-4" />
                                                Xem báo cáo giáo viên
                                            </button>
                                        </div>
                                    </div>

                                    <div className="overflow-hidden rounded-[8px] border border-gray-200 bg-white shadow-soft-sm">
                                        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                                            <div>
                                                <p className={`text-xs font-bold uppercase tracking-[0.16em] ${SCHOOL_THEME.primaryText}`}>Danh sách học sinh</p>
                                                <h2 className="text-xl font-bold text-gray-900">
                                                    {hasStudentSearch ? `${filteredStudents.length}/${detail.students.length}` : detail.students.length} học sinh trong lớp
                                                </h2>
                                            </div>
                                            <div className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-[#4c5769]">
                                                {detail.className}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                                            <label className="relative block w-full lg:max-w-[360px]">
                                                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                                <input
                                                    type="text"
                                                    value={studentSearchInput}
                                                    onChange={(event) => {
                                                        const nextSearch = event.target.value;
                                                        setStudentSearchInput(nextSearch);
                                                        scheduleStudentSearchCommit(nextSearch);
                                                    }}
                                                    placeholder="Tìm học sinh, mã, phụ huynh, SĐT..."
                                                    className="h-10 w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-800 outline-none shadow-soft-xs transition-colors placeholder:text-slate-500 focus:border-blue-200 focus:ring-4 focus:ring-blue-50"
                                                />
                                            </label>

                                            <div className="flex flex-wrap items-center gap-3">
                                                {filteringStudents ? (
                                                    <div className="inline-flex h-10 items-center gap-2 rounded-full border border-blue-100 bg-white px-3 text-xs font-bold text-[#2563EB] shadow-soft-sm">
                                                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-100 border-t-[#2563EB]" />
                                                        Đang tải
                                                    </div>
                                                ) : null}
                                                {studentSearchInput ? (
                                                    <button type="button" onClick={clearStudentSearch} className="h-10 rounded-full border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-soft-xs transition-colors hover:border-blue-200 hover:text-[#2563EB]">
                                                        Xóa lọc
                                                    </button>
                                                ) : null}
                                            </div>
                                        </div>

                                        <div className="divide-y divide-gray-100">
                                            {paginatedStudents.length > 0 ? paginatedStudents.map((student) => (
                                                <div key={student.id} className="grid gap-4 px-5 py-4 transition-colors hover:bg-blue-50/50 lg:grid-cols-[1.3fr_0.8fr_0.9fr_1fr_auto] lg:items-center">
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
                                                            <Users className={`h-4 w-4 ${SCHOOL_THEME.primaryText}`} />
                                                            <span>{student.parentName || "Chưa có phụ huynh"}</span>
                                                        </div>
                                                        <div className="mt-2 flex items-center gap-2">
                                                            <Ruler className="h-4 w-4 text-[#0E7490]" />
                                                            <span>{student.parentPhone || "Chưa có số điện thoại"}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 lg:justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() => void handleOpenEditStudent(student.id)}
                                                            title="Chỉnh sửa"
                                                            className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-transparent transition-colors hover:border-blue-200 hover:bg-blue-50"
                                                        >
                                                            <Pencil className={`h-4 w-4 ${SCHOOL_THEME.primaryText}`} />
                                                        </button>
                                                        {student.isParentLinked ? (
                                                            <span
                                                                title="Không thể xóa học sinh đã liên kết phụ huynh"
                                                                className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-[8px] opacity-30"
                                                            >
                                                                <Trash2 className="h-4 w-4 text-gray-400" />
                                                            </span>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => setDeletingStudent({ id: student.id, name: student.fullName })}
                                                                title="Xóa"
                                                                className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-transparent transition-colors hover:border-red-200 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="h-4 w-4 text-red-500" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="px-5 py-12 text-center">
                                                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-[#2563EB]">
                                                        <Search className="h-7 w-7" />
                                                    </div>
                                                    <h3 className="mt-4 text-lg font-bold text-slate-950">
                                                        {detail.students.length === 0 ? "Chưa có học sinh nào" : "Không tìm thấy học sinh phù hợp"}
                                                    </h3>
                                                    <p className="mx-auto mt-2 max-w-[420px] text-sm font-semibold text-slate-500">
                                                        {detail.students.length === 0
                                                            ? "Thêm học sinh mới hoặc nhập dữ liệu từ Excel để bắt đầu quản lý lớp."
                                                            : "Thử tìm theo tên, mã học sinh, phụ huynh, số điện thoại hoặc trạng thái đo áo."}
                                                    </p>
                                                    {detail.students.length > 0 ? (
                                                        <button type="button" onClick={clearStudentSearch} className="mt-5 h-10 rounded-[8px] border border-blue-100 bg-white px-4 text-sm font-bold text-[#2563EB] shadow-soft-xs transition-colors hover:bg-blue-50">
                                                            Xóa bộ lọc
                                                        </button>
                                                    ) : null}
                                                </div>
                                            )}
                                        </div>
                                        {filteredStudents.length > 0 && totalStudentPages > 1 ? (
                                            <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                                <p className="text-sm font-semibold text-slate-500">
                                                    Hiển thị {studentPageStart}-{studentPageEnd} / {filteredStudents.length} học sinh
                                                </p>
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        type="button"
                                                        disabled={studentPage <= 1 || filteringStudents}
                                                        onClick={() => scheduleStudentPageCommit(Math.max(1, studentPage - 1))}
                                                        className="nb-btn nb-btn-outline nb-btn-sm text-sm disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        Trước
                                                    </button>
                                                    <span className="min-w-[52px] text-center text-sm font-bold text-slate-500">
                                                        {studentPage}/{totalStudentPages}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        disabled={studentPage >= totalStudentPages || filteringStudents}
                                                        onClick={() => scheduleStudentPageCommit(Math.min(totalStudentPages, studentPage + 1))}
                                                        className="nb-btn nb-btn-outline nb-btn-sm text-sm disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        Sau
                                                    </button>
                                                </div>
                                            </div>
                                        ) : null}
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

