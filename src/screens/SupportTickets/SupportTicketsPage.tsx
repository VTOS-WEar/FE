import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Clock3, LifeBuoy, MessageSquare, Plus, SearchCheck, XCircle } from "lucide-react";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { useProviderSidebarConfig } from "../../hooks/useProviderSidebarConfig";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useSidebarConfig } from "../../hooks/useSidebarConfig";
import { createSupportTicket, getMySupportTickets, type SupportTicketDto, type SupportTicketListResult } from "../../lib/api/supportTickets";
import { TeacherWorkspaceShell } from "../TeacherWorkspace/TeacherWorkspaceShell";

type RoleMode = "Parent" | "Provider" | "School" | "HomeroomTeacher";

const statusMeta: Record<string, { label: string; className: string; icon: typeof AlertCircle }> = {
    Open: { label: "Đang mở", className: "bg-rose-50 text-rose-700 border-rose-100", icon: AlertCircle },
    InProgress: { label: "Đang xử lý", className: "bg-amber-50 text-amber-700 border-amber-100", icon: Clock3 },
    Resolved: { label: "Đã giải quyết", className: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: CheckCircle2 },
    Closed: { label: "Đã đóng", className: "bg-slate-100 text-slate-600 border-slate-200", icon: XCircle },
};

const roleCopy: Record<RoleMode, { title: string; subtitle: string; empty: string }> = {
    Parent: {
        title: "Hỗ trợ Admin",
        subtitle: "Gửi yêu cầu khi cần Admin kiểm tra tài khoản, đơn hàng, thanh toán hoặc thông tin học sinh.",
        empty: "Bạn chưa có yêu cầu hỗ trợ nào.",
    },
    Provider: {
        title: "Yêu cầu hỗ trợ",
        subtitle: "Tạo ticket khi cần Admin hỗ trợ vấn đề tài khoản, hợp đồng, đơn hàng, ví hoặc vận hành.",
        empty: "Nhà cung cấp chưa gửi yêu cầu hỗ trợ nào.",
    },
    School: {
        title: "Yêu cầu hỗ trợ",
        subtitle: "Gửi ticket cho Admin khi trường cần hỗ trợ tài khoản, dữ liệu học sinh, công bố học kỳ, hợp đồng hoặc thanh toán.",
        empty: "Trường chưa gửi yêu cầu hỗ trợ nào.",
    },
    HomeroomTeacher: {
        title: "Hỗ trợ Admin",
        subtitle: "Gửi yêu cầu khi cần Admin hỗ trợ tài khoản giáo viên, lớp chủ nhiệm, thông báo hoặc báo cáo.",
        empty: "Giáo viên chưa gửi yêu cầu hỗ trợ nào.",
    },
};

function getStoredRole(): RoleMode {
    try {
        const raw = localStorage.getItem("user") ?? sessionStorage.getItem("user");
        const role = raw ? JSON.parse(raw)?.role : "";
        if (role === "Provider" || role === "School" || role === "HomeroomTeacher") return role;
    } catch {
        // Fall through to Parent.
    }
    return "Parent";
}

function formatDate(value?: string | null) {
    if (!value) return "-";
    return new Date(value).toLocaleString("vi-VN");
}

export function SupportTicketsPage(): JSX.Element {
    const role = getStoredRole();
    const providerSidebarConfig = useProviderSidebarConfig();
    const schoolSidebarConfig = useSidebarConfig();
    const [isCollapsed, toggle] = useSidebarCollapsed();

    const content = <SupportTicketsPanel role={role} />;

    if (role === "Parent") return content;

    if (role === "HomeroomTeacher") {
        return (
            <TeacherWorkspaceShell
                breadcrumbs={[{ label: "Teacher workspace", href: "/teacher/dashboard" }, { label: "Hỗ trợ" }]}
                showBackButton={false}
                showIdentityHeader={false}
            >
                {content}
            </TeacherWorkspaceShell>
        );
    }

    const sidebarConfig = role === "Provider" ? providerSidebarConfig : schoolSidebarConfig;

    return (
        <div className="nb-page flex flex-col">
            <div className="flex flex-1 flex-col lg:flex-row">
                <div className={`${isCollapsed ? "lg:w-16" : "lg:w-[16rem]"} flex-shrink-0 lg:sticky lg:top-0 lg:h-screen transition-all duration-300`}>
                    <DashboardSidebar {...sidebarConfig} isCollapsed={isCollapsed} onToggle={toggle} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                    <TopNavBar>
                        <div className="text-base font-bold text-gray-900">Hỗ trợ Admin</div>
                    </TopNavBar>
                    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{content}</main>
                </div>
            </div>
        </div>
    );
}

function SupportTicketsPanel({ role }: { role: RoleMode }): JSX.Element {
    const copy = roleCopy[role];
    const [data, setData] = useState<SupportTicketListResult | null>(null);
    const [status, setStatus] = useState("");
    const [selected, setSelected] = useState<SupportTicketDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({ title: "", category: "General", description: "" });

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getMySupportTickets({ page: 1, pageSize: 30, status: status || undefined });
            setData(result);
            setSelected((current) => {
                if (!current) return null;
                return result.items.find((item) => item.id === current.id) ?? null;
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Không thể tải danh sách hỗ trợ.");
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => {
        void load();
    }, [load]);

    const stats = useMemo(() => [
        { label: "Đang mở", value: data?.openCount ?? 0, icon: AlertCircle, tone: "text-rose-700 bg-rose-50 border-rose-100" },
        { label: "Đang xử lý", value: data?.inProgressCount ?? 0, icon: Clock3, tone: "text-amber-700 bg-amber-50 border-amber-100" },
        { label: "Đã giải quyết", value: data?.resolvedCount ?? 0, icon: CheckCircle2, tone: "text-emerald-700 bg-emerald-50 border-emerald-100" },
    ], [data]);

    const handleSubmit = async () => {
        if (!form.title.trim() || !form.description.trim()) return;
        setSubmitting(true);
        setError(null);
        try {
            const created = await createSupportTicket({
                title: form.title.trim(),
                category: form.category.trim() || "General",
                description: form.description.trim(),
            });
            setForm({ title: "", category: "General", description: "" });
            await load();
            setSelected(created);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Không thể tạo yêu cầu hỗ trợ.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft-sm sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-sky-700">
                            <LifeBuoy className="h-4 w-4" />
                            Support desk
                        </div>
                        <h1 className="mt-4 text-2xl font-black text-slate-950 sm:text-3xl">{copy.title}</h1>
                        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{copy.subtitle}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
                        {stats.map((item) => {
                            const Icon = item.icon;
                            return (
                                <div key={item.label} className={`rounded-xl border px-4 py-3 ${item.tone}`}>
                                    <Icon className="h-5 w-5" />
                                    <p className="mt-2 text-2xl font-black">{item.value}</p>
                                    <p className="text-xs font-bold uppercase">{item.label}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {error && (
                <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                    {error}
                </div>
            )}

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
                <section className="rounded-2xl border border-slate-200 bg-white shadow-soft-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-black text-slate-950">Danh sách ticket</h2>
                            <p className="text-sm font-semibold text-slate-500">{data?.total ?? 0} yêu cầu</p>
                        </div>
                        <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none">
                            <option value="">Tất cả trạng thái</option>
                            <option value="Open">Đang mở</option>
                            <option value="InProgress">Đang xử lý</option>
                            <option value="Resolved">Đã giải quyết</option>
                            <option value="Closed">Đã đóng</option>
                        </select>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {loading ? (
                            <div className="px-5 py-10 text-center text-sm font-bold text-slate-500">Đang tải...</div>
                        ) : data?.items.length ? (
                            data.items.map((ticket) => {
                                const meta = statusMeta[ticket.status] ?? statusMeta.Open;
                                const Icon = meta.icon;
                                return (
                                    <button
                                        key={ticket.id}
                                        type="button"
                                        onClick={() => setSelected(ticket)}
                                        className={`w-full px-5 py-4 text-left transition-colors hover:bg-sky-50/50 ${selected?.id === ticket.id ? "bg-sky-50" : "bg-white"}`}
                                    >
                                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="text-base font-black text-slate-950">{ticket.title}</h3>
                                                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-black ${meta.className}`}>
                                                        <Icon className="h-3.5 w-3.5" />
                                                        {meta.label}
                                                    </span>
                                                </div>
                                                <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-600">{ticket.description}</p>
                                            </div>
                                            <div className="text-xs font-bold text-slate-500 lg:text-right">
                                                <p>{ticket.category}</p>
                                                <p className="mt-1">{formatDate(ticket.createdAt)}</p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="px-5 py-12 text-center">
                                <SearchCheck className="mx-auto h-10 w-10 text-slate-300" />
                                <p className="mt-3 text-sm font-bold text-slate-500">{copy.empty}</p>
                            </div>
                        )}
                    </div>
                </section>

                <aside className="space-y-6">
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft-sm">
                        <div className="flex items-center gap-2">
                            <Plus className="h-5 w-5 text-sky-700" />
                            <h2 className="text-lg font-black text-slate-950">Tạo ticket mới</h2>
                        </div>
                        <div className="mt-4 space-y-3">
                            <input
                                value={form.title}
                                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                                placeholder="Tiêu đề"
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-sky-300"
                            />
                            <select
                                value={form.category}
                                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-sky-300"
                            >
                                <option value="General">Chung</option>
                                <option value="Account">Tài khoản</option>
                                <option value="Order">Đơn hàng</option>
                                <option value="Payment">Thanh toán / ví</option>
                                <option value="Contract">Hợp đồng</option>
                                <option value="Data">Dữ liệu</option>
                                <option value="Technical">Kỹ thuật</option>
                            </select>
                            <textarea
                                value={form.description}
                                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                                placeholder="Mô tả vấn đề cần Admin hỗ trợ"
                                className="h-32 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold leading-6 outline-none focus:border-sky-300"
                            />
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={submitting || !form.title.trim() || !form.description.trim()}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <MessageSquare className="h-4 w-4" />
                                {submitting ? "Đang gửi..." : "Gửi Admin"}
                            </button>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft-sm">
                        <h2 className="text-lg font-black text-slate-950">Chi tiết</h2>
                        {selected ? (
                            <div className="mt-4 space-y-4">
                                <div>
                                    <p className="text-xs font-black uppercase text-slate-400">Ticket</p>
                                    <p className="mt-1 text-base font-black text-slate-950">{selected.title}</p>
                                </div>
                                <p className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-700">{selected.description}</p>
                                {selected.response ? (
                                    <div className="rounded-xl border border-sky-100 bg-sky-50 p-4">
                                        <p className="text-xs font-black uppercase text-sky-700">Phản hồi từ Admin</p>
                                        <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-800">{selected.response}</p>
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm font-bold text-amber-800">
                                        Admin chưa phản hồi ticket này.
                                    </div>
                                )}
                                <div className="grid gap-3 text-sm font-semibold text-slate-600">
                                    <p>Ngày gửi: {formatDate(selected.createdAt)}</p>
                                    <p>Cập nhật: {formatDate(selected.respondedAt)}</p>
                                    <p>Giải quyết: {formatDate(selected.resolvedAt)}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="mt-4 text-sm font-semibold leading-6 text-slate-500">Chọn một ticket trong danh sách để xem phản hồi và lịch sử xử lý.</p>
                        )}
                    </section>
                </aside>
            </div>
        </div>
    );
}
