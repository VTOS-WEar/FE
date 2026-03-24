import { ArrowRight, User } from "lucide-react";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { HeroSection } from "./sections/HeroSection/HeroSection";
import { FeaturesHighlightSection } from "./sections/FeaturesHighlightSection";
import { ProductShowcaseSection } from "./sections/ProductShowcaseSection";
import { CustomUniformOptionsSection } from "./sections/CustomUniformOptionsSection";
import { CallToActionSection } from "./sections/CallToActionSection";

export const Homepage = (): JSX.Element => {

  return (
    <GuestLayout>

      <HeroSection />

      <FeaturesHighlightSection/>
      <ProductShowcaseSection/>
      <CustomUniformOptionsSection/>
<CallToActionSection/>

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
