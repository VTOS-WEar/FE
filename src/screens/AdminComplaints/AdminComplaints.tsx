import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useAdminSidebarConfig } from "../../hooks/useAdminSidebarConfig";
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import {
    getAdminComplaints, adminInterveneComplaint,
    type AdminComplaintDto, type AdminComplaintListResult
} from "../../lib/api/admin";

/* ── Design tokens ── */
const T = {
    surface: "#FFFFFF", surfaceSoft: "#FFFDF9",
    primary: "#8B6BFF", primarySoft: "#E9E1FF",
    successSoft: "#D9F8E8", warningSoft: "#FFF1BF", dangerSoft: "#FFE3D8",
    infoSoft: "#DCEBFF", muted: "#6F6A7D",
};

const STATUS_TONE: Record<string, { bg: string; text: string }> = {
    Open: { bg: T.dangerSoft, text: "#B2452D" },
    InProgress: { bg: T.warningSoft, text: "#9A590E" },
    Resolved: { bg: T.successSoft, text: "#187A4C" },
    Closed: { bg: "#F0EDF5", text: "#6F6A7D" },
};
const STATUS_LABEL: Record<string, string> = {
    Open: "Đang mở", InProgress: "Đang xử lý", Resolved: "Đã giải quyết", Closed: "Đã đóng",
};

function Badge({ children, tone }: { children: React.ReactNode; tone?: { bg: string; text: string } }) {
    const t = tone || { bg: T.surface, text: "#374151" };
    return (
        <span className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-[12px] font-black uppercase tracking-wide shadow-soft-sm"
            style={{ background: t.bg, color: t.text }}>
            {children}
        </span>
    );
}

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
        } catch (e) { console.error(e); }
        setLoading(false);
    }, [page, statusFilter]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleIntervene = async () => {
        if (!selected || !note.trim()) return;
        setSubmitting(true);
        try {
            await adminInterveneComplaint(selected.id, note, action || undefined);
            setSelected(null); setNote(""); setAction("");
            fetchData();
        } catch (e) { console.error(e); }
        setSubmitting(false);
    };

    const handleLogout = () => {
        localStorage.removeItem("access_token"); localStorage.removeItem("user"); localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token"); sessionStorage.removeItem("user"); sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;

    /* ── Column grid ── */
    const gridCols = "2fr 1.5fr 1.5fr 1.5fr 1.2fr 1.2fr 1fr";

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                    <TopNavBar>
                        <Breadcrumb><BreadcrumbList>
                            <BreadcrumbItem><BreadcrumbLink href="/admin/dashboard" className="font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                            <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                            <BreadcrumbItem><BreadcrumbPage className="font-bold text-gray-900 text-base">Khiếu nại</BreadcrumbPage></BreadcrumbItem>
                        </BreadcrumbList></Breadcrumb>
                    </TopNavBar>
                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6 nb-fade-in">
                        {/* Header */}
                        <div>
                            <h1 className="text-[40px] font-black leading-none md:text-[48px] text-gray-900">⚠️ Khiếu nại</h1>
                            <p className="mt-3 max-w-3xl text-[17px] font-semibold leading-8" style={{ color: T.muted }}>
                                Xem xét và can thiệp khiếu nại giữa Trường và Nhà cung cấp trong toàn hệ thống.
                            </p>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { label: "Đang mở", value: data?.openCount ?? 0, color: "#EF4444" },
                                { label: "Đang xử lý", value: data?.inProgressCount ?? 0, color: "#F59E0B" },
                                { label: "Đã giải quyết", value: data?.resolvedCount ?? 0, color: "#10B981" },
                            ].map((s, i) => (
                                <div key={i} className="rounded-2xl border border-gray-200 p-5 shadow-soft-lg">
                                    <p className="text-[12px] font-black uppercase tracking-wide" style={{ color: T.muted }}>{s.label}</p>
                                    <p className="text-[32px] font-black mt-1" style={{ color: s.color }}>{s.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Toolbar */}
                        <div className="rounded-2xl border border-gray-200 p-4 shadow-soft-lg">
                            <div className="flex flex-wrap items-center gap-3">
                                {[
                                    { value: "", label: "Tất cả" },
                                    { value: "Open", label: "Đang mở" },
                                    { value: "InProgress", label: "Đang xử lý" },
                                    { value: "Resolved", label: "Đã giải quyết" },
                                    { value: "Closed", label: "Đã đóng" },
                                ].map(tab => (
                                    <button key={tab.value}
                                        onClick={() => { setStatusFilter(tab.value); setPage(1); }}
                                        className="rounded-full border border-gray-200 px-4 py-1.5 text-[13px] font-extrabold transition-all hover:scale-[0.99] hover:shadow-soft-sm"
                                        style={{
                                            background: statusFilter === tab.value ? T.primary : T.surface,
                                            color: statusFilter === tab.value ? "#fff" : "#374151",
                                        }}>
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-soft-lg">
                            {/* Header */}
                            <div className="sticky top-0 z-10 hidden lg:grid items-center border-b border-gray-200 px-5 py-4"
                                style={{ gridTemplateColumns: gridCols, background: T.primarySoft }}>
                                {["Tiêu đề", "Trường", "Nhà cung cấp", "Chiến dịch", "Trạng thái", "Ngày tạo", "Hành động"].map((h, i, arr) => (
                                    <div key={h} className={`text-[12px] font-black uppercase tracking-[0.08em]${i === arr.length - 1 ? " text-right" : ""}`} style={{ color: "#4E4A5B" }}>{h}</div>
                                ))}
                            </div>

                            {/* Loading */}
                            {loading && (
                                <div className="space-y-3 px-5 py-5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="hidden lg:grid items-center gap-4 rounded-[14px] border px-4 py-4"
                                            style={{ gridTemplateColumns: gridCols, borderColor: "#D9D4E6", background: T.surfaceSoft }}>
                                            {Array.from({ length: 7 }).map((_, j) => (
                                                <div key={j} className="h-5 rounded animate-pulse" style={{ background: "#EAE3FF" }} />
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Empty */}
                            {!loading && data?.items.length === 0 && (
                                <div className="flex min-h-[240px] flex-col items-center justify-center px-6 py-12 text-center">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200 text-[28px] shadow-soft-md"
                                        style={{ background: T.successSoft }}>✅</div>
                                    <div className="mt-5 text-[28px] font-black">Không có khiếu nại nào</div>
                                    <p className="mt-3 max-w-lg text-[15px] font-semibold leading-7" style={{ color: T.muted }}>
                                        Hệ thống chưa ghi nhận khiếu nại nào phù hợp bộ lọc hiện tại.
                                    </p>
                                </div>
                            )}

                            {/* Rows */}
                            {!loading && data && data.items.length > 0 && (
                                <div>
                                    {data.items.map((c, idx) => (
                                        <div key={c.id} className="hidden lg:grid items-center gap-4 border-b px-5 py-4 transition-colors hover:bg-[#F7F2FF] nb-fade-in"
                                            style={{ gridTemplateColumns: gridCols, borderColor: "#D9D4E6", animationDelay: `${idx * 40}ms` }}>
                                            <div className="text-[15px] font-black truncate text-gray-900">{c.title}</div>
                                            <div className="text-[14px] font-semibold" style={{ color: "#3D384A" }}>{c.schoolName}</div>
                                            <div className="text-[14px] font-semibold" style={{ color: "#3D384A" }}>{c.providerName ?? "—"}</div>
                                            <div className="text-[14px] font-semibold truncate" style={{ color: "#3D384A" }}>{c.campaignName ?? "—"}</div>
                                            <div><Badge tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status] || c.status}</Badge></div>
                                            <div className="text-[14px] font-semibold" style={{ color: T.muted }}>{new Date(c.createdAt).toLocaleDateString("vi-VN")}</div>
                                            <div className="flex justify-end">
                                                <button onClick={() => setSelected(c)}
                                                    className="rounded-xl border border-gray-200 px-4 py-2 text-[13px] font-extrabold transition-all hover:scale-[0.99] hover:shadow-soft-sm active:scale-[0.98] active:shadow-none"
                                                    style={{ background: T.surface, color: "#374151" }}>
                                                    👁 Chi tiết
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Mobile cards */}
                                    {data.items.map((c, idx) => (
                                        <div key={`m-${c.id}`} className="lg:hidden border-b p-4 space-y-3 nb-fade-in"
                                            style={{ borderColor: "#D9D4E6", animationDelay: `${idx * 40}ms` }}>
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="text-[16px] font-black truncate text-gray-900">{c.title}</div>
                                                    <div className="text-[13px] font-semibold mt-1" style={{ color: "#3D384A" }}>{c.schoolName} • {c.providerName ?? "N/A"}</div>
                                                </div>
                                                <Badge tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status] || c.status}</Badge>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[13px] font-semibold" style={{ color: T.muted }}>{new Date(c.createdAt).toLocaleDateString("vi-VN")}</span>
                                                <button onClick={() => setSelected(c)}
                                                    className="rounded-xl border border-gray-200 px-4 py-2 text-[13px] font-extrabold transition-all hover:scale-[0.99] hover:shadow-soft-sm active:scale-[0.98] active:shadow-none"
                                                    style={{ background: T.surface, color: "#374151" }}>
                                                    👁 Chi tiết
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Pagination */}
                                    <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 md:flex-row md:items-center md:justify-between"
                                        style={{ background: T.surfaceSoft }}>
                                        <div className="text-[14px] font-bold" style={{ color: T.muted }}>
                                            Trang {page}/{totalPages} · {data.totalCount} khiếu nại
                                        </div>
                                        {totalPages > 1 && (
                                            <div className="flex gap-3">
                                                <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}
                                                    className="rounded-xl border border-gray-200 px-4 py-2 text-[13px] font-extrabold transition-all disabled:opacity-40 hover:scale-[0.99] hover:shadow-soft-sm active:scale-[0.98] active:shadow-none"
                                                    style={{ background: T.surface, color: "#374151" }}>← Trước</button>
                                                <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                                    className="rounded-xl border border-gray-200 px-4 py-2 text-[13px] font-extrabold text-white transition-all disabled:opacity-40 hover:scale-[0.99] hover:shadow-soft-sm active:scale-[0.98] active:shadow-none"
                                                    style={{ background: T.primary }}>Sau →</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>

            {/* ── Detail / Intervene Modal ── */}
            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 nb-backdrop-enter"
                    style={{ background: "rgba(25, 24, 43, 0.55)" }}
                    onClick={() => setSelected(null)}>
                    <div className="w-full max-w-lg rounded-2xl border border-gray-200 p-6 space-y-5 nb-modal-enter max-h-[90vh] overflow-y-auto shadow-soft-lg"
                        style={{ background: T.surface }}
                        onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex justify-between items-center">
                            <h2 className="text-[24px] font-black text-gray-900">{selected.title}</h2>
                            <button onClick={() => setSelected(null)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-[16px] font-black transition-all hover:scale-[0.99] hover:shadow-none"
                                style={{ background: T.surface }}>✕</button>
                        </div>
                        <p className="text-[14px] font-semibold" style={{ color: T.muted }}>
                            {selected.schoolName} • {selected.providerName ?? "N/A"} • {new Date(selected.createdAt).toLocaleDateString("vi-VN")}
                        </p>

                        {/* Description */}
                        <div className="rounded-xl border border-gray-200 p-4 text-[14px] font-semibold max-h-40 overflow-y-auto"
                            style={{ background: T.surfaceSoft, color: "#3D384A" }}>
                            {selected.description}
                        </div>

                        {/* Existing response */}
                        {selected.response && (
                            <div className="rounded-xl border border-gray-200 p-4 text-[14px] max-h-32 overflow-y-auto"
                                style={{ background: T.infoSoft }}>
                                <p className="font-black text-[12px] uppercase mb-1" style={{ color: "#2758B8" }}>Phản hồi</p>
                                <p className="font-semibold whitespace-pre-wrap" style={{ color: "#1A3A6B" }}>{selected.response}</p>
                            </div>
                        )}

                        {/* Intervene form */}
                        <div className="space-y-3">
                            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú của Admin..."
                                className="w-full resize-none h-20 rounded-xl border border-gray-200 px-4 py-3 text-[14px] font-semibold outline-none transition-all placeholder:text-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50 focus:outline-none"
                                style={{ background: T.surface }} />
                            <select value={action} onChange={e => setAction(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-[14px] font-semibold outline-none transition-all placeholder:text-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50 focus:outline-none"
                                style={{ background: T.surface }}>
                                <option value="">Chỉ thêm ghi chú</option>
                                <option value="escalate">Escalate (chuyển InProgress)</option>
                                <option value="resolve">Giải quyết</option>
                                <option value="close">Đóng</option>
                            </select>
                            <div className="flex gap-3">
                                <button onClick={handleIntervene} disabled={submitting || !note.trim()}
                                    className="flex-1 rounded-xl border border-gray-200 py-3 text-[15px] font-extrabold text-white transition-all disabled:opacity-50 hover:scale-[0.99] hover:shadow-soft-sm active:scale-[0.98] active:shadow-none"
                                    style={{ background: T.primary }}>
                                    {submitting ? "Đang xử lý..." : "📤 Gửi"}
                                </button>
                                <button onClick={() => setSelected(null)}
                                    className="flex-1 rounded-xl border border-gray-200 py-3 text-[15px] font-extrabold transition-all hover:scale-[0.99] hover:shadow-soft-sm active:scale-[0.98] active:shadow-none"
                                    style={{ background: T.surface, color: "#374151" }}>
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
