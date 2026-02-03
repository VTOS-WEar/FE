import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

interface SiteLayoutProps {
  isLoggedIn?: boolean;
}

export default function SiteLayout({ isLoggedIn = false }: SiteLayoutProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header isLoggedIn={isLoggedIn} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export { SiteLayout };
