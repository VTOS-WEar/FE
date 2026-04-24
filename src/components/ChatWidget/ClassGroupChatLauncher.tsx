import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getTeacherClassesOverview } from "../../lib/api/teachers";
import { getMyChildren } from "../../lib/api/users";

type SessionUser = {
  role?: string;
};

type ClassChatOption = {
  id: string;
  className: string;
  subtitle: string;
};

type ClassGroupChatLauncherProps = {
  className?: string;
};

function getSessionUser(): SessionUser | null {
  const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function ClassGroupChatLauncher({ className = "" }: ClassGroupChatLauncherProps): JSX.Element | null {
  const navigate = useNavigate();
  const userRole = useMemo(() => getSessionUser()?.role || "", []);
  const [options, setOptions] = useState<ClassChatOption[]>([]);
  const [loading, setLoading] = useState(userRole === "Parent" || userRole === "HomeroomTeacher");
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      if (userRole !== "Parent" && userRole !== "HomeroomTeacher") {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        if (userRole === "Parent") {
          const children = await getMyChildren();
          if (cancelled) return;

          const grouped = new Map<string, ClassChatOption & { childNames: string[] }>();
          for (const child of children) {
            if (!child.classGroupId) continue;

            const current = grouped.get(child.classGroupId);
            if (current) {
              current.childNames.push(child.fullName);
              continue;
            }

            grouped.set(child.classGroupId, {
              id: child.classGroupId,
              className: child.className || child.grade,
              subtitle: child.school?.schoolName || "Lớp của học sinh",
              childNames: [child.fullName],
            });
          }

          setOptions(
            Array.from(grouped.values()).map(({ childNames, ...option }) => ({
              ...option,
              subtitle: `${option.subtitle} • ${childNames.join(", ")}`,
            }))
          );
        } else {
          const overview = await getTeacherClassesOverview();
          if (cancelled) return;

          setOptions(
            overview.classes.map((item) => ({
              id: item.id,
              className: item.className,
              subtitle: `${overview.teacherName} • ${item.academicYear}`,
            }))
          );
        }
      } catch {
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadOptions();

    return () => {
      cancelled = true;
    };
  }, [userRole]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (userRole !== "Parent" && userRole !== "HomeroomTeacher") {
    return null;
  }

  const hasOptions = options.length > 0;
  const label = loading ? "Đang tải nhóm lớp" : hasOptions ? "Mở nhóm chat lớp" : "Chưa có nhóm lớp";

  const openOption = (option?: ClassChatOption) => {
    const classGroupId = option?.id;
    const basePath = userRole === "HomeroomTeacher" ? "/teacher/messages" : "/class-chat";
    navigate(classGroupId ? `${basePath}?classGroupId=${classGroupId}` : basePath);
    setMenuOpen(false);
  };

  const handleClick = () => {
    if (!hasOptions) return;
    if (options.length === 1) {
      openOption(options[0]);
      return;
    }
    setMenuOpen((value) => !value);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading || !hasOptions}
        aria-label={label}
        title={label}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-150 hover:-translate-y-[1px] hover:shadow-soft-sm disabled:cursor-not-allowed disabled:opacity-50 active:translate-y-0 active:shadow-none"
      >
        <MessageCircle size={18} className="text-gray-900" />
      </button>

      {menuOpen && hasOptions && (
        <div className="absolute right-0 top-full z-[80] mt-2 w-72 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-soft-md">
          <div className="border-b border-gray-100 bg-sky-50 px-4 py-3">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-sky-700">Chat lớp</p>
          </div>
          <div className="max-h-80 overflow-y-auto p-1.5">
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => openOption(option)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-sky-100 bg-sky-50">
                  <MessageCircle size={16} className="text-sky-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-gray-900">Lớp {option.className}</p>
                  <p className="truncate text-xs font-semibold text-gray-500">{option.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
