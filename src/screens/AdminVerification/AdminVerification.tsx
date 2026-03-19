import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { DashboardSidebar } from "../../components/layout";
import { useAdminSidebarConfig } from "../../hooks/useAdminSidebarConfig";
import { getUsers, approveSchoolRequest, approveProviderRequest, type UserDto } from "../../lib/api/admin";

type VerificationItem = {
    id: string;
    name: string;
    email: string;
    type: "School" | "Provider";
    status: string;
    createdAt: string;
    schoolName?: string;
    providerName?: string;
};

export const AdminVerification = (): JSX.Element => {
    const navigate = useNavigate();
    const sidebarConfig = useAdminSidebarConfig();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<VerificationItem[]>([]);
    const [activeTab, setActiveTab] = useState<"School" | "Provider">("School");
    const [actionModal, setActionModal] = useState<{ item: VerificationItem; action: "Approve" | "Reject" } | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [adminNote, setAdminNote] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const users: UserDto[] = await getUsers();
            // Filter pending School+Provider users
            const pending = users
                .filter(u => (u.role === "School" || u.role === "Provider") && u.status === "Pending")
                .map(u => ({
                    id: u.id,
                    name: u.fullName,
                    email: u.email,
                    type: u.role as "School" | "Provider",
                    status: u.status,
                    createdAt: u.createdAt,
                }));
            setItems(pending);
        } catch { setItems([]); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filtered = items.filter(i => i.type === activeTab);

    const handleAction = async () => {
        if (!actionModal) return;
        setActionLoading(true);
        try {
            const { item, action } = actionModal;
            if (item.type === "School") {
                await approveSchoolRequest(item.id, action, action === "Reject" ? rejectionReason : undefined, adminNote || undefined);
            } else {
                await approveProviderRequest(item.id, action, action === "Reject" ? rejectionReason : undefined, adminNote || undefined);
            }
            setActionModal(null); setRejectionReason(""); setAdminNote("");
            await fetchData();
        } catch { /* */ }
        finally { setActionLoading(false); }
    };

    const handleLogout = () => {
        localStorage.removeItem("access_token"); localStorage.removeItem("user"); localStorage.removeItem("expires_in");
        sessionStorage.removeItem("access_token"); sessionStorage.removeItem("user"); sessionStorage.removeItem("expires_in");
        navigate("/signin", { replace: true });
    };

    return (
        <div className="bg-[#f6f7f8] w-full min-h-screen flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[20rem] xl:w-[23.75rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(c => !c)} onLogout={handleLogout} />
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="bg-white border-b border-[#cbcad7] px-6 lg:px-10 py-5">
                        <Breadcrumb><BreadcrumbList>
                            <BreadcrumbItem><BreadcrumbLink href="/admin/dashboard" className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                            <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                            <BreadcrumbItem><BreadcrumbPage className="[font-family:'Montserrat',Helvetica] font-semibold text-[#4c5769] text-base">Xác minh tài khoản</BreadcrumbPage></BreadcrumbItem>
                        </BreadcrumbList></Breadcrumb>
                    </div>
                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6">
                        <h1 className="[font-family:'Montserrat',Helvetica] font-bold text-black text-[28px]">✅ Xác minh tài khoản</h1>

                        {/* Tabs */}
                        <div className="flex gap-1 bg-white border border-[#CBCAD7] rounded-xl p-1 w-fit">
                            {(["School", "Provider"] as const).map(tab => (
                                <button key={tab} onClick={() => setActiveTab(tab)}
                                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold [font-family:'Montserrat',Helvetica] transition-colors ${
                                        activeTab === tab ? "bg-[#6366F1] text-white" : "text-[#6B7280] hover:bg-gray-100"
                                    }`}>
                                    {tab === "School" ? "🏫 Quản lý trường" : "🏭 Nhà cung cấp"}
                                    <span className="ml-2 px-1.5 py-0.5 rounded-full bg-white/20 text-xs">{items.filter(i => i.type === tab).length}</span>
                                </button>
                            ))}
                        </div>

                        {/* Table */}
                        <div className="bg-white border border-[#CBCAD7] rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm [font-family:'Montserrat',Helvetica]">
                                    <thead><tr className="bg-[#F9FAFB] border-b border-[#CBCAD7]">
                                        <th className="text-left px-6 py-3 font-semibold text-[#6B7280]">Họ tên</th>
                                        <th className="text-left px-6 py-3 font-semibold text-[#6B7280]">Email</th>
                                        <th className="text-left px-6 py-3 font-semibold text-[#6B7280]">Ngày đăng ký</th>
                                        <th className="text-center px-6 py-3 font-semibold text-[#6B7280]">Hành động</th>
                                    </tr></thead>
                                    <tbody>
                                        {loading ? Array.from({ length: 3 }).map((_, i) => (
                                            <tr key={i} className="border-b animate-pulse">
                                                {Array.from({ length: 4 }).map((_, j) => <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24" /></td>)}
                                            </tr>
                                        )) : filtered.length === 0 ? (
                                            <tr><td colSpan={4} className="text-center py-12 text-[#9CA3AF]">
                                                Không có yêu cầu xác minh {activeTab === "School" ? "trường" : "nhà cung cấp"} nào đang chờ
                                            </td></tr>
                                        ) : filtered.map(item => (
                                            <tr key={item.id} className="border-b border-gray-100 hover:bg-[#F9FAFB] transition-colors">
                                                <td className="px-6 py-4 font-semibold text-[#1A1A2E]">{item.name}</td>
                                                <td className="px-6 py-4 text-[#4c5769]">{item.email}</td>
                                                <td className="px-6 py-4 text-[#6B7280]">{new Date(item.createdAt).toLocaleDateString("vi")}</td>
                                                <td className="px-6 py-4 text-center flex gap-2 justify-center">
                                                    <button onClick={() => setActionModal({ item, action: "Approve" })}
                                                        className="px-3 py-1.5 text-xs font-semibold bg-[#10B981] text-white rounded-lg hover:bg-[#059669] transition-colors">
                                                        ✅ Duyệt
                                                    </button>
                                                    <button onClick={() => setActionModal({ item, action: "Reject" })}
                                                        className="px-3 py-1.5 text-xs font-semibold bg-[#EF4444] text-white rounded-lg hover:bg-[#DC2626] transition-colors">
                                                        ❌ Từ chối
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="px-6 py-3 bg-[#F9FAFB] border-t border-[#CBCAD7] text-xs text-[#6B7280] [font-family:'Montserrat',Helvetica]">
                                Tổng: {filtered.length} yêu cầu chờ xác minh
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* Action Modal */}
            {actionModal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setActionModal(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl" onClick={e => e.stopPropagation()}>
                        <h2 className="[font-family:'Montserrat',Helvetica] font-bold text-lg">
                            {actionModal.action === "Approve" ? "✅ Duyệt tài khoản" : "❌ Từ chối tài khoản"}
                        </h2>
                        <div className="text-sm [font-family:'Montserrat',Helvetica] space-y-1">
                            <p><span className="text-[#6B7280]">Tên:</span> <span className="font-semibold">{actionModal.item.name}</span></p>
                            <p><span className="text-[#6B7280]">Email:</span> <span className="font-semibold">{actionModal.item.email}</span></p>
                            <p><span className="text-[#6B7280]">Loại:</span> <span className="font-semibold">{actionModal.item.type === "School" ? "Quản lý trường" : "Nhà cung cấp"}</span></p>
                        </div>

                        {actionModal.action === "Reject" && (
                            <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                                placeholder="Lý do từ chối (bắt buộc)..."
                                className="w-full border border-[#CBCAD7] rounded-xl px-4 py-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-[#EF4444]/30" />
                        )}

                        <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)}
                            placeholder="Ghi chú admin (không bắt buộc)..."
                            className="w-full border border-[#CBCAD7] rounded-xl px-4 py-3 text-sm resize-none h-16 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30" />

                        <div className="flex gap-2">
                            <button onClick={handleAction}
                                disabled={actionLoading || (actionModal.action === "Reject" && !rejectionReason.trim())}
                                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm text-white disabled:opacity-50 transition-colors ${
                                    actionModal.action === "Approve" ? "bg-[#10B981] hover:bg-[#059669]" : "bg-[#EF4444] hover:bg-[#DC2626]"
                                }`}>
                                {actionLoading ? "Đang xử lý..." : actionModal.action === "Approve" ? "✅ Xác nhận duyệt" : "❌ Xác nhận từ chối"}
                            </button>
                            <button onClick={() => setActionModal(null)}
                                className="flex-1 border border-[#CBCAD7] py-2.5 rounded-xl font-semibold hover:bg-gray-50 text-sm [font-family:'Montserrat',Helvetica]">
                                Huỷ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminVerification;
