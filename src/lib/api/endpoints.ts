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

    },
    tryOn: {
        guest: "/api/tryOn/guest",
    },
    schools: {
        me: "/api/schools/me",
        logo: "/api/schools/me/logo",
        students: "/api/schools/me/students",
        importTemplate: "/api/schools/me/students/import/template",
        importStudents: "/api/schools/me/students/import",
        importHistory: "/api/schools/me/students/import/history",
        grades: "/api/schools/me/students/grades",
        outfits: "/api/schools/me/outfits",
        outfitImageUpload: "/api/schools/me/outfits/upload-image",
        campaigns: "/api/schools/me/campaigns",
        campaignProgress: "/api/schools/me/campaigns/{id}/progress",
        providers: "/api/schools/me/providers",
        outfitVariants: "/api/schools/me/outfits", // append /{outfitId}/variants at call time
        productionOrders: "/api/schools/me/production-orders",
        schoolOrders: "/api/schools/me/orders",
    },
    users: {
        me: "/api/users/me",
        profile: "/api/users/me/profile",
        children: "/api/users/me/children",
        findChildren: "/api/users/me/find-children",
    },
    orders: {
        checkout: "/api/orders/checkout",
        cancel: "/api/orders", // append /{orderId}/cancel at call time
    },
    providers: {
        me: "/api/providers/me",
        contracts: "/api/providers/me/contracts",
        productionOrders: "/api/providers/me/production-orders",
    },
    payments: {
        payOrder: "/api/payments/orders", // append /{orderId}/pay
        parentHistory: "/api/payments/parent/history",
        schoolWallet: "/api/payments/school/wallet",
        walletTransactions: "/api/payments/school/wallet/transactions",
        walletBankInfo: "/api/payments/school/wallet/bank-info",
        payProvider: "/api/payments/school/orders", // append /{orderId}/pay-provider
        refundOrder: "/api/payments/school/orders", // append /{orderId}/refund
        providerRevenue: "/api/payments/provider/revenue",
        providerPayments: "/api/payments/provider/payments",
        providerInvoice: "/api/payments/provider/orders", // append /{orderId}/invoice
        providerWallet: "/api/payments/provider/wallet",
        providerWalletTransactions: "/api/payments/provider/wallet/transactions",
        providerWalletBankInfo: "/api/payments/provider/wallet/bank-info",
    },
} as const;