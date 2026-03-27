import { ReactNode } from "react";
import { Footer } from "./Footer";
import { NavbarGuest } from "./NavbarGuest";

interface GuestLayoutProps {
    children: ReactNode;
    bgColor?: string; // mặc định là #F4F6FF
    mainClassName?: string;
}

/**
 * GuestLayout - Layout cho các screen không có sidebar (SignIn, SignUp, etc.)
 * Includes NavbarGuest + Footer
 */
export const GuestLayout = ({ children, bgColor = "#f5f3ff", mainClassName = "flex-1 min-h-[1200px]" }: GuestLayoutProps) => {
    return (
        <div
            className="w-full min-h-screen flex flex-col"
            style={{ backgroundColor: bgColor }}
        >
            <NavbarGuest />

            {/* Main content area */}
            <main className={mainClassName}>
                {children}
            </main>

            <Footer />
        </div>
    );
};
