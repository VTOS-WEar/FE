import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";

export const ADMIN_TONE = {
    pageInk: "#0F172A",
    muted: "#4c5769",
    line: "#E5E7EB",
    shell: "#FFFFFF",
    soft: "#F8FAFC",
    violet: "#BE123C",
    violetSoft: "#FFF1F2",
    emerald: "#0F9D7A",
    emeraldSoft: "#E8FFF7",
    amber: "#C68508",
    amberSoft: "#FFF6D9",
    rose: "#BE123C",
    roseSoft: "#FFF0F3",
    sky: "#2477E4",
    skySoft: "#ECF5FF",
} as const;

export function AdminBadge({
    children,
    bg = "#FFFFFF",
    text = "#374151",
}: {
    children: ReactNode;
    bg?: string;
    text?: string;
}) {
    return (
        <span
            className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-[12px] font-semibold uppercase tracking-wide shadow-soft-xs"
            style={{ background: bg, color: text }}
        >
            {children}
        </span>
    );
}

export function AdminTopNavTitle({
    title,
    icon,
}: {
    title: string;
    icon?: ReactNode;
}) {
    return (
        <div className="flex items-center gap-2 px-2 py-2">
            <span className="text-rose-700">{icon ?? <ShieldCheck className="h-5 w-5" />}</span>
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        </div>
    );
}

export function AdminHero({
    eyebrow,
    title,
    description,
    stats,
}: {
    eyebrow: string;
    title: string;
    description?: string;
    stats: Array<{ label: string; value: string }>;
}) {
    return (
        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">{eyebrow}</p>
                <h1 className="mt-1 text-2xl font-bold leading-tight text-slate-950">{title}</h1>
                {description ? (
                    <p className="mt-1 max-w-3xl text-sm font-normal text-slate-500">{description}</p>
                ) : null}
            </div>
            {stats.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:w-[380px]">
                    {stats.map((item) => (
                        <div key={item.label} className="rounded-[8px] border border-gray-200 bg-white px-4 py-3 shadow-soft-xs">
                            <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-slate-500">{item.label}</p>
                            <p className="mt-2 text-2xl font-bold leading-none text-slate-950">{item.value}</p>
                        </div>
                    ))}
                </div>
            ) : null}
        </section>
    );
}

export function AdminSummaryCard({
    label,
    value,
    detail,
    accent,
}: {
    label: string;
    value: string;
    detail?: string;
    accent: string;
}) {
    return (
        <article className="min-h-[118px] rounded-[8px] border p-5 shadow-soft-sm" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}>
            <div className="flex h-full items-center gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-slate-50 shadow-soft-xs">
                    <span className="h-5 w-5 rounded-full" style={{ background: accent }} />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700">{label}</p>
                    <p className="mt-2 text-2xl font-bold leading-tight" style={{ color: accent }}>
                        {value}
                    </p>
                    {detail ? <p className="mt-1 line-clamp-2 text-xs font-normal text-slate-600">{detail}</p> : null}
                </div>
            </div>
        </article>
    );
}

export function AdminEmptyState({
    title,
    icon,
    bg,
}: {
    title: string;
    detail?: string;
    icon: ReactNode;
    bg: string;
}) {
    return (
        <div className="flex min-h-[220px] flex-col items-center justify-center px-6 py-10 text-center">
            <div
                className="flex h-14 w-14 items-center justify-center rounded-[8px] border border-gray-200 text-[24px] shadow-soft-xs"
                style={{ background: bg }}
            >
                {icon}
            </div>
            <div className="mt-4 text-lg font-bold" style={{ color: ADMIN_TONE.pageInk }}>
                {title}
            </div>
        </div>
    );
}
