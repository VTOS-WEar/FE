import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { AccountSecurity } from "./screens/AccountSecurity";
import { AccountSetting } from "./screens/AccountSetting";
import { FillInformation } from "./screens/FillInformation";
import { FindSchool } from "./screens/FindSchool";
import { Homepage } from "./screens/Homepage";
import { MyProfile } from "./screens/MyProfile";
import { OrderManagement } from "./screens/OrderManagement";
import { SignIn } from "./screens/SignIn";
import { SignUp } from "./screens/SignUp";
import { TryOnHistory } from "./screens/TryOnHistory";
import { SiteLayout } from "./layouts/SiteLayout";
import { SchoolList } from "./screens/SchoolList";
import { ProductList } from "./screens/ProductList";
import { ProductDetail } from "./screens/ProductDetail";
import { VerifyOTP } from "./screens/OtpField";

const router = createBrowserRouter([
  {
    path: "/*",
    element: <SignUp />,
  },
  {
    path: "/signup",
    element: <SignUp />,
  },
  {
    path: "/fillinformation",
    element: <FillInformation />,
  },
  {
    path: "/signin",
    element: <SignIn />,
  },
  {
    path: "/accountsecurity",
    element: <AccountSecurity />,
  },
  {
    path: "/tryonhistory",
    element: <TryOnHistory />,
  },
  {
    path: "/myprofile",
    element: <MyProfile />,
  },
  {
    path: "/findschool",
    element: <FindSchool />,
  },
  {
    path: "/accountsetting",
    element: <AccountSetting />,
  },
  {
    path: "/homepage",
    element: <Homepage />,
  },
  {
    path: "/verify-otp",
    element: <VerifyOTP />,
  },
  {
    element: <SiteLayout isLoggedIn={false} />,
    children: [
      {
        path: "/signup",
        element: <SignUp />,
      },
      {
        path: "/signin",
        element: <SignIn />,
      },
      {
        path: "/schools",
        element: <SchoolList />,
      },
      {
        path: "/products",
        element: <ProductList />,
      },
      {
        path: "/products/:id",
        element: <ProductDetail />,
      },
      {
        path: "/verify-otp",
        element: <VerifyOTP />,
      }
      // Commented out until components are created
      // {
      //   path: "/fillinformation",
      //   element: <FillInformation />,
      // },
      // {
      //   path: "/accountsecurity",
      //   element: <AccountSecurity />,
      // },
      // {
      //   path: "/tryonhistory",
      //   element: <TryOnHistory />,
      // },
      // {
      //   path: "/myprofile",
      //   element: <MyProfile />,
      // },
      // {
      //   path: "/findschool",
      //   element: <FindSchool />,
      // },
      // {
      //   path: "/accountsetting",
      //   element: <AccountSetting />,
      // },
      // {
      //   path: "/ordermanagement",
      //   element: <OrderManagement />,
      // },
    ],
  },
]);

export const App = () => {
  return <RouterProvider router={router} />;
};
