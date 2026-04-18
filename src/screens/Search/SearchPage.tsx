import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { GraduationCap, Package, Search as SearchIcon } from "lucide-react";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { searchPublic, type PublicSearchResponse } from "../../lib/api/public";

/* ─── School Card ─── */
function SchoolCard({ school, onClick }: { school: PublicSearchResponse["schools"][0]; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="nb-card p-0 overflow-hidden cursor-pointer text-left w-full hover:-translate-y-1 hover:shadow-soft-md transition-all duration-200"
    >
      <div className="flex items-center gap-4 p-4">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-emerald-400 shadow-soft-sm">
          {school.logoUrl ? (
            <img src={school.logoUrl} alt={school.schoolName} className="h-full w-full rounded-lg object-cover" />
          ) : (
            <GraduationCap size={20} className="text-gray-900" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-gray-900 text-base leading-tight truncate">{school.schoolName}</h3>
          <p className="text-sm text-gray-500 mt-0.5 truncate">{school.address || "—"}</p>
          <p className="text-xs text-gray-400 font-medium mt-1">{school.uniformCount} đồng phục</p>
        </div>
      </div>
    </button>
  );
}

/* ─── Uniform Card ─── */
function UniformCard({ item, onClick }: { item: PublicSearchResponse["uniforms"][0]; onClick: () => void }) {
  const formattedPrice = new Intl.NumberFormat("vi-VN").format(item.price) + "đ";
  return (
    <button
      onClick={onClick}
      className="nb-card p-0 overflow-hidden cursor-pointer text-left w-full hover:-translate-y-1 hover:shadow-soft-md transition-all duration-200"
    >
      <div className="aspect-[4/3] bg-gray-100 border-b border-gray-200">
        {item.mainImageUrl ? (
          <img src={item.mainImageUrl} alt={item.outfitName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={32} className="text-gray-400" />
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-bold text-gray-900 text-sm truncate">{item.outfitName}</h3>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{item.schoolName}</p>
        <p className="font-extrabold text-violet-600 text-sm mt-1">{formattedPrice}</p>
      </div>
    </button>
  );
}

/* ─── Search Page ─── */
export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";

  const [data, setData] = useState<PublicSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [localQuery, setLocalQuery] = useState(q);

  const fetch = useCallback(async (query: string) => {
    if (!query.trim()) { setData(null); return; }
    setLoading(true);
    try {
      const res = await searchPublic(query.trim());
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(q); }, [q, fetch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) setSearchParams({ q: localQuery.trim() });
  };

  const total = data ? data.totalSchools + data.totalUniforms : 0;

  return (
    <GuestLayout bgColor="#f9fafb" mainClassName="flex-1">
      <div className="relative z-10 max-w-[1200px] mx-auto px-4 lg:px-8 py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm font-bold">
          <a href="/" className="text-gray-500 hover:text-gray-800 transition-colors">Trang chủ</a>
          <span className="text-gray-500">/</span>
          <span className="text-gray-900">Tìm kiếm{q ? `: ${q}` : ""}</span>
        </nav>

        {/* Header + Search */}
        <div className="mb-8">
          <h1 className="font-extrabold text-gray-900 text-3xl mb-4">Tìm kiếm</h1>
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={localQuery}
                onChange={e => setLocalQuery(e.target.value)}
                placeholder="Tìm kiếm trường học hoặc đồng phục..."
                className="w-full h-12 pl-11 pr-4 rounded-xl border border-gray-200 bg-white text-[15px] font-medium shadow-soft-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50 focus:outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              className="h-12 px-6 rounded-xl border border-gray-200 bg-[#6938EF] text-white font-bold shadow-soft-sm hover:shadow-soft-md hover:-translate-y-[1px] active:shadow-none active:translate-y-0 transition-all"
            >
              Tìm kiếm
            </button>
          </form>
        </div>

        {/* Results */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-violet-100 border-t-gray-900 animate-spin" />
            <p className="text-xs font-bold text-gray-500 tracking-wide">Đang tải...</p>
          </div>
        )}

        {!loading && !q && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-20 h-20 bg-violet-50 rounded-xl flex items-center justify-center border border-gray-200 shadow-soft-md">
              <SearchIcon size={32} className="text-violet-600" />
            </div>
            <p className="font-bold text-gray-900 text-lg">Nhập từ khóa để tìm kiếm</p>
            <p className="text-sm text-gray-500 text-center max-w-sm">Tìm kiếm trường học hoặc đồng phục theo tên.</p>
          </div>
        )}

        {!loading && q && data && total === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-20 h-20 bg-[#FEE2E2] rounded-xl flex items-center justify-center border border-gray-200 shadow-soft-md">
              <SearchIcon size={32} className="text-red-500" />
            </div>
            <p className="font-bold text-gray-900 text-lg">Không tìm thấy kết quả</p>
            <p className="text-sm text-gray-500 text-center max-w-sm">
              Không có trường học hoặc đồng phục nào phù hợp với "{q}".
            </p>
          </div>
        )}

        {!loading && data && total > 0 && (
          <div className="space-y-10">
            {/* Schools */}
            {data.schools.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-400 rounded-lg flex items-center justify-center border border-gray-200 shadow-sm">
                    <GraduationCap size={18} className="text-gray-900" />
                  </div>
                  <h2 className="font-extrabold text-gray-900 text-xl">Trường học</h2>
                  <span className="nb-badge text-gray-600 bg-gray-100">{data.totalSchools} kết quả</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.schools.map(school => (
                    <SchoolCard
                      key={school.id}
                      school={school}
                      onClick={() => window.location.href = `/schools/${school.id}`}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Uniforms */}
            {data.uniforms.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center border border-gray-200 shadow-sm">
                    <Package size={18} className="text-violet-600" />
                  </div>
                  <h2 className="font-extrabold text-gray-900 text-xl">Đồng phục</h2>
                  <span className="nb-badge text-gray-600 bg-gray-100">{data.totalUniforms} kết quả</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {data.uniforms.map(item => (
                    <UniformCard
                      key={item.id}
                      item={item}
                      onClick={() => window.location.href = `/outfits/${item.id}`}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </GuestLayout>
  );
}
