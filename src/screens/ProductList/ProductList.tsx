import { Search, ChevronDown, SlidersHorizontal, Tag, School, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { GuestLayout } from "@/components/layout/GuestLayout";
import { PublicPageBreadcrumb } from "@/components/PublicPageBreadcrumb";

interface ProductCardProps {
  name: string;
  price: string;
  imageUrl: string;
  school: string;
}

const ProductCard = ({ name, price, imageUrl, school }: ProductCardProps) => (
  <motion.div
    whileHover={{ y: -6, rotate: -1, scale: 1.01 }}
    whileTap={{ y: 1, scale: 0.992 }}
    transition={{ type: "spring", stiffness: 260, damping: 18 }}
    className="group h-full"
  >
    <div className="relative nb-card nb-card-wiggle h-full overflow-hidden border-2 border-[#1A1A2E] bg-white shadow-[4px_4px_0_#1A1A2E] transition-all duration-200 group-hover:shadow-[10px_10px_0_#1A1A2E] group-hover:ring-2 group-hover:ring-[#B8A9E8]/45">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#B8A9E8] via-[#C9BDF2] to-[#A996E2] opacity-85" />

      <div className="relative h-[220px] overflow-hidden">
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1A1A2E]/38 via-[#1A1A2E]/5 to-white/10 opacity-85 transition-opacity duration-200 group-hover:opacity-100" />
      </div>

      <div className="p-5">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#1A1A2E]/35 bg-gradient-to-r from-[#F6F2FF] to-[#FFFFFF] px-2.5 py-1 text-[11px] font-extrabold text-[#5F4FB8]">
          <School className="h-3 w-3 text-[#7C3AED]" />
          {school}
        </div>

        <h3 className="mb-3 line-clamp-2 text-lg font-extrabold leading-snug text-[#1A1A2E] transition-colors group-hover:text-[#7C3AED]">
          {name}
        </h3>

        <div className="flex items-end justify-between gap-3">
          <p className="text-xl font-extrabold text-[#7C3AED]">{price}</p>
          <button className="relative inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border-2 border-[#1A1A2E] bg-gradient-to-r from-[#F8F6FF] via-white to-[#EFE9FF] px-3 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#1A1A2E] shadow-[3px_3px_0_#1A1A2E] transition-all duration-200 group-hover:border-[#7C3AED] group-hover:shadow-[5px_5px_0_#1A1A2E] group-hover:brightness-[1.03] active:translate-y-px active:shadow-[2px_2px_0_#1A1A2E]">
            <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.55),transparent_45%)] opacity-80 transition-opacity duration-200 group-hover:opacity-100" />
            <Sparkles className="relative z-[1] h-3.5 w-3.5" />
            <span className="relative z-[1] group-hover:text-[#7C3AED]">Xem</span>
          </button>
        </div>
      </div>
    </div>
  </motion.div>
);

export default function ProductList() {
  // Mock data for products - in a real app this would come from an API
  const products = Array(12).fill({
    name: "Áo sơ mi đồng phục học sinh",
    price: "250.000đ",
    imageUrl: "https://api.builder.io/api/v1/image/assets/TEMP/ca53d5716185773c3e8e3503a9b32095d88cfa1f?width=596",
    school: "THCS FPT"
  });

  return (
    <GuestLayout bgColor="#FFF8F0">
      <div className="relative z-10 mx-auto max-w-[1200px] px-6 py-10 lg:px-8">
        <div className="mb-4">
          <PublicPageBreadcrumb items={[{ label: "Trang chủ", to: "/homepage" }, { label: "Sản phẩm" }]} />
        </div>

        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-[#1A1A2E] lg:text-4xl">
            Danh sách <span className="text-[#B8A9E8]">sản phẩm</span>
          </h1>
          <p className="max-w-2xl text-base font-medium text-[#4C5769]">
            Khám phá bộ sưu tập đồng phục đa dạng cho mọi cấp học.
          </p>
        </div>

        <div className="mb-8">
          <div className="nb-card-static overflow-visible px-5 py-5 shadow-[6px_6px_0_#1A1A2E] ring-2 ring-[#B8A9E8]/35 sm:px-6">
            <div className="flex w-full flex-wrap items-end gap-x-3 gap-y-3">
              <div className="min-w-[220px] flex-1 space-y-1.5">
                <label className="ml-1 block text-[10px] font-bold uppercase tracking-widest leading-tight text-[#6B7280]">
                  Tìm kiếm sản phẩm
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#1A1A2E]" />
                  <input
                    type="text"
                    placeholder="Nhập tên sản phẩm..."
                    className="w-full h-9 rounded-lg border-2 border-[#1A1A2E] bg-white pl-10 pr-3 text-sm font-semibold text-[#1A1A2E] shadow-[4px_4px_0_#1A1A2E] transition-all placeholder:font-medium placeholder:text-[#6B7280] hover:-translate-y-px hover:shadow-[5px_5px_0_#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#B8A9E8]/45"
                  />
                </div>
              </div>

              <div className="w-full max-w-[190px] shrink-0 space-y-1.5 sm:w-[190px]">
                <label className="ml-1 block text-[10px] font-bold uppercase tracking-widest leading-tight text-[#6B7280]">
                  Danh mục
                </label>
                <button className="flex h-9 w-full items-center justify-between rounded-lg border-2 border-[#1A1A2E] bg-white px-3 text-sm font-semibold text-[#1A1A2E] shadow-[4px_4px_0_#1A1A2E] transition-all hover:-translate-y-px hover:shadow-[5px_5px_0_#1A1A2E]">
                  Tất cả danh mục
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="w-full max-w-[190px] shrink-0 space-y-1.5 sm:w-[190px]">
                <label className="ml-1 block text-[10px] font-bold uppercase tracking-widest leading-tight text-[#6B7280]">
                  Trường học
                </label>
                <button className="flex h-9 w-full items-center justify-between rounded-lg border-2 border-[#1A1A2E] bg-white px-3 text-sm font-semibold text-[#1A1A2E] shadow-[4px_4px_0_#1A1A2E] transition-all hover:-translate-y-px hover:shadow-[5px_5px_0_#1A1A2E]">
                  Tất cả trường
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>

              <button className="group relative inline-flex h-9 min-w-[128px] items-center justify-center gap-2 overflow-hidden rounded-lg border-2 border-[#1A1A2E] bg-gradient-to-r from-[#A78BFA] via-[#C4B5FD] to-[#7C3AED] px-3 text-sm font-bold text-[#1A1A2E] shadow-[4px_4px_0_#1A1A2E] transition-all duration-200 hover:-translate-y-px hover:shadow-[5px_5px_0_#1A1A2E] hover:brightness-[1.08]">
                <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.6),transparent_45%)] opacity-85 transition-opacity group-hover:opacity-100" />
                <SlidersHorizontal className="relative z-[1] h-3.5 w-3.5" />
                <span className="relative z-[1]">Lọc</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mb-7 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-[#1A1A2E]">
            <Tag className="h-4 w-4" />
            <span>
              Hiển thị <span className="text-[#7C3AED]">{products.length}</span> sản phẩm
            </span>
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg border-2 border-[#1A1A2E] bg-white px-3 py-1.5 text-sm font-semibold text-[#1A1A2E] shadow-[3px_3px_0_#1A1A2E] transition-all hover:-translate-y-px hover:shadow-[4px_4px_0_#1A1A2E]">
            Phổ biến nhất
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product, index) => (
            <ProductCard key={index} name={product.name} price={product.price} imageUrl={product.imageUrl} school={product.school} />
          ))}
        </div>
      </div>
    </GuestLayout>
  );
}
