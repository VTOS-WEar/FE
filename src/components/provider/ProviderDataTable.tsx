import type { ReactNode } from "react";

export const PROVIDER_LIST_PAGE_SIZE = 10;

export type ProviderDataTableColumn<T> = {
    key: string;
    header: ReactNode;
    className?: string;
    mobileLabel?: ReactNode;
    render: (item: T) => ReactNode;
};

type ProviderDataTableProps<T> = {
    items: T[];
    columns: ProviderDataTableColumn<T>[];
    getKey: (item: T) => string;
    onRowClick?: (item: T) => void;
    rowClassName?: (item: T) => string;
};

export function ProviderDataTable<T>({
    items,
    columns,
    getKey,
    onRowClick,
    rowClassName,
}: ProviderDataTableProps<T>) {
    return (
        <section className="overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-soft-sm">
            <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-full border-collapse text-left">
                    <thead className="bg-slate-50">
                        <tr className="border-b border-slate-200">
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className={`whitespace-nowrap px-5 py-4 text-xs font-semibold uppercase tracking-[0.04em] text-slate-600 ${column.className ?? ""}`}
                                >
                                    {column.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {items.map((item) => {
                            const clickable = Boolean(onRowClick);

                            return (
                                <tr
                                    key={getKey(item)}
                                    onClick={() => onRowClick?.(item)}
                                    className={`bg-white transition-colors hover:bg-slate-50 ${clickable ? "cursor-pointer" : ""} ${rowClassName?.(item) ?? ""}`}
                                >
                                    {columns.map((column) => (
                                        <td key={column.key} className={`px-5 py-4 align-middle text-sm font-normal text-slate-700 ${column.className ?? ""}`}>
                                            {column.render(item)}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="divide-y divide-slate-100 lg:hidden">
                {items.map((item) => (
                    <div
                        key={getKey(item)}
                        onClick={() => onRowClick?.(item)}
                        onKeyDown={(event) => {
                            if (!onRowClick) return;
                            if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                onRowClick(item);
                            }
                        }}
                        role={onRowClick ? "button" : undefined}
                        tabIndex={onRowClick ? 0 : undefined}
                        className={`block w-full bg-white px-4 py-4 text-left transition-colors hover:bg-slate-50 ${onRowClick ? "cursor-pointer" : "cursor-default"} ${rowClassName?.(item) ?? ""}`}
                    >
                        <div className="grid gap-3">
                            {columns.map((column) => (
                                <div key={column.key} className="grid gap-1">
                                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                        {column.mobileLabel ?? column.header}
                                    </span>
                                    <div className="min-w-0 text-sm text-slate-800">{column.render(item)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
