import { useState, useEffect, useMemo, useRef } from "react";
import { Search, MapPin, Star, RotateCcw, ChevronRight, Building2, CheckCircle } from "lucide-react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { GuestLayout } from "@/components/layout/GuestLayout";
import { PublicPageBreadcrumb } from "@/components/PublicPageBreadcrumb";
import { getPublicSchools, PublicSchoolDto, parseContactInfo } from "@/lib/api/schools";
import { fetchProvinces, type Province, type District } from "@/lib/utils/vietnamProvinces";

/* ═══════════════════════════════════════════════════════
   ANIMATION VARIANTS (kept – framer-motion is deeply used here)
   ═══════════════════════════════════════════════════════ */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  }),
};

const staggerGrid = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const cardItem = {
  hidden: { opacity: 0, y: 36, scale: 0.96 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

/* ═══════════════════════════════════════════════════════
   SCROLL-REVEAL WRAPPER
   ═══════════════════════════════════════════════════════ */
function ScrollSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   NB TOAST NOTIFICATION
   ═══════════════════════════════════════════════════════ */
function Toast({ message, show, onHide }: { message: string; show: boolean; onHide: () => void }) {
  useEffect(() => {
    if (show) { const t = setTimeout(onHide, 3000); return () => clearTimeout(t); }
  }, [show, onHide]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="fixed top-6 right-6 z-50 nb-card-static flex items-center gap-3 px-5 py-3 max-w-sm"
        >
          <div className="p-1.5 bg-[#E8F5CC] rounded-lg border border-gray-200">
            <CheckCircle className="w-4 h-4 text-gray-900" />
          </div>
          <span className="text-sm font-bold text-gray-900">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════
   SEARCHABLE SELECT — NB-styled
   ═══════════════════════════════════════════════════════ */
function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = "Chọn...",
  disabled = false,
}: {
  value: string;
  onValueChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const selectedLabel = options.find((o) => o.value === value)?.label || placeholder;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={`w-full h-9 px-3 rounded-lg border border-gray-200 text-sm font-semibold flex items-center justify-between gap-2 transition-all shadow-soft-md ${
          disabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white text-gray-900 hover:shadow-soft-md hover:-translate-y-[1px] cursor-pointer"
        } ${open && !disabled ? "ring-2 ring-purple-300/45 z-30" : ""}`}
      >
        <span className={`truncate ${value === "all" && !disabled ? "text-gray-500" : ""}`}>
          {selectedLabel}
        </span>
        <ChevronRight
          className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""} ${
            disabled ? "text-gray-400" : "text-gray-900"
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full mt-2 left-0 w-full min-w-[220px] bg-white rounded-xl border-3 border-gray-200 shadow-soft-lg overflow-hidden"
          >
            {/* Search input */}
            <div className="p-2 border-b border-gray-200/10">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-900" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-sm font-semibold rounded-lg bg-gray-50 border border-gray-200/15 outline-none focus:border-purple-300 focus:ring-1 focus:ring-purple-300/30 transition-colors placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Options */}
            <div className="max-h-[240px] overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-gray-500 font-bold">Không tìm thấy</div>
              ) : (
                filtered.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onValueChange(opt.value);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`w-full text-left px-3 py-2 text-sm font-semibold transition-colors ${
                      opt.value === value
                        ? "bg-violet-50 text-[#7C3AED]"
                        : "text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
const SchoolList = () => {
  const navigate = useNavigate();
  const [schools, setSchools] = useState<PublicSchoolDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [district, setDistrict] = useState("all");
  const [city, setCity] = useState("all");
  const [toast, setToast] = useState({ show: false, message: "" });

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [activeFilters, setActiveFilters] = useState({
    search: "", district: "all", city: "all"
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [schoolData, provinceData] = await Promise.all([
          getPublicSchools(1, 100),
          fetchProvinces(),
        ]);
        const schoolList = Array.isArray(schoolData)
          ? schoolData
          : (schoolData?.schools || (schoolData as any)?.items || []);
        setSchools(schoolList);
        setProvinces(provinceData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (city === "all") {
      setDistricts([]);
    } else {
      const selected = provinces.find((p) => p.codename === city);
      setDistricts(selected?.districts ?? []);
    }
    setDistrict("all");
  }, [city, provinces]);

  const handleSearch = () => {
    setActiveFilters({ search, district, city });
    setToast({ show: true, message: "Đã áp dụng bộ lọc tìm kiếm!" });
  };

  const handleCityChange = (val: string) => {
    setCity(val);
    setActiveFilters((prev) => ({ ...prev, city: val, district: "all" }));
  };

  const handleDistrictChange = (val: string) => {
    setDistrict(val);
    setActiveFilters((prev) => ({ ...prev, district: val }));
  };

  const handleReset = () => {
    setSearch(""); setDistrict("all"); setCity("all");
    setActiveFilters({ search: "", district: "all", city: "all" });
    setToast({ show: true, message: "Đã đặt lại bộ lọc!" });
  };

  const getProvinceName = (codename: string) => {
    if (codename === "all") return "Tất cả";
    return provinces.find((p) => p.codename === codename)?.name ?? codename;
  };

  const filteredSchools = useMemo(() => {
    if (!Array.isArray(schools)) return [];
    return schools.filter(school => {
      const matchSearch = !activeFilters.search ||
        school.schoolName.toLowerCase().includes(activeFilters.search.toLowerCase());

      const contact = parseContactInfo(school.contactInfo);
      const address = (contact.address ?? "").toLowerCase();

      let matchCity = true;
      if (activeFilters.city !== "all") {
        const provinceName = getProvinceName(activeFilters.city)
          .replace(/^(Thành phố |Tỉnh )/i, "")
          .toLowerCase();
        matchCity = address.includes(provinceName);
      }

      let matchDistrict = true;
      if (activeFilters.district !== "all") {
        const districtObj = districts.find((d) => d.codename === activeFilters.district);
        if (districtObj) {
          const districtName = districtObj.name
            .replace(/^(Quận |Huyện |Thị xã |Thành phố |Phường |Xã )/i, "")
            .toLowerCase();
          matchDistrict = address.includes(districtName);
        }
      }

      return matchSearch && matchCity && matchDistrict;
    });
  }, [schools, activeFilters, provinces, districts]);

  return (
    <GuestLayout bgColor="#f9fafb">
      <Toast message={toast.message} show={toast.show} onHide={() => setToast(t => ({ ...t, show: false }))} />

      <div className="relative z-10 max-w-[1100px] mx-auto px-6 lg:px-8 py-10">

        {/* ═══ HERO HEADER ═══ */}
        <div className="mb-8">
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="mb-4">
            <PublicPageBreadcrumb
              items={[
                { label: "Trang chủ", to: "/homepage" },
                { label: "Danh sách trường" },
              ]}
            />
          </motion.div>

          <motion.h1 custom={1} variants={fadeUp} initial="hidden" animate="visible"
            className="text-3xl font-extrabold text-gray-900 mb-2 leading-tight tracking-tight lg:text-4xl"
          >
            Tìm <span className="text-purple-400">đồng phục</span> trường của bạn
          </motion.h1>

          <motion.p custom={2} variants={fadeUp} initial="hidden" animate="visible"
            className="text-base text-gray-600 max-w-2xl font-medium"
          >
            Chọn địa điểm và tìm kiếm để xem danh sách trường học phù hợp với nhu cầu của bạn.
          </motion.p>
        </div>

        {/* ═══ FILTER BAR — NB Card ═══ */}
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="mb-8 relative z-20">
          <div className="nb-card-static overflow-visible px-5 py-5 shadow-soft-lg ring-2 ring-purple-300/35 sm:px-6">
            <div className="flex w-full flex-wrap items-end gap-x-3 gap-y-3">
              {/* Search */}
              <div className="min-w-[200px] flex-1 space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-500 ml-1 uppercase tracking-widest leading-tight">
                  Tìm kiếm
                </label>
                <div className="group relative w-full transition-transform duration-200 hover:-translate-y-px">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 z-[2] h-3.5 w-3.5 -translate-y-1/2 text-gray-900"
                    aria-hidden="true"
                  />
                  <input
                    placeholder="Nhập tên trường..."
                    className="relative z-0 w-full h-9 pl-10 pr-3 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-900 shadow-soft-md transition-shadow placeholder:text-gray-500 placeholder:font-medium focus:outline-none focus:ring-2 focus:ring-purple-300/45 focus:ring-offset-0 group-hover:shadow-soft-md"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
              </div>

              {/* Province */}
              <div className="w-full max-w-[180px] shrink-0 space-y-1.5 sm:w-[180px]">
                <label className="block text-[10px] font-bold text-gray-500 ml-1 uppercase tracking-widest leading-tight">
                  Tỉnh/Thành phố
                </label>
                <SearchableSelect
                  value={city}
                  onValueChange={handleCityChange}
                  placeholder="Chọn tỉnh..."
                  options={[
                    { value: "all", label: "Tất cả" },
                    ...provinces.map((p) => ({ value: p.codename, label: p.name })),
                  ]}
                />
              </div>

              {/* District */}
              <div className="w-full max-w-[180px] shrink-0 space-y-1.5 sm:w-[180px]">
                <label className="block text-[10px] font-bold text-gray-500 ml-1 uppercase tracking-widest leading-tight">
                  Quận/Huyện
                </label>
                <SearchableSelect
                  value={district}
                  onValueChange={handleDistrictChange}
                  disabled={city === "all"}
                  placeholder={city === "all" ? "Chọn tỉnh trước" : "Tất cả"}
                  options={[
                    { value: "all", label: "Tất cả" },
                    ...districts.map((d) => ({ value: d.codename, label: d.name })),
                  ]}
                />
              </div>

              {/* Buttons — spacer label aligns control row với các cột có nhãn */}
              <div className="flex shrink-0 flex-col gap-1.5">
                <span
                  className="block text-[10px] font-bold uppercase tracking-widest leading-tight ml-1 invisible select-none"
                  aria-hidden="true"
                >
                  &nbsp;
                </span>
                <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSearch}
                  className="group relative inline-flex h-9 min-w-[136px] items-center justify-center gap-2 overflow-hidden rounded-lg border border-gray-200 bg-gradient-to-r from-[#A78BFA] via-[#C4B5FD] to-[#7C3AED] px-3.5 text-sm font-bold text-gray-900 shadow-soft-md transition-all duration-200 hover:-translate-y-px hover:shadow-soft-md hover:brightness-[1.08] hover:saturate-110 active:translate-y-px active:shadow-soft-sm active:brightness-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f9fafb]"
                  title="Tìm kiếm trường theo tên và địa điểm"
                >
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/40 via-white/10 to-transparent opacity-95 transition-opacity duration-200 group-hover:from-white/50" />
                  <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.75),transparent_45%)] opacity-90 mix-blend-overlay transition-opacity duration-200 group-hover:opacity-100" />
                  <Search className="relative z-[1] h-3.5 w-3.5 shrink-0 text-gray-900" strokeWidth={2.5} />
                  <span className="relative z-[1] tracking-tight">Tìm kiếm</span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-900 shadow-soft-md transition-all hover:-translate-y-px hover:bg-gray-50 hover:shadow-soft-md active:translate-y-px active:shadow-soft-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300/45 focus-visible:ring-offset-0"
                  title="Đặt lại"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══ RESULTS STATUS ═══ */}
        <ScrollSection className="flex items-center justify-between mb-8 px-1">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-violet-50 shadow-soft-sm">
              <Building2 className="w-4 h-4 text-gray-900" />
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <span>Kết quả cho:</span>
              <span className="nb-badge nb-badge-purple">
                {getProvinceName(activeFilters.city)}
              </span>
              <span className="text-gray-500 ml-1">({filteredSchools.length} trường)</span>
            </div>
          </div>
        </ScrollSection>

        {/* ═══ SCHOOL GRID ═══ */}
        <AnimatePresence mode="wait">
          {loading ? (
            /* Skeleton Loading — NB style */
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {[...Array(6)].map((_, i) => (
                <div key={i} className="nb-skeleton h-[360px] rounded-xl" />
              ))}
            </motion.div>
          ) : filteredSchools.length > 0 ? (
            /* Cards — NB style */
            <motion.div
              key="cards"
              variants={staggerGrid}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredSchools.map((school) => {
                const contact = parseContactInfo(school.contactInfo);

                return (
                  <motion.div
                    key={school.schoolId}
                    variants={cardItem}
                    whileHover={{ y: -6, rotate: -1.15, scale: 1.01 }}
                    whileTap={{ y: 1, scale: 0.992 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}
                    className="group h-full"
                  >
                    <div
                      className="relative nb-card nb-card-wiggle h-full flex flex-col cursor-pointer overflow-hidden border border-gray-200 bg-white shadow-soft-md transition-all duration-200 group-hover:shadow-soft-lg group-hover:ring-2 group-hover:ring-purple-300/45 active:translate-y-px active:shadow-soft-sm"
                      onClick={() => navigate(`/schools/${school.schoolId}`)}
                    >
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#B8A9E8] via-[#C4B5FD] to-[#7C3AED] opacity-85" />
                      {/* Image */}
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img
                          src={school.logoURL || "https://i.pinimg.com/1200x/95/4a/d9/954ad94edd7118ca3a5eb38b73087363.jpg"}
                          alt={school.schoolName}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-gray-900/38 via-gray-900/5 to-white/10 opacity-85 transition-opacity duration-200 group-hover:opacity-100" />
                        {/* Level badge */}
                        <div className="absolute top-3 left-3">
                          <span className="inline-flex items-center rounded-full border border-gray-200 bg-white/95 px-2.5 py-1 text-[11px] font-extrabold text-[#6D5BC4] shadow-sm backdrop-blur-[1px]">
                            {school.level || "No level"}
                          </span>
                        </div>
                        {/* Rating */}
                        <div className="absolute top-3 right-3">
                          <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white/95 px-2.5 py-1 text-[11px] font-extrabold text-gray-900 shadow-sm backdrop-blur-[1px]">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {school.rating || "—"}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 pt-4 flex flex-col flex-1">
                        <h3 className="text-[1.05rem] font-extrabold text-gray-900 mb-2 leading-snug group-hover:text-[#7C3AED] transition-colors line-clamp-1">
                          {school.schoolName}
                        </h3>
                        <div className="flex items-start gap-2 text-gray-500 mb-4 flex-1">
                          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          <p className="text-[13px] font-medium leading-relaxed line-clamp-2">
                            {contact.address || "No address"}
                          </p>
                        </div>

                        <button className="relative w-full h-10 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-gradient-to-r from-[#F8F6FF] via-white to-[#EFE9FF] text-[11px] font-extrabold uppercase tracking-[0.09em] text-gray-900 gap-2 shadow-soft-sm transition-all duration-200 group-hover:border-purple-500 group-hover:shadow-soft-md group-hover:brightness-[1.03] active:translate-y-px active:shadow-sm">
                          <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.55),transparent_45%)] opacity-80 transition-opacity duration-200 group-hover:opacity-100" />
                          Xem đồng phục
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 group-hover:text-[#7C3AED] transition-all" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            /* Empty State */
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-24 text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-xl border-3 border-gray-200 bg-violet-50 shadow-soft-lg">
                <Building2 className="w-8 h-8 text-gray-900" />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-2">Không tìm thấy trường học nào</h3>
              <p className="text-gray-500 text-sm font-medium">Hãy thử thay đổi bộ lọc hoặc từ khoá tìm kiếm.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Load More */}
        {filteredSchools.length > 0 && (
          <ScrollSection className="mt-16 text-center" delay={0.2}>
            <button className="group mx-auto inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-extrabold text-gray-900 shadow-soft-md transition-all hover:-translate-y-px hover:border-purple-500 hover:bg-violet-50 hover:shadow-soft-md active:translate-y-px active:shadow-sm">
              Xem thêm trường khác
              <RotateCcw className="w-4 h-4 transition-transform group-hover:rotate-90" />
            </button>
          </ScrollSection>
        )}
      </div>
    </GuestLayout>
  );
};

export default SchoolList;
