import { RouterProvider, createBrowserRouter, Navigate } from "react-router-dom";
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
import { ForgotPassword } from "./screens/ForgotPassword/ForgotPassword";
import { ForgotPasswordSent } from "./screens/ForgotPasswordSent/ForgotPasswordSent";
import { ResetPassword } from "./screens/ResetPassword/ResetPassword";
import { StudentList } from "./screens/StudentList";
import { ImportData } from "./screens/ImportData";
import { ConfirmSave } from "./screens/ConfirmSave";
import { ConfirmReimport } from "./screens/ConfirmReimport";
import { CheckAndPreview } from "./screens/CheckAndPreview";
import { SchoolProfile } from "./screens/SchoolProfile";
import { UniformManagement } from "./screens/UniformManagement/UniformManagement";
import { CampaignList } from "./screens/CampaignManagement/CampaignList";
import { CampaignManagement } from "./screens/CampaignManagement/CampaignManagement";
import { CampaignDetail } from "./screens/CampaignManagement/CampaignDetail";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/homepage" replace />,
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
    path: "/school/students/import/confirm-save",
    element: <ConfirmSave />,
  },
  {
    path: "/school/students/import/confirm-reimport",
    element: <ConfirmReimport />,
  },
  {
    path: "/school/students/import/check-preview",
    element: <CheckAndPreview />,
  },
  {
    path: "/school/students",
    element: <StudentList />,
  },
  {
    path: "/school/students/import",
    element: <ImportData />,
  }
  ,
  {
    path: "/school/orders",
    element: <OrderManagement />,
  }
  ,
  {
    path: "/school/profile",
    element: <SchoolProfile />,
  },
  {
    path: "/school/uniforms",
    element: <UniformManagement />,
  },
  {
    path: "/school/campaigns",
    element: <CampaignList />,
  },
  {
    path: "/school/campaigns/new",
    element: <CampaignManagement />,
  },
  {
    path: "/school/campaigns/:id",
    element: <CampaignDetail />,
  },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/forgot-password/sent", element: <ForgotPasswordSent /> },
  { path: "/reset-password", element: <ResetPassword /> },
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
