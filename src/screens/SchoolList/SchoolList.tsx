import { useState, useEffect } from "react";
import { Search, ChevronDown, SlidersHorizontal, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { getPublicSchools, parseContactInfo, type PublicSchoolDto } from "../../lib/api/schools";

// Backend returns paginated wrapper
type SchoolListResponse = {
  items: PublicSchoolDto[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export const SchoolList = (): JSX.Element => {
  const navigate = useNavigate();
  const [schools, setSchools] = useState<PublicSchoolDto[]>([]);
  const [filtered, setFiltered] = useState<PublicSchoolDto[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicSchools()
      .then((data: unknown) => {
        // Backend returns paginated { items: [], totalCount, ... }
        const res = data as SchoolListResponse;
        const list = Array.isArray(res) ? res : (res.items ?? []);
        setSchools(list);
        setFiltered(list);
      })
      .catch(() => { setSchools([]); setFiltered([]); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(!q ? schools : schools.filter(s => s.schoolName.toLowerCase().includes(q)));
  }, [search, schools]);

  return (
    <GuestLayout bgColor="#F4F6FF">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2.5 text-base mb-8">
          <a href="/homepage" className="font-montserrat text-black/40 hover:text-black/70 transition-colors">Trang chủ</a>
          <ChevronRight className="w-4 h-4 text-black/40" />
          <span className="font-montserrat font-semibold text-black">Danh sách trường</span>
        </div>

        {/* Hero */}
        <div className="mb-6">
          <h1 className="font-montserrat font-extrabold text-3xl lg:text-4xl text-black mb-2">
            Tìm đồng phục trường của bạn
          </h1>
          <p className="font-montserrat font-medium text-lg lg:text-xl text-gray-500">
            Chọn địa điểm hoặc tìm kiếm để xem danh sách trường học phù hợp
          </p>
        </div>

        {/* Search/Filter Box */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 lg:p-8 shadow-sm mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr,1fr,auto] gap-5 items-end">
            <div className="flex flex-col gap-3">
              <label className="font-montserrat font-bold text-base text-black">Tìm kiếm trường học</label>
              <div className="flex items-center gap-2.5 bg-blue-50 rounded-lg border border-gray-200 px-5 h-[56px]">
                <Search className="w-6 h-6 text-gray-400 flex-shrink-0" />
                <input type="text" placeholder="Nhập tên trường học..." value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 font-montserrat font-medium text-base text-gray-600 placeholder:text-gray-400 bg-transparent outline-none" />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <label className="font-montserrat font-bold text-base text-black">Quận/Huyện</label>
              <div className="flex items-center justify-between gap-2.5 bg-blue-50 rounded-lg border border-gray-200 px-5 h-[56px] cursor-pointer">
                <span className="font-montserrat font-medium text-base text-gray-400">Chọn Quận/Huyện</span>
                <ChevronDown className="w-6 h-6 text-gray-400" />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <label className="font-montserrat font-bold text-base text-black">Tỉnh/Thành phố</label>
              <div className="flex items-center justify-between gap-2.5 bg-blue-50 rounded-lg border border-gray-200 px-5 h-[56px] cursor-pointer">
                <span className="font-montserrat font-medium text-base text-gray-400">Chọn Tỉnh/Thành phố</span>
                <ChevronDown className="w-6 h-6 text-gray-400" />
              </div>
            </div>
            <button className="bg-purple-600 hover:bg-purple-700 transition-colors rounded-lg px-5 h-[56px] flex items-center justify-center gap-2.5 shadow-md text-white">
              <span className="font-montserrat font-bold text-base whitespace-nowrap">Lọc</span>
              <SlidersHorizontal className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <p className="font-montserrat text-base">
            <span className="font-semibold text-gray-500">Hiển thị </span>
            <span className="font-extrabold text-black">{filtered.length}</span>
            <span className="font-semibold text-gray-500"> trường học</span>
          </p>
          <div className="flex items-center gap-3">
            <span className="font-montserrat font-semibold text-base text-gray-500">Sắp xếp:</span>
            <div className="flex items-center gap-2 cursor-pointer">
              <span className="font-montserrat font-bold text-base text-black">Phổ biến nhất</span>
              <ChevronDown className="w-5 h-5 text-black stroke-[2.5]" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400 font-montserrat">Không tìm thấy trường học nào.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filtered.map(school => {
              return (
                <div key={school.schoolId}
                  onClick={() => navigate(`/schools/${school.schoolId}`)}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all group flex flex-col cursor-pointer">
                  <div className="relative w-full aspect-square overflow-hidden flex-shrink-0 bg-purple-50 flex items-center justify-center">
                    {school.logoURL
                      ? <img src={school.logoURL} alt={school.schoolName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <span className="font-montserrat font-extrabold text-4xl text-purple-300">
                          {school.schoolName.split(" ").slice(-2).map(w => w[0]).join("").toUpperCase()}
                        </span>}
                  </div>
                  <div className="p-4 lg:p-5 flex flex-col flex-1">
                    <h3 className="font-montserrat font-extrabold text-xl text-black mb-2 line-clamp-2">{school.schoolName}</h3>
                    {(() => {
                      const c = parseContactInfo(school.contactInfo);
                      return c.address ? (
                        <p className="font-montserrat font-medium text-sm text-gray-500 line-clamp-2 mb-4">{c.address}</p>
                      ) : null;
                    })()}
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                      {school.level && (
                        <span className="inline-flex items-center bg-green-50 text-green-700 font-montserrat font-semibold text-xs px-2.5 py-1 rounded-lg">
                          {school.level}
                        </span>
                      )}
                      <ChevronRight className="w-6 h-6 text-purple-600 ml-auto group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </GuestLayout>
  );
};

export default SchoolList;
