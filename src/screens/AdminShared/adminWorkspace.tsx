import type { ReactNode } from "react";

export const ADMIN_TONE = {
    pageInk: "#141B34",
    muted: "#5B6478",
    line: "#D8DEEA",
    shell: "#FFFFFF",
    soft: "#F7F8FC",
    violet: "#6D5EF5",
    violetSoft: "#F1EDFF",
    emerald: "#0F9D7A",
    emeraldSoft: "#E8FFF7",
    amber: "#C68508",
    amberSoft: "#FFF6D9",
    rose: "#D9485F",
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
            className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-[12px] font-black uppercase tracking-wide shadow-soft-sm"
            style={{ background: bg, color: text }}
        >
            {children}
        </span>
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
    description: string;
    stats: Array<{ label: string; value: string }>;
}) {
    return (
        <section
            className="overflow-hidden rounded-[32px] border px-6 py-6 text-white shadow-soft-lg lg:px-8 lg:py-8"
            style={{ borderColor: "#2446A6", background: "linear-gradient(135deg, #172554 0%, #1D4ED8 52%, #38BDF8 100%)" }}
        >
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-3xl">
                    <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[12px] font-black uppercase tracking-[0.12em] text-white">
                        {eyebrow}
                    </div>
                    <h1 className="mt-4 text-[34px] font-black leading-tight md:text-[46px]">{title}</h1>
                    <p className="mt-4 max-w-2xl text-[16px] font-semibold leading-8 text-white/85">{description}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:w-[380px]">
                    {stats.map((item) => (
                        <div key={item.label} className="rounded-[24px] border border-white/15 bg-white/10 px-4 py-4 backdrop-blur-sm">
                            <p className="text-[12px] font-black uppercase tracking-[0.1em] text-white/70">{item.label}</p>
                            <p className="mt-3 text-[32px] font-black leading-none text-white">{item.value}</p>
                        </div>
                    ))}
                </div>
            </div>
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
    detail: string;
    accent: string;
}) {
    return (
        <article className="rounded-[24px] border px-5 py-5 shadow-soft-lg" style={{ borderColor: ADMIN_TONE.line, background: ADMIN_TONE.shell }}>
            <p className="text-[12px] font-black uppercase tracking-[0.1em]" style={{ color: ADMIN_TONE.muted }}>
                {label}
            </p>
            <p className="mt-3 text-[30px] font-black leading-none" style={{ color: accent }}>
                {value}
            </p>
            <p className="mt-3 text-[14px] font-semibold leading-6" style={{ color: ADMIN_TONE.muted }}>
                {detail}
            </p>
        </article>
    );
}

export function AdminEmptyState({
    title,
    detail,
    icon,
    bg,
}: {
    title: string;
    detail: string;
    icon: ReactNode;
    bg: string;
}) {
    return (
        <div className="flex min-h-[240px] flex-col items-center justify-center px-6 py-12 text-center">
            <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200 text-[28px] shadow-soft-md"
                style={{ background: bg }}
            >
                {icon}
            </div>
            <div className="mt-5 text-[28px] font-black" style={{ color: ADMIN_TONE.pageInk }}>
                {title}
            </div>
            <p className="mt-3 max-w-lg text-[15px] font-semibold leading-7" style={{ color: ADMIN_TONE.muted }}>
                {detail}
            </p>
        </div>
    );
}
