import { useEffect, useState, useMemo, useRef } from "react";
import { Search, ChevronDown, SlidersHorizontal, Tag, School, Sparkles, Calendar, ArrowRight, Zap, Flame, LayoutGrid, ImageIcon, RotateCcw, CheckCircle, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { GuestLayout } from "@/components/layout/GuestLayout";
import { PublicPageBreadcrumb } from "@/components/PublicPageBreadcrumb";
import { getUniformWarehouse, getPublicSchools, type UniformWarehouseResponse, type CampaignSummaryDto, type FeaturedOutfitDto, type UniformSearchResult } from "../../lib/api/schools";
import { formatCurrency } from "@/lib/utils/format";

// ── Components ──────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

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
          className={`w-full h-9 px-3 rounded-lg border-2 border-[#1A1A2E] text-sm font-semibold flex items-center justify-between gap-2 transition-all shadow-[4px_4px_0_#1A1A2E] ${
            disabled
              ? "bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed"
              : "bg-white text-[#1A1A2E] hover:shadow-[5px_5px_0_#1A1A2E] hover:-translate-y-[1px] cursor-pointer"
          } ${open && !disabled ? "ring-2 ring-[#B8A9E8]/45 z-30" : ""}`}
        >
          <span className={`truncate ${value === "all" && !disabled ? "text-[#6B7280]" : ""}`}>
            {selectedLabel}
          </span>
          <ChevronRight
            className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""} ${
              disabled ? "text-[#9CA3AF]" : "text-[#1A1A2E]"
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
              className="absolute z-50 top-full mt-2 left-0 w-full min-w-[220px] bg-white rounded-xl border-3 border-[#1A1A2E] shadow-[6px_6px_0_#1A1A2E] overflow-hidden"
            >
              <div className="p-2 border-b-2 border-[#1A1A2E]/10">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#1A1A2E]" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Tìm kiếm..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full h-8 pl-8 pr-3 text-sm font-semibold rounded-lg bg-[#FFF8F0] border-2 border-[#1A1A2E]/15 outline-none focus:border-[#B8A9E8] focus:ring-1 focus:ring-[#B8A9E8]/30 transition-colors placeholder:text-[#6B7280]"
                  />
                </div>
              </div>
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

const SectionHeader = ({ title, icon: Icon, subtitle, badge }: { title: string; icon: any; subtitle?: string; badge?: string }) => (
  <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#1A1A2E] bg-[#C8E44D] shadow-[3px_3px_0_#1A1A2E]">
          <Icon className="h-5 w-5 text-[#1A1A2E]" />
        </div>
        <div className="space-y-0.5">
          {badge && (
            <span className="inline-block text-[9px] font-black uppercase tracking-widest text-[#7C3AED] leading-none">
              {badge}
            </span>
          )}
          <h2 className="text-2xl font-black tracking-tight text-[#1A1A2E] lg:text-3xl uppercase">
            {title}
          </h2>
        </div>
      </div>
      {subtitle && <p className="text-sm font-medium text-[#4C5769] max-w-xl">{subtitle}</p>}
    </div>
  </div>
);

const CampaignCard = ({ campaign }: { campaign: CampaignSummaryDto }) => {
  const navigate = useNavigate();
  return (
    <motion.div
      onClick={() => navigate(`/campaigns/${campaign.campaignId}`)}
      whileHover={{ y: -5, scale: 1.01 }}
      className="group relative h-full flex flex-col rounded-2xl border-2 border-[#1A1A2E] bg-white p-5 shadow-[4px_4px_0_#1A1A2E] transition-all hover:shadow-[8px_8px_0_#1A1A2E] cursor-pointer"
    >
    <div className="mb-4 flex items-center justify-between">
      <div className="flex -space-x-2">
        <div className="h-10 w-10 rounded-full border-2 border-[#1A1A2E] bg-white p-1 shadow-[2px_2px_0_#1A1A2E]">
          {campaign.schoolLogoUrl ? (
            <img src={campaign.schoolLogoUrl} alt={campaign.schoolName} className="h-full w-full object-contain" />
          ) : (
            <School className="h-full w-full p-1 opacity-20" />
          )}
        </div>
      </div>
      <div className="rounded-full border-2 border-[#1A1A2E] bg-[#FFD700] px-2.5 py-0.5 text-[9px] font-black uppercase text-[#1A1A2E]">
        PRE-ORDER
      </div>
    </div>

    <h3 className="mb-2 line-clamp-1 text-lg font-black text-[#1A1A2E] group-hover:text-[#7C3AED] transition-colors">
      {campaign.campaignName}
    </h3>
    <p className="mb-4 flex items-center gap-1.5 text-xs font-bold text-[#6B7280]">
      <School className="h-3.5 w-3.5" />
      {campaign.schoolName}
    </p>

    <div className="mt-auto space-y-3">
      <div className="rounded-lg border-[1.5px] border-dashed border-[#1A1A2E]/30 bg-[#FAFAF5] p-3">
        <div className="flex items-center justify-between text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
          <span>Kết thúc sau</span>
          <Calendar className="h-3 w-3" />
        </div>
        <p className="mt-1 text-sm font-black text-[#1A1A2E]">
          {new Date(campaign.endDate).toLocaleDateString("vi-VN")}
        </p>
      </div>

      <div
        className="nb-btn nb-btn-purple flex w-full items-center justify-center gap-2 py-2 text-xs font-black shadow-[3px_3px_0_#1A1A2E]"
      >
        MUA NGAY <ArrowRight className="h-3.5 w-3.5" />
      </div>
    </div>
    </motion.div>
  );
};

const ProductCard = ({ product }: { product: FeaturedOutfitDto | UniformSearchResult }) => {
  const navigate = useNavigate();
  const imageUrl = ("mainImageUrl" in product ? product.mainImageUrl : (product as any).mainImageUrl) || null;
  const id = ("outfitId" in product ? product.outfitId : (product as any).id);
  const name = ("outfitName" in product ? product.outfitName : (product as any).outfitName);

  return (
    <motion.div
      onClick={() => navigate(`/outfits/${id}`)}
      whileHover={{ y: -4, rotate: -0.2 }}
      className="group relative flex h-full flex-col rounded-xl border-2 border-[#1A1A2E] bg-white shadow-[3px_3px_0_#1A1A2E] transition-all hover:shadow-[6px_6px_0_#1A1A2E] cursor-pointer"
    >
      <div className="relative aspect-[4/4.5] overflow-hidden rounded-t-[10px] bg-[#F3F4F6]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center opacity-30">
            <ImageIcon className="h-10 w-10 mb-2" />
            <span className="text-[10px] font-black uppercase tracking-widest">No Image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        
        {'averageRating' in product && product.averageRating > 0 && (
          <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full border-2 border-[#1A1A2E] bg-white px-1.5 py-0.5 text-[8px] font-black shadow-[1px_1px_0_#1A1A2E]">
            <StarFilledIcon className="h-2.5 w-2.5 text-[#FFD700]" />
            {product.averageRating}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <p className="mb-0.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-[#6B7280]">
          <School className="h-2.5 w-2.5" />
          {product.schoolName}
        </p>
        <h3 className="mb-2 line-clamp-2 text-xs font-black leading-snug text-[#1A1A2E] group-hover:text-[#7C3AED] transition-colors">
          {name}
        </h3>
        
        <div className="mt-auto flex items-center justify-between border-t border-dashed border-[#1A1A2E]/10 pt-2">
          <p className="text-sm font-black text-[#7C3AED]">{formatCurrency(product.price)}</p>
          <div 
            className="rounded-lg border-2 border-[#1A1A2E] bg-white p-1 shadow-[1.5px_1.5px_0_#1A1A2E] transition-all"
          >
            <ArrowRight className="h-3 w-3 text-[#1A1A2E]" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const StarFilledIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

// ── Main Page ───────────────────────────────────────────────────────────────

export default function ProductList() {
  const [data, setData] = useState<UniformWarehouseResponse | null>(null);
  const [schools, setSchools] = useState<{ id: string; schoolName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search state
  const [search, setSearch] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState("all");
  const [activeFilters, setActiveFilters] = useState({ search: "", schoolId: "all" });
  const [toast, setToast] = useState({ show: false, message: "" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [warehouseRes, schoolsRes] = await Promise.all([
          getUniformWarehouse(100),
          getPublicSchools(1, 100)
        ]);
        
        setData({
          activeCampaigns: warehouseRes?.activeCampaigns || [],
          featuredOutfits: warehouseRes?.featuredOutfits || [],
          allOutfits: warehouseRes?.allOutfits || [],
          totalOutfits: warehouseRes?.totalOutfits || 0
        });
        
        const schoolItems = (schoolsRes as any)?.schools || (schoolsRes as any)?.items || [];
        setSchools(schoolItems.map((s: any) => ({ 
          id: s.schoolId || s.id, 
          schoolName: s.schoolName 
        })) || []);
      } catch (err) {
        console.error("Failed to fetch product data", err);
        setSchools([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = () => {
    setActiveFilters({ search, schoolId: selectedSchoolId });
    setToast({ show: true, message: "Đã áp dụng bộ lọc đồng phục!" });
  };

  const handleReset = () => {
    setSearch(""); setSelectedSchoolId("all");
    setActiveFilters({ search: "", schoolId: "all" });
    setToast({ show: true, message: "Đã đặt lại bộ lọc!" });
  };

  // Filtering Logic (Frontend-side for aggregated summaries)
  const filteredData = useMemo(() => {
    if (!data) return null;

    const query = activeFilters.search.toLowerCase().trim();
    
    const filterCampaign = (c: CampaignSummaryDto) => {
      const matchesSearch = !query || c.campaignName.toLowerCase().includes(query) || c.schoolName.toLowerCase().includes(query);
      const matchesSchool = activeFilters.schoolId === "all" || c.schoolId === activeFilters.schoolId;
      return matchesSearch && matchesSchool;
    };

    const filterOutfit = (o: any) => {
      const name = o.outfitName || o.OutfitName || "";
      const matchesSearch = !query || name.toLowerCase().includes(query) || o.schoolName.toLowerCase().includes(query);
      const matchesSchool = activeFilters.schoolId === "all" || (o.schoolId || o.schoolID) === activeFilters.schoolId;
      return matchesSearch && matchesSchool;
    };

    return {
      activeCampaigns: (data?.activeCampaigns || []).filter(filterCampaign),
      featuredOutfits: (data?.featuredOutfits || []).filter(filterOutfit),
      allOutfits: (data?.allOutfits || []).filter(filterOutfit),
      totalOutfits: data?.allOutfits?.length || 0
    };
  }, [data, activeFilters]);

  // To answer user's question: "filter theo be hay fe"
  // I will implement a note here. Since we are fetching a summary of 100 items, FE filtering is instant and better UX.

  return (
    <GuestLayout bgColor="#FFF8F0">
      <Toast message={toast.message} show={toast.show} onHide={() => setToast(t => ({ ...t, show: false }))} />

      <div className="relative z-10 mx-auto max-w-[1100px] px-6 py-10 lg:px-8">
        <div className="mb-8">
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="mb-4">
                <PublicPageBreadcrumb items={[{ label: "Trang chủ", to: "/homepage" }, { label: "Kho đồng phục" }]} />
            </motion.div>

            <motion.h1 custom={1} variants={fadeUp} initial="hidden" animate="visible"
                className="text-3xl font-extrabold text-[#1A1A2E] mb-2 leading-tight tracking-tight lg:text-4xl"
            >
                Khám phá <span className="text-[#B8A9E8]">Kho đồng phục</span>
            </motion.h1>

            <motion.p custom={2} variants={fadeUp} initial="hidden" animate="visible"
                className="text-base text-[#4C5769] max-w-2xl font-medium"
            >
                Tìm kiếm sản phẩm theo tên hoặc lọc theo trường học để bắt đầu trang bị cho năm học mới.
            </motion.p>
        </div>

        {/* ═══ FILTER BAR — Style Matched with SchoolList ═══ */}
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="mb-8 relative z-20">
          <div className="nb-card-static overflow-visible px-5 py-5 shadow-[6px_6px_0_#1A1A2E] ring-2 ring-[#B8A9E8]/35 sm:px-6">
            <div className="flex w-full flex-wrap items-end gap-x-3 gap-y-3">
              {/* Search */}
              <div className="min-w-[200px] flex-1 space-y-1.5">
                <label className="block text-[10px] font-bold text-[#6B7280] ml-1 uppercase tracking-widest leading-tight">
                  Sản phẩm / Chiến dịch
                </label>
                <div className="group relative w-full transition-transform duration-200 hover:-translate-y-px">
                  <Search className="pointer-events-none absolute left-3 top-1/2 z-[2] h-3.5 w-3.5 -translate-y-1/2 text-[#1A1A2E]" />
                  <input
                    placeholder="Nhập tên sản phẩm..."
                    className="relative z-0 w-full h-9 pl-10 pr-3 rounded-lg border-2 border-[#1A1A2E] bg-white text-sm font-semibold text-[#1A1A2E] shadow-[4px_4px_0_#1A1A2E] transition-shadow placeholder:text-[#6B7280] placeholder:font-medium focus:outline-none focus:ring-2 focus:ring-[#B8A9E8]/45 focus:ring-offset-0 group-hover:shadow-[5px_5px_0_#1A1A2E]"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
              </div>

              {/* School Filter */}
              <div className="w-full max-w-[220px] shrink-0 space-y-1.5 sm:w-[220px]">
                <label className="block text-[10px] font-bold text-[#6B7280] ml-1 uppercase tracking-widest leading-tight">
                  Trường học
                </label>
                <SearchableSelect
                  value={selectedSchoolId}
                  onValueChange={(val) => {
                      setSelectedSchoolId(val);
                      // Auto apply school filter like in SchoolList
                      setActiveFilters(prev => ({ ...prev, schoolId: val }));
                  }}
                  placeholder="Chọn trường..."
                  options={[
                    { value: "all", label: "Tất cả trường" },
                    ...(schools || []).map((s) => ({ value: s.id, label: s.schoolName })),
                  ]}
                />
              </div>

              {/* Buttons */}
              <div className="flex shrink-0 flex-col gap-1.5">
                <span className="block text-[10px] font-bold uppercase tracking-widest leading-tight ml-1 invisible select-none"> &nbsp; </span>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleSearch}
                        className="group relative inline-flex h-9 min-w-[136px] items-center justify-center gap-2 overflow-hidden rounded-lg border-2 border-[#1A1A2E] bg-gradient-to-r from-[#A78BFA] via-[#C4B5FD] to-[#7C3AED] px-3.5 text-sm font-bold text-[#1A1A2E] shadow-[4px_4px_0_#1A1A2E] transition-all duration-200 hover:-translate-y-px hover:shadow-[5px_5px_0_#1A1A2E] hover:brightness-[1.08] active:translate-y-px active:shadow-[3px_3px_0_#1A1A2E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/55"
                    >
                        <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/40 via-white/10 to-transparent opacity-95 group-hover:from-white/50" />
                        <Search className="relative z-[1] h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
                        <span className="relative z-[1] tracking-tight">Tìm kiếm</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-[#1A1A2E] bg-white text-[#1A1A2E] shadow-[4px_4px_0_#1A1A2E] transition-all hover:-translate-y-px hover:shadow-[5px_5px_0_#1A1A2E] active:translate-y-px active:shadow-[3px_3px_0_#1A1A2E]"
                        title="Đặt lại"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
             <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="h-12 w-12 rounded-full border-4 border-[#7C3AED] border-t-transparent"
            />
            <p className="text-sm font-bold text-[#1A1A2E] uppercase animate-pulse">Đang nạp kho dữ liệu...</p>
          </div>
        ) : (
          <div className="space-y-20">
            {/* Active Campaigns */}
            <AnimatePresence>
              {filteredData?.activeCampaigns && filteredData.activeCampaigns.length > 0 && (
                <motion.section 
                  key="campaigns"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <SectionHeader 
                    title="Chiến dịch đang chạy" 
                    icon={Flame} 
                    subtitle="Đăng ký mua đồng phục tập trung với giá ưu đãi."
                    badge="HOT & LIMITED"
                  />
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {filteredData.activeCampaigns.map((c) => (
                      <CampaignCard key={c.campaignId} campaign={c} />
                    ))}
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {/* Featured Products */}
            {filteredData?.featuredOutfits && filteredData.featuredOutfits.length > 0 && (
              <motion.section
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <SectionHeader 
                  title="Sản phẩm nổi bật" 
                  icon={Sparkles} 
                  subtitle="Sản phẩm được đánh giá cao nhất hệ thống."
                  badge="TOP RATED"
                />
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {filteredData.featuredOutfits.map((p) => (
                    <ProductCard key={"feat-" + (("outfitId" in p ? p.outfitId : (p as any).id))} product={p} />
                  ))}
                </div>
              </motion.section>
            )}

            {/* All Products */}
            {filteredData?.allOutfits && filteredData.allOutfits.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-dashed border-[#1A1A2E]/20 pb-6 mb-10 gap-6">
                  <SectionHeader 
                    title="Tất cả sản phẩm" 
                    icon={LayoutGrid} 
                    subtitle="Toàn bộ danh mục đồng phục hiện có."
                  />
                  <div className="flex items-center gap-2 rounded-lg border-2 border-[#1A1A2E] bg-[#FAFAF5] px-3 py-1.5 shadow-[2px_2px_0_#1A1A2E]">
                    <Tag className="h-3 w-3 text-[#1A1A2E]" />
                    <span className="text-[10px] font-black text-[#1A1A2E] uppercase">
                      Kết quả: {filteredData.allOutfits.length}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {filteredData.allOutfits.map((p) => (
                    <ProductCard key={"all-" + p.id} product={p} />
                  ))}
                </div>
              </motion.section>
            )}

            {!filteredData?.activeCampaigns.length && !filteredData?.featuredOutfits.length && !filteredData?.allOutfits.length && (
              <div className="py-24 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-xl border-3 border-[#1A1A2E] bg-[#EDE9FE] shadow-[6px_6px_0_#1A1A2E]">
                    <LayoutGrid className="w-8 h-8 text-[#1A1A2E]" />
                  </div>
                  <h3 className="text-xl font-extrabold text-[#1A1A2E] mb-2">Không tìm thấy sản phẩm nào</h3>
                  <p className="text-[#6B7280] text-sm font-medium">Hãy thử thay đổi tiêu chí lọc hoặc tên sản phẩm.</p>
                  <button 
                    onClick={handleReset}
                    className="mt-6 font-black text-[#7C3AED] underline decoration-2 underline-offset-4"
                  >
                    Xóa tất cả lọc
                  </button>
              </div>
            )}
          </div>
        )}
      </div>
    </GuestLayout>
  );
}
