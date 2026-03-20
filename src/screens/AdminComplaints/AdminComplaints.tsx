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

const STATUS_COLORS: Record<string, string> = {
    Open: "bg-red-100 text-red-700",
    InProgress: "bg-yellow-100 text-yellow-700",
    Resolved: "bg-green-100 text-green-700",
    Closed: "bg-gray-100 text-gray-600",
};

export default function AdminComplaints() {
    const navigate = useNavigate();
    const sidebarConfig = useAdminSidebarConfig();
    const [isCollapsed, setIsCollapsed] = useState(false);
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
        <div className="bg-[#f6f7f8] w-full min-h-screen flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[20rem] xl:w-[23.75rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(c => !c)} onLogout={handleLogout} />
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="bg-white border-b border-[#cbcad7] px-6 lg:px-10 py-5">
                        <Breadcrumb><BreadcrumbList>
                            <BreadcrumbItem><BreadcrumbLink href="/admin/dashboard" className="font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                            <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                            <BreadcrumbItem><BreadcrumbPage className="font-semibold text-[#4c5769] text-base">Khiếu nại</BreadcrumbPage></BreadcrumbItem>
                        </BreadcrumbList></Breadcrumb>
                    </div>
                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6">

                        <h1 className="font-bold text-black text-[28px]">⚠️ Khiếu nại toàn hệ thống</h1>

                        {/* Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-white border border-[#CBCAD7] rounded-2xl p-5 hover:shadow-md transition-shadow">
                                <p className="text-xs font-semibold text-[#6B7280] uppercase">Đang mở</p>
                                <p className="text-2xl font-bold text-red-600 mt-1">{data?.openCount ?? 0}</p>
                            </div>
                            <div className="bg-white border border-[#CBCAD7] rounded-2xl p-5 hover:shadow-md transition-shadow">
                                <p className="text-xs font-semibold text-[#6B7280] uppercase">Đang xử lý</p>
                                <p className="text-2xl font-bold text-yellow-600 mt-1">{data?.inProgressCount ?? 0}</p>
                            </div>
                            <div className="bg-white border border-[#CBCAD7] rounded-2xl p-5 hover:shadow-md transition-shadow">
                                <p className="text-xs font-semibold text-[#6B7280] uppercase">Đã giải quyết</p>
                                <p className="text-2xl font-bold text-green-600 mt-1">{data?.resolvedCount ?? 0}</p>
                            </div>
                        </div>

                        {/* Status tabs */}
                        <div className="flex gap-1 bg-white border border-[#CBCAD7] rounded-xl p-1 w-fit">
                            {STATUS_TABS.map(tab => (
                                <button key={tab.value} onClick={() => { setStatusFilter(tab.value); setPage(1); }}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                        statusFilter === tab.value ? "bg-[#6366F1] text-white" : "text-[#6B7280] hover:bg-gray-100"
                                    }`}>
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Table */}
                        <div className="bg-white border border-[#CBCAD7] rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead><tr className="bg-[#F9FAFB] border-b border-[#CBCAD7]">
                                        <th className="text-left px-5 py-3 font-semibold text-[#6B7280] text-xs uppercase">Tiêu đề</th>
                                        <th className="text-left px-5 py-3 font-semibold text-[#6B7280] text-xs uppercase">Trường</th>
                                        <th className="text-left px-5 py-3 font-semibold text-[#6B7280] text-xs uppercase">NCC</th>
                                        <th className="text-left px-5 py-3 font-semibold text-[#6B7280] text-xs uppercase">Chiến dịch</th>
                                        <th className="text-left px-5 py-3 font-semibold text-[#6B7280] text-xs uppercase">Trạng thái</th>
                                        <th className="text-left px-5 py-3 font-semibold text-[#6B7280] text-xs uppercase">Ngày tạo</th>
                                        <th className="text-center px-5 py-3 font-semibold text-[#6B7280] text-xs uppercase">Hành động</th>
                                    </tr></thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan={7} className="px-5 py-8 text-center text-[#9CA3AF]">Đang tải...</td></tr>
                                        ) : data?.items.length === 0 ? (
                                            <tr><td colSpan={7} className="px-5 py-8 text-center text-[#9CA3AF]">Không có khiếu nại nào</td></tr>
                                        ) : data?.items.map((c: AdminComplaintDto) => (
                                            <tr key={c.id} className="border-b border-gray-100 hover:bg-[#F9FAFB] transition-colors">
                                                <td className="px-5 py-3 font-semibold text-[#1A1A2E] max-w-[200px] truncate">{c.title}</td>
                                                <td className="px-5 py-3 text-gray-600">{c.schoolName}</td>
                                                <td className="px-5 py-3 text-gray-600">{c.providerName ?? "—"}</td>
                                                <td className="px-5 py-3 text-gray-600 max-w-[150px] truncate">{c.campaignName ?? "—"}</td>
                                                <td className="px-5 py-3">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[c.status] ?? "bg-gray-100"}`}>
                                                        {c.status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-[#6B7280] text-xs">{new Date(c.createdAt).toLocaleDateString("vi-VN")}</td>
                                                <td className="px-5 py-3 text-center">
                                                    <button onClick={() => setSelected(c)}
                                                        className="px-3 py-1.5 text-xs font-semibold text-[#6366F1] bg-[#6366F1]/10 rounded-lg hover:bg-[#6366F1]/20 transition-colors">
                                                        Chi tiết
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                                    <span className="text-sm text-[#6B7280]">Trang {page}/{totalPages} ({data?.totalCount} khiếu nại)</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                                            className="border border-[#CBCAD7] px-3 py-1.5 rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50">Trước</button>
                                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                                            className="border border-[#CBCAD7] px-3 py-1.5 rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50">Sau</button>
                                    </div>
                                </div>
                            )}
                        </div>

                    </main>
                </div>
            </div>

            {/* Detail / Intervene Modal */}
            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelected(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-lg mx-4 p-6 shadow-xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-[#1A1A2E] mb-1">{selected.title}</h3>
                        <p className="text-sm text-[#6B7280] mb-4">
                            {selected.schoolName} • {selected.providerName ?? "N/A"} • {new Date(selected.createdAt).toLocaleDateString("vi-VN")}
                        </p>

                        <div className="bg-[#F9FAFB] rounded-xl p-4 mb-4 text-sm text-gray-700 max-h-40 overflow-y-auto">
                            {selected.description}
                        </div>

                        {selected.response && (
                            <div className="bg-blue-50 rounded-xl p-4 mb-4 text-sm text-blue-800 max-h-32 overflow-y-auto whitespace-pre-wrap">
                                <p className="font-semibold mb-1">Phản hồi:</p>
                                {selected.response}
                            </div>
                        )}

                        <div className="space-y-3">
                            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú của Admin..."
                                className="w-full border border-[#CBCAD7] rounded-xl px-4 py-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30" />
                            <select value={action} onChange={e => setAction(e.target.value)}
                                className="w-full border border-[#CBCAD7] rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30">
                                <option value="">Chỉ thêm ghi chú</option>
                                <option value="escalate">Escalate (chuyển InProgress)</option>
                                <option value="resolve">Giải quyết</option>
                                <option value="close">Đóng</option>
                            </select>
                            <div className="flex gap-3">
                                <button onClick={handleIntervene} disabled={submitting || !note.trim()}
                                    className="flex-1 bg-[#6366F1] text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-[#4F46E5] disabled:opacity-50 transition-colors">
                                    {submitting ? "Đang xử lý..." : "Gửi"}
                                </button>
                                <button onClick={() => setSelected(null)}
                                    className="border border-[#CBCAD7] rounded-xl px-4 py-2.5 text-sm text-[#6B7280] hover:bg-gray-50">
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
