import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    AlertCircle,
    ArrowRight,
    CheckCircle2,
    ClipboardList,
    FileText,
    GraduationCap,
    LayoutDashboard,
    Loader2,
    PenLine,
    Shirt,
} from "lucide-react";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { SCHOOL_THEME } from "../../constants/schoolTheme";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useSidebarConfig } from "../../hooks/useSidebarConfig";
import { getSchoolContracts, type ContractDto } from "../../lib/api/contracts";
import {
    getSchoolClassesOverview,
    getSchoolOutfits,
    getSchoolProfile,
    getSemesterPublications,
    parseContactInfo,
    type SchoolClassesOverviewDto,
    type SemesterPublicationDto,
} from "../../lib/api/schools";
import { getSchoolTeacherReports, type TeacherReportListItemDto } from "../../lib/api/teachers";

function formatNumber(value: number): string {
    return value.toLocaleString("vi-VN");
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function getDaysRemaining(iso: string): number {
    const diff = new Date(iso).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getContractStatusLabel(status: string): string {
    switch (status) {
        case "Pending":
            return "Chờ nhà cung cấp";
        case "PendingSchoolSign":
            return "Chờ trường ký";
        case "PendingProviderSign":
            return "Chờ NCC ký";
        case "Active":
        case "InUse":
            return "Đang hiệu lực";
        case "Fulfilled":
            return "Hoàn tất";
        case "Expired":
            return "Hết hạn";
        case "Cancelled":
            return "Đã hủy";
        case "Rejected":
            return "Từ chối";
        default:
            return status;
    }
}

function SummaryCard({
    label,
    value,
    note,
    icon,
    surfaceClassName,
    onClick,
}: {
    label: string;
    value: number | string;
    note: string;
    icon: ReactNode;
    surfaceClassName: string;
    onClick?: () => void;
}) {
    const Component = onClick ? "button" : "div";
    return (
        <Component
            type={onClick ? "button" : undefined}
            onClick={onClick}
            className={`min-h-[118px] w-full rounded-[8px] border p-5 text-left shadow-soft-sm transition-colors ${surfaceClassName} ${onClick ? "hover:border-blue-300" : ""}`}
        >
            <div className="flex h-full items-center gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-white text-slate-900 shadow-soft-xs">
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700">{label}</p>
                    <p className="mt-2 text-2xl font-bold leading-tight text-slate-950">{value}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-600">{note}</p>
                </div>
            </div>
        </Component>
    );
}

function SectionHeader({
    label,
    title,
    action,
}: {
    label: string;
    title: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
            <div>
                <p className={`text-xs font-bold uppercase tracking-[0.14em] ${SCHOOL_THEME.primaryText}`}>{label}</p>
                <h2 className="mt-1 text-lg font-extrabold text-slate-950">{title}</h2>
            </div>
            {action}
        </div>
    );
}

function PublicationRow({
    publication,
    onOpen,
}: {
    publication: SemesterPublicationDto;
    onOpen: (id: string) => void;
}) {
    const daysRemaining = getDaysRemaining(publication.endDate);
    const isNearEnd = daysRemaining <= 7;

    return (
        <button
            type="button"
            onClick={() => onOpen(publication.id)}
            className="grid w-full gap-3 border-b border-gray-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-blue-50/70 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
        >
            <div className="min-w-0">
                <p className="truncate text-base font-extrabold text-slate-950">
                    {publication.semester} / {publication.academicYear}
                </p>
                <p className="mt-1 line-clamp-1 text-sm font-semibold text-[#4c5769]">
                    {publication.description || "Theo dõi danh mục đồng phục đang công bố cho phụ huynh."}
                </p>
            </div>
            <div className="grid gap-2 lg:w-[296px] lg:flex-none lg:justify-items-end">
                <span className="w-fit whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                    {formatDate(publication.startDate)} - {formatDate(publication.endDate)}
                </span>
                <div className="grid w-full grid-cols-[minmax(0,1fr)_116px_16px] items-center gap-2">
                    <span className="justify-self-end whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                        {publication.outfitCount} đồng phục · {publication.providerCount} NCC
                    </span>
                    <span className={`whitespace-nowrap rounded-full px-3 py-1 text-center text-xs font-bold ${isNearEnd ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-[#2563EB]"}`}>
                        {daysRemaining} ngày còn lại
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-700" />
                </div>
            </div>
        </button>
    );
}

function WorkItem({
    icon,
    title,
    description,
    count,
    tone,
    onClick,
}: {
    icon: ReactNode;
    title: string;
    description: string;
    count: number | string;
    tone: "blue" | "cyan" | "mint" | "slate";
    onClick: () => void;
}) {
    const toneClass = {
        blue: "bg-blue-50 text-[#2563EB]",
        cyan: "bg-cyan-50 text-[#0E7490]",
        mint: "bg-emerald-50 text-[#047857]",
        slate: "bg-slate-100 text-slate-700",
    }[tone];

    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center gap-3 rounded-[8px] border border-gray-200 bg-white px-3 py-2.5 text-left shadow-soft-xs transition-colors hover:border-blue-200 hover:bg-blue-50/60"
        >
            <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[8px] ${toneClass}`}>
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-slate-950">{title}</p>
                <p className="mt-0.5 line-clamp-1 text-xs font-semibold text-[#4c5769]">{description}</p>
            </div>
            <span className="rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-bold text-[#2563EB]">
                {count}
            </span>
        </button>
    );
}

function QuickAction({
    icon,
    label,
    onClick,
}: {
    icon: ReactNode;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] border border-gray-200 bg-white px-4 text-sm font-bold text-slate-900 shadow-soft-xs transition-colors hover:border-blue-200 hover:text-[#2563EB]"
        >
            {icon}
            {label}
        </button>
    );
}

export const SchoolDashboard = (): JSX.Element => {
    const navigate = useNavigate();
    const sidebarConfig = useSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [schoolName, setSchoolName] = useState("");
    const [profileReady, setProfileReady] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activePublications, setActivePublications] = useState<SemesterPublicationDto[]>([]);
    const [draftCount, setDraftCount] = useState(0);
    const [closedCount, setClosedCount] = useState(0);
    const [providerCount, setProviderCount] = useState(0);
    const [outfitCount, setOutfitCount] = useState(0);
    const [schoolOutfitCount, setSchoolOutfitCount] = useState(0);
    const [contracts, setContracts] = useState<ContractDto[]>([]);
    const [teacherReports, setTeacherReports] = useState<TeacherReportListItemDto[]>([]);
    const [classOverview, setClassOverview] = useState<SchoolClassesOverviewDto | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [profile, publications, outfits, contractList, reportResponse, classes] = await Promise.all([
                getSchoolProfile().catch(() => null),
                getSemesterPublications(1, 50).catch(() => null),
                getSchoolOutfits().catch(() => null),
                getSchoolContracts().catch(() => []),
                getSchoolTeacherReports().catch(() => null),
                getSchoolClassesOverview().catch(() => null),
            ]);

            if (profile) {
                const contact = parseContactInfo(profile.contactInfo);
                const isReady = Boolean(profile.schoolName && contact.email && contact.phone && contact.address);
                setSchoolName(profile.schoolName || "");
                setProfileReady(isReady);
                if (profile.schoolName) {
                    localStorage.setItem("vtos_org_name", profile.schoolName);
                }
            }

            const publicationItems = publications?.items || [];
            setActivePublications(publicationItems.filter((item) => item.status === "Active"));
            setDraftCount(publicationItems.filter((item) => item.status === "Draft").length);
            setClosedCount(publicationItems.filter((item) => item.status === "Closed").length);
            setProviderCount(publicationItems.reduce((sum, item) => sum + (item.providerCount || 0), 0));
            setOutfitCount(publicationItems.reduce((sum, item) => sum + (item.outfitCount || 0), 0));

            setSchoolOutfitCount(outfits?.total || outfits?.items.length || 0);
            setContracts(contractList);
            setTeacherReports(reportResponse?.items || []);
            setClassOverview(classes);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    const pendingReportCount = useMemo(
        () => teacherReports.filter((item) => item.status !== "Reviewed").length,
        [teacherReports],
    );
    const pendingContractCount = useMemo(
        () => contracts.filter((item) => ["Pending", "PendingSchoolSign", "PendingProviderSign"].includes(item.status)).length,
        [contracts],
    );
    const activeContractCount = useMemo(
        () => contracts.filter((item) => ["Active", "InUse"].includes(item.status)).length,
        [contracts],
    );
    const latestContract = contracts[0];
    const studentCount = classOverview?.totalStudents || 0;
    const classCount = classOverview?.totalClasses || 0;

    const readinessItems = [
        { label: "Hồ sơ trường", ready: profileReady, route: "/school/profile" },
        { label: "Dữ liệu học sinh", ready: studentCount > 0, route: "/school/students/import" },
        { label: "Mẫu đồng phục", ready: schoolOutfitCount > 0, route: "/school/uniforms" },
        { label: "Hợp đồng NCC", ready: activeContractCount > 0, route: "/school/contracts" },
        { label: "Công bố học kỳ", ready: activePublications.length > 0, route: "/school/semester-publications" },
    ];
    const readyCount = readinessItems.filter((item) => item.ready).length;

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 transition-all duration-300 lg:sticky lg:top-0 lg:h-screen`}>
                    <DashboardSidebar {...sidebarConfig} name={schoolName} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                    <TopNavBar>
                        <div className="flex items-center gap-2 px-2 py-2">
                            <LayoutDashboard className={`h-5 w-5 ${SCHOOL_THEME.primaryText}`} />
                            <h1 className="text-xl font-bold text-gray-900">Tổng quan trường học</h1>
                        </div>
                    </TopNavBar>

                    <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                            <div>
                                <p className={`text-xs font-bold uppercase tracking-[0.16em] ${SCHOOL_THEME.primaryText}`}>Quản lý trường học</p>
                                <h1 className="mt-1 text-2xl font-bold leading-tight text-slate-950">
                                    {schoolName || "Tổng quan vận hành"}
                                </h1>
                                <p className="mt-1 text-sm font-semibold text-slate-500">
                                    Theo dõi dữ liệu học sinh, đồng phục, công bố học kỳ và các việc cần xử lý trong một màn hình.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <QuickAction icon={<Shirt className="h-4 w-4" />} label="Đồng phục" onClick={() => navigate("/school/uniforms")} />
                                <QuickAction icon={<FileText className="h-4 w-4" />} label="Công bố" onClick={() => navigate("/school/semester-publications")} />
                                <QuickAction icon={<ClipboardList className="h-4 w-4" />} label="Báo cáo GVCN" onClick={() => navigate("/school/teacher-reports")} />
                            </div>
                        </section>

                        {loading ? (
                            <section className="rounded-[8px] border border-gray-200 bg-white p-10 text-center shadow-soft-sm">
                                <Loader2 className={`mx-auto mb-3 h-8 w-8 animate-spin ${SCHOOL_THEME.primaryText}`} />
                                <p className="text-sm font-semibold text-[#4c5769]">Đang tải tổng quan trường học...</p>
                            </section>
                        ) : (
                            <>
                                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                    <SummaryCard
                                        label="Công bố đang mở"
                                        value={formatNumber(activePublications.length)}
                                        note={`${draftCount} bản nháp · ${closedCount} đã đóng`}
                                        icon={<FileText className="h-5 w-5" />}
                                        surfaceClassName={SCHOOL_THEME.summary.school}
                                        onClick={() => navigate("/school/semester-publications")}
                                    />
                                    <SummaryCard
                                        label="Báo cáo chờ xem"
                                        value={formatNumber(pendingReportCount)}
                                        note={`${teacherReports.length} báo cáo từ GVCN`}
                                        icon={<ClipboardList className="h-5 w-5" />}
                                        surfaceClassName={SCHOOL_THEME.summary.cyan}
                                        onClick={() => navigate("/school/teacher-reports")}
                                    />
                                    <SummaryCard
                                        label="Hợp đồng hiệu lực"
                                        value={formatNumber(activeContractCount)}
                                        note={`${pendingContractCount} hợp đồng cần theo dõi`}
                                        icon={<PenLine className="h-5 w-5" />}
                                        surfaceClassName={SCHOOL_THEME.summary.mint}
                                        onClick={() => navigate("/school/contracts")}
                                    />
                                    <SummaryCard
                                        label="Dữ liệu học sinh"
                                        value={formatNumber(studentCount)}
                                        note={`${formatNumber(classCount)} lớp đang quản lý`}
                                        icon={<GraduationCap className="h-5 w-5" />}
                                        surfaceClassName={SCHOOL_THEME.summary.slate}
                                        onClick={() => navigate("/school/students")}
                                    />
                                </section>

                                <section className="grid items-start gap-4 lg:grid-cols-12">
                                    <div className="rounded-[8px] border border-gray-200 bg-white shadow-soft-sm lg:col-span-5">
                                        <SectionHeader
                                            label="Vận hành học kỳ"
                                            title="Công bố đang mở"
                                            action={
                                                <button type="button" onClick={() => navigate("/school/semester-publications")} className="nb-btn nb-btn-outline text-sm hover:border-blue-200 hover:text-[#2563EB]">
                                                    Xem tất cả
                                                </button>
                                            }
                                        />
                                        {activePublications.length > 0 ? (
                                            <div>
                                                {activePublications.slice(0, 4).map((publication) => (
                                                    <PublicationRow key={publication.id} publication={publication} onOpen={(id) => navigate(`/school/semester-publications/${id}`)} />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="px-5 py-10 text-center">
                                                <FileText className={`mx-auto mb-3 h-9 w-9 ${SCHOOL_THEME.primaryText}`} />
                                                <p className="text-base font-bold text-slate-950">Chưa có công bố học kỳ đang mở</p>
                                                <p className="mt-1 text-sm font-semibold text-[#4c5769]">Tạo công bố khi đã có dữ liệu học sinh, mẫu đồng phục và nhà cung cấp phù hợp.</p>
                                                <button type="button" onClick={() => navigate("/school/semester-publications/new")} className={`${SCHOOL_THEME.primaryButton} mt-4`}>
                                                    Tạo công bố
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2 lg:col-span-7">
                                        <div className="rounded-[8px] border border-gray-200 bg-white shadow-soft-sm">
                                            <SectionHeader label="Cần xử lý" title="Việc ưu tiên" />
                                            <div className="space-y-2.5 p-4">
                                                <WorkItem
                                                    icon={<ClipboardList className="h-5 w-5" />}
                                                    title="Báo cáo GVCN chờ xem"
                                                    description="Phản hồi từ giáo viên cần nhà trường xử lý"
                                                    count={pendingReportCount}
                                                    tone="blue"
                                                    onClick={() => navigate("/school/teacher-reports?status=Submitted")}
                                                />
                                                <WorkItem
                                                    icon={<FileText className="h-5 w-5" />}
                                                    title="Bản nháp công bố"
                                                    description="Hoàn thiện trước khi phụ huynh đặt đồng phục"
                                                    count={draftCount}
                                                    tone="cyan"
                                                    onClick={() => navigate("/school/semester-publications")}
                                                />
                                                <WorkItem
                                                    icon={<PenLine className="h-5 w-5" />}
                                                    title="Hợp đồng cần theo dõi"
                                                    description={latestContract ? getContractStatusLabel(latestContract.status) : "Chưa có hợp đồng gần đây"}
                                                    count={pendingContractCount}
                                                    tone="mint"
                                                    onClick={() => navigate("/school/contracts")}
                                                />
                                            </div>
                                        </div>

                                        <div className="rounded-[8px] border border-gray-200 bg-white shadow-soft-sm">
                                            <SectionHeader label="Hoàn thiện thông tin" title={`${readyCount}/${readinessItems.length} mục hoàn tất`} />
                                            <div className="grid gap-2 p-4">
                                                {readinessItems.map((item) => (
                                                    <button
                                                        key={item.label}
                                                        type="button"
                                                        onClick={() => navigate(item.route)}
                                                        className="flex w-full items-center justify-between rounded-[8px] border border-gray-200 bg-white px-3 py-2.5 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/60"
                                                    >
                                                        <span className="text-sm font-bold text-slate-900">{item.label}</span>
                                                        {item.ready ? (
                                                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                                        ) : (
                                                            <AlertCircle className="h-5 w-5 text-amber-500" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/*
                                <section className="grid gap-4 md:grid-cols-3">
                                    <div className="rounded-[8px] border border-gray-200 bg-white p-5 shadow-soft-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-blue-50 text-[#2563EB]">
                                                <Shirt className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-[#4c5769]">Mẫu đồng phục của trường</p>
                                                <p className="text-xl font-extrabold text-slate-950">{formatNumber(schoolOutfitCount)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rounded-[8px] border border-gray-200 bg-white p-5 shadow-soft-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-cyan-50 text-[#0E7490]">
                                                <Users className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-[#4c5769]">NCC trong công bố</p>
                                                <p className="text-xl font-extrabold text-slate-950">{formatNumber(providerCount)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rounded-[8px] border border-gray-200 bg-white p-5 shadow-soft-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-emerald-50 text-[#047857]">
                                                <School className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-[#4c5769]">Đồng phục đã công bố</p>
                                                <p className="text-xl font-extrabold text-slate-950">{formatNumber(outfitCount)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                                */}
                            </>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default SchoolDashboard;
