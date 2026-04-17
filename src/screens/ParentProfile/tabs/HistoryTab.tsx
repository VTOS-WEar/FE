import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { History, Camera, X, Download, Share2 } from "lucide-react";
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
        <div className="w-20 h-20 bg-violet-50 rounded-xl flex items-center justify-center border border-gray-200 shadow-soft-md">
          <History className="w-10 h-10 text-gray-900" />
        </div>
        <div className="text-center">
          <p className="font-bold text-gray-900 text-lg mb-1">Chưa có lịch sử thử đồ</p>
          <p className="font-medium text-gray-500 text-sm max-w-xs mx-auto">
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
          <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center border border-gray-200 shadow-sm">
            <Camera className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h2 className="font-extrabold text-gray-900 text-lg">Ảnh thử đồ gần đây</h2>
            <p className="text-xs text-gray-400 font-medium">{total} kết quả</p>
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
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-violet-100 border-t-gray-900 animate-spin" />
          <p className="text-xs font-bold text-gray-500 tracking-wide">Đang tải...</p>
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
                  <h3 className="font-bold text-gray-900 text-sm truncate">{item.outfitName}</h3>
                  <p className="text-[11px] text-gray-400 mt-1 font-medium">
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
              <span className="text-sm font-bold text-gray-500">{page}/{totalPages}</span>
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
      {lightbox && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative bg-[#FFFDF9] rounded-[14px] border border-gray-200 shadow-soft-md w-full max-w-[340px] max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Lightbox header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                <div className="flex-shrink-0 w-8 h-8 rounded-[8px] border border-purple-200 bg-violet-100 shadow-soft-sm flex items-center justify-center">
                  <Camera className="w-3.5 h-3.5 text-[#7C56FF]" />
                </div>
                <h3 className="font-extrabold text-gray-900 text-sm truncate">{lightbox.outfitName}</h3>
              </div>
              <button onClick={() => setLightbox(null)}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-[7px] border border-gray-200 bg-white shadow-soft-sm hover:shadow-none hover:scale-[0.99] transition-all">
                <X className="w-3.5 h-3.5 text-gray-900" />
              </button>
            </div>

            {/* Result image */}
            <div className="p-4">
              <div className="rounded-lg overflow-hidden border border-gray-200 shadow-soft-sm">
                <img
                  src={lightbox.resultPhotoUrl || lightbox.outfitImage || ""}
                  alt="Try-on result"
                  className="w-full aspect-[3/4] object-cover"
                />
              </div>

              {/* Info */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="nb-card-static p-2.5">
                  <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Đồng phục</p>
                  <p className="text-xs font-bold text-gray-900 truncate">{lightbox.outfitName}</p>
                </div>
                <div className="nb-card-static p-2.5">
                  <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Thời gian</p>
                  <p className="text-xs font-bold text-gray-900">{timeAgo(lightbox.tryOnTimestamp)}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-3 bg-stone-100 rounded-b-[11px] -mx-4 -mb-4 px-4 py-3 border-t border-gray-200">
                {lightbox.resultPhotoUrl && (
                  <button
                    onClick={() => handleDownload(lightbox.resultPhotoUrl!, lightbox.outfitName)}
                    className="flex-1 nb-btn nb-btn-purple text-xs py-2 flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Tải ảnh
                  </button>
                )}
                {lightbox.resultPhotoUrl && (
                  <button
                    onClick={async () => {
                      try {
                        if (navigator.share) {
                          await navigator.share({ title: lightbox.outfitName, url: lightbox.resultPhotoUrl! });
                        } else {
                          await navigator.clipboard.writeText(lightbox.resultPhotoUrl!);
                          alert("Đã sao chép link ảnh!");
                        }
                      } catch {
                        // User cancelled or share failed silently
                      }
                    }}
                    className="flex-1 nb-btn nb-btn-outline text-xs py-2 flex items-center justify-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Chia sẻ
                  </button>
                )}
                <button onClick={() => setLightbox(null)} className="flex-1 nb-btn nb-btn-outline text-xs py-2">
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.getElementById("modal-root") as HTMLElement
      )}
    </div>
  );
};
