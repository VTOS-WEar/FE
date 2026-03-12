import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ChevronRight, ArrowLeft, Calendar, Package, ShoppingCart } from "lucide-react";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { getPublicCampaignDetail, type PublicCampaignDetailDto } from "../../lib/api/schools";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  Active:   { label: "Đang diễn ra", color: "bg-green-100 text-green-700" },
  Draft:    { label: "Bản nháp",     color: "bg-gray-100 text-gray-600"   },
  Locked:   { label: "Đã khoá",      color: "bg-red-100 text-red-600"     },
  Ended:    { label: "Đã kết thúc",  color: "bg-amber-100 text-amber-700" },
};

export const CampaignDetail = (): JSX.Element => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<PublicCampaignDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* Auth guard — must be Parent */
  useEffect(() => {
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!raw) { navigate("/signin", { replace: true }); return; }
    try {
      const u = JSON.parse(raw);
      if (u.role !== "Parent") { navigate("/homepage", { replace: true }); return; }
    } catch { navigate("/signin", { replace: true }); }
  }, [navigate]);

  useEffect(() => {
    if (!campaignId) return;
    getPublicCampaignDetail(campaignId)
      .then(setCampaign)
      .catch(() => setError("Không tìm thấy chương trình này."))
      .finally(() => setLoading(false));
  }, [campaignId]);

  if (loading) return (
    <GuestLayout bgColor="#F4F6FF">
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    </GuestLayout>
  );

  if (error || !campaign) return (
    <GuestLayout bgColor="#F4F6FF">
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="font-montserrat text-gray-500">{error || "Không tìm thấy chương trình."}</p>
        <button onClick={() => navigate("/schools")} className="text-purple-600 hover:underline font-montserrat font-semibold">← Quay lại danh sách trường</button>
      </div>
    </GuestLayout>
  );

  const status = STATUS_LABEL[campaign.status] ?? { label: campaign.status, color: "bg-gray-100 text-gray-600" };

  return (
    <GuestLayout bgColor="#F4F6FF">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-8 flex-wrap">
          <Link to="/homepage" className="font-montserrat text-black/40 hover:text-black/70">Trang chủ</Link>
          <ChevronRight className="w-4 h-4 text-black/40" />
          <Link to="/schools" className="font-montserrat text-black/40 hover:text-black/70">Danh sách trường</Link>
          <ChevronRight className="w-4 h-4 text-black/40" />
          <Link to={`/schools/${campaign.school.id}`} className="font-montserrat text-black/40 hover:text-black/70 truncate max-w-[160px]">
            {campaign.school.schoolName}
          </Link>
          <ChevronRight className="w-4 h-4 text-black/40" />
          <span className="font-montserrat font-semibold text-black truncate max-w-[160px]">{campaign.campaignName}</span>
        </div>

        {/* Back button */}
        <button onClick={() => navigate(`/schools/${campaign.school.id}`)}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-800 font-montserrat font-semibold text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Quay lại trường học
        </button>

        {/* Campaign Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
            {/* School logo */}
            {campaign.school.logoURL && (
              <img src={campaign.school.logoURL} alt={campaign.school.schoolName}
                className="w-16 h-16 rounded-xl object-cover border border-gray-100 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className="font-montserrat font-medium text-sm text-gray-400 mb-1">{campaign.school.schoolName}</p>
              <h1 className="font-montserrat font-extrabold text-2xl lg:text-3xl text-black mb-3">{campaign.campaignName}</h1>
              <span className={`inline-flex text-sm font-montserrat font-semibold px-3 py-1 rounded-full ${status.color}`}>{status.label}</span>
            </div>
          </div>

          {/* Date range */}
          <div className="flex items-center gap-3 text-sm text-gray-500 font-montserrat mb-4">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span>
              Từ <strong className="text-black">{new Date(campaign.startDate).toLocaleDateString("vi-VN")}</strong>
              &nbsp;đến <strong className="text-black">{new Date(campaign.endDate).toLocaleDateString("vi-VN")}</strong>
            </span>
          </div>

          {campaign.description && (
            <p className="font-montserrat text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-4">
              {campaign.description}
            </p>
          )}
        </div>

        {/* Outfits */}
        <h2 className="font-montserrat font-extrabold text-xl text-black mb-5 flex items-center gap-2">
          <Package className="w-5 h-5 text-purple-500" />
          Danh sách đồng phục
          <span className="text-base font-medium text-gray-400">({campaign.outfits.length} mẫu)</span>
        </h2>

        {campaign.outfits.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-montserrat font-medium text-gray-400">Chưa có đồng phục trong chương trình này.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaign.outfits.map(outfit => (
              <div key={outfit.campaignOutfitId}
                onClick={() => navigate(`/outfits/${outfit.outfitId}`)}
                className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
                {/* Image */}
                <div className="relative aspect-square bg-gray-50 overflow-hidden">
                  {outfit.mainImageUrl
                    ? <img src={outfit.mainImageUrl} alt={outfit.outfitName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-gray-200" />
                      </div>
                    )}
                </div>

                {/* Info */}
                <div className="p-5">
                  <h3 className="font-montserrat font-bold text-lg text-black mb-1 line-clamp-2">{outfit.outfitName}</h3>

                  <div className="flex items-center justify-between mt-4">
                    <span className="font-montserrat font-extrabold text-xl text-purple-600">
                      {outfit.campaignPrice.toLocaleString("vi-VN")}₫
                    </span>
                    {outfit.maxQuantity !== null && (
                      <span className="text-xs font-montserrat text-gray-400">SL: {outfit.maxQuantity}</span>
                    )}
                  </div>

                  <p className="mt-3 text-center font-montserrat font-semibold text-sm text-purple-600 group-hover:text-purple-800 transition-colors">
                    Xem chi tiết →
                  </p>
                  {campaign.status === "Active" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); }}
                      className="mt-2 w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-3 font-montserrat font-semibold text-sm transition-colors"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Đặt hàng
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </GuestLayout>
  );
};
