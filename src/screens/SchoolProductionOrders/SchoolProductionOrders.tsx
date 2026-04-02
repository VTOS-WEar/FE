import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { getSchoolProductionOrders, type ProductionOrderListItemDto } from "../../lib/api/productionOrders";

const STATUS_BADGE: Record<string, string> = {
    Pending: "nb-badge nb-badge-yellow",
    Approved: "nb-badge nb-badge-blue",
    InProduction: "nb-badge nb-badge-purple",
    Completed: "nb-badge nb-badge-green",
    Rejected: "nb-badge nb-badge-red",
    Delivered: "nb-badge bg-[#CFFAFE] text-[#0E7490]",
};
const STATUS_LABELS: Record<string, string> = {
    Pending: "Chờ xử lý", Approved: "Đã duyệt", InProduction: "Đang sản xuất",
    Completed: "Hoàn thành", Rejected: "Từ chối", Delivered: "Đã giao",
};
const STATUS_TABS = ["", "Pending", "Approved", "InProduction", "Completed", "Rejected", "Delivered"];

export function SchoolProductionOrders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<ProductionOrderListItemDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const [total, setTotal] = useState(0);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getSchoolProductionOrders(page, pageSize, statusFilter || undefined);
            setOrders(res.items);
            setTotal(res.total);
        } catch (e: any) { console.error("Error fetching production orders:", e); }
        finally { setLoading(false); }
    }, [statusFilter, page]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    return (
        <div className="space-y-6">
            <TopNavBar>
                <Breadcrumb><BreadcrumbList>
                    <BreadcrumbItem><BreadcrumbLink href="/school/dashboard" className="font-semibold text-[#4c5769] text-base">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator className="text-[#cbcad7]">/</BreadcrumbSeparator>
                    <BreadcrumbItem><BreadcrumbPage className="font-bold text-[#1A1A2E] text-base">Đơn sản xuất</BreadcrumbPage></BreadcrumbItem>
                </BreadcrumbList></Breadcrumb>
            </TopNavBar>
            <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6">

            <h1 className="font-extrabold text-[#1A1A2E] text-[28px]">🏭 Đơn sản xuất</h1>

            {/* Status tabs — NB */}
            <div className="nb-tabs w-fit flex-wrap">
                {STATUS_TABS.map(s => (
                    <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                        className={`nb-tab ${statusFilter === s ? "nb-tab-active" : ""}`}>
                        {s ? STATUS_LABELS[s] || s : "Tất cả"}
                    </button>
                ))}
            </div>

            {/* Order list — NB cards */}
            {loading ? (
                <div className="text-center py-16">
                    <div className="inline-block w-8 h-8 border-4 border-[#6938EF] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : orders.length === 0 ? (
                <div className="nb-card-static p-12 text-center">
                    <p className="text-4xl mb-3">🏭</p>
                    <p className="font-medium text-[#9CA3AF]">Chưa có đơn sản xuất nào.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {orders.map(o => (
                        <div key={o.batchId} onClick={() => navigate(`/school/production-orders/${o.batchId}`)}
                            className="nb-card p-5 cursor-pointer">
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-[#1A1A2E] text-lg">{o.batchName}</h3>
                                    <p className="text-sm text-[#6B7280] mt-1">
                                        Chiến dịch: <strong className="text-[#1A1A2E]">{o.campaignName}</strong> · NCC: <strong className="text-[#1A1A2E]">{o.providerName || "—"}</strong> · SL: <strong>{o.totalQuantity}</strong> · {new Date(o.createdDate).toLocaleDateString("vi")}
                                    </p>
                                    {o.deliveryDeadline && (
                                        <p className="text-xs text-[#4C5769] mt-1">📅 Hạn giao: <strong>{new Date(o.deliveryDeadline).toLocaleDateString("vi")}</strong></p>
                                    )}
                                </div>
                                <span className={STATUS_BADGE[o.status] || "nb-badge"}>
                                    {STATUS_LABELS[o.status] || o.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {(() => {
                const totalPages = Math.ceil(total / pageSize);
                return !loading && totalPages > 1 ? (
                    <div className="flex items-center justify-center gap-3 mt-4">
                        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="nb-btn nb-btn-outline nb-btn-sm text-sm">← Trước</button>
                        <span className="text-sm font-bold text-[#6B7280]">{page}/{totalPages} ({total} đơn)</span>
                        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="nb-btn nb-btn-outline nb-btn-sm text-sm">Sau →</button>
                    </div>
                ) : null;
            })()}
            </main>
        </div>
    );
}
