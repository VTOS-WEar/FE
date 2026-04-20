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
    "w-full rounded-[10px] border border-gray-200 bg-white px-4 py-3 text-[15px] font-medium text-gray-900 shadow-soft-sm outline-none transition-all placeholder:text-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50";

function formatDateTime(value: string | null | undefined) {
    if (!value) {
        return "Chua co";
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
            const message = error instanceof Error ? error.message : "Khong the tai chi tiet cong bo hoc ky.";
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
            showToast("Can nhap hoc ky, nam hoc va khoang thoi gian.", "error");
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
                showToast("Da cap nhat thong tin cong bo.", "success");
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
                showToast("Da tao ban nhap cong bo hoc ky.", "success");
                navigate(`/school/semester-publications/${created.id}/edit`, { replace: true });
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Khong the luu cong bo hoc ky.";
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
            showToast("Can luu cong bo truoc khi them dong phuc.", "error");
            return;
        }

        if (selectedOutfitIds.length === 0) {
            showToast("Chon it nhat mot dong phuc.", "error");
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
            showToast("Da them dong phuc vao cong bo.", "success");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Khong the them dong phuc.";
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
            showToast("Da go dong phuc khoi cong bo.", "success");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Khong the xoa dong phuc.";
            showToast(message, "error");
        }
    };

    const handleApproveProvider = async (provider: ContractedProviderSuggestionDto) => {
        if (!publication) {
            showToast("Can luu cong bo truoc khi duyet nha cung cap.", "error");
            return;
        }

        try {
            const detail = await approveSemesterPublicationProvider(publication.id, {
                providerID: provider.providerID,
                contractID: provider.contractID,
            });
            setPublication(detail);
            showToast("Da kich hoat nha cung cap.", "success");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Khong the kich hoat nha cung cap.";
            showToast(message, "error");
        }
    };

    const handleSuspendProvider = async (publicationProviderId: string) => {
        if (!publication) {
            return;
        }

        const reason = window.prompt("Ly do tam ngung nha cung cap (co the bo trong):", "") ?? "";
        try {
            const detail = await suspendSemesterPublicationProvider(publication.id, publicationProviderId, {
                reason: reason.trim() || null,
            });
            setPublication(detail);
            showToast("Da tam ngung nha cung cap.", "success");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Khong the tam ngung nha cung cap.";
            showToast(message, "error");
        }
    };

    const handlePublish = async () => {
        if (!publication) {
            return;
        }

        try {
            await publishSemesterPublication(publication.id);
            showToast("Cong bo hoc ky da duoc kich hoat.", "success");
            await loadPublication();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Khong the cong khai dot cong bo.";
            showToast(message, "error");
        }
    };

    const handleClose = async () => {
        if (!publication) {
            return;
        }

        const confirmed = window.confirm("Dong dot cong bo nay? Phu huynh se khong dat them duoc nua.");
        if (!confirmed) {
            return;
        }

        try {
            await closeSemesterPublication(publication.id);
            showToast("Da dong dot cong bo.", "success");
            await loadPublication();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Khong the dong dot cong bo.";
            showToast(message, "error");
        }
    };

    const approvedProviderIds = useMemo(
        () => new Set((publication?.providers || []).map((provider) => provider.providerID)),
        [publication]
    );

    const selectedOutfits = publication?.outfits || [];
    const selectedProviders = publication?.providers || [];

    return (
        <div className="nb-page flex flex-col">
            {toast && (
                <div
                    className={`fixed top-6 right-6 z-[99999] flex items-center gap-3 rounded-[12px] border border-gray-200 px-5 py-3 text-sm font-extrabold shadow-soft-md ${
                        toast.type === "success"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-red-50 text-red-700 border-red-200"
                    }`}
                >
                    {toast.message}
                </div>
            )}

            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar
                        {...sidebarConfig}
                        name={schoolName}
                        isCollapsed={isCollapsed}
                        onToggle={toggle}
                        onLogout={handleLogout}
                    />
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                    <TopNavBar>
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/school/dashboard" className="font-semibold text-[#4c5769] text-base">
                                        Trang chu
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/school/semester-publications" className="font-semibold text-[#4c5769] text-base">
                                        Cong bo hoc ky
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="font-bold text-gray-900 text-base">
                                        {isEditMode ? "Khong gian van hanh" : "Tao ban nhap"}
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </TopNavBar>

                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="max-w-3xl">
                                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-800 shadow-soft-sm">
                                    Session 3 workspace
                                </div>
                                <h1 className="mt-3 text-[28px] lg:text-[32px] font-extrabold text-gray-900 leading-tight">
                                    {publication
                                        ? `${publication.semester} / ${publication.academicYear}`
                                        : "Khoi tao dot cong bo hoc ky"}
                                </h1>
                                <p className="mt-2 text-sm lg:text-base font-medium text-[#4c5769]">
                                    Quan ly metadata, danh muc dong phuc va nha cung cap da duoc hop dong hoa tren cung mot workspace.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <button onClick={handleSavePublication} disabled={saving} className="nb-btn nb-btn-purple text-sm disabled:opacity-50">
                                    {saving ? "Dang luu..." : publication ? "Cap nhat thong tin" : "Luu ban nhap"}
                                </button>
                                {publication?.status === "Draft" && (
                                    <button onClick={handlePublish} className="nb-btn nb-btn-green text-sm">
                                        Cong khai
                                    </button>
                                )}
                                {publication?.status === "Active" && (
                                    <button onClick={handleClose} className="nb-btn nb-btn-outline text-sm">
                                        Dong dot mo ban
                                    </button>
                                )}
                            </div>
                        </div>

                        {loading ? (
                            <div className="nb-skeleton h-[280px]" />
                        ) : (
                            <>
                                <div className="grid grid-cols-1 xl:grid-cols-[1.4fr,0.9fr] gap-6">
                                    <section className="nb-card-static p-6 space-y-5">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <h2 className="text-xl font-black text-gray-900">Thong tin dot cong bo</h2>
                                                <p className="mt-1 text-sm font-medium text-[#6F6A7D]">
                                                    Khai bao hoc ky, nam hoc va quy tac van hanh cho dot mo ban.
                                                </p>
                                            </div>
                                            {publication && (
                                                <span className="nb-badge bg-white text-gray-700 border border-gray-200">
                                                    {publication.status}
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-extrabold text-gray-700 mb-2">Hoc ky</label>
                                                <input
                                                    value={form.semester}
                                                    onChange={(event) => handleChange("semester", event.target.value)}
                                                    className={inputClass}
                                                    placeholder="VD: Hoc ky 1"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-extrabold text-gray-700 mb-2">Nam hoc</label>
                                                <input
                                                    value={form.academicYear}
                                                    onChange={(event) => handleChange("academicYear", event.target.value)}
                                                    className={inputClass}
                                                    placeholder="VD: 2026-2027"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-extrabold text-gray-700 mb-2">Ngay mo ban</label>
                                                <input
                                                    type="date"
                                                    value={form.startDate}
                                                    onChange={(event) => handleChange("startDate", event.target.value)}
                                                    className={inputClass}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-extrabold text-gray-700 mb-2">Ngay dong ban</label>
                                                <input
                                                    type="date"
                                                    value={form.endDate}
                                                    onChange={(event) => handleChange("endDate", event.target.value)}
                                                    className={inputClass}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-extrabold text-gray-700 mb-2">Mo ta</label>
                                            <textarea
                                                value={form.description}
                                                onChange={(event) => handleChange("description", event.target.value)}
                                                className={`${inputClass} min-h-[120px] resize-y`}
                                                placeholder="Mo ta nhanh pham vi ap dung, doi tuong hoc sinh, ghi chu van hanh..."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-extrabold text-gray-700 mb-2">Quy tac / ghi chu</label>
                                            <textarea
                                                value={form.rules}
                                                onChange={(event) => handleChange("rules", event.target.value)}
                                                className={`${inputClass} min-h-[120px] resize-y`}
                                                placeholder="VD: Phu huynh dat truoc theo grade, doi size trong 7 ngay..."
                                            />
                                        </div>
                                    </section>

                                    <section className="nb-card-static p-6 space-y-4">
                                        <h2 className="text-xl font-black text-gray-900">Tong quan van hanh</h2>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="nb-stat-card nb-stat-primary">
                                                <div className="nb-stat-label">Dong phuc da gan</div>
                                                <div className="nb-stat-value">{selectedOutfits.length}</div>
                                            </div>
                                            <div className="nb-stat-card">
                                                <div className="nb-stat-label">Nha cung cap dang hoat dong</div>
                                                <div className="nb-stat-value">
                                                    {selectedProviders.filter((provider) => provider.status === "Active").length}
                                                </div>
                                            </div>
                                            <div className="rounded-[16px] border border-gray-200 bg-white p-4 shadow-soft-sm">
                                                <p className="text-xs font-extrabold uppercase tracking-wider text-gray-500">Cap nhat cuoi</p>
                                                <p className="mt-2 text-sm font-bold text-gray-900">
                                                    {publication ? formatDateTime(publication.updatedAt || publication.createdAt) : "Ban nhap chua duoc tao"}
                                                </p>
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-[1.15fr,0.85fr] gap-6">
                                    <section className="nb-card-static p-6 space-y-5">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <h2 className="text-xl font-black text-gray-900">Dong phuc trong cong bo</h2>
                                                <p className="mt-1 text-sm font-medium text-[#6F6A7D]">
                                                    Chon tu danh sach dong phuc da co hop dong san xuat.
                                                </p>
                                            </div>
                                            <button onClick={handleAddOutfits} className="nb-btn nb-btn-purple nb-btn-sm text-xs">
                                                Them vao cong bo
                                            </button>
                                        </div>

                                        <div className="rounded-[14px] border border-gray-200 bg-violet-50 p-4">
                                            <label className="block text-sm font-extrabold text-gray-700 mb-2">Ghi chu cho lo them moi</label>
                                            <textarea
                                                value={outfitNotes}
                                                onChange={(event) => setOutfitNotes(event.target.value)}
                                                className={`${inputClass} min-h-[90px] resize-y`}
                                                placeholder="VD: Ap dung cho khoi 1-3, uu tien giao dot 1..."
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {outfitSuggestions.map((outfit) => {
                                                const isSelected = selectedOutfitIds.includes(outfit.outfitID);
                                                const alreadyAdded = selectedOutfits.some((item) => item.outfitID === outfit.outfitID);
                                                return (
                                                    <button
                                                        key={outfit.outfitID}
                                                        type="button"
                                                        disabled={alreadyAdded}
                                                        onClick={() => handleToggleOutfit(outfit.outfitID)}
                                                        className={`rounded-[16px] border border-gray-200 p-4 text-left transition-all ${
                                                            alreadyAdded
                                                                ? "bg-gray-100 opacity-60 cursor-not-allowed"
                                                                : isSelected
                                                                    ? "bg-violet-50 shadow-soft-md"
                                                                    : "bg-white shadow-soft-sm hover:scale-[0.99]"
                                                        }`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className="h-16 w-16 rounded-[12px] overflow-hidden border border-gray-200 bg-white shadow-soft-sm">
                                                                {outfit.mainImageURL ? (
                                                                    <img src={outfit.mainImageURL} alt={outfit.outfitName} className="h-full w-full object-cover" />
                                                                ) : (
                                                                    <div className="h-full w-full flex items-center justify-center text-violet-500 font-black text-lg">
                                                                        SP
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <h3 className="text-sm font-black text-gray-900 truncate">{outfit.outfitName}</h3>
                                                                    <span className="text-xs font-extrabold text-violet-700">
                                                                        {outfit.pricePerUnit.toLocaleString("vi-VN")}d
                                                                    </span>
                                                                </div>
                                                                <p className="mt-1 text-xs font-bold text-gray-500">{outfit.outfitType}</p>
                                                                <p className="mt-2 text-xs font-semibold text-[#6F6A7D]">{outfit.contractName}</p>
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <div className="space-y-3">
                                            {selectedOutfits.length === 0 ? (
                                                <div className="rounded-[14px] border border-dashed border-gray-200 bg-white p-5 text-sm font-semibold text-gray-500">
                                                    Chua co dong phuc nao trong dot cong bo.
                                                </div>
                                            ) : (
                                                selectedOutfits.map((outfit) => (
                                                    <div key={outfit.id} className="rounded-[14px] border border-gray-200 bg-white p-4 shadow-soft-sm">
                                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                                            <div>
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <h3 className="text-sm font-black text-gray-900">{outfit.outfitName}</h3>
                                                                    <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-extrabold text-violet-700 border border-violet-200">
                                                                        {outfit.outfitType}
                                                                    </span>
                                                                </div>
                                                                <p className="mt-1 text-sm font-bold text-violet-700">{outfit.price.toLocaleString("vi-VN")}d</p>
                                                                {outfit.notes && (
                                                                    <p className="mt-2 text-sm font-medium text-[#6F6A7D]">{outfit.notes}</p>
                                                                )}
                                                            </div>
                                                            {publication?.status === "Draft" && (
                                                                <button onClick={() => handleRemoveOutfit(outfit.id)} className="nb-btn nb-btn-outline nb-btn-sm text-xs">
                                                                    Go khoi cong bo
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </section>

                                    <section className="nb-card-static p-6 space-y-5">
                                        <div>
                                            <h2 className="text-xl font-black text-gray-900">Nha cung cap duoc phe duyet</h2>
                                            <p className="mt-1 text-sm font-medium text-[#6F6A7D]">
                                                Kich hoat nha cung cap tu cac hop dong dang hoat dong.
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            {providerSuggestions.map((provider) => {
                                                const isApproved = approvedProviderIds.has(provider.providerID);
                                                return (
                                                    <div key={`${provider.providerID}-${provider.contractID}`} className="rounded-[14px] border border-gray-200 bg-white p-4 shadow-soft-sm">
                                                        <div className="flex flex-col gap-3">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div>
                                                                    <h3 className="text-sm font-black text-gray-900">{provider.providerName}</h3>
                                                                    <p className="mt-1 text-xs font-semibold text-[#6F6A7D]">
                                                                        {provider.contractName} · {provider.contactEmail || "Chua co email"}
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleApproveProvider(provider)}
                                                                    disabled={!publication || isApproved}
                                                                    className={`nb-btn nb-btn-sm text-xs ${
                                                                        isApproved ? "nb-btn-outline opacity-60 cursor-not-allowed" : "nb-btn-green"
                                                                    }`}
                                                                >
                                                                    {isApproved ? "Da duyet" : "Kich hoat"}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="space-y-3 pt-2 border-t border-gray-200">
                                            {selectedProviders.length === 0 ? (
                                                <div className="rounded-[14px] border border-dashed border-gray-200 bg-white p-5 text-sm font-semibold text-gray-500">
                                                    Chua co nha cung cap nao duoc kich hoat.
                                                </div>
                                            ) : (
                                                selectedProviders.map((provider) => (
                                                    <div key={provider.id} className="rounded-[14px] border border-gray-200 bg-violet-50 p-4 shadow-soft-sm">
                                                        <div className="flex flex-col gap-3">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div>
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <h3 className="text-sm font-black text-gray-900">{provider.providerName}</h3>
                                                                        <span className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-extrabold text-gray-700">
                                                                            {provider.status}
                                                                        </span>
                                                                    </div>
                                                                    <p className="mt-1 text-xs font-semibold text-[#6F6A7D]">
                                                                        {provider.contractName || "Khong ro hop dong"}
                                                                    </p>
                                                                    <p className="mt-2 text-xs font-medium text-gray-500">
                                                                        Kich hoat luc {formatDateTime(provider.approvedAt)}
                                                                    </p>
                                                                    {provider.suspendReason && (
                                                                        <p className="mt-2 text-xs font-medium text-red-600">{provider.suspendReason}</p>
                                                                    )}
                                                                </div>
                                                                {provider.status === "Active" && publication?.status === "Draft" && (
                                                                    <button onClick={() => handleSuspendProvider(provider.id)} className="nb-btn nb-btn-outline nb-btn-sm text-xs">
                                                                        Tam ngung
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
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
