import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
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
import { TopNavBar } from "../../components/layout/TopNavBar";
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

/* ── Types ── */
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
    fullName: "", dateOfBirth: "", grade: "", gender: "Nam",
    parentPhone: "", heightCm: "", weightKg: "",
};

/* ── Student Form Modal ── */
function StudentFormModal({
    isOpen, onClose, onSave, initialData, isEditing, isLoading, availableGrades, isParentLinked,
}: {
    isOpen: boolean; onClose: () => void; onSave: (data: CreateOrUpdateStudentRequest) => void;
    initialData: StudentFormData; isEditing: boolean; isLoading: boolean; availableGrades: string[]; isParentLinked?: boolean;
}) {
    const [form, setForm] = useState<StudentFormData>(EMPTY_FORM);
    useEffect(() => { if (isOpen) setForm(initialData); }, [isOpen, initialData]);
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

    const inputClass = "w-full nb-input text-sm text-[#1a1a2e]";
    const labelClass = "font-semibold text-[#1a1a2e] text-sm mb-1.5 block";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative bg-white border-2 border-[#1A1A2E] rounded-xl shadow-[6px_6px_0_#1A1A2E] w-full max-w-[560px] mx-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b-2 border-[#1A1A2E]">
                    <h2 className="font-bold text-[#1a1a2e] text-xl">
                        {isEditing ? "Chỉnh sửa học sinh" : "Thêm học sinh mới"}
                    </h2>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-[#1A1A2E] hover:bg-[#FFF5EB] shadow-[2px_2px_0_#1A1A2E] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all">
                        <svg className="w-4 h-4 text-[#1A1A2E]" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    <div>
                        <label className={labelClass}>Họ và tên <span className="text-red-500">*</span></label>
                        <input type="text" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Nhập họ và tên học sinh" className={inputClass} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Ngày sinh</label>
                            <input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Giới tính</label>
                            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full nb-select text-sm">
                                <option value="Nam">Nam</option>
                                <option value="Nữ">Nữ</option>
                                <option value="Other">Khác</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Lớp</label>
                            <input type="text" list="grade-options" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} placeholder="Chọn hoặc nhập lớp mới" className={inputClass} autoComplete="off" />
                            <datalist id="grade-options">{availableGrades.map((g) => <option key={g} value={g} />)}</datalist>
                        </div>
                        <div>
                            <label className={labelClass}>SĐT Phụ huynh</label>
                            <div className="relative">
                                <input type="tel" value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} placeholder="0901234567" disabled={isEditing && isParentLinked}
                                    className={`${inputClass} ${isEditing && isParentLinked ? "bg-gray-100 cursor-not-allowed text-gray-400 pr-8" : ""}`} />
                                {isEditing && isParentLinked && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2" title="Đã liên kết phụ huynh"><svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" /></svg></div>
                                )}
                            </div>
                            {isEditing && isParentLinked && <p className="mt-1 text-xs text-amber-600 font-medium">🔒 Đã liên kết phụ huynh — không thể thay đổi SĐT</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Chiều cao (cm)</label>
                            <input type="number" min="0" max="250" value={form.heightCm} onChange={(e) => setForm({ ...form, heightCm: e.target.value })} placeholder="VD: 140" className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Cân nặng (kg)</label>
                            <input type="number" min="0" max="200" step="0.1" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} placeholder="VD: 35.5" className={inputClass} />
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="nb-btn nb-btn-outline text-sm">Hủy</button>
                        <button type="submit" disabled={isLoading || !form.fullName.trim()} className="nb-btn nb-btn-purple text-sm disabled:opacity-50">
                            {isLoading ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Đang lưu...</span> : isEditing ? "Cập nhật" : "Thêm học sinh"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ── Delete Confirm Dialog ── */
function DeleteConfirmDialog({ isOpen, onClose, onConfirm, studentName, isLoading }: { isOpen: boolean; onClose: () => void; onConfirm: () => void; studentName: string; isLoading: boolean; }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative bg-white border-2 border-[#1A1A2E] rounded-xl shadow-[6px_6px_0_#1A1A2E] w-full max-w-[420px] mx-4 p-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4 border-2 border-[#1A1A2E] shadow-[3px_3px_0_#1A1A2E]">
                        <svg className="w-7 h-7 text-red-500" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></svg>
                    </div>
                    <h3 className="font-bold text-[#1a1a2e] text-lg mb-2">Xóa học sinh?</h3>
                    <p className="font-medium text-[#97a3b6] text-sm mb-6">
                        Bạn có chắc muốn xóa <span className="font-semibold text-[#1a1a2e]">{studentName}</span>? Hành động này không thể hoàn tác.
                    </p>
                    <div className="flex items-center gap-3 w-full">
                        <button onClick={onClose} className="flex-1 nb-btn nb-btn-outline text-sm">Hủy</button>
                        <button onClick={onConfirm} disabled={isLoading} className="flex-1 nb-btn nb-btn-red text-sm disabled:opacity-50">{isLoading ? "Đang xóa..." : "Xóa"}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Main Page ── */
export const StudentListV2 = (): JSX.Element => {
    const navigate = useNavigate();
    const sidebarConfig = useSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [schoolName, setSchoolName] = useState("");

    const [students, setStudents] = useState<StudentListItem[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [gradeFilter, setGradeFilter] = useState("all");
    const [measurementFilter, setMeasurementFilter] = useState("all");
    const [parentFilter, setParentFilter] = useState("all");
    const [showGradeDropdown, setShowGradeDropdown] = useState(false);
    const [showMeasurementDropdown, setShowMeasurementDropdown] = useState(false);
    const [showParentDropdown, setShowParentDropdown] = useState(false);

    const [page, setPage] = useState(1);
    const pageSize = 20;

    const [showFormModal, setShowFormModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState<StudentDetailDto | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [formInitialData, setFormInitialData] = useState<StudentFormData>(EMPTY_FORM);
    const [editingIsParentLinked, setEditingIsParentLinked] = useState(false);

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deletingStudent, setDeletingStudent] = useState<{ id: string; name: string } | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [availableGrades, setAvailableGrades] = useState<string[]>([]);

    const showToast = (message: string, type: "success" | "error") => { setToast({ message, type }); setTimeout(() => setToast(null), 3500); };

    useEffect(() => {
        getSchoolProfile().then((p) => setSchoolName(p.schoolName || "")).catch(() => {});
        getSchoolGrades().then(setAvailableGrades).catch(() => {});
    }, []);

    const fetchStudents = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const result = await getSchoolStudents({ page, pageSize, search: search || undefined, grade: gradeFilter !== "all" ? gradeFilter : undefined, measurementStatus: measurementFilter !== "all" ? measurementFilter : undefined, parentLinkStatus: parentFilter !== "all" ? parentFilter : undefined });
            setStudents(result.items); setTotalCount(result.totalCount);
        } catch (err: unknown) { setError(err instanceof Error ? err.message : "Không thể tải danh sách"); setStudents([]); setTotalCount(0); }
        finally { setLoading(false); }
    }, [page, pageSize, search, gradeFilter, measurementFilter, parentFilter]);

    useEffect(() => { fetchStudents(); }, [fetchStudents]);

    const [searchInput, setSearchInput] = useState("");
    useEffect(() => { const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400); return () => clearTimeout(t); }, [searchInput]);

    const grades = useMemo(() => [...new Set(students.map((s) => s.grade).filter(Boolean))], [students]);

    const handleLogout = () => {
        localStorage.removeItem("access_token"); localStorage.removeItem("user"); localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token"); sessionStorage.removeItem("user"); sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    const handleOpenCreate = () => { setEditingStudent(null); setFormInitialData(EMPTY_FORM); setEditingIsParentLinked(false); setShowFormModal(true); };

    const handleOpenEdit = async (studentId: string) => {
        try {
            setFormLoading(true); setShowFormModal(true);
            const detail = await getStudentById(studentId);
            setEditingStudent(detail); setEditingIsParentLinked(detail.isParentLinked);
            setFormInitialData({ fullName: detail.fullName, dateOfBirth: detail.dateOfBirth ? detail.dateOfBirth.split("T")[0] : "", grade: detail.grade, gender: detail.gender === "Male" ? "Nam" : detail.gender === "Female" ? "Nữ" : detail.gender, parentPhone: detail.parentPhone || "", heightCm: detail.heightCm > 0 ? String(detail.heightCm) : "", weightKg: detail.weightKg > 0 ? String(detail.weightKg) : "" });
        } catch { showToast("Không thể tải thông tin học sinh", "error"); setShowFormModal(false); }
        finally { setFormLoading(false); }
    };

    const handleSave = async (data: CreateOrUpdateStudentRequest) => {
        setFormLoading(true);
        try {
            if (editingStudent) { await updateStudent(editingStudent.id, data); showToast("Cập nhật thành công!", "success"); }
            else { await createStudent(data); showToast("Thêm học sinh thành công!", "success"); }
            setShowFormModal(false); setEditingStudent(null); fetchStudents();
        } catch (err: unknown) { showToast(err instanceof Error ? err.message : "Có lỗi xảy ra", "error"); }
        finally { setFormLoading(false); }
    };

    const handleOpenDelete = (id: string, name: string) => { setDeletingStudent({ id, name }); setShowDeleteDialog(true); };
    const handleConfirmDelete = async () => {
        if (!deletingStudent) return;
        setDeleteLoading(true);
        try { await deleteStudent(deletingStudent.id); showToast("Xóa thành công!", "success"); setShowDeleteDialog(false); setDeletingStudent(null); fetchStudents(); }
        catch (err: unknown) { showToast(err instanceof Error ? err.message : "Có lỗi xảy ra", "error"); }
        finally { setDeleteLoading(false); }
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    // Filter dropdown component
    const FilterDropdown = ({ label, value, options, isOpen, onToggle, onSelect }: { label: string; value: string; options: { value: string; label: string }[]; isOpen: boolean; onToggle: () => void; onSelect: (v: string) => void }) => (
        <div className="relative">
            <button onClick={onToggle} className="flex items-center gap-2 nb-input text-sm py-2 px-3">
                <span className="text-[#97a3b6]">{label}:</span>
                <span className="font-semibold">{options.find(o => o.value === value)?.label || value}</span>
                <svg className={`w-4 h-4 text-[#97a3b6] transition-transform ${isOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z" /></svg>
            </button>
            {isOpen && (
                <div className="absolute top-full mt-1 left-0 bg-white border-2 border-[#1A1A2E] rounded-lg shadow-[4px_4px_0_#1A1A2E] z-10 py-1 min-w-[140px]">
                    {options.map((opt) => (
                        <button key={opt.value} onClick={() => { onSelect(opt.value); }} className={`w-full text-left px-3 py-2 text-sm hover:bg-[#FFF5EB] transition-colors ${value === opt.value ? "text-[#6938EF] font-bold" : "text-[#4C5769]"}`}>{opt.label}</button>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} name={schoolName} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Breadcrumb */}
                    <TopNavBar>
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem><BreadcrumbLink href="/school/dashboard" className="font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                                <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                                <BreadcrumbItem><BreadcrumbPage className="font-bold text-[#1A1A2E] text-base">Danh sách học sinh</BreadcrumbPage></BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </TopNavBar>

                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="font-extrabold text-[#1A1A2E] text-[28px] lg:text-[32px] leading-tight">Danh sách học sinh 📚</h1>
                                <p className="mt-1 font-medium text-[#4c5769] text-sm lg:text-base">Quản lý thông tin học sinh, số đo ảo và tài khoản phụ huynh.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => navigate("/school/students/import")} className="nb-btn nb-btn-outline text-sm">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zm-6-3.5l-4-4h2.5V10h3v2.5H16l-4 4z" /></svg>
                                    Nhập từ Excel
                                </button>
                                <button onClick={handleOpenCreate} className="nb-btn nb-btn-purple text-sm">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
                                    Thêm học sinh
                                </button>
                            </div>
                        </div>

                        {/* Search & Filters */}
                        <div className="nb-card-static p-4 space-y-4">
                            <div className="flex items-center gap-2.5 nb-input py-2.5">
                                <svg className="w-5 h-5 text-[#97a3b6] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
                                <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Tìm kiếm theo tên, mã học sinh hoặc lớp..." className="flex-1 bg-transparent outline-none font-medium text-sm text-[#4c5769] placeholder:text-[#97a3b6]" />
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <FilterDropdown label="Lớp" value={gradeFilter} isOpen={showGradeDropdown} onToggle={() => { setShowGradeDropdown(!showGradeDropdown); setShowMeasurementDropdown(false); setShowParentDropdown(false); }} onSelect={(v) => { setGradeFilter(v); setShowGradeDropdown(false); setPage(1); }} options={[{ value: "all", label: "Tất cả" }, ...grades.map(g => ({ value: g, label: g }))]} />
                                <FilterDropdown label="Đo ảo" value={measurementFilter} isOpen={showMeasurementDropdown} onToggle={() => { setShowMeasurementDropdown(!showMeasurementDropdown); setShowGradeDropdown(false); setShowParentDropdown(false); }} onSelect={(v) => { setMeasurementFilter(v); setShowMeasurementDropdown(false); setPage(1); }} options={[{ value: "all", label: "Tất cả" }, { value: "updated", label: "Đã cập nhật" }, { value: "missing", label: "Thiếu số đo" }]} />
                                <FilterDropdown label="Liên kết PH" value={parentFilter} isOpen={showParentDropdown} onToggle={() => { setShowParentDropdown(!showParentDropdown); setShowGradeDropdown(false); setShowMeasurementDropdown(false); }} onSelect={(v) => { setParentFilter(v); setShowParentDropdown(false); setPage(1); }} options={[{ value: "all", label: "Tất cả" }, { value: "linked", label: "Đã liên kết" }, { value: "unlinked", label: "Chưa liên kết" }]} />
                            </div>
                        </div>

                        {/* Student Table */}
                        <div className="nb-card-static overflow-hidden">
                            {/* Table Header */}
                            <div className="bg-[#EDE9FE] border-b-2 border-[#1A1A2E]">
                                <div className="hidden lg:grid grid-cols-[2fr_0.8fr_0.7fr_1.2fr_1.8fr_60px] items-center px-6 py-3.5 gap-4">
                                    {["Học sinh", "Lớp", "Giới Tính", "Trạng thái", "Phụ Huynh", ""].map((h) => (
                                        <span key={h} className="font-bold text-[#1A1A2E] text-xs uppercase tracking-wider">{h}</span>
                                    ))}
                                </div>
                            </div>

                            {/* Loading */}
                            {loading && (
                                <div className="px-6 py-12 text-center">
                                    <div className="w-8 h-8 border-4 border-[#E5E7EB] border-t-[#6938ef] rounded-full animate-spin mx-auto mb-3" />
                                    <p className="font-medium text-[#97a3b6] text-sm">Đang tải danh sách học sinh...</p>
                                </div>
                            )}

                            {/* Error */}
                            {!loading && error && (
                                <div className="px-6 py-12 text-center">
                                    <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3 border-2 border-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E]">
                                        <svg className="w-7 h-7 text-red-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
                                    </div>
                                    <p className="font-bold text-[#ef4444] text-base mb-2">{error}</p>
                                    <button onClick={fetchStudents} className="nb-btn nb-btn-sm nb-btn-outline">Thử lại</button>
                                </div>
                            )}

                            {/* Empty */}
                            {!loading && !error && students.length === 0 && (
                                <div className="px-6 py-12 text-center">
                                    <div className="w-14 h-14 rounded-full bg-[#F3F4F6] flex items-center justify-center mx-auto mb-3 border-2 border-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E]">
                                        <svg className="w-7 h-7 text-[#9CA3AF]" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>
                                    </div>
                                    <p className="font-bold text-[#6B7280] text-base">Chưa có học sinh nào</p>
                                    <p className="font-medium text-[#9CA3AF] text-sm mt-1">Nhập dữ liệu từ Excel hoặc thêm thủ công</p>
                                    <div className="flex items-center justify-center gap-3 mt-4">
                                        <button onClick={() => navigate("/school/students/import")} className="nb-btn nb-btn-outline text-sm">Nhập từ Excel</button>
                                        <button onClick={handleOpenCreate} className="nb-btn nb-btn-purple text-sm">Thêm học sinh</button>
                                    </div>
                                </div>
                            )}

                            {/* Rows */}
                            {!loading && !error && students.length > 0 && (
                                <div className="divide-y divide-[#E5E7EB]">
                                    {students.map((student) => (
                                        <div key={student.id} className="grid grid-cols-1 lg:grid-cols-[2fr_0.8fr_0.7fr_1.2fr_1.8fr_60px] items-center px-6 py-4 gap-4 hover:bg-[#FFF5EB] transition-colors">
                                            {/* Name */}
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-[#EDE9FE] flex items-center justify-center flex-shrink-0 border-2 border-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E]">
                                                    <span className="font-bold text-[#6938EF] text-sm">{student.fullName.charAt(student.fullName.lastIndexOf(" ") + 1)}</span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-[#1a1a2e] text-sm">{student.fullName}</p>
                                                    {student.studentCode && <p className="font-medium text-[#97a3b6] text-xs">MS: {student.studentCode}</p>}
                                                </div>
                                            </div>
                                            {/* Grade */}
                                            <div><span className="nb-badge nb-badge-blue text-xs">{student.grade || "—"}</span></div>
                                            {/* Gender */}
                                            <span className="font-medium text-[#1A1A2E] text-sm">{student.gender === "Male" ? "Nam" : student.gender === "Female" ? "Nữ" : student.gender}</span>
                                            {/* Measurement */}
                                            <div>
                                                {student.hasMeasurements ? (
                                                    <span className="nb-badge nb-badge-green text-xs">✓ Đã cập nhật</span>
                                                ) : (
                                                    <span className="nb-badge nb-badge-yellow text-xs">⚠ Thiếu số đo</span>
                                                )}
                                            </div>
                                            {/* Parent */}
                                            <div>
                                                {student.isParentLinked ? (
                                                    <div>
                                                        <p className="font-semibold text-[#1a1a2e] text-sm">{student.parentName || "—"}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            {student.parentPhone && <span className="font-medium text-[#97a3b6] text-xs">{student.parentPhone}</span>}
                                                            <span className="nb-badge nb-badge-purple text-[10px] py-0">Đã liên kết</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <p className="font-medium text-[#1A1A2E] text-sm opacity-60">Chưa liên kết</p>
                                                        <button className="font-bold text-[#6938EF] text-xs mt-0.5 hover:underline">Gửi lời mời +</button>
                                                    </div>
                                                )}
                                            </div>
                                            {/* Actions */}
                                            <div className="flex items-center justify-center gap-1">
                                                <button onClick={() => handleOpenEdit(student.id)} title="Chỉnh sửa" className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-transparent hover:border-[#6938EF] hover:bg-[#EDE9FE] transition-all">
                                                    <svg className="w-4 h-4 text-[#6938EF]" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.996.996 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>
                                                </button>
                                                <button onClick={() => handleOpenDelete(student.id, student.fullName)} title="Xóa" className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-transparent hover:border-[#EF4444] hover:bg-[#FEE2E2] transition-all">
                                                    <svg className="w-4 h-4 text-[#EF4444]" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between">
                            <p className="font-medium text-[#97a3b6] text-sm">Hiển thị {students.length} / {totalCount} học sinh</p>
                            {totalPages > 1 && (
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="nb-btn nb-btn-sm nb-btn-outline disabled:opacity-40">←</button>
                                    <span className="font-semibold text-[#1A1A2E] text-sm">Trang {page} / {totalPages}</span>
                                    <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="nb-btn nb-btn-sm nb-btn-outline disabled:opacity-40">→</button>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>

            {/* Modals */}
            <StudentFormModal isOpen={showFormModal} onClose={() => { setShowFormModal(false); setEditingStudent(null); }} onSave={handleSave} initialData={formInitialData} isEditing={!!editingStudent} isLoading={formLoading} availableGrades={availableGrades} isParentLinked={editingIsParentLinked} />
            <DeleteConfirmDialog isOpen={showDeleteDialog} onClose={() => { setShowDeleteDialog(false); setDeletingStudent(null); }} onConfirm={handleConfirmDelete} studentName={deletingStudent?.name || ""} isLoading={deleteLoading} />

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 border-2 border-[#1A1A2E] rounded-xl shadow-[4px_4px_0_#1A1A2E] animate-in slide-in-from-bottom-4 duration-300 ${toast.type === "success" ? "bg-[#10b981] text-white" : "bg-[#ef4444] text-white"}`}>
                    {toast.type === "success" ? (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                    ) : (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
                    )}
                    <span className="font-bold text-sm">{toast.message}</span>
                </div>
            )}
        </div>
    );
};
