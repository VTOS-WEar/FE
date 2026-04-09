import { useState, useEffect, useCallback } from "react";
import { History, Camera, X, Download } from "lucide-react";
import { getTryOnHistory, type TryOnHistoryDto } from "../../../lib/api/tryOn";

export const HistoryTab = (): JSX.Element => {
  const [items, setItems] = useState<TryOnHistoryDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 12;

  // Lightbox
  const [lightbox, setLightbox] = useState<TryOnHistoryDto | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTryOnHistory(page, pageSize);
      setItems(res.items);
      setTotal(res.total);
    } catch (e: any) {
      setError(e.message || "Không thể tải lịch sử thử đồ.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const totalPages = Math.ceil(total / pageSize);

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Vừa xong";
    if (mins < 60) return `${mins} phút trước`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} giờ trước`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days} ngày trước`;
    return new Date(iso).toLocaleDateString("vi");
  };

  const handleDownload = async (url: string, name: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `tryon-${name.slice(0, 20)}.png`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  // ── Empty state ──
  if (!loading && items.length === 0 && !error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-5 nb-fade-in">
        <div className="w-20 h-20 bg-[#EDE9FE] rounded-xl flex items-center justify-center border-2 border-[#1A1A2E] shadow-[4px_4px_0_#1A1A2E]">
          <History className="w-10 h-10 text-[#1A1A2E]" />
        </div>
        <div className="text-center">
          <p className="font-bold text-[#1A1A2E] text-lg mb-1">Chưa có lịch sử thử đồ</p>
          <p className="font-medium text-[#6B7280] text-sm max-w-xs mx-auto">
            Hãy thử chức năng thử đồ ảo AI khi xem chi tiết đồng phục để lịch sử hiển thị ở đây.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="nb-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#EDE9FE] rounded-lg flex items-center justify-center border-2 border-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E]">
            <Camera className="w-5 h-5 text-[#6938EF]" />
          </div>
          <div>
            <h2 className="font-extrabold text-[#1A1A2E] text-lg">Ảnh thử đồ gần đây</h2>
            <p className="text-xs text-[#9CA3AF] font-medium">{total} kết quả</p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="nb-alert nb-alert-error mb-4 text-sm">
          <span>⚠️</span><span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="nb-card-static p-0 overflow-hidden">
              <div className="aspect-[3/4] bg-gray-100 animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => setLightbox(item)}
                className="nb-card p-0 overflow-hidden cursor-pointer group"
              >
                <div className="relative aspect-[3/4] bg-[#F6F1E8]">
                  <img
                    src={item.resultPhotoUrl || item.outfitImage || "https://placehold.co/300x400?text=No+Image"}
                    alt={item.outfitName}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 rounded-md text-[10px] font-bold text-white">
                    {timeAgo(item.tryOnTimestamp)}
                  </span>
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-[#1A1A2E] text-sm truncate">{item.outfitName}</h3>
                  <p className="text-[11px] text-[#9CA3AF] mt-1 font-medium">
                    {new Date(item.tryOnTimestamp).toLocaleDateString("vi", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    {" · "}
                    {new Date(item.tryOnTimestamp).toLocaleTimeString("vi", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="nb-btn nb-btn-outline nb-btn-sm text-sm disabled:opacity-40"
              >
                ← Trước
              </button>
              <span className="text-sm font-bold text-[#6B7280]">{page}/{totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="nb-btn nb-btn-outline nb-btn-sm text-sm disabled:opacity-40"
              >
                Sau →
              </button>
            </div>
          )}
        </>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setLightbox(null)}>
          <div
            className="bg-white rounded-xl border-2 border-[#1A1A2E] shadow-[6px_6px_0_#1A1A2E] max-w-md w-full max-h-[90vh] overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Lightbox header */}
            <div className="flex items-center justify-between px-5 py-4 border-b-2 border-[#1A1A2E]">
              <h3 className="font-extrabold text-[#1A1A2E] text-base truncate flex-1 mr-3">{lightbox.outfitName}</h3>
              <button onClick={() => setLightbox(null)}
                className="w-8 h-8 rounded-lg border-2 border-[#1A1A2E] bg-white flex items-center justify-center shadow-[2px_2px_0_#1A1A2E] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Result image */}
            <div className="p-5">
              <div className="rounded-xl overflow-hidden border-2 border-[#1A1A2E] shadow-[3px_3px_0_#1A1A2E]">
                <img
                  src={lightbox.resultPhotoUrl || lightbox.outfitImage || ""}
                  alt="Try-on result"
                  className="w-full aspect-[3/4] object-cover"
                />
              </div>

              {/* Info */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="nb-card-static p-3">
                  <p className="text-[10px] text-[#9CA3AF] font-bold uppercase mb-1">Đồng phục</p>
                  <p className="text-sm font-bold text-[#1A1A2E] truncate">{lightbox.outfitName}</p>
                </div>
                <div className="nb-card-static p-3">
                  <p className="text-[10px] text-[#9CA3AF] font-bold uppercase mb-1">Thời gian</p>
                  <p className="text-sm font-bold text-[#1A1A2E]">{timeAgo(lightbox.tryOnTimestamp)}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-4">
                {lightbox.resultPhotoUrl && (
                  <button
                    onClick={() => handleDownload(lightbox.resultPhotoUrl!, lightbox.outfitName)}
                    className="flex-1 nb-btn nb-btn-purple text-sm flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Tải ảnh
                  </button>
                )}
                <button onClick={() => setLightbox(null)} className="flex-1 nb-btn nb-btn-outline text-sm">
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
