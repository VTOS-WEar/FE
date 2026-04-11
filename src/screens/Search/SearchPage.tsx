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
      className="nb-card p-0 overflow-hidden cursor-pointer text-left w-full hover:-translate-y-1 hover:shadow-[6px_6px_0_#1A1A2E] transition-all duration-200"
    >
      <div className="flex items-center gap-4 p-4">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border-2 border-[#1A1A2E] bg-[#C8E44D] shadow-[3px_3px_0_#1A1A2E]">
          {school.logoUrl ? (
            <img src={school.logoUrl} alt={school.schoolName} className="h-full w-full rounded-lg object-cover" />
          ) : (
            <GraduationCap size={20} className="text-[#1A1A2E]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-[#1A1A2E] text-base leading-tight truncate">{school.schoolName}</h3>
          <p className="text-sm text-[#6B7280] mt-0.5 truncate">{school.address || "—"}</p>
          <p className="text-xs text-[#9CA3AF] font-medium mt-1">{school.uniformCount} đồng phục</p>
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
      className="nb-card p-0 overflow-hidden cursor-pointer text-left w-full hover:-translate-y-1 hover:shadow-[6px_6px_0_#1A1A2E] transition-all duration-200"
    >
      <div className="aspect-[4/3] bg-[#F3F4F6] border-b-2 border-[#1A1A2E]">
        {item.mainImageUrl ? (
          <img src={item.mainImageUrl} alt={item.outfitName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={32} className="text-[#9CA3AF]" />
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-bold text-[#1A1A2E] text-sm truncate">{item.outfitName}</h3>
        <p className="text-xs text-[#6B7280] mt-0.5 truncate">{item.schoolName}</p>
        <p className="font-extrabold text-[#6938EF] text-sm mt-1">{formattedPrice}</p>
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
    <GuestLayout bgColor="#FFF8F0" mainClassName="flex-1">
      <div className="relative z-10 max-w-[1200px] mx-auto px-4 lg:px-8 py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm font-bold">
          <a href="/" className="text-[#6B7280] hover:text-[#1A1A2E] transition-colors">Trang chủ</a>
          <span className="text-[#6B7280]">/</span>
          <span className="text-[#1A1A2E]">Tìm kiếm{q ? `: ${q}` : ""}</span>
        </nav>

        {/* Header + Search */}
        <div className="mb-8">
          <h1 className="font-extrabold text-[#1A1A2E] text-3xl mb-4">Tìm kiếm</h1>
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="text"
                value={localQuery}
                onChange={e => setLocalQuery(e.target.value)}
                placeholder="Tìm kiếm trường học hoặc đồng phục..."
                className="w-full h-12 pl-11 pr-4 rounded-xl border-2 border-[#1A1A2E] bg-white text-[15px] font-medium shadow-[3px_3px_0_#1A1A2E] outline-none focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0_#1A1A2E] transition-all"
              />
            </div>
            <button
              type="submit"
              className="h-12 px-6 rounded-xl border-2 border-[#1A1A2E] bg-[#6938EF] text-white font-bold shadow-[3px_3px_0_#1A1A2E] hover:shadow-[4px_4px_0_#1A1A2E] hover:-translate-y-[1px] active:shadow-none active:translate-y-0 transition-all"
            >
              Tìm kiếm
            </button>
          </form>
        </div>

        {/* Results */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 rounded-full border-[3px] border-[#EDE9FE] border-t-[#1A1A2E] animate-spin" />
            <p className="text-xs font-bold text-[#6B7280] tracking-wide">Đang tải...</p>
          </div>
        )}

        {!loading && !q && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-20 h-20 bg-[#EDE9FE] rounded-xl flex items-center justify-center border-2 border-[#1A1A2E] shadow-[4px_4px_0_#1A1A2E]">
              <SearchIcon size={32} className="text-[#6938EF]" />
            </div>
            <p className="font-bold text-[#1A1A2E] text-lg">Nhập từ khóa để tìm kiếm</p>
            <p className="text-sm text-[#6B7280] text-center max-w-sm">Tìm kiếm trường học hoặc đồng phục theo tên.</p>
          </div>
        )}

        {!loading && q && data && total === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-20 h-20 bg-[#FEE2E2] rounded-xl flex items-center justify-center border-2 border-[#1A1A2E] shadow-[4px_4px_0_#1A1A2E]">
              <SearchIcon size={32} className="text-[#EF4444]" />
            </div>
            <p className="font-bold text-[#1A1A2E] text-lg">Không tìm thấy kết quả</p>
            <p className="text-sm text-[#6B7280] text-center max-w-sm">
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
                  <div className="w-10 h-10 bg-[#C8E44D] rounded-lg flex items-center justify-center border-2 border-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E]">
                    <GraduationCap size={18} className="text-[#1A1A2E]" />
                  </div>
                  <h2 className="font-extrabold text-[#1A1A2E] text-xl">Trường học</h2>
                  <span className="nb-badge text-[#4C5769] bg-[#F3F4F6]">{data.totalSchools} kết quả</span>
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
                  <div className="w-10 h-10 bg-[#EDE9FE] rounded-lg flex items-center justify-center border-2 border-[#1A1A2E] shadow-[2px_2px_0_#1A1A2E]">
                    <Package size={18} className="text-[#6938EF]" />
                  </div>
                  <h2 className="font-extrabold text-[#1A1A2E] text-xl">Đồng phục</h2>
                  <span className="nb-badge text-[#4C5769] bg-[#F3F4F6]">{data.totalUniforms} kết quả</span>
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
