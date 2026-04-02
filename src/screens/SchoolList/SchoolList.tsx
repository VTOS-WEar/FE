import { useState, useEffect, useMemo, useRef } from "react";
import { Search, MapPin, Star, RotateCcw, ChevronRight, Filter, Building2, CheckCircle } from "lucide-react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { GuestLayout } from "@/components/layout/GuestLayout";
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
          <div className="p-1.5 bg-[#E8F5CC] rounded-lg border-2 border-[#1A1A2E]">
            <CheckCircle className="w-4 h-4 text-[#1A1A2E]" />
          </div>
          <span className="text-sm font-bold text-[#1A1A2E]">{message}</span>
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
        className={`w-full h-9 px-3 rounded-lg border-2 border-[#1A1A2E] bg-white text-sm font-semibold flex items-center justify-between gap-2 transition-all shadow-[3px_3px_0_#1A1A2E] ${
          disabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-[4px_4px_0_#1A1A2E] hover:-translate-y-[1px] cursor-pointer"
        } ${open ? "ring-2 ring-[#B8A9E8]/40" : ""}`}
      >
        <span className={value === "all" ? "text-[#6B7280]" : "text-[#1A1A2E] truncate"}>
          {selectedLabel}
        </span>
        <ChevronRight className={`w-3 h-3 text-[#6B7280] shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full mt-2 left-0 w-full min-w-[220px] bg-white rounded-xl border-3 border-[#1A1A2E] shadow-[6px_6px_0_#1A1A2E] overflow-hidden"
          >
            {/* Search input */}
            <div className="p-2 border-b-2 border-[#1A1A2E]/10">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6B7280]" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-sm font-medium rounded-lg bg-[#FFF8F0] border-2 border-transparent outline-none focus:border-[#B8A9E8] transition-colors placeholder:text-[#6B7280]"
                />
              </div>
            </div>

            {/* Options */}
            <div className="max-h-[240px] overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-[#6B7280] font-bold">Không tìm thấy</div>
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
                        ? "bg-[#EDE9FE] text-[#7C3AED]"
                        : "text-[#1A1A2E] hover:bg-[#FFF8F0]"
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
    <GuestLayout bgColor="#FFF8F0">
      <Toast message={toast.message} show={toast.show} onHide={() => setToast(t => ({ ...t, show: false }))} />

      <div className="relative z-10 max-w-[1100px] mx-auto px-6 lg:px-8 py-10">

        {/* ═══ HERO HEADER ═══ */}
        <div className="mb-8">
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible"
            className="mb-4 text-sm font-bold text-[#6B7280]"
          >
            <a href="/" className="hover:text-[#B8A9E8] transition-colors">Trang chủ</a>
            <span className="mx-2">→</span>
            <span className="text-[#1A1A2E]">Danh sách trường</span>
          </motion.div>

          <motion.h1 custom={1} variants={fadeUp} initial="hidden" animate="visible"
            className="text-3xl font-extrabold text-[#1A1A2E] mb-2 leading-tight tracking-tight lg:text-4xl"
          >
            Tìm <span className="text-[#B8A9E8]">đồng phục</span> trường của bạn
          </motion.h1>

          <motion.p custom={2} variants={fadeUp} initial="hidden" animate="visible"
            className="text-base text-[#4C5769] max-w-2xl font-medium"
          >
            Chọn địa điểm và tìm kiếm để xem danh sách trường học phù hợp với nhu cầu của bạn.
          </motion.p>
        </div>

        {/* ═══ FILTER BAR — NB Card ═══ */}
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="mb-8 relative z-20">
          <div className="nb-card-static p-5 overflow-visible">
            <div className="flex items-end gap-4 flex-wrap">
              {/* Search */}
              <div className="flex-1 min-w-[200px] space-y-1">
                <label className="text-[10px] font-bold text-[#6B7280] ml-1 uppercase tracking-widest">Tìm kiếm</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6B7280]" />
                  <input
                    placeholder="Nhập tên trường..."
                    className="nb-input w-full pl-10 h-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
              </div>

              {/* Province */}
              <div className="w-[180px] shrink-0 space-y-1">
                <label className="text-[10px] font-bold text-[#6B7280] ml-1 uppercase tracking-widest">Tỉnh/Thành phố</label>
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
              <div className="w-[180px] shrink-0 space-y-1">
                <label className="text-[10px] font-bold text-[#6B7280] ml-1 uppercase tracking-widest">Quận/Huyện</label>
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

              {/* Buttons */}
              <div className="flex gap-2 shrink-0">
                <button onClick={handleSearch} className="nb-btn nb-btn-purple h-9 text-sm">
                  <Filter className="w-3.5 h-3.5" />
                  Tìm kiếm
                </button>
                <button onClick={handleReset} className="nb-btn nb-btn-outline h-9 w-9 !px-0" title="Đặt lại">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══ RESULTS STATUS ═══ */}
        <ScrollSection className="flex items-center justify-between mb-8 px-1">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-[#1A1A2E] bg-[#EDE9FE] shadow-[3px_3px_0_#1A1A2E]">
              <Building2 className="w-4 h-4 text-[#1A1A2E]" />
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-[#1A1A2E]">
              <span>Kết quả cho:</span>
              <span className="nb-badge nb-badge-purple">
                {getProvinceName(activeFilters.city)}
              </span>
              <span className="text-[#6B7280] ml-1">({filteredSchools.length} trường)</span>
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
                    className="group h-full"
                  >
                    <div
                      className="nb-card h-full flex flex-col cursor-pointer overflow-hidden"
                      onClick={() => navigate(`/schools/${school.schoolId}`)}
                    >
                      {/* Image */}
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img
                          src={"https://i.pinimg.com/1200x/95/4a/d9/954ad94edd7118ca3a5eb38b73087363.jpg"}
                          alt={school.schoolName}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {/* Level badge */}
                        <div className="absolute top-3 left-3">
                          <span className="nb-badge nb-badge-purple text-[11px]">
                            {school.level || "No level"}
                          </span>
                        </div>
                        {/* Rating */}
                        <div className="absolute top-3 right-3">
                          <span className="nb-badge bg-white text-[11px] gap-1">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {school.rating || "—"}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="text-base font-extrabold text-[#1A1A2E] mb-2 leading-snug group-hover:text-[#B8A9E8] transition-colors line-clamp-1">
                          {school.schoolName}
                        </h3>
                        <div className="flex items-start gap-2 text-[#6B7280] mb-4 flex-1">
                          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          <p className="text-[13px] font-medium leading-relaxed line-clamp-2">
                            {contact.address || "No address"}
                          </p>
                        </div>

                        <button className="nb-btn nb-btn-outline w-full h-9 text-xs uppercase tracking-wider gap-2">
                          Xem đồng phục
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
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
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-xl border-3 border-[#1A1A2E] bg-[#EDE9FE] shadow-[6px_6px_0_#1A1A2E]">
                <Building2 className="w-8 h-8 text-[#1A1A2E]" />
              </div>
              <h3 className="text-xl font-extrabold text-[#1A1A2E] mb-2">Không tìm thấy trường học nào</h3>
              <p className="text-[#6B7280] text-sm font-medium">Hãy thử thay đổi bộ lọc hoặc từ khoá tìm kiếm.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Load More */}
        {filteredSchools.length > 0 && (
          <ScrollSection className="mt-16 text-center" delay={0.2}>
            <button className="nb-btn nb-btn-outline mx-auto gap-2">
              Xem thêm trường khác
              <RotateCcw className="w-4 h-4" />
            </button>
          </ScrollSection>
        )}
      </div>
    </GuestLayout>
  );
};

export default SchoolList;
