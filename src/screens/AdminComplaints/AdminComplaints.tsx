import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useAdminSidebarConfig } from "../../hooks/useAdminSidebarConfig";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import {
    adminInterveneComplaint,
    getAdminComplaints,
    type AdminComplaintDto,
    type AdminComplaintListResult,
} from "../../lib/api/admin";
import {
    ADMIN_TONE,
    AdminBadge,
    AdminEmptyState,
    AdminHero,
    AdminSummaryCard,
} from "../AdminShared/adminWorkspace";

const statusTone: Record<string, { bg: string; text: string; label: string }> = {
    Open: { bg: ADMIN_TONE.roseSoft, text: "#B23148", label: "Đang mở" },
    InProgress: { bg: ADMIN_TONE.amberSoft, text: "#9A6506", label: "Đang xử lý" },
    Resolved: { bg: ADMIN_TONE.emeraldSoft, text: "#0C7A5D", label: "Đã giải quyết" },
    Closed: { bg: "#F1F3F8", text: "#667085", label: "Đã đóng" },
};

export default function AdminComplaints() {
    const navigate = useNavigate();
    const sidebarConfig = useAdminSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [data, setData] = useState<AdminComplaintListResult | null>(null);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<AdminComplaintDto | null>(null);
    const [note, setNote] = useState("");
    const [action, setAction] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            setData(await getAdminComplaints({ page, pageSize: 15, status: statusFilter || undefined }));
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleIntervene = async () => {
        if (!selected || !note.trim()) return;
        setSubmitting(true);
        try {
            await adminInterveneComplaint(selected.id, note, action || undefined);
            setSelected(null);
            setNote("");
            setAction("");
            await fetchData();
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;
    const gridCols = "2fr 1.35fr 1.35fr 1.35fr 1.15fr 1.15fr 1fr";

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                    <TopNavBar>
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/admin/dashboard" className="font-semibold text-[#4c5769] text-base">
                                        Trang chủ
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="font-bold text-gray-900 text-base">Hỗ trợ</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </TopNavBar>

                    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8 space-y-6 nb-fade-in">
                        <AdminHero
                            eyebrow="Van hanh"
                            title="Can thiệp hỗ trợ theo mức độ mở, tiến trình xử lý và điểm nghẽn giữa các bên."
                            description="Màn hình này giúp Admin đọc nhanh yêu cầu hỗ trợ nào đang mở, hồ sơ nào đã escalated và mục nào cần ghi chú hoặc quyết định trạng thái tiếp theo."
                            stats={[
                                { label: "Đang mở", value: loading ? "…" : String(data?.openCount ?? 0) },
                                { label: "Đang xử lý", value: loading ? "…" : String(data?.inProgressCount ?? 0) },
                            ]}
                        />

                        <section className="grid gap-4 md:grid-cols-3">
                            <AdminSummaryCard
                                label="Đang mở"
                                value={loading ? "…" : (data?.openCount ?? 0).toLocaleString("vi-VN")}
                                detail="Nhóm ưu tiên cao cần đọc, phân loại và ghi chú sớm để tránh kéo dài tranh chấp."
                                accent={ADMIN_TONE.rose}
                            />
                            <AdminSummaryCard
                                label="Đang xử lý"
                                value={loading ? "…" : (data?.inProgressCount ?? 0).toLocaleString("vi-VN")}
                                detail="Đây là các hồ sơ đã có hướng can thiệp nhưng vẫn cần theo dõi để chốt trạng thái."
                                accent={ADMIN_TONE.amber}
                            />
                            <AdminSummaryCard
                                label="Đã giải quyết"
                                value={loading ? "…" : (data?.resolvedCount ?? 0).toLocaleString("vi-VN")}
                                detail="Nhóm này giúp Admin đọc nhanh năng lực xử lý hỗ trợ trong chu kỳ hiện tại."
                                accent={ADMIN_TONE.emerald}
                            />
                        </section>

                        <section className="rounded-[24px] border p-4 shadow-soft-lg" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}>
                            <div className="flex flex-wrap items-center gap-3">
                                {[
                                    { value: "", label: "Tất cả" },
                                    { value: "Open", label: "Đang mở" },
                                    { value: "InProgress", label: "Đang xử lý" },
                                    { value: "Resolved", label: "Đã giải quyết" },
                                    { value: "Closed", label: "Đã đóng" },
                                ].map((tab) => (
                                    <button
                                        key={tab.value}
                                        onClick={() => {
                                            setStatusFilter(tab.value);
                                            setPage(1);
                                        }}
                                        className="rounded-full border px-4 py-1.5 text-[13px] font-extrabold transition-all hover:scale-[0.99]"
                                        style={{
                                            borderColor: statusFilter === tab.value ? ADMIN_TONE.violet : ADMIN_TONE.line,
                                            background: statusFilter === tab.value ? ADMIN_TONE.violet : ADMIN_TONE.shell,
                                            color: statusFilter === tab.value ? "#fff" : ADMIN_TONE.pageInk,
                                        }}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="overflow-hidden rounded-[24px] border shadow-soft-lg" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}>
                            <div
                                className="sticky top-0 z-10 hidden lg:grid items-center border-b px-5 py-4"
                                style={{ gridTemplateColumns: gridCols, borderColor: ADMIN_TONE.line, background: ADMIN_TONE.violetSoft }}
                            >
                                {["Tiêu đề", "Trường", "Nhà cung cấp", "Danh mục", "Trạng thái", "Ngày tạo", "Hành động"].map((header, index, arr) => (
                                    <div
                                        key={header}
                                        className={`text-[12px] font-black uppercase tracking-[0.08em]${index === arr.length - 1 ? " text-right" : ""}`}
                                        style={{ color: ADMIN_TONE.muted }}
                                    >
                                        {header}
                                    </div>
                                ))}
                            </div>

                            {loading && (
                                <div className="space-y-3 px-5 py-5">
                                    {Array.from({ length: 5 }).map((_, index) => (
                                        <div
                                            key={index}
                                            className="hidden lg:grid items-center gap-4 rounded-[14px] border px-4 py-4"
                                            style={{ gridTemplateColumns: gridCols, borderColor: ADMIN_TONE.line, background: ADMIN_TONE.soft }}
                                        >
                                            {Array.from({ length: 7 }).map((__, cellIndex) => (
                                                <div key={cellIndex} className="h-5 rounded animate-pulse" style={{ background: ADMIN_TONE.violetSoft }} />
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!loading && (!data || data.items.length === 0) && (
                                <AdminEmptyState
                                    title="Không có yêu cầu hỗ trợ nào"
                                    detail="Hệ thống chưa ghi nhận yêu cầu hỗ trợ nào phù hợp bộ lọc hiện tại."
                                    icon="✅"
                                    bg={ADMIN_TONE.emeraldSoft}
                                />
                            )}

                            {!loading && data && data.items.length > 0 && (
                                <div>
                                    {data.items.map((item, index) => (
                                        <div
                                            key={item.id}
                                            className="hidden lg:grid items-center gap-4 border-b px-5 py-4 transition-colors hover:bg-[#F7F2FF] nb-fade-in"
                                            style={{ gridTemplateColumns: gridCols, borderColor: ADMIN_TONE.line, animationDelay: `${index * 40}ms` }}
                                        >
                                            <div className="truncate text-[15px] font-black text-gray-900">{item.title}</div>
                                            <div className="text-[14px] font-semibold" style={{ color: "#3D384A" }}>
                                                {item.schoolName}
                                            </div>
                                            <div className="text-[14px] font-semibold" style={{ color: "#3D384A" }}>
                                                {item.providerName ?? "—"}
                                            </div>
                                            <div className="truncate text-[14px] font-semibold" style={{ color: "#3D384A" }}>
                                                {item.campaignName ?? "—"}
                                            </div>
                                            <div>
                                                <AdminBadge bg={statusTone[item.status]?.bg} text={statusTone[item.status]?.text}>
                                                    {statusTone[item.status]?.label || item.status}
                                                </AdminBadge>
                                            </div>
                                            <div className="text-[14px] font-semibold" style={{ color: ADMIN_TONE.muted }}>
                                                {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                                            </div>
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={() => setSelected(item)}
                                                    className="rounded-xl border px-4 py-2 text-[13px] font-extrabold transition-all hover:scale-[0.99]"
                                                    style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell, color: ADMIN_TONE.pageInk }}
                                                >
                                                    Chi tiết
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {data.items.map((item, index) => (
                                        <div
                                            key={`mobile-${item.id}`}
                                            className="lg:hidden border-b p-4 space-y-3 nb-fade-in"
                                            style={{ borderColor: ADMIN_TONE.line, animationDelay: `${index * 40}ms` }}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="truncate text-[16px] font-black text-gray-900">{item.title}</div>
                                                    <div className="mt-1 text-[13px] font-semibold" style={{ color: "#3D384A" }}>
                                                        {item.schoolName} · {item.providerName ?? "N/A"}
                                                    </div>
                                                </div>
                                                <AdminBadge bg={statusTone[item.status]?.bg} text={statusTone[item.status]?.text}>
                                                    {statusTone[item.status]?.label || item.status}
                                                </AdminBadge>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[13px] font-semibold" style={{ color: ADMIN_TONE.muted }}>
                                                    {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                                                </span>
                                                <button
                                                    onClick={() => setSelected(item)}
                                                    className="rounded-xl border px-4 py-2 text-[13px] font-extrabold transition-all hover:scale-[0.99]"
                                                    style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell, color: ADMIN_TONE.pageInk }}
                                                >
                                                    Chi tiết
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <div
                                        className="flex flex-col gap-3 border-t px-5 py-4 md:flex-row md:items-center md:justify-between"
                                        style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.soft }}
                                    >
                                        <div className="text-[14px] font-bold" style={{ color: ADMIN_TONE.muted }}>
                                            Trang {page}/{totalPages} · {data.totalCount} yêu cầu hỗ trợ
                                        </div>
                                        {totalPages > 1 && (
                                            <div className="flex gap-3">
                                                <button
                                                    disabled={page <= 1}
                                                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                                                    className="rounded-xl border px-4 py-2 text-[13px] font-extrabold transition-all disabled:opacity-40 hover:scale-[0.99]"
                                                    style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell, color: ADMIN_TONE.pageInk }}
                                                >
                                                    ← Trước
                                                </button>
                                                <button
                                                    disabled={page >= totalPages}
                                                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                                                    className="rounded-xl border px-4 py-2 text-[13px] font-extrabold text-white transition-all disabled:opacity-40 hover:scale-[0.99]"
                                                    style={{ borderColor: ADMIN_TONE.violet, background: ADMIN_TONE.violet }}
                                                >
                                                    Sau →
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </section>
                    </main>
                </div>
            </div>

            {selected && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 nb-backdrop-enter"
                    style={{ background: "rgba(25, 24, 43, 0.55)" }}
                    onClick={() => setSelected(null)}
                >
                    <div
                        className="w-full max-w-2xl rounded-2xl border p-6 space-y-5 nb-modal-enter max-h-[90vh] overflow-y-auto shadow-soft-lg"
                        style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-[24px] font-black text-gray-900">{selected.title}</h2>
                                <p className="mt-2 text-[14px] font-semibold" style={{ color: ADMIN_TONE.muted }}>
                                    {selected.schoolName} · {selected.providerName ?? "N/A"} · {new Date(selected.createdAt).toLocaleDateString("vi-VN")}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelected(null)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border text-[16px] font-black transition-all hover:scale-[0.99]"
                                style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}
                            >
                                ×
                            </button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <AdminSummaryCard
                                label="Trạng thái"
                                value={statusTone[selected.status]?.label || selected.status}
                                detail="Đây là trạng thái hiện tại của yêu cầu hỗ trợ trong luồng xử lý Admin."
                                accent={statusTone[selected.status]?.text || ADMIN_TONE.rose}
                            />
                            <AdminSummaryCard
                                label="Trường"
                                value={selected.schoolName}
                                detail="Bên khởi tạo hoặc chịu ảnh hưởng chính trong tình huống hỗ trợ này."
                                accent={ADMIN_TONE.sky}
                            />
                            <AdminSummaryCard
                                label="Nhà cung cấp"
                                value={selected.providerName ?? "N/A"}
                                detail="Bên đối ứng cần được phối hợp hoặc theo dõi trong quá trình giải quyết."
                                accent={ADMIN_TONE.amber}
                            />
                        </div>

                        <div className="rounded-xl border p-4 text-[14px] font-semibold max-h-40 overflow-y-auto" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.soft, color: "#3D384A" }}>
                            {selected.description}
                        </div>

                        {selected.response && (
                            <div className="rounded-xl border p-4 text-[14px] max-h-32 overflow-y-auto" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.skySoft }}>
                                <p className="mb-1 text-[12px] font-black uppercase" style={{ color: "#1D63BE" }}>
                                    Phản hồi hiện có
                                </p>
                                <p className="font-semibold whitespace-pre-wrap" style={{ color: "#1A3A6B" }}>
                                    {selected.response}
                                </p>
                            </div>
                        )}

                        <div className="space-y-3">
                            <textarea
                                value={note}
                                onChange={(event) => setNote(event.target.value)}
                                placeholder="Ghi chú của Admin..."
                                className="h-24 w-full resize-none rounded-xl border px-4 py-3 text-[14px] font-semibold outline-none"
                                style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}
                            />
                            <select
                                value={action}
                                onChange={(event) => setAction(event.target.value)}
                                className="w-full rounded-xl border px-4 py-3 text-[14px] font-semibold outline-none"
                                style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}
                            >
                                <option value="">Chỉ thêm ghi chú</option>
                                <option value="escalate">Chuyển sang đang xử lý</option>
                                <option value="resolve">Đánh dấu đã giải quyết</option>
                                <option value="close">Đóng hồ sơ</option>
                            </select>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleIntervene}
                                    disabled={submitting || !note.trim()}
                                    className="flex-1 rounded-xl border py-3 text-[15px] font-extrabold text-white transition-all disabled:opacity-50 hover:scale-[0.99]"
                                    style={{ borderColor: ADMIN_TONE.violet, background: ADMIN_TONE.violet }}
                                >
                                    {submitting ? "Đang xử lý..." : "Gửi can thiệp"}
                                </button>
                                <button
                                    onClick={() => setSelected(null)}
                                    className="flex-1 rounded-xl border py-3 text-[15px] font-extrabold transition-all hover:scale-[0.99]"
                                    style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell, color: ADMIN_TONE.pageInk }}
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
