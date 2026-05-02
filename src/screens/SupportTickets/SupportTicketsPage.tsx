import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, Clock3, Eye, LifeBuoy, MessageSquare, Plus, SearchCheck, X, XCircle } from "lucide-react";
import { DashboardSidebar } from "../../components/layout";
import { TopNavBar } from "../../components/layout/TopNavBar";
import { PROVIDER_LIST_PAGE_SIZE, ProviderDataTable, type ProviderDataTableColumn } from "../../components/provider/ProviderDataTable";
import { useProviderSidebarConfig } from "../../hooks/useProviderSidebarConfig";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed";
import { useSidebarConfig } from "../../hooks/useSidebarConfig";
import { createSupportTicket, getMySupportTickets, type SupportTicketDto, type SupportTicketListResult } from "../../lib/api/supportTickets";
import { TeacherWorkspaceShell } from "../TeacherWorkspace/TeacherWorkspaceShell";

type RoleMode = "Parent" | "Provider" | "School" | "HomeroomTeacher";
const MIN_PAGE_FETCH_FEEDBACK_MS = 700;

const statusMeta: Record<string, { label: string; className: string; icon: typeof AlertCircle }> = {
    Open: { label: "Đang mở", className: "bg-rose-50 text-rose-700 border-rose-100", icon: AlertCircle },
    InProgress: { label: "Đang xử lý", className: "bg-amber-50 text-amber-700 border-amber-100", icon: Clock3 },
    Resolved: { label: "Đã giải quyết", className: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: CheckCircle2 },
    Closed: { label: "Đã đóng", className: "bg-slate-100 text-slate-600 border-slate-200", icon: XCircle },
};

const roleCopy: Record<RoleMode, { title: string }> = {
    Parent: {
        title: "Hỗ trợ Admin",
    },
    Provider: {
        title: "Yêu cầu hỗ trợ",
    },
    School: {
        title: "Yêu cầu hỗ trợ",
    },
    HomeroomTeacher: {
        title: "Hỗ trợ Admin",
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
    const loadingTone = role === "Provider"
        ? {
            pill: "inline-flex h-10 items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 text-xs font-bold text-blue-700 shadow-soft-sm",
            spinner: "h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-100 border-t-[#3B82F6]",
            text: "text-[#3B82F6]",
            primaryButton: "inline-flex h-10 items-center gap-2 rounded-xl border border-[#3B82F6] bg-[#3B82F6] px-4 text-sm font-bold text-white transition-colors hover:bg-[#2563EB]",
            modalPrimaryButton: "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#3B82F6] px-5 text-sm font-bold text-white transition-colors hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-60",
        }
        : {
            pill: "inline-flex h-10 items-center gap-2 rounded-xl border border-sky-100 bg-white px-3 text-xs font-bold text-sky-700 shadow-soft-sm",
            spinner: "h-3.5 w-3.5 animate-spin rounded-full border-2 border-sky-100 border-t-sky-700",
            text: "text-slate-500",
            primaryButton: "inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-sky-700 px-4 text-sm font-bold text-white transition-colors hover:bg-sky-800",
            modalPrimaryButton: "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sky-700 px-5 text-sm font-bold text-white transition-colors hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60",
        };
    const [data, setData] = useState<SupportTicketListResult | null>(null);
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<SupportTicketDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [fetchingTickets, setFetchingTickets] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({ title: "", category: "General", description: "" });
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const hasLoadedTicketsRef = useRef(false);
    const fetchStartedAtRef = useRef(0);
    const fetchSequenceRef = useRef(0);

    const load = useCallback(async () => {
        const isInitialLoad = !hasLoadedTicketsRef.current;
        const fetchSequence = fetchSequenceRef.current + 1;
        fetchSequenceRef.current = fetchSequence;
        setLoading(isInitialLoad);
        setFetchingTickets(!isInitialLoad);
        fetchStartedAtRef.current = Date.now();
        setError(null);
        try {
            const result = await getMySupportTickets({ page, pageSize: PROVIDER_LIST_PAGE_SIZE, status: status || undefined });
            if (fetchSequence !== fetchSequenceRef.current) return;
            setData(result);
            setSelected((current) => {
                if (!current) return null;
                return result.items.find((item) => item.id === current.id) ?? null;
            });
        } catch (err) {
            if (fetchSequence !== fetchSequenceRef.current) return;
            setError(err instanceof Error ? err.message : "Không thể tải danh sách hỗ trợ.");
        } finally {
            const elapsed = Date.now() - fetchStartedAtRef.current;
            const finish = () => {
                if (fetchSequence !== fetchSequenceRef.current) return;
                hasLoadedTicketsRef.current = true;
                setLoading(false);
                setFetchingTickets(false);
            };

            if (!isInitialLoad && elapsed < MIN_PAGE_FETCH_FEEDBACK_MS) {
                window.setTimeout(finish, MIN_PAGE_FETCH_FEEDBACK_MS - elapsed);
                return;
            }

            finish();
        }
    }, [page, status]);

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
            setIsCreateModalOpen(false);
            await load();
            setSelected(created);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Không thể tạo yêu cầu hỗ trợ.");
        } finally {
            setSubmitting(false);
        }
    };
    const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PROVIDER_LIST_PAGE_SIZE));
    const ticketColumns: ProviderDataTableColumn<SupportTicketDto>[] = [
        {
            key: "ticket",
            header: "Ticket",
            render: (ticket) => (
                <div className="min-w-0">
                    <p className="font-bold text-slate-900">{ticket.title}</p>
                    <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-500">{ticket.description}</p>
                </div>
            ),
        },
        {
            key: "category",
            header: "Danh mục",
            render: (ticket) => <span className="font-semibold text-slate-700">{ticket.category}</span>,
        },
        {
            key: "status",
            header: "Trạng thái",
            render: (ticket) => {
                const meta = statusMeta[ticket.status] ?? statusMeta.Open;
                const Icon = meta.icon;

                return (
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${meta.className}`}>
                        <Icon className="h-3.5 w-3.5" />
                        {meta.label}
                    </span>
                );
            },
        },
        {
            key: "created",
            header: "Ngày gửi",
            render: (ticket) => <span className="whitespace-nowrap font-semibold text-slate-600">{formatDate(ticket.createdAt)}</span>,
        },
        {
            key: "action",
            header: "Action",
            className: "text-right",
            render: (ticket) => (
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        setSelected(ticket);
                    }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-slate-200 bg-white text-slate-700 transition-colors hover:border-sky-200 hover:text-sky-700"
                    aria-label="Xem chi tiết ticket"
                >
                    <Eye className="h-4 w-4" />
                </button>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft-sm sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-sky-700">
                            <LifeBuoy className="h-4 w-4" />
                            Support desk
                        </div>
                        <h1 className="mt-4 text-2xl font-bold text-slate-950 sm:text-3xl">{copy.title}</h1>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
                        {stats.map((item) => {
                            const Icon = item.icon;
                            return (
                                <div key={item.label} className={`rounded-xl border px-4 py-3 ${item.tone}`}>
                                    <Icon className="h-5 w-5" />
                                    <p className="mt-2 text-2xl font-bold">{item.value}</p>
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

            <div className="space-y-6">
                <section className="rounded-2xl border border-slate-200 bg-white shadow-soft-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-950">Danh sách ticket</h2>
                            <p className="text-sm font-semibold text-slate-500">{data?.total ?? 0} yêu cầu</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative">
                                <select
                                    value={status}
                                    onChange={(event) => {
                                        setStatus(event.target.value);
                                        setPage(1);
                                    }}
                                    className="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-11 text-sm font-bold text-slate-700 outline-none"
                                >
                                    <option value="">Tất cả trạng thái</option>
                                    <option value="Open">Đang mở</option>
                                    <option value="InProgress">Đang xử lý</option>
                                    <option value="Resolved">Đã giải quyết</option>
                                    <option value="Closed">Đã đóng</option>
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            </div>
                            {fetchingTickets ? (
                                <div className={loadingTone.pill}>
                                    <span className={loadingTone.spinner} />
                                    Đang tải
                                </div>
                            ) : null}
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(true)}
                                className={loadingTone.primaryButton}
                            >
                                <Plus className="h-4 w-4" />
                                Tạo ticket mới
                            </button>
                        </div>
                    </div>

                    <div className="p-4">
                        {loading ? (
                            <div className={`px-5 py-10 text-center text-sm font-bold ${loadingTone.text}`}>Đang tải...</div>
                        ) : data?.items.length ? (
                            <ProviderDataTable
                                items={data.items}
                                columns={ticketColumns}
                                getKey={(ticket) => ticket.id}
                                onRowClick={(ticket) => setSelected(ticket)}
                                rowClassName={(ticket) => selected?.id === ticket.id ? "bg-sky-50" : ""}
                            />
                        ) : (
                            <div className="px-5 py-12 text-center">
                                <SearchCheck className="mx-auto h-10 w-10 text-slate-300" />
                                <p className="mt-3 text-sm font-bold text-slate-500">Chưa có ticket nào</p>
                            </div>
                        )}
                        {totalPages > 1 ? (
                            <div className="mt-4 flex items-center justify-center gap-3">
                                <button disabled={page <= 1 || fetchingTickets} onClick={() => setPage((current) => current - 1)} className="nb-btn nb-btn-outline nb-btn-sm text-sm">
                                    ← Trước
                                </button>
                                <span className="text-sm font-bold text-gray-500">{page}/{totalPages}</span>
                                <button disabled={page >= totalPages || fetchingTickets} onClick={() => setPage((current) => current + 1)} className="nb-btn nb-btn-outline nb-btn-sm text-sm">
                                    Sau →
                                </button>
                            </div>
                        ) : null}
                    </div>
                </section>

                <aside className="space-y-6">
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft-sm">
                        <h2 className="text-lg font-bold text-slate-950">Chi tiết</h2>
                        {selected ? (
                            <div className="mt-4 space-y-4">
                                <div>
                                    <p className="text-xs font-bold uppercase text-slate-400">Ticket</p>
                                    <p className="mt-1 text-base font-bold text-slate-950">{selected.title}</p>
                                </div>
                                <p className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-700">{selected.description}</p>
                                {selected.response ? (
                                    <div className="rounded-xl border border-sky-100 bg-sky-50 p-4">
                                        <p className="text-xs font-bold uppercase text-sky-700">Phản hồi từ Admin</p>
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
                            <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-500">
                                Chưa có detail nào
                            </div>
                        )}
                    </section>
                </aside>
            </div>

            {isCreateModalOpen ? (
                <div className="fixed inset-0 z-[220] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-[1px]">
                    <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-soft-lg">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Support ticket</p>
                                <h3 className="mt-2 text-xl font-bold text-slate-950">Tạo ticket mới</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-900"
                                aria-label="Đóng modal tạo ticket"
                            >
                                <X className="h-4.5 w-4.5" />
                            </button>
                        </div>
                        <div className="mt-5 space-y-3">
                            <input
                                value={form.title}
                                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-sky-300"
                                placeholder="Tiêu đề ticket"
                            />
                            <div className="relative">
                                <select
                                    value={form.category}
                                    onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                                    className="w-full appearance-none rounded-xl border border-slate-200 py-3 pl-4 pr-11 text-sm font-semibold outline-none focus:border-sky-300"
                                >
                                    <option value="General">Chung</option>
                                    <option value="Account">Tài khoản</option>
                                    <option value="Order">Đơn hàng</option>
                                    <option value="Payment">Thanh toán / ví</option>
                                    <option value="Contract">Hợp đồng</option>
                                    <option value="Data">Dữ liệu</option>
                                    <option value="Technical">Kỹ thuật</option>
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            </div>
                            <textarea
                                value={form.description}
                                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                                className="h-36 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold leading-6 outline-none focus:border-sky-300"
                                placeholder="Mô tả chi tiết vấn đề..."
                            />
                            <div className="flex items-center gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={submitting || !form.title.trim() || !form.description.trim()}
                                    className={loadingTone.modalPrimaryButton}
                                >
                                    <MessageSquare className="h-4 w-4" />
                                    {submitting ? "Đang gửi..." : "Gửi Admin"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900"
                                >
                                    Hủy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
