import { ReactNode } from "react";
import { Footer } from "./Footer";
import { NavbarGuest } from "./NavbarGuest";

interface GuestLayoutProps {
    children: ReactNode;
    bgColor?: string; // mặc định là #F4F6FF
}

/**
 * GuestLayout - Layout cho các screen không có sidebar (SignIn, SignUp, etc.)
 * Includes NavbarGuest + Footer
 */
export const GuestLayout = ({ children }: GuestLayoutProps) => {
    return (
        <div className="bg-[#f5f3ff] w-full min-h-screen flex flex-col">
            <NavbarGuest />

            {/* Main content area */}
            <main className="flex-1">
                {children}
            </main>

            <Footer />
        </div>
    );
};
