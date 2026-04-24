import { RouterProvider, createBrowserRouter, Navigate, Outlet, useLocation } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ToastProvider } from "./contexts/ToastContext";
import { CartProvider } from "./contexts/CartContext";
import { AccountSecurity } from "./screens/AccountSecurity";
import { AccountSetting } from "./screens/AccountSetting";
import { FillInformation } from "./screens/FillInformation";
import { Homepage } from "./screens/Homepage";
import { MyProfile } from "./screens/MyProfile";
import { SignIn } from "./screens/SignIn";
import { TwoFactorSetup } from "./screens/TwoFactorSetup/TwoFactorSetup";
import { SignUp, RoleSelect } from "./screens/SignUp";
import { TryOnHistory } from "./screens/TryOnHistory";
import { SchoolList } from "./screens/SchoolList";
import { ProductList } from "./screens/ProductList";
import { ProductDetail } from "./screens/ProductDetail";
import { SchoolDetail } from "./screens/SchoolDetail/SchoolDetail";
import { OutfitDetail } from "./screens/OutfitDetail/OutfitDetail";
import { Cart } from "./screens/Cart/Cart";
import { PaymentSuccess } from "./screens/Payment/PaymentSuccess";
import { PaymentCancel } from "./screens/Payment/PaymentCancel";
import { VerifyOTP } from "./screens/OtpField";
import { ForgotPassword } from "./screens/ForgotPassword/ForgotPassword";
import { ForgotPasswordSent } from "./screens/ForgotPasswordSent/ForgotPasswordSent";
import { ResetPassword } from "./screens/ResetPassword/ResetPassword";
import { ImportData } from "./screens/ImportData";
import { ConfirmSave } from "./screens/ConfirmSave";
import { ConfirmReimport } from "./screens/ConfirmReimport";
import { CheckAndPreview } from "./screens/CheckAndPreview";
import {
  SchoolClassDetail,
  SchoolClassDirectory,
  TeacherClassDetail,
  TeacherClasses,
} from "./screens/ClassDirectory";
import { SchoolProfile } from "./screens/SchoolProfile";
import { UniformManagement } from "./screens/UniformManagement/UniformManagement";
import {
  SemesterPublicationDetail,
  SemesterPublicationList,
  SemesterPublicationWorkspace,
} from "./screens/SemesterPublications";
import { SchoolDashboard } from "./screens/SchoolDashboard/SchoolDashboard";
import { RoleGuard } from "./components/guards/RoleGuard";
import { ProviderDashboard } from "./screens/ProviderDashboard/ProviderDashboard";
import { SchoolContracts } from "./screens/SchoolContracts/SchoolContracts";
import { ProviderContracts } from "./screens/ProviderContracts/ProviderContracts";
import { ContractPreview } from "./screens/ContractPreview/ContractPreview";
import { ProviderComplaints } from "./screens/ProviderComplaints/ProviderComplaints";
import { ParentProfile } from "./screens/ParentProfile/ParentProfile";
import { AccountTab } from "./screens/ParentProfile/tabs/AccountTab";
import { AddressBookTab } from "./screens/ParentProfile/tabs/AddressBookTab";
import { StudentsTab } from "./screens/ParentProfile/tabs/StudentsTab";
import { OrdersTab } from "./screens/ParentProfile/tabs/OrdersTab";
import { WalletTab } from "./screens/ParentProfile/tabs/WalletTab";
import { HistoryTab } from "./screens/ParentProfile/tabs/HistoryTab";
import { ReviewsTab } from "./screens/ParentProfile/tabs/ReviewsTab";
import { SettingsTab } from "./screens/ParentProfile/tabs/SettingsTab";
import { BodygramHistoryTab } from "./screens/ParentProfile/tabs/BodygramHistoryTab";
import { FeedbackPage } from "./screens/ParentProfile/pages/FeedbackPage";
import { OrderDetailPage } from "./screens/ParentProfile/pages/OrderDetailPage";
import { BodygramScanComparePage } from "./screens/ParentProfile/pages/BodygramScanComparePage";
import ProviderRevenue from "./screens/ProviderRevenue/ProviderRevenue";
import ProviderWallet from "./screens/ProviderWallet/ProviderWallet";
import { AdminDashboard } from "./screens/AdminDashboard/AdminDashboard";
import { AdminUsers } from "./screens/AdminUsers/AdminUsers";
import { AdminWithdrawals } from "./screens/AdminWithdrawals/AdminWithdrawals";
import { ContactPartnership } from "./screens/ContactPartnership";
import { AdminAccountRequests } from "./screens/AdminAccountRequests";
import AdminTransactions from "./screens/AdminTransactions/AdminTransactions";
import AdminComplaints from "./screens/AdminComplaints/AdminComplaints";
import { AdminSemesterMonitor } from "./screens/AdminSemesterMonitor";
import { AdminCategories } from "./screens/AdminCategories";
import { AdminAccountSettings } from "./screens/AdminProfile/AdminAccountSettings";
import { ProviderProfile } from "./screens/ProviderProfile/ProviderProfile";
import { ProviderAccountSettings } from "./screens/ProviderProfile/ProviderAccountSettings";
import { SchoolAccountSettings } from "./screens/SchoolProfile/SchoolAccountSettings";
import { HowItWorks } from "./screens/HowItWorks/HowItWorks";
import { SearchPage } from "./screens/Search/SearchPage";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import vtosLogoUrl from "../public/imgs/vtoslogo.png";
import { BodygramScannerPage } from "./screens/BodygramScanner/BodygramScannerPage";
import { BodygramScanDetailPage } from "./screens/ParentProfile/pages/BodygramScanDetailPage";
import { SemesterCatalog } from "./screens/SemesterCatalog/SemesterCatalog";
import { MyOrders } from "./screens/DirectOrders/MyOrders";
import { MyOrderDetail } from "./screens/DirectOrders/MyOrderDetail";
import { ProviderOrders } from "./screens/ProviderOrders/ProviderOrders";
import { ProviderOrderDetail } from "./screens/ProviderOrders/ProviderOrderDetail";
import { ProviderRatings } from "./screens/ProviderRatings/ProviderRatings";
import { SchoolTeacherReports } from "./screens/SchoolTeacherReports";
import { SubmitTeacherReportPage, TeacherAccount, TeacherDashboard, TeacherMessages, TeacherReminders, TeacherReports } from "./screens/TeacherWorkspace";
import { SupportTicketsPage } from "./screens/SupportTickets";
import { ParentClassGroupChatPage } from "./screens/ClassGroupChat";

/** Smart root redirect: School→dashboard, others→homepage */
function RootRedirect() {
  const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
  if (raw) {
    try {
      const user = JSON.parse(raw);
      if (user.role === "Admin") return <Navigate to="/admin/dashboard" replace />;
      if (user.role === "School") return <Navigate to="/school/dashboard" replace />;
      if (user.role === "Provider") return <Navigate to="/provider/dashboard" replace />;
      if (user.role === "HomeroomTeacher") return <Navigate to="/teacher/dashboard" replace />;
    } catch { /* ignore */ }
  }
  return <Navigate to="/homepage" replace />;
}

function RouteTransitionLayout() {
  const location = useLocation();
  const currentLocationKey = `${location.pathname}${location.search}`;
  const previousLocationRef = useRef(currentLocationKey);
  const [showLoader, setShowLoader] = useState(false);

  useLayoutEffect(() => {
    if (currentLocationKey !== previousLocationRef.current) {
      previousLocationRef.current = currentLocationKey;
      setShowLoader(true);
    }
  }, [currentLocationKey]);

  useEffect(() => {
    if (!showLoader) return;
    const timeoutId = window.setTimeout(() => setShowLoader(false), 300);
    return () => window.clearTimeout(timeoutId);
  }, [showLoader]);

  return (
    <div className="relative min-h-screen">
      <Outlet />

      <AnimatePresence>
        {showLoader ? (
          <motion.div
            key="route-transition-loader"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/95"
            role="status"
            aria-live="polite"
            aria-label="loading"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="relative flex h-20 w-20 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-violet-100/70 blur-md" />
                <div className="absolute inset-1 animate-ping rounded-full border border-violet-200" />
                <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-violet-100 border-t-violet-600 border-r-amber-300" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white shadow-soft-md">
                  <img src={vtosLogoUrl} alt="VTOS" className="h-8 w-8 object-contain" />
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">loading</p>
                <div className="flex items-center gap-1" aria-hidden="true">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-500" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400 [animation-delay:120ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 [animation-delay:240ms]" />
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

const router = createBrowserRouter([{
  element: <RouteTransitionLayout />,
  children: [
  {
    path: "/",
    element: <RootRedirect />,
  },
  {
    // PREVIEW ONLY — remove after BE is connected
    path: "/contract-preview",
    element: <ContractPreview />,
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
    path: "/huong-dan-try-on",
    element: <RoleGuard allowedRoles={["Parent"]} allowGuest={true}><HowItWorks /></RoleGuard>,
  },
  {
    path: "/parentprofile",
    element: <RoleGuard allowedRoles={["Parent"]}><ParentProfile /></RoleGuard>,
    children: [
      { index: true, element: <Navigate to="account" replace /> },
      { path: "account", element: <AccountTab /> },
      { path: "address-book", element: <AddressBookTab /> },
      { path: "students", element: <StudentsTab /> },
      { path: "orders", element: <OrdersTab /> },
      { path: "wallet", element: <WalletTab /> },
      { path: "history", element: <HistoryTab /> },
      { path: "bodygram-history", element: <BodygramHistoryTab /> },
      { path: "reviews", element: <ReviewsTab /> },
      { path: "support", element: <SupportTicketsPage /> },
      { path: "settings", element: <SettingsTab /> },
      { path: "feedback", element: <FeedbackPage /> },
      { path: "orders/:orderId", element: <OrderDetailPage /> },
      { path: "bodygram-history/:childId/compare", element: <BodygramScanComparePage /> },
      { path: "bodygram-history/:childId/scans/:scanId", element: <BodygramScanDetailPage /> },
    ],
  },
  {
    path: "/children/:childId/scan",
    element: <RoleGuard allowedRoles={["Parent"]}><BodygramScannerPage /></RoleGuard>,
  },
  {
    path: "/class-chat",
    element: <RoleGuard allowedRoles={["Parent"]}><ParentClassGroupChatPage /></RoleGuard>,
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
    element: <RoleGuard allowedRoles={["School"]}><SchoolClassDirectory /></RoleGuard>,
  },
  {
    path: "/school/students/classes/:id",
    element: <RoleGuard allowedRoles={["School"]}><SchoolClassDetail /></RoleGuard>,
  },
  {
    path: "/school/students/import",
    element: <RoleGuard allowedRoles={["School"]}><ImportData /></RoleGuard>,
  }
  ,
  {
    path: "/school/orders",
    element: <RoleGuard allowedRoles={["School"]}><Navigate to="/school/dashboard" replace /></RoleGuard>,
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
    path: "/teacher/dashboard",
    element: <RoleGuard allowedRoles={["HomeroomTeacher"]}><TeacherDashboard /></RoleGuard>,
  },
  {
    path: "/teacher/classes",
    element: <RoleGuard allowedRoles={["HomeroomTeacher"]}><TeacherClasses /></RoleGuard>,
  },
  {
    path: "/teacher/classes/:id",
    element: <RoleGuard allowedRoles={["HomeroomTeacher"]}><TeacherClassDetail /></RoleGuard>,
  },
  {
    path: "/teacher/reports",
    element: <RoleGuard allowedRoles={["HomeroomTeacher"]}><TeacherReports /></RoleGuard>,
  },
  {
    path: "/teacher/reports/new",
    element: <RoleGuard allowedRoles={["HomeroomTeacher"]}><SubmitTeacherReportPage /></RoleGuard>,
  },
  {
    path: "/teacher/support",
    element: <RoleGuard allowedRoles={["HomeroomTeacher"]}><SupportTicketsPage /></RoleGuard>,
  },
  {
    path: "/teacher/messages",
    element: <RoleGuard allowedRoles={["HomeroomTeacher"]}><TeacherMessages /></RoleGuard>,
  },
  {
    path: "/teacher/reminders",
    element: <RoleGuard allowedRoles={["HomeroomTeacher"]}><TeacherReminders /></RoleGuard>,
  },
  {
    path: "/teacher/account",
    element: <RoleGuard allowedRoles={["HomeroomTeacher"]}><TeacherAccount /></RoleGuard>,
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
    path: "/provider/complaints",
    element: <RoleGuard allowedRoles={["Provider"]}><ProviderComplaints /></RoleGuard>,
  },
  {
    path: "/provider/support",
    element: <RoleGuard allowedRoles={["Provider"]}><SupportTicketsPage /></RoleGuard>,
  },
  {
    path: "/school/support",
    element: <RoleGuard allowedRoles={["School"]}><SupportTicketsPage /></RoleGuard>,
  },
  {
    path: "/school/teacher-reports",
    element: <RoleGuard allowedRoles={["School"]}><SchoolTeacherReports /></RoleGuard>,
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
  {
    path: "/provider/account-settings",
    element: <RoleGuard allowedRoles={["Provider"]}><ProviderAccountSettings /></RoleGuard>,
  },
  {
    path: "/school/account-settings",
    element: <RoleGuard allowedRoles={["School"]}><SchoolAccountSettings /></RoleGuard>,
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
    path: "/admin/semester-monitor",
    element: <RoleGuard allowedRoles={["Admin"]}><AdminSemesterMonitor /></RoleGuard>,
  },
  {
    path: "/admin/categories",
    element: <RoleGuard allowedRoles={["Admin"]}><AdminCategories /></RoleGuard>,
  },
  {
    path: "/admin/account-settings",
    element: <RoleGuard allowedRoles={["Admin"]}><AdminAccountSettings /></RoleGuard>,
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
    path: "/school/semester-publications",
    element: <RoleGuard allowedRoles={["School"]}><SemesterPublicationList /></RoleGuard>,
  },
  {
    path: "/school/semester-publications/new",
    element: <RoleGuard allowedRoles={["School"]}><SemesterPublicationWorkspace /></RoleGuard>,
  },
  {
    path: "/school/semester-publications/:id/edit",
    element: <RoleGuard allowedRoles={["School"]}><SemesterPublicationWorkspace /></RoleGuard>,
  },
  {
    path: "/school/semester-publications/:id",
    element: <RoleGuard allowedRoles={["School"]}><SemesterPublicationDetail /></RoleGuard>,
  },
  { path: "/forgot-password", element: <RoleGuard allowedRoles={[]} allowGuest><ForgotPassword /></RoleGuard> },
  { path: "/forgot-password/sent", element: <RoleGuard allowedRoles={[]} allowGuest><ForgotPasswordSent /></RoleGuard> },
  { path: "/reset-password", element: <RoleGuard allowedRoles={[]} allowGuest><ResetPassword /></RoleGuard> },
  // All screens below manage their own layout (GuestLayout internally).
  // DO NOT wrap in SiteLayout — that would add a second navbar on top.
  { path: "/signin", element: <RoleGuard allowedRoles={[]} allowGuest><SignIn /></RoleGuard> },
  { path: "/schools", element: <RoleGuard allowedRoles={["Parent"]} allowGuest><SchoolList /></RoleGuard> },
  { path: "/schools/:id", element: <RoleGuard allowedRoles={["Parent"]} allowGuest><SchoolDetail /></RoleGuard> },
  { path: "/schools/:id/catalog", element: <RoleGuard allowedRoles={["Parent"]} allowGuest><SemesterCatalog /></RoleGuard> },
  { path: "/providers/:id/ratings", element: <RoleGuard allowedRoles={["Parent"]} allowGuest><ProviderRatings /></RoleGuard> },
  { path: "/outfits/:id", element: <RoleGuard allowedRoles={["Parent"]} allowGuest><OutfitDetail /></RoleGuard> },
  { path: "/my-orders", element: <RoleGuard allowedRoles={["Parent"]}><MyOrders /></RoleGuard> },
  { path: "/my-orders/:id", element: <RoleGuard allowedRoles={["Parent"]}><MyOrderDetail /></RoleGuard> },
  { path: "/cart", element: <RoleGuard allowedRoles={["Parent"]}><Cart /></RoleGuard> },
  { path: "/payment/success", element: <RoleGuard allowedRoles={["Parent"]} allowGuest><PaymentSuccess /></RoleGuard> },
  { path: "/payment/cancel", element: <RoleGuard allowedRoles={["Parent"]} allowGuest><PaymentCancel /></RoleGuard> },
  { path: "/products", element: <RoleGuard allowedRoles={["Parent"]} allowGuest><ProductList /></RoleGuard> },
  { path: "/products/:id", element: <RoleGuard allowedRoles={["Parent"]} allowGuest><ProductDetail /></RoleGuard> },
  { path: "/search", element: <RoleGuard allowedRoles={["Parent"]} allowGuest><SearchPage /></RoleGuard> },
  { path: "/provider/orders", element: <RoleGuard allowedRoles={["Provider"]}><ProviderOrders /></RoleGuard> },
  { path: "/provider/orders/:id", element: <RoleGuard allowedRoles={["Provider"]}><ProviderOrderDetail /></RoleGuard> },
  // ── Catch-all: redirect unknown routes to homepage ──
  { path: "*", element: <RootRedirect /> },
  ],
}]);
import { GoogleOAuthProvider } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export const App = () => {
  const previousPathRef = useRef(`${router.state.location.pathname}${router.state.location.search}`);

  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const unsubscribe = router.subscribe((state) => {
      const currentPath = `${state.location.pathname}${state.location.search}`;
      if (currentPath !== previousPathRef.current) {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        previousPathRef.current = currentPath;
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <CartProvider>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </CartProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
};
