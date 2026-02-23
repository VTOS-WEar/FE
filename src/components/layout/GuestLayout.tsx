import { ReactNode } from "react";
import { NavbarGuest } from "./NavbarGuest";
import { Footer } from "./Footer";

interface GuestLayoutProps {
    children: ReactNode;
    bgColor?: string; // mặc định là #F4F6FF
}

/**
 * GuestLayout - Layout cho các screen không có sidebar (SignIn, SignUp, etc.)
 * Includes NavbarGuest + Footer
 */
export const GuestLayout = ({ children, bgColor = "#F4F6FF" }: GuestLayoutProps) => {
    return (
        <div className="bg-white w-full min-h-screen flex flex-col">
            <NavbarGuest />

            {/* Main content area */}
            <main className="flex-1" style={{ backgroundColor: bgColor }}>
                {children}
            </main>

            <Footer />
        </div>
    );
};
