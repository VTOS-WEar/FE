import {
    ArrowLeft,
    ArrowRight,
    CalendarRange,
    CheckCircle2,
    CircleDot,
    ClipboardList,
    FileText,
    Loader2,
    Package,
    ShieldCheck,
    Store,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { SCHOOL_THEME } from "../../constants/schoolTheme";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useSidebarConfig } from "../../hooks/useSidebarConfig";
import {
    closeSemesterPublication,
    getSchoolProfile,
    getSemesterPublicationDetail,
    publishSemesterPublication,
    type PublicationOutfitDto,
    type PublicationProviderDto,
    type SemesterPublicationDetailDto,
} from "../../lib/api/schools";

function formatDate(value: string) {
    return new Date(value).toLocaleDateString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

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

function formatCurrency(value: number) {
    return `${value.toLocaleString("vi-VN")} ₫`;
}

const richTextDisplayClass =
    "prose-editor-content max-w-none text-sm font-medium leading-7 text-slate-600 sm:text-base [&_a]:font-bold [&_a]:text-[#2563EB] [&_blockquote]:border-l-4 [&_blockquote]:border-blue-200 [&_blockquote]:pl-4 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-bold [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-6";

function getStatusMeta(status: string) {
    switch (status) {
        case "Active":
            return {
                label: "Đang mở",
                badgeClass: "nb-badge nb-badge-green",
                surfaceClassName: SCHOOL_THEME.summary.mint,
                iconClassName: "text-emerald-700",
            };
        case "Closed":
            return {
                label: "Đã đóng",
                badgeClass: "nb-badge nb-badge-blue",
                surfaceClassName: SCHOOL_THEME.summary.slate,
                iconClassName: "text-slate-700",
            };
        default:
            return {
                label: "Bản nháp",
                badgeClass: "nb-badge text-amber-700 bg-amber-50 border border-amber-200",
                surfaceClassName: SCHOOL_THEME.summary.cyan,
                iconClassName: "text-amber-700",
            };
    }
}

function SummaryCard({
    label,
    value,
    note,
    icon,
    surfaceClassName,
    iconClassName,
}: {
    label: string;
    value: string;
    note?: string;
    icon: ReactNode;
    surfaceClassName: string;
    iconClassName?: string;
}) {
    return (
        <div className={`min-h-[112px] rounded-[8px] border border-white/70 p-5 shadow-soft-sm ${surfaceClassName}`}>
            <div className="flex h-full items-center gap-4">
                <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-white shadow-soft-xs ${iconClassName || "text-slate-900"}`}>
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700">{label}</p>
                    <p className="mt-2 truncate text-2xl font-bold leading-tight text-slate-950">{value}</p>
                    {note ? <p className="mt-2 line-clamp-1 text-xs font-semibold text-slate-600">{note}</p> : null}
                </div>
            </div>
        </div>
    );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
    return (
        <div className="rounded-[8px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white text-slate-700 shadow-soft-xs">
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-500">{label}</p>
                    <p className="mt-1 break-words text-sm font-bold leading-6 text-slate-950">{value}</p>
                </div>
            </div>
        </div>
    );
}

function OutfitRow({ outfit }: { outfit: PublicationOutfitDto }) {
    return (
        <div className="grid gap-4 rounded-[8px] border border-gray-200 bg-white p-4 shadow-soft-sm sm:grid-cols-[80px_1fr_auto] sm:items-center">
            <div className="h-20 w-20 overflow-hidden rounded-[8px] border border-slate-100 bg-slate-50">
                {outfit.mainImageURL ? (
                    <img src={outfit.mainImageURL} alt={outfit.outfitName} className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <Package className="h-8 w-8" />
                    </div>
                )}
            </div>

            <div className="min-w-0">
                <h3 className="truncate text-base font-bold text-slate-950">{outfit.outfitName}</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                    <span className={`rounded-full border ${SCHOOL_THEME.primarySoftBorder} ${SCHOOL_THEME.primarySoftBg} px-3 py-1 text-xs font-bold ${SCHOOL_THEME.primaryText}`}>
                        {outfit.outfitType}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600">
                        Thêm {formatDate(outfit.addedAt)}
                    </span>
                </div>
                {outfit.notes ? <p className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-slate-500">{outfit.notes}</p> : null}
            </div>

            <div className="text-left sm:text-right">
                <p className="text-xs font-semibold text-slate-500">Giá tham chiếu</p>
                <p className="mt-2 text-lg font-bold text-slate-950">{formatCurrency(outfit.price)}</p>
            </div>
        </div>
    );
}

function ProviderRow({ provider }: { provider: PublicationProviderDto }) {
    const isActive = provider.status === "Active";

    return (
        <div className="rounded-[8px] border border-gray-200 bg-white p-4 shadow-soft-sm">
            <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                    <Store className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-950">{provider.providerName}</h3>
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                            {provider.status}
                        </span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{provider.contractName || "Chưa có tên hợp đồng"}</p>
                    <p className="mt-2 text-xs font-medium text-slate-500">
                        Email: {provider.contactEmail || "Chưa có"} · Kích hoạt {formatDateTime(provider.approvedAt)}
                    </p>
                    {provider.suspendReason ? <p className="mt-2 text-xs font-medium text-red-600">{provider.suspendReason}</p> : null}
                </div>
            </div>
        </div>
    );
}

export const SemesterPublicationDetail = (): JSX.Element => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const sidebarConfig = useSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [schoolName, setSchoolName] = useState("");
    const [publication, setPublication] = useState<SemesterPublicationDetailDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const showToast = useCallback((message: string, type: "success" | "error") => {
        setToast({ message, type });
        window.setTimeout(() => setToast(null), 3000);
    }, []);

    const loadPublication = useCallback(async () => {
        if (!id) {
            return;
        }

        setLoading(true);
        try {
            const detail = await getSemesterPublicationDetail(id);
            setPublication(detail);
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
        loadPublication();
    }, [loadPublication]);

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    const handlePublish = async () => {
        if (!publication) {
            return;
        }

        try {
            await publishSemesterPublication(publication.id);
            showToast("Đã kích hoạt công bố học kỳ.", "success");
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

    const statusMeta = publication ? getStatusMeta(publication.status) : null;
    const activeProviders = useMemo(
        () => publication?.providers.filter((provider) => provider.status === "Active").length ?? 0,
        [publication]
    );
    const readyToPublish = Boolean(publication && publication.outfits.length > 0 && activeProviders > 0);

    const summaryCards = useMemo(() => {
        if (!publication || !statusMeta) return [];

        return [
            {
                label: "Khung thời gian",
                value: `${formatDate(publication.startDate)} - ${formatDate(publication.endDate)}`,
                icon: <CalendarRange className="h-5 w-5" />,
                surfaceClassName: SCHOOL_THEME.summary.school,
                iconClassName: SCHOOL_THEME.primaryText,
            },
            {
                label: "Trạng thái",
                value: statusMeta.label,
                icon: <ShieldCheck className="h-5 w-5" />,
                surfaceClassName: statusMeta.surfaceClassName,
                iconClassName: statusMeta.iconClassName,
            },
            {
                label: "Đồng phục",
                value: `${publication.outfits.length} mẫu`,
                icon: <Package className="h-5 w-5" />,
                surfaceClassName: SCHOOL_THEME.summary.mint,
                iconClassName: "text-emerald-700",
            },
            {
                label: "Nhà cung cấp",
                value: `${activeProviders}/${publication.providers.length} active`,
                icon: <Store className="h-5 w-5" />,
                surfaceClassName: SCHOOL_THEME.summary.slate,
                iconClassName: "text-slate-700",
            },
        ];
    }, [activeProviders, publication, statusMeta]);

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
                        <div className="flex items-center gap-3 px-2 py-2">
                            <button
                                onClick={() => navigate("/school/semester-publications")}
                                className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-gray-200 bg-white shadow-soft-sm transition-colors hover:bg-slate-50"
                                aria-label="Quay lại danh sách công bố"
                            >
                                <ArrowLeft className="h-4 w-4 text-gray-900" />
                            </button>
                            <h1 className="text-xl font-bold leading-none text-gray-900">Chi tiết công bố học kỳ</h1>
                        </div>
                    </TopNavBar>

                    <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        {loading ? (
                            <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-[8px] border border-gray-200 bg-white shadow-soft-sm">
                                <Loader2 className="h-10 w-10 animate-spin text-[#2563EB]" />
                                <p className="text-xs font-semibold text-slate-500">Đang tải chi tiết công bố...</p>
                            </div>
                        ) : !publication || !statusMeta ? (
                            <div className="rounded-[8px] border border-dashed border-gray-300 bg-white p-16 text-center shadow-soft-sm">
                                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                                    <ShieldCheck className="h-10 w-10" />
                                </div>
                                <h2 className="mt-6 text-2xl font-bold text-gray-900">Không tìm thấy công bố học kỳ</h2>
                                <button onClick={() => navigate("/school/semester-publications")} className={`${SCHOOL_THEME.primaryButton} mt-8`}>
                                    Quay lại danh sách
                                </button>
                            </div>
                        ) : (
                            <>
                                <section className="space-y-5">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-950">Tổng quan công bố</h2>
                                            <p className="mt-1 text-sm font-semibold text-slate-500">
                                                {publication.semester} / {publication.academicYear} · cập nhật {formatDateTime(publication.updatedAt || publication.createdAt)}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className={`${statusMeta.badgeClass} w-fit px-4 py-2 text-sm`}>{statusMeta.label}</span>
                                            <button
                                                onClick={() => navigate(`/school/semester-publications/${publication.id}/edit`)}
                                                className={SCHOOL_THEME.primaryButton}
                                            >
                                                Mở workspace
                                                <ArrowRight className="h-4 w-4" />
                                            </button>
                                            {publication.status === "Draft" ? (
                                                <button onClick={handlePublish} className="nb-btn nb-btn-green text-sm">
                                                    Công khai
                                                </button>
                                            ) : null}
                                            {publication.status === "Active" ? (
                                                <button onClick={handleClose} className="nb-btn nb-btn-outline text-sm hover:border-blue-200 hover:text-[#2563EB]">
                                                    Đánh dấu hết hạn học kỳ
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                        {summaryCards.map((card) => (
                                            <SummaryCard key={card.label} {...card} />
                                        ))}
                                    </div>
                                </section>

                                <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
                                    <div className="space-y-6">
                                        <div className="rounded-[8px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-500">Công bố</p>
                                                    <h2 className="mt-2 text-2xl font-bold text-gray-900">{publication.semester} / {publication.academicYear}</h2>
                                                </div>
                                                <div className="font-mono text-sm font-bold text-slate-600">
                                                    #{publication.id.slice(0, 8).toUpperCase()}
                                                </div>
                                            </div>

                                            <div className="mt-5 grid gap-4 md:grid-cols-2">
                                                <InfoRow label="Ngày bắt đầu" value={formatDate(publication.startDate)} icon={<CalendarRange className="h-4 w-4" />} />
                                                <InfoRow label="Ngày kết thúc" value={formatDate(publication.endDate)} icon={<CalendarRange className="h-4 w-4" />} />
                                                <InfoRow label="Quy tắc vận hành" value={publication.rules ? "Đã khai báo" : "Chưa có"} icon={<FileText className="h-4 w-4" />} />
                                                <InfoRow label="Nhà cung cấp active" value={`${activeProviders}/${publication.providers.length}`} icon={<Store className="h-4 w-4" />} />
                                            </div>

                                            {publication.description ? (
                                                <div className="mt-5 border-t border-slate-100 pt-5">
                                                    <h3 className="text-base font-bold text-slate-950">Mô tả công bố</h3>
                                                    <div
                                                        className={`mt-3 ${richTextDisplayClass}`}
                                                        dangerouslySetInnerHTML={{ __html: publication.description }}
                                                    />
                                                </div>
                                            ) : null}
                                        </div>

                                        {publication.rules ? (
                                            <div className="rounded-[8px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                                                <h2 className="text-xl font-bold text-gray-900">Quy tắc / ghi chú</h2>
                                                <div
                                                    className={`mt-3 ${richTextDisplayClass}`}
                                                    dangerouslySetInnerHTML={{ __html: publication.rules }}
                                                />
                                            </div>
                                        ) : null}

                                        <div className="rounded-[8px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-500">Đồng phục</p>
                                                    <h2 className="mt-2 text-2xl font-bold text-gray-900">Danh mục đang áp dụng</h2>
                                                </div>
                                                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700">
                                                    {publication.outfits.length} mẫu
                                                </div>
                                            </div>

                                            <div className="mt-5 space-y-3">
                                                {publication.outfits.length === 0 ? (
                                                    <div className="rounded-[8px] border border-dashed border-gray-200 bg-white p-5 text-sm font-semibold text-gray-500">
                                                        Chưa có đồng phục nào được gắn.
                                                    </div>
                                                ) : (
                                                    publication.outfits.map((outfit) => <OutfitRow key={outfit.id} outfit={outfit} />)
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="rounded-[8px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-500">Nhà cung cấp</p>
                                                    <h2 className="mt-2 text-2xl font-bold text-gray-900">Đang tham gia</h2>
                                                </div>
                                                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700">
                                                    {activeProviders} active
                                                </div>
                                            </div>

                                            <div className="mt-5 space-y-3">
                                                {publication.providers.length === 0 ? (
                                                    <div className="rounded-[8px] border border-dashed border-gray-200 bg-white p-5 text-sm font-semibold text-gray-500">
                                                        Chưa có nhà cung cấp nào được kích hoạt.
                                                    </div>
                                                ) : (
                                                    publication.providers.map((provider) => <ProviderRow key={provider.id} provider={provider} />)
                                                )}
                                            </div>
                                        </div>

                                        <div className="rounded-[8px] border border-gray-200 bg-white p-6 shadow-soft-sm">
                                            <div className="flex items-center gap-3">
                                                <div className={`flex h-11 w-11 items-center justify-center rounded-full ${SCHOOL_THEME.primarySoftBg} ${SCHOOL_THEME.primaryText}`}>
                                                    <ShieldCheck className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-500">Tín hiệu vận hành</p>
                                                    <h2 className="mt-1 text-xl font-bold text-gray-900">Mức sẵn sàng</h2>
                                                </div>
                                            </div>

                                            <div className="mt-5 space-y-3">
                                                <ReadinessRow
                                                    completed={publication.outfits.length > 0}
                                                    title="Danh mục đồng phục"
                                                    text={publication.outfits.length > 0 ? `${publication.outfits.length} mẫu đã được cấu hình.` : "Danh mục vẫn trống."}
                                                />
                                                <ReadinessRow
                                                    completed={activeProviders > 0}
                                                    title="Nhà cung cấp"
                                                    text={activeProviders > 0 ? `${activeProviders} nhà cung cấp đang hoạt động.` : "Chưa có nhà cung cấp active."}
                                                />
                                                <ReadinessRow
                                                    completed={Boolean(publication.rules)}
                                                    title="Quy tắc vận hành"
                                                    text={publication.rules ? "Đã khai báo quy tắc." : "Chưa khai báo quy tắc."}
                                                />
                                            </div>

                                            {publication.status === "Draft" && !readyToPublish ? (
                                                <div className="mt-5 rounded-[8px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                                                    Bản nháp cần có ít nhất một mẫu đồng phục và một nhà cung cấp active trước khi phát hành.
                                                </div>
                                            ) : null}

                                            <button
                                                onClick={() => navigate(`/school/semester-publications/${publication.id}/edit`)}
                                                className="nb-btn nb-btn-outline mt-5 w-full text-sm hover:border-blue-200 hover:text-[#2563EB]"
                                            >
                                                Đi tới workspace
                                                <ArrowRight className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </section>
                            </>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

function ReadinessRow({ completed, title, text }: { completed: boolean; title: string; text: string }) {
    return (
        <div className="flex items-start gap-3 rounded-[8px] border border-gray-200 bg-white px-4 py-4 shadow-soft-sm">
            {completed ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
            ) : (
                <CircleDot className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            )}
            <div>
                <p className="text-sm font-bold text-gray-900">{title}</p>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-500">{text}</p>
            </div>
        </div>
    );
}

export default SemesterPublicationDetail;
