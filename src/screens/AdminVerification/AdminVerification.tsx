import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
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
    const [isCollapsed, toggle] = useSidebarCollapsed();
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
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} onLogout={handleLogout} />
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="nb-breadcrumb-bar px-6 lg:px-10 py-5">
                        <Breadcrumb><BreadcrumbList>
                            <BreadcrumbItem><BreadcrumbLink href="/admin/dashboard" className="font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                            <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                            <BreadcrumbItem><BreadcrumbPage className="font-semibold text-[#4c5769] text-base">Xác minh tài khoản</BreadcrumbPage></BreadcrumbItem>
                        </BreadcrumbList></Breadcrumb>
                    </div>
                    <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6">
                        <h1 className="font-extrabold text-[#1A1A2E] text-[28px]">✅ Xác minh tài khoản</h1>

                        {/* Tabs */}
                        <div className="flex gap-1 nb-card-static p-1 w-fit">
                            {(["School", "Provider"] as const).map(tab => (
                                <button key={tab} onClick={() => setActiveTab(tab)}
                                    className={`nb-tab ${activeTab === tab ? "nb-tab-active" : ""}`}>
                                    {tab === "School" ? "🏫 Quản lý trường" : "🏭 Nhà cung cấp"}
                                    <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs font-bold ${activeTab === tab ? "bg-white/20" : "bg-[#E5E7EB]"}`}>{items.filter(i => i.type === tab).length}</span>
                                </button>
                            ))}
                        </div>

                        {/* Table */}
                        <div className="nb-card-static overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="nb-table">
                                    <thead><tr>
                                        <th>Họ tên</th><th>Email</th><th>Ngày đăng ký</th><th className="text-center">Hành động</th>
                                    </tr></thead>
                                    <tbody>
                                        {loading ? Array.from({ length: 3 }).map((_, i) => (
                                            <tr key={i}>
                                                {Array.from({ length: 4 }).map((_, j) => <td key={j}><div className="h-4 bg-gray-200 rounded w-24 animate-pulse" /></td>)}
                                            </tr>
                                        )) : filtered.length === 0 ? (
                                            <tr><td colSpan={4} className="text-center py-12 text-[#9CA3AF]">
                                                Không có yêu cầu xác minh {activeTab === "School" ? "trường" : "nhà cung cấp"} nào đang chờ
                                            </td></tr>
                                        ) : filtered.map(item => (
                                            <tr key={item.id}>
                                                <td className="font-semibold text-[#1A1A2E]">{item.name}</td>
                                                <td className="text-[#4c5769]">{item.email}</td>
                                                <td className="text-[#6B7280]">{new Date(item.createdAt).toLocaleDateString("vi")}</td>
                                                <td className="text-center">
                                                    <div className="flex gap-2 justify-center">
                                                        <button onClick={() => setActionModal({ item, action: "Approve" })} className="nb-btn text-xs py-1.5 px-3 bg-[#10B981] text-white border-[#065F46] shadow-[2px_2px_0_#065F46]">✅ Duyệt</button>
                                                        <button onClick={() => setActionModal({ item, action: "Reject" })} className="nb-btn text-xs py-1.5 px-3 bg-[#EF4444] text-white border-[#991B1B] shadow-[2px_2px_0_#991B1B]">❌ Từ chối</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="px-6 py-3 bg-[#F9FAFB] border-t-2 border-[#1A1A2E] text-xs text-[#6B7280] font-semibold">
                                Tổng: {filtered.length} yêu cầu chờ xác minh
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* Action Modal */}
            {actionModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setActionModal(null)}>
                    <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-4 border-2 border-[#1A1A2E] shadow-[6px_6px_0_#1A1A2E]" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <h2 className="font-extrabold text-lg text-[#1A1A2E]">
                                {actionModal.action === "Approve" ? "✅ Duyệt tài khoản" : "❌ Từ chối tài khoản"}
                            </h2>
                            <button onClick={() => setActionModal(null)} className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-[#1A1A2E] hover:bg-[#F3F4F6] font-bold">✕</button>
                        </div>
                        <div className="text-sm space-y-1">
                            <p><span className="text-[#6B7280]">Tên:</span> <span className="font-semibold">{actionModal.item.name}</span></p>
                            <p><span className="text-[#6B7280]">Email:</span> <span className="font-semibold">{actionModal.item.email}</span></p>
                            <p><span className="text-[#6B7280]">Loại:</span> <span className="font-semibold">{actionModal.item.type === "School" ? "Quản lý trường" : "Nhà cung cấp"}</span></p>
                        </div>
                        {actionModal.action === "Reject" && (
                            <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                                placeholder="Lý do từ chối (bắt buộc)..." className="nb-input resize-none h-20" />
                        )}
                        <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)}
                            placeholder="Ghi chú admin (không bắt buộc)..." className="nb-input resize-none h-16" />
                        <div className="flex gap-2">
                            <button onClick={handleAction}
                                disabled={actionLoading || (actionModal.action === "Reject" && !rejectionReason.trim())}
                                className={`flex-1 nb-btn text-sm py-2.5 disabled:opacity-50 ${
                                    actionModal.action === "Approve" ? "bg-[#10B981] text-white border-[#065F46] shadow-[3px_3px_0_#065F46]" : "bg-[#EF4444] text-white border-[#991B1B] shadow-[3px_3px_0_#991B1B]"
                                }`}>
                                {actionLoading ? "Đang xử lý..." : actionModal.action === "Approve" ? "✅ Xác nhận duyệt" : "❌ Xác nhận từ chối"}
                            </button>
                            <button onClick={() => setActionModal(null)} className="flex-1 nb-btn-outline py-2.5 text-sm">Huỷ</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminVerification;
