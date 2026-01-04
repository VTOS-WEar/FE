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
    path: "/ordermanagement",
    element: <OrderManagement />,
  },
]);

export const App = () => {
  return <RouterProvider router={router} />;
};
