import { ReactNode } from "react";
import { Footer } from "./Footer";
import { NavbarGuest } from "./NavbarGuest";

interface GuestLayoutProps {
    children: ReactNode;
    bgColor?: string; // mặc định là #f9fafb (cool gray)
    mainClassName?: string;
}

/**
 * GuestLayout - Layout cho các screen không có sidebar (SignIn, SignUp, etc.)
 * Includes NavbarGuest + Footer
 */
export const GuestLayout = ({ children, bgColor = "#f9fafb", mainClassName = "flex-1" }: GuestLayoutProps) => {
    return (
        <div
            className="w-full min-h-screen min-h-[100svh] flex flex-col"
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
