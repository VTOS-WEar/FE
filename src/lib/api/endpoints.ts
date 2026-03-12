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
    },
    users: {
        me: "/api/users/me",
        profile: "/api/users/me/profile",
        children: "/api/users/me/children",
        findChildren: "/api/users/me/find-children",
    },
    orders: {
        checkout: "/api/orders/checkout",
    },
} as const;