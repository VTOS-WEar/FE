import { Search, ChevronDown, SlidersHorizontal, ChevronRight } from "lucide-react";

// Mock Product Card Component - you can create a separate ProductCard component later
interface ProductCardProps {
  name: string;
  price: string;
  imageUrl: string;
  school: string;
}

const ProductCard = ({ name, price, imageUrl, school }: ProductCardProps) => {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow group">
      {/* Image */}
      <div className="relative h-[200px] overflow-hidden">
        <img 
          src={imageUrl} 
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Content */}
      <div className="p-4 lg:p-5">
        {/* School Name */}
        <p className="font-montserrat font-medium text-sm text-vtos-gray-text mb-2">
          {school}
        </p>
        
        {/* Product Name */}
        <h3 className="font-montserrat font-extrabold text-xl text-black mb-3 line-clamp-2">
          {name}
        </h3>

        {/* Price */}
        <div className="flex items-center justify-between">
          <p className="font-montserrat font-bold text-lg text-vtos-blue">
            {price}
          </p>
          <button className="px-4 py-2 bg-vtos-blue hover:bg-vtos-blue/90 text-white rounded-lg font-montserrat font-semibold text-sm transition-colors">
            Xem chi tiết
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ProductList() {
  // Mock data for products - in a real app this would come from an API
  const products = Array(12).fill({
    name: "Áo sơ mi đồng phục học sinh",
    price: "250.000đ",
    imageUrl: "https://api.builder.io/api/v1/image/assets/TEMP/ca53d5716185773c3e8e3503a9b32095d88cfa1f?width=596",
    school: "THCS FPT"
  });

  return (
    <div className="bg-[#FFF8F0]">
      {/* Breadcrumb */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 pt-8 pb-6">
        <div className="flex items-center gap-2.5 text-base">
          <span className="font-montserrat text-black/40">Trang chủ</span>
          <ChevronRight className="w-4 h-4 text-black/40" />
          <span className="font-montserrat font-semibold text-black">Sản phẩm</span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 mb-8">
        <div className="mb-6">
          <h1 className="font-montserrat font-extrabold text-3xl lg:text-4xl text-black mb-2">
            Danh sách sản phẩm
          </h1>
          <p className="font-montserrat font-medium text-lg lg:text-xl text-vtos-gray-text">
            Khám phá bộ sưu tập đồng phục đa dạng cho mọi cấp học
          </p>
        </div>

        {/* Search/Filter Box */}
        <div className="bg-white rounded-xl border border-vtos-gray-border p-6 lg:p-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr,1fr,auto] gap-5 items-end">
            {/* Search Input */}
            <div className="flex flex-col gap-3">
              <label className="font-montserrat font-bold text-base text-black">
                Tìm kiếm sản phẩm
              </label>
              <div className="flex items-center gap-2.5 bg-vtos-light-blue rounded-lg border border-vtos-gray-border px-5 h-[56px]">
                <Search className="w-6 h-6 text-vtos-gray-dark flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Nhập tên sản phẩm..."
                  className="flex-1 font-montserrat font-medium text-base text-vtos-gray-dark placeholder:text-vtos-gray-dark bg-transparent outline-none h-full"
                />
              </div>
            </div>

            {/* Category Select */}
            <div className="flex flex-col gap-3">
              <label className="font-montserrat font-bold text-base text-black">
                Danh mục
              </label>
              <div className="flex items-center justify-between gap-2.5 bg-vtos-light-blue rounded-lg border border-vtos-gray-border px-5 h-[56px] cursor-pointer hover:border-vtos-blue transition-colors">
                <span className="font-montserrat font-medium text-base text-vtos-gray-dark">
                  Tất cả danh mục
                </span>
                <ChevronDown className="w-6 h-6 text-vtos-gray-dark flex-shrink-0" />
              </div>
            </div>

            {/* School Select */}
            <div className="flex flex-col gap-3">
              <label className="font-montserrat font-bold text-base text-black">
                Trường học
              </label>
              <div className="flex items-center justify-between gap-2.5 bg-vtos-light-blue rounded-lg border border-vtos-gray-border px-5 h-[56px] cursor-pointer hover:border-vtos-blue transition-colors">
                <span className="font-montserrat font-medium text-base text-vtos-gray-dark">
                  Tất cả trường
                </span>
                <ChevronDown className="w-6 h-6 text-vtos-gray-dark flex-shrink-0" />
              </div>
            </div>

            {/* Filter Button */}
            <button className="bg-purple-main hover:bg-purple-dark transition-colors rounded-lg px-5 h-[56px] flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg text-white">
              <span className="font-montserrat font-bold text-base whitespace-nowrap">
                Lọc
              </span>
              <SlidersHorizontal className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 pb-16">
        {/* Results Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <p className="font-montserrat text-base">
            <span className="font-semibold text-vtos-gray-medium">Hiển thị </span>
            <span className="font-extrabold text-black">{products.length}</span>
            <span className="font-semibold text-vtos-gray-medium"> sản phẩm</span>
          </p>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-10">
            <span className="font-montserrat font-semibold text-base text-vtos-gray-text">
              Sắp xếp:
            </span>
            <div className="flex items-center gap-2.5 cursor-pointer group">
              <span className="font-montserrat font-bold text-base text-black">
                Phổ biến nhất
              </span>
              <ChevronDown className="w-6 h-6 text-black stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map((product, index) => (
            <ProductCard
              key={index}
              name={product.name}
              price={product.price}
              imageUrl={product.imageUrl}
              school={product.school}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
