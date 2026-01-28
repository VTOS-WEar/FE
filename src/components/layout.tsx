import Header from "./Header";
import { Footer } from "./Footer";

// NavbarGuest is Header with isLoggedIn=false (default)
export const NavbarGuest = (): JSX.Element => {
  return <Header isLoggedIn={false} />;
};
export { Footer };
