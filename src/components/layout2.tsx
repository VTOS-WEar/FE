import Header from "./Header";
import { Footer } from "./Footer";
import { Navbar } from "./layout/Navbar";
// NavbarGuest is Header with isLoggedIn=false (default)
export const NavbarGuest = (): JSX.Element => {
  return <Header isLoggedIn={false} />;
};
export { Footer, Navbar };
