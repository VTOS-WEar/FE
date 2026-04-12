import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Phone, Mail, Calendar, GraduationCap, ArrowRight, Shirt, Building2, CheckCircle, Copy } from "lucide-react";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { PublicPageBreadcrumb } from "@/components/PublicPageBreadcrumb";
import { getPublicSchoolDetail, getSchoolUniforms, parseContactInfo, type PublicSchoolDetailDto } from "../../lib/api/schools";
import { motion, AnimatePresence, useInView } from "framer-motion";

type UniformItem = {
  outfitId: string;
  outfitName: string;
  price: number;
  mainImageURL: string | null;
  outfitType: string;
};

const fmt = (n: number) => n.toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + " VNĐ";

const STATUS_LABEL: Record<string, { label: string; badge: string }> = {
  Active:    { label: "Đang diễn ra", badge: "nb-badge-green" },
  Completed: { label: "Hoàn thành",   badge: "nb-badge-blue" },
  Locked:    { label: "Đã khóa",      badge: "nb-badge-red" },
};

/* ═══════════════════════════════════════════════════════
   ANIMATION VARIANTS
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
   SCROLL SECTION
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

/* NB TOAST */
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
          className="fixed top-24 right-6 z-50 nb-card-static flex items-center gap-3 px-5 py-3 max-w-sm"
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
   MAIN SCREEN
   ═══════════════════════════════════════════════════════ */
export const SchoolDetail = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [school, setSchool] = useState<PublicSchoolDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState({ show: false, message: "" });
  const [uniforms, setUniforms] = useState<UniformItem[]>([]);

  useEffect(() => {
    if (!id) return;
    getPublicSchoolDetail(id)
      .then(setSchool)
      .catch(() => setError("Không tìm thấy thông tin trường học."))
      .finally(() => setLoading(false));

    getSchoolUniforms(id, 1, 20)
      .then((res: any) => {
        const items = Array.isArray(res) ? res : (res?.items ?? []);
        setUniforms(items);
      })
      .catch(() => { });
  }, [id]);

  const isParent = (() => {
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    try { return raw ? JSON.parse(raw).role === "Parent" : false; } catch { return false; }
  })();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setToast({ show: true, message: "Đã lưu đường dẫn liên kết!" });
  };

  /* ─── Loading Skeleton ─── */
  if (loading) return (
    <GuestLayout bgColor="#FFF8F0">
      <div className="relative z-10 max-w-[1100px] mx-auto px-6 lg:px-8 py-10 min-h-screen">
        <div className="mb-6"><div className="h-4 w-64 nb-skeleton rounded-lg" /></div>
        <div className="w-full h-[200px] nb-skeleton rounded-xl mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[300px] nb-skeleton rounded-xl" />
          ))}
        </div>
      </div>
    </GuestLayout>
  );

  /* ─── Error State ─── */
  if (error || !school) return (
    <GuestLayout bgColor="#FFF8F0">
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-20 h-20 flex items-center justify-center rounded-xl border-3 border-[#1A1A2E] bg-[#EDE9FE] shadow-[6px_6px_0_#1A1A2E]">
          <Building2 className="w-8 h-8 text-[#1A1A2E]" />
        </div>
        <p className="text-[#4C5769] font-bold">{error || "Không tìm thấy trường học."}</p>
        <button onClick={() => navigate("/schools")} className="nb-btn nb-btn-outline">
          ← Quay lại danh sách
        </button>
      </div>
    </GuestLayout>
  );

  const contact = parseContactInfo(school.contactInfo);
  const allCampaigns = school.activeCampaigns ?? [];
  const activeCampaigns = allCampaigns.filter(c => c.status === "Active");
  const otherCampaigns = allCampaigns.filter(c => c.status !== "Active");

  return (
    <GuestLayout bgColor="#FFF8F0">
      <Toast message={toast.message} show={toast.show} onHide={() => setToast(t => ({ ...t, show: false }))} />

      <div className="relative z-10 max-w-[1100px] mx-auto px-6 lg:px-8 py-10 min-h-screen">

        {/* Breadcrumb */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="mb-6">
          <PublicPageBreadcrumb
            items={[
              { label: "Trang chủ", to: "/homepage" },
              { label: "Danh sách trường", to: "/schools" },
              { label: school.schoolName },
            ]}
          />
        </motion.div>

        {/* ═══ HERO CARD ═══ */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
          <div className="nb-card-static p-6 lg:p-10 mb-12 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
            {/* NB decorative shape */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-[#C8E44D] border-3 border-[#1A1A2E] rounded-xl rotate-12 opacity-30 pointer-events-none" />

            {/* Logo */}
            <div className="relative w-24 h-24 lg:w-32 lg:h-32 rounded-xl overflow-hidden border-3 border-[#1A1A2E] flex-shrink-0 bg-white flex items-center justify-center shadow-[6px_6px_0_#1A1A2E] z-10">
              {school.logoURL
                ? <img src={school.logoURL} alt={school.schoolName} className="w-full h-full object-cover" />
                : <GraduationCap className="w-12 h-12 text-[#B8A9E8]" />}
            </div>

            {/* School Info */}
            <div className="flex-1 z-10 w-full">
              <div className="flex justify-between items-start gap-4 flex-col lg:flex-row mb-2 w-full">
                <div className="flex-1">
                  <h1 className="font-extrabold text-2xl lg:text-3xl text-[#1A1A2E] mb-3 leading-tight tracking-tight">
                    {school.schoolName}
                  </h1>

                  {/* Address */}
                  {contact.address && (
                    <div className="flex items-start gap-2.5 text-[#4C5769] mb-4">
                      <div className="p-1.5 bg-[#EDE9FE] rounded-lg border-2 border-[#1A1A2E] shrink-0 shadow-[2px_2px_0_#1A1A2E]">
                        <MapPin className="w-3.5 h-3.5 text-[#1A1A2E]" />
                      </div>
                      <span className="text-sm font-medium leading-relaxed max-w-2xl mt-1">
                        {contact.address}
                      </span>
                    </div>
                  )}

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {contact.phone && (
                      <div className="nb-badge gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#B8A9E8]" />
                        <span className="text-[13px] font-bold text-[#1A1A2E]">{contact.phone}</span>
                      </div>
                    )}
                    {contact.email && (
                      <div className="nb-badge gap-2">
                        <Mail className="w-3.5 h-3.5 text-[#B8A9E8]" />
                        <span className="text-[13px] font-bold text-[#1A1A2E]">{contact.email}</span>
                      </div>
                    )}
                    {contact.foundedYear && (
                      <div className="nb-badge gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#B8A9E8]" />
                        <span className="text-[13px] font-bold text-[#6B7280]">Thành lập: <span className="text-[#1A1A2E]">{contact.foundedYear}</span></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0 self-start lg:mt-0 mt-2">
                  <button onClick={handleCopyLink} className="nb-btn nb-btn-outline h-10 gap-2 text-sm">
                    <Copy className="w-4 h-4" /> Chia sẻ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══ CAMPAIGNS SECTION ═══ */}
        <ScrollSection delay={0.1}>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[#1A1A2E] bg-[#EDE9FE] shadow-[3px_3px_0_#1A1A2E]">
              <Calendar className="w-5 h-5 text-[#1A1A2E]" />
            </div>
            <h2 className="font-extrabold text-2xl text-[#1A1A2E] tracking-tight">
              Chương trình đồng phục
            </h2>
            {allCampaigns.length > 0 && (
              <span className="nb-badge nb-badge-purple ml-1">{allCampaigns.length}</span>
            )}
          </div>

          {allCampaigns.length === 0 ? (
            <div className="nb-card-static p-12 text-center border-dashed">
              <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-xl border-3 border-[#1A1A2E] bg-[#EDE9FE] shadow-[6px_6px_0_#1A1A2E] mb-4">
                <GraduationCap className="w-8 h-8 text-[#1A1A2E]" />
              </div>
              <p className="font-bold text-[#6B7280]">Chưa có chương trình đồng phục nào.</p>
            </div>
          ) : (
            <motion.div variants={staggerGrid} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...activeCampaigns, ...otherCampaigns].map(c => {
                const s = STATUS_LABEL[c.status] ?? { label: c.status, badge: "nb-badge-yellow" };
                const canViewDetail = isParent;
                const startYear = new Date(c.startDate).getFullYear();
                const endYear = new Date(c.endDate).getFullYear();
                const academicYearStr = startYear === endYear ? `${startYear}` : `${startYear} - ${endYear}`;

                return (
                  <motion.div key={c.campaignId} variants={cardItem} className="h-full">
                    <div
                      onClick={() => canViewDetail && navigate(`/campaigns/${c.campaignId}`)}
                      className={`nb-card overflow-hidden flex flex-col sm:flex-row h-full ${canViewDetail ? "cursor-pointer" : ""}`}
                    >
                      {/* Academic Year Side */}
                      <div className="bg-[#B8A9E8] p-5 flex flex-col justify-center items-center text-[#1A1A2E] shrink-0 sm:w-[130px] md:w-[150px] border-r-3 border-[#1A1A2E]">
                        <Calendar className="w-6 h-6 mb-2" />
                        <span className="text-[10px] uppercase tracking-[0.1em] font-extrabold opacity-70 mb-1">Niên khóa</span>
                        <span className="font-extrabold text-xl leading-none text-center">
                          {academicYearStr}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 p-5 flex flex-col relative bg-white">
                        <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                          <h3 className="font-extrabold text-sm text-[#1A1A2E] leading-tight line-clamp-2 flex-1">{c.campaignName}</h3>
                          <span className={`shrink-0 nb-badge ${s.badge}`}>{s.label}</span>
                        </div>

                        {c.description && <p className="text-[13px] font-medium text-[#6B7280] mb-3 line-clamp-2 leading-relaxed">{c.description}</p>}

                        <div className="flex items-center gap-3 mt-auto pt-2 flex-wrap">
                          <div className="nb-badge gap-1.5">
                            <Shirt className="w-3.5 h-3.5 text-[#B8A9E8]" />
                            <span className="font-bold text-[13px]"><span className="text-[#1A1A2E]">{c.outfitCount}</span> <span className="text-[#6B7280]">mẫu</span></span>
                          </div>
                          <div className="nb-badge gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#B8A9E8]" />
                            <span className="font-bold text-[13px] text-[#6B7280]">Hạn: <span className="text-[#1A1A2E]">{new Date(c.endDate).toLocaleDateString("vi-VN")}</span></span>
                          </div>
                        </div>

                        {canViewDetail && (
                          <div className="absolute bottom-5 right-5 opacity-60 group-hover:opacity-100 transition-opacity">
                            <div className="w-8 h-8 rounded-lg border-2 border-[#1A1A2E] bg-[#EDE9FE] flex items-center justify-center shadow-[2px_2px_0_#1A1A2E]">
                              <ArrowRight className="w-3.5 h-3.5 text-[#1A1A2E]" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </ScrollSection>

        {/* ═══ UNIFORMS SECTION ═══ */}
        <ScrollSection delay={0.2} className="mt-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[#1A1A2E] bg-[#F5C6C2] shadow-[3px_3px_0_#1A1A2E]">
              <Shirt className="w-5 h-5 text-[#1A1A2E]" />
            </div>
            <h2 className="font-extrabold text-2xl text-[#1A1A2E] tracking-tight">
              Tất cả đồng phục
            </h2>
            {uniforms.length > 0 && (
              <span className="nb-badge nb-badge-pink ml-1">{uniforms.length}</span>
            )}
          </div>

          {uniforms.length === 0 ? (
            <div className="nb-card-static p-12 text-center border-dashed">
              <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-xl border-3 border-[#1A1A2E] bg-[#F5C6C2] shadow-[6px_6px_0_#1A1A2E] mb-4">
                <Shirt className="w-8 h-8 text-[#1A1A2E]" />
              </div>
              <p className="font-bold text-[#6B7280]">Chưa có đồng phục nào.</p>
            </div>
          ) : (
            <motion.div variants={staggerGrid} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {uniforms.map(u => (
                <motion.div
                  key={u.outfitId}
                  variants={cardItem}
                  className="group h-full"
                >
                  <div
                    className="nb-card h-full flex flex-col cursor-pointer overflow-hidden"
                    onClick={() => navigate(`/outfits/${u.outfitId}`)}
                  >
                    <div className="w-full aspect-[5/4] overflow-hidden bg-[#FAFAF5] relative shrink-0">
                      {u.mainImageURL != null ? (
                        <img src={u.mainImageURL} alt={u.outfitName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Shirt className="w-12 h-12 text-[#6B7280]" /></div>
                      )}
                      <div className="absolute top-3 left-3">
                        <span className="nb-badge nb-badge-purple text-[10px] uppercase">
                          {u.outfitType || "Tiêu chuẩn"}
                        </span>
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <h3 className="font-extrabold text-[#1A1A2E] line-clamp-2 mb-2 group-hover:text-[#B8A9E8] transition-colors leading-snug text-sm">{u.outfitName}</h3>
                      <div className="flex items-center justify-between mt-auto pt-2">
                        <p className="font-extrabold text-[#B8A9E8] text-sm">{fmt(u.price)}</p>
                        <div className="w-8 h-8 rounded-lg border-2 border-[#1A1A2E] bg-[#EDE9FE] flex items-center justify-center shadow-[2px_2px_0_#1A1A2E] group-hover:bg-[#B8A9E8] transition-colors shrink-0">
                          <ArrowRight className="w-4 h-4 text-[#1A1A2E]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </ScrollSection>
      </div>
    </GuestLayout>
  );
};
