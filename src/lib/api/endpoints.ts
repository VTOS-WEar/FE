export const endpoints = {
    auth: {
        login: "/api/Auth/login",
        verifyEmail: "/api/Auth/verify-email",
        resendOtp: "/api/Auth/resend-otp",
        register: "/api/Auth/register",
        forgotPassword: "/api/Auth/forgot-password",
        resetPassword: "/api/Auth/reset-password",
        changePasswordTeRequest: "/api/Auth/change-password/request-otp",
        changePassword: "/api/Auth/change-password",
        verifyPhone: "/api/Auth/verify-phone",
        verify2fa: "/api/Auth/verify-2fa",
        setup2fa: "/api/Auth/2fa/setup",
        confirm2fa: "/api/Auth/2fa/confirm",
        disable2fa: "/api/Auth/2fa/disable",
        googleLogin: "/api/Auth/google-login",
    },
    admin: {
        users: "/api/admin/users",
        feedbacks: "/api/admin/feedbacks",
    },
    public: {
        schools: "/api/public/schools",
        categories: "/api/public/categories",
        outfits: "/api/public/outfits",
        search: "/api/public/search",
        uniformWarehouse: "/api/public/uniform-warehouse",
        semesterCatalog: "/api/public/schools", // append /{schoolId}/semester-catalog
        publicationOutfitProviders: "/api/public/semester-publications", // append /{publicationId}/outfits/{outfitId}/providers
        providerProfile: "/api/public/providers", // append /{providerId}/profile
        providerRatings: "/api/public/providers", // append /{providerId}/ratings
        providerRanking: "/api/public/schools", // append /{schoolId}/provider-ranking
    },
    tryOn: {
        request: "/api/tryOn/request",
        history: "/api/tryon/history",
    },
    chat: {
        proposal: "/api/chat/messages/proposal",
        acceptProposal: "/api/chat/proposals", // append /{messageId}/accept
    },
    schools: {
        me: "/api/schools/me",
        logo: "/api/schools/me/logo",
        students: "/api/schools/me/students",
        classes: "/api/schools/me/classes",
        importTemplate: "/api/schools/me/students/import/template",
        importStudents: "/api/schools/me/students/import",
        importHistory: "/api/schools/me/students/import/history",
        importStatus: "/api/schools/me/students/import/status",
        grades: "/api/schools/me/students/grades",
        outfits: "/api/schools/me/outfits",
        outfitImageUpload: "/api/schools/me/outfits/upload-image",
        semesterPublications: "/api/schools/me/semester-publications",
        providers: "/api/schools/me/providers",
        outfitVariants: "/api/schools/me/outfits", // append /{outfitId}/variants at call time
    },
    users: {
        me: "/api/users/me",
        profile: "/api/users/me/profile",
        avatar: "/api/users/me/avatar",
        addresses: "/api/users/me/addresses",
        bankAccounts: "/api/users/me/bank-accounts",
        children: "/api/users/me/children",
        findChildren: "/api/users/me/find-children",
    },
    children: {
        list: "/api/children",
        detail: "/api/children", // append /{id} at call time
        update: "/api/children",
        avatar: "/api/children", // append /{id}/avatar at call time
    },
    bodygram: {
        scanTokens: "/api/bodygram/scan-tokens",
        complete: "/api/bodygram/scans/complete",
        status: "/api/bodygram/scans/status",
        childScans: "/api/bodygram/children",
        records: "/api/bodygram/records",
    },
    orders: {
        checkout: "/api/orders/checkout",
        cancel: "/api/orders", // append /{orderId}/cancel at call time
        retryPayment: "/api/orders", // append /{orderId}/retry-payment at call time
        cancelTransaction: "/api/orders", // append /{orderId}/cancel-transaction at call time
        direct: "/api/orders/direct",
        myDirectOrders: "/api/orders/my-orders",
    },
    providers: {
        me: "/api/providers/me",
        contracts: "/api/providers/me/contracts",
        directOrders: "/api/providers/me/orders",
        directOrderStats: "/api/providers/me/order-stats",
    },
    teacher: {
        dashboard: "/api/teacher/dashboard",
        classes: "/api/teacher/classes",
        reports: "/api/teacher/reports",
        reminders: "/api/teacher/reminders",
    },
    schoolManager: {
        teacherReports: "/api/schools/me/teacher-reports",
    },
    payments: {
        payOrder: "/api/payments/orders", // append /{orderId}/pay
        parentHistory: "/api/payments/parent/history",
        parentWallet: "/api/payments/parent/wallet",
        parentWalletTransactions: "/api/payments/parent/wallet/transactions",
        parentWalletWithdrawals: "/api/payments/parent/wallet/withdrawals",
        providerRevenue: "/api/payments/provider/revenue",
        providerPayments: "/api/payments/provider/payments",
        providerInvoice: "/api/payments/provider/orders", // append /{orderId}/invoice
        providerWallet: "/api/payments/provider/wallet",
        providerWalletTransactions: "/api/payments/provider/wallet/transactions",
        providerWalletBankInfo: "/api/payments/provider/wallet/bank-info",
    },
    notifications: {
        list: "/api/notifications",
        unreadCount: "/api/notifications/unread-count",
        read: "/api/notifications", // append /{id}/read
        readAll: "/api/notifications/read-all",
        heartbeat: "/api/notifications/heartbeat",
    },
    feedbacks: {
        base: "/api/feedbacks",
        submitOrderItem: "/api/feedbacks/order-item",
    },
} as const;
