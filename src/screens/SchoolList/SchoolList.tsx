import { useState, useEffect, useMemo, useRef } from "react";
import { Search, MapPin, Star, RotateCcw, ChevronRight, Filter, Building2, Sparkles, CheckCircle } from "lucide-react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { GuestLayout } from "@/components/layout/GuestLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getPublicSchools, PublicSchoolDto, parseContactInfo } from "@/lib/api/schools";
import { fetchProvinces, type Province, type District } from "@/lib/utils/vietnamProvinces";

/* ═══════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════ */

// Page-load stagger
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  }),
};

// Scroll-reveal for sections
const scrollReveal = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

// Card grid stagger + individual card
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

// Shimmer loading skeleton
const shimmer = {
  animate: {
    backgroundPosition: ["200% 0", "-200% 0"],
    transition: { duration: 1.5, repeat: Infinity, ease: "linear" },
  },
};

/* ═══════════════════════════════════════════════════════
   SCROLL-REVEAL WRAPPER (fade + slide up khi scroll)
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
   INLINE TOAST NOTIFICATION COMPONENT
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
          className="fixed top-6 right-6 z-50 bg-white/90 backdrop-blur-2xl border border-purple-100 shadow-[0_16px_48px_rgba(124,58,237,0.15)] rounded-2xl px-6 py-4 flex items-center gap-3 max-w-sm"
        >
          <div className="p-1.5 bg-emerald-50 rounded-full">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <span className="text-sm font-medium text-gray-700">{message}</span>
          {/* Progress bar */}
          <motion.div
            className="absolute bottom-0 left-0 h-[3px] bg-purple-500 rounded-b-2xl"
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 3, ease: "linear" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════
   SEARCHABLE SELECT COMPONENT
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

  // Close on click outside
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

  // Auto-focus search when opened
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
        className={`w-full h-9 px-3 rounded-lg border border-purple-50 bg-gray-50/50 text-sm flex items-center justify-between gap-2 transition-all ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-purple-200 cursor-pointer"
          } ${open ? "ring-2 ring-purple-400/10 border-purple-200" : ""}`}
      >
        <span className={value === "all" ? "text-gray-400" : "text-gray-700 truncate"}>
          {selectedLabel}
        </span>
        <ChevronRight className={`w-3 h-3 text-gray-300 shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full mt-1 left-0 w-full min-w-[220px] bg-white rounded-xl border border-gray-100 shadow-[0_12px_40px_rgba(0,0,0,0.1)] overflow-hidden"
          >
            {/* Search input */}
            <div className="p-2 border-b border-gray-50">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-sm rounded-lg bg-gray-50/80 border-none outline-none focus:bg-white transition-colors placeholder:text-gray-300"
                />
              </div>
            </div>

            {/* Options list */}
            <div className="max-h-[240px] overflow-y-auto py-1 ">
              {filtered.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-gray-300">Không tìm thấy</div>
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
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${opt.value === value
                      ? "bg-purple-50 text-purple-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
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

  // Filter states
  const [search, setSearch] = useState("");
  const [district, setDistrict] = useState("all");
  const [city, setCity] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [toast, setToast] = useState({ show: false, message: "" });

  // Province/District data from API
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);

  const [activeFilters, setActiveFilters] = useState({
    search: "", district: "all", city: "all"
  });

  // Fetch schools + provinces on mount
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

  // Update districts when city selection changes
  useEffect(() => {
    if (city === "all") {
      setDistricts([]);
    } else {
      const selected = provinces.find((p) => p.codename === city);
      setDistricts(selected?.districts ?? []);
    }
    setDistrict("all"); // reset district when city changes
  }, [city, provinces]);

  const handleSearch = () => {
    setActiveFilters({ search, district, city });
    setToast({ show: true, message: "Đã áp dụng bộ lọc tìm kiếm!" });
  };

  // Auto-filter when changing city
  const handleCityChange = (val: string) => {
    setCity(val);
    // district will reset via useEffect, so apply filter with district=all
    setActiveFilters((prev) => ({ ...prev, city: val, district: "all" }));
  };

  // Auto-filter when changing district
  const handleDistrictChange = (val: string) => {
    setDistrict(val);
    setActiveFilters((prev) => ({ ...prev, district: val }));
  };

  const handleReset = () => {
    setSearch(""); setDistrict("all"); setCity("all");
    setActiveFilters({ search: "", district: "all", city: "all" });
    setToast({ show: true, message: "Đã đặt lại bộ lọc!" });
  };

  // Get display names for active filters
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

      // Match city (province)
      let matchCity = true;
      if (activeFilters.city !== "all") {
        const provinceName = getProvinceName(activeFilters.city)
          .replace(/^(Thành phố |Tỉnh )/i, "")
          .toLowerCase();
        matchCity = address.includes(provinceName);
      }

      // Match district
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
      {/* ── Toast Notification ───────────────────────────────── */}
      <Toast message={toast.message} show={toast.show} onHide={() => setToast(t => ({ ...t, show: false }))} />

      {/* NB decorative shapes */}

      <div className="relative z-10 max-w-[1360px] mx-auto px-32 xl:px-28 py-10">

        {/* ═══════════════════════════════════════════════════
            BREADCRUMB
           ═══════════════════════════════════════════════════ */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="mb-6">
          <Breadcrumb>
            <BreadcrumbList className="text-[14px]">
              <BreadcrumbItem>
                <BreadcrumbLink href="/" className="text-gray-500 hover:text-purple-600 font-medium transition-colors">
                  Trang chủ
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-gray-900 font-bold">Danh sách trường</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </motion.div>

        {/* ═══════════════════════════════════════════════════
            HERO HEADER — page load fade-up
           ═══════════════════════════════════════════════════ */}
        <div className="mb-8">
          {/* <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible"
            className="flex items-center gap-2 mb-3"
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="w-4 h-4 text-purple-500" />
            </motion.div>
            <span className="text-xs font-bold tracking-widest uppercase text-purple-400">Khám Phá Giáo Dục</span>
          </motion.div> */}

          <motion.h1 custom={1} variants={fadeUp} initial="hidden" animate="visible"
            className="text-[36px] font-extrabold text-gray-900 mb-1.5 leading-tight font-baloo tracking-tight"
          >
            Tìm{" "}
            <span className="relative inline-block">
              <span className="text-transparent bg-clip-text bg-[linear-gradient(135deg,#c084fc_0%,#7c3aed_50%,#6d28d9_100%)]">đồng phục</span>
              <motion.span
                className="absolute -bottom-1 left-0 w-full h-[3px] bg-[linear-gradient(90deg,#c084fc,#7c3aed)] rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.8, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: "left" }}
              />
            </span>{" "}
            trường của bạn
          </motion.h1>

          <motion.p custom={2} variants={fadeUp} initial="hidden" animate="visible"
            className="text-[15px] text-gray-500 max-w-2xl font-medium"
          >
            Chọn địa điểm và tìm kiếm để xem danh sách trường học phù hợp với nhu cầu của bạn.
          </motion.p>
        </div>

        {/* ═══════════════════════════════════════════════════
            SINGLE-ROW FILTER BAR — page load fade-up
           ═══════════════════════════════════════════════════ */}
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="-mx-8 px-8 mb-4 relative z-20">
          <div className="bg-white rounded-2xl p-5 border-2 border-[#1A1A2E] shadow-[4px_4px_0_#1A1A2E] overflow-visible">
            <div className="flex items-end gap-4">
              {/* Search */}
              <div className="flex-1 min-w-0 space-y-1">
                <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-widest">Tìm kiếm</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                  <Input
                    placeholder="Nhập tên trường..."
                    className="pl-10 h-9 rounded-lg border-purple-50 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-purple-400/10 text-sm transition-all duration-200 focus:shadow-[0_0_0_4px_rgba(124,58,237,0.06)]"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
              </div>

              {/* Tỉnh/Thành phố — searchable */}
              <div className="w-[180px] shrink-0 space-y-1">
                <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-widest">Tỉnh/Thành phố</label>
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

              {/* Quận/Huyện — searchable, depends on Tỉnh */}
              <div className="w-[180px] shrink-0 space-y-1">
                <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-widest">Quận/Huyện</label>
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
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.93 }}>
                  <Button
                    onClick={handleSearch}
                    className="h-9 px-5 rounded-lg bg-[#0a0a0a] hover:bg-purple-700 text-white font-bold gap-2 text-sm transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_28px_rgba(124,58,237,0.4),0_2px_8px_rgba(124,58,237,0.2)]"
                  >
                    <Filter className="w-3.5 h-3.5" />
                    Tìm kiếm
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.1, rotate: -15 }} whileTap={{ scale: 0.88 }}>
                  <Button
                    onClick={handleReset} variant="outline"
                    className="h-9 w-9 rounded-lg border-gray-100 text-gray-400 hover:text-purple-600 hover:border-purple-300 hover:shadow-[0_4px_16px_rgba(124,58,237,0.12)] transition-all duration-300"
                    title="Đặt lại"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════
            RESULTS STATUS — scroll reveal
           ═══════════════════════════════════════════════════ */}
        <ScrollSection className="flex items-center justify-between mb-8 px-1">
          <div className="flex items-center gap-3">
            <motion.div
              className="p-2 bg-purple-50 rounded-lg"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Building2 className="w-4 h-4 text-purple-600" />
            </motion.div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <span>Kết quả cho:</span>
              <Badge className="bg-purple-600 text-white border-none py-0.5 px-3 rounded-full font-bold text-xs shadow-md shadow-purple-600/20">
                {getProvinceName(activeFilters.city)}
              </Badge>
              <span className="text-gray-300 ml-1 text-sm">({filteredSchools.length} trường)</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sắp xếp</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px] h-8 border-none bg-transparent shadow-none font-bold text-gray-700 text-sm">
                <SelectValue placeholder="Phổ biến nhất" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="popular">Phổ biến nhất</SelectItem>
                <SelectItem value="newest">Mới nhất</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </ScrollSection>

        {/* ═══════════════════════════════════════════════════
            SCHOOL GRID — skeleton → stagger cards reveal
           ═══════════════════════════════════════════════════ */}
        <AnimatePresence mode="wait">
          {loading ? (
            /* ─── Shimmer Skeleton Loading ────────────────── */
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="rounded-[28px] overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                >
                  <motion.div
                    className="h-[400px] w-full bg-gradient-to-r from-gray-100/60 via-gray-50/80 to-gray-100/60 bg-[length:200%_100%] rounded-[28px]"
                    variants={shimmer}
                    animate="animate"
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : filteredSchools.length > 0 ? (
            /* ─── Cards with Stagger Reveal ───────────────── */
            <motion.div
              key="cards"
              variants={staggerGrid}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {filteredSchools.map((school) => {
                const contact = parseContactInfo(school.contactInfo);

                return (
                  <motion.div
                    key={school.schoolId}
                    variants={cardItem}
                    whileHover={{
                      y: -12,
                      scale: 1.03,
                      transition: { type: "spring", stiffness: 350, damping: 20 },
                    }}
                    whileTap={{ scale: 0.97 }}
                    className="group h-full relative"
                  >
                    {/* Card shadow glow on hover */}
                    <div className="absolute -inset-2 rounded-[36px] bg-purple-300/0 group-hover:bg-purple-300/[0.06] blur-2xl transition-all duration-700 pointer-events-none" />

                    <Card
                      className="relative overflow-hidden border border-gray-100/60 shadow-[0_4px_20px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)] group-hover:shadow-[0_32px_64px_-16px_rgba(124,58,237,0.2),0_16px_32px_-8px_rgba(124,58,237,0.08)] group-hover:border-purple-100/80 transition-all duration-500 rounded-[28px] flex flex-col h-full bg-white cursor-pointer"
                      onClick={() => navigate(`/schools/${school.schoolId}`)}
                    >
                      {/* Image with zoom on hover */}
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <motion.img
                          // src={school.logoURL || "https://i.pinimg.com/1200x/95/4a/d9/954ad94edd7118ca3a5eb38b73087363.jpg"}
                          src={"https://i.pinimg.com/1200x/95/4a/d9/954ad94edd7118ca3a5eb38b73087363.jpg"}
                          alt={school.schoolName}
                          className="w-full h-full object-cover transition-transform duration-[800ms] ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:scale-[1.1]"
                        />
                        {/* Gradient overlay — deepens on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent group-hover:from-black/40 transition-all duration-500" />

                        {/* Badges */}
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-white/90 backdrop-blur-sm text-purple-700 rounded-lg px-3 py-1 font-bold text-[11px] shadow-sm group-hover:shadow-md group-hover:bg-white border-none transition-all duration-300">
                            {school.level || "No level"}
                          </Badge>
                        </div>
                        <div className="absolute top-3 right-3">
                          <div className="bg-black/50 backdrop-blur-sm text-white rounded-lg px-2.5 py-1 font-bold text-[11px] flex items-center gap-1 shadow-lg group-hover:shadow-xl group-hover:bg-black/60 transition-all duration-300">
                            <Star className="w-3 h-3 fill-orange-400 text-orange-400" />
                            {school.rating || "No rating"}
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="text-[17px] font-bold text-gray-900 mb-1.5 leading-snug group-hover:text-purple-600 transition-colors duration-300 line-clamp-1">
                          {school.schoolName}
                        </h3>
                        <div className="flex items-start gap-2 text-gray-400 mb-5 flex-1">
                          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-purple-200 group-hover:text-purple-400 transition-colors" />
                          <p className="text-[13px] leading-relaxed line-clamp-2">
                            {contact.address || "No address"}
                          </p>
                        </div>

                        {/* Button with hover color + pressed */}
                        <motion.div whileTap={{ scale: 0.94 }}>
                          <Button className="w-full h-10 rounded-xl bg-purple-50 group-hover:bg-purple-600 shadow-none group-hover:shadow-[0_8px_24px_rgba(124,58,237,0.3),0_2px_8px_rgba(124,58,237,0.15)] text-purple-600 group-hover:text-white font-bold transition-all duration-300 border-0 flex items-center justify-center gap-2 text-[12px] uppercase tracking-wider">
                            Xem đồng phục
                            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform duration-300" />
                          </Button>
                        </motion.div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            /* ─── Empty State ─────────────────────────────── */
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-24 text-center"
            >
              <motion.div
                className="w-20 h-20 mx-auto mb-6 bg-purple-50 rounded-full flex items-center justify-center"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Building2 className="w-8 h-8 text-purple-300" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Không tìm thấy trường học nào</h3>
              <p className="text-gray-400 text-sm">Hãy thử thay đổi bộ lọc hoặc từ khoá tìm kiếm.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════════════════════════════════════════════
            LOAD MORE — scroll reveal + hover interaction
           ═══════════════════════════════════════════════════ */}
        {filteredSchools.length > 0 && (
          <ScrollSection className="mt-16 text-center" delay={0.2}>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Button
                variant="outline"
                className="h-11 px-8 rounded-xl border-purple-100 text-purple-400 font-bold hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300 hover:shadow-[0_12px_32px_rgba(124,58,237,0.12),0_4px_12px_rgba(124,58,237,0.06)] transition-all duration-300 flex items-center gap-2 mx-auto shadow-sm"
              >
                Xem thêm trường khác
                <RotateCcw className="w-4 h-4" />
              </Button>
            </motion.div>
          </ScrollSection>
        )}
      </div>

      <style>{`
        .font-baloo { font-family: 'Baloo 2', cursive; }
      `}</style>
    </GuestLayout>
  );
};

export default SchoolList;
