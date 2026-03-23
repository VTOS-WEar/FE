import { ArrowRight, User } from "lucide-react";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { HeroSection } from "./sections/HeroSection/HeroSection";

export const Homepage = (): JSX.Element => {

  return (
    <GuestLayout bgColor="bg-gradient-to-br from-purple-50 via-white to-blue-50 ">

      <HeroSection />

      {/* Features Section */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 lg:gap-16 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="relative w-full max-w-sm">
              <div className="flex flex-col items-center gap-3 px-6 py-8 bg-[#E9F0FF] rounded-[30px] shadow-lg mt-8">
                <h3 className="font-baloo text-xl text-text-dark text-center leading-[1.3]">
                  Thử nhanh bằng AI
                </h3>
                <p className="font-baloo2 text-lg text-text-dark text-center leading-[1.3]">
                  Tải ảnh chân dung và hệ thống tự tạo hình bạn mặc đồng phục trong vài giây.
                </p>
              </div>
              <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-16 h-16 bg-blue-accent rounded-full flex items-center justify-center p-2.5 shadow-lg">
                <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M28.75 7.5H11.25C10.2554 7.5 9.30161 7.89509 8.59835 8.59835C7.89509 9.30161 7.5 10.2554 7.5 11.25V23.8175L9.905 22.0675C10.6618 21.5176 11.5749 21.2248 12.5103 21.232C13.4458 21.2392 14.3543 21.546 15.1025 22.1075L17.4225 23.8475L23.3425 18.7725C24.1564 18.0755 25.1978 17.7014 26.2692 17.7212C27.3406 17.741 28.3674 18.1534 29.155 18.88L32.5 21.9675V11.25C32.5 10.2554 32.1049 9.30161 31.4017 8.59835C30.6984 7.89509 29.7446 7.5 28.75 7.5ZM36.25 26.245V11.25C36.25 9.26088 35.4598 7.35322 34.0533 5.9467C32.6468 4.54018 30.7391 3.75 28.75 3.75H11.25C9.26088 3.75 7.35322 4.54018 5.9467 5.9467C4.54018 7.35322 3.75 9.26088 3.75 11.25V28.75C3.75 30.7391 4.54018 32.6468 5.9467 34.0533C7.35322 35.4598 9.26088 36.25 11.25 36.25H28.75C30.7391 36.25 32.6468 35.4598 34.0533 34.0533C35.4598 32.6468 36.25 30.7391 36.25 28.75V26.245ZM32.5 27.07L26.6125 21.635C26.5 21.5313 26.3533 21.4726 26.2003 21.4698C26.0474 21.467 25.8987 21.5205 25.7825 21.62L18.72 27.675L17.5775 28.655L16.375 27.7525L12.85 25.11C12.7433 25.0305 12.6139 24.9871 12.4808 24.9862C12.3477 24.9853 12.2178 25.0269 12.11 25.105L7.5 28.4525V28.75C7.5 29.7446 7.89509 30.6984 8.59835 31.4017C9.30161 32.1049 10.2554 32.5 11.25 32.5H28.75C29.7446 32.5 30.6984 32.1049 31.4017 31.4017C32.1049 30.6984 32.5 29.7446 32.5 28.75V27.07ZM18.75 15C18.75 15.9946 18.3549 16.9484 17.6517 17.6517C16.9484 18.3549 15.9946 18.75 15 18.75C14.0054 18.75 13.0516 18.3549 12.3483 17.6517C11.6451 16.9484 11.25 15.9946 11.25 15C11.25 14.0054 11.6451 13.0516 12.3483 12.3483C13.0516 11.6451 14.0054 11.25 15 11.25C15.9946 11.25 16.9484 11.6451 17.6517 12.3483C18.3549 13.0516 18.75 14.0054 18.75 15Z" fill="white" />
                </svg>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="relative w-full max-w-sm">
              <div className="flex flex-col items-center gap-3 px-6 py-8 bg-[#F2EBFF] rounded-[30px] shadow-lg mt-8">
                <h3 className="font-baloo text-xl text-text-dark text-center leading-[1.3]">
                  Hơn 200 mẫu đồng phục
                </h3>
                <p className="font-baloo2 text-lg text-text-dark text-center leading-[1.3]">
                  Hỗ trợ nhiều trường khác nhau, đầy đủ mẫu áo–quần–váy theo từng cấp học.
                </p>
              </div>
              <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-[70px] h-16 bg-[#7A40F2] rounded-full flex items-center justify-center p-2.5 shadow-lg">
                <svg className="w-12 h-10" viewBox="0 0 50 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M25.0156 8.75C28.4688 8.75 31.2656 5.95312 31.2656 2.5H35.4453C36.7734 2.5 38.0469 3.02344 38.9844 3.96094L48.25 13.2344C49.2266 14.2109 49.2266 15.7969 48.25 16.7734L44.2891 20.7344C43.3125 21.7109 41.7266 21.7109 40.75 20.7344L37.5156 17.5V35C37.5156 37.7578 35.2734 40 32.5156 40H17.5156C14.7578 40 12.5156 37.7578 12.5156 35V17.5L9.28125 20.7344C8.30469 21.7109 6.71875 21.7109 5.74219 20.7344L1.78906 16.7656C0.8125 15.7891 0.8125 14.2031 1.78906 13.2266L11.0547 3.96094C11.9922 3.02344 13.2656 2.5 14.5938 2.5H18.7734C18.7734 5.95312 21.5703 8.75 25.0234 8.75H25.0156Z" fill="white" />
                </svg>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="relative w-full max-w-sm">
              <div className="flex flex-col items-center gap-3 px-6 py-8 bg-[#EAFBF5] rounded-[30px] shadow-lg mt-8">
                <h3 className="font-baloo text-xl text-text-dark text-center leading-[1.3]">
                  AI nhận diện dáng người chuẩn xác
                </h3>
                <p className="font-baloo2 text-lg text-text-dark text-center leading-[1.3]">
                  Dự đoán form mặc và kích cỡ trực quan trực tiếp trên trình duyệt.
                </p>
              </div>
              <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-16 h-16 bg-teal-accent rounded-full flex items-center justify-center p-2.5 shadow-lg">
                <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.0717 27.1899L10 20.1166L12.3567 17.7599L17.0717 22.4733L26.4983 13.0449L28.8567 15.4033L17.0717 27.1899Z" fill="white" />
                  <path fillRule="evenodd" clipRule="evenodd" d="M1.66666 19.9998C1.66666 9.87484 9.87499 1.6665 20 1.6665C30.125 1.6665 38.3333 9.87484 38.3333 19.9998C38.3333 30.1248 30.125 38.3332 20 38.3332C9.87499 38.3332 1.66666 30.1248 1.66666 19.9998ZM20 34.9998C18.0302 34.9998 16.0796 34.6119 14.2597 33.858C12.4399 33.1042 10.7863 31.9993 9.39339 30.6064C8.00051 29.2136 6.89562 27.56 6.1418 25.7401C5.38798 23.9202 4.99999 21.9697 4.99999 19.9998C4.99999 18.03 5.38798 16.0795 6.1418 14.2596C6.89562 12.4397 8.00051 10.7861 9.39339 9.39323C10.7863 8.00036 12.4399 6.89546 14.2597 6.14164C16.0796 5.38782 18.0302 4.99984 20 4.99984C23.9782 4.99984 27.7935 6.58019 30.6066 9.39323C33.4196 12.2063 35 16.0216 35 19.9998C35 23.9781 33.4196 27.7934 30.6066 30.6064C27.7935 33.4195 23.9782 34.9998 20 34.9998Z" fill="white" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-20">
            <h2 className="font-baloo text-3xl md:text-5xl leading-[1.4] mb-4">
              <span className="text-purple-dark">Thử Nhanh – Chuẩn</span>
              <span className="text-text-dark"> – Không Cần Studio</span>
            </h2>
            <p className="font-baloo2 text-xl md:text-3xl text-text-dark leading-[1.3] max-w-4xl mx-auto">
              Chỉ với 3 bước: Tải ảnh chân dung - Chọn mẫu đồng phục - Nhận kết quả
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-start justify-center gap-6 lg:gap-12 max-w-6xl mx-auto">
            {/* Before Image */}
            <div className="w-full md:w-1/2 rounded-3xl border border-gray-200 bg-white shadow-xl overflow-hidden">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/6150de8fdb5f524f53156fc41728708d3d4ce15e?width=2434"
                alt="Before"
                className="w-full h-auto"
              />
            </div>

            {/* After Image */}
            <div className="w-full md:w-1/2 rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 shadow-xl overflow-hidden">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/33100ce90f8c3736531a7cf7d457c81e3de99876?width=2174"
                alt="After"
                className="w-full h-auto"
              />
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
