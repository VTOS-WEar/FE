import { ChevronRightIcon } from "lucide-react";
import { Navbar, Footer } from "../../components/layout";
import { AccountSettingsSection } from "./sections/AccountSettingsSection";

export const AccountSetting = (): JSX.Element => {
  return (
    <div className="bg-white w-full min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 bg-gray-50 py-12 px-4 lg:px-8 relative overflow-hidden">
        {/* NB decorative shapes */}

        <div className="max-w-7xl mx-auto relative z-10">
          <nav className="flex items-center gap-2.5 mb-6">
            <span className="font-normal text-black text-base opacity-40">
              Trang chủ
            </span>
            <ChevronRightIcon className="w-4 h-4 text-black opacity-40" />
            <span className="font-semibold text-black text-base">
              Cài đặt tài khoản
            </span>
          </nav>

          <AccountSettingsSection />
        </div>
      </main>

      <Footer />
    </div>
  );
};
