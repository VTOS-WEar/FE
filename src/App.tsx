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
import { SchoolDashboard } from "./screens/SchoolDashboard/SchoolDashboard";
import { RoleGuard } from "./components/guards/RoleGuard";

/** Smart root redirect: School→dashboard, others→homepage */
function RootRedirect() {
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (raw) {
        try {
            const user = JSON.parse(raw);
            if (user.role === "School") return <Navigate to="/school/dashboard" replace />;
        } catch { /* ignore */ }
    }
    return <Navigate to="/homepage" replace />;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootRedirect />,
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
    element: <RoleGuard allowedRoles={["Parent"]} allowGuest={true} redirectTo="/school/dashboard"><Homepage /></RoleGuard>,
  },
  {
    path: "/verify-otp",
    element: <VerifyOTP />,
  },
  {
    path: "/school/students/import/confirm-save",
    element: <RoleGuard allowedRoles={["School"]}><ConfirmSave /></RoleGuard>,
  },
  {
    path: "/school/students/import/confirm-reimport",
    element: <RoleGuard allowedRoles={["School"]}><ConfirmReimport /></RoleGuard>,
  },
  {
    path: "/school/students/import/check-preview",
    element: <RoleGuard allowedRoles={["School"]}><CheckAndPreview /></RoleGuard>,
  },
  {
    path: "/school/students",
    element: <RoleGuard allowedRoles={["School"]}><StudentList /></RoleGuard>,
  },
  {
    path: "/school/students/import",
    element: <RoleGuard allowedRoles={["School"]}><ImportData /></RoleGuard>,
  }
  ,
  {
    path: "/school/orders",
    element: <RoleGuard allowedRoles={["School"]}><OrderManagement /></RoleGuard>,
  }
  ,
  {
    path: "/school/dashboard",
    element: <RoleGuard allowedRoles={["School"]}><SchoolDashboard /></RoleGuard>,
  },
  {
    path: "/school/profile",
    element: <RoleGuard allowedRoles={["School"]}><SchoolProfile /></RoleGuard>,
  },
  {
    path: "/school/uniforms",
    element: <RoleGuard allowedRoles={["School"]}><UniformManagement /></RoleGuard>,
  },
  {
    path: "/school/campaigns",
    element: <RoleGuard allowedRoles={["School"]}><CampaignList /></RoleGuard>,
  },
  {
    path: "/school/campaigns/new",
    element: <RoleGuard allowedRoles={["School"]}><CampaignManagement /></RoleGuard>,
  },
  {
    path: "/school/campaigns/:id",
    element: <RoleGuard allowedRoles={["School"]}><CampaignDetail /></RoleGuard>,
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
