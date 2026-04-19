import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Phone, Mail, Calendar, GraduationCap, ArrowRight, Shirt, Building2, CheckCircle, Copy, BookOpen } from "lucide-react";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { PublicPageBreadcrumb } from "@/components/PublicPageBreadcrumb";
import { getPublicSchoolDetail, getSchoolUniforms, parseContactInfo, type PublicSchoolDetailDto } from "../../lib/api/schools";
import { getAllSchoolSemesterCatalogs, type SchoolSemesterCatalogResponse } from "../../lib/api/public";
import { motion, AnimatePresence, useInView } from "framer-motion";

type UniformItem = {
  outfitId: string;
  outfitName: string;
  price: number;
  mainImageURL: string | null;
  outfitType: string;
  averageRating?: number;
  feedbackCount?: number;
};

const fmt = (n: number) => n.toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + " VNĐ";

const STATUS_LABEL: Record<string, { label: string; badge: string }> = {
  Draft: { label: "Đang soạn thảo", badge: "nb-badge-gray" },
  Closed: { label: "Đã đóng", badge: "nb-badge-gray" },
  Active: { label: "Đang mở", badge: "nb-badge-green" },
  Completed: { label: "Đã kết thúc", badge: "nb-badge-blue" },
  Locked: { label: "Đã khóa", badge: "nb-badge-red" },
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
  const [allSemesterCatalogs, setAllSemesterCatalogs] = useState<SchoolSemesterCatalogResponse[]>([]);

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

    getAllSchoolSemesterCatalogs(id)
      .then((res) => {
        setAllSemesterCatalogs(res);
      })
      .catch(() => {
        setAllSemesterCatalogs([]);
      });
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
    <GuestLayout bgColor="#f9fafb">
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
    <GuestLayout bgColor="#f9fafb">
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-20 h-20 flex items-center justify-center rounded-xl border-3 border-gray-200 bg-violet-50 shadow-soft-lg">
          <Building2 className="w-8 h-8 text-gray-900" />
        </div>
        <p className="text-gray-600 font-bold">{error || "Không tìm thấy trường học."}</p>
        <button onClick={() => navigate("/schools")} className="nb-btn nb-btn-outline">
          ← Quay lại danh sách
        </button>
      </div>
    </GuestLayout>
  );

  const contact = parseContactInfo(school.contactInfo);

  return (
    <GuestLayout bgColor="#f9fafb">
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
          <div className="rounded-[28px] border border-gray-200 bg-white p-6 lg:p-10 mb-12 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden shadow-soft-lg">
            {/* Soft decorative shape */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-violet-50 border border-gray-100 rounded-xl rotate-12 opacity-60 pointer-events-none" />

            {/* Logo */}
            <div className="relative w-24 h-24 lg:w-32 lg:h-32 rounded-[20px] overflow-hidden border border-gray-200 flex-shrink-0 bg-white flex items-center justify-center shadow-soft-sm z-10">
              {school.logoURL
                ? <img src={school.logoURL} alt={school.schoolName} className="w-full h-full object-cover" />
                : <GraduationCap className="w-12 h-12 text-purple-400" />}
            </div>

            {/* School Info */}
            <div className="flex-1 z-10 w-full">
              <div className="flex justify-between items-start gap-4 flex-col lg:flex-row mb-2 w-full">
                <div className="flex-1">
                  <h1 className="font-extrabold text-2xl lg:text-3xl text-gray-900 mb-3 leading-tight tracking-tight">
                    {school.schoolName}
                  </h1>

                  {/* Address */}
                  {contact.address && (
                    <div className="flex items-start gap-2.5 text-gray-600 mb-4">
                      <div className="p-1.5 bg-violet-50 rounded-lg border border-gray-200 shrink-0 shadow-sm">
                        <MapPin className="w-3.5 h-3.5 text-gray-900" />
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
                        <Phone className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-[13px] font-bold text-gray-900">{contact.phone}</span>
                      </div>
                    )}
                    {contact.email && (
                      <div className="nb-badge gap-2">
                        <Mail className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-[13px] font-bold text-gray-900">{contact.email}</span>
                      </div>
                    )}
                    {contact.foundedYear && (
                      <div className="nb-badge gap-2">
                        <Calendar className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-[13px] font-bold text-gray-500">Thành lập: <span className="text-gray-900">{contact.foundedYear}</span></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 shrink-0 self-start lg:mt-0 mt-4">
                  <button onClick={handleCopyLink} className="nb-btn nb-btn-outline h-11 gap-2 text-sm">
                    <Copy className="w-4 h-4" /> Chia sẻ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══ CATALOG SECTION ═══ */}
        <ScrollSection delay={0.1}>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-violet-50 shadow-soft-sm">
              <BookOpen className="w-5 h-5 text-gray-900" />
            </div>
            <h2 className="font-extrabold text-2xl text-gray-900 tracking-tight">
              Danh mục học kỳ
            </h2>
            {allSemesterCatalogs.length > 0 && (
              <span className="nb-badge nb-badge-purple ml-1">Hiện có {allSemesterCatalogs.length}</span>
            )}
          </div>

          {allSemesterCatalogs.length === 0 ? (
            <div className="nb-card-static p-12 text-center border-dashed">
              <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-xl border-3 border-gray-200 bg-violet-50 shadow-soft-lg mb-4">
                <BookOpen className="w-8 h-8 text-gray-900" />
              </div>
              <p className="font-bold text-gray-500">Trường chưa phát hành danh mục học kỳ nào.</p>
            </div>
          ) : (
            <motion.div variants={staggerGrid} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allSemesterCatalogs.map((cat) => (
                <motion.div key={cat.semesterPublicationId} variants={cardItem} className="h-full">
                  <div className="nb-card overflow-hidden flex flex-col h-full bg-white group hover:border-violet-400 transition-colors">
                    {/* Compact Header */}
                    <div className="p-4 bg-slate-50 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                          <Calendar className="w-4 h-4 text-violet-500" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-gray-400 leading-none">Học kỳ</p>
                          <h3 className="font-extrabold text-sm text-gray-900 mt-0.5">{cat.semester}</h3>
                        </div>
                      </div>
                      <div className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase ${STATUS_LABEL[cat.status]?.badge || 'bg-gray-100'}`}>
                        {STATUS_LABEL[cat.status]?.label || cat.status}
                      </div>
                    </div>

                    {/* Compact Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div className="grid grid-cols-2 gap-4 mb-5">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Năm học</p>
                          <p className="text-xs font-bold text-gray-900">{cat.academicYear}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hạn đặt hàng</p>
                          <p className="text-xs font-bold text-gray-900">{new Date(cat.endDate).toLocaleDateString("vi-VN")}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-violet-50 rounded-xl border border-violet-100 mb-5">
                        <div className="flex items-center gap-2">
                          <Shirt className="w-4 h-4 text-violet-400" />
                          <span className="text-xs font-bold text-gray-700">Bộ sưu tập đồng phục</span>
                        </div>
                        <span className="text-sm font-black text-violet-600">{cat.outfits.length}</span>
                      </div>

                      <button
                        onClick={() => navigate(`/schools/${school.schoolId}/catalog?publicationId=${cat.semesterPublicationId}`)}
                        className="w-full h-11 bg-gradient-to-r from-[#B8A9E8] to-[#A996E2] border border-gray-200 font-extrabold text-xs uppercase tracking-widest text-gray-900 rounded-xl shadow-soft-sm hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                      >
                        <BookOpen className="w-4 h-4" />
                        Xem chi tiết danh mục
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </ScrollSection>

        {/* ═══ UNIFORMS SECTION ═══ */}
        <ScrollSection delay={0.2} className="mt-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-pink-200 shadow-soft-sm">
              <Shirt className="w-5 h-5 text-gray-900" />
            </div>
            <h2 className="font-extrabold text-2xl text-gray-900 tracking-tight">
              Tất cả sản phẩm
            </h2>
            {uniforms.length > 0 && (
              <span className="nb-badge nb-badge-pink ml-1">Tổng {uniforms.length}</span>
            )}
          </div>

          {uniforms.length === 0 ? (
            <div className="nb-card-static p-12 text-center border-dashed">
              <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-xl border-3 border-gray-200 bg-pink-200 shadow-soft-lg mb-4">
                <Shirt className="w-8 h-8 text-gray-900" />
              </div>
              <p className="font-bold text-gray-500">Chưa có sản phẩm đồng phục nào được liệt kê.</p>
            </div>
          ) : (
            <motion.div variants={staggerGrid} initial="hidden" animate="visible" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
              {uniforms.map(u => (
                <motion.div
                  key={u.outfitId}
                  variants={cardItem}
                  className="group h-full"
                >
                  <div
                    className="relative flex flex-col h-full bg-white rounded-[20px] border border-gray-100 shadow-soft-sm hover:shadow-soft-md transition-all duration-300 cursor-pointer overflow-hidden"
                    onClick={() => navigate(`/outfits/${u.outfitId}`)}
                  >
                    {/* Compact Image Container */}
                    <div className="relative aspect-square overflow-hidden bg-slate-50">
                      {u.mainImageURL != null ? (
                        <img
                          src={u.mainImageURL}
                          alt={u.outfitName}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-violet-50">
                          <Shirt className="w-10 h-10 text-violet-200" />
                        </div>
                      )}

                      {/* Sub-label floating */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                        <span className="px-2 py-0.5 bg-[#A996E2]/90 backdrop-blur-md rounded-md text-[8px] font-black uppercase tracking-widest text-white border border-white/20 shadow-sm">
                          {u.outfitType || "BASIC"}
                        </span>
                        {u.price < 200000 && (
                          <span className="px-2 py-0.5 bg-emerald-500/90 backdrop-blur-md rounded-md text-[8px] font-black uppercase tracking-widest text-white shadow-sm">
                            Best Deal
                          </span>
                        )}
                      </div>

                      {/* Floating Price Tooltip */}
                      <div className="absolute bottom-2 right-2">
                        <div className="px-2 py-1 bg-white border border-gray-100 rounded-lg text-gray-900 font-extrabold text-[11px] shadow-sm transform translate-y-0 group-hover:-translate-y-0.5 transition-transform">
                          {fmt(u.price)}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="text-[13px] font-extrabold text-gray-900 leading-tight mb-2 group-hover:text-violet-600 transition-colors line-clamp-2 min-h-[32px]">
                        {u.outfitName}
                      </h3>

                      {/* Educational/Practical Attributes */}
                      <div className="mb-3 flex flex-wrap gap-1 md:gap-1.5 opacity-80">
                        <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded leading-none">Cotton 100%</span>
                        <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded leading-none">Unisex</span>
                      </div>

                      <div className="mt-auto">
                        {isParent ? (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/schools/${school.schoolId}/catalog`);
                            }}
                            className="w-full h-9 flex items-center justify-center gap-2 bg-gradient-to-r from-[#B8A9E8] to-[#A996E2] text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-soft-sm hover:brightness-105 transition-all"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            Truy cập danh mục
                          </button>
                        ) : (
                          <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-emerald-500 fill-emerald-50" />
                              <span className="text-[9px] font-bold text-gray-400">Đã kiểm định</span>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        )}
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
