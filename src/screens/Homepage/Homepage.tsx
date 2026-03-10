import { Search, ShoppingCart, Bell, User, ChevronDown, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSchoolProfile, type SchoolProfileDto } from "../../lib/api/schools";

/** Check if user is logged in by looking for access_token */
function isLoggedIn(): boolean {
  return !!(localStorage.getItem("access_token") || sessionStorage.getItem("access_token"));
}


export const Homepage = (): JSX.Element => {
  const [currentImageSet, setCurrentImageSet] = useState(0);
  const navigate = useNavigate();
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfileDto | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  // Check session & fetch school profile on mount
  useEffect(() => {
    const hasSession = isLoggedIn();
    setLoggedIn(hasSession);

    if (!hasSession) {
      setProfileLoading(false);
      return;
    }

    // Only fetch school profile if logged in
    const fetchProfile = async () => {
      try {
        const data = await getSchoolProfile();
        setSchoolProfile(data);
      } catch {
        setSchoolProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, []);

  /** Handle profile button click */
  const handleProfileClick = () => {
    if (!loggedIn) {
      navigate("/signin");
      return;
    }
    // Logged in → go to school profile (will fill in info if missing)
    navigate("/school/profile");
  };

  /** Display name for the profile button */
  const profileButtonLabel = !loggedIn
    ? "Đăng nhập"
    : profileLoading
      ? "..."
      : schoolProfile?.schoolName || "Hồ sơ";


  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navigation */}
      <header className="sticky top-0 z-50 bg-purple-light/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center justify-between gap-3">
            {/* Logo */}
            <img
              src="https://api.builder.io/api/v1/image/assets/TEMP/b5b02bd27ae25e8fcc3a61694891ffa491402bfb?width=328"
              alt="VTOS Logo"
              className="h-14 w-auto object-contain"
            />

            {/* Navigation Menu */}
            <div className="hidden lg:flex items-center gap-8 px-8 py-3 bg-white rounded-full shadow-lg">
              <a href="#" className="font-baloo text-base text-black hover:text-purple-dark transition-colors">
                Trang chủ
              </a>
              <a href="#how-it-works" className="font-baloo text-base text-black hover:text-purple-dark transition-colors">
                Cách hoạt động
              </a>
              <div className="flex items-center gap-2 cursor-pointer group">
                <span className="font-baloo text-base text-black group-hover:text-purple-dark transition-colors">
                  Sản phẩm
                </span>
                <ChevronDown className="w-3 h-3 stroke-2" />
              </div>
              <a href="#contact" className="font-baloo text-base text-black hover:text-purple-dark transition-colors">
                Liên hệ
              </a>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className="font-roboto text-base text-black/60 bg-transparent outline-none w-48 placeholder:text-black/60"
                />
              </div>
              <button className="flex items-center justify-center w-10 h-10 bg-purple-medium rounded-full shadow-md hover:shadow-lg transition-shadow">
                <Search className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-3">
              <button className="flex items-center justify-center p-2.5 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow">
                <ShoppingCart className="w-10 h-10" />
              </button>
              <button className="flex items-center justify-center p-2.5 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow">
                <Bell className="w-10 h-10" />
              </button>
              <button
                onClick={handleProfileClick}
                className="flex items-center gap-2.5 px-3 py-2.5 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              >
                <User className="w-10 h-10" />
                <span className="hidden md:inline font-baloo text-base text-black truncate max-w-[160px]">{profileButtonLabel}</span>
                <ChevronDown className="hidden md:inline w-3 h-3 stroke-2" />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-purple-light py-12 md:py-20 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
            {/* Left Arrow */}
            <button className="hidden lg:block text-purple-main/50 hover:text-purple-main transition-colors">
              <ChevronLeft className="w-7 h-14 stroke-[10]" strokeLinecap="round" strokeLinejoin="round" />
            </button>

            {/* Left Content */}
            <div className="flex-1 max-w-xl text-center lg:text-left">
              <h1 className="font-gochi text-7xl md:text-[150px] lg:text-[200px] xl:text-[300px] leading-[1.15] text-purple-main drop-shadow-lg mb-6">
                VTOS
              </h1>
              <h2 className="font-baloo2 text-2xl md:text-3xl lg:text-4xl font-semibold text-text-dark leading-[1.4] mb-4">
                Thử đồng phục trực tuyến bằng AI
              </h2>
              <p className="font-baloo2 text-lg md:text-xl text-text-dark leading-[1.3] mb-8 max-w-lg mx-auto lg:mx-0">
                Tải ảnh của bạn lên và xem đồng phục trường hiển thị ngay lập tức. Không cần thử trực tiếp, không mất thời gian. Phụ huynh, học sinh và nhà trường đều có thể sử dụng dễ dàng.
              </p>

              {/* CTA Button */}
              <button className="group relative inline-flex items-center justify-center px-12 py-3.5 bg-gradient-to-br from-purple-dark via-purple-medium to-purple-dark rounded-full shadow-2xl hover:shadow-purple-dark/50 transition-all duration-300 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <span className="relative font-baloo text-2xl text-white">
                  Bắt đầu thử ngay
                </span>
              </button>
            </div>

            {/* Phone Mockup */}
            <div className="relative flex-shrink-0">
              <div className="relative w-[280px] md:w-[350px] lg:w-[431px] h-[560px] md:h-[700px] lg:h-[888px] rounded-[50px] md:rounded-[60px] lg:rounded-[70px] bg-black overflow-hidden shadow-2xl">
                {/* Phone Screen */}
                <img
                  src="https://api.builder.io/api/v1/image/assets/TEMP/eef0ae9593f6a6296eb52342229bd158fe61eb1b?width=1808"
                  alt="App Preview"
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />

                {/* Camera Notch */}
                <div className="absolute left-1/2 top-8 -translate-x-1/2 w-[124px] h-[36px] bg-black rounded-full flex items-center justify-end px-4">
                  <div className="w-[18px] h-[18px] rounded-full bg-[#121212] border border-[#0E0E0E] opacity-75" />
                </div>

                {/* Phone Frame */}
                <div className="absolute inset-0 rounded-[50px] md:rounded-[60px] lg:rounded-[70px] border-4 border-[#565553] pointer-events-none" />
                <div className="absolute inset-0 rounded-[50px] md:rounded-[60px] lg:rounded-[70px] border-2 border-[#3F3E3B] pointer-events-none" />
              </div>
            </div>

            {/* Right Arrow */}
            <button className="hidden lg:block text-purple-main/50 hover:text-purple-main transition-colors">
              <ChevronRight className="w-7 h-14 stroke-[10]" strokeLinecap="round" strokeLinejoin="round" />
            </button>
          </div>
        </div>
      </section>

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

      {/* Footer */}
      <footer className="relative bg-gradient-to-b from-[#DFCFFF] to-[#3C6EFD] overflow-hidden">
        <div className="container mx-auto px-4 py-16 relative z-10">
          {/* Top Section */}
          <div className="flex flex-col lg:flex-row items-start justify-between gap-8 mb-12">
            {/* Contact Info - Left */}
            <div className="text-left">
              <p className="font-roboto text-base text-black mb-6">Liên hệ</p>
              <p className="font-montserrat text-xl font-bold text-black mb-4">support@xxx.com</p>
              <p className="font-montserrat text-xl font-bold text-black">+62821-5949-5854</p>
            </div>

            {/* Center Section */}
            <div className="flex-1 max-w-2xl mx-auto text-center">
              <h3 className="font-montserrat text-2xl md:text-3xl font-bold text-black mb-8 leading-normal">
                Nền tảng thử đồng phục trực tuyến bằng AI dành cho học sinh, phụ huynh và trường học.
              </h3>

              {/* CTA Button */}
              <button className="inline-flex items-center justify-center gap-16 px-16 py-2.5 bg-[#0E00DD] rounded-[61px] hover:bg-[#0E00DD]/90 transition-colors mb-8">
                <span className="font-roboto text-lg text-white uppercase">Thử ngay</span>
                <svg className="w-3 h-2.5 rotate-90 fill-white" viewBox="0 0 12 10">
                  <path d="M6 10L0 0H12L6 10Z" />
                </svg>
              </button>

              {/* Email Subscription */}
              <div className="max-w-sm mx-auto">
                <div className="flex items-center justify-between gap-1 p-1 bg-[#0E00DD] rounded-full border border-white/20 mb-3">
                  <div className="flex items-center gap-1 px-3">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M11.5 6C8.189 6 5.5 8.689 5.5 12C5.5 15.311 8.189 18 11.5 18C14.811 18 17.5 15.311 17.5 12C17.5 8.689 14.811 6 11.5 6ZM11.5 8C13.708 8 15.5 9.792 15.5 12C15.5 14.208 13.708 16 11.5 16C9.292 16 7.5 14.208 7.5 12C7.5 9.792 9.292 8 11.5 8Z" fill="white" />
                      <path fillRule="evenodd" clipRule="evenodd" d="M19.25 17L19.343 16.999C20.304 16.975 21.22 16.583 21.902 15.902C22.605 15.198 23 14.245 23 13.25V11C23 5.52 18.592 1.07 13.129 1.001L13 1H12C5.929 1 1 5.929 1 12C1 18.071 5.929 23 12 23C12.552 23 13 22.552 13 22C13 21.448 12.552 21 12 21C7.033 21 3 16.967 3 12C3 7.033 7.033 3 12 3H13C17.418 3 21 6.582 21 11V13.25C21 13.714 20.816 14.159 20.487 14.487C20.159 14.816 19.714 15 19.25 15M19.25 15C18.786 15 18.341 14.816 18.013 14.487C17.684 14.159 17.5 13.714 17.5 13.25V8C17.5 7.465 17.08 7.028 16.551 7.001L16.5 7C15.948 7 15.5 7.448 15.5 8C15.5 8 15.5 10.935 15.5 13.25C15.5 14.245 15.895 15.198 16.598 15.902C17.302 16.605 18.255 17 19.25 17" fill="white" />
                    </svg>
                    <input
                      type="email"
                      placeholder="Nhập email của bạn"
                      className="bg-transparent border-none outline-none text-white placeholder:text-white font-montserrat text-sm font-medium w-full"
                    />
                  </div>
                  <button className="px-6 py-2 bg-white rounded-full hover:bg-gray-100 transition-colors">
                    <span className="font-montserrat text-sm font-semibold text-[#3A3A3A]">Gửi ngay</span>
                  </button>
                </div>
                <p className="font-montserrat text-sm text-black leading-[150%]">
                  Cập nhật những thông tin, hiểu biết và sự kiện mới nhất từ ​​VTOS.
                </p>
              </div>
            </div>

            {/* Address - Right */}
            <div className="text-left">
              <p className="font-roboto text-base text-black mb-6">Địa chỉ</p>
              <p className="font-montserrat text-xl font-bold text-black">Đà Nẵng</p>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-black/10">
            <p className="font-roboto text-sm text-black">
              © Copyright 2025. All rights reserved.
            </p>
            <p className="font-roboto text-sm text-black">
              Terms & Conditions
            </p>
            <div className="flex items-center gap-3">
              {/* Zalo */}
              <button className="w-6 h-6 hover:opacity-80 transition-opacity">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.49 10.272V9.82198H13.837V16.144H13.067C12.9146 16.1442 12.7683 16.0841 12.6601 15.9767C12.552 15.8693 12.4908 15.7234 12.49 15.571C11.9278 15.9828 11.2488 16.2052 10.552 16.204C9.68138 16.204 8.84638 15.8583 8.23057 15.2428C7.61476 14.6274 7.26853 13.7926 7.268 12.922C7.26853 12.0514 7.61476 11.2166 8.23057 10.6011C8.84638 9.9857 9.68138 9.63998 10.552 9.63998C11.2485 9.63898 11.9281 9.8604 12.49 10.272ZM6.919 7.78998V7.99498C6.919 8.37698 6.868 8.68898 6.619 9.05498L6.589 9.08898C6.50612 9.18208 6.42544 9.27711 6.347 9.37398L2.024 14.8H6.919V15.568C6.919 15.6437 6.90407 15.7187 6.87506 15.7886C6.84605 15.8586 6.80353 15.9221 6.74994 15.9756C6.69635 16.0291 6.63273 16.0715 6.56273 16.1004C6.49273 16.1293 6.41773 16.1441 6.342 16.144H0V15.782C0 15.339 0.11 15.141 0.25 14.935L4.858 9.22998H0.192V7.78998H6.919ZM15.47 16.144C15.3427 16.144 15.2206 16.0934 15.1306 16.0034C15.0406 15.9134 14.99 15.7913 14.99 15.664V7.78998H16.431V16.144H15.47ZM20.693 9.59998C21.1272 9.59985 21.5571 9.68523 21.9582 9.85125C22.3594 10.0173 22.7239 10.2607 23.031 10.5676C23.3381 10.8745 23.5817 11.2389 23.748 11.6399C23.9142 12.041 23.9999 12.4708 24 12.905C24.0001 13.3391 23.9147 13.7691 23.7487 14.1702C23.5827 14.5714 23.3393 14.9359 23.0324 15.243C22.7255 15.55 22.3611 15.7937 21.9601 15.9599C21.559 16.1262 21.1292 16.2118 20.695 16.212C19.8182 16.2122 18.9772 15.8642 18.357 15.2444C17.7368 14.6246 17.3883 13.7838 17.388 12.907C17.3877 12.0302 17.7358 11.1892 18.3556 10.569C18.9754 9.94881 19.8162 9.60024 20.693 9.59998ZM10.553 14.853C10.8103 14.8588 11.0663 14.8132 11.3057 14.7188C11.5452 14.6243 11.7634 14.483 11.9475 14.3031C12.1315 14.1231 12.2778 13.9082 12.3777 13.671C12.4775 13.4337 12.529 13.1789 12.529 12.9215C12.529 12.6641 12.4775 12.4092 12.3777 12.172C12.2778 11.9347 12.1315 11.7198 11.9475 11.5399C11.7634 11.36 11.5452 11.2186 11.3057 11.1242C11.0663 11.0298 10.8103 10.9841 10.553 10.99C10.0483 11.0015 9.56822 11.21 9.21537 11.571C8.86251 11.932 8.66495 12.4167 8.66495 12.9215C8.66495 13.4263 8.86251 13.911 9.21537 14.272C9.56822 14.633 10.0483 14.8415 10.553 14.853ZM20.693 14.85C21.2088 14.85 21.7036 14.6451 22.0683 14.2803C22.4331 13.9155 22.638 13.4208 22.638 12.905C22.638 12.3891 22.4331 11.8944 22.0683 11.5297C21.7036 11.1649 21.2088 10.96 20.693 10.96C20.1772 10.96 19.6824 11.1649 19.3177 11.5297C18.9529 11.8944 18.748 12.3891 18.748 12.905C18.748 13.4208 18.9529 13.9155 19.3177 14.2803C19.6824 14.6451 20.1772 14.85 20.693 14.85Z" fill="black" />
                </svg>
              </button>
              {/* Facebook */}
              <button className="w-5 h-5 hover:opacity-80 transition-opacity">
                <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 10C20 4.48 15.52 0 10 0C4.48 0 0 4.48 0 10C0 14.84 3.44 18.87 8 19.8V13H6V10H8V7.5C8 5.57 9.57 4 11.5 4H14V7H12C11.45 7 11 7.45 11 8V10H14V13H11V19.95C16.05 19.45 20 15.19 20 10Z" fill="black" />
                </svg>
              </button>
              {/* YouTube */}
              <button className="w-6 h-6 hover:opacity-80 transition-opacity">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5.532 5.207C8.30333 5.069 10.459 5 11.999 5C13.539 5 15.6955 5.06917 18.4685 5.2075C19.1941 5.24372 19.882 5.54203 20.4043 6.04706C20.9266 6.55208 21.2479 7.22949 21.3085 7.9535C21.4355 9.47017 21.499 10.8063 21.499 11.962C21.499 13.1313 21.434 14.486 21.304 16.026C21.2436 16.7417 20.9285 17.412 20.4159 17.9151C19.9033 18.4181 19.2272 18.7206 18.5105 18.7675C16.1402 18.9225 13.9697 19 11.999 19C10.029 19 7.85933 18.9225 5.49 18.7675C4.77354 18.7206 4.09763 18.4184 3.58505 17.9156C3.07247 17.4129 2.7572 16.7429 2.6965 16.0275C2.56483 14.4758 2.499 13.1207 2.499 11.962C2.499 10.817 2.56317 9.48033 2.6915 7.952C2.75234 7.22817 3.07373 6.551 3.59602 6.04618C4.11831 5.54136 4.80602 5.24319 5.5315 5.207H5.532Z" fill="black" stroke="black" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M10.5 9.805V14.203C10.5 14.2805 10.5209 14.3565 10.5607 14.423C10.6004 14.4894 10.6574 14.5439 10.7256 14.5806C10.7938 14.6173 10.8707 14.6348 10.9481 14.6312C11.0254 14.6277 11.1004 14.6033 11.165 14.5605L14.4635 12.3805C14.5225 12.3416 14.5709 12.2888 14.6045 12.2267C14.6381 12.2646 14.6558 12.0952 14.6561 12.0246C14.6564 11.9539 14.6393 11.8844 14.6062 11.822C14.5731 11.7596 14.5251 11.7064 14.4665 11.667L11.1675 9.449C11.103 9.40568 11.028 9.38069 10.9504 9.37672C10.8728 9.37275 10.7956 9.38994 10.7271 9.42645C10.6585 9.46297 10.6012 9.51743 10.5612 9.58402C10.5212 9.65061 10.5 9.72682 10.5 9.8045V9.805Z" fill="white" stroke="white" strokeWidth="1.7145" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Large VTOS Text */}
          <div className="text-center mt-8">
            <h2 className="font-montserrat text-[120px] md:text-[180px] lg:text-[230px] font-bold text-black leading-none">
              VTOS
            </h2>
          </div>
        </div>
      </footer>
    </div>
  );
};
