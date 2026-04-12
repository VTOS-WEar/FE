import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, ChevronRight, Package, ShoppingCart } from "lucide-react";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { getPublicCampaignDetail, type PublicCampaignDetailDto } from "../../lib/api/schools";
import { OutfitOrderModal } from "../../components/outfits/OutfitOrderModal";

const STATUS_LABEL: Record<string, { label: string; badge: string }> = {
  Active: { label: "Đang diễn ra", badge: "nb-badge nb-badge-green" },
  Draft: { label: "Bản nháp", badge: "nb-badge text-[#6B7280] bg-[#F3F4F6]" },
  Locked: { label: "Đã khoá", badge: "nb-badge nb-badge-red" },
  Ended: { label: "Đã kết thúc", badge: "nb-badge nb-badge-yellow" },
};

export const CampaignDetail = (): JSX.Element => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<PublicCampaignDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOutfitId, setSelectedOutfitId] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId) return;
    getPublicCampaignDetail(campaignId)
      .then(setCampaign)
      .catch(() => setError("Không tìm thấy chương trình này."))
      .finally(() => setLoading(false));
  }, [campaignId]);

  if (loading) {
    return (
      <GuestLayout bgColor="#FFF8F0">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="inline-block w-10 h-10 border-4 border-[#B8A9E8] border-t-transparent rounded-full animate-spin" />
        </div>
      </GuestLayout>
    );
  }

  if (error || !campaign) {
    return (
      <GuestLayout bgColor="#FFF8F0">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="nb-card-static p-10 text-center max-w-md mx-4">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-bold text-[#1A1A2E]">{error || "Không tìm thấy chương trình."}</p>
            <button onClick={() => navigate("/schools")} className="nb-btn nb-btn-purple text-sm mt-4">
              ← Quay lại danh sách trường
            </button>
          </div>
        </div>
      </GuestLayout>
    );
  }

  const statusCfg = STATUS_LABEL[campaign.status] ?? {
    label: campaign.status,
    badge: "nb-badge text-[#6B7280] bg-[#F3F4F6]",
  };

  const now = new Date();
  const end = new Date(campaign.endDate);
  const start = new Date(campaign.startDate);
  const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const isActive = campaign.status === "Active";
  const totalProducts = campaign.outfits.length;
  const prices = campaign.outfits.map((outfit) => outfit.campaignPrice).filter((price) => price > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const elapsedDays = Math.max(0, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const progressPct = Math.min(100, Math.round((elapsedDays / totalDays) * 100));

  return (
    <GuestLayout bgColor="#FFF8F0">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-6 nb-page">
        <div className="flex items-center gap-2 text-sm mb-6 flex-wrap font-semibold">
          <Link to="/homepage" className="text-[#97A3B6] hover:text-[#1A1A2E] transition-colors">Trang chủ</Link>
          <ChevronRight className="w-4 h-4 text-[#CBCAD7]" />
          <Link to="/schools" className="text-[#97A3B6] hover:text-[#1A1A2E] transition-colors">Danh sách trường</Link>
          <ChevronRight className="w-4 h-4 text-[#CBCAD7]" />
          <Link to={`/schools/${campaign.school.id}`} className="text-[#97A3B6] hover:text-[#1A1A2E] transition-colors truncate max-w-[160px]">
            {campaign.school.schoolName}
          </Link>
          <ChevronRight className="w-4 h-4 text-[#CBCAD7]" />
          <span className="font-bold text-[#1A1A2E] truncate max-w-[160px]">{campaign.campaignName}</span>
        </div>

        <button onClick={() => navigate(`/schools/${campaign.school.id}`)} className="nb-btn nb-btn-outline nb-btn-sm text-sm mb-4">
          <ArrowLeft className="w-4 h-4" />
          Quay lại trường học
        </button>

        <div className="nb-card-static p-4 lg:p-6 mb-6 hover:shadow-[3px_3px_0_#1A1A2E]">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-4">
            {campaign.school.logoURL && (
              <div className="w-14 h-14 rounded-[8px] overflow-hidden border-[2px] border-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E] flex-shrink-0">
                <img src={campaign.school.logoURL} alt={campaign.school.schoolName} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1">
              <p className="font-semibold text-sm text-[#97A3B6] mb-1">{campaign.school.schoolName}</p>
              <h1 className="font-black text-[#1A1A2E] text-2xl lg:text-3xl mb-3">{campaign.campaignName}</h1>
              <span className={statusCfg.badge}>{statusCfg.label}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-[#4C5769] font-semibold mb-3">
            <Calendar className="w-4 h-4 text-[#B8A9E8]" />
            <span>
              Từ <strong className="text-[#1A1A2E]">{new Date(campaign.startDate).toLocaleDateString("vi-VN")}</strong>
              {" "}đến <strong className="text-[#1A1A2E]">{new Date(campaign.endDate).toLocaleDateString("vi-VN")}</strong>
            </span>
          </div>

          {campaign.description && (
            <div className="p-3 rounded-[8px] border-[2px] border-[#E5E7EB] bg-[#F6F1E8]">
              <p className="font-medium text-sm text-[#4C5769] leading-relaxed">{campaign.description}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6 nb-stagger">
          <div className="nb-card-static p-3 text-center transition-all duration-300 ease-out hover:scale-105 hover:shadow-[3px_3px_0_#1A1A2E] cursor-default">
            <p className="font-extrabold text-xs uppercase tracking-wider text-[#6B7280] mb-1.5">⏳ Còn lại</p>
            {isActive && daysLeft > 0 ? (
              <>
                <p className="font-black text-3xl text-[#1A1A2E]">{daysLeft}</p>
                <p className="font-semibold text-sm text-[#97A3B6]">ngày</p>
                <div className="nb-progress mt-2">
                  <div
                    className="nb-progress-bar"
                    style={{
                      width: `${progressPct}%`,
                      background: progressPct >= 80 ? "#E8A0A0" : progressPct >= 50 ? "#F5E642" : "#C8E44D",
                    }}
                  />
                </div>
              </>
            ) : (
              <p className="font-black text-lg text-[#DC2626]">{campaign.status === "Active" ? "Hôm nay là ngày cuối!" : "Đã kết thúc"}</p>
            )}
          </div>

          <div className="nb-card-static p-3 text-center transition-all duration-300 ease-out hover:scale-105 hover:shadow-[3px_3px_0_#1A1A2E] cursor-default">
            <p className="font-extrabold text-xs uppercase tracking-wider text-[#6B7280] mb-1.5">👕 Sản phẩm</p>
            <p className="font-black text-3xl text-[#1A1A2E]">{totalProducts}</p>
            <p className="font-semibold text-sm text-[#97A3B6]">mẫu đồng phục</p>
          </div>

          <div className="nb-card-static p-3 text-center transition-all duration-300 ease-out hover:scale-105 hover:shadow-[3px_3px_0_#1A1A2E] cursor-default">
            <p className="font-extrabold text-xs uppercase tracking-wider text-[#6B7280] mb-1.5">💰 Giá</p>
            {minPrice === maxPrice ? (
              <p className="font-black text-xl text-[#8B6BFF]">{minPrice.toLocaleString("vi-VN")}₫</p>
            ) : (
              <>
                <p className="font-black text-lg text-[#8B6BFF]">{minPrice.toLocaleString("vi-VN")}₫</p>
                <p className="font-semibold text-xs text-[#97A3B6]">đến {maxPrice.toLocaleString("vi-VN")}₫</p>
              </>
            )}
          </div>

          <div className="nb-card-static p-3 text-center transition-all duration-300 ease-out hover:scale-105 hover:shadow-[3px_3px_0_#1A1A2E] cursor-default">
            <p className="font-extrabold text-xs uppercase tracking-wider text-[#6B7280] mb-1.5">📋 Trạng thái</p>
            <span className={statusCfg.badge + " text-sm"}>{statusCfg.label}</span>
            <p className="font-semibold text-xs text-[#97A3B6] mt-1.5">
              {new Date(campaign.startDate).toLocaleDateString("vi-VN")} — {new Date(campaign.endDate).toLocaleDateString("vi-VN")}
            </p>
          </div>
        </div>

        <h2 className="font-black text-xl text-[#1A1A2E] mb-4 flex items-center gap-2">
          <div className="w-9 h-9 rounded-[8px] border-[2px] border-[#1A1A2E] bg-[#EDE9FE] shadow-[2px_2px_0_#1A1A2E] flex items-center justify-center">
            <Package className="w-4.5 h-4.5 text-[#7C3AED]" />
          </div>
          Danh sách đồng phục
          <span className="text-base font-semibold text-[#97A3B6]">({campaign.outfits.length} mẫu)</span>
        </h2>

        {campaign.outfits.length === 0 ? (
          <div className="nb-card-static p-8 text-center border-dashed transition-all duration-300 ease-out hover:scale-105 hover:shadow-[3px_3px_0_#1A1A2E]">
            <Package className="w-10 h-10 text-[#CBCAD7] mx-auto mb-3" />
            <p className="font-bold text-[#97A3B6]">Chưa có đồng phục trong chương trình này.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 nb-stagger">
            {campaign.outfits.map((outfit, idx) => (
              <div
                key={outfit.campaignOutfitId}
                className="nb-card overflow-hidden flex flex-col group transition-all duration-300 ease-out hover:scale-105 hover:shadow-[4px_4px_0_#1A1A2E] hover:-translate-y-1"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="relative aspect-[4/3] bg-[#F6F1E8] overflow-hidden cursor-pointer" onClick={() => navigate(`/outfits/${outfit.outfitId}`)}>
                  {outfit.mainImageUrl ? (
                    <img src={outfit.mainImageUrl} alt={outfit.outfitName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-12 h-12 text-[#CBCAD7]" />
                    </div>
                  )}
                </div>

                <div className="p-2 flex flex-col flex-1">
                  <h3 className="font-bold text-[#1A1A2E] text-base mb-1 line-clamp-2 min-h-[2.4rem] transition-colors duration-200 group-hover/card:text-[#8B6BFF]">
                    {outfit.outfitName}
                  </h3>

                  <div className="flex items-center justify-between mt-auto pt-1 border-t-2 border-[#E5E7EB]">
                    <span className="font-black text-lg text-[#8B6BFF]">{outfit.campaignPrice.toLocaleString("vi-VN")}₫</span>
                    {outfit.maxQuantity !== null && <span className="text-xs font-semibold text-[#97A3B6]">SL: {outfit.maxQuantity}</span>}
                  </div>

                  <button
                    onClick={() => navigate(`/outfits/${outfit.outfitId}`)}
                    className="mt-1 text-center font-bold text-sm text-[#8B6BFF] hover:text-[#6938EF] hover:underline hover:underline-offset-2 transition-all duration-200"
                  >
                    Xem chi tiết →
                  </button>

                  {campaign.status === "Active" && (
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedOutfitId(outfit.outfitId);
                      }}
                      className="mt-1 w-full nb-btn nb-btn-purple text-sm py-1.5 transition-all duration-200 hover:scale-105 hover:shadow-[3px_3px_0_#1A1A2E]"
                    >
                      <ShoppingCart className="w-3 h-3" />
                      Đặt hàng
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <OutfitOrderModal
        open={selectedOutfitId !== null}
        onClose={() => setSelectedOutfitId(null)}
        outfitId={selectedOutfitId}
        initialCampaignId={campaign.campaignId}
      />
    </GuestLayout>
  );
};
