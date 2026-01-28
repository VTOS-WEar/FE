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
