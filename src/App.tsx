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
import { TwoFactorSetup } from "./screens/TwoFactorSetup/TwoFactorSetup";
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
import SchoolProductionOrderDetail from "./screens/SchoolProductionOrders/SchoolProductionOrderDetail";
import SchoolProductionOrdersLayout from "./screens/SchoolProductionOrders/SchoolProductionOrdersLayout";
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
import { AdminWithdrawals } from "./screens/AdminWithdrawals/AdminWithdrawals";
import { AdminMoneyDistribution } from "./screens/AdminMoneyDistribution/AdminMoneyDistribution";
import { ContactPartnership } from "./screens/ContactPartnership";
import { AdminAccountRequests } from "./screens/AdminAccountRequests";
import AdminTransactions from "./screens/AdminTransactions/AdminTransactions";
import AdminComplaints from "./screens/AdminComplaints/AdminComplaints";
import { ProviderProfile } from "./screens/ProviderProfile/ProviderProfile";

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
    element: <RoleGuard allowedRoles={[]} allowGuest><RoleSelect /></RoleGuard>,
  },
  {
    path: "/signup/parent",
    element: <RoleGuard allowedRoles={[]} allowGuest><SignUp roleName="Parent" /></RoleGuard>,
  },
  {
    path: "/signup/school",
    element: <Navigate to="/contact-partnership" replace />,
  },
  {
    path: "/signup/provider",
    element: <Navigate to="/contact-partnership" replace />,
  },
  {
    path: "/contact-partnership",
    element: <RoleGuard allowedRoles={[]} allowGuest><ContactPartnership /></RoleGuard>,
  },
  {
    path: "/fillphonenumber",
    element: <FillInformation />,
  },
  {
    path: "/2fa-setup",
    element: <TwoFactorSetup />,
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
    element: <RoleGuard allowedRoles={["Parent"]} allowGuest={true}><Homepage /></RoleGuard>,
  },
  {
    path: "/parentprofile",
    element: <RoleGuard allowedRoles={["Parent"]}><ParentProfile /></RoleGuard>,
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
    element: <RoleGuard allowedRoles={[]} allowGuest><VerifyOTP /></RoleGuard>,
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
    element: <RoleGuard allowedRoles={["School"]}><SchoolProductionOrdersLayout /></RoleGuard>,
    children: [
      { index: true, element: <SchoolProductionOrders /> },
      { path: ":batchId", element: <SchoolProductionOrderDetail /> },
    ],
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
  {
    path: "/provider/profile",
    element: <RoleGuard allowedRoles={["Provider"]}><ProviderProfile /></RoleGuard>,
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
    path: "/admin/withdrawals",
    element: <RoleGuard allowedRoles={["Admin"]}><AdminWithdrawals /></RoleGuard>,
  },
  {
    path: "/admin/money",
    element: <RoleGuard allowedRoles={["Admin"]}><AdminMoneyDistribution /></RoleGuard>,
  },
  {
    path: "/admin/account-requests",
    element: <RoleGuard allowedRoles={["Admin"]}><AdminAccountRequests /></RoleGuard>,
  },
  {
    path: "/admin/transactions",
    element: <RoleGuard allowedRoles={["Admin"]}><AdminTransactions /></RoleGuard>,
  },
  {
    path: "/admin/complaints",
    element: <RoleGuard allowedRoles={["Admin"]}><AdminComplaints /></RoleGuard>,
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
  { path: "/forgot-password", element: <RoleGuard allowedRoles={[]} allowGuest><ForgotPassword /></RoleGuard> },
  { path: "/forgot-password/sent", element: <RoleGuard allowedRoles={[]} allowGuest><ForgotPasswordSent /></RoleGuard> },
  { path: "/reset-password", element: <RoleGuard allowedRoles={[]} allowGuest><ResetPassword /></RoleGuard> },
  // All screens below manage their own layout (GuestLayout internally).
  // DO NOT wrap in SiteLayout — that would add a second navbar on top.
  { path: "/signin", element: <RoleGuard allowedRoles={[]} allowGuest><SignIn /></RoleGuard> },
  { path: "/schools", element: <RoleGuard allowedRoles={["Parent"]} allowGuest><SchoolList /></RoleGuard> },
  { path: "/schools/:id", element: <RoleGuard allowedRoles={["Parent"]} allowGuest><SchoolDetail /></RoleGuard> },
  { path: "/campaigns/:campaignId", element: <RoleGuard allowedRoles={["Parent"]} allowGuest><PublicCampaignDetail /></RoleGuard> },
  { path: "/outfits/:id", element: <RoleGuard allowedRoles={["Parent"]} allowGuest><OutfitDetail /></RoleGuard> },
  { path: "/cart", element: <RoleGuard allowedRoles={["Parent"]}><Cart /></RoleGuard> },
  { path: "/payment/success", element: <RoleGuard allowedRoles={["Parent"]} allowGuest><PaymentSuccess /></RoleGuard> },
  { path: "/payment/cancel", element: <RoleGuard allowedRoles={["Parent"]} allowGuest><PaymentCancel /></RoleGuard> },
  { path: "/products", element: <RoleGuard allowedRoles={["Parent"]} allowGuest><ProductList /></RoleGuard> },
  { path: "/products/:id", element: <RoleGuard allowedRoles={["Parent"]} allowGuest><ProductDetail /></RoleGuard> },
]);
import { GoogleOAuthProvider } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = "749245119490-h5bee9k35vijgfl6vjfbkaut0qpmpit9.apps.googleusercontent.com";

export const App = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <CartProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </CartProvider>
    </GoogleOAuthProvider>
  );
};
