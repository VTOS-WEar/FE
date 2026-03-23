import { ArrowRight, User } from "lucide-react";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { HeroSection } from "./sections/HeroSection/HeroSection";
import { FeaturesHighlightSection } from "./sections/FeaturesHighlightSection";

export const Homepage = (): JSX.Element => {

  return (
    <GuestLayout bgColor="bg-gradient-to-br from-purple-50 via-white to-blue-50 ">

      <HeroSection />

      <FeaturesHighlightSection/>

{/* ══ HOW IT WORKS ══ */}
 <section id="how-it-works" className="py-[72px] px-7 bg-white">
      <div className="max-w-[1280px] mx-auto px-7">

        {/* Title */}
        <div className="text-center">
          <h2 className="text-[28px] font-extrabold text-[#1a1a2e] mb-2">
            Thử Nhanh – <span className="text-purple-600">Chuẩn</span> – Không Cần Studio
          </h2>
          <p className="text-sm text-gray-500 mb-10">
            Chỉ với 3 bước: Tải ảnh chân dung · Chọn mẫu đồng phục · Nhận kết quả
          </p>
        </div>

        {/* Compare */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-[880px] mx-auto">

          {/* Before */}
          <div className="rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.10)]">
            <img
              src="https://api.builder.io/api/v1/image/assets/TEMP/6150de8fdb5f524f53156fc41728708d3d4ce15e?width=2434s"
              alt="before"
              className="w-full h-[300px] object-cover"
            />
            <div className="py-3 text-center text-sm font-bold bg-gray-100 text-gray-700">
              Ảnh gốc của bạn
            </div>
          </div>

          {/* After */}
          <div className="rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.10)]">
            <img
              src="https://api.builder.io/api/v1/image/assets/TEMP/33100ce90f8c3736531a7cf7d457c81e3de99876?width=2174"
              alt="after"
              className="w-full h-[300px] object-cover"
            />
            <div className="py-3 text-center text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-purple-500">
              Sau khi thử đồng phục ✨
            </div>
          </div>

        </div>
      </div>
    </section>
      {/* Uniform Catalog Section */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-20">
            <h2 className="font-baloo text-3xl md:text-5xl leading-[1.4] mb-4">
              <span className="text-text-dark">Kho Đồng Phục</span>
              <span className="text-purple-dark"> Đầy Đủ Cấp Học</span>
            </h2>
            <p className="font-baloo2 text-xl md:text-3xl text-text-dark leading-[1.3]">
              Khám phá cách AI giúp bạn thử đồng phục nhanh chóng
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {/* Elementary */}
            <div className="relative rounded-[20px] bg-gray-200 shadow-lg overflow-hidden">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/e3defdf92d068d668152ccfe742e9151eef887df?width=596"
                alt="Tiểu học"
                className="w-full h-auto rounded-[20px] p-2.5"
              />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-gray-200 rounded-t-[20px] px-4 py-1.5">
                <span className="font-baloo2 text-xl font-semibold text-black">Tiểu học</span>
              </div>
            </div>

            {/* Middle School */}
            <div className="relative rounded-[20px] bg-gray-200 shadow-lg overflow-hidden">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/ca53d5716185773c3e8e3503a9b32095d88cfa1f?width=596"
                alt="THCS"
                className="w-full h-auto rounded-[20px] p-2.5"
              />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-gray-200 rounded-t-[20px] px-4 py-1.5">
                <span className="font-baloo2 text-xl font-semibold text-black">THCS</span>
              </div>
            </div>

            {/* High School */}
            <div className="relative rounded-[20px] bg-gray-200 shadow-lg overflow-hidden">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/ed766d21bca5438c8806828f3173e1b87b085ebf?width=596"
                alt="THPT"
                className="w-full h-auto rounded-[20px] p-2.5"
              />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-gray-200 rounded-t-[20px] px-4 py-1.5">
                <span className="font-baloo2 text-xl font-semibold text-black">THPT</span>
              </div>
            </div>

            {/* Sports */}
            <div className="relative rounded-[20px] bg-gray-200 shadow-lg overflow-hidden">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/494a01f52ff7ab433c4802d5684890349010cb4a?width=596"
                alt="Thể dục"
                className="w-full h-auto rounded-[20px] p-2.5"
              />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-gray-200 rounded-t-[20px] px-4 py-1.5">
                <span className="font-baloo2 text-xl font-semibold text-black">Thể dục</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Generator/Workspace Section */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto rounded-3xl bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 shadow-2xl p-4 md:p-8 lg:p-16">
            <div className="text-center mb-12">
              <h2 className="font-baloo text-3xl md:text-5xl leading-tight mb-4">
                <span className="text-purple-dark">Thử đồ</span>
                <span className="text-text-dark"> với nhiều loại đồng phục khác nhau</span>
              </h2>
              <p className="font-baloo2 text-xl md:text-3xl text-gray-600 leading-tight">
                Chọn ngay đồng phục phù hợp với bạn → Tạo nên diện mạo hoàn chỉnh của bạn
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 md:p-12">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Panel - Upload & Selection */}
                <div className="flex-1 max-w-md mx-auto lg:mx-0">
                  <div className="rounded-3xl bg-gradient-to-br from-white via-slate-50 to-slate-100 border border-gray-200 shadow-lg p-6 md:p-8">
                    {/* Step 1: Upload Photo */}
                    <div className="mb-8">
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="font-manrope text-sm font-bold text-white">1</span>
                        </div>
                        <h3 className="font-baloo2 text-xl font-bold text-gray-900">Tải ảnh của bạn</h3>
                      </div>

                      <div className="border-[3px] border-dashed border-purple-dark/60 rounded-2xl bg-white p-8 md:p-12">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-dark/10 to-purple-dark/10 border border-purple-dark/20 rounded-full flex items-center justify-center">
                            <User className="w-8 h-8 text-black" />
                          </div>
                          <p className="font-inter text-sm font-medium text-gray-900 text-center">
                            Đặt ảnh của bạn vào khung hình
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-8" />

                    {/* Step 2: Select Students */}
                    <div>
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="font-manrope text-sm font-bold text-white">2</span>
                        </div>
                        <h3 className="font-baloo2 text-xl font-bold text-gray-900">Chọn học sinh cần thử</h3>
                      </div>

                      <div className="border-[3px] border-dashed border-purple-dark/60 rounded-2xl bg-white p-8 md:p-12 mb-6">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500/10 to-teal-500/10 border border-green-200/50 rounded-2xl flex items-center justify-center">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8.99999 21V8.77501C7.61666 8.40834 6.48766 7.67501 5.61299 6.57501C4.73832 5.47501 4.21732 4.22501 4.04999 2.82501C4.01666 2.59167 4.09999 2.39601 4.29999 2.23801C4.49999 2.08001 4.73332 2.00067 4.99999 2.00001C5.26666 1.99934 5.49999 2.07034 5.69999 2.21301C5.89999 2.35567 6.01666 2.55134 6.04999 2.80001C6.23332 4.00001 6.74999 5.00001 7.59999 5.80001C8.44999 6.60001 9.49999 7.00001 10.75 7.00001H13.25C13.75 7.00001 14.2167 7.09167 14.65 7.27501C15.0833 7.45834 15.475 7.72501 15.825 8.07501L19.65 11.9C19.8333 12.0833 19.925 12.3167 19.925 12.6C19.925 12.8833 19.8333 13.1167 19.65 13.3C19.4667 13.4833 19.2333 13.575 18.95 13.575C18.6667 13.575 18.4333 13.4833 18.25 13.3L15 10.05V21C15 21.2833 14.904 21.521 14.712 21.713C14.52 21.905 14.2827 22.0007 14 22C13.7173 21.9993 13.48 21.9033 13.288 21.712C13.096 21.5207 13 21.2833 13 21V16H11V21C11 21.2833 10.904 21.521 10.712 21.713C10.52 21.905 10.2827 22.0007 9.99999 22C9.71732 21.9993 9.47999 21.9033 9.28799 21.712C9.09599 21.5207 8.99999 21.2833 8.99999 21ZM12 6.00001C11.45 6.00001 10.9793 5.80434 10.588 5.41301C10.1967 5.02167 10.0007 4.55067 9.99999 4.00001C9.99932 3.44934 10.1953 2.97867 10.588 2.58801C10.9807 2.19734 11.4513 2.00134 12 2.00001C12.5487 1.99867 13.0197 2.19467 13.413 2.58801C13.8063 2.98134 14.002 3.45201 14 4.00001C13.998 4.54801 13.8023 5.01901 13.413 5.41301C13.0237 5.80701 12.5527 6.00267 12 6.00001Z" fill="black" />
                            </svg>
                          </div>
                          <div className="text-center">
                            <p className="font-baloo2 text-sm font-medium text-gray-900">Chọn học sinh để thử đồ</p>
                            <p className="font-baloo2 text-xs text-gray-500 mt-1">Nhấn vào chọn những học sinh hợp lệ</p>
                          </div>
                        </div>
                      </div>

                      <button
                        disabled
                        className="w-full bg-gradient-to-br from-purple-dark to-purple-deep text-white font-baloo2 text-lg font-semibold rounded-[20px] py-3 opacity-50 cursor-not-allowed"
                      >
                        Tạo giao diện hoàn chỉnh
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Panel - Results */}
                <div className="flex-1">
                  <div className="rounded-3xl bg-gradient-to-br from-white via-slate-50 to-slate-100 border border-white/20 shadow-xl h-full min-h-[500px] flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300 rounded-full mx-auto mb-6 flex items-center justify-center shadow-md">
                        <div className="w-8 h-8 bg-purple-dark/20 rounded-full flex items-center justify-center">
                          <div className="w-4 h-4 bg-purple-dark rounded-full" />
                        </div>
                      </div>
                      <h3 className="font-baloo2 text-2xl font-medium text-gray-900 mb-3">
                        Kết quả của bạn
                      </h3>
                      <p className="font-baloo2 text-base text-gray-600">
                        Kết quả của bạn sẽ xuất hiện ở đây
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Participating Schools Section */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8 max-w-6xl mx-auto">
            <h2 className="font-baloo2 text-3xl md:text-4xl font-bold text-black">
              Trường học tham gia
            </h2>
            <a href="#" className="flex items-center gap-2 text-blue-accent hover:opacity-80 transition-opacity">
              <span className="font-baloo2 text-xl md:text-2xl font-semibold">Xem tất cả</span>
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12 max-w-6xl mx-auto">
            {/* School 1 */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-md p-5 flex flex-col gap-4">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/80a6f435cb9e7087c210fa4c6d128f646beb5b25?width=620"
                alt="THPT FPT Đà Nẵng"
                className="w-full h-[310px] object-cover rounded-lg"
              />
              <h3 className="font-montserrat text-2xl font-semibold text-black">
                THPT FPT Đà Nẵng
              </h3>
            </div>

            {/* School 2 */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-md p-5 flex flex-col gap-4">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/7c56845c7a5a2ebc8fe7f65a9cc5d4e782dc9bd8?width=620"
                alt="THPT Phan Châu Trinh"
                className="w-full h-[310px] object-cover rounded-lg"
              />
              <h3 className="font-montserrat text-2xl font-semibold text-black">
                THPT Phan Châu Trinh
              </h3>
            </div>

            {/* School 3 */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-md p-5 flex flex-col gap-4">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/9fe81853a1e7cd043d2d3ec42b9a15d899760dd3?width=620"
                alt="THCS Nguyễn Khuyến"
                className="w-full h-[310px] object-cover rounded-lg"
              />
              <h3 className="font-montserrat text-2xl font-semibold text-black">
                THCS Nguyễn Khuyến
              </h3>
            </div>
          </div>
        </div>
      </section>
    </GuestLayout>
  );
};
