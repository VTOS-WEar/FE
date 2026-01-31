import { ChevronRightIcon } from "lucide-react";
import { Navbar, Footer } from "../../components/layout";
import { AccountSettingsSection } from "./sections/AccountSettingsSection";

export const AccountSecurity = (): JSX.Element => {
  return (
    <div className="bg-white w-full min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 bg-[#f4f2ff] py-12 px-4 lg:px-8 relative overflow-hidden">
        <img
          className="absolute top-[-5rem] left-[-15rem] w-[117rem] h-[85rem] pointer-events-none opacity-50"
          alt="Background"
          src="https://c.animaapp.com/mjxt3t8wNP0otU/img/group-239190-1.png"
        />

        <div className="max-w-7xl mx-auto relative z-10">
          <nav className="flex items-center gap-2.5 mb-6">
            <span className="[font-family:'Montserrat',Helvetica] font-normal text-black text-base opacity-40">
              Trang chủ
            </span>
            <ChevronRightIcon className="w-4 h-4 text-black opacity-40" />
            <span className="[font-family:'Montserrat',Helvetica] font-semibold text-black text-base">
              Bảo mật tài khoản
            </span>
          </nav>

          <AccountSettingsSection />
        </div>
      </main>

      <Footer />
    </div>
  );
};
