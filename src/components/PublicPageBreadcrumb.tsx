import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";

export type PublicBreadcrumbItem = {
  label: string;
  /** Nếu không có `to` → trang hiện tại (không link) */
  to?: string;
};

type Props = {
  items: PublicBreadcrumbItem[];
  className?: string;
};

/**
 * Breadcrumb cho trang public (guest): rõ hierarchy, không đóng khung.
 */
export function PublicPageBreadcrumb({ items, className = "" }: Props) {
  return (
    <nav aria-label="Điều hướng breadcrumb" className={className}>
      <ol className="inline-flex max-w-full flex-wrap items-center gap-1 text-sm">
        {items.map((item, idx) => (
          <li key={`${item.label}-${idx}`} className="inline-flex items-center">
            {idx > 0 && (
              <ChevronRight
                className="mx-0.5 h-4 w-4 shrink-0 text-gray-900/40"
                strokeWidth={2.5}
                aria-hidden
              />
            )}
            {item.to ? (
              <Link
                to={item.to}
                className="inline-flex items-center gap-1 font-bold text-gray-600 underline-offset-4 transition-colors hover:text-gray-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 focus-visible:ring-offset-2"
              >
                {idx === 0 ? (
                  <>
                    <Home className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
                    <span>{item.label}</span>
                  </>
                ) : (
                  item.label
                )}
              </Link>
            ) : (
              <span
                className="inline-flex max-w-[min(52vw,320px)] items-center gap-1 truncate rounded-md bg-purple-400/45 px-2 py-0.5 font-extrabold text-gray-900"
                aria-current="page"
                title={item.label}
              >
                {idx === 0 ? (
                  <>
                    <Home className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
                    <span className="truncate">{item.label}</span>
                  </>
                ) : (
                  <span className="truncate">{item.label}</span>
                )}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
