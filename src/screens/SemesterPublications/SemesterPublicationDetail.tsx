import { AlertTriangle, ArrowRight, CalendarRange, CheckCircle2, CircleDot, ClipboardList, ShieldCheck, Store } from "lucide-react";
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
    closeSemesterPublication,
    getSchoolProfile,
    getSemesterPublicationDetail,
    publishSemesterPublication,
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

function getDaysRemaining(value: string) {
    const diff = new Date(value).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getStatusMeta(status: string) {
    switch (status) {
        case "Active":
            return {
                label: "Đang mở",
                badgeClass: "nb-badge nb-badge-green",
                heroClass: "border-emerald-200 bg-emerald-50",
                helper: "Đợt công bố đang hiển thị cho phụ huynh. Nên theo dõi sát mốc kết thúc và danh sách nhà cung cấp đang hoạt động.",
            };
        case "Closed":
            return {
                label: "Đã đóng",
                badgeClass: "nb-badge nb-badge-blue",
                heroClass: "border-slate-200 bg-slate-50",
                helper: "Đợt công bố đã khép lại và hiện đóng vai trò hồ sơ tham chiếu cho các cấu hình đã dùng.",
            };
        default:
            return {
                label: "Bản nháp",
                badgeClass: "nb-badge text-amber-700 bg-amber-50 border border-amber-200",
                heroClass: "border-amber-200 bg-amber-50",
                helper: "Bản nháp này chưa phát hành. Cần hoàn thiện metadata, đồng phục và nhà cung cấp trước khi công khai.",
            };
    }
}

function OverviewCard({
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
            <p className="mt-3 text-lg font-extrabold text-gray-900">{value}</p>
            <p className="mt-2 text-sm font-medium leading-6 text-[#5b6475]">{helper}</p>
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
    const daysRemaining = publication ? getDaysRemaining(publication.endDate) : null;

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
                                    <BreadcrumbPage className="text-base font-bold text-gray-900">Overview</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </TopNavBar>

                    <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        {loading ? (
                            <div className="nb-skeleton h-[320px]" />
                        ) : !publication || !statusMeta ? (
                            <div className="nb-card-static p-10 text-center">
                                <p className="text-lg font-black text-gray-900">Không tìm thấy công bố học kỳ</p>
                                <button onClick={() => navigate("/school/semester-publications")} className="nb-btn nb-btn-outline mt-4 text-sm">
                                    Quay lại danh sách
                                </button>
                            </div>
                        ) : (
                            <>
                                <section className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-soft-sm lg:p-7">
                                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                                        <div className="max-w-3xl">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={statusMeta.badgeClass}>{statusMeta.label}</span>
                                                <span className="rounded-full border border-gray-200 bg-violet-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-violet-700">
                                                    Publication Overview
                                                </span>
                                            </div>
                                            <h1 className="mt-4 text-[28px] font-extrabold leading-tight text-gray-900 lg:text-[34px]">
                                                {publication.semester} / {publication.academicYear}
                                            </h1>
                                            <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-[#4c5769] sm:text-base">
                                                {publication.description || "Chưa có mô tả cho đợt công bố này. Nên bổ sung mục tiêu áp dụng và lưu ý vận hành để đội quản trị dễ theo dõi hơn."}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-3 xl:justify-end">
                                            <button onClick={() => navigate(`/school/semester-publications/${publication.id}/edit`)} className="nb-btn nb-btn-purple text-sm">
                                                Mở workspace
                                            </button>
                                            {publication.status === "Draft" && (
                                                <button onClick={handlePublish} className="nb-btn nb-btn-green text-sm">
                                                    Công khai
                                                </button>
                                            )}
                                            {publication.status === "Active" && (
                                                <button onClick={handleClose} className="nb-btn nb-btn-outline text-sm">
                                                    Đóng đợt mở bán
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
                                        <div className={`rounded-[22px] border p-4 shadow-soft-sm ${statusMeta.heroClass}`}>
                                            <div className="flex items-start gap-3">
                                                <div className="rounded-2xl bg-white p-3 text-violet-700 shadow-soft-sm">
                                                    <ShieldCheck className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-extrabold text-gray-900">Trạng thái vận hành</p>
                                                    <p className="mt-1 text-sm font-medium leading-6 text-[#5b6475]">{statusMeta.helper}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-[22px] border border-gray-200 bg-white p-4 shadow-soft-sm">
                                            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-gray-500">Lần cập nhật gần nhất</p>
                                            <p className="mt-2 text-sm font-bold text-gray-900">{formatDateTime(publication.updatedAt || publication.createdAt)}</p>
                                            <p className="mt-2 text-sm font-medium leading-6 text-[#5b6475]">
                                                Dùng mốc này để biết đợt công bố đã được rà soát gần đây hay chưa.
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                    <OverviewCard
                                        label="Khung thời gian"
                                        value={`${formatDate(publication.startDate)} - ${formatDate(publication.endDate)}`}
                                        helper={daysRemaining !== null && daysRemaining >= 0 ? `Còn khoảng ${daysRemaining} ngày đến khi kết thúc.` : "Đợt này đã qua mốc kết thúc dự kiến."}
                                    />
                                    <OverviewCard
                                        label="Đồng phục"
                                        value={String(publication.outfits.length)}
                                        helper={publication.outfits.length > 0 ? "Danh mục đã được gắn vào đợt công bố." : "Chưa có đồng phục nào được thêm."}
                                    />
                                    <OverviewCard
                                        label="Nhà cung cấp hoạt động"
                                        value={String(activeProviders)}
                                        helper={activeProviders > 0 ? "Đang có nhà cung cấp sẵn sàng tham gia." : "Chưa có nhà cung cấp nào ở trạng thái hoạt động."}
                                    />
                                    <OverviewCard
                                        label="Quy tắc vận hành"
                                        value={publication.rules ? "Đã khai báo" : "Chưa có"}
                                        helper={publication.rules || "Nên ghi rõ ghi chú vận hành, đổi size hoặc phạm vi áp dụng nếu có."}
                                    />
                                </section>

                                {publication.status === "Draft" && (publication.outfits.length === 0 || activeProviders === 0) && (
                                    <section className="rounded-[20px] border border-amber-200 bg-amber-50/70 p-5 shadow-soft-sm">
                                        <div className="flex items-start gap-3">
                                            <div className="rounded-2xl bg-white p-3 text-amber-700 shadow-soft-sm">
                                                <AlertTriangle className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-extrabold text-gray-900">Bản nháp chưa đủ điều kiện phát hành</h2>
                                                <p className="mt-1 text-sm font-medium leading-6 text-[#6b5b2a]">
                                                    {publication.outfits.length === 0 && activeProviders === 0
                                                        ? "Cần thêm ít nhất một đồng phục và một nhà cung cấp hoạt động trước khi công khai."
                                                        : publication.outfits.length === 0
                                                          ? "Cần thêm ít nhất một đồng phục vào công bố."
                                                          : "Cần kích hoạt ít nhất một nhà cung cấp trước khi công khai."}
                                                </p>
                                            </div>
                                        </div>
                                    </section>
                                )}

                                <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
                                    <section className="nb-card-static p-0">
                                        <div className="border-b border-gray-200 px-6 py-5">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <h2 className="text-lg font-extrabold text-gray-900">Danh mục đồng phục đang áp dụng</h2>
                                                    <p className="mt-1 text-sm font-medium leading-6 text-[#6F6A7D]">
                                                        Phần này cho biết những mẫu nào đã được ghép vào đợt công bố hiện tại.
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => navigate(`/school/semester-publications/${publication.id}/edit`)}
                                                    className="nb-btn nb-btn-outline nb-btn-sm text-xs"
                                                >
                                                    Chỉnh sửa danh mục
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-3 px-6 py-6">
                                            {publication.outfits.length === 0 ? (
                                                <div className="rounded-[16px] border border-dashed border-gray-200 bg-white p-5 text-sm font-semibold text-gray-500">
                                                    Chưa có đồng phục nào được gắn.
                                                </div>
                                            ) : (
                                                publication.outfits.map((outfit) => (
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
                                                                    <p className="mt-2 text-sm font-medium leading-6 text-[#4c5769]">{outfit.notes}</p>
                                                                )}
                                                            </div>
                                                            <div className="rounded-[14px] border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-[#5b6475]">
                                                                Thêm lúc {formatDate(outfit.addedAt)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </section>

                                    <section className="space-y-6">
                                        <div className="nb-card-static p-0">
                                            <div className="border-b border-gray-200 px-6 py-5">
                                                <h2 className="text-lg font-extrabold text-gray-900">Nhà cung cấp đang tham gia</h2>
                                                <p className="mt-1 text-sm font-medium leading-6 text-[#6F6A7D]">
                                                    Theo dõi các nhà cung cấp đã được kích hoạt và trạng thái tham gia của họ.
                                                </p>
                                            </div>
                                            <div className="space-y-3 px-6 py-6">
                                                {publication.providers.length === 0 ? (
                                                    <div className="rounded-[16px] border border-dashed border-gray-200 bg-white p-5 text-sm font-semibold text-gray-500">
                                                        Chưa có nhà cung cấp nào được kích hoạt.
                                                    </div>
                                                ) : (
                                                    publication.providers.map((provider) => (
                                                        <div key={provider.id} className="rounded-[18px] border border-gray-200 bg-white p-4 shadow-soft-sm">
                                                            <div className="flex items-start gap-3">
                                                                <div className="rounded-2xl bg-violet-50 p-3 text-violet-700">
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
                                                                        {provider.contractName || "Chưa có tên hợp đồng"}
                                                                    </p>
                                                                    <p className="mt-2 text-xs font-medium text-gray-500">
                                                                        Email: {provider.contactEmail || "Chưa có"} · Kích hoạt lúc {formatDateTime(provider.approvedAt)}
                                                                    </p>
                                                                    {provider.suspendReason && (
                                                                        <p className="mt-2 text-xs font-medium text-red-600">{provider.suspendReason}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                        <div className="nb-card-static p-0">
                                            <div className="border-b border-gray-200 px-6 py-5">
                                                <h2 className="text-lg font-extrabold text-gray-900">Tín hiệu vận hành</h2>
                                            </div>
                                            <div className="space-y-3 px-6 py-6">
                                                <div className="flex items-start gap-3 rounded-[16px] border border-gray-200 bg-white px-4 py-4 shadow-soft-sm">
                                                    <CalendarRange className="mt-0.5 h-5 w-5 flex-shrink-0 text-violet-600" />
                                                    <div>
                                                        <p className="text-sm font-extrabold text-gray-900">Khung thời gian đã chốt</p>
                                                        <p className="mt-1 text-sm font-medium leading-6 text-[#5b6475]">
                                                            Từ {formatDate(publication.startDate)} đến {formatDate(publication.endDate)}.
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3 rounded-[16px] border border-gray-200 bg-white px-4 py-4 shadow-soft-sm">
                                                    <ClipboardList className="mt-0.5 h-5 w-5 flex-shrink-0 text-violet-600" />
                                                    <div>
                                                        <p className="text-sm font-extrabold text-gray-900">Mức độ sẵn sàng danh mục</p>
                                                        <p className="mt-1 text-sm font-medium leading-6 text-[#5b6475]">
                                                            {publication.outfits.length > 0
                                                                ? `${publication.outfits.length} mẫu đã được cấu hình cho đợt công bố.`
                                                                : "Danh mục vẫn trống, cần bổ sung trước khi phát hành."}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3 rounded-[16px] border border-gray-200 bg-white px-4 py-4 shadow-soft-sm">
                                                    {activeProviders > 0 ? (
                                                        <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                                                    ) : (
                                                        <CircleDot className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-extrabold text-gray-900">Mức độ sẵn sàng nhà cung cấp</p>
                                                        <p className="mt-1 text-sm font-medium leading-6 text-[#5b6475]">
                                                            {activeProviders > 0
                                                                ? `${activeProviders} nhà cung cấp đang ở trạng thái hoạt động.`
                                                                : "Chưa có nhà cung cấp hoạt động, cần xử lý trước khi công khai."}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => navigate(`/school/semester-publications/${publication.id}/edit`)}
                                                    className="nb-btn nb-btn-outline w-full text-sm"
                                                >
                                                    Đi tới workspace
                                                    <ArrowRight className="h-4 w-4" />
                                                </button>
                                            </div>
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

export default SemesterPublicationDetail;
