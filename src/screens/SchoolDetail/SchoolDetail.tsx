import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ChevronRight, MapPin, Phone, Mail, Globe, Calendar, GraduationCap, ArrowRight, BookOpen, Shirt } from "lucide-react";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { getPublicSchoolDetail, getSchoolUniforms, parseContactInfo, type PublicSchoolDetailDto } from "../../lib/api/schools";

type UniformItem = {
  outfitId: string;
  outfitName: string;
  price: number;
  mainImageURL: string | null;
  outfitType: string;
};

const fmt = (n: number) => n.toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + " VN\u0110";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  Active:   { label: "Đang diễn ra", color: "bg-green-100 text-green-700" },
  Draft:    { label: "Bản nháp",     color: "bg-gray-100 text-gray-600"   },
  Locked:   { label: "Đã khoá",      color: "bg-red-100 text-red-600"     },
  Ended:    { label: "Đã kết thúc",  color: "bg-amber-100 text-amber-700" },
};

export const SchoolDetail = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [school, setSchool] = useState<PublicSchoolDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getPublicSchoolDetail(id)
      .then(setSchool)
      .catch(() => setError("Không tìm thấy thông tin trường học."))
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch uniforms for this school
  const [uniforms, setUniforms] = useState<UniformItem[]>([]);
  useEffect(() => {
    if (!id) return;
    getSchoolUniforms(id, 1, 20)
      .then((res: any) => {
        const items = Array.isArray(res) ? res : (res?.items ?? []);
        setUniforms(items);
      })
      .catch(() => {});
  }, [id]);

  const isParent = (() => {
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    try { return raw ? JSON.parse(raw).role === "Parent" : false; } catch { return false; }
  })();

  if (loading) return (
    <GuestLayout bgColor="#F4F6FF">
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    </GuestLayout>
  );

  if (error || !school) return (
    <GuestLayout bgColor="#F4F6FF">
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="font-montserrat text-gray-500">{error || "Không tìm thấy trường học."}</p>
        <button onClick={() => navigate("/schools")} className="text-purple-600 hover:underline font-montserrat font-semibold">← Quay lại danh sách</button>
      </div>
    </GuestLayout>
  );

  const contact = parseContactInfo(school.contactInfo);
  const allCampaigns = school.activeCampaigns ?? [];
  const activeCampaigns = allCampaigns.filter(c => c.status === "Active");
  const otherCampaigns = allCampaigns.filter(c => c.status !== "Active");

  return (
    <GuestLayout bgColor="#F4F6FF">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-8 flex-wrap">
          <Link to="/homepage" className="font-montserrat text-black/40 hover:text-black/70">Trang chủ</Link>
          <ChevronRight className="w-4 h-4 text-black/40" />
          <Link to="/schools" className="font-montserrat text-black/40 hover:text-black/70">Danh sách trường</Link>
          <ChevronRight className="w-4 h-4 text-black/40" />
          <span className="font-montserrat font-semibold text-black line-clamp-1">{school.schoolName}</span>
        </div>

        {/* School Header Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-8 mb-8 flex flex-col md:flex-row gap-6 items-start">
          {/* Logo */}
          <div className="w-28 h-28 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0 bg-purple-50 flex items-center justify-center shadow-sm">
            {school.logoURL
              ? <img src={school.logoURL} alt={school.schoolName} className="w-full h-full object-cover" />
              : <GraduationCap className="w-12 h-12 text-purple-300" />}
          </div>

          <div className="flex-1">
            <h1 className="font-montserrat font-extrabold text-2xl lg:text-3xl text-black mb-2">{school.schoolName}</h1>

            {/* Contact Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {contact.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                  <span className="font-montserrat text-sm text-gray-600">{contact.address}</span>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  <span className="font-montserrat text-sm text-gray-600">{contact.phone}</span>
                </div>
              )}
              {contact.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  <span className="font-montserrat text-sm text-gray-600">{contact.email}</span>
                </div>
              )}
              {contact.website && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  <a href={contact.website} target="_blank" rel="noopener noreferrer"
                    className="font-montserrat text-sm text-purple-600 hover:underline">{contact.website}</a>
                </div>
              )}
              {contact.foundedYear && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  <span className="font-montserrat text-sm text-gray-600">Thành lập: {contact.foundedYear}</span>
                </div>
              )}
              {contact.academicYear && (
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  <span className="font-montserrat text-sm text-gray-600">Năm học: {contact.academicYear}</span>
                </div>
              )}
            </div>

            {contact.description && (
              <p className="font-montserrat text-sm text-gray-500 mt-4 leading-relaxed">{contact.description}</p>
            )}
          </div>
        </div>

        {/* Campaigns Section */}
        <h2 className="font-montserrat font-extrabold text-xl text-black mb-5">
          Chương trình đồng phục
          {allCampaigns.length > 0 && (
            <span className="ml-2 text-base font-medium text-gray-400">({allCampaigns.length})</span>
          )}
        </h2>

        {allCampaigns.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-montserrat font-medium text-gray-400">Chưa có chương trình đồng phục nào.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {[...activeCampaigns, ...otherCampaigns].map(c => {
              const s = STATUS_LABEL[c.status] ?? { label: c.status, color: "bg-gray-100 text-gray-600" };
              const canViewDetail = isParent;
              return (
                <div key={c.campaignId}
                  onClick={() => canViewDetail && navigate(`/campaigns/${c.campaignId}`)}
                  className={`bg-white rounded-xl p-6 shadow-sm border border-transparent transition-all flex flex-col sm:flex-row sm:items-center gap-4 ${canViewDetail ? "hover:border-purple-200 hover:shadow-md cursor-pointer" : ""}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-montserrat font-bold text-lg text-black">{c.campaignName}</h3>
                      <span className={`inline-flex text-xs font-montserrat font-semibold px-2.5 py-1 rounded-full ${s.color}`}>{s.label}</span>
                    </div>
                    {c.description && <p className="font-montserrat text-sm text-gray-500 mb-2 line-clamp-2">{c.description}</p>}
                    <div className="flex items-center gap-4 text-sm text-gray-400 font-montserrat flex-wrap">
                      <span>🗓 {new Date(c.startDate).toLocaleDateString("vi-VN")} – {new Date(c.endDate).toLocaleDateString("vi-VN")}</span>
                      <span>👕 {c.outfitCount} mẫu đồng phục</span>
                    </div>
                  </div>
                  {canViewDetail && (
                    <div className="flex-shrink-0">
                      <ArrowRight className="w-6 h-6 text-purple-500" />
                    </div>
                  )}
                  {!canViewDetail && (
                    <div className="flex-shrink-0">
                      <span className="text-xs font-montserrat text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg">Đăng nhập để xem chi tiết</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {/* ───── Uniforms Section ───── */}
        <h2 className="font-montserrat font-extrabold text-xl text-black mb-5 mt-10">
          Đồng phục
          {uniforms.length > 0 && (
            <span className="ml-2 text-base font-medium text-gray-400">({uniforms.length})</span>
          )}
        </h2>

        {uniforms.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <Shirt className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-montserrat font-medium text-gray-400">Ch\u01b0a c\u00f3 \u0111\u1ed3ng ph\u1ee5c n\u00e0o.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {uniforms.map(u => (
              <div
                key={u.outfitId}
                onClick={() => navigate(`/outfits/${u.outfitId}`)}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="w-full aspect-square overflow-hidden bg-purple-50 flex items-center justify-center">
                  {u.mainImageURL
                    ? <img src={u.mainImageURL} alt={u.outfitName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <Shirt className="w-12 h-12 text-purple-200" />}
                </div>
                <div className="p-4">
                  <h3 className="font-montserrat font-bold text-sm text-black line-clamp-2 mb-1">{u.outfitName}</h3>
                  <p className="font-montserrat font-semibold text-sm text-blue-600">{fmt(u.price)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </GuestLayout>
  );
};
