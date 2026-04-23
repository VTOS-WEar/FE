import { AlertTriangle, CheckCircle2, ClipboardCheck, Layers3, Plus, Save, ShieldCheck, Store, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useSidebarConfig } from "../../hooks/useSidebarConfig";
import {
    addOutfitsToSemesterPublication,
    approveSemesterPublicationProvider,
    closeSemesterPublication,
    createSemesterPublication,
    getSchoolProfile,
    getSemesterPublicationDetail,
    getSemesterPublicationOutfitSuggestions,
    getSemesterPublicationProviderSuggestions,
    publishSemesterPublication,
    removeOutfitFromSemesterPublication,
    suspendSemesterPublicationProvider,
    updateSemesterPublication,
    type ContractedOutfitSuggestionDto,
    type ContractedProviderSuggestionDto,
    type SemesterPublicationDetailDto,
} from "../../lib/api/schools";

const inputClass =
    "w-full rounded-[12px] border border-gray-200 bg-white px-4 py-3 text-[15px] font-medium text-gray-900 shadow-soft-sm outline-none transition-all placeholder:text-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50";

function formatDateTime(value: string | null | undefined) {
    if (!value) {
        return "Chưa có";
    }

    return new Date(value).toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function toDateInputValue(value: string | null | undefined) {
    if (!value) {
        return "";
    }

    return value.slice(0, 10);
}

function getStatusMeta(status: string | undefined) {
    switch (status) {
        case "Active":
            return {
                label: "Đang mở",
                badgeClass: "nb-badge nb-badge-green",
                helper: "Đợt công bố đã phát hành. Chỉ nên dùng workspace này để theo dõi và điều chỉnh phần được phép.",
            };
        case "Closed":
            return {
                label: "Đã đóng",
                badgeClass: "nb-badge nb-badge-blue",
                helper: "Đợt công bố đã khép lại. Workspace đóng vai trò hồ sơ vận hành để tra cứu lại cấu hình đã dùng.",
            };
        default:
            return {
                label: "Bản nháp",
                badgeClass: "nb-badge text-amber-700 bg-amber-50 border border-amber-200",
                helper: "Hoàn thiện setup, danh mục và nhà cung cấp trước khi phát hành cho phụ huynh.",
            };
    }
}

function InfoStat({
    label,
    value,
    helper,
}: {
    label: string;
    value: string;
    helper: string;
}) {
    return (
        <div className="rounded-[20px] border border-gray-200 bg-white p-4 shadow-soft-sm">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-gray-500">{label}</p>
            <p className="mt-3 text-2xl font-extrabold text-gray-900">{value}</p>
            <p className="mt-2 text-sm font-medium leading-6 text-[#5b6475]">{helper}</p>
        </div>
    );
}

export const SemesterPublicationWorkspace = (): JSX.Element => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = Boolean(id);
    const sidebarConfig = useSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [schoolName, setSchoolName] = useState("");
    const [loading, setLoading] = useState(isEditMode);
    const [saving, setSaving] = useState(false);
    const [publication, setPublication] = useState<SemesterPublicationDetailDto | null>(null);
    const [outfitSuggestions, setOutfitSuggestions] = useState<ContractedOutfitSuggestionDto[]>([]);
    const [providerSuggestions, setProviderSuggestions] = useState<ContractedProviderSuggestionDto[]>([]);
    const [selectedOutfitIds, setSelectedOutfitIds] = useState<string[]>([]);
    const [outfitNotes, setOutfitNotes] = useState("");
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [form, setForm] = useState({
        semester: "",
        academicYear: "",
        startDate: "",
        endDate: "",
        description: "",
        rules: "",
    });

    const showToast = useCallback((message: string, type: "success" | "error") => {
        setToast({ message, type });
        window.setTimeout(() => setToast(null), 3000);
    }, []);

    const loadReferenceData = useCallback(async () => {
        try {
            const [outfits, providers] = await Promise.all([
                getSemesterPublicationOutfitSuggestions(),
                getSemesterPublicationProviderSuggestions(),
            ]);
            setOutfitSuggestions(outfits);
            setProviderSuggestions(providers);
        } catch {
            setOutfitSuggestions([]);
            setProviderSuggestions([]);
        }
    }, []);

    const loadPublication = useCallback(async () => {
        if (!id) {
            return;
        }

        setLoading(true);
        try {
            const detail = await getSemesterPublicationDetail(id);
            setPublication(detail);
            setForm({
                semester: detail.semester,
                academicYear: detail.academicYear,
                startDate: toDateInputValue(detail.startDate),
                endDate: toDateInputValue(detail.endDate),
                description: detail.description || "",
                rules: detail.rules || "",
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Không thể tải chi tiết công bố học kỳ.";
            showToast(message, "error");
        } finally {
            setLoading(false);
        }
    }, [id, showToast]);

    useEffect(() => {
        getSchoolProfile()
            .then((profile) => setSchoolName(profile.schoolName || ""))
            .catch(() => undefined);
        loadReferenceData();
    }, [loadReferenceData]);

    useEffect(() => {
        if (isEditMode) {
            loadPublication();
        }
    }, [isEditMode, loadPublication]);

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    const handleChange = (field: keyof typeof form, value: string) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const handleSavePublication = async () => {
        if (!form.semester.trim() || !form.academicYear.trim() || !form.startDate || !form.endDate) {
            showToast("Cần nhập học kỳ, năm học và khoảng thời gian.", "error");
            return;
        }

        setSaving(true);
        try {
            if (publication) {
                await updateSemesterPublication(publication.id, {
                    semester: form.semester.trim(),
                    academicYear: form.academicYear.trim(),
                    startDate: new Date(form.startDate).toISOString(),
                    endDate: new Date(form.endDate).toISOString(),
                    description: form.description.trim() || null,
                    rules: form.rules.trim() || null,
                });
                showToast("Đã cập nhật thông tin công bố.", "success");
                await loadPublication();
            } else {
                const created = await createSemesterPublication({
                    semester: form.semester.trim(),
                    academicYear: form.academicYear.trim(),
                    startDate: new Date(form.startDate).toISOString(),
                    endDate: new Date(form.endDate).toISOString(),
                    description: form.description.trim() || null,
                    rules: form.rules.trim() || null,
                });
                showToast("Đã tạo bản nháp công bố học kỳ.", "success");
                navigate(`/school/semester-publications/${created.id}/edit`, { replace: true });
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Không thể lưu công bố học kỳ.";
            showToast(message, "error");
        } finally {
            setSaving(false);
        }
    };

    const handleToggleOutfit = (outfitId: string) => {
        setSelectedOutfitIds((current) =>
            current.includes(outfitId) ? current.filter((item) => item !== outfitId) : [...current, outfitId]
        );
    };

    const handleAddOutfits = async () => {
        if (!publication) {
            showToast("Cần lưu công bố trước khi thêm đồng phục.", "error");
            return;
        }

        if (selectedOutfitIds.length === 0) {
            showToast("Chọn ít nhất một đồng phục.", "error");
            return;
        }

        try {
            const detail = await addOutfitsToSemesterPublication(publication.id, {
                outfitIds: selectedOutfitIds,
                notes: outfitNotes.trim() || null,
            });
            setPublication(detail);
            setSelectedOutfitIds([]);
            setOutfitNotes("");
            showToast("Đã thêm đồng phục vào công bố.", "success");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Không thể thêm đồng phục.";
            showToast(message, "error");
        }
    };

    const handleRemoveOutfit = async (publicationOutfitId: string) => {
        if (!publication) {
            return;
        }

        try {
            const detail = await removeOutfitFromSemesterPublication(publication.id, publicationOutfitId);
            setPublication(detail);
            showToast("Đã gỡ đồng phục khỏi công bố.", "success");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Không thể xóa đồng phục.";
            showToast(message, "error");
        }
    };

    const handleApproveProvider = async (provider: ContractedProviderSuggestionDto) => {
        if (!publication) {
            showToast("Cần lưu công bố trước khi duyệt nhà cung cấp.", "error");
            return;
        }

        try {
            const detail = await approveSemesterPublicationProvider(publication.id, {
                providerID: provider.providerID,
                contractID: provider.contractID,
            });
            setPublication(detail);
            showToast("Đã kích hoạt nhà cung cấp.", "success");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Không thể kích hoạt nhà cung cấp.";
            showToast(message, "error");
        }
    };

    const handleSuspendProvider = async (publicationProviderId: string) => {
        if (!publication) {
            return;
        }

        const reason = window.prompt("Lý do tạm ngưng nhà cung cấp (có thể bỏ trống):", "") ?? "";
        try {
            const detail = await suspendSemesterPublicationProvider(publication.id, publicationProviderId, {
                reason: reason.trim() || null,
            });
            setPublication(detail);
            showToast("Đã tạm ngưng nhà cung cấp.", "success");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Không thể tạm ngưng nhà cung cấp.";
            showToast(message, "error");
        }
    };

    const handlePublish = async () => {
        if (!publication) {
            return;
        }

        try {
            await publishSemesterPublication(publication.id);
            showToast("Công bố học kỳ đã được kích hoạt.", "success");
            await loadPublication();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Không thể công khai đợt công bố.";
            showToast(message, "error");
        }
    };

    const handleClose = async () => {
        if (!publication) {
            return;
        }

        const confirmed = window.confirm("Đóng đợt công bố này? Phụ huynh sẽ không đặt thêm được nữa.");
        if (!confirmed) {
            return;
        }

        try {
            await closeSemesterPublication(publication.id);
            showToast("Đã đóng đợt công bố.", "success");
            await loadPublication();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Không thể đóng đợt công bố.";
            showToast(message, "error");
        }
    };

    const approvedProviderIds = useMemo(
        () => new Set((publication?.providers || []).map((provider) => provider.providerID)),
        [publication]
    );

    const selectedOutfits = publication?.outfits || [];
    const selectedProviders = publication?.providers || [];
    const activeProviderCount = selectedProviders.filter((provider) => provider.status === "Active").length;
    const statusMeta = getStatusMeta(publication?.status);
    const hasRequiredMetadata = Boolean(form.semester.trim() && form.academicYear.trim() && form.startDate && form.endDate);
    const hasOutfits = selectedOutfits.length > 0;
    const hasActiveProvider = activeProviderCount > 0;
    const publishReady = hasRequiredMetadata && hasOutfits && hasActiveProvider;
    const availableOutfitSuggestions = outfitSuggestions.filter(
        (outfit) => !selectedOutfits.some((item) => item.outfitID === outfit.outfitID)
    );
    const availableProviderSuggestions = providerSuggestions.filter(
        (provider) => !approvedProviderIds.has(provider.providerID)
    );

    return (
        <div className="nb-page flex flex-col">
            {toast && (
                <div
                    className={`fixed right-6 top-6 z-[99999] flex items-center gap-3 rounded-[12px] border px-5 py-3 text-sm font-extrabold shadow-soft-md ${
                        toast.type === "success"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-red-200 bg-red-50 text-red-700"
                    }`}
                >
                    {toast.message}
                </div>
            )}

            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 transition-all duration-300 lg:sticky lg:top-0 lg:h-screen`}>
                    <DashboardSidebar
                        {...sidebarConfig}
                        name={schoolName}
                        isCollapsed={isCollapsed}
                        onToggle={toggle}
                        onLogout={handleLogout}
                    />
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                    <TopNavBar>
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/school/dashboard" className="text-base font-semibold text-[#4c5769]">
                                        Trang chủ
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/school/semester-publications" className="text-base font-semibold text-[#4c5769]">
                                        Công bố học kỳ
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="text-base font-bold text-gray-900">
                                        {isEditMode ? "Workspace" : "Tạo bản nháp"}
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </TopNavBar>

                    <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        <section className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-soft-sm lg:p-7">
                            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                                <div className="max-w-3xl">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={statusMeta.badgeClass}>{statusMeta.label}</span>
                                        <span className="rounded-full border border-gray-200 bg-violet-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-violet-700">
                                            Publication Workspace
                                        </span>
                                    </div>
                                    <h1 className="mt-4 text-[28px] font-extrabold leading-tight text-gray-900 lg:text-[34px]">
                                        {publication ? `${publication.semester} / ${publication.academicYear}` : "Khởi tạo đợt công bố học kỳ"}
                                    </h1>
                                    <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-[#4c5769] sm:text-base">
                                        {statusMeta.helper}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-3 xl:justify-end">
                                    <button
                                        onClick={handleSavePublication}
                                        disabled={saving}
                                        className="nb-btn nb-btn-purple text-sm disabled:opacity-50"
                                    >
                                        <Save className="h-4 w-4" />
                                        {saving ? "Đang lưu..." : publication ? "Cập nhật thông tin" : "Lưu bản nháp"}
                                    </button>
                                    {publication?.status === "Draft" && (
                                        <button onClick={handlePublish} className="nb-btn nb-btn-green text-sm">
                                            Công khai
                                        </button>
                                    )}
                                    {publication?.status === "Active" && (
                                        <button onClick={handleClose} className="nb-btn nb-btn-outline text-sm">
                                            Đóng đợt mở bán
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                <InfoStat
                                    label="Metadata"
                                    value={hasRequiredMetadata ? "Đã đủ" : "Thiếu"}
                                    helper="Học kỳ, năm học và khoảng thời gian là khung bắt buộc của đợt công bố."
                                />
                                <InfoStat
                                    label="Đồng phục đã gắn"
                                    value={String(selectedOutfits.length)}
                                    helper="Danh mục được chọn sẽ xuất hiện trong đợt công bố hiện tại."
                                />
                                <InfoStat
                                    label="Nhà cung cấp hoạt động"
                                    value={String(activeProviderCount)}
                                    helper="Ít nhất một nhà cung cấp hoạt động là điều kiện tối thiểu để vận hành."
                                />
                                <InfoStat
                                    label="Cập nhật gần nhất"
                                    value={publication ? formatDateTime(publication.updatedAt || publication.createdAt) : "Chưa lưu"}
                                    helper="Dùng mốc này để biết draft đã được rà soát gần đây hay chưa."
                                />
                            </div>
                        </section>

                        {loading ? (
                            <div className="nb-skeleton h-[320px]" />
                        ) : (
                            <>
                                <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
                                    <section className="nb-card-static p-0">
                                        <div className="border-b border-gray-200 px-6 py-5 lg:px-8">
                                            <h2 className="text-lg font-extrabold text-gray-900">Thiết lập đợt công bố</h2>
                                            <p className="mt-1 text-sm font-medium leading-6 text-[#6F6A7D]">
                                                Chốt metadata và ghi chú vận hành trước khi bước sang phần danh mục và nhà cung cấp.
                                            </p>
                                        </div>
                                        <div className="space-y-5 px-6 py-6 lg:px-8">
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div>
                                                    <label className="mb-2 block text-sm font-extrabold text-gray-700">Học kỳ</label>
                                                    <input
                                                        value={form.semester}
                                                        onChange={(event) => handleChange("semester", event.target.value)}
                                                        className={inputClass}
                                                        placeholder="VD: Học kỳ 1"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-2 block text-sm font-extrabold text-gray-700">Năm học</label>
                                                    <input
                                                        value={form.academicYear}
                                                        onChange={(event) => handleChange("academicYear", event.target.value)}
                                                        className={inputClass}
                                                        placeholder="VD: 2026 - 2027"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div>
                                                    <label className="mb-2 block text-sm font-extrabold text-gray-700">Ngày bắt đầu</label>
                                                    <input
                                                        type="date"
                                                        value={form.startDate}
                                                        onChange={(event) => handleChange("startDate", event.target.value)}
                                                        className={inputClass}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-2 block text-sm font-extrabold text-gray-700">Ngày kết thúc</label>
                                                    <input
                                                        type="date"
                                                        value={form.endDate}
                                                        onChange={(event) => handleChange("endDate", event.target.value)}
                                                        className={inputClass}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-sm font-extrabold text-gray-700">Mô tả</label>
                                                <textarea
                                                    value={form.description}
                                                    onChange={(event) => handleChange("description", event.target.value)}
                                                    className={`${inputClass} min-h-[120px] resize-y`}
                                                    placeholder="Mô tả nhanh phạm vi áp dụng, đối tượng học sinh hoặc lưu ý quản trị..."
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-sm font-extrabold text-gray-700">Quy tắc / ghi chú</label>
                                                <textarea
                                                    value={form.rules}
                                                    onChange={(event) => handleChange("rules", event.target.value)}
                                                    className={`${inputClass} min-h-[120px] resize-y`}
                                                    placeholder="VD: Đổi size trong 7 ngày, ưu tiên khối 1-3, giao theo đợt..."
                                                />
                                            </div>
                                        </div>
                                    </section>

                                    <aside className="space-y-6">
                                        <div className="nb-card-static p-0">
                                            <div className="border-b border-gray-200 px-6 py-5">
                                                <h2 className="text-lg font-extrabold text-gray-900">Checklist sẵn sàng</h2>
                                                <p className="mt-1 text-sm font-medium leading-6 text-[#6F6A7D]">
                                                    Dùng phần này để biết bản nháp đã đủ điều kiện phát hành hay chưa.
                                                </p>
                                            </div>
                                            <div className="space-y-3 px-6 py-6">
                                                {[
                                                    {
                                                        label: "Đủ học kỳ, năm học và thời gian",
                                                        done: hasRequiredMetadata,
                                                        helper: "Không nên phát hành khi khung thời gian còn thiếu.",
                                                    },
                                                    {
                                                        label: "Đã thêm ít nhất một đồng phục",
                                                        done: hasOutfits,
                                                        helper: "Danh mục trống khiến phụ huynh không có gì để chọn.",
                                                    },
                                                    {
                                                        label: "Có ít nhất một nhà cung cấp hoạt động",
                                                        done: hasActiveProvider,
                                                        helper: "Cần ít nhất một đầu mối thực thi trước khi mở bán.",
                                                    },
                                                ].map((item) => (
                                                    <div
                                                        key={item.label}
                                                        className={`rounded-[18px] border px-4 py-4 shadow-soft-sm ${
                                                            item.done ? "border-emerald-200 bg-emerald-50" : "border-gray-200 bg-white"
                                                        }`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            {item.done ? (
                                                                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                                                            ) : (
                                                                <ClipboardCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                                                            )}
                                                            <div>
                                                                <p className="text-sm font-extrabold text-gray-900">{item.label}</p>
                                                                <p className="mt-1 text-sm font-medium leading-6 text-[#5b6475]">{item.helper}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                <div className={`rounded-[18px] border px-4 py-4 shadow-soft-sm ${publishReady ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
                                                    <div className="flex items-start gap-3">
                                                        {publishReady ? (
                                                            <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                                                        ) : (
                                                            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                                                        )}
                                                        <div>
                                                            <p className="text-sm font-extrabold text-gray-900">
                                                                {publishReady ? "Bản nháp đã sẵn sàng để công khai" : "Chưa nên công khai ngay"}
                                                            </p>
                                                            <p className="mt-1 text-sm font-medium leading-6 text-[#5b6475]">
                                                                {publishReady
                                                                    ? "Bạn có thể phát hành mà không cần bổ sung thêm điều kiện tối thiểu."
                                                                    : "Tiếp tục hoàn thiện các mục còn thiếu trước khi nhấn Công khai."}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="nb-card-static p-0">
                                            <div className="border-b border-gray-200 px-6 py-5">
                                                <h2 className="text-lg font-extrabold text-gray-900">Ghi nhớ vận hành</h2>
                                            </div>
                                            <div className="space-y-4 px-6 py-6">
                                                <div className="rounded-[18px] border border-gray-200 bg-white px-4 py-4 shadow-soft-sm">
                                                    <p className="text-sm font-extrabold text-gray-900">Vai trò của trường</p>
                                                    <p className="mt-1 text-sm font-medium leading-6 text-[#5b6475]">
                                                        Trường chốt khung công bố, danh mục đồng phục và nhà cung cấp đủ điều kiện. Giá bán và xử lý chi tiết vẫn do provider vận hành.
                                                    </p>
                                                </div>
                                                <div className="rounded-[18px] border border-gray-200 bg-white px-4 py-4 shadow-soft-sm">
                                                    <p className="text-sm font-extrabold text-gray-900">Lưu trước khi curation</p>
                                                    <p className="mt-1 text-sm font-medium leading-6 text-[#5b6475]">
                                                        Nếu đang tạo mới, hãy lưu bản nháp trước rồi mới thêm đồng phục hoặc kích hoạt nhà cung cấp.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </aside>
                                </div>

                                <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
                                    <section className="nb-card-static p-0">
                                        <div className="border-b border-gray-200 px-6 py-5">
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                <div>
                                                    <h2 className="text-lg font-extrabold text-gray-900">Đồng phục trong công bố</h2>
                                                    <p className="mt-1 text-sm font-medium leading-6 text-[#6F6A7D]">
                                                        Danh sách bên dưới là phần đã được chọn cho đợt công bố hiện tại.
                                                    </p>
                                                </div>
                                                {publication && publication.status === "Draft" && (
                                                    <button onClick={handleAddOutfits} className="nb-btn nb-btn-purple nb-btn-sm text-xs">
                                                        <Plus className="h-4 w-4" />
                                                        Thêm vào công bố
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-5 px-6 py-6">
                                            {!publication ? (
                                                <div className="rounded-[16px] border border-dashed border-gray-200 bg-white p-5 text-sm font-semibold text-gray-500">
                                                    Lưu bản nháp trước để bắt đầu thêm đồng phục.
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="space-y-3">
                                                        {selectedOutfits.length === 0 ? (
                                                            <div className="rounded-[16px] border border-dashed border-gray-200 bg-white p-5 text-sm font-semibold text-gray-500">
                                                                Chưa có đồng phục nào trong đợt công bố.
                                                            </div>
                                                        ) : (
                                                            selectedOutfits.map((outfit) => (
                                                                <div key={outfit.id} className="rounded-[18px] border border-gray-200 bg-white p-4 shadow-soft-sm">
                                                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                                        <div className="min-w-0 flex-1">
                                                                            <div className="flex flex-wrap items-center gap-2">
                                                                                <h3 className="text-sm font-black text-gray-900">{outfit.outfitName}</h3>
                                                                                <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-extrabold text-violet-700">
                                                                                    {outfit.outfitType}
                                                                                </span>
                                                                            </div>
                                                                            {outfit.notes && (
                                                                                <p className="mt-2 text-sm font-medium leading-6 text-[#5b6475]">{outfit.notes}</p>
                                                                            )}
                                                                        </div>
                                                                        {publication.status === "Draft" && (
                                                                            <button onClick={() => handleRemoveOutfit(outfit.id)} className="nb-btn nb-btn-outline nb-btn-sm text-xs">
                                                                                <Trash2 className="h-4 w-4" />
                                                                                Gỡ khỏi công bố
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>

                                                    {publication.status === "Draft" && (
                                                        <>
                                                            <div className="rounded-[18px] border border-violet-200 bg-violet-50 p-4 shadow-soft-sm">
                                                                <label className="mb-2 block text-sm font-extrabold text-gray-700">Ghi chú cho lô thêm mới</label>
                                                                <textarea
                                                                    value={outfitNotes}
                                                                    onChange={(event) => setOutfitNotes(event.target.value)}
                                                                    className={`${inputClass} min-h-[90px] resize-y`}
                                                                    placeholder="VD: Áp dụng cho khối 1-3, ưu tiên giao đợt 1..."
                                                                />
                                                            </div>

                                                            <div>
                                                                <h3 className="text-sm font-extrabold uppercase tracking-[0.16em] text-gray-500">Danh mục có thể thêm</h3>
                                                                <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                                                                    {availableOutfitSuggestions.length === 0 ? (
                                                                        <div className="rounded-[16px] border border-dashed border-gray-200 bg-white p-5 text-sm font-semibold text-gray-500 md:col-span-2">
                                                                            Không còn mẫu hợp đồng nào chưa được thêm vào công bố này.
                                                                        </div>
                                                                    ) : (
                                                                        availableOutfitSuggestions.map((outfit) => {
                                                                            const isSelected = selectedOutfitIds.includes(outfit.outfitID);
                                                                            return (
                                                                                <button
                                                                                    key={outfit.outfitID}
                                                                                    type="button"
                                                                                    onClick={() => handleToggleOutfit(outfit.outfitID)}
                                                                                    className={`rounded-[18px] border p-4 text-left transition-colors ${
                                                                                        isSelected
                                                                                            ? "border-violet-300 bg-violet-50 shadow-soft-sm"
                                                                                            : "border-gray-200 bg-white shadow-soft-sm hover:border-gray-300"
                                                                                    }`}
                                                                                >
                                                                                    <div className="flex items-start gap-3">
                                                                                        <div className="h-16 w-16 overflow-hidden rounded-[14px] border border-gray-200 bg-white shadow-soft-sm">
                                                                                            {outfit.mainImageURL ? (
                                                                                                <img src={outfit.mainImageURL} alt={outfit.outfitName} className="h-full w-full object-cover" />
                                                                                            ) : (
                                                                                                <div className="flex h-full w-full items-center justify-center text-sm font-black text-violet-600">
                                                                                                    SP
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                        <div className="min-w-0 flex-1">
                                                                                            <div className="flex flex-wrap items-center gap-2">
                                                                                                <h4 className="text-sm font-black text-gray-900">{outfit.outfitName}</h4>
                                                                                                {isSelected && (
                                                                                                    <span className="rounded-full border border-violet-200 bg-white px-2 py-0.5 text-[10px] font-extrabold text-violet-700">
                                                                                                        Đã chọn
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>
                                                                                            <p className="mt-1 text-xs font-bold text-gray-500">{outfit.outfitType}</p>
                                                                                            <p className="mt-2 text-xs font-semibold text-[#6F6A7D]">{outfit.contractName}</p>
                                                                                        </div>
                                                                                    </div>
                                                                                </button>
                                                                            );
                                                                        })
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </section>

                                    <section className="nb-card-static p-0">
                                        <div className="border-b border-gray-200 px-6 py-5">
                                            <h2 className="text-lg font-extrabold text-gray-900">Nhà cung cấp tham gia</h2>
                                            <p className="mt-1 text-sm font-medium leading-6 text-[#6F6A7D]">
                                                Kích hoạt các nhà cung cấp đủ điều kiện và tách rõ phần đang hoạt động khỏi phần gợi ý.
                                            </p>
                                        </div>
                                        <div className="space-y-5 px-6 py-6">
                                            {!publication ? (
                                                <div className="rounded-[16px] border border-dashed border-gray-200 bg-white p-5 text-sm font-semibold text-gray-500">
                                                    Lưu bản nháp trước để bắt đầu kích hoạt nhà cung cấp.
                                                </div>
                                            ) : (
                                                <>
                                                    <div>
                                                        <h3 className="text-sm font-extrabold uppercase tracking-[0.16em] text-gray-500">Đang hoạt động / đã kích hoạt</h3>
                                                        <div className="mt-3 space-y-3">
                                                            {selectedProviders.length === 0 ? (
                                                                <div className="rounded-[16px] border border-dashed border-gray-200 bg-white p-5 text-sm font-semibold text-gray-500">
                                                                    Chưa có nhà cung cấp nào được kích hoạt.
                                                                </div>
                                                            ) : (
                                                                selectedProviders.map((provider) => (
                                                                    <div
                                                                        key={provider.id}
                                                                        className={`rounded-[18px] border p-4 shadow-soft-sm ${
                                                                            provider.status === "Active" ? "border-emerald-200 bg-emerald-50/60" : "border-gray-200 bg-white"
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-start gap-3">
                                                                            <div className="rounded-2xl bg-white p-3 text-violet-700 shadow-soft-sm">
                                                                                <Store className="h-5 w-5" />
                                                                            </div>
                                                                            <div className="min-w-0 flex-1">
                                                                                <div className="flex flex-wrap items-center gap-2">
                                                                                    <h3 className="text-sm font-black text-gray-900">{provider.providerName}</h3>
                                                                                    <span className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-extrabold text-gray-700">
                                                                                        {provider.status}
                                                                                    </span>
                                                                                </div>
                                                                                <p className="mt-1 text-xs font-semibold text-[#6F6A7D]">
                                                                                    {provider.contractName || "Không rõ hợp đồng"}
                                                                                </p>
                                                                                <p className="mt-2 text-xs font-medium text-gray-500">
                                                                                    Kích hoạt lúc {formatDateTime(provider.approvedAt)}
                                                                                </p>
                                                                                {provider.suspendReason && (
                                                                                    <p className="mt-2 text-xs font-medium text-red-600">{provider.suspendReason}</p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        {provider.status === "Active" && publication.status === "Draft" && (
                                                                            <div className="mt-4 border-t border-white/70 pt-4">
                                                                                <button onClick={() => handleSuspendProvider(provider.id)} className="nb-btn nb-btn-outline nb-btn-sm text-xs text-red-600">
                                                                                    Tạm ngưng nhà cung cấp
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h3 className="text-sm font-extrabold uppercase tracking-[0.16em] text-gray-500">Nhà cung cấp có thể kích hoạt</h3>
                                                        <div className="mt-3 space-y-3">
                                                            {availableProviderSuggestions.length === 0 ? (
                                                                <div className="rounded-[16px] border border-dashed border-gray-200 bg-white p-5 text-sm font-semibold text-gray-500">
                                                                    Không còn nhà cung cấp nào chờ kích hoạt cho đợt này.
                                                                </div>
                                                            ) : (
                                                                availableProviderSuggestions.map((provider) => (
                                                                    <div key={`${provider.providerID}-${provider.contractID}`} className="rounded-[18px] border border-gray-200 bg-white p-4 shadow-soft-sm">
                                                                        <div className="flex items-start gap-3">
                                                                            <div className="rounded-2xl bg-violet-50 p-3 text-violet-700">
                                                                                <Layers3 className="h-5 w-5" />
                                                                            </div>
                                                                            <div className="min-w-0 flex-1">
                                                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                                                    <div>
                                                                                        <h3 className="text-sm font-black text-gray-900">{provider.providerName}</h3>
                                                                                        <p className="mt-1 text-xs font-semibold text-[#6F6A7D]">
                                                                                            {provider.contractName} · {provider.contactEmail || "Chưa có email"}
                                                                                        </p>
                                                                                        <p className="mt-2 text-xs font-medium text-gray-500">
                                                                                            Trạng thái hợp đồng: {provider.contractStatus}
                                                                                        </p>
                                                                                    </div>
                                                                                    <button
                                                                                        onClick={() => handleApproveProvider(provider)}
                                                                                        disabled={publication.status !== "Draft"}
                                                                                        className="nb-btn nb-btn-green nb-btn-sm text-xs disabled:opacity-50"
                                                                                    >
                                                                                        Kích hoạt
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </section>
                                </div>
                            </>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default SemesterPublicationWorkspace;
