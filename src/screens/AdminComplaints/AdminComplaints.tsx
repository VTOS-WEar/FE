import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardSidebar } from "../../components/layout";
import { useAdminSidebarConfig } from "../../hooks/useAdminSidebarConfig";
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import {
    getAdminComplaints, adminInterveneComplaint,
    type AdminComplaintDto, type AdminComplaintListResult
} from "../../lib/api/admin";

const STATUS_TABS = [
    { value: "", label: "Tất cả" },
    { value: "Open", label: "Mở" },
    { value: "InProgress", label: "Đang xử lý" },
    { value: "Resolved", label: "Đã giải quyết" },
    { value: "Closed", label: "Đã đóng" },
];

const STATUS_BADGE: Record<string, string> = {
    Open: "nb-badge nb-badge-red",
    InProgress: "nb-badge nb-badge-yellow",
    Resolved: "nb-badge nb-badge-green",
    Closed: "nb-badge bg-[#F3F4F6] text-[#6B7280]",
};

export default function AdminComplaints() {
    const navigate = useNavigate();
    const sidebarConfig = useAdminSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();
    const [data, setData] = useState<AdminComplaintListResult | null>(null);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState("");
    const [loading, setLoading] = useState(true);

    // Modal
    const [selected, setSelected] = useState<AdminComplaintDto | null>(null);
    const [note, setNote] = useState("");
    const [action, setAction] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAdminComplaints({ page, pageSize: 15, status: statusFilter || undefined });
            setData(res);
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

    const totalPages = data ? Math.ceil(data.totalCount / data.pageSize) : 1;

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="nb-breadcrumb-bar">
                        <Breadcrumb><BreadcrumbList>
                            <BreadcrumbItem><BreadcrumbLink href="/admin/dashboard" className="font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                            <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                            <BreadcrumbItem><BreadcrumbPage className="font-bold text-[#1A1A2E] text-base">Khiếu nại</BreadcrumbPage></BreadcrumbItem>
                        </BreadcrumbList></Breadcrumb>
                    </div>
                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6">

                        <h1 className="font-extrabold text-[#1A1A2E] text-[28px]">⚠️ Khiếu nại toàn hệ thống</h1>

                        {/* Stats — NB stat cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="nb-stat-card nb-card-red">
                                <p className="nb-stat-label">Đang mở</p>
                                <p className="nb-stat-value text-[#EF4444] mt-1">{data?.openCount ?? 0}</p>
                            </div>
                            <div className="nb-stat-card nb-card-yellow">
                                <p className="nb-stat-label">Đang xử lý</p>
                                <p className="nb-stat-value text-[#F59E0B] mt-1">{data?.inProgressCount ?? 0}</p>
                            </div>
                            <div className="nb-stat-card nb-card-green">
                                <p className="nb-stat-label">Đã giải quyết</p>
                                <p className="nb-stat-value text-[#10B981] mt-1">{data?.resolvedCount ?? 0}</p>
                            </div>
                        </div>

                        {/* Status tabs — NB tabs */}
                        <div className="nb-tabs w-fit">
                            {STATUS_TABS.map(tab => (
                                <button key={tab.value} onClick={() => { setStatusFilter(tab.value); setPage(1); }}
                                    className={`nb-tab ${statusFilter === tab.value ? "nb-tab-active" : ""}`}>
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Table — NB table */}
                        <div className="nb-card-static overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="nb-table">
                                    <thead><tr>
                                        <th>Tiêu đề</th>
                                        <th>Trường</th>
                                        <th>Nhà Cung Cấp</th>
                                        <th>Chiến dịch</th>
                                        <th>Trạng thái</th>
                                        <th>Ngày tạo</th>
                                        <th className="text-center">Hành động</th>
                                    </tr></thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan={7} className="px-5 py-8 text-center text-[#9CA3AF]">Đang tải...</td></tr>
                                        ) : data?.items.length === 0 ? (
                                            <tr><td colSpan={7} className="px-5 py-8 text-center text-[#9CA3AF]">Không có khiếu nại nào</td></tr>
                                        ) : data?.items.map((c: AdminComplaintDto) => (
                                            <tr key={c.id}>
                                                <td className="font-bold text-[#1A1A2E] max-w-[200px] truncate">{c.title}</td>
                                                <td>{c.schoolName}</td>
                                                <td>{c.providerName ?? "—"}</td>
                                                <td className="max-w-[150px] truncate">{c.campaignName ?? "—"}</td>
                                                <td>
                                                    <span className={STATUS_BADGE[c.status] ?? "nb-badge"}>
                                                        {c.status}
                                                    </span>
                                                </td>
                                                <td className="text-[#6B7280] text-xs">{new Date(c.createdAt).toLocaleDateString("vi-VN")}</td>
                                                <td className="text-center">
                                                    <button onClick={() => setSelected(c)}
                                                        className="nb-btn nb-btn-outline nb-btn-sm text-xs">
                                                        👁 Chi tiết
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-5 py-3 border-t-2 border-[#1A1A2E] bg-[#F9FAFB]">
                                    <span className="text-sm text-[#6B7280] font-semibold">Trang {page}/{totalPages} ({data?.totalCount} khiếu nại)</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                                            className="nb-btn nb-btn-outline nb-btn-sm text-sm disabled:opacity-40">Trước</button>
                                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                                            className="nb-btn nb-btn-outline nb-btn-sm text-sm disabled:opacity-40">Sau</button>
                                    </div>
                                </div>
                            )}
                        </div>

                    </main>
                </div>
            </div>

            {/* Detail / Intervene Modal — NB style */}
            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelected(null)}>
                    <div className="bg-white rounded-xl w-full max-w-lg mx-4 p-6 border-2 border-[#1A1A2E] shadow-[6px_6px_0_#1A1A2E]" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-extrabold text-[#1A1A2E]">{selected.title}</h3>
                            <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-[#1A1A2E] hover:bg-[#F3F4F6] font-bold">✕</button>
                        </div>
                        <p className="text-sm text-[#6B7280] mb-4 font-medium">
                            {selected.schoolName} • {selected.providerName ?? "N/A"} • {new Date(selected.createdAt).toLocaleDateString("vi-VN")}
                        </p>

                        <div className="nb-card-static p-4 mb-4 text-sm text-gray-700 max-h-40 overflow-y-auto">
                            {selected.description}
                        </div>

                        {selected.response && (
                            <div className="nb-alert nb-alert-info mb-4 text-sm max-h-32 overflow-y-auto">
                                <div>
                                    <p className="font-bold mb-1">Phản hồi:</p>
                                    <p className="whitespace-pre-wrap">{selected.response}</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú của Admin..."
                                className="nb-input w-full resize-none h-20" />
                            <select value={action} onChange={e => setAction(e.target.value)}
                                className="nb-select w-full">
                                <option value="">Chỉ thêm ghi chú</option>
                                <option value="escalate">Escalate (chuyển InProgress)</option>
                                <option value="resolve">Giải quyết</option>
                                <option value="close">Đóng</option>
                            </select>
                            <div className="flex gap-3">
                                <button onClick={handleIntervene} disabled={submitting || !note.trim()}
                                    className="nb-btn nb-btn-purple flex-1 text-sm disabled:opacity-50">
                                    {submitting ? "Đang xử lý..." : "📤 Gửi"}
                                </button>
                                <button onClick={() => setSelected(null)}
                                    className="nb-btn nb-btn-outline flex-1 text-sm">
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
