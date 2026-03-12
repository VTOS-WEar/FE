import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { DashboardSidebar } from "../../components/layout";
import { useSidebarConfig } from "../../hooks/useSidebarConfig";
import { Button } from "../../components/ui/button";
import {
    getSchoolProfile,
    getSchoolStudents,
    createStudent,
    updateStudent,
    deleteStudent,
    getStudentById,
    getSchoolGrades,
} from "../../lib/api/schools";
import type { StudentListItem, CreateOrUpdateStudentRequest, StudentDetailDto } from "../../lib/api/schools";



/* ────────────────────────────────────────────────────────────────────── */
/* Student Form Modal                                                    */
/* ────────────────────────────────────────────────────────────────────── */
type StudentFormData = {
    fullName: string;
    dateOfBirth: string;
    grade: string;
    gender: string;
    parentPhone: string;
    heightCm: string;
    weightKg: string;
};

const EMPTY_FORM: StudentFormData = {
    fullName: "",
    dateOfBirth: "",
    grade: "",
    gender: "Nam",
    parentPhone: "",
    heightCm: "",
    weightKg: "",
};

function StudentFormModal({
    isOpen,
    onClose,
    onSave,
    initialData,
    isEditing,
    isLoading,
    availableGrades,
    isParentLinked,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CreateOrUpdateStudentRequest) => void;
    initialData: StudentFormData;
    isEditing: boolean;
    isLoading: boolean;
    availableGrades: string[];
    isParentLinked?: boolean;
}) {
    const [form, setForm] = useState<StudentFormData>(EMPTY_FORM);

    useEffect(() => {
        if (isOpen) setForm(initialData);
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            fullName: form.fullName.trim(),
            dateOfBirth: form.dateOfBirth || undefined,
            grade: form.grade || undefined,
            gender: form.gender || undefined,
            parentPhone: form.parentPhone || undefined,
            heightCm: form.heightCm ? parseInt(form.heightCm) : undefined,
            weightKg: form.weightKg ? parseFloat(form.weightKg) : undefined,
        });
    };

    const inputClass =
        "w-full bg-[#f8f9fb] border border-[#cbcad7] rounded-[10px] px-3 py-2.5 [font-family:'Montserrat',Helvetica] font-medium text-sm text-[#1a1a2e] outline-none focus:border-[#6938ef] focus:ring-1 focus:ring-[#6938ef]/20 transition-colors";
    const labelClass = "[font-family:'Montserrat',Helvetica] font-semibold text-[#1a1a2e] text-sm mb-1.5 block";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[560px] mx-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#f0f0f5]">
                    <h2 className="[font-family:'Montserrat',Helvetica] font-bold text-[#1a1a2e] text-xl">
                        {isEditing ? "Chỉnh sửa học sinh" : "Thêm học sinh mới"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f0f0f5] transition-colors"
                    >
                        <svg className="w-5 h-5 text-[#97a3b6]" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    {/* Full Name */}
                    <div>
                        <label className={labelClass}>
                            Họ và tên <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={form.fullName}
                            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                            placeholder="Nhập họ và tên học sinh"
                            className={inputClass}
                        />
                    </div>

                    {/* DOB + Gender row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Ngày sinh</label>
                            <input
                                type="date"
                                value={form.dateOfBirth}
                                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Giới tính</label>
                            <select
                                value={form.gender}
                                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                                className={inputClass}
                            >
                                <option value="Nam">Nam</option>
                                <option value="Nữ">Nữ</option>
                                <option value="Other">Khác</option>
                            </select>
                        </div>
                    </div>

                    {/* Grade + Parent Phone */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Lớp</label>
                            <input
                                type="text"
                                list="grade-options"
                                value={form.grade}
                                onChange={(e) => setForm({ ...form, grade: e.target.value })}
                                placeholder="Chọn hoặc nhập lớp mới"
                                className={inputClass}
                                autoComplete="off"
                            />
                            <datalist id="grade-options">
                                {availableGrades.map((g) => (
                                    <option key={g} value={g} />
                                ))}
                            </datalist>
                        </div>
                        <div>
                            <label className={labelClass}>SĐT Phụ huynh</label>
                            <div className="relative">
                                <input
                                    type="tel"
                                    value={form.parentPhone}
                                    onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
                                    placeholder="0901234567"
                                    disabled={isEditing && isParentLinked}
                                    className={`${inputClass} ${isEditing && isParentLinked
                                        ? "bg-gray-100 cursor-not-allowed text-gray-400 border-gray-200 pr-8"
                                        : ""
                                    }`}
                                />
                                {isEditing && isParentLinked && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1" title="Học sinh đã được liên kết với phụ huynh, không thể thay đổi số điện thoại">
                                        <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            {isEditing && isParentLinked && (
                                <p className="mt-1 text-xs text-amber-600 [font-family:'Montserrat',Helvetica] font-medium">
                                    🔒 Học sinh đã liên kết phụ huynh — không thể thay đổi SĐT
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Height + Weight */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Chiều cao (cm)</label>
                            <input
                                type="number"
                                min="0"
                                max="250"
                                value={form.heightCm}
                                onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
                                placeholder="VD: 140"
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Cân nặng (kg)</label>
                            <input
                                type="number"
                                min="0"
                                max="200"
                                step="0.1"
                                value={form.weightKg}
                                onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
                                placeholder="VD: 35.5"
                                className={inputClass}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="border-[#cbcad7] rounded-[10px] [font-family:'Montserrat',Helvetica] font-semibold text-sm px-5 py-2.5 h-auto"
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || !form.fullName.trim()}
                            className="bg-[#6938ef] hover:bg-[#5a2dd6] text-white rounded-[10px] [font-family:'Montserrat',Helvetica] font-semibold text-sm px-5 py-2.5 h-auto shadow-[0_2px_6px_rgba(105,56,239,0.3)] disabled:opacity-50"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Đang lưu...
                                </span>
                            ) : isEditing ? (
                                "Cập nhật"
                            ) : (
                                "Thêm học sinh"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Delete Confirm Dialog                                                 */
/* ────────────────────────────────────────────────────────────────────── */
function DeleteConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    studentName,
    isLoading,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    studentName: string;
    isLoading: boolean;
}) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[420px] mx-4 p-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
                        <svg className="w-7 h-7 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                        </svg>
                    </div>
                    <h3 className="[font-family:'Montserrat',Helvetica] font-bold text-[#1a1a2e] text-lg mb-2">
                        Xóa học sinh?
                    </h3>
                    <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#97a3b6] text-sm mb-6">
                        Bạn có chắc muốn xóa <span className="font-semibold text-[#1a1a2e]">{studentName}</span>? Hành
                        động này không thể hoàn tác.
                    </p>
                    <div className="flex items-center gap-3 w-full">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 border-[#cbcad7] rounded-[10px] [font-family:'Montserrat',Helvetica] font-semibold text-sm h-auto py-2.5"
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-[10px] [font-family:'Montserrat',Helvetica] font-semibold text-sm h-auto py-2.5"
                        >
                            {isLoading ? "Đang xóa..." : "Xóa"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Main StudentList Component                                            */
/* ────────────────────────────────────────────────────────────────────── */
export const StudentListV2 = (): JSX.Element => {
    const navigate = useNavigate();
    const sidebarConfig = useSidebarConfig();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [schoolName, setSchoolName] = useState("");

    /* ── Data state ── */
    const [students, setStudents] = useState<StudentListItem[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /* ── Filters ── */
    const [search, setSearch] = useState("");
    const [gradeFilter, setGradeFilter] = useState("all");
    const [measurementFilter, setMeasurementFilter] = useState("all");
    const [parentFilter, setParentFilter] = useState("all");
    const [showGradeDropdown, setShowGradeDropdown] = useState(false);
    const [showMeasurementDropdown, setShowMeasurementDropdown] = useState(false);
    const [showParentDropdown, setShowParentDropdown] = useState(false);

    /* ── Pagination ── */
    const [page, setPage] = useState(1);
    const pageSize = 20;

    /* ── CRUD Modal state ── */
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState<StudentDetailDto | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [formInitialData, setFormInitialData] = useState<StudentFormData>(EMPTY_FORM);
    const [editingIsParentLinked, setEditingIsParentLinked] = useState(false);

    /* ── Delete state ── */
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deletingStudent, setDeletingStudent] = useState<{ id: string; name: string } | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    /* ── Toast ── */
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    /* ── Available grades for combobox ── */
    const [availableGrades, setAvailableGrades] = useState<string[]>([]);

    const showToast = (message: string, type: "success" | "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        getSchoolProfile()
            .then((p) => setSchoolName(p.schoolName || ""))
            .catch(() => {});
        // Fetch available grades for combobox & filter
        getSchoolGrades()
            .then(setAvailableGrades)
            .catch(() => {});
    }, []);

    /* ── Fetch students ── */
    const fetchStudents = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getSchoolStudents({
                page,
                pageSize,
                search: search || undefined,
                grade: gradeFilter !== "all" ? gradeFilter : undefined,
                measurementStatus: measurementFilter !== "all" ? measurementFilter : undefined,
                parentLinkStatus: parentFilter !== "all" ? parentFilter : undefined,
            });
            setStudents(result.items);
            setTotalCount(result.totalCount);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Không thể tải danh sách học sinh";
            setError(msg);
            setStudents([]);
            setTotalCount(0);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, search, gradeFilter, measurementFilter, parentFilter]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    /* ── Debounced search ── */
    const [searchInput, setSearchInput] = useState("");
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    /* ── Derive unique grades from data ── */
    const grades = useMemo(() => [...new Set(students.map((s) => s.grade).filter(Boolean))], [students]);

    /* ── Handlers ── */
    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    /* ── CRUD handlers ── */
    const handleOpenCreate = () => {
        setEditingStudent(null);
        setFormInitialData(EMPTY_FORM);
        setEditingIsParentLinked(false);
        setShowFormModal(true);
    };

    const handleOpenEdit = async (studentId: string) => {
        try {
            setFormLoading(true);
            setShowFormModal(true);
            const detail = await getStudentById(studentId);
            setEditingStudent(detail);
            setEditingIsParentLinked(detail.isParentLinked);
            setFormInitialData({
                fullName: detail.fullName,
                dateOfBirth: detail.dateOfBirth ? detail.dateOfBirth.split("T")[0] : "",
                grade: detail.grade,
                gender:
                    detail.gender === "Male" ? "Nam" : detail.gender === "Female" ? "Nữ" : detail.gender,
                parentPhone: detail.parentPhone || "",
                heightCm: detail.heightCm > 0 ? String(detail.heightCm) : "",
                weightKg: detail.weightKg > 0 ? String(detail.weightKg) : "",
            });
        } catch {
            showToast("Không thể tải thông tin học sinh", "error");
            setShowFormModal(false);
        } finally {
            setFormLoading(false);
        }
    };

    const handleSave = async (data: CreateOrUpdateStudentRequest) => {
        setFormLoading(true);
        try {
            if (editingStudent) {
                await updateStudent(editingStudent.id, data);
                showToast("Cập nhật học sinh thành công!", "success");
            } else {
                await createStudent(data);
                showToast("Thêm học sinh thành công!", "success");
            }
            setShowFormModal(false);
            setEditingStudent(null);
            fetchStudents();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Có lỗi xảy ra";
            showToast(msg, "error");
        } finally {
            setFormLoading(false);
        }
    };

    const handleOpenDelete = (id: string, name: string) => {
        setDeletingStudent({ id, name });
        setShowDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingStudent) return;
        setDeleteLoading(true);
        try {
            await deleteStudent(deletingStudent.id);
            showToast("Xóa học sinh thành công!", "success");
            setShowDeleteDialog(false);
            setDeletingStudent(null);
            fetchStudents();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Có lỗi xảy ra";
            showToast(msg, "error");
        } finally {
            setDeleteLoading(false);
        }
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    /* ── Render ── */
    return (
        <div className="bg-[#f6f7f8] w-full min-h-screen flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                {/* Sidebar */}
                <div
                    className={`${isCollapsed ? "lg:w-16" : "lg:w-[20rem] xl:w-[23.75rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}
                >
                    <DashboardSidebar
                        {...sidebarConfig}
                        name={schoolName}
                        isCollapsed={isCollapsed}
                        onToggle={() => setIsCollapsed((prev) => !prev)}
                        onLogout={handleLogout}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Breadcrumb header */}
                    <div className="bg-white border-b border-[#cbcad7] px-4 sm:px-6 lg:px-10 py-5">
                        <Breadcrumb>
                            <BreadcrumbList className="gap-2.5">
                                <BreadcrumbItem>
                                    <BreadcrumbLink className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4c5769] text-base">
                                        Trang chủ
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="[font-family:'Montserrat',Helvetica] font-semibold text-[#cbcad7] text-base">
                                    /
                                </BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="[font-family:'Montserrat',Helvetica] font-semibold text-black text-base">
                                        Danh sách học sinh
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>

                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6">
                        {/* Page header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="[font-family:'Montserrat',Helvetica] font-bold text-black text-[28px] lg:text-[32px] leading-[1.22]">
                                    Danh sách học sinh
                                </h1>
                                <p className="mt-1 [font-family:'Montserrat',Helvetica] font-medium text-[#4c5769] text-sm lg:text-base">
                                    Quản lý thông tin học sinh, số đo ảo và tài khoản phụ huynh.
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={() => navigate("/school/students/import")}
                                    variant="outline"
                                    className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] border-[#cbcad7] rounded-[10px] [font-family:'Montserrat',Helvetica] font-semibold text-black text-sm gap-2 px-4 py-2.5 h-auto whitespace-nowrap"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zm-6-3.5l-4-4h2.5V10h3v2.5H16l-4 4z" />
                                    </svg>
                                    Nhập từ Excel
                                </Button>
                                <Button
                                    onClick={handleOpenCreate}
                                    className="bg-[#6938ef] hover:bg-[#5a2dd6] text-white rounded-[10px] [font-family:'Montserrat',Helvetica] font-semibold text-sm gap-2 px-4 py-2.5 h-auto whitespace-nowrap shadow-[0_2px_6px_rgba(105,56,239,0.3)]"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                                    </svg>
                                    Thêm học sinh mới
                                </Button>
                            </div>
                        </div>

                        {/* Search & Filters */}
                        <div className="bg-white border border-[#cbcad7] rounded-[10px] p-4 space-y-4">
                            {/* Search bar */}
                            <div className="flex items-center gap-2.5 bg-[#f8f9fb] border border-[#cbcad7] rounded-[10px] px-3 py-2.5">
                                <svg className="w-5 h-5 text-[#97a3b6] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                                </svg>
                                <input
                                    type="text"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    placeholder="Tìm kiếm theo tên, mã học sinh hoặc lớp..."
                                    className="flex-1 bg-transparent outline-none [font-family:'Montserrat',Helvetica] font-medium text-sm text-[#4c5769] placeholder:text-[#97a3b6]"
                                />
                            </div>

                            {/* Filter chips */}
                            <div className="flex flex-wrap items-center gap-3">
                                {/* Lớp filter */}
                                <div className="relative">
                                    <button
                                        onClick={() => { setShowGradeDropdown(!showGradeDropdown); setShowMeasurementDropdown(false); setShowParentDropdown(false); }}
                                        className="flex items-center gap-2 bg-[#f8f9fb] border border-[#cbcad7] rounded-[10px] px-3 py-2 [font-family:'Montserrat',Helvetica] font-medium text-sm text-[#4c5769]"
                                    >
                                        <span className="text-[#97a3b6]">Lớp:</span>
                                        <span>{gradeFilter === "all" ? "Tất cả" : gradeFilter}</span>
                                        <svg className={`w-4 h-4 text-[#97a3b6] transition-transform ${showGradeDropdown ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z" /></svg>
                                    </button>
                                    {showGradeDropdown && (
                                        <div className="absolute top-full mt-1 left-0 bg-white border border-[#cbcad7] rounded-[10px] shadow-lg z-10 py-1 min-w-[120px]">
                                            <button onClick={() => { setGradeFilter("all"); setShowGradeDropdown(false); setPage(1); }}
                                                className={`w-full text-left px-3 py-2 text-sm [font-family:'Montserrat',Helvetica] hover:bg-[#f0f4ff] ${gradeFilter === "all" ? "text-[#478aea] font-semibold" : "text-[#4c5769]"}`}>Tất cả</button>
                                            {grades.map((g) => (
                                                <button key={g} onClick={() => { setGradeFilter(g); setShowGradeDropdown(false); setPage(1); }}
                                                    className={`w-full text-left px-3 py-2 text-sm [font-family:'Montserrat',Helvetica] hover:bg-[#f0f4ff] ${gradeFilter === g ? "text-[#478aea] font-semibold" : "text-[#4c5769]"}`}>{g}</button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Đo ảo filter */}
                                <div className="relative">
                                    <button
                                        onClick={() => { setShowMeasurementDropdown(!showMeasurementDropdown); setShowGradeDropdown(false); setShowParentDropdown(false); }}
                                        className="flex items-center gap-2 bg-[#f8f9fb] border border-[#cbcad7] rounded-[10px] px-3 py-2 [font-family:'Montserrat',Helvetica] font-medium text-sm text-[#4c5769]"
                                    >
                                        <span className="text-[#97a3b6]">Đo ảo:</span>
                                        <span>{measurementFilter === "all" ? "Tất cả" : measurementFilter === "updated" ? "Đã cập nhật" : "Thiếu số đo"}</span>
                                        <svg className={`w-4 h-4 text-[#97a3b6] transition-transform ${showMeasurementDropdown ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z" /></svg>
                                    </button>
                                    {showMeasurementDropdown && (
                                        <div className="absolute top-full mt-1 left-0 bg-white border border-[#cbcad7] rounded-[10px] shadow-lg z-10 py-1 min-w-[150px]">
                                            {[{ value: "all", label: "Tất cả" }, { value: "updated", label: "Đã cập nhật" }, { value: "missing", label: "Thiếu số đo" }].map((opt) => (
                                                <button key={opt.value} onClick={() => { setMeasurementFilter(opt.value); setShowMeasurementDropdown(false); setPage(1); }}
                                                    className={`w-full text-left px-3 py-2 text-sm [font-family:'Montserrat',Helvetica] hover:bg-[#f0f4ff] ${measurementFilter === opt.value ? "text-[#478aea] font-semibold" : "text-[#4c5769]"}`}>{opt.label}</button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Liên kết PH filter */}
                                <div className="relative">
                                    <button
                                        onClick={() => { setShowParentDropdown(!showParentDropdown); setShowGradeDropdown(false); setShowMeasurementDropdown(false); }}
                                        className="flex items-center gap-2 bg-[#f8f9fb] border border-[#cbcad7] rounded-[10px] px-3 py-2 [font-family:'Montserrat',Helvetica] font-medium text-sm text-[#4c5769]"
                                    >
                                        <span className="text-[#97a3b6]">Liên kết PH:</span>
                                        <span>{parentFilter === "all" ? "Tất cả" : parentFilter === "linked" ? "Đã liên kết" : "Chưa liên kết"}</span>
                                        <svg className={`w-4 h-4 text-[#97a3b6] transition-transform ${showParentDropdown ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z" /></svg>
                                    </button>
                                    {showParentDropdown && (
                                        <div className="absolute top-full mt-1 left-0 bg-white border border-[#cbcad7] rounded-[10px] shadow-lg z-10 py-1 min-w-[160px]">
                                            {[{ value: "all", label: "Tất cả" }, { value: "linked", label: "Đã liên kết" }, { value: "unlinked", label: "Chưa liên kết" }].map((opt) => (
                                                <button key={opt.value} onClick={() => { setParentFilter(opt.value); setShowParentDropdown(false); setPage(1); }}
                                                    className={`w-full text-left px-3 py-2 text-sm [font-family:'Montserrat',Helvetica] hover:bg-[#f0f4ff] ${parentFilter === opt.value ? "text-[#478aea] font-semibold" : "text-[#4c5769]"}`}>{opt.label}</button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Student table */}
                        <div className="bg-white border border-[#cbcad7] rounded-[10px] overflow-hidden">
                            {/* Table header */}
                            <div className="bg-[#f8f9fb] border-b border-[#cbcad7] rounded-t-[10px]">
                                <div className="hidden lg:grid grid-cols-[2fr_0.8fr_0.7fr_1.2fr_1.8fr_60px] items-center px-6 py-4 gap-4">
                                    <span className="[font-family:'Montserrat',Helvetica] font-bold text-black text-sm">Học sinh</span>
                                    <span className="[font-family:'Montserrat',Helvetica] font-bold text-black text-sm">Lớp</span>
                                    <span className="[font-family:'Montserrat',Helvetica] font-bold text-black text-sm">Giới Tính</span>
                                    <span className="[font-family:'Montserrat',Helvetica] font-bold text-black text-sm">Trạng thái</span>
                                    <span className="[font-family:'Montserrat',Helvetica] font-bold text-black text-sm">Phụ Huynh</span>
                                    <span className="[font-family:'Montserrat',Helvetica] font-bold text-black text-sm text-center">Thao tác</span>
                                </div>
                            </div>

                            {/* Loading */}
                            {loading && (
                                <div className="px-6 py-12 text-center">
                                    <div className="w-8 h-8 border-4 border-[#cbcad7] border-t-[#6938ef] rounded-full animate-spin mx-auto mb-3" />
                                    <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#97a3b6] text-sm">Đang tải danh sách học sinh...</p>
                                </div>
                            )}

                            {/* Error */}
                            {!loading && error && (
                                <div className="px-6 py-12 text-center">
                                    <svg className="w-16 h-16 text-[#ef4444] mx-auto mb-3" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                                    </svg>
                                    <p className="[font-family:'Montserrat',Helvetica] font-semibold text-[#ef4444] text-base mb-2">{error}</p>
                                    <button onClick={fetchStudents} className="[font-family:'Montserrat',Helvetica] font-semibold text-[#478aea] text-sm hover:underline">Thử lại</button>
                                </div>
                            )}

                            {/* Empty */}
                            {!loading && !error && students.length === 0 && (
                                <div className="px-6 py-12 text-center">
                                    <svg className="w-16 h-16 text-[#cbcad7] mx-auto mb-3" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                                    </svg>
                                    <p className="[font-family:'Montserrat',Helvetica] font-semibold text-[#97a3b6] text-base">Chưa có học sinh nào</p>
                                    <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#cbcad7] text-sm mt-1">Nhập dữ liệu từ Excel hoặc thêm thủ công</p>
                                    <div className="flex items-center justify-center gap-3 mt-4">
                                        <Button onClick={() => navigate("/school/students/import")} variant="outline" className="border-[#cbcad7] rounded-[10px] [font-family:'Montserrat',Helvetica] font-semibold text-sm">Nhập từ Excel</Button>
                                        <Button onClick={handleOpenCreate} className="bg-[#6938ef] hover:bg-[#5a2dd6] text-white rounded-[10px] [font-family:'Montserrat',Helvetica] font-semibold text-sm">Thêm học sinh</Button>
                                    </div>
                                </div>
                            )}

                            {/* Rows */}
                            {!loading && !error && students.length > 0 && (
                                <div className="divide-y divide-[#f0f0f5]">
                                    {students.map((student) => (
                                        <div key={student.id} className="grid grid-cols-1 lg:grid-cols-[2fr_0.8fr_0.7fr_1.2fr_1.8fr_60px] items-center px-6 py-4 gap-4 hover:bg-[#fafbfc] transition-colors">

                                            {/* Student info */}
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-[#e8eaed] flex items-center justify-center flex-shrink-0">
                                                    <span className="[font-family:'Montserrat',Helvetica] font-bold text-[#4c5769] text-sm">
                                                        {student.fullName.charAt(student.fullName.lastIndexOf(" ") + 1)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="[font-family:'Montserrat',Helvetica] font-semibold text-[#1a1a2e] text-sm">{student.fullName}</p>
                                                    {student.studentCode && <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#97a3b6] text-xs">MS: {student.studentCode}</p>}
                                                </div>
                                            </div>

                                            {/* Grade */}
                                            <div>
                                                <span className="inline-block bg-[#EBF5FF] rounded-[10px] px-3 py-1 [font-family:'Montserrat',Helvetica] font-semibold text-black text-xs">{student.grade || "—"}</span>
                                            </div>

                                            {/* Gender */}
                                            <span className="[font-family:'Montserrat',Helvetica] font-medium text-black text-sm">
                                                {student.gender === "Male" ? "Nam" : student.gender === "Female" ? "Nữ" : student.gender}
                                            </span>

                                            {/* Measurement status */}
                                            <div>
                                                {student.hasMeasurements ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <svg className="w-5 h-5 text-[#10b981]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                                                        <span className="[font-family:'Montserrat',Helvetica] font-semibold text-black text-sm">Đã cập nhật</span>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <svg className="w-5 h-5 text-[#f59e0b]" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" /></svg>
                                                            <span className="[font-family:'Montserrat',Helvetica] font-semibold text-black text-sm">Thiếu số đo</span>
                                                        </div>
                                                        <p className="mt-0.5 [font-family:'Montserrat',Helvetica] font-medium text-[#97a3b6] text-xs ml-[26px]">Cần cập nhật</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Parent */}
                                            <div>
                                                {student.isParentLinked ? (
                                                    <div>
                                                        <p className="[font-family:'Montserrat',Helvetica] font-semibold text-black text-sm">{student.parentName || "—"}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            {student.parentPhone && <span className="[font-family:'Montserrat',Helvetica] font-medium text-[#97a3b6] text-xs">{student.parentPhone}</span>}
                                                            <span className="inline-flex items-center px-2 py-0.5 bg-[#EBF5FF] border border-[#90CAF9] rounded-[5px] [font-family:'Montserrat',Helvetica] font-semibold text-[#478aea] text-[10px]">Đã liên kết</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <p className="[font-family:'Montserrat',Helvetica] font-medium text-black text-sm opacity-60">Chưa liên kết</p>
                                                        <button className="[font-family:'Montserrat',Helvetica] font-semibold text-[#478aea] text-xs mt-0.5">Gửi lời mời +</button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => handleOpenEdit(student.id)}
                                                    title="Chỉnh sửa"
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f0f4ff] transition-colors"
                                                >
                                                    <svg className="w-4 h-4 text-[#478aea]" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.996.996 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleOpenDelete(student.id, student.fullName)}
                                                    title="Xóa"
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors"
                                                >
                                                    <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between">
                            <p className="[font-family:'Montserrat',Helvetica] font-medium text-[#97a3b6] text-sm">
                                Hiển thị {students.length} / {totalCount} học sinh
                            </p>
                            {totalPages > 1 && (
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                                        className="px-3 py-1.5 rounded-lg border border-[#cbcad7] text-sm [font-family:'Montserrat',Helvetica] font-medium disabled:opacity-40 hover:bg-[#f0f4ff] transition-colors">←</button>
                                    <span className="[font-family:'Montserrat',Helvetica] font-medium text-[#4c5769] text-sm">Trang {page} / {totalPages}</span>
                                    <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                                        className="px-3 py-1.5 rounded-lg border border-[#cbcad7] text-sm [font-family:'Montserrat',Helvetica] font-medium disabled:opacity-40 hover:bg-[#f0f4ff] transition-colors">→</button>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>


            {/* ── Modals ── */}
            <StudentFormModal
                isOpen={showFormModal}
                onClose={() => { setShowFormModal(false); setEditingStudent(null); }}
                onSave={handleSave}
                initialData={formInitialData}
                isEditing={!!editingStudent}
                isLoading={formLoading}
                availableGrades={availableGrades}
                isParentLinked={editingIsParentLinked}
            />

            <DeleteConfirmDialog
                isOpen={showDeleteDialog}
                onClose={() => { setShowDeleteDialog(false); setDeletingStudent(null); }}
                onConfirm={handleConfirmDelete}
                studentName={deletingStudent?.name || ""}
                isLoading={deleteLoading}
            />

            {/* ── Toast notification ── */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 ${toast.type === "success" ? "bg-[#10b981] text-white" : "bg-[#ef4444] text-white"}`}>
                    {toast.type === "success" ? (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                    ) : (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
                    )}
                    <span className="[font-family:'Montserrat',Helvetica] font-semibold text-sm">{toast.message}</span>
                </div>
            )}
        </div>
    );
};
