import { NavbarGuest, Footer } from "../../components/layout";
import { GuestLayout } from "../../components/layout/GuestLayout";
import { SchoolSearchSection } from "./sections/SchoolSearchSection";
import { StudentInformationSection } from "./sections/StudentInformationSection";

export const FindSchool = (): JSX.Element => {
  return (
    <GuestLayout bgColor="#f4f2ff">

      <main className="flex-1 bg-[#f4f2ff] py-8 lg:py-12 px-4 lg:px-8 relative overflow-hidden">
        <img
          className="absolute top-0 left-[-19rem] w-[51rem] h-[42rem] opacity-50"
          alt="Vector"
          src="https://c.animaapp.com/mjxt3t8wNP0otU/img/vector-22.svg"
        />
        <img
          className="absolute top-0 right-0 w-[42rem] h-[42rem] opacity-50"
          alt="Vector"
          src="https://c.animaapp.com/mjxt3t8wNP0otU/img/vector-26.svg"
        />
        <img
          className="absolute top-[10rem] right-0 w-[45rem] h-[51rem] opacity-50"
          alt="Vector"
          src="https://c.animaapp.com/mjxt3t8wNP0otU/img/vector-27.svg"
        />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-8 lg:mb-12">
            <h1 className="[font-family:'Montserrat',Helvetica] font-bold text-black text-2xl lg:text-4xl mb-4">
              Chọn trường & Xác nhận học sinh
            </h1>
            <p className="[font-family:'Montserrat',Helvetica] font-medium text-black text-base lg:text-xl opacity-60 max-w-3xl mx-auto mb-6 lg:mb-8">
              Chúng tôi đã tìm thấy thông tin dựa trên số điện thoại của bạn. Vui lòng xác nhận thông tin chính xác
            </p>

            <div className="flex flex-col items-center gap-5 mb-12">
              <div className="flex items-center gap-2">
                <img
                  className="w-4 h-2.5"
                  alt="Progress"
                  src="https://c.animaapp.com/mjxt3t8wNP0otU/img/line-18.svg"
                />
                <img
                  className="w-[3.625rem] h-[1.125rem]"
                  alt="Progress"
                  src="https://c.animaapp.com/mjxt3t8wNP0otU/img/line-17-1.svg"
                />
              </div>
              <p className="[font-family:'Montserrat',Helvetica] font-medium text-black text-sm opacity-60">
                BƯỚC 2 TRÊN 2
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <SchoolSearchSection />
            <StudentInformationSection />
          </div>
        </div>
      </main>


    </GuestLayout>
  );
};
