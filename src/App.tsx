import { RouterProvider, createBrowserRouter, Navigate } from "react-router-dom";
import { ToastProvider } from "./contexts/ToastContext";
import { CartProvider } from "./contexts/CartContext";
import { AccountSecurity } from "./screens/AccountSecurity";
import { AccountSetting } from "./screens/AccountSetting";
import { FillInformation } from "./screens/FillInformation";
import { Homepage } from "./screens/Homepage";
import { MyProfile } from "./screens/MyProfile";
import { OrderManagement } from "./screens/OrderManagement";
import { SignIn } from "./screens/SignIn";
import { SignUp, RoleSelect } from "./screens/SignUp";
import { TryOnHistory } from "./screens/TryOnHistory";
import { SchoolList } from "./screens/SchoolList";
import { ProductList } from "./screens/ProductList";
import { ProductDetail } from "./screens/ProductDetail";
import { SchoolDetail } from "./screens/SchoolDetail/SchoolDetail";
import { CampaignDetail as PublicCampaignDetail } from "./screens/CampaignDetail/CampaignDetail";
import { OutfitDetail } from "./screens/OutfitDetail/OutfitDetail";
import { Cart } from "./screens/Cart/Cart";
import { PaymentSuccess } from "./screens/Payment/PaymentSuccess";
import { PaymentCancel } from "./screens/Payment/PaymentCancel";
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
import { ProviderDashboard } from "./screens/ProviderDashboard/ProviderDashboard";
import { SchoolContracts } from "./screens/SchoolContracts/SchoolContracts";
import { ProviderContracts } from "./screens/ProviderContracts/ProviderContracts";
import { SchoolProductionOrders } from "./screens/SchoolProductionOrders/SchoolProductionOrders";
import { ProviderProductionOrders } from "./screens/ProviderProductionOrders/ProviderProductionOrders";
import { SchoolComplaints } from "./screens/SchoolComplaints/SchoolComplaints";
import { ProviderComplaints } from "./screens/ProviderComplaints/ProviderComplaints";
import { ParentProfile } from "./screens/ParentProfile/ParentProfile";
import { AccountTab } from "./screens/ParentProfile/tabs/AccountTab";
import { StudentsTab } from "./screens/ParentProfile/tabs/StudentsTab";
import { OrdersTab } from "./screens/ParentProfile/tabs/OrdersTab";
import { HistoryTab } from "./screens/ParentProfile/tabs/HistoryTab";
import { ReviewsTab } from "./screens/ParentProfile/tabs/ReviewsTab";
import { SettingsTab } from "./screens/ParentProfile/tabs/SettingsTab";
import SchoolWallet from "./screens/SchoolWallet/SchoolWallet";
import ProviderRevenue from "./screens/ProviderRevenue/ProviderRevenue";
import ProviderWallet from "./screens/ProviderWallet/ProviderWallet";
import { AdminDashboard } from "./screens/AdminDashboard/AdminDashboard";
import { AdminUsers } from "./screens/AdminUsers/AdminUsers";
import { AdminVerification } from "./screens/AdminVerification/AdminVerification";
import { AdminMoneyDistribution } from "./screens/AdminMoneyDistribution/AdminMoneyDistribution";

/** Smart root redirect: School→dashboard, others→homepage */
function RootRedirect() {
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (raw) {
        try {
            const user = JSON.parse(raw);
            if (user.role === "Admin") return <Navigate to="/admin/dashboard" replace />;
            if (user.role === "School") return <Navigate to="/school/dashboard" replace />;
            if (user.role === "Provider") return <Navigate to="/provider/dashboard" replace />;
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
    element: <RoleSelect />,
  },
  {
    path: "/signup/parent",
    element: <SignUp roleName="Parent" />,
  },
  {
    path: "/signup/school",
    element: <SignUp roleName="School" />,
  },
  {
    path: "/signup/provider",
    element: <SignUp roleName="Provider" />,
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
    path: "/provider/dashboard",
    element: <RoleGuard allowedRoles={["Provider"]}><ProviderDashboard /></RoleGuard>,
  },
  {
    path: "/provider/contracts",
    element: <RoleGuard allowedRoles={["Provider"]}><ProviderContracts /></RoleGuard>,
  },
  {
    path: "/school/contracts",
    element: <RoleGuard allowedRoles={["School"]}><SchoolContracts /></RoleGuard>,
  },
  {
    path: "/school/production-orders",
    element: <RoleGuard allowedRoles={["School"]}><SchoolProductionOrders /></RoleGuard>,
  },
  {
    path: "/provider/production-orders",
    element: <RoleGuard allowedRoles={["Provider"]}><ProviderProductionOrders /></RoleGuard>,
  },
  {
    path: "/school/complaints",
    element: <RoleGuard allowedRoles={["School"]}><SchoolComplaints /></RoleGuard>,
  },
  {
    path: "/provider/complaints",
    element: <RoleGuard allowedRoles={["Provider"]}><ProviderComplaints /></RoleGuard>,
  },
  {
    path: "/school/wallet",
    element: <RoleGuard allowedRoles={["School"]}><SchoolWallet /></RoleGuard>,
  },
  {
    path: "/provider/revenue",
    element: <RoleGuard allowedRoles={["Provider"]}><ProviderRevenue /></RoleGuard>,
  },
  {
    path: "/provider/wallet",
    element: <RoleGuard allowedRoles={["Provider"]}><ProviderWallet /></RoleGuard>,
  },
  // ── Admin routes ──
  {
    path: "/admin/dashboard",
    element: <RoleGuard allowedRoles={["Admin"]}><AdminDashboard /></RoleGuard>,
  },
  {
    path: "/admin/users",
    element: <RoleGuard allowedRoles={["Admin"]}><AdminUsers /></RoleGuard>,
  },
  {
    path: "/admin/verification",
    element: <RoleGuard allowedRoles={["Admin"]}><AdminVerification /></RoleGuard>,
  },
  {
    path: "/admin/money",
    element: <RoleGuard allowedRoles={["Admin"]}><AdminMoneyDistribution /></RoleGuard>,
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
  { path: "/payment/success", element: <PaymentSuccess /> },
  { path: "/payment/cancel", element: <PaymentCancel /> },
  { path: "/products", element: <ProductList /> },
  { path: "/products/:id", element: <ProductDetail /> },
]);

export const App = () => {
  return (
    <CartProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </CartProvider>
  );
};
