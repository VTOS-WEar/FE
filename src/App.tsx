import { GoogleOAuthProvider } from "@react-oauth/google";
import { AnimatePresence, motion } from "framer-motion";
import { lazy, Suspense, type ComponentType, useEffect, useLayoutEffect, useRef, useState } from "react";
import { RouterProvider, createBrowserRouter, Navigate, Outlet, useLocation } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { RoleGuard } from "./components/guards/RoleGuard";
import { ToastProvider } from "./contexts/ToastContext";
import { CartProvider } from "./contexts/CartContext";
import vtosLogoUrl from "../public/imgs/vtoslogo.png";

function lazyDefault<T extends ComponentType<any> = ComponentType<any>>(loader: () => Promise<{ default: T }>) {
  return lazy(loader);
}

function lazyNamed<T extends ComponentType<any> = ComponentType<any>>(loader: () => Promise<any>, exportName: string) {
  return lazy(async () => ({ default: (await loader())[exportName] as T }));
}

const AccountSecurity = lazyNamed(() => import("./screens/AccountSecurity"), "AccountSecurity");
const AccountSetting = lazyNamed(() => import("./screens/AccountSetting"), "AccountSetting");
const FillInformation = lazyNamed(() => import("./screens/FillInformation"), "FillInformation");
const Homepage = lazyNamed(() => import("./screens/Homepage"), "Homepage");
const MyProfile = lazyNamed(() => import("./screens/MyProfile"), "MyProfile");
const SignIn = lazyNamed(() => import("./screens/SignIn"), "SignIn");
const TwoFactorSetup = lazyNamed(() => import("./screens/TwoFactorSetup/TwoFactorSetup"), "TwoFactorSetup");
const SignUp = lazyNamed(() => import("./screens/SignUp"), "SignUp");
const RoleSelect = lazyNamed(() => import("./screens/SignUp"), "RoleSelect");
const TryOnHistory = lazyNamed(() => import("./screens/TryOnHistory"), "TryOnHistory");
const SchoolList = lazyNamed(() => import("./screens/SchoolList"), "SchoolList");
const ProductList = lazyNamed(() => import("./screens/ProductList"), "ProductList");
const ProductDetail = lazyNamed(() => import("./screens/ProductDetail"), "ProductDetail");
const SchoolDetail = lazyNamed(() => import("./screens/SchoolDetail/SchoolDetail"), "SchoolDetail");
const OutfitDetail = lazyNamed(() => import("./screens/OutfitDetail/OutfitDetail"), "OutfitDetail");
const Cart = lazyNamed(() => import("./screens/Cart/Cart"), "Cart");
const PaymentSuccess = lazyNamed(() => import("./screens/Payment/PaymentSuccess"), "PaymentSuccess");
const PaymentCancel = lazyNamed(() => import("./screens/Payment/PaymentCancel"), "PaymentCancel");
const VerifyOTP = lazyNamed(() => import("./screens/OtpField"), "VerifyOTP");
const ForgotPassword = lazyNamed(() => import("./screens/ForgotPassword/ForgotPassword"), "ForgotPassword");
const ForgotPasswordSent = lazyNamed(() => import("./screens/ForgotPasswordSent/ForgotPasswordSent"), "ForgotPasswordSent");
const ResetPassword = lazyNamed(() => import("./screens/ResetPassword/ResetPassword"), "ResetPassword");
const ImportData = lazyNamed(() => import("./screens/ImportData"), "ImportData");
const ConfirmSave = lazyNamed(() => import("./screens/ConfirmSave"), "ConfirmSave");
const ConfirmReimport = lazyNamed(() => import("./screens/ConfirmReimport"), "ConfirmReimport");
const CheckAndPreview = lazyNamed(() => import("./screens/CheckAndPreview"), "CheckAndPreview");
const SchoolClassDetail = lazyNamed(() => import("./screens/ClassDirectory"), "SchoolClassDetail");
const SchoolClassDirectory = lazyNamed(() => import("./screens/ClassDirectory"), "SchoolClassDirectory");
const TeacherClassDetail = lazyNamed(() => import("./screens/ClassDirectory"), "TeacherClassDetail");
const TeacherClasses = lazyNamed(() => import("./screens/ClassDirectory"), "TeacherClasses");
const SchoolProfile = lazyNamed(() => import("./screens/SchoolProfile"), "SchoolProfile");
const UniformManagement = lazyNamed(() => import("./screens/UniformManagement/UniformManagement"), "UniformManagement");
const SemesterPublicationDetail = lazyNamed(() => import("./screens/SemesterPublications"), "SemesterPublicationDetail");
const SemesterPublicationList = lazyNamed(() => import("./screens/SemesterPublications"), "SemesterPublicationList");
const SemesterPublicationWorkspace = lazyNamed(() => import("./screens/SemesterPublications"), "SemesterPublicationWorkspace");
const SchoolDashboard = lazyNamed(() => import("./screens/SchoolDashboard/SchoolDashboard"), "SchoolDashboard");
const ProviderDashboard = lazyNamed(() => import("./screens/ProviderDashboard/ProviderDashboard"), "ProviderDashboard");
const SchoolContracts = lazyNamed(() => import("./screens/SchoolContracts/SchoolContracts"), "SchoolContracts");
const ProviderContracts = lazyNamed(() => import("./screens/ProviderContracts/ProviderContracts"), "ProviderContracts");
const ProviderCatalogManagement = lazyNamed(() => import("./screens/ProviderCatalog/ProviderCatalogManagement"), "ProviderCatalogManagement");
const ContractPreview = lazyNamed(() => import("./screens/ContractPreview/ContractPreview"), "ContractPreview");
const ProviderComplaints = lazyNamed(() => import("./screens/ProviderComplaints/ProviderComplaints"), "ProviderComplaints");
const ParentProfile = lazyNamed(() => import("./screens/ParentProfile/ParentProfile"), "ParentProfile");
const AccountTab = lazyNamed(() => import("./screens/ParentProfile/tabs/AccountTab"), "AccountTab");
const AddressBookTab = lazyNamed(() => import("./screens/ParentProfile/tabs/AddressBookTab"), "AddressBookTab");
const StudentsTab = lazyNamed(() => import("./screens/ParentProfile/tabs/StudentsTab"), "StudentsTab");
const OrdersTab = lazyNamed(() => import("./screens/ParentProfile/tabs/OrdersTab"), "OrdersTab");
const WalletTab = lazyNamed(() => import("./screens/ParentProfile/tabs/WalletTab"), "WalletTab");
const HistoryTab = lazyNamed(() => import("./screens/ParentProfile/tabs/HistoryTab"), "HistoryTab");
const ReviewsTab = lazyNamed(() => import("./screens/ParentProfile/tabs/ReviewsTab"), "ReviewsTab");
const SettingsTab = lazyNamed(() => import("./screens/ParentProfile/tabs/SettingsTab"), "SettingsTab");
const BodygramHistoryTab = lazyNamed(() => import("./screens/ParentProfile/tabs/BodygramHistoryTab"), "BodygramHistoryTab");
const FeedbackPage = lazyNamed(() => import("./screens/ParentProfile/pages/FeedbackPage"), "FeedbackPage");
const OrderDetailPage = lazyNamed(() => import("./screens/ParentProfile/pages/OrderDetailPage"), "OrderDetailPage");
const BodygramScanComparePage = lazyNamed(() => import("./screens/ParentProfile/pages/BodygramScanComparePage"), "BodygramScanComparePage");
const ProviderRevenue = lazyDefault(() => import("./screens/ProviderRevenue/ProviderRevenue"));
const ProviderWallet = lazyDefault(() => import("./screens/ProviderWallet/ProviderWallet"));
const AdminDashboard = lazyNamed(() => import("./screens/AdminDashboard/AdminDashboard"), "AdminDashboard");
const AdminUsers = lazyNamed(() => import("./screens/AdminUsers/AdminUsers"), "AdminUsers");
const AdminWithdrawals = lazyNamed(() => import("./screens/AdminWithdrawals/AdminWithdrawals"), "AdminWithdrawals");
const ContactPartnership = lazyNamed(() => import("./screens/ContactPartnership"), "ContactPartnership");
const CookiesPolicy = lazyNamed(() => import("./screens/CookiesPolicy"), "CookiesPolicy");
const AdminAccountRequests = lazyNamed(() => import("./screens/AdminAccountRequests"), "AdminAccountRequests");
const AdminTransactions = lazyDefault(() => import("./screens/AdminTransactions/AdminTransactions"));
const AdminComplaints = lazyDefault(() => import("./screens/AdminComplaints/AdminComplaints"));
const AdminSemesterMonitor = lazyNamed(() => import("./screens/AdminSemesterMonitor"), "AdminSemesterMonitor");
const AdminCategories = lazyNamed(() => import("./screens/AdminCategories"), "AdminCategories");
const AdminAccountSettings = lazyNamed(() => import("./screens/AdminProfile/AdminAccountSettings"), "AdminAccountSettings");
const ProviderProfile = lazyNamed(() => import("./screens/ProviderProfile/ProviderProfile"), "ProviderProfile");
const ProviderAccountSettings = lazyNamed(() => import("./screens/ProviderProfile/ProviderAccountSettings"), "ProviderAccountSettings");
const SchoolAccountSettings = lazyNamed(() => import("./screens/SchoolProfile/SchoolAccountSettings"), "SchoolAccountSettings");
const HowItWorks = lazyNamed(() => import("./screens/HowItWorks/HowItWorks"), "HowItWorks");
const SearchPage = lazyNamed(() => import("./screens/Search/SearchPage"), "SearchPage");
const LegalNotice = lazyNamed(() => import("./screens/LegalNotice"), "LegalNotice");
const BodygramScannerPage = lazyNamed(() => import("./screens/BodygramScanner/BodygramScannerPage"), "BodygramScannerPage");
const BodygramScanDetailPage = lazyNamed(() => import("./screens/ParentProfile/pages/BodygramScanDetailPage"), "BodygramScanDetailPage");
const SemesterCatalog = lazyNamed(() => import("./screens/SemesterCatalog/SemesterCatalog"), "SemesterCatalog");
const MyOrders = lazyNamed(() => import("./screens/DirectOrders/MyOrders"), "MyOrders");
const MyOrderDetail = lazyNamed(() => import("./screens/DirectOrders/MyOrderDetail"), "MyOrderDetail");
const ProviderOrders = lazyNamed(() => import("./screens/ProviderOrders/ProviderOrders"), "ProviderOrders");
const ProviderOrderDetail = lazyNamed(() => import("./screens/ProviderOrders/ProviderOrderDetail"), "ProviderOrderDetail");
const ProviderRatings = lazyNamed(() => import("./screens/ProviderRatings/ProviderRatings"), "ProviderRatings");
const SchoolTeacherReports = lazyNamed(() => import("./screens/SchoolTeacherReports"), "SchoolTeacherReports");
const SubmitTeacherReportPage = lazyNamed(() => import("./screens/TeacherWorkspace"), "SubmitTeacherReportPage");
const TeacherAccount = lazyNamed(() => import("./screens/TeacherWorkspace"), "TeacherAccount");
const TeacherDashboard = lazyNamed(() => import("./screens/TeacherWorkspace"), "TeacherDashboard");
const TeacherMessages = lazyNamed(() => import("./screens/TeacherWorkspace"), "TeacherMessages");
const TeacherReminders = lazyNamed(() => import("./screens/TeacherWorkspace"), "TeacherReminders");
const TeacherReports = lazyNamed(() => import("./screens/TeacherWorkspace"), "TeacherReports");
const SupportTicketsPage = lazyNamed(() => import("./screens/SupportTickets"), "SupportTicketsPage");
const ParentClassGroupChatPage = lazyNamed(() => import("./screens/ClassGroupChat"), "ParentClassGroupChatPage");

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

function RouteSuspenseFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="relative flex h-14 w-14 items-center justify-center">
          <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-violet-100 border-t-violet-600 border-r-amber-300" />
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-soft-sm">
            <img src={vtosLogoUrl} alt="VTOS" className="h-6 w-6 object-contain" />
          </div>
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">loading</p>
      </div>
    </div>
  );
}

function RouteTransitionLayout() {
  const location = useLocation();
  const currentLocationKey = `${location.pathname}${location.search}`;
  const roleWorkspaceClass = location.pathname.startsWith("/school/")
    ? "school-workspace"
    : location.pathname.startsWith("/provider/")
      ? "provider-workspace"
      : location.pathname.startsWith("/admin/")
        ? "admin-workspace"
        : location.pathname.startsWith("/teacher/")
          ? "teacher-workspace"
          : "";
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
    <div className={`relative min-h-screen ${roleWorkspaceClass}`}>
      <Suspense fallback={<RouteSuspenseFallback />}>
        <Outlet />
      </Suspense>

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
    path: "/cookies-policy",
    element: <RoleGuard allowedRoles={[]} allowGuest><CookiesPolicy /></RoleGuard>,
  },
  {
    path: "/legal-notice",
    element: <RoleGuard allowedRoles={[]} allowGuest><LegalNotice /></RoleGuard>,
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
    element: <RoleGuard allowedRoles={["HomeroomTeacher"]}><Navigate to="/teacher/account-settings" replace /></RoleGuard>,
  },
  {
    path: "/teacher/account-settings",
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
    path: "/provider/catalog",
    element: <RoleGuard allowedRoles={["Provider"]}><ProviderCatalogManagement /></RoleGuard>,
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
