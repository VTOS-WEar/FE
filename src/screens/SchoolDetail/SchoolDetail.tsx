import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Phone, Mail, Globe, Calendar, GraduationCap, ArrowRight, BookOpen, Shirt, Building2, CheckCircle, Copy } from "lucide-react";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { getPublicSchoolDetail, getSchoolUniforms, parseContactInfo, type PublicSchoolDetailDto } from "../../lib/api/schools";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type UniformItem = {
  outfitId: string;
  outfitName: string;
  price: number;
  mainImageURL: string | null;
  outfitType: string;
};

const fmt = (n: number) => n.toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + " VNĐ";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  Active: { label: "Đang diễn ra", color: "bg-emerald-100 text-emerald-700 shadow-emerald-700/20" },
  Draft: { label: "Bản nháp", color: "bg-gray-100 text-gray-600 shadow-gray-600/20" },
  Locked: { label: "Đã khoá", color: "bg-red-100 text-red-600 shadow-red-600/20" },
  Ended: { label: "Đã kết thúc", color: "bg-amber-100 text-amber-700 shadow-amber-700/20" },
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
   COMPONENTS
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
          className="fixed top-24 right-6 z-50 bg-white/90 backdrop-blur-2xl border border-purple-100 shadow-[0_16px_48px_rgba(124,58,237,0.15)] rounded-2xl px-6 py-4 flex items-center gap-3 max-w-sm"
        >
          <div className="p-1.5 bg-emerald-50 rounded-full">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <span className="text-sm font-medium text-gray-700">{message}</span>
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

    // Fetch School Detail
    getPublicSchoolDetail(id)
      .then(setSchool)
      .catch(() => setError("Không tìm thấy thông tin trường học."))
      .finally(() => setLoading(false));

    // Fetch uniforms
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

  /* ───── Loading Skeleton ───── */
  if (loading) return (
    <GuestLayout bgColor="#FFF8F0">
      <div className="relative z-10 max-w-[1360px] mx-auto px-6 xl:px-28 py-10 min-h-screen">
        <div className="mb-6"><div className="h-4 w-64 bg-gray-200 rounded animate-pulse" /></div>
        <div className="w-full h-[240px] bg-gradient-to-r from-gray-100/60 via-gray-50/80 to-gray-100/60 rounded-[32px] mb-8 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[300px] w-full bg-gradient-to-r from-gray-100/60 via-gray-50/80 to-gray-100/60 rounded-[28px] animate-pulse" />
          ))}
        </div>
      </div>
    </GuestLayout>
  );

  /* ───── Error State ───── */
  if (error || !school) return (
    <GuestLayout bgColor="#FFF8F0">
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <motion.div
          className="w-20 h-20 mx-auto mb-2 bg-purple-50 rounded-full flex items-center justify-center"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Building2 className="w-8 h-8 text-purple-300" />
        </motion.div>
        <p className="text-gray-500 font-medium">{error || "Không tìm thấy trường học."}</p>
        <Button onClick={() => navigate("/schools")} variant="outline" className="mt-2 rounded-xl text-purple-600 border-purple-200 hover:bg-purple-50 transition-colors">
          ← Quay lại danh sách
        </Button>
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

      {/* NB decorative shapes */}

      <div className="relative z-10 max-w-[1360px] mx-auto px-6 lg:px-12 xl:px-28 py-10 min-h-screen">

        {/* Breadcrumb */}
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
                <BreadcrumbLink href="/schools" className="text-gray-500 hover:text-purple-600 font-medium transition-colors">
                  Danh sách trường
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-gray-900 font-bold line-clamp-1 max-w-[200px] sm:max-w-[400px]">
                  {school.schoolName}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </motion.div>

        {/* ═══════════════════════════════════════════════════
            HERO CARD SECTION
           ═══════════════════════════════════════════════════ */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
          <Card className="bg-white rounded-2xl border-2 border-[#1A1A2E] shadow-[4px_4px_0_#1A1A2E] p-6 lg:p-10 mb-12 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
            {/* NB decorative shape */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-[#C8E44D] border-2 border-[#1A1A2E] rounded-xl rotate-12 opacity-30 pointer-events-none" />

            {/* Logo */}
            <div className="relative w-24 h-24 lg:w-32 lg:h-32 rounded-[24px] overflow-hidden border border-gray-100 flex-shrink-0 bg-white flex items-center justify-center shadow-lg shadow-purple-900/5 z-10 group-hover:scale-105 transition-transform duration-500">
              {school.logoURL
                ? <img src={school.logoURL} alt={school.schoolName} className="w-full h-full object-cover" />
                : <GraduationCap className="w-12 h-12 text-purple-200" />}
            </div>

            {/* School Info */}
            <div className="flex-1 z-10 w-full">
              <div className="flex justify-between items-start gap-4 flex-col lg:flex-row mb-2 w-full">
                <div className="flex-1">
                  <h1 className="font-baloo tracking-tight font-extrabold text-2xl lg:text-3xl text-gray-900 mb-3 leading-tight">
                    {school.schoolName}
                  </h1>
                  
                  {/* Address */}
                  {contact.address && (
                    <div className="flex items-start gap-2.5 text-gray-600 mb-4">
                      <div className="p-1.5 bg-purple-50 rounded-lg text-purple-600 shrink-0 shadow-sm border border-purple-100/50">
                        <MapPin className="w-3.5 h-3.5 shadow-sm" />
                      </div>
                      <span className="text-[14px] font-medium leading-relaxed max-w-2xl mt-1">
                        {contact.address}
                      </span>
                    </div>
                  )}

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {contact.phone && (
                      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm shadow-gray-200/20 hover:border-purple-300 hover:shadow-purple-100 transition-all cursor-default">
                        <Phone className="w-3.5 h-3.5 text-purple-500" />
                        <span className="text-[13px] font-bold text-gray-700 tracking-wide">{contact.phone}</span>
                      </div>
                    )}
                    {contact.email && (
                      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm shadow-gray-200/20 hover:border-purple-300 hover:shadow-purple-100 transition-all cursor-default">
                        <Mail className="w-3.5 h-3.5 text-purple-500" />
                        <span className="text-[13px] font-bold text-gray-700 tracking-wide">{contact.email}</span>
                      </div>
                    )}
                    {contact.foundedYear && (
                      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm shadow-gray-200/20 hover:border-purple-300 hover:shadow-purple-100 transition-all cursor-default">
                        <Calendar className="w-3.5 h-3.5 text-purple-500" />
                        <span className="text-[13px] font-bold text-gray-500">Thành lập: <span className="text-gray-900">{contact.foundedYear}</span></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0 self-start lg:mt-0 mt-2">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button onClick={handleCopyLink} variant="outline" className="h-10 px-4 rounded-xl border-gray-200 text-gray-600 hover:text-purple-600 hover:border-purple-300 hover:bg-purple-50 transition-all font-bold gap-2 shadow-sm">
                      <Copy className="w-4 h-4" /> Chia sẻ
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ═══════════════════════════════════════════════════
            CAMPAIGNS SECTION 
           ═══════════════════════════════════════════════════ */}
        <ScrollSection delay={0.1}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-purple-100/50 rounded-xl text-purple-600"><Calendar className="w-5 h-5" /></div>
            <h2 className="font-baloo font-extrabold text-2xl text-gray-900 tracking-tight">
              Chương trình đồng phục
            </h2>
            {allCampaigns.length > 0 && (
              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-none font-bold px-2 py-0.5 rounded-md ml-1">{allCampaigns.length}</Badge>
            )}
          </div>

          {allCampaigns.length === 0 ? (
            <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-12 text-center border border-dashed border-gray-200">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4"><GraduationCap className="w-8 h-8 text-gray-400" /></div>
              <p className="font-medium text-gray-500">Chưa có chương trình đồng phục nào.</p>
            </div>
          ) : (
            <motion.div variants={staggerGrid} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-2 gap-5 xl:gap-6">
              {[...activeCampaigns, ...otherCampaigns].map(c => {
                const s = STATUS_LABEL[c.status] ?? { label: c.status, color: "bg-gray-100 text-gray-600" };
                const canViewDetail = isParent;
                const startYear = new Date(c.startDate).getFullYear();
                const endYear = new Date(c.endDate).getFullYear();
                const academicYearStr = startYear === endYear ? `${startYear}` : `${startYear} - ${endYear}`;

                return (
                  <motion.div key={c.campaignId} variants={cardItem} whileHover={canViewDetail ? { scale: 1.02, y: -2 } : {}} whileTap={canViewDetail ? { scale: 0.98 } : {}}
                    onClick={() => canViewDetail && navigate(`/campaigns/${c.campaignId}`)}
                    className={`bg-white rounded-[24px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100/60 transition-all flex flex-col sm:flex-row ${canViewDetail ? "hover:border-purple-200 hover:shadow-[0_20px_48px_-12px_rgba(124,58,237,0.15)] cursor-pointer group" : ""}`}>

                    {/* Left/Top Highlight: Niên Khóa */}
                    <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-5 flex flex-col justify-center items-center text-white shrink-0 sm:w-[130px] md:w-[150px] relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                      <Calendar className="w-6 h-6 mb-2 text-white/90 drop-shadow-sm z-10" />
                      <span className="text-[10px] uppercase tracking-[0.1em] font-bold text-white/80 mb-1 z-10">Niên khóa</span>
                      <span className="font-baloo font-extrabold text-[20px] md:text-[22px] leading-none text-center drop-shadow-sm z-10">
                        {academicYearStr}
                      </span>
                    </div>

                    {/* Right/Bottom Context */}
                    <div className="flex-1 p-5 flex flex-col justify-center relative bg-white">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-[15px] text-gray-900 group-hover:text-purple-600 transition-colors leading-tight line-clamp-2 md:line-clamp-1">{c.campaignName}</h3>
                        </div>
                        <span className={`shrink-0 inline-flex text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md shadow-sm ${s.color}`}>{s.label}</span>
                      </div>

                      {c.description && <p className="text-[13px] font-medium text-gray-500 mb-3 line-clamp-2 leading-relaxed">{c.description}</p>}

                      <div className="flex items-center gap-4 mt-auto pt-2 flex-wrap">
                        <div className="flex items-center gap-1.5 font-bold text-[13px] text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100/50">
                          <Shirt className="w-4 h-4 text-purple-400" />
                          <span><span className="text-gray-900">{c.outfitCount}</span> mẫu</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-bold text-[13px] text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100/50">
                          <Calendar className="w-4 h-4 text-purple-400" />
                          <span>Hạn: <span className="text-gray-900">{new Date(c.endDate).toLocaleDateString("vi-VN")}</span></span>
                        </div>
                      </div>

                      {canViewDetail ? (
                        <div className="absolute bottom-5 right-5 lg:opacity-0 lg:-translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                          <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-sm">
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      ) : (
                        <div className="absolute bottom-5 right-5">
                          <Badge variant="outline" className="text-[10px] bg-gray-50 text-gray-400 border-gray-200">Đăng nhập</Badge>
                        </div>
                      )}
                    </div>

                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </ScrollSection>

        {/* ═══════════════════════════════════════════════════
            UNIFORMS SECTION 
           ═══════════════════════════════════════════════════ */}
        <ScrollSection delay={0.2} className="mt-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-pink-100/50 rounded-xl text-pink-600"><Shirt className="w-5 h-5" /></div>
            <h2 className="font-baloo font-extrabold text-2xl text-gray-900 tracking-tight">
              Tất cả đồng phục
            </h2>
            {uniforms.length > 0 && (
              <Badge className="bg-pink-100 text-pink-700 hover:bg-pink-200 border-none font-bold px-2 py-0.5 rounded-md ml-1">{uniforms.length}</Badge>
            )}
          </div>

          {uniforms.length === 0 ? (
            <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-12 text-center border border-dashed border-gray-200">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4"><Shirt className="w-8 h-8 text-gray-400" /></div>
              <p className="font-medium text-gray-500">Chưa có đồng phục nào.</p>
            </div>
          ) : (
            <motion.div variants={staggerGrid} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {uniforms.map(u => (
                <motion.div
                  key={u.outfitId}
                  variants={cardItem}
                  onClick={() => navigate(`/outfits/${u.outfitId}`)}
                  whileHover={{ y: -8, scale: 1.02, transition: { type: "spring", stiffness: 350, damping: 20 } }}
                  whileTap={{ scale: 0.97 }}
                  className="group relative h-full cursor-pointer flex"
                >
                  <div className="absolute -inset-2 rounded-[32px] bg-purple-300/0 group-hover:bg-purple-300/10 blur-xl transition-all duration-500 pointer-events-none" />
                  <Card className="relative w-full h-full bg-white rounded-[24px] overflow-hidden border border-gray-100/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] group-hover:shadow-[0_24px_48px_-12px_rgba(124,58,237,0.15)] group-hover:border-purple-100/80 transition-all duration-500 flex flex-col">
                    <div className="w-full aspect-[5/4] overflow-hidden bg-gray-50 relative shrink-0">
                      {u.mainImageURL != null ? (
                        <img src={u.mainImageURL} alt={u.outfitName} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Shirt className="w-12 h-12 text-gray-300" /></div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-white/90 backdrop-blur-sm text-gray-700 border-none font-bold text-[10px] uppercase shadow-sm group-hover:shadow-md transition-all">
                          {u.outfitType || "Tiêu chuẩn"}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <h3 className="font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-purple-600 transition-colors leading-snug text-sm sm:text-base">{u.outfitName}</h3>
                      <div className="flex items-center justify-between mt-auto pt-2">
                        <p className="font-extrabold text-purple-600 text-sm sm:text-base">{fmt(u.price)}</p>
                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-purple-600 group-hover:text-white transition-colors shrink-0">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </ScrollSection>
      </div>

      <style>{`
        .font-baloo { font-family: 'Baloo 2', cursive; }
      `}</style>
    </GuestLayout>
  );
};
