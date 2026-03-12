import { RouterProvider, createBrowserRouter, Navigate } from "react-router-dom";
import { ToastProvider } from "./contexts/ToastContext";
import { AccountSecurity } from "./screens/AccountSecurity";
import { AccountSetting } from "./screens/AccountSetting";
import { FillInformation } from "./screens/FillInformation";
import { Homepage } from "./screens/Homepage";
import { MyProfile } from "./screens/MyProfile";
import { OrderManagement } from "./screens/OrderManagement";
import { SignIn } from "./screens/SignIn";
import { SignUp } from "./screens/SignUp";
import { TryOnHistory } from "./screens/TryOnHistory";
import { SchoolList } from "./screens/SchoolList";
import { ProductList } from "./screens/ProductList";
import { ProductDetail } from "./screens/ProductDetail";
import { SchoolDetail } from "./screens/SchoolDetail/SchoolDetail";
import { CampaignDetail as PublicCampaignDetail } from "./screens/CampaignDetail/CampaignDetail";
import { OutfitDetail } from "./screens/OutfitDetail/OutfitDetail";
import { Cart } from "./screens/Cart/Cart";
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
import { ParentProfile } from "./screens/ParentProfile/ParentProfile";
import { AccountTab } from "./screens/ParentProfile/tabs/AccountTab";
import { StudentsTab } from "./screens/ParentProfile/tabs/StudentsTab";
import { OrdersTab } from "./screens/ParentProfile/tabs/OrdersTab";
import { HistoryTab } from "./screens/ParentProfile/tabs/HistoryTab";
import { ReviewsTab } from "./screens/ParentProfile/tabs/ReviewsTab";
import { SettingsTab } from "./screens/ParentProfile/tabs/SettingsTab";

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
    path: "/fillphonenumber",
    element: <FillInformation />,
  },
  {
    path: "/fillinformation",
    element: <FillInformation />, // keep old path for backward compat
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
    path: "/parentprofile",
    element: <ParentProfile />,
    children: [
      { index: true, element: <Navigate to="account" replace /> },
      { path: "account",  element: <AccountTab /> },
      { path: "students", element: <StudentsTab /> },
      { path: "orders",   element: <OrdersTab /> },
      { path: "history",  element: <HistoryTab /> },
      { path: "reviews",  element: <ReviewsTab /> },
      { path: "settings", element: <SettingsTab /> },
    ],
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
  // All screens below manage their own layout (GuestLayout internally).
  // DO NOT wrap in SiteLayout — that would add a second navbar on top.
  { path: "/signin", element: <SignIn /> },
  { path: "/schools", element: <SchoolList /> },
  { path: "/schools/:id", element: <SchoolDetail /> },
  { path: "/campaigns/:campaignId", element: <PublicCampaignDetail /> },
  { path: "/outfits/:id", element: <OutfitDetail /> },
  { path: "/cart", element: <Cart /> },
  { path: "/products", element: <ProductList /> },
  { path: "/products/:id", element: <ProductDetail /> },
]);

export const App = () => {
  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  );
};
