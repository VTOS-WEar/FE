import type { ReactNode } from "react";
import { GraduationCap } from "lucide-react";

export const TEACHER_THEME = {
    pageInk: "#0F172A",
    muted: "#4c5769",
    line: "#E5E7EB",
    shell: "#FFFFFF",
    soft: "#ECFDF5",
    primary: "#059669",
    primaryHover: "#047857",
    primarySoft: "#ECFDF5",
    primaryBorder: "#A7F3D0",
    support: "#0284C7",
    supportSoft: "#E0F2FE",
    warning: "#D97706",
    warningSoft: "#FEF3C7",
    danger: "#E11D48",
    dangerSoft: "#FFF1F2",
    primaryText: "text-emerald-700",
    primaryButton: "inline-flex items-center justify-center gap-2 rounded-[8px] border border-[#059669] bg-[#059669] px-4 py-2.5 text-sm font-semibold text-white shadow-soft-sm transition-colors hover:bg-[#047857] disabled:cursor-not-allowed disabled:opacity-60",
    secondaryButton: "inline-flex items-center justify-center gap-2 rounded-[8px] border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-soft-xs transition-colors hover:border-emerald-300 hover:bg-emerald-50",
    input: "w-full rounded-[8px] border border-gray-200 bg-white px-4 py-3 font-medium text-gray-900 outline-none transition-colors focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50",
    panel: "rounded-[8px] border border-gray-200 bg-white shadow-soft-sm",
} as const;

export const TEACHER_TONE = {
    ...TEACHER_THEME,
    emerald: TEACHER_THEME.primary,
    emeraldSoft: "#D1FAE5",
    amber: TEACHER_THEME.warning,
    amberSoft: TEACHER_THEME.warningSoft,
    sky: TEACHER_THEME.support,
    skySoft: TEACHER_THEME.supportSoft,
} as const;

export function TeacherBadge({
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
            className="inline-flex items-center rounded-full border border-emerald-200 px-3 py-1 text-[12px] font-bold uppercase tracking-wide shadow-soft-xs"
            style={{ background: bg, color: text }}
        >
            {children}
        </span>
    );
}

export function TeacherTopNavTitle({
    title,
    icon,
}: {
    title: string;
    icon?: ReactNode;
}) {
    return (
        <div className="flex items-center gap-2 px-2 py-2">
            <span className={TEACHER_THEME.primaryText}>{icon ?? <GraduationCap className="h-5 w-5" />}</span>
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        </div>
    );
}

export function TeacherHero({
    eyebrow,
    title,
    description,
    stats,
    action,
}: {
    eyebrow: string;
    title: string;
    description?: string;
    stats?: Array<{ label: string; value: string }>;
    action?: ReactNode;
}) {
    return (
        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${TEACHER_THEME.primaryText}`}>{eyebrow}</p>
                <h1 className="mt-1 text-2xl font-bold leading-tight text-slate-950">{title}</h1>
                {description ? (
                    <p className="mt-1 max-w-3xl text-sm font-normal text-slate-500">{description}</p>
                ) : null}
            </div>
            {(stats && stats.length > 0) || action ? (
                <div className="flex flex-col items-start gap-3 xl:items-end">
                    {stats && stats.length > 0 ? (
                        <div className="grid gap-3 sm:grid-cols-2 xl:w-[380px]">
                            {stats.map((item) => (
                                <div key={item.label} className="rounded-[8px] border border-gray-200 bg-white px-4 py-3 shadow-soft-xs">
                                    <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-slate-500">{item.label}</p>
                                    <p className="mt-2 text-2xl font-bold leading-none text-slate-950">{item.value}</p>
                                </div>
                            ))}
                        </div>
                    ) : null}
                    {action ? <div>{action}</div> : null}
                </div>
            ) : null}
        </section>
    );
}

export function TeacherSummaryCard({
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
        <article className="min-h-[118px] rounded-[8px] border p-5 shadow-soft-sm" style={{ borderColor: TEACHER_THEME.line, background: TEACHER_THEME.shell }}>
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

export function TeacherEmptyState({
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
            <div className="mt-4 text-lg font-bold" style={{ color: TEACHER_THEME.pageInk }}>
                {title}
            </div>
        </div>
    );
}

export function TeacherSectionHeader({
    label,
    title,
    action,
}: {
    label: string;
    title: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
            <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${TEACHER_THEME.primaryText}`}>{label}</p>
                <h2 className="mt-1 text-lg font-bold text-slate-950">{title}</h2>
            </div>
            {action}
        </div>
    );
}
